import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { FormUtils } from "./utils/FormUtils";

export class PerplexitySettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    const apiKeyValue = this._settings.perplexity?.apiKey || "";

    return `
    <div id="perplexitySettings" class="api-settings ${this._settings.apiProvider === "perplexity" ? "" : "hidden"}">
      <h3>Perplexity Settings</h3>
      ${FormUtils.createPasswordField(
      'perplexityApiKey',
      'API Key',
      'Your Perplexity API key for authentication',
      apiKeyValue,
      { url: 'https://www.perplexity.ai/settings/api', text: 'Get your API key from Perplexity API Settings' }
    )}
      <div class="form-group">
        <label for="perplexityModel">Model</label>
        <select id="perplexityModel">
          <optgroup label="Latest Models (Recommended)">
            <option value="sonar-pro" ${this._settings.perplexity?.model === "sonar-pro" ? "selected" : ""}>Sonar Pro (Most Capable)</option>
            <option value="sonar-reasoning" ${this._settings.perplexity?.model === "sonar-reasoning" ? "selected" : ""}>Sonar Reasoning (Advanced Reasoning)</option>
            <option value="sonar" ${this._settings.perplexity?.model === "sonar" ? "selected" : ""}>Sonar (General Purpose)</option>
          </optgroup>
          <optgroup label="Chat Models">
            <option value="llama-3.1-sonar-small-128k-chat" ${this._settings.perplexity?.model === "llama-3.1-sonar-small-128k-chat" ? "selected" : ""}>Llama 3.1 Sonar Small Chat (Efficient)</option>
            <option value="llama-3.1-sonar-large-128k-chat" ${this._settings.perplexity?.model === "llama-3.1-sonar-large-128k-chat" ? "selected" : ""}>Llama 3.1 Sonar Large Chat (Large Model)</option>
          </optgroup>
          <optgroup label="Online Models">
            <option value="llama-3.1-sonar-huge-128k-online" ${this._settings.perplexity?.model === "llama-3.1-sonar-huge-128k-online" ? "selected" : ""}>Llama 3.1 Sonar Huge Online (Largest with Web Access)</option>
            <option value="llama-3.1-sonar-small-128k-online" ${this._settings.perplexity?.model === "llama-3.1-sonar-small-128k-online" ? "selected" : ""}>Llama 3.1 Sonar Small Online (Efficient with Web)</option>
            <option value="llama-3.1-sonar-large-128k-online" ${this._settings.perplexity?.model === "llama-3.1-sonar-large-128k-online" ? "selected" : ""}>Llama 3.1 Sonar Large Online (Large with Web)</option>
          </optgroup>
        </select>
        <div class="description">
          Choose the Perplexity model that fits your needs. Latest models offer advanced reasoning and web search capabilities, while online models provide real-time web access for current information.
        </div>
      </div>
    </div>`;
  }
}
