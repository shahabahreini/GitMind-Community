import { DEFAULT_MODELS } from './constants';

export function getModelHandlingScript(): string {
  return `
    // Helper function to get correct button ID for providers
    function getLoadButtonId(provider) {
      const buttonIdMap = {
        'deepseek': 'loadDeepSeekModels',
        'huggingface': 'loadHuggingFaceModels',
        'openrouter': 'loadOpenRouterModels',
        'minimax': 'loadMiniMaxModels'
      };

      // Use mapped ID if exists, otherwise use standard capitalization
      return buttonIdMap[provider] || ('load' + provider.charAt(0).toUpperCase() + provider.slice(1) + 'Models');
    }

    // Model loading handlers
    function handleModelLoad(provider, defaultModels, commandId) {
      const modelSelect = document.getElementById(provider + 'Model');
      const loadButton = document.getElementById(getLoadButtonId(provider));
      
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

    function handleModelsLoaded(provider, message, defaultModels) {
      const modelSelect = document.getElementById(provider + 'Model');
      const loadButton = document.getElementById(getLoadButtonId(provider));
      
      if (modelSelect) {
        const currentValue = modelSelect.value;
        
        if (message.success && message.models && message.models.length > 0) {
          if (provider === 'huggingface') {
            // For Hugging Face, it's a text input, not a select
            // We don't need to populate options, just show success message
            showToast('Hugging Face models loaded successfully', 'success');
          } else {
            // For other providers (like Mistral), populate the select
            // Set flag to prevent auto-save during model population
            window.isPopulatingModels = true;
            
            modelSelect.innerHTML = '';
            
            message.models.forEach(modelId => {
              const option = document.createElement('option');
              option.value = modelId;
              option.textContent = modelId;
              option.selected = modelId === currentValue || 
                                (currentValue === '' && modelId === currentSettings[provider].model);
              modelSelect.appendChild(option);
            });
            
            // Clear the flag after all processing is complete (longer than debounce delay)
            setTimeout(() => {
              window.isPopulatingModels = false;
            }, 1000);
            
            showToast(provider.charAt(0).toUpperCase() + provider.slice(1) + ' models loaded successfully', 'success');
          }
        } else {
          if (provider === 'huggingface') {
            // For Hugging Face, just show error
            showToast('Failed to load Hugging Face models: ' + (message.error || 'Unknown error'), 'error');
          } else {
            // For other providers, add default models
            // Set flag to prevent auto-save during model population
            window.isPopulatingModels = true;
            
            modelSelect.innerHTML = '';
            
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
            
            // Clear the flag after all processing is complete (longer than debounce delay)
            setTimeout(() => {
              window.isPopulatingModels = false;
            }, 1000);
            
            showToast('Failed to load ' + provider + ' models: ' + (message.error || 'Unknown error'), 'error');
          }
        }
        
        // Reset button state using global setButtonLoadingState function
        const buttonId = getLoadButtonId(provider);
        if (typeof window.setButtonLoadingState === 'function') {
          window.setButtonLoadingState(buttonId, false);
        } else if (loadButton) {
          // Fallback if setButtonLoadingState is not available
          loadButton.textContent = loadButton.textContent.replace('Loading...', 'Load Available Models');
          loadButton.disabled = false;
          loadButton.classList.remove('loading');
        }

        // Reset loading flag
        const loadingFlagName = provider + 'ModelsLoading';
        if (typeof window[loadingFlagName] !== 'undefined') {
          window[loadingFlagName] = false;
        }
      }
    }
  `;
}

export function getModelEventListenersScript(): string {
  return `
    // Model loading event listeners are now managed by ScriptManager.ts
    // to provide consistent loading states and Pro feature validation.
    console.log('Legacy model event listeners deactivated - managed by ScriptManager');
  `;
}