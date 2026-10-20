# Execution Ledger: Fix Ollama Cloud Commit Output Truncation & Max Tokens Override

| Field | Value |
|---|---|
| Objective | Ensure Ollama Cloud models generate complete commit messages without truncation, and allow user-configured Max Tokens in Advanced Model Configuration to be respected without being clamped to the 1024-token commit reservation. |
| Plan | `plans/fix-ollama-cloud-output-limit.md` |
| Status | Completed |
| Started | 2026-10-19 |
| Completed | 2026-10-19 |

## 1. Coverage Ledger

| ID | Name | Priority | Status | Acceptance Check | Evidence |
|---|---|---|---|---|---|
| 1.1 | Uncap user-configured Max Tokens in BaseAIProvider | must | done (verified) | When `merged?.maxTokens` is 4000, `options.maxTokens` resolves to 4000 (not clamped to 1024). | Verified in `base.ts`; bounds by `LONG_FORM_MAX_OUTPUT_TOKENS` and context room rather than `capabilities.outputTokens`. |
| 1.2 | Add regression tests for user Max Tokens override | must | done (verified) | `longFormOutput.test.ts` asserts user `maxTokens: 4000` is preserved on commit requests. | Passed in `pnpm test:generation` ("an explicit Max Tokens setting on commit requests is not clamped to the 1024 reservation"). |
| 2.1 | Add Ollama Cloud curated models to VERIFIED_LIMITS | must | done (verified) | `modelCapabilities("gpt-oss:120b-cloud")` returns 131072 context and 4096 output. | Added in `capabilities.ts`; verified in `ollamacloudIntegrationChecklist.test.ts`. |
| 2.2 | Update OllamaCloudProvider default output budget & prepareCapabilities | must | done (verified) | `OllamaCloudProvider` defaults to `max_tokens: 4096` and implements `prepareCapabilities`. | Verified in `ollamacloud.ts` and `longFormOutput.test.ts` (sends 4096). |
| 2.3 | Cache discovered model limits in OllamaCloudProvider.getModels | should | done (verified) | Discovered uncurated models record 131,072 context and 4,096 output reservation. | Added in `ollamacloud.ts:getModels`; calls `rememberModelLimits`. |
| 3.1 | Verify Ollama Cloud integration and checklist tests | must | done (verified) | `ollamacloudIntegrationChecklist.test.ts` and `aiProviders.test.ts` pass. | Added assertions in `ollamacloudIntegrationChecklist.test.ts`; test suite passes. |
| 3.2 | End-to-end regression run | must | done (verified) | `pnpm run check-types` 0 errors and `pnpm test:generation` 149/149 pass. | 0 errors in `check-types`, 0 errors in `lint`, 149/149 passed in `test:generation`, `pnpm run compile` passed. |

## 2. Delegation
- Tier assigned: None (all work executed sequentially with current model).

## 3. Deviations
- None.

## 4. QC Results
- `tsc --noEmit` (`check-types`): 0 errors
- `eslint "src/**/*.{ts,tsx}"` (`lint`): 0 errors
- `pnpm run compile`: Clean build (esbuild exit code 0)
- `node scripts/test-generation.mjs` (`test:generation`): 149/149 passed
- `node scripts/test-status.js` (`test:status`): READY FOR PUBLICATION

## 5. Unfinished Items
- None. All tasks completed and verified.

## 6. Handover Summary
- Context: Ollama Cloud commit generation previously failed with "output limit reached" because 1024 max tokens was insufficient for reasoning models, and user-configured Max Tokens in Advanced Model Configuration was clamped to 1024.
- Decisions: Unclamped user Max Tokens in `BaseAIProvider` so user settings are honored; increased default output tokens for Ollama Cloud to 4096; registered verified limits (128K context, 4K/8K output) for Ollama Cloud curated models; enabled large-model capability preparation.
- State: done (verified)
- Remaining tasks: None.
- Verification: Clean compilation, 0 lint/type errors, 149/149 generation tests passing.
- Risks and how to detect them early: All tests verify that real truncations still get flagged and user settings take effect without regressions.

