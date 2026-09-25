/**
 * How a provider authenticates. Only `apiKey` providers may show API-key guidance.
 * - apiKey: a user-supplied key or token stored by GitMind
 * - ide-session: the IDE's signed-in session (GitHub Copilot through the VS Code language model API)
 * - local: a local server that needs no credential by default
 * - cloud-credentials: an ambient cloud credential chain (AWS profile, Google ADC)
 * - custom: user-configured authentication for the Custom API
 */
export type ProviderAuthKind = "apiKey" | "ide-session" | "local" | "cloud-credentials" | "custom";

export interface ProviderAuth {
  kind: ProviderAuthKind;
  /** Human-readable credential name used in guidance, e.g. "API key". */
  credentialLabel: string;
  /** The key may be absent because another auth mode is configured (Azure OpenAI with Microsoft Entra). */
  optional?: boolean;
}

export interface ProviderCatalogEntry {
  /** Short runtime label used in messages and diagnostics. */
  name: string;
  displayName: string;
  auth: ProviderAuth;
  /** Where users get credentials or setup instructions. */
  docsUrl: string;
  /** Primary `gitmind.*` setting that holds this provider's credential or connection value; empty when none. */
  settingPath: string;
  defaultModel: string;
  liveDiscovery: boolean;
  curatedModels?: readonly string[];
}

const API_KEY: ProviderAuth = { kind: "apiKey", credentialLabel: "API key" };

/**
 * Provider defaults and lifecycle-safe curated choices.
 * Live discovery is authoritative for account availability; curated lists are
 * only a bootstrap when a provider cannot be queried yet.
 */
export const PROVIDER_CATALOG = {
  gemini: { name: "Gemini", auth: API_KEY, docsUrl: "https://aistudio.google.com/app/apikey", settingPath: "gemini.apiKey", displayName: "Google Gemini", defaultModel: "gemini-3.8-flash", liveDiscovery: true, curatedModels: ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"] },
  huggingface: { name: "Hugging Face", auth: { kind: "apiKey", credentialLabel: "access token" }, docsUrl: "https://huggingface.co/settings/tokens", settingPath: "huggingface.apiKey", displayName: "Hugging Face", defaultModel: "meta-llama/Llama-3.3-70B-Instruct", liveDiscovery: true, curatedModels: ["meta-llama/Llama-3.3-70B-Instruct", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "deepseek-ai/DeepSeek-V4.1-Flash", "Qwen/Qwen3.8-27B", "zai-org/GLM-5.3-Flash"] },
  ollama: { name: "Ollama", auth: { kind: "local", credentialLabel: "local server URL" }, docsUrl: "https://ollama.com/download", settingPath: "ollama.url", displayName: "Ollama", defaultModel: "phi4", liveDiscovery: true },
  mistral: { name: "Mistral", auth: API_KEY, docsUrl: "https://console.mistral.ai/api-keys/", settingPath: "mistral.apiKey", displayName: "Mistral AI", defaultModel: "mistral-small-2603", liveDiscovery: true, curatedModels: ["mistral-small-2603", "mistral-large-2512", "ministral-3-14b-2512", "ministral-3-8b-2512", "ministral-3-3b-2512", "codestral-2508"] },
  cohere: { name: "Cohere", auth: API_KEY, docsUrl: "https://dashboard.cohere.com/api-keys", settingPath: "cohere.apiKey", displayName: "Cohere", defaultModel: "command-a-plus-05-2026", liveDiscovery: true, curatedModels: ["command-a-plus-05-2026", "north-mini-code-1-0", "command-a-reasoning-08-2025"] },
  openai: { name: "OpenAI", auth: API_KEY, docsUrl: "https://platform.openai.com/api-keys", settingPath: "openai.apiKey", displayName: "OpenAI", defaultModel: "gpt-6-sol", liveDiscovery: true, curatedModels: ["gpt-6-sol", "gpt-6-luna", "gpt-6-astra", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"] },
  together: { name: "Together AI", auth: API_KEY, docsUrl: "https://api.together.xyz/settings/api-keys", settingPath: "together.apiKey", displayName: "Together AI", defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo", liveDiscovery: true, curatedModels: ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "openai/gpt-oss-120b", "deepseek-ai/DeepSeek-V4.1-Flash", "Qwen/Qwen3.8-Flash", "zai-org/GLM-5.3-Flash"] },
  openrouter: { name: "OpenRouter", auth: API_KEY, docsUrl: "https://openrouter.ai/keys", settingPath: "openrouter.apiKey", displayName: "OpenRouter", defaultModel: "openrouter/free", liveDiscovery: true, curatedModels: ["openrouter/free", "openrouter/auto", "google/gemini-3.8-flash", "anthropic/claude-sonnet-5", "openai/gpt-6-sol", "meta-llama/llama-3.3-70b-instruct"] },
  anthropic: { name: "Anthropic", auth: API_KEY, docsUrl: "https://console.anthropic.com/", settingPath: "anthropic.apiKey", displayName: "Anthropic", defaultModel: "claude-sonnet-5", liveDiscovery: true, curatedModels: ["claude-sonnet-5", "claude-opus-5-5", "claude-fable-5-1", "claude-haiku-4-5"] },
  minimax: { name: "MiniMax", auth: API_KEY, docsUrl: "https://platform.minimax.io/docs/api-reference/text-anthropic-api", settingPath: "minimax.apiKey", displayName: "MiniMax", defaultModel: "MiniMax-M3", liveDiscovery: true, curatedModels: ["MiniMax-M3", "MiniMax-M2.7", "MiniMax-M2.7-highspeed"] },
  copilot: { name: "GitHub Copilot", auth: { kind: "ide-session", credentialLabel: "GitHub Copilot sign-in" }, docsUrl: "https://github.com/features/copilot", settingPath: "", displayName: "GitHub Copilot", defaultModel: "auto", liveDiscovery: true, curatedModels: ["auto"] },
  deepseek: { name: "DeepSeek", auth: API_KEY, docsUrl: "https://platform.deepseek.com/api_keys", settingPath: "deepseek.apiKey", displayName: "DeepSeek", defaultModel: "deepseek-flash", liveDiscovery: true, curatedModels: ["deepseek-flash", "deepseek-v4-pro"] },
  grok: { name: "Grok", auth: API_KEY, docsUrl: "https://console.x.ai/", settingPath: "grok.apiKey", displayName: "xAI Grok", defaultModel: "grok-4.7", liveDiscovery: true, curatedModels: ["grok-4.7", "grok-4.6", "grok-4.5", "grok-4.3"] },
  groq: { name: "Groq", auth: API_KEY, docsUrl: "https://console.groq.com/keys", settingPath: "groq.apiKey", displayName: "Groq", defaultModel: "openai/gpt-oss-120b", liveDiscovery: true, curatedModels: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"] },
  perplexity: { name: "Perplexity", auth: API_KEY, docsUrl: "https://www.perplexity.ai/settings/api", settingPath: "perplexity.apiKey", displayName: "Perplexity", defaultModel: "sonar-pro", liveDiscovery: false, curatedModels: ["sonar-pro", "sonar-reasoning-pro", "sonar"] },
  zai: { name: "Z.ai", auth: API_KEY, docsUrl: "https://api.z.ai/", settingPath: "zai.apiKey", displayName: "Z.ai", defaultModel: "glm-5.3", liveDiscovery: false, curatedModels: ["glm-5.3", "glm-5.3-flash", "glm-5.3-flashx", "glm-5.2", "glm-5.1", "glm-5", "glm-4.7", "glm-4.7-flashx", "glm-4.7-flash", "glm-4.6", "glm-4.5", "glm-4.5-air", "glm-4.5-flash"] },
  nvidia: { name: "NVIDIA", auth: API_KEY, docsUrl: "https://build.nvidia.com/models", settingPath: "nvidia.apiKey", displayName: "NVIDIA hosted NIM", defaultModel: "nvidia/nemotron-3-super-120b-a12b", liveDiscovery: true, curatedModels: ["nvidia/nemotron-3-super-120b-a12b", "openai/gpt-oss-20b", "deepseek-ai/deepseek-v4.1-flash", "z-ai/glm-5.3-flash", "moonshotai/kimi-k3"] },
  lmstudio: { name: "LM Studio", auth: { kind: "local", credentialLabel: "local server URL" }, docsUrl: "https://lmstudio.ai/docs/app", settingPath: "lmstudio.url", displayName: "LM Studio", defaultModel: "", liveDiscovery: true },
  azureopenai: { name: "Azure OpenAI", auth: { kind: "apiKey", credentialLabel: "API key or Microsoft Entra token", optional: true }, docsUrl: "https://learn.microsoft.com/en-us/rest/api/microsoft-foundry/azureopenai/chat", settingPath: "azureopenai.apiKey", displayName: "Azure OpenAI", defaultModel: "", liveDiscovery: false },
  bedrock: { name: "Amazon Bedrock", auth: { kind: "cloud-credentials", credentialLabel: "AWS credentials (profile and region)" }, docsUrl: "https://docs.aws.amazon.com/bedrock/latest/userguide/apis.html", settingPath: "bedrock.region", displayName: "Amazon Bedrock", defaultModel: "", liveDiscovery: false },
  vertexai: { name: "Vertex AI", auth: { kind: "cloud-credentials", credentialLabel: "Google Application Default Credentials" }, docsUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstart", settingPath: "vertexai.project", displayName: "Vertex AI", defaultModel: "", liveDiscovery: false },
  cloudflare: { name: "Cloudflare Workers AI", auth: { kind: "apiKey", credentialLabel: "API token" }, docsUrl: "https://developers.cloudflare.com/workers-ai/configuration/openai-compatibility/", settingPath: "cloudflare.apiKey", displayName: "Cloudflare Workers AI", defaultModel: "", liveDiscovery: true },
  custom: { name: "Custom API", auth: { kind: "custom", credentialLabel: "authentication settings" }, docsUrl: "", settingPath: "custom.authToken", displayName: "Custom API", defaultModel: "", liveDiscovery: false },
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

/** Resolves a provider id, runtime name, or display name (case-insensitive) to its catalog id. */
export function resolveProviderId(provider: string | undefined): ProviderCatalogId | undefined {
  if (!provider) {
    return undefined;
  }
  const needle = provider.trim().toLowerCase();
  for (const [id, entry] of Object.entries(PROVIDER_CATALOG) as [ProviderCatalogId, ProviderCatalogEntry][]) {
    if (id === needle || entry.name.toLowerCase() === needle || entry.displayName.toLowerCase() === needle) {
      return id;
    }
  }
  return undefined;
}

/** Authentication metadata for a provider id or name; undefined when the provider is unknown. */
export function getProviderAuth(provider: string | undefined): ProviderAuth | undefined {
  const id = resolveProviderId(provider);
  return id ? (PROVIDER_CATALOG[id] as ProviderCatalogEntry).auth : undefined;
}

/** True when the provider requires a user-supplied API key or token. */
export function requiresApiKey(provider: string): boolean {
  const auth = getProviderAuth(provider);
  return auth?.kind === "apiKey" && auth.optional !== true;
}

/** Every provider id, in catalog order. The single source for provider lists. */
export const PROVIDER_IDS = Object.keys(PROVIDER_CATALOG) as ProviderCatalogId[];

export function getProviderEntry(provider: string): ProviderCatalogEntry | undefined {
  const id = resolveProviderId(provider);
  return id ? PROVIDER_CATALOG[id] : undefined;
}

/** Providers whose credential is a user-supplied secret GitMind stores (API key/token, or Custom API auth token). */
export const SECRET_PROVIDER_IDS: readonly ProviderCatalogId[] = PROVIDER_IDS.filter(
  id => ["apiKey", "custom"].includes(PROVIDER_CATALOG[id].auth.kind)
);

/** Providers that store a `<id>.apiKey` value (secret providers except the Custom API, which uses `custom.authToken`). */
export const API_KEY_PROVIDER_IDS: readonly ProviderCatalogId[] = PROVIDER_IDS.filter(
  id => PROVIDER_CATALOG[id].auth.kind === "apiKey"
);

/** Providers that never need a user-supplied API key. */
export const KEYLESS_PROVIDER_IDS: readonly ProviderCatalogId[] = PROVIDER_IDS.filter(
  id => !["apiKey", "custom"].includes(PROVIDER_CATALOG[id].auth.kind)
);

/** Compact provider metadata for webview scripts, which cannot import extension modules. */
export function serializeProvidersForWebview(): Record<string, { name: string; displayName: string; authKind: ProviderAuthKind; requiresApiKey: boolean; defaultModel: string; curatedModels: readonly string[] }> {
  return Object.fromEntries(PROVIDER_IDS.map(id => {
    const entry: ProviderCatalogEntry = PROVIDER_CATALOG[id];
    return [id, {
      name: entry.name,
      displayName: entry.displayName,
      authKind: entry.auth.kind,
      requiresApiKey: requiresApiKey(id),
      defaultModel: entry.defaultModel,
      curatedModels: entry.curatedModels ?? [],
    }];
  }));
}
