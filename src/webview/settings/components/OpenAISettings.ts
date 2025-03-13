import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class OpenAISettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    return `
    <div id="openaiSettings" class="api-settings ${this._settings.apiProvider === "openai" ? "" : "hidden"}">
      <h3>OpenAI Settings</h3>
      <div class="form-group">
        <div class="label-container">
          <label for="openaiApiKey">API Key</label>
          <a href="https://platform.openai.com/api-keys" class="learn-more" target="_blank">Learn more</a>
        </div>
        <input type="password" id="openaiApiKey" value="${this._settings.openai?.apiKey || ""}" />
      </div>
      <div class="form-group">
        <label for="openaiModel">Model</label>
        <select id="openaiModel">
          <option value="gpt-4o" ${this._settings.openai?.model === "gpt-4o" ? "selected" : ""}>GPT-4o</option>
          <option value="gpt-4-turbo" ${this._settings.openai?.model === "gpt-4-turbo" ? "selected" : ""}>GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo" ${this._settings.openai?.model === "gpt-3.5-turbo" ? "selected" : ""}>GPT-3.5 Turbo</option>
        </select>
      </div>
    </div>`;
  }
}
