# GitMind — AI Commit Messages

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/ShahabBahreiniJangjoo.ai-commit-assistant?label=VS%20Marketplace&color=0078d4)](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/ShahabBahreiniJangjoo.ai-commit-assistant?color=brightgreen)](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/ShahabBahreiniJangjoo.ai-commit-assistant?color=yellow)](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant)
[![OpenVSX](https://img.shields.io/open-vsx/v/ShahabBahreiniJangjoo/ai-commit-assistant?label=OpenVSX&color=9b59b6)](https://open-vsx.org/extension/ShahabBahreiniJangjoo/ai-commit-assistant)

Analyzes staged git changes and generates commit messages using your choice of AI provider. Supports 13 providers and 60+ models — free to use, with an optional Pro tier.

## This Repository

GitMind was open-source through **v3.5.7**. Starting with v4.0, the source is closed due to the addition of enterprise features. This repository is the **official community hub** — it does not contain source code.

| Purpose                         | Link                                             |
| ------------------------------- | ------------------------------------------------ |
| Report a bug                    | [Open an issue](../../issues)                    |
| Request a feature               | [Submit a request](../../issues/new)             |
| Install without the marketplace | [Download latest `.vsix`](../../releases/latest) |

Every [release](../../releases) mirrors the version published to the VS Code Marketplace and OpenVSX. The `.vsix` file can be installed directly in any compatible editor via **Extensions → Install from VSIX**.

## Install

**VS Code** → [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant)  
or Quick Open (`Ctrl+P` / `Cmd+P`): `ext install ShahabBahreiniJangjoo.ai-commit-assistant`

**Windsurf · Cursor · Theia and compatible editors** → [OpenVSX Registry](https://open-vsx.org/extension/ShahabBahreiniJangjoo/ai-commit-assistant)

---

## Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center" width="50%">
        <img src="images/s-14.png" alt="Advanced Settings Panel" width="250"/>
        <br/><em>Advanced Settings (Pro)</em>
      </td>
      <td align="center" width="50%">
        <img src="images/s-15.png" alt="Commit Styles" width="250"/>
        <br/><em>Professional Commit Styles</em>
      </td>
    </tr>
    <tr>
      <td align="center" width="50%">
        <img src="images/s-12.png" alt="Pro Subscription" width="250"/>
        <br/><em>Pro Subscription</em>
      </td>
      <td align="center" width="50%">
        <img src="images/s-11.png" alt="API Key Encryption" width="250"/>
        <br/><em>Encrypted API Key Storage (Pro)</em>
      </td>
    </tr>
    <tr>
      <td align="center" width="50%">
        <img src="images/s-13.png" alt="Commit History Analysis" width="250"/>
        <br/><em>Commit History Analysis (Pro)</em>
      </td>
      <td align="center" width="50%">
        <img src="images/s-16.png" alt="Message Formatting" width="250"/>
        <br/><em>Message Style & Token Calculator</em>
      </td>
    </tr>
    <tr>
      <td align="center" colspan="2">
        <img src="images/s-17.png" alt="Provider Selection" width="400"/>
        <br/><em>13 AI Providers</em>
      </td>
    </tr>
  </table>
</div>

---

## Features

|                                                                          | Free | Pro |
| ------------------------------------------------------------------------ | :--: | :-: |
| 13 AI providers, 60+ models                                              |  ✓   |  ✓  |
| Conventional Commits standard                                            |  ✓   |  ✓  |
| Verbose / concise message toggle                                         |  ✓   |  ✓  |
| Custom prompt context                                                    |  ✓   |  ✓  |
| Diagnostics & token estimation                                           |  ✓   |  ✓  |
| Local inference via Ollama                                               |  ✓   |  ✓  |
| Multi-repository workspace support                                       |  ✓   |  ✓  |
| 11 professional commit styles (Angular, Gitmoji, Linux Kernel, and more) |      |  ✓  |
| Changelog generation from git history                                    |      |  ✓  |
| Commit history analysis & quality report                                 |      |  ✓  |
| Encrypted API key storage                                                |      |  ✓  |
| Custom API endpoints (private clouds, enterprise)                        |      |  ✓  |
| Advanced model parameters (temperature, top-p, top-k)                    |      |  ✓  |
| Commit message output in 60+ languages                                   |      |  ✓  |
| Multi-device license                                                     |      |  ✓  |

## Supported AI Providers

GitHub Copilot · OpenAI · Anthropic · Google Gemini · DeepSeek · Grok · Perplexity · Mistral · Ollama · Together AI · Hugging Face · Cohere · OpenRouter

---

## Privacy

GitMind collects anonymous usage telemetry — no code, no API keys, no repository content. To disable: VS Code Settings → **Telemetry: Telemetry Level → off**.
