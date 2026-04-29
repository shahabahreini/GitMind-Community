// src/webview/settings/components/MistralSettings.ts

import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { FormUtils } from "./utils/FormUtils";

export class MistralSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    const apiKeyValue = this._settings.mistral?.apiKey || "";

    // Define common Mistral models to show by default
    const defaultModels = [
      'mistral-tiny',
      'mistral-small',
      'mistral-medium',
      'mistral-large-latest',
      'open-mixtral-8x7b',
      'open-mistral-7b',
      'mistral-small-latest'
    ];

    // Build the options HTML
    let optionsHtml = '';

    // Add the current saved model if it's not in the default list
    const currentModel = this._settings.mistral?.model || 'mistral-large-latest';
    if (!defaultModels.includes(currentModel)) {
      optionsHtml += `<option value="${currentModel}" selected>${currentModel}</option>`;
    }

    // Add the default models
    defaultModels.forEach(model => {
      optionsHtml += `<option value="${model}" ${model === currentModel ? 'selected' : ''}>${model}</option>`;
    });

    return `
    <div id="mistralSettings" class="settings-section">
      <h3>Mistral Settings</h3>
      ${FormUtils.createPasswordField(
      'mistralApiKey',
      'API Key',
      'Your Mistral API key for authentication',
      apiKeyValue,
      { url: 'https://console.mistral.ai/api-keys/', text: 'Learn more' }
    )}
      <div class="form-group">
        <label for="mistralModel">Model</label>
        <select id="mistralModel">
          ${optionsHtml}
        </select>
        <button id="loadMistralModels" class="button small load-models-inline">Load Available Models</button>
        <div class="description">
          Default models shown. Click "Load Available Models" to fetch all models that support chat completion.
        </div>
      </div>
    </div>`;
  }
}
