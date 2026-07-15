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
        groqModelsLoaded: () => handleModelsLoaded('groq', message, ${JSON.stringify(DEFAULT_MODELS.groq)}),
        deepseekModelsLoaded: () => handleModelsLoaded('deepseek', message, ${JSON.stringify(DEFAULT_MODELS.deepseek)}),
        geminiModelsLoaded: () => handleModelsLoaded('gemini', message, ${JSON.stringify(DEFAULT_MODELS.gemini)}),
        anthropicModelsLoaded: () => handleModelsLoaded('anthropic', message, ${JSON.stringify(DEFAULT_MODELS.anthropic)}),
        openaiModelsLoaded: () => handleModelsLoaded('openai', message, ${JSON.stringify(DEFAULT_MODELS.openai)}),
        minimaxModelsLoaded: () => handleModelsLoaded('minimax', message, ${JSON.stringify(DEFAULT_MODELS.minimax)}),
        copilotModelsLoaded: () => handleModelsLoaded('copilot', message, ${JSON.stringify(DEFAULT_MODELS.copilot)}),
        zaiModelsLoaded: () => handleModelsLoaded('zai', message, ${JSON.stringify(DEFAULT_MODELS.zai)}),
        perplexityModelsLoaded: () => handleModelsLoaded('perplexity', message, ${JSON.stringify(DEFAULT_MODELS.perplexity)}),
        nvidiaModelsLoaded: () => handleAdvancedModelsLoaded('nvidia', message, ${JSON.stringify(DEFAULT_MODELS.nvidia)}, 100),
        
        openrouterModelsLoaded: () => handleAdvancedModelsLoaded('openrouter', message, ${JSON.stringify(DEFAULT_MODELS.openrouter)}, 100),
        huggingfaceModelsLoaded: () => handleAdvancedModelsLoaded('huggingface', message, ${JSON.stringify(DEFAULT_MODELS.huggingface)}, 2000),
        ollamaModelsLoaded: () => handleAdvancedModelsLoaded('ollama', message, [], 2000),
        
        switchTab: () => {
          const tabId = message.tabId;
          if (!tabId) return;
          // Retry until the tab system and the target tab button exist
          // (handles the case where the panel is still initializing).
          let tries = 0;
          (function applySwitch() {
            const ready = typeof window.switchToTab === 'function' &&
              document.querySelector('.tab-button[data-tab="' + tabId + '"]');
            if (ready) {
              window.switchToTab(tabId);
            } else if (tries++ < 50) {
              setTimeout(applySwitch, 100);
            }
          })();
        },

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
        actualApiKeyResponse: () => handleActualApiKeyResponse(message),
        commitHistoryStatsReady: () => handleCommitHistoryStatsReady(message),
        commitHistoryStatsError: () => handleCommitHistoryStatsError(message),
        changelogStatsReady: () => handleChangelogStatsReady(message),
        changelogStatsError: () => handleChangelogStatsError(message)
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
    (function() {
      let activeSelect = null;

      const handleSelectClose = (e) => {
        if (activeSelect) {
          console.log('Select dropdown closed:', activeSelect.id);
          window.setDropdownState?.(false);
          activeSelect.removeEventListener('blur', handleSelectClose);
          activeSelect.removeEventListener('change', handleSelectClose);
          activeSelect = null;
        }
      };

      document.addEventListener('mousedown', function(e) {
        const target = e.target;
        if (target.tagName === 'SELECT') {
          // If we click the same select that is already "active", it might be closing
          if (activeSelect === target) {
            // Browsers behave differently here, but blur/change usually handle it
            return;
          }

          // If another select was active, close it first
          if (activeSelect && activeSelect !== target) {
            handleSelectClose();
          }

          console.log('Select dropdown likely opened:', target.id);
          activeSelect = target;
          window.setDropdownState?.(true);
          
          target.addEventListener('blur', handleSelectClose);
          target.addEventListener('change', handleSelectClose);
        } else if (activeSelect) {
          // Clicked something else, the select will blur
          // handleSelectClose will be called by the blur listener
        }
      });
    })();

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
        minimax: 'MiniMax',
        copilot: 'GitHub Copilot',
        deepseek: 'DeepSeek',
        grok: 'Grok',
        groq: 'Groq',
        perplexity: 'Perplexity',
        zai: 'Z.ai',
        custom: 'Custom API'
      };
      return displayNames[provider] || provider;
    }

    function updateButton(buttonId, enabled, text) {
      const button = document.getElementById(buttonId);
      if (button) {
        button.disabled = !enabled;
        button.classList.remove('loading');
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
      showToast('Settings saved successfully', 'success', false);
      
      preserveAndRestoreTabState(() => {
        if (message.settings) {
          currentSettings = message.settings;
          window.gitmindSettings = currentSettings;
          
          updateSettingsFromMessage();
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

      function escapeHtml(text) {
        return String(text)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      function linkify(text) {
        const urlRegex = new RegExp('(https?:\\/\\/[^\\s<]+)', 'g');
        return text.replace(
          urlRegex,
          '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
      }

      function formatMultilineText(text) {
        const safe = escapeHtml(text);
        const withLinks = linkify(safe);
        return withLinks.split('\\n').join('<br>');
      }
      
      if (isSuccess) {
        details =
          '<h4>' + (message.warning ? 'Connection Successful - Warning' : 'Connection Details') + '</h4>' +
          '<ul>' +
          '<li><strong>Provider:</strong> ' + getProviderDisplayName(message.provider) + '</li>' +
          '<li><strong>Model:</strong> ' + (message.model || 'Default') + '</li>' +
          '<li><strong>Response Time:</strong> ' + (message.responseTime || 'N/A') + ' ms</li>' +
          '</ul>' +
          (message.details ? '<p>' + formatMultilineText(message.details) + '</p>' : '') +
          (message.warning ? '<h4>Warning</h4><p>' + formatMultilineText(message.warning) + '</p>' : '') +
          (message.troubleshooting ? '<h4>Troubleshooting</h4><p>' + formatMultilineText(message.troubleshooting) + '</p>' : '');
        const toastMessage = message.warning ? 
          'API connection successful with warning: ' + message.warning :
          'API connection successful';
        const toastType = message.warning ? 'warning' : 'success';
        showToast(toastMessage, toastType);
      } else {
        details =
          '<h4>Error Details</h4>' +
          '<p>' + formatMultilineText(message.error || 'Unknown error occurred') + '</p>' +
          (message.troubleshooting ? '<h4>Troubleshooting</h4><p>' + formatMultilineText(message.troubleshooting) + '</p>' : '');
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
      // If the user cancelled the confirmation dialog, just reset the button
      if (message.cancelled) {
        updateButton('deactivateProBtn', true, 'Deactivate Pro');
        return;
      }

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
      updateButton('validateLicenseBtn', true, 'Validate License');
      
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
      // Handle custom provider's different field naming
      const fieldId = provider === 'custom' ? 'customAuthToken' : \`\${provider}ApiKey\`;
      const copyButton = document.querySelector(\`button[onclick="copyAPIKey('\${fieldId}')"]\`);
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

    function handleCommitHistoryStatsReady(message) {
      setButtonLoadingState('previewCommitHistoryBtn', false, '', 'Preview Stats');
      
      if (message.stats) {
        const stats = message.stats;
        const statsHtml = createStatsDisplay(stats, 'Commit History Analysis');
        showDetailedStatus('Git History Statistics', statsHtml, true);
      }
    }

    function handleCommitHistoryStatsError(message) {
      setButtonLoadingState('previewCommitHistoryBtn', false, '', 'Preview Stats');
      showToast('Failed to analyze git history: ' + (message.error || 'Unknown error'), 'error', true);
    }

    function handleChangelogStatsReady(message) {
      setButtonLoadingState('previewChangelogBtn', false, '', 'Preview Stats');
      
      if (message.stats) {
        const stats = message.stats;
        const statsHtml = createStatsDisplay(stats, 'Changelog Generation');
        showDetailedStatus('Changelog Statistics', statsHtml, true);
      }
    }

    function handleChangelogStatsError(message) {
      setButtonLoadingState('previewChangelogBtn', false, '', 'Preview Stats');
      showToast('Failed to analyze git history: ' + (message.error || 'Unknown error'), 'error', true);
    }

    function createStatsDisplay(stats, context) {
      const warningClass = stats.warnings.length > 0 ? 'has-warnings' : '';
      const recommendationClass = stats.recommendations.length > 0 ? 'has-recommendations' : '';

      // Determine Token Budget Tier
      let tokenTier = 'Standard';
      let tokenClass = 'tier-standard';
      if (stats.estimatedTokens < 5000) {
        tokenTier = 'Lightweight';
        tokenClass = 'tier-light';
      } else if (stats.estimatedTokens > 50000) {
        tokenTier = 'Extensive';
        tokenClass = 'tier-heavy';
      } else if (stats.estimatedTokens > 25000) {
        tokenTier = 'Heavy';
        tokenClass = 'tier-moderate';
      }

      // Determine Conventional Rating Tier
      let convRating = 'Good';
      let convClass = 'rating-good';
      if (stats.conventionalCommitPercentage >= 80) {
        convRating = 'Excellent';
        convClass = 'rating-excellent';
      } else if (stats.conventionalCommitPercentage < 50) {
        convRating = 'Mixed';
        convClass = 'rating-mixed';
      }

      // SVG Icon helper definitions
      const icons = {
        commit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><line x1="12" y1="9" x2="12" y2="15"/></svg>',
        zap: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        target: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        file: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
        warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        bulb: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.55.62 2.96 1.63 4 .76.76 1.23 1.52 1.41 2.5"/></svg>'
      };

      function getCommitTypeColor(type) {
        var lower = type.toLowerCase();
        if (lower.startsWith('feat')) return 'var(--type-feat, #10b981)';
        if (lower.startsWith('fix')) return 'var(--type-fix, #ef4444)';
        if (lower.startsWith('doc')) return 'var(--type-docs, #0ea5e9)';
        if (lower.startsWith('refactor') || lower.startsWith('style')) return 'var(--type-refactor, #a855f7)';
        if (lower.startsWith('test')) return 'var(--type-test, #f59e0b)';
        return 'var(--type-chore, #64748b)';
      }

      var commitCountMeta = stats.actualCommitsFound < stats.totalCommits ? stats.actualCommitsFound + '/' + stats.totalCommits + ' Fetched' : 'Complete';
      var authorCountMeta = stats.uniqueAuthors + (stats.uniqueAuthors === 1 ? ' Author' : ' Authors');

      var commitTypesHtml = Object.keys(stats.commitTypes).length > 0 ? \`
        <div class="stats-card-section">
          <div class="section-card-header">
            \${icons.file}
            <h3>Commit Types Distribution</h3>
          </div>
          <div class="commit-types-grid">
            \${Object.entries(stats.commitTypes)
              .sort(function(a, b) { return b[1] - a[1]; })
              .map(function(entry) {
                var type = entry[0];
                var count = entry[1];
                var percent = Math.round((count / stats.actualCommitsFound) * 100);
                var color = getCommitTypeColor(type);
                return \`
                  <div class="commit-type-row">
                    <div class="type-row-header">
                      <span class="type-name-badge" style="border-color: \${color}; color: \${color};">\${type}</span>
                      <span class="type-count-text">\${count} (\${percent}%)</span>
                    </div>
                    <div class="type-bar-track">
                      <div class="type-bar-fill" style="width: \${percent}%; background-color: \${color};"></div>
                    </div>
                  </div>
                \`;
              }).join('')}
          </div>
        </div>
      \` : '';

      var topAuthorsHtml = stats.topAuthors.length > 0 ? \`
        <div class="stats-card-section">
          <div class="section-card-header">
            \${icons.users}
            <h3>Top Contributors</h3>
          </div>
          <div class="contributors-list">
            \${stats.topAuthors.map(function(author, index) {
              return \`
                <div class="contributor-item">
                  <span class="rank-badge">#\${index + 1}</span>
                  <span class="author-name">\${author.name}</span>
                  <span class="author-commit-badge">\${author.count} \${author.count === 1 ? 'commit' : 'commits'}</span>
                </div>
              \`;
            }).join('')}
          </div>
        </div>
      \` : '';

      var warningsHtml = stats.warnings.length > 0 ? \`
        <div class="alert-callout warning-callout \${warningClass}">
          <div class="callout-header">
            \${icons.warning}
            <span>Warnings</span>
          </div>
          <ul class="callout-list">
            \${stats.warnings.map(function(warning) { return '<li>' + warning + '</li>'; }).join('')}
          </ul>
        </div>
      \` : '';

      var recommendationsHtml = stats.recommendations.length > 0 ? \`
        <div class="alert-callout info-callout \${recommendationClass}">
          <div class="callout-header">
            \${icons.bulb}
            <span>Recommendations</span>
          </div>
          <ul class="callout-list">
            \${stats.recommendations.map(function(rec) { return '<li>' + rec + '</li>'; }).join('')}
          </ul>
        </div>
      \` : '';

      return \`
        <div class="git-stats-container">
          <div class="stats-header-badge">
            <span class="context-label">\${context || 'Analysis'}</span>
          </div>

          <!-- Summary KPI Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-card-head">
                <div class="stat-icon-wrapper">\${icons.commit}</div>
                <span class="stat-meta-badge">\${commitCountMeta}</span>
              </div>
              <div class="stat-value">\${stats.actualCommitsFound.toLocaleString()}</div>
              <div class="stat-label">Commits Analyzed</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-head">
                <div class="stat-icon-wrapper">\${icons.zap}</div>
                <span class="stat-meta-badge \${tokenClass}">\${tokenTier}</span>
              </div>
              <div class="stat-value">\${stats.estimatedTokens.toLocaleString()}</div>
              <div class="stat-label">Est. Tokens</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-head">
                <div class="stat-icon-wrapper">\${icons.users}</div>
                <span class="stat-meta-badge">\${authorCountMeta}</span>
              </div>
              <div class="stat-value">\${stats.uniqueAuthors}</div>
              <div class="stat-label">Contributors</div>
            </div>

            <div class="stat-card">
              <div class="stat-card-head">
                <div class="stat-icon-wrapper">\${icons.target}</div>
                <span class="stat-meta-badge \${convClass}">\${convRating}</span>
              </div>
              <div class="stat-value">\${stats.conventionalCommitPercentage}%</div>
              <div class="stat-label">Conventional</div>
            </div>
          </div>

          <!-- Date Range Timeline -->
          <div class="stats-card-section">
            <div class="section-card-header">
              \${icons.calendar}
              <h3>Analysis Date Range</h3>
            </div>
            <div class="date-timeline-wrapper">
              <span class="date-pill">\${stats.dateRange.oldest}</span>
              <span class="timeline-arrow">➔</span>
              <span class="date-pill">\${stats.dateRange.newest}</span>
            </div>
          </div>

          <!-- Commit Types Breakdown -->
          \${commitTypesHtml}

          <!-- Top Contributors Leaderboard -->
          \${topAuthorsHtml}

          <!-- File Changes & Quality Metrics -->
          <div class="stats-card-section">
            <div class="section-card-header">
              \${icons.file}
              <h3>Repository Impact Metrics</h3>
            </div>
            <div class="impact-metrics-row">
              <div class="metric-chip">
                <span class="metric-title">Files Changed</span>
                <span class="metric-val">\${stats.filesChangedStats.total.toLocaleString()}</span>
              </div>
              <div class="metric-chip">
                <span class="metric-title">Avg / Commit</span>
                <span class="metric-val">\${stats.filesChangedStats.average}</span>
              </div>
              <div class="metric-chip">
                <span class="metric-title">Max Single Commit</span>
                <span class="metric-val">\${stats.filesChangedStats.max}</span>
              </div>
              <div class="metric-chip">
                <span class="metric-title">Avg Msg Length</span>
                <span class="metric-val">\${stats.averageMessageLength} chars</span>
              </div>
            </div>
          </div>

          <!-- Warnings Alert Callout -->
          \${warningsHtml}

          <!-- Recommendations Alert Callout -->
          \${recommendationsHtml}
        </div>

        <style>
          .git-stats-container {
            padding: 4px;
            max-width: 900px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            font-family: var(--vscode-font-family);
          }
          
          .stats-header-badge {
            margin-bottom: 4px;
          }
          .context-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            background: var(--vscode-button-background, #007acc);
            color: var(--vscode-button-foreground, #ffffff);
            padding: 3px 10px;
            border-radius: 12px;
            display: inline-block;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
          }
          
          .stat-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          }

          .stat-card-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }

          .stat-icon-wrapper {
            color: var(--vscode-textLink-foreground, #007acc);
            display: flex;
            align-items: center;
          }

          .stat-meta-badge {
            font-size: 10px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-descriptionForeground);
            border: 1px solid var(--vscode-panel-border);
          }

          .tier-light { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
          .tier-standard { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; border-color: rgba(14, 165, 233, 0.3); }
          .tier-moderate { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }
          .tier-heavy { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

          .rating-excellent { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
          .rating-good { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; border-color: rgba(14, 165, 233, 0.3); }
          .rating-mixed { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }
          
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--vscode-foreground);
            line-height: 1.2;
            margin-bottom: 2px;
          }
          
          .stat-label {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-weight: 500;
          }
          
          .stats-card-section {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 14px 16px;
          }

          .section-card-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            color: var(--vscode-foreground);
          }
          .section-card-header h3 {
            margin: 0;
            font-size: 13px;
            font-weight: 600;
          }

          .date-timeline-wrapper {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .date-pill {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-panel-border);
            padding: 4px 10px;
            border-radius: 6px;
            font-family: var(--vscode-editor-font-family, monospace);
            font-size: 12px;
            color: var(--vscode-foreground);
          }
          .timeline-arrow {
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
          }

          .commit-types-grid {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .commit-type-row {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .type-row-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .type-name-badge {
            font-family: var(--vscode-editor-font-family, monospace);
            font-size: 11px;
            font-weight: 700;
            padding: 1px 8px;
            border-radius: 4px;
            border: 1px solid;
            background: rgba(128, 128, 128, 0.05);
          }
          .type-count-text {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
          }
          .type-bar-track {
            height: 6px;
            width: 100%;
            background: var(--vscode-input-background, rgba(128, 128, 128, 0.15));
            border-radius: 3px;
            overflow: hidden;
          }
          .type-bar-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.3s ease;
          }

          .contributors-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .contributor-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 10px;
            background: var(--vscode-input-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
          }
          .rank-badge {
            font-size: 11px;
            font-weight: 700;
            color: var(--vscode-button-background, #007acc);
            background: rgba(0, 122, 204, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            min-width: 24px;
            text-align: center;
            margin-right: 8px;
          }
          .author-name {
            flex: 1;
            color: var(--vscode-editorWarning-foreground);
            font-size: 13px;
            margin: 8px 0 0 0;
          }
          
          .quality-success {
            color: var(--vscode-testing-iconPassed);
            font-size: 13px;
            margin: 8px 0 0 0;
          }
        </style>
      \`;
    }
  `;
}
