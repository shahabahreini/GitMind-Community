import { DEFAULT_MODELS } from './constants';

export function getMessageHandlersScript(): string {
  return `
    // Message handling
    window.addEventListener('message', event => {
      const message = event.data;
      
      const messageHandlers = {
        cleanupHuggingFaceDropdown: () => {
          if (typeof window.cleanupHuggingFaceDropdown === 'function') {
            console.log('Cleaning up HuggingFace dropdown from message handler');
            window.cleanupHuggingFaceDropdown();
          }
        },
        
        mistralModelsLoaded: () => handleModelsLoaded('mistral', message, ${JSON.stringify(DEFAULT_MODELS.mistral)}),
        cohereModelsLoaded: () => handleModelsLoaded('cohere', message, ${JSON.stringify(DEFAULT_MODELS.cohere)}),
        togetherModelsLoaded: () => handleModelsLoaded('together', message, ${JSON.stringify(DEFAULT_MODELS.together)}),
        grokModelsLoaded: () => handleModelsLoaded('grok', message, ${JSON.stringify(DEFAULT_MODELS.grok)}),
        geminiModelsLoaded: () => handleModelsLoaded('gemini', message, ${JSON.stringify(DEFAULT_MODELS.gemini)}),
        anthropicModelsLoaded: () => handleModelsLoaded('anthropic', message, ${JSON.stringify(DEFAULT_MODELS.anthropic)}),
        
        openrouterModelsLoaded: () => handleAdvancedModelsLoaded('openrouter', message, ${JSON.stringify(DEFAULT_MODELS.openrouter)}, 100),
        huggingfaceModelsLoaded: () => handleAdvancedModelsLoaded('huggingface', message, ${JSON.stringify(DEFAULT_MODELS.huggingface)}, 2000),
        ollamaModelsLoaded: () => handleAdvancedModelsLoaded('ollama', message, [], 2000),
        
        settingsSaved: () => handleSettingsSaved(message),
        apiCheckResult: () => handleApiCheckResult(message),
        rateLimitsResult: () => handleRateLimitsResult(message),
        updateSettings: () => handleUpdateSettings(message),
        migrationResult: () => handleMigrationResult(message),
        encryptionStatus: () => handleEncryptionStatus(message),
        subscriptionResult: () => handleSubscriptionResult(message),
        subscriptionRefreshed: () => handleSubscriptionRefresh(message),
        proDeactivationResult: () => handleProDeactivationResult(message),
        proActivationResult: () => handleProActivationResult(message),
        licenseValidationResult: () => handleLicenseValidationResult(message),
        actualApiKeyResponse: () => handleActualApiKeyResponse(message)
      };
      
      const handler = messageHandlers[message.command];
      if (handler) {
        handler();
      }
    });

    // Global dropdown state management
    window.isDropdownOpen = false;
    window.setDropdownState = function(isOpen) {
      window.isDropdownOpen = isOpen;
      console.log('Dropdown state changed:', isOpen);
    };

    // Track HTML select dropdown state
    document.addEventListener('mousedown', function(e) {
      const target = e.target;
      if (target.tagName === 'SELECT') {
        console.log('Select dropdown likely opened:', target.id);
        window.setDropdownState?.(true);
        
        const handleSelectClose = () => {
          console.log('Select dropdown closed:', target.id);
          window.setDropdownState?.(false);
          target.removeEventListener('blur', handleSelectClose);
          target.removeEventListener('change', handleSelectClose);
          document.removeEventListener('mousedown', handleClickOutside);
        };
        
        const handleClickOutside = (clickEvent) => {
          if (clickEvent.target !== target) {
            handleSelectClose();
          }
        };
        
        target.addEventListener('blur', handleSelectClose);
        target.addEventListener('change', handleSelectClose);
        document.addEventListener('mousedown', handleClickOutside);
      }
    });

    // Utility functions
    function getProviderDisplayName(provider) {
      const displayNames = {
        gemini: 'Google Gemini',
        huggingface: 'Hugging Face',
        ollama: 'Ollama',
        mistral: 'Mistral AI',
        cohere: 'Cohere',
        openai: 'OpenAI',
        together: 'Together AI',
        openrouter: 'OpenRouter',
        anthropic: 'Anthropic',
        copilot: 'GitHub Copilot',
        deepseek: 'DeepSeek',
        grok: 'Grok',
        perplexity: 'Perplexity'
      };
      return displayNames[provider] || provider;
    }

    function updateButton(buttonId, enabled, text) {
      const button = document.getElementById(buttonId);
      if (button) {
        button.disabled = !enabled;
        if (text) button.textContent = text;
      }
    }

    function preserveAndRestoreTabState(callback) {
      const currentActiveTab = document.querySelector('.tab-button.active')?.getAttribute('data-tab');
      if (currentActiveTab) {
        sessionStorage.setItem('gitmind_active_tab', currentActiveTab);
      }
      
      callback();
      
      setTimeout(() => {
        if (window.reinitializeTabs) {
          window.reinitializeTabs();
        } else if (currentActiveTab) {
          const tabToActivate = document.querySelector('.tab-button[data-tab="' + currentActiveTab + '"]');
          tabToActivate?.click();
        }
      }, 100);
    }

    function updateProFeaturesUI() {
      window.gitmindSettings = currentSettings;
      
      if (typeof updateProFeatureUI === 'function') {
        updateProFeatureUI(currentSettings);
      }
      
      setTimeout(() => {
        if (window.reinitializeTabs) {
          window.reinitializeTabs();
        }
      }, 100);
    }

    function animateStatusBannerUpdate() {
      setTimeout(() => {
        updateStatusBanner(currentSettings);
        
        const container = document.getElementById('statusBannerContainer');
        if (container?.firstElementChild) {
          container.firstElementChild.classList.add('banner-updated');
          setTimeout(() => {
            container.firstElementChild?.classList.remove('banner-updated');
          }, 1000);
        }
      }, 100);
    }

    // Advanced model loading handler (for providers with new dropdown system)
    function handleAdvancedModelsLoaded(provider, message, defaultModels, flagTimeout) {
      window.isPopulatingModels = true;
      
      const modelInput = document.getElementById(provider + 'Model');
      const hasCustomHandler = modelInput?.hasAttribute('data-custom-handler');
      
      if (hasCustomHandler) {
        console.log(\`Using new \${getProviderDisplayName(provider)} dropdown system - delegating to ScriptManager\`);
        
        if (message.success && message.models) {
          window[\`all\${provider.charAt(0).toUpperCase() + provider.slice(1)}Models\`] = message.models;
          window.postMessage({
            command: provider + 'ModelsLoaded',
            success: true,
            models: message.models
          }, '*');
        } else {
          window.postMessage({
            command: provider + 'ModelsLoaded',
            success: false,
            error: message.error || 'Failed to load models'
          }, '*');
        }
      } else {
        console.log(\`Using fallback \${getProviderDisplayName(provider)} handler\`);
        handleModelsLoaded(provider, message, defaultModels);
      }
      
      setTimeout(() => {
        window.isPopulatingModels = false;
      }, flagTimeout);
    }

    function handleSettingsSaved(message) {
      console.log('handleSettingsSaved called with telemetry.enabled:', message.settings?.telemetry?.enabled);
      showToast('Settings saved successfully', 'success', false);
      
      preserveAndRestoreTabState(() => {
        if (message.settings) {
          currentSettings = message.settings;
          window.gitmindSettings = currentSettings;
          
          // Log the specific telemetry checkbox state before update
          const telemetryCheckbox = document.getElementById('telemetryEnabled');
          console.log('Telemetry checkbox before update - checked:', telemetryCheckbox?.checked);
          
          updateSettingsFromMessage();
          
          // Log the telemetry checkbox state after update
          console.log('Telemetry checkbox after update - checked:', telemetryCheckbox?.checked);
          console.log('Settings telemetry.enabled:', currentSettings.telemetry?.enabled);
        }
        animateStatusBannerUpdate();
      });
    }

    function handleUpdateSettings(message) {
      if (window.isDropdownOpen && !message.forceRefresh) {
        console.log('Skipping updateSettings - dropdown is open');
        return;
      }
      
      preserveAndRestoreTabState(() => {
        currentSettings = message.settings;
        window.gitmindSettings = currentSettings;
        
        if (!message.preserveDropdowns || message.forceRefresh) {
          updateSettingsFromMessage();
        } else {
          updateSettingsFromMessagePreserveDropdowns();
        }

        updatePasswordFieldsEncryptionStatus();
        updateVisibleSettings();
        updateStatusBanner(currentSettings);
        updateProFeaturesUI();
        
        // If this is a forced refresh, make sure everything is updated
        if (message.forceRefresh) {
          console.log('Force refresh triggered - updating all UI components');
          // Add a small delay to ensure DOM updates are applied
          setTimeout(() => {
            updateProFeaturesUI();
            updateStatusBanner(currentSettings);
            updateVisibleSettings();
          }, 100);
        }
      });
    }

    function createStatusIcon(type) {
      const icons = {
        success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
        warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><circle cx="12" cy="17" r="1"></circle>',
        error: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
      };
      
      return \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\${icons[type]}</svg>\`;
    }

    function updateDialogStatus(dialogType, message, isSuccess, details) {
      const messageEl = document.getElementById(\`\${dialogType}DialogMessage\`);
      const detailsEl = document.getElementById(\`\${dialogType}DialogDetails\`);
      const spinner = document.querySelector(\`#\${dialogType}Dialog .status-spinner\`);
      
      if (spinner) spinner.style.display = 'none';
      
      const statusType = message.warning ? 'warning' : (isSuccess ? 'success' : 'error');
      const statusText = message.warning ? 'warning' : (isSuccess ? 'success' : 'error');
      
      if (messageEl) {
        messageEl.textContent = isSuccess ? 
          (message.warning ? 'Connection successful with warning' : 'Connection successful!') :
          'Connection failed';
        messageEl.className = \`status-\${statusType}\`;
      }
      
      if (detailsEl) {
        detailsEl.innerHTML = \`
          <div class="status-\${statusType}">
            \${createStatusIcon(statusType)}
            <div>\${details}</div>
          </div>
        \`;
        detailsEl.className = \`status-details \${statusText}\`;
      }
    }

    function handleApiCheckResult(message) {
      const isSuccess = message.success;
      let details = '';
      
      if (isSuccess) {
        details = \`
          <h4>\${message.warning ? 'Connection Successful - Warning' : 'Connection Details'}</h4>
          <ul>
            <li><strong>Provider:</strong> \${getProviderDisplayName(message.provider)}</li>
            <li><strong>Model:</strong> \${message.model || 'Default'}</li>
            <li><strong>Response Time:</strong> \${message.responseTime || 'N/A'} ms</li>
          </ul>
          \${message.details ? '<p>' + message.details + '</p>' : ''}
          \${message.warning ? '<h4>Warning</h4><p>' + message.warning + '</p>' : ''}
          \${message.troubleshooting ? '<h4>Troubleshooting</h4><p>' + message.troubleshooting + '</p>' : ''}
        \`;
        
        const toastMessage = message.warning ? 
          'API connection successful with warning: ' + message.warning :
          'API connection successful';
        const toastType = message.warning ? 'warning' : 'success';
        showToast(toastMessage, toastType);
      } else {
        details = \`
          <h4>Error Details</h4>
          <p>\${message.error || 'Unknown error occurred'}</p>
          \${message.troubleshooting ? '<h4>Troubleshooting</h4><p>' + message.troubleshooting + '</p>' : ''}
        \`;
        showToast('API connection failed: ' + (message.error || 'Unknown error'), 'error');
      }
      
      updateDialogStatus('apiStatus', message, isSuccess, details);
    }

    function handleRateLimitsResult(message) {
      const isSuccess = message.success;
      let details = '';
      
      if (isSuccess) {
        details = '<h4>Rate Limit Information</h4>';
        
        if (typeof message.limits === 'object' && message.limits) {
          details += '<ul>';
          
          if (message.limits.reset) {
            const resetDate = new Date();
            resetDate.setSeconds(resetDate.getSeconds() + message.limits.reset);
            details += \`<li><strong>Reset in:</strong> \${message.limits.reset} seconds (\${resetDate.toLocaleTimeString()})</li>\`;
          }
          
          const limitFields = [
            { key: 'limit', label: 'Per-minute limit', suffix: ' tokens' },
            { key: 'remaining', label: 'Remaining', suffix: ' tokens' },
            { key: 'queryCost', label: 'This request cost', suffix: ' tokens' },
            { key: 'monthlyLimit', label: 'Monthly limit', suffix: ' tokens' },
            { key: 'monthlyRemaining', label: 'Monthly remaining', suffix: ' tokens' }
          ];
          
          limitFields.forEach(field => {
            if (message.limits[field.key]) {
              details += \`<li><strong>\${field.label}:</strong> \${message.limits[field.key]}\${field.suffix}</li>\`;
            }
          });
          
          details += '</ul>';
        } else {
          details += \`<p>\${message.limits || 'No specific limits reported'}</p>\`;
        }
        
        if (message.notes) {
          details += \`<div class="rate-limit-note"><p><strong>Note:</strong> \${message.notes}</p></div>\`;
        }
        
        showToast('Rate limits retrieved successfully', 'success');
      } else {
        details = \`
          <h4>Error Details</h4>
          <p>\${message.error || 'Unknown error occurred'}</p>
        \`;
        showToast('Failed to check rate limits: ' + (message.error || 'Unknown error'), 'error');
      }
      
      updateDialogStatus('rateLimits', message, isSuccess, details);
    }

    function handleMigrationResult(message) {
      updateButton('migrateToSecure', true, 'Migrate Keys');
      
      const prefix = message.automatic ? 'Auto: ' : '';
      const toastMessage = message.success ? 
        prefix + (message.message || 'API keys migration completed successfully!') :
        prefix + 'Migration failed: ' + (message.error || 'Unknown error');
      
      showToast(toastMessage, message.success ? 'success' : 'error', true);
    }

    function handleEncryptionStatus(message) {
      updateButton('checkEncryptionStatus', true, 'Check Status');
      
      if (message.status && message.detailedStatus) {
        const { status } = message;
        const detailed = message.detailedStatus;
        
        const createProviderSection = (providers, title, iconClass) => {
          if (providers.length === 0) return '';
          
          return \`
            <div class="encryption-providers-section">
              <h2 class="encryption-providers-title">\${title}</h2>
              <div class="encryption-providers-list">
                \${providers.map(p => \`
                  <span class="encryption-provider-tag \${iconClass}">\${p}</span>
                \`).join('')}
              </div>
            </div>
          \`;
        };
        
        const statusHtml = \`
          <div class="encryption-status-report">
            
            <!-- Main Grid Layout -->
            <div class="encryption-status-grid">
              
              <!-- Encryption Status Card -->
              <div class="encryption-status-card">
                <div class="encryption-status-card-header">
                  <svg class="encryption-icon \${status.enabled ? '' : 'inactive'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="\${status.enabled ? 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' : 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'}"></path>
                  </svg>
                  <span class="encryption-status-card-title">Encryption: \${status.enabled ? 'Active' : 'Inactive'}</span>
                </div>
                <div class="encryption-status-card-subtitle">\${detailed.userType.toUpperCase()} USER</div>
              </div>

              <!-- API Keys Card -->
              <div class="encryption-status-card">
                <div class="encryption-status-card-header">
                  <svg class="key-icon \${detailed.totalProviders > 0 ? '' : 'empty'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"></path>
                  </svg>
                  <span class="encryption-status-card-title">API Keys: \${detailed.totalProviders}</span>
                </div>
                <div class="encryption-status-card-subtitle">\${detailed.encryptedProviders.length} Encrypted</div>
              </div>

              <!-- VS Code Version Card -->
              <div class="encryption-status-card">
                <div class="encryption-status-card-header">
                  <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                  </svg>
                  <span class="encryption-status-card-title">VS Code: \${detailed.vscodeVersion}</span>
                </div>
              </div>

              <!-- Status Card -->
              <div class="encryption-status-card">
                <div class="encryption-status-card-header">
                  <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span class="encryption-status-card-title">Status: \${status.available ? 'Available' : 'Unavailable'}</span>
                </div>
              </div>

            </div>

            <!-- Status Details -->
            \${status.reason ? \`
              <div class="encryption-status-details">
                <div class="encryption-status-details-header">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span class="encryption-status-details-title">Status Details</span>
                </div>
                <div class="encryption-status-details-content">\${status.reason}</div>
              </div>
            \` : ''}

            <!-- Provider Lists -->
            \${createProviderSection(detailed.encryptedProviders, 'Encrypted Providers', 'encrypted')}
            \${createProviderSection(detailed.plainTextProviders, 'Plain Text Providers', 'plain-text')}
            
            \${detailed.totalProviders === 0 ? \`
              <div class="encryption-no-keys">
                <div class="encryption-no-keys-icon">🔑</div>
                <div class="encryption-no-keys-title">No API Keys Found</div>
                <div class="encryption-no-keys-description">Configure your first API key to see encryption status</div>
              </div>
            \` : ''}

          </div>
        \`;
        
        // Ensure encryption status styles are loaded
        if (window.addEncryptionStatusStyles) {
          window.addEncryptionStatusStyles();
        }
        
        showDetailedStatus('Encryption Status Report', statusHtml, true);
        showToast('Encryption status checked successfully', 'success', false);
      } else if (message.status) {
        const { status, providersWithKeys } = message;
        let statusMessage = \`Encryption Status: \${status.enabled ? 'Enabled' : 'Disabled'}\\n\`;
        statusMessage += \`Available: \${status.available ? 'Yes' : 'No'}\\n\`;
        statusMessage += \`Reason: \${status.reason}\\n\`;
        statusMessage += providersWithKeys?.length > 0 ? 
          \`\\nProviders with keys: \${providersWithKeys.join(', ')}\` : 
          '\\nNo API keys found';
        
        showDetailedStatus('Encryption Status Report', statusMessage);
        showToast('Encryption status checked successfully', 'success', false);
      } else {
        showToast('Failed to check encryption status: ' + (message.error || 'Unknown error'), 'error', true);
      }
    }

    function handleSubscriptionResult(message) {
      if (message.success && message.url) {
        console.log('Subscription URL:', message.url);
      } else if (!message.success) {
        showToast('Subscription action failed: ' + (message.error || 'Unknown error'), 'error', true);
      }
    }

    function handleSubscriptionRefresh(message) {
      updateButton('refreshSubscriptionBtn', true, 'Refresh Status');
      console.log('Subscription refresh result:', message);
      
      if (message.success) {
        if (message.subscription) {
          console.log('Updating subscription data:', message.subscription);
          currentSettings.subscription = message.subscription;
          
          const emailField = document.getElementById('subscriptionEmail');
          if (emailField && message.subscription.email) {
            emailField.value = message.subscription.email;
          }
          
          updateSettingsFromMessage();
          animateStatusBannerUpdate();
        }
        showToast('Subscription status refreshed successfully', 'success', false);
      } else {
        showToast('Failed to refresh subscription: ' + (message.error || 'Unknown error'), 'error', true);
      }
    }

    function handleProLifecycleResult(message, isActivation, buttonIds, successMessage) {
      console.log(\`Pro \${isActivation ? 'activation' : 'deactivation'} result:\`, message);
      
      buttonIds.forEach(id => updateButton(id, true));
      
      if (message.success) {
        showToast(successMessage, 'success', false);
        
        if (isActivation) {
          if (typeof vscode !== 'undefined') {
            vscode.postMessage({
              command: 'refreshSettings',
              refreshUI: true,
              forceReload: true
            });
          }
        } else {
          // Handle deactivation
          if (currentSettings.pro) {
            Object.assign(currentSettings.pro, {
              licenseKey: '',
              instanceId: '',
              validationStatus: 'invalid',
              lastValidation: ''
            });
          }
        }
        
        setTimeout(() => {
          updateSettingsFromMessage();
          updateStatusBanner(currentSettings);
          updateProFeaturesUI();
        }, isActivation ? 200 : 0);
      } else {
        const action = isActivation ? 'activate' : 'deactivate';
        showToast(\`Failed to \${action} Pro features: \` + (message.message || 'Unknown error'), 'error', true);
      }
    }

    function handleProDeactivationResult(message) {
      handleProLifecycleResult(
        message, 
        false, 
        ['deactivateProBtn'], 
        'Pro features deactivated successfully'
      );
      
      // Reset deactivation button text specifically
      updateButton('deactivateProBtn', true, 'Deactivate');
      
      // Force update of password field encryption status when Pro is deactivated
      // This ensures [ENCRYPTED] placeholders are cleared and keys become visible
      if (message.success) {
        // Update encryption status for all password fields
        updatePasswordFieldsEncryptionStatus();
        
        // Force refresh settings to show restored API keys
        if (typeof vscode !== 'undefined') {
          setTimeout(() => {
            vscode.postMessage({
              command: 'refreshSettings',
              refreshUI: true,
              forceReload: true
            });
          }, 100);
        }
      }
    }

    function handleProActivationResult(message) {
      handleProLifecycleResult(
        message, 
        true, 
        ['activateLicenseBtn', 'activateOrderBtn'], 
        'Pro features activated successfully!'
      );
      
      // Reset activation button texts specifically
      updateButton('activateLicenseBtn', true, 'Activate License');
      updateButton('activateOrderBtn', true, 'Activate Order');
    }

    function handleLicenseValidationResult(message) {
      console.log('License validation result:', message);
      updateButton('validateLicenseBtn', true, 'Validate');
      
      if (message.success) {
        const isValid = message.isValid;
        const toastMessage = isValid ? 'License is valid and active' : 'License is not valid or has expired';
        const toastType = isValid ? 'success' : 'warning';
        
        showToast(toastMessage, toastType, !isValid);
        
        if (currentSettings.pro) {
          currentSettings.pro.validationStatus = isValid ? 'valid' : 'invalid';
          if (isValid) {
            currentSettings.pro.lastValidation = new Date().toISOString();
          }
        }
        
        updateSettingsFromMessage();
        updateStatusBanner(currentSettings);
        updateProFeaturesUI();
      } else {
        showToast('Failed to validate license: ' + (message.message || 'Unknown error'), 'error', true);
      }
    }

    function handleActualApiKeyResponse(message) {
      console.log('Actual API key response:', { provider: message.provider, success: message.success });
      
      if (message.success && message.apiKey) {
        // Copy the actual API key to clipboard
        const valueToCopy = message.apiKey;
        
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(valueToCopy).then(() => {
            // Show "Copied" hint and success message
            showCopiedHint(message.provider);
            if (typeof vscode !== 'undefined') {
              vscode.postMessage({
                type: 'showMessage',
                level: 'info',
                message: 'Encrypted API key copied to clipboard successfully!'
              });
            }
          }).catch(err => {
            console.error('Failed to copy decrypted API key to clipboard:', err);
            // Use fallback method
            fallbackCopyToClipboard(valueToCopy, message.provider);
          });
        } else {
          // Use fallback method
          fallbackCopyToClipboard(valueToCopy, message.provider);
        }
      } else {
        // Handle error case
        const errorMessage = message.error || 'Failed to retrieve API key for copying';
        if (typeof vscode !== 'undefined') {
          vscode.postMessage({
            type: 'showMessage',
            level: 'error',
            message: errorMessage
          });
        }
      }
    }
    
    // Fallback clipboard method for when navigator.clipboard is not available
    function fallbackCopyToClipboard(text, provider) {
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
          // Show "Copied" hint and success message
          if (provider) {
            showCopiedHint(provider);
          }
          if (typeof vscode !== 'undefined') {
            vscode.postMessage({
              type: 'showMessage',
              level: 'info',
              message: 'Encrypted API key copied to clipboard successfully!'
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
            message: 'Failed to copy API key to clipboard'
          });
        }
      } finally {
        document.body.removeChild(textArea);
      }
    }

    // Show "Copied" hint on the copy button
    function showCopiedHint(provider) {
      const copyButton = document.querySelector(\`button[onclick="copyAPIKey('\${provider}ApiKey')"]\`);
      if (copyButton) {
        const originalText = copyButton.innerHTML;
        const originalTitle = copyButton.title;
        
        // Show "Copied" state
        copyButton.innerHTML = '✓';
        copyButton.title = 'Copied to clipboard!';
        copyButton.style.color = '#28a745';
        copyButton.style.fontWeight = 'bold';
        
        // Reset after 2 seconds
        setTimeout(() => {
          copyButton.innerHTML = originalText;
          copyButton.title = originalTitle;
          copyButton.style.color = '';
          copyButton.style.fontWeight = '';
        }, 2000);
      }
    }
    
    // Make showCopiedHint available globally
    window.showCopiedHint = showCopiedHint;
  `;
}