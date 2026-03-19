---
name: api
description: "Skill for the Api area of GitMind-Pro. 212 symbols across 36 files."
---

# Api

212 symbols | 36 files | Cohesion: 71%

## When to Use

- Working with code in `src/`
- Understanding how fetchTogetherModels, fetchOpenRouterModels, fetchMistralModels work
- Modifying api-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/services/api/index.ts` | applyAdvancedModelConfigDefaults, generateMessageWithConfig, promptForApiKey, getApiKeyFromUser, processLargeDiff (+19) |
| `src/services/api/prompts.ts` | validatePromptLength, getPromptConfig, generateCommitHistoryAnalysisPrompt, getLanguageInstructions, getBaseInstructions (+14) |
| `src/services/api/validation.ts` | checkOllamaAvailability, validateCohereApiKey, validateTogetherApiKey, validateOpenRouterApiKey, validateAnthropicApiKey (+6) |
| `src/services/api/together.ts` | TogetherAIProvider, getModels, validateApiKey, fetchTogetherModels, formatBytes (+4) |
| `src/services/api/zai.ts` | validateApiKey, generateResponse, getUserFriendlyErrorMessage, formatCommitMessage, validateZaiAPIKey (+3) |
| `src/services/api/openai.ts` | validateApiKey, OpenAIProvider, generateResponse, getModels, getPriority (+3) |
| `src/services/api/copilot.ts` | getPreferredCopilotModelIds, resolveCopilotChatModel, generateResponse, getModels, validateApiKey (+3) |
| `src/services/api/custom.ts` | validateApiKey, validateCustomAPI, buildBody, generateResponse, buildRequestBody (+3) |
| `src/services/api/gemini.ts` | getEffectiveGeminiModel, GeminiProvider, generateResponse, getModels, validateApiKey (+3) |
| `src/services/api/mistral.ts` | MistralProvider, getModels, validateApiKey, fetchMistralModels, extractRateLimits (+2) |

## Entry Points

Start here when exploring this area:

- **`fetchTogetherModels`** (Function) — `src/services/api/together.ts:369`
- **`fetchOpenRouterModels`** (Function) — `src/services/api/openrouter.ts:170`
- **`fetchMistralModels`** (Function) — `src/services/api/mistral.ts:202`
- **`loggedFetch`** (Function) — `src/services/api/loggedFetch.ts:107`
- **`checkHuggingFaceModel`** (Function) — `src/services/api/huggingface.ts:239`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `TogetherAIProvider` | Class | `src/services/api/together.ts` | 28 |
| `OpenRouterProvider` | Class | `src/services/api/openrouter.ts` | 4 |
| `MistralProvider` | Class | `src/services/api/mistral.ts` | 19 |
| `GroqProvider` | Class | `src/services/api/groq.ts` | 8 |
| `GrokProvider` | Class | `src/services/api/grok.ts` | 67 |
| `CohereProvider` | Class | `src/services/api/cohere.ts` | 108 |
| `AnthropicProvider` | Class | `src/services/api/anthropic.ts` | 33 |
| `DiffProcessor` | Class | `src/services/diffProcessor.ts` | 5 |
| `RequestManager` | Class | `src/utils/requestManager.ts` | 0 |
| `GeminiProvider` | Class | `src/services/api/gemini.ts` | 74 |
| `OpenAIProvider` | Class | `src/services/api/openai.ts` | 117 |
| `DeepSeekProvider` | Class | `src/services/api/deepseek.ts` | 22 |
| `ZaiProvider` | Class | `src/services/api/zai.ts` | 15 |
| `HuggingFaceProvider` | Class | `src/services/api/huggingface.ts` | 15 |
| `fetchTogetherModels` | Function | `src/services/api/together.ts` | 369 |
| `fetchOpenRouterModels` | Function | `src/services/api/openrouter.ts` | 170 |
| `fetchMistralModels` | Function | `src/services/api/mistral.ts` | 202 |
| `loggedFetch` | Function | `src/services/api/loggedFetch.ts` | 107 |
| `checkHuggingFaceModel` | Function | `src/services/api/huggingface.ts` | 239 |
| `fetchGroqModels` | Function | `src/services/api/groq.ts` | 298 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `GenerateCommitMessage → GetPlainTextApiKey` | cross_community | 10 |
| `GenerateCommitMessage → ClearApiKeyCache` | cross_community | 10 |
| `GenerateWithRawPrompt → GetPlainTextApiKey` | cross_community | 10 |
| `GenerateCommitHistoryAnalysis → GetPlainTextApiKey` | cross_community | 10 |
| `HandleGenerateCommit → GetPlainTextApiKey` | cross_community | 9 |
| `HandleGenerateCommit → ClearApiKeyCache` | cross_community | 9 |
| `GenerateCommitMessage → CheckIfWasPreviouslyPro` | cross_community | 7 |
| `GenerateWithRawPrompt → CheckIfWasPreviouslyPro` | cross_community | 7 |
| `GenerateCommitHistoryAnalysis → CheckIfWasPreviouslyPro` | cross_community | 7 |
| `HandleGenerateCommit → CheckIfWasPreviouslyPro` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Encryption | 5 calls |
| Changelog | 4 calls |
| Telemetry | 4 calls |
| Migration | 2 calls |
| Subscription | 2 calls |
| Services | 2 calls |
| Onboarding | 2 calls |
| Commands | 1 calls |

## How to Explore

1. `gitnexus_context({name: "fetchTogetherModels"})` — see callers and callees
2. `gitnexus_query({query: "api"})` — find related execution flows
3. Read key files listed above for implementation details
