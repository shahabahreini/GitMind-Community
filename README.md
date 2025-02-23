# GitMind: AI Commit Assistant for VS Code

Generate meaningful and consistent git commit messages using AI. This extension leverages multiple AI providers, focusing on those offering free tier API tokens, to help you create conventional commit messages that are clear, consistent, and informative.

![GitMind Demo](https://shahabahreini.com/wp-content/uploads/toturial.gif)

## Features

### Multiple AI Provider Support

- **Mistral AI** (Recommended): High-performance language model with multiple tiers, including free options
- **Google's Gemini AI**: Advanced language model for precise commit messages
- **Hugging Face**: Access to various open-source language models with free tier options
- **Ollama**: A completely free, locally installed engine for privacy-focused development

### Smart Git Integration

- **Automatic Change Detection**:
  - Analyzes staged changes automatically
  - Handles unstaged changes with user confirmation
  - Supports both single and multiple file changes
- **VS Code SCM Integration**:
  - AI icon in Source Control panel for quick access
  - ⚙️ Settings icon for quick configuration
  - 🔄 Loading indicator during message generation
- **Flexible Workflow Support**:
  - Works with staged and unstaged changes
  - Compatible with all Git operations
  - Preserves manual edits
- **Verbosity Control**:
  - Toggle between detailed and concise commit messages
  - Detailed mode includes bullet points and context
  - Concise mode shows only the summary line
- **Diagnostic Information**:
  - Optional token count estimation
  - Model information display
  - Generation status in status bar

### Commit Message Generation

- **Conventional Commits Format**:
  - Type categorization (feat|fix|docs|style|refactor|test|chore)
  - Scope support (optional)
  - Breaking change detection
- **Smart Formatting**:
  - Subject line limited to 72 characters
  - Detailed bullet-point descriptions
  - Proper imperative mood
  - Technical accuracy

### Token Management

- **Token Estimation**:
  - Pre-generation token count estimates
  - Smart content optimization
  - Rate limit monitoring (Mistral)
- **Usage Tracking**:
  - Real-time token consumption display
  - Rate limit status indicators
  - Quota management helpers

### Advanced Features

- **Debug Mode**:
  - Detailed API interaction logs
  - Response tracking
  - Error diagnostics
- **Rate Limit Handling (only Mistral)**:
  - Smart API quota management
  - Clear feedback on limits
  - Automatic retries (where applicable)

## Requirements

- Visual Studio Code ^1.75.0
- Git installed and initialized
- One of the following configurations:
  - Gemini API key (free tier available)
  - Hugging Face API key (free tier available)
  - Ollama installation (completely free)
  - Mistral API key (free tier available)

## Installation

1. Install from VS Code Marketplace
2. Configure via Command Palette or Settings UI
3. Start generating commits!

## Configuration

### Via Settings UI

Access the settings UI through:

- Command Palette: `AI Commit Assistant: Open Settings`
- ⚙️ icon in Source Control panel
- Verbose commit message toggle
- Diagnostic information toggle
- Provider-specific model selection
- Real-time validation
- Direct links to API documentation

### Via settings.json

```json
{
  "aiCommitAssistant.apiProvider": "mistral",
  "aiCommitAssistant.debug": false,

  // Gemini Settings
  "aiCommitAssistant.gemini.apiKey": "",
  "aiCommitAssistant.gemini.enabled": true,
  "aiCommitAssistant.gemini.model": "gemini-pro",

  // Hugging Face Settings
  "aiCommitAssistant.huggingface.apiKey": "",
  "aiCommitAssistant.huggingface.model": "mistralai/Mistral-7B-Instruct-v0.3",
  "aiCommitAssistant.huggingface.enabled": true,
  "aiCommitAssistant.huggingface.temperature": 0.7,

  // Ollama Settings
  "aiCommitAssistant.ollama.url": "http://localhost:11434",
  "aiCommitAssistant.ollama.model": "phi4",
  "aiCommitAssistant.ollama.enabled": true,

  // Mistral Settings
  "aiCommitAssistant.mistral.apiKey": "",
  "aiCommitAssistant.mistral.model": "mistral-large-latest",
  "aiCommitAssistant.mistral.enabled": true,

  // Commit Settings
  "aiCommitAssistant.commit.style": "conventional",
  "aiCommitAssistant.commit.maxLength": 72,
  "aiCommitAssistant.commit.includeScope": true,
  "aiCommitAssistant.commit.addBulletPoints": true,

  "aiCommitAssistant.showDiagnostics": false,   // Show model and token information before generating messages
  "aiCommitAssistant.commit.verbose": true     // Generate detailed messages with bullet points
}
```
