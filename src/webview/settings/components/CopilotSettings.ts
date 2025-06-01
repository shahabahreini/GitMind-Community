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
                <div class="info-banner copilot-info-banner">
                    <div class="info-content">
                        <span class="info-icon">🔐</span>
                        <div class="info-text">
                            <strong>No API Key Required</strong>
                            GitHub Copilot seamlessly integrates with your existing VS Code authentication and subscription. Simply ensure you're signed in to GitHub Copilot in VS Code to start generating intelligent commit messages.
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="label-container">
                        <label for="copilotModel">Model</label>
                        <a href="https://docs.github.com/en/copilot/using-github-copilot/getting-started-with-github-copilot" class="learn-more" target="_blank">Learn more</a>
                    </div>
                    <select id="copilotModel">
                        <optgroup label="OpenAI Models">
                            <option value="gpt-4o" ${this._settings.copilot?.model === "gpt-4o" ? "selected" : ""}>GPT-4o (Default)</option>
                            <option value="gpt-4.1" ${this._settings.copilot?.model === "gpt-4.1" ? "selected" : ""}>GPT-4.1</option>
                            <option value="gpt-4.5-preview" ${this._settings.copilot?.model === "gpt-4.5-preview" ? "selected" : ""}>GPT-4.5 (Preview/Pro+)</option>
                            <option value="o1-preview" ${this._settings.copilot?.model === "o1-preview" ? "selected" : ""}>o1 (Preview)</option>
                            <option value="o3" ${this._settings.copilot?.model === "o3" ? "selected" : ""}>o3</option>
                            <option value="o3-mini" ${this._settings.copilot?.model === "o3-mini" ? "selected" : ""}>o3-mini</option>
                            <option value="o4-mini" ${this._settings.copilot?.model === "o4-mini" ? "selected" : ""}>o4-mini (Preview)</option>
                        </optgroup>
                        <optgroup label="Anthropic Models">
                            <option value="claude-3.5-sonnet" ${this._settings.copilot?.model === "claude-3.5-sonnet" ? "selected" : ""}>Claude 3.5 Sonnet</option>
                            <option value="claude-3.7-sonnet" ${this._settings.copilot?.model === "claude-3.7-sonnet" ? "selected" : ""}>Claude 3.7 Sonnet</option>
                            <option value="claude-3.7-sonnet-thinking" ${this._settings.copilot?.model === "claude-3.7-sonnet-thinking" ? "selected" : ""}>Claude 3.7 Sonnet Thinking</option>
                            <option value="claude-sonnet-4" ${this._settings.copilot?.model === "claude-sonnet-4" ? "selected" : ""}>Claude Sonnet 4</option>
                            <option value="claude-opus-4" ${this._settings.copilot?.model === "claude-opus-4" ? "selected" : ""}>Claude Opus 4</option>
                        </optgroup>
                        <optgroup label="Google Models">
                            <option value="gemini-2.0-flash" ${this._settings.copilot?.model === "gemini-2.0-flash" ? "selected" : ""}>Gemini 2.0 Flash</option>
                            <option value="gemini-2.5-pro-preview" ${this._settings.copilot?.model === "gemini-2.5-pro-preview" ? "selected" : ""}>Gemini 2.5 Pro (Preview)</option>
                        </optgroup>
                    </select>
                    <div class="description">
                        <span style="color: var(--vscode-inputValidation-infoBorder, #3794ff); font-weight: 500;">✨ Premium models</span> 
                        accessed through your GitHub Copilot subscription. All models are optimized for code understanding and commit message generation.
                    </div>
                </div>
            </div>`;
    }
}
