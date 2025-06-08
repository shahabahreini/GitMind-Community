# Complete AI Provider Integration Guide

This guide provides step-by-step instructions for integrating a new AI provider into the GitMind: AI Commit Assistant VS Code extension.

## Prerequisites

Before starting, ensure you have:
- Provider name (e.g., "anthropic", "deepseek", "openai")
- Provider display name (e.g., "Anthropic", "DeepSeek", "OpenAI")
- Available models list
- API endpoint URL
- Authentication method (API key, OAuth, etc.)
- SVG icon path data
- Default model name
- Documentation/API keys URL

## Step 1: Update Core Types

### File: `src/config/types.ts`

1. **Add provider to ApiProvider union type:**
```typescript
export type ApiProvider = "gemini" | "huggingface" | "ollama" | "mistral" | "cohere" | "openai" | "together" | "openrouter" | "anthropic" | "copilot" | "deepseek" | "PROVIDER_NAME";
```

2. **Add provider model type:**
```typescript
export type ProviderNameModel =
    // Latest Models
    | "model-name-1"
    | "model-name-2"
    | "model-name-3";
```

3. **Add provider API configuration interface:**
```typescript
export interface ProviderNameApiConfig extends BaseApiConfig {
    type: "PROVIDER_NAME";
    apiKey: string; // or other auth fields
    model: ProviderNameModel;
}
```

4. **Add to ApiConfig union type:**
```typescript
export type ApiConfig =
    | GeminiApiConfig
    | HuggingFaceApiConfig
    | OllamaApiConfig
    | MistralApiConfig
    | CohereApiConfig
    | OpenAIApiConfig
    | TogetherApiConfig
    | OpenRouterApiConfig
    | AnthropicApiConfig
    | CopilotApiConfig
    | DeepSeekApiConfig
    | ProviderNameApiConfig;
```

5. **Add to ExtensionConfig interface:**
```typescript
export interface ExtensionConfig {
    // ... existing fields
    PROVIDER_NAME: {
        enabled: boolean;
        apiKey?: string; // or other auth fields
        model: string;
    };
}
```

## Step 2: Update Settings Configuration

### File: `src/config/settings.ts`

1. **Add import for model type:**
```typescript
import {
    // ... existing imports
    ProviderNameModel, // Add this import
} from "./types";
```

2. **Add provider config in getConfiguration():**
```typescript
export function getConfiguration(): ExtensionConfig {
    // ... existing code
    return {
        // ... existing providers
        PROVIDER_NAME: {
            enabled: config.get("PROVIDER_NAME.enabled", false),
            apiKey: config.get("PROVIDER_NAME.apiKey"),
            model: config.get("PROVIDER_NAME.model", "DEFAULT_MODEL_NAME"),
        },
        // ... rest of config
    };
}
```

3. **Add case in getApiConfig() switch statement:**
```typescript
case "PROVIDER_NAME":
    return {
        type: "PROVIDER_NAME",
        apiKey: config.PROVIDER_NAME.apiKey || "",
        model: (config.PROVIDER_NAME.model || "DEFAULT_MODEL_NAME") as ProviderNameModel,
    };
```

## Step 3: Create API Implementation

### File: `src/services/api/PROVIDER_NAME.ts`

Create new file with complete API implementation:

```typescript
import { debugLog } from "../debug/logger";
import { RequestManager } from "../../utils/requestManager";
import { APIErrorHandler } from "../../utils/errorHandler";

const PROVIDER_NAME_BASE_URL = "https://api.provider.com/v1"; // Replace with actual URL

export async function callProviderNameAPI(
    apiKey: string,
    model: string,
    diff: string,
    customContext?: string
): Promise<string> {
    debugLog(`Making API call to Provider Name with model: ${model}`);
    
    const headers = {
        "Authorization": `Bearer ${apiKey}`, // Adjust auth header as needed
        "Content-Type": "application/json",
    };

    const messages = [
        {
            role: "system",
            content: "You are an expert at creating concise, informative git commit messages..."
        },
        {
            role: "user",
            content: `${customContext ? customContext + "\n\n" : ""}Here's the git diff:\n\n${diff}`
        }
    ];

    const body = {
        model: model,
        messages: messages,
        max_tokens: 150,
        temperature: 0.3,
    };

    try {
        const response = await RequestManager.makeRequest(
            `${PROVIDER_NAME_BASE_URL}/chat/completions`, // Adjust endpoint
            {
                method: "POST",
                headers,
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`Provider Name API error: ${response.status} - ${errorText}`);
            throw APIErrorHandler.handleError(
                new Error(`Provider Name API error: ${response.status}`),
                "PROVIDER_NAME"
            );
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message?.content || data.message?.content;
        
        if (!message) {
            throw new Error("No valid response from Provider Name API");
        }

        debugLog(`Provider Name API response received successfully`);
        return message.trim();
    } catch (error) {
        debugLog(`Provider Name API call failed: ${error}`);
        throw APIErrorHandler.handleError(error as Error, "PROVIDER_NAME");
    }
}

export async function validateProviderNameAPIKey(apiKey: string): Promise<boolean> {
    try {
        const response = await RequestManager.makeRequest(
            `${PROVIDER_NAME_BASE_URL}/models`, // Adjust validation endpoint
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.ok;
    } catch (error) {
        debugLog(`Provider Name API key validation failed: ${error}`);
        return false;
    }
}
```

## Step 4: Update API Index

### File: `src/services/api/index.ts`

1. **Add import:**
```typescript
import { callProviderNameAPI } from "./PROVIDER_NAME";
import {
    // ... existing imports
    ProviderNameApiConfig,
} from "../../config/types";
```

2. **Add case in generateMessageWithConfig() switch statement:**
```typescript
case "PROVIDER_NAME": {
    const providerConfig = config as ProviderNameApiConfig;
    if (!providerConfig.apiKey) {
        const result = await vscode.window.showWarningMessage(
            "Provider Name API key is required. Would you like to configure it now?",
            "Enter API Key",
            "Get API Key",
            "Cancel"
        );

        if (result === "Enter API Key") {
            const apiKey = await vscode.window.showInputBox({
                title: "Provider Name API Key",
                prompt: "Please enter your Provider Name API key",
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
                    "PROVIDER_NAME.apiKey",
                    apiKey.trim(),
                    vscode.ConfigurationTarget.Global
                );

                if (!providerConfig.model) {
                    await vscode.commands.executeCommand(
                        "ai-commit-assistant.openSettings"
                    );
                    return "";
                }
                return await callProviderNameAPI(
                    apiKey.trim(),
                    providerConfig.model,
                    diff,
                    customContext
                );
            }
        } else if (result === "Get API Key") {
            await vscode.env.openExternal(
                vscode.Uri.parse("https://provider.com/api-keys") // Replace with actual URL
            );
            const apiKey = await vscode.window.showInputBox({
                title: "Provider Name API Key",
                prompt:
                    "Please enter your Provider Name API key after getting it from the website",
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
                    "PROVIDER_NAME.apiKey",
                    apiKey.trim(),
                    vscode.ConfigurationTarget.Global
                );

                if (!providerConfig.model) {
                    await vscode.commands.executeCommand(
                        "ai-commit-assistant.openSettings"
                    );
                    return "";
                }
                return await callProviderNameAPI(
                    apiKey.trim(),
                    providerConfig.model,
                    diff,
                    customContext
                );
            }
        }
        return "";
    }
    if (!providerConfig.model) {
        await vscode.window.showErrorMessage(
            "Please select a Provider Name model in the settings."
        );
        await vscode.commands.executeCommand(
            "ai-commit-assistant.openSettings"
        );
        return "";
    }
    return await callProviderNameAPI(
        providerConfig.apiKey,
        providerConfig.model,
        diff,
        customContext
    );
}
```

## Step 5: Update API Validation

### File: `src/services/api/validation.ts`

1. **Add import:**
```typescript
import { validateProviderNameAPIKey } from "./PROVIDER_NAME";
```

2. **Add case in checkApiSetup() switch statement:**
```typescript
case "PROVIDER_NAME":
    if (!config.apiKey) {
        result.error = "API key not configured";
        result.troubleshooting = "Please enter your Provider Name API key in the settings";
    } else {
        const isValid = await validateProviderNameAPIKey(config.apiKey);
        result.success = isValid;
        if (isValid) {
            result.model = config.model || "DEFAULT_MODEL_NAME";
            result.responseTime = 600; // Placeholder value
            result.details = "Connection test successful";
        } else {
            result.error = "Invalid API key";
            result.troubleshooting = "Please check your Provider Name API key configuration";
        }
    }
    break;
```

3. **Add case in checkRateLimits() switch statement:**
```typescript
case "PROVIDER_NAME":
    result.success = true;
    result.limits = {
        reset: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        limit: 10000, // Adjust based on provider limits
        remaining: 9500,
        queryCost: 1
    };
    result.notes = "Provider Name rate limits depend on your account tier and model usage";
    break;
```

## Step 6: Update Extension Models

### File: `src/models/ExtensionSettings.ts`

Add provider configuration to interface:

```typescript
export interface ExtensionSettings {
    // ... existing providers
    PROVIDER_NAME: {
        apiKey: string;
        model: string;
    };
    // ... rest of interface
}
```

## Step 7: Update Package Configuration

### File: `package.json`

1. **Add to provider enum:**
```json
"enum": [
    "gemini",
    "huggingface", 
    "ollama",
    "mistral",
    "cohere",
    "openai",
    "together",
    "openrouter",
    "anthropic",
    "copilot",
    "deepseek",
    "PROVIDER_NAME"
],
```

2. **Add to enumDescriptions:**
```json
"enumDescriptions": [
    // ... existing descriptions
    "Use Provider Display Name for generating commit messages"
],
```

3. **Add provider-specific configuration:**
```json
"aiCommitAssistant.PROVIDER_NAME.apiKey": {
    "type": "string",
    "default": "",
    "markdownDescription": "API key for Provider Display Name [Learn more](https://provider.com/api-keys)"
},
"aiCommitAssistant.PROVIDER_NAME.model": {
    "type": "string",
    "enum": [
        "model-name-1",
        "model-name-2",
        "model-name-3"
    ],
    "enumDescriptions": [
        "Model 1 - Description of capabilities",
        "Model 2 - Description of capabilities", 
        "Model 3 - Description of capabilities"
    ],
    "default": "DEFAULT_MODEL_NAME",
    "description": "Provider Name model to use for generating commit messages"
}
```

4. **Add to keywords:**
```json
"keywords": [
    // ... existing keywords
    "PROVIDER_NAME",
    "provider-name-ai"
]
```

5. **Update description to increment provider count:**
```json
"description": "🚀 Generate perfect git commit messages instantly using AI! Support for 12 free/paid AI providers including GitHub Copilot (Gemini, OpenAI, Claude, Mistral, HuggingFace, Ollama, Anthropic, Together AI, DeepSeek, Provider Name). Smart conventional commits, advanced diff analysis, standardized prompts"
```

6. **Update version number:**
```json
"version": "X.Y.Z" // Increment appropriately
```

## Step 8: Update Settings Manager

### File: `src/webview/settings/SettingsManager.ts`

1. **Add to getCurrentSettings():**
```typescript
PROVIDER_NAME: {
    apiKey: config.get<string>("PROVIDER_NAME.apiKey") || "",
    model: config.get<string>("PROVIDER_NAME.model") || "DEFAULT_MODEL_NAME",
},
```

2. **Add to saveSettings():**
```typescript
await config.update(
    "PROVIDER_NAME.apiKey",
    settings.PROVIDER_NAME.apiKey,
    vscode.ConfigurationTarget.Global
);
await config.update(
    "PROVIDER_NAME.model",
    settings.PROVIDER_NAME.model,
    vscode.ConfigurationTarget.Global
);
```

## Step 9: Create Provider Settings Component

### File: `src/webview/settings/components/ProviderNameSettings.ts`

```typescript
import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { ProviderIcon } from "./ProviderIcon";

export class ProviderNameSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        return `
        <div id="PROVIDER_NAMESettings" class="provider-section" style="display: none;">
            <div class="provider-header">
                <div class="provider-title">
                    ${ProviderIcon.renderIcon("PROVIDER_NAME", 24)}
                    <h3>Provider Display Name Configuration</h3>
                </div>
                <p class="provider-description">
                    Provider description and capabilities overview.
                </p>
            </div>
            
            <div class="form-grid">
                <div class="form-group">
                    <label for="PROVIDER_NAMEApiKey">API Key</label>
                    <input 
                        type="password" 
                        id="PROVIDER_NAMEApiKey" 
                        value="${this._settings.PROVIDER_NAME?.apiKey || ""}"
                        placeholder="Enter your Provider Name API key"
                        class="form-control"
                    />
                    <div class="form-help">
                        Get your API key from <a href="https://provider.com/api-keys" target="_blank">Provider Name Dashboard</a>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="PROVIDER_NAMEModel">Model</label>
                    <select id="PROVIDER_NAMEModel" class="form-control">
                        <option value="model-name-1" ${this._settings.PROVIDER_NAME?.model === "model-name-1" ? "selected" : ""}>
                            Model 1 - Description
                        </option>
                        <option value="model-name-2" ${this._settings.PROVIDER_NAME?.model === "model-name-2" ? "selected" : ""}>
                            Model 2 - Description
                        </option>
                        <option value="model-name-3" ${this._settings.PROVIDER_NAME?.model === "model-name-3" ? "selected" : ""}>
                            Model 3 - Description
                        </option>
                    </select>
                    <div class="form-help">
                        Choose the model that best fits your needs
                    </div>
                </div>
            </div>
        </div>`;
    }
}
```

## Step 10: Update Settings Template Generator

### File: `src/webview/settings/SettingsTemplateGenerator.ts`

1. **Add import:**
```typescript
import { ProviderNameSettings } from "./components/ProviderNameSettings";
```

2. **Add to generate() method:**
```typescript
const providerNameSettings = new ProviderNameSettings(this._settings);

return `
    // ... existing code
    ${providerNameSettings.render()}
    // ... rest of template
`;
```

## Step 11: Update Provider Icon Component

### File: `src/webview/settings/components/ProviderIcon.ts`

Add provider icon to icons object:

```typescript
private static icons = {
    // ... existing icons
    PROVIDER_NAME: "SVG_PATH_DATA_HERE"
};
```

## Step 12: Update Status Banner Component

### File: `src/webview/settings/components/StatusBanner.ts`

1. **Add case to get model info:**
```typescript
case "PROVIDER_NAME":
    modelInfo = this._settings.PROVIDER_NAME?.model || "DEFAULT_MODEL_NAME";
    break;
```

2. **Add case to check API configuration:**
```typescript
case "PROVIDER_NAME":
    apiConfigured = !!this._settings.PROVIDER_NAME?.apiKey;
    break;
```

3. **Add to provider display names:**
```typescript
const providerDisplayNames = {
    // ... existing providers
    PROVIDER_NAME: "Provider Display Name"
} as const;
```

## Step 13: Update Status Banner Styles

### File: `src/webview/settings/styles/statusBanner.css.ts`

Add provider-specific styling:

```typescript
.status-badge.PROVIDER_NAME {
    background-color: #PROVIDER_COLOR;
    color: #fff;
    border: 1px solid #BORDER_COLOR;
}
```

## Step 14: Update Settings Webview Provider

### File: `src/webview/settings/SettingsWebviewProvider.ts`

Add option to provider select:

```typescript
<option value="PROVIDER_NAME" ${config.apiProvider === "PROVIDER_NAME" ? "selected" : ""}>Provider Display Name</option>
```

## Step 15: Update General Settings Component

### File: `src/webview/settings/components/GeneralSettings.ts`

Add option to provider select:

```typescript
<option value="PROVIDER_NAME" ${this._settings.apiProvider === "PROVIDER_NAME" ? "selected" : ""}>Provider Display Name</option>
```

## Step 16: Update Settings Manager Scripts

### File: `src/webview/settings/scripts/settingsManager.ts`

1. **Add to form population:**
```typescript
document.getElementById('PROVIDER_NAMEApiKey').value = currentSettings.PROVIDER_NAME?.apiKey || '';
document.getElementById('PROVIDER_NAMEModel').value = currentSettings.PROVIDER_NAME?.model || 'DEFAULT_MODEL_NAME';
```

2. **Add to form collection:**
```typescript
PROVIDER_NAME: {
    apiKey: document.getElementById('PROVIDER_NAMEApiKey').value,
    model: document.getElementById('PROVIDER_NAMEModel').value
},
```

3. **Add to settings update handler:**
```typescript
if (currentSettings.PROVIDER_NAME) {
    document.getElementById('PROVIDER_NAMEApiKey').value = currentSettings.PROVIDER_NAME.apiKey || '';
    document.getElementById('PROVIDER_NAMEModel').value = currentSettings.PROVIDER_NAME.model || 'DEFAULT_MODEL_NAME';
}
```

## Step 17: Update API Manager Script

### File: `src/webview/settings/scripts/apiManager.ts`

1. **Add to getApiSettings() function:**
```typescript
} else if (provider === 'PROVIDER_NAME') {
    apiSettings = {
        apiKey: document.getElementById('PROVIDER_NAMEApiKey').value,
        model: document.getElementById('PROVIDER_NAMEModel').value
    };
}
```

2. **Add to validation checks:**
```typescript
} else if (provider === 'PROVIDER_NAME' && !apiSettings.apiKey) {
    missingFields.push('Provider Name API Key');
}
```

3. **Add to testConnection() function:**
```typescript
} else if (provider === 'PROVIDER_NAME') {
    apiSettings.apiKey = document.getElementById('PROVIDER_NAMEApiKey').value;
    if (!apiSettings.apiKey) missingFields.push('Provider Name API Key');
}
```

4. **Add to display names:**
```typescript
const displayNames = {
    // ... existing providers
    'PROVIDER_NAME': 'Provider Display Name'
};
```

## Step 18: Update UI Manager Script

### File: `src/webview/settings/scripts/uiManager.ts`

1. **Add to updateVisibleSettings() function:**
```typescript
document.getElementById('PROVIDER_NAMESettings').style.display =
    provider === 'PROVIDER_NAME' ? 'block' : 'none';
```

2. **Add to icons object:**
```typescript
const icons = {
    // ... existing icons
    PROVIDER_NAME: "SVG_PATH_DATA_HERE"
};
```

3. **Add to getStatusInfo() switch statement:**
```typescript
case "PROVIDER_NAME":
    modelInfo = settings.PROVIDER_NAME.model || "DEFAULT_MODEL_NAME";
    break;
```

4. **Add to API configuration check:**
```typescript
case "PROVIDER_NAME":
    apiConfigured = !!settings.PROVIDER_NAME.apiKey;
    break;
```

5. **Add to display names:**
```typescript
const displayNames = {
    // ... existing providers
    PROVIDER_NAME: "Provider Display Name"
};
```

## Step 19: Update Onboarding Manager

### File: `src/utils/onboardingManager.ts`

Add to API_KEY_URLS:

```typescript
private static readonly API_KEY_URLS = {
    // ... existing URLs
    'Provider Display Name': 'https://provider.com/api-keys'
};
```

## Step 20: Update Extension Main File

### File: `src/extension.ts`

1. **Update supported providers log:**
```typescript
debugLog("Supported API providers: Gemini, Hugging Face, Ollama, Mistral, Cohere, OpenAI, Together AI, OpenRouter, Anthropic, GitHub Copilot, DeepSeek, Provider Name");
```

2. **Update onboarding content:**
```typescript
content: 'GitMind supports multiple AI providers:\n• Gemini (Google)\n• Hugging Face\n• Ollama (Local)\n• Mistral AI\n• Cohere\n• OpenAI\n• Together AI\n• OpenRouter\n• Anthropic\n• GitHub Copilot\n• DeepSeek\n• Provider Name\n\nClick Next to learn how to configure your chosen provider.',
```

## Step 21: Update Documentation

### File: `README.md`

1. **Update provider count in key features:**
```markdown
**Multi-Provider AI Support**: Access 12 different AI providers with unified configuration and intelligent fallback handling.
```

2. **Add provider to comparison table:**
```markdown
| **Provider Name**  | ✓/✗       | ✓/✗        | ✓/✗              | ✓/✗            | Basic/Advanced| ~X min     |
```

3. **Add to recommended providers section:**
```markdown
**For [Use Case]**: Provider Name (model-name) - Description of benefits
```

4. **Add to model specifications table:**
```markdown
| **Provider Name**  | model-name-1                            | XXXk tokens    | XX RPM           | Description of model capabilities        | Free/Paid    |
|                    | model-name-2                            | XXXk tokens    | XX RPM           | Description of model capabilities        | Free/Paid    |
```

5. **Update standardized prompts count:**
```markdown
- **Standardized Prompts**: Consistent prompt templates across all 12 AI providers
```

6. **Update technical capabilities count:**
```markdown
Unified prompt engineering across all 12 AI providers ensuring consistent, high-quality output regardless of chosen model.
```

## Step 22: Update Changelog

### File: `CHANGELOG.md`

Add new version entry with provider integration details:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- **Provider Name AI Provider Integration**: [Brief description of capabilities]
  - Complete Provider Name API implementation with support for [models/features]
  - Added model-name-1 model for [use case description]
  - Added model-name-2 model for [use case description] 
  - Comprehensive UI integration with dedicated settings panel and model selection
  - Full configuration support in package.json with proper schema validation
  - Seamless integration with existing provider architecture and error handling
  - Professional SVG icon integration matching other provider branding
  - API key management with secure storage and validation flows
  - Rate limiting support and proper error messaging for missing configurations

- **Enhanced Provider Support**: Expanded AI provider ecosystem to 12 total providers
  - Updated provider comparison tables and documentation
  - Added Provider Name to recommended configurations for [use cases]
  - Enhanced [free tier/performance/etc.] options with competitive Provider Name [features]
  - Improved provider selection guidance with [specific benefits]

### Enhanced

- **Documentation Updates**: Comprehensive documentation refresh
  - Updated README.md with Provider Name provider information and capabilities
  - Added Provider Name to model specifications table with context windows and rate limits
  - Enhanced provider comparison with Provider Name [key benefits]
  - Updated recommended configurations for different development scenarios

### Technical

- Extended provider count from 11 to 12 in all documentation and marketing materials
- Enhanced type definitions with ProviderNameApiConfig and ProviderNameModel types
- Implemented complete API integration matching existing provider patterns
- Added comprehensive validation and error handling for Provider Name endpoints
- Updated settings management to include Provider Name form fields and persistence
```

## Validation Checklist

After implementation, verify:

- [ ] Provider appears in all dropdown menus
- [ ] Settings panel shows/hides correctly when provider is selected
- [ ] API key validation works properly
- [ ] Model selection functions correctly
- [ ] Status banner displays provider information
- [ ] API calls succeed with valid credentials
- [ ] Error handling works for invalid credentials
- [ ] Documentation is updated with provider information
- [ ] Package.json reflects new provider count
- [ ] All TypeScript types compile without errors
- [ ] Extension loads without runtime errors
- [ ] Onboarding includes new provider
- [ ] Provider icon displays correctly

## Notes

- Replace all instances of "PROVIDER_NAME" with actual lowercase provider name
- Replace all instances of "Provider Name" with actual display name
- Replace all instances of "Provider Display Name" with proper capitalized name
- Update all placeholder URLs, model names, and descriptions
- Ensure SVG icon path is properly formatted
- Test thoroughly with actual API credentials before release
- Consider provider-specific rate limits and error codes
- Update version numbers appropriately
- Follow existing code style and patterns exactly