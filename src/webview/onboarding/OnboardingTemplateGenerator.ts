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
        // Get icon URIs
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
            <!-- Header -->
            <div class="header">
                <img src="${logoUri}" alt="GitMind Logo" class="logo" />
                <h1>Welcome to GitMind!</h1>
                <p class="subtitle">Your AI-powered commit message assistant</p>
            </div>

            <!-- Progress Bar -->
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-text">
                    <span id="stepNumber">1</span> of <span id="totalSteps">4</span>
                </div>
            </div>

            <!-- Steps Container -->
            <div class="steps-container" id="stepsContainer">
                
                <!-- Step 1: Welcome -->
                <div class="step active" id="step1">
                    <div class="step-icon">🚀</div>
                    <h2>Let's Get Started!</h2>
                    <p>GitMind helps you generate meaningful commit messages using AI. Let's set it up in just a few steps.</p>
                    
                    <div class="features-grid">
                        <div class="feature">
                            <div class="feature-icon">🤖</div>
                            <h3>AI-Powered</h3>
                            <p>Generate contextual commit messages based on your code changes</p>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">⚡</div>
                            <h3>Fast & Easy</h3>
                            <p>One-click generation with multiple AI providers to choose from</p>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">🔒</div>
                            <h3>Privacy First</h3>
                            <p>Your code stays secure with optional telemetry and privacy controls</p>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">🎯</div>
                            <h3>Customizable</h3>
                            <p>Fine-tune commit message style and add custom context</p>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Choose Provider -->
                <div class="step" id="step2">
                    <h2>Choose Your AI Provider</h2>
                    <p>Select an AI provider to power your commit messages. Each has different strengths and pricing models.</p>
                    
                    <div class="providers-grid">
                        <div class="provider-card" data-provider="gemini">
                            <div class="provider-header">
                                ${ProviderIcon.renderIcon('gemini', 64)}
                                <h3>Google Gemini</h3>
                                <span class="provider-badge free">Free Tier</span>
                            </div>
                            <p>Google's advanced AI model with excellent code understanding</p>
                            <ul>
                                <li>Free tier available</li>
                                <li>Great for code analysis</li>
                                <li>Fast response times</li>
                            </ul>
                        </div>

                        <div class="provider-card" data-provider="openai">
                            <div class="provider-header">
                                ${ProviderIcon.renderIcon('openai', 64)}
                                <h3>OpenAI</h3>
                                <span class="provider-badge popular">Popular</span>
                            </div>
                            <p>Industry-leading GPT models known for high-quality output</p>
                            <ul>
                                <li>Excellent text generation</li>
                                <li>Reliable and consistent</li>
                                <li>Pay-per-use pricing</li>
                            </ul>
                        </div>

                        <div class="provider-card" data-provider="anthropic">
                            <div class="provider-header">
                                ${ProviderIcon.renderIcon('anthropic', 64)}
                                <h3>Anthropic Claude</h3>
                                <span class="provider-badge smart">Smart</span>
                            </div>
                            <p>Claude excels at understanding context and nuanced analysis</p>
                            <ul>
                                <li>Excellent reasoning</li>
                                <li>Context-aware responses</li>
                                <li>Safety-focused AI</li>
                            </ul>
                        </div>

                        <div class="provider-card" data-provider="ollama">
                            <div class="provider-header">
                                ${ProviderIcon.renderIcon('ollama', 64)}
                                <h3>Ollama (Local)</h3>
                                <span class="provider-badge private">Private</span>
                            </div>
                            <p>Run AI models locally on your machine for complete privacy</p>
                            <ul>
                                <li>100% private and offline</li>
                                <li>No API costs</li>
                                <li>Requires local setup</li>
                            </ul>
                        </div>

                        <div class="provider-card" data-provider="huggingface">
                            <div class="provider-header">
                                ${ProviderIcon.renderIcon('huggingface', 64)}
                                <h3>Hugging Face</h3>
                                <span class="provider-badge open">Open Source</span>
                            </div>
                            <p>Access to thousands of open-source AI models</p>
                            <ul>
                                <li>Huge model selection</li>
                                <li>Community-driven</li>
                                <li>Flexible pricing</li>
                            </ul>
                        </div>

                        <div class="provider-card" data-provider="copilot">
                            <div class="provider-header">
                                ${ProviderIcon.renderIcon('copilot', 64)}
                                <h3>GitHub Copilot</h3>
                                <span class="provider-badge integrated">Integrated</span>
                            </div>
                            <p>Uses your existing GitHub Copilot subscription</p>
                            <ul>
                                <li>No additional setup</li>
                                <li>Uses existing subscription</li>
                                <li>Code-focused training</li>
                            </ul>
                        </div>
                    </div>

                    <div class="provider-selection">
                        <p><strong>Selected:</strong> <span id="selectedProvider">None</span></p>
                        <p class="selection-hint">Click on a provider above to select it</p>
                    </div>
                </div>

                <!-- Step 3: Configuration -->
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
                </div>

                <!-- Step 4: First Commit -->
                <div class="step" id="step4">
                    <h2>Generate Your First Commit!</h2>
                    <p>You're all set! Let's generate your first AI-powered commit message.</p>
                    
                    <div class="demo-section">
                        <div class="demo-steps">
                            <div class="demo-step">
                                <div class="demo-number">1</div>
                                <div class="demo-content">
                                    <h3>Make some changes</h3>
                                    <p>Edit your code files as you normally would</p>
                                </div>
                            </div>
                            <div class="demo-step">
                                <div class="demo-number">2</div>
                                <div class="demo-content">
                                    <h3>Open Source Control</h3>
                                    <p>Go to the Source Control panel (Ctrl+Shift+G)</p>
                                </div>
                            </div>
                            <div class="demo-step">
                                <div class="demo-number">3</div>
                                <div class="demo-content">
                                    <h3>Click "Generate Commit"</h3>
                                    <p>Click the button to generate an AI commit message</p>
                                </div>
                            </div>
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
                </div>
            </div>

            <!-- Navigation -->
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
            </div>
        </div>

        <script nonce="${this._nonce}">
            ${this.getOnboardingScript()}
        </script>
    </body>
    </html>`;
    }

    private getOnboardingScript(): string {
        return `
    const vscode = acquireVsCodeApi();
    
    let currentStep = 1;
    const totalSteps = 4;
    let selectedProvider = null;
    
    // Initialize
    updateProgress();
    updateNavigation();
    
    // Navigation event listeners
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    });
    
    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
        }
    });
    
    document.getElementById('skipBtn').addEventListener('click', () => {
        vscode.postMessage({
            command: 'skipOnboarding'
        });
    });
    
    document.getElementById('finishBtn').addEventListener('click', () => {
        vscode.postMessage({
            command: 'completeOnboarding'
        });
    });
    
    // Provider selection
    document.querySelectorAll('.provider-card').forEach(card => {
        card.addEventListener('click', () => {
            // Remove previous selection
            document.querySelectorAll('.provider-card').forEach(c => c.classList.remove('selected'));
            
            // Add selection to clicked card
            card.classList.add('selected');
            selectedProvider = card.dataset.provider;
            
            // Update UI
            document.getElementById('selectedProvider').textContent = card.querySelector('h3').textContent;
            updateProviderInstructions();
            
            // Enable next button
            updateNavigation();
        });
    });
    
    // Settings button
    document.getElementById('openSettingsBtn').addEventListener('click', () => {
        if (selectedProvider) {
            vscode.postMessage({
                command: 'selectProvider',
                provider: selectedProvider
            });
        } else {
            vscode.postMessage({
                command: 'openSettings'
            });
        }
    });
    
    // Test connection button
    document.getElementById('testConnectionBtn').addEventListener('click', () => {
        vscode.postMessage({
            command: 'checkApiSetup'
        });
    });
    
    // Generate commit button
    document.getElementById('generateCommitBtn').addEventListener('click', () => {
        vscode.postMessage({
            command: 'generateFirstCommit'
        });
    });
    
    // Open source control button
    document.getElementById('openSourceControlBtn').addEventListener('click', () => {
        vscode.postMessage({
            command: 'openSourceControl'
        });
    });
    
    function showStep(step) {
        // Hide all steps
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        
        // Show current step
        document.getElementById('step' + step).classList.add('active');
        
        currentStep = step;
        updateProgress();
        updateNavigation();
    }
    
    function updateProgress() {
        const progress = (currentStep / totalSteps) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('stepNumber').textContent = currentStep;
        document.getElementById('totalSteps').textContent = totalSteps;
    }
    
    function updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const finishBtn = document.getElementById('finishBtn');
        
        // Previous button
        prevBtn.disabled = currentStep === 1;
        
        // Next button logic
        if (currentStep === 2) {
            // Step 2: Need provider selection
            nextBtn.disabled = !selectedProvider;
        } else if (currentStep === totalSteps) {
            // Last step: Show finish button
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'inline-block';
        } else {
            nextBtn.disabled = false;
            nextBtn.style.display = 'inline-block';
            finishBtn.style.display = 'none';
        }
    }
    
    function updateProviderInstructions() {
        const instructions = document.getElementById('providerInstructions');
        const links = document.getElementById('providerLinks');
        
        const providerInfo = {
            'gemini': {
                instruction: 'Get a free API key from Google AI Studio:',
                link: 'https://aistudio.google.com/app/apikey',
                linkText: 'Get Gemini API Key'
            },
            'openai': {
                instruction: 'Sign up and get your API key from OpenAI:',
                link: 'https://platform.openai.com/api-keys',
                linkText: 'Get OpenAI API Key'
            },
            'anthropic': {
                instruction: 'Create an account and get your API key from Anthropic:',
                link: 'https://console.anthropic.com/',
                linkText: 'Get Claude API Key'
            },
            'ollama': {
                instruction: 'Download and install Ollama on your machine:',
                link: 'https://ollama.ai/download',
                linkText: 'Download Ollama'
            },
            'huggingface': {
                instruction: 'Create a free account and generate an API token:',
                link: 'https://huggingface.co/settings/tokens',
                linkText: 'Get Hugging Face Token'
            },
            'copilot': {
                instruction: 'No additional setup needed if you have GitHub Copilot:',
                link: 'https://github.com/features/copilot',
                linkText: 'Learn about GitHub Copilot'
            },
            'mistral': {
                instruction: 'Create an account and get your API key from Mistral:',
                link: 'https://console.mistral.ai/api-keys/',
                linkText: 'Get Mistral API Key'
            },
            'cohere': {
                instruction: 'Sign up and get your API key from Cohere:',
                link: 'https://dashboard.cohere.com/api-keys',
                linkText: 'Get Cohere API Key'
            },
            'together': {
                instruction: 'Create an account and get your API key from Together AI:',
                link: 'https://api.together.xyz/settings/api-keys',
                linkText: 'Get Together AI API Key'
            },
            'openrouter': {
                instruction: 'Sign up and get your API key from OpenRouter:',
                link: 'https://openrouter.ai/keys',
                linkText: 'Get OpenRouter API Key'
            },
            'deepseek': {
                instruction: 'Get your API key from DeepSeek:',
                link: 'https://platform.deepseek.com/',
                linkText: 'Get DeepSeek API Key'
            },
            'grok': {
                instruction: 'Sign up for X Premium or above to access Grok:',
                link: 'https://x.com/premium',
                linkText: 'Get X Premium'
            },
            'perplexity': {
                instruction: 'Create an account and get your API key from Perplexity:',
                link: 'https://www.perplexity.ai/settings/api',
                linkText: 'Get Perplexity API Key'
            }
        };
        
        if (selectedProvider && providerInfo[selectedProvider]) {
            const info = providerInfo[selectedProvider];
            instructions.textContent = info.instruction;
            links.innerHTML = '<a href="' + info.link + '" class="provider-link">' + info.linkText + '</a>';
        }
    }
    
    // Listen for messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.command) {
            case 'updateConfigStatus':
                updateConfigStatus(message.status);
                break;
            case 'connectionTestResult':
                updateConnectionStatus(message.success, message.message);
                break;
        }
    });
    
    function updateConfigStatus(status) {
        const apiKeyStatus = document.getElementById('apiKeyStatus');
        const apiKeyMessage = document.getElementById('apiKeyMessage');
        const testBtn = document.getElementById('testConnectionBtn');
        
        if (status.hasApiKey) {
            apiKeyStatus.textContent = '✅';
            apiKeyStatus.className = 'status-icon success';
            apiKeyMessage.textContent = 'Configured';
            testBtn.disabled = false;
        } else {
            apiKeyStatus.textContent = '❌';
            apiKeyStatus.className = 'status-icon pending';
            apiKeyMessage.textContent = 'Not configured';
            testBtn.disabled = true;
        }
    }
    
    function updateConnectionStatus(success, message) {
        const connectionStatus = document.getElementById('connectionStatus');
        const connectionMessage = document.getElementById('connectionMessage');
        
        if (success) {
            connectionStatus.textContent = '✅';
            connectionStatus.className = 'status-icon success';
            connectionMessage.textContent = 'Connection successful!';
        } else {
            connectionStatus.textContent = '❌';
            connectionStatus.className = 'status-icon error';
            connectionMessage.textContent = message || 'Connection failed';
        }
    }
    `;
    }
}
