import { getCuratedModels, getProviderDefaultModel } from '../../../config/providerCatalog';

export interface ProviderDefaults {
  [key: string]: {
    apiKey?: string;
    model: string;
    url?: string;
  };
}

export const PROVIDER_DEFAULTS: ProviderDefaults = {
  gemini: { model: getProviderDefaultModel("gemini") },
  huggingface: { model: "" },
  ollama: { model: "", url: "" },
  mistral: { model: "mistral-small-4" },
  cohere: { model: getProviderDefaultModel("cohere") },
  openai: { model: getProviderDefaultModel("openai") },
  together: { model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  openrouter: { model: "google/gemma-3-27b-it:free" },
  anthropic: { model: getProviderDefaultModel("anthropic") },
  minimax: { model: getProviderDefaultModel("minimax") },
  copilot: { model: getProviderDefaultModel("copilot") },
  deepseek: { model: getProviderDefaultModel("deepseek") },
  grok: { model: getProviderDefaultModel("grok") },
  groq: { model: "meta-llama/llama-4-scout-17b-16e-instruct" },
  perplexity: { model: getProviderDefaultModel("perplexity") },
  zai: { model: "glm-5.1" },
  nvidia: { model: "meta/llama-3.3-70b-instruct" },
  custom: { model: "" }
};

export const API_KEY_PROVIDERS = [
  'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
  'together', 'openrouter', 'anthropic', 'minimax', 'deepseek', 'grok', 'groq', 'perplexity', 'zai', 'nvidia'
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
  cohere: [...getCuratedModels("cohere")],
  openai: [...getCuratedModels("openai")],
  together: [
    'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    'meta-llama/Llama-3.1-70B-Instruct-Turbo',
    'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
    'Qwen/Qwen2.5-72B-Instruct-Turbo'
  ],
  openrouter: [
    'google/gemma-3-27b-it:free',
    'openai/gpt-5.6-terra',
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
    ...getCuratedModels("grok")
  ],
  gemini: [...getCuratedModels("gemini")],
  anthropic: [...getCuratedModels("anthropic")],
  minimax: [...getCuratedModels("minimax")],
  copilot: [...getCuratedModels("copilot")],
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
  perplexity: [...getCuratedModels("perplexity")],
  nvidia: [
    'meta/llama-3.3-70b-instruct',
    'nvidia/nemotron-3-super-120b-a12b',
    'mistralai/mistral-large-3-675b-instruct-2512',
    'qwen/qwen3-coder-480b-a35b-instruct'
  ]
};
