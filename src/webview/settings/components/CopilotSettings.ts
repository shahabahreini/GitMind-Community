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
                        <optgroup label="Recommended">
                            <option value="auto" ${this._settings.copilot?.model === "auto" ? "selected" : ""}>Auto (Let Copilot choose)</option>
                        </optgroup>
                        <optgroup label="OpenAI Models (Legacy)">
                            <option value="gpt-3.5-turbo" ${this._settings.copilot?.model === "gpt-3.5-turbo" ? "selected" : ""}>GPT-3.5 Turbo</option>
                            <option value="gpt-4" ${this._settings.copilot?.model === "gpt-4" ? "selected" : ""}>GPT-4</option>
                            <option value="gpt-4-turbo" ${this._settings.copilot?.model === "gpt-4-turbo" ? "selected" : ""}>GPT-4 Turbo</option>
                            <option value="gpt-4o" ${this._settings.copilot?.model === "gpt-4o" ? "selected" : ""}>GPT-4o</option>
                            <option value="gpt-4o-mini" ${this._settings.copilot?.model === "gpt-4o-mini" ? "selected" : ""}>GPT-4o mini</option>
                        </optgroup>
                        <optgroup label="OpenAI Models">
                            <option value="gpt-4.1" ${this._settings.copilot?.model === "gpt-4.1" ? "selected" : ""}>GPT-4.1</option>
                            <option value="gpt-5" ${this._settings.copilot?.model === "gpt-5" ? "selected" : ""}>GPT-5</option>
                            <option value="gpt-5-mini" ${this._settings.copilot?.model === "gpt-5-mini" ? "selected" : ""}>GPT-5 mini</option>
                            <option value="gpt-5-codex" ${this._settings.copilot?.model === "gpt-5-codex" ? "selected" : ""}>GPT-5-Codex</option>
                            <option value="gpt-5.1" ${this._settings.copilot?.model === "gpt-5.1" ? "selected" : ""}>GPT-5.1</option>
                            <option value="gpt-5.1-codex" ${this._settings.copilot?.model === "gpt-5.1-codex" ? "selected" : ""}>GPT-5.1-Codex</option>
                            <option value="gpt-5.1-codex-mini" ${this._settings.copilot?.model === "gpt-5.1-codex-mini" ? "selected" : ""}>GPT-5.1-Codex-Mini</option>
                        </optgroup>
                        <optgroup label="Anthropic Models">
                            <option value="claude-haiku-4.5" ${this._settings.copilot?.model === "claude-haiku-4.5" ? "selected" : ""}>Claude Haiku 4.5</option>
                            <option value="claude-opus-4.1" ${this._settings.copilot?.model === "claude-opus-4.1" ? "selected" : ""}>Claude Opus 4.1</option>
                            <option value="claude-sonnet-4" ${this._settings.copilot?.model === "claude-sonnet-4" ? "selected" : ""}>Claude Sonnet 4</option>
                            <option value="claude-sonnet-4.5" ${this._settings.copilot?.model === "claude-sonnet-4.5" ? "selected" : ""}>Claude Sonnet 4.5</option>
                        </optgroup>
                        <optgroup label="Google Models">
                            <option value="gemini-2.5-pro" ${this._settings.copilot?.model === "gemini-2.5-pro" ? "selected" : ""}>Gemini 2.5 Pro</option>
                            <option value="gemini-3-pro" ${this._settings.copilot?.model === "gemini-3-pro" ? "selected" : ""}>Gemini 3 Pro</option>
                        </optgroup>
                        <optgroup label="Other Models">
                            <option value="grok-code-fast-1" ${this._settings.copilot?.model === "grok-code-fast-1" ? "selected" : ""}>Grok Code Fast 1</option>
                            <option value="raptor-mini" ${this._settings.copilot?.model === "raptor-mini" ? "selected" : ""}>Raptor mini</option>
                        </optgroup>
                    </select>
                    <button id="loadCopilotModels" class="button small" style="margin-top: 8px;">Detect Available Models</button>
                    <div class="description">
                        Models listed above are from <a href="https://docs.github.com/en/copilot/reference/ai-models/supported-models" target="_blank" style="color: var(--vscode-textLink-foreground);">GitHub Copilot Auto documentation</a>. Click "Detect Available Models" to check which model families are available in your VS Code. Note: Actual model availability depends on your Copilot subscription tier.
                    </div>
                </div>
            </div>`;
    }
}
