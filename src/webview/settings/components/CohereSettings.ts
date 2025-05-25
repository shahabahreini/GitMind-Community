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
                    <div class="label-container">
                        <label for="cohereApiKey">API Key</label>
                        <a href="https://dashboard.cohere.com/api-keys" class="learn-more" target="_blank">Learn more</a>
                    </div>
                    <input type="password" id="cohereApiKey" value="${this._settings.cohere?.apiKey || ""}" />
                </div>
                <div class="form-group">
                    <label for="cohereModel">Model</label>
                    <select id="cohereModel">
                        <optgroup label="Latest Models (Recommended)">
                            <option value="command-a-03-2025" ${this._settings.cohere?.model === "command-a-03-2025" ? "selected" : ""}>Command A (Latest - High Performance)</option>
                            <option value="command-r-08-2024" ${this._settings.cohere?.model === "command-r-08-2024" ? "selected" : ""}>Command R (08-2024)</option>
                            <option value="command-r-plus-08-2024" ${this._settings.cohere?.model === "command-r-plus-08-2024" ? "selected" : ""}>Command R+ (08-2024)</option>
                        </optgroup>
                        <optgroup label="Specialized Models">
                            <option value="aya-expanse-8b" ${this._settings.cohere?.model === "aya-expanse-8b" ? "selected" : ""}>Aya Expanse 8B (Multilingual)</option>
                            <option value="aya-expanse-32b" ${this._settings.cohere?.model === "aya-expanse-32b" ? "selected" : ""}>Aya Expanse 32B (Multilingual)</option>
                            <option value="command-r7b-arabic" ${this._settings.cohere?.model === "command-r7b-arabic" ? "selected" : ""}>Command R7B Arabic</option>
                        </optgroup>
                        <optgroup label="Legacy Models">
                            <option value="command-r" ${this._settings.cohere?.model === "command-r" ? "selected" : ""}>Command R (Legacy)</option>
                            <option value="command-r-plus" ${this._settings.cohere?.model === "command-r-plus" ? "selected" : ""}>Command R+ (Legacy)</option>
                            <option value="command" ${this._settings.cohere?.model === "command" ? "selected" : ""}>Command (Legacy)</option>
                            <option value="command-light" ${this._settings.cohere?.model === "command-light" ? "selected" : ""}>Command Light (Legacy)</option>
                            <option value="command-nightly" ${this._settings.cohere?.model === "command-nightly" ? "selected" : ""}>Command Nightly (Legacy)</option>
                        </optgroup>
                    </select>
                </div>
            </div>`;
  }
}