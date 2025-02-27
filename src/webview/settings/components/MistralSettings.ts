// src/webview/settings/components/MistralSettings.ts

import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class MistralSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
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
      <div class="form-group">
        <div class="label-container">
          <label for="mistralApiKey">API Key</label>
          <a href="https://console.mistral.ai/api-keys/" class="learn-more" target="_blank">Learn more</a>
        </div>
        <input type="password" id="mistralApiKey" value="${this._settings.mistral?.apiKey || ''}" />
      </div>
      <div class="form-group">
        <label for="mistralModel">Model</label>
        <select id="mistralModel">
          ${optionsHtml}
        </select>
        <button id="loadMistralModels" class="button small" style="margin-top: 8px;">Load Available Models</button>
        <div class="description">
          Default models shown. Click "Load Available Models" to fetch all models that support chat completion.
        </div>
      </div>
    </div>`;
  }
}
