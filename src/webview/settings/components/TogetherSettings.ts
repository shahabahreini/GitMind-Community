import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class TogetherSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        return `
    <div id="togetherSettings" class="api-settings ${this._settings.apiProvider === "together" ? "" : "hidden"}">
      <h3>Together AI Settings</h3>
      <div class="form-group">
        <div class="label-container">
          <label for="togetherApiKey">API Key</label>
          <a href="https://api.together.xyz/settings/api-keys" class="learn-more" target="_blank">Learn more</a>
        </div>
        <input type="password" id="togetherApiKey" value="${this._settings.together?.apiKey || ""}" />
      </div>
      <div class="form-group">
        <label for="togetherModel">Model</label>
        <select id="togetherModel">
          <option value="meta-llama/Llama-3.3-70B-Instruct-Turbo" ${this._settings.together?.model === "meta-llama/Llama-3.3-70B-Instruct-Turbo" ? "selected" : ""}>Llama-3.3-70B-Instruct-Turbo</option>
          <option value="meta-llama/Llama-3.1-8B-Instruct" ${this._settings.together?.model === "meta-llama/Llama-3.1-8B-Instruct" ? "selected" : ""}>Llama-3.1-8B-Instruct</option>
          <option value="meta-llama/Llama-3.1-70B-Instruct" ${this._settings.together?.model === "meta-llama/Llama-3.1-70B-Instruct" ? "selected" : ""}>Llama-3.1-70B-Instruct</option>
          <option value="togethercomputer/Qwen2-72B-Instruct" ${this._settings.together?.model === "togethercomputer/Qwen2-72B-Instruct" ? "selected" : ""}>Qwen2-72B-Instruct</option>
          <option value="mistralai/Mixtral-8x7B-Instruct-v0.1" ${this._settings.together?.model === "mistralai/Mixtral-8x7B-Instruct-v0.1" ? "selected" : ""}>Mixtral-8x7B-Instruct</option>
        </select>
        <div class="description">
          Together AI provides access to various open-source models.
        </div>
      </div>
    </div>`;
    }
}
