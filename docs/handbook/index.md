# GitMind 5.x User Handbook

> Verified against GitMind `6.1.1` on September 3, 2026

GitMind generates professional Git commit messages from your changes without leaving VS Code. It supports **23 provider choices**: 22 built-in AI providers, including local Ollama and LM Studio, GitHub Copilot, Azure OpenAI, Bedrock, Vertex AI, and Cloudflare Workers AI, plus a **Pro Custom API** option.

![GitMind logo](/assets/logo.png)

![GitMind supported providers](/assets/all-providers.png)

![GitMind configuration dashboard](/assets/configuration-dashboard.png)

## Start Here

- [Installation And Quick Start](Installation-And-Quick-Start)
- [Providers And Models](Providers-And-Models)
- [Generating Commit Messages](Generating-Commit-Messages)
- [Complete Settings Reference](Complete-Settings-Reference)
- [Product Roadmap](Product-Roadmap)
- [Troubleshooting And FAQ](Troubleshooting-And-FAQ)

## Highlights

- Generate from staged changes, or include unstaged and untracked files with Capture All Changes.
- Choose Basic or 11 Pro commit styles and optionally add Gitmoji.
- Search models exposed by supported provider APIs.
- Use local processing with Ollama or your existing GitHub Copilot authentication.
- Process large diffs, tune model parameters, learn from history, and generate changelogs with Pro.
- Retry selected temporary failures and switch to a provider-scoped fallback model with Pro Automatic Recovery.

## Install And Support

- [Official Website](https://gitmind-pro.com)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant)
- [Open VSX](https://open-vsx.org/extension/ShahabBahreiniJangjoo/ai-commit-assistant)
- [Releases](https://github.com/shahabahreini/GitMind-Community/releases)
- [Support And Requests](Support-And-Requests)
- [Buy GitMind Pro](https://gitmind-pro.com/pricing)

GitMind sends the selected diff and prompt to the provider you configure. Use Ollama when changes must remain local. Never post API keys, license keys, order IDs, purchase emails, source code, diffs, or private repository data in public issues.
