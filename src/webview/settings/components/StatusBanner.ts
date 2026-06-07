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
      defaultModel: "mistral-small-4",
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
      defaultModel: "claude-sonnet-4.6",
      getApiConfigured: (s) => !!s.anthropic?.apiKey
    },
    minimax: {
      displayName: "MiniMax",
      defaultModel: "MiniMax-M2",
      getApiConfigured: (s) => !!(s as any).minimax?.apiKey
    },
    copilot: {
      displayName: "GitHub Copilot",
      defaultModel: "gpt-5.5-instant",
      getApiConfigured: () => true
    },
    deepseek: {
      displayName: "DeepSeek",
      defaultModel: "deepseek-v4-flash",
      getApiConfigured: (s) => !!s.deepseek?.apiKey
    },
    grok: {
      displayName: "Grok",
      defaultModel: "grok-4.4",
      getApiConfigured: (s) => !!s.grok?.apiKey
    },
    perplexity: {
      displayName: "Perplexity",
      defaultModel: "gpt-5.5-computer",
      getApiConfigured: (s) => !!s.perplexity?.apiKey
    },
    zai: {
      displayName: "Z.ai",
      defaultModel: "glm-4.5-flash",
      getApiConfigured: (s) => !!(s as any).zai?.apiKey
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

  private renderChip(label: string, value: string, dot?: 'on' | 'off'): string {
    const dotHtml = dot ? `<span class="dot ${dot}"></span>` : '';
    return `<span class="gm-chip"><span class="k">${label}</span>${dotHtml}<span class="v">${value}</span></span>`;
  }

  /**
   * Inline license / quick-activation block, shown only to non-Pro users.
   * Kept identical to the runtime version in uiManager.ts so the panel looks
   * the same on first render and after live updates.
   */
  public static renderActivationBlock(): string {
    return `
      <div class="gm-activate">
        <div class="gm-activate-label">Activate GitMind Pro</div>
        <div class="gm-activate-row">
          <input type="text" id="bannerLicenseInput" class="gm-activate-input"
                 placeholder="Paste your license key (GITMIND-PRO-…)" autocomplete="off" />
          <button type="button" id="bannerActivateLicenseBtn" class="gm-activate-btn">Activate</button>
        </div>
        <div class="gm-activate-actions">
          <button type="button" id="bannerBuyProBtn" class="gm-activate-link">Buy GitMind Pro</button>
        </div>
      </div>
    `;
  }

  public render(): string {
    const providerInfo = this.getProviderInfo();
    const provider = this._settings.apiProvider;
    const hasSubscriptionEmail = !!this._settings.subscription?.email && this._settings.subscription.email.length > 0;

    // Pro if a license is validated OR there's an active subscription OR dev mode.
    const licenseValid = (this._settings as any).pro?.validationStatus === 'valid';
    const isActiveSubscription = hasSubscriptionEmail && this._settings.subscription?.status === 'active';
    const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
    const isProUser = licenseValid || isActiveSubscription || devModeEnabled;

    const commitStyle = this._settings.commit?.verbose ? 'Verbose' : 'Concise';
    const promptCustomization = this._settings.promptCustomization?.enabled ? 'Enabled' : 'Disabled';
    const analytics = this._settings.telemetry?.enabled !== false ? 'Enabled' : 'Disabled';

    return `
      <div class="gm-config-card">
        <div class="gm-config-head">
          ${ProviderIcon.renderIcon(provider, 28)}
          <div class="gm-config-title">
            <span class="gm-config-caption">Current Configuration</span>
            <span class="gm-config-name">${providerInfo.displayName}</span>
          </div>
          <span class="gm-config-plan ${isProUser ? 'pro' : 'free'}">${isProUser ? 'PRO' : 'FREE'}</span>
        </div>

        <div class="gm-config-model"><span class="k">Model</span>${providerInfo.model}</div>

        <div class="gm-chips">
          ${this.renderChip('API', providerInfo.apiConfigured ? 'Configured' : 'Not set', providerInfo.apiConfigured ? 'on' : 'off')}
          ${this.renderChip('Commit', commitStyle)}
          ${this.renderChip('Prompts', promptCustomization, this._settings.promptCustomization?.enabled ? 'on' : 'off')}
          ${this.renderChip('Analytics', analytics, this._settings.telemetry?.enabled !== false ? 'on' : 'off')}
        </div>

        ${isProUser ? '' : StatusBanner.renderActivationBlock()}
      </div>
    `;
  }
}