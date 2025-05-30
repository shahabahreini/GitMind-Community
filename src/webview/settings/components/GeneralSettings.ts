// src/webview/settings/components/GeneralSettings.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class GeneralSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    return `
    <div class="settings-section">
      <h3>General Settings</h3>
      <div class="form-group">
        <div class="checkbox-container">
          <input type="checkbox" id="commitVerbose" ${this._settings.commit?.verbose ? "checked" : ""} />
          <label for="commitVerbose">Verbose Commit Messages</label>
        </div>
        <div class="description">
          When enabled, generates detailed commit messages with bullet points.
          When disabled, only generates the summary line.
        </div>
      </div>
      <div class="form-group">
        <div class="checkbox-container">
          <input type="checkbox" id="promptCustomizationEnabled" ${this._settings.promptCustomization?.enabled ? "checked" : ""} />
          <label for="promptCustomizationEnabled">Enable Prompt Customization</label>
        </div>
        <div class="description">
          When enabled, shows a dialog to add custom context when generating commit messages.
        </div>
      </div>
      <div class="form-group">
        <div class="checkbox-container">
          <input type="checkbox" id="showDiagnostics" ${this._settings.showDiagnostics ? "checked" : ""} />
          <label for="showDiagnostics">Show Diagnostics Before Proceeding</label>
        </div>
        <div class="description">
          When enabled, shows model information and estimated token count before generating commit messages.
        </div>
      </div>
      <div class="form-group">
        <label for="apiProvider">API Provider</label>
        <select id="apiProvider">
          <option value="gemini" ${this._settings.apiProvider === "gemini" ? "selected" : ""}>Gemini</option>
          <option value="huggingface" ${this._settings.apiProvider === "huggingface" ? "selected" : ""}>Hugging Face</option>
          <option value="ollama" ${this._settings.apiProvider === "ollama" ? "selected" : ""}>Ollama</option>
          <option value="mistral" ${this._settings.apiProvider === "mistral" ? "selected" : ""}>Mistral</option>
          <option value="cohere" ${this._settings.apiProvider === "cohere" ? "selected" : ""}>Cohere</option>
          <option value="openai" ${this._settings.apiProvider === "openai" ? "selected" : ""}>OpenAI</option>
          <option value="together" ${this._settings.apiProvider === "together" ? "selected" : ""}>Together AI</option>
          <option value="openrouter" ${this._settings.apiProvider === "openrouter" ? "selected" : ""}>OpenRouter</option>
          <option value="anthropic" ${this._settings.apiProvider === "anthropic" ? "selected" : ""}>Anthropic</option>
        </select>
      </div>
    </div>`;
  }
}
