import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { FormUtils } from "./utils/FormUtils";

export class AnthropicSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    const apiKeyValue = this._settings.anthropic?.apiKey || "";

    return `
    <div id="anthropicSettings" class="api-settings ${this._settings.apiProvider === "anthropic" ? "" : "hidden"}">
      <h3>Anthropic Settings</h3>
      ${FormUtils.createPasswordField(
      'anthropicApiKey',
      'API Key',
      'Your Anthropic API key for authentication',
      apiKeyValue,
      { url: 'https://console.anthropic.com/', text: 'Get your API key from Anthropic Console' }
    )}
      <div class="form-group">
        <label for="anthropicModel">Model</label>
        <select id="anthropicModel">
          <optgroup label="Claude 4 Series (Latest)">
            <option value="claude-opus-4" ${this._settings.anthropic?.model === "claude-opus-4" ? "selected" : ""}>Claude Opus 4</option>
            <option value="claude-sonnet-4" ${this._settings.anthropic?.model === "claude-sonnet-4" ? "selected" : ""}>Claude Sonnet 4</option>
          </optgroup>
          <optgroup label="Claude 3.7 Series">
            <option value="claude-sonnet-3.7" ${this._settings.anthropic?.model === "claude-sonnet-3.7" ? "selected" : ""}>Claude Sonnet 3.7</option>
          </optgroup>
          <optgroup label="Claude 3.5 Series">
            <option value="claude-3-5-sonnet-20241022" ${this._settings.anthropic?.model === "claude-3-5-sonnet-20241022" ? "selected" : ""}>Claude 3.5 Sonnet (Latest)</option>
            <option value="claude-3-5-sonnet-20240620" ${this._settings.anthropic?.model === "claude-3-5-sonnet-20240620" ? "selected" : ""}>Claude 3.5 Sonnet (June)</option>
            <option value="claude-3-5-haiku-20241022" ${this._settings.anthropic?.model === "claude-3-5-haiku-20241022" ? "selected" : ""}>Claude 3.5 Haiku</option>
          </optgroup>
          <optgroup label="Claude 3 Series">
            <option value="claude-3-opus-20240229" ${this._settings.anthropic?.model === "claude-3-opus-20240229" ? "selected" : ""}>Claude 3 Opus</option>
            <option value="claude-3-sonnet-20240229" ${this._settings.anthropic?.model === "claude-3-sonnet-20240229" ? "selected" : ""}>Claude 3 Sonnet</option>
            <option value="claude-3-haiku-20240307" ${this._settings.anthropic?.model === "claude-3-haiku-20240307" ? "selected" : ""}>Claude 3 Haiku</option>
          </optgroup>
        </select>
        <div class="description">
          Choose the Claude model that best fits your needs. Sonnet models offer the best balance of speed and capability.
        </div>
      </div>
    </div>`;
  }
}
