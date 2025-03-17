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
        <input type="text" id="togetherModel" value="${this._settings.together?.model || ""}" placeholder="Enter model identifier (e.g., meta-llama/Llama-3.3-70B-Instruct-Turbo)" />
        <div class="description">
          Enter the full model identifier (e.g., meta-llama/Llama-3.3-70B-Instruct-Turbo, deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free)
        </div>
      </div>
    </div>`;
  }
}
