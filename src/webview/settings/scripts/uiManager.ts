// src/webview/settings/scripts/uiManager.ts
import { ProviderIcon } from '../components/ProviderIcon';
import { serializeProvidersForWebview } from '../../../config/providerCatalog';

/** Provider metadata from the canonical catalog, serialized for the webview script. */
const WEBVIEW_PROVIDERS = serializeProvidersForWebview();

const PROVIDERS = Object.keys(WEBVIEW_PROVIDERS);

export function getUiManagerScript(): string {
  const providerIconString = `
    window.ProviderIcon = {
      icons: ${JSON.stringify(ProviderIcon['icons'])},
      renderIcon: function(provider, size = 24) {
        const iconPath = this.icons[provider];
        if (!iconPath) {
          return \`<div class="provider-icon-placeholder" style="width: \${size}px; height: \${size}px;"></div>\`;
        }
        return \`
          <svg class="provider-icon \${provider}" width="\${size}" height="\${size}" viewBox="\${provider === 'nvidia' ? '0 0 163.3 108' : provider === 'inception' ? '0 0 140 145' : '0 0 24 24'}"
               fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="\${iconPath}" />
          </svg>
        \`;
      }
    };
  `;

  return `
    ${providerIconString}
    
    const WEBVIEW_PROVIDERS = ${JSON.stringify(WEBVIEW_PROVIDERS)};
    const PROVIDERS = ${JSON.stringify(PROVIDERS)};

    // Whether the provider's required connection value is present, from catalog auth metadata.
    function isProviderApiConfigured(provider, settings) {
      const meta = WEBVIEW_PROVIDERS[provider];
      const providerSettings = (settings && settings[provider]) || {};
      if (!meta) return false;
      switch (meta.authKind) {
        case 'apiKey': return !!providerSettings.apiKey || (!meta.requiresApiKey && providerSettings.authMode === 'entra');
        case 'local': return !!providerSettings.url;
        case 'custom': return !!(providerSettings.baseUrl && providerSettings.endpoint);
        default: return true; // ide-session and cloud-credentials need no stored secret
      }
    }

    function getProviderDefaultModelLabel(provider) {
      const meta = WEBVIEW_PROVIDERS[provider];
      if (!meta) return 'Unknown';
      return meta.defaultModel || (meta.authKind === 'custom' ? 'Custom' : 'Not configured');
    }
    
    function updateVisibleSettings() {
      const selectedProvider = document.getElementById('apiProvider').value;
      
      PROVIDERS.forEach(provider => {
        const element = document.getElementById(provider + 'Settings');
        if (element) {
          element.style.display = provider === selectedProvider ? 'block' : 'none';
        }
      });
    }
    
    function setupApiKeyAutoLoading(provider, commandId) {
      const apiKeyElement = document.getElementById(provider + 'ApiKey');
      if (apiKeyElement) {
        // DISABLED: Auto-loading models when API key changes
        // This was causing infinite loops and unwanted auto-saves
        // Users can manually click "Load Available Models" if needed
        /*
        apiKeyElement.addEventListener('change', function() {
          const apiKey = this.value.trim();
          if (apiKey && apiKey.length > 10) {
            vscode.postMessage({
              command: 'executeCommand',
              commandId: commandId
            });
          }
        });
        */
      }
    }
    
    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = message;
        toast.className = 'toast';
        toast.classList.add(type, 'show');
        
        setTimeout(() => {
          toast.classList.remove('show');
        }, 3000);
      }
    }
    
    function getProviderInfo(provider, settings) {
      const meta = WEBVIEW_PROVIDERS[provider];
      if (!meta) return { displayName: provider, model: '', apiConfigured: false };
      
      const providerSettings = settings[provider];
      const model = providerSettings?.model || getProviderDefaultModelLabel(provider);
      const apiConfigured = isProviderApiConfigured(provider, settings);
      
      return {
        displayName: meta.name,
        model: model,
        apiConfigured: apiConfigured
      };
    }
    
    // Make StatusBanner available globally for dynamic updates
    window.StatusBanner = function(settings) {
      this._settings = settings;
      
      
      this.getProviderInfo = function() {
        const provider = this._settings.apiProvider;
        const meta = WEBVIEW_PROVIDERS[provider];

        if (!meta) {
          return { displayName: provider, model: "Unknown", apiConfigured: false };
        }

        const providerSettings = this._settings[provider];
        const model = providerSettings?.model || getProviderDefaultModelLabel(provider);
        const apiConfigured = isProviderApiConfigured(provider, this._settings);

        return { displayName: meta.name, model, apiConfigured };
      };
      
      this.renderChip = function(label, value, dot, isDisabled) {
        const dotHtml = dot ? \`<span class="dot \${dot}"></span>\` : '';
        const disabledClass = isDisabled || dot === 'off' ? ' disabled' : '';
        return \`
          <span class="gm-chip\${disabledClass}">
            <span class="k">\${label}</span>
            <span class="gm-chip-value-wrapper">
              \${dotHtml}
              <span class="v">\${value}</span>
            </span>
          </span>
        \`;
      };

      this.renderActivationBlock = function() {
        return \`
          <div class="gm-activate">
            <div class="gm-activate-label">Activate GitMind Pro</div>
            <div class="gm-activate-row">
              <input type="text" id="bannerLicenseInput" class="gm-activate-input"
                     placeholder="Paste your license key (GITMIND-PRO-…)" autocomplete="off" />
              <button type="button" id="bannerActivateLicenseBtn" class="gm-activate-btn">Activate</button>
              <button type="button" id="bannerBuyProBtn" class="gm-activate-btn gm-buy-btn">Buy GitMind Pro</button>
            </div>
          </div>
        \`;
      };

      this.render = function() {
        const providerInfo = this.getProviderInfo();
        const provider = this._settings.apiProvider;
        const hasSubscriptionEmail = !!this._settings.subscription?.email && this._settings.subscription.email.length > 0;
        const licenseValid = this._settings.pro?.validationStatus === 'valid';
        const isActiveSubscription = this._settings.subscription?.status === 'active';
        const devModeEnabled = typeof window !== 'undefined' && window.GITMIND_DEV_MODE === true;
        const isProUser = licenseValid || (hasSubscriptionEmail && isActiveSubscription) || devModeEnabled;

        const renderProviderIcon = (provider, size = 40) =>
          window.ProviderIcon ? window.ProviderIcon.renderIcon(provider, size) : '';

        const commitStyle = this._settings.commit?.verbose ? 'Verbose' : 'Concise';
        const captureAll = this._settings.commit?.captureAllChanges ?? false;
        const promptCustomization = this._settings.promptCustomization?.enabled ? 'Enabled' : 'Disabled';
        const diagnostics = this._settings.showDiagnostics ? 'Enabled' : 'Disabled';
        const activeStyle = this._settings.commitStyle?.style || 'basic';
        const historyLearning = this._settings.pro?.learnFromCommitHistory?.enabled ? 'Active' : 'Off';
        const encryption = this._settings.pro?.encryptionEnabled ? 'Encrypted' : 'Off';
        const commitIntelligence = this._settings.commitIntelligence?.enabled ? 'Active' : 'Off';
        const commitHealth = this._settings.commitIntelligence?.healthEnabled ? 'Active' : 'Off';

        return \`
          <div class="gm-config-card \${isProUser ? 'pro-active' : ''}">
            <div class="gm-config-head">
              \${renderProviderIcon(provider, 28)}
              <div class="gm-config-title">
                <span class="gm-config-caption">Current Configuration</span>
                <div class="gm-config-name-row">
                  <span class="gm-config-name">\${providerInfo.displayName}</span>
                  <span class="gm-config-model-badge" title="\${providerInfo.model}">\${providerInfo.model}</span>
                </div>
              </div>
              <span class="gm-config-plan \${isProUser ? 'pro' : 'free'}">\${isProUser ? 'PRO' : 'FREE'}</span>
            </div>

            <div class="gm-config-groups">
              <div class="gm-config-group">
                <div class="gm-config-group-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 15V9a4 4 0 0 0-4-4H9"/><path d="M6 9v6"/></svg>
                  Commit settings
                </div>
                <div class="gm-config-group-items">
                  \${this.renderChip('Intelligence', commitIntelligence, this._settings.commitIntelligence?.enabled ? 'on' : 'off', !this._settings.commitIntelligence?.enabled)}
                  \${this.renderChip('Health', commitHealth, this._settings.commitIntelligence?.healthEnabled ? 'on' : 'off', !this._settings.commitIntelligence?.healthEnabled)}
                  \${this.renderChip('Commit', commitStyle)}
                  \${this.renderChip('Capture', captureAll ? 'All Changes' : 'Staged Only')}
                  \${this.renderChip('Style', activeStyle)}
                </div>
              </div>
              
              <div class="gm-config-group">
                <div class="gm-config-group-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  AI & Security
                </div>
                <div class="gm-config-group-items">
                  \${this.renderChip('Security', encryption, this._settings.pro?.encryptionEnabled ? 'on' : 'off', !this._settings.pro?.encryptionEnabled)}
                  \${this.renderChip('History', historyLearning, this._settings.pro?.learnFromCommitHistory?.enabled ? 'on' : 'off', !this._settings.pro?.learnFromCommitHistory?.enabled)}
                  \${this.renderChip('Prompts', promptCustomization, this._settings.promptCustomization?.enabled ? 'on' : 'off', !this._settings.promptCustomization?.enabled)}
                </div>
              </div>
              
              <div class="gm-config-group">
                <div class="gm-config-group-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                  System & API
                </div>
                <div class="gm-config-group-items">
                  \${this.renderChip('API', providerInfo.apiConfigured ? 'Configured' : 'Not set', providerInfo.apiConfigured ? 'on' : 'off', !providerInfo.apiConfigured)}
                  \${this.renderChip('Diagnostics', diagnostics, this._settings.showDiagnostics ? 'on' : 'off', !this._settings.showDiagnostics)}
                </div>
              </div>
            </div>

            \${isProUser ? '' : this.renderActivationBlock()}
          </div>
        \`;
      };
    };
    
    function updateStatusBanner(settings) {
      // Skip status banner updates if a dropdown is open to prevent DOM disruption
      if (window.isDropdownOpen) {
        console.log('Skipping status banner update - dropdown is open');
        // Queue the update for later
        setTimeout(() => updateStatusBanner(settings), 1000);
        return;
      }
      
      // Update current settings reference
      currentSettings = settings;
      window.gitmindSettings = currentSettings; // Update global reference for Pro features
      
      const container = document.getElementById('statusBannerContainer');
      if (!container) return;
      
      // Create a new StatusBanner instance with updated settings
      const statusBanner = new window.StatusBanner(settings);
      
      // Replace the container's content with fresh HTML
      container.innerHTML = statusBanner.render();
      
      // Add animation to highlight the update
      const banner = container.firstElementChild;
      if (banner) {
        banner.classList.add('banner-updated');
        setTimeout(() => banner.classList.remove('banner-updated'), 1000);
      }
    }
    
    // ----- Current Configuration: inline Pro activation wiring -----
    // Delegated so it keeps working after the banner re-renders via innerHTML.
    function submitBannerLicense() {
      const input = document.getElementById('bannerLicenseInput');
      const btn = document.getElementById('bannerActivateLicenseBtn');
      const key = input && input.value ? input.value.trim() : '';
      if (!key) {
        if (input) {
          input.focus();
          input.style.borderColor = 'var(--vscode-inputValidation-errorBorder, #e51400)';
        }
        return;
      }
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Activating…';
      }
      vscode.postMessage({ command: 'activateProLicense', licenseKey: key });
    }

    document.addEventListener('click', function(e) {
      const target = e.target && e.target.closest
        ? e.target.closest('#bannerActivateLicenseBtn, #bannerBuyProBtn')
        : null;
      if (!target) return;

      if (target.id === 'bannerActivateLicenseBtn') {
        submitBannerLicense();
      } else if (target.id === 'bannerBuyProBtn') {
        vscode.postMessage({ command: 'executeCommand', commandId: 'gitmind.subscribe' });
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && e.target && e.target.id === 'bannerLicenseInput') {
        e.preventDefault();
        submitBannerLicense();
      }
    });

    // Reset the banner activate button if activation fails (on success the banner
    // re-renders without the activation block, so no reset is needed).
    window.addEventListener('message', function(event) {
      const msg = event.data;
      if (msg && msg.command === 'proActivationResult' && !msg.success) {
        const btn = document.getElementById('bannerActivateLicenseBtn');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Activate';
        }
      }
    });

    // Initialize UI
    updateVisibleSettings();
    document.getElementById('apiProvider')?.addEventListener('change', updateVisibleSettings);
    
    // Setup auto-loading for providers that support it
    setupApiKeyAutoLoading('mistral', 'gitmind.loadMistralModels');
    setupApiKeyAutoLoading('cohere', 'gitmind.loadCohereModels');
    setupApiKeyAutoLoading('together', 'gitmind.loadTogetherModels');
    setupApiKeyAutoLoading('openrouter', 'gitmind.loadOpenRouterModels');
    setupApiKeyAutoLoading('grok', 'gitmind.loadGrokModels');
    setupApiKeyAutoLoading('groq', 'gitmind.loadGroqModels');
    setupApiKeyAutoLoading('gemini', 'gitmind.loadGeminiModels');
    setupApiKeyAutoLoading('anthropic', 'gitmind.loadAnthropicModels');
    setupApiKeyAutoLoading('huggingface', 'gitmind.loadHuggingFaceModels');
    setupApiKeyAutoLoading('ollamacloud', 'gitmind.loadOllamaCloudModels');
    setupApiKeyAutoLoading('inception', 'gitmind.loadInceptionModels');
  `;
}
