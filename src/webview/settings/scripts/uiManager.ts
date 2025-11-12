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
    model: "mistral-large-latest",
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
    model: "claude-3-5-sonnet-20241022",
    apiConfigured: (s) => !!s.anthropic?.apiKey
  },
  copilot: {
    displayName: "GitHub Copilot",
    model: "gpt-4o",
    apiConfigured: () => true
  },
  deepseek: {
    displayName: "DeepSeek",
    model: "deepseek-chat",
    apiConfigured: (s) => !!s.deepseek?.apiKey
  },
  grok: {
    displayName: "Grok",
    model: "grok-3",
    apiConfigured: (s) => !!s.grok?.apiKey
  },
  perplexity: {
    displayName: "Perplexity",
    model: "sonar-pro",
    apiConfigured: (s) => !!s.perplexity?.apiKey
  },
  custom: {
    displayName: "Custom API",
    model: "Custom",
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
        mistral: { displayName: "Mistral", defaultModel: "mistral-large-latest", getApiConfigured: (s) => !!s.mistral?.apiKey },
        cohere: { displayName: "Cohere", defaultModel: "command-a-03-2025", getApiConfigured: (s) => !!s.cohere?.apiKey },
        openai: { displayName: "OpenAI", defaultModel: "gpt-3.5-turbo", getApiConfigured: (s) => !!s.openai?.apiKey },
        together: { displayName: "Together AI", defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo", getApiConfigured: (s) => !!s.together?.apiKey },
        openrouter: { displayName: "OpenRouter", defaultModel: "google/gemma-3-27b-it:free", getApiConfigured: (s) => !!s.openrouter?.apiKey },
        anthropic: { displayName: "Anthropic", defaultModel: "claude-3-5-sonnet-20241022", getApiConfigured: (s) => !!s.anthropic?.apiKey },
        copilot: { displayName: "GitHub Copilot", defaultModel: "gpt-4o", getApiConfigured: () => true },
        deepseek: { displayName: "DeepSeek", defaultModel: "deepseek-chat", getApiConfigured: (s) => !!s.deepseek?.apiKey },
        grok: { displayName: "Grok", defaultModel: "grok-3", getApiConfigured: (s) => !!s.grok?.apiKey },
        perplexity: { displayName: "Perplexity", defaultModel: "sonar-pro", getApiConfigured: (s) => !!s.perplexity?.apiKey }
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
      
      this.renderStatusItem = function(label, value, className) {
        const valueClass = className ? \` class="\${className}"\` : '';
        return \`
          <div class="status-item">
            <span class="status-label">\${label}</span>
            <span class="status-value"\${valueClass}>\${value}</span>
          </div>
        \`;
      };
      
      this.render = function() {
        const providerInfo = this.getProviderInfo();
        const provider = this._settings.apiProvider;
        const hasSubscriptionEmail = !!this._settings.subscription?.email && this._settings.subscription.email.length > 0;
        const isActiveSubscription = this._settings.subscription?.status === 'active';
        const devModeEnabled = typeof window !== 'undefined' && window.GITMIND_DEV_MODE === true;
        const isProUser = (hasSubscriptionEmail && isActiveSubscription) || devModeEnabled;

        const statusItems = [
          this.renderStatusItem('Active Provider', \`<span class="status-badge \${provider}">\${providerInfo.displayName}</span>\`),
          this.renderStatusItem('User Type', \`<span class="user-type-badge \${isProUser ? 'pro-user' : 'free-user'}">\${isProUser ? 'Pro' : 'Free'}</span>\`),
          this.renderStatusItem('API Status', providerInfo.apiConfigured ? 'Configured' : 'Not Configured'),
          this.renderStatusItem('Commit Style', this._settings.commit?.verbose ? 'Verbose' : 'Concise'),
          this.renderStatusItem('Prompt Customization', this._settings.promptCustomization?.enabled ? 'Enabled' : 'Disabled'),
          this.renderStatusItem('Anonymous Analytics', 
            this._settings.telemetry?.enabled !== false ? 'Enabled' : 'Disabled',
            this._settings.telemetry?.enabled !== false ? 'telemetry-enabled' : 'telemetry-disabled')
        ];

        const renderProviderIcon = (provider, size = 40) => 
          window.ProviderIcon ? window.ProviderIcon.renderIcon(provider, size) : '';

        return \`
          <div class="status-banner">
            <div class="status-banner-header">
              \${renderProviderIcon(provider, 32)}
              <div class="status-banner-title">
                <h3>Current Configuration</h3>
                <span class="status-provider-name">\${providerInfo.displayName}</span>
              </div>
              \${isProUser ? '<div class="pro-badge-container"><span class="pro-badge-banner">PRO</span></div>' : ''}
            </div>
            <div class="model-section">
              <div class="model-item">
                <span class="model-label">Current Model</span>
                <span class="model-value">\${providerInfo.model}</span>
              </div>
            </div>
            <div class="status-grid">
              \${statusItems.join('')}
            </div>
          </div>
          
          <style>
            .user-type-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 16px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              transition: all 0.2s ease;
            }
            
            .user-type-badge:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }
            
            .user-type-badge.free-user {
              background: linear-gradient(135deg, #6b7280, #4b5563);
              color: #f9fafb;
            }
            
            .user-type-badge.pro-user {
              background: linear-gradient(135deg, #ffd700, #ffb700);
              color: #1f2937;
              box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
            }
            
            .pro-badge-banner {
              background: linear-gradient(135deg, #ffd700, #ffb700);
              color: #1f2937;
              padding: 6px 12px;
              border-radius: 6px;
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
              transition: all 0.2s ease;
            }
            
            .pro-badge-banner:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
            }
            
            .pro-badge-container {
              margin-left: auto;
            }
            
            .status-banner-header {
              display: flex;
              align-items: center;
            }
          </style>
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
    
    // Initialize UI
    updateVisibleSettings();
    document.getElementById('apiProvider')?.addEventListener('change', updateVisibleSettings);
    
    // Setup auto-loading for providers that support it
    setupApiKeyAutoLoading('mistral', 'gitmind.loadMistralModels');
    setupApiKeyAutoLoading('cohere', 'gitmind.loadCohereModels');
    setupApiKeyAutoLoading('together', 'gitmind.loadTogetherModels');
    setupApiKeyAutoLoading('openrouter', 'gitmind.loadOpenRouterModels');
    setupApiKeyAutoLoading('grok', 'gitmind.loadGrokModels');
    setupApiKeyAutoLoading('gemini', 'gitmind.loadGeminiModels');
    setupApiKeyAutoLoading('anthropic', 'gitmind.loadAnthropicModels');
    setupApiKeyAutoLoading('huggingface', 'gitmind.loadHuggingFaceModels');
  `;
}