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
        <label for="togetherModel">Model</label>
        <div class="searchable-select-container">
          <!-- Use text input instead of select to work with ScriptManager dropdown system -->
          <input type="text" id="togetherModel" value="${currentModel}" placeholder="Enter model name (e.g., meta-llama/Llama-3.3-70B-Instruct-Turbo)" data-custom-handler="true" data-prevent-auto-save="true" />
          <div id="togetherModelDropdown" class="model-dropdown" style="display: none;">
            <div class="dropdown-content">
              <div class="loading" style="display: none;">Loading models...</div>
              <div class="error" style="display: none;"></div>
              <div class="empty" style="display: none;">No models found</div>
              <ul class="model-list"></ul>
            </div>
          </div>
        </div>
        <button id="loadTogetherModels" class="button small" style="margin-top: 8px;">Load Available Models</button>
        <div class="description">
          Enter a Together AI model name or click "Load Available Models" to browse all available models. Popular models: meta-llama/Llama-3.3-70B-Instruct-Turbo, deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free
        </div>
      </div>
    </div>`;
  }
}
