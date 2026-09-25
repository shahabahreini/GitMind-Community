# Plan: Groq API Modernization and Model Discovery Fix

| Field | Value |
|---|---|
| Objective | Modernize GitMind's Groq provider adapter to align with official September 2026 Groq API documentation, resolve model decommission 404/403 failures, filter valid chat models in live discovery, prevent reasoning token truncation, and auto-migrate retired model settings. |
| Status | Ready for review |
| Version | 1.0.0 |
| Created | 2026-09-25 |

## 1. Objective & Definition of Done
- Goal: Fix GitMind's Groq communication and model fetching by replacing decommissioned Meta Llama 3 models (`llama-3.3-70b-versatile` and `llama-3.1-8b-instant`) with official recommended replacements (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, and `qwen/qwen3.8-27b`), filtering non-chat models (audio, TTS, guardrails, rerankers) from live model discovery, expanding the completion token budget to prevent reasoning starvation, normalizing API errors to `ProviderApiError`, and auto-migrating legacy user configurations.
- Done when:
  1. Default Groq model across `providerCatalog.ts`, `package.json`, and `settings.ts` is `openai/gpt-oss-120b`.
  2. Curated Groq models are `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, and `qwen/qwen3.8-27b`.
  3. `SettingsMigrationService` auto-migrates saved `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` settings to `openai/gpt-oss-120b` while recording previous values.
  4. `GroqProvider.getModels()` filters out inactive models (`active === false`) and non-chat models (`whisper`, `orpheus`, `tts`, `guard`, `safeguard`, `rerank`, `embed`), returning only chat-capable completion models, and gracefully falls back to curated models on API failure.
  5. `GroqProvider.generateResponse()` supplies adequate token headroom (`max_completion_tokens: options?.maxTokens ?? 1000`), handles reasoning model output cleanly via `stripThinking`, enforces commit message formatting, and raises typed `ProviderApiError` with HTTP status and code so diagnostics classify errors into proper categories (e.g. `permission`, `authentication`, `model-limit`, `rate-limit`) instead of `unknown`.
  6. Documentation (`provider-contracts-2026-09.md`, `groq.md`, `Complete-Settings-Reference.md`, `Providers-And-Models.md`, `gitmind-user-surface.json`) is updated, type checking passes (`pnpm run check-types`), and test suites compile and pass.
- Success measures:
  - Zero 404 or 403 errors when generating commit messages with default Groq settings.
  - Live model loading populates only valid chat models into the settings dropdown.
  - Support log diagnostics record granular error categories rather than `unknown`.
  - Full regression test suite and documentation validators pass cleanly.
- Must not happen:
  - Must not break existing user API keys or custom user-specified model strings.
  - Must not include non-chat models (such as `whisper-large-v3` or `llama-prompt-guard-2-22m`) in the commit generation model selection.
  - Must not leak `<think>` tags or reasoning chains into generated commit messages.
  - Must not log private diffs, prompts, or API keys in diagnostics or support traces.

## 2. Context & Constraints
- Background:
  - Support session log `gitmind-support-2026-09-25T22-33-18-217Z.json` captured two failed `generate_commit` requests against Groq (`httpStatus: 404` and `httpStatus: 403`), bookended by a successful `provider_request` (`httpStatus: 200` to `/models`). Both failures were classified as `errorCategory: "unknown"`.
  - Verification against official Groq documentation (`https://console.groq.com/docs/models` and `https://console.groq.com/docs/deprecations`) established that on 2026-08-16, Groq shut down public developer access to `llama-3.3-70b-versatile` (returning 404) and restricted `llama-3.1-8b-instant` to Enterprise ("ContactSales", returning 403 to developer keys).
  - Groq's official recommended replacements are `openai/gpt-oss-120b` (flagship 120B model) and `openai/gpt-oss-20b` (fast 20B model), along with `qwen/qwen3.8-27b`.
  - Furthermore, `GroqProvider` lacked chat-model filtering in `getModels()` (loading audio, TTS, and guardrail models into the commit model dropdown), used an inadequate token budget (`max_completion_tokens: 150`) which starves reasoning models, lacked thinking tag stripping, and caught all errors into untyped generic errors which masked root causes in support logs.
- Constraints:
  - Node.js >= 24.15.0, VS Code extension API ^1.101.0.
  - Must preserve privacy invariant in `loggedFetch`: never log request bodies, diffs, prompts, or API keys.
  - Must adhere to established repository architecture: `PROVIDER_CATALOG` in `src/config/providerCatalog.ts` is the single source of truth for runtime metadata; `package.json` contributes configuration properties.
  - Reversible migration: any migrated settings must store replaced values in `globalState` under `gitmind.migration.retiredModelPrevious`.
- Stakeholders:
  - GitMind extension users using Groq for fast inference.
  - Extension maintainers reviewing release readiness and telemetry diagnostics.
- Open questions and decision points:
  - N/A: Root cause proven directly by support log correlation and official Groq documentation; implementation pattern follows existing audited providers (`NvidiaProvider` and `TogetherAIProvider`).

## 3. Strategy
- Chosen path:
  1. Catalog & Schema Modernization: Update `PROVIDER_CATALOG.groq` default model to `openai/gpt-oss-120b` and curated models to `["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]`. Update `package.json` and `src/config/types.ts`.
  2. Automatic Migration: Add `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` to `RETIRED_SHIPPED_MODEL_DEFAULTS.groq` in `src/services/migration/SettingsMigrationService.ts`.
  3. Provider Modernization:
     - Add `filterGroqChatModels` in `src/services/api/groq.ts` to filter out non-chat models (`whisper`, `orpheus`, `tts`, `guard`, `safeguard`, `rerank`, `embed`) and inactive models (`active: false`), with sorted output and fallback to curated defaults.
     - Enhance `generateResponse` in `src/services/api/groq.ts`: increase default `max_completion_tokens` to 1000, strip reasoning traces (`stripThinking`), enforce commit formatting (`enforceCommitMessageFormat`), and parse HTTP error responses into `ProviderApiError` with accurate status and codes.
  4. Documentation & Verification: Update handbook provider docs, research inventory, export product surface, and extend unit/integration tests.
- Why it wins:
  - Immediately restores Groq functionality for both new and existing users without manual reconfiguration.
  - Eliminates invalid non-chat models from the UI dropdown, preventing user confusion and subsequent 400/404 errors.
  - Provides robust reasoning model support (`gpt-oss`, `qwen`) without output truncation or thinking-trace contamination in git commit histories.
  - Standardizes error classification so future support logs provide actionable diagnostics instead of `unknown`.
- Alternatives rejected:
  - Keeping `llama-3.3-70b-versatile` as default: Rejected because Groq shut it down on 2026-08-16; it yields 100% failure rate (HTTP 404).
  - Passing `reasoning_format: "hidden"` blindly to all Groq calls: Rejected because Groq API returns HTTP 400 Bad Request if `reasoning_format` is sent to non-reasoning models. Using `stripThinking` on output is model-agnostic, safe, and robust.

## 4. Scope
- New:
  - `filterGroqChatModels(models: unknown): string[]` utility function in `src/services/api/groq.ts`.
  - Comprehensive unit tests in `src/test/suites/providerRefresh.test.ts` verifying Groq model filtering and retired model migration.
- Updates to existing:
  - `src/config/providerCatalog.ts`: Groq default model changed to `openai/gpt-oss-120b`; curated models updated to `["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]`.
  - `package.json`: Groq model default and enum updated.
  - `src/config/types.ts`: `GroqModel` type union updated to include new models while retaining legacy models for backwards compatibility.
  - `src/services/migration/SettingsMigrationService.ts`: `RETIRED_SHIPPED_MODEL_DEFAULTS.groq` updated with `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.
  - `src/services/api/groq.ts`: `getModels()`, `generateResponse()`, and error parsing overhauled.
  - `docs/research/provider-contracts-2026-09.md`: Groq contract row updated with 2026-09 verification and replacement rationale.
  - `docs/handbook/providers/groq.md`, `docs/handbook/Complete-Settings-Reference.md`, `docs/handbook/Providers-And-Models.md`: Documentation refreshed.
  - `docs/reference/gitmind-user-surface.json`: Synchronized via `pnpm run docs:export-product-surface`.
- Explicitly out of scope:
  - Changing authentication mechanism (API key via `Authorization: Bearer <key>` is unchanged).
  - Modifying providers other than Groq.
  - Adding non-chat audio/voice transcription features to GitMind.
- Change policy:
  - Any breaking schema modification requires a configuration migration entry in `SettingsMigrationService`.
  - Curated model choices must strictly reflect models listed as active on `console.groq.com/docs/models`.
- Cut line:
  - All tasks in Phase 1 and Phase 2 are `must`. Optional docs cosmetic touches are `should` and sit below the cut line if needed.

## 5. Assumptions
| # | Assumption | Validated by |
|---|---|---|
| A1 | `openai/gpt-oss-120b` and `openai/gpt-oss-20b` are active production models on Groq available to developer plan accounts | Groq Supported Models documentation (`https://console.groq.com/docs/models`) and deprecation schedule (`https://console.groq.com/docs/deprecations`) |
| A2 | Groq `/models` endpoint returns an object with a `data` array containing model objects with `id` and optional `active` flag | Live Groq documentation and API specifications |
| A3 | Decommissioned models `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` return 404 or 403 on chat completions | Captured directly in support session log `gitmind-support-2026-09-25T22-33-18-217Z.json` events 5 and 13 |
| A4 | `stripThinking` regex cleanly removes `<think>...</think>` traces without affecting valid markdown commit body | Tested in `src/services/api/nvidia.ts` and proven on reasoning models |

## 6. Phases & Tasks

### Phase 1: Catalog, Migration, and Provider Core
Checkpoint: Groq catalog defaults and migration paths updated, model filtering implemented, and provider response handling modernized.

**Task 1.1 — Update Groq Provider Catalog and Configuration Schema**
- What: Update Groq default model to `openai/gpt-oss-120b` and curated models to `["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]` across catalog, schema, and types.
- How: Edit `src/config/providerCatalog.ts`, `package.json`, and `src/config/types.ts`.
- Where: `src/config/providerCatalog.ts`, `package.json`, `src/config/types.ts`
- Depends on: None
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: `getProviderDefaultModel("groq")` returns `"openai/gpt-oss-120b"`, `curatedModels` contains the 3 active models, and `package.json` reflects the new default and enum options.

**Task 1.2 — Add Retired Model Migration for Groq**
- What: Add decommissioned Llama 3 models to `RETIRED_SHIPPED_MODEL_DEFAULTS.groq` so existing users with stored defaults are automatically upgraded.
- How: Add `'llama-3.3-70b-versatile'` and `'llama-3.1-8b-instant'` to `RETIRED_SHIPPED_MODEL_DEFAULTS.groq` in `src/services/migration/SettingsMigrationService.ts`.
- Where: `src/services/migration/SettingsMigrationService.ts`
- Depends on: Task 1.1
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: Calling `migrateRetiredModelDefaults` moves configured `llama-3.3-70b-versatile` or `llama-3.1-8b-instant` to `openai/gpt-oss-120b` and preserves the previous value in `globalState`.

**Task 1.3 — Implement Chat Model Filtering and Resilient Discovery in GroqProvider**
- What: Filter out non-chat models (audio, TTS, guardrails, rerankers, inactive models) from Groq's `/models` response, and fall back to curated models on failure.
- How: Implement `filterGroqChatModels(models: unknown): string[]` in `src/services/api/groq.ts` matching non-chat markers (`whisper`, `orpheus`, `tts`, `guard`, `safeguard`, `rerank`, `embed`), check `model.active !== false`, sort results, and update `getModels()` to use it with curated fallback.
- Where: `src/services/api/groq.ts`
- Depends on: Task 1.1
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: `fetchGroqModels` returns only chat-capable models and returns curated fallback when the API call fails or returns no valid models.

**Task 1.4 — Modernize Generation and Error Classification in GroqProvider**
- What: Increase completion token budget, strip reasoning traces, enforce commit message format, and throw typed `ProviderApiError`.
- How: In `GroqProvider.generateResponse()`:
  - Set `max_completion_tokens: options?.maxTokens ?? 1000`.
  - Apply `stripThinking` and `this.enforceCommitMessageFormat(...)`.
  - Parse error responses into `ProviderApiError` with HTTP status, error message, and provider name so `classifyGenerationFailure` properly maps them to `permission`, `authentication`, `model-limit`, `rate-limit`, etc.
- Where: `src/services/api/groq.ts`
- Depends on: Task 1.1
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: HTTP 403 maps to `permission`, HTTP 404 maps to `model-limit` or clean not-found message, HTTP 429 maps to `rate-limit`, reasoning tags are stripped from output, and commit formatting is enforced.

### Phase 2: Tests, Documentation, and Verification
Checkpoint: Tests verify model filtering, migration, and error classification; docs and product surface are updated and validated.

**Task 2.1 — Add Unit and Integration Tests for Groq Provider**
- What: Add tests for Groq model filtering, retired model migration, and error normalization.
- How: In `src/test/suites/providerRefresh.test.ts`, add test cases verifying:
  - `RETIRED_SHIPPED_MODEL_DEFAULTS.groq` migrates `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.
  - `filterGroqChatModels` filters whisper, guard, and inactive models while keeping `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, and `qwen/qwen3.8-27b`.
  - Groq `ProviderApiError` mapping preserves status code and error classification.
- Where: `src/test/suites/providerRefresh.test.ts`
- Depends on: Phase 1
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when: `pnpm run compile-tests` and test runner execute and pass the new test assertions.

**Task 2.2 — Update Documentation and Synchronize Product Surface**
- What: Update provider research inventory, handbook documentation, and re-export the product surface JSON.
- How:
  - Update `docs/research/provider-contracts-2026-09.md` Groq entry with 2026-09-25 re-verification and replacement rationale.
  - Update `docs/handbook/providers/groq.md`, `docs/handbook/Complete-Settings-Reference.md`, and `docs/handbook/Providers-And-Models.md`.
  - Run `pnpm run docs:export-product-surface` and `pnpm run docs:validate`.
- Where: `docs/research/provider-contracts-2026-09.md`, `docs/handbook/`, `docs/reference/gitmind-user-surface.json`
- Depends on: Task 1.1, Task 1.2
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: `pnpm run docs:validate` succeeds with 0 errors and `gitmind-user-surface.json` reflects the new Groq default model.

**Task 2.3 — End-to-End Build and Verification**
- What: Run type check, linting, packaging prep, and test validation.
- How: Run `pnpm run check-types`, `pnpm run lint`, `pnpm run compile-tests`, and `pnpm run test:validate`.
- Where: Entire repository
- Depends on: Tasks 2.1, 2.2
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: Type checking passes with 0 errors, lint passes, and all tests validate successfully.

## 7. Risks & Countermeasures
| Risk | Impact | Countermeasure |
|---|---|---|
| User with existing `llama-3.3-70b-versatile` setting continues to experience 404 errors | High | `SettingsMigrationService.migrateRetiredModelDefaults` automatically upgrades retired shipped defaults to `openai/gpt-oss-120b` on startup |
| Groq `/models` endpoint returns models with unknown format or fails due to network outage | Medium | `GroqProvider.getModels()` safely catches errors and returns `curatedModels` as fallback, ensuring dropdown is never empty |
| Reasoning models (`gpt-oss-120b`, `qwen3.8-27b`) generate thinking traces that corrupt commit messages | High | Apply `stripThinking` regex to strip `<think>...</think>` traces and enforce format before returning completion |
| Groq rate limit (TPM/RPM) exceeded on free tier | Medium | Normalized `ProviderApiError` with status 429 informs user clearly with rate-limit guidance instead of generic crash |

## 8. Verification & Replanning
- Per task:
  - Task 1.1: Verify `getProviderDefaultModel("groq") === "openai/gpt-oss-120b"` and `package.json` parses cleanly.
  - Task 1.2: Unit test confirms migration of `'llama-3.3-70b-versatile'` and `'llama-3.1-8b-instant'`.
  - Task 1.3: Unit test confirms `filterGroqChatModels` excludes audio, tts, and guard models and includes chat models.
  - Task 1.4: Unit test confirms error status propagation and token budget parameter.
  - Task 2.1: `pnpm run compile-tests` compiles without type errors and test suites pass.
  - Task 2.2: `pnpm run docs:validate` passes cleanly.
  - Task 2.3: `pnpm run check-types` and `pnpm run test:validate` pass with 0 errors.
- Overall: Complete build, lint, type check, and documentation validation pass cleanly.
- Replan when:
  - Groq API deprecates additional models or alters endpoint URLs.
  - Groq introduces a dedicated chat-only query filter on `GET /models`.

## 9. Traceability
| Objective | Covered by tasks |
|---|---|
| Resolve 404 / 403 decommission failures | Task 1.1, Task 1.2, Task 1.4 |
| Filter valid chat models from live discovery | Task 1.3 |
| Prevent reasoning token truncation & trace pollution | Task 1.4 |
| Auto-migrate retired user settings | Task 1.2, Task 2.1 |
| Ensure diagnostics categorize errors properly | Task 1.4, Task 2.1 |
| Maintain docs & surface consistency | Task 2.2, Task 2.3 |

## 10. Handover Summary
- Context: GitMind's Groq integration was failing with HTTP 404 and 403 errors because Meta Llama 3 models were decommissioned by Groq on 2026-08-16. Furthermore, live model discovery lacked chat-model filtering, and reasoning models experienced token starvation and unclassified errors.
- Decisions: Upgraded default to `openai/gpt-oss-120b`, curated models to `["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]`, added automatic settings migration for retired models, added `filterGroqChatModels` to filter non-chat models, raised completion token budget to 1000, added thinking tag stripping, and standardized error parsing to `ProviderApiError`.
- State: Pending review and execution.
- Remaining tasks: Execute Tasks 1.1 through 2.3 in order.
- Verification: `pnpm run check-types`, `pnpm run compile-tests`, `pnpm run test:validate`, and `pnpm run docs:validate`.
- Risks and how to detect them early: Verify `SettingsMigrationService` tests to ensure retired defaults are cleanly upgraded without resetting custom models.
