# Adding New AI Providers to GitMind: Step-by-Step Guide

## Overview

This guide provides a systematic approach to adding new AI providers to GitMind. Each section lists specific files that need to be created or modified.

## 1. Type Definitions (Required)

### File: `src/config/types.ts`

Add provider type definitions:

```typescript
// Add to ApiProvider type
export type ApiProvider = "gemini" | "huggingface" | /* existing */ | "your-provider";

// Add provider config interface
export interface YourProviderApiConfig extends BaseApiConfig {
    type: "your-provider";
    apiKey: string;
    model: string;
}

// Add to ExtensionConfig
export interface ExtensionConfig {
    // ... existing providers
    yourProvider: {
        enabled: boolean;
        apiKey?: string;
        model: string;
    };
}
```

### File: `src/models/ExtensionSettings.ts`

Add provider settings interface:

```typescript
export interface ExtensionSettings {
  // ... existing settings
  yourProvider: {
    apiKey: string;
    model: string;
  };
}
```

## 2. API Implementation (Required)

### Create: `src/services/api/your-provider.ts`

Implement the API client:

```typescript
import { debugLog } from "../debug/logger";

export async function callYourProviderAPI(
  apiKey: string,
  model: string,
  diff: string
): Promise<string> {
  try {
    const response = await fetch("https://api.your-provider.com/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: createPromptFromDiff(diff),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return formatCommitMessage(data.choices[0].message.content);
  } catch (error) {
    debugLog("Error in callYourProviderAPI:", error);
    throw error;
  }
}

function createPromptFromDiff(diff: string): string {
  return `Generate a concise git commit message for these changes:\n\n${diff}`;
}

function formatCommitMessage(message: string): string {
  return message.trim().replace(/^["']|["']$/g, "");
}
```

## 3. Settings UI Components (Required)

### Create: `src/webview/settings/components/YourProviderSettings.ts`

```typescript
import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class YourProviderSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    return `
            <div id="yourProviderSettings" class="api-settings ${
              this._settings.apiProvider === "your-provider" ? "" : "hidden"
            }">
                <h3>Your Provider Settings</h3>
                <div class="form-group">
                    <label for="yourProviderApiKey">API Key</label>
                    <input type="password" id="yourProviderApiKey" 
                           value="${
                             this._settings.yourProvider?.apiKey || ""
                           }" />
                </div>
                <div class="form-group">
                    <label for="yourProviderModel">Model</label>
                    <select id="yourProviderModel">
                        <option value="model-1">Model 1</option>
                        <option value="model-2">Model 2</option>
                    </select>
                </div>
            </div>`;
  }
}
```

## 4. Integration Updates (Required)

### Update: `src/services/api/index.ts`

Add provider to the main API service:

```typescript
import { callYourProviderAPI } from "./your-provider";

// Add to switch statement in generateMessageWithConfig
case "your-provider": {
    const config = config as YourProviderApiConfig;
    return await callYourProviderAPI(
        config.apiKey,
        config.model,
        diff
    );
}
```

### Update: `src/services/api/validation.ts`

Add validation support:

```typescript
export async function validateYourProviderApiKey(
  apiKey: string
): Promise<boolean> {
  try {
    const response = await fetch("https://api.your-provider.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

### Update: `package.json`

Add configuration properties:

```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "aiCommitAssistant.yourProvider.apiKey": {
          "type": "string",
          "default": "",
          "description": "API key for Your Provider"
        },
        "aiCommitAssistant.yourProvider.model": {
          "type": "string",
          "enum": ["model-1", "model-2"],
          "default": "model-1",
          "description": "Model to use for commit generation"
        }
      }
    }
  }
}
```

## 5. Error Handling (Required)

### Update: `src/utils/errorHandler.ts`

Add provider-specific error handling:

```typescript
// Add to handleAPIError method
case "your-provider": {
    if (error.message.includes("authentication")) {
        return handleAuthError(error, {
            provider: "Your Provider",
            originalMessage: error.message,
            userMessage: "Authentication failed"
        });
    }
    // Add other error cases
    break;
}
```

## 6. Settings Manager (Required)

### Update: `src/webview/settings/SettingsManager.ts`

Add settings persistence:

```typescript
public async saveSettings(settings: ExtensionSettings): Promise<void> {
    const config = vscode.workspace.getConfiguration("aiCommitAssistant");

    // Add to existing save operations
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
}
```

## 7. Template Updates (Required)

### Update: `src/webview/settings/SettingsTemplateGenerator.ts`

Add provider to settings UI:

```typescript
import { YourProviderSettings } from "./components/YourProviderSettings";

export class SettingsTemplateGenerator {
  public generateHtml(): string {
    const yourProviderSettings = new YourProviderSettings(this._settings);

    return `
            // ... existing template
            ${yourProviderSettings.render()}
            // ... rest of template
        `;
  }
}
```

## 8. Documentation Updates (Required)

### Update: `README.md`

Add provider documentation:

```markdown
## Supported Providers

- ...existing providers...
- Your Provider
  - Requires API key from [provider website]
  - Supports models: model-1, model-2
```

### Update: `CHANGELOG.md`

Add changelog entry:

```markdown
## [Next Version]

### Added

- Support for Your Provider
- New models: model-1, model-2
```

## Testing Checklist

Before submitting:

1. [ ] API integration works
   - [ ] Success case
   - [ ] Error handling
   - [ ] Rate limiting
2. [ ] Settings UI functions
   - [ ] API key saves correctly
   - [ ] Model selection works
3. [ ] Validation works
   - [ ] API key validation
   - [ ] Configuration checks
4. [ ] Documentation complete
   - [ ] README updated
   - [ ] CHANGELOG updated
   - [ ] API documentation added

## Best Practices

1. **API Integration**

   - Always use `debugLog` for debugging
   - Handle all possible API response formats
   - Implement proper error handling

2. **Settings Management**

   - Use Global scope for API keys
   - Implement proper input validation
   - Handle configuration changes properly

3. **UI Components**

   - Follow existing styling patterns
   - Maintain consistent UI behavior
   - Implement proper state management

4. **Error Handling**

   - Provide user-friendly error messages
   - Include troubleshooting steps
   - Log detailed error information

5. **Security**
   - Never log API keys
   - Use secure storage for credentials
   - Validate all API responses

## Common Pitfalls

1. Forgetting to handle all API response formats
2. Not implementing proper error handling
3. Missing configuration validation
4. Incomplete documentation updates
5. Not following existing code patterns
