// src/webview/settings/components/renderers/ModelSettingsRenderer.ts
import { ExtensionSettings } from "../../../../models/ExtensionSettings";
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
                        <input class="switch-input" type="checkbox" data-setting="pro.automaticRetry.enabled" ${retryEnabled ? 'checked' : ''} ${disabled}/>
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
                            <input class="switch-input" type="checkbox" data-setting="pro.modelFallback.enabled" ${fallbackEnabled ? 'checked' : ''} ${disabled}/>
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

        return `
            <div id="${provider.id}Settings" class="api-settings ${isVisible ? '' : 'hidden'}">
                ${provider.fields.map((field: any) => this.renderProviderField(field, providerSettings)).join('')}
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
        const isOllama = field.id.includes('ollama');
        const isNvidia = field.id.includes('nvidia');

        if (isHuggingFace || isOpenRouter || isOllama || isNvidia) {
            // For Hugging Face, OpenRouter, and Ollama, render as searchable dropdown with direct input capability
            const defaultOptions = field.defaultOptions || [];
            const currentModel = value || defaultOptions[0] || '';
            let providerName, dropdownId, placeholder;

            if (isHuggingFace) {
                providerName = 'Hugging Face';
                dropdownId = 'huggingfaceModelDropdown';
                placeholder = 'Type or select a model (e.g., mistralai/Mistral-7B-Instruct-v0.3)';
            } else if (isOpenRouter) {
                providerName = 'OpenRouter';
                dropdownId = 'openrouterModelDropdown';
                placeholder = 'Type or select a model (e.g., google/gemma-3-27b-it:free)';
            } else if (isOllama) {
                providerName = 'Ollama';
                dropdownId = 'ollamaModelDropdown';
                placeholder = 'Type or select a model (e.g., phi4, llama3.2, mistral)';
            } else if (isNvidia) {
                providerName = 'NVIDIA';
                dropdownId = 'nvidiaModelDropdown';
                placeholder = 'Type or select a model (e.g., meta/llama-3.3-70b-instruct)';
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
