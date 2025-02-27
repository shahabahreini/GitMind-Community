// src/webview/settings/scripts/settingsManager.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { getApiManagerScript } from "./apiManager";
import { getUiManagerScript } from "./uiManager";

export function getSettingsScript(settings: ExtensionSettings, nonce: string): string {
    return `
  <div id="toast" class="toast"></div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let currentSettings = ${JSON.stringify(settings)};
    
    // Initialize form with current settings
    document.getElementById('apiProvider').value = currentSettings.apiProvider || 'huggingface';
    document.getElementById('commitVerbose').checked = currentSettings.commit?.verbose ?? true;
    document.getElementById('geminiApiKey').value = currentSettings.gemini?.apiKey || '';
    document.getElementById('geminiModel').value = currentSettings.gemini?.model || 'gemini-2.0-flash';
    document.getElementById('huggingfaceApiKey').value = currentSettings.huggingface?.apiKey || '';
    document.getElementById('huggingfaceModel').value = currentSettings.huggingface?.model || '';
    document.getElementById('ollamaUrl').value = currentSettings.ollama?.url || '';
    document.getElementById('ollamaModel').value = currentSettings.ollama?.model || '';
    document.getElementById('mistralApiKey').value = currentSettings.mistral?.apiKey || '';
    document.getElementById('mistralModel').value = currentSettings.mistral?.model || 'mistral-large-latest';
    
    ${getUiManagerScript()}
    ${getApiManagerScript()}
    
    // Save settings
    function saveSettings() {
      const newSettings = {
        apiProvider: document.getElementById('apiProvider').value,
        debug: currentSettings.debug,
        gemini: {
          apiKey: document.getElementById('geminiApiKey').value,
          model: document.getElementById('geminiModel').value
        },
        huggingface: {
          apiKey: document.getElementById('huggingfaceApiKey').value,
          model: document.getElementById('huggingfaceModel').value
        },
        ollama: {
          url: document.getElementById('ollamaUrl').value,
          model: document.getElementById('ollamaModel').value
        },
        mistral: {
          apiKey: document.getElementById('mistralApiKey').value,
          model: document.getElementById('mistralModel').value
        },
        commit: {
          verbose: document.getElementById('commitVerbose').checked
        }
      };
      
      // Send message to extension
      vscode.postMessage({
        command: 'saveSettings',
        settings: newSettings
      });
      
      // Update current settings
      currentSettings = newSettings;
      
      // Update the status banner with new settings
      updateStatusBanner(newSettings);
      
      // Show success message
      showToast('Settings saved successfully', 'success');
    }
    
    // Listen for messages from the extension
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        case 'settingsSaved':
          showToast('Settings saved successfully', 'success');
          break;
          
        case 'apiCheckResult':
          if (message.success) {
            showToast('API connection successful', 'success');
          } else {
            showToast('API connection failed: ' + message.error, 'error');
          }
          break;
          
        case 'rateLimitsResult':
          if (message.success) {
            showToast('Rate limits: ' + message.limits, 'success');
          } else {
            showToast('Failed to check rate limits: ' + message.error, 'error');
          }
          break;
          
        case 'updateSettings':
          // Update current settings
          currentSettings = message.settings;
          
          // Update form fields
          document.getElementById('apiProvider').value = currentSettings.apiProvider || 'huggingface';
          document.getElementById('commitVerbose').checked = currentSettings.commit?.verbose ?? true;
          
          if (currentSettings.gemini) {
            document.getElementById('geminiApiKey').value = currentSettings.gemini.apiKey || '';
            document.getElementById('geminiModel').value = currentSettings.gemini.model || 'gemini-2.0-flash';
          }
          
          if (currentSettings.huggingface) {
            document.getElementById('huggingfaceApiKey').value = currentSettings.huggingface.apiKey || '';
            document.getElementById('huggingfaceModel').value = currentSettings.huggingface.model || '';
          }
          
          if (currentSettings.ollama) {
            document.getElementById('ollamaUrl').value = currentSettings.ollama.url || '';
            document.getElementById('ollamaModel').value = currentSettings.ollama.model || '';
          }
          
          if (currentSettings.mistral) {
            document.getElementById('mistralApiKey').value = currentSettings.mistral.apiKey || '';
            document.getElementById('mistralModel').value = currentSettings.mistral.model || 'mistral-large-latest';
          }
          
          // Update UI state
          updateVisibleSettings();
          
          // Update status banner
          updateStatusBanner(currentSettings);
          break;
      }
    });
  </script>`;
}
