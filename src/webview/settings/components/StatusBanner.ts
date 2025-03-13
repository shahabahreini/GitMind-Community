// src/webview/settings/components/StatusBanner.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { getStatusBannerStyles } from "../styles/statusBanner.css";

export class StatusBanner {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    // Get provider-specific model info
    let modelInfo = "";
    switch (this._settings.apiProvider) {
      case "gemini":
        modelInfo = this._settings.gemini.model || "gemini-2.0-flash";
        break;
      case "huggingface":
        modelInfo = this._settings.huggingface.model || "Not configured";
        break;
      case "ollama":
        modelInfo = this._settings.ollama.model || "Not configured";
        break;
      case "mistral":
        modelInfo = this._settings.mistral.model || "mistral-large-latest";
        break;
      case "cohere":
        modelInfo = this._settings.cohere.model || "command-r-plus";
        break;
    }

    // Get API configuration status
    let apiConfigured = false;
    switch (this._settings.apiProvider) {
      case "gemini":
        apiConfigured = !!this._settings.gemini.apiKey;
        break;
      case "huggingface":
        apiConfigured = !!this._settings.huggingface.apiKey;
        break;
      case "ollama":
        apiConfigured = !!this._settings.ollama.url;
        break;
      case "mistral":
        apiConfigured = !!this._settings.mistral.apiKey;
        break;
      case "cohere":
        apiConfigured = !!this._settings.cohere.apiKey;
        break;
    }

    // Format provider name for display
    const providerDisplay = {
      gemini: "Gemini",
      huggingface: "Hugging Face",
      ollama: "Ollama",
      mistral: "Mistral",
      cohere: "Cohere"
    }[this._settings.apiProvider] || this._settings.apiProvider;

    return `
    <div class="status-banner">
      <h3>Current Configuration</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="status-label">Active Provider</span>
          <span class="status-value">
            <span class="status-badge ${this._settings.apiProvider}">${providerDisplay}</span>
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">Model</span>
          <span class="status-value">${modelInfo}</span>
        </div>
        <div class="status-item">
          <span class="status-label">API Status</span>
          <span class="status-value">${apiConfigured ? "Configured" : "Not Configured"}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Commit Style</span>
          <span class="status-value">${this._settings.commit?.verbose ? "Verbose" : "Concise"}</span>
        </div>
      </div>
    </div>`;
  }
}
