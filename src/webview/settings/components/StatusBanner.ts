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
    },
    custom: {
      displayName: "Custom API",
      defaultModel: "Custom",
      getApiConfigured: (s) => !!(s.custom?.baseUrl && s.custom?.endpoint)
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

  private renderInlineStatus(label: string, value: string, className?: string): string {
    const valueClass = className ? ` class="${className}"` : '';
    return `
      <div class="inline-status">
        <span class="inline-label">${label}:</span>
        <span class="inline-value"${valueClass}>${value}</span>
      </div>
    `;
  }

  public render(): string {
    const providerInfo = this.getProviderInfo();
    const provider = this._settings.apiProvider;
    const hasSubscriptionEmail = !!this._settings.subscription?.email && this._settings.subscription.email.length > 0;

    // Check real subscription status from API only
    const isActiveSubscription = hasSubscriptionEmail && this._settings.subscription?.status === 'active';

    const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
    const isProUser = (hasSubscriptionEmail && isActiveSubscription) || devModeEnabled;

    const apiStatus = providerInfo.apiConfigured ?
      '<span class="status-indicator configured">●</span>Configured' :
      '<span class="status-indicator disabled">○</span>Not Configured';

    const commitStyle = this._settings.commit?.verbose ? 'Verbose' : 'Concise';
    const promptCustomization = this._settings.promptCustomization?.enabled ? 'Enabled' : 'Disabled';
    const analytics = this._settings.telemetry?.enabled !== false ? 'Enabled' : 'Disabled';

    return `
      <div class="status-banner-compact">
        <div class="banner-header">
          ${ProviderIcon.renderIcon(provider, 28)}
          <div class="header-content">
            <div class="provider-info">
              <span class="provider-name">${providerInfo.displayName}</span>
              ${isProUser ? '<span class="pro-badge">PRO</span>' : '<span class="free-badge">FREE</span>'}
            </div>
            <div class="model-display">${providerInfo.model}</div>
          </div>
        </div>
        
        <div class="status-content">
          <div class="status-row primary">
            ${this.renderInlineStatus('API', apiStatus)}
            ${this.renderInlineStatus('Commit', commitStyle)}
          </div>
          <div class="status-row secondary">
            ${this.renderInlineStatus('Prompts', promptCustomization)}
            ${this.renderInlineStatus('Analytics', analytics)}
          </div>
        </div>
      </div>
      
      <style>
        .status-banner-compact {
          background: var(--vscode-editor-background);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }

        .status-banner-compact:hover {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .banner-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .header-content {
          flex: 1;
          min-width: 0;
        }

        .provider-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .provider-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--vscode-foreground);
        }

        .pro-badge, .free-badge {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          border-radius: 8px;
        }

        .pro-badge {
          background: linear-gradient(135deg, #ffd700, #ffb000);
          color: #8b4513;
          box-shadow: 0 1px 3px rgba(255, 215, 0, 0.4);
        }

        .free-badge {
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.3);
        }

        .model-display {
          font-size: 11px;
          color: var(--vscode-descriptionForeground);
          font-family: var(--vscode-editor-font-family, 'SF Mono', monospace);
          background: rgba(255, 255, 255, 0.03);
          padding: 3px 6px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          max-width: fit-content;
          word-break: break-all;
        }

        .status-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .status-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .status-row.primary .inline-status {
          flex: 1;
          min-width: 120px;
        }

        .status-row.secondary .inline-status {
          flex: 1;
          min-width: 100px;
        }

        .inline-status {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .inline-label {
          font-size: 10px;
          color: var(--vscode-descriptionForeground);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.7;
        }

        .inline-value {
          font-size: 11px;
          font-weight: 500;
          color: var(--vscode-foreground);
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .status-indicator {
          font-size: 8px;
          margin-right: 2px;
        }

        .status-indicator.configured {
          color: #10b981;
        }

        .status-indicator.disabled {
          color: #6b7280;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .status-banner-compact {
            padding: 14px;
          }

          .banner-header {
            gap: 10px;
            margin-bottom: 10px;
          }

          .provider-name {
            font-size: 20px;
          }

          .model-display {
            font-size: 10px;
          }

          .status-row {
            gap: 12px;
          }

          .status-row.primary .inline-status,
          .status-row.secondary .inline-status {
            min-width: 90px;
          }
        }

        @media (max-width: 480px) {
          .status-banner-compact {
            padding: 12px;
          }

          .banner-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .provider-info {
            align-self: stretch;
            justify-content: space-between;
          }

          .status-row {
            flex-direction: column;
            gap: 4px;
          }

          .inline-status {
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }

          .inline-status:last-child {
            border-bottom: none;
          }
        }
      </style>
    `;
  }
}