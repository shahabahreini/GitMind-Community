// src/webview/settings/components/OllamaSettings.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class OllamaSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        return `
    <div id="ollamaSettings" class="settings-section">
      <h3>Ollama Settings</h3>
      <div class="form-group">
        <label for="ollamaUrl">URL</label>
        <input type="text" id="ollamaUrl" placeholder="http://localhost:11434" value="${this._settings.ollama?.url || ''}" />
      </div>
      <div class="form-group">
        <div class="label-container">
          <label for="ollamaModel">Model</label>
          <a href="https://ollama.ai/library" class="learn-more" target="_blank">Learn more</a>
        </div>
        <input type="text" id="ollamaModel" placeholder="e.g., phi4" value="${this._settings.ollama?.model || ''}" />
        <div class="description">
          Examples: mistral, llama2, codellama, phi4, qwen2.5-coder
        </div>
      </div>
    </div>`;
    }
}
