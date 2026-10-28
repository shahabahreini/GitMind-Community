# Provider models, real limits and thinking controls (2026-10)

Verified 2026-10-28 against official provider documentation; every value cites its source or is marked `undocumented`.
This file is the source for `VERIFIED_LIMITS` in `src/services/api/capabilities.ts`, the per-model thinking settings in the
adapters under `src/services/api/`, and the curated lists in `src/config/providerCatalog.ts`.

## Policy (user decisions, 2026-10-28)

- Budgets follow each model's real limits. Provider metadata wins, then the documented values below; when neither exists the
  output field is omitted so the API applies the model's own maximum, except where the API requires a number or documents a
  tiny default (Anthropic Messages, MiniMax, Cloudflare Workers AI, NVIDIA hosted NIM, Perplexity `anthropic/*`), which get 16,384.
- Thinking is set to the lowest level each model documents (off where allowed). A model whose thinking is off by default is
  never switched on, and undocumented values are never sent.
- Prompt size defaults to the model's real input limit for Ollama, Ollama Cloud, LM Studio and Copilot; per-token paid APIs
  keep the 60,000-token default for models with unknown limits (user setting overrides).
- Curated lists drop retired or deprecated models and add current recommended ones; a default changes only when retired.
  Together AI's retired default moved to `openai/gpt-oss-120b` and Perplexity's to `perplexity/sonar` (user decisions).

## Ollama Cloud (live, 2026-10-28)

Measured with the account's API key against `https://ollama.com`:

- `/api/show` reports `capabilities`, `thinking.values` / `thinking.default` and `model_info.<arch>.context_length`.
- The server caps output at the context length: `kimi-k2.6` rejected `max_tokens` 2,000,000 with "exceeds model's maximum
  output tokens (262144)"; `glm-5.3` accepted 1,040,000.
- Oversized prompts return 400 "The prompt is too long: 160419, model maximum context length: 131072" (no silent truncation).
- Code diffs measured 3.94 bytes per token (300 KB → 76,139 prompt tokens).
- At a 1,024-token budget, `glm-5.3` and `kimi-k2.6` returned `finish_reason: "length"` with empty `content` and only
  `message.reasoning`; `gemma4:31b` (thinking off by default) answered normally.
- `clef:27b` reports `["decision","vision"]` and chat requests are rejected ("only supports /v1/systemone").
- `qwen3-coder:480b` and `deepseek-v3.1:671b` were retired on 2026-07-15.

| Model | thinking.values | default | context |
|---|---|---|---|
| glm-5.3 | low, high, max | max | 1,048,576 |
| glm-5.2 | false, high, max | high | — |
| muse-spark-open | false, low, medium, high, max | high | 1,048,576 |
| kimi-k2.6 | false, true | true | 262,144 |
| nemotron-3-nano:30b | false, true | true | — |
| gemma4:31b | false, true | false | 262,144 |
| gpt-oss:120b | low, medium, high | medium | 131,072 |
| beam | low, medium, high, xhigh, max | max | — |
| mistral-large-4 | (none reported) | — | 1,048,576 |

## Spot-check log

The executor re-read these pages on 2026-10-28 before applying the changes:

- Perplexity Agent API models (https://docs.perplexity.ai/docs/agent-api/models): `perplexity/sonar`, `openai/gpt-6-luna`
  and `perplexity/glm-5.3-flash` are listed; `sonar-pro` is not. Confirmed.
- Together deprecations (https://docs.together.ai/docs/deprecations): `meta-llama/Llama-3.3-70B-Instruct-Turbo` removed from
  serverless 2026-10-22, no replacement named. Confirmed.
- MiniMax Anthropic-compatible API (https://platform.minimax.io/docs/api-reference/text-anthropic-api): only `MiniMax-M3.1-Flash`
  and `MiniMax-M3` are supported. Confirmed.

---


Scope: OpenAI, Azure OpenAI, Anthropic, Amazon Bedrock, Vertex AI, Gemini, GitHub Copilot (VS Code LM API), Cohere, Mistral.
Sources are primary only (provider docs, API references, model and deprecation pages). `undocumented` means I could not find the value in the provider's own docs.

## Cross-cutting findings (read first)

1. **Anthropic: the default model `claude-sonnet-5` likely rejects GitMind's request today.** `anthropic.ts` sends `temperature: 0.2` to `claude-sonnet-5` (its `alwaysThinks` flag is false). The Sonnet 5 model page says "Setting `temperature`, `top_p`, or `top_k` returns a 400 error". The deprecations page says that on API versions before `2026-10-21` (GitMind sends `anthropic-version: 2023-06-01`), a non-default value on Claude 4.7 and later models returns a 400. Sources: https://platform.claude.com/docs/en/models/sonnet-5/overview , https://platform.claude.com/docs/en/about-claude/model-deprecations (API parameter deprecations).
2. **Anthropic: thinking eats the 350-token budget on Sonnet 5.** Adaptive thinking is on by default for `claude-sonnet-5`, and thinking tokens count toward `max_tokens`. GitMind sends `max_tokens: 350` with no `thinking` field. Sonnet 5 accepts `thinking: {"type":"disabled"}`, which turns thinking off. Source: https://platform.claude.com/docs/en/build-with-claude/thinking
3. **Azure OpenAI: `max_tokens` and `temperature` are rejected by reasoning deployments.** `openaiCompatible.ts` always sends `max_tokens` and `temperature`. Azure says: "Reasoning models other than GPT-6 Astra don't support ... `temperature`, `top_p`, ..., `max_tokens`" and "Reasoning models will only work with the `max_completion_tokens` parameter when using the Chat Completions API." Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning
4. **Cohere: curated ID `north-mini-code-1-0` does not match the docs.** Cohere documents `north-mini-code-1.0` (with a period). Sources: https://docs.cohere.com/docs/models , https://docs.cohere.com/docs/north-mini-code-1.0
5. **Mistral: curated IDs `ministral-3-{14b,8b,3b}-2512` do not match the docs.** The model pages show `ministral-14b-2512`, `ministral-8b-2512`, and `ministral-3b-2512`. Sources: https://docs.mistral.ai/models/ministral-3-14b-25-12 , https://docs.mistral.ai/models/ministral-3-8b-25-12 , https://docs.mistral.ai/models/ministral-3-3b-25-12
6. **OpenAI: `gpt-6-sol` is superseded but not deprecated.** The models index now lists `gpt-6.1-sol` and `gpt-6.1-terra` as flagships and no longer lists `gpt-6-sol` or `gpt-5.6-*`. The `gpt-6-sol` page still exists with no deprecation notice, and no shutdown date is announced for it. https://developers.openai.com/api/docs/models , https://developers.openai.com/api/docs/models/gpt-6-sol
7. **Gemini: `gemini-3.7-flash` and `gemini-3.5-flash` are now redirect endpoints.** Requests to them auto-route to `gemini-3.8-flash` and `gemini-3.6-flash`. `gemini-3.1-flash-lite` has an announced shutdown of May 7, 2027. https://ai.google.dev/gemini-api/docs/deprecations
8. **Gemini 4: new `finishReason: CONTINUATION`.** Gemini 4 models can return `CONTINUATION`. `gemini.ts` and `vertexai.ts` treat any non-`STOP` finish as a content-filter block. This matters only if `gemini-4-argon` is added and output reaches the per-request limit (32,768 tokens for non-streaming direct HTTP). https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference , https://ai.google.dev/api/generate-content

---

## OpenAI

GitMind calls `POST https://api.openai.com/v1/chat/completions` (`openai.ts`). It sends `max_completion_tokens` when `supportsReasoning` is set, otherwise `max_tokens` + `temperature`. It sends no `reasoning_effort`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output-budget field | `max_completion_tokens`. Optional. Described as "An upper bound for the number of tokens that can be generated for a completion, including visible output tokens and reasoning tokens". `max_tokens` is "deprecated in favor of `max_completion_tokens`" and "incompatible with o-series models". Default when omitted: undocumented. Max: 128,000 for gpt-6-astra, gpt-6-sol, gpt-6.1-sol, gpt-6.1-terra, gpt-6-luna, and gpt-5.6-sol/terra/luna (per model pages). The reasoning guide recommends reserving at least 25,000 tokens for reasoning + output. | https://developers.openai.com/api/reference/python/resources/chat/subresources/completions/methods/create ; https://developers.openai.com/api/docs/guides/reasoning ; model pages below |
| 2 | Model list endpoint and limit fields | `GET /v1/models`. Fields: `id`, `created`, `object`, `owned_by`, `shutdown_date` (string or null). It has no context-window or max-output field. | https://developers.openai.com/api/reference/resources/models/methods/list |
| 3 | Thinking control | `reasoning_effort` (Chat Completions); `reasoning.effort` (Responses). The reference lists `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, and notes "Not all reasoning models support every value." Per model: gpt-6-astra accepts low/medium/high/xhigh/max ("does not support `none`... returns HTTP 400"; default not stated). gpt-6.1-sol accepts low–max (no `none` or `minimal`; default medium). gpt-6-sol, gpt-6-luna, gpt-6.1-terra, and gpt-5.6-sol/terra/luna accept none–max (default medium). To minimize: `none` where accepted, otherwise `low`. Chat Completions function calling works only with effort `none` on gpt-6-sol and gpt-6-luna, and is unsupported on gpt-6-astra and gpt-6.1-sol. | same reference; https://developers.openai.com/api/docs/guides/reasoning ; model pages |
| 4 | Where reasoning appears | Chat Completions returns no reasoning text; the message schema has no reasoning field. "Reasoning tokens aren't visible via the API." `usage.completion_tokens_details.reasoning_tokens` appears in examples, but the reference gives it no description. Summaries are available only through the Responses API `reasoning.summary`. | https://developers.openai.com/api/docs/guides/reasoning ; Chat create reference |
| 5 | Context exceeded | HTTP 400, `invalid_request_error` (SDK `BadRequestError`). The message begins "This model's maximum context length is N tokens, however you requested M tokens". The cookbook shows `code: None`; the Agents API docs name the code `context_length_exceeded`. | https://developers.openai.com/cookbook/examples/embedding_long_inputs ; https://developers.openai.com/api/docs/guides/agents-api/errors |

### OpenAI model list (catalog default `gpt-6-sol`)

| Model ID | Status | Context | Max output | Source |
|---|---|---|---|---|
| gpt-6-sol (default) | Active. Page exists with no deprecation notice and no shutdown date; superseded by gpt-6.1-sol and dropped from the models index. | 1,050,000 (max input 922,000) | 128,000 | https://developers.openai.com/api/docs/models/gpt-6-sol |
| gpt-6-luna | Active (flagship index). It is the named replacement for several deprecated models. | 1,050,000 (input 922,000) | 128,000 | https://developers.openai.com/api/docs/models/gpt-6-luna |
| gpt-6-astra | Active (flagship index) | 1,050,000 (input 922,000) | 128,000 | https://developers.openai.com/api/docs/models/gpt-6-astra |
| gpt-5.6-sol | Active per its page (no deprecation notice); not in the current models index | 1,050,000 (input 922,000) | 128,000 | https://developers.openai.com/api/docs/models/gpt-5.6-sol |
| gpt-5.6-terra | Active per its page; not in the index | 1,050,000 (input 922,000) | 128,000 | https://developers.openai.com/api/docs/models/gpt-5.6-terra |
| gpt-5.6-luna | Active per its page; not in the index | 1,050,000 (input 922,000) | 128,000 | https://developers.openai.com/api/docs/models/gpt-5.6-luna |

The deprecations page lists none of the six curated IDs as deprecated (https://developers.openai.com/api/docs/deprecations). It does schedule shutdowns for other IDs in `openai.ts` MODEL_CONFIGS:
- gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-pro, o3, o3-pro: Dec 11, 2026
- gpt-5.1, gpt-5.3-codex, gpt-5.4-nano: Apr 1, 2027
- gpt-4o-2024-08-06/11-20, gpt-4o-mini-2024-07-18, gpt-4.1-2025-04-14, gpt-4.1-mini-2025-04-14: Jan 14, 2027
- Already shut down Aug 10, 2026: gpt-5.2-chat-latest, gpt-5.3-chat-latest
- Already shut down Jul 23, 2026: gpt-5.2-codex

**Current recommended (models index):**
- `gpt-6-astra`: flagship for complex reasoning and coding
- `gpt-6.1-sol`: recommended balance
- `gpt-6.1-terra`: fast
- `gpt-6-luna`: cost-sensitive

All four have a 1,050,000 context and 128,000 max output. https://developers.openai.com/api/docs/models , https://developers.openai.com/api/docs/models/gpt-6.1-sol , https://developers.openai.com/api/docs/models/gpt-6.1-terra

**Proposed curated list (6):** `gpt-6.1-sol`, `gpt-6.1-terra`, `gpt-6-luna`, `gpt-6-astra`, `gpt-6-sol`, `gpt-5.6-sol`.
- Drop `gpt-5.6-terra` and `gpt-5.6-luna`: they are superseded and not indexed. They are not deprecated, so keeping them is optional.
- **Default change: not required.** `gpt-6-sol` has no announced retirement. `gpt-6.1-sol` is the documented successor if you choose to move.
- Note: `gpt-6.1-*` are not in `openai.ts` MODEL_CONFIGS. They fall back to the `gpt-6-sol` config, which has `supportsReasoning: true` and so sends `max_completion_tokens`. That is the correct field.

## Azure OpenAI

GitMind calls `POST {endpoint}/openai/v1/chat/completions` through `openaiCompatible.ts`. It always sends `max_tokens` (default 1000) and `temperature` (0.2). It uses the `api-key` header or a Bearer Entra token. There is no curated list and live discovery is off.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output-budget field | `max_completion_tokens` (integer or null, not required): "An upper bound for the number of tokens that can be generated for a completion, including visible output tokens and reasoning tokens." `max_tokens` is "(deprecated)... not compatible with o1 series models". Reasoning models "will only work with the `max_completion_tokens` parameter when using the Chat Completions API". Default when omitted: undocumented. Max per model: GPT-6 and GPT-5.6 have 1,050,000 context (input 922,000, output 128,000); gpt-5/5.1/5.2/5.4 have 400,000 (input 272,000, output 128,000). | https://learn.microsoft.com/en-us/rest/api/microsoft-foundry/azureopenai/chat ; https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning |
| 2 | Model list endpoint and limit fields | `GET {endpoint}/openai/v1/models`. `OpenAI.Model` has `created`, `id`, `object`, `owned_by`. No context or max-output fields. | https://learn.microsoft.com/en-us/rest/api/microsoft-foundry/azureopenai/models |
| 3 | Thinking control | `reasoning_effort`; options are model-dependent: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`. `max` works only with GPT-6 or GPT-5.6 and only on the Responses API. `xhigh` works only with GPT-6, GPT-5.6, GPT-5.5, GPT-5.4, and gpt-5.1-codex-max. `minimal` works only with the original GPT-5 reasoning models. `none` is supported by gpt-5.6, 5.5, 5.4, 5.2, 5.1, and the 5.1-codex variants. gpt-5.1 defaults to `none`. "All models before `gpt-5.1` default to `medium`... and do not support `none`." gpt-5-pro supports only `high`. o1-mini does not support `reasoning_effort`. Parameters rejected by reasoning models other than GPT-6 Astra: `temperature`, `top_p`, `presence_penalty`, `frequency_penalty`, `logprobs`, `top_logprobs`, `logit_bias`, `max_tokens`. | https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning ; chat reference |
| 4 | Where reasoning appears | `reasoning_content` (string): "An Azure-specific extension property containing generated reasoning content from supported models", on the message and delta. Usage has `reasoning_tokens`. Summaries are available through Responses `reasoning.summary`. | chat reference (above) ; reasoning how-to |
| 5 | Context exceeded | HTTP 400 Bad Request, with "context length exceeded" listed among 400 causes. Error body: `code`, `message`, `param`, `type`, `inner_error`. The specific code string is undocumented. | https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/troubleshoot-errors ; models reference error schema |

There is no curated list, so row 6 does not apply.

## Anthropic

GitMind calls `POST https://api.anthropic.com/v1/messages` with `anthropic-version: 2023-06-01`. It sends `max_tokens` and, for non-"alwaysThinks" models, `temperature`. It never sends `thinking` or `output_config`. Model limits come from `GET /v1/models`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output-budget field | `max_tokens`. Required (it carries no `optional` marker in the reference); behavior when omitted is undocumented. "Different models have different maximum values." Max output: 128K for Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5, and Sonnet 5; 64K for Haiku 4.5. Thinking tokens count toward `max_tokens`. | https://platform.claude.com/docs/en/api/messages/create ; https://platform.claude.com/docs/en/about-claude/models/overview ; https://platform.claude.com/docs/en/build-with-claude/thinking |
| 2 | Model list endpoint and limit fields | `GET /v1/models`. Fields: `max_input_tokens`, `max_tokens`, `capabilities` (including `capabilities.thinking.types.disabled.supported` and `thinking.types.between_tools.supported`), and `line`. | https://platform.claude.com/docs/en/about-claude/models/overview (Using the Models API) |
| 3 | Thinking control | `thinking: {type: "adaptive" \| "enabled"(+budget_tokens) \| "disabled" \| "between_tools"}`, plus `output_config.effort` with values `low`, `medium`, `high`, `xhigh`, `max`. Per-model behavior is in the table after this one. | https://platform.claude.com/docs/en/build-with-claude/thinking ; https://platform.claude.com/docs/en/build-with-claude/effort ; https://platform.claude.com/docs/en/api/errors |
| 4 | Where reasoning appears | `thinking` content blocks (fields `thinking` and `signature`) and `redacted_thinking` blocks, placed before `text`. `display` defaults to `"omitted"` on Fable 5.1, Opus 5.5, Sonnet 5.5, Sonnet 5, and others, which returns an empty `thinking` string. Use `"summarized"` to receive text. | https://platform.claude.com/docs/en/build-with-claude/thinking |
| 5 | Context exceeded | When input alone exceeds the window: 400 `invalid_request_error` ("prompt is too long") on every model. Body shape: `{"type":"error","error":{"type","message"},"request_id"}`. On 4.5 and newer models, if input + `max_tokens` exceeds the window, the request is accepted and stops with `stop_reason: "model_context_window_exceeded"`. Requests over 32 MB return 413 `request_too_large`. | https://platform.claude.com/docs/en/build-with-claude/context-windows ; https://platform.claude.com/docs/en/api/errors |

Thinking behavior per model, from the thinking guide's table:

| Model | No `thinking` field | `disabled` | Other values that return 400 | Default effort |
|---|---|---|---|---|
| claude-opus-5-5 | Adaptive thinking | 400 error | `enabled`, `between_tools` | `medium` |
| claude-fable-5-1 | Adaptive thinking | 400 error | `enabled`, `between_tools` | `high` |
| claude-sonnet-5-5 | Adaptive thinking | 400 error; `between_tools` is the lowest setting (effort `high` or below) | `enabled` | `high` |
| claude-haiku-5-5 | Adaptive thinking | Thinking off, at effort `high` or below | `enabled`, `between_tools` | `medium` |
| claude-sonnet-5 | Adaptive thinking | Thinking off | `enabled`, `between_tools` | `high` |
| claude-haiku-4-5 | Thinking off | Thinking off | `adaptive` | effort not supported; extended thinking via `enabled` + `budget_tokens` |

### Anthropic model list (catalog default `claude-sonnet-5`)

| Model ID | Status | Context | Max output | Source |
|---|---|---|---|---|
| claude-sonnet-5 (default) | Active (legacy); retirement "Not sooner than June 30, 2027"; successor claude-sonnet-5-5. Rejects `temperature`/`top_p`/`top_k` with 400. | 1M | 128K | https://platform.claude.com/docs/en/models/sonnet-5/overview ; https://platform.claude.com/docs/en/about-claude/model-deprecations |
| claude-opus-5-5 | Active; not sooner than Sep 22, 2027 | 1M | 128K | models overview |
| claude-fable-5-1 | Active; not sooner than Sep 1, 2027 | 1M | 128K | models overview |
| claude-haiku-4-5 (alias of claude-haiku-4-5-20251001) | Active (legacy); "Not sooner than October 15, 2026". That date has passed with no deprecation notice. Successor claude-haiku-5-5. | 200K | 64K | https://platform.claude.com/docs/en/models/haiku-4-5/overview |

**Current recommended:** `claude-opus-5-5` (the docs' "start here" model), `claude-fable-5-1`, `claude-sonnet-5-5`, `claude-haiku-5-5`. All have 1M context and 128K max output. https://platform.claude.com/docs/en/about-claude/models/overview

**Proposed curated list (4):** `claude-sonnet-5-5`, `claude-opus-5-5`, `claude-fable-5-1`, `claude-haiku-5-5`.
- **Default change: not required.** `claude-sonnet-5` has no announced retirement date.
- `claude-sonnet-5` currently returns 400 because of `temperature`, and `claude-sonnet-5-5` would too. Fix `anthropic.ts` to stop sending sampling parameters for Claude 4.7+ models. The documented successor is `claude-sonnet-5-5`.

## Amazon Bedrock

GitMind uses the AWS SDK `ConverseCommand`. It sends `inferenceConfig.maxTokens` (default 1000), `temperature` 0.2, and optional `topP`. It sends no `additionalModelRequestFields`. The model ID is user-supplied; there is no curated list.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output-budget field | `inferenceConfig.maxTokens`. Not required. "The default value is the maximum allowed value for the model that you are using." Minimum 1; the maximum is per model. | https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InferenceConfiguration.html |
| 2 | Model list endpoint and limit fields | `ListFoundationModels` (control plane) returns `FoundationModelSummary`: `modelArn`, `modelId`, `modelName`, `providerName`, `inputModalities`, `outputModalities`, `responseStreamingSupported`, `customizationsSupported`, `inferenceTypesSupported`, `modelLifecycle`. No context-window or max-output fields. | https://docs.aws.amazon.com/bedrock/latest/APIReference/API_FoundationModelSummary.html |
| 3 | Thinking control | Model-specific, passed in `additionalModelRequestFields`. For Claude: `thinking: {type: ...}` plus `output_config: {effort}`. Sonnet 5 and Opus 5 default to adaptive thinking, and you must send `disabled` explicitly to turn it off. Fable 5.1, Mythos 5.1, Fable 5, and Mythos 5 accept only adaptive; `enabled` returns 400. Effort is capped at `high` when thinking is disabled. Other families: see each model card (not covered here). | https://docs.aws.amazon.com/bedrock/latest/userguide/claude-messages-adaptive-thinking.html ; https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html |
| 4 | Where reasoning appears | Content block `reasoningContent` (`ReasoningContentBlock` union): `reasoningText` (ReasoningTextBlock with text and signature) or `redactedContent` (base64). | https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ReasoningContentBlock.html |
| 5 | Context exceeded | `ValidationException`, HTTP 400: "The input fails to satisfy the constraints". A specific context message is undocumented. `stopReason` can also be `model_context_window_exceeded` (others: `end_turn`, `tool_use`, `max_tokens`, `stop_sequence`, `guardrail_intervened`, `content_filtered`, `malformed_model_output`, `malformed_tool_use`). | https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html ; https://docs.aws.amazon.com/bedrock/latest/userguide/troubleshooting-api-error-codes.html |

There is no curated list, so row 6 does not apply. For reference, the Bedrock IDs for current Claude models are `anthropic.claude-{fable-5-1,opus-5-5,sonnet-5-5,haiku-5-5}`; Bedrock sets its own lifecycle dates. https://platform.claude.com/docs/en/about-claude/models/overview

The `temperature: 0.2` issue applies here too for Claude 4.7+ on Bedrock: the Anthropic rule is model-level, but Bedrock-specific confirmation is undocumented.

## Vertex AI

GitMind uses `@google/genai` with `vertexai: true` and `models.generateContent`, sending `config.maxOutputTokens` (default 1000), `temperature` 0.2, and optional `topP`. It sends no `thinkingConfig`. The model ID is user-supplied; there is no curated list.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output-budget field | `generationConfig.maxOutputTokens`, "Optional: int. Maximum number of tokens that can be generated in the response." Default on Vertex is undocumented; the Gemini API reference says "default value varies by model, see Model.output_token_limit". Gemini 4 limits: 65,536 per streaming request, 32,768 per non-streaming direct HTTP request, and up to 1,048,576 total through `continuationToken` (v1beta1 only). | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference ; https://ai.google.dev/api/generate-content |
| 2 | Model list endpoint and limit fields | GitMind calls none. Token-limit fields in the Vertex publisher-model API are undocumented; I could not find them in the reference. | — |
| 3 | Thinking control | `thinkingConfig.thinkingLevel` (Gemini 3+): `MINIMAL` ("not supported on Gemini 4 models"), `LOW`, `MEDIUM`, `HIGH`. Defaults: HIGH on 3.1 Pro and 3 Flash; MEDIUM on 4 Argon, 3.8/3.7/3.6/3.5 Flash; MINIMAL on 3.5 Flash-Lite and 3.1 Flash-Lite. `thinkingBudget` (Gemini 2.5): 0 disables thinking on 2.5 Flash and 2.5 Flash-Lite; it cannot be disabled on 2.5 Pro. On Gemini 3, `thinkingBudget` is deprecated and can cause intermittent 400s; on Gemini 4 it returns `400 INVALID_ARGUMENT`. Sending both fields is an error. No documented way to fully disable thinking on Gemini 3. | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/thinking |
| 4 | Where reasoning appears | With `includeThoughts`, summary parts carry `part.thought = true`. Usage reports `thoughtsTokenCount`. | same ; https://ai.google.dev/api/generate-content |
| 5 | Context exceeded | Undocumented. I could not extract it from the Vertex API-errors page. | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/api-errors |

There is no curated list, so row 6 does not apply.

## Gemini (Gemini API / AI Studio)

GitMind uses `@google/genai` `models.generateContent` (API key), sending `config.maxOutputTokens` (from MODEL_CONFIGS: 65,536 for 3.x Flash, 8000 fallback), `temperature`, `topP`, and conditional `topK`. It sends no `thinkingConfig`. The model list comes from `GET https://generativelanguage.googleapis.com/.../models`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output-budget field | `generationConfig.maxOutputTokens`: "Optional... The default value varies by model, see the Model.output_token_limit attribute". Max output: 65,536 for every curated model checked. The Interactions API docs say `max_output_tokens` includes thought tokens; for `generateContent` this is undocumented. | https://ai.google.dev/api/generate-content ; https://ai.google.dev/gemini-api/docs/thinking ; model pages |
| 2 | Model list endpoint and limit fields | `models.list` / `models.get`. Fields: `inputTokenLimit`, `outputTokenLimit`, `thinking` (bool), `supportedGenerationMethods[]`, `maxTemperature`. | https://ai.google.dev/api/models |
| 3 | Thinking control | `thinkingConfig.thinkingLevel`: "Recommended for Gemini 3 or later models. Use with earlier models results in an error." `thinkingBudget` and `includeThoughts` also exist. Levels and defaults per model: gemini-4-argon low/medium/high (default medium); gemini-3.8-flash low/medium/high (default medium; "`minimal` is not supported and returns an error"); gemini-3.6-flash minimal–high (default medium); gemini-3.5-flash-lite minimal–high (default minimal); gemini-3.1-pro-preview low/medium/high (default high); gemini-3-flash-preview minimal–high (default high); gemini-3.1-flash-lite default MINIMAL (Vertex docs). Lowest setting: `minimal` where accepted, otherwise `low`. Full disable is undocumented for Gemini 3 and 4. | https://ai.google.dev/gemini-api/docs/thinking ; https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash ; https://docs.cloud.google.com/vertex-ai/generative-ai/docs/thinking |
| 4 | Where reasoning appears | `Part.thought`: "Indicates if the part is thought from the model". `UsageMetadata.thoughtsTokenCount`. FinishReason values include `MAX_TOKENS`, `MISSING_THOUGHT_SIGNATURE`, and `CONTINUATION` (Gemini 4). | https://ai.google.dev/api/generate-content |
| 5 | Context exceeded | Specific code and message undocumented. The general table lists `invalid_request` as 400 and `out_of_range` as 416. Body shape: `{"error":{"code","message"}}`. That page appears to describe the newer error scheme; the `generateContent` mapping is undocumented. | https://ai.google.dev/gemini-api/docs/api-errors |

### Gemini model list (catalog default `gemini-3.8-flash`)

| Model ID | Status | Input limit | Output limit | Source |
|---|---|---|---|---|
| gemini-3.8-flash (default) | Stable; released Sep 2, 2026; no shutdown announced | 1,048,576 | 65,536 | https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash ; deprecations |
| gemini-3.7-flash | Superseded. "not available to select in Google AI Studio; the endpoint is not shutting down and automatically routes API requests to `gemini-3.8-flash`". Not on the models page. | undocumented (routes to 3.8) | undocumented | https://ai.google.dev/gemini-api/docs/deprecations |
| gemini-3.6-flash | Stable ("previous-generation... remains available"); no shutdown | 1,048,576 | 65,536 | https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash |
| gemini-3.5-flash | Superseded. Auto-routes to `gemini-3.6-flash`; endpoint not shutting down. | undocumented | undocumented | deprecations |
| gemini-3.5-flash-lite | Stable; no shutdown | 1,048,576 | 65,536 | https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite |
| gemini-3.1-flash-lite | Stable, with **shutdown May 7, 2027** ("earliest possible date"); replacement gemini-3.5-flash-lite | 1,048,576 | 65,536 | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite ; deprecations |
| gemini-3.1-pro-preview | Preview; "No shutdown date announced" | 1,048,576 | 65,536 | https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview |

**Current recommended:**
- `gemini-4-argon`: stable flagship, released Oct 2026. Unified 1,048,576-token window; output 65,536 by default per synchronous request, up to 1,048,576 with long decode; thinking low/medium/high.
- `gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.5-flash-lite`: stable.

https://ai.google.dev/gemini-api/docs/models , https://ai.google.dev/gemini-api/docs/models/gemini-4-argon

**Proposed curated list (6):** `gemini-3.8-flash`, `gemini-4-argon`, `gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite`.
- Drop the routed aliases 3.7-flash and 3.5-flash.
- Keep 3.1-flash-lite only until its May 2027 shutdown, or drop it now since a shutdown date is announced.
- If you add `gemini-4-argon`, handle `finishReason: CONTINUATION` and do not send `MINIMAL`.
- **Default change: not required.** `gemini-3.8-flash` has no shutdown announced.

## GitHub Copilot (VS Code Language Model API)

GitMind calls `vscode.lm.selectChatModels({vendor:'copilot'})` and then `model.sendRequest(messages, {justification})`. It sends no `modelOptions`. "auto" is a GitMind sentinel: it uses a model whose id is `auto` if the editor offers one, otherwise the first available model.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output-budget field | None. `LanguageModelChatRequestOptions` has `justification`, `modelOptions` ("specific to the language model and need to be looked up in the respective documentation"), `toolMode`, and `tools`. No Copilot `modelOptions` keys are documented. Default and max: undocumented. | https://code.visualstudio.com/api/references/vscode-api (LanguageModelChatRequestOptions) ; https://code.visualstudio.com/api/extension-guides/ai/language-model |
| 2 | Model list endpoint and limit fields | `lm.selectChatModels(selector)` returns `LanguageModelChat` with `id`, `name`, `vendor`, `family`, `version`, and `maxInputTokens` ("maximum number of tokens that can be sent to the model in a single request"), plus `countTokens()`. Consumers get no max-output field; `maxOutputTokens` exists only on the provider-side `LanguageModelChatInformation`. | vscode-api reference (LanguageModelChat, LanguageModelChatInformation) |
| 3 | Thinking control | Undocumented. No thinking options are documented. | language-model guide |
| 4 | Where reasoning appears | The stable API defines `LanguageModelTextPart`, `LanguageModelToolCallPart`, and `LanguageModelDataPart` in `response.stream`; unknown types are "a placeholder for future parts". There is no thinking part in the stable API reference. | vscode-api reference (LanguageModelChatResponse) |
| 5 | Context exceeded | Undocumented. `sendRequest` rejects with `LanguageModelError`, whose `code` is `NoPermissions`, `NotFound`, `Blocked` (quota), or `Unknown` (see `cause`). The guide says to check `maxInputTokens` before sending, which GitMind already does. | vscode-api reference (LanguageModelError, LanguageModelChat.sendRequest) |

### Copilot model list (catalog default `auto`)

| Model ID | Status | Context | Max output | Source |
|---|---|---|---|---|
| auto (default) | Unverified: a GitMind sentinel. The VS Code LM docs do not mention an `auto` model id. | runtime `maxInputTokens` | undocumented | https://code.visualstudio.com/api/extension-guides/ai/language-model |

The guide's family list (gpt-4o, gpt-4o-mini, o1, o1-mini, claude-3.5-sonnet) is clearly stale and is not a reliable current list. Models are discovered at runtime. **Proposal:** keep `["auto"]`. No default change.

## Cohere

GitMind calls `POST https://api.cohere.com/v2/chat` with `max_tokens` (350 default), `temperature` 0.2, `p`, and `k`. It sends no `thinking`. The model list comes from `GET https://api.cohere.com/v1/models`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output-budget field | `max_tokens`, optional: "If not set, `max_tokens` defaults to the model's maximum output token limit". Values above the limit are capped. Max output: command-a-plus-05-2026 64k; north-mini-code-1.0 64k; command-a-reasoning-08-2025 32k; command-a-03-2025 8k. | https://docs.cohere.com/reference/chat ; https://docs.cohere.com/docs/models |
| 2 | Model list endpoint and limit fields | `GET /v1/models`. Fields: `name`, `is_deprecated`, `endpoints`, `finetuned`, `context_length`, `tokenizer_url`, `default_endpoints`, `features`, `sampling_defaults`. No max-output field. | https://docs.cohere.com/reference/list-models |
| 3 | Thinking control | `thinking: {type: "enabled" \| "disabled", token_budget?: int}`. "Reasoning is enabled by default for models that support it". `{"type":"disabled"}` turns it off. If you set a budget, Cohere advises leaving at least 1K tokens for the response. Supported-model list: undocumented in the reference. The reasoning guide uses command-a-reasoning; command-a-plus and north-mini-code list "Reasoning" as a capability, but their default is undocumented. | https://docs.cohere.com/reference/chat ; https://docs.cohere.com/docs/reasoning |
| 4 | Where reasoning appears | `message.content[]` blocks of `type: "thinking"` with a `thinking` string, alongside `type: "text"` blocks. | https://docs.cohere.com/reference/chat ; https://docs.cohere.com/docs/reasoning |
| 5 | Context exceeded | A dedicated input-too-long error is undocumented. `finish_reason: MAX_TOKENS` means "the token count exceeded the model's context length or the `max_tokens` limit". Generic 400 and 422 cover invalid requests. | https://docs.cohere.com/reference/chat |

### Cohere model list (catalog default `command-a-plus-05-2026`)

| Model ID | Status | Context | Max output | Source |
|---|---|---|---|---|
| command-a-plus-05-2026 (default) | Live | 128k | 64k | https://docs.cohere.com/docs/models ; https://docs.cohere.com/docs/command-a-plus |
| north-mini-code-1-0 | **Unverified as written.** Docs use `north-mini-code-1.0`, which is Live. | 256k | 64k | https://docs.cohere.com/docs/north-mini-code-1.0 |
| command-a-reasoning-08-2025 | Live | 256k | 32k | https://docs.cohere.com/docs/models |

No deprecations listed for these: https://docs.cohere.com/docs/deprecations

**Current recommended chat models:** `command-a-plus-05-2026` (newest), `north-mini-code-1.0` (coding), `command-a-reasoning-08-2025`, and `command-a-03-2025` (256k context / 8k output).

**Proposed curated list (3):** `command-a-plus-05-2026`, `north-mini-code-1.0`, `command-a-reasoning-08-2025`.
- Fix the North ID.
- **Default change: not required.**
- Note: on reasoning models, thinking is on by default and GitMind's 350-token `max_tokens` will truncate. Send `thinking: {type:"disabled"}` or raise the budget.

## Mistral

GitMind calls `POST https://api.mistral.ai/v1/chat/completions` with `max_tokens` (1024 default) and `temperature`. It sends no `reasoning_effort`. The model list comes from `GET /v1/models`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output-budget field | `max_tokens` (integer or null, optional; default undocumented): "The maximum number of tokens to generate in the completion. The token count of your prompt plus `max_tokens` cannot exceed the model's context length." Per-model max output: undocumented (model pages show context only). | https://docs.mistral.ai/api/endpoint/chat |
| 2 | Model list endpoint and limit fields | `GET /v1/models` model card: `id`, `capabilities.{completion_chat, completion_fim, function_calling, fine_tuning, vision, classification}`, `max_context_length`, `aliases`, `archived`, `created`, `owned_by`, `root`, `job`, `TYPE`. No max-output field. | https://docs.mistral.ai/api/endpoint/models |
| 3 | Thinking control | `reasoning_effort`. The API reference enum is none/minimal/low/medium/high/xhigh. The reasoning guide documents `"high"` and `"none"` for `mistral-small-latest`, `mistral-medium-3-5`, and `mistral-large-4-0`; `zai-glm-5-3` accepts low/high/max and not `none`. `"none"` turns reasoning off. Default per model: undocumented. `prompt_mode: "reasoning"` also exists. Magistral models are deprecated. | https://docs.mistral.ai/studio/conversations/reasoning ; https://docs.mistral.ai/api/endpoint/chat |
| 4 | Where reasoning appears | With reasoning on, `message.content` is a list: a `ThinkChunk` (`type: "thinking"`, `thinking: [TextChunk...]`) followed by a `TextChunk` (`type: "text"`, `text`). With `"none"`, it is a plain string. GitMind's `answerText()` already drops non-text blocks. | https://docs.mistral.ai/studio/conversations/reasoning |
| 5 | Context exceeded | Undocumented: the reference shows only 200 responses. The rule "prompt + `max_tokens` cannot exceed the model's context length" is documented. | https://docs.mistral.ai/api/endpoint/chat |

### Mistral model list (catalog default `mistral-small-2603`)

| Model ID | Status | Context | Max output | Source |
|---|---|---|---|---|
| mistral-small-2603 (default) | GA (Mistral Small 4, v26.03) | 256k | undocumented | https://docs.mistral.ai/models/mistral-small-4-0-26-03 |
| mistral-large-2512 | GA (Large 3, v25.12) | 256k | undocumented | https://docs.mistral.ai/models/mistral-large-3-25-12 |
| ministral-3-14b-2512 | **Unverified as written.** Page ID is `ministral-14b-2512` (GA). | 256k | undocumented | https://docs.mistral.ai/models/ministral-3-14b-25-12 |
| ministral-3-8b-2512 | **Unverified as written.** Page ID is `ministral-8b-2512`. | 256k | undocumented | https://docs.mistral.ai/models/ministral-3-8b-25-12 |
| ministral-3-3b-2512 | **Unverified as written.** Page ID is `ministral-3b-2512` (GA). | 256k | undocumented | https://docs.mistral.ai/models/ministral-3-3b-25-12 |
| codestral-2508 | GA (v25.08); no deprecation | 128k | undocumented | https://docs.mistral.ai/models/codestral-25-08 |

None of the curated IDs appear in the deprecated or retired table: https://docs.mistral.ai/getting-started/models/models_overview/

That table does list these deprecated IDs, which should not be added:

| ID | Retirement date | Replacement |
|---|---|---|
| mistral-medium-2508 | 8/31/2026 | Medium 3.5 |
| mistral-small-2506 | 7/31/2026 | Small 4 |
| devstral-2512 | 7/31/2026 | — |
| magistral-* | 2025–2026 | — |
| mistral-large-2411 | 5/31/2026 | — |

**Current models:**

| Model | ID | Status | Context | Reasoning |
|---|---|---|---|---|
| Mistral Small 4 | `mistral-small-2603` | GA | 256k | supported |
| Mistral Medium 3.5 | `mistral-medium-3-5` (page shows "mistral-medium-3-5+2" aliases) | GA, v26.04 | 256k | supported |
| Mistral Large 4 | `mistral-large-4-0` | **Public Preview**, v26.10 | 1M | `reasoning_effort` |
| Mistral Large 3 | `mistral-large-2512` | GA | 256k | — |
| Ministral 3 14B / 8B / 3B | `ministral-14b-2512`, `ministral-8b-2512`, `ministral-3b-2512` | GA | 256k | — |
| Codestral | `codestral-2508` | GA | 128k | — |

Sources: https://docs.mistral.ai/models/mistral-medium-3-5-26-04 , https://docs.mistral.ai/models/mistral-large-4-0

**Proposed curated list (6):** `mistral-small-2603`, `mistral-medium-3-5`, `mistral-large-2512`, `ministral-14b-2512`, `ministral-8b-2512`, `codestral-2508`.
- Fix the Ministral IDs.
- Optionally swap `ministral-8b-2512` for `ministral-3b-2512`, or add `mistral-large-4-0` once it is GA.
- **Default change: not required.**

---


Researched 2026-10-27/28. All sources are primary: provider docs, API references, and the providers' own live public model-list endpoints (fetched 2026-10-27). `undocumented` means I found no primary source for the value.

Key: "GitMind sends" is what the adapter in `src/services/api/<name>.ts` does today.

---

## Groq

GitMind calls `POST https://api.groq.com/openai/v1/chat/completions` (OpenAI-compatible) with `max_completion_tokens` (default 1000). Model list: `GET /openai/v1/models`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget field | `max_completion_tokens`, optional, no documented default ("The maximum number of tokens that can be generated in the chat completion"). `max_tokens` is "Deprecated in favor of `max_completion_tokens`". Max per model: see the model table (e.g. gpt-oss-120b/20b 65,536; qwen3.8-27b 16,384) | https://console.groq.com/docs/api-reference , https://console.groq.com/docs/models |
| 2 | Metadata endpoint / fields | `GET /openai/v1/models` and `GET /openai/v1/models/{model}`. The example responses include `context_window` and (on `/models/{model}`) `max_completion_tokens`. The formal field list documents only `id, object, created, owned_by`, so these two fields appear only in examples | https://console.groq.com/docs/api-reference |
| 3 | Thinking control | **gpt-oss-120b/20b**: `reasoning_effort` = `low`/`medium`/`high`. There is no documented OFF switch. `include_reasoning` (bool, default `true`) only hides reasoning from the response and cannot be combined with `reasoning_format`. **qwen/qwen3.8-27b**: `reasoning_effort` = `none`/`default`/`low`/`medium`/`high`, where `none` disables reasoning ("On Groq, `default` returns no reasoning tokens"). **meta-models/muse-spark-open**: `low`/`medium`/`high`/`xhigh`, default `xhigh`, "always reasons, so `none` is not supported". Non-gpt-oss models also take `reasoning_format` = `parsed`/`raw`/`hidden` (default `raw`). "Values outside a model's supported set are rejected with a 400." | https://console.groq.com/docs/reasoning , https://console.groq.com/docs/api-reference |
| 4 | Where reasoning appears | gpt-oss: `message.reasoning` (default). Others: `raw` → inline `<think>` tags in `content`, `parsed` → `message.reasoning`, `hidden` → not returned | https://console.groq.com/docs/reasoning |
| 5 | Context-exceeded error | `undocumented`. The errors page lists 413 ("The request body is too large") but says nothing about tokens or context. Error shape: `{"error":{"message":..., "type":"invalid_request_error"}}` | https://console.groq.com/docs/errors |

### Groq models

| Model | Status | Context | Max output | Source |
|---|---|---|---|---|
| `openai/gpt-oss-120b` (default) | active (production) | 131,072 | 65,536 | https://console.groq.com/docs/models |
| `openai/gpt-oss-20b` | active (production) | 131,072 | 65,536 | same |
| `qwen/qwen3.8-27b` | active (**preview**, "evaluation purposes only") | 131,072 | 16,384 | same |

Current Groq text models: production `llama-3.1-8b-instant` (shutdown 2026-08-16, already past), `llama-3.3-70b-versatile` (shutdown 2026-08-16, already past), `openai/gpt-oss-120b`, `openai/gpt-oss-20b`. Preview: `meta-models/muse-spark-open` (131,072 / 131,072), `minimaxai/minimax-m2.7` (196,608 / 131,072), `qwen/qwen3.8-27b`. Deprecations: `qwen/qwen3.6-27b` shut down 2026-09-14 (replacement `qwen/qwen3.8-27b`); `groq/compound`(-mini) shut down 2026-09-21. Source: https://console.groq.com/docs/deprecations

**Proposed curated list:** `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`, `minimaxai/minimax-m2.7` (optional 4th). No retired IDs. **The default stays the same** (active, no retirement announced).

---

## Together AI

GitMind calls `POST https://api.together.xyz/v1/chat/completions` with `max_tokens` (default 1000) and strips `<think>` blocks. Model list: `GET https://api.together.xyz/v1/models`, from which it reads `context_length` and `max_output_tokens`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget field | `max_tokens` ("The maximum number of tokens to generate"), optional, no documented default or maximum. `context_length_exceeded_behavior` (`truncate`/`error`, default `error`) sets what happens when max_tokens exceeds the context | https://docs.together.ai/openapi.yaml (ChatCompletionRequest) |
| 2 | Metadata endpoint / fields | The response schema for `GET /v1/models` is `undocumented`: the OpenAPI spec has no `/v1/models` path and the "Available models" page has no schema. `max_output_tokens` is not documented anywhere. Context length appears only as a docs-table column | https://docs.together.ai/reference/models , https://docs.together.ai/openapi.yaml |
| 3 | Thinking control | Request fields: `reasoning: {enabled: bool}`, `reasoning_effort` (`low`/`medium`/`high`), `chat_template_kwargs` (free-form). Hybrid models (MiniMax-M3, DeepSeek-V4-Pro-0813, GLM-5.2, Kimi-K3, Qwen3.6-Plus, Qwen3.5-9B) have reasoning **on by default**; turn it off with `reasoning={"enabled": false}`. gpt-oss-120b: `reasoning_effort` low/medium/high ("medium" recommended default), with no off switch documented. DeepSeek-V4-Pro-0813 accepts only `high`/`max` (low/medium map to high). GLM-5.3: "thinking cannot be disabled entirely". For `DeepSeek-V4.1-Flash`, `Qwen3.8-Flash` and `GLM-5.3-Flash`: `undocumented` | https://docs.together.ai/docs/inference/chat/reasoning , https://docs.together.ai/docs/glm-5.3-quickstart |
| 4 | Where reasoning appears | `choices[].message.reasoning` (gpt-oss, DeepSeek-V4-Pro-0813) or `message.reasoning_content` (Kimi-K3, GLM-5.2, MiniMax-M3). DeepSeek-R1 puts it inline in `content` as `<think>` tags | https://docs.together.ai/docs/inference/chat/reasoning , openapi.yaml |
| 5 | Context-exceeded error | Error-codes page: "Input token count + `max_tokens` parameter must be less than the context length of the model" (listed under "403 - Bad Request"). The OpenAPI spec for `context_length_exceeded_behavior=error` says "the API returns 400". Shape: `{"error":{"type","message","param?","code?"}}`. Exact message string `undocumented` | https://docs.together.ai/docs/error-codes , openapi.yaml |

### Together models

| Model | Status | Context | Max output | Source |
|---|---|---|---|---|
| `meta-llama/Llama-3.3-70B-Instruct-Turbo` (**default**) | **RETIRED 2026-10-22** (serverless removal; dedicated on-demand still possible). Replacement: **not listed** | n/a (gone from serverless list) | n/a | https://docs.together.ai/docs/deprecations |
| `openai/gpt-oss-120b` | active | 131,072 | `undocumented` | https://docs.together.ai/docs/serverless-models |
| `deepseek-ai/DeepSeek-V4.1-Flash` | active | 1,000,000 | `undocumented` | same |
| `Qwen/Qwen3.8-Flash` | active | 1,000,000 | `undocumented` | same |
| `zai-org/GLM-5.3-Flash` | active | 1,048,575 | `undocumented` | same |

Current serverless chat models (context): `deepseek-ai/DeepSeek-V4-Pro-0813` 1,048,576; `deepseek-ai/DeepSeek-V4.1-Flash(-1017)` 1,000,000; `moonshotai/Kimi-K3` 1,048,576; `MiniMaxAI/MiniMax-M3.1-Flash` 1,048,576; `meta-models/Muse-Spark-Open-816B-A42B` 1,048,576; `zai-org/GLM-5.3` / `GLM-5.2` 1,048,575; `Qwen/Qwen3.7-Plus` 1,000,000; `Qwen/Qwen3.5-9B` 262,144; `openai/gpt-oss-120b` 131,072. Max output is not published for any of them. Also scheduled: `openai/gpt-oss-20b` removed 2026-09-14/15 (replacement `Qwen/Qwen3.5-9B`). Source: https://docs.together.ai/docs/serverless-models , https://docs.together.ai/docs/deprecations

**Proposed curated list:** `openai/gpt-oss-120b`, `deepseek-ai/DeepSeek-V4.1-Flash`, `Qwen/Qwen3.8-Flash`, `zai-org/GLM-5.3-Flash`, `moonshotai/Kimi-K3`.
**Default MUST change.** `meta-llama/Llama-3.3-70B-Instruct-Turbo` was removed from serverless on 2026-10-22, and Together documents **no replacement**. The candidate is `openai/gpt-oss-120b`, the only non-hybrid model already in the curated list. This is GitMind's choice, not a documented successor.

---

## OpenRouter

GitMind calls `POST https://openrouter.ai/api/v1/chat/completions` with `max_tokens` (default 500). Model list: `GET /api/v1/models`, from which it reads `context_length` and `top_provider.max_completion_tokens`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget field | `max_tokens`, optional integer ≥1, no default. "The maximum value is the context length minus the prompt length." For reasoning models "this limit covers reasoning tokens and visible output together on most providers." `max_completion_tokens` has the same semantics | https://openrouter.ai/docs/api/reference/parameters |
| 2 | Metadata endpoint / fields | `GET /api/v1/models`: `context_length`, `top_provider.context_length`, `top_provider.max_completion_tokens`, `per_request_limits`, `expiration_date` (YYYY-MM-DD), and `reasoning.{mandatory, default_effort, default_enabled, supported_efforts, supports_max_tokens}` (omitted for non-reasoning models and routers) | https://openrouter.ai/docs/api/api-reference/models/get-models |
| 3 | Thinking control | `reasoning: {effort: max/xhigh/high/medium/low/minimal/none, max_tokens, exclude (default false), enabled}`. Use either `effort` or `max_tokens`, not both. `effort:"none"` "Disables reasoning entirely". Models with `reasoning.mandatory: true` reject `effort:"none"`. Also top-level `reasoning_effort` (same enum). Of GitMind's curated IDs, `google/gemini-3.8-flash` has `mandatory: true` (live list) | https://openrouter.ai/docs/guides/best-practices/reasoning-tokens , https://openrouter.ai/api/v1/models |
| 4 | Where reasoning appears | `choices[].message.reasoning` (text) and `message.reasoning_details` (structured); `delta.reasoning_details` when streaming. With an exhausted budget: `finish_reason:"length"` and empty content | same |
| 5 | Context-exceeded error | HTTP 400, typed code `context_length_exceeded`: "The combined input and output tokens exceed the model's context window." Shape: `{"error":{"code":<int>, "message":..., "metadata"?}}` | https://openrouter.ai/docs/api/reference/errors-and-debugging |

### OpenRouter models (live `GET /api/v1/models`, 2026-10-27)

| Model | Status | Context | Max output (`top_provider.max_completion_tokens`) | Source |
|---|---|---|---|---|
| `openrouter/free` (default) | active (router) | 200,000 | null | https://openrouter.ai/api/v1/models |
| `openrouter/auto` | active (router) | 2,000,000 | null | same |
| `google/gemini-3.8-flash` | active; reasoning mandatory | 1,048,576 | 65,536 | same |
| `anthropic/claude-sonnet-5` | active | 1,000,000 | 128,000 | same |
| `openai/gpt-6-sol` | active | 1,050,000 | 128,000 | same |
| `meta-llama/llama-3.3-70b-instruct` | active (no `expiration_date`) | 131,072 | 16,384 | same |

None of the six has an `expiration_date`. Upcoming expirations elsewhere in the catalog: `meta-llama/llama-3.1-70b-instruct` 2026-11-03, `nousresearch/hermes-3-*` 2026-11-02, `z-ai/glm-4.5` 2026-12-31. OpenRouter publishes no "recommended" list. The newest flagship IDs are `anthropic/claude-sonnet-5.5` (1,000,000 / 128,000, mandatory reasoning), `openai/gpt-6.1-sol` (1,050,000 / 128,000, mandatory), `openai/gpt-6.1-terra` (1,050,000 / 128,000, `none` allowed), `anthropic/claude-haiku-5.5` (1,000,000 / 128,000, `none` allowed), and `deepseek/deepseek-v4.1-flash-1017` (1,048,576 / 393,216, `none` allowed).

**Proposed curated list:** `openrouter/free`, `openrouter/auto`, `google/gemini-3.8-flash`, `anthropic/claude-sonnet-5.5` (or keep `-5`), `openai/gpt-6.1-terra` (supports reasoning off), `meta-llama/llama-3.3-70b-instruct`. No retirements. **The default stays the same.**

---

## Hugging Face (Inference Providers router)

GitMind calls `POST https://router.huggingface.co/v1/chat/completions` with `max_tokens` (default 500). Model list: `GET https://router.huggingface.co/v1/models`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget field | `max_tokens`: "The maximum number of tokens that can be generated in the chat completion." Optional (only `messages` is required). Default and maximum: `undocumented` (provider-dependent) | https://huggingface.co/docs/inference-providers/tasks/chat-completion |
| 2 | Metadata endpoint / fields | `GET https://router.huggingface.co/v1/models` → `data[].providers[]` with `provider`, `status` (`live`/`error`), `context_length` (optional, per provider), `pricing`, `supports_tools`, `supports_structured_output`. **No max-output field.** GitMind's HF adapter reads only `id` | https://huggingface.co/docs/inference-providers/hub-api , https://router.huggingface.co/v1/models |
| 3 | Thinking control | `reasoning_effort` (string): "Common values: none, minimal, low, medium, high, xhigh. Support and defaults are provider and model-dependent." There is no per-model matrix | https://huggingface.co/docs/inference-providers/tasks/chat-completion |
| 4 | Where reasoning appears | `undocumented`. The response schema lists only `message.content/role/tool_calls` | same |
| 5 | Context-exceeded error | `undocumented` (passed through from the provider) | same |

### Hugging Face models (live router list 2026-10-27; context = per-provider `context_length`)

| Model | Status | Context | Max output | Source |
|---|---|---|---|---|
| `meta-llama/Llama-3.3-70B-Instruct` (default) | active (live: novita, featherless-ai, scaleway, ovhcloud) | 131,072 (ovhcloud); **12,288 (novita)**; others unreported | `undocumented` | https://router.huggingface.co/v1/models |
| `openai/gpt-oss-120b` | active (9 providers live) | 131,072 (baseten 128,072) | `undocumented` | same |
| `openai/gpt-oss-20b` | active | 131,072 | `undocumented` | same |
| `deepseek-ai/DeepSeek-V4.1-Flash` | active | 1,048,576 | `undocumented` | same |
| `Qwen/Qwen3.8-27B` | active | 262,144–1,048,576 depending on provider | `undocumented` | same |
| `zai-org/GLM-5.3-Flash` | active | 1,048,576 | `undocumented` | same |

The "Recommended models" list on the chat-completion page is stale (it still lists gemma-2-2b-it, Qwen2.5, DeepSeek-R1). Its code-snippet provider mapping uses `zai-org/GLM-5.3`, `openai/gpt-oss-120b`, `Qwen/Qwen3.8-27B` and `deepseek-ai/DeepSeek-V4.1-Flash-1017` as current examples. Source: https://huggingface.co/docs/inference-providers/tasks/chat-completion

**Proposed curated list:** unchanged (`meta-llama/Llama-3.3-70B-Instruct`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `deepseek-ai/DeepSeek-V4.1-Flash`, `Qwen/Qwen3.8-27B`, `zai-org/GLM-5.3-Flash`). Optionally swap in `zai-org/GLM-5.3`. **The default stays the same** (live, no retirement). Note that the router may pick novita, whose context is 12,288.

---

## NVIDIA (build.nvidia.com hosted NIM)

GitMind calls `POST https://integrate.api.nvidia.com/v1/chat/completions` with `max_tokens` (default 1000). For Nemotron models it adds `chat_template_kwargs: {enable_thinking: false}` and strips `<think>`. Model list: `GET /v1/models`, from which it reads `context_length`/`max_model_len`/`max_output_tokens`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget field | `max_tokens`, optional (only `messages` is required). Per-model schema: **nemotron-3-super-120b-a12b** default 16384, min 1, max 32768. **gpt-oss-20b** default 4096, max 4096. **glm-5.3-flash** default 1024, no max. **kimi-k3** default 16384, max 65536 | https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-super-120b-a12b-infer , https://docs.api.nvidia.com/nim/reference/openai-gpt-oss-20b-infer , https://docs.api.nvidia.com/nim/reference/z-ai-glm-5-3-flash-infer , https://docs.api.nvidia.com/nim/reference/moonshotai-kimi-k3-infer |
| 2 | Metadata endpoint / fields | `GET https://integrate.api.nvidia.com/v1/models` returns only `id, object, created, owned_by`. **No context or max-output fields**, so GitMind's `context_length`/`max_model_len`/`max_output_tokens` reads always get undefined. Context is published only on the model card pages | https://integrate.api.nvidia.com/v1/models (live) |
| 3 | Thinking control | **Nemotron 3 Super**: `reasoning_effort` enum `none`/`low`/`high`, default `high` ("`none` disables reasoning tokens"). `reasoning_budget` default 16384 (-1 = no enforcement). The `ChatRequest` schema has `additionalProperties: false` and does **not** define `chat_template_kwargs`, which appears only in examples (`enable_thinking`, `low_effort`). Reasoning is ON by default. **gpt-oss-20b**: `reasoning_effort` low/medium/high, default medium, no off switch. **glm-5.3-flash**: the infer schema has no reasoning params (`additionalProperties: false`); the model card says `reasoning_effort` low/high/max, default max. **kimi-k3**: `reasoning_effort` low/high/max, default max. No `none` is documented for gpt-oss, GLM or Kimi | infer refs above; https://build.nvidia.com/z-ai/glm-5-3-flash ; https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-super-120b-a12b |
| 4 | Where reasoning appears | `message.reasoning_content` / `delta.reasoning_content`, shown in the code samples only (not in the response schemas). The GLM-5.3-Flash card says "Reasoning content is returned separately" | same |
| 5 | Context-exceeded error | `undocumented`. Documented errors: 422 "Validation failed, provided entity could not be processed" and 500. Shape: `{type, title, status, detail, instance, requestId}` | infer refs above |

### NVIDIA models

| Model | Status | Context | Max output | Source |
|---|---|---|---|---|
| `nvidia/nemotron-3-super-120b-a12b` (default) | active (in live `/v1/models`) | "Up to 1M tokens"; default serving 256k | 32,768 (`max_tokens` max) | https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-super-120b-a12b , infer ref |
| `openai/gpt-oss-20b` | active | `undocumented` | 4,096 | https://docs.api.nvidia.com/nim/reference/openai-gpt-oss-20b-infer |
| `deepseek-ai/deepseek-v4.1-flash` | active (live list). The docs page uses an `nvidia/deepseek-v4_1-flash` slug | up to 1M | `undocumented` | https://docs.api.nvidia.com/nim/reference/nvidia-deepseek-v4_1-flash , https://integrate.api.nvidia.com/v1/models |
| `z-ai/glm-5.3-flash` | active | 1,048,576 | no max (default 1024) | https://build.nvidia.com/z-ai/glm-5-3-flash |
| `moonshotai/kimi-k3` | **unverified**: the model card says available, but the ID is **absent from live `/v1/models`** | 1,048,576 | 65,536 | https://build.nvidia.com/moonshotai/kimi-k3 , https://integrate.api.nvidia.com/v1/models |

Live chat-capable IDs (2026-10-27) include `nvidia/nemotron-3-ultra-550b-a55b`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `nvidia/nemotron-3.5-super-vl-120b-a12b`, `nvidia/nemotron-nano-3-30b-a3b`, `z-ai/glm-5.3`, `minimaxai/minimax-m3.1-flash`, `moonshotai/kimi-k2.6`, `openai/gpt-oss-20b`, and `deepseek-ai/deepseek-v4.1-flash`. `openai/gpt-oss-120b` is not listed. I did not research their context and output limits.

**Proposed curated list:** `nvidia/nemotron-3-super-120b-a12b`, `openai/gpt-oss-20b`, `deepseek-ai/deepseek-v4.1-flash`, `z-ai/glm-5.3-flash`, `moonshotai/kimi-k2.6` (replaces kimi-k3 until K3 appears in the live list). **The default stays the same.** Also: the documented way to turn off Nemotron thinking is `reasoning_effort: "none"`, which is in the schema. GitMind's `chat_template_kwargs` is not in the schema.

---

## Cloudflare Workers AI

GitMind (via `openaiCompatible.ts`) calls `POST https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1/chat/completions` with `max_tokens` (default 1000), or the AI Gateway `/compat` equivalent. Model list: `GET .../ai/v1/models`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget field | Per model page: older models use `max_tokens` with **default 256** (llama-3.3-70b-instruct-fp8-fast, gpt-oss-120b). On newer models (qwen3.8-27b), `max_tokens` is "Deprecated in favor of max_completion_tokens" and `max_completion_tokens` has no listed default. Maximum: `undocumented` | https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/ , https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/ , https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/ |
| 2 | Metadata endpoint / fields | `.../ai/v1/models` (what GitMind calls) is **`undocumented`**. The documented endpoint is `GET /accounts/{account_id}/ai/models/search`, whose `result` is "array of unknown", so no context field names are documented. Context window appears only on model pages ("Model Info") | https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/ , https://developers.cloudflare.com/api/resources/ai/subresources/models/methods/list/ |
| 3 | Thinking control | Per model. qwen3.8-27b: `reasoning_effort` low/medium/xhigh (default xhigh), plus `chat_template_kwargs` (keys undocumented). gpt-oss-120b: reasoning levels low/medium(default)/high, request field undocumented. Kimi K2.6 uses `chat_template_kwargs.thinking` (not `enable_thinking`). The Get Started guide shows `chat_template_kwargs:{enable_thinking:false}` for Gemma 4. No documented OFF switch for qwen3.8 or gpt-oss | model pages above; https://developers.cloudflare.com/workers-ai/changelog/ ; https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/ |
| 4 | Where reasoning appears | Kimi K2.6 returns reasoning in the `reasoning` field (instead of `reasoning_content`, per the changelog). Otherwise `undocumented` | https://developers.cloudflare.com/workers-ai/changelog/ |
| 5 | Context-exceeded error | `undocumented`. Closest: internal code 3006, HTTP 413 "Request is too large" | https://developers.cloudflare.com/workers-ai/platform/errors/ |

There is no curated list (defaultModel ""), so row 6 does not apply. Model-page contexts for reference: llama-3.3-70b-instruct-fp8-fast 24,000; gpt-oss-120b 128,000; qwen3.8-27b 262,144.

---

## DeepSeek

GitMind calls `POST https://api.deepseek.com/chat/completions` with `max_tokens` (350/400 per model config) and **does not send `thinking`**. Model list: `GET https://api.deepseek.com/models`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget field | `max_tokens`, optional/nullable, range 1–393,216 ("384K"). **Default when omitted: 8K non-thinking, 64K thinking (128K with `reasoning_effort: max`)** | https://api-docs.deepseek.com/api/create-chat-completion |
| 2 | Metadata endpoint / fields | `GET /models` → `data[].context_window` ("total token capacity… both input and output") and `data[].max_output_tokens` (max accepted `max_tokens`), plus `effort` and `api_capabilities` | https://api-docs.deepseek.com/api/list-models |
| 3 | Thinking control | `thinking: {type: "enabled"/"disabled"}`, default **enabled**. `reasoning_effort`: `none`/`low`/`high`/`max`, default `high`; `none` turns thinking off (minimal→low, medium/xhigh→high). "Thinking mode is enabled by default." In thinking mode, temperature/presence/frequency penalties are ignored (no error). **Impact:** GitMind sends neither field, so it runs in thinking mode with a 350-token budget | https://api-docs.deepseek.com/guides/thinking_mode , https://api-docs.deepseek.com/api/create-chat-completion |
| 4 | Where reasoning appears | `message.reasoning_content` / `delta.reasoning_content`, at the same level as `content` | same |
| 5 | Context-exceeded error | `undocumented`. Listed codes: 400 Invalid Format, 422 Invalid Parameters, and others | https://api-docs.deepseek.com/quick_start/error_codes |

### DeepSeek models

| Model | Status | Context | Max output | Source |
|---|---|---|---|---|
| `deepseek-flash` (default) | active, served by DeepSeek-V4.1-Flash-1017 since 2026-10-17 | 1M | 384K max | https://api-docs.deepseek.com/quick_start/pricing/ , https://api-docs.deepseek.com/updates/ |
| `deepseek-v4-pro` | active (DeepSeek-V4-Pro-0813; service continues past 2026-09-14) | 1M | 384K max | same |

Also: `deepseek-v4-flash` (still in GitMind's `MODEL_CONFIGS`/types) is a **retired** model as of 2026-09-10. The name is only "temporarily routed" to V4.1 Flash. `deepseek-chat`/`deepseek-reasoner` were discontinued on 2026-07-24. Source: https://api-docs.deepseek.com/updates/

**Proposed curated list:** unchanged (`deepseek-flash`, `deepseek-v4-pro`). **The default stays the same.**

---

## xAI Grok

GitMind calls the **Responses API**, `POST https://api.x.ai/v1/responses`, with `max_output_tokens` (default 150) and `store:false`. Model list: `GET /v1/models`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget field | `max_output_tokens` (integer or null), optional. "Only applies to visible output tokens" (excludes reasoning). "Defaults to 128,000 when unset." Maximum `undocumented` | https://docs.x.ai/docs/api-reference |
| 2 | Metadata endpoint / fields | `GET /v1/language-models` returns per model `id, fingerprint, created, object, owned_by, version, input_modalities, output_modalities`, token prices, `long_context_threshold`, `aliases`. **No context-window or max-output field is documented.** Context is on the model pages | https://docs.x.ai/developers/rest-api-reference/inference/models |
| 3 | Thinking control | `reasoning.effort` (or the non-standard `reasoning_effort`). **grok-4.7 / grok-4.6**: low/medium/high/xhigh, "cannot be disabled". **grok-4.5**: low/medium/high/xhigh (xhigh treated as high), default high, no disable documented. **grok-4.3**: `none`/low/medium/high/xhigh, **default `low`**, `none` turns it off. General default "high". `presencePenalty`/`frequencyPenalty`/`stop` return an error on reasoning models | https://docs.x.ai/docs/guides/reasoning , https://docs.x.ai/developers/models/grok-4.3 , https://docs.x.ai/developers/models/grok-4.5 |
| 4 | Where reasoning appears | `reasoning` output items in `output[]` with `encrypted_content` (always returned for grok-4.7; otherwise only with `include:["reasoning.encrypted_content"]`). Usage reports `reasoning_tokens`. Streaming has reasoning-summary deltas | https://docs.x.ai/docs/guides/reasoning |
| 5 | Context-exceeded error | Error code string `context_length_exceeded` is mentioned. HTTP status and shape `undocumented` (the debugging page lists 400/401/403/404/405/415/422/429 generically) | https://docs.x.ai/developers/advanced-api-usage/context-compaction , https://docs.x.ai/developers/debugging |

### xAI models

| Model | Status | Context | Max output | Source |
|---|---|---|---|---|
| `grok-4.7` (default) | active, recommended ("use Grok 4.7… the most capable model we've built") | 500k | `undocumented` | https://docs.x.ai/docs/models , https://docs.x.ai/developers/release-notes |
| `grok-4.6` | active | 500k | `undocumented` | same |
| `grok-4.5` | active | 500,000 | `undocumented` | https://docs.x.ai/developers/models/grok-4.5 |
| `grok-4.3` | active (the redirect target for the models retired 2026-05-15) | 1,000,000 | `undocumented` | https://docs.x.ai/developers/models/grok-4.3 , https://docs.x.ai/developers/migration/may-15-retirement |

No newer public text model was found (Grok 4.7 Fast is Cursor/Grok Build only). **Proposed curated list:** unchanged. **The default stays the same.**

---

## Perplexity

GitMind calls the **Agent API**, `POST https://api.perplexity.ai/v1/agent`, with `{model, instructions, input, max_output_tokens}` (default 350/400) and model IDs `sonar-pro` / `sonar-reasoning-pro` / `sonar`. There is no model list (liveDiscovery false).

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget field | `max_output_tokens`: "Maximum tokens to generate." Optional, min 1, no default or maximum documented. **Required for `anthropic/*` models** (else HTTP 400 "validation failed: max_output_tokens is required when using Anthropic models"). The effort presets carry their own limits (fast 8192, low 32768, medium/high 128000, xhigh 512000) | https://docs.perplexity.ai/api-reference/agent-post , https://docs.perplexity.ai/docs/agent-api/presets |
| 2 | Metadata endpoint / fields | **No list-models endpoint is documented.** The models page gives context/max output only for `perplexity/nemotron-3.5-super-120b-a12b` (1,048,576 / 131,072) | https://docs.perplexity.ai/docs/agent-api/models |
| 3 | Thinking control | `reasoning: {effort}` with values `minimal`/`low`/`medium`/`high`/`xhigh`/`max`. This is separate from the top-level `effort` preset selector (`fast`/`low`/`medium`/`high`/`xhigh`). `model` must be in "provider/model format" and is required unless `models` or `effort` is given. No `none` value is documented for `reasoning.effort` (the `fast` preset internally runs gpt-6-luna at effort `none`) | https://docs.perplexity.ai/api-reference/agent-post , https://docs.perplexity.ai/docs/agent-api/presets |
| 4 | Where reasoning appears | Not in non-streaming `output[]`: OutputItem types are message, search_results, function_call, and similar, with no reasoning type. Streaming only: `response.reasoning.started` / `.search_queries` / `.stopped` events | https://docs.perplexity.ai/api-reference/agent-post |
| 5 | Context-exceeded error | `undocumented`. Only 400 "Invalid request" is documented | same |

### Perplexity models

| Model | Status | Context | Max output | Source |
|---|---|---|---|---|
| `sonar-pro` (**default**) | **Not an Agent API model ID.** It is absent from the Agent API models page, which requires provider/model format. Sonar Chat Completions support **ended 2026-09-27** (sync requests "being reformulated as Agent API requests, rolling out gradually by model"). Documented mapping: Sonar Pro → effort `fast` | `undocumented` | `undocumented` | https://docs.perplexity.ai/docs/sonar/models , https://docs.perplexity.ai/docs/agent-api/models , https://docs.perplexity.ai/api-reference/agent-post |
| `sonar-reasoning-pro` | Same as above (Sonar CC ended 2026-09-27). Mapping → effort `low` | `undocumented` | `undocumented` | https://docs.perplexity.ai/docs/sonar/models/sonar-reasoning-pro |
| `sonar` | Bare ID not listed. The Agent API lists **`perplexity/sonar`**. Mapping → effort `fast` | `undocumented` | `undocumented` | https://docs.perplexity.ai/docs/agent-api/models |

Current Agent API model IDs: `perplexity/sonar`, `perplexity/glm-5.3`, `perplexity/glm-5.3-flash`, `perplexity/deepseek-v4-pro-0813`, `perplexity/kimi-k3`, `perplexity/nemotron-3.5-super-120b-a12b` (1,048,576 / 131,072), `openai/gpt-6.1-sol`, `openai/gpt-6-astra`, `openai/gpt-6-sol`, `openai/gpt-6-luna`, `openai/gpt-5.6-*`, `openai/gpt-5.5`, `anthropic/claude-{fable-5,fable-5-1,opus-5-5,opus-5,sonnet-5-5,sonnet-5,haiku-5-5}`, `google/gemini-{4-argon,3.6-flash,3.7-flash,3.8-flash}`, and `xai/grok-{4.7,4.6,4.5}`. Context and max output are `undocumented` except for nemotron. Retired 2026-10-24: `openai/gpt-5.4(-mini/-nano)`, `gpt-5.2`, `gpt-5.1`, `gpt-5`, `gpt-5-mini`. Source: https://docs.perplexity.ai/docs/agent-api/models , https://docs.perplexity.ai/docs/resources/changelog

**Proposed curated list:** `perplexity/sonar`, `openai/gpt-6-luna` (the model behind the `fast`/`low` presets), `perplexity/glm-5.3-flash`. Alternatively, send `effort: "fast"` instead of a model, which is the documented Sonar Pro mapping.
**Default MUST change.** `sonar-pro` belongs to the Sonar Chat Completions API, whose support ended 2026-09-27, and it is not a documented Agent API model ID. The documented replacements are the **`fast` effort preset** for Sonar Pro, or the model ID **`perplexity/sonar`**. Also, `MODEL_CONFIGS` in `perplexity.ts` is keyed by the old IDs.

---

## Cross-cutting implementation notes (from the facts above)

- **DeepSeek:** thinking is on by default and GitMind does not disable it. A 350/400 `max_tokens` budget is shared with `reasoning_content`, so `content` can come back empty or truncated. Send `thinking:{type:"disabled"}` (or `reasoning_effort:"none"`).
- **NVIDIA:** `/v1/models` returns no limit fields, so the `rememberModelLimits` call gets nothing. For Nemotron the schema-valid off switch is `reasoning_effort:"none"`. gpt-oss-20b caps `max_tokens` at 4096.
- **Together:** `max_output_tokens` and `context_length` on `/v1/models` are not documented.
- **Cloudflare:** the `/ai/v1/models` path GitMind uses is not documented. Some models default `max_tokens` to 256.
- **OpenRouter:** `google/gemini-3.8-flash` has mandatory reasoning that counts against `max_tokens` (GitMind default 500), which risks `finish_reason:"length"` with empty content.
- **xAI:** `max_output_tokens` excludes reasoning tokens, so a budget of 150 is visible output only.

---


Researched 2026-10-28 from primary sources only (provider docs). Values marked `undocumented` were not stated on the cited page(s). Pages were read through a summarizing fetcher, so wording is paraphrased unless it appears in quotes.

---

## Z.ai

**What GitMind calls** (`src/services/api/zai.ts`): OpenAI-style `POST https://api.z.ai/api/coding/paas/v4/chat/completions` (default `endpointType='coding'`) or `https://api.z.ai/api/paas/v4/chat/completions` (`regular`). Body: `model`, `messages`, `temperature`, optional `top_p`, and `max_tokens` **only when maxTokens is set**. GitMind sends no `thinking` and no `reasoning_effort`. Catalog: `defaultModel: "glm-5.3"`, `liveDiscovery: false`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget | `max_tokens`, optional (only `model` and `messages` are required). Default when omitted: `undocumented`. Schema range is 1 to 131072. "GLM-5.3, GLM-5.2, GLM-5.1, GLM-5, GLM-4.7, GLM-4.6 series supports 128K maximum output." GLM-4.5 family max output is 96K. | https://docs.z.ai/api-reference/llm/chat-completion ; https://docs.z.ai/guides/llm/glm-4.5 |
| 2 | Metadata / model list | No model-list endpoint found in the docs index. Limits are published only on per-model guide pages. GitMind validates with a `max_tokens:1` chat call instead. | https://docs.z.ai/llms.txt |
| 3 | Thinking control | `thinking: {type: "enabled" \| "disabled"}`, default `enabled`. Applies to "GLM-4.6 series and higher". **GLM-5.3 and GLM-5.3-Flash/FlashX can only be `enabled`.** Sending `disabled` fails, and the docs say to migrate to `enabled` with `reasoning_effort: "low"`. GLM-5.3 `reasoning_effort` takes `low` \| `high` \| `max`, **default `max`**. GLM-5.2, 5.1, 5, 4.7 and 4.6 accept `disabled` (all default to `enabled`; the thinking-mode page calls GLM-4.6 "hybrid"). The API reference text also describes GLM-4.7 as thinking "compulsorily", which conflicts with the 4.7 guide page that allows `disabled`. GLM-4.5 family: hybrid thinking, `enabled`/`disabled`, "dynamic thinking is enabled" by default. `clear_thinking` (bool, default true) only affects reasoning from earlier turns. **Minimum for GLM-5.3 family: `thinking.type=enabled` + `reasoning_effort: "low"`.** | https://docs.z.ai/api-reference/llm/chat-completion ; https://docs.z.ai/guides/llm/glm-5.3 ; https://docs.z.ai/guides/vlm/glm-5.3-flash.md ; https://docs.z.ai/guides/capabilities/thinking-mode.md ; https://docs.z.ai/guides/llm/glm-4.7 ; https://docs.z.ai/guides/llm/glm-4.5 |
| 4 | Where reasoning appears | `message.reasoning_content` (streaming: `delta.reasoning_content`), separate from `content`. The API reference response schema does not list this field, but the thinking-mode guide does. | https://docs.z.ai/guides/capabilities/thinking-mode.md |
| 5 | Prompt too long | Error JSON `{"error":{"code":"<business code>","message":"..."}}`. Code **1261**, HTTP 400, "Prompt too long". Unknown model: 1211 / HTTP 400. Response can also end with `finish_reason: "model_context_window_exceeded"`. | https://docs.z.ai/api-reference/api-code.md ; https://docs.z.ai/api-reference/llm/chat-completion |

**Coding Plan note** (affects GitMind's default `coding` endpoint): "All plans support **GLM-5.3**, GLM-5.3-Flash." GLM-5.2 and GLM-5.1 requests are automatically routed to GLM-5.3, and GLM-4.7 requests to GLM-5.3-Flash. GLM-5.3-FlashX "is not yet available on the GLM Coding Plan". Source: https://docs.z.ai/devpack/overview.md ; https://docs.z.ai/guides/vlm/glm-5.3-flash.md

### Z.ai model status (row 6)

No deprecation or retirement notices for any GLM text model appear in the release notes, pricing, or model pages. Status below is "active" when the model is listed on the pricing page.

| Model ID | Status | Context | Max output | Source |
|---|---|---|---|---|
| glm-5.3 (default) | active (released 2026-08-18) | 1M | 128K | https://docs.z.ai/guides/llm/glm-5.3 ; https://docs.z.ai/release-notes/new-released.md |
| glm-5.3-flash | active (2026-08-26) | 1M | 128K | https://docs.z.ai/guides/vlm/glm-5.3-flash.md |
| glm-5.3-flashx | active, not on Coding Plan | 1M | 128K | https://docs.z.ai/guides/vlm/glm-5.3-flash.md |
| glm-5.2 | active on the API; routed to glm-5.3 on Coding Plan | 1M | 128K | https://docs.z.ai/guides/llm/glm-5.2.md ; https://docs.z.ai/devpack/overview.md |
| glm-5.1 | active on the API; routed to glm-5.3 on Coding Plan | 200K | 128K | https://docs.z.ai/guides/llm/glm-5.1 |
| glm-5 | active | 200K | 128K | https://docs.z.ai/guides/llm/glm-5 |
| glm-4.7 | active on the API; routed to glm-5.3-flash on Coding Plan | 200K | 128K | https://docs.z.ai/guides/llm/glm-4.7 |
| glm-4.7-flashx | active ("Other pricing" section); API ID not stated on the guide | 200K | 128K | https://docs.z.ai/guides/llm/glm-4.7 ; https://docs.z.ai/guides/overview/pricing |
| glm-4.7-flash | active ("Other pricing"); API ID not stated on the guide | 200K | 128K | same |
| glm-4.6 | active | 200K | 128K | https://docs.z.ai/guides/llm/glm-4.6 |
| glm-4.5 | active ("Other pricing"); not in the API reference model enum | 128K | 96K | https://docs.z.ai/guides/llm/glm-4.5 ; https://docs.z.ai/guides/overview/pricing |
| glm-4.5-air | active ("Other pricing") | 128K (family figure) | 96K (family figure) | https://docs.z.ai/guides/llm/glm-4.5 |
| glm-4.5-flash | active ("Other pricing") | 128K (family figure) | 96K (family figure) | same |

**Current recommended text models:** pricing page "Latest Models" lists GLM-5.3, GLM-5.3-Flash and GLM-5.3-FlashX (all 1M / 128K). Source: https://docs.z.ai/guides/overview/pricing

**Proposed curated list (13 → 12; nothing is retired, so this only removes legacy entries from the "Other pricing" section):**
`["glm-5.3", "glm-5.3-flash", "glm-5.3-flashx", "glm-5.2", "glm-5.1", "glm-5", "glm-4.7", "glm-4.7-flashx", "glm-4.7-flash", "glm-4.6", "glm-4.5", "glm-4.5-air"]`. A shorter list is also reasonable: keep the 5.x and 4.7/4.6 entries and drop the 4.5 family.
**Default:** keep `glm-5.3` (no retirement announced).
**Action items:** (a) GLM-5.3 thinks by default at `reasoning_effort: max`. For commit messages, send `reasoning_effort: "low"` and never send `thinking.type: "disabled"` to 5.3 or 5.3-Flash, because that fails. (b) GitMind omits `max_tokens` and the default is undocumented, so set an explicit budget that leaves room for reasoning tokens.

---

## MiniMax

**What GitMind calls** (`src/services/api/minimax.ts`): the Anthropic-compatible `POST https://api.minimax.io/anthropic/v1/messages`, with `anthropic-version: 2023-06-01`. Body: `model`, `max_tokens` (`options.maxTokens`, otherwise per-model config: M3 = 2000, M2.x = 350), `temperature`, `top_p`, `messages`. No `thinking`. Catalog: `defaultModel: "MiniMax-M3"`, curated `["MiniMax-M3","MiniMax-M2.7","MiniMax-M2.7-highspeed"]`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget | `max_tokens`, listed as "Fully supported", "Maximum number of tokens to generate. Thinking tokens count toward it too". If the value is too small, the response has `stop_reason: "max_tokens"` and no text. Required or optional, default and maximum: `undocumented` on the Anthropic page. On the OpenAI-compat page, `max_completion_tokens` has a max of 524288 (recommended 131072) for M3.1-Flash and M3, and a max of 204800 for other models. | https://platform.minimax.io/docs/api-reference/text-anthropic-api ; https://platform.minimax.io/docs/api-reference/text-chat-openai.md |
| 2 | Metadata / model list | `GET https://api.minimax.io/v1/models` returns `id`, `object`, `created`, `owned_by` only. **No context or max-output fields.** | https://platform.minimax.io/docs/api-reference/models/openai/list-models.md |
| 3 | Thinking control | `thinking: {"type":"adaptive"}` or `{"type":"disabled"}` (no `budget_tokens`). **MiniMax-M3:** off when omitted, on with `adaptive`, off with `disabled`. **MiniMax-M3.1-Flash:** always thinks, and `disabled` returns 400 (code 2013). Depth is set with `output_config.effort` = `low`\|`medium`\|`high`\|`xhigh`\|`max`, **default `max`**, and `none` returns 400. **M2.x:** "Thinking cannot be disabled", so `disabled` is accepted and ignored. The minimum for M3.1-Flash is `output_config.effort: "low"`. `temperature` is ignored (always 1 on M3 and M3.1-Flash). `top_p` is ignored (0.95) but must be in (0,1]. | https://platform.minimax.io/docs/api-reference/text-anthropic-api |
| 4 | Where reasoning appears | Content blocks with `type: "thinking"` and the text in `thinking` (streaming: `thinking_delta`). GitMind already filters to `text` blocks. On the OpenAI-compat API, `reasoning_split: true` puts it in `reasoning_content`; otherwise it appears inline as `<think>` in `content`. | https://platform.minimax.io/docs/api-reference/text-anthropic-api ; https://platform.minimax.io/docs/api-reference/text-chat-openai.md |
| 5 | Prompt too long | No context-length error code is documented. Nearest codes: 1039 "token limit" (retry later), 2013 "invalid params". | https://platform.minimax.io/docs/api-reference/errorcode.md |

**Critical:** "The Anthropic API compatibility interface currently only supports the `MiniMax-M3.1-Flash` `MiniMax-M3` models. For other models, please use the standard MiniMax API interface." So M2.7 and M2.7-highspeed in GitMind's curated list are not supported on the endpoint GitMind calls. Source: https://platform.minimax.io/docs/api-reference/text-anthropic-api

### MiniMax model status (row 6)

Retirement notice: "we'll be retiring the MiniMax M2.5 and M2.7 model families". From October 19, 2026 they are "no longer available to new users". "November 18, 2026: These models will be retired… Once retired, API requests to these models will no longer work." On M Plan and Token Plan, from Oct 19, 2026, requests are "automatically routed to M3.1 Flash". The FAQ table already marks M2.7, M2.7-highspeed, M2.5, M2.5-highspeed, M2.1, M2.1-highspeed and M2 as "Retired". Source: https://platform.minimax.io/docs/faq/models.md

| Model ID | Status | Context | Max output | Source |
|---|---|---|---|---|
| MiniMax-M3 (default) | active (released 2026-06-01) | 1M | max 524288 / recommended 131072 (OpenAI-compat `max_completion_tokens`) | https://platform.minimax.io/docs/guides/models-intro ; https://platform.minimax.io/docs/api-reference/text-chat-openai.md ; https://platform.minimax.io/docs/release-notes/models.md |
| MiniMax-M2.7 | **deprecated: closed to new users 2026-10-19, retired 2026-11-18** (FAQ already shows "Retired"); not supported on the Anthropic endpoint | `undocumented` | 204800 max on OpenAI-compat ("other models") | https://platform.minimax.io/docs/faq/models.md |
| MiniMax-M2.7-highspeed | **same as M2.7** (FAQ shows "Retired") | `undocumented` | `undocumented` | same |
| (not curated) MiniMax-M2.5, -highspeed, M2, M2.1 | retired (M2.5: 2026-11-18; M2/M2.1: date `undocumented`) | | | same |

**Current recommended text models** (models-intro lists only these two):
- `MiniMax-M3.1-Flash`: 1M context, max output 524288 (recommended 131072). Released 2026-10-19. Always thinks.
- `MiniMax-M3`: 1M context, max output 524288 (recommended 131072).

**Proposed curated list:** `["MiniMax-M3", "MiniMax-M3.1-Flash"]`. These are the only two text models currently listed and the only two the Anthropic endpoint accepts.
**Default:** keep `MiniMax-M3`. It is not retired, and its thinking is off when omitted, which suits commit messages.
**Code follow-ups:** remove the M2.x entries from `MODEL_CONFIGS`. Add `MiniMax-M3.1-Flash`, which currently falls back to the M3 config of 2000 tokens. Because it always thinks at default effort `max`, it should also send `output_config: {effort: "low"}` and a larger `max_tokens`, or the response may contain no text. Update the hardcoded `MiniMax-M2.7` fallback that validation may use.

---

## Inception Labs

**What GitMind calls** (`src/services/api/inception.ts`): `POST https://api.inceptionlabs.ai/v1/chat/completions`. Body: `model`, `messages`, **both** `max_tokens` and `max_completion_tokens` (= maxTokens ?? 2048), `temperature`. No `reasoning_effort`. It reads `message.content` and falls back to `message.reasoning_content`. Model list: `GET /v1/models`. Catalog: `defaultModel: "mercury-2.5"`, curated `["mercury-3","mercury-2.5","mercury-2"]`.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget | `max_completion_tokens` (optional). It "Supersedes `max_tokens`", takes precedence when both are sent, and covers visible plus reasoning tokens. `max_tokens` is deprecated. Schema range is 1 to 131072. Per-model maxima: mercury-2 50,000; mercury-2.5 65,536; mercury-3 131,072. **Defaults when omitted:** mercury-2 16,384; mercury-2.5 16,384 (65,536 when effort is `high`); mercury-3 24,576 (8,192 at `instant`, 65,536 at `medium`, 131,072 at `high`). | https://docs.inceptionlabs.ai/api-reference/chat/create-a-chat-completion.md |
| 2 | Metadata / model list | `GET /v1/models` returns per model `context_length`, `max_output_length`, `supported_endpoints`, `supported_features`, `supported_sampling_parameters` (temperature, stop), `pricing`, and other fields. | https://docs.inceptionlabs.ai/api-reference/models/list-available-models.md |
| 3 | Thinking control | `reasoning_effort` = `instant` \| `low` \| `medium` \| `high`. Applies to mercury-3, mercury-2.5 and mercury-2. Defaults: the reasoning guide says mercury-3 `low` and mercury-2.5 / mercury-2 `medium`; the API reference says the default is `medium` with no model distinction (**conflict between the two pages**). Minimum is `instant`. The API reference documents `instant` only for mercury-3, while the reasoning guide lists it for all three. No model is documented as rejecting the parameter. | https://docs.inceptionlabs.ai/capabilities/reasoning-efforts.md ; https://docs.inceptionlabs.ai/api-reference/chat/create-a-chat-completion.md |
| 4 | Where reasoning appears | No `reasoning_content` field is documented. An optional `reasoning_summary` object `{content, status: complete\|unavailable\|skipped}` is returned only when requested with `reasoning_summary: true`. The count is in `usage.completion_tokens_details.reasoning_tokens`. GitMind's `reasoning_content` fallback is therefore undocumented. | https://docs.inceptionlabs.ai/api-reference/chat/create-a-chat-completion.md |
| 5 | Prompt too long | HTTP 400, `{"error":{"message":"You exceeded the maximum context length for this model of 128000. Please reduce the length of the messages or completion.","type":"invalid_request_error","param":"messages","code":"context_length_exceeded"}}`. Unknown model: 404 `model_not_found`. | same |

### Inception model status (row 6)

No changelog or deprecation page exists in the docs index (https://docs.inceptionlabs.ai/llms.txt). All three curated models appear on the current models page.

| Model ID | Status | Context | Max output | Source |
|---|---|---|---|---|
| mercury-3 | active | 1M (1,000,000) | 131,072 | https://docs.inceptionlabs.ai/get-started/models.md ; https://docs.inceptionlabs.ai/api-reference/models/list-available-models.md |
| mercury-2.5 (default) | active | 260K (260,000) | 65,536 | same |
| mercury-2 | active | 128K (128,000) | 50,000 | same |

Other current models: `mercury-edit-2` (FIM/edit only, 32K / 8,192), `mercury-decide` (decisions endpoint only), and Mercury Voice (enterprise, ID not published). None of these are chat text models usable by GitMind.

**Proposed curated list:** unchanged, `["mercury-3", "mercury-2.5", "mercury-2"]`. **Default:** keep `mercury-2.5`.
**Code follow-up:** drop the deprecated `max_tokens` and send only `max_completion_tokens`. Consider `reasoning_effort: "instant"` or `"low"`, since reasoning tokens count against the budget.

---

## LM Studio (local OpenAI-compatible server)

**What GitMind calls** (`src/services/api/lmstudio.ts` → `openaiCompatible.ts`): `POST {url}/chat/completions` (default `http://127.0.0.1:1234/v1`, loopback only) with `max_tokens: maxTokens ?? 1000`. Models: `GET {url}/models`. No reasoning parameters. Catalog: no default model, no curated list.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget | `max_tokens` (in the supported-params list). `max_completion_tokens` is not listed. Default and maximum: `undocumented` for /v1. In the SDK, `maxTokens` set to `false` means "the model will predict as many tokens as it wants". The native REST `/api/v1/chat` uses `max_output_tokens` instead. | https://lmstudio.ai/docs/developer/openai-compat/chat-completions ; https://lmstudio.ai/docs/typescript/api-reference/llm-prediction-config-input ; https://lmstudio.ai/docs/developer/rest/chat |
| 2 | Metadata / model list | `GET /v1/models`: field schema `undocumented` (the page only says it "Returns the models visible to the server", possibly all downloaded models under JIT loading). The **native** `GET /api/v1/models` returns `max_context_length` (model maximum), `loaded_instances[].config.context_length` (actual loaded window, which can be lower, e.g. 4096 vs 262144), and `capabilities.reasoning {allowed_options: off\|on\|low\|medium\|high, default}`. No max-output field. | https://lmstudio.ai/docs/developer/openai-compat/models ; https://lmstudio.ai/docs/developer/rest/list |
| 3 | Thinking control | `/v1/chat/completions` accepts `reasoning_effort` (added in 0.4.8). Allowed values are not listed on the compat page. The native `/api/v1/chat` takes `reasoning` = `off`\|`low`\|`medium`\|`high`\|`on` and "Will error if the model being used does not support the reasoning setting". Default is "the automatically chosen setting for the model". Per-model allowed values come from `/api/v1/models` `capabilities.reasoning` (e.g. DeepSeek R1 allows only `on`). | https://lmstudio.ai/changelog/lmstudio/lmstudio-v0.4.8 ; https://lmstudio.ai/docs/developer/rest/chat ; https://lmstudio.ai/docs/developer/rest/list |
| 4 | Where reasoning appears | Since 0.4.7, "separate `reasoning_content` and `content` in API responses" is ON by default, so reasoning goes to `message.reasoning_content`. Users can turn this off in Developer Settings, in which case it appears inline as `<think>`. For gpt-oss, reasoning is in `choices.message.reasoning` (streaming: `delta.reasoning`). | https://lmstudio.ai/changelog/lmstudio-v0.4.7 ; https://lmstudio.ai/blog/lmstudio-v0.3.29 |
| 5 | Context exceeded | No HTTP error shape is documented. The SDK `contextOverflowPolicy` takes `stopAtLimit` (stop reason `contextLengthReached`), `truncateMiddle` (keeps the system prompt and first user message) or `rollingWindow`. The default is `undocumented`, and the setting is not exposed as a field on /v1. So **silent truncation is possible**, depending on the server's policy. | https://lmstudio.ai/docs/typescript/api-reference/llm-prediction-config-input |

Row 6: not applicable (no curated list).

---

## Ollama (local, native API)

**What GitMind calls** (`src/services/api/ollama.ts`): `POST {baseUrl}/api/generate` with `stream:false` and `options: { system, temperature, num_predict: maxTokens ?? 1024, num_ctx: max(4096, promptTokenCap+2048) when the cap is known }`. No `think`. Models: `GET /api/tags`. Catalog: `defaultModel: "phi4"`, no curated list.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget | `options.num_predict`, optional: "Maximum number of tokens to generate". **Default -1, "infinite generation"**. Maximum `undocumented`. `options.num_ctx`: "Context length size (number of tokens)". **The num_ctx default is documented inconsistently:** the Modelfile table says "Default: 2048"; the FAQ says "By default, Ollama uses a context window size of 4096 tokens"; the context-length page tiers it by VRAM ("< 24 GiB VRAM: 4k", "24-48 GiB: 32k", ">= 48 GiB: 256k"). The server-wide override is `OLLAMA_CONTEXT_LENGTH`. | https://docs.ollama.com/api/generate.md ; https://docs.ollama.com/modelfile ; https://docs.ollama.com/faq ; https://docs.ollama.com/context-length |
| 2 | Metadata / model list | `GET /api/tags` lists models. `POST /api/show` returns `model_info["<arch>.context_length"]` (e.g. `gemma4.context_length: 131072`), `capabilities` (e.g. `completion`, `thinking`, `vision`), `thinking: {values: [...], default}` (described as "Values explicitly supported by the model's `think` request field" / "Value used when `think` is not set"), and a `parameters` text field (may contain `num_ctx`). **No max-output field.** | https://docs.ollama.com/api-reference/show-model-details.md ; https://docs.ollama.com/api/tags.md |
| 3 | Thinking control | `think` on /api/generate and /api/chat: "`true` requests thinking, `false` requests no thinking output, and `null` uses the model default. String values are model-defined; supported names must match `/api/show` exactly. Numbers are not supported." The gpt-oss example shows `low`/`medium`/`high` with default `medium`. **"Unsupported names use the model default"**, meaning a fallback and not an error. A model with `thinking.values: [false]` does not support thinking. `false` disables thinking "if the model permits it". If `/api/show` has no `thinking` key, the model has no thinking metadata "and may still think". GitMind omits `think`, so the model default applies. | https://docs.ollama.com/api/generate.md ; https://docs.ollama.com/capabilities/thinking.md |
| 4 | Where reasoning appears | /api/generate: top-level `thinking`, separate from `response`. /api/chat: `message.thinking`, separate from `message.content`. | https://docs.ollama.com/capabilities/thinking.md ; https://docs.ollama.com/api/chat.md |
| 5 | Prompt exceeds num_ctx | Error shape is `{"error": "..."}` with status 400/404/429/500/502. Mid-stream errors arrive as an NDJSON object with `error`. **Whether prompts over num_ctx are silently truncated or rejected is `undocumented`.** The errors, FAQ, context-length and generate pages are all silent on it, and the generate/chat schemas have no `truncate` or `shift` field. GitMind's own comment assumes silent truncation, but no doc confirms it. | https://docs.ollama.com/api/errors.md ; https://docs.ollama.com/faq ; https://docs.ollama.com/context-length |

**Bug spotted:** `system` is a **top-level** GenerateRequest field ("System prompt for the model to generate a response from"), not a ModelOptions field. GitMind nests it inside `options`, where it is not a documented option (options allows `additionalProperties`), so it is most likely ignored. Source: https://docs.ollama.com/api/generate.md

Row 6: not applicable (no curated list; `phi4` default is a local library tag).

---

## Ollama Cloud (docs only)

**What GitMind calls** (`src/services/api/ollamacloud.ts`): OpenAI-compatible `POST https://ollama.com/v1/chat/completions` with `max_tokens: maxTokens ?? 4096`, `temperature`, and Bearer auth. Models: `GET https://ollama.com/api/tags`, falling back to `/v1/models`. No reasoning parameters.

| # | Item | Finding | Source |
|---|---|---|---|
| 1 | Output budget | `max_tokens` is supported on /v1/chat/completions. `max_completion_tokens` is not listed. Default and maximum: `undocumented`. | https://docs.ollama.com/api/openai-compatibility.md |
| 2 | Metadata / model list | `GET https://ollama.com/api/tags` "returns available cloud models". /v1/models documents only the `created` and `owned_by` semantics. The cloud page documents no context or output limits. `/api/show` fields as for local Ollama (row 2 above). | https://docs.ollama.com/cloud.md ; https://docs.ollama.com/api/openai-compatibility.md |
| 3 | Thinking control | /v1 accepts `reasoning_effort`, `reasoning`, and `reasoning.effort` ("model-defined names and compatibility aliases"; "Use `/api/show` to discover each model's supported values and default"). Aliases: `"minimal"` maps to `"low"`, `"xhigh"`/`"ultra"` map to `"max"`. For boolean-only models, `"none"` requests `false`. For GPT-OSS, `"none"` requests no thinking output. On native /api/chat, `think` works as for local Ollama. | https://docs.ollama.com/api/openai-compatibility.md ; https://docs.ollama.com/capabilities/thinking.md |
| 4 | Where reasoning appears | /v1 response reasoning field: `undocumented` (the compat page covers only request-side controls). Native /api/chat: `message.thinking`. | same |
| 5 | Prompt too long | `undocumented`. Generic error shape `{"error": "..."}`, with 502 when a cloud model cannot be reached. The OpenAI-compat API cannot set context size ("The OpenAI API does not have a way of setting the context size"). | https://docs.ollama.com/api/errors.md ; https://docs.ollama.com/api/openai-compatibility.md |

Model naming: in API requests use the listed name (e.g. `gemma4:31b`); `:cloud` suffixes are for the app/CLI (https://docs.ollama.com/cloud.md). The `-cloud` suffixed IDs in GitMind's catalog should be cross-checked against the live data already collected.

---

## Custom API adapter (code only, `src/services/api/custom.ts`)

| Wire format (`requestFormat`) | Request body | Output budget injected | Response extraction (`responseFormat`) |
|---|---|---|---|
| empty / `openai` | `{model, messages:[system,user], temperature}` | `max_tokens` (default 2048) + `temperature` | `choices[0].message.content` or `choices[0].text`, with `<think>` stripped |
| `anthropic` | the literal string is not valid JSON, so the parse fails and it falls back to the OpenAI-shaped body | `max_tokens` + `temperature` | `content[]` text blocks |
| `gemini` | same fallback (OpenAI-shaped body) | `generationConfig.maxOutputTokens` + `temperature` | `candidates[0].content.parts` or `output_text` |
| custom JSON template with `{{model}}`, `{{prompt}}`, `{{messages}}` placeholders | template with substitutions | **none** (the format string does not match the openai/anthropic/gemini keywords) | path expression such as `choices[0].message.content` |

Note: the `anthropic` and `gemini` keywords only change the injected budget field and the response parsing. The request body stays OpenAI-shaped (`messages` with a system role, no `contents`) because the keyword is not valid JSON and `buildRequestBody` falls back. This is derived from reading the code. Auth types: `bearer`, `apikey` (custom header, default `x-api-key`), `basic`.

---

