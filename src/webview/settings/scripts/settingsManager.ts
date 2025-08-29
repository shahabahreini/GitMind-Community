import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { getApiManagerScript } from "./apiManager";
import { getUiManagerScript } from "./uiManager";
import { generateFormInitialization, generateSettingsCollection, generateUpdateSettingsCode, generateUpdateSettingsCodePreserveDropdowns } from "./formGenerators";
import { getTooltipInitializationScript, getToastScript, getDetailedStatusScript } from "./uiUtilities";
import { getModelHandlingScript, getModelEventListenersScript } from "./modelHandlers";
import { getMessageHandlersScript } from "./messageHandlers";
import { getEventHandlersScript } from "./eventHandlers";
import { getTabManagerScript } from "./tabManager";

function getCustomApiHandlerScript(): string {
  return `
    // Custom API connection test handler
    function initCustomApiHandler(vscode) {
      // Find the test connection button
      const testButton = document.getElementById('customTestConnection');
      if (!testButton) {
        return;
      }

      // Add click handler for the test connection button
      testButton.addEventListener('click', async () => {
        // Get current form values
        const baseUrl = document.getElementById('customBaseUrl')?.value?.trim() || '';
        const endpoint = document.getElementById('customEndpoint')?.value?.trim() || '';
        const authType = document.getElementById('customAuthType')?.value || 'bearer';
        const authToken = document.getElementById('customAuthToken')?.value || '';
        const headerKey = document.getElementById('customHeaderKey')?.value?.trim() || '';
        const requestFormat = document.getElementById('customRequestFormat')?.value || 'openai';
        const responseFormat = document.getElementById('customResponseFormat')?.value || 'openai';
        const model = document.getElementById('customModel')?.value?.trim() || '';
        
        // Create settings object
        const settings = {
          baseUrl,
          endpoint,
          authType,
          authToken,
          headerKey,
          requestFormat,
          responseFormat,
          model
        };
        
        // Find or create result div
        let resultDiv = document.getElementById('customApiTestResult');
        if (!resultDiv) {
          resultDiv = document.createElement('div');
          resultDiv.id = 'customApiTestResult';
          testButton.parentNode.insertBefore(resultDiv, testButton.nextSibling);
        }
        
        // Show loading state
        resultDiv.className = 'custom-api-test-result custom-api-test-loading';
        resultDiv.textContent = 'Testing connection...';
        
        // Disable the button during testing
        testButton.disabled = true;
        testButton.textContent = 'Testing...';
        
        try {
          // Send message to extension
          vscode.postMessage({
            command: 'testCustomApiConnection',
            settings
          });
        } catch (error) {
          // Handle error directly in UI
          resultDiv.className = 'custom-api-test-result custom-api-test-error';
          resultDiv.textContent = \`Error: \${error.message || 'Failed to send test request'}\`;
          
          // Re-enable the button
          testButton.disabled = false;
          testButton.textContent = 'Test Connection';
        }
      });
      
      // Listen for test results from extension
      window.addEventListener('message', (event) => {
        const message = event.data;
        
        if (message.command === 'customApiTestResult') {
          // Get or create result div
          let resultDiv = document.getElementById('customApiTestResult');
          if (!resultDiv) {
            resultDiv = document.createElement('div');
            resultDiv.id = 'customApiTestResult';
            const testButton = document.getElementById('customTestConnection');
            if (testButton && testButton.parentNode) {
              testButton.parentNode.insertBefore(resultDiv, testButton.nextSibling);
            } else {
              document.querySelector('.custom-api-container')?.appendChild(resultDiv);
            }
          }
          
          // Update UI based on success or failure
          if (message.success) {
            resultDiv.className = 'custom-api-test-result custom-api-test-success';
          } else {
            resultDiv.className = 'custom-api-test-result custom-api-test-error';
          }
          
          resultDiv.textContent = message.message;
          
          // Re-enable the test button
          const testButton = document.getElementById('customTestConnection');
          if (testButton) {
            testButton.disabled = false;
            testButton.textContent = 'Test Connection';
          }
        }
      });
      
      // Also add change handlers to show/hide header key field based on auth type
      const authTypeSelector = document.getElementById('customAuthType');
      if (authTypeSelector) {
        const headerKeyField = document.getElementById('customHeaderKey')?.closest('.form-group') || null;
        
        // Initial state
        if (headerKeyField) {
          headerKeyField.classList.toggle('header-key-field', true);
          headerKeyField.style.display = authTypeSelector.value === 'apikey' ? 'block' : 'none';
        }
        
        // Change handler
        authTypeSelector.addEventListener('change', () => {
          if (headerKeyField) {
            headerKeyField.style.display = authTypeSelector.value === 'apikey' ? 'block' : 'none';
          }
        });
      }
    }
  `;
}

export function getSettingsScript(settings: ExtensionSettings, nonce: string): string {
  const safeSettings = JSON.stringify(settings).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';

  return `
  <div id="toast" class="toast"></div>
  <script nonce="${nonce}">
    // Windows service worker fix - prevent service worker registration errors
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      // Override service worker registration to prevent Windows-specific errors
      const originalRegister = navigator.serviceWorker.register;
      navigator.serviceWorker.register = function() {
        console.log('Service worker registration intercepted - skipping for webview compatibility');
        return Promise.reject(new Error('Service worker registration disabled for webview compatibility'));
      };
    }
    
    // Global error handler for unhandled service worker errors
    window.addEventListener('error', function(e) {
      if (e.message && e.message.includes('ServiceWorker') && e.message.includes('InvalidStateError')) {
        console.log('Service worker error intercepted and ignored for Windows compatibility');
        e.preventDefault();
        return false;
      }
    });
    
    // Global unhandled rejection handler for service worker promises
    window.addEventListener('unhandledrejection', function(e) {
      if (e.reason && e.reason.message && 
          (e.reason.message.includes('ServiceWorker') || e.reason.message.includes('register a ServiceWorker'))) {
        console.log('Service worker promise rejection intercepted and ignored for Windows compatibility');
        e.preventDefault();
        return false;
      }
    });
    
    const vscode = acquireVsCodeApi();
    let currentSettings = ${safeSettings};
    
    // Make settings available globally for Pro feature components
    window.gitmindSettings = currentSettings;
    
    // Type declarations for window properties
    window.copyAPIKey = window.copyAPIKey || null;
    window.showCopiedHint = window.showCopiedHint || null;
    
    ${generateGlobalFormUtils()}
    ${generatePasswordFieldManager()}
    ${generateInitializationManager()}
    ${generateProFeatureManager()}
    
    // Initialize form with current settings
    try {
      ${generateFormInitialization()}
    } catch (error) {
      console.error('Error initializing form:', error);
    }
    
    ${getTooltipInitializationScript()}
    ${getUiManagerScript()}
    ${getApiManagerScript()}
    ${getTabManagerScript()}
    
    // Immediate tab initialization attempt
    setTimeout(() => {
      console.log('Immediate tab initialization attempt...');
      window.initializeTabs?.();
    }, 50);
    
    ${getModelHandlingScript()}
    
    // Get settings from form for saving
    function getSettingsFromForm() {
      try {
        const currentFormValues = {
          commitVerbose: document.getElementById('commitVerbose')?.checked ?? true,
          commitStyle: document.querySelector('input[name="gm-commit-style"]:checked')?.value || 'conventional',
          showDiagnostics: document.getElementById('showDiagnostics')?.checked ?? false,
          telemetryEnabled: document.getElementById('telemetryEnabled')?.checked ?? false,
          promptCustomizationEnabled: document.getElementById('promptCustomizationEnabled')?.checked ?? false,
          saveLastPrompt: document.getElementById('saveLastPrompt')?.checked ?? false,
          encryptionEnabled: document.getElementById('encryptionEnabled')?.checked ?? false,
          subscriptionEmail: document.getElementById('subscriptionEmail')?.value || '',
          commitBodyOptionsEnabled: document.getElementById('commitBodyOptionsEnabled')?.checked || false,
          commitBodyOptionsMaxLines: parseInt(document.getElementById('commitBodyOptionsMaxLines')?.value) || 5,
          commitLengthOptionsEnabled: document.getElementById('commitLengthOptionsEnabled')?.checked || false,
          commitLengthOptionsMaxLength: parseInt(document.getElementById('commitLengthOptionsMaxLength')?.value) || 72,
          learnFromCommitHistoryEnabled: document.getElementById('learnFromCommitHistoryEnabled')?.checked ?? true,
          learnFromCommitHistoryMaxCommits: parseInt(document.getElementById('learnFromCommitHistoryMaxCommits')?.value) || 50,
          learnFromCommitHistoryIncludeAuthorInfo: document.getElementById('learnFromCommitHistoryIncludeAuthorInfo')?.checked ?? true
        };

        // Make currentFormValues available in global scope for generateSettingsCollection
        window.currentFormValues = currentFormValues;
        
        const result = ${generateSettingsCollection()};
        
        // Clean up global variable
        delete window.currentFormValues;
        
        return result;
      } catch (error) {
        console.error('Error collecting settings from form:', error);
        return currentSettings; // Fallback to current settings
      }
    }

    // Update settings form from message
    function updateSettingsFromMessage() {
      ${generateUpdateSettingsCode()}
    }

    // Update settings form from message but preserve dropdowns
    function updateSettingsFromMessagePreserveDropdowns() {
      ${generateUpdateSettingsCodePreserveDropdowns()}
    }
    
    ${getMessageHandlersScript()}
    ${getToastScript()}
    ${getDetailedStatusScript()}
    ${getEventHandlersScript()}
    ${getModelEventListenersScript()}
    
    ${generateEventListeners()}
    ${generateUtilityFunctions()}
    
    // Custom API Handler
    ${getCustomApiHandlerScript()}
    
    // Initialize the Custom API handler after DOM content is loaded
    document.addEventListener('DOMContentLoaded', function() {
      initCustomApiHandler(vscode);
    });
  </script>`;
}

function generateGlobalFormUtils(): string {
  return `
    // Global FormUtils methods for password toggle functionality
    window.FormUtils = {
      togglePasswordVisibility: function(fieldId) {
        const elements = this.getPasswordElements(fieldId);
        if (!elements.isValid) return;

        // Security check: Don't reveal encrypted placeholders
        const isEncrypted = elements.input.dataset.encrypted === 'true' || elements.input.value === '[ENCRYPTED]';
        if (isEncrypted && elements.input.type === 'password') {
          this.showEncryptionWarning();
          return;
        }

        // Toggle input type and icons
        const isCurrentlyPassword = elements.input.type === 'password';
        elements.input.type = isCurrentlyPassword ? 'text' : 'password';
        elements.eyeIcon.style.display = isCurrentlyPassword ? 'none' : 'block';
        elements.eyeOffIcon.style.display = isCurrentlyPassword ? 'block' : 'none';
      },

      getPasswordElements: function(fieldId) {
        const input = document.getElementById(fieldId);
        const wrapper = input?.closest('.password-input-wrapper');
        const eyeIcon = wrapper?.querySelector('.eye-icon');
        const eyeOffIcon = wrapper?.querySelector('.eye-off-icon');
        
        return {
          input,
          wrapper,
          eyeIcon,
          eyeOffIcon,
          isValid: !!(input && eyeIcon && eyeOffIcon)
        };
      },

      showEncryptionWarning: function() {
        vscode.postMessage({
          type: 'showMessage',
          level: 'warning',
          message: 'Cannot reveal encrypted data. Please disable encryption first to view API keys.'
        });
      },

      updatePasswordFieldEncryptionStatus: function(fieldId, isEncrypted) {
        const input = document.getElementById(fieldId);
        if (input) {
          input.dataset.encrypted = isEncrypted.toString();
          
          // If switching to encrypted and field is currently visible, hide it
          if (isEncrypted && input.type === 'text') {
            this.togglePasswordVisibility(fieldId);
          }
          
          // If switching away from encrypted (to plain text), clear any [ENCRYPTED] placeholder
          if (!isEncrypted && input.value === '[ENCRYPTED]') {
            // Force a refresh of the field value from the current settings
            if (window.currentSettings) {
              const provider = fieldId.replace('ApiKey', '').toLowerCase();
              const currentValue = window.currentSettings[provider]?.apiKey || '';
              if (currentValue && currentValue !== '[ENCRYPTED]') {
                input.value = currentValue;
                console.log('Restored', fieldId, 'value from [ENCRYPTED] to actual key');
              }
            }
          }
        }
      }
    };`;
}

function generatePasswordFieldManager(): string {
  return `
    // Update encryption status for all password fields
    function updatePasswordFieldsEncryptionStatus() {
      if (!currentSettings?.pro) return;
      
      const isEncrypted = currentSettings.pro.encryptionEnabled === true;
      const apiKeyFields = [
        'geminiApiKey', 'openaiApiKey', 'anthropicApiKey', 'deepseekApiKey',
        'grokApiKey', 'perplexityApiKey', 'cohereApiKey', 'openrouterApiKey',
        'togetherApiKey', 'mistralApiKey', 'huggingfaceApiKey'
      ];
      
      apiKeyFields.forEach(fieldId => {
        window.FormUtils?.updatePasswordFieldEncryptionStatus?.(fieldId, isEncrypted);
        
        // If encryption is disabled and the field shows [ENCRYPTED], refresh its value
        if (!isEncrypted) {
          const input = document.getElementById(fieldId);
          if (input && input.value === '[ENCRYPTED]') {
            const provider = fieldId.replace('ApiKey', '').toLowerCase();
            const actualValue = currentSettings[provider]?.apiKey || '';
            if (actualValue && actualValue !== '[ENCRYPTED]') {
              input.value = actualValue;
              console.log('Restored', fieldId, 'from [ENCRYPTED] to actual value');
            }
          }
        }
      });
    }
    
    // Make function globally available
    window.updatePasswordFieldsEncryptionStatus = updatePasswordFieldsEncryptionStatus;`;
}

function generateInitializationManager(): string {
  return `
    // Centralized initialization manager
    const InitializationManager = {
      initializeApp: function() {
        try {
          ${generateFormInitialization()}
          this.updateProFeatureUI(currentSettings);
          this.setupFormEventListeners();
          this.initializeConditionalElements();
          
          setTimeout(() => {
            updateStatusBanner(currentSettings);
          }, 100);
          
          this.ensureTabsInitialized();
        } catch (error) {
          console.error('Error during app initialization:', error);
        }
      },

      setupFormEventListeners: function() {
        try {
          const coreSettings = [
            { id: 'commitVerbose', key: 'commit.verbose', getValue: (el) => el.checked },
            { id: 'showDiagnostics', key: 'showDiagnostics', getValue: (el) => el.checked },
            { id: 'telemetryEnabled', key: 'telemetry.enabled', getValue: (el) => el.checked },
            { id: 'promptCustomizationEnabled', key: 'promptCustomization.enabled', getValue: (el) => el.checked },
            { id: 'saveLastPrompt', key: 'promptCustomization.saveLastPrompt', getValue: (el) => el.checked },
            { id: 'apiProvider', key: 'apiProvider', getValue: (el) => el.value },
            { id: 'commitBodyOptionsEnabled', key: 'pro.commitBodyOptions.enabled', getValue: (el) => el.checked },
            { id: 'commitBodyOptionsMaxLines', key: 'pro.commitBodyOptions.maxLines', getValue: (el) => parseInt(el.value) || 5 },
            { id: 'commitLengthOptionsEnabled', key: 'pro.commitLengthOptions.enabled', getValue: (el) => el.checked },
            { id: 'commitLengthOptionsMaxLength', key: 'pro.commitLengthOptions.maxLength', getValue: (el) => parseInt(el.value) || 72 }
          ];

          coreSettings.forEach(setting => {
            const element = document.getElementById(setting.id);
            if (element) {
              element.addEventListener('change', createSettingHandler(setting.key, setting.getValue));
            }
          });

          window.setupProviderEventListeners?.();
        } catch (error) {
          console.error('Error setting up form event listeners:', error);
        }
      },

      initializeConditionalElements: function() {
        try {
          const promptCustomizationEnabled = currentSettings.promptCustomization?.enabled || false;
          const saveLastPromptRow = document.getElementById('saveLastPromptRow');
          if (saveLastPromptRow) {
            saveLastPromptRow.style.display = promptCustomizationEnabled ? 'flex' : 'none';
          }
        } catch (error) {
          console.error('Error initializing conditional elements:', error);
        }
      },

      ensureTabsInitialized: function() {
        setTimeout(() => {
          console.log('Calling initializeTabs from settings manager...');
          if (window.initializeTabs) {
            window.initializeTabs();
          } else {
            console.warn('window.initializeTabs not available');
          }
        }, 300);
      },

      updateProFeatureUI: updateProFeatureUI
    };`;
}

function generateProFeatureManager(): string {
  return `
    // Pro feature UI management
    function updateProFeatureUI(settings) {
      try {
        const hasValidLicense = (settings.pro?.licenseKey || settings.pro?.orderId) &&
          settings.pro?.validationStatus === 'valid';

        if (hasValidLicense) {
          ProUIManager.enableProFeatures(settings);
        } else {
          ProUIManager.disableProFeatures(settings);
        }
      } catch (error) {
        console.error('Error updating Pro feature UI:', error);
      }
    }

    const ProUIManager = {
      enableProFeatures: function(settings) {
        this.toggleWarnings(false);
        this.toggleEncryption(true);
        this.maskAndDisableInputs(settings);
        this.toggleButtons({ activate: false, subscribe: false, loadModels: true, copy: true });
        this.reinitializeTooltips();
      },

      disableProFeatures: function(settings) {
        this.toggleButtons({ activate: true, subscribe: true, loadModels: false, copy: false });
        this.unmaskAndEnableInputs(settings);
        this.handleEncryptionForFreeUsers(settings);
        this.reinitializeTooltips();
      },

      toggleWarnings: function(show) {
        const warnings = document.querySelectorAll('.pro-feature-warning');
        warnings.forEach(warning => {
          warning.style.display = show ? 'block' : 'none';
        });
      },

      toggleEncryption: function(enable) {
        const encryptionToggle = document.querySelector('input[id="encryptionEnabled"]');
        if (encryptionToggle) {
          encryptionToggle.disabled = !enable;
          if (!enable) {
            encryptionToggle.setAttribute('disabled', 'disabled');
          } else {
            encryptionToggle.removeAttribute('disabled');
          }
        }

        const containers = document.querySelectorAll('.toggle-switch, .switch-container, .toggle-slider');
        containers.forEach(container => {
          container.classList.toggle('disabled', !enable);
        });
      },

      maskAndDisableInputs: function(settings) {
        this.processInput('licenseKeyInput', settings.pro?.licenseKey);
        this.processInput('orderIdInput', settings.pro?.orderId);
      },

      unmaskAndEnableInputs: function(settings) {
        this.restoreInput('licenseKeyInput', settings.pro?.licenseKey || '');
        this.restoreInput('orderIdInput', settings.pro?.orderId || '');
      },

      processInput: function(inputId, value) {
        const input = document.getElementById(inputId);
        if (input && value) {
          if (value.length > 4) {
            input.value = '•'.repeat(value.length - 4) + value.slice(-4);
          }
          input.disabled = true;
          input.classList.add('activated-input');
        }
      },

      restoreInput: function(inputId, value) {
        const input = document.getElementById(inputId);
        if (input) {
          input.disabled = false;
          input.classList.remove('activated-input');
          input.value = value;
        }
      },

      toggleButtons: function(config) {
        const buttonConfigs = [
          { ids: ['activateLicenseBtn', 'activateOrderBtn'], enabled: config.activate },
          { ids: ['subscribeBtn'], enabled: config.subscribe },
          { 
            ids: ['loadCohereModels', 'loadHuggingFaceModels', 'loadMistralModels', 
                  'loadOllamaModels', 'loadOpenRouterModels', 'loadTogetherModels', 'loadGrokModels', 
                  'loadGeminiModels', 'loadAnthropicModels'], 
            enabled: config.loadModels,
            proFeature: true
          }
        ];

        buttonConfigs.forEach(({ ids, enabled, proFeature }) => {
          ids.forEach(id => {
            const button = document.getElementById(id);
            if (button) {
              button.disabled = !enabled;
              button.classList.toggle('disabled', !enabled);
              if (proFeature) {
                button.classList.toggle('pro-feature-disabled', !enabled);
                button.title = enabled ? '' : 'This feature requires GitMind Pro. Upgrade to unlock advanced model loading capabilities.';
              }
            }
          });
        });

        // Handle copy buttons separately
        const copyButtons = document.querySelectorAll('.copy-toggle.pro-feature');
        copyButtons.forEach(button => {
          button.classList.toggle('disabled', !config.copy);
          button.title = config.copy ? 'Copy API Key' : 'Copy API Key is a Pro feature. Upgrade to GitMind Pro to unlock this functionality.';
        });
      },

      handleEncryptionForFreeUsers: function(settings) {
        const hasValidLicense = (settings.pro?.licenseKey || settings.pro?.orderId) &&
          settings.pro?.validationStatus === 'valid';
        const devModeEnabled = typeof window !== 'undefined' && window.GITMIND_DEV_MODE === true;
        const encryptionAvailable = hasValidLicense || devModeEnabled;
        
        this.toggleEncryption(encryptionAvailable);
      },

      reinitializeTooltips: function() {
        if (window.initializeTooltips) {
          setTimeout(() => window.initializeTooltips(), 50);
        }
      }
    };
    
    // Make updateProFeatureUI available globally
    window.updateProFeatureUI = updateProFeatureUI;`;
}

function generateEventListeners(): string {
  return `
    // Initialize status banner on page load
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Settings manager DOMContentLoaded...');
      InitializationManager.initializeApp();
    });

    // Ensure status banner is always in sync
    window.addEventListener('load', function() {
      console.log('Settings manager window loaded...');
      try {
        updateProFeatureUI(currentSettings);
        
        setTimeout(() => {
          updateStatusBanner(currentSettings);
          console.log('Final tab initialization from window load...');
          if (window.initializeTabs) {
            window.initializeTabs();
          } else {
            console.warn('window.initializeTabs not available at window load');
          }
        }, 500);
      } catch (error) {
        console.error('Error during window load:', error);
      }
    });`;
}

function generateUtilityFunctions(): string {
  return `
    // Copy API Key function
    function copyAPIKey(fieldId) {
      const hasValidLicense = (currentSettings.pro?.licenseKey || currentSettings.pro?.orderId) &&
        currentSettings.pro?.validationStatus === 'valid';
      
      if (!hasValidLicense) {
        if (typeof vscode !== 'undefined') {
          vscode.postMessage({
            type: 'showMessage',
            level: 'error',
            message: 'Copy API Key is a Pro feature. Upgrade to GitMind Pro to unlock this functionality.'
          });
        }
        return;
      }

      const input = document.getElementById(fieldId);
      if (!input) {
        return;
      }

      const isEncrypted = input.dataset.encrypted === 'true' || input.value === '[ENCRYPTED]';
      
      if (isEncrypted) {
        // For encrypted keys, request the actual decrypted key from backend
        const provider = fieldId.replace('ApiKey', '').toLowerCase();
        
        if (typeof vscode !== 'undefined') {
          // Request the actual API key from the backend
          vscode.postMessage({
            command: 'getActualApiKey',
            provider: provider
          });
          
          // Show loading message
          vscode.postMessage({
            type: 'showMessage',
            level: 'info',
            message: 'Retrieving API key for copying...'
          });
        }
        return;
      }

      // For non-encrypted keys, copy directly
      const valueToCopy = input.value;
      if (!valueToCopy || valueToCopy.trim() === '') {
        if (typeof vscode !== 'undefined') {
          vscode.postMessage({
            type: 'showMessage',
            level: 'warning',
            message: 'No API key to copy. Please enter an API key first.'
          });
        }
        return;
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(valueToCopy).then(() => {
          // Show "Copied" hint
          const provider = fieldId.replace('ApiKey', '').toLowerCase();
          if (window.showCopiedHint) {
            window.showCopiedHint(provider);
          }
          if (typeof vscode !== 'undefined') {
            vscode.postMessage({
              type: 'showMessage',
              level: 'info',
              message: 'API key copied to clipboard successfully!'
            });
          }
        }).catch(err => {
          console.error('Failed to copy to clipboard:', err);
          fallbackCopyToClipboard(valueToCopy, fieldId);
        });
      } else {
        fallbackCopyToClipboard(valueToCopy, fieldId);
      }
    }

    function fallbackCopyToClipboard(text, fieldId) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          // Show "Copied" hint
          if (fieldId) {
            const provider = fieldId.replace('ApiKey', '').toLowerCase();
            if (window.showCopiedHint) {
              window.showCopiedHint(provider);
            }
          }
          if (typeof vscode !== 'undefined') {
            vscode.postMessage({
              type: 'showMessage',
              level: 'info',
              message: 'API key copied to clipboard successfully!'
            });
          }
        } else {
          throw new Error('Copy command failed');
        }
      } catch (err) {
        console.error('Fallback copy failed:', err);
        if (typeof vscode !== 'undefined') {
          vscode.postMessage({
            type: 'showMessage',
            level: 'error',
            message: 'Failed to copy API key to clipboard. Please copy manually.'
          });
        }
      } finally {
        document.body.removeChild(textArea);
      }
    }

    // Make functions globally available
    window.copyAPIKey = copyAPIKey;
    
    // Ensure showCopiedHint is available (defined in messageHandlers)
    if (!window.showCopiedHint) {
      console.warn('showCopiedHint function not available from messageHandlers');
    }
    
    // Debug function for testing tabs from console
    window.debugTabs = function() {
      console.log('=== TAB DEBUG INFO ===');
      const tabButtons = document.querySelectorAll('.tab-button');
      const tabContents = document.querySelectorAll('.tab-content');
      
      console.log('Tab buttons found:', tabButtons.length);
      tabButtons.forEach((btn, i) => {
        console.log(\`Button \${i}:\`, btn.getAttribute('data-tab'), btn.classList.contains('active') ? '(active)' : '');
      });
      
      console.log('Tab contents found:', tabContents.length);
      tabContents.forEach((content, i) => {
        console.log(\`Content \${i}:\`, content.id, content.classList.contains('active') ? '(active)' : '');
      });
      
      const globalFunctions = ['initializeTabs', 'switchToTab', 'reinitializeTabs'];
      console.log('Global functions available:');
      globalFunctions.forEach(fn => {
        console.log(\`- window.\${fn}:\`, typeof window[fn]);
      });
      
      console.log('Session storage:', sessionStorage.getItem('gitmind_active_tab'));
      console.log('==================');
    };`;
}