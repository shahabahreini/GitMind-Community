// src/webview/settings/components/HuggingFaceSettings.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { FormUtils } from "./utils/FormUtils";

export class HuggingFaceSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    const apiKeyValue = this._settings.huggingface?.apiKey || "";

    // Define common Hugging Face models to show by default
    // These are verified working models for text generation tasks
    const defaultModels = [
      'microsoft/DialoGPT-medium',       // Conversational AI - reliable
      'microsoft/DialoGPT-large',        // Larger conversational model
      'microsoft/DialoGPT-small',        // Smaller, faster conversational model
      'facebook/blenderbot-400M-distill', // Facebook's conversational AI
      'EleutherAI/gpt-neo-125M',         // Small GPT model
      'distilgpt2',                      // Distilled GPT-2 model
      'gpt2'                             // Original GPT-2 model
    ];

    // Build the options HTML
    let optionsHtml = '';

    // Add the current saved model if it's not in the default list
    const currentModel = this._settings.huggingface?.model || 'microsoft/DialoGPT-medium';
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
      ${FormUtils.createPasswordField(
      'huggingfaceApiKey',
      'API Key',
      'Your Hugging Face API key for authentication',
      apiKeyValue,
      { url: 'https://huggingface.co/settings/tokens', text: 'Learn more' }
    )}
      <div class="form-group">
        <div class="label-container">
          <label for="huggingfaceModel">Model</label>
          <a href="https://huggingface.co/models" class="learn-more" target="_blank">Learn more</a>
        </div>
        <div class="model-input-container">
          <div class="searchable-dropdown">
            <input type="text"
                   id="huggingfaceModel"
                   placeholder="Type or select a model (e.g., microsoft/DialoGPT-medium)"
                   value="${currentModel}"
                   autocomplete="off"
                   data-custom-handler="true"
                   data-prevent-auto-save="true" />
            <button type="button"
                    id="loadHuggingFaceModels"
                    class="load-models-btn"
                    data-tooltip="Load available models from Hugging Face">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
              </svg>
            </button>
            <div id="huggingfaceModelDropdown" class="dropdown-content" style="display: none;">
              <div class="dropdown-loading" style="display: none;">Loading models...</div>
              <div class="dropdown-error" style="display: none;"></div>
              <div class="dropdown-empty" style="display: none;">No models found</div>
              <ul class="model-list"></ul>
            </div>
          </div>
        </div>
        <div class="description">
          Popular models: microsoft/DialoGPT-medium, facebook/blenderbot-400M-distill
        </div>
      </div>
    </div>`;
  }
}
