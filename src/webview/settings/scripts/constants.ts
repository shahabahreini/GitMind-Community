export interface ProviderDefaults {
  [key: string]: {
    apiKey?: string;
    model: string;
    url?: string;
  };
}

export const PROVIDER_DEFAULTS: ProviderDefaults = {
  gemini: { model: "gemini-3-flash" },
  huggingface: { model: "" },
  ollama: { model: "", url: "" },
  mistral: { model: "mistral-small-4" },
  cohere: { model: "command-a-03-2025" },
  openai: { model: "gpt-5.5" },
  together: { model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  openrouter: { model: "google/gemma-3-27b-it:free" },
  anthropic: { model: "claude-sonnet-4.6" },
  minimax: { model: "MiniMax-M2.7" },
  copilot: { model: "auto" },
  deepseek: { model: "deepseek-v4-flash" },
  grok: { model: "grok-4.3" },
  groq: { model: "meta-llama/llama-4-scout-17b-16e-instruct" },
  perplexity: { model: "sonar-pro" },
  zai: { model: "glm-5.1" },
  custom: { model: "" }
};

export const API_KEY_PROVIDERS = [
  'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
  'together', 'openrouter', 'anthropic', 'minimax', 'deepseek', 'grok', 'groq', 'perplexity', 'zai'
];

export const NO_API_KEY_PROVIDERS = ['ollama', 'copilot', 'custom'];

export const DEFAULT_MODELS = {
  mistral: [
    'mistral-large-3',
    'mistral-medium-3.5',
    'mistral-small-4',
    'mistral-medium-3.1',
    'ministral-3-14b',
    'ministral-3-8b',
    'ministral-3-3b',
    'magistral-medium-1.2',
    'leanstral',
    'codestral',
    'devstral-2',
    'mistral-moderation-2',
    'mistral-medium-3',
    'mistral-nemo-12b'
  ],
  cohere: [
    'command-a-03-2025',
    'command-a-reasoning-08-2025',
    'command-a-translate-08-2025',
    'command-a-vision-07-2025',
    'command-r7b-12-2024',
    'command-r-plus-08-2024',
    'command-r-08-2024',
    'c4ai-aya-expanse-32b',
    'c4ai-aya-vision-32b',
    'c4ai-aya-expanse-8b'
  ],
  openai: [
    'gpt-5.5',
    'gpt-5.5-pro',
    'gpt-5.4',
    'gpt-5.4-pro',
    'gpt-5.4-mini',
    'gpt-5.4-nano',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-5',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-5.3-codex',
    'gpt-oss-120b',
    'gpt-oss-20b',
    'gpt-5.2',
    'gpt-5.1',
    'gpt-5.2-pro',
    'gpt-5-pro',
    'o3-pro',
    'o3',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4',
    'gpt-5.3-chat-latest',
    'gpt-5.2-chat-latest',
    'chat-latest'
  ],
  together: [
    'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    'meta-llama/Llama-3.1-70B-Instruct-Turbo',
    'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
    'Qwen/Qwen2.5-72B-Instruct-Turbo'
  ],
  openrouter: [
    'google/gemma-3-27b-it:free',
    'openai/gpt-5.5-instant',
    'openai/o3-mini',
    'anthropic/claude-sonnet-4.6',
    'meta-llama/llama-3.3-70b-instruct'
  ],
  huggingface: [
    'mistralai/Mistral-7B-Instruct-v0.3',
    'microsoft/DialoGPT-medium',
    'facebook/bart-large-cnn',
    'HuggingFaceH4/zephyr-7b-beta'
  ],
  grok: [
    'grok-4.3',
    'grok-4.20-0309-reasoning',
    'grok-4.20-0309-non-reasoning',
    'grok-4.20-multi-agent-0309'
  ],
  gemini: [
    'gemini-3.1-pro',
    'gemini-3-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ],
  anthropic: [
    'claude-opus-4.7',
    'claude-sonnet-4.6',
    'claude-haiku-4.5'
  ],
  minimax: [
    'MiniMax-M2.7',
    'MiniMax-M2.7-highspeed',
    'MiniMax-M2.5',
    'MiniMax-M2.5-highspeed',
    'MiniMax-M2.1',
    'MiniMax-M2.1-highspeed',
    'MiniMax-M2'
  ],
  copilot: [
    'auto',
    'gpt-5.5',
    'gpt-5.4',
    'o3-pro',
    'claude-opus-4.7',
    'claude-sonnet-4.6',
    'gemini-3.1-pro',
    'gemini-3-flash'
  ],
  deepseek: [
    'deepseek-v4-pro',
    'deepseek-v4-flash'
  ],
  zai: [
    'glm-5.1',
    'glm-5',
    'glm-5-turbo',
    'glm-4.7',
    'glm-4.7-flashx',
    'glm-4.6',
    'glm-4.5',
    'glm-4.5-x',
    'glm-4.5-air',
    'glm-4.5-airx',
    'glm-4-32b-0414-128k',
    'glm-4.7-flash',
    'glm-4.5-flash'
  ],
  groq: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'meta-llama/llama-4-scout-17b-16e-instruct'
  ],
  perplexity: [
    'sonar-pro',
    'sonar-reasoning-pro',
    'sonar',
    'sonar-reasoning',
    'r1-1776'
  ]
};