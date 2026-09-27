# Plan: Comprehensive AI Provider API Audit & Modernization

| Field | Value |
|---|---|
| Objective | Audit all 22 remaining AI providers in GitMind to verify updated models, endpoints, communications, and error handling, fixing discrepancies found during audit |
| Status | Ready for review |
| Version | 1.0.0 |
| Created | 2026-09-27 |

## 1. Objective & Definition of Done
- Goal: Ensure all GitMind providers (Gemini, Hugging Face, Ollama, Mistral, Cohere, OpenAI, Together AI, OpenRouter, Anthropic, MiniMax, GitHub Copilot, DeepSeek, xAI Grok, Groq, Perplexity, Z.ai, NVIDIA NIM, LM Studio, Azure OpenAI, Amazon Bedrock, Vertex AI, Cloudflare Workers AI, Custom API) use active models, correct endpoint URLs, proper auth headers, robust model discovery, and accurate error parsing.
- Done when:
  1. All discovered discrepancies across providers are fixed:
     - NVIDIA NIM (`nvidia.ts`): Replace retired `meta/llama-3.3-70b-instruct` in `DEFAULT_MODELS`, `fetchNvidiaModels`, and `validateNvidiaAPIKey` with active default `nvidia/nemotron-3-super-120b-a12b`.
     - MiniMax (`minimax.ts`): Update fallback config and model list to prioritize `MiniMax-M3`, remove retired `MiniMax-M2.5` from fallback list, and use `MiniMax-M3` in `validateMiniMaxAPIKey`.
     - Z.ai (`zai.ts`): Update `getModels()` and `validateApiKey()` to use current models (`glm-5.3`) and curated models rather than stale hardcoded GLM-5.1 list.
     - Cohere Validation (`validation.ts`): Fix `validateCohereApiKey` to call `https://api.cohere.com/v2/chat` with active model instead of deprecated `https://api.cohere.ai/v1/tokenize`.
     - DeepSeek (`deepseek.ts`): Update `validateApiKey()` to use canonical `deepseek-flash` instead of legacy `deepseek-v4-flash`.
     - OpenAI (`openai.ts`): Update fallback config to `gpt-6-sol` and prioritize `gpt-6` models at the top of the model discovery list.
     - OpenAI-Compatible (`openaiCompatible.ts`): Extract and bubble response error details for LM Studio, Azure OpenAI, and Cloudflare.
     - OpenRouter (`openrouter.ts`): Extract and format JSON error messages.
  2. All tests pass (`pnpm run check-types`, `pnpm run lint`, `pnpm run test:validate`, `pnpm run docs:validate`).
- Success measures: 0 failed tests, 0 lint errors, clean typecheck, consistent model lifecycles across all providers.
- Must not happen: Secret leakage in logs or error messages; breaking changes to user settings; regressing existing validated providers.

## 2. Context & Constraints
- Context: GitMind targets late September 2026 specifications. Groq was modernized previously. Perplexity was migrated to the Agent API ahead of Sonar sunset on 2026-09-27.
- Constraints: Maintain documentation integrity and pass `pnpm run docs:validate`. Keep secrets redacted in `loggedFetch`.

## 3. Strategy
- Group fixes by provider adapter and shared utilities.
- Perform changes surgically in:
  1. `src/services/api/nvidia.ts`
  2. `src/services/api/minimax.ts`
  3. `src/services/api/zai.ts`
  4. `src/services/api/validation.ts`
  5. `src/services/api/deepseek.ts`
  6. `src/services/api/openai.ts`
  7. `src/services/api/openaiCompatible.ts`
  8. `src/services/api/openrouter.ts`
- Verify with unit tests in `src/test/unit/` and documentation validator.

## 4. Scope
- New: Robust error parsing in `openaiCompatible.ts` and `openrouter.ts`.
- Updates to existing:
  - `src/services/api/nvidia.ts`
  - `src/services/api/minimax.ts`
  - `src/services/api/zai.ts`
  - `src/services/api/validation.ts`
  - `src/services/api/deepseek.ts`
  - `src/services/api/openai.ts`
- Out of scope: Adding new providers; altering Pro entitlements.

## 5. Assumptions
| # | Assumption | Validated by |
|---|---|---|
| A1 | `nvidia/nemotron-3-super-120b-a12b` is active and accepts standard chat completions | NVIDIA NIM API docs & `providerCatalog.ts` |
| A2 | Cohere validation should use Chat API v2 on `api.cohere.com` | `src/services/api/cohere.ts` |
| A3 | Z.ai and MiniMax curated models in `providerCatalog.ts` represent latest supported choices | `src/config/providerCatalog.ts` |

## 6. Phases & Tasks
### Phase 1: Provider Adapter Fixes
- Task 1.1: Fix `src/services/api/nvidia.ts` default model and validation model references.
- Task 1.2: Fix `src/services/api/minimax.ts` default model fallback, curated list, and validation.
- Task 1.3: Fix `src/services/api/zai.ts` models list and validation to use `glm-5.3`.
- Task 1.4: Fix `src/services/api/deepseek.ts` validation to use `deepseek-flash`.
- Task 1.5: Fix `src/services/api/openai.ts` fallback config and priority sorting for `gpt-6`.
- Task 1.6: Enhance `src/services/api/openaiCompatible.ts` and `src/services/api/openrouter.ts` error message parsing.

### Phase 2: Validation Service Synchronization
- Task 2.1: Fix `src/services/api/validation.ts` Cohere validator to use `api.cohere.com` / `validateCohereAPIKey`.

### Phase 3: Verification & Test Execution
- Task 3.1: Run `pnpm run check-types` and `pnpm run lint`.
- Task 3.2: Run `pnpm run compile-tests` and `pnpm run test:validate`.
- Task 3.3: Run `pnpm run docs:validate`.

## 7. Risks & Countermeasures
| Risk | Impact | Countermeasure |
|---|---|---|
| Stale model in validation causes false connection failure | High | Always source validation model from `getProviderDefaultModel()` |
| Error extraction fails on non-JSON response | Low | Wrap JSON parse in try/catch and fall back to raw text |
