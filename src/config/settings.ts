import * as vscode from "vscode";
import {
    ApiConfig,
    ExtensionConfig,
    CommitConfig,
    ProviderConfig,
    GeminiModel, // Added this import
} from "./types";

export function getConfiguration(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration("aiCommitAssistant");

    return {
        provider: config.get("apiProvider", "mistral"),
        debug: config.get("debug", false),
        gemini: {
            enabled: config.get("gemini.enabled", false),
            apiKey: config.get("gemini.apiKey"),
            model: config.get("gemini.model", GeminiModel.GEMINI_2_FLASH), // Updated default
        },
        huggingface: {
            enabled: config.get("huggingface.enabled", true),
            apiKey: config.get("huggingface.apiKey"),
            model: config.get(
                "huggingface.model",
                "mistralai/Mistral-7B-Instruct-v0.3"
            ),
            customModel: config.get("huggingface.customModel", ""),
            temperature: config.get("huggingface.temperature", 0.7),
        },
        ollama: {
            enabled: config.get("ollama.enabled", false),
            url: config.get("ollama.url", "http://localhost:11434"),
            model: config.get("ollama.model", "phi4"),
            customModel: config.get("ollama.customModel", ""),
        },
        commit: {
            style: config.get("commit.style", "conventional"),
            maxLength: config.get("commit.maxLength", 72),
            includeScope: config.get("commit.includeScope", true),
            addBulletPoints: config.get("commit.addBulletPoints", true),
            verbose: config.get("commit.verbose", true),
        },
        mistral: {
            enabled: config.get("mistral.enabled", false),
            apiKey: config.get("mistral.apiKey"),
            model: config.get("mistral.model", "mistral-large-latest"),
        },
        cohere: {
            enabled: config.get("cohere.enabled", false),
            apiKey: config.get("cohere.apiKey"),
            model: config.get("cohere.model", "command"),
        },
        openai: {
            enabled: config.get("openai.enabled", false),
            apiKey: config.get("openai.apiKey"),
            model: config.get("openai.model", "gpt-3.5-turbo"),
        },
        together: {
            enabled: config.get("together.enabled", false),
            apiKey: config.get("together.apiKey"),
            model: config.get("together.model", "meta-llama/Llama-3.3-70B-Instruct-Turbo"),
        },
        promptCustomization: {
            enabled: config.get("promptCustomization.enabled", false),
        },
    };
}

export function getApiConfig(): ApiConfig {
    const config = getConfiguration();
    const selectedProvider = config.provider;

    switch (selectedProvider) {
        case "gemini":
            return {
                type: "gemini",
                apiKey: config.gemini.apiKey || "",
                model: config.gemini.model as GeminiModel || GeminiModel.GEMINI_2_FLASH, // Updated default
            };

        case "huggingface": {
            const hfModel =
                config.huggingface.model === "custom"
                    ? config.huggingface.customModel
                    : config.huggingface.model;

            return {
                type: "huggingface",
                apiKey: config.huggingface.apiKey || "", // Return empty string instead of throwing
                model: hfModel || "", // Return empty string instead of throwing
                temperature: config.huggingface.temperature,
            };
        }

        case "ollama": {
            const ollamaModel =
                config.ollama.model === "custom"
                    ? config.ollama.customModel
                    : config.ollama.model;

            return {
                type: "ollama",
                url: config.ollama.url || "", // Return empty string instead of throwing
                model: ollamaModel || "", // Return empty string instead of throwing
            };
        }

        case "mistral":
            return {
                type: "mistral",
                apiKey: config.mistral.apiKey || "", // Return empty string instead of throwing
                model: config.mistral.model || "", // Return empty string instead of throwing
            };

        case "cohere":
            return {
                type: "cohere",
                apiKey: config.cohere.apiKey || "",
                model: config.cohere.model || "command",
            };

        case "openai":
            return {
                type: "openai",
                apiKey: config.openai.apiKey || "",
                model: config.openai.model || "gpt-3.5-turbo",
            };

        case "together":
            return {
                type: "together",
                apiKey: config.together.apiKey || "",
                model: config.together.model || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            };

        default:
            // For unsupported providers, we should still throw as this is a programming error
            throw new Error(`Unsupported provider: ${selectedProvider}`);
    }
}
