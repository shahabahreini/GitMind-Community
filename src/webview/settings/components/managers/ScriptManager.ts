// src/webview/settings/components/managers/ScriptManager.ts

export class ScriptManager {
    public renderScript(): string {
        return `
            <script>
                ${this.getSharedUtilities()}
                ${this.getTabInitialization()}
                ${this.getEventHandlers()}
                ${this.getUtilityFunctions()}
                ${this.getDropdownManager()}
                
                // Initialize on load
                document.addEventListener('DOMContentLoaded', function() {
                    console.log('ScriptManager DOMContentLoaded event fired');
                    initializeTabs();
                    // Use a small delay to ensure all DOM elements are ready
                    setTimeout(() => {
                        console.log('Initializing event handlers...');
                        initializeEventHandlers();
                        initializeDropdowns();
                    }, 50);
                });
            </script>
        `;
    }

    private getSharedUtilities(): string {
        return `
            // Shared utility functions
            function isProUser() {
                const hasValidLicense = (window.gitmindSettings?.pro?.licenseKey || window.gitmindSettings?.pro?.orderId) &&
                    window.gitmindSettings?.pro?.validationStatus === 'valid';
                const devModeEnabled = typeof window !== 'undefined' && window.GITMIND_DEV_MODE === true;
                return hasValidLicense || devModeEnabled;
            }

            function showProUpgradeMessage(feature) {
                if (typeof showToast === 'function') {
                    showToast(feature + ' is a Pro feature. Upgrade to GitMind Pro to unlock advanced model loading capabilities.', 'error');
                } else {
                    console.warn(feature + ' requires GitMind Pro');
                }
            }

            function setButtonLoadingState(buttonId, isLoading, loadingText = 'Loading...', defaultText = 'Load Available Models') {
                const btn = document.getElementById(buttonId);
                if (btn) {
                    btn.disabled = isLoading;
                    btn.textContent = isLoading ? loadingText : defaultText;
                    if (isLoading) {
                        btn.classList.add('loading');
                    } else {
                        btn.classList.remove('loading');
                    }
                }
            }

            function showToastMessage(message, type, toastShownFlag) {
                if (typeof showToast === 'function' && !window[toastShownFlag]) {
                    showToast(message, type);
                    window[toastShownFlag] = true;
                    setTimeout(() => {
                        window[toastShownFlag] = false;
                    }, 3000);
                }
            }

            function createModelLoadHandler(config) {
                return () => {
                    if (!isProUser()) {
                        showProUpgradeMessage('Load Available Models');
                        return;
                    }

                    const loadingFlag = config.loadingFlag;
                    if (window[loadingFlag]) {
                        console.log(config.name + ' models already loading, ignoring duplicate call');
                        return;
                    }

                    const btn = document.getElementById(config.buttonId);
                    if (btn && (btn.disabled || btn.classList.contains('loading'))) {
                        console.log(config.name + ' models already loading by button state, ignoring duplicate call');
                        return;
                    }

                    setButtonLoadingState(config.buttonId, true);
                    window[loadingFlag] = true;
                    window[config.toastShownFlag] = false;

                    // Show loading state in dropdown if it exists
                    if (config.dropdownId) {
                        const dropdown = document.getElementById(config.dropdownId);
                        if (dropdown) {
                            const loadingIndicator = dropdown.querySelector('.dropdown-loading');
                            const errorIndicator = dropdown.querySelector('.dropdown-error');
                            const emptyIndicator = dropdown.querySelector('.dropdown-empty');
                            const modelList = dropdown.querySelector('.model-list');
                            
                            if (loadingIndicator) {
                                loadingIndicator.style.display = 'block';
                                if (errorIndicator) errorIndicator.style.display = 'none';
                                if (emptyIndicator) emptyIndicator.style.display = 'none';
                                if (modelList) modelList.style.display = 'none';
                                dropdown.style.display = 'block';
                            }
                        }
                    }

                    if (typeof vscode !== 'undefined') {
                        console.log('Sending ' + config.commandId + ' command');
                        vscode.postMessage({
                            command: 'executeCommand',
                            commandId: config.commandId
                        });
                    }
                };
            }
        `;
    }

    private getTabInitialization(): string {
        return `
            function initializeTabs() {
                const tabButtons = document.querySelectorAll('.tab-button');
                
                // Set up tab button click handlers
                tabButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const tabId = button.getAttribute('data-tab');
                        
                        // Remove active class from all buttons and content
                        document.querySelectorAll('.tab-button').forEach(btn => {
                            btn.classList.remove('active');
                        });
                        
                        document.querySelectorAll('.tab-content').forEach(content => {
                            content.classList.remove('active');
                        });
                        
                        // Add active class to clicked button and corresponding content
                        button.classList.add('active');
                        document.getElementById(tabId)?.classList.add('active');
                        
                        // Save the active tab ID to localStorage
                        try {
                            localStorage.setItem('gitmind.activeTab', tabId);
                        } catch (e) {
                            console.log('Could not save active tab to localStorage:', e);
                        }
                    });
                });
                
                // Restore the active tab from localStorage
                try {
                    const savedTab = localStorage.getItem('gitmind.activeTab');
                    if (savedTab) {
                        const tabButton = document.querySelector('[data-tab="' + savedTab + '"]');
                        if (tabButton) {
                            tabButton.click();
                        }
                    }
                } catch (e) {
                    console.log('Could not restore active tab from localStorage:', e);
                }
            }
        `;
    }

    private getEventHandlers(): string {
        return `
            function initializeEventHandlers() {
                console.log('Initializing event handlers');
                
                // License activation handler
                attachButtonHandler('activateLicenseBtn', () => {
                    const licenseKey = getInputValue('licenseKeyInput');
                    if (!licenseKey) {
                        showMessage('error', 'Please enter a license key');
                        return;
                    }
                    
                    setButtonLoadingState('activateLicenseBtn', true, 'Activating...', 'Activate License');
                    
                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({
                            command: 'activateProLicense',
                            licenseKey: licenseKey
                        });
                    }
                });
                
                // Order activation handler
                attachButtonHandler('activateOrderBtn', () => {
                    const orderId = getInputValue('orderIdInput');
                    if (!orderId) {
                        showMessage('error', 'Please enter an order ID');
                        return;
                    }
                    const email = getInputValue('subscriptionEmail');
                    if (!email) {
                        showMessage('error', 'Please enter your email address');
                        return;
                    }
                    
                    setButtonLoadingState('activateOrderBtn', true, 'Activating...', 'Activate Order');
                    
                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({
                            command: 'activateProOrder',
                            orderId: orderId,
                            customerEmail: email
                        });
                    }
                });
                
                // License validation handler
                attachButtonHandler('validateLicenseBtn', () => {
                    setButtonLoadingState('validateLicenseBtn', true, 'Validating...', 'Validate License');
                    
                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({
                            command: 'validateProLicense'
                        });
                    }
                });
                
                // Pro deactivation handler
                attachButtonHandler('deactivateProBtn', () => {
                    const confirmed = confirm('Are you sure you want to deactivate GitMind Pro? This will revert to the free version and release your license for use on another device.');
                    
                    if (!confirmed) {
                        return;
                    }
                    
                    setButtonLoadingState('deactivateProBtn', true, 'Deactivating...', 'Deactivate Pro');
                    
                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({
                            command: 'deactivatePro',
                            callApi: true
                        });
                    }
                });
                
                // Encryption status handler
                attachButtonHandler('checkEncryptionStatus', () => {
                    postVSCodeMessage('gitmind.checkEncryptionStatus');
                });
                
                // Subscription handlers (subscribeBtn is handled in eventHandlers.ts to save email first)
                // manageSubscriptionBtn and refreshSubscriptionBtn are also handled in eventHandlers.ts
                
                // Upgrade button handlers - navigate to subscription tab
                attachButtonHandler('upgradeBtn', () => {
                    navigateToSubscriptionTab();
                });
                
                attachButtonHandler('upgradeBtn1', () => {
                    navigateToSubscriptionTab();
                });
                
                attachButtonHandler('upgradeBtn2', () => {
                    navigateToSubscriptionTab();
                });
                
                // "Upgrade to GitMind Pro" button from CommitStyleRenderer
                attachButtonHandler('upgradeToGitMindProBtn', () => {
                    navigateToSubscriptionTab();
                });
                
                // Subscribe button from Free Features tab
                attachButtonHandler('subscribeFromFreeBtn', () => {
                    navigateToSubscriptionTab();
                });
                
                // Preview Commit History Stats button handler
                attachButtonHandler('previewCommitHistoryBtn', () => {
                    if (!isProUser()) {
                        showProUpgradeMessage('Commit History Analysis');
                        return;
                    }

                    const maxCommits = parseInt(document.getElementById('learnFromCommitHistoryMaxCommits')?.value) || 50;
                    const includeAuthorInfo = document.getElementById('learnFromCommitHistoryIncludeAuthorInfo')?.checked ?? true;

                    setButtonLoadingState('previewCommitHistoryBtn', true, 'Analyzing...', 'Preview Stats');

                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({
                            command: 'previewCommitHistoryStats',
                            maxCommits,
                            includeAuthorInfo
                        });
                    }
                });

                // Analyze Commit History button handler
                attachButtonHandler('analyzeCommitHistoryBtn', () => {
                    if (!isProUser()) {
                        showProUpgradeMessage('Commit History Analysis');
                        return;
                    }

                    // Check global flag to prevent concurrent analyses
                    if (window.commitHistoryAnalysisInProgress) {
                        console.log('Commit history analysis already in progress, ignoring duplicate request');
                        return;
                    }

                    const button = document.getElementById('analyzeCommitHistoryBtn');
                    if (button && button.disabled) {
                        console.log('Analysis button is disabled, ignoring click');
                        return;
                    }

                    // Set global flag and button state
                    window.commitHistoryAnalysisInProgress = true;
                    setButtonLoadingState('analyzeCommitHistoryBtn', true, 'Analyzing...', 'Analyze Commit History');

                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({
                            command: 'executeCommand',
                            commandId: 'gitmind.learnFromCommitHistory'
                        });

                        // Fallback timeout in case no response is received
                        setTimeout(() => {
                            window.commitHistoryAnalysisInProgress = false;
                            setButtonLoadingState('analyzeCommitHistoryBtn', false, '', 'Analyze Commit History');
                        }, 30000); // 30 seconds timeout
                    }
                });

                // Preview Changelog Stats button handler
                attachButtonHandler('previewChangelogBtn', () => {
                    if (!isProUser()) {
                        showProUpgradeMessage('Changelog Generation');
                        return;
                    }

                    const maxCommits = parseInt(document.getElementById('changelogMaxCommits')?.value) || 100;
                    const groupByVersion = document.getElementById('changelogGroupByVersion')?.checked ?? true;

                    setButtonLoadingState('previewChangelogBtn', true, 'Analyzing...', 'Preview Stats');

                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({
                            command: 'previewChangelogStats',
                            maxCommits,
                            groupByVersion
                        });
                    }
                });

                // Generate Changelog button handler
                attachButtonHandler('generateChangelogBtn', () => {
                    if (!isProUser()) {
                        showProUpgradeMessage('Changelog Generation');
                        return;
                    }

                    // Check global flag to prevent concurrent generations
                    if (window.changelogGenerationInProgress) {
                        console.log('Changelog generation already in progress, ignoring duplicate request');
                        return;
                    }

                    const button = document.getElementById('generateChangelogBtn');
                    if (button && button.disabled) {
                        console.log('Changelog button is disabled, ignoring click');
                        return;
                    }

                    // Set global flag and button state
                    window.changelogGenerationInProgress = true;
                    setButtonLoadingState('generateChangelogBtn', true, 'Generating...', 'Generate Changelog');

                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({
                            command: 'executeCommand',
                            commandId: 'gitmind.generateChangelog'
                        });

                        // Fallback timeout in case no response is received
                        setTimeout(() => {
                            window.changelogGenerationInProgress = false;
                            setButtonLoadingState('generateChangelogBtn', false, '', 'Generate Changelog');
                        }, 60000); // 60 seconds timeout for changelog generation
                    }
                });
                
                // Model loading handlers - using shared configuration
                const modelConfigs = [
                    {
                        buttonId: 'loadMistralModels',
                        commandId: 'gitmind.loadMistralModels',
                        name: 'Mistral',
                        loadingFlag: 'mistralModelsLoading'
                    },
                    {
                        buttonId: 'loadCohereModels',
                        commandId: 'gitmind.loadCohereModels',
                        name: 'Cohere',
                        loadingFlag: 'cohereModelsLoading'
                    },
                    {
                        buttonId: 'loadTogetherModels',
                        commandId: 'gitmind.loadTogetherModels',
                        name: 'Together AI',
                        loadingFlag: 'togetherModelsLoading'
                    },
                    {
                        buttonId: 'loadHuggingFaceModels',
                        commandId: 'gitmind.loadHuggingFaceModels',
                        name: 'Hugging Face',
                        loadingFlag: 'huggingfaceModelsLoading',
                        dropdownId: 'huggingfaceModelDropdown',
                        toastShownFlag: '_huggingFaceToastShown'
                    },
                    {
                        buttonId: 'loadOpenRouterModels',
                        commandId: 'gitmind.loadOpenRouterModels',
                        name: 'OpenRouter',
                        loadingFlag: 'openrouterModelsLoading',
                        dropdownId: 'openrouterModelDropdown',
                        toastShownFlag: '_openrouterToastShown'
                    },
                    {
                        buttonId: 'loadOllamaModels',
                        commandId: 'gitmind.loadOllamaModels',
                        name: 'Ollama',
                        loadingFlag: 'ollamaModelsLoading',
                        dropdownId: 'ollamaModelDropdown',
                        toastShownFlag: '_ollamaToastShown'
                    },
                    {
                        buttonId: 'loadGrokModels',
                        commandId: 'gitmind.loadGrokModels',
                        name: 'Grok',
                        loadingFlag: 'grokModelsLoading'
                    }
                ];

                modelConfigs.forEach(config => {
                    window[config.loadingFlag] = false;
                    if (config.toastShownFlag) {
                        window[config.toastShownFlag] = false;
                    }
                    attachButtonHandler(config.buttonId, createModelLoadHandler(config));
                });
                
                // Prevent form controls in Pro tab from switching tabs
                preventTabSwitching('#pro-tab input, #pro-tab button');
            }
        `;
    }

    private getUtilityFunctions(): string {
        return `
            // Global flag to prevent concurrent analyses
            window.commitHistoryAnalysisInProgress = false;
            
            function attachButtonHandler(buttonId, handler) {
                console.log('Attaching handler for button:', buttonId);
                const button = document.getElementById(buttonId);
                if (button) {
                    if (button.hasAttribute('data-handler-attached')) {
                        console.log('Handler already attached for button:', buttonId, 'skipping duplicate');
                        return;
                    }
                    
                    console.log('Button found:', buttonId, 'Element:', button);
                    button.addEventListener('click', function(event) {
                        console.log('Button clicked:', buttonId);
                        event.preventDefault();
                        handler(event);
                    });
                    
                    button.setAttribute('data-handler-attached', 'true');
                } else {
                    console.log('Button not found:', buttonId);
                }
            }
            
            function getInputValue(inputId) {
                const input = document.getElementById(inputId);
                return input ? input.value.trim() : '';
            }
            
            function postVSCodeMessage(commandId, args = []) {
                if (typeof vscode !== 'undefined') {
                    vscode.postMessage({
                        command: 'executeCommand',
                        commandId: commandId,
                        args: args
                    });
                }
            }
            
            function showMessage(type, message) {
                if (typeof vscode !== 'undefined') {
                    vscode.postMessage({
                        command: 'showMessage',
                        type: type,
                        message: message
                    });
                }
            }
            
            function navigateToSubscriptionTab() {
                console.log('Navigating to subscription tab...');
                const subscriptionTabButton = document.querySelector('[data-tab="subscription-tab"]');
                if (subscriptionTabButton) {
                    console.log('Found subscription tab button, clicking...');
                    subscriptionTabButton.click();
                } else {
                    console.log('Subscription tab button not found, trying alternative selector...');
                    // Try alternative selectors
                    const altButton = document.querySelector('.tab-button[data-tab="subscription-tab"]') || 
                                    document.querySelector('button[data-tab="subscription-tab"]') ||
                                    document.getElementById('subscription-tab-button');
                    if (altButton) {
                        console.log('Found alternative subscription tab button, clicking...');
                        altButton.click();
                    } else {
                        console.error('Could not find subscription tab button with any selector');
                        // Fallback: try to execute the subscribe command
                        if (typeof vscode !== 'undefined') {
                            vscode.postMessage({
                                command: 'executeCommand',
                                commandId: 'gitmind.subscribe'
                            });
                        }
                    }
                }
            }
            
            function preventTabSwitching(selector) {
                console.log('Preventing tab switching for:', selector);
            }
            
            // FormUtils functions for browser context
            function togglePasswordVisibility(fieldId) {
                const input = document.getElementById(fieldId);
                const wrapper = input?.closest('.password-input-wrapper');
                const eyeIcon = wrapper?.querySelector('.eye-icon');
                const eyeOffIcon = wrapper?.querySelector('.eye-off-icon');

                if (!input || !eyeIcon || !eyeOffIcon) {
                    return;
                }

                const isEncrypted = input.dataset.encrypted === 'true' || input.value === '[ENCRYPTED]';
                if (isEncrypted && input.type === 'password') {
                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({
                            type: 'showMessage',
                            level: 'warning',
                            message: 'Cannot reveal encrypted data. Please disable encryption first to view API keys.'
                        });
                    }
                    return;
                }

                if (input.type === 'password') {
                    input.type = 'text';
                    eyeIcon.style.display = 'none';
                    eyeOffIcon.style.display = 'block';
                } else {
                    input.type = 'password';
                    eyeIcon.style.display = 'block';
                    eyeOffIcon.style.display = 'none';
                }
            }

            function copyAPIKey(fieldId) {
                if (!isProUser()) {
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
                        showCopiedHint(fieldId);
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
                            showCopiedHint(fieldId);
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

            // Show "Copied" hint on the copy button
            function showCopiedHint(fieldId) {
                const copyButton = document.querySelector(\`button[onclick="copyAPIKey('\${fieldId}')"]\`);
                if (copyButton) {
                    const originalText = copyButton.innerHTML;
                    const originalTitle = copyButton.title;
                    
                    // Show "Copied" state
                    copyButton.innerHTML = '✓ Copied';
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
        `;
    }

    private getDropdownManager(): string {
        return `
            // Generic dropdown manager
            function createDropdownManager(config) {
                if (window[config.initFlag]) {
                    console.log(config.name + ' dropdown already initialized, skipping');
                    return;
                }
                
                console.log('Initializing ' + config.name + ' model dropdown');
                
                const modelInput = document.getElementById(config.inputId);
                const dropdown = document.getElementById(config.dropdownId);
                
                if (!modelInput || !dropdown) {
                    console.log('Required elements not found for ' + config.name + ' dropdown');
                    return;
                }
                
                const modelList = dropdown.querySelector('.model-list');
                const loadingIndicator = dropdown.querySelector('.loading');
                const errorIndicator = dropdown.querySelector('.error');
                const emptyIndicator = dropdown.querySelector('.empty');

                let allModels = [];
                let filteredModels = [];
                let selectedIndex = -1;
                let isOpen = false;

                dropdown.style.display = 'none';

                function setupInputEvents() {
                    const inputHandler = function(e) {
                        const query = e.target.value.toLowerCase().trim();
                        
                        if (allModels.length === 0) return;
                        
                        if (window[config.filterTimeoutKey]) {
                            clearTimeout(window[config.filterTimeoutKey]);
                        }
                        
                        window[config.filterTimeoutKey] = setTimeout(() => {
                            filteredModels = allModels.filter(model => 
                                model.toLowerCase().includes(query)
                            );
                            
                            renderFilteredModels();
                            
                            if (filteredModels.length > 0) {
                                showDropdown();
                            } else {
                                hideDropdown();
                            }
                            
                            selectedIndex = -1;
                        }, 150);
                    };
                    
                    const focusHandler = function() {
                        if (allModels.length > 0) {
                            const query = modelInput.value.toLowerCase().trim();
                            filteredModels = query ? 
                                allModels.filter(model => model.toLowerCase().includes(query)) : 
                                allModels.slice(0, 50);
                            
                            renderFilteredModels();
                            if (filteredModels.length > 0) {
                                showDropdown();
                            }
                        } else {
                            hideDropdown();
                        }
                    };
                    
                    const blurHandler = function(e) {
                        const relatedTarget = e.relatedTarget;
                        if (relatedTarget && dropdown.contains(relatedTarget)) {
                            return;
                        }
                        
                        setTimeout(() => {
                            const activeElement = document.activeElement;
                            if (!activeElement || (!dropdown.contains(activeElement) && activeElement !== modelInput)) {
                                hideDropdown();
                            }
                        }, 150);
                    };
                    
                    const keydownHandler = function(e) {
                        if (!isOpen || filteredModels.length === 0) return;

                        switch (e.key) {
                            case 'ArrowDown':
                                e.preventDefault();
                                selectedIndex = Math.min(selectedIndex + 1, filteredModels.length - 1);
                                updateSelection();
                                break;
                                
                            case 'ArrowUp':
                                e.preventDefault();
                                selectedIndex = Math.max(selectedIndex - 1, -1);
                                updateSelection();
                                break;
                                
                            case 'Enter':
                                e.preventDefault();
                                if (selectedIndex >= 0 && selectedIndex < filteredModels.length) {
                                    selectModel(filteredModels[selectedIndex]);
                                }
                                break;
                                
                            case 'Escape':
                                e.preventDefault();
                                hideDropdown();
                                break;
                        }
                    };
                    
                    modelInput.addEventListener('input', inputHandler);
                    modelInput.addEventListener('focus', focusHandler);
                    modelInput.addEventListener('blur', blurHandler);
                    modelInput.addEventListener('keydown', keydownHandler);
                }

                function renderFilteredModels() {
                    modelList.innerHTML = '';
                    
                    filteredModels.forEach((modelName, index) => {
                        const li = document.createElement('li');
                        li.textContent = modelName;
                        li.style.padding = '8px 12px';
                        li.style.cursor = 'pointer';
                        li.style.borderBottom = '1px solid var(--vscode-widget-border)';
                        
                        li.addEventListener('mouseenter', () => {
                            selectedIndex = index;
                            updateSelection();
                        });
                        
                        li.addEventListener('mousedown', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            selectModel(modelName);
                        });
                        
                        modelList.appendChild(li);
                    });
                    
                    if (filteredModels.length === 50 && allModels.length > 50) {
                        const infoLi = document.createElement('li');
                        infoLi.textContent = 'Showing first 50 results. Type to filter further.';
                        infoLi.style.padding = '8px 12px';
                        infoLi.style.fontStyle = 'italic';
                        infoLi.style.color = 'var(--vscode-descriptionForeground)';
                        infoLi.style.borderTop = '1px solid var(--vscode-widget-border)';
                        modelList.appendChild(infoLi);
                    }
                    
                    selectedIndex = -1;
                }

                function updateSelection() {
                    modelList.querySelectorAll('li').forEach((li, index) => {
                        if (index === selectedIndex) {
                            li.style.backgroundColor = 'var(--vscode-list-activeSelectionBackground)';
                            li.style.color = 'var(--vscode-list-activeSelectionForeground)';
                            li.scrollIntoView({ block: 'nearest' });
                        } else {
                            li.style.backgroundColor = '';
                            li.style.color = '';
                        }
                    });
                }

                function selectModel(modelName) {
                    console.log('Selecting ' + config.name + ' model:', modelName);
                    modelInput.value = modelName;
                    hideDropdown();
                    
                    const event = new Event('change', { bubbles: true });
                    modelInput.dispatchEvent(event);
                }

                function showDropdown() {
                    dropdown.style.display = 'block';
                    modelList.style.display = 'block';
                    loadingIndicator.style.display = 'none';
                    errorIndicator.style.display = 'none';
                    emptyIndicator.style.display = 'none';
                    isOpen = true;
                }

                function hideDropdown() {
                    dropdown.style.display = 'none';
                    isOpen = false;
                    selectedIndex = -1;
                }

                function showError(message) {
                    console.log('Showing ' + config.name + ' error:', message);
                    errorIndicator.textContent = message;
                    dropdown.style.display = 'block';
                    errorIndicator.style.display = 'block';
                    loadingIndicator.style.display = 'none';
                    modelList.style.display = 'none';
                    emptyIndicator.style.display = 'none';
                    isOpen = false;
                }

                function loadModels(models) {
                    console.log('Loading', models.length, config.name + ' models into dropdown');
                    
                    allModels = models;
                    filteredModels = models.slice(0, 50);
                    
                    if (models.length === 0) {
                        emptyIndicator.style.display = 'block';
                        loadingIndicator.style.display = 'none';
                        errorIndicator.style.display = 'none';
                        modelList.style.display = 'none';
                        return;
                    }
                    
                    hideDropdown();
                }

                function handleMessage(event) {
                    const message = event.data;
                    if (message.command === config.messageCommand) {
                        window[config.loadingFlag] = false;
                        setButtonLoadingState(config.buttonId, false);
                        
                        if (message.success && message.models) {
                            console.log('Received', message.models.length, config.name + ' models from backend');
                            loadModels(message.models);
                            
                            showToastMessage(config.name + ' models loaded successfully', 'success', config.toastShownFlag);
                        } else {
                            showError(message.error || 'Failed to load models');
                            showToastMessage('Failed to load ' + config.name + ' models: ' + (message.error || 'Unknown error'), 'error', config.toastShownFlag);
                        }
                    }
                }
                
                if (window[config.messageHandlerKey]) {
                    window.removeEventListener('message', window[config.messageHandlerKey]);
                }
                
                window[config.messageHandlerKey] = handleMessage;
                window.addEventListener('message', window[config.messageHandlerKey]);

                function handleGlobalClick(e) {
                    if (!dropdown.contains(e.target) && e.target !== modelInput) {
                        hideDropdown();
                    }
                }
                
                if (window[config.clickHandlerKey]) {
                    document.removeEventListener('click', window[config.clickHandlerKey]);
                }
                
                window[config.clickHandlerKey] = handleGlobalClick;
                document.addEventListener('click', window[config.clickHandlerKey]);

                setupInputEvents();

                console.log(config.name + ' dropdown initialized successfully');
            }

            function initializeDropdowns() {
                const dropdownConfigs = [
                    {
                        name: 'Hugging Face',
                        inputId: 'huggingfaceModel',
                        dropdownId: 'huggingfaceModelDropdown',
                        buttonId: 'loadHuggingFaceModels',
                        messageCommand: 'huggingfaceModelsLoaded',
                        loadingFlag: 'huggingfaceModelsLoading',
                        toastShownFlag: '_huggingFaceToastShown',
                        initFlag: 'huggingFaceDropdownInitialized',
                        filterTimeoutKey: '_huggingFaceFilterTimeout',
                        messageHandlerKey: '_huggingFaceMessageHandler',
                        clickHandlerKey: '_huggingFaceClickHandler'
                    },
                    {
                        name: 'OpenRouter',
                        inputId: 'openrouterModel',
                        dropdownId: 'openrouterModelDropdown',
                        buttonId: 'loadOpenRouterModels',
                        messageCommand: 'openrouterModelsLoaded',
                        loadingFlag: 'openrouterModelsLoading',
                        toastShownFlag: '_openrouterToastShown',
                        initFlag: 'openRouterDropdownInitialized',
                        filterTimeoutKey: '_openrouterFilterTimeout',
                        messageHandlerKey: '_openRouterMessageHandler',
                        clickHandlerKey: '_openRouterClickHandler'
                    },
                    {
                        name: 'Ollama',
                        inputId: 'ollamaModel',
                        dropdownId: 'ollamaModelDropdown',
                        buttonId: 'loadOllamaModels',
                        messageCommand: 'ollamaModelsLoaded',
                        loadingFlag: 'ollamaModelsLoading',
                        toastShownFlag: '_ollamaToastShown',
                        initFlag: 'ollamaDropdownInitialized',
                        filterTimeoutKey: '_ollamaFilterTimeout',
                        messageHandlerKey: '_ollamaMessageHandler',
                        clickHandlerKey: '_ollamaClickHandler'
                    }
                ];

                dropdownConfigs.forEach(config => {
                    if (!window[config.initFlag]) {
                        createDropdownManager(config);
                        window[config.initFlag] = true;
                    }
                });

                // Set up initialization listeners
                dropdownConfigs.forEach(config => {
                    const listenerKey = config.initFlag.replace('Initialized', 'InitListener');
                    if (!window[listenerKey]) {
                        window[listenerKey] = () => {
                            setTimeout(() => {
                                if (!window[config.initFlag]) {
                                    createDropdownManager(config);
                                    window[config.initFlag] = true;
                                }
                            }, 300);
                        };
                        
                        document.addEventListener('DOMContentLoaded', window[listenerKey]);
                        
                        if (document.readyState === 'complete' || document.readyState === 'interactive') {
                            setTimeout(() => {
                                if (!window[config.initFlag]) {
                                    createDropdownManager(config);
                                    window[config.initFlag] = true;
                                }
                            }, 300);
                        }
                    }
                });
            }
        `;
    }
}