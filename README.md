# GitMind: AI-Powered Commit Messages

Stop writing commit messages manually. GitMind analyzes your code changes and generates meaningful commits in seconds using 13 AI providers and 50+ models.

## Why GitMind?

**One Extension, 13 AI Providers**
Choose from OpenAI, Anthropic, Google Gemini, DeepSeek, Grok, Perplexity, Mistral, Cohere, HuggingFace, Together AI, OpenRouter, Ollama, or GitHub Copilot. Switch anytime.

**Zero Setup Options Available**
- GitHub Copilot: Works instantly if you have an active subscription
- Ollama: Free, private, offline AI running locally
- Google Gemini: Industry-leading free tier (15 RPM, 2M context)

**Professional Standards Built In**
Generate commits following Angular, Conventional Commits, Linux Kernel, jQuery, Ember.js, Semantic Release, and more. No configuration required.

**Handles Large Projects**
Adaptive chunking processes massive diffs without hitting token limits. Tested with 10MB+ repositories.

---

## Installation

Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant)

```bash
ext install ShahabBahreiniJangjoo.ai-commit-assistant
```

---

## Quick Start

### 1. Pick Your AI Provider

| Provider | Best For | Free Tier | Setup Time |
|----------|----------|-----------|------------|
| **GitHub Copilot** | Zero setup, existing subscribers | No | 0 min |
| **Google Gemini** | Best free tier (15 RPM, 2M context) | Yes | 2 min |
| **Ollama** | Complete privacy, offline usage | Unlimited | 5 min |
| **DeepSeek** | Advanced reasoning, cost-effective | 50 RPM | 2 min |
| **OpenAI** | Industry standard, multimodal | No | 2 min |
| **Anthropic** | Superior reasoning, long context | No | 2 min |

### 2. Configure

1. Open VS Code Source Control panel
2. Click settings icon in GitMind section
3. Select provider
4. Add API key (not needed for GitHub Copilot or Ollama)
5. Choose model

### 3. Generate

1. Stage changes
2. Click AI button in Source Control
3. Review generated message
4. Commit

---

## AI Provider Support

### All Supported Providers

| Provider | Featured Models | Context | API Setup |
|----------|----------------|---------|-----------|
| **GitHub Copilot** | gpt-4o, claude-3.5-sonnet, o3 | 128k | [VS Code Copilot](https://copilot.github.com/) |
| **Google Gemini** | 2.5-flash, 2.5-pro, 2.0-flash | 2M | [AI Studio](https://ai.google.dev/gemini-api/docs/api-key) |
| **Grok (X.ai)** | grok-3, grok-3-fast, grok-3-mini | 128k | [X.ai Console](https://console.x.ai/) |
| **DeepSeek** | reasoner, chat | 128k | [DeepSeek Platform](https://platform.deepseek.com/) |
| **Perplexity** | sonar-pro, sonar-reasoning, sonar | 127k | [Perplexity Settings](https://www.perplexity.ai/settings/api) |
| **Mistral AI** | large-latest, medium, small | 128k | [Mistral Console](https://console.mistral.ai/) |
| **Ollama** | deepseek-r1, llama3.3, phi4, qwen3 | 128k | [Ollama Download](https://ollama.com/download) |
| **OpenAI** | gpt-4o, gpt-4.1, o3, o4-mini | 128k | [OpenAI Platform](https://platform.openai.com/signup) |
| **Anthropic** | claude-opus-4, sonnet-4, haiku | 200k | [Anthropic Console](https://console.anthropic.com/) |
| **Together AI** | Llama-3.3-70B, Mixtral-8x7B | 128k | [Together Platform](https://api.together.ai/) |
| **Hugging Face** | Mistral-7B, Zephyr-7B, OpenHermes | 32k | [HF Token](https://huggingface.co/settings/tokens) |
| **Cohere** | command-r, command-a-03-2025 | 128k | [Cohere Dashboard](https://dashboard.cohere.ai/) |
| **OpenRouter** | Multiple providers & models | Varies | [OpenRouter Keys](https://openrouter.ai/keys) |

---

## Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| **AI Providers** | 13 providers (all) | 13 providers (all) |
| **Models** | 50+ models | 50+ models |
| **Commit Styles** | Basic, Conventional | 11 professional styles |
| **Git Integration** | Yes | Yes |
| **Multi-Repository Support** | Yes | Yes |
| **Diagnostics & Token Estimation** | Yes | Yes |
| **Verbose/Concise Messages** | Yes | Yes |
| **Prompt Customization** | Yes | Yes + Save Last Prompt |
| **API Key Storage** | Plain text | Encrypted (SecretStorage) |
| **Large Diff Processing** | Limited | Token-aware chunking |
| **Commit Body Lines** | Fixed (5 lines) | Configurable (3-15) |
| **Summary Length** | Fixed | Configurable (50-100 chars) |
| **Commit History Analysis** | ✗ | ✓ |
| **Changelog Generation** | ✗ | ✓ |
| **Gitmoji Support** | ✗ | ✓ |
| **Custom API Endpoints** | ✗ | ✓ |
| **Multi-Device License** | Single device | Multiple devices |

---

## Features

### Core (Free)

**Multi-Provider AI**
Access 13 providers with unified configuration. Switch providers instantly.

**Conventional Commits**
Automatic type detection (`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`), scope extraction, breaking change identification.

**Smart Diff Analysis**
Automatic staging detection, binary file handling, merge conflict awareness.

**Repository Integration**
Native VS Code SCM panel. Multi-repository workspace support with independent buttons per repository.

**Diagnostics**
Token estimation, provider/model summary, request preview.

### Pro Features

**Professional Commit Styles**
11 industry-standard formats: Angular, Ember.js, EmojiGit, Gitmoji, Semantic Release, Commitizen, Karma, Linux Kernel, jQuery, plus Basic and Conventional.

**Changelog Generation**
AI-powered changelog from git history with:
- 3-tier version detection (git tags, commit messages, package.json)
- Existing changelog policy awareness (format, categories, emoji usage preserved)
- Keep a Changelog specification compliance
- Token management for 1000+ commits
- Multi-language project support

**Commit History Analysis**
Learn from repository patterns. Analyzes past commits to match your project's conventions and style.

**Large Diff Processing**
Token-aware adaptive chunking with:
- Automatic split/merge for massive diffs
- Configurable concurrency
- Exponential backoff retry logic
- Progress reporting

**API Key Encryption**
Secure storage using VS Code SecretStorage API. Keys encrypted at rest.

**Advanced Customization**
- Custom commit body line limits (3-15 lines)
- Custom summary length limits (50-100 chars)
- Save/reuse custom prompts
- Gitmoji support with placement control
- Custom API provider endpoints

**Multi-Device License**
Use across multiple development machines.

---

## Screenshots

<div align="center">
  <img src="images/s-17.png" alt="Settings UI with 13 AI Providers" width="500"/>
  <br/><em>Settings UI with 13 AI Provider Support</em>
  <br/><br/>
  <img src="images/s-14.png" alt="Advanced Settings" width="400"/>
  <br/><em>Advanced Settings Panel (Pro)</em>
  <br/><br/>
  <img src="images/s-15.png" alt="Professional Commit Styles" width="400"/>
  <br/><em>Professional Commit Styles</em>
</div>

---

## Configuration

Access via Command Palette: `GitMind: Open Settings`

**Provider Settings**
- AI provider selection
- Secure API key configuration
- Model selection

**Message Formatting**
- Commit style (11 professional formats in Pro)
- Verbosity control (verbose/concise)
- Custom scope and type

**Pro Settings**
- Encrypted API key storage
- Commit history analysis
- Custom body/summary limits
- Gitmoji configuration
- Changelog generation

---

## Privacy

GitMind collects anonymous usage data (provider statistics, error reports, usage analytics). No code content, file names, personal information, API keys, or repository details are collected.

**Disable telemetry:**
1. Open VS Code Settings (Ctrl/Cmd + ,)
2. Search "telemetry"
3. Set "Telemetry: Telemetry Level" to "off"

---

## Requirements

- Visual Studio Code ^1.100.0
- Git repository (initialized)
- API key from chosen provider OR Ollama for local deployment

---

## Support

- Report issues: [GitHub Issues](https://github.com/shahabahreini/AI-Commit-Assistant/issues)
- Email: shahab.ahreini@gmail.com

---

## License

MIT License - see [LICENSE](LICENSE) for details
