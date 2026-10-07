# Plan: Large diffs in one call (compact, then digest)

| Field | Value |
|---|---|
| Objective | Large diffs produce a commit message in one provider call by default, without map-reduce batching or approval prompts |
| Status | Reviewed and ready to execute |
| Version | 2026-10-05 (branch v6.4.1), reviewed |
| Created | 2026-10-05 |

## 1. Objective & Definition of Done
- Goal: Replace "split the diff into spans, summarize each, reduce, then generate" with a deterministic local shrink step that always ends in a single generation call.
- Done when:
  - For Pro users, any diff, including multi-MB ones, yields 1 generation call on the default path, with no modal approval. A provider input-limit rejection may trigger at most 2 more calls (3 attempts total, section 3.2), with no modal.
  - Non-Pro behaviour is unchanged: Tier 0 direct, otherwise the existing input-limit error (user decision, 2026-10-05).
  - Every changed file is still named in the prompt, even when its content is omitted.
  - Map-reduce runs only when the user enables an opt-in setting, capped at 4 calls, with one approval.
  - Existing generation tests pass; new tests cover each tier.
- Success measures: calls per large diff drops from `ceil(bytes/window)+reductions+1` to 1. Prompt stays under the budget rule in 3.2. The user sees a one-line notice stating what was condensed.
- Must not happen: silent loss of a file from the prompt; a diff over budget sent anyway; an exception on tiny-context models; regressions in the <budget direct path; new network calls before a decision is made.

## 2. Context & Constraints
Observed facts (from code, 2026-10-05):

| # | Finding | Source |
|---|---|---|
| F1 | Pipeline today: direct attempt, then `processLargeDiff` → `generateBudgeted`: plan spans, approval modal (5 calls, second modal if more), sequential analysis calls, reduction rounds (up to 32), final call. | `src/services/api/index.ts:947`, `budgetedGeneration.ts:81-248`, `generationAttempts.ts` |
| F2 | Planned calls = spans + reductions + 1. Spans are sized by `batchInputBudget`, and token counting is **UTF-8 bytes** for every provider except Copilot (`countTokensAsync`). Bytes over-count tokens ~3-4x, so known models get 3-4x more spans than needed. | `capabilities.ts:44-47`, `budgetedGeneration.ts:117` |
| F3 | Only 8 models have verified limits (`VERIFIED_LIMITS`). Others are `isUnknown` with a 4096 context, and the planner probes with 64 KB windows. Real limits arrive via `prepareCapabilities` → `discoverLargeModel`, which is **size-gated** (diff > 64 KB) and best-effort (5 s). Providers with discovery: anthropic, cohere, copilot, gemini, mistral, nvidia, openaiCompatible, openrouter, together. Others stay unknown. | `capabilities.ts:57-78`, `base.ts:71-86` |
| F4 | Each summary is capped at 768 output tokens, then re-summarized in reduction rounds. Detail is lost twice, and calls grow with diff size. | `budgetedGeneration.ts:84-97,198-232` |
| F5 | Diff generation already uses `--unified=0`, so context lines are already minimal. Only lockfiles ≥32 KB and JSON/CSV/TSV ≥64 KB are replaced by metadata. Minified, bundled, snapshot, `.map`, `.svg`, vendored and generated code are not. | `git/structuredData.ts`, `git/repository.ts:241-300` |
| F6 | Direct-path gate: known model = `assertPromptFitsAsync` (bytes vs budget). Unknown = send if prompt ≤ 1 MB and let the provider reject. A rejection records `rejectedPromptBytes` and replans at half. Non-Pro users get a hard error when over budget. | `index.ts:396-433` |
| F8 | Only 8 models are verified. OpenAI, Groq, DeepSeek, Grok, custom endpoints and others are `isUnknown`, and today they receive up to a 1 MB prompt directly and rely on provider rejection. | `index.ts:396-433`, `capabilities.ts:57-78` |
| F9 | Ollama sends no `num_ctx`; the server's default context is small and may silently truncate rather than reject. No limit is discovered for ollama/lmstudio. | `api/ollama.ts:34-52` (no `num_ctx`) |
| F10 | There are two unrelated `DiffSpool` types: `git/diffSpool.ts` (multi-file git output, async iterable) and `api/diffSpool.ts` (replayable copy created in `generateCommitMessage`). `largeDiffEnabled` also drives error-message text. | `git/diffSpool.ts`, `api/diffSpool.ts`, `utils/errorHandler.ts:207-214` |
| F7 | Large-diff setting `pro.largeDiffHandling.enabled` plus legacy `chunkSize/batchSize/concurrency` are accepted but ignored by the planner. | `config/largeDiffSettings.ts`, execution plan `plans/large-diff-opt-in-execution.md` |

Research (external, secondary sources; treat as direction, not proof):
- Common tools avoid multi-call: OpenCommit ignores `*-lock.*`/`*.lock` by default; lazycommit sends grouped `--numstat` for large diffs; other write-ups recommend `git diff --stat` as the primary context plus full hunks for the most-changed files. Sources: [opencommit](https://github.com/di-sukharev/opencommit), [lazycommit](https://github.com/KartikLabhshetwar/lazycommit), [diff dissection article](https://medium.com/@yehezkieldio/precision-dissection-of-git-diffs-for-llm-consumption-7ce5d2ca5d47).
- Map-reduce weakens relationships between distant sections and costs calls; summaries of summaries lose detail. Source: [stuffing vs map-reduce overview](https://medium.com/@sonimegha1602/scaling-document-summarization-with-llms-stuffing-map-reduce-and-refine-a8a468d479c3), [2026 long-context tradeoffs](https://futureagi.com/blog/rag-summarization/).
- A commit message needs intent and the shape of the change, not every line. That favors a file-complete digest over exhaustive line coverage. Judgment, not measured here.

Constraints: TypeScript/esbuild extension; Pro gating stays; the diff is already spooled to disk (`DiffSpool`), so a streaming pass is possible; tests mock `getConfiguration` (call `invalidateConfigCache()`).
Stakeholders: end users (cost, latency, quality), the maintainer.
Open questions: none blocking. Decisions recorded (user, 2026-10-05): map-reduce kept as opt-in; compact/digest tiers are **Pro-only** (non-Pro keeps today's error).

## 3. Strategy
### 3.1 Chosen path
A tiered, local-first shrink ending in one call. The decision uses a token budget **B** and an estimate **T** of the full prompt.

| Tier | Applies when | Action | LLM calls |
|---|---|---|---|
| 0 Direct | T ≤ B (everyone) | Send as today | 1 |
| 1 Compact | T > B, Pro | Deterministic noise removal (see 3.3) | 1 |
| 2 Digest | still > B after Tier 1 | Complete file list with numstat + per-file hunk headers, then fill the remaining budget with full hunks of the highest-priority files, with per-file caps | 1 |
| 3 Deep (opt-in only) | Pro, `pro.largeDiffHandling.enabled` is on (existing setting, reused), Tier 2 was needed, and the preflight plan fits `maxCalls` | Existing map-reduce, one approval for the planned total | ≤ `maxCalls` (default 6) |

### 3.2 Budget rule (the "when to apply" answer)
- **B_model** = `effectiveInputBudget` (already `maxInputTokens` or context − output − 256) for models with real limits.
- **B_quality** = soft cap, default 60,000 tokens of diff content (setting-overridable), because very large prompts add cost and latency and lower attention to the middle of the input. Default is a judgment call that task 4.4 validates.
- **B** = `min(B_model, B_quality) − promptOverhead − 256`, where `promptOverhead` = tokens of the rendered template with empty diff plus custom context.
- Unknown models (F8): do **not** pre-shrink to a small number; that would regress the many providers that accept far more today. Start at B = B_quality, and use an attempt ladder on provider input-limit rejection: B, B/2, B/4 (floor 4,000 tokens), at most 3 attempts, no modal. Extend `rejectedPromptBytes`/`observedCapabilities` so the ladder also applies to *known* models, because the new estimator can admit prompts the byte counter used to refuse. If the last attempt is rejected, raise the existing input-limit error.
- Local providers (ollama, lmstudio; F9): default B = 6,000 tokens (assumption A7) unless the user sets `maxPromptTokens`; Ollama requests also pass `num_ctx` = B + output reserve so truncation cannot happen silently.
- **Estimator**: for Tier decisions use `ceil(bytes/3) × 1.1` (conservative for code, 10% margin for emoji/CJK) for both known and unknown models, and `countTokensAsync` when the provider offers it. The existing `estimateTokens` util (≈3.7 chars/token) is for diagnostics only. The byte over-count in F2 is the main cause of "too many calls". Safety net: the attempt ladder above.
- **Discovery gate**: `discoverLargeModel` is gated at `diffByteSize > 64 KB` (`base.ts:72`); keep it, since any diff that needs a tier decision is above that. Verify in Task 1.1 that the gate and the new B_quality agree (a 64 KB-or-smaller diff is always Tier 0 for unknown models).

### 3.3 Tier 1 compaction rules (ordered, stop as soon as T ≤ B)
1. Drop/replace generated and vendored content with a one-line note: `*.min.*`, `*.map`, `dist/`, `build/`, `vendor/`, `node_modules/`, snapshots (`__snapshots__`, `*.snap`), `*.svg`, `*.lock`/lockfiles of any size, generated protobuf/`*.pb.*`/`*.g.*`. User `commit.excludeFiles` already applies.
2. Pure renames (similarity 100%) and mode-only changes: name only.
3. Deletions: file name plus line count only (full text of removed files carries little intent).
4. Per-file cap (default 400 changed lines or 24 KB): keep first and last hunks, plus hunk headers for the rest (`@@ ... function`), and note `N lines omitted`.
5. (could) Collapse repeated mechanical hunks: within one file, hunks whose added/removed lines are identical after trimming whitespace and replacing digit runs with `#`, occurring ≥ 5 times, become one example plus a count.

### 3.4 Tier 2 digest layout
1. Header: totals (`files`, `+added/-removed`).
2. All files, one line each: `status path +a -d [omitted: reason]` (never omit a file name).
3. Hunk text for files in priority order until the budget is full. Priority = source code and config before tests, then docs; larger change first; manifests (`package.json`, API surface) boosted.
4. Last: a note stating how many files/lines were condensed. This is also shown to the user in a progress/notification line.

### 3.5 Why it wins
One call means no approval modal, no sequential latency, no rate-limit queue, no summaries of summaries. It reuses the existing `DiffSpool` and structured-data hooks. Deterministic output is testable. Tier 3 retains the old safety net for people who want exhaustive coverage.

### 3.6 Alternatives rejected
- Tune map-reduce (bigger windows, parallel calls): still N+reductions+1 calls, and rate limits plus approval stay. Rejected.
- Truncate the tail only: drops files silently. Rejected; the digest keeps every file name.
- Embedding/RAG retrieval of hunks: new dependency and calls for a small gain. Rejected.
- Remove map-reduce entirely: rejected by the user's decision (opt-in kept).

## 4. Scope
- New: `src/services/git/diffDigest.ts` (diff index, compaction, digest; pure functions); settings `pro.largeDiffHandling.maxCalls`, `perFileLines`, `maxPromptTokens`; condensed-diff user notice; Ollama `num_ctx`.
- Updates to existing: `generateCommitMessage` flow in `api/index.ts` (tier decision replaces "requiresChunking → processLargeDiff" on default path); `capabilities.ts` (estimator, discovery gate); `git/repository.ts` (numstat/status collection, extra generated-file patterns); `largeDiffSettings.ts`; `package.json` setting descriptions; `utils/errorHandler.ts` suggestions text; the `enabled` setting's meaning (now deep analysis); handbook/wiki docs; tests in `generationRepair.test.ts`.
- Explicitly out of scope: new providers; changing Tier 0 behaviour; per-provider tokenizer libraries; semantic hunk ranking by an LLM.
- Change policy: threshold defaults are tunable constants; changing a tier's contract requires updating section 3 and the tests.
- Cut line: Tasks marked `should`/`could` fall below it.

## 5. Assumptions
| # | Assumption | Validated by |
|---|---|---|
| A1 | Over-counting bytes as tokens (F2) is a primary driver of excess calls | Task 1.1 replay: count planned calls per fixture under old vs new estimator |
| A2 | A file-complete digest preserves enough intent for commit messages | Task 4.4 side-by-side on 5 real large diffs from this repo's history; reviewer checks coverage of main themes |
| A3 | `ceil(bytes/3)` is a safe (conservative) token estimate for code | Task 1.1 spot-check against a real tokenizer count (Copilot `countTokensAsync` or published tokenizer) on fixtures; adjust ratio if under-counting |
| A4 | B_quality = 60k tokens is a good default | Task 4.4; setting stays user-overridable |
| A5 | Parsing the spooled diff in one extra pass is cheap relative to provider latency | Time the pass on the 5 MB fixture in Task 1.2 (target well under 1 s) |
| A6 | Unknown models mostly accept ≥ 60k tokens; the ladder recovers when they do not | Mock provider rejecting above N bytes: ladder converges within 3 attempts for N from 8 KB to 200 KB |
| A7 | A 6k-token default is safe for local Ollama/LM Studio models | Check Ollama default `num_ctx` behaviour with a local run in Task 3.4; setting overrides |

## 6. Phases & Tasks

### Phase 1: Measure and estimate
Checkpoint: fixtures and estimator verified; planned-call counts recorded.

**Task 1.1 — Baseline fixtures and estimator**
- What: Build 4 diff fixtures (200 KB mixed, 2 MB with lockfile + generated bundle, 5 MB bulk rename+edit, single 3 MB minified line). Record planned calls today. Add `estimatePromptTokens(text, capabilities)` (bytes/3 for known tokenizers, async counter when present, bytes for unknown).
- How: Script under `scripts/` reusing `generateBudgeted` with a mock `send`; unit tests for the estimator.
- Where: `src/services/api/capabilities.ts`, `scripts/test-generation.mjs`, `src/test/suites/generationRepair.test.ts`
- Depends on: None
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: table of old calls vs estimator output committed in the execution file; estimator tests pass.

**Task 1.2 — Index the spooled diff**
- What: Build a per-file index `{path, status, added, deleted, binary, startOffset, endOffset}` by parsing the replayable diff itself (`diff --git` sections, `+`/`-` lines, `Binary files differ`, `rename`/`deleted file`/`new file` headers). Supersedes the earlier numstat design: parsing the same bytes cannot drift from the pathspec, handles untracked `--no-index` and omitted-file notes, and adds no git calls (removes A5).
- How: One streaming pass over `api/diffSpool.ts` `read()`; offsets are UTF-16 units to match `sourceWindows`; pass 2 re-reads the spool by offset. Bounded memory: index holds one small record per file (10,000-file test).
- Where: `src/services/git/diffDigest.ts` (new), consumer in `src/services/api/index.ts`
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when: unit tests show index counts equal `git diff --numstat` on staged, unstaged and untracked fixtures; binary, rename-only, delete and mode-only sections are classified; a section with no trailing newline and a CRLF file parse correctly.

### Phase 2: Compaction and digest
Checkpoint: pure functions produce prompts under B for all fixtures.

**Task 2.1 — Compaction (Tier 1)**
- What: Implement rules 3.3 as a two-pass transform over the spool using the Task 1.2 index.
- How: Apply rules in order against the index, re-estimate after each rule, stop when T ≤ B, then emit sections by offset with one-line notes for dropped content. Rule 5 is `could`.
- Where: `src/services/git/diffDigest.ts`, patterns also in `structuredData.ts`
- Depends on: 1.1, 1.2
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: tests per rule pass; rules never remove a file name; output for a fitting diff is byte-identical to input.

**Task 2.2 — Digest (Tier 2)**
- What: Implement layout 3.4 with priority fill and per-file caps; handle a single huge line (truncate with marker plus size).
- How: Sort by priority; add hunk text until B; always emit the file list first.
- Where: `src/services/git/diffDigest.ts`
- Depends on: 2.1
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: all four fixtures give prompts ≤ B; every changed path appears in the output; test covers 10,000-file diff within bounded memory.

### Phase 3: Wire into generation
Checkpoint: default path makes one call for every fixture.

**Task 3.1 — Tier decision in `generateCommitMessage`**
- What: After capabilities are prepared, compute T and B, pick the tier, build the prompt, make one call. Non-Pro: Tier 0 or the existing error. Pro: Tiers 1-2.
- How: Replace the `requiresChunking`→`processLargeDiff` default with tier selection; implement the attempt ladder (B, B/2, B/4; max 3 attempts, no modal) for known and unknown models; keep `GenerationAttempts.beforeAttempt(false)` counting. Keep the prompt-overhead calculation: render the template with an empty diff plus custom context, and if overhead alone exceeds B raise the existing "shorten custom context" error.
- Where: `src/services/api/index.ts`, `src/services/api/capabilities.ts`
- Depends on: 2.2
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: tests: fitting diff = 1 call; large known model = 1 call; unknown model rejecting once = 2 calls and no modal; rejecting 3 times = input-limit error; non-Pro over-budget diff = existing error, zero provider calls; fitting diff for non-Pro unchanged.

**Task 3.2 — Opt-in Tier 3**
- What: Route to existing `processLargeDiff` only when Pro, `pro.largeDiffHandling.enabled` is on, and Tier 2 was needed. The planner's preflight total is compared with `maxCalls` (new setting, default 6) before any call; above it, use the Tier 2 digest and say so.
- How: Gate in 3.1; the existing approval modal shows the planned total; the ceiling passed to `GenerationAttempts` stays the approved number. Reuse of `enabled` means no new toggle or webview control; update its description and the `errorHandler` suggestions text (`utils/errorHandler.ts:207-214`), which currently claims automatic batching.
- Where: `src/services/api/index.ts`, `generationAttempts.ts`, `budgetedGeneration.ts`
- Depends on: 3.1
- Skills: None
- Parallel: no
- Effort: S
- Priority: should
- Done when: tests: setting off = never batches; setting on and plan ≤ maxCalls = one approval and ≤ maxCalls calls; plan > maxCalls = digest with no batch call; error-message text matches the new behaviour.

**Task 3.3 — User notice and diagnostics**
- What: One-line status (`Condensed N files / M lines to fit <model>`), plus diagnostics fields `tier`, `condensedFiles`.
- Where: `src/services/api/index.ts`, existing `diagnosticLog`
- Depends on: 3.1
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: notice shown for Tier 1/2 only; diagnostics test asserts tier values.

**Task 3.4 — Local-provider ceilings**
- What: Apply the 6k default B for ollama and lmstudio and send `num_ctx` for Ollama.
- How: Provider-level capability override via `rememberModelLimits`-style registry or a `localContextTokens` default; Ollama request `options.num_ctx`.
- Where: `src/services/api/ollama.ts`, `lmstudio.ts`, `capabilities.ts`
- Depends on: 3.1
- Skills: None
- Parallel: yes
- Effort: S
- Priority: should
- Done when: unit test asserts the Ollama request body carries `num_ctx` and B is 6k; A7 checked or documented as unverified.

### Phase 4: Settings, docs, validation
Checkpoint: all gates green and quality comparison recorded.

**Task 4.1 — Settings**
- What: Add `maxCalls` (default 6), `perFileLines`, `maxPromptTokens` (B_quality). Reuse `enabled` for deep analysis (no `deepAnalysis` key). Mark `chunkSize/batchSize/concurrency/maxChunks` deprecated with migration note.
- Where: `package.json`, `src/config/largeDiffSettings.ts`, `Complete-Settings-Reference.md`
- Depends on: 3.1
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: settings load with defaults; deprecated keys still parse; docs validate.

**Task 4.2 — Docs**
- What: Rewrite the large-diff sections to describe tiers and the opt-in.
- Where: `docs/handbook/Advanced-Pro-Features.md`, `wiki/Advanced-Pro-Features.md`, `Troubleshooting-And-FAQ.md`
- Depends on: 3.2
- Skills: None
- Parallel: yes
- Effort: S
- Priority: should
- Done when: `pnpm docs:validate` passes.

**Task 4.3 — Test suite**
- What: Tests for tiers, estimator, no-modal default, call ceilings, every-file-named invariant.
- Where: `src/test/suites/generationRepair.test.ts`
- Depends on: 3.1, 3.2
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when: `pnpm test:generation`, `check-types`, `lint` pass.

**Task 4.4 — Quality comparison**
- What: Generate messages for 5 real large historical commits via digest and via old map-reduce; compare main-theme coverage and call counts.
- How: Manual run with a real provider the maintainer chooses; record results in the execution file.
- Where: execution file `plans/large-diff-single-call-digest-execution.md`
- Depends on: 3.1
- Skills: None
- Parallel: no
- Effort: M
- Priority: should
- Done when: results table recorded; A2/A4 confirmed or thresholds adjusted.

### 3.7 Decision (user, 2026-10-05)
Tiers 1-2 are Pro-only; non-Pro keeps Tier 0 and today's error. The error text should mention that GitMind Pro condenses oversized diffs (Task 3.1). Licensing validation must keep failing open (see memory: licensing); treat a validation outage as Pro for this check, as the existing `isProUser()` path does.

## 7. Risks & Countermeasures
| Risk | Impact | Countermeasure |
|---|---|---|
| Digest drops the decisive hunk | Poor message | File list always complete; priority rules; deepAnalysis opt-in; A2 check |
| `bytes/3` under-counts for dense non-Latin text | Provider rejects | Rejection fallback halves B and rebuilds once; A3 spot-check |
| Unknown model limit set too high or low | Rejection or weak digest | Start at B_quality with the attempt ladder (no small fixed default) |
| Rule bug removes a file name | Silent loss | Invariant test: every path in input appears in output |
| Per-file numstat adds latency on huge repos | Slower start | A5 measurement; run alongside diff spooling |
| Users relying on old batching | Behaviour change | Opt-in kept; changelog note; legacy keys still parsed |
| Concurrent edits while spooling | Mismatched stats | Index is built from the same spooled bytes, so counts cannot drift |
| New estimator admits prompts a known model rejects | Extra call, error | Attempt ladder for known models too; rejection tests |
| Ollama silent truncation | Message based on cut-off prompt | `num_ctx` plus 6k default (Task 3.4) |
| `enabled` setting changes meaning | Existing users surprised | Release note; description updated; behaviour for them is strictly fewer calls |
| Huge untracked file is spooled in full to disk (pre-existing, `--no-index`) | Disk/time on giant files | Out of scope; recorded as a known limit |

Premortem: the likely failure is "digest is too lossy and users ask for the old behaviour". The opt-in and Task 4.4 address that. Inspection limits: no real-provider runs were done in this planning pass.

## 8. Verification & Replanning
- Per task: the "Done when" lines.
- Overall: `rtk pnpm test:generation`, `check-types`, `lint`, `docs:validate`; the four fixtures yield 1 call; Task 4.4 table recorded.
- Replan when: Task 1.1 shows the estimator change alone removes most calls (then Tier 2 may shrink in scope); A2 fails on ≥2 of 5 diffs; a provider's rejection rate rises after the change.

## 9. Traceability
| Objective | Covered by tasks |
|---|---|
| One call by default (Pro) | 1.1, 1.2, 2.1, 2.2, 3.1, 4.3 |
| No approval modal on default | 3.1, 3.2, 4.3 |
| Every file named | 1.2, 2.1, 2.2, 4.3 |
| Opt-in deep mode capped | 3.2, 4.1 |
| Non-Pro unchanged; local models safe | 3.1, 3.4 |
| Users informed | 3.3, 4.2 |
| Quality not regressed | 4.4 |

## 10. Handover Summary
- Context: Current multi-call batching (planner, approval meter, reductions) causes many calls; root causes F2, F3, F4. See section 2.
- Decisions: map-reduce stays as opt-in (user); tiers 1-2 Pro-only (user); `enabled` reused for deep analysis and `maxCalls` default 6 (defaults, revisit if users want a separate toggle); B_quality 60k (default, validate in 4.4).
- State: done = analysis; pending = all tasks; blocked = none.
- Remaining tasks: sections 6 (what/how/where each).
- Verification: section 8.
- Risks and early detection: lossy digest (Task 4.4), token under-count (rejection logs), missing file in output (invariant test).

## 11. Review appendix
- Findings (trigger → consequence → correction; severity / confidence):
  1. Unknown-model B = 12k would shrink prompts for most providers, which accept up to 1 MB today (F8) → quality regression for OpenAI/Groq/DeepSeek/custom users. High / proven by code. Fix: start at B_quality, attempt ladder (3.2).
  2. Rejection learning existed only for unknown models; the new estimator also admits prompts that known models reject → errors. High / likely. Fix: ladder for known models (3.1).
  3. Ollama sends no `num_ctx` and does not discover limits (F9) → silent truncation of a 60k-token digest. High / likely. Fix: Task 3.4.
  4. numstat from separate git calls can drift from the spooled diff (untracked, omitted files, binary) → wrong stats or a missing file. Medium / likely. Fix: index the spool itself (Task 1.2).
  5. Tier 3 "drops > X%" threshold was undefined, and a 4-call cap makes map-reduce nearly useless. Medium / proven. Fix: reuse `enabled`, `maxCalls` default 6, preflight comparison (3.2).
  6. Ambiguous `DiffSpool` name and `largeDiffEnabled` error text (F10) → wrong file edited, misleading messages. Low / proven. Fix: Where fields and Task 3.2.
  7. Compaction rule 5 was vague → made precise and `could`.
- Decisions: Pro-only tiers 1-2; map-reduce opt-in (user). Defaults: reuse `enabled`; maxCalls 6; B_quality 60k; local B 6k; estimator bytes/3 × 1.1.
- Remaining risks: digest quality unproven until Task 4.4 (uncertain); estimator ratio unvalidated for non-code text (possible); giant untracked files still spooled to disk (pre-existing).
- Applicable checks and evidence: code inspection of `index.ts`, `budgetedGeneration.ts`, `capabilities.ts`, `base.ts`, `ollama.ts`, `errorHandler.ts`. No tests, builds or real-provider runs were executed in this review.
- Non-applicable checks and reasons: security/privacy review (no new data leaves the machine; the digest sends a subset of what is sent today); deployment/monitoring (local extension; diagnostics added in 3.3); rollback (the old pipeline is untouched and remains behind `enabled`; reverting the tier-selection condition in 3.1 restores the previous behaviour).
- Blockers and resolution needed: none.
