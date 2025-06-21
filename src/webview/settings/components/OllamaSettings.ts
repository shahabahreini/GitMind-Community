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
        <div class="model-input-container">
          <div class="searchable-dropdown">
            <input type="text" 
                   id="ollamaModel" 
                   placeholder="Type or select a model (e.g., phi4)" 
                   value="${this._settings.ollama?.model || ''}"
                   autocomplete="off" />
            <button type="button" 
                    id="loadModelsBtn" 
                    class="load-models-btn" 
                    title="Load available models from Ollama">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
              </svg>
            </button>
            <div id="modelDropdown" class="dropdown-content" style="display: none;">
              <div class="dropdown-loading" style="display: none;">Loading models...</div>
              <div class="dropdown-error" style="display: none;"></div>
              <div class="dropdown-empty" style="display: none;">No models found</div>
              <ul class="model-list"></ul>
            </div>
          </div>
        </div>
        <div class="description">
          Examples: mistral, llama2, codellama, phi4, qwen2.5-coder<br>
          <small>Click the refresh button to load available models from your Ollama instance</small>
        </div>
      </div>
    </div>`;
  }
}
