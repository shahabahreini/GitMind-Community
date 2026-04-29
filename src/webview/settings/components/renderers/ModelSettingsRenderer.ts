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
            this.settings.subscription?.status === 'active';

        // Get all providers but filter out Pro-only ones if user is not Pro
        let providers = ProviderConfig.getAllProviders();
        if (!isPro) {
            providers = providers.filter(provider => !provider.isPro);
        }

        const currentProvider = this.settings.apiProvider;

        return FormUtils.createFormGroup(
            'API Provider',
            'Select the AI provider for generating commit messages',
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
                    FormUtils.createSelect(field.id, field.options.map((option: any) => ({
                        value: option.value,
                        label: option.label,
                        selected: value === option.value,
                        group: option.group
                    })))
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
            // For Hugging Face, OpenRouter, and Ollama, render as searchable dropdown
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
                    <div class="searchable-dropdown">
                        <input type="text" 
                               id="${field.id}" 
                               placeholder="${placeholder}" 
                               value="${currentModel}"
                               autocomplete="off" />
                        <button type="button" 
                                id="${field.loadButtonId}" 
                                class="load-models-btn" 
                                data-tooltip="Load available models from ${providerName}">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                            </svg>
                        </button>
                        <div id="${dropdownId}" class="dropdown-content" style="display: none;">
                            <div class="dropdown-loading" style="display: none;">Loading models...</div>
                            <div class="dropdown-error" style="display: none;"></div>
                            <div class="dropdown-empty" style="display: none;">No models found</div>
                            <ul class="model-list"></ul>
                        </div>
                    </div>
                    <div class="description">
                        Default popular models shown. Click the refresh button to load all available models from ${providerName} with search functionality.
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
                    ${FormUtils.createSearchableSelect(field.id, selectOptions, `Search ${field.label.toLowerCase()}...`, isLoadDisabled, loadDisabledTooltip)}
                    <button id="${field.loadButtonId}" class="button small" style="margin-top: 8px;" ${isLoadDisabled ? 'disabled title="' + loadDisabledTooltip.replace(/"/g, '&quot;') + '"' : ''}>
                        ${field.loadButtonText}
                    </button>
                    <div class="description">
                        ${isLoadDisabled
                    ? loadDisabledTooltip
                    : `Default models shown. Click "${field.loadButtonText}" to fetch all models that support chat completion.`}
                    </div>
                </div>`
            );
        }
    }
}