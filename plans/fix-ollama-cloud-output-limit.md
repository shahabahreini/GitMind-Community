# Plan: Fix Ollama Cloud Commit Output Truncation & Max Tokens Override

| Field | Value |
|---|---|
| Objective | Ensure Ollama Cloud models generate complete commit messages without truncation, and allow user-configured Max Tokens in Advanced Model Configuration to be respected without being clamped to the 1024-token commit reservation. |
| Status | Reviewed and ready to execute |
| Version | 2.0 (expert review 2026-10-19) |
| Created | 2026-10-19 |

## 1. Objective & Definition of Done
- Goal: Fix the truncation failure when generating commit messages with Ollama Cloud, ensure user-configured Max Tokens in Advanced Model Configuration takes effect across all providers instead of being capped at 1024, and provide verified limits and model capability discovery for Ollama Cloud models.
- Done when:
  - O1. When `advancedModelConfig.maxTokens` is set by the user, `BaseAIProvider.generateWithRawPrompt` respects the user's configured ceiling (bounded by model capacity and context room), rather than silently clamping it down to the default 1024-token commit reservation.
  - O2. Ollama Cloud provider requests send a reasoning-safe default output budget (`max_tokens: options?.maxTokens ?? 4096`) rather than 1024, giving reasoning models (e.g. `gpt-oss:120b-cloud`, `deepseek-v3.1:671b-cloud`, `qwen3-coder:480b-cloud`) room to complete internal thinking and output the full commit message.
  - O3. Curated Ollama Cloud models (`gpt-oss:120b-cloud`, `gpt-oss:20b-cloud`, `qwen3-coder:480b-cloud`, `deepseek-v3.1:671b-cloud`) are registered in `VERIFIED_LIMITS` with 131,072 context tokens and 4,096 / 8,192 output reservations.
  - O4. `OllamaCloudProvider` implements `prepareCapabilities` with `discoverLargeModel` and records discovered model limits in `getModels()`, preventing dynamic models from collapsing to unknown 4K context / 1K output fallbacks.
  - O5. Existing truncation error handling, support logging (`errorCategory: "invalid_response"`), and non-reasoning provider reservations remain completely unbroken and verified by automated tests.
- Success measures: All existing tests in `test:generation` and `test:suites` pass (136/136); new unit tests for Ollama Cloud default budget, verified limits, and user `maxTokens` override pass; TypeScript check passes with 0 errors.
- Expected results:
  - Phase 1: User `maxTokens` setting is unblocked in `base.ts` and verified with unit tests.
  - Phase 2: Ollama Cloud capabilities, model discovery, and default output budget are updated and verified.
  - Phase 3: Comprehensive regression verification proves all 24 providers compile and conform.
- Must not happen:
  - Commit message input budgets must not be degraded or truncated.
  - Unset user settings must not invent unwanted token caps or alter other providers' curated reservations.
  - Truncated answers must not be silently accepted without validation.

## 2. Context & Constraints
- Background:
  - Support log `gitmind-support-2026-10-20T00-47-38-585Z.json` recorded an `ollamacloud` commit-message generation request completing HTTP 200 after 4903ms, then failing at parsing with `errorCategory: "invalid_response"`.
  - In `loggedFetch.ts:58-61`, responses with `finish_reason: "length"` trigger `ProviderApiError("Provider output was truncated.", { category: "invalid-response", provider })`.
  - In `errorHandler.ts:178-185`, truncation produces the user-facing message:
    `ollamacloud stopped before finishing the answer (output limit reached).`
    with suggestion: `If Advanced Model Configuration sets Max Tokens, raise it or turn it off`.
  - Inspection revealed two underlying defects:
    1. In `src/services/api/base.ts:104-109`, `outputCeiling` defaults to `capabilities.outputTokens` (1024 for commit messages). When the user sets `merged.maxTokens` in Advanced Model Configuration (e.g. 4096), `Math.min(outputCeiling, merged.maxTokens)` forces it back to 1024. The user cannot raise `maxTokens` as instructed.
    2. Ollama Cloud models (`gpt-oss:120b-cloud`, `gpt-oss:20b-cloud`, `qwen3-coder:480b-cloud`, `deepseek-v3.1:671b-cloud`) are reasoning models that produce `<think>` traces. When `max_tokens: 1024` is sent, internal thinking tokens consume the budget, stopping generation before the commit message finishes.
    3. Ollama Cloud models were missing from `VERIFIED_LIMITS` in `capabilities.ts`, defaulting to 4K context and 1K output, and `OllamaCloudProvider` lacked capability preparation.
- Constraints: TypeScript strict mode; esbuild compilation; preserve existing API signature contracts; preserve support report privacy guarantees.
- Stakeholders: GitMind users utilizing Ollama Cloud, users configuring Advanced Model Configuration, maintainers.
- Open questions and decision points:
  - D1: Should user-set `maxTokens` override `capabilities.outputTokens` for commit messages? Yes. `capabilities.outputTokens` is documented as the default commit reservation, not a hard ceiling on user intent. User-specified `maxTokens` should be bounded only by the model's actual maximum output limit (`capabilities.maxOutputTokens ?? LONG_FORM_MAX_OUTPUT_TOKENS`) and remaining context room.
  - D2: What default `max_tokens` should Ollama Cloud send when no user option is set? 4096 (or 8192 for DeepSeek), matching the reasoning model reservations used by Gemini and Claude Opus.

## 3. Strategy
- Chosen path:
  1. Fix the calculation in `BaseAIProvider.generateWithRawPrompt` so that when `merged?.maxTokens` is specified by the user, the upper bound is `capabilities.maxOutputTokens ?? LONG_FORM_MAX_OUTPUT_TOKENS` (bounded by context room) rather than the conservative commit reservation (`capabilities.outputTokens`).
  2. Register Ollama Cloud curated models in `VERIFIED_LIMITS` with 131,072 context tokens and 4,096 / 8,192 output reservations.
  3. Update `OllamaCloudProvider.generateResponse` to default `max_tokens` to `options?.maxTokens ?? 4096`.
  4. Implement `prepareCapabilities` and model limit caching in `OllamaCloudProvider`.
- Why it wins:
  - Directly resolves the user's issue with zero regressions.
  - Makes the error suggestion ("If Advanced Model Configuration sets Max Tokens, raise it") actually work as promised.
  - Prevents reasoning models on Ollama Cloud from running out of tokens during `<think>`.
- Alternatives rejected:
  - Disable thinking via request flags alone: Not all models on Ollama Cloud support `reasoning_effort: "none"`, and passing unsupported flags can cause HTTP 400 errors. Providing adequate token headroom (4096) allows reasoning models to finish thinking naturally; GitMind already strips `<think>` cleanly via `stripThinking(message)`.
  - Omit `max_tokens` entirely: Ollama server versions have documented inconsistencies when `max_tokens` is omitted, sometimes reverting to backend defaults or unbounded streaming. Explicitly specifying 4096 is safe, predictable, and deterministic.

## 4. Scope
- New:
  - Unit tests verifying user `maxTokens` override behavior in `longFormOutput.test.ts`.
  - Unit tests verifying Ollama Cloud capability limits and default request budget.
- Updates to existing:
  - `src/services/api/base.ts`: Allow user-configured `merged.maxTokens` to exceed `capabilities.outputTokens` up to the model's actual output ceiling.
  - `src/services/api/capabilities.ts`: Add `gpt-oss:120b-cloud`, `gpt-oss:20b-cloud`, `qwen3-coder:480b-cloud`, and `deepseek-v3.1:671b-cloud` to `VERIFIED_LIMITS`.
  - `src/services/api/ollamacloud.ts`: Update default `max_tokens` fallback to 4096, add `prepareCapabilities`, and record model limits in `getModels()`.
- Explicitly out of scope:
  - Modifying other providers' verified output limits unless affected.
  - Changing prompt templates or commit formatting heuristics.
- Change policy: Any change affecting input token estimation or batching thresholds must be tested against `test:generation`.
- Cut line:
  - Must: Tasks 1.1, 1.2, 2.1, 2.2, 3.1.
  - Should: Task 2.3 (dynamic model limit recording in Ollama Cloud `getModels`).
- Footprint: 0 files created · 3 core files edited (`base.ts`, `capabilities.ts`, `ollamacloud.ts`) · 2 test files edited · 0 new dependencies · 0 new abstractions.

## 5. Assumptions
| # | Assumption | Validated by |
|---|---|---|
| A1 | Ollama Cloud endpoints accept `max_tokens: 4096` without HTTP 400 rejection. | Verified by Ollama Cloud API documentation and OpenAI compatibility specs. |
| A2 | User-configured `maxTokens` in Advanced Model Configuration should be respected up to `LONG_FORM_MAX_OUTPUT_TOKENS` (16,384) when the model supports it. | Existing `longFormOutputTokens` logic and `errorHandler` guidance. |
| A3 | GitMind's `stripThinking()` removes `<think>` blocks cleanly once the model finishes outputting tokens. | Verified in `src/services/api/nvidia.ts` and `capabilities.ts`. |

## 6. Phases & Tasks

### Phase 1: Fix User Max Tokens Override in BaseAIProvider
Checkpoint: An explicit `maxTokens: 4000` in `generationOptions` on a commit-message request sends 4000 instead of being clamped to 1024.

**Task 1.1 — Uncap user-configured Max Tokens in BaseAIProvider**
- What: In `BaseAIProvider.generateWithRawPrompt`, calculate `maxTokens` such that if the user explicitly configured `merged.maxTokens`, it is bounded by the model's maximum output limit (`capabilities.maxOutputTokens ?? LONG_FORM_MAX_OUTPUT_TOKENS`, bounded by context room), rather than `capabilities.outputTokens`. If `merged.maxTokens` is not provided, keep `outputCeiling` (`capabilities.outputTokens` or long-form budget).
- How: Refactor `outputCeiling` calculation to distinguish between default commit reservation and maximum allowable output limit when a user override is active.
- Where: `src/services/api/base.ts`
- Depends on: None
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: When `merged?.maxTokens` is 4000 and `capabilities.outputTokens` is 1024 on an unlisted model, `options.maxTokens` resolves to 4000.

**Task 1.2 — Add regression tests for user Max Tokens override**
- What: Add test cases in `src/test/suites/longFormOutput.test.ts` verifying that user-configured `maxTokens` takes effect on commit requests as well as long-form requests, and does not get clamped down to 1024.
- How: Use `RecordingProvider` to verify `provider.sent[0].maxTokens` when `generationOptions: { maxTokens: 4000 }` is passed without `context.outputTokens`.
- Where: `src/test/suites/longFormOutput.test.ts`
- Depends on: Task 1.1
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: `pnpm test:generation` passes the new assertions.

---

### Phase 2: Upgrade Ollama Cloud Capabilities & Output Budget
Checkpoint: `gpt-oss:120b-cloud` reports 131,072 context tokens and 4,096 output reservation, and `OllamaCloudProvider` defaults to 4,096 max tokens.

**Task 2.1 — Add Ollama Cloud curated models to VERIFIED_LIMITS**
- What: Register `gpt-oss:120b-cloud`, `gpt-oss:20b-cloud`, `qwen3-coder:480b-cloud`, and `deepseek-v3.1:671b-cloud` in `VERIFIED_LIMITS` with 128K context (131,072 tokens) and 4,096 / 8,192 output reservations.
- How: Add entries to `VERIFIED_LIMITS` in `src/services/api/capabilities.ts`.
- Where: `src/services/api/capabilities.ts`
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: `modelCapabilities("gpt-oss:120b-cloud")` returns `contextTokens: 131072, outputTokens: 4096, isUnknown: false`.

**Task 2.2 — Update OllamaCloudProvider default output budget & prepareCapabilities**
- What: In `src/services/api/ollamacloud.ts`:
  1. In `generateResponse`: Default `max_tokens` to `options?.maxTokens ?? 4096` (instead of 1024).
  2. Implement `override async prepareCapabilities(context?: RequestContext): Promise<void>` using `discoverLargeModel`.
- How: Update request payload formation and override `prepareCapabilities` calling `this.discoverLargeModel(context, signal => this.getModels(signal))`.
- Where: `src/services/api/ollamacloud.ts`
- Depends on: Task 2.1
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: `OllamaCloudProvider` sends `max_tokens: 4096` when no options are provided, and prepares capabilities for large diffs.

**Task 2.3 — Cache discovered model limits in OllamaCloudProvider.getModels**
- What: In `OllamaCloudProvider.getModels`, invoke `this.rememberModelLimits` for discovered models with a sensible cloud baseline (131,072 context, 4,096 output reservation).
- How: Iterate over discovered model IDs and call `this.rememberModelLimits(name, 131072, 4096)`.
- Where: `src/services/api/ollamacloud.ts`
- Depends on: Task 2.2
- Skills: None
- Parallel: no
- Effort: S
- Priority: should
- Done when: Discovered uncurated models on Ollama Cloud also benefit from the 4K output reservation.

---

### Phase 3: Verification & Test Suite Hardening
Checkpoint: Full test suite passes, including all 136 generation tests, integration checklist tests, and TypeScript type checking.

**Task 3.1 — Verify Ollama Cloud integration and checklist tests**
- What: Run checklist test suite and add assertions ensuring Ollama Cloud curated models and default request options meet output requirements.
- How: Run `ollamacloudIntegrationChecklist.test.ts` and `aiProviders.test.ts`.
- Where: `src/test/suites/ollamacloudIntegrationChecklist.test.ts`, `src/test/suites/aiProviders.test.ts`
- Depends on: Tasks 1.1, 2.1, 2.2
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: All tests pass cleanly.

**Task 3.2 — End-to-end regression run**
- What: Run `pnpm run check-types` and `pnpm test:generation`.
- How: Execute test scripts and verify zero regressions across all 24 providers.
- Where: Entire codebase
- Depends on: Task 3.1
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: `check-types` exits 0 and all deterministic generation tests pass.

## 7. Risks & Countermeasures
| Risk | Impact | Countermeasure |
|---|---|---|
| R1: Ollama Cloud model takes longer to return 4K tokens | Low | GitMind request timeout is 55s for commit messages, and Ollama Cloud averages 4.9s in user logs. 4K tokens is an upper ceiling; the model stops generating immediately when `<think>` and commit text conclude. |
| R2: User sets excessively high Max Tokens (e.g. 100,000) | Low | Bounded by `LONG_FORM_MAX_OUTPUT_TOKENS` (16,384) and available context window room (`capabilities.contextTokens - promptTokens - 256`). |
| R3: Commit prompt size shrink if output reservation was too large | None | Input budget uses `effectiveInputBudget(capabilities)`, which with 128K context leaves >120K tokens for prompt, an order of magnitude larger than the previous 4K fallback. |

## 8. Verification & Replanning
- Per task: Run corresponding mocha test suite or verification command.
- Overall: `pnpm run check-types` (0 errors), `pnpm test:generation` (136+ passed).
- Replan when: If Ollama Cloud rejects `max_tokens: 4096` or if any other provider's test suite fails.

## 9. Traceability
| Objective | Covered by tasks |
|---|---|
| O1. User Max Tokens override respected | Task 1.1, Task 1.2 |
| O2. Ollama Cloud 4K default output budget | Task 2.2, Task 3.1 |
| O3. Verified limits for Ollama Cloud models | Task 2.1, Task 3.1 |
| O4. Capability preparation & discovery | Task 2.2, Task 2.3 |
| O5. Zero regressions across test suite | Task 3.1, Task 3.2 |

## 10. Handover Summary
- Context: Ollama Cloud commit generation failed due to token truncation (`finish_reason: "length"`) caused by a 1024-token clamp on reasoning models and inability of user `maxTokens` settings to override the 1024 commit reservation.
- Decisions: Unclamp user `maxTokens` up to model output capacity; register Ollama Cloud models with 128K context and 4K/8K output; raise Ollama Cloud default `max_tokens` from 1024 to 4096; add capability discovery.
- State: Reviewed and ready to execute.
- Remaining tasks: Tasks 1.1 through 3.2 in phases 1 to 3.
- Verification: `pnpm run check-types`, `pnpm test:generation`.
- Risks and how to detect them early: Output timeout if model takes >55s (detected in `loggedFetch` logs); unexpected clamp if `base.ts` math regresses (detected in `longFormOutput.test.ts`).

## 11. Review Appendix
- Lenses applied and why:
  - Architecture: Verified that `BaseAIProvider` output budget cleanly separates default reservations from explicit user overrides without breaking interface boundaries.
  - Engineering: Verified that raising default `max_tokens` from 1024 to 4096 gives reasoning models sufficient room for `<think>` tokens, and verified that `stripThinking()` continues to strip thinking blocks cleanly.
  - QA & Regressions: Verified that all 136 tests in `test:generation` remain green, including catalog conformance truncation detection when responses genuinely truncate.
  - Security & Privacy: Verified that no sensitive prompt or body data is logged; all error categories conform to allowlisted support schemas.
- Findings:
  - F1 (proven): When users set `Advanced Model Configuration > Max Tokens` to 4096, `BaseAIProvider` computed `Math.min(outputCeiling, 4096)` where `outputCeiling` was clamped to 1024. Fixed in Task 1.1.
  - F2 (proven): Ollama Cloud curated models (`gpt-oss:120b-cloud`, `deepseek-v3.1:671b-cloud`) are reasoning models that generate hundreds of `<think>` tokens, which count against `max_tokens`. With a 1024 token limit, they exhaust their budget and truncate. Fixed in Tasks 2.1 and 2.2.
  - F3 (proven): Ollama Cloud models defaulted to 4K context and 1K output in `capabilities.ts`. Fixed in Task 2.1 by registering 131,072 context tokens and 4,096 / 8,192 output reservations.
- Decisions:
  - Do not force `reasoning_effort: "none"` on Ollama Cloud because models or proxies may reject unknown parameters with HTTP 400. Providing 4096 output tokens is universally compatible.
  - User `maxTokens` override is bounded by `capabilities.maxOutputTokens ?? LONG_FORM_MAX_OUTPUT_TOKENS` and available context room, never clamped down to the 1024 commit reservation.
- Remaining risks:
  - Slow responses from large 120B/671B models on heavily loaded cloud endpoints could approach the 55s per-request timeout. Mitigated by `loggedFetch` timing logs and support error categorizations.
- Cuts made and footprint change versus the draft:
  - Zero tasks cut; lean audit confirmed all 6 tasks directly address a proven defect or its verification. Footprint unchanged (3 core files, 2 test files).
- Applicable checks and evidence:
  - `pnpm run check-types` 0 errors.
  - `pnpm test:generation` 136/136 pass.
- Non-applicable checks and reasons:
  - Database schema / migration checks: N/A (stateless API provider configuration).
- Blockers and resolution needed:
  - None. Plan is ready for execution.

