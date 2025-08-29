import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { FormUtils } from "./utils/FormUtils";

export class OpenRouterSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    const apiKeyValue = this._settings.openrouter?.apiKey || "";

    // Define default OpenRouter models to show initially
    const defaultModels = [
      'google/gemma-3-27b-it:free',
      'openai/gpt-4o-mini',
      'openai/gpt-4-turbo',
      'anthropic/claude-3-haiku',
      'meta-llama/llama-3.1-8b-instruct:free',
      'meta-llama/llama-3.1-70b-instruct',
      'mistralai/mistral-7b-instruct:free',
      'qwen/qwen-2-7b-instruct:free'
    ];

    // Build the options HTML
    let optionsHtml = '';

    // Add the current saved model if it's not in the default list
    const currentModel = this._settings.openrouter?.model || 'google/gemma-3-27b-it:free';
    if (!defaultModels.includes(currentModel)) {
      optionsHtml += `<option value="${currentModel}" selected>${currentModel}</option>`;
    }

    // Add the default models
    defaultModels.forEach(model => {
      optionsHtml += `<option value="${model}" ${model === currentModel ? 'selected' : ''}>${model}</option>`;
    });

    return `
    <div id="openrouterSettings" class="api-settings ${this._settings.apiProvider === "openrouter" ? "" : "hidden"}">
      <h3>OpenRouter Settings</h3>
      ${FormUtils.createPasswordField(
      'openrouterApiKey',
      'API Key',
      'Your OpenRouter API key for authentication',
      apiKeyValue,
      { url: 'https://openrouter.ai/keys', text: 'Learn more' }
    )}
      <div class="form-group">
        <label for="openrouterModel">Model</label>
        <div class="searchable-select-container">
          <!-- Use text input instead of select to work with ScriptManager dropdown system -->
          <input type="text" id="openrouterModel" value="${currentModel}" placeholder="Enter model name (e.g., google/gemma-3-27b-it:free)" data-custom-handler="true" data-prevent-auto-save="true" />
          <div id="openrouterModelDropdown" class="model-dropdown" style="display: none;">
            <div class="dropdown-content">
              <div class="loading" style="display: none;">Loading models...</div>
              <div class="error" style="display: none;"></div>
              <div class="empty" style="display: none;">No models found</div>
              <ul class="model-list"></ul>
            </div>
          </div>
        </div>
        <button id="loadOpenRouterModels" class="button small" style="margin-top: 8px;">Load Available Models</button>
        <div class="description">
          Enter an OpenRouter model name or click "Load Available Models" to browse all available models. Popular models: google/gemma-3-27b-it:free, openai/gpt-4o-mini, meta-llama/llama-3.1-8b-instruct:free
        </div>
      </div>
    </div>`;
  }
}
