// src/webview/settings/scripts/uiManager.ts
import { ProviderIcon } from '../components/ProviderIcon';

interface ProviderDisplayConfig {
  displayName: string;
  model: string;
  apiConfigured: (settings: any) => boolean;
}

const PROVIDER_DISPLAY_CONFIG: Record<string, ProviderDisplayConfig> = {
  gemini: {
    displayName: "Gemini",
    model: "gemini-2.5-flash-preview-04-17",
    apiConfigured: (s) => !!s.gemini?.apiKey
  },
  huggingface: {
    displayName: "Hugging Face",
    model: "Not configured",
    apiConfigured: (s) => !!s.huggingface?.apiKey
  },
  ollama: {
    displayName: "Ollama",
    model: "Not configured",
    apiConfigured: (s) => !!s.ollama?.url
  },
  mistral: {
    displayName: "Mistral",
    model: "mistral-small-4",
    apiConfigured: (s) => !!s.mistral?.apiKey
  },
  cohere: {
    displayName: "Cohere",
    model: "command-a-03-2025",
    apiConfigured: (s) => !!s.cohere?.apiKey
  },
  openai: {
    displayName: "OpenAI",
    model: "gpt-3.5-turbo",
    apiConfigured: (s) => !!s.openai?.apiKey
  },
  together: {
    displayName: "Together AI",
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    apiConfigured: (s) => !!s.together?.apiKey
  },
  openrouter: {
    displayName: "OpenRouter",
    model: "google/gemma-3-27b-it:free",
    apiConfigured: (s) => !!s.openrouter?.apiKey
  },
  anthropic: {
    displayName: "Anthropic",
    model: "claude-sonnet-4.6",
    apiConfigured: (s) => !!s.anthropic?.apiKey
  },
  minimax: {
    displayName: "MiniMax",
    model: "MiniMax-M2",
    apiConfigured: (s) => !!s.minimax?.apiKey
  },
  copilot: {
    displayName: "GitHub Copilot",
    model: "gpt-5.5-instant",
    apiConfigured: () => true
  },
  deepseek: {
    displayName: "DeepSeek",
    model: "deepseek-v4-flash",
    apiConfigured: (s) => !!s.deepseek?.apiKey
  },
  grok: {
    displayName: "Grok",
    model: "grok-4.4",
    apiConfigured: (s) => !!s.grok?.apiKey
  },
  groq: {
    displayName: "Groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    apiConfigured: (s) => !!s.groq?.apiKey
  },
  perplexity: {
    displayName: "Perplexity",
    model: "gpt-5.5-computer",
    apiConfigured: (s) => !!s.perplexity?.apiKey
  },
  zai: {
    displayName: "Z.ai",
    model: "glm-4.5-flash",
    apiConfigured: (s) => !!s.zai?.apiKey
  },
  custom: {
    displayName: "Custom API",
    model: "Not configured",
    apiConfigured: (s) => !!(s.custom?.baseUrl && s.custom?.endpoint)
  }
};

const PROVIDERS = Object.keys(PROVIDER_DISPLAY_CONFIG);

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
          <svg class="provider-icon" width="\${size}" height="\${size}" viewBox="0 0 24 24" 
               fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="\${iconPath}" />
          </svg>
        \`;
      }
    };
  `;

  return `
    ${providerIconString}
    
    const PROVIDER_DISPLAY_CONFIG = ${JSON.stringify(PROVIDER_DISPLAY_CONFIG)};
    const PROVIDERS = ${JSON.stringify(PROVIDERS)};
    
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
      const config = PROVIDER_DISPLAY_CONFIG[provider];
      if (!config) return { displayName: provider, model: '', apiConfigured: false };
      
      const providerSettings = settings[provider];
      const model = providerSettings?.model || config.model;
      const apiConfigured = config.apiConfigured(settings);
      
      return {
        displayName: config.displayName,
        model: model,
        apiConfigured: apiConfigured
      };
    }
    
    // Make StatusBanner available globally for dynamic updates
    window.StatusBanner = function(settings) {
      this._settings = settings;
      
      const PROVIDER_CONFIGS = {
        gemini: { displayName: "Gemini", defaultModel: "gemini-2.5-flash-preview-04-17", getApiConfigured: (s) => !!s.gemini?.apiKey },
        huggingface: { displayName: "Hugging Face", defaultModel: "Not configured", getApiConfigured: (s) => !!s.huggingface?.apiKey },
        ollama: { displayName: "Ollama", defaultModel: "Not configured", getApiConfigured: (s) => !!s.ollama?.url },
        mistral: { displayName: "Mistral", defaultModel: "mistral-small-4", getApiConfigured: (s) => !!s.mistral?.apiKey },
        cohere: { displayName: "Cohere", defaultModel: "command-a-03-2025", getApiConfigured: (s) => !!s.cohere?.apiKey },
        openai: { displayName: "OpenAI", defaultModel: "gpt-3.5-turbo", getApiConfigured: (s) => !!s.openai?.apiKey },
        together: { displayName: "Together AI", defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo", getApiConfigured: (s) => !!s.together?.apiKey },
        openrouter: { displayName: "OpenRouter", defaultModel: "google/gemma-3-27b-it:free", getApiConfigured: (s) => !!s.openrouter?.apiKey },
        anthropic: { displayName: "Anthropic", defaultModel: "claude-sonnet-4.6", getApiConfigured: (s) => !!s.anthropic?.apiKey },
        minimax: { displayName: "MiniMax", defaultModel: "MiniMax-M2", getApiConfigured: (s) => !!s.minimax?.apiKey },
        copilot: { displayName: "GitHub Copilot", defaultModel: "gpt-5.5-instant", getApiConfigured: () => true },
        deepseek: { displayName: "DeepSeek", defaultModel: "deepseek-v4-flash", getApiConfigured: (s) => !!s.deepseek?.apiKey },
        grok: { displayName: "Grok", defaultModel: "grok-4.4", getApiConfigured: (s) => !!s.grok?.apiKey },
        groq: { displayName: "Groq", defaultModel: "meta-llama/llama-4-scout-17b-16e-instruct", getApiConfigured: (s) => !!s.groq?.apiKey },
        perplexity: { displayName: "Perplexity", defaultModel: "gpt-5.5-computer", getApiConfigured: (s) => !!s.perplexity?.apiKey },
        zai: { displayName: "Z.ai", defaultModel: "glm-4.5-flash", getApiConfigured: (s) => !!s.zai?.apiKey },
        custom: { displayName: "Custom API", defaultModel: "Not configured", getApiConfigured: (s) => !!(s.custom?.baseUrl && s.custom?.endpoint) }
      };
      
      this.getProviderInfo = function() {
        const provider = this._settings.apiProvider;
        const config = PROVIDER_CONFIGS[provider];

        if (!config) {
          return { displayName: provider, model: "Unknown", apiConfigured: false };
        }

        const providerSettings = this._settings[provider];
        const model = providerSettings?.model || config.defaultModel;
        const apiConfigured = config.getApiConfigured(this._settings);

        return { displayName: config.displayName, model, apiConfigured };
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
        const analytics = this._settings.telemetry?.enabled !== false ? 'Enabled' : 'Disabled';
        const activeStyle = this._settings.commitStyle?.style || 'basic';
        const historyLearning = this._settings.pro?.learnFromCommitHistory?.enabled ? 'Active' : 'Off';
        const encryption = this._settings.pro?.encryptionEnabled ? 'Encrypted' : 'Off';

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
                  \${this.renderChip('Analytics', analytics, this._settings.telemetry?.enabled !== false ? 'on' : 'off', this._settings.telemetry?.enabled === false)}
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
  `;
}