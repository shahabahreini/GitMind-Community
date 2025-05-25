import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { GeminiModel } from "../../../config/types";

export class GeminiSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    return `
            <div id="geminiSettings" class="api-settings ${this._settings.apiProvider === "gemini" ? "" : "hidden"}">
                <h3>Gemini Settings</h3>
                <div class="form-group">
                    <label for="geminiApiKey">API Key</label>
                    <input type="password" id="geminiApiKey" value="${this._settings.gemini?.apiKey || ""}" />
                    <div class="description">
                        <a href="https://aistudio.google.com/app/apikey" target="_blank">Get a Gemini API key</a>
                    </div>
                </div>
                <div class="form-group">
                    <label for="geminiModel">Model</label>
                    <select id="geminiModel">
                        <optgroup label="Latest Models (Recommended)">
                            <option value="gemini-2.5-pro" ${this._settings.gemini?.model === "gemini-2.5-pro" ? "selected" : ""}>Gemini 2.5 Pro (Latest Thinking Model)</option>
                            <option value="gemini-2.5-flash" ${this._settings.gemini?.model === "gemini-2.5-flash" ? "selected" : ""}>Gemini 2.5 Flash (Efficient Thinking)</option>
                            <option value="gemini-2.5-flash-preview-05-20" ${this._settings.gemini?.model === "gemini-2.5-flash-preview-05-20" ? "selected" : ""}>Gemini 2.5 Flash Preview (05/20)</option>
                        </optgroup>
                        <optgroup label="Gemini 2.0 Series">
                            <option value="gemini-2.0-flash" ${this._settings.gemini?.model === "gemini-2.0-flash" ? "selected" : ""}>Gemini 2.0 Flash (Multimodal)</option>
                            <option value="gemini-2.0-flash-lite" ${this._settings.gemini?.model === "gemini-2.0-flash-lite" ? "selected" : ""}>Gemini 2.0 Flash-Lite</option>
                        </optgroup>
                        <optgroup label="Gemini 1.5 Series">
                            <option value="gemini-1.5-flash" ${this._settings.gemini?.model === "gemini-1.5-flash" ? "selected" : ""}>Gemini 1.5 Flash</option>
                            <option value="gemini-1.5-flash-8b" ${this._settings.gemini?.model === "gemini-1.5-flash-8b" ? "selected" : ""}>Gemini 1.5 Flash-8B</option>
                            <option value="gemini-1.5-pro" ${this._settings.gemini?.model === "gemini-1.5-pro" ? "selected" : ""}>Gemini 1.5 Pro</option>
                        </optgroup>
                        <optgroup label="Legacy/Preview Models">
                            <option value="gemini-2.5-flash-preview-04-17" ${this._settings.gemini?.model === "gemini-2.5-flash-preview-04-17" ? "selected" : ""}>Gemini 2.5 Flash Preview (04/17)</option>
                            <option value="gemini-2.5-pro-exp-03-25" ${this._settings.gemini?.model === "gemini-2.5-pro-exp-03-25" ? "selected" : ""}>Gemini 2.5 Pro Preview (03/25)</option>
                        </optgroup>
                    </select>
                </div>
            </div>`;
  }
}