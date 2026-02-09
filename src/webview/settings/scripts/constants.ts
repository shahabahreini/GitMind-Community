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
  openai: { model: "gpt-4o-mini" },
  together: { model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  openrouter: { model: "google/gemma-3-27b-it:free" },
  anthropic: { model: "claude-sonnet-4" },
  minimax: { model: "MiniMax-M2" },
  copilot: { model: "auto" },
  deepseek: { model: "deepseek-chat" },
  grok: { model: "grok-3" },
  perplexity: { model: "llama-3.1-sonar-large-128k-online" },
  zai: { model: "glm-4.5-flash" },
  custom: { model: "" }
};

export const API_KEY_PROVIDERS = [
  'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
  'together', 'openrouter', 'anthropic', 'minimax', 'deepseek', 'grok', 'perplexity', 'zai'
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
  openai: [
    'gpt-5.1',
    'gpt-5.1-chat-latest',
    'gpt-5.1-codex',
    'gpt-5',
    'gpt-5-chat-latest',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-5-pro',
    'gpt-5-codex',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'o4-mini',
    'o3',
    'o3-mini',
    'o1',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo'
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
    'gemini-2.5-flash-lite-preview'
  ],
  anthropic: [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-2.1',
    'claude-2.0',
    'claude-instant-1.2'
  ],
  minimax: [
    'MiniMax-M2',
    'MiniMax-M2-Stable'
  ],
  copilot: [
    'auto',
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-4-turbo',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4.1',
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-codex',
    'gpt-5.1',
    'gpt-5.1-codex',
    'gpt-5.1-codex-mini',
    'claude-haiku-4.5',
    'claude-opus-4.1',
    'claude-sonnet-4',
    'claude-sonnet-4.5',
    'gemini-2.5-pro',
    'gemini-3-pro',
    'grok-code-fast-1',
    'raptor-mini'
  ],
  deepseek: [
    'deepseek-chat',
    'deepseek-reasoner'
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