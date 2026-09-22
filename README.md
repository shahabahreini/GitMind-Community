# GitMind — AI Commit Message Generator for VS Code

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/ShahabBahreiniJangjoo.ai-commit-assistant?label=VS%20Marketplace&color=0078d4)](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/ShahabBahreiniJangjoo.ai-commit-assistant?color=brightgreen)](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/ShahabBahreiniJangjoo.ai-commit-assistant?color=yellow)](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant)
[![OpenVSX](https://img.shields.io/open-vsx/v/ShahabBahreiniJangjoo/ai-commit-assistant?label=OpenVSX&color=9b59b6)](https://open-vsx.org/extension/ShahabBahreiniJangjoo/ai-commit-assistant)

**Documentation:** [GitMind Wiki](https://github.com/shahabahreini/GitMind-Community/wiki) · [Quick Start](https://github.com/shahabahreini/GitMind-Community/wiki/Installation-And-Quick-Start) · [Providers](https://github.com/shahabahreini/GitMind-Community/wiki/Providers-And-Models) · [Troubleshooting](https://github.com/shahabahreini/GitMind-Community/wiki/Troubleshooting-And-FAQ)

GitMind turns your Git changes into clear commit messages, right inside VS Code. Choose from **22 built-in AI providers**, use local models, and review the result before you commit. Custom API is available with Pro.

[![GitMind advertisement: turn code changes into clear commits, choose your AI provider, and build readable Git history](images/screenshots/hero-generate.gif)](images/GitMind-Animation.mp4)

[Watch the 22-second video](images/GitMind-Animation.mp4) · [View the static preview](images/screenshots/hero-generate.png) · [Media downloads and sources](media/README.md)

*An illustrated product overview. Code and commit examples are illustrative.*

## See It In Action

[![Real GitMind demo in VS Code: clicking Generate GitMind Commit Message in Source Control writes a Conventional Commit message from staged changes](images/screenshots/demo-generate.gif)](https://gitmind-pro.com/assets/videos/Gitmind-pro-Demo.mp4)

A real recording: click GitMind in Source Control and get a commit message from your staged changes. [Watch the full 70-second demo](https://gitmind-pro.com/assets/videos/Gitmind-pro-Demo.mp4).

## Contents

- [See It In Action](#see-it-in-action)
- [This Repository](#this-repository)
- [Install](#install)
- [Highlights](#highlights)
- [Explore GitMind](#explore-gitmind)
- [Free And Pro](#free-and-pro)
- [Supported AI Providers](#supported-ai-providers)
- [Privacy](#privacy)
- [Requirements](#requirements)
- [Support](#support)

## This Repository

GitMind was open-source through **v3.5.7**. Starting with v4.0, the source is closed due to the addition of enterprise features. This repository is the **official community hub**; the archived source files are not the current distributable extension. Community documentation tracks the current **v6.2.1** release surface.

| Purpose                         | Link                                             |
| ------------------------------- | ------------------------------------------------ |
| Report a bug                    | [Open an issue](../../issues)                    |
| Request a feature               | [Submit a request](../../issues/new)             |
| Current release information     | [v6.2.1 changelog](CHANGELOG.md)                 |
| Install without the marketplace | [Download latest `.vsix`](../../releases/latest) |

Published [releases](../../releases) mirror the version published to the VS Code Marketplace and OpenVSX. The `.vsix` file can be installed directly in any compatible editor via **Extensions → Install from VSIX**.

## Install

**VS Code** → [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant)  
or Quick Open (`Ctrl+P` / `Cmd+P`): `ext install ShahabBahreiniJangjoo.ai-commit-assistant`

**VSCodium and other editors that use Open VSX** → [Open VSX Registry](https://open-vsx.org/extension/ShahabBahreiniJangjoo/ai-commit-assistant)

---

## Highlights

- **22 built-in providers plus Pro Custom API:** OpenAI, Anthropic, NVIDIA NIM, Google Gemini, MiniMax, DeepSeek, xAI Grok, Groq, Perplexity, Z.ai, Mistral, Cohere, Hugging Face, Together AI, OpenRouter, Ollama, GitHub Copilot, LM Studio, Azure OpenAI, Amazon Bedrock, Vertex AI, Cloudflare Workers AI/Gateway, and Pro Custom API.
- **Searchable, dynamic model selection:** Load current models from supported provider APIs and quickly filter large model catalogs.
- **Professional commit standards:** Conventional Commits, Angular, Semantic Release, Gitmoji, Linux Kernel, jQuery, Ember.js, and more.
- **Flexible Git workflow:** Generate from staged changes or enable Capture All Changes to include unstaged and untracked files.
- **Local and key-free options:** Use Ollama or LM Studio locally, or an existing GitHub Copilot subscription.
- **Pro workflows:** Compare three draft messages, check Commit Health, run a pre-commit AI review, plan atomic commits, and generate changelogs.
- **Large diff support:** Token-aware processing keeps generation useful on substantial changes.

## Explore GitMind

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="images/screenshots/nvidia-model-settings-automatic-recovery.png" alt="NVIDIA model settings and GitMind Pro Automatic Recovery"/>
      <h3 align="center">Models And Automatic Recovery</h3>
      <p align="center">Configure NVIDIA NIM and other providers, load searchable models, retry eligible temporary failures, and select a provider-scoped fallback model.</p>
    </td>
    <td width="50%" valign="top">
      <img src="images/screenshots/commit-style-selection.png" alt="GitMind professional commit style selection"/>
      <h3 align="center">Professional Commit Styles</h3>
      <p align="center">Choose Conventional Commits, Angular, Gitmoji, Semantic Release, Ember.js, and other structured formats.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="images/screenshots/pro-security-large-diff-model-configuration.png" alt="GitMind Pro encrypted key storage, large diff handling, and advanced model configuration"/>
      <h3 align="center">Security And Model Control</h3>
      <p align="center">Encrypt API keys, process large diffs, and tune advanced generation parameters when you need precise control.</p>
    </td>
    <td width="50%" valign="top">
      <img src="images/screenshots/commit-language-history-learning.png" alt="GitMind target commit language and commit history learning settings"/>
      <h3 align="center">Match Your Team</h3>
      <p align="center">Generate in your target language, control message length, and learn from existing commit history.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="images/screenshots/free-features-settings.png" alt="GitMind free feature settings"/>
      <h3 align="center">Useful Free Features</h3>
      <p align="center">Control verbose messages, capture all changes, custom context, and generation diagnostics.</p>
    </td>
    <td width="50%" valign="top">
      <img src="images/screenshots/changelog-generation.png" alt="GitMind AI changelog generation settings"/>
      <h3 align="center">AI Changelog Generation</h3>
      <p align="center">Generate professional changelogs from Git history with version grouping and configurable commit ranges.</p>
    </td>
  </tr>
</table>

---

## Free And Pro

| Feature                               | Free             | Pro                                                |
| ------------------------------------- | ---------------- | -------------------------------------------------- |
| Built-in AI providers                 | 22               | 22                                                 |
| Custom API provider                   | Locked           | Included                                           |
| Searchable provider and model pickers | Included         | Included                                           |
| Basic and Conventional commit styles  | Included         | Included                                           |
| Professional commit styles            | Limited          | Included                                           |
| Emoji Enhancement                     | Visible, locked  | Included                                           |
| Draft choices, Commit Health, pre-commit review, commit composer | Locked | Included                  |
| Automatic Recovery                    | Locked           | Retry once and optionally switch models once       |
| API key storage                       | VS Code settings | Encrypted SecretStorage                            |
| Target commit language                | Default          | Searchable language selection                      |
| Advanced model parameters             | Automatic        | Custom temperature, top-p, top-k, and token limits |
| Commit history learning               | Locked           | Included                                           |
| Changelog generation                  | Locked           | Included                                           |

GitMind Pro is a one-time lifetime purchase, with no subscription. [See Pro pricing](https://gitmind-pro.com/pricing?utm_source=github-community&utm_medium=readme&utm_campaign=free-vs-pro).

## Supported AI Providers

![GitMind supports 22 built-in AI providers including GitHub Copilot, local Ollama and LM Studio, cloud APIs and platforms, plus Custom API with Pro](images/all_providers.png)

GitHub Copilot · OpenAI · Anthropic · Google Gemini · DeepSeek · Grok · Groq · Perplexity · Z.ai · Mistral · Ollama · Together AI · Hugging Face · Cohere · OpenRouter · MiniMax · NVIDIA NIM · LM Studio · Azure OpenAI · Amazon Bedrock · Vertex AI · Cloudflare Workers AI/Gateway · Pro Custom API

---

## Privacy

- GitMind sends the selected Git diff and prompt to the provider you configure.
- Ollama and LM Studio keep generation on your machine.
- GitMind Pro can store provider keys in VS Code SecretStorage.
- Debug logs redact sensitive values.
- GitMind does not collect or transmit product telemetry.

## Requirements

- VS Code 1.101.0 or newer, or a compatible editor
- Git repository
- API key for the selected cloud provider, unless using GitHub Copilot (editor sign-in), Ollama or LM Studio (local), or Amazon Bedrock or Vertex AI (cloud credentials)

## Support

- [Read the Wiki](https://github.com/shahabahreini/GitMind-Community/wiki)
- [Report an issue or request](https://github.com/shahabahreini/GitMind-Community/issues/new/choose)
- [View releases](https://github.com/shahabahreini/GitMind-Community/releases)

If GitMind saves you time, a rating helps other developers find it: [rate on the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant&ssr=false#review-details) or [on Open VSX](https://open-vsx.org/extension/ShahabBahreiniJangjoo/ai-commit-assistant/reviews).

Never post API keys, license keys, full order IDs, purchase emails, source code, diffs, prompts, or private repository data in a public issue.
