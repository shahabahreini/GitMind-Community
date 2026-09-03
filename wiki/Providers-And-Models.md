# Providers And Models

> Verified against GitMind `6.1.2` on September 3, 2026.

GitMind has 22 built-in providers plus the Pro-only Custom API provider. Cloud providers receive the selected diff and prompt. Provider catalogs change; use **Load Available Models** and the searchable model picker when available.

![GitMind model settings and Automatic Recovery](assets/model-settings-and-recovery.png)

| Provider | Authentication / setup | Default | Discovery |
| --- | --- | --- | --- |
| [Google Gemini](https://aistudio.google.com/app/apikey) | API key | `gemini-3.1-flash` | Yes |
| [Hugging Face](https://huggingface.co/settings/tokens) | Access token | `mistralai/Mistral-7B-Instruct-v0.3` | Yes |
| [Ollama](https://ollama.com/library) | Local server; no key | `phi4`, `http://localhost:11434` | Local models |
| [Mistral](https://console.mistral.ai/) | API key | `mistral-small-4` | Yes |
| [Cohere](https://dashboard.cohere.com/api-keys) | API key | `command-a` | Yes |
| [OpenAI](https://platform.openai.com/api-keys) | API key | `gpt-5.5-instant` | Yes |
| [Together AI](https://api.together.xyz/settings/api-keys) | API key | `meta-llama/Llama-3.3-70B-Instruct-Turbo` | Yes |
| [OpenRouter](https://openrouter.ai/keys) | API key | `google/gemma-3-27b-it:free` | Yes |
| [Anthropic](https://console.anthropic.com/) | API key | `claude-sonnet-4.6` | Yes |
| [MiniMax](https://platform.minimax.io/docs/api-reference/text-anthropic-api) | API key | `MiniMax-M2.7` | Yes |
| GitHub Copilot | Signed-in Copilot extension/subscription | `auto` | Detects available models |
| [DeepSeek](https://platform.deepseek.com/api_keys) | API key | `deepseek-v4-flash` | Yes |
| [xAI Grok](https://console.x.ai/) | API key | `grok-4.3` | Yes |
| [Groq](https://console.groq.com/keys) | API key | `meta-llama/llama-4-scout-17b-16e-instruct` | Yes |
| [Perplexity](https://www.perplexity.ai/settings/api) | API key | `gpt-5.5-computer` | Yes |
| [Z.ai](https://z.ai/) | API key; regular or coding endpoint | `glm-5.1`, coding endpoint | Yes |
| [NVIDIA hosted NIM](https://build.nvidia.com/models) | NVIDIA Build API key | `meta/llama-3.3-70b-instruct` | Yes |
| LM Studio | Local loopback server; no key | Your locally loaded model | Local models |
| Azure OpenAI | API key or Microsoft Entra sign-in; Azure endpoint | Your deployment name | Azure OpenAI v1 models |
| Amazon Bedrock | AWS credentials or named profile; region | Explicit Bedrock model ID | Manual model ID |
| Vertex AI | Google Application Default Credentials; project and location | Explicit Vertex model ID | Manual model ID |
| Cloudflare Workers AI / AI Gateway | Cloudflare API token and account ID; optional gateway | Explicit Workers AI model ID | Endpoint-scoped models |
| Custom API | Pro; endpoint-specific auth | None | User configured |

## Setup And Checks

1. Select `gitmind.apiProvider`.
2. Enter the provider key, URL, or authentication required above.
3. Load models, search, and select one.
4. Use **Check API Setup** to validate connectivity and authentication.
5. Use **Check Rate Limits** for provider-reported limits. Results vary by provider and the check itself may consume a small request.

Ollama and LM Studio must be running locally; the selected model must already be available. GitHub Copilot must be installed, signed in, and licensed. Z.ai's `gitmind.zai.endpoint` selects `regular` or `coding`. Bedrock and Vertex AI use their respective local/cloud credential chains rather than an API-key field.

For private gateways and compatible endpoints, see [Custom API Guide](Custom-API-Guide). For provider failures, see [Troubleshooting And FAQ](Troubleshooting-And-FAQ).
