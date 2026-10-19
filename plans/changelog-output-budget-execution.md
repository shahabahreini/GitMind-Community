# Execution ledger: changelog-output-budget

Plan: `plans/changelog-output-budget.md` (v2, Reviewed and ready to execute). Authorization: user chose "Execute now" on 2026-10-19; delegation approved.
Branch: `fix/long-form-output-budget` from `origin/main` (v6.5.0, `ab786d3`). Dependency bumps from `v6.4.1` saved in `git stash` "dep bumps v6.4.1". Nothing committed.

## 1. Coverage ledger
| ID | Task | Priority | Status | Evidence |
|---|---|---|---|---|
| 1.0 | Branch setup + baseline | must | done (verified) | Branch created; `src/services/api/inception.ts` present; version 6.5.0; baseline `pnpm test`: 548 passing, 0 failing |
| 1.1 | Context/capability fields | must | done (verified) | `RequestContext.outputTokens/requestTimeoutMs`, `ModelCapabilities.maxOutputTokens`, `LONG_FORM_*` constants; `runRequest` timeout default reads context; check-types clean |
| 1.2 | Keep discovered output max; Copilot | must | done (verified) | Tests "a reported output maximum bounds…" (`maxOutputTokens === 4000`, reservation ≤1024) and "Copilot-style input-only limits…" (`maxOutputTokens` undefined) pass |
| 1.3 | Operation-aware clamp | must | done (verified) | Tests (a) reservation kept, (b) 8192 unknown, (c) 4000, (d) 65536→16384, (e) 32k context bounded ≥ reservation, (f) user cap 500 — all pass. Revert check: with the clamp removed, 4 tests fail (556 passing / 4 failing); restored |
| 1.4 | Long-form entry points | must | done (verified) | Real Mistral adapter + stubbed fetch: changelog and history analysis send `max_tokens: 8192`; commit raw prompt sends the reservation |
| 1.5 | Changelog sizing reserve | must | done (verified) | Test "changelog sizing reserves room…": budget = prompt+1000 → over limit; prompt+8192 → within limit |
| 2.1 | invalid-response message | must | done (verified) | Delegated (lighter tier); audited diff; 2 tests in `errorHandling.test.ts` pass |
| 2.2 | Regression tests | must | done (verified) | `src/test/suites/longFormOutput.test.ts`, 11 tests, all pass; revert check above |
| 2.3 | Truthful diagnostics | should | done (verified) | Test: truncation → support events `["invalid_response","invalid_response"]`; `TypeError("fetch failed")` → `network`; `supportSession.test.ts` green |
| 3.1 | Compile/test + CHANGELOG | must | done (verified) | `pnpm run compile` exit 0; `pnpm test` 561 passing, 0 failing; CHANGELOG `[Unreleased] / Fixed` entry added |
| 3.2 | Manual provider run | could | blocked | Needs the user's Inception/Mistral API keys in the Extension Development Host |

## 2. Delegation
| Task | Tier | Audit outcome |
|---|---|---|
| 2.1 | lighter | Diff matched the spec exactly. The spec's test code had a type error (optional `suggestions`), which I wrote; fixed by the executor with `?.` / `?? []`. Verified by check-types + test run |
| All others | none (current model) | Core budget logic depends on accumulated context |

## 3. Deviations
- 1.4: The draft condition `supportOperation !== "generate_commit"` would also have given `commit_health_history_guidance` (a short "three suggestions" answer) the long-form budget, because its feature name contains "history". Narrowed to `generate_changelog`; history analysis gets the budget in `generateCommitHistoryAnalysis`. Within plan scope (that guidance call is listed out of scope).
- 1.5: Used `modelInputBudget || 100000` (not `??`) to keep the prior behavior when the budget lookup returns 0.
- 2.3: `loggedFetch` maps only `ProviderApiError` through the shared table. Other thrown errors stay `network`, because Node's `TypeError("fetch failed")` would otherwise be logged as `unknown`. Protects O5 without regressing real network diagnostics.
- 2.2: One extra test (support-log categories) beyond the planned list, covering 2.3.
- Files show as staged in git although no `git add` was run (likely a repo hook or tool). Left as is; not committed.

## 4. QC results
- check-types: clean. Lint (`eslint src/**/*.{ts,tsx}`): exit 0. `pnpm run compile`: exit 0.
- Full suite: baseline 548 → 561 passing, 0 failing (+11 long-form, +2 error-message).
- Revert check: clamp removed → 4 failing; restored → green.
- Regression sweep: reviewed the full source diff. Commit-message path unchanged (no `outputTokens` in its context; large-diff batch path untouched). Recovery retry rules unchanged (truncation is not retried).
- Not verified: live provider behavior (3.2); whether every provider accepts `max_tokens` 8192 (assumption A1).

## 5. Unfinished items
- 3.2 Manual provider run: blocked on the user's API keys. Steps: F5 → Extension Development Host → select Inception, then Mistral → Generate Changelog across ≥3 versions → export a support log; expect no `operation_failed`.

## 6. Handover summary
- Context: Root cause: every request was clamped to the ≤1024-token commit-message output reservation, and `loggedFetch` rejects truncated answers, so every changelog failed. The generic message came from the missing `invalid-response` case in `errorHandler`.
- Decisions: per-operation output budget (8192; reported maximum up to 16384; bounded by context room; never below the reservation); 180 s timeout for long-form; strict truncation kept; user Max Tokens respected; changelog sizing reserves 8192.
- State: done — 1.0–2.3, 3.1. blocked — 3.2 (needs keys). Not committed.
- Remaining tasks: 3.2 manual run (see §5); commit/PR when the user asks; restore dependency bumps with `git stash list` / `git stash pop` on the intended branch.
- Verification: `pnpm test` (561 passing), `pnpm run compile`.
- Risks and how to detect them early: a provider rejecting `max_tokens` 8192 (400 mentioning `max_tokens`); reasoning models still truncating ("output limit reached" message, `invalid_response` in support logs); slow providers hitting the 180 s timeout plus one retry.
