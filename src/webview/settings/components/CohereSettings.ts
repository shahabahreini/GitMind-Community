import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class CohereSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    return `
    <div id="cohereSettings" class="api-settings ${this._settings.apiProvider === "cohere" ? "" : "hidden"}">
      <h3>Cohere Settings</h3>
      <div class="form-group">
        <label for="cohereApiKey">API Key</label>
        <a href="https://dashboard.cohere.com/api-keys" class="learn-more" target="_blank">Learn more</a>
        <input type="password" id="cohereApiKey" value="${this._settings.cohere?.apiKey || ""}" />
      </div>
      <div class="form-group">
        <label for="cohereModel">Model</label>
        <select id="cohereModel">
          <option value="command" ${this._settings.cohere?.model === "command" ? "selected" : ""}>Command</option>
          <option value="command-light" ${this._settings.cohere?.model === "command-light" ? "selected" : ""}>Command Light</option>
          <option value="command-nightly" ${this._settings.cohere?.model === "command-nightly" ? "selected" : ""}>Command Nightly</option>
          <option value="command-r" ${this._settings.cohere?.model === "command-r" ? "selected" : ""}>Command-R</option>
        </select>
      </div>
    </div>`;
  }
}
