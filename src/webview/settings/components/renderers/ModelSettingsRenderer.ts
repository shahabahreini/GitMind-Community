// src/webview/settings/components/renderers/ModelSettingsRenderer.ts
import { ExtensionSettings } from "../../../../models/ExtensionSettings";
import { getProviderDefaultModel } from '../../../../config/providerCatalog';
import { BaseRenderer } from "./BaseRenderer";
import { FormUtils } from "../utils/FormUtils";
import { ProviderConfig } from "../config/ProviderConfig";

export class ModelSettingsRenderer extends BaseRenderer {
    constructor(settings: ExtensionSettings) {
        super(settings);
    }

    public render(): string {
        return `
            <div class="minimalist-card">
                <div class="card-content">
                    ${this.renderProviderSelector()}
                    ${this.renderAllProviderSettings()}
                    ${this.renderRecoverySettings()}
                </div>
            </div>
        `;
    }

    private renderRecoverySettings(): string {
        const isPro = this.isProUser() || this.isDevModeEnabled();
        const retryEnabled = this.settings.pro?.automaticRetry?.enabled ?? false;
        const fallbackEnabled = this.settings.pro?.modelFallback?.enabled ?? false;
        const fallbackModel = this.settings.pro?.modelFallback?.models?.[this.settings.apiProvider] ?? '';
        const disabled = isPro ? '' : 'disabled';
        const locked = isPro ? '' : 'locked';
        const fallbackOptions = this.getFallbackModelOptions(fallbackModel);
        const providerModelOptions = this.getProviderModelOptions();
        const providerPrimaryModels = this.getProviderPrimaryModels();
        const fallbackSelect = FormUtils.createSearchableSelect(
            'fallbackModelForProvider',
            fallbackOptions,
            `Search ${this.settings.apiProvider} fallback models...`,
            !isPro
        );

        return `
            <section class="automatic-recovery-card ${locked}">
                <div class="automatic-recovery-header">
                    <div>
                        <h3>Automatic Recovery</h3>
                        <p>Recover from temporary generation failures.</p>
                    </div>
                    ${isPro ? '<span class="automatic-recovery-badge">Pro</span>' : '<span class="automatic-recovery-badge locked">Pro Locked</span>'}
                </div>

                <div class="automatic-recovery-option">
                    <div class="automatic-recovery-copy">
                        <span>Retry once</span>
                        <small>Timeouts and temporary Gemini service errors</small>
                    </div>
                    <div class="switch-container ${disabled ? 'disabled' : ''}">
                        <input class="switch-input" type="checkbox" id="automaticRetryEnabled" data-setting="pro.automaticRetry.enabled" ${retryEnabled ? 'checked' : ''} ${disabled}/>
                        <div class="switch-button"><div class="switch-slider"></div></div>
                    </div>
                </div>

                <div class="automatic-recovery-option fallback">
                    <div class="automatic-recovery-option-top">
                        <div class="automatic-recovery-copy">
                            <span>Fallback model</span>
                            <small>Used once when the selected model reaches its limit</small>
                        </div>
                        <div class="switch-container ${disabled ? 'disabled' : ''}">
                            <input class="switch-input" type="checkbox" id="modelFallbackEnabled" data-setting="pro.modelFallback.enabled" ${fallbackEnabled ? 'checked' : ''} ${disabled}/>
                            <div class="switch-button"><div class="switch-slider"></div></div>
                        </div>
                    </div>
                    <div class="automatic-recovery-fallback-select">
                        ${fallbackSelect}
                    </div>
                </div>
            </section>
            <script>
                (function () {
                    const providerModels = ${JSON.stringify(providerModelOptions)};
                    const primaryModels = ${JSON.stringify(providerPrimaryModels)};
                    const select = document.getElementById('fallbackModelForProvider');
                    if (!select || !${isPro}) return;

                    function getSelectedProvider() {
                        return document.getElementById('apiProvider')?.value || '${this.settings.apiProvider}';
                    }

                    function getPrimaryModel(provider) {
                        return document.getElementById(provider + 'Model')?.value || primaryModels[provider] || '';
                    }

                    function saveFallbackModel() {
                        const provider = getSelectedProvider();
                        const models = Object.assign({}, window.gitmindSettings?.pro?.modelFallback?.models || {});
                        models[provider] = select.value.trim();
                        if (!window.gitmindSettings.pro) window.gitmindSettings.pro = {};
                        if (!window.gitmindSettings.pro.modelFallback) {
                            window.gitmindSettings.pro.modelFallback = { enabled: false, models: {} };
                        }
                        window.gitmindSettings.pro.modelFallback.models = models;
                        vscode.postMessage({ command: 'updateSetting', key: 'pro.modelFallback.models', value: models });
                    }

                    function replaceOptions(provider, models) {
                        if (!Array.isArray(models)) return;
                        const primaryModel = getPrimaryModel(provider);
                        const savedModels = window.gitmindSettings?.pro?.modelFallback?.models || {};
                        const savedValue = savedModels[provider] || '';
                        const currentValue = savedValue === primaryModel ? '' : savedValue;
                        const uniqueModels = Array.from(new Set(models))
                            .filter(model => typeof model === 'string' && model.trim() && model !== primaryModel)
                            .sort((a, b) => a.localeCompare(b));

                        if (currentValue && currentValue !== primaryModel && !uniqueModels.includes(currentValue)) {
                            uniqueModels.unshift(currentValue);
                        }

                        select.innerHTML = '';
                        const emptyOption = document.createElement('option');
                        emptyOption.value = '';
                        emptyOption.textContent = 'Select a fallback model';
                        emptyOption.selected = !currentValue;
                        select.appendChild(emptyOption);

                        uniqueModels.forEach(model => {
                            const option = document.createElement('option');
                            option.value = model;
                            option.textContent = model;
                            option.selected = model === currentValue;
                            select.appendChild(option);
                        });
                    }

                    select.addEventListener('change', saveFallbackModel);
                    document.getElementById('apiProvider')?.addEventListener('change', function () {
                        const provider = getSelectedProvider();
                        replaceOptions(provider, providerModels[provider] || []);
                        const searchInput = document.getElementById('search-fallbackModelForProvider');
                        if (searchInput) {
                            searchInput.placeholder = 'Search ' + provider + ' fallback models...';
                        }
                    });

                    Object.keys(providerModels).forEach(provider => {
                        document.getElementById(provider + 'Model')?.addEventListener('change', function () {
                            primaryModels[provider] = this.value;
                            if (provider === getSelectedProvider()) {
                                replaceOptions(provider, providerModels[provider] || []);
                            }
                        });
                    });

                    window.addEventListener('message', function (event) {
                        const message = event.data;
                        if (typeof message.command !== 'string' || !message.command.endsWith('ModelsLoaded') || !message.success) {
                            return;
                        }
                        const provider = message.command.slice(0, -'ModelsLoaded'.length);
                        if (!providerModels[provider]) return;
                        providerModels[provider] = message.models || [];
                        if (provider === getSelectedProvider()) {
                            replaceOptions(provider, providerModels[provider]);
                        }
                    });
                })();
            </script>
        `;
    }

    private getPrimaryModel(providerId: string = this.settings.apiProvider): string {
        const providerSettings = this.settings[providerId as keyof ExtensionSettings] as any;
        return providerSettings?.model || '';
    }

    private getFallbackModelOptions(fallbackModel: string): Array<{ value: string; label: string; selected: boolean }> {
        const primaryModel = this.getPrimaryModel();
        const models = [...new Set([fallbackModel, ...this.getConfiguredModels(this.settings.apiProvider)])]
            .filter(model => Boolean(model) && model !== primaryModel);

        return [
            { value: '', label: 'Select a fallback model', selected: !fallbackModel },
            ...models.map(model => ({
                value: model,
                label: model,
                selected: model === fallbackModel,
            })),
        ];
    }

    private getConfiguredModels(providerId: string): string[] {
        const provider = ProviderConfig.getProvider(providerId);
        const modelField = provider?.fields.find(field => field.key === 'model');
        return [
            ...(modelField?.options?.map(option => option.value) ?? []),
            ...(modelField?.defaultOptions ?? []),
        ];
    }

    private getProviderModelOptions(): Record<string, string[]> {
        return Object.fromEntries(
            ProviderConfig.getAllProviders().map(provider => [
                provider.id,
                this.getConfiguredModels(provider.id),
            ])
        );
    }

    private getProviderPrimaryModels(): Record<string, string> {
        return Object.fromEntries(
            ProviderConfig.getAllProviders().map(provider => [
                provider.id,
                this.getPrimaryModel(provider.id),
            ])
        );
    }

    private renderProviderSelector(): string {
        // Check if user is Pro (has active subscription or valid license)
        const isPro = this.settings.pro?.validationStatus === 'valid' ||
            this.settings.subscription?.status === 'active' ||
            this.isDevModeEnabled();

        // Get all providers
        let providers = ProviderConfig.getAllProviders();

        const currentProvider = this.settings.apiProvider;

        return FormUtils.createFormGroup(
            'API Provider',
            '',
            FormUtils.createSearchableSelect('apiProvider', providers.map(provider => ({
                value: provider.id,
                label: provider.name,
                selected: currentProvider === provider.id,
                className: provider.isPro ? 'pro-provider' : ''
            })), 'Search providers...')
        );
    }

    private renderAllProviderSettings(): string {
        return ProviderConfig.getAllProviders()
            .map(provider => this.renderProviderSettings(provider))
            .join('');
    }

    private renderProviderSettings(provider: any): string {
        const isVisible = this.settings.apiProvider === provider.id;
        const providerSettings = this.settings[provider.id as keyof ExtensionSettings] as any;
        const isPro = this.settings.pro?.validationStatus === 'valid' ||
            this.settings.subscription?.status === 'active' ||
            this.isDevModeEnabled();

        if (provider.isPro && !isPro) {
            return `
                <div id="${provider.id}Settings" class="api-settings ${isVisible ? '' : 'hidden'} locked-provider-settings">
                    <div class="provider-locked-overlay">
                        <div class="provider-locked-content">
                            <div class="provider-locked-icon-container">
                                <svg class="provider-locked-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </div>
                            <h4>${provider.name} requires GitMind Pro</h4>
                            <p>Unlock custom API configuration, advanced routing, model configurations, and secure encryption key storage.</p>
                            <button type="button" class="upgrade-btn btn btn-primary" id="upgradeFromCustomApiBtn">Upgrade to GitMind Pro</button>
                        </div>
                    </div>
                    <div style="opacity: 0.2; pointer-events: none;">
                        ${provider.fields.map((field: any) => this.renderProviderField(field, providerSettings)).join('')}
                    </div>
                </div>
            `;
        }

        if (provider.id === 'custom') {
            return this.renderCustomProviderSettings(provider, providerSettings, isVisible);
        }

        return `
            <div id="${provider.id}Settings" class="api-settings ${isVisible ? '' : 'hidden'}">
                ${provider.fields.map((field: any) => this.renderProviderField(field, providerSettings)).join('')}
            </div>
        `;
    }

    private renderCustomProviderSettings(_provider: any, providerSettings: any, isVisible: boolean): string {
        const baseUrl = providerSettings?.baseUrl || 'https://api.openai.com';
        const endpoint = providerSettings?.endpoint || '/v1/chat/completions';
        const authType = providerSettings?.authType || 'bearer';
        const authToken = providerSettings?.authToken || '';
        const headerKey = providerSettings?.headerKey || '';
        const requestFormat = providerSettings?.requestFormat || 'openai';
        const responseFormat = providerSettings?.responseFormat || 'openai';
        const model = providerSettings?.model || '';

        const openaiPresetModel = getProviderDefaultModel('openai');
        const anthropicPresetModel = getProviderDefaultModel('anthropic');
        const inceptionPresetModel = getProviderDefaultModel('inception');

        return `
            <div id="customSettings" class="api-settings custom-api-settings-panel ${isVisible ? '' : 'hidden'}">
                <!-- Preset Quick Selection Bar -->
                <div class="custom-card custom-presets-card">
                    <div class="custom-card-header">
                        <span class="custom-card-icon">⚡</span>
                        <div class="custom-card-title-group">
                            <span class="custom-card-title">Quick Configuration Presets</span>
                            <span class="custom-card-desc">Click any template below to auto-fill recommended endpoint parameters</span>
                        </div>
                    </div>
                    <div class="custom-presets-grid">
                        <button type="button" class="custom-preset-btn" data-preset="openai"
                            data-base="https://api.openai.com" data-endpoint="/v1/chat/completions"
                            data-auth="bearer" data-model="${openaiPresetModel}" data-req="openai" data-res="openai">
                            <span class="preset-name">OpenAI</span>
                            <span class="preset-desc">Official / Compatible</span>
                        </button>
                        <button type="button" class="custom-preset-btn" data-preset="anthropic"
                            data-base="https://api.anthropic.com" data-endpoint="/v1/messages"
                            data-auth="apikey" data-header="x-api-key" data-model="${anthropicPresetModel}" data-req="anthropic" data-res="anthropic">
                            <span class="preset-name">Anthropic</span>
                            <span class="preset-desc">Claude Messages API</span>
                        </button>
                        <button type="button" class="custom-preset-btn" data-preset="inception"
                            data-base="https://api.inceptionlabs.ai" data-endpoint="/v1/chat/completions"
                            data-auth="bearer" data-model="${inceptionPresetModel}" data-req="openai" data-res="openai">
                            <span class="preset-name">Inception Labs</span>
                            <span class="preset-desc">Mercury Reasoning</span>
                        </button>
                        <button type="button" class="custom-preset-btn" data-preset="local"
                            data-base="http://localhost:11434" data-endpoint="/v1/chat/completions"
                            data-auth="none" data-model="llama3" data-req="openai" data-res="openai">
                            <span class="preset-name">Local Engine</span>
                            <span class="preset-desc">Ollama / vLLM / LM Studio</span>
                        </button>
                    </div>
                </div>

                <!-- Card 1: Connection & Endpoint -->
                <div class="custom-card">
                    <div class="custom-card-header">
                        <span class="custom-card-icon">🌐</span>
                        <div class="custom-card-title-group">
                            <span class="custom-card-title">Connection & Endpoint</span>
                            <span class="custom-card-desc">Specify the root host and relative completion route</span>
                        </div>
                    </div>
                    <div class="custom-card-content">
                        ${FormUtils.createTextField('customBaseUrl', 'Base URL', 'The base URL of your custom API (e.g., https://your-api.example.com)', baseUrl, 'https://api.example.com')}
                        ${FormUtils.createTextField('customEndpoint', 'API Endpoint Path', 'The endpoint path for the chat completion API (e.g., /v1/chat/completions)', endpoint, '/v1/chat/completions')}
                        <div class="custom-target-preview">
                            <span class="target-preview-label">Target URL:</span>
                            <code id="customLiveUrlPreview" class="target-preview-code">${baseUrl}${endpoint}</code>
                        </div>
                    </div>
                </div>

                <!-- Card 2: Authentication & Security -->
                <div class="custom-card">
                    <div class="custom-card-header">
                        <span class="custom-card-icon">🔒</span>
                        <div class="custom-card-title-group">
                            <span class="custom-card-title">Authentication & Security</span>
                            <span class="custom-card-desc">Tokens are encrypted in your system keychain using VS Code SecretStorage</span>
                        </div>
                    </div>
                    <div class="custom-card-content">
                        ${FormUtils.createFormGroup(
                            'Authentication Type',
                            'Select the authentication method for your API',
                            FormUtils.createSearchableSelect('customAuthType', [
                                { value: 'bearer', label: 'Bearer Token (Authorization: Bearer ...)', selected: authType === 'bearer' },
                                { value: 'apikey', label: 'API Key (Custom Header, e.g. x-api-key)', selected: authType === 'apikey' },
                                { value: 'basic', label: 'Basic Authentication (Username/Password)', selected: authType === 'basic' },
                                { value: 'none', label: 'No Authentication (Local/Intranet)', selected: authType === 'none' }
                            ], 'Select authentication type...')
                        )}
                        ${FormUtils.createPasswordField('customAuthToken', 'Authentication Token', 'Your API token or key (will be encrypted and stored securely)', authToken)}
                        <div id="customHeaderKeyContainer" class="header-key-field ${authType === 'apikey' ? '' : 'hidden'}">
                            ${FormUtils.createTextField('customHeaderKey', 'Header Key Name', 'Header key name for API Key authentication (e.g., X-API-Key)', headerKey, 'X-API-Key')}
                        </div>
                    </div>
                </div>

                <!-- Card 3: Payload & Response Schema -->
                <div class="custom-card">
                    <div class="custom-card-header">
                        <span class="custom-card-icon">⚙️</span>
                        <div class="custom-card-title-group">
                            <span class="custom-card-title">Model Architecture & Formats</span>
                            <span class="custom-card-desc">Define payload template and response extraction path</span>
                        </div>
                    </div>
                    <div class="custom-card-content">
                        ${FormUtils.createFormGroup(
                            'Request Format',
                            'The format of the API request payload',
                            FormUtils.createSearchableSelect('customRequestFormat', [
                                { value: 'openai', label: 'OpenAI-compatible (Chat Completions)', selected: requestFormat === 'openai' },
                                { value: 'anthropic', label: 'Anthropic-compatible (Messages API)', selected: requestFormat === 'anthropic' },
                                { value: 'custom', label: 'Custom Format Template', selected: requestFormat === 'custom' }
                            ], 'Select request format...')
                        )}
                        ${FormUtils.createFormGroup(
                            'Response Format',
                            'The format of the API response',
                            FormUtils.createSearchableSelect('customResponseFormat', [
                                { value: 'openai', label: 'OpenAI-compatible (choices[0].message.content)', selected: responseFormat === 'openai' },
                                { value: 'anthropic', label: 'Anthropic-compatible (content[0].text)', selected: responseFormat === 'anthropic' },
                                { value: 'custom', label: 'Custom JSON Path Expression', selected: responseFormat === 'custom' }
                            ], 'Select response format...')
                        )}
                        ${FormUtils.createTextField('customModel', 'Model Identifier', 'The model name or tag passed in requests (e.g. gpt-4o, mercury-2.5, claude-3-5-sonnet)', model, 'e.g., gpt-4o or mercury-2.5')}
                    </div>
                </div>

                <!-- Card 4: Diagnostics & Testing -->
                <div class="custom-card custom-test-card">
                    <div class="custom-card-header">
                        <span class="custom-card-icon">🧪</span>
                        <div class="custom-card-title-group">
                            <span class="custom-card-title">Endpoint Verification</span>
                            <span class="custom-card-desc">Send a verification probe to validate connectivity, latency, and schema matching</span>
                        </div>
                    </div>
                    <div class="custom-card-content">
                        <div class="custom-test-actions">
                            <button type="button" id="customTestConnection" class="btn btn-primary custom-test-btn">
                                <span class="test-btn-icon">⚡</span>
                                <span class="test-btn-label">Test Connection</span>
                            </button>
                            <span class="test-hint-text">Tests real-time round-trip latency and validates response extraction</span>
                        </div>
                        <div id="customApiTestResult" class="custom-api-test-result hidden" aria-live="polite"></div>

                        <details class="custom-guidelines-details">
                            <summary>View Custom API Guidelines & Variables</summary>
                            <div class="guidelines-content">
                                <p>Custom API integration allows connecting GitMind to any OpenAI-compatible, Anthropic-compatible, or private inference server.</p>
                                <ul>
                                    <li><strong>Placeholder Variables</strong>: You can use <code>{{model}}</code>, <code>{{prompt}}</code>, and <code>{{messages}}</code> in custom request formats.</li>
                                    <li><strong>Response Extraction</strong>: Specify known formats (<code>openai</code>, <code>anthropic</code>) or dot/bracket path notations like <code>choices[0].message.content</code> or <code>candidates[0].content.parts[0].text</code>.</li>
                                    <li><strong>Security</strong>: Authentication credentials are encrypted in your OS keychain via VS Code SecretStorage and never shared.</li>
                                </ul>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        `;
    }

    private renderProviderField(field: any, providerSettings: any): string {
        const value = providerSettings?.[field.key] || field.defaultValue || '';

        switch (field.type) {
            case 'password':
                return FormUtils.createPasswordField(field.id, field.label, field.tooltip, value, field.link);
            case 'text':
                return FormUtils.createTextField(field.id, field.label, field.tooltip, value, field.placeholder);
            case 'select':
                return FormUtils.createFormGroup(
                    field.label,
                    field.tooltip,
                    FormUtils.createSearchableSelect(field.id, field.options.map((option: any) => ({
                        value: option.value,
                        label: option.label,
                        selected: value === option.value,
                        group: option.group
                    })), `Search ${field.label.toLowerCase()}...`)
                );
            case 'model-with-load':
                return this.renderModelWithLoadField(field, value);
            case 'info':
                return FormUtils.createInfoField(field.content);
            default:
                return '';
        }
    }

    private renderModelWithLoadField(field: any, value: string): string {
        const isHuggingFace = field.id.includes('huggingface');
        const isOpenRouter = field.id.includes('openrouter');
        const isOllama = field.id === 'ollamaModel';
        const isNvidia = field.id.includes('nvidia');

        if (isHuggingFace || isOpenRouter || isOllama || isNvidia) {
            // For Hugging Face, OpenRouter, and Ollama, render as searchable dropdown with direct input capability
            const defaultOptions = field.defaultOptions || [];
            const currentModel = value || defaultOptions[0] || '';
            let providerName, dropdownId, placeholder;

            if (isHuggingFace) {
                providerName = 'Hugging Face';
                dropdownId = 'huggingfaceModelDropdown';
                placeholder = `Type or select a model (e.g., ${getProviderDefaultModel('huggingface')})`;
            } else if (isOpenRouter) {
                providerName = 'OpenRouter';
                dropdownId = 'openrouterModelDropdown';
                placeholder = `Type or select a model (e.g., ${getProviderDefaultModel('openrouter')})`;
            } else if (isOllama) {
                providerName = 'Ollama';
                dropdownId = 'ollamaModelDropdown';
                placeholder = 'Type or select a model (e.g., phi4, llama3.2, mistral)';
            } else if (isNvidia) {
                providerName = 'NVIDIA';
                dropdownId = 'nvidiaModelDropdown';
                placeholder = `Type or select a model (e.g., ${getProviderDefaultModel('nvidia')})`;
            }

            return FormUtils.createFormGroup(
                field.label,
                field.tooltip,
                `<div class="model-input-container">
                    <div class="searchable-dropdown-wrapper">
                        <div class="searchable-input-wrapper">
                            <input type="text" 
                                   id="${field.id}" 
                                   class="searchable-input"
                                   placeholder="${placeholder}" 
                                   value="${currentModel}"
                                   autocomplete="off" />
                            <button type="button" 
                                    id="${field.id}-toggle"
                                    class="dropdown-toggle">
                                <svg class="dropdown-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button type="button" 
                                    id="${field.loadButtonId}" 
                                    class="dropdown-toggle load-models-btn" 
                                    data-tooltip="Default popular models shown. Click the refresh button to load all available models from ${providerName}.">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                                    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                                </svg>
                            </button>
                        </div>
                        <div id="${dropdownId}" class="searchable-dropdown-list" style="display: none;">
                            <div class="dropdown-loading" style="display: none; padding: 12px; text-align: center; font-style: italic; opacity: 0.7;">Loading models...</div>
                            <div class="dropdown-error" style="display: none; padding: 12px; text-align: center; color: var(--vscode-errorForeground);"></div>
                            <div class="dropdown-empty" style="display: none; padding: 12px; text-align: center; opacity: 0.7;">No models found</div>
                            <ul class="model-list"></ul>
                        </div>
                    </div>
                </div>`
            );
        } else {
            // For other providers (like Mistral), render as select with load button
            const options = field.options || [];
            let optionsHtml = '';

            const isLoadDisabled = Boolean(field.loadButtonDisabled);
            const loadDisabledTooltip =
                typeof field.loadButtonDisabledTooltip === 'string'
                    ? field.loadButtonDisabledTooltip
                    : '';

            const selectOptions: any[] = [];
            // Add current model if not in default options
            if (value && !options.some((opt: any) => opt.value === value)) {
                selectOptions.push({
                    value: value,
                    label: value,
                    selected: true
                });
            }

            // Add default options
            options.forEach((option: any) => {
                selectOptions.push({
                    value: option.value,
                    label: option.label,
                    selected: option.value === value
                });
            });

            return FormUtils.createFormGroup(
                field.label,
                field.tooltip,
                `<div class="model-select-container">
                    ${FormUtils.createSearchableSelect(field.id, selectOptions, `Search ${field.label.toLowerCase()}...`, isLoadDisabled)}
                    <button id="${field.loadButtonId}" 
                            class="button small load-models-inline" 
                            ${isLoadDisabled ? 'disabled' : ''} 
                            data-tooltip="${isLoadDisabled ? loadDisabledTooltip : `Default models shown. Click &quot;${field.loadButtonText}&quot; to fetch all models that support chat completion.`}">
                        ${field.loadButtonText}
                    </button>
                </div>`
            );
        }
    }
}
