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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadGeminiModels',
                    loadCommand: 'gitmind.loadGeminiModels',
                    options: [
                        { value: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro' },
                        { value: 'gemini-3-flash', label: 'Gemini 3 Flash' },
                        { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' },
                        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
                        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
                        { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' }
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
                    type: 'model-with-load',
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadOpenAIModels',
                    loadCommand: 'gitmind.loadOpenAIModels',
                    options: [
                        { value: 'gpt-5.5', label: 'GPT-5.5' },
                        { value: 'gpt-5.5-pro', label: 'GPT-5.5 Pro' },
                        { value: 'gpt-5.4', label: 'GPT-5.4' },
                        { value: 'gpt-5.4-pro', label: 'GPT-5.4 Pro' },
                        { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini' },
                        { value: 'gpt-5.4-nano', label: 'GPT-5.4 Nano' },
                        { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
                        { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
                        { value: 'gpt-5', label: 'GPT-5' },
                        { value: 'gpt-4.1', label: 'GPT-4.1' },
                        { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
                        { value: 'gpt-5.3-codex', label: 'GPT-5.3 Codex' },
                        { value: 'gpt-oss-120b', label: 'GPT-OSS 120B' },
                        { value: 'gpt-oss-20b', label: 'GPT-OSS 20B' },
                        { value: 'gpt-5.2', label: 'GPT-5.2' },
                        { value: 'gpt-5.1', label: 'GPT-5.1' },
                        { value: 'gpt-5.2-pro', label: 'GPT-5.2 Pro' },
                        { value: 'gpt-5-pro', label: 'GPT-5 Pro' },
                        { value: 'o3-pro', label: 'o3 Pro' },
                        { value: 'o3', label: 'o3' },
                        { value: 'gpt-4o', label: 'GPT-4o' },
                        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                        { value: 'gpt-4', label: 'GPT-4' },
                        { value: 'gpt-5.3-chat-latest', label: 'GPT-5.3 Chat Latest' },
                        { value: 'gpt-5.2-chat-latest', label: 'GPT-5.2 Chat Latest' },
                        { value: 'chat-latest', label: 'Chat Latest' }
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadAnthropicModels',
                    loadCommand: 'gitmind.loadAnthropicModels',
                    options: [
                        { value: 'claude-opus-4.7', label: 'Claude Opus 4.7' },
                        { value: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
                        { value: 'claude-haiku-4.5', label: 'Claude Haiku 4.5' }
                    ]
                }
            ]
        },
        {
            id: 'minimax',
            name: 'MiniMax',
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
                    options: [
                        { value: 'MiniMax-M2.7', label: 'MiniMax M2.7' },
                        { value: 'MiniMax-M2.7-highspeed', label: 'MiniMax M2.7 Highspeed' },
                        { value: 'MiniMax-M2.5', label: 'MiniMax M2.5' },
                        { value: 'MiniMax-M2.5-highspeed', label: 'MiniMax M2.5 Highspeed' },
                        { value: 'MiniMax-M2.1', label: 'MiniMax M2.1' },
                        { value: 'MiniMax-M2.1-highspeed', label: 'MiniMax M2.1 Highspeed' },
                        { value: 'MiniMax-M2', label: 'MiniMax M2' }
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
                    type: 'model-with-load',
                    tooltip: '',
                    loadButtonText: 'Detect Available Models',
                    loadButtonId: 'loadCopilotModels',
                    loadCommand: 'gitmind.loadCopilotModels',
                    options: [
                        { value: 'auto', label: 'Auto (Let Copilot choose)' },
                        { value: 'gpt-5.5', label: 'GPT-5.5' },
                        { value: 'gpt-5.4', label: 'GPT-5.4' },
                        { value: 'o3-pro', label: 'o3 Pro' },
                        { value: 'claude-opus-4.7', label: 'Claude Opus 4.7' },
                        { value: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
                        { value: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro' },
                        { value: 'gemini-3.1-flash', label: 'Gemini 3.1 Flash' }
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
                    tooltip: '',
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
                    tooltip: '',
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadMistralModels',
                    loadCommand: 'gitmind.loadMistralModels',
                    options: [
                        { value: 'mistral-large-3', label: 'Mistral Large 3' },
                        { value: 'mistral-medium-3.5', label: 'Mistral Medium 3.5' },
                        { value: 'mistral-small-4', label: 'Mistral Small 4' },
                        { value: 'mistral-medium-3.1', label: 'Mistral Medium 3.1' },
                        { value: 'ministral-3-14b', label: 'Ministral 3 14B' },
                        { value: 'ministral-3-8b', label: 'Ministral 3 8B' },
                        { value: 'ministral-3-3b', label: 'Ministral 3 3B' },
                        { value: 'magistral-medium-1.2', label: 'Magistral Medium 1.2' },
                        { value: 'leanstral', label: 'Leanstral' },
                        { value: 'codestral', label: 'Codestral' },
                        { value: 'devstral-2', label: 'Devstral 2' },
                        { value: 'mistral-moderation-2', label: 'Mistral Moderation 2' },
                        { value: 'mistral-medium-3', label: 'Mistral Medium 3' },
                        { value: 'mistral-nemo-12b', label: 'Mistral Nemo 12B' }
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadCohereModels',
                    loadCommand: 'gitmind.loadCohereModels',
                    options: [
                        { value: 'command-a-03-2025', label: 'Command A (03-2025)' },
                        { value: 'command-a-reasoning-08-2025', label: 'Command A Reasoning (08-2025)' },
                        { value: 'command-a-translate-08-2025', label: 'Command A Translate (08-2025)' },
                        { value: 'command-a-vision-07-2025', label: 'Command A Vision (07-2025)' },
                        { value: 'command-r7b-12-2024', label: 'Command R7B (12-2024)' },
                        { value: 'command-r-plus-08-2024', label: 'Command R+ (08-2024)' },
                        { value: 'command-r-08-2024', label: 'Command R (08-2024)' },
                        { value: 'c4ai-aya-expanse-32b', label: 'Aya Expanse 32B' },
                        { value: 'c4ai-aya-vision-32b', label: 'Aya Vision 32B' },
                        { value: 'c4ai-aya-expanse-8b', label: 'Aya Expanse 8B' }
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadTogetherModels',
                    loadCommand: 'gitmind.loadTogetherModels',
                    options: [
                        { value: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Instruct Turbo' },
                        { value: 'meta-llama/Llama-3.1-8B-Instruct-Turbo', label: 'Llama 3.1 8B Instruct Turbo' },
                        { value: 'meta-llama/Llama-3.1-70B-Instruct-Turbo', label: 'Llama 3.1 70B Instruct Turbo' },
                        { value: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free', label: 'DeepSeek R1 Distill 70B' },
                        { value: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen 2.5 72B Instruct Turbo' }
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadOpenRouterModels',
                    loadCommand: 'gitmind.loadOpenRouterModels',
                    defaultOptions: [
                        'google/gemma-3-27b-it:free',
                        'openai/gpt-5.5-instant',
                        'openai/o3-mini',
                        'anthropic/claude-sonnet-4.6',
                        'meta-llama/llama-3.3-70b-instruct'
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
                    type: 'model-with-load',
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadDeepSeekModels',
                    loadCommand: 'gitmind.loadDeepSeekModels',
                    options: [
                        { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
                        { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' }
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
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadGrokModels',
                    loadCommand: 'gitmind.loadGrokModels',
                    options: [
                        { value: 'grok-4.3', label: 'Grok 4.3' },
                        { value: 'grok-4.20-0309-reasoning', label: 'Grok 4.20 Reasoning (0309)' },
                        { value: 'grok-4.20-0309-non-reasoning', label: 'Grok 4.20 Non-Reasoning (0309)' },
                        { value: 'grok-4.20-multi-agent-0309', label: 'Grok 4.20 Multi-Agent (0309)' }
                    ]
                }
            ]
        },
        {
            id: 'groq',
            name: 'Groq',
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
                    options: [
                        { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
                        { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
                        { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B 16E' }
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
                    type: 'model-with-load',
                    tooltip: '',
                    loadButtonText: 'Load Available Models',
                    loadButtonId: 'loadPerplexityModels',
                    loadCommand: 'gitmind.loadPerplexityModels',
                    options: [
                        { value: 'sonar-pro', label: 'Sonar Pro' },
                        { value: 'sonar-reasoning-pro', label: 'Sonar Reasoning Pro' },
                        { value: 'sonar', label: 'Sonar' },
                        { value: 'sonar-reasoning', label: 'Sonar Reasoning' },
                        { value: 'r1-1776', label: 'R1-1776' }
                    ]
                }
            ]
        },
        {
            id: 'zai',
            name: 'Z.ai (GLM)',
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
                    options: [
                        { value: 'glm-5.1', label: 'GLM 5.1' },
                        { value: 'glm-5', label: 'GLM 5' },
                        { value: 'glm-5-turbo', label: 'GLM 5 Turbo' },
                        { value: 'glm-4.7', label: 'GLM 4.7' },
                        { value: 'glm-4.7-flashx', label: 'GLM 4.7 FlashX' },
                        { value: 'glm-4.6', label: 'GLM 4.6' },
                        { value: 'glm-4.5', label: 'GLM 4.5' },
                        { value: 'glm-4.5-x', label: 'GLM 4.5 X' },
                        { value: 'glm-4.5-air', label: 'GLM 4.5 Air' },
                        { value: 'glm-4.5-airx', label: 'GLM 4.5 AirX' },
                        { value: 'glm-4-32b-0414-128k', label: 'GLM 4 32B (0414-128K)' },
                        { value: 'glm-4.7-flash', label: 'GLM 4.7 Flash' },
                        { value: 'glm-4.5-flash', label: 'GLM 4.5 Flash' }
                    ]
                }
            ]
        },
        {
            id: 'nvidia',
            name: 'NVIDIA',
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
                    defaultOptions: [
                        'meta/llama-3.3-70b-instruct',
                        'nvidia/nemotron-3-super-120b-a12b',
                        'mistralai/mistral-large-3-675b-instruct-2512',
                        'qwen/qwen3-coder-480b-a35b-instruct'
                    ]
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
            id: 'custom',
            name: 'Custom API',
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
