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
        <label for="huggingfaceModel">Model</label>
        <div class="searchable-select-container">
          <!-- Use text input instead of select to work with ScriptManager dropdown system -->
          <input type="text" id="huggingfaceModel" value="${currentModel}" placeholder="Enter model name (e.g., microsoft/DialoGPT-medium)" data-custom-handler="true" data-prevent-auto-save="true" />
          <div id="huggingfaceModelDropdown" class="model-dropdown" style="display: none;">
            <div class="dropdown-content">
              <div class="loading" style="display: none;">Loading models...</div>
              <div class="error" style="display: none;"></div>
              <div class="empty" style="display: none;">No models found</div>
              <ul class="model-list"></ul>
            </div>
          </div>
        </div>
        <button id="loadHuggingFaceModels" class="button small" style="margin-top: 8px;">Load Available Models</button>
        <div class="description">
          Enter a Hugging Face model name or click "Load Available Models" to browse all available models. Popular models: microsoft/DialoGPT-medium, facebook/blenderbot-400M-distill
        </div>
      </div>
    </div>`;
  }
}
