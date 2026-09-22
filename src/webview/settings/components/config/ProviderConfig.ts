// src/webview/settings/components/config/ProviderConfig.ts
import { getCuratedModels, getProviderEntry } from '../../../../config/providerCatalog';

/** Bootstrap model choices from the provider catalog; Load Models replaces them with live results. */
function modelOptions(provider: string): Array<{ value: string; label: string }> {
    return getCuratedModels(provider).map(model => ({ value: model, label: model }));
}


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
    loadButtonDisabled?: boolean;
    loadButtonDisabledTooltip?: string;
    defaultOptions?: string[];
}

interface Provider {
    id: string;
    name: string;
    fields: ProviderField[];
    isPro?: boolean;
}

export class ProviderConfig {
    /** Form definitions; provider names come from the provider catalog. */
    private static readonly providers: Omit<Provider, 'name'>[] = [
        {
            id: 'gemini',
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadGeminiModels',
                    loadCommand: 'gitmind.loadGeminiModels',
                    options: modelOptions('gemini')
                }
            ]
        },
        {
            id: 'openai',
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
                    type: 'model-with-load',
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadOpenAIModels',
                    loadCommand: 'gitmind.loadOpenAIModels',
                    options: modelOptions('openai')
                }
            ]
        },
        {
            id: 'anthropic',
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadAnthropicModels',
                    loadCommand: 'gitmind.loadAnthropicModels',
                    options: modelOptions('anthropic')
                }
            ]
        },
        {
            id: 'minimax',
            fields: [
                {
                    id: 'minimaxApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your MiniMax API key for accessing the API',
                    link: { url: 'https://platform.minimax.io/docs/api-reference/text-anthropic-api', text: 'Get a MiniMax API key' }
                },
                {
                    id: 'minimaxModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadMiniMaxModels',
                    loadCommand: 'gitmind.loadMiniMaxModels',
                    loadButtonDisabled: true,
                    loadButtonDisabledTooltip: "MiniMax won't support model fetch yet!",
                    options: modelOptions('minimax')
                }
            ]
        },
        {
            id: 'copilot',
            fields: [
                {
                    id: 'copilotInfo',
                    key: 'info',
                    label: '',
                    type: 'info',
                    tooltip: '',
                    content: `
                        <strong>No API Key Required</strong>
                        <p>GitHub Copilot uses your editor's GitHub Copilot sign-in through the language model API.</p>
                        <p>Install GitHub Copilot and sign in, then use Load Models. The first request asks you to allow GitMind to use Copilot models.</p>
                    `
                },
                {
                    id: 'copilotModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: '',
                    loadButtonText: 'Detect Available Models',
                    loadButtonId: 'loadCopilotModels',
                    loadCommand: 'gitmind.loadCopilotModels',
                    options: modelOptions('copilot')
                }
            ]
        },
        {
            id: 'huggingface',
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
                    tooltip: '',
                    loadButtonText: 'Load All Available Models',
                    loadButtonId: 'loadHuggingFaceModels',
                    loadCommand: 'gitmind.loadHuggingFaceModels',
                    defaultOptions: []
                }
            ]
        },
        {
            id: 'ollama',
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadOllamaModels',
                    loadCommand: 'gitmind.loadOllamaModels',
                    defaultOptions: []
                }
            ]
        },
        {
            id: 'mistral',
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadMistralModels',
                    loadCommand: 'gitmind.loadMistralModels',
                    options: modelOptions('mistral')
                }
            ]
        },
        {
            id: 'cohere',
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadCohereModels',
                    loadCommand: 'gitmind.loadCohereModels',
                    options: modelOptions('cohere')
                }
            ]
        },
        {
            id: 'together',
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadTogetherModels',
                    loadCommand: 'gitmind.loadTogetherModels',
                    options: modelOptions('together')
                }
            ]
        },
        {
            id: 'openrouter',
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadOpenRouterModels',
                    loadCommand: 'gitmind.loadOpenRouterModels',
                    defaultOptions: []
                }
            ]
        },
        {
            id: 'deepseek',
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
                    type: 'model-with-load',
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadDeepSeekModels',
                    loadCommand: 'gitmind.loadDeepSeekModels',
                    options: modelOptions('deepseek')
                }
            ]
        },
        {
            id: 'grok',
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadGrokModels',
                    loadCommand: 'gitmind.loadGrokModels',
                    options: modelOptions('grok')
                }
            ]
        },
        {
            id: 'groq',
            fields: [
                {
                    id: 'groqApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your Groq API key for accessing ultra-fast AI inference',
                    link: { url: 'https://console.groq.com/keys', text: 'Get a Groq API key' }
                },
                {
                    id: 'groqModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadGroqModels',
                    loadCommand: 'gitmind.loadGroqModels',
                    options: modelOptions('groq')
                }
            ]
        },
        {
            id: 'perplexity',
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
                    type: 'model-with-load',
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadPerplexityModels',
                    loadCommand: 'gitmind.loadPerplexityModels',
                    options: modelOptions('perplexity')
                }
            ]
        },
        {
            id: 'zai',
            fields: [
                {
                    id: 'zaiApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your Z.ai API key for accessing the API',
                    link: { url: 'https://z.ai/', text: 'Get a Z.ai API key' }
                },
                {
                    id: 'zaiEndpoint',
                    key: 'endpoint',
                    label: 'API Endpoint',
                    type: 'select',
                    tooltip: 'Choose between regular chat or code-optimized endpoint',
                    options: [
                        { value: 'regular', label: 'Regular (General Chat)' },
                        { value: 'coding', label: 'Code Plan (Code Optimized)' }
                    ]
                },
                {
                    id: 'zaiModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadZaiModels',
                    loadCommand: 'gitmind.loadZaiModels',
                    options: modelOptions('zai')
                }
            ]
        },
        {
            id: 'nvidia',
            fields: [
                {
                    id: 'nvidiaApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Your NVIDIA hosted NIM API key',
                    link: { url: 'https://build.nvidia.com/models', text: 'Get an NVIDIA API key' }
                },
                {
                    id: 'nvidiaModel',
                    key: 'model',
                    label: 'Model',
                    type: 'model-with-load',
                    tooltip: 'Hosted NVIDIA NIM chat-completion model',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadNvidiaModels',
                    loadCommand: 'gitmind.loadNvidiaModels',
                    defaultOptions: []
                },
                {
                    id: 'nvidiaInfo',
                    key: 'info',
                    label: '',
                    type: 'info',
                    tooltip: '',
                    content: '<a href="https://docs.api.nvidia.com/nim/reference/llm-apis">NVIDIA NIM LLM API reference</a>'
                }
            ]
        },
        {
            id: 'lmstudio',
            fields: [
                {
                    id: 'lmstudioUrl',
                    key: 'url',
                    label: 'Local Server URL',
                    type: 'text',
                    tooltip: 'LM Studio only accepts a loopback URL for this provider.',
                    placeholder: 'http://127.0.0.1:1234/v1',
                    defaultValue: 'http://127.0.0.1:1234/v1',
                    link: { url: 'https://lmstudio.ai/docs/app', text: 'Start LM Studio server' }
                },
                {
                    id: 'lmstudioModel',
                    key: 'model',
                    label: 'Loaded Model ID',
                    type: 'text',
                    tooltip: 'Enter the model ID exposed by LM Studio after loading a local model.',
                    placeholder: 'local-model'
                }
            ]
        },
        {
            id: 'azureopenai',
            fields: [
                {
                    id: 'azureopenaiEndpoint',
                    key: 'endpoint',
                    label: 'Resource Endpoint',
                    type: 'text',
                    tooltip: 'Azure OpenAI resource URL without an API path.',
                    placeholder: 'https://your-resource.openai.azure.com'
                },
                {
                    id: 'azureopenaiAuthMode',
                    key: 'authMode',
                    label: 'Authentication',
                    type: 'select',
                    tooltip: 'Use an API key or an existing Microsoft sign-in from VS Code.',
                    options: [
                        { value: 'apiKey', label: 'API key' },
                        { value: 'entra', label: 'Microsoft Entra token' }
                    ]
                },
                {
                    id: 'azureopenaiApiKey',
                    key: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    tooltip: 'Needed only when API-key authentication is selected.',
                    link: { url: 'https://learn.microsoft.com/en-us/rest/api/microsoft-foundry/azureopenai/chat', text: 'Azure OpenAI API reference' }
                },
                {
                    id: 'azureopenaiModel',
                    key: 'model',
                    label: 'Deployment Name',
                    type: 'text',
                    tooltip: 'Azure deployments are account-specific and are never bundled as a static list.',
                    placeholder: 'your-deployment-name'
                }
            ]
        },
        {
            id: 'bedrock',
            fields: [
                {
                    id: 'bedrockRegion',
                    key: 'region',
                    label: 'AWS Region',
                    type: 'text',
                    tooltip: 'The region where the selected model is enabled.',
                    defaultValue: 'us-east-1',
                    placeholder: 'us-east-1'
                },
                {
                    id: 'bedrockProfile',
                    key: 'profile',
                    label: 'AWS Profile (optional)',
                    type: 'text',
                    tooltip: 'Leave empty to use the normal AWS credential chain.',
                    placeholder: 'default'
                },
                {
                    id: 'bedrockModel',
                    key: 'model',
                    label: 'Model ID',
                    type: 'text',
                    tooltip: 'Model availability varies by AWS account and region.',
                    placeholder: 'provider.model-version',
                    link: { url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/apis.html', text: 'Bedrock API reference' }
                }
            ]
        },
        {
            id: 'vertexai',
            fields: [
                {
                    id: 'vertexaiProject',
                    key: 'project',
                    label: 'Google Cloud Project',
                    type: 'text',
                    tooltip: 'Authentication uses Application Default Credentials.',
                    placeholder: 'your-google-cloud-project'
                },
                {
                    id: 'vertexaiLocation',
                    key: 'location',
                    label: 'Location',
                    type: 'text',
                    tooltip: 'Vertex AI location for the selected model.',
                    defaultValue: 'us-central1',
                    placeholder: 'us-central1'
                },
                {
                    id: 'vertexaiModel',
                    key: 'model',
                    label: 'Model ID',
                    type: 'text',
                    tooltip: 'Enter a model available to the configured project and location.',
                    placeholder: 'gemini-model-id',
                    link: { url: 'https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstart', text: 'Vertex AI quickstart' }
                }
            ]
        },
        {
            id: 'cloudflare',
            fields: [
                {
                    id: 'cloudflareApiKey',
                    key: 'apiKey',
                    label: 'API Token',
                    type: 'password',
                    tooltip: 'Cloudflare API token with Workers AI permission.',
                    link: { url: 'https://developers.cloudflare.com/workers-ai/configuration/openai-compatibility/', text: 'Workers AI API reference' }
                },
                {
                    id: 'cloudflareAccountId',
                    key: 'accountId',
                    label: 'Account ID',
                    type: 'text',
                    tooltip: 'Cloudflare account identifier for Workers AI.',
                    placeholder: 'your-account-id'
                },
                {
                    id: 'cloudflareGatewayId',
                    key: 'gatewayId',
                    label: 'AI Gateway ID (optional)',
                    type: 'text',
                    tooltip: 'Leave blank to call Workers AI directly.',
                    placeholder: 'your-gateway-id'
                },
                {
                    id: 'cloudflareModel',
                    key: 'model',
                    label: 'Model ID',
                    type: 'text',
                    tooltip: 'Use a Workers AI model ID available to this account; no stale bundled model list is used.',
                    placeholder: '@cf/provider/model'
                }
            ]
        },
        {
            id: 'custom',
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
                    tooltip: '',
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
                        <details>
                            <summary>View guidelines for Custom API configuration</summary>
                            <div class="guidelines">
                                <p>Use these settings to connect to your private AI endpoint. Supported auth types: Bearer, API Key (custom header), Basic, or None.</p>
                                <ul>
                                    <li><strong>Base URL</strong>: e.g. <code>https://api.example.com</code></li>
                                    <li><strong>Endpoint Path</strong>: e.g. <code>/v1/chat/completions</code></li>
                                    <li><strong>Authentication</strong>:
                                        <ul>
                                            <li><strong>Bearer</strong>: Sends <code>Authorization: Bearer &lt;token&gt;</code></li>
                                            <li><strong>API Key</strong>: Sends <code>&lt;Header Key&gt;: &lt;token&gt;</code> (e.g., <code>X-API-Key</code>)</li>
                                            <li><strong>Basic</strong>: Sends <code>Authorization: Basic &lt;base64(token)&gt;</code></li>
                                        </ul>
                                    </li>
                                    <li><strong>Request Format</strong>: JSON template. Placeholders:
                                        <ul>
                                            <li><code>{{model}}</code> or <code>{{MODEL}}</code></li>
                                            <li><code>{{prompt}}</code> or <code>{{PROMPT}}</code></li>
                                            <li><code>{{messages}}</code> or <code>{{MESSAGES}}</code> (OpenAI-style array)</li>
                                        </ul>
                                    </li>
                                    <li><strong>Response Format</strong>:
                                        <p>Choose a known format (<code>openai</code>, <code>anthropic</code>) or provide a JSON path like <code>choices[0].message.content</code>.</p>
                                    </li>
                                </ul>
                                <p><strong>Examples</strong></p>
<pre><code>{
  "model": "{{model}}",
  "messages": {{MESSAGES}},
  "temperature": 0.2
}</code></pre>
<pre><code>choices[0].message.content</code></pre>
                                <p>Use "Test Connection" to see a summary including latency, detected format, and a suggested response path.</p>
                            </div>
                        </details>
                    </div>`
                }
            ]
        }
        // All providers now complete
    ];

    public static getAllProviders(): Provider[] {
        return this.providers.map(provider => this.withCatalogModels(provider));
    }

    public static getProvider(id: string): Provider | undefined {
        const provider = this.providers.find(candidate => candidate.id === id);
        return provider ? this.withCatalogModels(provider) : undefined;
    }

    private static withCatalogModels(provider: Omit<Provider, 'name'>): Provider {
        const curated = getCuratedModels(provider.id);
        return {
            ...provider,
            name: getProviderEntry(provider.id)?.name ?? provider.id,
            fields: provider.fields.map(field => field.key === 'model'
                ? {
                    ...field,
                    // The catalog is the only bootstrap authority. Account-specific
                    // discovery replaces this list; the old per-form options never
                    // reach Free users or override a saved selection.
                    options: curated.map(model => ({ value: model, label: model })),
                    defaultOptions: [],
                }
                : field)
        };
    }

    public static getProviderNames(): Array<{ value: string; label: string }> {
        return this.getAllProviders().map(provider => ({
            value: provider.id,
            label: provider.name
        }));
    }
}
