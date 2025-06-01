import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class CopilotSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        return `
            <div id="copilotSettings" class="api-settings ${this._settings.apiProvider === "copilot" ? "" : "hidden"}">
                <h3>GitHub Copilot Settings</h3>
                <div class="info-banner">
                    <div class="info-content">
                        <span class="info-icon">ℹ️</span>
                        <div class="info-text">
                            <strong>No API Key Required</strong><br>
                            GitHub Copilot uses your existing VS Code authentication and subscription.
                            Make sure you're signed in to GitHub Copilot in VS Code.
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="label-container">
                        <label for="copilotModel">Model</label>
                        <a href="https://docs.github.com/en/copilot/using-github-copilot/getting-started-with-github-copilot" class="learn-more" target="_blank">Learn more</a>
                    </div>
                    <select id="copilotModel">
                        <optgroup label="GPT-4 Series (Recommended)">
                            <option value="gpt-4o" ${this._settings.copilot?.model === "gpt-4o" ? "selected" : ""}>GPT-4o (Default)</option>
                            <option value="gpt-4o-mini" ${this._settings.copilot?.model === "gpt-4o-mini" ? "selected" : ""}>GPT-4o Mini</option>
                            <option value="gpt-4-turbo" ${this._settings.copilot?.model === "gpt-4-turbo" ? "selected" : ""}>GPT-4 Turbo</option>
                            <option value="gpt-4" ${this._settings.copilot?.model === "gpt-4" ? "selected" : ""}>GPT-4</option>
                        </optgroup>
                        <optgroup label="GPT-3.5 Series">
                            <option value="gpt-3.5-turbo" ${this._settings.copilot?.model === "gpt-3.5-turbo" ? "selected" : ""}>GPT-3.5 Turbo</option>
                        </optgroup>
                    </select>
                    <div class="description">
                        All models are accessed through GitHub Copilot's API and require an active Copilot subscription.
                    </div>
                </div>
            </div>`;
    }
}
