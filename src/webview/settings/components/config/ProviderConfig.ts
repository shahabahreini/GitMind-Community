// src/webview/settings/components/config/ProviderConfig.ts

interface ProviderField {
    id: string;
    key: string;
    label: string;
    type: 'password' | 'text' | 'select' | 'info' | 'model-with-load';
    tooltip: string;
    placeholder?: string;
    defaultValue?: string;
    link?: { url: string; text: string };
    options?: Array<{ value: string; label: string; group?: string }>;
    content?: string;
    loadButtonText?: string;
    loadButtonId?: string;
    loadCommand?: string;
    defaultOptions?: string[];
}

interface Provider {
    id: string;
    name: string;
    fields: ProviderField[];
    isPro?: boolean;
}

export class ProviderConfig {
    private static readonly providers: Provider[] = [
        {
            id: 'gemini',
            name: 'Gemini',
            fields: [
                {
                    id: 'geminiApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your Gemini API key for accessing the API',
                    link: { url: 'https://aistudio.google.com/app/apikey', text: 'Get a Gemini API key' }
                },
                {
                    id: 'geminiModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: 'Select which Gemini model to use',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadGeminiModels',
                    loadCommand: 'gitmind.loadGeminiModels',
                    options: [
                        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', group: 'Gemini 2.5 Series' },
                        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', group: 'Gemini 2.5 Series' },
                        { value: 'gemini-2.5-flash-preview', label: 'Gemini 2.5 Flash Preview', group: 'Gemini 2.5 Series' },
                        { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', group: 'Gemini 2.5 Series' },
                        { value: 'gemini-2.5-flash-lite-preview', label: 'Gemini 2.5 Flash-Lite Preview', group: 'Gemini 2.5 Series' },
                        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', group: 'Gemini 2.0 Series' },
                        { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite', group: 'Gemini 2.0 Series' }
                    ]
                }
            ]
        },
        {
            id: 'openai',
            name: 'OpenAI',
            fields: [
                {
                    id: 'openaiApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your OpenAI API key for accessing the API',
                    link: { url: 'https://platform.openai.com/account/api-keys', text: 'Get an OpenAI API key' }
                },
                {
                    id: 'openaiModel',
                    key: 'model',
                    label: 'Model',
                    type: 'select',
                    tooltip: 'Select which OpenAI model to use',
                    options: [
                        { value: 'gpt-4o', label: 'GPT-4o' },
                        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                        { value: 'gpt-4', label: 'GPT-4' },
                        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
                    ]
                }
            ]
        },
        {
            id: 'anthropic',
            name: 'Anthropic',
            fields: [
                {
                    id: 'anthropicApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your Anthropic API key for accessing the API',
                    link: { url: 'https://console.anthropic.com/', text: 'Get an Anthropic API key' }
                },
                {
                    id: 'anthropicModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: 'Select which Anthropic model to use',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadAnthropicModels',
                    loadCommand: 'gitmind.loadAnthropicModels',
                    options: [
                        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
                        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
                        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
                        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
                        { value: 'claude-2.1', label: 'Claude 2.1' },
                        { value: 'claude-2.0', label: 'Claude 2.0' },
                        { value: 'claude-instant-1.2', label: 'Claude Instant 1.2' }
                    ]
                }
            ]
        },
        {
            id: 'copilot',
            name: 'GitHub Copilot',
            fields: [
                {
                    id: 'copilotInfo',
                    key: 'info',
                    label: '',
                    type: 'info',
                    tooltip: '',
                    content: `
                        <strong>No API Key Required</strong>
                        <p>GitHub Copilot uses your existing VS Code authentication.</p>
                        <p>Make sure you have the GitHub Copilot extension installed and are signed in.</p>
                    `
                },
                {
                    id: 'copilotModel',
                    key: 'model',
                    label: 'Model',
                    type: 'select',
                    tooltip: 'Select which model to use with GitHub Copilot',
                    options: [
                        { value: 'gpt-4o', label: 'GPT-4o' },
                        { value: 'gpt-4', label: 'GPT-4' }
                    ]
                }
            ]
        },
        {
            id: 'huggingface',
            name: 'Hugging Face',
            fields: [
                {
                    id: 'huggingfaceApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your Hugging Face API key for accessing the API',
                    link: { url: 'https://huggingface.co/settings/tokens', text: 'Get a Hugging Face API key' }
                },
                {
                    id: 'huggingfaceModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: 'Hugging Face model identifier (e.g., mistralai/Mistral-7B-Instruct-v0.3)',
                    loadButtonText: 'Load All Available Models',
                    loadButtonId: 'loadHuggingFaceModels',
                    loadCommand: 'gitmind.loadHuggingFaceModels',
                    defaultOptions: [
                        'mistralai/Mistral-7B-Instruct-v0.3',
                        'microsoft/DialoGPT-medium',
                        'facebook/bart-large-cnn',
                        'microsoft/DialoGPT-large',
                        'HuggingFaceH4/zephyr-7b-beta',
                        'teknium/OpenHermes-2.5-Mistral-7B',
                        'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO'
                    ]
                }
            ]
        },
        {
            id: 'ollama',
            name: 'Ollama',
            fields: [
                {
                    id: 'ollamaUrl',
                    key: 'url',
                    label: 'Base URL',
                    type: 'text',
                    tooltip: 'Ollama server base URL (default: http://localhost:11434)',
                    placeholder: 'http://localhost:11434'
                },
                {
                    id: 'ollamaModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: 'Ollama model name (e.g., phi4, llama3.2, mistral)',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadOllamaModels',
                    loadCommand: 'gitmind.loadOllamaModels',
                    defaultOptions: [
                        'llama3.2',
                        'llama3.1',
                        'llama3',
                        'codellama',
                        'mistral',
                        'deepseek-coder',
                        'phi4',
                        'qwen2.5-coder'
                    ]
                }
            ]
        },
        {
            id: 'mistral',
            name: 'Mistral',
            fields: [
                {
                    id: 'mistralApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your Mistral API key for accessing the API',
                    link: { url: 'https://console.mistral.ai/', text: 'Get a Mistral API key' }
                },
                {
                    id: 'mistralModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: 'Select which Mistral model to use',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadMistralModels',
                    loadCommand: 'gitmind.loadMistralModels',
                    options: [
                        { value: 'mistral-large-latest', label: 'Mistral Large (Latest)' },
                        { value: 'mistral-medium-latest', label: 'Mistral Medium (Latest)' },
                        { value: 'mistral-small-latest', label: 'Mistral Small (Latest)' },
                        { value: 'open-mistral-7b', label: 'Open Mistral 7B' },
                        { value: 'open-mixtral-8x7b', label: 'Open Mixtral 8x7B' },
                        { value: 'open-mixtral-8x22b', label: 'Open Mixtral 8x22B' }
                    ]
                }
            ]
        },
        {
            id: 'cohere',
            name: 'Cohere',
            fields: [
                {
                    id: 'cohereApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your Cohere API key for accessing the API',
                    link: { url: 'https://dashboard.cohere.com/api-keys', text: 'Get a Cohere API key' }
                },
                {
                    id: 'cohereModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: 'Select which Cohere model to use',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadCohereModels',
                    loadCommand: 'gitmind.loadCohereModels',
                    options: [
                        { value: 'command-a-03-2025', label: 'Command A (Latest)' },
                        { value: 'command-r-08-2024', label: 'Command R (08-2024)' },
                        { value: 'command-r-plus-08-2024', label: 'Command R+ (08-2024)' },
                        { value: 'aya-expanse-8b', label: 'Aya Expanse 8B' },
                        { value: 'aya-expanse-32b', label: 'Aya Expanse 32B' },
                        { value: 'command-r-plus', label: 'Command R+' },
                        { value: 'command-r', label: 'Command R' },
                        { value: 'command', label: 'Command' },
                        { value: 'command-light', label: 'Command Light' }
                    ]
                }
            ]
        },
        {
            id: 'together',
            name: 'Together AI',
            fields: [
                {
                    id: 'togetherApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your Together AI API key for accessing the API',
                    link: { url: 'https://api.together.xyz/settings/api-keys', text: 'Get a Together AI API key' }
                },
                {
                    id: 'togetherModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: 'Select which Together AI model to use',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadTogetherModels',
                    loadCommand: 'gitmind.loadTogetherModels',
                    options: [
                        { value: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Instruct Turbo' },
                        { value: 'meta-llama/Llama-3.1-8B-Instruct-Turbo', label: 'Llama 3.1 8B Instruct Turbo' },
                        { value: 'meta-llama/Llama-3.1-70B-Instruct-Turbo', label: 'Llama 3.1 70B Instruct Turbo' },
                        { value: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free', label: 'DeepSeek R1 Distill 70B (Free)' },
                        { value: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen 2.5 72B Instruct Turbo' },
                        { value: 'microsoft/WizardLM-2-8x22B', label: 'WizardLM 2 8x22B' },
                        { value: 'mistralai/Mixtral-8x7B-Instruct-v0.1', label: 'Mixtral 8x7B Instruct' },
                        { value: 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO', label: 'Nous Hermes 2 Mixtral 8x7B DPO' }
                    ]
                }
            ]
        },
        {
            id: 'openrouter',
            name: 'OpenRouter',
            fields: [
                {
                    id: 'openrouterApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your OpenRouter API key for accessing the API',
                    link: { url: 'https://openrouter.ai/keys', text: 'Get an OpenRouter API key' }
                },
                {
                    id: 'openrouterModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: 'Select which OpenRouter model to use',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadOpenRouterModels',
                    options: [
                        { value: 'google/gemma-3-27b-it:free', label: 'Gemma 3 27B Instruct (Free)' },
                        { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
                        { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
                        { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
                        { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)' },
                        { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
                        { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)' },
                        { value: 'qwen/qwen-2-7b-instruct:free', label: 'Qwen 2 7B (Free)' }
                    ]
                }
            ]
        },
        {
            id: 'deepseek',
            name: 'DeepSeek',
            fields: [
                {
                    id: 'deepseekApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your DeepSeek API key for accessing the API',
                    link: { url: 'https://platform.deepseek.com/api_keys', text: 'Get a DeepSeek API key' }
                },
                {
                    id: 'deepseekModel',
                    key: 'model',
                    label: 'Model',
                    type: 'select',
                    tooltip: 'Select which DeepSeek model to use',
                    options: [
                        { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (Latest)' },
                        { value: 'deepseek-chat', label: 'DeepSeek Chat' },
                        { value: 'deepseek-coder', label: 'DeepSeek Coder' }
                    ]
                }
            ]
        },
        {
            id: 'grok',
            name: 'Grok',
            fields: [
                {
                    id: 'grokApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your Grok API key for accessing the API',
                    link: { url: 'https://console.x.ai/', text: 'Get a Grok API key' }
                },
                {
                    id: 'grokModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: 'Select which Grok model to use',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadGrokModels',
                    loadCommand: 'gitmind.loadGrokModels',
                    options: [
                        { value: 'grok-3', label: 'Grok-3 (Latest)' },
                        { value: 'grok-2', label: 'Grok-2' },
                        { value: 'grok-1.5v', label: 'Grok-1.5V (Vision)' },
                        { value: 'grok-1.5', label: 'Grok-1.5' }
                    ]
                }
            ]
        },
        {
            id: 'perplexity',
            name: 'Perplexity',
            fields: [
                {
                    id: 'perplexityApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your Perplexity API key for accessing the API',
                    link: { url: 'https://www.perplexity.ai/settings/api', text: 'Get a Perplexity API key' }
                },
                {
                    id: 'perplexityModel',
                    key: 'model',
                    label: 'Model',
                    type: 'select',
                    tooltip: 'Select which Perplexity model to use',
                    options: [
                        { value: 'llama-3.1-sonar-large-128k-online', label: 'Sonar Large (Online)' },
                        { value: 'llama-3.1-sonar-small-128k-online', label: 'Sonar Small (Online)' },
                        { value: 'llama-3.1-sonar-large-128k-chat', label: 'Sonar Large (Chat)' },
                        { value: 'llama-3.1-sonar-small-128k-chat', label: 'Sonar Small (Chat)' }
                    ]
                }
            ]
        },
        {
            id: 'custom',
            name: 'Custom API [Pro]',
            isPro: true,
            fields: [
                {
                    id: 'customBaseUrl',
                    key: 'baseUrl',
                    label: 'Base URL',
                    type: 'text',
                    tooltip: 'The base URL of your custom API (e.g., https://your-api.example.com)',
                    placeholder: 'https://your-api.example.com'
                },
                {
                    id: 'customEndpoint',
                    key: 'endpoint',
                    label: 'API Endpoint Path',
                    type: 'text',
                    tooltip: 'The endpoint path for the chat completion API (e.g., /v1/chat/completions)',
                    placeholder: '/v1/chat/completions'
                },
                {
                    id: 'customAuthType',
                    key: 'authType',
                    label: 'Authentication Type',
                    type: 'select',
                    tooltip: 'Select the authentication method for your API',
                    options: [
                        { value: 'bearer', label: 'Bearer Token' },
                        { value: 'apikey', label: 'API Key' },
                        { value: 'basic', label: 'Basic Authentication' },
                        { value: 'none', label: 'No Authentication' }
                    ]
                },
                {
                    id: 'customAuthToken',
                    key: 'authToken',
                    label: 'Authentication Token',
                    type: 'password',
                    tooltip: 'Your API token or key (will be stored securely)'
                },
                {
                    id: 'customHeaderKey',
                    key: 'headerKey',
                    label: 'Header Key Name',
                    type: 'text',
                    tooltip: 'Header key name for API Key authentication (e.g., X-API-Key)',
                    placeholder: 'X-API-Key'
                },
                {
                    id: 'customRequestFormat',
                    key: 'requestFormat',
                    label: 'Request Format',
                    type: 'select',
                    tooltip: 'The format of the API request payload',
                    options: [
                        { value: 'openai', label: 'OpenAI-compatible' },
                        { value: 'anthropic', label: 'Anthropic-compatible' },
                        { value: 'custom', label: 'Custom Format' }
                    ]
                },
                {
                    id: 'customResponseFormat',
                    key: 'responseFormat',
                    label: 'Response Format',
                    type: 'select',
                    tooltip: 'The format of the API response',
                    options: [
                        { value: 'openai', label: 'OpenAI-compatible' },
                        { value: 'anthropic', label: 'Anthropic-compatible' },
                        { value: 'custom', label: 'Custom Format' }
                    ]
                },
                {
                    id: 'customModel',
                    key: 'model',
                    label: 'Model Name',
                    type: 'text',
                    tooltip: 'The name of the model to use (as required by your API)',
                    placeholder: 'e.g., gpt-4-equivalent'
                },
                {
                    id: 'customInfo',
                    key: 'info',
                    type: 'info',
                    label: '',
                    tooltip: '',
                    content: `<div class="pro-feature-container">
                        <div class="pro-feature-badge">Pro Feature</div>
                        <div class="pro-feature-text">Custom API integration is available to Pro users only.</div>
                        <button id="customTestConnection" class="button small">Test Connection</button>
                    </div>
                    <div class="help-text">
                        <a href="https://github.com/gitmind-io/gitmind/blob/main/docs/custom-api-guide.md" target="_blank">
                            View documentation for Custom API configuration
                        </a>
                    </div>`
                }
            ]
        }
        // All providers now complete
    ];

    public static getAllProviders(): Provider[] {
        return this.providers;
    }

    public static getProvider(id: string): Provider | undefined {
        return this.providers.find(provider => provider.id === id);
    }

    public static getProviderNames(): Array<{ value: string; label: string }> {
        return this.providers.map(provider => ({
            value: provider.id,
            label: provider.name
        }));
    }
}