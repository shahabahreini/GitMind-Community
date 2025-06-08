// src/webview/settings/scripts/apiManager.ts
export function getApiManagerScript(): string {
  return `
    // Check API setup
    function checkApiSetup() {
      const provider = document.getElementById('apiProvider').value;
      
      // Collect relevant settings based on provider
      let apiSettings = {};
      
      if (provider === 'gemini') {
        apiSettings = {
          apiKey: document.getElementById('geminiApiKey').value,
          model: document.getElementById('geminiModel').value
        };
      } else if (provider === 'huggingface') {
        apiSettings = {
          apiKey: document.getElementById('huggingfaceApiKey').value,
          model: document.getElementById('huggingfaceModel').value
        };
      } else if (provider === 'ollama') {
        apiSettings = {
          url: document.getElementById('ollamaUrl').value,
          model: document.getElementById('ollamaModel').value
        };
      } else if (provider === 'mistral') {
        apiSettings = {
          apiKey: document.getElementById('mistralApiKey').value,
          model: document.getElementById('mistralModel').value
        };
      } else if (provider === 'cohere') {
        apiSettings = {
          apiKey: document.getElementById('cohereApiKey').value,
          model: document.getElementById('cohereModel').value
        };
      } else if (provider === 'copilot') {
        apiSettings = {
          model: document.getElementById('copilotModel').value
        };
      } else if (provider === 'deepseek') {
        apiSettings = {
          apiKey: document.getElementById('deepseekApiKey').value,
          model: document.getElementById('deepseekModel').value
        };
      }
      
      // Validate required fields before sending
      let missingFields = [];
      
      if (provider === 'gemini' && !apiSettings.apiKey) {
        missingFields.push('Gemini API Key');
      } else if (provider === 'huggingface') {
        if (!apiSettings.apiKey) missingFields.push('Hugging Face API Key');
        if (!apiSettings.model) missingFields.push('Hugging Face Model');
      } else if (provider === 'ollama') {
        if (!apiSettings.url) missingFields.push('Ollama URL');
        if (!apiSettings.model) missingFields.push('Ollama Model');
      } else if (provider === 'mistral' && !apiSettings.apiKey) {
        missingFields.push('Mistral API Key');
      } else if (provider === 'cohere' && !apiSettings.apiKey) {
        missingFields.push('Cohere API Key');
      } else if (provider === 'copilot' && !apiSettings.model) {
        missingFields.push('Copilot Model');
      } else if (provider === 'deepseek' && !apiSettings.apiKey) {
        missingFields.push('DeepSeek API Key');
      }
      
      if (missingFields.length > 0) {
        showToast('Missing required fields: ' + missingFields.join(', '), 'error');
        return;
      }
      
      // Create and show a detailed status dialog
      const dialogId = 'apiStatusDialog';
      let dialog = document.getElementById(dialogId);
      
      if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = dialogId;
        dialog.className = 'status-dialog';
        dialog.innerHTML = \`
          <div class="status-dialog-content">
            <div class="status-dialog-header">
              <h3>API Connection Status</h3>
              <button class="close-button" onclick="closeStatusDialog('apiStatusDialog')">×</button>
            </div>
            <div class="status-dialog-body">
              <div class="status-spinner"></div>
              <div id="apiStatusMessage">Testing connection to \${getProviderDisplayName(provider)}...</div>
              <div id="apiStatusDetails" class="status-details"></div>
            </div>
          </div>
        \`;
        document.body.appendChild(dialog);
      } else {
        document.getElementById('apiStatusMessage').textContent = \`Testing connection to \${getProviderDisplayName(provider)}...\`;
        document.getElementById('apiStatusDetails').innerHTML = '';
        document.getElementById('apiStatusDetails').className = 'status-details';
        // Make sure spinner is visible
        const spinner = dialog.querySelector('.status-spinner');
        if (spinner) {
          spinner.style.display = 'inline-block';
        }
      }
      
      dialog.style.display = 'flex';
      
      // Send message to extension to execute the command
      vscode.postMessage({
        command: 'executeCommand',
        commandId: 'ai-commit-assistant.checkApiSetup'
      });
    }
    
    // Check rate limits
    function checkRateLimits() {
      const provider = document.getElementById('apiProvider').value;
      
      // Validate that we have the necessary API keys/settings
      let apiSettings = {};
      let missingFields = [];
      
      if (provider === 'gemini') {
        apiSettings.apiKey = document.getElementById('geminiApiKey').value;
        if (!apiSettings.apiKey) missingFields.push('Gemini API Key');
      } else if (provider === 'huggingface') {
        apiSettings.apiKey = document.getElementById('huggingfaceApiKey').value;
        if (!apiSettings.apiKey) missingFields.push('Hugging Face API Key');
      } else if (provider === 'ollama') {
        apiSettings.url = document.getElementById('ollamaUrl').value;
        if (!apiSettings.url) missingFields.push('Ollama URL');
      } else if (provider === 'mistral') {
        apiSettings.apiKey = document.getElementById('mistralApiKey').value;
        if (!apiSettings.apiKey) missingFields.push('Mistral API Key');
      } else if (provider === 'cohere') {
        apiSettings.apiKey = document.getElementById('cohereApiKey').value;
        if (!apiSettings.apiKey) missingFields.push('Cohere API Key');
      } else if (provider === 'copilot') {
        // Copilot doesn't require API key validation in the UI
        // The validation happens through VS Code's built-in authentication
      } else if (provider === 'deepseek') {
        apiSettings.apiKey = document.getElementById('deepseekApiKey').value;
        if (!apiSettings.apiKey) missingFields.push('DeepSeek API Key');
      }
      
      if (missingFields.length > 0) {
        showToast('Missing required fields: ' + missingFields.join(', '), 'error');
        return;
      }
      
      // Create and show a detailed status dialog
      const dialogId = 'rateLimitsDialog';
      let dialog = document.getElementById(dialogId);
      
      if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = dialogId;
        dialog.className = 'status-dialog';
        dialog.innerHTML = \`
          <div class="status-dialog-content">
            <div class="status-dialog-header">
              <h3>Rate Limits Status</h3>
              <button class="close-button" onclick="closeStatusDialog('rateLimitsDialog')">×</button>
            </div>
            <div class="status-dialog-body">
              <div class="status-spinner"></div>
              <div id="rateLimitsMessage">Checking rate limits for \${getProviderDisplayName(provider)}...</div>
              <div id="rateLimitsDetails" class="status-details"></div>
            </div>
          </div>
        \`;
        document.body.appendChild(dialog);
      } else {
        document.getElementById('rateLimitsMessage').textContent = \`Checking rate limits for \${getProviderDisplayName(provider)}...\`;
        document.getElementById('rateLimitsDetails').innerHTML = '';
        document.getElementById('rateLimitsDetails').className = 'status-details';
        // Make sure spinner is visible
        const spinner = dialog.querySelector('.status-spinner');
        if (spinner) {
          spinner.style.display = 'inline-block';
        }
      }
      
      dialog.style.display = 'flex';
      
      // Send message to extension to execute the command
      vscode.postMessage({
        command: 'executeCommand',
        commandId: 'ai-commit-assistant.checkRateLimits'
      });
    }
    
    // Helper function to get display name for provider
    function getProviderDisplayName(provider) {
      const displayNames = {
        'gemini': 'Gemini',
        'huggingface': 'Hugging Face',
        'ollama': 'Ollama',
        'mistral': 'Mistral',
        'cohere': 'Cohere',
        'copilot': 'GitHub Copilot',
        'deepseek': 'DeepSeek'
      };
      
      return displayNames[provider] || provider;
    }
    
    // Close status dialog
    function closeStatusDialog(dialogId) {
      const dialog = document.getElementById(dialogId);
      if (dialog) {
        dialog.style.display = 'none';
      }
    }
  `;
}
