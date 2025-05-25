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
                        <optgroup label="Latest Models (Recommended)">
                            <option value="gpt-4.1" ${this._settings.openai?.model === "gpt-4.1" ? "selected" : ""}>GPT-4.1 (Latest)</option>
                            <option value="gpt-4.1-mini" ${this._settings.openai?.model === "gpt-4.1-mini" ? "selected" : ""}>GPT-4.1 Mini</option>
                            <option value="gpt-4.1-nano" ${this._settings.openai?.model === "gpt-4.1-nano" ? "selected" : ""}>GPT-4.1 Nano</option>
                        </optgroup>
                        <optgroup label="Reasoning Models">
                            <option value="o3" ${this._settings.openai?.model === "o3" ? "selected" : ""}>o3 (Advanced Reasoning)</option>
                            <option value="o4-mini" ${this._settings.openai?.model === "o4-mini" ? "selected" : ""}>o4-mini (Fast Reasoning)</option>
                            <option value="o3-mini" ${this._settings.openai?.model === "o3-mini" ? "selected" : ""}>o3-mini (Efficient Reasoning)</option>
                        </optgroup>
                        <optgroup label="GPT-4o Series">
                            <option value="gpt-4o" ${this._settings.openai?.model === "gpt-4o" ? "selected" : ""}>GPT-4o (Multimodal)</option>
                            <option value="gpt-4o-mini" ${this._settings.openai?.model === "gpt-4o-mini" ? "selected" : ""}>GPT-4o Mini</option>
                        </optgroup>
                        <optgroup label="Legacy Models">
                            <option value="gpt-4-turbo" ${this._settings.openai?.model === "gpt-4-turbo" ? "selected" : ""}>GPT-4 Turbo (Legacy)</option>
                            <option value="gpt-4" ${this._settings.openai?.model === "gpt-4" ? "selected" : ""}>GPT-4 (Legacy)</option>
                            <option value="gpt-3.5-turbo" ${this._settings.openai?.model === "gpt-3.5-turbo" ? "selected" : ""}>GPT-3.5 Turbo (Legacy)</option>
                        </optgroup>
                    </select>
                </div>
            </div>`;
  }
}