# GitMind: AI Commit Assistant for VS Code

Generate meaningful and consistent git commit messages using AI. This extension leverages multiple AI providers, focusing on those offering free tier API tokens, to help you create conventional commit messages that are clear, consistent, and informative.

![GitMind Demo](https://shahabahreini.com/wp-content/uploads/toturial.gif)

## Installation

Install directly from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant)

Or launch VS Code Quick Open (Ctrl+P), paste the following command, and press enter:
```ext install ShahabBahreiniJangjoo.ai-commit-assistant```

## Features

### Multiple AI Provider Support

- **[Google's Gemini AI](https://cloud.google.com/ai-platform/)** (Recommended): Advanced language model for precise commit messages
- **[Mistral AI](https://mistral.ai/)**: High-performance language model with multiple tiers, including free options
- **[Hugging Face](https://huggingface.co/)**: Access to various open-source language models with free tier options
- **[Ollama](https://ollama.com/)**: A completely free, locally installed engine for privacy-focused development
- **[Cohere](https://cohere.com/)**: High-quality language models with a focus on command and retrieval tasks, offering various models and a free tier
- **[OpenAI](https://openai.com/)**: High-quality GPT models for professional results

| Provider            | Free Plan | Paid Plan |
|---------------------|-----------|-----------|
| Google's Gemini AI  | Yes       | Yes       |
| Mistral AI          | Yes       | Yes       |
| Hugging Face        | Yes       | Yes       |
| Ollama              | Yes       | No        |
| Cohere              | Yes       | Yes       |
| OpenAI              | No        | Yes       |

### Smart Git Integration

- **Automatic Change Detection**:
  - Analyzes staged changes automatically
  - Handles unstaged changes with user confirmation
  - Supports both single and multiple file changes
- **Custom Context Support**:
  - Optional prompt customization for better context
  - User-provided additional information for commit messages
  - Enhanced commit message accuracy with custom context
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

### Prompt Customization

Enable prompt customization to provide additional context when generating commit messages:

1. Enable via Settings:
   - Open VS Code settings
   - Search for "AI Commit Assistant"
   - Enable "Prompt Customization"
2. Usage:
   - When generating a commit message, you'll be prompted for additional context
   - Enter relevant information about the changes
   - The AI will incorporate your context into the commit message

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
  - Cohere API key (free tier available)

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

## AI Provider Setup

### Google's Gemini AI

1. Sign up for a Google Cloud account at [Google AI Studio](https://makersuite.google.com/)
2. Create an API key in your Google AI Studio dashboard
3. Configure the extension:
   - Set "Gemini" as your provider
   - Enter your API key
   - Select your preferred model (gemini-pro)

### Mistral AI

1. Sign up for an account at [Mistral AI](https://console.mistral.ai/)
2. Create an API key in your Mistral AI dashboard
3. Configure the extension:
   - Set "Mistral" as your provider
   - Enter your API key
   - Select your preferred model (mistral-large-latest, mistral-medium, etc.)

### Hugging Face

1. Sign up for an account at [Hugging Face](https://huggingface.co/)
2. Create an API key in your Hugging Face dashboard
3. Configure the extension:
   - Set "Hugging Face" as your provider
   - Enter your API key
   - Select or enter your preferred model identifier

### Ollama

1. Install [Ollama](https://ollama.com/) on your local machine
2. Pull your preferred model (e.g., `ollama pull phi4`)
3. Configure the extension:
   - Set "Ollama" as your provider
   - Configure the Ollama URL (default is <http://localhost:11434>)
   - Select your preferred model from those you've pulled

### Cohere

1. Sign up for an account at [Cohere](https://dashboard.cohere.com/)
2. Create an API key in your Cohere dashboard
3. Configure the extension:
   - Set "Cohere" as your provider
   - Enter your API key
   - Select your preferred model (command, command-light, command-nightly, or command-r)

### OpenAI

1. Sign up for an account at [OpenAI](https://platform.openai.com/)
2. Create an API key in your OpenAI dashboard
3. Configure the extension:
   - Set "OpenAI" as your provider
   - Enter your API key
   - Select your preferred model (GPT-4o, GPT-4-turbo, or GPT-3.5-turbo)

## Available Models

### Gemini Models

- **gemini-pro**: Advanced language model with strong reasoning capabilities and code understanding

### Mistral Models

- **mistral-large-latest**: Most powerful Mistral model with excellent reasoning capabilities
- **mistral-medium**: Balanced model offering good performance at lower cost
- **mistral-small**: Lightweight model for basic tasks with minimal token usage

### Hugging Face Models

- **mistralai/Mistral-7B-Instruct-v0.3**: State-of-the-art open-source 7B parameter model
- **meta-llama/Llama-2-7b-chat-hf**: Meta's Llama 2 conversational model
- **google/flan-t5-xxl**: Google's instruction-tuned T5 model
- And many other open-source models available on Hugging Face

### Ollama Models

- **phi4**: Microsoft's advanced model with excellent reasoning capabilities
- **llama3**: Meta's latest Llama model
- **mistral**: Mistral AI's 7B model running locally
- **codellama**: Specialized for code understanding and generation

### Cohere Models

- **command**: Optimized for instructions with excellent reasoning capabilities
- **command-light**: Lighter, faster version of command with lower cost
- **command-nightly**: Latest build with newest improvements (may be less stable)
- **command-r**: Optimized for retrieval and RAG applications

### OpenAI Models

- **gpt-4o**: Latest GPT-4o model with enhanced capabilities
- **gpt-4-turbo**: High-performance GPT-4 model with fast inference
- **gpt-3.5-turbo**: Efficient and cost-effective GPT-3.5 model
