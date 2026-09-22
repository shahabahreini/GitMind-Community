// src/webview/settings/components/StatusBanner.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { getStatusBannerStyles } from "../styles/statusBanner.css";
import { ProviderIcon } from "./ProviderIcon";
import { getProviderAuth, getProviderEntry } from "../../../config/providerCatalog";

interface ProviderConfig {
  displayName: string;
  defaultModel: string;
  getApiConfigured: (settings: ExtensionSettings) => boolean;
}

export class StatusBanner {
  private _settings: ExtensionSettings;

  /** Whether the provider's required connection value is present; derived from catalog auth metadata. */
  private static isApiConfigured(provider: string, settings: ExtensionSettings): boolean {
    const providerSettings = (settings as any)[provider] ?? {};
    const auth = getProviderAuth(provider);
    switch (auth?.kind) {
      case "apiKey":
        return !!providerSettings.apiKey || (auth.optional === true && providerSettings.authMode === "entra");
      case "local":
        return !!providerSettings.url;
      case "custom":
        return !!(providerSettings.baseUrl && providerSettings.endpoint);
      case "ide-session":
      case "cloud-credentials":
        return true;
      default:
        return false;
    }
  }

  private static getProviderConfig(provider: string): ProviderConfig | undefined {
    const entry = getProviderEntry(provider);
    if (!entry) {
      return undefined;
    }
    return {
      displayName: entry.name,
      defaultModel: entry.defaultModel || (entry.auth.kind === "custom" ? "Custom" : "Not configured"),
      getApiConfigured: (settings) => StatusBanner.isApiConfigured(provider, settings),
    };
  }

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  private getProviderInfo(): { displayName: string; model: string; apiConfigured: boolean } {
    const provider = this._settings.apiProvider;
    const config = StatusBanner.getProviderConfig(provider);

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

  private renderChip(label: string, value: string, dot?: 'on' | 'off', isDisabled?: boolean): string {
    const dotHtml = dot ? `<span class="dot ${dot}"></span>` : '';
    const disabledClass = isDisabled || dot === 'off' ? ' disabled' : '';
    return `
      <span class="gm-chip${disabledClass}">
        <span class="k">${label}</span>
        <span class="gm-chip-value-wrapper">
          ${dotHtml}
          <span class="v">${value}</span>
        </span>
      </span>
    `;
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
          <button type="button" id="bannerBuyProBtn" class="gm-activate-btn gm-buy-btn">Buy GitMind Pro</button>
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
    const captureAll = this._settings.commit?.captureAllChanges ?? false;
    const promptCustomization = this._settings.promptCustomization?.enabled ? 'Enabled' : 'Disabled';
    const diagnostics = this._settings.showDiagnostics ? 'Enabled' : 'Disabled';
    const activeStyle = this._settings.commitStyle?.style || 'basic';
    const historyLearning = this._settings.pro?.learnFromCommitHistory?.enabled ? 'Active' : 'Off';
    const encryption = this._settings.pro?.encryptionEnabled ? 'Encrypted' : 'Off';
    const commitIntelligence = this._settings.commitIntelligence?.enabled ? 'Active' : 'Off';
    const commitHealth = this._settings.commitIntelligence?.healthEnabled ? 'Active' : 'Off';

    return `
      <div class="gm-config-card ${isProUser ? 'pro-active' : ''}">
        <div class="gm-config-head">
          ${ProviderIcon.renderIcon(provider, 28)}
          <div class="gm-config-title">
            <span class="gm-config-caption">Current Configuration</span>
            <div class="gm-config-name-row">
              <span class="gm-config-name">${providerInfo.displayName}</span>
              <span class="gm-config-model-badge" title="${providerInfo.model}">${providerInfo.model}</span>
            </div>
          </div>
          <span class="gm-config-plan ${isProUser ? 'pro' : 'free'}">${isProUser ? 'PRO' : 'FREE'}</span>
        </div>

        <div class="gm-config-groups">
          <div class="gm-config-group">
            <div class="gm-config-group-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 15V9a4 4 0 0 0-4-4H9"/><path d="M6 9v6"/></svg>
              Commit settings
            </div>
            <div class="gm-config-group-items">
              ${this.renderChip('Intelligence', commitIntelligence, this._settings.commitIntelligence?.enabled ? 'on' : 'off', !this._settings.commitIntelligence?.enabled)}
              ${this.renderChip('Health', commitHealth, this._settings.commitIntelligence?.healthEnabled ? 'on' : 'off', !this._settings.commitIntelligence?.healthEnabled)}
              ${this.renderChip('Commit', commitStyle)}
              ${this.renderChip('Capture', captureAll ? 'All Changes' : 'Staged Only')}
              ${this.renderChip('Style', activeStyle)}
            </div>
          </div>
          
          <div class="gm-config-group">
            <div class="gm-config-group-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              AI & Security
            </div>
            <div class="gm-config-group-items">
              ${this.renderChip('Security', encryption, this._settings.pro?.encryptionEnabled ? 'on' : 'off', !this._settings.pro?.encryptionEnabled)}
              ${this.renderChip('History', historyLearning, this._settings.pro?.learnFromCommitHistory?.enabled ? 'on' : 'off', !this._settings.pro?.learnFromCommitHistory?.enabled)}
              ${this.renderChip('Prompts', promptCustomization, this._settings.promptCustomization?.enabled ? 'on' : 'off', !this._settings.promptCustomization?.enabled)}
            </div>
          </div>
          
          <div class="gm-config-group">
            <div class="gm-config-group-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
              System & API
            </div>
            <div class="gm-config-group-items">
              ${this.renderChip('API', providerInfo.apiConfigured ? 'Configured' : 'Not set', providerInfo.apiConfigured ? 'on' : 'off', !providerInfo.apiConfigured)}
              ${this.renderChip('Diagnostics', diagnostics, this._settings.showDiagnostics ? 'on' : 'off', !this._settings.showDiagnostics)}
            </div>
          </div>
        </div>

        ${isProUser ? '' : StatusBanner.renderActivationBlock()}
      </div>
    `;
  }
}
