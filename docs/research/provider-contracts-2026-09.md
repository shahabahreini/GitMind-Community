# Provider and Pro Contract Inventory

> Reviewed 2026-09-02; provider rows re-verified 2026-09-22. This is an implementation contract, not a claim that
> every provider account has been live-tested. Live checks require an opt-in
> maintainer account and are covered by the release matrix.

## Provider inventory

> Re-verified 2026-09-22 against official provider documentation (see *Verification 2026-09-22*).
> Default policy (user direction, 2026-09-22): each default is the provider's latest recommended model, except where
> that model reasons by default and GitMind's output budget for the adapter would truncate the answer. Those cases
> keep the newest non-reasoning model and list the reasoning models first. Fallback lists lead with the newest documented models.
> All values below live in `src/config/providerCatalog.ts`, the single source of truth.

| Provider | Authentication | Discovery / selection | Generation contract | Failure path |
| --- | --- | --- | --- | --- |
| Gemini | API key | Provider list, cached; user model remains valid if removed from the list | Google GenAI `generateContent` | Normalized API error; preserve selected model |
| Hugging Face | Access token (Inference Providers permission) | Router `GET https://router.huggingface.co/v1/models` | Router `POST /v1/chat/completions` (OpenAI-compatible) | Normalized API error |
| Ollama | None; loopback URL | `/api/tags` | Local `/api/generate` | Local-service guidance; never send a local URL remotely |
| Mistral | API key | `/v1/models` | Chat Completions | Normalized API error |
| Cohere | API key | Provider-supported list | Chat API v2 | Normalized API error |
| OpenAI | API key | `/v1/models` | Chat Completions (still supported; Responses API recommended by OpenAI) | Normalized API error |
| Together AI | API key | `/v1/models` | Chat Completions | Normalized API error |
| OpenRouter | API key | `/api/v1/models` | Chat Completions | Normalized API error |
| Anthropic | API key | `/v1/models` | Messages API (`anthropic-version: 2023-06-01`) | Normalized API error |
| MiniMax | API key | Provider-supported list | Anthropic-compatible Messages | Normalized API error |
| GitHub Copilot | Editor's Copilot sign-in (VS Code language model API, consent on first request) | `vscode.lm.selectChatModels({ vendor: "copilot" })` from a user action | `LanguageModelChat.sendRequest` with `justification` | Detected state: unsupported-host / not-installed / no-access / no-models; errors by `LanguageModelError.code`; never API-key wording |
| DeepSeek | API key | `/models` | Chat Completions | Normalized API error |
| xAI Grok | API key | `/v1/models` | Chat Completions | Normalized API error |
| Groq | API key | `/openai/v1/models` | Chat Completions | Normalized API error |
| Perplexity | API key | No list endpoint; catalog Sonar models | **Agent API** `POST https://api.perplexity.ai/v1/agent` (`input`, `instructions`, `max_output_tokens`; text in `output_text`) | Normalized API error |
| Z.ai | API key | Catalog list | Endpoint-specific Chat Completions (general or coding plan) | Normalized API error |
| NVIDIA NIM | API key | `/v1/models` | Chat Completions | Normalized API error |
| Custom API (Pro) | User-configured secret | Manual model ID | User-selected compatible format | Explicit configuration error, never secret echo |
| LM Studio | None; loopback URL | OpenAI-compatible `/v1/models` | OpenAI-compatible `/v1/chat/completions` | Local-service guidance; loopback default |
| Azure OpenAI | Azure API key or Microsoft Entra token | Manual deployment name; no stale bundled deployment list | Azure OpenAI v1 `{endpoint}/openai/v1/chat/completions` (no `api-version` needed) | Normalized auth/deployment error; no token persistence |
| Amazon Bedrock | AWS default credential chain/profile | Manual model ID; no stale bundled foundation-model list | Bedrock Runtime Converse API | Normalized AWS credential/region/model error |
| Vertex AI | Application Default Credentials | Manual Vertex model ID; no stale bundled model list | Vertex AI via Google GenAI SDK | Normalized Google auth/project/location/model error |
| Cloudflare Workers AI | Cloudflare API token + account ID | Cloudflare model-search API when authorized; manual fallback | AI Gateway-compatible chat endpoint | Normalized account/token/model error |

### Verification 2026-09-22

| Provider | Verified | Sources | Default | Fallbacks (lead) | Changes needed |
| --- | --- | --- | --- | --- | --- |
| Gemini | 2026-09-22 | [Gemini models](https://ai.google.dev/gemini-api/docs/models) | `gemini-3.8-flash` (documented recommended default; was `gemini-3.5-flash`) | `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-pro-preview` | Fallbacks refreshed; `gemini-2.5-*` removed (no longer listed as stable) |
| Hugging Face | 2026-09-22 | [Inference Providers](https://huggingface.co/docs/inference-providers/index); live `GET router.huggingface.co/v1/models` | `meta-llama/Llama-3.3-70B-Instruct` (was `mistralai/Mistral-7B-Instruct-v0.3`, not served; gpt-oss is a reasoning model and the adapter budget is 500 tokens) | `openai/gpt-oss-20b`, `meta-llama/Llama-3.3-70B-Instruct`, `deepseek-ai/DeepSeek-V4.1-Flash` | **Applied:** migrate from legacy `api-inference.huggingface.co` to the router; fix the provider-name heuristic that rejected `org/model` IDs |
| Ollama | 2026-09-02 | [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md) | `phi4` | Local discovery | None (local API unchanged; not re-fetched this pass) |
| Mistral | 2026-09-22 | [Models overview](https://docs.mistral.ai/getting-started/models/models_overview/), [Mistral Small 4](https://docs.mistral.ai/models/mistral-small-4-0-26-03) | `mistral-small-2603` (was `mistral-small-4`, not a documented API name) | `mistral-large-2512`, `ministral-3-*-2512`, `codestral-2508` | Default and fallbacks corrected to documented API names |
| Cohere | 2026-09-22 | [Cohere models](https://docs.cohere.com/docs/models) | `command-a-plus-05-2026` (unchanged) | `north-mini-code-1-0`, `command-a-reasoning-08-2025` | **Applied:** adapter no longer rejects live-discovered models outside its enum |
| OpenAI | 2026-09-22 | [Models](https://developers.openai.com/api/docs/models), [Deprecations](https://developers.openai.com/api/docs/deprecations) | `gpt-6-sol` (newest flagship family, balanced tier; was `gpt-5.6-terra`) | `gpt-6-sol`, `gpt-6-luna`, `gpt-6-astra`, `gpt-5.6-*` | Fallbacks add GPT-6. Chat Completions has no deprecation date; Responses migration is not required |
| Together AI | 2026-09-22 | [Serverless models](https://docs.together.ai/docs/serverless-models) | `meta-llama/Llama-3.3-70B-Instruct-Turbo` (still listed; newer listed models are reasoning models) | `openai/gpt-oss-120b`, `deepseek-ai/DeepSeek-V4.1-Flash`, `Qwen/Qwen3.8-Flash` | Retired Llama 3.1 / Qwen2.5 / R1-Distill fallbacks removed |
| OpenRouter | 2026-09-22 | Live `GET openrouter.ai/api/v1/models` | `openrouter/free` (was `google/gemma-3-27b-it:free`, no longer listed) | `openrouter/auto`, `google/gemini-3.8-flash`, `anthropic/claude-sonnet-5`, `openai/gpt-6-sol` | Default moved to the Free Models Router, which survives free-model churn |
| Anthropic | 2026-09-22 | [Models overview](https://platform.claude.com/docs/en/models/overview) | `claude-sonnet-5` (latest Sonnet; unchanged). **Applied:** Opus 5.5 and Fable 5.1 always think, so they get an 8000-token budget and no sampling parameters; key validation uses `claude-haiku-4-5` instead of the retired `claude-3-5-haiku-20241022` | `claude-opus-5-5`, `claude-fable-5-1`, `claude-haiku-4-5` | Fallbacks refreshed (legacy `claude-opus-4-8`, `claude-fable-5` removed) |
| MiniMax | 2026-09-22 | [Models intro](https://platform.minimax.io/docs/guides/models-intro) | `MiniMax-M3` (newest; was `MiniMax-M2.7`; output budget 2000) | `MiniMax-M3`, `MiniMax-M2.7-highspeed` | Legacy `MiniMax-M2.5` removed from fallbacks |
| GitHub Copilot | 2026-09-22 | [VS Code language model API](https://code.visualstudio.com/api/extension-guides/ai/language-model) | `auto` | Live discovery only | **Applied:** state detection, `LanguageModelError.code` mapping, no cross-model retry, consent `justification`, one-request Test Connection, `onDidChangeChatModels` |
| DeepSeek | 2026-09-22 | [Pricing / models](https://api-docs.deepseek.com/quick_start/pricing) | `deepseek-flash` (was `deepseek-v4-flash`, a retired legacy name) | `deepseek-v4-pro` | **Applied:** adapter accepts the new name (legacy name still accepted) |
| xAI Grok | 2026-09-22 | [xAI models](https://docs.x.ai/docs/models) | `grok-4.7` (was `grok-4.4`, no longer listed) | `grok-4.6`, `grok-4.5`, `grok-4.3` | Default and fallbacks refreshed |
| Groq | 2026-09-25 | [Groq models](https://console.groq.com/docs/models), [Deprecations](https://console.groq.com/docs/deprecations) | `openai/gpt-oss-120b` (was `llama-3.3-70b-versatile`, decommissioned 2026-08-16; `llama-3.1-8b-instant` restricted to enterprise; adapter budget expanded to 1000 tokens with `stripThinking`) | `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b` | **Applied:** Default and curated models updated to active chat models; non-chat discovery filter added; retired Llama 3 models auto-migrated; error normalization via `ProviderApiError` |
| Perplexity | 2026-09-22 | [Migrate from Sonar](https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar/how-to), [Quickstart](https://docs.perplexity.ai/docs/agent-api/quickstart.md), [Models](https://docs.perplexity.ai/docs/agent-api/models.md) | `sonar-pro` (accepted by the Agent API) | `sonar`, `sonar-reasoning-pro` | **Applied:** Sonar Chat Completions support ends **2026-09-27**; generation and validation moved to `POST /v1/agent`; the model list no longer calls a non-existent endpoint |
| Z.ai | 2026-09-22 | [Z.ai pricing/models](https://docs.z.ai/guides/overview/pricing) | `glm-5.3` (newest; was `glm-5.1`) | `glm-5.3`, `glm-5.3-flash`, `glm-5.3-flashx`, `glm-5.2` | Fallbacks refreshed. Endpoint base URLs not re-verified (not on the page); unchanged from 2026-09-02 |
| NVIDIA NIM | 2026-09-22 | Live `GET integrate.api.nvidia.com/v1/models` | `nvidia/nemotron-3-super-120b-a12b` (was `meta/llama-3.3-70b-instruct`, no longer listed). **Applied:** requests send `chat_template_kwargs.enable_thinking=false` ([NIM reference](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-super-120b-a12b)) and `<think>` traces are stripped | `openai/gpt-oss-20b`, `deepseek-ai/deepseek-v4.1-flash`, `z-ai/glm-5.3-flash` | Default and fallbacks refreshed |
| Custom API | 2026-09-22 | N/A: user-defined endpoint; no provider documentation applies | — | — | None |
| LM Studio | 2026-09-02 | [LM Studio server API](https://lmstudio.ai/docs/developer/core/server) | — | Local discovery | None (not re-fetched this pass) |
| Azure OpenAI | 2026-09-22 | [v1 API lifecycle](https://learn.microsoft.com/azure/foundry/openai/api-version-lifecycle) | Deployment name | — | None: the adapter already uses `/openai/v1` |
| Amazon Bedrock | 2026-09-02 | [Bedrock APIs](https://docs.aws.amazon.com/bedrock/latest/userguide/apis.html) | Manual model ID | — | None (Converse unchanged; not re-fetched this pass) |
| Vertex AI | 2026-09-02 | [Vertex quickstart](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstart) | Manual model ID | — | None (not re-fetched this pass) |
| Cloudflare Workers AI | 2026-09-02 | [OpenAI compatibility](https://developers.cloudflare.com/workers-ai/configuration/openai-compatibility/) | Manual model ID | — | None (not re-fetched this pass) |

Saved models equal to a retired shipped default are moved to the new default at activation (`SettingsMigrationService.migrateRetiredModelDefaults`). The previous value is kept in `globalState` under `gitmind.migration.retiredModelPrevious`.

### Admission and rollback

| New provider | Scope | Rollback boundary |
| --- | --- | --- |
| LM Studio | Local OpenAI-compatible chat and model discovery | Remove provider registration; stored settings remain inert |
| Azure OpenAI | v1 Chat Completions with API-key and Entra-token modes | Remove provider registration; do not delete secrets |
| Amazon Bedrock | Converse API through the official AWS SDK credential chain | Remove provider registration and dependency; preserve settings |
| Vertex AI | Google GenAI Vertex mode with ADC | Remove provider registration; preserve project/location/model settings |
| Cloudflare Workers AI | Account-scoped Chat Completions and model discovery | Remove provider registration; preserve account/token settings |

## Pro operation inventory

| Operation | Authority | Free behavior | Pro behavior | Verification boundary |
| --- | --- | --- | --- | --- |
| Custom API | Entitlement service | Locked; settings cannot grant access | Enabled only by verified entitlement | Command and configuration guard |
| Professional styles | Entitlement service | Locked/default safe style | Allowed | Style selection and generation guard |
| Emoji enhancement | Entitlement service | Visible but locked | Allowed | Command guard |
| Automatic recovery | Entitlement service | Disabled | Bounded one retry / one fallback switch | Recovery policy tests |
| Advanced parameters | Entitlement service | Provider-safe defaults | Validated bounded overrides | Configuration and request tests |
| Commit-history learning | Entitlement service | Locked | Allowed | Command guard and storage tests |
| Changelog generation | Entitlement service | Locked | Allowed | Command guard and output tests |
| Support report | Entitlement service | Locked | Local, review-before-share report | Secret-redaction tests |
| Secret encryption | VS Code SecretStorage | Legacy/settings compatibility only | Secure storage available to all secret-bearing providers | No plaintext logging or migration loss |

## Primary references used for new-provider contracts

- [LM Studio local server](https://lmstudio.ai/docs/app) and [developer server API](https://lmstudio.ai/docs/developer/core/server)
- [Azure OpenAI v1 Chat Completions](https://learn.microsoft.com/en-us/rest/api/microsoft-foundry/azureopenai/chat)
- [Amazon Bedrock APIs](https://docs.aws.amazon.com/bedrock/latest/userguide/apis.html)
- [Vertex AI quickstart and authentication](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstart)
- [Cloudflare AI Gateway REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/) and [model search](https://developers.cloudflare.com/api/resources/ai/subresources/models/methods/search/)

The UI must not use a bundled model list as an authority. Where a provider cannot reliably enumerate models for the current identity, GitMind presents an explicit model-ID field and preserves an existing valid selection.
