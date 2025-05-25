# Comprehensive Guide: Adding New AI Providers to GitMind

This document provides complete instructions for AI agents to add new AI providers to the GitMind extension. Follow these steps in order to ensure all components are properly integrated.

## Overview

Adding a new provider requires updates to:

- Type definitions and interfaces
- API implementation
- UI components and settings
- Configuration management
- Validation and error handling
- Documentation

## Step 1: Update Type Definitions

### File: `/src/config/types.ts`

Add your provider to the type system:

```typescript
// filepath: /src/config/types.ts

// 1. Add to ApiProvider union type
export type ApiProvider = "gemini" | "huggingface" | "ollama" | "mistral" | "cohere" | "your-provider";

// 2. Create provider-specific config interface
export interface YourProviderApiConfig extends BaseApiConfig {
    type: "your-provider";
    apiKey: string;
    model: string;
    // Add provider-specific properties like temperature, maxTokens, etc.
}

// 3. Add to ExtensionConfig interface
export interface ExtensionConfig {
    // ...existing code...
    yourProvider: {
        enabled: boolean;
        apiKey?: string;
        model: string;
        // Other provider-specific settings
    };
}

// 4. Add to ApiConfig union type
export type ApiConfig =
    | GeminiApiConfig
    | HuggingFaceApiConfig
    | OllamaApiConfig
    | MistralApiConfig
    | CohereApiConfig
    | YourProviderApiConfig;
```

### File: `/src/models/ExtensionSettings.ts`

Update the settings model:

```typescript
// filepath: /src/models/ExtensionSettings.ts

export interface ExtensionSettings {
    apiProvider: string;
    debug?: boolean;
    // ...existing providers...
    yourProvider: {
        apiKey: string;
        model: string;
        // Add any other provider-specific settings
    };
    commit?: {
        verbose: boolean;
    };
}
```

## Step 2: Create API Implementation

### File: `/src/services/api/your-provider.ts`

Create the API implementation (NEW FILE):

```typescript
// filepath: /src/services/api/your-provider.ts

import { debugLog } from "../debug/logger";

/**
 * Makes a request to your provider's API to generate a commit message
 * @param apiKey The API key
 * @param model The model to use
 * @param diff Git diff to analyze
 * @returns Generated commit message
 */
export async function callYourProviderAPI(apiKey: string, model: string, diff: string): Promise<string> {
    try {
        debugLog(`Calling Your Provider API with model: ${model}`);
        const prompt = createPromptFromDiff(diff);

        // IMPORTANT: Check the provider's API documentation for correct endpoint and format
        const response = await fetch('https://api.your-provider.com/v1/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                // Format according to provider's API spec
                // Example for chat-based APIs:
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                // Example for generation-based APIs:
                // prompt: prompt,
                // max_tokens: 350,
                // temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`Your Provider API error: ${response.status} ${errorText}`);
            throw new Error(`Your Provider API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        debugLog(`Your Provider API response received`);

        // Parse response according to provider's format
        let generatedText;
        
        // For chat-based responses (like OpenAI, Cohere):
        if (data.message && data.message.content) {
            if (Array.isArray(data.message.content)) {
                // Cohere v2 format
                generatedText = data.message.content.find(item => item.type === "text")?.text;
            } else {
                // Simple string content
                generatedText = data.message.content;
            }
        }
        // For choice-based responses (like OpenAI):
        else if (data.choices && data.choices.length > 0) {
            generatedText = data.choices[0].message.content;
        }
        // For generation-based responses (like some Hugging Face models):
        else if (data.generated_text) {
            generatedText = data.generated_text;
        }
        // For array responses:
        else if (data.generations && data.generations.length > 0) {
            generatedText = data.generations[0].text;
        }
        else {
            throw new Error('Unexpected response format from Your Provider API');
        }

        if (!generatedText) {
            throw new Error('No text content found in API response');
        }

        return formatCommitMessage(generatedText);
    } catch (error) {
        debugLog('Error in callYourProviderAPI:', error);
        throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function createPromptFromDiff(diff: string): string {
    return `Generate a concise and informative git commit message based on the following changes.
Focus on what was changed and why. Keep the message under 72 characters for the summary line.
If verbose mode is needed, add bullet points explaining key changes.

Here are the changes:

\`\`\`
${diff}
\`\`\`

Git Commit Message:`;
}

function formatCommitMessage(message: string): string {
    // Remove any "Git Commit Message:" or similar prefixes
    let formattedMessage = message.replace(/^(git commit message:?|commit message:?)/i, '').trim();
    
    // Remove quotes that might wrap the message
    formattedMessage = formattedMessage.replace(/^["']|["']$/g, '');
    
    return formattedMessage;
}
```

## Step 3: Create UI Settings Component

### File: `/src/webview/settings/components/YourProviderSettings.ts`

Create the settings UI component (NEW FILE):

```typescript
// filepath: /src/webview/settings/components/YourProviderSettings.ts

import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class YourProviderSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        return `
    <div id="yourProviderSettings" class="api-settings ${this._settings.apiProvider === "your-provider" ? "" : "hidden"}">
      <h3>Your Provider Settings</h3>
      <div class="form-group">
        <label for="yourProviderApiKey">API Key</label>
        <input type="password" id="yourProviderApiKey" value="${this._settings.yourProvider?.apiKey || ""}" />
      </div>
      <div class="form-group">
        <label for="yourProviderModel">Model</label>
        <select id="yourProviderModel">
          <option value="model-1" ${this._settings.yourProvider?.model === "model-1" ? "selected" : ""}>Model 1</option>
          <option value="model-2" ${this._settings.yourProvider?.model === "model-2" ? "selected" : ""}>Model 2</option>
          <option value="model-3" ${this._settings.yourProvider?.model === "model-3" ? "selected" : ""}>Model 3</option>
        </select>
      </div>
    </div>`;
    }
}
```

## Step 4: Update General Settings Component

### File: `/src/webview/settings/components/GeneralSettings.ts`

Add your provider to the dropdown:

```typescript
// filepath: /src/webview/settings/components/GeneralSettings.ts

public render(): string {
    return `
    <div class="settings-section">
      <h3>General Settings</h3>
      <div class="form-group">
        <div class="checkbox-container">
          <input type="checkbox" id="commitVerbose" ${this._settings.commit?.verbose ? "checked" : ""} />
          <label for="commitVerbose">Verbose Commit Messages</label>
        </div>
        <div class="description">
          When enabled, generates detailed commit messages with bullet points.
          When disabled, only generates the summary line.
        </div>
      </div>
      <div class="form-group">
        <label for="apiProvider">API Provider</label>
        <select id="apiProvider">
          <option value="gemini" ${this._settings.apiProvider === "gemini" ? "selected" : ""}>Gemini</option>
          <option value="huggingface" ${this._settings.apiProvider === "huggingface" ? "selected" : ""}>Hugging Face</option>
          <option value="ollama" ${this._settings.apiProvider === "ollama" ? "selected" : ""}>Ollama</option>
          <option value="mistral" ${this._settings.apiProvider === "mistral" ? "selected" : ""}>Mistral</option>
          <option value="cohere" ${this._settings.apiProvider === "cohere" ? "selected" : ""}>Cohere</option>
          <option value="your-provider" ${this._settings.apiProvider === "your-provider" ? "selected" : ""}>Your Provider</option>
        </select>
      </div>
    </div>`;
}
```

## Step 5: Update Settings Template Generator

### File: `/src/webview/settings/SettingsTemplateGenerator.ts`

Import and integrate the new settings component:

```typescript
// filepath: /src/webview/settings/SettingsTemplateGenerator.ts

// ...existing imports...
import { YourProviderSettings } from "./components/YourProviderSettings";

export class SettingsTemplateGenerator {
    // ...existing code...

    public generateHtml(): string {
        // ...existing code...
        const yourProviderSettings = new YourProviderSettings(this._settings);

        return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      // ...existing code...
    </head>
    <body>
      <div class="settings-container">
        <div id="statusBannerContainer">
          ${statusBanner.render()}
        </div>
        <h2>AI Commit Assistant Settings</h2>
        ${generalSettings.render()}
        ${geminiSettings.render()}
        ${huggingFaceSettings.render()}
        ${ollamaSettings.render()}
        ${mistralSettings.render()}
        ${cohereSettings.render()}
        ${yourProviderSettings.render()}
        ${buttonGroup.render()}
      </div>
      ${getSettingsScript(this._settings, this._nonce)}
    </body>
    </html>`;
    }
}
```

## Step 6: Update Settings Manager

### File: `/src/webview/settings/SettingsManager.ts`

Add settings persistence for your provider:

```typescript
// filepath: /src/webview/settings/SettingsManager.ts

export class SettingsManager {
    public getSettings(): ExtensionSettings {
        const config = vscode.workspace.getConfiguration("aiCommitAssistant");
        const apiProvider = config.get<string>("apiProvider") || "huggingface";

        return {
            apiProvider,
            debug: config.get<boolean>("debug") || false,
            // ...existing providers...
            yourProvider: {
                apiKey: config.get<string>("yourProvider.apiKey") || "",
                model: config.get<string>("yourProvider.model") || "model-1",
            },
            // ...existing code...
        };
    }

    public async saveSettings(settings: ExtensionSettings): Promise<void> {
        const config = vscode.workspace.getConfiguration("aiCommitAssistant");

        // ...existing save operations...
        await config.update(
            "yourProvider.apiKey",
            settings.yourProvider.apiKey,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "yourProvider.model",
            settings.yourProvider.model,
            vscode.ConfigurationTarget.Global
        );

        vscode.window.showInformationMessage("Settings saved successfully!");
    }
}
```

## Step 7: Update Configuration Settings

### File: `/src/config/settings.ts`

Add configuration retrieval for your provider:

```typescript
// filepath: /src/config/settings.ts

export function getConfiguration(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration("aiCommitAssistant");

    return {
        provider: config.get("apiProvider", "mistral"),
        debug: config.get("debug", false),
        // ...existing providers...
        yourProvider: {
            enabled: config.get("yourProvider.enabled", false),
            apiKey: config.get("yourProvider.apiKey"),
            model: config.get("yourProvider.model", "model-1"),
        },
        // ...existing code...
    };
}

export function getApiConfig(): ApiConfig {
    const config = getConfiguration();
    const selectedProvider = config.provider;

    switch (selectedProvider) {
        // ...existing cases...
        case "your-provider":
            return {
                type: "your-provider",
                apiKey: config.yourProvider.apiKey || "",
                model: config.yourProvider.model || "model-1",
            };

        default:
            throw new Error(`Unsupported provider: ${selectedProvider}`);
    }
}
```

## Step 8: Add API Validation

### File: `/src/services/api/validation.ts`

Add validation for your provider:

```typescript
// filepath: /src/services/api/validation.ts

// ...existing code...

async function validateYourProviderApiKey(apiKey: string): Promise<boolean> {
    try {
        // Use a lightweight endpoint to validate the API key
        const response = await fetch("https://api.your-provider.com/v1/models", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        return response.ok;
    } catch (error) {
        debugLog("Your Provider API validation error:", error);
        return false;
    }
}

export async function checkApiSetup(): Promise<ApiCheckResult> {
    const config: ApiConfig = getApiConfig();
    let result: ApiCheckResult = {
        success: false,
        provider: config.type,
        details: '',
    };

    try {
        switch (config.type) {
            // ...existing cases...
            
            case "your-provider":
                if (!config.apiKey) {
                    result.error = "API key not configured";
                    result.troubleshooting = "Please enter your Provider API key in the settings";
                } else {
                    const isValid = await validateYourProviderApiKey(config.apiKey);
                    result.success = isValid;
                    if (isValid) {
                        result.model = config.model || "model-1";
                        result.responseTime = 500; // Placeholder value
                        result.details = "Connection test successful";
                    } else {
                        result.error = "Invalid API key";
                        result.troubleshooting = "Please check your API key configuration";
                    }
                }
                break;
        }

        return result;
    } catch (error) {
        // ...existing code...
    }
}

export async function checkRateLimits(): Promise<RateLimitsCheckResult> {
    const config: ApiConfig = getApiConfig();
    let result: RateLimitsCheckResult = {
        success: false
    };

    try {
        switch (config.type) {
            // ...existing cases...
            
            case "your-provider":
                result.success = true;
                result.limits = {
                    reset: Math.floor(Date.now() / 1000) + 3600,
                    limit: 100,
                    remaining: 90,
                    queryCost: 1
                };
                result.notes = "Rate limits depend on your account tier";
                break;

            default:
                // ...existing code...
                break;
        }
    } catch (error) {
        // ...existing code...
    }

    return result;
}
```

## Step 9: Update Main API Service

### File: `/src/services/api/index.ts`

Integrate your provider into the main API service:

```typescript
// filepath: /src/services/api/index.ts

// ...existing imports...
import { callYourProviderAPI } from "./your-provider";

type ApiProvider = "Gemini" | "Hugging Face" | "Ollama" | "Mistral" | "Cohere" | "Your Provider";

// ...existing code...

async function generateMessageWithConfig(
    config: ApiConfig,
    diff: string
): Promise<string> {
    // ...existing code...

    switch (config.type) {
        // ...existing cases...

        case "your-provider": {
            const yourProviderConfig = config as YourProviderApiConfig;
            if (!yourProviderConfig.apiKey) {
                const result = await vscode.window.showWarningMessage(
                    "Your Provider API key is required. Would you like to configure it now?",
                    "Enter API Key",
                    "Get API Key",
                    "Cancel"
                );

                if (result === "Enter API Key") {
                    const apiKey = await vscode.window.showInputBox({
                        title: "Your Provider API Key",
                        prompt: "Please enter your API key",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "yourProvider.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!yourProviderConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callYourProviderAPI(
                            apiKey.trim(),
                            yourProviderConfig.model,
                            diff
                        );
                    }
                } else if (result === "Get API Key") {
                    await vscode.env.openExternal(
                        vscode.Uri.parse("https://your-provider.com/api-keys")
                    );
                    const apiKey = await vscode.window.showInputBox({
                        title: "Your Provider API Key",
                        prompt: "Please enter your API key after getting it from the website",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "yourProvider.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!yourProviderConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callYourProviderAPI(
                            apiKey.trim(),
                            yourProviderConfig.model,
                            diff
                        );
                    }
                }
                return "";
            }
            if (!yourProviderConfig.model) {
                await vscode.window.showErrorMessage(
                    "Please select a model in the settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            return await callYourProviderAPI(
                yourProviderConfig.apiKey,
                yourProviderConfig.model,
                diff
            );
        }

        default: {
            const _exhaustiveCheck: never = config;
            throw new Error(`Unsupported API provider: ${(config as any).type}`);
        }
    }
}

// ...existing code...

function showModelInfo(config: ApiConfig) {
    let modelInfo = "";
    switch (config.type) {
        // ...existing cases...
        case "your-provider":
            modelInfo = `Using Your Provider (${config.model})`;
            break;
    }
    vscode.window.setStatusBarMessage(modelInfo, 3000);
}

function getProviderName(type: string): ApiProvider {
    switch (type) {
        // ...existing cases...
        case "your-provider":
            return "Your Provider";
        default:
            throw new Error(`Unknown provider type: ${type}`);
    }
}

function getProviderSettingPath(provider: string): string {
    const paths: Record<string, string> = {
        // ...existing paths...
        "Your Provider": "yourProvider.apiKey"
    };
    return paths[provider] || "";
}
```

## Step 10: Update Onboarding Manager

### File: `/src/utils/onboardingManager.ts`

Add your provider to the onboarding experience:

```typescript
// filepath: /src/utils/onboardingManager.ts

export class OnboardingManager {
    private static readonly ONBOARDING_SHOWN_KEY = 'aiCommitAssistant.onboardingShown';

    private static readonly PROVIDER_DOCS: Record<string, string> = {
        'Gemini': 'https://aistudio.google.com/app/apikey',
        'Hugging Face': 'https://huggingface.co/settings/tokens',
        'Ollama': 'https://ollama.ai/download',
        'Mistral': 'https://console.mistral.ai/api-keys/',
        'Cohere': 'https://dashboard.cohere.com/api-keys',
        'Your Provider': 'https://your-provider.com/api-keys'
    };

    // ...existing code...

    private static getProviderSettingPath(provider: string): string {
        const paths: Record<string, string> = {
            'Gemini': 'gemini.apiKey',
            'Hugging Face': 'huggingface.apiKey',
            'Mistral': 'mistral.apiKey',
            'Cohere': 'cohere.apiKey',
            'Your Provider': 'yourProvider.apiKey'
        };
        return paths[provider] || '';
    }

    // ...existing code...
}
```

## Step 11: Update Package.json Configuration

### File: `/package.json`

Add configuration options for your provider:

```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "aiCommitAssistant.apiProvider": {
          "type": "string",
          "enum": [
            "gemini",
            "huggingface", 
            "ollama",
            "mistral",
            "cohere",
            "your-provider"
          ],
          "enumDescriptions": [
            "Use Google's Gemini AI for generating commit messages",
            "Use Hugging Face models for generating commit messages",
            "Use local Ollama models for generating commit messages", 
            "Use Mistral AI for generating commit messages",
            "Use Cohere AI for generating commit messages",
            "Use Your Provider for generating commit messages"
          ],
          "default": "huggingface",
          "description": "Select which AI provider to use for generating commit messages"
        },
        "aiCommitAssistant.yourProvider.apiKey": {
          "type": "string",
          "default": "",
          "description": "API key for Your Provider"
        },
        "aiCommitAssistant.yourProvider.model": {
          "type": "string",
          "enum": [
            "model-1",
            "model-2", 
            "model-3"
          ],
          "default": "model-1",
          "description": "Your Provider model to use for generating commit messages"
        }
      }
    }
  }
}
```

Also update the description and keywords:

```json
{
  "description": "Generate meaningful git commit messages using Free/Paid AI (Mistral, Gemini, Hugging Face, Cohere, Your Provider, or Ollama) with support for conventional commits and multiple LLM models",
  "keywords": [
    "git",
    "commit",
    "ai",
    "gemini", 
    "huggingface",
    "ollama",
    "mistral",
    "mistral-ai",
    "cohere",
    "your-provider",
    "conventional-commits"
  ]
}
```

## Step 12: Update Extension.ts

### File: `/src/extension.ts`

Update the extension to log your provider:

```typescript
// filepath: /src/extension.ts

export async function activate(context: vscode.ExtensionContext) {
    // Initialize state and logger
    state.context = context;
    initializeLogger(state.debugChannel);
    debugLog("AI Commit Assistant is now active");
    debugLog(
        "Extension configuration:",
        vscode.workspace.getConfiguration("aiCommitAssistant")
    );

    // Log supported API providers, now including Your Provider
    debugLog("Supported API providers: Gemini, Hugging Face, Ollama, Mistral, Cohere, Your Provider");

    // ...existing code...
}
```

## Step 13: Update Documentation

### File: `/README.md`

Update the README to include your provider:

```markdown
<!-- filepath: /README.md -->

## Features

- Generate meaningful commit messages using AI
- Support for multiple AI providers:
  - [Gemini](https://ai.google.dev/) (Google AI)
  - [Hugging Face](https://huggingface.co/)
  - [Ollama](https://ollama.ai/) (local inference)
  - [Mistral AI](https://mistral.ai/)
  - [Cohere](https://cohere.com/)
  - [Your Provider](https://your-provider.com/) (added in v1.x.x)
- Customizable commit message style and format
- Integration with VS Code's Source Control UI

## AI Provider Setup

### Your Provider

1. Sign up for an account at [Your Provider](https://your-provider.com/)
2. Create an API key in your dashboard
3. Configure the extension:
   - Set "Your Provider" as your provider
   - Enter your API key
   - Select your preferred model (model-1, model-2, or model-3)

## Available Models

### Your Provider Models

- **model-1**: Description of model 1 capabilities
- **model-2**: Description of model 2 capabilities  
- **model-3**: Description of model 3 capabilities
```

### File: `/CHANGELOG.md`

Update the changelog:

```markdown
<!-- filepath: /CHANGELOG.md -->

# Change Log

## [1.x.x] - Unreleased

### Added
- Added support for [Your Provider](https://your-provider.com/) AI provider
- Added Your Provider models: model-1, model-2, model-3
- Added Your Provider API validation and settings UI

### Changed
- Updated onboarding to include Your Provider as a provider option
- Enhanced provider selection UI with Your Provider option
- Updated diagnostics to support Your Provider models

## [1.3.3] - Released

### Added
- Added support for [Cohere](https://cohere.com/) AI provider
- Added Cohere models: command, command-light, command-nightly, and command-r
- Added Cohere API validation and settings UI

### Changed
- Updated onboarding to include Cohere as a provider option
- Enhanced provider selection UI with Cohere option
- Updated diagnostics to support Cohere models
```

## Critical Implementation Tips

### 1. API Format Research

**MOST IMPORTANT**: Research your provider's exact API format before implementing:

- Check if they use chat format (`messages` array) or generation format (`prompt` string)
- Verify the correct endpoint URL (e.g., `/v1/chat`, `/v2/chat`, `/generate`)
- Check authentication method (Bearer token, API key header, etc.)

### 2. Response Parsing

Different providers return responses in different formats:

- **Chat APIs**: Usually `data.choices[0].message.content` or `data.message.content`
- **Generation APIs**: Usually `data.generated_text` or `data.generations[0].text`
- **Cohere v2**: `data.message.content[0].text` where content is an array of typed objects

### 3. Error Handling

Implement robust error handling:

- Parse error responses according to provider format
- Handle rate limiting errors specifically
- Provide clear troubleshooting messages

### 4. Model Selection

Research and add appropriate models:

- Check provider documentation for available models
- Choose sensible defaults for code-related tasks
- Consider model capabilities and pricing

### 5. Authentication Flow

Test the authentication flow thoroughly:

- API key validation endpoints vary by provider
- Some providers require different validation methods
- Ensure error messages guide users to correct setup

### 6. Testing Checklist

Before considering implementation complete, test:

- [ ] Settings UI shows/hides correctly
- [ ] API key can be entered and saved
- [ ] Model selection works
- [ ] API validation works with valid/invalid keys
- [ ] Commit message generation works end-to-end
- [ ] Error handling works for network issues
- [ ] Onboarding flow includes new provider

## Common Gotchas

1. **API Version Changes**: Providers sometimes change API versions (like Cohere v1 → v2)
2. **Response Format**: Always check actual API responses, don't assume format
3. **Rate Limiting**: Each provider has different rate limiting rules
4. **Token Counting**: Different providers count tokens differently
5. **Model Names**: Exact model names must match provider documentation
6. **Authentication**: Some providers use different auth header formats

## Debugging Tips

1. Enable debug logging to see API requests/responses
2. Test with curl first to understand API format
3. Check VSCode developer console for JavaScript errors
4. Verify configuration values are being saved/loaded correctly
5. Test with minimal prompts before testing with full git diffs

Follow these instructions exactly and your new provider will be fully integrated into GitMind!
