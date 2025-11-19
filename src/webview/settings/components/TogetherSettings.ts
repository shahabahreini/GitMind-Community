import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { FormUtils } from "./utils/FormUtils";

export class TogetherSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    const apiKeyValue = this._settings.together?.apiKey || "";

    // Define default Together AI models to show initially
    const defaultModels = [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'meta-llama/Llama-3.1-8B-Instruct-Turbo',
      'meta-llama/Llama-3.1-70B-Instruct-Turbo',
      'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
      'Qwen/Qwen2.5-72B-Instruct-Turbo',
      'microsoft/WizardLM-2-8x22B',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO'
    ];

    // Build the options HTML
    let optionsHtml = '';

    // Add the current saved model if it's not in the default list
    const currentModel = this._settings.together?.model || 'meta-llama/Llama-3.3-70B-Instruct-Turbo';
    if (!defaultModels.includes(currentModel)) {
      optionsHtml += `<option value="${currentModel}" selected>${currentModel}</option>`;
    }

    // Add the default models
    defaultModels.forEach(model => {
      optionsHtml += `<option value="${model}" ${model === currentModel ? 'selected' : ''}>${model}</option>`;
    });

    return `
    <div id="togetherSettings" class="api-settings ${this._settings.apiProvider === "together" ? "" : "hidden"}">
      <h3>Together AI Settings</h3>
      ${FormUtils.createPasswordField(
      'togetherApiKey',
      'API Key',
      'Your Together AI API key for authentication',
      apiKeyValue,
      { url: 'https://api.together.xyz/settings/api-keys', text: 'Learn more' }
    )}
      <div class="form-group">
        <div class="label-container">
          <label for="togetherModel">Model</label>
          <a href="https://api.together.xyz/models" class="learn-more" target="_blank">Learn more</a>
        </div>
        <div class="model-input-container">
          <div class="searchable-dropdown">
            <input type="text"
                   id="togetherModel"
                   placeholder="Type or select a model (e.g., meta-llama/Llama-3.3-70B-Instruct-Turbo)"
                   value="${currentModel}"
                   autocomplete="off"
                   data-custom-handler="true"
                   data-prevent-auto-save="true" />
            <button type="button"
                    id="loadTogetherModels"
                    class="load-models-btn"
                    data-tooltip="Load available models from Together AI">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
              </svg>
            </button>
            <div id="togetherModelDropdown" class="dropdown-content" style="display: none;">
              <div class="dropdown-loading" style="display: none;">Loading models...</div>
              <div class="dropdown-error" style="display: none;"></div>
              <div class="dropdown-empty" style="display: none;">No models found</div>
              <ul class="model-list"></ul>
            </div>
          </div>
        </div>
        <div class="description">
          Popular models: meta-llama/Llama-3.3-70B-Instruct-Turbo, deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free<br>
          <small>Click the refresh button to load all available models from Together AI</small>
        </div>
      </div>
    </div>`;
  }
}
