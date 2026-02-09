export interface ProviderDefaults {
  [key: string]: {
    apiKey?: string;
    model: string;
    url?: string;
  };
}

export const PROVIDER_DEFAULTS: ProviderDefaults = {
  gemini: { model: "gemini-2.5-flash-preview-04-17" },
  huggingface: { model: "" },
  ollama: { model: "", url: "" },
  mistral: { model: "mistral-large-latest" },
  cohere: { model: "command-a-03-2025" },
  openai: { model: "gpt-3.5-turbo" },
  together: { model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  openrouter: { model: "google/gemma-3-27b-it:free" },
  anthropic: { model: "claude-sonnet-4" },
  copilot: { model: "gpt-4o" },
  deepseek: { model: "deepseek-chat" },
  grok: { model: "grok-3" },
  perplexity: { model: "sonar-pro" },
  zai: { model: "glm-4.5-flash" },
  custom: { model: "" }
};

export const API_KEY_PROVIDERS = [
  'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
  'together', 'openrouter', 'anthropic', 'deepseek', 'grok', 'perplexity', 'zai'
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
  zai: [
    'glm-4.7',
    'glm-4.6',
    'glm-4.6v',
    'glm-4.6v-flash',
    'glm-4.6v-flashx',
    'glm-4.5',
    'glm-4.5v',
    'glm-4.5-x',
    'glm-4.5-flash',
    'glm-4.5-air',
    'glm-4.5-airx',
    'glm-4-32b-0414-128k'
  ]
};