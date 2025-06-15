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
    copilot: { model: "gpt-4o", enabled: false },
    deepseek: { model: "deepseek-chat", enabled: false },
    grok: { model: "grok-3", enabled: false },
    perplexity: { model: "sonar-pro", enabled: false }
};

export function getConfiguration(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration("aiCommitAssistant");

    const result: ExtensionConfig = {
        provider: config.get("apiProvider", "mistral"),
        debug: config.get("debug", false),
        commit: {
            style: config.get("commit.style", "conventional"),
            maxLength: config.get("commit.maxLength", 72),
            includeScope: config.get("commit.includeScope", true),
            addBulletPoints: config.get("commit.addBulletPoints", true),
            verbose: config.get("commit.verbose", true),
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

export function getApiConfig(): ApiConfig {
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
    return providerConfig.model || PROVIDER_DEFAULTS[provider]?.model || "";
}