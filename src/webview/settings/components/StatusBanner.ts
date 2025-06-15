// src/webview/settings/components/StatusBanner.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { getStatusBannerStyles } from "../styles/statusBanner.css";
import { ProviderIcon } from "./ProviderIcon";

interface ProviderConfig {
  displayName: string;
  defaultModel: string;
  getApiConfigured: (settings: ExtensionSettings) => boolean;
}

export class StatusBanner {
  private _settings: ExtensionSettings;

  private static readonly PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
    gemini: {
      displayName: "Gemini",
      defaultModel: "gemini-2.5-flash-preview-04-17",
      getApiConfigured: (s) => !!s.gemini?.apiKey
    },
    huggingface: {
      displayName: "Hugging Face",
      defaultModel: "Not configured",
      getApiConfigured: (s) => !!s.huggingface?.apiKey
    },
    ollama: {
      displayName: "Ollama",
      defaultModel: "Not configured",
      getApiConfigured: (s) => !!s.ollama?.url
    },
    mistral: {
      displayName: "Mistral",
      defaultModel: "mistral-large-latest",
      getApiConfigured: (s) => !!s.mistral?.apiKey
    },
    cohere: {
      displayName: "Cohere",
      defaultModel: "command-a-03-2025",
      getApiConfigured: (s) => !!s.cohere?.apiKey
    },
    openai: {
      displayName: "OpenAI",
      defaultModel: "gpt-3.5-turbo",
      getApiConfigured: (s) => !!s.openai?.apiKey
    },
    together: {
      displayName: "Together AI",
      defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      getApiConfigured: (s) => !!s.together?.apiKey
    },
    openrouter: {
      displayName: "OpenRouter",
      defaultModel: "google/gemma-3-27b-it:free",
      getApiConfigured: (s) => !!s.openrouter?.apiKey
    },
    anthropic: {
      displayName: "Anthropic",
      defaultModel: "claude-3-5-sonnet-20241022",
      getApiConfigured: (s) => !!s.anthropic?.apiKey
    },
    copilot: {
      displayName: "GitHub Copilot",
      defaultModel: "gpt-4o",
      getApiConfigured: () => true
    },
    deepseek: {
      displayName: "DeepSeek",
      defaultModel: "deepseek-chat",
      getApiConfigured: (s) => !!s.deepseek?.apiKey
    },
    grok: {
      displayName: "Grok",
      defaultModel: "grok-3",
      getApiConfigured: (s) => !!s.grok?.apiKey
    },
    perplexity: {
      displayName: "Perplexity",
      defaultModel: "sonar-pro",
      getApiConfigured: (s) => !!s.perplexity?.apiKey
    }
  };

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  private getProviderInfo(): { displayName: string; model: string; apiConfigured: boolean } {
    const provider = this._settings.apiProvider;
    const config = StatusBanner.PROVIDER_CONFIGS[provider];

    if (!config) {
      return {
        displayName: provider,
        model: "Unknown",
        apiConfigured: false
      };
    }

    const providerSettings = (this._settings as any)[provider];
    const model = providerSettings?.model || config.defaultModel;
    const apiConfigured = config.getApiConfigured(this._settings);

    return {
      displayName: config.displayName,
      model,
      apiConfigured
    };
  }

  private renderStatusItem(label: string, value: string, className?: string): string {
    const valueClass = className ? ` class="${className}"` : '';
    return `
      <div class="status-item">
        <span class="status-label">${label}</span>
        <span class="status-value"${valueClass}>${value}</span>
      </div>
    `;
  }

  public render(): string {
    const providerInfo = this.getProviderInfo();
    const provider = this._settings.apiProvider;

    const statusItems = [
      this.renderStatusItem(
        'Active Provider',
        `<span class="status-badge ${provider}">${providerInfo.displayName}</span>`
      ),
      this.renderStatusItem('Model', providerInfo.model),
      this.renderStatusItem('API Status', providerInfo.apiConfigured ? 'Configured' : 'Not Configured'),
      this.renderStatusItem('Commit Style', this._settings.commit?.verbose ? 'Verbose' : 'Concise'),
      this.renderStatusItem('Prompt Customization', this._settings.promptCustomization?.enabled ? 'Enabled' : 'Disabled'),
      this.renderStatusItem(
        'Anonymous Analytics',
        this._settings.telemetry?.enabled !== false ? 'Enabled' : 'Disabled',
        this._settings.telemetry?.enabled !== false ? 'telemetry-enabled' : 'telemetry-disabled'
      )
    ];

    return `
      <div class="status-banner">
        <div class="status-banner-header">
          ${ProviderIcon.renderIcon(provider, 40)}
          <div class="status-banner-title">
            <h3>Current Configuration</h3>
            <span class="status-provider-name">${providerInfo.displayName}</span>
          </div>
        </div>
        <div class="status-grid">
          ${statusItems.join('')}
        </div>
      </div>
    `;
  }
}