# GitMind: Professional Commit Assistant for VS Code

AI-powered commit message generation for Visual Studio Code. Supports 13 AI providers including OpenAI GPT-4o, Claude-3-5-sonnet, Gemini-2.5-flash, DeepSeek-reasoner, and 50+ models for consistent, conventional commit messages.

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant) or via Quick Open (Ctrl+P):

```bash
ext install ShahabBahreiniJangjoo.ai-commit-assistant
```

## Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center" width="50%">
        <img src="images/s-14.png" alt="GitMind AI Commit Generation" width="250"/>
        <br/>
        <em>Advanced Settings Panel (Pro Users)</em>
      </td>
      <td align="center" width="50%">
        <img src="images/s-15.png" alt="Git Integration" width="250"/>
        <br/>
        <em>Professional Commit Styles</em>
      </td>
    </tr>
    <tr>
      <td align="center" width="50%">
        <img src="images/s-12.png" alt="Settings Configuration" width="250"/>
        <br/>
        <em>Lifetime Pro Subscription</em>
      </td>
      <td align="center" width="50%">
        <img src="images/s-11.png" alt="API Keys Encryption Feature" width="250"/>
        <br/>
        <em>API Key Encryption (Pro Users)</em>
      </td>
    </tr>
    <tr>
      <td align="center" width="50%">
        <img src="images/s-13.png" alt="Multi-Provider Support" width="250"/>
        <br/>
        <em>Commit History Analysis (Pro Users)</em>
      </td>
      <td align="center" width="50%">
        <img src="images/s-16.png" alt="Model Selection" width="250"/>
        <br/>
        <em>Short/Verbose Message Style, Customize Prompt, Token Calculator</em>
      </td>
    </tr>
    <tr>
      <td align="center" colspan="2">
        <img src="images/s-17.png" alt="Diagnostics Dashboard" width="400"/>
        <br/>
        <em>UI Settings with 13 AI Provider Support</em>
      </td>
    </tr>
  </table>
</div>

## Core Features

**Multi-Provider AI Support**
Access 13 different AI providers with unified configuration and intelligent fallback handling. Supports GPT-4o, Claude-opus-4, Gemini-2.5-pro, DeepSeek-chat, Grok-3, Perplexity-sonar, Mistral-large, and 50+ additional models.

**Advanced Git Integration**
Smart diff analysis with automatic staging detection, binary file handling, and comprehensive repository state management. Handles complex scenarios including merge conflicts and mixed changes.

**Conventional Commits Standard**
Automatic formatting with proper type categorization (`feat|fix|docs|style|refactor|test|chore`), scope detection, and breaking change identification.

**Intelligent Diff Processing**
Enhanced change detection for staged and unstaged files with context-aware analysis and user guidance for complex scenarios.

**Dynamic Model Selection**
Real-time model browsing for compatible providers with search and filtering capabilities. 2M+ token context windows supported for large repositories.

**Smart Prompt Management**
Save Last Custom Prompt feature automatically saves and reuses custom prompts across commit generations. Saved prompts appear as defaults in future sessions.

**Professional Workflow Integration**
Native VS Code SCM panel integration with loading indicators, comprehensive status feedback, and standardized prompt engineering across all providers.

## Plan Comparison

### Quick Feature Overview

| Feature                                        | Free | Pro |
| ---------------------------------------------- | ---- | --- |
| **Commit Styles (Basic & Conventional)**       | ✓    | ✓   |
| **Git Message Reference Guide**                | ✓    | ✓   |
| **Diagnostics Window**                         | ✓    | ✓   |
| **Verbose/Concise Message Switch**             | ✓    | ✓   |
| **Basic Prompt Customization**                 | ✓    | ✓   |
| **Plain Text API Key Storage**                 | ✓    | ✓   |
| **Standard Models**                            | ✓    | ✓   |
| **Standard API Providers**                     | ✓    | ✓   |
| **Basic Diff Handling**                        | ✓    | ✓   |
| **Fixed Commit Body Lines (5)**                | ✓    | ✓   |
| **Fixed Summary Length**                       | ✓    | ✓   |
| **Single Device License**                      | ✓    | ✓   |
| **11 Professional Commit Styles**              | ✗    | ✓   |
| **Optional Last Prompt Saving**                | ✗    | ✓   |
| **Encrypted API Key Storage**                  | ✗    | ✓   |
| **Copy API Key Button**                        | ✗    | ✓   |
| **Latest Models (HuggingFace, Mistral, etc.)** | ✗    | ✓   |
| **Custom API Provider Support**                | ✗    | ✓   |
| **Advanced Configurable Diff Processing**      | ✗    | ✓   |
| **Configurable Commit Body Lines**             | ✗    | ✓   |
| **Custom Summary Length Limit**                | ✗    | ✓   |
| **Commit History Analysis**                    | ✗    | ✓   |
| **Multi-device License**                       | ✗    | ✓   |

### Detailed Feature Comparison

| Feature                     | Free Plan                                          | Pro Plan                                                                                                                             |
| --------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Commit Styles**           | Basic and Conventional styles only                 | 11 professional styles including Angular, Ember.js, EmojiGit, Gitmoji, Semantic Release, Commitizen, Karma, Linux Kernel, and jQuery |
| **Git Message Reference**   | Available (read-only)                              | Available (read-only)                                                                                                                |
| **Diagnostics Window**      | Token estimation and provider/model summary        | Token estimation and provider/model summary                                                                                          |
| **Message Format**          | Verbose/concise switch (multi-line or single-line) | Verbose/concise switch (multi-line or single-line)                                                                                   |
| **Prompt Customization**    | Basic customization available                      | Advanced customization with optional last prompt saving                                                                              |
| **API Key Security**        | Plain text storage                                 | Encrypted API key storage                                                                                                            |
| **API Key Management**      | Manual entry only                                  | Copy API key button (works in encrypted and regular mode)                                                                            |
| **Model Selection**         | Standard models only                               | Latest available models for HuggingFace, Mistral, Open Router, Cohere                                                                |
| **API Provider Support**    | Standard providers only                            | Custom API provider for private clouds and enterprise endpoints                                                                      |
| **Large Diff Handling**     | Limited processing capacity                        | Configurable chunking system with custom size and limit controls                                                                     |
| **Commit Body Line Limit**  | Fixed at 5 bullet points                           | Configurable bullet points number in message body                                                                                    |
| **Summary Length Limit**    | Fixed length                                       | Custom summary length limit for first line                                                                                           |
| **Commit History Analysis** | Not available                                      | AI analysis of previous commits with optional author data                                                                            |
| **Multi-device Support**    | Single installation                                | License works across multiple development machines                                                                                   |

## Pro Plan Features

**Professional Commit Standards**
Access to industry-standard formats used by major frameworks and organizations. Includes Angular, Ember.js, Linux Kernel, jQuery, and emoji-based conventions.

**Advanced Prompt Customization**
Enhanced customization with optional last prompt saving feature that can be toggled on/off for user convenience.

**Encrypted API Key Storage**
All API credentials are encrypted and stored securely in VS Code (OpenAI, Gemini, Mistral, Anthropic, Cohere, etc).

**API Key Management**
Copy API key button for easy credential management. Works in both encrypted and regular storage modes.

**Latest Model Access**
Access to the latest available models for HuggingFace, Mistral, Open Router, Gemini, Anthropic, Grok, and Cohere providers.

**Custom API Provider Support**
Configure custom API endpoints for private clouds and enterprise environments.

**Advanced Diff Processing**
Configurable chunking system for large code changes. Customizable chunk sizes and processing limits for handling massive diffs.

**Commit Message Formatting**

- Custom body line limit for commit bullet points (Free plan fixed at 5)
- Custom summary length limit for first line
- Advanced formatting controls

**Commit History Analysis**
Analyzes commit message history and provides detailed reports on message quality, strengths, weaknesses, dominant style used, and recommended improvements.

**Multi-device Licensing**
Use your Pro license across multiple development machines and environments.

## AI Provider Support

### Provider Ecosystem

| Provider           | Featured Models                    | Context | Free Tier | Setup | Strengths                          |
| ------------------ | ---------------------------------- | ------- | --------- | ----- | ---------------------------------- |
| **GitHub Copilot** | gpt-4o, claude-3.5-sonnet, o3      | 128k    | No        | 5sec  | Zero config, VS Code native        |
| **Google Gemini**  | 2.5-flash, 2.5-pro, 2.0-flash      | 2M      | 15 RPM    | 2min  | Massive context, thinking model    |
| **Grok (X.ai)**    | grok-3, grok-3-fast, grok-3-mini   | 128k    | Limited   | 2min  | Real-time data access, fast        |
| **DeepSeek**       | reasoner, chat                     | 128k    | 50 RPM    | 2min  | Advanced reasoning, cost-effective |
| **Perplexity**     | sonar-pro, sonar-reasoning, sonar  | 127k    | Limited   | 2min  | Real-time web search, reasoning    |
| **Mistral AI**     | large-latest, medium, small        | 128k    | 1 RPM     | 2min  | EU-compliant, multilingual         |
| **Ollama**         | deepseek-r1, llama3.3, phi4, qwen3 | 128k    | Unlimited | 5min  | Complete privacy, no API costs     |
| **OpenAI**         | gpt-4o, gpt-4.1, o3, o4-mini       | 128k    | No        | 2min  | Industry standard, multimodal      |
| **Anthropic**      | claude-opus-4, sonnet-4, haiku     | 200k    | No        | 2min  | Superior reasoning, long context   |
| **Together AI**    | Llama-3.3-70B, Mixtral-8x7B        | 128k    | 60 RPM    | 2min  | Optimized inference, generous free |
| **Hugging Face**   | Mistral-7B, Zephyr-7B, OpenHermes  | 32k     | Varies    | 2min  | Open source, customizable          |
| **Cohere**         | command-r, command-a-03-2025       | 128k    | 20 RPM    | 2min  | RAG-optimized, retrieval focus     |
| **OpenRouter**     | Multiple providers & models        | Varies  | Limited   | 2min  | Access to premium models           |

### API Provider Setup

| Provider           | API Signup                                                    | Documentation                                                 |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------------------- |
| **GitHub Copilot** | [VS Code Copilot](https://copilot.github.com/)                | [Copilot Docs](https://docs.github.com/copilot)               |
| **Google Gemini**  | [AI Studio](https://ai.google.dev/gemini-api/docs/api-key)    | [Gemini API Docs](https://ai.google.dev/gemini-api)           |
| **Grok (X.ai)**    | [X.ai Console](https://console.x.ai/)                         | [Grok API Docs](https://docs.x.ai/)                           |
| **DeepSeek**       | [DeepSeek Platform](https://platform.deepseek.com/)           | [DeepSeek API Docs](https://api-docs.deepseek.com/)           |
| **Perplexity**     | [Perplexity Settings](https://www.perplexity.ai/settings/api) | [Perplexity API Docs](https://docs.perplexity.ai/)            |
| **Mistral AI**     | [Mistral Console](https://console.mistral.ai/)                | [Mistral API Docs](https://docs.mistral.ai/)                  |
| **OpenAI**         | [OpenAI Platform](https://platform.openai.com/signup)         | [OpenAI API Docs](https://platform.openai.com/docs)           |
| **Anthropic**      | [Anthropic Console](https://console.anthropic.com/)           | [Claude API Docs](https://docs.anthropic.com/)                |
| **Together AI**    | [Together Platform](https://api.together.ai/)                 | [Together API Docs](https://docs.together.ai/)                |
| **Hugging Face**   | [HF Token](https://huggingface.co/settings/tokens)            | [HF Inference API](https://huggingface.co/docs/api-inference) |
| **Cohere**         | [Cohere Dashboard](https://dashboard.cohere.ai/)              | [Cohere API Docs](https://docs.cohere.ai/)                    |
| **OpenRouter**     | [OpenRouter Keys](https://openrouter.ai/keys)                 | [OpenRouter Docs](https://openrouter.ai/docs)                 |
| **Ollama**         | [Ollama Download](https://ollama.com/download)                | [Ollama Docs](https://github.com/ollama/ollama)               |

## Quick Start Guide

### 1. Choose Your Provider

**For Immediate Use**: GitHub Copilot with gpt-4o or claude-3.5-sonnet (existing subscription) or Google Gemini 2.5-flash (best free tier)

**For Privacy**: Ollama with local phi4, llama3.3:70b, or codellama deployment

**For Performance**: OpenAI GPT-4.1, Anthropic Claude-opus-4, or DeepSeek-reasoner

**For Large Projects**: Google Gemini-2.5-pro (2M context) or Anthropic Claude-sonnet-4 (200k context)

### 2. Configuration

1. Open VS Code Source Control panel
2. Click the settings icon in GitMind section
3. Select your preferred AI provider
4. Add API key (skip for GitHub Copilot and Ollama)
5. Choose optimal model for your use case
6. Optional: Enable "Prompt Customization" and "Save Last Custom Prompt"

### 3. Generate Commits

1. Stage your changes in Git
2. Click the "AI" button in Source Control panel
3. Optional: Add custom context (saved automatically if enabled)
4. Review and edit the generated commit message
5. Commit your changes

## Advanced Features

**Enhanced Repository Analysis**
Intelligent change categorization with automatic detection of feature additions, bug fixes, documentation updates, and refactoring patterns.

**Smart Prompt Management System**
Comprehensive prompt lifecycle management with automatic saving, intelligent reuse, and seamless workflow integration.

**Unified Prompt Architecture**
Standardized prompt engineering across all 13 providers and 50+ models ensures consistent, high-quality commit messages.

**Professional Integration**
Native VS Code Source Control panel integration with batch processing support for multiple file changes and comprehensive error handling.

**Diagnostic & Monitoring Tools**
Real-time token usage estimation, API response analysis, rate limit monitoring, and model performance analytics.

## Configuration Options

Access settings via Command Palette: `GitMind: Open Settings` or the settings icon in the Source Control panel.

**Provider Management**

- AI provider selection with real-time validation
- Secure API key configuration
- Model selection with performance metrics

**Prompt Customization**

- Enable custom context prompts for commit generation
- Save Last Custom Prompt toggle for automatic prompt reuse
- Persistent prompt storage across sessions

**Message Formatting**

- Conventional commit standard compliance
- Verbosity level control
- Custom scope and type configuration

**Advanced Settings**

- Debug mode for development
- Custom prompt templates
- Token usage optimization
- Rate limit configuration

## Requirements

- Visual Studio Code ^1.100.0
- Git repository (initialized)
- API key from chosen provider OR Ollama installation for local deployment

## Privacy and Telemetry

GitMind collects anonymous usage data to improve the extension. Collected data includes usage analytics, provider statistics, technical information, and error reports. No code content, personal information, API keys, or repository details are collected.

To disable telemetry:

1. Open VS Code Settings (Ctrl/Cmd + ,)
2. Search for "telemetry"
3. Set "Telemetry: Telemetry Level" to "off"
