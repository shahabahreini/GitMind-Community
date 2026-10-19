# Plan: Fix truncated long-form generation (changelog) across all providers

| Field | Value |
|---|---|
| Objective | Changelog and other long-form generations complete on every provider instead of failing with a generic "could not complete the request" error. |
| Status | Reviewed and ready to execute |
| Version | 2 (expert review 2026-10-19) |
| Created | 2026-10-19 |

## 1. Objective & Definition of Done
- Goal: Remove the root cause that makes every changelog request fail, fix the sibling defects that share it, and make the failure explain itself if it ever recurs.
- Done when:
  - O1. Changelog generation sends an output budget sized for long-form text (8192 tokens, or the model's reported output maximum up to 16384), not the 1024-token commit-message reservation, on every provider — and the changelog prompt leaves room in the context window for that output.
  - O2. Commit-history analysis ("learn history") gets the same long-form budget.
  - O3. Commit-message input budgets are unchanged (no regression from raising output reservations globally).
  - O4. A truncated answer shows a specific message ("output was cut off … raise Max Tokens / choose a model with larger output") instead of the generic one.
  - O5. Support logs record the real failure category (`invalid_response`, `timeout`, …) instead of `network` for every thrown error.
  - O6. Long-form requests are not killed by the 55 s per-request timeout tuned for commit messages.
- Success measures: new unit tests pass; `pnpm run compile` and the existing test suite pass; a manual changelog run on Inception and Mistral produces a changelog.
- Expected results: after Phase 1 the changelog command succeeds; after Phase 2 a forced truncation shows the new message and the support export shows `errorCategory: "invalid_response"`.
- Must not happen: commit-message prompts shrink or change; secrets/bodies leak into logs; truncated changelogs are silently accepted; user-set Advanced Max Tokens is ignored.

## 2. Context & Constraints
- Background (observed, origin/main = v6.5.0, the build in the support log):
  - Support log: Inception and Mistral both return HTTP 200, then fail at stage `parsing` with `errorCategory: "network"` (log `gitmind-support-2026-10-19T23-18-50-878Z.json`, events 4–6, 13–15).
  - `src/services/api/base.ts:102-106` clamps every request to `maxTokens = min(capabilities.outputTokens, …)`.
  - `src/services/api/capabilities.ts:81-82` gives every unlisted model `outputTokens: 1024`; listed models are 1000–8000 (e.g. `mistral-small-2603` 1024, `claude-sonnet-5-5` 1000). Inception models are unlisted.
  - `src/services/api/loggedFetch.ts:58-61` (and `mistral.ts:64`, `bedrock.ts:32`) throw `"Provider output was truncated."` (`invalid-response`) when `finish_reason` is `length`/`max_tokens`.
  - A multi-version changelog exceeds 1024 tokens → every provider truncates → every changelog fails. `ChangelogService.ts:770` itself assumes a 2500-token response.
  - Adapter defaults (`inception.ts:132` 2048, `gemini.ts` 65536) never apply, because base always passes `maxTokens`.
  - `BaseAIProvider.rememberModelLimits` (`base.ts:62`) stores `min(1024-ish static, discovered)`, so a discovered larger output max is discarded.
  - `errorHandler.ts:156-176` has no `invalid-response` case → falls through to the generic "could not complete the request" text the user saw.
  - `loggedFetch.ts:83` logs `errorCategory: "network"` for any exception, including truncation.
  - `requestContext.ts:31` aborts each request at 55 s.
  - Introduced together in `51d26e2 fix(generation): repair large-diff coverage and request handling`.
- Constraints: TypeScript, esbuild; match file idioms (dense one-liners in `api/`); no new dependencies; privacy rules in `loggedFetch.ts` header comment.
- Stakeholders: extension users (all providers), maintainer (release 6.5.x).
- Open questions and decision points: none blocking. Defaults recorded in §5.

## 3. Strategy
- Chosen path: add a per-operation **output budget** to `RequestContext` (`outputTokens`, `requestTimeoutMs`). Long-form entry points (changelog, history analysis) set it; `BaseAIProvider.generateWithRawPrompt` uses it instead of the commit-message reservation, bounded by the model's reported output maximum when known, by the context room left after the prompt when the context size is known, and by the user's explicit Max Tokens setting. The changelog's own prompt-size check reserves the same long-form output. Capabilities keep their current `outputTokens` reservation, so commit input budgets are untouched. Then fix error mapping and diagnostics.
- Why it wins: fixes the cause at the single choke point every provider passes through; no per-adapter edits; does not perturb commit-message budgeting.
- Alternatives rejected:
  - Raise `outputTokens` in `modelCapabilities` → shrinks `effectiveInputBudget` for every commit request (O3 violation).
  - Accept truncated output → silently broken changelogs.
  - Remove the clamp and rely on adapter defaults → defaults vary 350–65536 and some (Anthropic sonnet 350) are even smaller.
  - Continuation/multi-part changelog generation → much larger change, not needed for the failure observed.

## 4. Scope
- New: `RequestContext.outputTokens` / `requestTimeoutMs`; `ModelCapabilities.maxOutputTokens`; `LONG_FORM_OUTPUT_TOKENS` constant; `invalid-response` user message; regression tests.
- Updates to existing: base generation clamp; `rememberModelLimits`; Copilot capability registration; `generateWithRawPrompt` + `generateCommitHistoryAnalysis` entry points in `api/index.ts`; changelog prompt sizing in `ChangelogService.ts`; `errorHandler.ts`; `loggedFetch.ts` diagnostics; `base.ts` failure event.
- Explicitly out of scope: per-adapter default changes; multi-part changelog generation; commit-message output budgets; the short `commit_health_history_guidance` and commit-intelligence raw calls (short answers; keep defaults); uncommitted dependency bumps on `v6.4.1`.
- Change policy: any change touching commit-message budgets or adapter request bodies requires replanning.
- Cut line: tasks 1.0–1.5, 2.1, 2.2 and 3.1 are `must`. Below the cut line: 2.3 (`should`, diagnostics), 3.2 (`could`, manual run).
- Footprint: 1 file created (this plan) + 1 test file created (`src/test/suites/longFormOutput.test.ts`, serves O1–O4 proof) · 9 edited (`requestContext.ts`, `capabilities.ts`, `base.ts`, `copilot.ts`, `api/index.ts`, `ChangelogService.ts`, `errorHandler.ts`, `loggedFetch.ts`, `CHANGELOG.md`; plus `commands/index.ts` and `SupportSessionService.ts` if 2.3 is done) · 0 dependencies · 0 new abstractions (two optional context fields, one optional capability field, one constant).

## 5. Assumptions
| # | Assumption | Validated by |
|---|---|---|
| A1 | 8192 output tokens fits a typical multi-version changelog and is accepted by current models of all supported providers; a model's reported output maximum (Gemini `outputTokenLimit`, Anthropic `max_tokens`, OpenRouter `max_completion_tokens`, OpenAI-compatible `max_output_tokens`) is safe to request up to 16384. | `ChangelogService` assumes ≤2500; manual run (3.2) on Inception + Mistral; revisit if a provider rejects `max_tokens=8192` (400 "must be <=") — then lower or use discovered max. |
| A2 | User-set Advanced Max Tokens is intentional and must still cap long-form output. | Existing behavior in `base.ts:102-106`; truncation message tells the user to raise it. Revisit if users report it. |
| A3 | 180 s is enough for an 8192-token answer on slow providers. | Mistral log: 18 s for ~1k tokens + large input → ~8k tokens well under 180 s. Revisit on timeout reports. |
| A4 | Work lands on a new branch from `origin/main` (v6.5.0); local `v6.4.1` is stale and lacks Inception. | `git log HEAD..origin/main` = 11 commits; `inception.ts` absent locally. Dependency bumps on `v6.4.1` are stashed (`git stash push -m "dep bumps v6.4.1"`), not discarded. |
| A5 | `finish_reason` truncation checks stay strict for all operations. | Design choice: partial changelogs are worse than a clear error. |
| A6 | Copilot ignores `maxTokens` (`copilot.ts` `generateResponse(prompt, _options)`), so its 1024 is a reservation, not a real maximum. | `origin/main:src/services/api/copilot.ts:233,250`. |
| A7 | The VS Code test host runs locally (`.vscode-test/vscode-darwin-arm64-1.101.0` is cached; `pretest` compiles tests + lint). | `.vscode-test.mjs`, `package.json` scripts. Baseline run in 1.0 confirms. |

## 6. Phases & Tasks
### Phase 1: Root-cause fix
Checkpoint: `pnpm run check-types` passes and the new unit test shows changelog requests carry `maxTokens = 8192` while commit requests still carry the model reservation.

**Task 1.0 — Branch setup**
- What: Start from the shipped code.
- How: `git stash push -m "dep bumps v6.4.1" -- package.json pnpm-lock.yaml`; `git switch -c fix/long-form-output-budget origin/main`; `pnpm install`; run `pnpm test` once and record any already-failing tests as the baseline.
- Where: repo root.
- Depends on: none
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: `git status` clean on the new branch; `src/services/api/inception.ts` exists; baseline test result recorded (pass count and names of any pre-existing failures).

**Task 1.1 — Context and capability fields**
- What: Add `outputTokens?: number` and `requestTimeoutMs?: number` to `RequestContext`; add `maxOutputTokens?: number` to `ModelCapabilities`; export `LONG_FORM_OUTPUT_TOKENS = 8192` and `LONG_FORM_TIMEOUT_MS = 180_000` from `capabilities.ts`.
- How: doc-commented optional fields in the existing style; `runRequest` default timeout becomes `context?.requestTimeoutMs ?? 55_000`.
- Where: `src/services/api/requestContext.ts`, `src/services/api/capabilities.ts`.
- Depends on: 1.0
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: type-check passes; no behavior change yet.

**Task 1.2 — Keep discovered output maximum**
- What: `rememberModelLimits` stores the discovered output limit as `maxOutputTokens` while keeping `outputTokens` as the reservation. Copilot stops reporting its 1024 reservation as a discovered limit.
- How: add `maxOutputTokens: typeof outputTokens === "number" && Number.isSafeInteger(outputTokens) && outputTokens > 0 ? outputTokens : undefined` to the registry entry. In `CopilotProvider.prepareCapabilities`, pass `undefined` instead of `1024` (reservation defaults to 1024 already, so commit budgets are unchanged).
- Where: `src/services/api/base.ts:61-67`, `src/services/api/copilot.ts:234`.
- Depends on: 1.1
- Skills: None
- Parallel: yes (with 1.3 drafting)
- Effort: S
- Priority: must
- Done when: unit test: after remembering `(model, 128000, 64000)`, `getCapabilities()` has `outputTokens ≤ 1024` and `maxOutputTokens === 64000`.

**Task 1.3 — Operation-aware clamp**
- What: In `generateWithRawPrompt`, when `context.outputTokens` is set the ceiling is:
  1. `target = capabilities.maxOutputTokens ? Math.min(capabilities.maxOutputTokens, 16384) : context.outputTokens` (export `LONG_FORM_MAX_OUTPUT_TOKENS = 16384` beside the other constants);
  2. if the context size is known (`!capabilities.isUnknown && capabilities.maxInputTokens === undefined`), `target = Math.min(target, capabilities.contextTokens - await measurePrompt(prompt, capabilities) - 256)` — use `measurePrompt` (byte heuristic), not the conservative byte-per-token count, which over-counts 3–4× and would collapse the room;
  3. `target = Math.max(target, capabilities.outputTokens)` so it is never below today's reservation;
  then the existing user `maxTokens` minimum. Without `context.outputTokens`, behavior is exactly today's. `requestTimeoutMs` reaches `runRequest` via the context spread.
- How: edit lines 102-106; input-budget check (lines 92-101) unchanged.
- Where: `src/services/api/base.ts`.
- Depends on: 1.1
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: tests: (a) no `outputTokens` in context → `maxTokens` equals `capabilities.outputTokens` (commit path unchanged); (b) `outputTokens: 8192` on unknown model → 8192; (c) discovered max 4000 → 4000; (d) discovered max 65536 → 16384; (e) known 32k context with a ~28k-token prompt → between reservation and the remaining room; (f) user maxTokens 500 → 500.

**Task 1.4 — Long-form entry points set the budget**
- What: `generateWithRawPrompt(…, 'changelog', …)` and `generateCommitHistoryAnalysis` set `owned.context.outputTokens = LONG_FORM_OUTPUT_TOKENS` and `owned.context.requestTimeoutMs = LONG_FORM_TIMEOUT_MS`.
- How: in `api/index.ts`, set when `supportOperation` is `generate_changelog` or `learn_history`, and in `generateCommitHistoryAnalysis` before recovery; ensure `generateAnalysisWithConfig` forwards `owned.context` (it already does).
- Where: `src/services/api/index.ts` (~1180-1240, ~1286-1355).
- Depends on: 1.3
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: test stubs a provider's `generateResponse` and asserts received `options.maxTokens === 8192` for changelog and history analysis, and the commit path is unchanged.

**Task 1.5 — Changelog prompt sizing reserves long-form output**
- What: `estimateChangelogTokens` reserves `LONG_FORM_OUTPUT_TOKENS` for the response and stops adding the reserve back onto the model's input budget, so prompt + output fit the context.
- How: `responseReserve = LONG_FORM_OUTPUT_TOKENS`; `maxTokenLimit = Math.min(100000, modelInputBudget ?? 100000)`. The existing "reduce commits?" modal and `recommendedMaxCommits` keep working off these values.
- Where: `src/services/changelog/ChangelogService.ts:769-776`.
- Depends on: 1.1
- Skills: None
- Parallel: yes (with 1.3)
- Effort: S
- Priority: must
- Done when: `changelogService.test.ts` (extend) shows a 32k-input-budget model gets `isWithinLimit: false` for a prompt of ~27k tokens (fits input, no room for output), and a 100k default stays within limit for a ~85k prompt.

### Phase 2: Make failures explain themselves
Checkpoint: forcing a `finish_reason: "length"` response in a test produces the new user message, and the support event carries `errorCategory: "invalid_response"`.

**Task 2.1 — User message for invalid-response**
- What: Add `case "invalid-response"` in `ErrorHandler`: if message includes "truncated" → "`${provider}` stopped before finishing the answer (output limit reached)." with suggestions: raise Advanced Max Tokens if set, choose a model with a larger output limit, reduce commits/versions in the changelog range; otherwise "`${provider}` returned an empty or malformed answer." with retry/switch-model suggestions.
- How: mirror existing cases in the switch at `errorHandler.ts:156-176`.
- Where: `src/utils/errorHandler.ts`.
- Depends on: 1.0
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: test in `errorHandling.test.ts` style: truncation error → message contains "output limit"; no raw body leaks.

**Task 2.2 — Regression tests**
- What: Create `src/test/suites/longFormOutput.test.ts` covering 1.2, 1.3, 1.4, 2.1 (1.5 extends `changelogService.test.ts`).
- How: follow `generationRepair.test.ts` patterns (stub provider subclass of `BaseAIProvider`; call `invalidateConfigCache()` after config mocks per project memory).
- Where: `src/test/suites/`.
- Depends on: 1.4, 2.1
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: `pnpm test` runs the new suite green with no failures beyond the 1.0 baseline, and the suite fails if the 1.3 clamp is reverted (verify once by temporary revert).

**Task 2.3 — Truthful diagnostics**
- What: `loggedFetch` catch logs the real category; `base.ts` `operation_failed` event includes it.
- How: map `normalizeProviderError(error, provider ?? "").category` with the same table as `supportErrorCategory` (`commands/index.ts:122`) — move that mapping into `SupportSessionService.ts` as an exported function and reuse it in all three places (concrete benefit: one source of truth, three call sites).
- Where: `src/services/api/loggedFetch.ts:77-86`, `src/services/api/base.ts:116-120`, `src/commands/index.ts:122-132`, `src/services/support/SupportSessionService.ts`.
- Depends on: 1.0
- Skills: None
- Parallel: yes
- Effort: S
- Priority: should
- Done when: test: truncation in `loggedFetch` emits `errorCategory: "invalid_response"`; a real fetch rejection still emits `network`; `supportSession.test.ts` stays green.

### Phase 3: Verify and record
Checkpoint: `pnpm run compile` and `pnpm test` green; CHANGELOG entry present.

**Task 3.1 — Full verification + changelog entry**
- What: Run `pnpm run compile` and `pnpm test`; add an "Unreleased / Fixed" entry to `CHANGELOG.md`.
- How: standard scripts; entry: "Changelog and history analysis no longer fail with 'could not complete the request' — long-form answers get an 8K output budget; truncation now shows a specific message."
- Where: repo root.
- Depends on: 1.5, 2.2 (and 2.3 if done)
- Skills: verify-and-stop
- Parallel: no
- Effort: S
- Priority: must
- Done when: both commands exit 0 (or fail only on the recorded baseline failures); entry present.

**Task 3.2 — Manual provider run**
- What: Run "Generate Changelog" with Inception and Mistral in the Extension Development Host; export a support log.
- How: F5, pick each provider, generate across ≥3 versions.
- Where: VS Code dev host.
- Depends on: 3.1
- Skills: run
- Parallel: no
- Effort: S
- Priority: could
- Done when: both produce a changelog; support log shows no `operation_failed`. Requires the user's API keys — not verifiable by the executor alone.

## 7. Risks & Countermeasures
| Risk | Impact | Countermeasure |
|---|---|---|
| A provider rejects `max_tokens=8192` for a small model (400 "must be <="). | Changelog fails with input-limit message. | Discovered `maxOutputTokens` bounds it where known; A1 revisit trigger; message classification already routes it. |
| Advanced Max Tokens set low by a Pro user still truncates. | Same failure, now with a clear message. | 2.1 message names the setting. |
| Raising timeout hides a hung provider for 3 min. | Slow failure. | Only long-form ops; user cancellation still aborts immediately. |
| Very large histories exceed 8192 output. | Truncation error. | Message suggests narrowing range; existing commit-budget prompt in `ChangelogService` limits input size. |
| Thinking models (`<think>` in content, Gemini thinking, OpenAI reasoning) spend output budget on reasoning. | Possible truncation even at 8192, or for commit messages at 1024. | Reported maximum up to 16384 used where known (1.3 step 1); commit path out of scope; watch for `invalid_response` in support logs. |
| A long-form request times out and the existing recovery retries once on the same model. | Up to ~6 minutes before a timeout error. | Accepted: cancellation aborts immediately; progress UI is already shown. |
| Small-context model: prompt fills nearly all context. | Output room falls back to the 1024 reservation → truncation message. | 1.5 keeps changelog prompts below input budget minus 8192; message tells the user to narrow the range. |

## 8. Verification & Replanning
- Per task: the "Done when" check, run after each task.
- Overall: `pnpm run compile`, `pnpm test`, manual run (3.2) when keys are available.
- Replan when: a commit-message test changes budget; any adapter needs a request-body change; a provider rejects 8192.

## 9. Traceability
| Objective | Covered by tasks |
|---|---|
| O1 changelog budget | 1.1, 1.2, 1.3, 1.4, 1.5, 2.2, 3.2 |
| O2 history analysis budget | 1.4, 2.2 |
| O3 commit budgets unchanged | 1.3 (test a), 2.2 |
| O4 specific truncation message | 2.1, 2.2 |
| O5 truthful diagnostics | 2.3 |
| O6 long-form timeout | 1.1, 1.4 |
| Ship on current code | 1.0, 3.1 |

## 10. Handover Summary
- Context: Root cause = every request clamped to a ≤1024-token commit-message output reservation (`base.ts:102-106`, `capabilities.ts:81-82`) while truncation is rejected (`loggedFetch.ts:58-61`); changelogs always exceed it. Generic message because `errorHandler` lacks an `invalid-response` case.
- Decisions: per-operation output budget in `RequestContext`; 8192 long-form target (reported maximum up to 16384 where known), bounded by context room; 180 s long-form timeout; strict truncation kept; user Max Tokens still respected; changelog sizing reserves 8192; Copilot reports no fake output max; branch from `origin/main`; baseline tests first.
- State: done — investigation, plan, expert review. pending — all tasks. blocked — 3.2 needs user API keys.
- Remaining tasks: Phase 1 (base clamp + entry points), Phase 2 (message, tests, diagnostics), Phase 3 (compile/test/changelog, manual run) — see §6 for how/where.
- Verification: unit tests per §6; `pnpm run compile`; `pnpm test`; manual run.
- Risks and how to detect them early: 400 errors mentioning `max_tokens` (A1); `invalid_response` in support exports for commit generation (thinking models); timeouts in support exports for changelog.

## 11. Review appendix
- Lenses applied and why:
  - Engineering (correctness, edge cases): the fix changes a budget every provider passes through. Findings F1–F4.
  - QA (regression, runnability): the plan relies on `pnpm test`. Finding F5.
  - Architecture (boundaries, simplicity): checked that the change stays at one choke point and does not change capabilities used for commit budgets. No new finding; 2.3's moved mapping kept because `api/` must not import `commands/`.
  - Operations (timeouts, retries, observability): Finding F6; 2.3 already covers observability.
  - Security and privacy: `loggedFetch` diagnostics change only an enum value; no bodies, URLs or headers added. None.
  - Product/UX: error text reviewed in 2.1; it names concrete actions. None beyond the plan.
- Findings:
  - F1 (proven, high): Copilot registers `rememberModelLimits(model, maxInputTokens, 1024, true)` (`copilot.ts:234`). With 1.2 as drafted, it would record a fake 1024 output maximum. Harmless today because Copilot ignores `maxTokens`, but misleading for future code. Fix: pass `undefined` (1.2).
  - F2 (proven, high): `ChangelogService.estimateChangelogTokens` allows prompt ≤ input budget + 2500 (`ChangelogService.ts:770-775`). The prompt can fill the context, so a known mid-size-context model would still truncate. Fix: Task 1.5 added.
  - F3 (likely, medium): providers that enforce prompt + `max_tokens` ≤ context (OpenAI-compatible servers) would reject 8192 on a full context. Fix: context-room bound in 1.3 step 2, with `measurePrompt` because the conservative counter over-counts 3–4×.
  - F4 (possible, medium): Gemini thinking and other reasoning models count reasoning against the output limit; 8192 may be thin. Fix: use the reported maximum up to 16384 when known (1.3 step 1). Unreported models (OpenAI) remain at 8192 — recorded risk.
  - F5 (likely, medium): the full test suite may already have failures on `origin/main`, which would make "pnpm test passes" unjudgeable. Fix: baseline run in 1.0; done-when compares against it.
  - F6 (proven, low): recovery retries `timeout` once on the same model (`api/index.ts:517`), so a hung long-form request can take ~6 minutes. Accepted risk; documented.
  - Checked, no defect: truncation (`invalid-response`) is not retried by recovery (`api/index.ts:539`), so the fix adds no duplicate requests. `owned.context` reaches the provider through recovery (`api/index.ts:1232`). Anthropic thinking models need no separate thinking budget in the request body (`anthropic.ts:72-80`). Inception's `max_tokens`/`max_completion_tokens` both take `options.maxTokens` (`inception.ts:132-133`).
- Decisions: long-form ceiling = reported maximum up to 16384, else 8192; bounded by context room; never below today's reservation. Reversible defaults; revisit on provider 400s mentioning `max_tokens`.
- Remaining risks: OpenAI reasoning models at 8192 (possible); slow-model timeout retry (accepted); manual provider run needs user keys.
- Cuts made and footprint change versus the draft: no tasks cut (lean audit: each task maps to an objective; 2.3 stays `should`). Added Task 1.5. Edited files 7 → 9 (`copilot.ts`, `ChangelogService.ts`). No new dependencies or abstractions; one more constant.
- Applicable checks and evidence: code paths read on `origin/main` (v6.5.0) via `git show`; line refs above. The support log's events 4–6 and 13–15 match the truncation path.
- Non-applicable checks and reasons: data migration/rollback — no persisted state changes; reverting the commit restores prior behavior. Accessibility — no UI change beyond message text.
- Blockers and resolution needed: none. Task 3.2 (manual run) needs the user's API keys; not required for readiness.
