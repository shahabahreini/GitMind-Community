// src/webview/settings/components/MistralSettings.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class MistralSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
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
          <option value="mistral-tiny" ${this._settings.mistral?.model === "mistral-tiny" ? "selected" : ""}>Mistral Tiny</option>
          <option value="mistral-small" ${this._settings.mistral?.model === "mistral-small" ? "selected" : ""}>Mistral Small</option>
          <option value="mistral-medium" ${this._settings.mistral?.model === "mistral-medium" ? "selected" : ""}>Mistral Medium</option>
          <option value="mistral-large-latest" ${this._settings.mistral?.model === "mistral-large-latest" ? "selected" : ""}>Mistral Large (Latest)</option>
        </select>
      </div>
    </div>`;
    }
}
