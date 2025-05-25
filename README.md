# GitMind: AI Commit Assistant for VS Code

Professional AI-powered commit message generation for Visual Studio Code. Leverage multiple AI providers to create consistent, conventional commit messages that improve code history quality and team collaboration.

<video width="100%" controls>
  <source src="https://shahabahreini.com/wp-content/uploads/GitMind-Introduction.mp4" type="video/mp4"> <a href="https://shahabahreini.com/wp-content/uploads/GitMind-Introduction.mp4">View the demo video</a>
</video>

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant) or via Quick Open (Ctrl+P):

```bash
ext install ShahabBahreiniJangjoo.ai-commit-assistant
```

## Key Features

**Multi-Provider AI Support**: Access 8 different AI providers with unified configuration and intelligent fallback handling.

**Smart Git Integration**: Automatic change detection for staged and unstaged files with context-aware analysis.

**Conventional Commits**: Automatic formatting with proper type categorization (feat|fix|docs|style|refactor|test|chore), scope detection, and breaking change identification.

<video width="100%" controls>
  <source src="https://shahabahreini.com/wp-content/uploads/GenerateCommits.mp4" type="video/mp4"> <a href="https://shahabahreini.com/wp-content/uploads/GenerateCommits.mp4">View the demo video</a>
</video>

**Dynamic Model Selection**: Real-time model browsing for compatible providers with search and filtering capabilities.

**Advanced Token Management**: Pre-generation estimation, rate limiting with minute-based tracking, and usage analytics.

**Professional Workflow Integration**: Native VS Code SCM panel integration with loading indicators and status feedback.

## AI Provider Comparison

| Provider | Free Tier | Paid Plans | Local Deployment | Dynamic Models | Rate Limiting |
|----------|-----------|------------|------------------|----------------|---------------|
| **Google Gemini** | ✓ | ✓ | ✗ | ✗ | Basic |
| **Mistral AI** | ✓ | ✓ | ✗ | ✓ | Advanced |
| **Hugging Face** | ✓ | ✓ | ✗ | ✓ | Basic |
| **Ollama** | ✓ | ✗ | ✓ | ✓ | N/A |
| **Cohere** | ✓ | ✓ | ✗ | ✗ | Basic |
| **OpenAI** | ✗ | ✓ | ✗ | ✗ | Basic |
| **Together AI** | ✓ | ✓ | ✗ | ✓ | Basic |
| **OpenRouter** | ✓ | ✓ | ✗ | ✓ | Basic |

## Model Specifications & Capabilities

| Provider | Model | Context Window | Rate Limits | Strengths | Cost Tier |
|----------|-------|----------------|-------------|-----------|-----------|
| **Google Gemini** | gemini-2.5-pro | 2M tokens | 15 RPM (free) | Latest reasoning, thinking model | Free/Paid |
| | gemini-2.5-flash | 2M tokens | 15 RPM (free) | Efficient thinking, fast inference | Free/Paid |
| | gemini-2.0-flash | 1M tokens | 15 RPM (free) | Multimodal, comprehensive | Free/Paid |
| | gemini-1.5-pro | 2M tokens | 2 RPM (free) | Comprehensive capabilities | Free/Paid |
| **Mistral AI** | mistral-large-latest | 128k tokens | 1 RPM (free) | Superior reasoning, multilingual | Free/Paid |
| | mistral-medium | 32k tokens | 5 RPM (free) | Balanced performance/cost | Free/Paid |
| | mistral-small | 32k tokens | 10 RPM (free) | Lightweight, fast | Free/Paid |
| **Hugging Face** | mistralai/Mistral-7B-Instruct-v0.3 | 32k tokens | Varies by model | Open source, customizable | Free/Paid |
| | meta-llama/Llama-3.3-70B-Instruct | 128k tokens | Limited (free) | Meta's latest, instruction-tuned | Free/Paid |
| | microsoft/DialoGPT-medium | 1k tokens | Generous (free) | Conversational, lightweight | Free |
| | google/flan-t5-xxl | 512 tokens | Generous (free) | Instruction following | Free |
| **Ollama** | phi4 | 128k tokens | Hardware limited | Microsoft's reasoning model | Free |
| | llama3.3:70b | 128k tokens | Hardware limited | Meta's flagship, high quality | Free |
| | codellama:34b | 16k tokens | Hardware limited | Code-specialized, programming | Free |
| | mistral:7b | 32k tokens | Hardware limited | Efficient, multilingual | Free |
| **Cohere** | command-r | 128k tokens | 20 RPM (free) | RAG-optimized, retrieval | Free/Paid |
| | command | 4k tokens | 5 RPM (free) | General instruction following | Free/Paid |
| | command-light | 4k tokens | 100 RPM (free) | Fast, lightweight | Free/Paid |
| **OpenAI** | gpt-4.1 | 128k tokens | 20 RPM | Latest model with enhanced capabilities | Paid |
| | gpt-4o | 128k tokens | 20 RPM | Multimodal, latest capabilities | Paid |
| | o3 | 128k tokens | 10 RPM | Advanced reasoning model | Paid |
| | gpt-4-turbo | 128k tokens | 40 RPM | High performance, cost-effective | Paid |
| | gpt-3.5-turbo | 16k tokens | 60 RPM | Fast, economical | Paid |
| **Together AI** | meta-llama/Llama-3.3-70B-Instruct-Turbo | 128k tokens | 60 RPM (free) | Optimized inference, high quality | Free/Paid |
| | mistralai/Mixtral-8x7B-Instruct-v0.1 | 32k tokens | 60 RPM (free) | Mixture of experts, efficient | Free/Paid |
| | microsoft/DialoGPT-large | 1k tokens | 200 RPM (free) | Conversational AI | Free |
| **OpenRouter** | google/gemma-2-27b-it | 8k tokens | Varies | Google's open model | Free/Paid |
| | anthropic/claude-3-haiku | 200k tokens | Rate limited | Fast, efficient reasoning | Paid |
| | openai/gpt-4-turbo | 128k tokens | Provider limits | Access to premium models | Paid |

## Technical Capabilities

### Commit Message Intelligence

- **Context Analysis**: Analyzes file diffs, change patterns, and repository history
- **Scope Detection**: Automatic identification of affected modules and components
- **Breaking Change Recognition**: Detects API changes and breaking modifications
- **Verbosity Control**: Toggle between detailed descriptions and concise summaries

### Advanced Configuration

- **Custom Prompts**: Optional context enhancement for domain-specific commits
- **Model Selection**: Provider-specific model configuration with performance optimization
- **Debug Mode**: Comprehensive API interaction logging and response tracking
- **Token Optimization**: Smart content truncation and cost management

### Developer Workflow

- **VS Code Integration**: Native Source Control panel with dedicated UI components
- **Change Detection**: Handles both staged and unstaged modifications with user confirmation
- **Batch Processing**: Support for multiple file changes with intelligent grouping
- **Manual Override**: Preserves user edits and allows custom modifications

## Quick Setup

1. **Choose Provider**: Select from 8 supported AI providers based on your requirements
2. **Configure API**: Add your API key through the extension settings panel
3. **Select Model**: Choose optimal model for your use case and budget
4. **Generate Commits**: Use the AI button in VS Code's Source Control panel

### Recommended Configurations

**For Open Source Projects**:

- **Ollama** (phi4 or llama3.3:70b) - Complete privacy, no API costs
- **Hugging Face** (mistralai/Mistral-7B-Instruct-v0.3) - Reliable free tier

**For Professional Development**:

- **Google Gemini** (gemini-2.5-flash) - Excellent free tier, 2M context
- **Mistral AI** (mistral-large-latest) - Superior reasoning, multilingual

**For Enterprise**:

- **OpenAI** (gpt-4o) - Industry standard, multimodal capabilities
- **Mistral Large** - EU-compliant alternative with advanced reasoning

**For High-Volume Usage**:

- **Together AI** (Llama-3.3-70B-Instruct-Turbo) - Optimized inference, generous free tier
- **OpenRouter** - Access multiple premium models through unified API

### Model Selection Guidelines

**Context Window Considerations**:

- **Large repositories**: Choose models with 128k+ tokens (Gemini, Mistral Large, OpenAI)
- **Simple commits**: 32k tokens sufficient (Mistral Medium, most HuggingFace models)
- **Complex refactoring**: 2M tokens recommended (Gemini 2.5-flash, Gemini 1.5-pro)

**Performance Trade-offs**:

- **Speed priority**: Gemini 2.0-flash, Mistral Small, Command-light
- **Quality priority**: GPT-4o, Mistral Large, Llama-3.3-70B
- **Cost optimization**: HuggingFace open models, Ollama local deployment

## Requirements

- Visual Studio Code ^1.75.0
- Git repository (initialized)
- API key from chosen provider OR Ollama installation

## Advanced Features

### Rate Limit Management

Advanced monitoring and handling for API quotas with minute-based tracking and anomaly detection.

### Dynamic Model Loading

Real-time model discovery and selection for Hugging Face and compatible providers.

### Diagnostic Tools

Token estimation, response analysis, and comprehensive debugging capabilities.

### Professional Integration

Enterprise-ready with support for team configurations and standardized commit formats.

## Configuration

Access settings via Command Palette: `AI Commit Assistant: Open Settings` or the settings icon in the Source Control panel.

**Provider Configuration**: Select AI provider and configure authentication
**Model Selection**: Choose specific models with real-time validation
**Message Format**: Configure verbosity and conventional commit formatting
**Advanced Options**: Enable debug mode, custom prompts, and diagnostic information

## Architecture

Built with TypeScript for reliability and performance:

- **Modular Provider System**: Dedicated API service modules with proper error handling
- **Smart Response Parsing**: Sophisticated commit message formatting and validation
- **Webview Settings UI**: Professional configuration interface with real-time feedback
- **Git Integration**: Advanced repository analysis and diff processing
- **Token Management**: Intelligent usage tracking and optimization

---

**GitMind** transforms your commit workflow with professional AI-powered message generation, supporting both individual developers and enterprise teams with consistent, meaningful commit histories.
