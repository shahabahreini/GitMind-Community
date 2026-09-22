// src/webview/onboarding/OnboardingTemplateGenerator.ts
import * as vscode from "vscode";
import { getOnboardingStyles } from "./styles/onboarding.css";
import { ProviderIcon } from "../settings/components/ProviderIcon";
import { PROVIDER_CATALOG, PROVIDER_IDS, ProviderCatalogId } from "../../config/providerCatalog";

export class OnboardingTemplateGenerator {
    private _extensionUri: vscode.Uri;
    private _nonce: string;

    constructor(extensionUri: vscode.Uri, nonce: string) {
        this._extensionUri = extensionUri;
        this._nonce = nonce;
    }

    public generateHtml(webview: vscode.Webview): string {
        const logoUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "images", "logo.png")
        );

        return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${this._nonce}'; img-src ${webview.cspSource} data:;">
        <title>Welcome to GitMind</title>
        ${getOnboardingStyles()}
        <style>
            ${ProviderIcon.getIconStyles()}
        </style>
    </head>
    <body>
        <div class="onboarding-container">
            ${this.generateHeader(logoUri)}
            ${this.generateMainContent()}
        </div>

        <script nonce="${this._nonce}">
            ${this.getOnboardingScript()}
        </script>
    </body>
    </html>`;
    }

    private generateHeader(logoUri: vscode.Uri): string {
        return `
            <div class="header">
                <img src="${logoUri}" alt="GitMind Logo" class="logo" />
                <h1>Welcome to GitMind</h1>
                <p class="subtitle">AI-Powered Commit Message Generation</p>
            </div>`;
    }

    private generateMainContent(): string {
        return `
            <div class="main-content">
                <div class="content-section">
                    ${this.generateQuickStart()}
                </div>

                <div class="content-section">
                    ${this.generateProviderSelection()}
                </div>

                <div class="content-section">
                    ${this.generateFeatures()}
                </div>

                <div class="content-section">
                    ${this.generateActions()}
                </div>
            </div>`;
    }

    private generateQuickStart(): string {
        return `
            <div class="quick-start">
                <h2>Get Started in 3 Steps</h2>
                <div class="steps-list">
                    <div class="step-item">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h3>Choose AI Provider</h3>
                            <p>Select from 15+ AI providers including OpenAI, Anthropic, Google Gemini, and more</p>
                        </div>
                    </div>
                    <div class="step-item">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h3>Configure API Key</h3>
                            <p>Add your API key in settings (or use local providers like Ollama)</p>
                        </div>
                    </div>
                    <div class="step-item">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h3>Generate Commits</h3>
                            <p>Click "Generate GitMind Commit Message" in the Source Control panel</p>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    private generateProviderSelection(): string {
        // Card copy only; provider identity and names come from the provider catalog.
        const cards: Array<{ id: ProviderCatalogId; category: string; tier: string; desc: string }> = [
            // Cloud Providers - Popular
            { id: 'openai', category: 'Popular', tier: 'Paid', desc: 'GPT models with excellent text generation' },
            { id: 'anthropic', category: 'Popular', tier: 'Paid', desc: 'Claude models with strong reasoning' },
            { id: 'gemini', category: 'Popular', tier: 'Free Tier', desc: 'Gemini models with excellent code understanding' },

            // Cloud Providers - Alternative
            { id: 'deepseek', category: 'Alternative', tier: 'Paid', desc: 'Cost-effective reasoning models' },
            { id: 'grok', category: 'Alternative', tier: 'Paid', desc: 'Grok models from xAI' },
            { id: 'perplexity', category: 'Alternative', tier: 'Paid', desc: 'Sonar models with online knowledge' },
            { id: 'mistral', category: 'Alternative', tier: 'Paid', desc: 'European AI with strong performance' },
            { id: 'cohere', category: 'Alternative', tier: 'Free Tier', desc: 'Command models for text generation' },
            { id: 'minimax', category: 'Alternative', tier: 'Paid', desc: 'MiniMax text models' },
            { id: 'zai', category: 'Alternative', tier: 'Paid', desc: 'GLM models from Z.ai' },
            { id: 'groq', category: 'Alternative', tier: 'Free Tier', desc: 'Fast inference for open models' },
            { id: 'nvidia', category: 'Alternative', tier: 'Free Tier', desc: 'Hosted NVIDIA NIM models' },

            // Aggregators
            { id: 'together', category: 'Aggregator', tier: 'Paid', desc: 'Access multiple open-source models' },
            { id: 'openrouter', category: 'Aggregator', tier: 'Paid', desc: 'Unified API for many providers' },
            { id: 'huggingface', category: 'Aggregator', tier: 'Free Tier', desc: 'Thousands of open-source models' },

            // Enterprise cloud
            { id: 'azureopenai', category: 'Enterprise', tier: 'Paid', desc: 'Your Azure OpenAI deployments' },
            { id: 'bedrock', category: 'Enterprise', tier: 'Paid', desc: 'Foundation models through your AWS account' },
            { id: 'vertexai', category: 'Enterprise', tier: 'Paid', desc: 'Gemini and partner models through Google Cloud' },
            { id: 'cloudflare', category: 'Enterprise', tier: 'Free Tier', desc: 'Workers AI models on your Cloudflare account' },

            // Local & Integrated
            { id: 'ollama', category: 'Local', tier: 'Free', desc: 'Run models locally on your machine' },
            { id: 'lmstudio', category: 'Local', tier: 'Free', desc: 'Local models served by LM Studio' },
            { id: 'copilot', category: 'Integrated', tier: 'Subscription', desc: 'Uses your GitHub Copilot sign-in; no API key' },
            { id: 'custom', category: 'Advanced', tier: 'Pro', desc: 'Connect to any custom API endpoint' }
        ];
        const providers = cards.map(card => ({ ...card, name: PROVIDER_CATALOG[card.id].displayName }));

        const categories = ['Popular', 'Alternative', 'Aggregator', 'Enterprise', 'Local', 'Integrated', 'Advanced'];

        const providersByCategory = categories.map(category => {
            const categoryProviders = providers.filter(p => p.category === category);
            if (categoryProviders.length === 0) {
                return '';
            }

            return `
                <div class="provider-category">
                    <h4 class="category-title">${category}</h4>
                    <div class="providers-grid">
                        ${categoryProviders.map(provider => `
                            <div class="provider-card" data-provider="${provider.id}" data-category="${provider.category}">
                                <div class="provider-icon-container">
                                    ${ProviderIcon.renderIcon(provider.id, 48)}
                                </div>
                                <div class="provider-info">
                                    <h4>${provider.name}</h4>
                                    <span class="provider-tier ${provider.tier.toLowerCase().replace(' ', '-')}">${provider.tier}</span>
                                    <p>${provider.desc}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="provider-selection">
                <h2>Choose Your AI Provider</h2>
                <p class="section-description">GitMind supports 15 AI providers. Select one to get started.</p>

                ${providersByCategory}

                <div class="provider-selection-status">
                    <div class="status-row">
                        <span class="status-label">Selected Provider:</span>
                        <span class="status-value" id="selectedProvider">None</span>
                    </div>
                    <button class="btn btn-primary" id="configureProviderBtn" disabled>
                        Configure Selected Provider
                    </button>
                </div>
            </div>`;
    }

    private generateFeatures(): string {
        const features = [
            { title: 'AI-Powered Generation', desc: 'Automatically generate contextual commit messages from your code changes' },
            { title: 'Multiple Commit Styles', desc: 'Choose from Conventional, Semantic, Descriptive, and more formats' },
            { title: 'Privacy by Design', desc: 'No usage telemetry, with secure API key storage and optional encryption' },
            { title: 'Customizable Prompts', desc: 'Add custom context to your commit generation requests' },
            { title: 'Multi-Repository Support', desc: 'Independent configuration for each Git repository' },
            { title: 'Pro Features Available', desc: 'Commit history learning, changelog generation, large diff support, and more' }
        ];

        return `
            <div class="features-section">
                <h2>Key Features</h2>
                <div class="features-grid">
                    ${features.map(feature => `
                        <div class="feature-card">
                            <h4>${feature.title}</h4>
                            <p>${feature.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }

    private generateActions(): string {
        return `
            <div class="actions-section">
                <h2>Ready to Get Started?</h2>
                <p class="section-description">Open settings to configure your API provider and start generating commit messages.</p>

                <div class="action-buttons">
                    <button class="btn btn-primary btn-large" id="openSettingsBtn">
                        Open Settings
                    </button>
                    <button class="btn btn-secondary btn-large" id="viewDocsBtn">
                        View Documentation
                    </button>
                </div>

                <div class="pro-activation-prompt">
                    <p>Already bought GitMind Pro?</p>
                    <button class="btn btn-link" id="activateProBtn">
                        Activate your license &rarr;
                    </button>
                </div>

                <div class="additional-actions">
                    <div class="dont-show-again-checkbox">
                        <input type="checkbox" id="dontShowAgainCheckbox" class="checkbox-input" />
                        <label for="dontShowAgainCheckbox" class="checkbox-label">
                            Don't show this onboarding again
                        </label>
                    </div>
                </div>
            </div>`;
    }

    private getOnboardingScript(): string {
        return `
    const vscode = acquireVsCodeApi();

    // State management
    const state = {
        selectedProvider: null,
        dontShowAgain: false
    };

    // Provider API key links
    const providerLinks = ${JSON.stringify(Object.fromEntries(PROVIDER_IDS.map(id => [id, PROVIDER_CATALOG[id].docsUrl])))};

    // Initialize
    init();

    function init() {
        setupProviderSelection();
        setupButtonHandlers();
        setupCheckboxHandlers();
        setupWindowCloseHandler();
        restoreState();
    }

    function setupProviderSelection() {
        document.querySelectorAll('.provider-card').forEach(card => {
            card.addEventListener('click', () => {
                // Clear previous selection
                document.querySelectorAll('.provider-card').forEach(c => c.classList.remove('selected'));

                // Set new selection
                card.classList.add('selected');
                state.selectedProvider = card.dataset.provider;

                // Update UI
                updateSelectedProvider();

                // Save state
                saveState();
            });
        });
    }

    function setupCheckboxHandlers() {
        const checkbox = document.getElementById('dontShowAgainCheckbox');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                state.dontShowAgain = e.target.checked;
                saveState();
            });
        }
    }

    function setupWindowCloseHandler() {
        // Handle window close/navigation
        window.addEventListener('beforeunload', (e) => {
            if (state.dontShowAgain) {
                // If checkbox is checked, execute skip command
                vscode.postMessage({ command: 'skipOnboarding', dontShowAgain: true });
            }
        });
    }

    function setupButtonHandlers() {
        const handlers = {
            openSettingsBtn: () => {
                sendCommand('openSettings');
            },
            configureProviderBtn: () => {
                if (state.selectedProvider) {
                    sendCommand('selectProvider', { provider: state.selectedProvider });
                }
            },
            viewDocsBtn: () => {
                const docsUrl = 'https://gitmind-pro.com';
                vscode.postMessage({ command: 'openExternal', url: docsUrl });
            },
            activateProBtn: () => {
                sendCommand('activatePro');
            }
        };

        Object.entries(handlers).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    }

    function updateSelectedProvider() {
        const providerElement = document.getElementById('selectedProvider');
        const configureBtn = document.getElementById('configureProviderBtn');

        if (state.selectedProvider) {
            const card = document.querySelector(\`.provider-card[data-provider="\${state.selectedProvider}"]\`);
            const providerName = card ? card.querySelector('h4').textContent : state.selectedProvider;
            providerElement.textContent = providerName;
            providerElement.style.fontWeight = 'bold';
            configureBtn.disabled = false;
        } else {
            providerElement.textContent = 'None';
            providerElement.style.fontWeight = 'normal';
            configureBtn.disabled = true;
        }
    }

    function sendCommand(command, data = {}) {
        console.log(\`Sending command: \${command}\`, data);
        vscode.postMessage({ command, ...data });
    }

    function saveState() {
        vscode.setState(state);
    }

    function restoreState() {
        const previousState = vscode.getState();
        if (previousState) {
            if (previousState.selectedProvider) {
                state.selectedProvider = previousState.selectedProvider;
                const card = document.querySelector(\`.provider-card[data-provider="\${state.selectedProvider}"]\`);
                if (card) {
                    card.classList.add('selected');
                    updateSelectedProvider();
                }
            }
            if (previousState.dontShowAgain) {
                state.dontShowAgain = previousState.dontShowAgain;
                const checkbox = document.getElementById('dontShowAgainCheckbox');
                if (checkbox) {
                    checkbox.checked = true;
                }
            }
        }
    }

    // Listen for messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'providerConfigured':
                // Show success message or close onboarding
                break;
        }
    });
    `;
    }
}
