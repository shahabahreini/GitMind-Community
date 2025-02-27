// src/webview/settings/components/HuggingFaceSettings.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class HuggingFaceSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        return `
    <div id="huggingfaceSettings" class="settings-section">
      <h3>Hugging Face Settings</h3>
      <div class="form-group">
        <div class="label-container">
          <label for="huggingfaceApiKey">API Key</label>
          <a href="https://huggingface.co/settings/tokens" class="learn-more" target="_blank">Learn more</a>
        </div>
        <input type="password" id="huggingfaceApiKey" value="${this._settings.huggingface?.apiKey || ''}" />
      </div>
      <div class="form-group">
        <div class="label-container">
          <label for="huggingfaceModel">Model</label>
          <a href="https://huggingface.co/models" class="learn-more" target="_blank">Learn more</a>
        </div>
        <input type="text" id="huggingfaceModel" placeholder="e.g., mistralai/Mistral-7B-Instruct-v0.3" value="${this._settings.huggingface?.model || ''}" />
        <div class="description">
          Examples: mistralai/Mistral-7B-Instruct-v0.3,
          facebook/bart-large-cnn
        </div>
      </div>
    </div>`;
    }
}
