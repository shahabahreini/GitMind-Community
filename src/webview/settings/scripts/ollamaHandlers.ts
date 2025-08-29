export function getOllamaHandlersScript(): string {
  return `
    // Ollama Model Dropdown Functionality
    function initializeOllamaModelDropdown() {
      console.log('Initializing Ollama model dropdown');
      
      if (typeof vscode === 'undefined') {
        console.error('VS Code API not available!');
        return;
      }
      
      const elements = {
        modelInput: document.getElementById('ollamaModel'),
        loadModelsBtn: document.getElementById('loadModelsBtn'),
        dropdown: document.getElementById('modelDropdown'),
        get modelList() { return this.dropdown?.querySelector('.model-list'); },
        get loadingIndicator() { return this.dropdown?.querySelector('.dropdown-loading'); },
        get errorIndicator() { return this.dropdown?.querySelector('.dropdown-error'); },
        get emptyIndicator() { return this.dropdown?.querySelector('.dropdown-empty'); },
        get ollamaUrl() { return document.getElementById('ollamaUrl'); }
      };
      
      if (!elements.modelInput || !elements.loadModelsBtn || !elements.dropdown) {
        console.error('Required elements not found:', elements);
        return;
      }

      const state = {
        availableModels: [],
        isDropdownOpen: false
      };

      const dropdownStates = {
        loading: { loading: true, error: false, empty: false, list: false },
        error: { loading: false, error: true, empty: false, list: false },
        empty: { loading: false, error: false, empty: true, list: false },
        populated: { loading: false, error: false, empty: false, list: true }
      };

      // Utility functions
      function isProUser() {
        const hasValidLicense = (window.gitmindSettings?.pro?.licenseKey || window.gitmindSettings?.pro?.orderId) &&
            window.gitmindSettings?.pro?.validationStatus === 'valid';
        const devModeEnabled = typeof window !== 'undefined' && window.GITMIND_DEV_MODE === true;
        return hasValidLicense || devModeEnabled;
      }

      function showProUpgradeMessage(feature) {
        const message = \`\${feature} is a Pro feature. Upgrade to GitMind Pro to unlock advanced model loading capabilities.\`;
        if (typeof showToast === 'function') {
          showToast(message, 'error');
        } else {
          console.warn(feature + ' requires GitMind Pro');
        }
      }

      function setDropdownState(stateName, message = '') {
        const stateConfig = dropdownStates[stateName];
        if (!stateConfig) return;

        elements.loadingIndicator.style.display = stateConfig.loading ? 'block' : 'none';
        elements.errorIndicator.style.display = stateConfig.error ? 'block' : 'none';
        elements.emptyIndicator.style.display = stateConfig.empty ? 'block' : 'none';
        elements.modelList.style.display = stateConfig.list ? 'block' : 'none';

        if (stateConfig.error && message) {
          elements.errorIndicator.textContent = message;
        }
      }

      function setLoadingButtonState(isLoading) {
        elements.loadModelsBtn.disabled = isLoading;
        elements.loadModelsBtn.classList.toggle('loading', isLoading);
      }

      function toggleDropdown(show) {
        state.isDropdownOpen = show;
        elements.dropdown.style.display = show ? 'block' : 'none';
        window.setDropdownState?.(show);
      }

      function updateSelection(visibleItems, selectedIndex) {
        elements.modelList.querySelectorAll('li.selected').forEach(item => {
          item.classList.remove('selected');
        });

        const selectedItem = visibleItems[selectedIndex];
        if (selectedItem) {
          selectedItem.classList.add('selected');
          selectedItem.scrollIntoView({ block: 'nearest' });
        }
      }

      function filterModels(filter) {
        const items = elements.modelList.querySelectorAll('li');
        const visibleItems = [];

        items.forEach(item => {
          const modelName = item.dataset.modelName.toLowerCase();
          const isMatch = modelName.includes(filter.toLowerCase());
          
          item.classList.toggle('filtered-out', !isMatch);
          item.classList.remove('selected');
          
          if (isMatch) visibleItems.push(item);
        });

        // Auto-select first visible item
        if (visibleItems.length > 0) {
          updateSelection(visibleItems, 0);
        }

        return visibleItems;
      }

      function selectModel(modelName) {
        elements.modelInput.value = modelName;
        toggleDropdown(false);
        
        // Trigger change event to save the setting
        elements.modelInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      function createModelListItem(modelName) {
        const li = document.createElement('li');
        li.dataset.modelName = modelName;
        li.innerHTML = \`<div class="model-name">\${modelName}</div>\`;
        li.addEventListener('click', () => selectModel(modelName));
        return li;
      }

      function populateModels(models) {
        console.log('Populating models:', models);
        state.availableModels = models;
        elements.modelList.innerHTML = '';

        if (models.length === 0) {
          setDropdownState('empty');
          setLoadingButtonState(false);
          return;
        }

        const fragment = document.createDocumentFragment();
        models.forEach(modelName => {
          fragment.appendChild(createModelListItem(modelName));
        });
        elements.modelList.appendChild(fragment);

        setDropdownState('populated');
        setLoadingButtonState(false);
        console.log('Models populated successfully');
      }

      async function loadOllamaModels(baseUrl) {
        console.log('Loading Ollama models from:', baseUrl);
        setLoadingButtonState(true);
        toggleDropdown(true);
        setDropdownState('loading');

        try {
          console.log('Sending loadOllamaModels message');
          vscode.postMessage({
            command: 'loadOllamaModels',
            baseUrl: baseUrl
          });
          
          // Timeout handler
          setTimeout(() => {
            if (elements.loadModelsBtn.disabled && elements.loadModelsBtn.classList.contains('loading')) {
              console.warn('No response received after 10 seconds - request may have failed');
              setDropdownState('error', 'Request timeout - check if Ollama is running and accessible');
              setLoadingButtonState(false);
            }
          }, 10000);
          
        } catch (error) {
          console.error('Error sending loadOllamaModels message:', error);
          setDropdownState('error', 'Failed to load models: ' + error.message);
          setLoadingButtonState(false);
        }
      }

      // Event handlers
      const eventHandlers = {
        loadModelsClick: async () => {
          if (!isProUser()) {
            showProUpgradeMessage('Load Available Models');
            return;
          }

          const ollamaUrl = elements.ollamaUrl.value || 'http://localhost:11434';
          console.log('Load models button clicked, URL:', ollamaUrl);
          
          if (typeof vscode === 'undefined') {
            console.error('VS Code API not available!');
            setDropdownState('error', 'VS Code API not available - cannot load models');
            return;
          }
          
          try {
            await loadOllamaModels(ollamaUrl);
          } catch (error) {
            console.error('Error in loadOllamaModels:', error);
            setDropdownState('error', 'Error loading models: ' + error.message);
            setLoadingButtonState(false);
          }
        },

        inputFocus: () => {
          if (state.availableModels.length > 0) {
            toggleDropdown(true);
          }
        },

        inputChange: (e) => {
          filterModels(e.target.value);
          if (state.availableModels.length > 0) {
            toggleDropdown(true);
          }
        },

        documentClick: (e) => {
          if (!e.target.closest('.searchable-dropdown')) {
            toggleDropdown(false);
          }
        },

        keyboardNavigation: (e) => {
          if (!state.isDropdownOpen) return;

          const visibleItems = elements.modelList.querySelectorAll('li:not(.filtered-out)');
          const selectedItem = elements.modelList.querySelector('li.selected');
          let selectedIndex = Array.from(visibleItems).indexOf(selectedItem);

          const keyActions = {
            ArrowDown: () => {
              e.preventDefault();
              selectedIndex = Math.min(selectedIndex + 1, visibleItems.length - 1);
              updateSelection(visibleItems, selectedIndex);
            },
            ArrowUp: () => {
              e.preventDefault();
              selectedIndex = Math.max(selectedIndex - 1, 0);
              updateSelection(visibleItems, selectedIndex);
            },
            Enter: () => {
              e.preventDefault();
              if (selectedItem) {
                selectModel(selectedItem.dataset.modelName);
              }
            },
            Escape: () => {
              e.preventDefault();
              toggleDropdown(false);
            }
          };

          const action = keyActions[e.key];
          if (action) action();
        },

        messageReceived: (event) => {
          const message = event.data;
          console.log('Received message from extension:', message);
          
          if (message.command === 'ollamaModelsLoaded') {
            if (message.success) {
              populateModels(message.models);
            } else {
              console.error('Failed to load models:', message.error);
              setDropdownState('error', message.error || 'Failed to load models');
              setLoadingButtonState(false);
            }
          }
        }
      };

      // Setup event listeners
      function setupEventListeners() {
        elements.loadModelsBtn.addEventListener('click', eventHandlers.loadModelsClick);
        elements.modelInput.addEventListener('focus', eventHandlers.inputFocus);
        elements.modelInput.addEventListener('input', eventHandlers.inputChange);
        elements.modelInput.addEventListener('keydown', eventHandlers.keyboardNavigation);
        document.addEventListener('click', eventHandlers.documentClick);
        window.addEventListener('message', eventHandlers.messageReceived);
      }

      // Initialize
      setupEventListeners();
    }
  `;
}