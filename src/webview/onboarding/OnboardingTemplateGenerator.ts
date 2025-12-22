// src/webview/onboarding/OnboardingTemplateGenerator.ts
import * as vscode from "vscode";
import { getOnboardingStyles } from "./styles/onboarding.css";
import { ProviderIcon } from "../settings/components/ProviderIcon";

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
        const providers = [
            // Cloud Providers - Popular
            { id: 'openai', name: 'OpenAI', category: 'Popular', tier: 'Paid', desc: 'GPT-4 and GPT-3.5 models with excellent text generation' },
            { id: 'anthropic', name: 'Anthropic Claude', category: 'Popular', tier: 'Paid', desc: 'Claude Sonnet and Opus models with superior reasoning' },
            { id: 'gemini', name: 'Google Gemini', category: 'Popular', tier: 'Free Tier', desc: 'Advanced AI with excellent code understanding' },

            // Cloud Providers - Alternative
            { id: 'deepseek', name: 'DeepSeek', category: 'Alternative', tier: 'Paid', desc: 'Cost-effective reasoning models' },
            { id: 'grok', name: 'xAI Grok', category: 'Alternative', tier: 'Premium', desc: 'Latest Grok models from xAI' },
            { id: 'perplexity', name: 'Perplexity', category: 'Alternative', tier: 'Free Tier', desc: 'Sonar models with online knowledge' },
            { id: 'mistral', name: 'Mistral AI', category: 'Alternative', tier: 'Paid', desc: 'European AI with strong performance' },
            { id: 'cohere', name: 'Cohere', category: 'Alternative', tier: 'Free Tier', desc: 'Command models for text generation' },

            // Aggregators
            { id: 'together', name: 'Together AI', category: 'Aggregator', tier: 'Paid', desc: 'Access multiple open-source models' },
            { id: 'openrouter', name: 'OpenRouter', category: 'Aggregator', tier: 'Paid', desc: 'Unified API for many providers' },
            { id: 'huggingface', name: 'Hugging Face', category: 'Aggregator', tier: 'Free Tier', desc: 'Thousands of open-source models' },

            // Local & Integrated
            { id: 'ollama', name: 'Ollama', category: 'Local', tier: 'Free', desc: 'Run models locally on your machine' },
            { id: 'copilot', name: 'GitHub Copilot', category: 'Integrated', tier: 'Subscription', desc: 'Uses existing Copilot subscription' },
            { id: 'minimax', name: 'MiniMax', category: 'Alternative', tier: 'Paid', desc: 'Advanced Chinese AI models' },
            { id: 'custom', name: 'Custom API', category: 'Advanced', tier: 'Pro', desc: 'Connect to any custom API endpoint' }
        ];

        const categories = ['Popular', 'Alternative', 'Aggregator', 'Local', 'Integrated', 'Advanced'];

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
            { title: 'Privacy Controls', desc: 'Optional telemetry and secure API key storage with encryption' },
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

                <div class="additional-actions">
                    <button class="btn btn-text" id="skipOnboardingBtn">
                        Don't show this again
                    </button>
                </div>
            </div>`;
    }

    private getOnboardingScript(): string {
        return `
    const vscode = acquireVsCodeApi();

    // State management
    const state = {
        selectedProvider: null
    };

    // Provider API key links
    const providerLinks = {
        gemini: 'https://aistudio.google.com/app/apikey',
        openai: 'https://platform.openai.com/api-keys',
        anthropic: 'https://console.anthropic.com/',
        ollama: 'https://ollama.ai/download',
        huggingface: 'https://huggingface.co/settings/tokens',
        copilot: 'https://github.com/features/copilot',
        mistral: 'https://console.mistral.ai/api-keys/',
        cohere: 'https://dashboard.cohere.com/api-keys',
        together: 'https://api.together.xyz/settings/api-keys',
        openrouter: 'https://openrouter.ai/keys',
        deepseek: 'https://platform.deepseek.com/',
        grok: 'https://x.com/i/grok',
        perplexity: 'https://www.perplexity.ai/settings/api',
        minimax: 'https://platform.minimaxi.com/',
        custom: ''
    };

    // Initialize
    init();

    function init() {
        setupProviderSelection();
        setupButtonHandlers();
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
                const docsUrl = 'https://github.com/shahabahreini/GitMind-Pro#readme';
                vscode.postMessage({ command: 'openExternal', url: docsUrl });
            },
            skipOnboardingBtn: () => {
                if (confirm('Are you sure? You can always access this welcome screen from the command palette.')) {
                    sendCommand('skipOnboarding');
                }
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
        if (previousState && previousState.selectedProvider) {
            state.selectedProvider = previousState.selectedProvider;
            const card = document.querySelector(\`.provider-card[data-provider="\${state.selectedProvider}"]\`);
            if (card) {
                card.classList.add('selected');
                updateSelectedProvider();
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
