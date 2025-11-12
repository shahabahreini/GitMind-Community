export interface ProviderDefaults {
  [key: string]: {
    apiKey?: string;
    model: string;
    url?: string;
  };
}

export const PROVIDER_DEFAULTS: ProviderDefaults = {
  gemini: { model: "gemini-2.5-flash" },
  huggingface: { model: "" },
  ollama: { model: "", url: "" },
  mistral: { model: "mistral-large-latest" },
  cohere: { model: "command-r-plus" },
  openai: { model: "gpt-4o" },
  together: { model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  openrouter: { model: "google/gemma-3-27b-it:free" },
  anthropic: { model: "claude-3-5-sonnet-20241022" },
  copilot: { model: "gpt-4o" },
  deepseek: { model: "deepseek-chat" },
  grok: { model: "grok-3" },
  perplexity: { model: "llama-3.1-sonar-large-128k-online" },
  custom: { model: "" }
};

export const API_KEY_PROVIDERS = [
  'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
  'together', 'openrouter', 'anthropic', 'deepseek', 'grok', 'perplexity'
];

export const NO_API_KEY_PROVIDERS = ['ollama', 'copilot', 'custom'];

export const DEFAULT_MODELS = {
  mistral: ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large-latest'],
  cohere: [
    'command-a-03-2025',
    'command-r-08-2024',
    'command-r-plus-08-2024',
    'aya-expanse-8b',
    'aya-expanse-32b',
    'command-r',
    'command-r-plus',
    'command',
    'command-light'
  ],
  together: [
    'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    'meta-llama/Llama-3.1-70B-Instruct-Turbo',
    'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
    'Qwen/Qwen2.5-72B-Instruct-Turbo',
    'microsoft/WizardLM-2-8x22B',
    'mistralai/Mixtral-8x7B-Instruct-v0.1',
    'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO'
  ],
  openrouter: [
    'google/gemma-3-27b-it:free',
    'openai/gpt-4o-mini',
    'openai/gpt-4-turbo',
    'anthropic/claude-3-haiku',
    'meta-llama/llama-3.1-8b-instruct:free',
    'meta-llama/llama-3.1-70b-instruct',
    'mistralai/mistral-7b-instruct:free',
    'qwen/qwen-2-7b-instruct:free'
  ],
  huggingface: [
    'mistralai/Mistral-7B-Instruct-v0.3',
    'microsoft/DialoGPT-medium',
    'facebook/bart-large-cnn',
    'HuggingFaceH4/zephyr-7b-beta'
  ],
  grok: [
    'grok-3',
    'grok-2',
    'grok-1.5v',
    'grok-1.5'
  ],
  gemini: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-preview',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash-lite-preview',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
  ],
  anthropic: [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-2.1',
    'claude-2.0',
    'claude-instant-1.2'
  ]
};