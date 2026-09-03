# Provider and Pro Contract Inventory

> Reviewed 2026-09-02. This is an implementation contract, not a claim that
> every provider account has been live-tested. Live checks require an opt-in
> maintainer account and are covered by the release matrix.

## Provider inventory

| Provider | Authentication | Discovery / selection | Generation contract | Failure path |
| --- | --- | --- | --- | --- |
| Gemini | API key | Provider list, cached; user model remains valid if removed from the list | Google GenAI `generateContent` | Normalized API error; preserve selected model |
| Hugging Face | Access token | Manual hosted model ID | Inference API | Normalized API error |
| Ollama | None; loopback URL | `/api/tags` | Local `/api/generate` | Local-service guidance; never send a local URL remotely |
| Mistral | API key | `/v1/models` | Chat Completions | Normalized API error |
| Cohere | API key | Provider-supported list | Chat API | Normalized API error |
| OpenAI | API key | `/v1/models` | Responses/Chat-compatible adapter contract | Normalized API error |
| Together AI | API key | `/v1/models` | Chat Completions | Normalized API error |
| OpenRouter | API key | `/api/v1/models` | Chat Completions | Normalized API error |
| Anthropic | API key | Provider-supported list | Messages API | Normalized API error |
| MiniMax | API key | Provider-supported list | Chat Completions | Normalized API error |
| GitHub Copilot | VS Code Copilot session | Copilot model API | Copilot language-model API | Session / entitlement guidance |
| DeepSeek | API key | `/models` where available | Chat Completions | Normalized API error |
| xAI Grok | API key | `/v1/models` | Chat Completions | Normalized API error |
| Groq | API key | `/openai/v1/models` | Chat Completions | Normalized API error |
| Perplexity | API key | Provider-supported list | Sonar Chat Completions | Normalized API error |
| Z.ai | API key | Provider-supported list | Endpoint-specific Chat Completions | Normalized API error |
| NVIDIA NIM | API key | `/v1/models` | Chat Completions | Normalized API error |
| Custom API (Pro) | User-configured secret | Manual model ID | User-selected compatible format | Explicit configuration error, never secret echo |
| LM Studio | None; loopback URL | OpenAI-compatible `/v1/models` | OpenAI-compatible `/v1/chat/completions` | Local-service guidance; loopback default |
| Azure OpenAI | Azure API key or Microsoft Entra token | Manual deployment name; no stale bundled deployment list | Azure OpenAI v1 Chat Completions | Normalized auth/deployment error; no token persistence |
| Amazon Bedrock | AWS default credential chain/profile | Manual model ID; no stale bundled foundation-model list | Bedrock Runtime Converse API | Normalized AWS credential/region/model error |
| Vertex AI | Application Default Credentials | Manual Vertex model ID; no stale bundled model list | Vertex AI via Google GenAI SDK | Normalized Google auth/project/location/model error |
| Cloudflare Workers AI | Cloudflare API token + account ID | Cloudflare model-search API when authorized; manual fallback | AI Gateway-compatible chat endpoint | Normalized account/token/model error |

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
