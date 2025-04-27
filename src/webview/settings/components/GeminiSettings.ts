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
          <a href="https://aistudio.google.com/app/apikey" target="_blank">Get your API key</a>
        </div>
      </div>
      <div class="form-group">
        <label for="geminiModel">Model</label>
        <select id="geminiModel">
          <!-- New stable Gemini 2.5 models -->
          <option value="${GeminiModel.GEMINI_2_5_PRO}" ${this._settings.gemini?.model === GeminiModel.GEMINI_2_5_PRO ? "selected" : ""}>Gemini 2.5 Pro</option>
          <option value="${GeminiModel.GEMINI_2_5_FLASH}" ${this._settings.gemini?.model === GeminiModel.GEMINI_2_5_FLASH ? "selected" : ""}>Gemini 2.5 Flash</option>
          
          <!-- Older models -->
          <option value="${GeminiModel.GEMINI_2_0_FLASH}" ${this._settings.gemini?.model === GeminiModel.GEMINI_2_0_FLASH ? "selected" : ""}>Gemini 2.0 Flash</option>
          <option value="${GeminiModel.GEMINI_2_0_FLASH_LITE}" ${this._settings.gemini?.model === GeminiModel.GEMINI_2_0_FLASH_LITE ? "selected" : ""}>Gemini 2.0 Flash Lite</option>
          <option value="${GeminiModel.GEMINI_1_5_FLASH}" ${this._settings.gemini?.model === GeminiModel.GEMINI_1_5_FLASH ? "selected" : ""}>Gemini 1.5 Flash</option>
          <option value="${GeminiModel.GEMINI_1_5_FLASH_8B}" ${this._settings.gemini?.model === GeminiModel.GEMINI_1_5_FLASH_8B ? "selected" : ""}>Gemini 1.5 Flash 8B</option>
          <option value="${GeminiModel.GEMINI_1_5_PRO}" ${this._settings.gemini?.model === GeminiModel.GEMINI_1_5_PRO ? "selected" : ""}>Gemini 1.5 Pro</option>
        </select>
      </div>
    </div>`;
  }
}