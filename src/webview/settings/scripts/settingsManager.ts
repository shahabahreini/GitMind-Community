import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { getApiManagerScript } from "./apiManager";
import { getUiManagerScript } from "./uiManager";

interface ProviderDefaults {
  [key: string]: {
    apiKey?: string;
    model: string;
    url?: string;
  };
}

const PROVIDER_DEFAULTS: ProviderDefaults = {
  gemini: { model: "gemini-2.5-flash-preview-04-17" },
  huggingface: { model: "" },
  ollama: { model: "", url: "" },
  mistral: { model: "mistral-large-latest" },
  cohere: { model: "command-a-03-2025" },
  openai: { model: "gpt-3.5-turbo" },
  together: { model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  openrouter: { model: "google/gemma-3-27b-it:free" },
  anthropic: { model: "claude-3-5-sonnet-20241022" },
  copilot: { model: "gpt-4o" },
  deepseek: { model: "deepseek-chat" },
  grok: { model: "grok-3" },
  perplexity: { model: "sonar-pro" }
};

const API_KEY_PROVIDERS = [
  'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
  'together', 'openrouter', 'anthropic', 'deepseek', 'grok', 'perplexity'
];

const NO_API_KEY_PROVIDERS = ['ollama', 'copilot'];

export function getSettingsScript(settings: ExtensionSettings, nonce: string): string {
  const safeSettings = JSON.stringify(settings).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  function generateFormInitialization(): string {
    const formInits: string[] = [
      `document.getElementById('apiProvider').value = currentSettings.apiProvider || 'huggingface';`,
      `document.getElementById('commitVerbose').checked = currentSettings.commit?.verbose ?? true;`,
      `document.getElementById('showDiagnostics').checked = currentSettings.showDiagnostics ?? false;`,
      `document.getElementById('telemetryEnabled').checked = currentSettings.telemetry?.enabled ?? true;`,
      `document.getElementById('promptCustomizationEnabled').checked = currentSettings.promptCustomization?.enabled ?? false;`,
      `document.getElementById('saveLastPrompt').checked = currentSettings.promptCustomization?.saveLastPrompt || false;`
    ];

    Object.entries(PROVIDER_DEFAULTS).forEach(([provider, defaults]) => {
      if (API_KEY_PROVIDERS.includes(provider)) {
        formInits.push(`document.getElementById('${provider}ApiKey').value = currentSettings.${provider}?.apiKey || '';`);
      }
      formInits.push(`document.getElementById('${provider}Model').value = currentSettings.${provider}?.model || '${defaults.model}';`);

      if (provider === 'ollama') {
        formInits.push(`document.getElementById('${provider}Url').value = currentSettings.${provider}?.url || '';`);
      }
    });

    return formInits.join('\n    ');
  }

  function generateSettingsCollection(): string {
    const settingsObj: string[] = [
      `apiProvider: document.getElementById('apiProvider').value,`,
      `debug: currentSettings.debug,`
    ];

    Object.keys(PROVIDER_DEFAULTS).forEach(provider => {
      const fields: string[] = [];

      if (API_KEY_PROVIDERS.includes(provider)) {
        fields.push(`apiKey: document.getElementById('${provider}ApiKey').value`);
      }
      fields.push(`model: document.getElementById('${provider}Model').value`);

      if (provider === 'ollama') {
        fields.push(`url: document.getElementById('${provider}Url').value`);
      }

      settingsObj.push(`${provider}: { ${fields.join(', ')} },`);
    });

    settingsObj.push(
      `promptCustomization: {
        enabled: currentFormValues.promptCustomizationEnabled,
        saveLastPrompt: currentFormValues.saveLastPrompt,
        lastPrompt: currentSettings.promptCustomization?.lastPrompt || '',
      },`,
      `commit: { verbose: currentFormValues.commitVerbose },`,
      `showDiagnostics: currentFormValues.showDiagnostics,`,
      `telemetry: { enabled: currentFormValues.telemetryEnabled }`
    );

    return `{ ${settingsObj.join('\n        ')} }`;
  }

  function generateUpdateSettingsCode(): string {
    const updates: string[] = [
      `document.getElementById('apiProvider').value = currentSettings.apiProvider || 'huggingface';`,
      `document.getElementById('commitVerbose').checked = currentSettings.commit?.verbose ?? true;`,
      `document.getElementById('showDiagnostics').checked = currentSettings.showDiagnostics ?? false;`,
      `document.getElementById('telemetryEnabled').checked = currentSettings.telemetry?.enabled ?? true;`,
      `document.getElementById('promptCustomizationEnabled').checked = currentSettings.promptCustomization?.enabled ?? false;`,
      `document.getElementById('saveLastPrompt').checked = currentSettings.promptCustomization?.saveLastPrompt || false;`
    ];

    Object.entries(PROVIDER_DEFAULTS).forEach(([provider, defaults]) => {
      updates.push(`if (currentSettings.${provider}) {`);

      if (API_KEY_PROVIDERS.includes(provider)) {
        updates.push(`  document.getElementById('${provider}ApiKey').value = currentSettings.${provider}.apiKey || '';`);
      }
      updates.push(`  document.getElementById('${provider}Model').value = currentSettings.${provider}?.model || '${defaults.model}';`);

      if (provider === 'ollama') {
        updates.push(`  document.getElementById('${provider}Url').value = currentSettings.${provider}.url || '';`);
      }

      updates.push(`}`);
    });

    return updates.join('\n          ');
  }

  return `
  <div id="toast" class="toast"></div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let currentSettings = ${safeSettings};
    
    // Initialize form with current settings
    ${generateFormInitialization()}
    
    // Enhanced tooltip functionality for compact toggles
    function initializeTooltips() {
      const toggleRows = document.querySelectorAll('.compact-toggle-row[title]');
      toggleRows.forEach(row => {
        const originalTitle = row.getAttribute('title');
        row.removeAttribute('title');
        row.setAttribute('data-tooltip', originalTitle);
        
        let hoverTimeout;
        
        row.addEventListener('mouseenter', () => {
          hoverTimeout = setTimeout(() => {
            row.setAttribute('title', row.getAttribute('data-tooltip'));
          }, 300);
        });
        
        row.addEventListener('mouseleave', () => {
          clearTimeout(hoverTimeout);
          row.removeAttribute('title');
        });
      });
    }
    
    // Initialize tooltips
    document.addEventListener('DOMContentLoaded', initializeTooltips);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeTooltips);
    } else {
      initializeTooltips();
    }
    
    ${getUiManagerScript()}
    ${getApiManagerScript()}
    
    // Save settings
    function saveSettings() {
      const currentFormValues = {
        commitVerbose: document.getElementById('commitVerbose').checked,
        showDiagnostics: document.getElementById('showDiagnostics').checked,
        telemetryEnabled: document.getElementById('telemetryEnabled').checked,
        promptCustomizationEnabled: document.getElementById('promptCustomizationEnabled').checked,
        saveLastPrompt: document.getElementById('saveLastPrompt').checked
      };

      const newSettings = ${generateSettingsCollection()};
      
      console.log('Saving settings:', {
        commitVerbose: newSettings.commit.verbose,
        showDiagnostics: newSettings.showDiagnostics,
        telemetryEnabled: newSettings.telemetry.enabled,
        promptCustomizationEnabled: newSettings.promptCustomization.enabled
      });
      
      vscode.postMessage({
        command: 'saveSettings',
        settings: newSettings
      });
      
      currentSettings = newSettings;
      updateStatusBanner(newSettings);
      showToast('Settings saved successfully', 'success');
    }

    // Model loading handlers
    function handleModelLoad(provider, defaultModels, commandId) {
      const modelSelect = document.getElementById(provider + 'Model');
      const loadButton = document.getElementById('load' + provider.charAt(0).toUpperCase() + provider.slice(1) + 'Models');
      
      if (modelSelect) {
        const currentValue = modelSelect.value;
        modelSelect.innerHTML = '<option value="">Loading models...</option>';
        
        if (loadButton) {
          loadButton.textContent = 'Loading...';
          loadButton.disabled = true;
        }
        
        vscode.postMessage({
          command: 'executeCommand',
          commandId: commandId
        });
      }
    }

    // Setup model search functionality
    function setupModelSearch(provider, models) {
      const searchInput = document.getElementById(provider + 'ModelSearch');
      const modelSelect = document.getElementById(provider + 'Model');
      
      if (!searchInput || !modelSelect || !models) return;
      
      let searchTimeout;
      
      searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const searchTerm = this.value.toLowerCase();
          const currentValue = modelSelect.value;
          
          modelSelect.innerHTML = '';
          
          const filteredModels = models.filter(model => 
            model.toLowerCase().includes(searchTerm)
          );
          
          const displayModels = filteredModels.slice(0, 500);
          
          displayModels.forEach(modelId => {
            const option = document.createElement('option');
            option.value = modelId;
            option.textContent = modelId;
            option.selected = modelId === currentValue;
            modelSelect.appendChild(option);
          });
          
          if (searchTerm && filteredModels.length > displayModels.length) {
            const infoOption = document.createElement('option');
            infoOption.disabled = true;
            infoOption.textContent = \`Showing \${displayModels.length} of \${filteredModels.length} matches...\`;
            modelSelect.insertBefore(infoOption, modelSelect.firstChild);
          }
        }, 300);
      });
      
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          modelSelect.focus();
          modelSelect.selectedIndex = 0;
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (modelSelect.options.length > 0) {
            for (let i = 0; i < modelSelect.options.length; i++) {
              if (!modelSelect.options[i].disabled) {
                modelSelect.selectedIndex = i;
                break;
              }
            }
          }
        }
      });
      
      modelSelect.addEventListener('blur', function() {
        setTimeout(() => {
          if (document.activeElement !== searchInput) {
            searchInput.focus();
          }
        }, 100);
      });
    }

    // Message handling
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        case 'mistralModelsLoaded':
          handleModelsLoaded('mistral', message, ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large-latest']);
          break;
          
        case 'huggingfaceModelsLoaded':
          handleModelsLoaded('huggingface', message, [
            'mistralai/Mistral-7B-Instruct-v0.3',
            'microsoft/DialoGPT-medium',
            'facebook/bart-large-cnn',
            'HuggingFaceH4/zephyr-7b-beta'
          ]);
          if (message.success && message.models) {
            window.allHuggingFaceModels = message.models;
            const searchInput = document.getElementById('huggingfaceModelSearch');
            if (searchInput) {
              searchInput.style.display = 'block';
              setupModelSearch('huggingface', message.models);
            }
          }
          break;
          
        case 'settingsSaved':
          showToast('Settings saved successfully', 'success');
          break;
          
        case 'apiCheckResult':
          handleApiCheckResult(message);
          break;
          
        case 'rateLimitsResult':
          handleRateLimitsResult(message);
          break;
          
        case 'updateSettings':
          currentSettings = message.settings;
          ${generateUpdateSettingsCode()}
          updateVisibleSettings();
          updateStatusBanner(currentSettings);
          break;
      }
    });

    function handleModelsLoaded(provider, message, defaultModels) {
      const modelSelect = document.getElementById(provider + 'Model');
      const loadButton = document.getElementById('load' + provider.charAt(0).toUpperCase() + provider.slice(1) + 'Models');
      
      if (modelSelect) {
        const currentValue = modelSelect.value;
        modelSelect.innerHTML = '';
        
        if (message.success && message.models && message.models.length > 0) {
          message.models.forEach(modelId => {
            const option = document.createElement('option');
            option.value = modelId;
            option.textContent = modelId;
            option.selected = modelId === currentValue || 
                              (currentValue === '' && modelId === currentSettings[provider].model);
            modelSelect.appendChild(option);
          });
          
          showToast(provider.charAt(0).toUpperCase() + provider.slice(1) + ' models loaded successfully', 'success');
        } else {
          // Add current model if not in defaults
          if (currentSettings[provider].model && !defaultModels.includes(currentSettings[provider].model)) {
            const option = document.createElement('option');
            option.value = currentSettings[provider].model;
            option.textContent = currentSettings[provider].model;
            option.selected = true;
            modelSelect.appendChild(option);
          }
          
          // Add default models
          defaultModels.forEach(modelId => {
            const option = document.createElement('option');
            option.value = modelId;
            option.textContent = modelId;
            option.selected = modelId === currentSettings[provider].model;
            modelSelect.appendChild(option);
          });
          
          showToast('Failed to load ' + provider + ' models: ' + (message.error || 'Unknown error'), 'error');
        }
        
        if (loadButton) {
          loadButton.textContent = 'Load Available Models';
          loadButton.disabled = false;
        }
      }
    }

    function handleApiCheckResult(message) {
      // Update the dialog created by apiManager
      const apiStatusMessage = document.getElementById('apiStatusDialogMessage');
      const apiStatusDetails = document.getElementById('apiStatusDialogDetails');
      const apiStatusSpinner = document.querySelector('#apiStatusDialog .status-spinner');
      
      // Hide spinner
      if (apiStatusSpinner) {
        apiStatusSpinner.style.display = 'none';
      }
      
      if (message.success) {
        if (message.warning) {
          if (apiStatusMessage) {
            apiStatusMessage.textContent = 'API connection successful with warning';
            apiStatusMessage.className = 'status-warning';
          }
          
          if (apiStatusDetails) {
            apiStatusDetails.innerHTML = \`
              <div class="status-warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <circle cx="12" cy="17" r="1"></circle>
                </svg>
                <div>
                  <h4>Connection Successful - Warning</h4>
                  <ul>
                    <li><strong>Provider:</strong> \${getProviderDisplayName(message.provider)}</li>
                    <li><strong>Model:</strong> \${message.model || 'Default'}</li>
                    <li><strong>Response Time:</strong> \${message.responseTime || 'N/A'} ms</li>
                  </ul>
                  \${message.details ? '<p>' + message.details + '</p>' : ''}
                  <h4>Warning</h4>
                  <p>\${message.warning}</p>
                  \${message.troubleshooting ? '<h4>Troubleshooting</h4><p>' + message.troubleshooting + '</p>' : ''}
                </div>
              </div>
            \`;
            apiStatusDetails.className = 'status-details warning';
          }
          
          showToast('API connection successful with warning: ' + message.warning, 'warning');
        } else {
          if (apiStatusMessage) {
            apiStatusMessage.textContent = 'API connection successful!';
            apiStatusMessage.className = 'status-success';
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
          
          showToast('API connection successful', 'success');
        }
      } else {
        if (apiStatusMessage) {
          apiStatusMessage.textContent = 'API connection failed';
          apiStatusMessage.className = 'status-error';
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
        
        showToast('API connection failed: ' + (message.error || 'Unknown error'), 'error');
      }
    }

    function handleRateLimitsResult(message) {
      // Update the dialog created by apiManager
      const rateLimitsMessage = document.getElementById('rateLimitsDialogMessage');
      const rateLimitsDetails = document.getElementById('rateLimitsDialogDetails');
      const rateLimitsSpinner = document.querySelector('#rateLimitsDialog .status-spinner');
      
      // Hide spinner
      if (rateLimitsSpinner) {
        rateLimitsSpinner.style.display = 'none';
      }
      
      if (message.success) {
        if (rateLimitsMessage) {
          rateLimitsMessage.textContent = 'Rate limits retrieved successfully!';
          rateLimitsMessage.className = 'status-success';
        }
        
        if (rateLimitsDetails) {
          let limitsHtml = '<div class="status-success">';
          limitsHtml += '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
          limitsHtml += '<div><h4>Rate Limit Information</h4>';
          
          if (typeof message.limits === 'object' && message.limits) {
            limitsHtml += '<ul>';
            
            if (message.limits.reset) {
              const resetDate = new Date();
              resetDate.setSeconds(resetDate.getSeconds() + message.limits.reset);
              limitsHtml += \`<li><strong>Reset in:</strong> \${message.limits.reset} seconds (\${resetDate.toLocaleTimeString()})</li>\`;
            }
            
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
        
        showToast('Rate limits retrieved successfully', 'success');
      } else {
        if (rateLimitsMessage) {
          rateLimitsMessage.textContent = 'Failed to retrieve rate limits';
          rateLimitsMessage.className = 'status-error';
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
        
        showToast('Failed to check rate limits: ' + (message.error || 'Unknown error'), 'error');
      }
    }

    // Event listeners
    document.getElementById('loadMistralModels')?.addEventListener('click', () => 
      handleModelLoad('mistral', ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large-latest'], 'ai-commit-assistant.loadMistralModels')
    );
    
    document.getElementById('loadHuggingFaceModels')?.addEventListener('click', () =>
      handleModelLoad('huggingface', [
        'mistralai/Mistral-7B-Instruct-v0.3',
        'microsoft/DialoGPT-medium',
        'facebook/bart-large-cnn',
        'HuggingFaceH4/zephyr-7b-beta'
      ], 'ai-commit-assistant.loadHuggingFaceModels')
    );

    document.getElementById('copilotModel')?.addEventListener('change', saveSettings);

    document.getElementById('apiProvider')?.addEventListener('change', function() {
      const provider = this.value;
      
      document.querySelectorAll('.api-settings').forEach(el => {
        el.classList.add('hidden');
      });
      
      const selectedProviderSettings = document.getElementById(provider + 'Settings');
      if (selectedProviderSettings) {
        selectedProviderSettings.classList.remove('hidden');
      }
      
      updateStatusBanner();
    });
    
    function toggleSaveLastPromptVisibility(show) {
      const saveLastPromptRow = document.getElementById('saveLastPromptRow');
      if (saveLastPromptRow) {
        saveLastPromptRow.style.display = show ? 'flex' : 'none';
      }
    }

    // Individual setting update handlers
    function createSettingHandler(key, getValue) {
      return (e) => {
        const value = getValue(e.target);
        const keys = key.split('.');
        let target = currentSettings;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) {
            target[keys[i]] = {};
          }
          target = target[keys[i]];
        }
        
        target[keys[keys.length - 1]] = value;
        
        vscode.postMessage({
          command: 'updateSetting',
          key: key,
          value: value
        });
        
        if (key === 'promptCustomization.enabled') {
          toggleSaveLastPromptVisibility(value);
        }
      };
    }

    // Add event listeners
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOMContentLoaded event fired');
      
      const handlers = [
        ['commitVerbose', 'commit.verbose', (el) => el.checked],
        ['showDiagnostics', 'showDiagnostics', (el) => el.checked],
        ['telemetryEnabled', 'telemetry.enabled', (el) => el.checked],
        ['promptCustomizationEnabled', 'promptCustomization.enabled', (el) => el.checked],
        ['saveLastPrompt', 'promptCustomization.saveLastPrompt', (el) => el.checked]
      ];

      handlers.forEach(([elementId, settingKey, getValue]) => {
        const element = document.getElementById(elementId);
        if (element) {
          element.addEventListener('change', createSettingHandler(settingKey, getValue));
        }
      });

      const promptToggle = document.getElementById('promptCustomizationEnabled');
      if (promptToggle) {
        promptToggle.addEventListener('change', function() {
          toggleSaveLastPromptVisibility(this.checked);
        });
      }

      // Initialize Ollama model dropdown functionality
      console.log('About to initialize Ollama dropdown');
      initializeOllamaModelDropdown();
    });

    // Ollama Model Dropdown Functionality
    function initializeOllamaModelDropdown() {
      console.log('Initializing Ollama model dropdown');
      
      // Check if vscode API is available
      if (typeof vscode === 'undefined') {
        console.error('VS Code API not available!');
        return;
      }
      
      const modelInput = document.getElementById('ollamaModel');
      const loadModelsBtn = document.getElementById('loadModelsBtn');
      const dropdown = document.getElementById('modelDropdown');
      
      if (!modelInput || !loadModelsBtn || !dropdown) {
        console.error('Required elements not found:', { modelInput, loadModelsBtn, dropdown });
        return;
      }
      
      const modelList = dropdown.querySelector('.model-list');
      const loadingIndicator = dropdown.querySelector('.dropdown-loading');
      const errorIndicator = dropdown.querySelector('.dropdown-error');
      const emptyIndicator = dropdown.querySelector('.dropdown-empty');

      let availableModels = [];
      let isDropdownOpen = false;

      // Load models button click handler
      loadModelsBtn.addEventListener('click', async () => {
        const ollamaUrl = document.getElementById('ollamaUrl').value || 'http://localhost:11434';
        console.log('Load models button clicked, URL:', ollamaUrl);
        
        // Test VS Code API availability
        if (typeof vscode === 'undefined') {
          console.error('VS Code API not available!');
          showError('VS Code API not available - cannot load models');
          return;
        }
        
        // Test message posting
        const testMessage = {
          command: 'loadOllamaModels',
          baseUrl: ollamaUrl
        };
        console.log('About to post message:', testMessage);
        
        try {
          await loadOllamaModels(ollamaUrl);
        } catch (error) {
          console.error('Error in loadOllamaModels:', error);
          showError('Error loading models: ' + error.message);
          loadModelsBtn.disabled = false;
          loadModelsBtn.classList.remove('loading');
        }
      });

      // Input field events
      modelInput.addEventListener('focus', () => {
        if (availableModels.length > 0) {
          showDropdown();
        }
      });

      modelInput.addEventListener('input', (e) => {
        const filter = e.target.value.toLowerCase();
        filterModels(filter);
        if (availableModels.length > 0) {
          showDropdown();
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.searchable-dropdown')) {
          hideDropdown();
        }
      });

      // Handle keyboard navigation
      modelInput.addEventListener('keydown', (e) => {
        if (!isDropdownOpen) return;

        const visibleItems = modelList.querySelectorAll('li:not(.filtered-out)');
        const selectedItem = modelList.querySelector('li.selected');
        let selectedIndex = Array.from(visibleItems).indexOf(selectedItem);

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, visibleItems.length - 1);
            updateSelection(visibleItems, selectedIndex);
            break;
          case 'ArrowUp':
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection(visibleItems, selectedIndex);
            break;
          case 'Enter':
            e.preventDefault();
            if (selectedItem) {
              selectModel(selectedItem.dataset.modelName);
            }
            break;
          case 'Escape':
            e.preventDefault();
            hideDropdown();
            break;
        }
      });

      async function loadOllamaModels(baseUrl) {
        console.log('Loading Ollama models from:', baseUrl);
        loadModelsBtn.disabled = true;
        loadModelsBtn.classList.add('loading');
        showDropdown();
        showLoading();

        try {
          // Send message to extension to load models
          console.log('Sending loadOllamaModels message');
          vscode.postMessage({
            command: 'loadOllamaModels',
            baseUrl: baseUrl
          });
          
          // Add a timeout to detect if no response comes back
          setTimeout(() => {
            if (loadModelsBtn.disabled && loadModelsBtn.classList.contains('loading')) {
              console.warn('No response received after 10 seconds - request may have failed');
              showError('Request timeout - check if Ollama is running and accessible');
              loadModelsBtn.disabled = false;
              loadModelsBtn.classList.remove('loading');
            }
          }, 10000);
          
        } catch (error) {
          console.error('Error sending loadOllamaModels message:', error);
          showError('Failed to load models: ' + error.message);
          loadModelsBtn.disabled = false;
          loadModelsBtn.classList.remove('loading');
        }
      }

      function populateModels(models) {
        console.log('Populating models:', models);
        availableModels = models;
        modelList.innerHTML = '';

        if (models.length === 0) {
          showEmpty();
          return;
        }

        models.forEach(modelName => {
          const li = document.createElement('li');
          li.dataset.modelName = modelName;
          li.innerHTML = \`
            <div class="model-name">\${modelName}</div>
          \`;
          li.addEventListener('click', () => selectModel(modelName));
          modelList.appendChild(li);
        });

        hideLoading();
        hideError();
        hideEmpty();
        loadModelsBtn.disabled = false;
        loadModelsBtn.classList.remove('loading');
        console.log('Models populated successfully');
      }

      function selectModel(modelName) {
        modelInput.value = modelName;
        hideDropdown();
        
        // Trigger change event to save the setting
        const event = new Event('change', { bubbles: true });
        modelInput.dispatchEvent(event);
      }

      function filterModels(filter) {
        const items = modelList.querySelectorAll('li');
        let visibleCount = 0;

        items.forEach(item => {
          const modelName = item.dataset.modelName.toLowerCase();
          const isMatch = modelName.includes(filter);
          
          if (isMatch) {
            item.classList.remove('filtered-out');
            visibleCount++;
          } else {
            item.classList.add('filtered-out');
            item.classList.remove('selected');
          }
        });

        // Auto-select first visible item
        const firstVisible = modelList.querySelector('li:not(.filtered-out)');
        if (firstVisible) {
          updateSelection([firstVisible], 0);
        }
      }

      function updateSelection(visibleItems, selectedIndex) {
        // Remove previous selection
        modelList.querySelectorAll('li.selected').forEach(item => {
          item.classList.remove('selected');
        });

        // Add selection to new item
        if (visibleItems[selectedIndex]) {
          visibleItems[selectedIndex].classList.add('selected');
          visibleItems[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
      }

      function showDropdown() {
        dropdown.style.display = 'block';
        isDropdownOpen = true;
      }

      function hideDropdown() {
        dropdown.style.display = 'none';
        isDropdownOpen = false;
      }

      function showLoading() {
        loadingIndicator.style.display = 'block';
        errorIndicator.style.display = 'none';
        emptyIndicator.style.display = 'none';
        modelList.style.display = 'none';
      }

      function hideLoading() {
        loadingIndicator.style.display = 'none';
        modelList.style.display = 'block';
      }

      function showError(message) {
        errorIndicator.textContent = message;
        errorIndicator.style.display = 'block';
        loadingIndicator.style.display = 'none';
        emptyIndicator.style.display = 'none';
        modelList.style.display = 'none';
      }

      function hideError() {
        errorIndicator.style.display = 'none';
      }

      function showEmpty() {
        emptyIndicator.style.display = 'block';
        loadingIndicator.style.display = 'none';
        errorIndicator.style.display = 'none';
        modelList.style.display = 'none';
      }

      function hideEmpty() {
        emptyIndicator.style.display = 'none';
      }

      // Listen for messages from extension
      window.addEventListener('message', (event) => {
        const message = event.data;
        console.log('Received message from extension:', message);
        if (message.command === 'ollamaModelsLoaded') {
          if (message.success) {
            populateModels(message.models);
          } else {
            console.error('Failed to load models:', message.error);
            showError(message.error || 'Failed to load models');
            loadModelsBtn.disabled = false;
            loadModelsBtn.classList.remove('loading');
          }
        }
      });
    }
  </script>`;
}