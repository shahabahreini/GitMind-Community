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
            ${this.generateProgressBar()}
            ${this.generateStepsContainer()}
            ${this.generateNavigation()}
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
                <h1>Welcome to GitMind!</h1>
                <p class="subtitle">Your AI-powered commit message assistant</p>
            </div>`;
    }

    private generateProgressBar(): string {
        return `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-text">
                    <span id="stepNumber">1</span> of <span id="totalSteps">4</span>
                </div>
            </div>`;
    }

    private generateStepsContainer(): string {
        return `
            <div class="steps-container" id="stepsContainer">
                ${this.generateWelcomeStep()}
                ${this.generateProviderStep()}
                ${this.generateConfigurationStep()}
                ${this.generateFirstCommitStep()}
            </div>`;
    }

    private generateWelcomeStep(): string {
        const features = [
            { icon: '🤖', title: 'AI-Powered', desc: 'Generate contextual commit messages based on your code changes' },
            { icon: '⚡', title: 'Fast & Easy', desc: 'One-click generation with multiple AI providers to choose from' },
            { icon: '🔒', title: 'Privacy First', desc: 'Your code stays secure with optional telemetry and privacy controls' },
            { icon: '🎯', title: 'Customizable', desc: 'Fine-tune commit message style and add custom context' }
        ];

        const featuresHtml = features.map(feature => `
            <div class="feature">
                <div class="feature-icon">${feature.icon}</div>
                <h3>${feature.title}</h3>
                <p>${feature.desc}</p>
            </div>`).join('');

        return `
            <div class="step active" id="step1">
                <div class="step-icon">🚀</div>
                <h2>Let's Get Started!</h2>
                <p>GitMind helps you generate meaningful commit messages using AI. Let's set it up in just a few steps.</p>
                
                <div class="features-grid">
                    ${featuresHtml}
                </div>
            </div>`;
    }

    private generateProviderStep(): string {
        const providers = [
            { id: 'gemini', name: 'Google Gemini', badge: 'Free Tier', badgeClass: 'free', desc: 'Google\'s advanced AI model with excellent code understanding', features: ['Free tier available', 'Great for code analysis', 'Fast response times'] },
            { id: 'openai', name: 'OpenAI', badge: 'Popular', badgeClass: 'popular', desc: 'Industry-leading GPT models known for high-quality output', features: ['Excellent text generation', 'Reliable and consistent', 'Pay-per-use pricing'] },
            { id: 'anthropic', name: 'Anthropic Claude', badge: 'Smart', badgeClass: 'smart', desc: 'Claude excels at understanding context and nuanced analysis', features: ['Excellent reasoning', 'Context-aware responses', 'Safety-focused AI'] },
            { id: 'ollama', name: 'Ollama (Local)', badge: 'Private', badgeClass: 'private', desc: 'Run AI models locally on your machine for complete privacy', features: ['100% private and offline', 'No API costs', 'Requires local setup'] },
            { id: 'huggingface', name: 'Hugging Face', badge: 'Open Source', badgeClass: 'open', desc: 'Access to thousands of open-source AI models', features: ['Huge model selection', 'Community-driven', 'Flexible pricing'] },
            { id: 'copilot', name: 'GitHub Copilot', badge: 'Integrated', badgeClass: 'integrated', desc: 'Uses your existing GitHub Copilot subscription', features: ['No additional setup', 'Uses existing subscription', 'Code-focused training'] }
        ];

        const providersHtml = providers.map(provider => `
            <div class="provider-card" data-provider="${provider.id}">
                <div class="provider-header">
                    ${ProviderIcon.renderIcon(provider.id, 64)}
                    <h3>${provider.name}</h3>
                    <span class="provider-badge ${provider.badgeClass}">${provider.badge}</span>
                </div>
                <p>${provider.desc}</p>
                <ul>
                    ${provider.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>`).join('');

        return `
            <div class="step" id="step2">
                <h2>Choose Your AI Provider</h2>
                <p>Select an AI provider to power your commit messages. Each has different strengths and pricing models.</p>
                
                <div class="providers-grid">
                    ${providersHtml}
                </div>

                <div class="provider-selection">
                    <p><strong>Selected:</strong> <span id="selectedProvider">None</span></p>
                    <p class="selection-hint">Click on a provider above to select it</p>
                </div>
            </div>`;
    }

    private generateConfigurationStep(): string {
        return `
            <div class="step" id="step3">
                <h2>Configure Your Settings</h2>
                <p>Let's set up your API key and configure your preferences.</p>
                
                <div class="config-status" id="configStatus">
                    <div class="status-item">
                        <div class="status-icon pending" id="apiKeyStatus">❌</div>
                        <div class="status-content">
                            <h3>API Key</h3>
                            <p id="apiKeyMessage">Not configured</p>
                        </div>
                    </div>
                    
                    <div class="status-item">
                        <div class="status-icon pending" id="connectionStatus">❌</div>
                        <div class="status-content">
                            <h3>Connection Test</h3>
                            <p id="connectionMessage">Waiting for API key</p>
                        </div>
                    </div>
                </div>

                <div class="config-actions">
                    <button class="btn btn-primary" id="openSettingsBtn">
                        🔧 Open Settings Panel
                    </button>
                    <button class="btn btn-secondary" id="testConnectionBtn" disabled>
                        🔌 Test Connection
                    </button>
                </div>

                <div class="config-help">
                    <h3>Need help getting an API key?</h3>
                    <p id="providerInstructions">Select a provider in the previous step to see instructions.</p>
                    <div id="providerLinks"></div>
                </div>
            </div>`;
    }

    private generateFirstCommitStep(): string {
        const demoSteps = [
            { number: 1, title: 'Make some changes', desc: 'Edit your code files as you normally would' },
            { number: 2, title: 'Open Source Control', desc: 'Go to the Source Control panel (Ctrl+Shift+G)' },
            { number: 3, title: 'Click "Generate Commit"', desc: 'Click the button to generate an AI commit message' }
        ];

        const demoStepsHtml = demoSteps.map(step => `
            <div class="demo-step">
                <div class="demo-number">${step.number}</div>
                <div class="demo-content">
                    <h3>${step.title}</h3>
                    <p>${step.desc}</p>
                </div>
            </div>`).join('');

        return `
            <div class="step" id="step4">
                <h2>Generate Your First Commit!</h2>
                <p>You're all set! Let's generate your first AI-powered commit message.</p>
                
                <div class="demo-section">
                    <div class="demo-steps">
                        ${demoStepsHtml}
                    </div>
                </div>

                <div class="final-actions">
                    <button class="btn btn-primary" id="generateCommitBtn">
                        ✨ Try Generate Commit
                    </button>
                    <button class="btn btn-secondary" id="openSourceControlBtn">
                        📁 Open Source Control
                    </button>
                </div>

                <div class="completion-message">
                    <h3>🎉 You're ready to go!</h3>
                    <p>GitMind is now configured and ready to help you write better commit messages. You can always access settings through the command palette or the gear icon in the Source Control panel.</p>
                </div>
            </div>`;
    }

    private generateNavigation(): string {
        return `
            <div class="navigation">
                <button class="btn btn-secondary" id="prevBtn" disabled>
                    ← Previous
                </button>
                <button class="btn btn-secondary" id="skipBtn">
                    Don't Show Again
                </button>
                <button class="btn btn-primary" id="nextBtn">
                    Next →
                </button>
                <button class="btn btn-success" id="finishBtn" style="display: none;">
                    🎉 Finish Setup
                </button>
            </div>`;
    }

    private getOnboardingScript(): string {
        return `
    const vscode = acquireVsCodeApi();
    
    // State management
    const state = {
        currentStep: 1,
        totalSteps: 4,
        selectedProvider: null
    };
    
    // Provider configuration data
    const providerInfo = {
        gemini: { instruction: 'Get a free API key from Google AI Studio:', link: 'https://aistudio.google.com/app/apikey', linkText: 'Get Gemini API Key' },
        openai: { instruction: 'Sign up and get your API key from OpenAI:', link: 'https://platform.openai.com/api-keys', linkText: 'Get OpenAI API Key' },
        anthropic: { instruction: 'Create an account and get your API key from Anthropic:', link: 'https://console.anthropic.com/', linkText: 'Get Claude API Key' },
        ollama: { instruction: 'Download and install Ollama on your machine:', link: 'https://ollama.ai/download', linkText: 'Download Ollama' },
        huggingface: { instruction: 'Create a free account and generate an API token:', link: 'https://huggingface.co/settings/tokens', linkText: 'Get Hugging Face Token' },
        copilot: { instruction: 'No additional setup needed if you have GitHub Copilot:', link: 'https://github.com/features/copilot', linkText: 'Learn about GitHub Copilot' },
        mistral: { instruction: 'Create an account and get your API key from Mistral:', link: 'https://console.mistral.ai/api-keys/', linkText: 'Get Mistral API Key' },
        cohere: { instruction: 'Sign up and get your API key from Cohere:', link: 'https://dashboard.cohere.com/api-keys', linkText: 'Get Cohere API Key' },
        together: { instruction: 'Create an account and get your API key from Together AI:', link: 'https://api.together.xyz/settings/api-keys', linkText: 'Get Together AI API Key' },
        openrouter: { instruction: 'Sign up and get your API key from OpenRouter:', link: 'https://openrouter.ai/keys', linkText: 'Get OpenRouter API Key' },
        deepseek: { instruction: 'Get your API key from DeepSeek:', link: 'https://platform.deepseek.com/', linkText: 'Get DeepSeek API Key' },
        grok: { instruction: 'Sign up for X Premium or above to access Grok:', link: 'https://x.com/premium', linkText: 'Get X Premium' },
        perplexity: { instruction: 'Create an account and get your API key from Perplexity:', link: 'https://www.perplexity.ai/settings/api', linkText: 'Get Perplexity API Key' }
    };

    // DOM elements cache
    const elements = {
        get progressFill() { return document.getElementById('progressFill'); },
        get stepNumber() { return document.getElementById('stepNumber'); },
        get totalSteps() { return document.getElementById('totalSteps'); },
        get prevBtn() { return document.getElementById('prevBtn'); },
        get nextBtn() { return document.getElementById('nextBtn'); },
        get finishBtn() { return document.getElementById('finishBtn'); },
        get skipBtn() { return document.getElementById('skipBtn'); },
        get selectedProvider() { return document.getElementById('selectedProvider'); },
        get providerInstructions() { return document.getElementById('providerInstructions'); },
        get providerLinks() { return document.getElementById('providerLinks'); },
        get apiKeyStatus() { return document.getElementById('apiKeyStatus'); },
        get apiKeyMessage() { return document.getElementById('apiKeyMessage'); },
        get connectionStatus() { return document.getElementById('connectionStatus'); },
        get connectionMessage() { return document.getElementById('connectionMessage'); },
        get testConnectionBtn() { return document.getElementById('testConnectionBtn'); }
    };

    // Message handlers
    const messageHandlers = {
        updateConfigStatus: (status) => updateConfigStatus(status),
        connectionTestResult: (data) => updateConnectionStatus(data.success, data.message)
    };

    // Event handlers
    const eventHandlers = {
        prevBtn: () => navigateStep(-1),
        nextBtn: () => navigateStep(1),
        skipBtn: () => sendCommand('skipOnboarding', { disableBtn: true, loadingText: 'Disabling...' }),
        finishBtn: () => sendCommand('completeOnboarding'),
        openSettingsBtn: () => sendCommand(state.selectedProvider ? 'selectProvider' : 'openSettings', state.selectedProvider ? { provider: state.selectedProvider } : undefined),
        testConnectionBtn: () => sendCommand('checkApiSetup'),
        generateCommitBtn: () => sendCommand('generateFirstCommit'),
        openSourceControlBtn: () => sendCommand('openSourceControl')
    };

    // Initialize
    init();

    function init() {
        updateProgress();
        updateNavigation();
        setupEventListeners();
        setupProviderSelection();
        setupMessageListener();
    }

    function setupEventListeners() {
        Object.entries(eventHandlers).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    }

    function setupProviderSelection() {
        document.querySelectorAll('.provider-card').forEach(card => {
            card.addEventListener('click', () => selectProvider(card));
        });
    }

    function setupMessageListener() {
        window.addEventListener('message', event => {
            const { command, ...data } = event.data;
            const handler = messageHandlers[command];
            if (handler) {
                handler(data);
            }
        });
    }

    function navigateStep(direction) {
        const newStep = state.currentStep + direction;
        if (newStep >= 1 && newStep <= state.totalSteps) {
            state.currentStep = newStep;
            showStep(state.currentStep);
        }
    }

    function sendCommand(command, data = {}, buttonConfig = null) {
        if (buttonConfig) {
            const btn = document.getElementById(buttonConfig.btnId || command.replace(/([A-Z])/g, char => char.toLowerCase()) + 'Btn');
            if (btn) {
                btn.disabled = buttonConfig.disableBtn;
                if (buttonConfig.loadingText) {
                    btn.textContent = buttonConfig.loadingText;
                }
            }
        }

        console.log(\`\${command} button clicked - sending \${command} command\`);
        vscode.postMessage({ command, ...data });
    }

    function selectProvider(card) {
        // Clear previous selection
        document.querySelectorAll('.provider-card').forEach(c => c.classList.remove('selected'));
        
        // Set new selection
        card.classList.add('selected');
        state.selectedProvider = card.dataset.provider;
        
        // Update UI
        elements.selectedProvider.textContent = card.querySelector('h3').textContent;
        updateProviderInstructions();
        updateNavigation();
    }

    function showStep(step) {
        // Hide all steps
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        
        // Show current step
        document.getElementById('step' + step).classList.add('active');
        
        updateProgress();
        updateNavigation();
    }

    function updateProgress() {
        const progress = (state.currentStep / state.totalSteps) * 100;
        elements.progressFill.style.width = progress + '%';
        elements.stepNumber.textContent = state.currentStep;
        elements.totalSteps.textContent = state.totalSteps;
    }

    function updateNavigation() {
        // Previous button
        elements.prevBtn.disabled = state.currentStep === 1;
        
        // Next/Finish button logic
        if (state.currentStep === 2) {
            // Step 2: Need provider selection
            elements.nextBtn.disabled = !state.selectedProvider;
        } else if (state.currentStep === state.totalSteps) {
            // Last step: Show finish button
            elements.nextBtn.style.display = 'none';
            elements.finishBtn.style.display = 'inline-block';
        } else {
            elements.nextBtn.disabled = false;
            elements.nextBtn.style.display = 'inline-block';
            elements.finishBtn.style.display = 'none';
        }
    }

    function updateProviderInstructions() {
        if (state.selectedProvider && providerInfo[state.selectedProvider]) {
            const info = providerInfo[state.selectedProvider];
            elements.providerInstructions.textContent = info.instruction;
            elements.providerLinks.innerHTML = \`<a href="\${info.link}" class="provider-link">\${info.linkText}</a>\`;
        }
    }

    function updateConfigStatus(status) {
        const hasApiKey = status.hasApiKey;
        
        elements.apiKeyStatus.textContent = hasApiKey ? '✅' : '❌';
        elements.apiKeyStatus.className = \`status-icon \${hasApiKey ? 'success' : 'pending'}\`;
        elements.apiKeyMessage.textContent = hasApiKey ? 'Configured' : 'Not configured';
        elements.testConnectionBtn.disabled = !hasApiKey;
    }

    function updateConnectionStatus(success, message) {
        elements.connectionStatus.textContent = success ? '✅' : '❌';
        elements.connectionStatus.className = \`status-icon \${success ? 'success' : 'error'}\`;
        elements.connectionMessage.textContent = success ? 'Connection successful!' : (message || 'Connection failed');
    }
    `;
    }
}