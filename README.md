# GitMind: AI Commit Assistant for VS Code

Professional AI-powered commit message generation for Visual Studio Code. Leverage 10 different AI providers to create consistent, conventional commit messages that improve code history quality and team collaboration.

<video width="100%" controls>
  <source src="https://shahabahreini.com/wp-content/uploads/GitMind-Introduction.mp4" type="video/mp4"> <a href="https://shahabahreini.com/wp-content/uploads/GitMind-Introduction.mp4">View the demo video</a>
</video>

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant) or via Quick Open (Ctrl+P):

```bash
ext install ShahabBahreiniJangjoo.ai-commit-assistant
```

## Key Features

**Multi-Provider AI Support**: Access 10 different AI providers with unified configuration and intelligent fallback handling.

**Advanced Git Integration**: Smart diff analysis with automatic staging detection, binary file handling, and comprehensive repository state management.

**Intelligent Diff Processing**: Enhanced change detection for staged and unstaged files with context-aware analysis and user guidance for complex scenarios.

**Conventional Commits**: Automatic formatting with proper type categorization (feat|fix|docs|style|refactor|test|chore), scope detection, and breaking change identification.

<video width="100%" controls>
  <source src="https://shahabahreini.com/wp-content/uploads/GenerateCommits.mp4" type="video/mp4"> <a href="https://shahabahreini.com/wp-content/uploads/GenerateCommits.mp4">View the demo video</a>
</video>

**Dynamic Model Selection**: Real-time model browsing for compatible providers with search and filtering capabilities.

**Advanced Token Management**: Pre-generation estimation, rate limiting with minute-based tracking, and usage analytics.

**Professional Workflow Integration**: Native VS Code SCM panel integration with loading indicators and comprehensive status feedback.

**Standardized Prompt Engineering**: Unified prompt architecture across all providers ensuring consistent, high-quality commit message generation.

## AI Provider Comparison

| Provider           | Free Tier | Paid Plans | Local Deployment | Dynamic Models | Rate Limiting | Setup Time |
| ------------------ | --------- | ---------- | ---------------- | -------------- | ------------- | ---------- |
| **GitHub Copilot** | ✗         | ✓          | ✗                | ✗              | VS Code       | **~5 sec** |
| **Google Gemini**  | ✓         | ✓          | ✗                | ✗              | Basic         | ~2 min     |
| **Mistral AI**     | ✓         | ✓          | ✗                | ✓              | Advanced      | ~2 min     |
| **Hugging Face**   | ✓         | ✓          | ✗                | ✓              | Basic         | ~2 min     |
| **Ollama**         | ✓         | ✗          | ✓                | ✓              | N/A           | ~5 min     |
| **Cohere**         | ✓         | ✓          | ✗                | ✗              | Basic         | ~2 min     |
| **OpenAI**         | ✗         | ✓          | ✗                | ✗              | Basic         | ~2 min     |
| **Together AI**    | ✓         | ✓          | ✗                | ✓              | Basic         | ~2 min     |
| **OpenRouter**     | ✓         | ✓          | ✗                | ✓              | Basic         | ~2 min     |
| **Anthropic**      | ✗         | ✓          | ✗                | ✗              | Basic         | ~2 min     |

### 🌟 Recommended Providers

**🚀 For Zero Setup**: GitHub Copilot - requires only your existing VS Code Copilot subscription  
**💰 For Free Usage**: Google Gemini, Mistral AI, or Hugging Face  
**🏠 For Local Privacy**: Ollama with local models  
**⚡ For Performance**: OpenAI GPT-4 or Anthropic Claude
| **Anthropic** | ✗ | ✓ | ✗ | ✗ | Advanced |

## Model Specifications & Capabilities

| Provider           | Model                                   | Context Window | Rate Limits      | Strengths                                | Cost Tier    |
| ------------------ | --------------------------------------- | -------------- | ---------------- | ---------------------------------------- | ------------ |
| **Google Gemini**  | gemini-2.5-pro                          | 2M tokens      | 15 RPM (free)    | Latest reasoning, thinking model         | Free/Paid    |
|                    | gemini-2.5-flash                        | 2M tokens      | 15 RPM (free)    | Efficient thinking, fast inference       | Free/Paid    |
|                    | gemini-2.0-flash                        | 1M tokens      | 15 RPM (free)    | Multimodal, comprehensive                | Free/Paid    |
|                    | gemini-1.5-pro                          | 2M tokens      | 2 RPM (free)     | Comprehensive capabilities               | Free/Paid    |
| **GitHub Copilot** | gpt-4o                                  | 128k tokens    | VS Code managed  | Seamless VS Code integration, no API key | Subscription |
|                    | gpt-4o-mini                             | 128k tokens    | VS Code managed  | Fast, efficient, cost-effective          | Subscription |
|                    | gpt-4-turbo                             | 128k tokens    | VS Code managed  | High performance, balanced capabilities  | Subscription |
|                    | gpt-3.5-turbo                           | 16k tokens     | VS Code managed  | Fast, economical                         | Subscription |
| **Mistral AI**     | mistral-large-latest                    | 128k tokens    | 1 RPM (free)     | Superior reasoning, multilingual         | Free/Paid    |
|                    | mistral-medium                          | 32k tokens     | 5 RPM (free)     | Balanced performance/cost                | Free/Paid    |
|                    | mistral-small                           | 32k tokens     | 10 RPM (free)    | Lightweight, fast                        | Free/Paid    |
| **Hugging Face**   | mistralai/Mistral-7B-Instruct-v0.3      | 32k tokens     | Varies by model  | Open source, customizable                | Free/Paid    |
|                    | meta-llama/Llama-3.3-70B-Instruct       | 128k tokens    | Limited (free)   | Meta's latest, instruction-tuned         | Free/Paid    |
|                    | microsoft/DialoGPT-medium               | 1k tokens      | Generous (free)  | Conversational, lightweight              | Free         |
|                    | google/flan-t5-xxl                      | 512 tokens     | Generous (free)  | Instruction following                    | Free         |
| **Ollama**         | phi4                                    | 128k tokens    | Hardware limited | Microsoft's reasoning model              | Free         |
|                    | llama3.3:70b                            | 128k tokens    | Hardware limited | Meta's flagship, high quality            | Free         |
|                    | codellama:34b                           | 16k tokens     | Hardware limited | Code-specialized, programming            | Free         |
|                    | mistral:7b                              | 32k tokens     | Hardware limited | Efficient, multilingual                  | Free         |
| **Cohere**         | command-r                               | 128k tokens    | 20 RPM (free)    | RAG-optimized, retrieval                 | Free/Paid    |
|                    | command                                 | 4k tokens      | 5 RPM (free)     | General instruction following            | Free/Paid    |
|                    | command-light                           | 4k tokens      | 100 RPM (free)   | Fast, lightweight                        | Free/Paid    |
| **OpenAI**         | gpt-4.1                                 | 128k tokens    | 20 RPM           | Latest model with enhanced capabilities  | Paid         |
|                    | gpt-4o                                  | 128k tokens    | 20 RPM           | Multimodal, latest capabilities          | Paid         |
|                    | o3                                      | 128k tokens    | 10 RPM           | Advanced reasoning model                 | Paid         |
|                    | gpt-4-turbo                             | 128k tokens    | 40 RPM           | High performance, cost-effective         | Paid         |
|                    | gpt-3.5-turbo                           | 16k tokens     | 60 RPM           | Fast, economical                         | Paid         |
| **Together AI**    | meta-llama/Llama-3.3-70B-Instruct-Turbo | 128k tokens    | 60 RPM (free)    | Optimized inference, high quality        | Free/Paid    |
|                    | mistralai/Mixtral-8x7B-Instruct-v0.1    | 32k tokens     | 60 RPM (free)    | Mixture of experts, efficient            | Free/Paid    |
|                    | microsoft/DialoGPT-large                | 1k tokens      | 200 RPM (free)   | Conversational AI                        | Free         |
| **OpenRouter**     | google/gemma-2-27b-it                   | 8k tokens      | Varies           | Google's open model                      | Free/Paid    |
|                    | anthropic/claude-3-haiku                | 200k tokens    | Rate limited     | Fast, efficient reasoning                | Paid         |
|                    | openai/gpt-4-turbo                      | 128k tokens    | Provider limits  | Access to premium models                 | Paid         |
| **Anthropic**      | claude-3-5-sonnet-20241022              | 200k tokens    | 50 RPM           | Latest reasoning, enhanced capabilities  | Paid         |
|                    | claude-3-5-haiku-20241022               | 200k tokens    | 100 RPM          | Fast, efficient processing               | Paid         |
|                    | claude-3-opus-20240229                  | 200k tokens    | 20 RPM           | Most capable reasoning model             | Paid         |
|                    | claude-3-sonnet-20240229                | 200k tokens    | 50 RPM           | Balanced performance                     | Paid         |

## Technical Capabilities

### Advanced Diff Analysis

- **Smart Staging Detection**: Automatic detection of staged vs unstaged changes with user guidance
- **Binary File Handling**: Proper detection and handling of binary files in diffs
- **Repository State Management**: Comprehensive handling of complex git repository states
- **Edge Case Processing**: Robust handling of empty diffs, merge conflicts, and other edge cases

### Commit Message Intelligence

- **Context Analysis**: Analyzes file diffs, change patterns, and repository history
- **Scope Detection**: Automatic identification of affected modules and components
- **Breaking Change Recognition**: Detects API changes and breaking modifications
- **Verbosity Control**: Toggle between detailed descriptions and concise summaries
- **Standardized Prompts**: Consistent prompt templates across all 10 AI providers

### Advanced Configuration

- **Custom Prompts**: Optional context enhancement for domain-specific commits
- **Model Selection**: Provider-specific model configuration with performance optimization
- **Debug Mode**: Comprehensive API interaction logging and response tracking
- **Token Optimization**: Smart content truncation and cost management
- **Diff Validation**: Advanced validation to ensure quality input for AI processing

### Developer Workflow

- **VS Code Integration**: Native Source Control panel with dedicated UI components
- **Smart Change Detection**: Handles staged, unstaged, and mixed modifications with user confirmation
- **Batch Processing**: Support for multiple file changes with intelligent grouping
- **Manual Override**: Preserves user edits and allows custom modifications
- **Error Recovery**: Comprehensive error handling with actionable guidance

## Quick Setup

1. **Choose Provider**: Select from 9 supported AI providers based on your requirements
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

**Diff Complexity Handling**:

- **Large diffs**: Use providers with higher context windows (Gemini, Claude)
- **Binary files**: Automatic detection and exclusion from analysis
- **Mixed changes**: Smart prompting for staged vs unstaged handling

## Requirements

- Visual Studio Code ^1.100.0
- Git repository (initialized)
- API key from chosen provider OR Ollama installation

## Advanced Features

### Enhanced Diff Processing

Advanced git diff analysis with staging detection, binary file handling, and comprehensive repository state management.

### Standardized Prompt Architecture

Unified prompt engineering across all 9 AI providers ensuring consistent, high-quality output regardless of chosen model.

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
- **Advanced Git Integration**: Sophisticated diff processing and repository analysis
- **Smart Response Parsing**: Sophisticated commit message formatting and validation
- **Standardized Prompt System**: Unified prompt architecture across all providers
- **Webview Settings UI**: Professional configuration interface with real-time feedback
- **Enhanced Diff Engine**: Advanced repository analysis and diff processing
- **Token Management**: Intelligent usage tracking and optimization

---

**GitMind** transforms your commit workflow with professional AI-powered message generation, supporting both individual developers and enterprise teams with consistent, meaningful commit histories through advanced diff analysis and standardized prompt engineering.
