import * as vscode from "vscode";
import {
    ApiConfig,
    ExtensionConfig,
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
    extras?: Record<string, any>;
}

const PROVIDER_DEFAULTS: Record<string, ProviderDefaults> = {
    gemini: { model: "gemini-2.5-flash", enabled: false },
    huggingface: {
        model: "mistralai/Mistral-7B-Instruct-v0.3",
        enabled: true,
        extras: { temperature: 0.3 }
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
    anthropic: { model: "claude-3-5-sonnet-20241022", enabled: false },
    minimax: { model: "MiniMax-M2", enabled: false },
    copilot: { model: "auto", enabled: false },
    deepseek: { model: "deepseek-chat", enabled: false },
    grok: { model: "grok-3", enabled: false },
    perplexity: { model: "sonar-pro", enabled: false },
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
        const providerConfig: any = {
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
                providerConfig[key] = config.get(`${provider}.${key}`, value);
            });
        }

        // Handle custom models
        if (provider === 'huggingface' || provider === 'ollama') {
            providerConfig.customModel = config.get(`${provider}.customModel`, "");
        }

        (result as any)[provider] = providerConfig;
    });

    return result;
}

export async function getApiConfig(): Promise<ApiConfig> {
    const config = getConfiguration();
    const provider = config.provider;
    const providerConfig = (config as any)[provider];

    if (!providerConfig) {
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const baseConfig: any = {
        type: provider,
        model: getEffectiveModel(provider, providerConfig)
    };

    // Add API key for providers that need it
    if (provider !== 'ollama' && provider !== 'copilot' && provider !== 'custom') {
        // Use SecureKeyManager to get the appropriate API key based on encryption settings
        const secureKeyManager = SecureKeyManager.getInstance();
        // Always get the actual API key for API calls, not the display placeholder
        const secureApiKey = await secureKeyManager.getApiKey(provider, false);
        baseConfig.apiKey = secureApiKey || "";
    }

    // Handle custom API authToken separately
    if (provider === 'custom') {
        const secureKeyManager = SecureKeyManager.getInstance();

        debugLog(`[Custom API] Starting token retrieval for provider: ${provider}`);
        debugLog(`[Custom API] Config authToken from settings: ${providerConfig.authToken ? `[${providerConfig.authToken.length} chars]` : 'empty/undefined'}`);

        // Get the actual auth token for API calls, not the display placeholder
        const secureAuthToken = await secureKeyManager.getApiKey('custom', false);
        debugLog(`[Custom API] Secure token from SecureKeyManager: ${secureAuthToken ? `[${secureAuthToken.length} chars]` : 'empty/undefined'}`);

        // Use secure token if available, otherwise fall back to config
        const authToken = secureAuthToken || providerConfig.authToken || "";
        baseConfig.authToken = authToken;

        debugLog(`[Custom API] Final token to be used: ${authToken ? `[${authToken.length} chars]` : 'EMPTY - THIS WILL CAUSE 401 ERROR'}`);

        if (!authToken || authToken.length === 0) {
            debugLog(`[Custom API] WARNING: No token available! This will cause authentication failure.`);
        }
    }

    // Add provider-specific properties
    switch (provider) {
        case 'ollama':
            baseConfig.url = providerConfig.url || "";
            break;
        case 'huggingface':
            baseConfig.temperature = providerConfig.temperature;
            break;
        case 'custom':
            baseConfig.baseUrl = providerConfig.baseUrl || "";
            baseConfig.endpoint = providerConfig.endpoint || "";
            baseConfig.authType = providerConfig.authType || "bearer";
            // authToken is already set above using SecureKeyManager
            baseConfig.headerKey = providerConfig.headerKey || "";
            baseConfig.requestFormat = providerConfig.requestFormat || "";
            baseConfig.responseFormat = providerConfig.responseFormat || "";
            break;
    }

    return baseConfig as ApiConfig;
}

// Legacy synchronous version - falls back to plain text settings only
export function getApiConfigSync(): ApiConfig {
    const config = getConfiguration();
    const provider = config.provider;
    const providerConfig = (config as any)[provider];

    if (!providerConfig) {
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const baseConfig: any = {
        type: provider,
        model: getEffectiveModel(provider, providerConfig)
    };

    // Add API key for providers that need it (only from plain text settings)
    if (provider !== 'ollama' && provider !== 'copilot') {
        baseConfig.apiKey = providerConfig.apiKey || "";
    }

    // Add provider-specific properties
    switch (provider) {
        case 'ollama':
            baseConfig.url = providerConfig.url || "";
            break;
        case 'huggingface':
            baseConfig.temperature = providerConfig.temperature;
            break;
    }

    return baseConfig as ApiConfig;
}

function getEffectiveModel(provider: string, providerConfig: any): string {
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