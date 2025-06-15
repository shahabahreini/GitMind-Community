# GitMind: AI Commit Assistant for VS Code

**Professional AI-powered commit message generation for Visual Studio Code.** Leverage 13 different AI providers including OpenAI GPT-4o, Claude-3-5-sonnet, Gemini-2.5-flash, DeepSeek-reasoner, Grok-3, Perplexity-sonar, and 50+ models to create consistent, conventional commit messages that improve code history quality and team collaboration.

<video width="100%" controls>
  <source src="https://shahabahreini.com/wp-content/uploads/GitMind-Introduction.mp4" type="video/mp4"> <a href="https://shahabahreini.com/wp-content/uploads/GitMind-Introduction.mp4">View the demo video</a>
</video>

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant) or via Quick Open (Ctrl+P):

```bash
ext install ShahabBahreiniJangjoo.ai-commit-assistant
```

## Core Features

### **Multi-Provider AI Support**

Access **13 different AI providers** with unified configuration and intelligent fallback handling. From zero-setup GitHub Copilot to privacy-focused local Ollama deployments supporting GPT-4o, Claude-opus-4, Gemini-2.5-pro, DeepSeek-chat, Grok-3, Perplexity-sonar, Mistral-large, and 50+ additional models.

### **Advanced Git Integration**

**Smart diff analysis** with automatic staging detection, binary file handling, and comprehensive repository state management. Handles complex scenarios including merge conflicts and mixed changes.

### **Conventional Commits Standard**

Automatic formatting with proper type categorization (`feat|fix|docs|style|refactor|test|chore`), scope detection, and **breaking change identification**.

<video width="100%" controls>
  <source src="https://shahabahreini.com/wp-content/uploads/GenerateCommits.mp4" type="video/mp4"> <a href="https://shahabahreini.com/wp-content/uploads/GenerateCommits.mp4">View the demo video</a>
</video>

### **Intelligent Diff Processing**

Enhanced change detection for staged and unstaged files with **context-aware analysis** and user guidance for complex scenarios.

### **Dynamic Model Selection**

Real-time model browsing for compatible providers with search and filtering capabilities. **2M+ token context windows** supported for large repositories with models like Gemini-2.5-pro and Claude-3-5-sonnet.

### **Smart Prompt Management**

**Save Last Custom Prompt** feature allows you to automatically save and reuse custom prompts across commit generations. Saved prompts appear as defaults in future sessions with clipboard copy options for easy editing.

### **Professional Workflow Integration**

Native VS Code SCM panel integration with loading indicators, comprehensive status feedback, and **standardized prompt engineering** across all providers.

## AI Provider Ecosystem

### **Model Comparison & Selection Guide**

| Provider           | Featured Models                    | Context | Free Tier | Setup | Strengths                          | Limitations              |
| ------------------ | ---------------------------------- | ------- | --------- | ----- | ---------------------------------- | ------------------------ |
| **GitHub Copilot** | gpt-4o, claude-3.5-sonnet, o3      | 128k    | No        | 5sec  | Zero config, VS Code native        | Requires subscription    |
| **Google Gemini**  | 2.5-flash, 2.5-pro, 2.0-flash      | 2M      | 15 RPM    | 2min  | Massive context, thinking model    | Rate limited (free)      |
| **Grok (X.ai)**    | grok-3, grok-3-fast, grok-3-mini   | 128k    | Limited   | 2min  | Real-time data access, fast        | X Premium required       |
| **DeepSeek**       | reasoner, chat                     | 128k    | 50 RPM    | 2min  | Advanced reasoning, cost-effective | Newer provider           |
| **Perplexity**     | sonar-pro, sonar-reasoning, sonar  | 127k    | Limited   | 2min  | Real-time web search, reasoning    | Paid tier recommended    |
| **Mistral AI**     | large-latest, medium, small        | 128k    | 1 RPM     | 2min  | EU-compliant, multilingual         | Low free tier limits     |
| **Ollama**         | deepseek-r1, llama3.3, phi4, qwen3 | 128k    | Unlimited | 5min  | Complete privacy, no API costs     | Hardware dependent       |
| **OpenAI**         | gpt-4o, gpt-4.1, o3, o4-mini       | 128k    | No        | 2min  | Industry standard, multimodal      | Paid only, higher cost   |
| **Anthropic**      | claude-opus-4, sonnet-4, haiku     | 200k    | No        | 2min  | Superior reasoning, long context   | Paid only                |
| **Together AI**    | Llama-3.3-70B, Mixtral-8x7B        | 128k    | 60 RPM    | 2min  | Optimized inference, generous free | Variable model quality   |
| **Hugging Face**   | Mistral-7B, Zephyr-7B, OpenHermes  | 32k     | Varies    | 2min  | Open source, customizable          | Inconsistent performance |
| **Cohere**         | command-r, command-a-03-2025       | 128k    | 20 RPM    | 2min  | RAG-optimized, retrieval focus     | Limited model variety    |
| **OpenRouter**     | Multiple providers & models        | Varies  | Limited   | 2min  | Access to premium models           | Complex pricing          |

### **Quick Selection Guide**

**For Immediate Use**: GitHub Copilot with gpt-4o or claude-3.5-sonnet (existing subscription) or Google Gemini 2.5-flash (best free tier)

**For Privacy**: Ollama with local phi4, llama3.3:70b, or codellama deployment

**For Performance**: OpenAI GPT-4.1, Anthropic Claude-opus-4, or DeepSeek-reasoner

**For Large Projects**: Google Gemini-2.5-pro (2M context) or Anthropic Claude-sonnet-4 (200k context)

## API Provider Setup Links

### **Get API Keys & Documentation**

| Provider           | API Signup                                                    | Documentation                                                 | Free Tier Details     |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------------------- | --------------------- |
| **GitHub Copilot** | [VS Code Copilot](https://copilot.github.com/)                | [Copilot Docs](https://docs.github.com/copilot)               | Requires subscription |
| **Google Gemini**  | [AI Studio](https://ai.google.dev/gemini-api/docs/api-key)    | [Gemini API Docs](https://ai.google.dev/gemini-api)           | 15 requests/minute    |
| **Grok (X.ai)**    | [X.ai Console](https://console.x.ai/)                         | [Grok API Docs](https://docs.x.ai/)                           | Limited free tier     |
| **DeepSeek**       | [DeepSeek Platform](https://platform.deepseek.com/)           | [DeepSeek API Docs](https://api-docs.deepseek.com/)           | 50 requests/minute    |
| **Perplexity**     | [Perplexity Settings](https://www.perplexity.ai/settings/api) | [Perplexity API Docs](https://docs.perplexity.ai/)            | Limited free tier     |
| **Mistral AI**     | [Mistral Console](https://console.mistral.ai/)                | [Mistral API Docs](https://docs.mistral.ai/)                  | 1 request/minute      |
| **OpenAI**         | [OpenAI Platform](https://platform.openai.com/signup)         | [OpenAI API Docs](https://platform.openai.com/docs)           | Paid only             |
| **Anthropic**      | [Anthropic Console](https://console.anthropic.com/)           | [Claude API Docs](https://docs.anthropic.com/)                | Paid only             |
| **Together AI**    | [Together Platform](https://api.together.ai/)                 | [Together API Docs](https://docs.together.ai/)                | 60 requests/minute    |
| **Hugging Face**   | [HF Token](https://huggingface.co/settings/tokens)            | [HF Inference API](https://huggingface.co/docs/api-inference) | Varies by model       |
| **Cohere**         | [Cohere Dashboard](https://dashboard.cohere.ai/)              | [Cohere API Docs](https://docs.cohere.ai/)                    | 20 requests/minute    |
| **OpenRouter**     | [OpenRouter Keys](https://openrouter.ai/keys)                 | [OpenRouter Docs](https://openrouter.ai/docs)                 | Limited free tier     |
| **Ollama**         | [Ollama Download](https://ollama.com/download)                | [Ollama Docs](https://github.com/ollama/ollama)               | Unlimited (local)     |

### **Quick API Setup Guide**

1. **Choose your provider** from the table above
2. **Sign up** using the provided API signup link
3. **Generate API key** in your provider dashboard
4. **Configure GitMind** with your API key
5. **Select optimal model** for your use case

For detailed setup instructions for each provider, see our [Configuration Guide](#configuration-options).

## Supported Models by Provider

<details>
<summary><strong>Complete Model Directory (50+ Models Supported)</strong></summary>

### **GitHub Copilot Models**

`gpt-4o` | `gpt-4.1` | `gpt-4.5-preview` | `claude-3.5-sonnet` | `claude-3.7-sonnet` | `claude-3.7-sonnet-thinking` | `claude-sonnet-4` | `claude-opus-4` | `gemini-2.0-flash` | `gemini-2.5-pro-preview` | `o1-preview` | `o3` | `o3-mini` | `o4-mini`

### **Google Gemini Models**

`gemini-2.5-pro` | `gemini-2.5-flash` | `gemini-2.5-flash-preview-05-20` | `gemini-2.0-flash` | `gemini-2.0-flash-lite` | `gemini-1.5-flash` | `gemini-1.5-flash-8b` | `gemini-1.5-pro` | `gemini-2.5-flash-preview-04-17` | `gemini-2.5-pro-exp-03-25`

### **Grok (X.ai) Models**

`grok-3` | `grok-3-fast` | `grok-3-mini` | `grok-2-vision-1212` | `grok-2-1212` | `grok-2` | `grok-vision-beta` | `grok-beta`

### **OpenAI Models**

`gpt-4.1` | `gpt-4.1-mini` | `gpt-4.1-nano` | `o3` | `o4-mini` | `o3-mini` | `gpt-4o` | `gpt-4o-mini` | `gpt-4-turbo` | `gpt-4` | `gpt-3.5-turbo`

### **Anthropic Claude Models**

`claude-opus-4` | `claude-sonnet-4` | `claude-sonnet-3.7` | `claude-3-5-sonnet-20241022` | `claude-3-5-sonnet-20240620` | `claude-3-5-haiku-20241022` | `claude-3-opus-20240229` | `claude-3-sonnet-20240229` | `claude-3-haiku-20240307`

### **DeepSeek Models**

`deepseek-chat` | `deepseek-reasoner`

### **Perplexity Models**

`sonar-pro` | `sonar-reasoning` | `sonar` | `llama-3.1-sonar-small-128k-online` | `llama-3.1-sonar-large-128k-online` | `llama-3.1-sonar-huge-128k-online` | `llama-3.1-sonar-small-128k-chat` | `llama-3.1-sonar-large-128k-chat`

### **Mistral AI Models**

`mistral-large-latest` | `mistral-medium-latest` | `mistral-small-latest` | `pixtral-large-latest` | `codestral-latest` | `mistral-tiny` | `mistral-medium`

### **Cohere Models**

`command-a-03-2025` | `command-r-08-2024` | `command-r-plus-08-2024` | `aya-expanse-8b` | `aya-expanse-32b` | `command-r7b-arabic` | `command-r` | `command-r-plus` | `command` | `command-light` | `command-nightly`

### **Together AI Models**

`meta-llama/Llama-3.3-70B-Instruct-Turbo` | `meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo` | `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo` | `meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo` | `microsoft/WizardLM-2-8x22B` | `NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO` | `deepseek-ai/deepseek-llm-67b-chat` | `deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free`

### **Hugging Face Models**

`mistralai/Mistral-7B-Instruct-v0.3` | `microsoft/DialoGPT-medium` | `facebook/bart-large-cnn` | `microsoft/DialoGPT-large` | `HuggingFaceH4/zephyr-7b-beta` | `teknium/OpenHermes-2.5-Mistral-7B` | `NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO` | `meta-llama/Llama-3.2-3B-Instruct` | `microsoft/Phi-3.5-mini-instruct` | `Qwen/Qwen2.5-Coder-32B-Instruct` | `deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct` | `mistralai/Mistral-Nemo-Instruct-2407`

### **Ollama Local Models**

`deepseek-r1` | `llama3.3` | `phi4` | `qwen3` | `gemma3` | `llava1.6` | `granite3.1` | `mistral` | `codellama` | `qwen2.5-coder` | `llama2` | `phi3` | `gemma2` | `starcoder2` | `tinyllama` | `deepseek-coder` | `dolphin-llama3.1` | `olmo2` | `bge-m3` | `nous-hermes` | `mixtral` | `smollm2` | `snowflake-arctic-embed`

### **OpenRouter Models**

Access to multiple providers including `google/gemma-3-27b-it:free` and premium models from various providers

</details>

## Technical Architecture

### **Advanced Diff Analysis Engine**

- **Smart Staging Detection**: Automatic detection of staged vs unstaged changes with user guidance
- **Binary File Handling**: Proper detection and exclusion of binary files from analysis
- **Repository State Management**: Comprehensive handling of complex git repository states
- **Edge Case Processing**: Robust handling of empty diffs, merge conflicts, and repository anomalies

### **Commit Message Intelligence**

- **Context Analysis**: Deep analysis of file diffs, change patterns, and repository history powered by advanced models like GPT-4o, Claude-opus-4, and Gemini-2.5-pro
- **Scope Detection**: Automatic identification of affected modules and components
- **Breaking Change Recognition**: Intelligent detection of API changes and breaking modifications
- **Verbosity Control**: Toggle between detailed descriptions and concise summaries

### **Enterprise-Ready Configuration**

- **Standardized Prompts**: Consistent prompt templates across all 12 AI providers and 50+ models
- **Custom Context Enhancement**: Optional domain-specific prompt customization with automatic saving and reuse
- **Smart Prompt Management**: Save Last Custom Prompt feature for workflow efficiency and consistency
- **Token Optimization**: Smart content truncation and cost management with pre-generation estimation
- **Rate Limit Management**: Advanced monitoring with minute-based tracking and anomaly detection
- **Debug Mode**: Comprehensive API interaction logging and response analysis

## Quick Start Guide

### 1. Choose Your Provider Strategy

**For Immediate Use**: GitHub Copilot with gpt-4o or claude-3.5-sonnet (if you have VS Code Copilot subscription)  
**For Free Usage**: Google Gemini-2.5-flash or DeepSeek-reasoner for best free tier experience  
**For Privacy**: Ollama with local deepseek-r1, llama3.3, phi4, qwen3, gemma3, or codellama deployment  
**For Performance**: OpenAI gpt-4.1, Anthropic claude-opus-4, or Google gemini-2.5-pro

### 2. Configuration

1. Open VS Code Source Control panel
2. Click the settings icon in GitMind section
3. Select your preferred AI provider
4. Add API key (skip for GitHub Copilot and Ollama)
5. Choose optimal model for your use case
6. **Optional**: Enable "Prompt Customization" and "Save Last Custom Prompt" for enhanced workflow

### 3. Generate Commits

1. Stage your changes in Git
2. Click the "AI" button in Source Control panel
3. **Optional**: Add custom context (saved automatically if enabled)
4. Review and edit the generated commit message
5. Commit your changes

## Model Selection Guidelines

### **Context Window Considerations**

- **Large repositories/refactoring**: 128k+ tokens (Gemini-2.5-pro, Claude-opus-4, GPT-4o)
- **Standard commits**: 32k tokens sufficient (Mistral-medium, most models)
- **Complex multi-file changes**: 2M tokens recommended (Gemini-2.5-pro models)

### **Performance Optimization**

- **Speed priority**: Gemini-2.0-flash, Mistral-small, Command-light, GPT-4o-mini
- **Quality priority**: GPT-4.1, Claude-opus-4, Llama-3.3-70B, DeepSeek-reasoner
- **Cost optimization**: Hugging Face open models, Ollama local deployment

### **Specialized Use Cases**

- **Code-heavy changes**: deepseek-r1, codellama:34b (Ollama), DeepSeek models, Qwen2.5-coder, starcoder2
- **Multilingual projects**: Mistral models, Gemini series, aya-expanse models
- **Documentation changes**: Command-light (Cohere), smaller efficient models

## Advanced Features

### **Enhanced Repository Analysis**

**Intelligent change categorization** with automatic detection of feature additions, bug fixes, documentation updates, and refactoring patterns using advanced models like Claude-opus-4 and GPT-4.1.

### **Smart Prompt Management System**

**Comprehensive prompt lifecycle management** with automatic saving, intelligent reuse, and seamless workflow integration:

- **Automatic Saving**: Custom prompts are automatically saved when "Save Last Custom Prompt" is enabled
- **Smart Defaults**: Saved prompts appear as default values in future commit generations
- **Clipboard Integration**: Built-in copy-to-clipboard functionality for external editing
- **Management Commands**: Dedicated VS Code commands for viewing and clearing saved prompts
- **Persistent Storage**: Prompts persist across VS Code sessions and workspaces using global configuration

### **Unified Prompt Architecture**

**Standardized prompt engineering** across all 12 providers and 50+ models ensures consistent, high-quality commit messages regardless of chosen AI model.

### **Advanced Prompt Management**

- **Save Last Custom Prompt**: Automatically save and reuse custom prompts across sessions
- **Smart Defaults**: Saved prompts appear as default values with clipboard copy options
- **Prompt Commands**: Dedicated commands for viewing (`View Last Custom Prompt`) and clearing (`Clear Last Custom Prompt`) saved prompts
- **Persistent Storage**: Prompts persist across VS Code sessions and workspaces

### **Professional Integration**

- Native VS Code Source Control panel integration
- **Batch processing** support for multiple file changes
- Manual override with edit preservation
- Comprehensive error handling with actionable guidance

### **Diagnostic & Monitoring Tools**

- Real-time token usage estimation
- API response analysis and debugging
- Rate limit monitoring and optimization
- Model performance analytics

## Configuration Options

Access settings via Command Palette: `AI Commit Assistant: Open Settings` or the settings icon in the Source Control panel.

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

- **Visual Studio Code** ^1.100.0
- **Git repository** (initialized)
- **API key** from chosen provider OR **Ollama installation** for local deployment

## Professional Use Cases

### **Individual Developers**

Maintain consistent commit history with intelligent message generation that adapts to your coding patterns and project context using models like GPT-4o, Claude-3.5-sonnet, and Gemini-2.5-flash.

### **Team Collaboration**

Standardize commit message formats across team members with configurable conventional commit standards and custom prompt templates powered by enterprise-grade models.

### **Enterprise Deployment**

Scale across organizations with support for multiple AI providers, usage analytics, and centralized configuration management using premium models like Claude-opus-4 and GPT-4.1.

### **Open Source Projects**

Leverage free tier providers (Gemini-2.5-flash, DeepSeek-reasoner) or local Ollama deployment (deepseek-r1, phi4, llama3.3, qwen3, gemma3) to maintain professional commit standards without API costs.

---

**GitMind** transforms your development workflow with intelligent, context-aware commit message generation. **Supporting 11 AI providers** with **50+ models including GPT-4o, Claude-opus-4, Gemini-2.5-pro, DeepSeek-R1, Llama-3.3, Phi-4** and **advanced diff analysis**, it delivers professional-grade commit messages that improve code history quality and team collaboration efficiency.

## Development and Testing

GitMind includes a comprehensive automated test suite to ensure reliability and quality before publication.

### Test Coverage

The extension features **7 comprehensive test suites** covering all main functionality:

- **Settings UI Testing**: UI persistence, validation, and provider switching
- **AI Providers Testing**: All 13 providers with API validation and model selection
- **Extension Commands Testing**: All commands, error handling, and status management
- **Git Integration Testing**: Diff parsing, commit messages, and repository validation
- **Webview Components Testing**: Settings panel, onboarding, and messaging
- **Error Handling Testing**: API errors, network issues, rate limits, and recovery
- **Configuration Management Testing**: Settings persistence, schema validation, and migration

### Quality Assurance

✅ **100% TypeScript compilation** with no errors or warnings  
✅ **Complete VS Code API mocking** for isolated testing  
✅ **Comprehensive error simulation** for robust error handling  
✅ **End-to-end integration testing** for all workflows  
✅ **Modular test architecture** for maintainability

### Running Tests

```bash
# Compile and run all tests
npm test

# Check test status and coverage
npm run test:status

# Validate test compilation
npm run test:validate
```

For detailed test documentation, see [TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md).

## Privacy and Telemetry

GitMind collects anonymous usage data to help improve the extension. This helps us understand how the extension is used and identify areas for improvement.

### What data is collected:

- **Usage Analytics**: Command usage frequency, success/failure rates, and performance metrics
- **Provider Statistics**: Which AI providers are used (but not API keys or responses)
- **Technical Information**: VS Code version, OS platform, extension version
- **Error Reports**: Anonymous error logs and exception details
- **User Flow**: Navigation patterns within the extension

### What is NOT collected:

- **No code content**: Your actual code, commit messages, or diff content
- **No personal information**: Names, emails, or other personal identifiers
- **No API keys**: Your API credentials are never transmitted
- **No repository information**: Project names, file paths, or repository details

### How to disable telemetry:

You can disable telemetry at any time by:

1. Opening VS Code Settings (`Ctrl/Cmd + ,`)
2. Searching for "telemetry"
3. Setting "Telemetry: Telemetry Level" to "off"

GitMind respects your privacy settings and will not collect any data if telemetry is disabled.

### Data usage:

The collected data helps us:

- Improve extension reliability and performance
- Understand which features are most valuable
- Prioritize development efforts
- Fix bugs and compatibility issues

All data is processed in accordance with Microsoft's privacy policies and is used solely for improving the GitMind extension.
