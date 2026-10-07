# Execution ledger: large diffs in one call

Basis: user instructed execution of the reviewed plan `plans/large-diff-single-call-digest.md` (status: Reviewed and ready to execute, 2026-10-05). Baseline at start: `pnpm test:generation` 118/118. Nothing was committed or staged by this execution; changes sit in the working tree on branch v6.4.1 (some files were already staged by the user).

## 1. Coverage ledger

| ID | Task | Priority | Status | Evidence |
|---|---|---|---|---|
| 1.1 | Baseline fixtures and estimator | must | done (verified) | Estimator `estimateByteTokens` / `measurePrompt` tested (`diffDigest.test.ts`: estimator test). Baseline table in section 3 (8 real commits, old planned calls 6-34 vs 1 now). |
| 1.2 | Index the spooled diff | must | done (verified) | Real-git test: index equals `git diff --numstat` file set, +/- counts, rename, delete, binary, add; sections contiguous over every char; 10,000-file and 3 MB single-line tests bounded. Pass over a 4 MB diff took 17 ms. |
| 2.1 | Compaction (Tier 1) | must | done (verified), rule 5 not built | Tests: generated files, deleted/rename-only, per-file cap with hunk headers and tail, no file name lost, fitting diff untouched (tier 0). Rule 5 (repeated mechanical hunks) is `could`, below the cut line: not implemented. |
| 2.2 | Digest (Tier 2) | must | done (verified) | Tests: all paths listed (≤ list budget), priority fill, directory collapse for 3,000 and 10,000 files, output ≤ budget, bounded memory. |
| 3.1 | Tier decision in `generateCommitMessage` | must | done (verified) | Tests: fitting = 1 call; 221.7 KB Copilot = 1 request, no modal; unknown model rejection ladder = exactly 3 requests, no modal, then input-limit error; rejected modest prompt = 2 requests; non-Pro over budget = input-limit with 0 provider calls. |
| 3.2 | Opt-in Tier 3 | should | done (verified) | Tests: `maxCalls` 2 = never starts (1 request, no modal); `maxCalls` 50 = several calls and one approval; declined approval = one condensed request; overrun of approved total falls back (strict mode); `errorHandler` text updated and tested. |
| 3.3 | Notice and diagnostics | must | done (verified), diagnostics inspected only | Test: notice only for condensed diffs. `generation.condensed` diagnostic event added; not asserted by a test (inspected in code). |
| 3.4 | Local-provider ceilings | should | done (verified), A7 unverified | Ollama request body carries `num_ctx` 8048 and prompt ≤ 6000 estimated tokens (test). A real Ollama run was not done. |
| 4.1 | Settings | must | done (verified) | `maxCalls`, `perFileLines`, `maxPromptTokens` in `package.json`, `resolveLargeDiffSettings`, `ExtensionSettings`; legacy keys marked deprecated; defaults test updated. |
| 4.2 | Docs | should | done (verified) | Handbook (Advanced Pro Features, Settings Reference, Troubleshooting) rewritten and wiki regenerated; `pnpm docs:validate` passed. |
| 4.3 | Test suite | must | done (verified) | 134/134 pass (new: 12 digest tests, 6 flow tests; 5 old tests rewritten for the new behaviour). check-types, lint, compile pass. |
| 4.4 | Quality comparison | should | blocked | Needs a real provider to compare messages. Structural comparison done on 8 real commits (below). LLM message quality (assumptions A2, A4) remains unverified. |

## 2. Deviations

All within the plan's change policy (routine, reversible); none changes the objective, scope or a user decision.

1. **Estimator scope.** Plan 3.2 said use `bytes/3 × 1.1` for all decisions. Changing the shared `countTokens` broke 28 existing tests that encode byte counting for the batch planner, so the estimator applies only to single-call decisions (`measurePrompt`, `heuristicTokens` flag). The opt-in deep-analysis planner still counts bytes, so F2 still affects it.
2. **Tier 0 threshold.** Tier 0 stays at the model's own limit (known models) or the prompt ceiling (unknown); the 60k "quality" ceiling only sizes condensed prompts. This avoids shrinking diffs a model accepts today.
3. **Unknown models today.** Plan finding F8 said unknown models accepted up to 1 MB directly. The code showed `base.ts` limited them to 64 KB (bytes). Now unknown models accept up to the ceiling (60k estimated tokens ≈ 160 KB) directly.
4. **Directory collapse.** When the file list alone would exceed half the budget, files are counted per directory (and the remainder counted, not hidden) instead of listed individually. Plan 3.4's "never omit a file name" holds only above that size; totals always cover every file.
5. **Tier 2 breadth.** Remaining budget is shared among up to 30 files (per-file cap 1.5-24 KB) instead of whole files by priority, because the first version showed hunks for only 4 of 206 files.
6. **Single approval.** `GenerationAttempts.approveBatch` now asks once for plans over five calls (previously "up to 5", then a second prompt). Existing meter test updated.
7. **Rule 5 skipped** (see 2.1).

## 3. QC results

Gates run on the final working tree: `pnpm test:generation` 134/134; `pnpm check-types` pass; `pnpm lint` pass; `pnpm compile` (types + lint + esbuild) pass; `pnpm docs:validate` pass (after `docs:sync-wiki`); `git diff --check` clean.

Phase checkpoints: Phase 1/2 (digest functions under budget for all fixtures) verified before wiring; Phase 3 (one call per fixture) verified by the flow tests; Phase 4 gates above.

Baseline vs new, real commits from this repository (unknown model, byte counting for the old planner; new = one request at a 60k ceiling):

| Commit | Diff KB | Files | Old planned calls | New calls | New tier | Files summarized |
|---|---|---|---|---|---|---|
| a28de58 | 1912 | 206 | 34 | 1 | 2 | 203/206 |
| 767e26b | 791 | 193 | 15 | 1 | 2 | 130/193 |
| 4809097 | 729 | 4 | 14 | 1 | 1 | 2/4 |
| 0952899 | 488 | 11 | 10 | 1 | 1 | 2/11 |
| 56b71d3 | 426 | 18 | 9 | 1 | 2 | 16/18 |
| 18f6896 | 420 | 88 | 9 | 1 | 2 | 58/88 |
| 3c83433 | 279 | 130 | 6 | 1 | 2 | 12/130 |
| 51d26e2 | 252 | 56 | 6 | 1 | 2 | 19/56 |

Regression sweep: the direct path for fitting diffs is unchanged (existing "moderate diff", "streamed diff", "large OpenRouter" tests still pass). Free access still returns the input-limit error with no provider call. The deep-analysis planner and meter tests pass unchanged except the approval-count test. Not swept: real providers, VS Code UI (settings page text edited, not rendered), Windows paths.

## 4. Unfinished items

- 4.4 LLM quality comparison: blocked on a real provider run by the maintainer. Evidence needed: messages for 3-5 large commits from the digest versus the old pipeline; adjust the 60k default and `perFileLines` if themes are missed.
- Rule 5 (repeated mechanical hunks): `could`, not built.
- A7 (6k default for local models) and `num_ctx` behaviour: unverified against a real Ollama server.

## 5. Handover summary

- Context: oversized diffs now make one request. New module `src/services/git/diffDigest.ts` (index, compaction, digest); flow in `generateCondensed` in `src/services/api/index.ts`; attempt ladder is 3 requests max; deep analysis (`enabled`) is opt-in with `maxCalls`.
- Decisions: Pro-only condensing; map-reduce opt-in (user). Defaults: reuse `enabled`; `maxCalls` 6; ceiling 60k (6k local); estimator bytes/3 × 1.1.
- State: done = all `must`; pending = none; blocked = 4.4 (needs provider).
- Remaining: run 4.4 with a real model (`git show --unified=0 <sha>` of the commits in section 3 through the extension).
- Verification: gates in section 3.
- Risks and early signals: digest drops the decisive hunk (compare messages in 4.4); estimator under-counts non-code text (a provider input-limit rejection logs and triggers the ladder); `enabled` now means deep analysis (release note needed); huge untracked files are still spooled in full (pre-existing).

## 6. Incident 2026-10-06: every provider failed after a successful response

- Evidence: support export shows HTTP 200 and parsing, then `operation_failed` with category `unknown` about 0.5 s later, on every model. The repository staged about 30 MP4/PNG files.
- Root cause (proven): after generation, the Commit Health scan ran `collectChangeSet` with `git diff --cached --binary` into a 20 MB buffer. This repo's binary patch is 51 MB, so `execFile` failed with a max-buffer error. `runGit` turned that into "Git command failed: unknown error", which threw away the generated message. The diff sent to the model was only 100 KB, so the condensing path was not involved.
- Fix: scoring, the settings preview, and the post-generation scan use `collectChangeSet(..., { binaryPatches: false })` (105 KB on this repo). Composer keeps binary patches with a 1 GB buffer. The health scan is wrapped so it can never discard a message. `runGit` now reports buffer overflows and raw messages. Untracked binary detection reads only 8 KB.
- Regression test: "staged media larger than the Git buffer…" (25 MB random binary). The old default buffer is shown to fail; the new paths succeed. Gates: 135/135, compile (types, lint, esbuild) pass.
