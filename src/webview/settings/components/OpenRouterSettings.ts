import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class OpenRouterSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        return `
    <div id="openrouterSettings" class="api-settings ${this._settings.apiProvider === "openrouter" ? "" : "hidden"}">
      <h3>OpenRouter Settings</h3>
      <div class="form-group">
        <div class="label-container">
          <label for="openrouterApiKey">API Key</label>
          <a href="https://openrouter.ai/keys" class="learn-more" target="_blank">Learn more</a>
        </div>
        <input type="password" id="openrouterApiKey" value="${this._settings.openrouter?.apiKey || ""}" />
      </div>
      <div class="form-group">
        <label for="openrouterModel">Model</label>
        <input type="text" id="openrouterModel" value="${this._settings.openrouter?.model || ""}" placeholder="e.g., anthropic/claude-3-opus:beta" />
        <div class="description">
          Examples: anthropic/claude-3-opus:beta, openai/gpt-4-turbo, meta-llama/llama-3-70b-instruct
        </div>
      </div>
    </div>`;
    }
}
