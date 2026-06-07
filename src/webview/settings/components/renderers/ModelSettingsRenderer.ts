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
                </div>
            </div>
        `;
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

        if (isHuggingFace || isOpenRouter || isOllama) {
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