// src/webview/settings/scripts/uiManager.ts
import { ProviderIcon } from '../components/ProviderIcon';

export function getUiManagerScript(): string {
  // Inject the ProviderIcon into the script to make it available on window
  const providerIconString = `
    // Injected ProviderIcon
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
      },
      getIconStyles: function() {
        return \`
          .provider-icon {
            flex-shrink: 0;
            display: block;
            border-radius: 8px;
          }
        \`;
      }
    };
  `;

  return `
      ${providerIconString}
      
      // Show/hide sections based on selected provider
      function updateVisibleSettings() {
        const provider = document.getElementById('apiProvider').value;
        document.getElementById('geminiSettings').style.display =
          provider === 'gemini' ? 'block' : 'none';
        document.getElementById('huggingfaceSettings').style.display =
          provider === 'huggingface' ? 'block' : 'none';
        document.getElementById('ollamaSettings').style.display =
          provider === 'ollama' ? 'block' : 'none';
        document.getElementById('mistralSettings').style.display =
          provider === 'mistral' ? 'block' : 'none';
        document.getElementById('cohereSettings').style.display =
          provider === 'cohere' ? 'block' : 'none';
        document.getElementById('openaiSettings').style.display =
          provider === 'openai' ? 'block' : 'none';
        document.getElementById('togetherSettings').style.display =
          provider === 'together' ? 'block' : 'none';
        document.getElementById('openrouterSettings').style.display =
          provider === 'openrouter' ? 'block' : 'none';
        document.getElementById('anthropicSettings').style.display =
          provider === 'anthropic' ? 'block' : 'none';
        document.getElementById('copilotSettings').style.display =
          provider === 'copilot' ? 'block' : 'none';
        document.getElementById('deepseekSettings').style.display =
          provider === 'deepseek' ? 'block' : 'none';
        document.getElementById('grokSettings').style.display =
          provider === 'grok' ? 'block' : 'none';
        document.getElementById('perplexitySettings').style.display =
          provider === 'perplexity' ? 'block' : 'none';
      }
      
      // Initialize UI state immediately
      updateVisibleSettings();
      
      // Add event listener for future changes
      document.getElementById('apiProvider').addEventListener('change', updateVisibleSettings);
      
      // Add event listener for API key change
      document.getElementById('mistralApiKey').addEventListener('change', function() {
        const apiKey = this.value.trim();
        if (apiKey && apiKey.length > 10) {
          // If we have what looks like a valid API key, try loading models
          vscode.postMessage({
            command: 'executeCommand',
            commandId: 'ai-commit-assistant.loadMistralModels'
          });
        }
      });

      // Add event listener for Hugging Face API key change
      document.getElementById('huggingfaceApiKey').addEventListener('change', function() {
        const apiKey = this.value.trim();
        if (apiKey && apiKey.length > 10) {
          // If we have what looks like a valid API key, try loading models
          vscode.postMessage({
            command: 'executeCommand',
            commandId: 'ai-commit-assistant.loadHuggingFaceModels'
          });
        }
      });

      // Toast notification system
      function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast';
        toast.classList.add(type);
        toast.classList.add('show');
        
        setTimeout(() => {
          toast.classList.remove('show');
        }, 3000);
      }
      
      // Update status banner with new settings
      function updateStatusBanner(settings) {
        // Get provider-specific model info
        let modelInfo = "";
        
        // Use ProviderIcon.renderIcon to render provider icons
        function renderProviderIcon(provider, size = 32) {
          return window.ProviderIcon ? window.ProviderIcon.renderIcon(provider, size) : '';
        }
        switch (settings.apiProvider) {
          case "gemini":
            modelInfo = settings.gemini.model || "gemini-2.5-flash-preview-04-17";
            break;
          case "huggingface":
            modelInfo = settings.huggingface.model || "Not configured";
            break;
          case "ollama":
            modelInfo = settings.ollama.model || "Not configured";
            break;
          case "mistral":
            modelInfo = settings.mistral.model || "mistral-large-latest";
            break;
          case "cohere":
            modelInfo = settings.cohere.model || "command-a-03-2025";
            break;
          case "openai":
            modelInfo = settings.openai.model || "gpt-4o";
            break;
          case "together":
            modelInfo = settings.together.model || "meta-llama/Llama-3.3-70B-Instruct-Turbo";
            break;
          case "openrouter":
            modelInfo = settings.openrouter.model || "google/gemma-3-27b-it:free";
            break;
          case "anthropic":
            modelInfo = settings.anthropic.model || "claude-3-5-sonnet-20241022";
            break;
          case "copilot":
            modelInfo = settings.copilot.model || "gpt-4o";
            break;
          case "deepseek":
            modelInfo = settings.deepseek.model || "deepseek-chat";
            break;
          case "grok":
            modelInfo = settings.grok?.model || "grok-3";
            break;
          case "perplexity":
            modelInfo = settings.perplexity?.model || "sonar-pro";
            break;
        }
        
        // Get API configuration status
        let apiConfigured = false;
        switch (settings.apiProvider) {
          case "gemini":
            apiConfigured = !!settings.gemini.apiKey;
            break;
          case "huggingface":
            apiConfigured = !!settings.huggingface.apiKey;
            break;
          case "ollama":
            apiConfigured = !!settings.ollama.url;
            break;
          case "mistral":
            apiConfigured = !!settings.mistral.apiKey;
            break;
          case "cohere":
            apiConfigured = !!settings.cohere.apiKey;
            break;
          case "openai":
            apiConfigured = !!settings.openai.apiKey;
            break;
          case "together":
            apiConfigured = !!settings.together.apiKey;
            break;
          case "openrouter":
            apiConfigured = !!settings.openrouter.apiKey;
            break;
          case "anthropic":
            apiConfigured = !!settings.anthropic.apiKey;
            break;
          case "copilot":
            apiConfigured = true; // Copilot authentication is handled by VS Code
            break;
          case "deepseek":
            apiConfigured = !!settings.deepseek.apiKey;
            break;
          case "grok":
            apiConfigured = !!settings.grok?.apiKey;
            break;
          case "perplexity":
            apiConfigured = !!settings.perplexity?.apiKey;
            break;
        }
        
        // Format provider name for display
        const providerDisplay = {
          gemini: "Gemini",
          huggingface: "Hugging Face",
          ollama: "Ollama",
          mistral: "Mistral",
          cohere: "Cohere",
          openai: "OpenAI",
          together: "Together AI",
          openrouter: "OpenRouter",
          anthropic: "Anthropic",
          copilot: "GitHub Copilot",
          deepseek: "DeepSeek",
          grok: "Grok",
          perplexity: "Perplexity"
        }[settings.apiProvider] || settings.apiProvider;
        
        const bannerHTML = \`
          <div class="status-banner">
            <div class="status-banner-header">
              \${renderProviderIcon(settings.apiProvider, 40)}
              <div class="status-banner-title">
                <h3>Current Configuration</h3>
                <span class="status-provider-name">\${providerDisplay}</span>
              </div>
            </div>
            <div class="status-grid">
              <div class="status-item">
                <span class="status-label">Active Provider</span>
                <span class="status-value">
                  <span class="status-badge \${settings.apiProvider}">\${providerDisplay}</span>
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">Model</span>
                <span class="status-value">\${modelInfo}</span>
              </div>
              <div class="status-item">
                <span class="status-label">API Status</span>
                <span class="status-value">\${apiConfigured ? "Configured" : "Not Configured"}</span>
              </div>
              <div class="status-item">
                <span class="status-label">Commit Style</span>
                <span class="status-value">\${settings.commit?.verbose ? "Verbose" : "Concise"}</span>
              </div>
            </div>
          </div>
        \`;
        
        const container = document.getElementById('statusBannerContainer');
        container.innerHTML = bannerHTML;
        container.firstElementChild.classList.add('banner-updated');
        
        // Remove animation class after animation completes
        setTimeout(() => {
          const banner = container.firstElementChild;
          if (banner) {
            banner.classList.remove('banner-updated');
          }
        }, 1000);
      }
    `;
}