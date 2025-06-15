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
        apiKeyElement.addEventListener('change', function() {
          const apiKey = this.value.trim();
          if (apiKey && apiKey.length > 10) {
            vscode.postMessage({
              command: 'executeCommand',
              commandId: commandId
            });
          }
        });
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
    
    function updateStatusBanner(settings) {
      const provider = settings.apiProvider;
      const providerInfo = getProviderInfo(provider, settings);
      
      const renderProviderIcon = (provider, size = 32) => 
        window.ProviderIcon ? window.ProviderIcon.renderIcon(provider, size) : '';
      
      const bannerHTML = \`
        <div class="status-banner">
          <div class="status-banner-header">
            \${renderProviderIcon(provider, 40)}
            <div class="status-banner-title">
              <h3>Current Configuration</h3>
              <span class="status-provider-name">\${providerInfo.displayName}</span>
            </div>
          </div>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">Active Provider</span>
              <span class="status-value">
                <span class="status-badge \${provider}">\${providerInfo.displayName}</span>
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">Model</span>
              <span class="status-value">\${providerInfo.model}</span>
            </div>
            <div class="status-item">
              <span class="status-label">API Status</span>
              <span class="status-value">\${providerInfo.apiConfigured ? "Configured" : "Not Configured"}</span>
            </div>
            <div class="status-item">
              <span class="status-label">Commit Style</span>
              <span class="status-value">\${settings.commit?.verbose ? "Verbose" : "Concise"}</span>
            </div>
          </div>
        </div>
      \`;
      
      const container = document.getElementById('statusBannerContainer');
      if (container) {
        container.innerHTML = bannerHTML;
        const banner = container.firstElementChild;
        if (banner) {
          banner.classList.add('banner-updated');
          setTimeout(() => banner.classList.remove('banner-updated'), 1000);
        }
      }
    }
    
    // Initialize UI
    updateVisibleSettings();
    document.getElementById('apiProvider')?.addEventListener('change', updateVisibleSettings);
    
    // Setup auto-loading for providers that support it
    setupApiKeyAutoLoading('mistral', 'ai-commit-assistant.loadMistralModels');
    setupApiKeyAutoLoading('huggingface', 'ai-commit-assistant.loadHuggingFaceModels');
  `;
}