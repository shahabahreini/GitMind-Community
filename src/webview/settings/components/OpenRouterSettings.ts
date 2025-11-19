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
        <div class="label-container">
          <label for="openrouterModel">Model</label>
          <a href="https://openrouter.ai/models" class="learn-more" target="_blank">Learn more</a>
        </div>
        <div class="model-input-container">
          <div class="searchable-dropdown">
            <input type="text"
                   id="openrouterModel"
                   placeholder="Type or select a model (e.g., google/gemma-3-27b-it:free)"
                   value="${currentModel}"
                   autocomplete="off"
                   data-custom-handler="true"
                   data-prevent-auto-save="true" />
            <button type="button"
                    id="loadOpenRouterModels"
                    class="load-models-btn"
                    data-tooltip="Load available models from OpenRouter">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
              </svg>
            </button>
            <div id="openrouterModelDropdown" class="dropdown-content" style="display: none;">
              <div class="dropdown-loading" style="display: none;">Loading models...</div>
              <div class="dropdown-error" style="display: none;"></div>
              <div class="dropdown-empty" style="display: none;">No models found</div>
              <ul class="model-list"></ul>
            </div>
          </div>
        </div>
        <div class="description">
          Popular models: google/gemma-3-27b-it:free, openai/gpt-4o-mini, meta-llama/llama-3.1-8b-instruct:free<br>
          <small>Click the refresh button to load all available models from OpenRouter</small>
        </div>
      </div>
    </div>`;
  }
}
