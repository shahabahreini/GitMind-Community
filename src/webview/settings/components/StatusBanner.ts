// src/webview/settings/components/StatusBanner.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { getStatusBannerStyles } from "../styles/statusBanner.css";
import { ProviderIcon } from "./ProviderIcon";

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
        modelInfo = this._settings.gemini.model || "gemini-2.5-flash-preview-04-17";
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
        modelInfo = this._settings.cohere.model || "command-a-03-2025";
        break;
      case "together":
        modelInfo = this._settings.together?.model || "Not selected";
        break;
      case "openrouter":
        modelInfo = this._settings.openrouter.model || "Not selected";
        break;
      case "anthropic":
        modelInfo = this._settings.anthropic.model || "claude-3-5-sonnet-20241022";
        break;
      case "copilot":
        modelInfo = this._settings.copilot?.model || "gpt-4o";
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
      case "together":
        apiConfigured = !!this._settings.together?.apiKey;
        break;
      case "openrouter":
        apiConfigured = !!this._settings.openrouter.apiKey;
        break;
      case "anthropic":
        apiConfigured = !!this._settings.anthropic.apiKey;
        break;
      case "copilot":
        apiConfigured = true; // Copilot uses VS Code authentication
        break;
    }

    // Format provider name for display
    const providerDisplay = {
      gemini: "Gemini",
      huggingface: "Hugging Face",
      ollama: "Ollama",
      mistral: "Mistral",
      cohere: "Cohere",
      together: "Together AI",
      openrouter: "OpenRouter",
      anthropic: "Anthropic",
      copilot: "GitHub Copilot"
    }[this._settings.apiProvider] || this._settings.apiProvider;

    return `
    <div class="status-banner">
      <div class="status-banner-header">
        ${ProviderIcon.renderIcon(this._settings.apiProvider, 40)}
        <div class="status-banner-title">
          <h3>Current Configuration</h3>
          <span class="status-provider-name">${providerDisplay}</span>
        </div>
      </div>
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
        <div class="status-item">
          <span class="status-label">Prompt Customization</span>
          <span class="status-value">${this._settings.promptCustomization?.enabled ? "Enabled" : "Disabled"}</span>
        </div>
      </div>
    </div>`;
  }
}
