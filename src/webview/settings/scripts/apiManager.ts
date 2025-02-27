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
        }
        
        // Send message to extension
        vscode.postMessage({
          command: 'checkApiSetup',
          provider: provider,
          settings: apiSettings
        });
        
        showToast('Checking API connection...', 'info');
      }
      
      // Check rate limits
      function checkRateLimits() {
        const provider = document.getElementById('apiProvider').value;
        
        // Send message to extension
        vscode.postMessage({
          command: 'checkRateLimits',
          provider: provider
        });
        
        showToast('Checking rate limits...', 'info');
      }
    `;
}
