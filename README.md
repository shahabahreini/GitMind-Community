# GitMind: AI Commit Message Generator for VS Code

GitMind analyzes your Git diff and generates clear, professional commit messages inside VS Code. Choose from 17 built-in AI providers, run locally with Ollama, reuse GitHub Copilot, or connect a custom OpenAI-compatible API with GitMind Pro.

<div align="center">
  <img src="images/logo.png" alt="GitMind logo" width="160"/>
  <br/><br/>
  <a href="https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant">Install from the VS Code Marketplace</a>
</div>

## Highlights

- **18 provider options:** OpenAI, Anthropic, NVIDIA NIM, Google Gemini, MiniMax, DeepSeek, xAI Grok, Groq, Perplexity, Z.ai, Mistral, Cohere, Hugging Face, Together AI, OpenRouter, Ollama, GitHub Copilot, and Custom API.
- **Searchable, dynamic model selection:** Load current models from supported provider APIs and quickly filter large model catalogs.
- **Professional commit standards:** Conventional Commits, Angular, Semantic Release, Gitmoji, Linux Kernel, jQuery, Ember.js, and more.
- **Flexible Git workflow:** Generate from staged changes or enable Capture All Changes to include unstaged and untracked files.
- **Local and key-free options:** Use Ollama locally or an existing GitHub Copilot subscription.
- **Large diff support:** Token-aware processing keeps generation useful on substantial changes.

## Quick Start

1. Install GitMind from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant).
2. Open **GitMind Settings** and select an AI provider.
3. Add the provider API key when required, then load or search for a model.
4. Stage changes, or enable **Capture All Changes**.
5. Click the GitMind icon in Source Control or run **Generate GitMind Commit Message**.

```bash
ext install ShahabBahreiniJangjoo.ai-commit-assistant
```

## Supported Providers

| Provider | Setup | Model selection |
| --- | --- | --- |
| Google Gemini | API key | Searchable Gemini models |
| Hugging Face | Access token | Hosted model ID |
| Ollama | Local server, no API key | Local model discovery |
| Mistral AI | API key | Dynamic model discovery |
| Cohere | API key | Dynamic model discovery |
| OpenAI | API key | Dynamic model discovery |
| Together AI | API key | Dynamic model discovery |
| OpenRouter | API key | Dynamic multi-provider catalog |
| Anthropic | API key | Dynamic model discovery |
| MiniMax | API key | Dynamic model discovery |
| GitHub Copilot | Active Copilot subscription | Available Copilot models |
| DeepSeek | API key | Chat and reasoning models |
| xAI Grok | API key | Dynamic model discovery |
| Groq | API key | Dynamic model discovery |
| Perplexity | API key | Dynamic model discovery |
| Z.ai | API key | GLM model selection |
| NVIDIA hosted NIM | API key from [NVIDIA Build](https://build.nvidia.com/models) | Dynamic NIM model discovery |
| Custom API | GitMind Pro | OpenAI-compatible endpoint and model |

Provider catalogs change frequently. GitMind loads current model lists where the provider supports discovery and falls back to known compatible models when necessary.

## Free And Pro

| Feature | Free | Pro |
| --- | --- | --- |
| Built-in AI providers | 17 | 17 |
| Custom API provider | Locked | Included |
| Searchable provider and model pickers | Included | Included |
| Basic and Conventional commit styles | Included | Included |
| Professional commit styles | Limited | Included |
| Emoji Enhancement | Visible, locked | Included |
| Automatic Recovery | Locked | Retry once and optionally switch models once |
| API key storage | VS Code settings | Encrypted SecretStorage |
| Target commit language | Default | Searchable language selection |
| Advanced model parameters | Automatic | Custom temperature, top-p, top-k, and token limits |
| Commit history learning | Locked | Included |
| Changelog generation | Locked | Included |

### Automatic Recovery

GitMind Pro can recover from selected generation failures without creating retry loops:

- Retries once for timeouts and eligible temporary Gemini service failures.
- Can switch once to a configured fallback model when the selected model reports a model-specific limit.
- Does not retry invalid API keys, account quota/rate limits, permission errors, or unrelated failures.
- Shows a clear notification explaining the failure, recovery action, and final result.

The fallback model picker is searchable and scoped to the currently selected provider.

## NVIDIA NIM

GitMind supports NVIDIA hosted NIM through its OpenAI-compatible LLM API.

1. Create an API key at [NVIDIA Build](https://build.nvidia.com/models).
2. Select **NVIDIA** in Model Settings.
3. Add the key and load the available hosted NIM models.
4. Search for a model and save your settings.

See the [NVIDIA NIM LLM API reference](https://docs.api.nvidia.com/nim/reference/llm-apis) for provider details.

## GitMind Pro Activation

Open **GitMind Settings > Pro** and activate using either:

- The license key from your purchase receipt.
- Your order ID and purchase email for order verification.

GitMind Pro is a one-time lifetime purchase. Activation, deactivation, and current Pro status are available directly in the redesigned settings panel.

## Privacy And Security

- GitMind sends the selected Git diff and prompt to the provider you configure.
- Ollama can keep generation local.
- GitMind Pro can store provider keys in VS Code SecretStorage.
- Debug logs redact sensitive values.
- Anonymous telemetry does not include source code, diffs, prompts, commit messages, API keys, or personal information.

Review the [Privacy Compliance Certificate](scripts/privacy-compliance-certificate.md) and [Telemetry Guide](scripts/COMPREHENSIVE_TELEMETRY_GUIDE.md) for details.

## Documentation

- [Custom API Guide](docs/custom-api-guide.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Provider Integration Checklist](docs/API-Provider-Checklist.md)
- [Changelog Generation](docs/CHANGELOG_GENERATION.md)
- [Version Detection Patterns](docs/VERSION_DETECTION_PATTERNS.md)
- [Changelog](CHANGELOG.md)

## Requirements

- VS Code 1.96.0 or newer
- Git repository
- API key for the selected cloud provider, unless using Ollama or GitHub Copilot

## Support

- [Report an issue](https://github.com/shahabahreini/Gitmind-Pro/issues)
- [Sponsor development](https://github.com/sponsors/shahabahreini)

## License

[MIT](LICENSE.md)
