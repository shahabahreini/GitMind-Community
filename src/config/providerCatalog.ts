export interface ProviderCatalogEntry {
  displayName: string;
  defaultModel: string;
  liveDiscovery: boolean;
  curatedModels?: readonly string[];
}

/**
 * Provider defaults and lifecycle-safe curated choices.
 * Live discovery is authoritative for account availability; curated lists are
 * only a bootstrap when a provider cannot be queried yet.
 */
export const PROVIDER_CATALOG = {
  gemini: { displayName: "Google Gemini", defaultModel: "gemini-3.5-flash", liveDiscovery: true, curatedModels: ["gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite", "gemini-2.5-pro", "gemini-2.5-flash"] },
  huggingface: { displayName: "Hugging Face", defaultModel: "", liveDiscovery: false },
  ollama: { displayName: "Ollama", defaultModel: "phi4", liveDiscovery: true },
  mistral: { displayName: "Mistral AI", defaultModel: "mistral-small-4", liveDiscovery: true },
  cohere: { displayName: "Cohere", defaultModel: "command-a-plus-05-2026", liveDiscovery: true, curatedModels: ["command-a-plus-05-2026", "north-mini-code-1-0", "command-a-reasoning-08-2025"] },
  openai: { displayName: "OpenAI", defaultModel: "gpt-5.6-terra", liveDiscovery: true, curatedModels: ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna", "gpt-5.5", "gpt-5.4-mini"] },
  together: { displayName: "Together AI", defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo", liveDiscovery: true },
  openrouter: { displayName: "OpenRouter", defaultModel: "google/gemma-3-27b-it:free", liveDiscovery: true },
  anthropic: { displayName: "Anthropic", defaultModel: "claude-sonnet-5", liveDiscovery: true, curatedModels: ["claude-sonnet-5", "claude-opus-4-8", "claude-fable-5", "claude-haiku-4-5"] },
  minimax: { displayName: "MiniMax", defaultModel: "MiniMax-M2.7", liveDiscovery: true, curatedModels: ["MiniMax-M2.7", "MiniMax-M2.5"] },
  copilot: { displayName: "GitHub Copilot", defaultModel: "auto", liveDiscovery: false, curatedModels: ["auto", "gpt-5.5", "gpt-5.4-mini", "gpt-5.3-codex", "claude-sonnet-4.6", "claude-haiku-4.5", "gemini-3.5-flash", "raptor-mini"] },
  deepseek: { displayName: "DeepSeek", defaultModel: "deepseek-v4-flash", liveDiscovery: true, curatedModels: ["deepseek-v4-flash", "deepseek-v4-pro"] },
  grok: { displayName: "xAI Grok", defaultModel: "grok-4.4", liveDiscovery: true, curatedModels: ["grok-4.4"] },
  groq: { displayName: "Groq", defaultModel: "meta-llama/llama-4-scout-17b-16e-instruct", liveDiscovery: true },
  perplexity: { displayName: "Perplexity", defaultModel: "sonar-pro", liveDiscovery: false, curatedModels: ["sonar-pro", "sonar-reasoning-pro", "sonar"] },
  zai: { displayName: "Z.ai", defaultModel: "glm-5.1", liveDiscovery: false },
  nvidia: { displayName: "NVIDIA hosted NIM", defaultModel: "meta/llama-3.3-70b-instruct", liveDiscovery: true },
  lmstudio: { displayName: "LM Studio", defaultModel: "", liveDiscovery: true },
  azureopenai: { displayName: "Azure OpenAI", defaultModel: "", liveDiscovery: false },
  bedrock: { displayName: "Amazon Bedrock", defaultModel: "", liveDiscovery: false },
  vertexai: { displayName: "Vertex AI", defaultModel: "", liveDiscovery: false },
  cloudflare: { displayName: "Cloudflare Workers AI", defaultModel: "", liveDiscovery: true },
  custom: { displayName: "Custom API", defaultModel: "", liveDiscovery: false },
} satisfies Record<string, ProviderCatalogEntry>;

export type ProviderCatalogId = keyof typeof PROVIDER_CATALOG;

export function getProviderDefaultModel(provider: string, fallback = ""): string {
  const entry: ProviderCatalogEntry | undefined = PROVIDER_CATALOG[provider as ProviderCatalogId];
  return entry?.defaultModel ?? fallback;
}

export function getCuratedModels(provider: string): readonly string[] {
  const entry: ProviderCatalogEntry | undefined = PROVIDER_CATALOG[provider as ProviderCatalogId];
  return entry?.curatedModels ?? [];
}
