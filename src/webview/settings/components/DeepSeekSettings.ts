import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { FormUtils } from "./utils/FormUtils";

export class DeepSeekSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    const apiKeyValue = this._settings.deepseek?.apiKey || "";

    return `
    <div id="deepseekSettings" class="api-settings ${this._settings.apiProvider === "deepseek" ? "" : "hidden"}">
      <h3>DeepSeek Settings</h3>
      ${FormUtils.createPasswordField(
      'deepseekApiKey',
      'API Key',
      'Your DeepSeek API key for authentication',
      apiKeyValue,
      { url: 'https://platform.deepseek.com/api_keys', text: 'Get your API key from DeepSeek Platform' }
    )}
      <div class="form-group">
        <label for="deepseekModel">Model</label>
        <select id="deepseekModel">
          <optgroup label="Available Models">
            <option value="deepseek-chat" ${this._settings.deepseek?.model === "deepseek-chat" ? "selected" : ""}>DeepSeek Chat (General Purpose)</option>
            <option value="deepseek-reasoner" ${this._settings.deepseek?.model === "deepseek-reasoner" ? "selected" : ""}>DeepSeek Reasoner (Advanced Reasoning)</option>
          </optgroup>
        </select>
        <div class="description">
          Choose the DeepSeek model that fits your needs. DeepSeek Chat is optimized for general conversation and code generation, while DeepSeek Reasoner provides advanced reasoning capabilities.
        </div>
      </div>
    </div>`;
  }
}
