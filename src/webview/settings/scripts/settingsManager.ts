import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { getApiManagerScript } from "./apiManager";
import { getUiManagerScript } from "./uiManager";

// src/webview/settings/scripts/settingsManager.ts
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
    document.getElementById('cohereApiKey').value = currentSettings.cohere?.apiKey || '';
    document.getElementById('cohereModel').value = currentSettings.cohere?.model || 'command-r-plus';
    
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
        cohere: {
          apiKey: document.getElementById('cohereApiKey').value,
          model: document.getElementById('cohereModel').value
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
        // ... existing cases
        
        case 'mistralModelsLoaded':
          const mistralModelSelect = document.getElementById('mistralModel');
          if (mistralModelSelect) {
            // Store the currently selected value
            const currentValue = mistralModelSelect.value;
            
            // Clear existing options
            mistralModelSelect.innerHTML = '';
            
            if (message.success && message.models && message.models.length > 0) {
              // Add models to dropdown
              message.models.forEach(modelId => {
                const option = document.createElement('option');
                option.value = modelId;
                option.textContent = modelId;
                // Select the option if it matches the current settings or was previously selected
                option.selected = modelId === currentValue || 
                                  (currentValue === '' && modelId === currentSettings.mistral.model);
                mistralModelSelect.appendChild(option);
              });
              
              showToast('Mistral models loaded successfully', 'success');
            } else {
              // Add default options if loading failed
              const defaultModels = ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large-latest'];
              
              // Add the current model from settings if it's not in default models
              if (currentSettings.mistral.model && !defaultModels.includes(currentSettings.mistral.model)) {
                const option = document.createElement('option');
                option.value = currentSettings.mistral.model;
                option.textContent = currentSettings.mistral.model;
                option.selected = true;
                mistralModelSelect.appendChild(option);
              }
              
              // Add default models
              defaultModels.forEach(modelId => {
                const option = document.createElement('option');
                option.value = modelId;
                option.textContent = modelId;
                option.selected = modelId === currentSettings.mistral.model;
                mistralModelSelect.appendChild(option);
              });
              
              showToast('Failed to load Mistral models: ' + (message.error || 'Unknown error'), 'error');
            }
              
            // Reset the load button
            const loadButton = document.getElementById('loadMistralModels');
            if (loadButton) {
              loadButton.textContent = 'Load Available Models';
              loadButton.disabled = false;
            }
          }
          break;
      }
    });

    // Add event listener for the load models button
    document.getElementById('loadMistralModels').addEventListener('click', function() {
      // Show loading state
      const mistralModelSelect = document.getElementById('mistralModel');
      mistralModelSelect.innerHTML = '<option value="">Loading models...</option>';
      
      // Send message to extension to load models
      vscode.postMessage({
        command: 'executeCommand',
        commandId: 'ai-commit-assistant.loadMistralModels'
      });
    });
    
    // Listen for messages from the extension
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        case 'settingsSaved':
          showToast('Settings saved successfully', 'success');
          break;
          
        case 'apiCheckResult':
          // Update the dialog with detailed information
          const apiStatusMessage = document.getElementById('apiStatusMessage');
          const apiStatusDetails = document.getElementById('apiStatusDetails');
          
          if (message.success) {
            if (apiStatusMessage) {
              apiStatusMessage.textContent = 'API connection successful!';
            }
            
            if (apiStatusDetails) {
              apiStatusDetails.innerHTML = \`
                <div class="status-success">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <div>
                    <h4>Connection Details</h4>
                    <ul>
                      <li><strong>Provider:</strong> \${getProviderDisplayName(message.provider)}</li>
                      <li><strong>Model:</strong> \${message.model || 'Default'}</li>
                      <li><strong>Response Time:</strong> \${message.responseTime || 'N/A'} ms</li>
                    </ul>
                    \${message.details ? '<p>' + message.details + '</p>' : ''}
                  </div>
                </div>
              \`;
              apiStatusDetails.className = 'status-details success';
            }
            
            // Also show a toast
            showToast('API connection successful', 'success');
          } else {
            if (apiStatusMessage) {
              apiStatusMessage.textContent = 'API connection failed';
            }
            
            if (apiStatusDetails) {
              apiStatusDetails.innerHTML = \`
                <div class="status-error">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <div>
                    <h4>Error Details</h4>
                    <p>\${message.error || 'Unknown error occurred'}</p>
                    \${message.troubleshooting ? '<h4>Troubleshooting</h4><p>' + message.troubleshooting + '</p>' : ''}
                  </div>
                </div>
              \`;
              apiStatusDetails.className = 'status-details error';
            }
            
            // Also show a toast
            showToast('API connection failed: ' + (message.error || 'Unknown error'), 'error');
          }
          
          // Remove spinner
          const apiStatusSpinner = document.querySelector('#apiStatusDialog .status-spinner');
          if (apiStatusSpinner) {
            apiStatusSpinner.style.display = 'none';
          }
          break;
          
        case 'rateLimitsResult':
          // Update the dialog with detailed rate limit information
          const rateLimitsMessage = document.getElementById('rateLimitsMessage');
          const rateLimitsDetails = document.getElementById('rateLimitsDetails');
          
          if (message.success) {
            if (rateLimitsMessage) {
              rateLimitsMessage.textContent = 'Rate limits retrieved successfully!';
            }
            
            if (rateLimitsDetails) {
              let limitsHtml = '<div class="status-success">';
              limitsHtml += '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
              limitsHtml += '<div><h4>Rate Limit Information</h4>';
              
              if (typeof message.limits === 'object') {
                limitsHtml += '<ul>';
                
                // Format reset time as human-readable
                if (message.limits.reset) {
                  const resetDate = new Date();
                  resetDate.setSeconds(resetDate.getSeconds() + message.limits.reset);
                  limitsHtml += \`<li><strong>Reset in:</strong> \${message.limits.reset} seconds (\${resetDate.toLocaleTimeString()})</li>\`;
                }
                
                // Add other limit information
                if (message.limits.limit) {
                  limitsHtml += \`<li><strong>Per-minute limit:</strong> \${message.limits.limit} tokens</li>\`;
                }
                if (message.limits.remaining) {
                  limitsHtml += \`<li><strong>Remaining:</strong> \${message.limits.remaining} tokens</li>\`;
                }
                if (message.limits.queryCost) {
                  limitsHtml += \`<li><strong>This request cost:</strong> \${message.limits.queryCost} tokens</li>\`;
                }
                if (message.limits.monthlyLimit) {
                  limitsHtml += \`<li><strong>Monthly limit:</strong> \${message.limits.monthlyLimit} tokens</li>\`;
                }
                if (message.limits.monthlyRemaining) {
                  limitsHtml += \`<li><strong>Monthly remaining:</strong> \${message.limits.monthlyRemaining} tokens</li>\`;
                }

                
                limitsHtml += '</ul>';
              } else {
                limitsHtml += \`<p>\${message.limits || 'No specific limits reported'}</p>\`;
              }
              
              if (message.notes) {
                limitsHtml += \`<div class="rate-limit-note"><p><strong>Note:</strong> \${message.notes}</p></div>\`;
              }
              
              limitsHtml += '</div></div>';
              rateLimitsDetails.innerHTML = limitsHtml;
              rateLimitsDetails.className = 'status-details success';
            }
            
            // Also show a toast
            showToast('Rate limits retrieved successfully', 'success');
          } else {
            if (rateLimitsMessage) {
              rateLimitsMessage.textContent = 'Failed to retrieve rate limits';
            }
            
            if (rateLimitsDetails) {
              rateLimitsDetails.innerHTML = \`
                <div class="status-error">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <div>
                    <h4>Error Details</h4>
                    <p>\${message.error || 'Unknown error occurred'}</p>
                  </div>
                </div>
              \`;
              rateLimitsDetails.className = 'status-details error';
            }
            
            // Also show a toast
            showToast('Failed to check rate limits: ' + (message.error || 'Unknown error'), 'error');
          }
          
          // Remove spinner
          const rateLimitsSpinner = document.querySelector('#rateLimitsDialog .status-spinner');
          if (rateLimitsSpinner) {
            rateLimitsSpinner.style.display = 'none';
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
          
          if (currentSettings.cohere) {
            document.getElementById('cohereApiKey').value = currentSettings.cohere.apiKey || '';
            document.getElementById('cohereModel').value = currentSettings.cohere.model || 'command-r-plus';
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
