// src/webview/settings/scripts/apiManager.ts

interface ProviderConfig {
  apiKey?: boolean;
  url?: boolean;
  model?: boolean;
  displayName: string;
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  gemini: { apiKey: true, model: false, displayName: 'Gemini' },
  huggingface: { apiKey: true, model: true, displayName: 'Hugging Face' },
  ollama: { url: true, model: true, displayName: 'Ollama' },
  mistral: { apiKey: true, model: false, displayName: 'Mistral' },
  cohere: { apiKey: true, model: false, displayName: 'Cohere' },
  openai: { apiKey: true, model: false, displayName: 'OpenAI' },
  together: { apiKey: true, model: false, displayName: 'Together AI' },
  openrouter: { apiKey: true, model: false, displayName: 'OpenRouter' },
  anthropic: { apiKey: true, model: false, displayName: 'Anthropic' },
  copilot: { model: true, displayName: 'GitHub Copilot' },
  deepseek: { apiKey: true, model: false, displayName: 'DeepSeek' },
  grok: { apiKey: true, model: false, displayName: 'Grok' },
  perplexity: { apiKey: true, model: false, displayName: 'Perplexity' }
};

export function getApiManagerScript(): string {
  return `
    const PROVIDER_CONFIGS = ${JSON.stringify(PROVIDER_CONFIGS)};
    
    function getProviderSettings(provider) {
      const config = PROVIDER_CONFIGS[provider];
      if (!config) return {};
      
      const settings = {};
      
      if (config.apiKey) {
        const element = document.getElementById(provider + 'ApiKey');
        if (element) settings.apiKey = element.value;
      }
      
      if (config.url) {
        const element = document.getElementById(provider + 'Url');
        if (element) settings.url = element.value;
      }
      
      if (config.model) {
        const element = document.getElementById(provider + 'Model');
        if (element) settings.model = element.value;
      }
      
      return settings;
    }
    
    function validateProviderSettings(provider, settings) {
      const config = PROVIDER_CONFIGS[provider];
      if (!config) return [];
      
      const missingFields = [];
      
      if (config.apiKey && !settings.apiKey) {
        missingFields.push(config.displayName + ' API Key');
      }
      
      if (config.url && !settings.url) {
        missingFields.push(config.displayName + ' URL');
      }
      
      if (config.model && !settings.model) {
        missingFields.push(config.displayName + ' Model');
      }
      
      return missingFields;
    }
    
    function createStatusDialog(dialogId, title, provider, action) {
      let dialog = document.getElementById(dialogId);
      
      if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = dialogId;
        dialog.className = 'status-dialog';
        dialog.innerHTML = \`
          <div class="status-dialog-content">
            <div class="status-dialog-header">
              <h3>\${title}</h3>
              <button class="close-button" onclick="closeStatusDialog('\${dialogId}')">×</button>
            </div>
            <div class="status-dialog-body">
              <div class="status-spinner"></div>
              <div id="\${dialogId}Message">\${action} \${getProviderDisplayName(provider)}...</div>
              <div id="\${dialogId}Details" class="status-details"></div>
            </div>
          </div>
        \`;
        document.body.appendChild(dialog);
      } else {
        const messageEl = document.getElementById(dialogId + 'Message');
        const detailsEl = document.getElementById(dialogId + 'Details');
        
        if (messageEl) messageEl.textContent = \`\${action} \${getProviderDisplayName(provider)}...\`;
        if (detailsEl) {
          detailsEl.innerHTML = '';
          detailsEl.className = 'status-details';
        }
        
        const spinner = dialog.querySelector('.status-spinner');
        if (spinner) spinner.style.display = 'inline-block';
      }
      
      dialog.style.display = 'flex';
      return dialog;
    }
    
    function updateStatusDialog(dialogId, success, message, details) {
      const dialog = document.getElementById(dialogId);
      if (!dialog) return;
      
      const messageEl = document.getElementById(dialogId + 'Message');
      const detailsEl = document.getElementById(dialogId + 'Details');
      const spinner = dialog.querySelector('.status-spinner');
      
      if (spinner) spinner.style.display = 'none';
      
      if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = success ? 'status-success' : 'status-error';
      }
      
      if (detailsEl && details) {
        detailsEl.innerHTML = details;
        detailsEl.className = success ? 'status-details success' : 'status-details error';
      }
    }
    
    // Listen for messages from the extension
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.type) {
        case 'apiCheckResult':
          // For API checks, use the proper handler that formats the data correctly
          if (typeof handleApiCheckResult === 'function') {
            handleApiCheckResult(message);
          } else {
            updateStatusDialog('apiStatusDialog', message.success, 
              message.success ? 'Connection successful!' : 'Connection failed!', 
              message.details || message.error);
          }
          break;
          
        case 'rateLimitsResult':
          // For rate limits, use the proper handler that formats the data correctly
          if (typeof handleRateLimitsResult === 'function') {
            handleRateLimitsResult(message);
          } else {
            updateStatusDialog('rateLimitsDialog', message.success, 
              message.success ? 'Rate limits retrieved!' : 'Failed to get rate limits!', 
              message.details || message.error);
          }
          break;
      }
    });
    
    function checkApiSetup() {
      const provider = document.getElementById('apiProvider').value;
      const apiSettings = getProviderSettings(provider);
      const missingFields = validateProviderSettings(provider, apiSettings);
      
      if (missingFields.length > 0) {
        showToast('Missing required fields: ' + missingFields.join(', '), 'error');
        return;
      }
      
      createStatusDialog('apiStatusDialog', 'API Connection Status', provider, 'Testing connection to');
      
      vscode.postMessage({
        command: 'executeCommand',
        commandId: 'ai-commit-assistant.checkApiSetup'
      });
    }
    
    function checkRateLimits() {
      const provider = document.getElementById('apiProvider').value;
      const apiSettings = getProviderSettings(provider);
      
      // For rate limits, we only need API keys (not URLs or models)
      const missingFields = [];
      const config = PROVIDER_CONFIGS[provider];
      
      if (config && config.apiKey && !apiSettings.apiKey) {
        missingFields.push(config.displayName + ' API Key');
      }
      
      if (missingFields.length > 0) {
        showToast('Missing required fields: ' + missingFields.join(', '), 'error');
        return;
      }
      
      createStatusDialog('rateLimitsDialog', 'Rate Limits Status', provider, 'Checking rate limits for');
      
      vscode.postMessage({
        command: 'executeCommand',
        commandId: 'ai-commit-assistant.checkRateLimits'
      });
    }
    
    function getProviderDisplayName(provider) {
      const config = PROVIDER_CONFIGS[provider];
      return config ? config.displayName : provider;
    }
    
    function closeStatusDialog(dialogId) {
      const dialog = document.getElementById(dialogId);
      if (dialog) {
        dialog.style.display = 'none';
      }
    }
    
    // Expose functions globally for onclick handlers
    window.checkApiSetup = checkApiSetup;
    window.checkRateLimits = checkRateLimits;
    window.closeStatusDialog = closeStatusDialog;
  `;
}