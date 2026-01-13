export function getEventHandlersScript(): string {
  return `
    // Track unsaved changes
    let hasUnsavedChanges = false;

    // Function to mark settings as changed
    function markAsUnsaved() {
      hasUnsavedChanges = true;
      updateSaveButtonState();
    }

    // Function to mark settings as saved
    function markAsSaved() {
      hasUnsavedChanges = false;
      updateSaveButtonState();
    }

    // Update save button appearance based on unsaved changes
    function updateSaveButtonState() {
      const saveButton = document.querySelector('button[onclick="saveSettings()"]');
      const buttonGroup = document.querySelector('.button-group');

      if (saveButton) {
        if (hasUnsavedChanges) {
          saveButton.classList.add('has-unsaved-changes');
          saveButton.innerHTML = '<span class="unsaved-indicator"></span>Save Settings';
        } else {
          saveButton.classList.remove('has-unsaved-changes');
          saveButton.textContent = 'Save Settings';
        }
      }

      // Also update button group indicator
      if (buttonGroup) {
        let indicator = buttonGroup.querySelector('.unsaved-changes-badge');
        if (hasUnsavedChanges && !indicator) {
          indicator = document.createElement('span');
          indicator.className = 'unsaved-changes-badge';
          indicator.textContent = 'Unsaved Changes';
          buttonGroup.appendChild(indicator);
        } else if (!hasUnsavedChanges && indicator) {
          indicator.remove();
        }
      }
    }

    // Debounce utility function
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    // Event handlers
    function createSettingHandler(key, getValue) {
      const debouncedHandler = debounce((target) => {
        // Skip handling if models are being populated programmatically
        if (window.isPopulatingModels) {
          console.log('Skipping setting handler - models are being populated');
          return;
        }

        // Skip handling if a dropdown is currently open
        if (window.isDropdownOpen) {
          console.log('Skipping setting handler - dropdown is open');
          return;
        }

        const value = getValue(target);
        const keys = key.split('.');
        let targetObj = currentSettings;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!targetObj[keys[i]]) {
            targetObj[keys[i]] = {};
          }
          targetObj = targetObj[keys[i]];
        }

        targetObj[keys[keys.length - 1]] = value;

        // Update status banner immediately with new settings
        updateStatusBanner(currentSettings);

        // Mark as unsaved whenever a setting changes
        markAsUnsaved();

        // All auto-save is disabled - changes will only be saved when Save button is clicked
        // Changes are tracked in the UI but not sent to backend until manual save

        if (key === 'promptCustomization.enabled') {
          toggleSaveLastPromptVisibility(value);
        }
      }, 600); // Increased debounce delay to give more time for flag checking

      return (e) => {
        debouncedHandler(e.target);
      };
    }

    function toggleSaveLastPromptVisibility(show) {
      const saveLastPromptRow = document.getElementById('saveLastPromptRow');
      if (saveLastPromptRow) {
        saveLastPromptRow.style.display = show ? 'flex' : 'none';
      }
    }

    // Main settings save function
    function saveSettings() {
      // Add debugging to understand when this function is called
      console.log('saveSettings() called - stack trace:', new Error().stack);

      // Skip saving if models are being populated
      if (window.isPopulatingModels) {
        console.log('saveSettings() skipped - models are being populated');
        return;
      }

      // Mark as saved immediately (will show on UI before backend confirmation)
      markAsSaved();

      // Save current tab state before making any changes
      const currentActiveTab = document.querySelector('.tab-button.active')?.getAttribute('data-tab') || 'model-tab';
      sessionStorage.setItem('gitmind_active_tab', currentActiveTab);

      // Log the current checkbox state before collecting form values
      const telemetryCheckbox = document.getElementById('telemetryEnabled');
      console.log('Telemetry checkbox state at save time - checked:', telemetryCheckbox?.checked);

      const currentFormValues = {
        commitVerbose: document.getElementById('commitVerbose')?.checked || false,
        commitCaptureAllChanges: document.getElementById('commitCaptureAllChanges')?.checked || false,
        commitTargetLanguage: document.getElementById('commitTargetLanguage')?.value || 'english',
        commitStyle: document.querySelector('input[name="gm-commit-style"]:checked')?.value || 'conventional',
        showDiagnostics: document.getElementById('showDiagnostics')?.checked || false,
        telemetryEnabled: document.getElementById('telemetryEnabled')?.checked || false,
        promptCustomizationEnabled: document.getElementById('promptCustomizationEnabled')?.checked || false,
        saveLastPrompt: document.getElementById('saveLastPrompt')?.checked || false,
        encryptionEnabled: document.getElementById('encryptionEnabled')?.checked || false,
        commitBodyOptionsEnabled: document.getElementById('commitBodyOptionsEnabled')?.checked || false,
        commitBodyOptionsMaxLines: parseInt(document.getElementById('commitBodyOptionsMaxLines')?.value) || 5,
        commitLengthOptionsEnabled: document.getElementById('commitLengthOptionsEnabled')?.checked || false,
        commitLengthOptionsMaxLength: parseInt(document.getElementById('commitLengthOptionsMaxLength')?.value) || 72,
        learnFromCommitHistoryMaxCommits: parseInt(document.getElementById('learnFromCommitHistoryMaxCommits')?.value) || 50,
        learnFromCommitHistoryIncludeAuthorInfo: document.getElementById('learnFromCommitHistoryIncludeAuthorInfo')?.checked || true,
        changelogMaxCommitsEnabled: document.getElementById('changelogMaxCommitsEnabled')?.checked || false,
        changelogMaxCommits: parseInt(document.getElementById('changelogMaxCommits')?.value) || 100,
        changelogMaxVersions: parseInt(document.getElementById('changelogMaxVersions')?.value) || 10,
        changelogGroupByVersion: document.getElementById('changelogGroupByVersion')?.checked || true,
        changelogVersionOrder: document.getElementById('changelogVersionOrder')?.value || 'newest-first'
      };

      console.log('Form values collected - telemetryEnabled:', currentFormValues.telemetryEnabled);

      const newSettings = getSettingsFromForm();
      
      console.log('Settings from form - telemetry.enabled:', newSettings.telemetry?.enabled);
      console.log('Settings from form - commitStyle.style:', newSettings.commitStyle?.style);
      console.log('Saving settings:', {
        commitVerbose: newSettings.commit.verbose,
        commitStyle: newSettings.commitStyle?.style,
        showDiagnostics: newSettings.showDiagnostics,
        telemetryEnabled: newSettings.telemetry.enabled,
        promptCustomizationEnabled: newSettings.promptCustomization.enabled,
        activeTab: currentActiveTab
      });
      
      // Update current settings first
      currentSettings = newSettings;
      window.gitmindSettings = currentSettings; // Update global reference for Pro features
      
      // Update the status banner immediately
      updateStatusBanner(newSettings);
      
      // Then send the message to save settings
      vscode.postMessage({
        command: 'saveSettings',
        settings: newSettings
      });
      
      // Force a second update after a delay to ensure UI is refreshed
      setTimeout(() => {
        const container = document.getElementById('statusBannerContainer');
        if (container && container.firstElementChild) {
          // Add animation to highlight the update
          container.firstElementChild.classList.add('banner-updated');
          setTimeout(() => {
            if (container.firstElementChild) {
              container.firstElementChild.classList.remove('banner-updated');
            }
          }, 1000);
        }
        
        // Restore active tab after UI refresh using the global function
        if (window.reinitializeTabs) {
          window.reinitializeTabs();
        } else {
          // Fallback if global function not available
          setTimeout(() => {
            const tabToActivate = document.querySelector('.tab-button[data-tab="' + currentActiveTab + '"]');
            if (tabToActivate) {
              tabToActivate.click();
            }
          }, 50);
        }
      }, 300);
    }

    // Pro Features handlers - NO AUTO-SAVE
    document.getElementById('encryptionEnabled')?.addEventListener('change', function() {
      const checked = this.checked;
      console.log('Encryption toggle changed:', checked, '(not saved until Save button is clicked)');

      // Update current settings immediately (local only)
      if (!currentSettings.pro) currentSettings.pro = {};
      currentSettings.pro.encryptionEnabled = checked;

      // Update status banner immediately
      updateStatusBanner(currentSettings);

      // Mark as unsaved
      markAsUnsaved();

      // NO AUTO-SAVE: Encryption setting is only saved when user clicks Save button
      // This prevents the infinite loop issues with secure key management
    });

    // Subscription email changes affect Pro status - NO AUTO-SAVE
    const debouncedEmailHandler = debounce(function() {
      const email = this.value;

      // Update current settings immediately for UI responsiveness (local only)
      if (!currentSettings.subscription) currentSettings.subscription = {};
      currentSettings.subscription.email = email;

      // Update status banner to reflect potential Pro status change
      updateStatusBanner(currentSettings);

      // Mark as unsaved
      markAsUnsaved();

      // NO AUTO-SAVING - email is only saved when user subscribes or explicitly saves settings
    }, 500);

    document.getElementById('subscriptionEmail')?.addEventListener('input', debouncedEmailHandler);

    // Legacy license key handler removed

    document.getElementById('migrateToSecure')?.addEventListener('click', function(event) {
      event.preventDefault();
      console.log('Migrate to secure clicked');
      this.disabled = true;
      this.textContent = '🔄 Migrating...';
      
      vscode.postMessage({
        command: 'migrateToSecure'
      });
    });

    document.getElementById('checkEncryptionStatus')?.addEventListener('click', function(event) {
      event.preventDefault();
      console.log('Check encryption status clicked');
      this.disabled = true;
      this.textContent = 'Checking...';
      
      vscode.postMessage({
        command: 'checkEncryptionStatus'
      });
    });

    // Subscription event handlers - DISABLED auto-save to prevent loops
    document.getElementById('subscriptionEmail')?.addEventListener('change', function() {
      const email = this.value.trim();
      
      // Update current settings immediately (local only)
      if (!currentSettings.subscription) currentSettings.subscription = {};
      currentSettings.subscription.email = email;
      
      // Update status banner
      updateStatusBanner(currentSettings);
      
      // NO AUTO-SAVE: Email is only saved during subscription process or manual save
      console.log('Subscription email changed:', email, '(not auto-saved to prevent loops)');
    });

    document.getElementById('subscribeBtn')?.addEventListener('click', function(event) {
      event.preventDefault();
      console.log('Subscribe button clicked');
      
      // Save the email before starting subscription process
      const emailField = document.getElementById('subscriptionEmail');
      if (emailField && emailField.value.trim()) {
        const email = emailField.value.trim();
        
        // Update current settings
        if (!currentSettings.subscription) currentSettings.subscription = {};
        currentSettings.subscription.email = email;
        
        // Save the email to backend
        vscode.postMessage({
          command: 'updateSetting',
          key: 'subscription.email',
          value: email
        });
        
        // Small delay to ensure email is saved before starting subscription
        setTimeout(() => {
          vscode.postMessage({
            command: 'gitmind.subscription.subscribe'
          });
        }, 100);
      } else {
        // If no email, show error message
        showToast('Please enter your email address before subscribing', 'error');
      }
    });

    document.getElementById('manageSubscriptionBtn')?.addEventListener('click', function(event) {
      event.preventDefault();
      console.log('Manage subscription button clicked');
      vscode.postMessage({
        command: 'gitmind.subscription.manage'
      });
    });

    document.getElementById('refreshSubscriptionBtn')?.addEventListener('click', function(event) {
      event.preventDefault();
      console.log('Refresh subscription button clicked');
      this.disabled = true;
      this.textContent = 'Refreshing...';
      
      // Get the current email from the input field
      const emailField = document.getElementById('subscriptionEmail');
      const currentEmail = emailField ? emailField.value.trim() : '';
      
      vscode.postMessage({
        command: 'gitmind.subscription.refresh',
        email: currentEmail // Pass the current email being displayed
      });
      
      // Re-enable button after a short delay
      setTimeout(() => {
        this.disabled = false;
        this.textContent = 'Refresh Status';
      }, 2000);
    });

    // Provider change handler - NO AUTO-SAVE (only visual update)
    document.getElementById('apiProvider')?.addEventListener('change', function() {
      const provider = this.value;

      // Immediately update UI (no delay for visual feedback)
      document.querySelectorAll('.api-settings').forEach(el => {
        el.classList.add('hidden');
      });

      const selectedProviderSettings = document.getElementById(provider + 'Settings');
      if (selectedProviderSettings) {
        selectedProviderSettings.classList.remove('hidden');
      }

      // Update current settings locally (for UI consistency) but don't auto-save
      currentSettings.apiProvider = provider;

      // Update status banner with new provider (local only)
      updateStatusBanner(currentSettings);

      // Mark as unsaved
      markAsUnsaved();

      // NO AUTO-SAVE: Provider changes are only saved when user clicks Save button
      console.log('Provider changed to ' + provider + ' (not saved until Save button is clicked)');
    });

    // Setup provider field event listeners automatically
    function setupProviderEventListeners() {
      // Provider field patterns - API keys, models, and URLs
      const apiKeyProviders = ['gemini', 'huggingface', 'mistral', 'cohere', 'openai', 'together', 'openrouter', 'anthropic', 'deepseek', 'grok', 'perplexity'];
      const allProviders = ['gemini', 'huggingface', 'ollama', 'mistral', 'cohere', 'openai', 'together', 'openrouter', 'anthropic', 'copilot', 'deepseek', 'grok', 'perplexity', 'custom'];
      
      allProviders.forEach(provider => {
        // Set up API key listener with debouncing
        if (apiKeyProviders.includes(provider)) {
          const apiKeyElement = document.getElementById(provider + 'ApiKey');
          if (apiKeyElement && !apiKeyElement.hasAttribute('data-listener-added')) {
            apiKeyElement.setAttribute('data-listener-added', 'true');
            let apiKeyTimeout;
            apiKeyElement.addEventListener('input', function() {
              // Clear previous timeout
              if (apiKeyTimeout) {
                clearTimeout(apiKeyTimeout);
              }
              // Set a new timeout to save after user stops typing for 500ms
              apiKeyTimeout = setTimeout(() => {
                createSettingHandler(provider + '.apiKey', (el) => el.value)(this);
              }, 500);
            });
            
            // Also save immediately on blur
            apiKeyElement.addEventListener('blur', function() {
              if (apiKeyTimeout) {
                clearTimeout(apiKeyTimeout);
              }
              createSettingHandler(provider + '.apiKey', (el) => el.value)(this);
            });
          }
        }
        
        // Set up model listener
        const modelElement = document.getElementById(provider + 'Model');
        if (modelElement && !modelElement.hasAttribute('data-listener-added')) {
          
          // Skip if this element has custom handling (like Hugging Face dropdown)
          if (modelElement.hasAttribute('data-custom-handler') || modelElement.hasAttribute('data-prevent-auto-save')) {
            console.log('Skipping event handler setup for', provider, 'model - has custom handling');
            return;
          }
          
          modelElement.setAttribute('data-listener-added', 'true');
          
          // Special handling for Hugging Face - has its own dropdown handler, no auto-save needed
          if (provider === 'huggingface') {
            // For Hugging Face, the ScriptManager handles the dropdown and explicit saves
            // We only add a blur handler for cases where someone types manually without using dropdown
            modelElement.addEventListener('blur', function() {
              // Skip if models are being populated
              if (window.isPopulatingModels) {
                console.log('Skipping blur handler - models are being populated');
                return;
              }
              
              // Don't save if this was just selected from dropdown to prevent double save
              if (this.hasAttribute('data-just-selected')) {
                console.log('Skipping blur save - model was just selected from dropdown');
                return;
              }
              
              // Don't save if this element has auto-save prevention attributes
              if (this.hasAttribute('data-prevent-auto-save') || this.hasAttribute('data-no-autosave')) {
                console.log('Skipping blur save - auto-save prevention attributes found');
                return;
              }
              
              const value = this.value.trim();
              if (value && value.includes('/') && value.split('/').length === 2) {
                console.log('Saving Hugging Face model on manual entry blur:', value);
                createSettingHandler(provider + '.model', (el) => el.value)(this);
              }
            });
          } else {
            // For other providers, use immediate change detection
            modelElement.addEventListener('change', createSettingHandler(provider + '.model', (el) => el.value));
          }
        }
        
        // Set up URL listener for Ollama with debouncing
        if (provider === 'ollama') {
          const urlElement = document.getElementById(provider + 'Url');
          if (urlElement && !urlElement.hasAttribute('data-listener-added')) {
            urlElement.setAttribute('data-listener-added', 'true');
            let urlTimeout;
            urlElement.addEventListener('input', function() {
              // Clear previous timeout
              if (urlTimeout) {
                clearTimeout(urlTimeout);
              }
              // Just update the UI, no auto-save
              urlTimeout = setTimeout(() => {
                // Update local state only without sending to backend
                const value = this.value;
                const keys = (provider + '.url').split('.');
                let targetObj = currentSettings;
                
                for (let i = 0; i < keys.length - 1; i++) {
                  if (!targetObj[keys[i]]) {
                    targetObj[keys[i]] = {};
                  }
                  targetObj = targetObj[keys[i]];
                }
                
                targetObj[keys[keys.length - 1]] = value;
                
                // Update status banner
                updateStatusBanner(currentSettings);
              }, 500);
            });
            
            // Update UI state on blur without auto-saving
            urlElement.addEventListener('blur', function() {
              if (urlTimeout) {
                clearTimeout(urlTimeout);
              }
              // Just update local state
              const value = this.value;
              const keys = (provider + '.url').split('.');
              let targetObj = currentSettings;
              
              for (let i = 0; i < keys.length - 1; i++) {
                if (!targetObj[keys[i]]) {
                  targetObj[keys[i]] = {};
                }
                targetObj = targetObj[keys[i]];
              }
              
              targetObj[keys[keys.length - 1]] = value;
              
              // Update status banner
              updateStatusBanner(currentSettings);
            });
          }
        }
        
        // Set up custom API field listeners with debouncing
        if (provider === 'custom') {
          const customFields = [
            { id: 'customBaseUrl', key: 'custom.baseUrl' },
            { id: 'customEndpoint', key: 'custom.endpoint' },
            { id: 'customAuthType', key: 'custom.authType' },
            { id: 'customAuthToken', key: 'custom.authToken' },
            { id: 'customHeaderKey', key: 'custom.headerKey' },
            { id: 'customRequestFormat', key: 'custom.requestFormat' },
            { id: 'customResponseFormat', key: 'custom.responseFormat' },
            { id: 'customModel', key: 'custom.model' }
          ];
          
          customFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element && !element.hasAttribute('data-listener-added')) {
              element.setAttribute('data-listener-added', 'true');
              
              // For select elements (authType, requestFormat, responseFormat), use change event
              if (element.tagName === 'SELECT') {
                element.addEventListener('change', createSettingHandler(field.key, (el) => el.value));
              } else {
                // For text/password inputs, use debounced input with blur save
                let fieldTimeout;
                element.addEventListener('input', function() {
                  if (fieldTimeout) {
                    clearTimeout(fieldTimeout);
                  }
                  fieldTimeout = setTimeout(() => {
                    createSettingHandler(field.key, (el) => el.value)(this);
                  }, 500);
                });
                
                element.addEventListener('blur', function() {
                  if (fieldTimeout) {
                    clearTimeout(fieldTimeout);
                  }
                  createSettingHandler(field.key, (el) => el.value)(this);
                });
              }
            }
          });

          // Handle the custom provider enable toggle separately (checkbox)
          const customEnabledEl = document.getElementById('customEnabled');
          if (customEnabledEl && !customEnabledEl.hasAttribute('data-listener-added')) {
            customEnabledEl.setAttribute('data-listener-added', 'true');
            customEnabledEl.addEventListener('change', function() {
              createSettingHandler('custom.enabled', (el) => el.checked)(this);
            });
          }
        }
      });
    }

    // Handle subscription status changes from the backend
    window.addEventListener('message', event => {
      const message = event.data;
      
      if (message.command === 'proStatusChanged' && message.status === 'free') {
        console.log('Received proStatusChanged message:', message);
        
        // Update UI to reflect free status
        if (!currentSettings.subscription) currentSettings.subscription = {};
        currentSettings.subscription.status = 'free';
        
        // Disable pro features
        if (!currentSettings.pro) currentSettings.pro = {};
        currentSettings.pro.encryptionEnabled = false;
        
        // Update encryption toggle UI
        const encryptionToggle = document.getElementById('encryptionEnabled');
        if (encryptionToggle) {
          encryptionToggle.checked = false;
          encryptionToggle.disabled = true;
          
          // Add visual indication that this is a pro feature
          const encryptionContainer = encryptionToggle.closest('.toggle-item, .toggle-setting');
          const encryptionLabel = encryptionContainer?.querySelector('.toggle-label, .setting-label');
          if (encryptionLabel) {
            encryptionLabel.innerHTML = 'Encrypted API Key Storage <span class="pro-badge">PRO</span>';
          }
        }
        
        // Update status banner
        updateStatusBanner(currentSettings);
        
        // Show notification to user
        showToast(message.message || 'Subscription status changed to free. Pro features have been disabled.', 'info', true);
        
        // Automatically switch to the Pro tab to make the change visible
        const proTabButton = document.querySelector('.tab-button[data-tab="pro-tab"]');
        if (proTabButton) {
          setTimeout(() => {
            proTabButton.click();
          }, 500);
        }
      }
    });

    // Initialize event listeners on DOM content loaded
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOMContentLoaded event fired');
      
      const handlers = [
        ['commitVerbose', 'commit.verbose', (el) => el.checked],
        ['commitTargetLanguage', 'commit.targetLanguage', (el) => el.value],
        ['showDiagnostics', 'showDiagnostics', (el) => el.checked],
        ['telemetryEnabled', 'telemetry.enabled', (el) => el.checked],
        ['promptCustomizationEnabled', 'promptCustomization.enabled', (el) => el.checked],
        ['saveLastPrompt', 'promptCustomization.saveLastPrompt', (el) => el.checked],
        ['changelogMaxCommitsEnabled', 'pro.changelog.maxCommitsEnabled', (el) => el.checked]
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

      // Set up provider field event listeners
      setupProviderEventListeners();

      // Changelog Max Commits toggle: enable/disable numeric input locally (no auto-save)
      const changelogMaxCommitsEnabledEl = document.getElementById('changelogMaxCommitsEnabled');
      const changelogMaxCommitsEl = document.getElementById('changelogMaxCommits');
      if (changelogMaxCommitsEnabledEl && changelogMaxCommitsEl) {
        const applyToggleState = (enabled) => {
          // Keep disabled if Pro is disabled by overall state; this only controls the additional constraint
          changelogMaxCommitsEl.disabled = !enabled || changelogMaxCommitsEl.hasAttribute('data-force-disabled');
        };

        applyToggleState(changelogMaxCommitsEnabledEl.checked);
        changelogMaxCommitsEnabledEl.addEventListener('change', function() {
          applyToggleState(this.checked);
          // Mark unsaved (value is captured via createSettingHandler -> currentSettings)
          markAsUnsaved();
        });
      }
    });

    // Listen for settings updates from backend
    window.addEventListener('message', event => {
      const message = event.data;

      if (message.command === 'settingsUpdated' || message.command === 'updateSettings') {
        // Clear unsaved changes indicator when settings are loaded/updated from backend
        markAsSaved();
      }
    });

    // Make saveSettings function globally available for inline event handlers
    window.saveSettings = saveSettings;

    // Make setupProviderEventListeners function globally available
    window.setupProviderEventListeners = setupProviderEventListeners;

    // Make unsaved changes functions globally available
    window.markAsUnsaved = markAsUnsaved;
    window.markAsSaved = markAsSaved;
  `;
}