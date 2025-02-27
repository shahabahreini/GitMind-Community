// src/webview/settings/components/GeminiSettings.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class GeminiSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        return `
    <div id="geminiSettings" class="settings-section">
      <h3>Gemini Settings</h3>
      <div class="form-group">
        <div class="label-container">
          <label for="geminiApiKey">API Key</label>
          <a href="https://aistudio.google.com/app/apikey" class="learn-more" target="_blank">Learn more</a>
        </div>
        <input type="password" id="geminiApiKey" value="${this._settings.gemini?.apiKey || ''}" />
      </div>
      <div class="form-group">
        <label for="geminiModel">Model</label>
        <select id="geminiModel">
          <option value="gemini-2.0-flash" ${this._settings.gemini?.model === "gemini-2.0-flash" ? "selected" : ""}>Gemini 2.0 Flash</option>
          <option value="gemini-2.0-flash-lite" ${this._settings.gemini?.model === "gemini-2.0-flash-lite" ? "selected" : ""}>Gemini 2.0 Flash-Lite</option>
          <option value="gemini-1.5-flash" ${this._settings.gemini?.model === "gemini-1.5-flash" ? "selected" : ""}>Gemini 1.5 Flash</option>
          <option value="gemini-1.5-flash-8b" ${this._settings.gemini?.model === "gemini-1.5-flash-8b" ? "selected" : ""}>Gemini 1.5 Flash-8B</option>
          <option value="gemini-1.5-pro" ${this._settings.gemini?.model === "gemini-1.5-pro" ? "selected" : ""}>Gemini 1.5 Pro</option>
        </select>
        <div class="description">
          Gemini 2.0 Flash is recommended for optimal performance and speed.
          Flash models are optimized for faster response times.
        </div>
      </div>
    </div>`;
    }
}
