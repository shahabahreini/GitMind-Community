# GitMind: AI Commit Assistant for VS Code

**Professional AI-powered commit message generation for Visual Studio Code.** Leverage 11 different AI providers to create consistent, conventional commit messages that improve code history quality and team collaboration.

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

Access **11 different AI providers** with unified configuration and intelligent fallback handling. From zero-setup GitHub Copilot to privacy-focused local Ollama deployments.

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

Real-time model browsing for compatible providers with search and filtering capabilities. **2M+ token context windows** supported for large repositories.

### **Professional Workflow Integration**

Native VS Code SCM panel integration with loading indicators, comprehensive status feedback, and **standardized prompt engineering** across all providers.

## AI Provider Ecosystem

### **Model Comparison & Selection Guide**

| Provider           | Best Model        | Context | Free Tier | Setup | Strengths                          | Limitations              |
| ------------------ | ----------------- | ------- | --------- | ----- | ---------------------------------- | ------------------------ |
| **GitHub Copilot** | gpt-4o            | 128k    | No        | 5sec  | Zero config, VS Code native        | Requires subscription    |
| **Google Gemini**  | 2.5-flash         | 2M      | 15 RPM    | 2min  | Massive context, thinking model    | Rate limited (free)      |
| **DeepSeek**       | reasoner          | 128k    | 50 RPM    | 2min  | Advanced reasoning, cost-effective | Newer provider           |
| **Mistral AI**     | large-latest      | 128k    | 1 RPM     | 2min  | EU-compliant, multilingual         | Low free tier limits     |
| **Ollama**         | phi4/llama3.3     | 128k    | Unlimited | 5min  | Complete privacy, no API costs     | Hardware dependent       |
| **OpenAI**         | gpt-4o            | 128k    | No        | 2min  | Industry standard, multimodal      | Paid only, higher cost   |
| **Anthropic**      | claude-3-5-sonnet | 200k    | No        | 2min  | Superior reasoning, long context   | Paid only                |
| **Together AI**    | Llama-3.3-70B     | 128k    | 60 RPM    | 2min  | Optimized inference, generous free | Variable model quality   |
| **Hugging Face**   | Mistral-7B-v0.3   | 32k     | Varies    | 2min  | Open source, customizable          | Inconsistent performance |
| **Cohere**         | command-r         | 128k    | 20 RPM    | 2min  | RAG-optimized, retrieval focus     | Limited model variety    |
| **OpenRouter**     | Multiple          | Varies  | Limited   | 2min  | Access to premium models           | Complex pricing          |

### **Quick Selection Guide**

**For Immediate Use**: GitHub Copilot (existing subscription) or Google Gemini (best free tier)

**For Privacy**: Ollama with local phi4 or llama3.3:70b deployment

**For Performance**: OpenAI GPT-4o, Anthropic Claude-3-5-sonnet, or DeepSeek Reasoner

**For Large Projects**: Google Gemini (2M context) or Anthropic Claude (200k context)

## Technical Architecture

### **Advanced Diff Analysis Engine**

- **Smart Staging Detection**: Automatic detection of staged vs unstaged changes with user guidance
- **Binary File Handling**: Proper detection and exclusion of binary files from analysis
- **Repository State Management**: Comprehensive handling of complex git repository states
- **Edge Case Processing**: Robust handling of empty diffs, merge conflicts, and repository anomalies

### **Commit Message Intelligence**

- **Context Analysis**: Deep analysis of file diffs, change patterns, and repository history
- **Scope Detection**: Automatic identification of affected modules and components
- **Breaking Change Recognition**: Intelligent detection of API changes and breaking modifications
- **Verbosity Control**: Toggle between detailed descriptions and concise summaries

### **Enterprise-Ready Configuration**

- **Standardized Prompts**: Consistent prompt templates across all 11 AI providers
- **Custom Context Enhancement**: Optional domain-specific prompt customization
- **Token Optimization**: Smart content truncation and cost management with pre-generation estimation
- **Rate Limit Management**: Advanced monitoring with minute-based tracking and anomaly detection
- **Debug Mode**: Comprehensive API interaction logging and response analysis

## Quick Start Guide

### 1. Choose Your Provider Strategy

**For Immediate Use**: GitHub Copilot (if you have VS Code Copilot subscription)
**For Free Usage**: Google Gemini or DeepSeek for best free tier experience
**For Privacy**: Ollama with local model deployment
**For Performance**: OpenAI GPT-4o or Anthropic Claude-3-5-sonnet

### 2. Configuration

1. Open VS Code Source Control panel
2. Click the settings icon in GitMind section
3. Select your preferred AI provider
4. Add API key (skip for GitHub Copilot and Ollama)
5. Choose optimal model for your use case

### 3. Generate Commits

1. Stage your changes in Git
2. Click the "AI" button in Source Control panel
3. Review and edit the generated commit message
4. Commit your changes

## Model Selection Guidelines

### **Context Window Considerations**

- **Large repositories/refactoring**: 128k+ tokens (Gemini 2.5, Claude, GPT-4)
- **Standard commits**: 32k tokens sufficient (Mistral Medium, most models)
- **Complex multi-file changes**: 2M tokens recommended (Gemini models)

### **Performance Optimization**

- **Speed priority**: Gemini 2.0-flash, Mistral Small, Command-light
- **Quality priority**: GPT-4o, Claude-3-5-sonnet, Llama-3.3-70B
- **Cost optimization**: Hugging Face open models, Ollama local deployment

### **Specialized Use Cases**

- **Code-heavy changes**: codellama:34b (Ollama), DeepSeek models
- **Multilingual projects**: Mistral models, Gemini series
- **Documentation changes**: Command-light (Cohere), smaller efficient models

## Advanced Features

### **Enhanced Repository Analysis**

**Intelligent change categorization** with automatic detection of feature additions, bug fixes, documentation updates, and refactoring patterns.

### **Unified Prompt Architecture**

**Standardized prompt engineering** across all 11 providers ensures consistent, high-quality commit messages regardless of chosen AI model.

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

Maintain consistent commit history with intelligent message generation that adapts to your coding patterns and project context.

### **Team Collaboration**

Standardize commit message formats across team members with configurable conventional commit standards and custom prompt templates.

### **Enterprise Deployment**

Scale across organizations with support for multiple AI providers, usage analytics, and centralized configuration management.

### **Open Source Projects**

Leverage free tier providers or local Ollama deployment to maintain professional commit standards without API costs.

---

**GitMind** transforms your development workflow with intelligent, context-aware commit message generation. **Supporting 11 AI providers** with **advanced diff analysis** and **standardized prompt engineering**, it delivers professional-grade commit messages that improve code history quality and team collaboration efficiency.
