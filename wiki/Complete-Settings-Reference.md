# Complete Settings Reference

> Verified against GitMind `5.0.0` on June 7, 2026.

Open **GitMind Setting** for the guided UI. The table below covers user-configurable settings. API keys and auth tokens have no default. Developer-only environment settings and automatically managed license/subscription state are intentionally omitted.

## General And Free Features

| Setting | Default | Values / notes |
| --- | --- | --- |
| `gitmind.apiProvider` | `gemini` | 17 built-ins plus Pro `custom` |
| `gitmind.debug` | `false` | Detailed redacted API/debug output |
| `gitmind.showOnboarding` | `true` | Show onboarding |
| `gitmind.commit.verbose` | `true` | Include body |
| `gitmind.commit.captureAllChanges` | `false` | Include staged, unstaged, untracked |
| `gitmind.showDiagnostics` | `false` | Show model/token information |
| `gitmind.telemetry.enabled` | `false` | Anonymous usage analytics; also respects VS Code telemetry |
| `gitmind.promptCustomization.enabled` | `false` | Ask for custom context |
| `gitmind.promptCustomization.saveLastPrompt` | `false` | Prefill last context |

## Provider Settings

| Provider | Settings | Defaults / values |
| --- | --- | --- |
| Gemini | `gitmind.gemini.apiKey`, `gitmind.gemini.model` | `gemini-3.1-flash` |
| Hugging Face | `gitmind.huggingface.apiKey`, `gitmind.huggingface.model` | `mistralai/Mistral-7B-Instruct-v0.3` |
| Ollama | `gitmind.ollama.url`, `gitmind.ollama.model` | `http://localhost:11434`, `phi4` |
| Mistral | `gitmind.mistral.apiKey`, `gitmind.mistral.model` | `mistral-small-4` |
| Cohere | `gitmind.cohere.apiKey`, `gitmind.cohere.model` | `command-a` |
| OpenAI | `gitmind.openai.apiKey`, `gitmind.openai.model` | `gpt-5.5-instant` |
| Together AI | `gitmind.together.apiKey`, `gitmind.together.model` | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| OpenRouter | `gitmind.openrouter.apiKey`, `gitmind.openrouter.model` | `google/gemma-3-27b-it:free` |
| Anthropic | `gitmind.anthropic.apiKey`, `gitmind.anthropic.model` | `claude-sonnet-4.6` |
| MiniMax | `gitmind.minimax.apiKey`, `gitmind.minimax.model` | `MiniMax-M2.7` |
| Copilot | `gitmind.copilot.model` | `auto` |
| DeepSeek | `gitmind.deepseek.apiKey`, `gitmind.deepseek.model` | `deepseek-v4-flash` |
| Grok | `gitmind.grok.apiKey`, `gitmind.grok.model` | `grok-4.3` |
| Groq | `gitmind.groq.apiKey`, `gitmind.groq.model` | `meta-llama/llama-4-scout-17b-16e-instruct` |
| Perplexity | `gitmind.perplexity.apiKey`, `gitmind.perplexity.model` | `gpt-5.5-computer` |
| Z.ai | `gitmind.zai.apiKey`, `gitmind.zai.model`, `gitmind.zai.endpoint` | `glm-5.1`; `regular` or `coding` (default) |
| NVIDIA | `gitmind.nvidia.apiKey`, `gitmind.nvidia.model` | `meta/llama-3.3-70b-instruct` |

## Commit Style And Pro Output

| Setting | Default | Values / range |
| --- | --- | --- |
| `gitmind.commitStyle.style` | `conventional` | `basic`, `conventional`, `conventional-no-scope`, `angular`, `ember`, `emojigit`, `gitmoji`, `semantic`, `commitizen`, `karma`, `linux`, `jquery` |
| `gitmind.commitStyle.gitmoji.enabled` | `false` | Pro |
| `gitmind.commitStyle.gitmoji.placement` | `summary` | `summary`, `body`, `both`; Pro |
| `gitmind.commitStyle.gitmoji.customEmojis` | `{}` | Type-to-emoji object; Pro |
| `gitmind.commit.targetLanguage` | `english` | Searchable language list; Pro |
| `gitmind.pro.commitBodyOptions.enabled` | `false` | Enable body line cap; Pro |
| `gitmind.pro.commitBodyOptions.maxLines` | `5` | 2-15; enabled dependency |
| `gitmind.pro.commitLengthOptions.enabled` | `false` | Enable summary cap; Pro |
| `gitmind.pro.commitLengthOptions.maxLength` | `72` | 50-100; enabled dependency |

## Pro Model, Recovery, History, And Changelog

| Setting | Default | Values / range |
| --- | --- | --- |
| `gitmind.pro.encryptionEnabled` | `false` | Store provider keys in VS Code SecretStorage; Pro |
| `gitmind.pro.orderId` | None | Purchase order ID entered during Pro activation; keep private |
| `gitmind.pro.advancedModelConfig.mode` | `auto` | `auto` or `custom`; Pro |
| `gitmind.pro.advancedModelConfig.temperatureEnabled` / `.temperature` | `false` / `0.2` | 0-2; custom mode; provider support varies |
| `gitmind.pro.advancedModelConfig.topPEnabled` / `.topP` | `false` / `0.9` | 0-1; custom mode |
| `gitmind.pro.advancedModelConfig.topKEnabled` / `.topK` | `false` / `40` | 0-500; custom mode |
| `gitmind.pro.advancedModelConfig.maxTokensEnabled` / `.maxTokens` | `false` / `350` | 1-65536; custom mode |
| `gitmind.pro.automaticRetry.enabled` | `false` | Retry one eligible failure; Pro |
| `gitmind.pro.modelFallback.enabled` | `false` | Try one provider-scoped fallback; Pro |
| `gitmind.pro.modelFallback.models` | `{}` | Provider-to-model map; Pro |
| `gitmind.pro.learnFromCommitHistory.enabled` | `true` | Pro |
| `gitmind.pro.learnFromCommitHistory.maxCommits` | `50` | 10-2500 |
| `gitmind.pro.learnFromCommitHistory.includeAuthorInfo` | `true` | Include author/date |
| `gitmind.pro.changelog.enabled` | `true` | Pro |
| `gitmind.pro.changelog.maxCommitsEnabled` | `false` | Applies when no version tags |
| `gitmind.pro.changelog.maxCommits` | `100` | 2-2500; no-tag fallback |
| `gitmind.pro.changelog.groupByVersion` | `true` | Use version groups |
| `gitmind.pro.changelog.maxVersions` | `10` | 1-25 |
| `gitmind.pro.changelog.versionOrder` | `newest-first` | `newest-first`, `oldest-first` |
| `gitmind.pro.changelog.overwriteExisting` | `false` | Preserve existing entries by default |

## Custom API (Pro)

| Setting | Default / values |
| --- | --- |
| `gitmind.custom.enabled` | `false` |
| `gitmind.custom.baseUrl`, `gitmind.custom.endpoint`, `gitmind.custom.model` | User supplied |
| `gitmind.custom.authType` | `bearer`; `bearer`, `apikey`, `basic`, `none` |
| `gitmind.custom.authToken`, `gitmind.custom.headerKey` | User supplied |
| `gitmind.custom.requestFormat`, `gitmind.custom.responseFormat` | `openai`, `anthropic`, or `custom` |

See [Custom API Guide](Custom-API-Guide) and [Security And Privacy](Security-And-Privacy). Do not put credentials in workspace settings committed to Git.
