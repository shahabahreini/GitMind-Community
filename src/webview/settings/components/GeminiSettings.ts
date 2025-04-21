// src/webview/settings/components/GeminiSettings.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class GeminiSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        const apiKey = this._settings.gemini?.apiKey || '';
        const model = this._settings.gemini?.model || 'gemini-2.5-flash-preview-04-17';

        return `
          <div class="settings-section" id="geminiSettings">
              <h2>Google's Gemini AI Settings</h2>
              <div class="form-group">
                  <label for="geminiApiKey">API Key</label>
                  <div class="input-with-button">
                      <input type="password" id="geminiApiKey" value="${apiKey}" placeholder="Enter your Gemini API key" />
                      <button class="icon-button" id="toggleGeminiPassword" title="Show/Hide Password">
                          <span class="icon">👁️</span>
                      </button>
                  </div>
                  <div class="help-text">
                      <a href="https://aistudio.google.com/app/apikey" target="_blank">Get your Gemini API key</a>
                  </div>
              </div>
              <div class="form-group">
                  <label for="geminiModel">Model</label>
                  <select id="geminiModel">
                      <option value="gemini-2.5-flash-preview-04-17" ${model === 'gemini-2.5-flash-preview-04-17' ? 'selected' : ''}>Gemini 2.5 Flash Preview (04/17) - Latest and most advanced</option>
                      <option value="gemini-2.5-pro-preview-03-25" ${model === 'gemini-2.5-pro-preview-03-25' ? 'selected' : ''}>Gemini 2.5 Pro Preview (03/25) - Advanced with enhanced reasoning</option>
                      <option value="gemini-2.0-flash" ${model === 'gemini-2.0-flash' ? 'selected' : ''}>Gemini 2.0 Flash - Fast with high performance</option>
                      <option value="gemini-2.0-flash-lite" ${model === 'gemini-2.0-flash-lite' ? 'selected' : ''}>Gemini 2.0 Flash-Lite - Lightweight version</option>
                      <option value="gemini-1.5-flash" ${model === 'gemini-1.5-flash' ? 'selected' : ''}>Gemini 1.5 Flash - Fast and efficient</option>
                      <option value="gemini-1.5-flash-8b" ${model === 'gemini-1.5-flash-8b' ? 'selected' : ''}>Gemini 1.5 Flash-8B - 8B parameter version</option>
                      <option value="gemini-1.5-pro" ${model === 'gemini-1.5-pro' ? 'selected' : ''}>Gemini 1.5 Pro - Base model with comprehensive capabilities</option>
                  </select>
              </div>
              <div class="button-group">
                  <button id="checkGeminiApi" class="primary-button">Check API Setup</button>
              </div>
              <div id="geminiStatus" class="status-message"></div>
          </div>
      `;
    }
}
