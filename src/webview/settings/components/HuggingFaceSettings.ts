// src/webview/settings/components/HuggingFaceSettings.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class HuggingFaceSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    // Define common Hugging Face models to show by default
    const defaultModels = [
      'mistralai/Mistral-7B-Instruct-v0.3',
      'microsoft/DialoGPT-medium',
      'facebook/bart-large-cnn',
      'microsoft/DialoGPT-large',
      'HuggingFaceH4/zephyr-7b-beta',
      'teknium/OpenHermes-2.5-Mistral-7B',
      'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO'
    ];

    // Build the options HTML
    let optionsHtml = '';

    // Add the current saved model if it's not in the default list
    const currentModel = this._settings.huggingface?.model || 'mistralai/Mistral-7B-Instruct-v0.3';
    if (!defaultModels.includes(currentModel)) {
      optionsHtml += `<option value="${currentModel}" selected>${currentModel}</option>`;
    }

    // Add the default models
    defaultModels.forEach(model => {
      optionsHtml += `<option value="${model}" ${model === currentModel ? 'selected' : ''}>${model}</option>`;
    });

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
        <label for="huggingfaceModel">Model</label>
        <select id="huggingfaceModel">
          ${optionsHtml}
        </select>
        <button id="loadHuggingFaceModels" class="button small" style="margin-top: 8px;">Load Available Models</button>
        <div class="description">
          Default models shown. Click "Load Available Models" to fetch popular instruction-tuned models from Hugging Face.
        </div>
      </div>
    </div>`;
  }
}
