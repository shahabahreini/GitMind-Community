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
            <option value="claude-opus-4.7" ${this._settings.anthropic?.model === "claude-opus-4.7" ? "selected" : ""}>Claude Opus 4.7</option>
            <option value="claude-sonnet-4.6" ${this._settings.anthropic?.model === "claude-sonnet-4.6" ? "selected" : ""}>Claude Sonnet 4.6</option>
            <option value="claude-haiku-4.5" ${this._settings.anthropic?.model === "claude-haiku-4.5" ? "selected" : ""}>Claude Haiku 4.5</option>
          </optgroup>
        </select>
        <div class="description">
          Choose the Claude model that best fits your needs. Sonnet models offer the best balance of speed and capability.
        </div>
      </div>
    </div>`;
  }
}
