import * as vscode from "vscode";
import {
    ApiConfig,
    ExtensionConfig,
    ProviderConfig,
    GeminiModel,
    AnthropicModel,
    CopilotModel,
    DeepSeekModel,
    GrokModel,
    PerplexityModel,
} from "./types";
import { SecureKeyManager } from "../services/encryption/SecureKeyManager";
import { debugLog } from "../services/debug/logger";

interface ProviderDefaults {
    model: string;
    enabled: boolean;
    extras?: Record<string, string | number | boolean>;
}

// Configuration cache with invalidation
let configCache: { config: ExtensionConfig; timestamp: number } | null = null;
const CONFIG_CACHE_TTL = 1000; // 1 second TTL

// Register configuration change listener to invalidate cache
const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('gitmind')) {
        configCache = null;
    }
});

// Export disposable so extension.ts can clean it up on deactivation
export { configChangeDisposable };

/**
 * Manually invalidate the configuration cache.
 * Used by tests that mock vscode.workspace.getConfiguration
 * (since mocks don't fire onDidChangeConfiguration events).
 */
export function invalidateConfigCache(): void {
    configCache = null;
}

const PROVIDER_DEFAULTS: Record<string, ProviderDefaults> = {
    gemini: { model: "gemini-2.5-flash", enabled: false },
    huggingface: {
        model: "mistralai/Mistral-7B-Instruct-v0.3",
        enabled: true,
        extras: { temperature: 0.2 }
    },
    ollama: {
        model: "phi4",
        enabled: false,
        extras: { url: "http://localhost:11434" }
    },
    mistral: { model: "mistral-large-latest", enabled: false },
    cohere: { model: "command-a-03-2025", enabled: false },
    openai: { model: "gpt-4o", enabled: false },
    together: { model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", enabled: false },
    openrouter: { model: "google/gemma-3-27b-it:free", enabled: false },
    anthropic: { model: "claude-sonnet-4", enabled: false },
    minimax: { model: "MiniMax-M2", enabled: false },
    copilot: { model: "auto", enabled: false },
    deepseek: { model: "deepseek-chat", enabled: false },
    grok: { model: "grok-3", enabled: false },
    perplexity: { model: "sonar-pro", enabled: false },
    zai: { model: "glm-4.5-air", enabled: false },
    custom: {
        model: "",
        enabled: false,
        extras: {
            baseUrl: "",
            endpoint: "",
            authType: "bearer",
            authToken: "",
            headerKey: "",
            requestFormat: "",
            responseFormat: ""
        }
    }
};

export function getConfiguration(): ExtensionConfig {
    // Return cached config if still valid
    const now = Date.now();
    if (configCache && (now - configCache.timestamp) < CONFIG_CACHE_TTL) {
        return configCache.config;
    }

    const config = vscode.workspace.getConfiguration("gitmind");

    const result: ExtensionConfig = {
        provider: config.get("apiProvider", "mistral"),
        debug: config.get("debug", false),
        commit: {
            style: config.get("commit.style", "conventional"),
            maxLength: config.get("commit.maxLength", 72),
            includeScope: config.get("commit.includeScope", true),
            addBulletPoints: config.get("commit.addBulletPoints", true),
            verbose: config.get("commit.verbose", true),
            captureAllChanges: config.get("commit.captureAllChanges", false),
            targetLanguage: config.get("commit.targetLanguage", "english"),
        },
        promptCustomization: {
            enabled: config.get("promptCustomization.enabled", false),
            saveLastPrompt: config.get("promptCustomization.saveLastPrompt", false),
            lastPrompt: config.get("promptCustomization.lastPrompt", ""),
        },
    } as ExtensionConfig;

    // Build provider configurations dynamically
    Object.entries(PROVIDER_DEFAULTS).forEach(([provider, defaults]) => {
        const providerConfig: ProviderConfig = {
            enabled: config.get(`${provider}.enabled`, defaults.enabled),
            model: config.get(`${provider}.model`, defaults.model),
        };

        // Add API key for providers that need it
        if (provider !== 'ollama' && provider !== 'copilot') {
            providerConfig.apiKey = config.get(`${provider}.apiKey`);
        }

        // Add provider-specific extras
        if (defaults.extras) {
            Object.entries(defaults.extras).forEach(([key, value]) => {
                (providerConfig as Record<string, unknown>)[key] = config.get(`${provider}.${key}`, value);
            });
        }

        // Handle custom models
        if (provider === 'huggingface' || provider === 'ollama') {
            providerConfig.customModel = config.get(`${provider}.customModel`, "");
        }

        result[provider] = providerConfig;
    });

    // Cache the result
    configCache = { config: result, timestamp: Date.now() };

    return result;
}

export async function getApiConfig(): Promise<ApiConfig> {
    const config = getConfiguration();
    const provider = config.provider;
    const providerConfig = config[provider] as ProviderConfig | undefined;

    if (!providerConfig) {
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const baseConfig: Record<string, unknown> = {
        type: provider,
        model: getEffectiveModel(provider, providerConfig)
    };

    // Add API key for providers that need it
    if (provider !== 'ollama' && provider !== 'copilot' && provider !== 'custom') {
        const secureKeyManager = SecureKeyManager.getInstance();
        const secureApiKey = await secureKeyManager.getApiKey(provider, false);
        baseConfig.apiKey = secureApiKey || "";
    }

    // Handle custom API authToken separately
    if (provider === 'custom') {
        const secureKeyManager = SecureKeyManager.getInstance();
        const customConfig = providerConfig as Record<string, unknown>;

        debugLog(`[Custom API] Starting token retrieval for provider: ${provider}`);
        debugLog(`[Custom API] Config authToken from settings: ${customConfig.authToken ? `[${String(customConfig.authToken).length} chars]` : 'empty/undefined'}`);

        const secureAuthToken = await secureKeyManager.getApiKey('custom', false);
        debugLog(`[Custom API] Secure token from SecureKeyManager: ${secureAuthToken ? `[${secureAuthToken.length} chars]` : 'empty/undefined'}`);

        const authToken = secureAuthToken || String(customConfig.authToken || "") || "";
        baseConfig.authToken = authToken;

        debugLog(`[Custom API] Final token to be used: ${authToken ? `[${authToken.length} chars]` : 'EMPTY - THIS WILL CAUSE 401 ERROR'}`);

        if (!authToken || authToken.length === 0) {
            debugLog(`[Custom API] WARNING: No token available! This will cause authentication failure.`);
        }
    }

    // Add provider-specific properties
    const extras = providerConfig as Record<string, unknown>;
    switch (provider) {
        case 'ollama':
            baseConfig.url = extras.url || "";
            break;
        case 'huggingface':
            baseConfig.temperature = extras.temperature;
            break;
        case 'custom':
            baseConfig.baseUrl = extras.baseUrl || "";
            baseConfig.endpoint = extras.endpoint || "";
            baseConfig.authType = extras.authType || "bearer";
            baseConfig.headerKey = extras.headerKey || "";
            baseConfig.requestFormat = extras.requestFormat || "";
            baseConfig.responseFormat = extras.responseFormat || "";
            break;
    }

    return baseConfig as unknown as ApiConfig;
}

// Legacy synchronous version - falls back to plain text settings only
export function getApiConfigSync(): ApiConfig {
    const config = getConfiguration();
    const provider = config.provider;
    const providerConfig = config[provider] as ProviderConfig | undefined;

    if (!providerConfig) {
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const baseConfig: Record<string, unknown> = {
        type: provider,
        model: getEffectiveModel(provider, providerConfig)
    };

    // Add API key for providers that need it (only from plain text settings)
    if (provider !== 'ollama' && provider !== 'copilot') {
        baseConfig.apiKey = providerConfig.apiKey || "";
    }

    // Add provider-specific properties
    const extras = providerConfig as Record<string, unknown>;
    switch (provider) {
        case 'ollama':
            baseConfig.url = extras.url || "";
            break;
        case 'huggingface':
            baseConfig.temperature = extras.temperature;
            break;
    }

    return baseConfig as unknown as ApiConfig;
}

function getEffectiveModel(provider: string, providerConfig: ProviderConfig): string {
    if ((provider === 'huggingface' || provider === 'ollama') &&
        providerConfig.model === "custom" &&
        providerConfig.customModel) {
        return providerConfig.customModel;
    }
    // Handle empty strings and undefined/null values by falling back to defaults
    const rawModel = providerConfig.model;
    const model = providerConfig.model?.trim();
    const defaultModel = PROVIDER_DEFAULTS[provider]?.model;

    debugLog(`[getEffectiveModel] Provider: ${provider}, Raw model: "${rawModel}", Trimmed: "${model}", Default: "${defaultModel}"`);

    if (!model || model.length === 0) {
        const fallback = defaultModel || "";
        debugLog(`[getEffectiveModel] Using fallback model: "${fallback}"`);
        return fallback;
    }
    debugLog(`[getEffectiveModel] Using configured model: "${model}"`);
    return model;
}