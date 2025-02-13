# AI Commit Assistant for VS Code

Generate meaningful and consistent git commit messages using AI. This extension leverages multiple AI providers to help you create conventional commit messages that are clear, consistent, and informative.

## Features

### Multiple AI Provider Support

- **Google's Gemini AI**: Advanced language model for precise commit messages
- **Hugging Face**: Access to various open-source language models
- **Ollama**: Local inference for privacy-focused development
- **Mistral AI**: High-performance language model with multiple tiers

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

### Advanced Features

- **Debug Mode**:
  - Detailed API interaction logs
  - Response tracking
  - Error diagnostics
- **Rate Limit Handling**:
  - Smart API quota management
  - Clear feedback on limits
  - Automatic retries (where applicable)

## Requirements

- Visual Studio Code ^1.75.0
- Git installed and initialized
- One of the following configurations:
  - Gemini API key
  - Hugging Face API key
  - Ollama installation
  - Mistral API key

## Installation

1. Install from VS Code Marketplace
2. Configure via Command Palette or Settings UI
3. Start generating commits!

## Configuration

### Via Settings UI

Access the settings UI through:

- Command Palette: `AI Commit Assistant: Open Settings`
- ⚙️ icon in Source Control panel

### Via settings.json

```json
{
  "aiCommitAssistant.apiProvider": "mistral",
  "aiCommitAssistant.debug": false,
  
  // Gemini Settings
  "aiCommitAssistant.gemini.apiKey": "",
  "aiCommitAssistant.gemini.enabled": true,
  
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
  "aiCommitAssistant.commit.addBulletPoints": true
}
```

### Default Models

- **Gemini**: `gemini-pro`
- **Hugging Face**: `mistralai/Mistral-7B-Instruct-v0.3`
- **Ollama**: `phi4`
- **Mistral**: `mistral-large-latest`

## Usage

### Via Source Control Panel

1. Make your changes
2. Stage files (optional)
3. Click the ✨ (sparkle) icon in the Source Control panel
4. Review and edit the generated message
5. Commit as usual

### Via Command Palette

1. `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type "Generate AI Commit Message"
3. Review and edit the generated message

### Generated Commit Structure

```
<type>[optional scope]: <description>

- Detailed change explanation
- Impact or reasoning
- Breaking changes (if any)
```

## Visual Elements

The extension adds these icons to your Source Control panel:

- ✨ (Sparkle): Generate commit message
- 🔄 (Loading): Shows during generation
- ⚙️ (Settings): Open settings UI

## Privacy & Security

- All API calls are made directly to chosen provider
- No data storage except local debug logs
- Ollama option for complete local processing
- API keys stored in VS Code's secure storage

## Development

### Building from Source

```bash
npm install
npm run compile
npm run package
```

### Testing

```bash
npm run test
```

## License

MIT License - See LICENSE.md for details

---

**Note**: First-time setup requires configuring an API provider and key through the Settings UI (⚙️ icon) or settings.json.
