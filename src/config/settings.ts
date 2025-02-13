import * as vscode from "vscode";
import { ApiConfig, ExtensionConfig, CommitConfig, ProviderConfig } from './types';

export function getConfiguration(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration("aiCommitAssistant");

    return {
        provider: config.get('apiProvider', 'huggingface'),
        debug: config.get('debug', false),
        gemini: {
            enabled: config.get('gemini.enabled', false),
            apiKey: config.get('gemini.apiKey'),
        },
        huggingface: {
            enabled: config.get('huggingface.enabled', true),
            apiKey: config.get('huggingface.apiKey'),
            model: config.get('huggingface.model', 'mistralai/Mistral-7B-Instruct-v0.3'),
            customModel: config.get('huggingface.customModel', ''),
            temperature: config.get('huggingface.temperature', 0.7),
        },
        ollama: {
            enabled: config.get('ollama.enabled', false),
            url: config.get('ollama.url', 'http://localhost:11434'),
            model: config.get('ollama.model', 'phi4'),
            customModel: config.get('ollama.customModel', ''),
        },
        commit: {
            style: config.get('commit.style', 'conventional'),
            maxLength: config.get('commit.maxLength', 72),
            includeScope: config.get('commit.includeScope', true),
            addBulletPoints: config.get('commit.addBulletPoints', true),
        },
        mistral: {
            enabled: config.get('mistral.enabled', false),
            apiKey: config.get('mistral.apiKey'),
            model: config.get('mistral.model', 'mistral-large-latest'),
        }
    };
}

export function getApiConfig(): ApiConfig {
    const config = getConfiguration();
    const selectedProvider = config.provider;

    switch (selectedProvider) {
        case "gemini":
            if (!config.gemini.apiKey) {
                throw new Error("Gemini API key is required but not configured");
            }
            return {
                type: "gemini",
                apiKey: config.gemini.apiKey
            };

        case "huggingface":
            if (!config.huggingface.apiKey) {
                throw new Error("Hugging Face API key is required but not configured");
            }
            const hfModel = config.huggingface.model === 'custom'
                ? config.huggingface.customModel
                : config.huggingface.model;

            if (!hfModel) {
                throw new Error("Hugging Face model is required but not configured");
            }

            return {
                type: "huggingface",
                apiKey: config.huggingface.apiKey,
                model: hfModel,
                temperature: config.huggingface.temperature
            };

        case "ollama":
            const ollamaModel = config.ollama.model === 'custom'
                ? config.ollama.customModel
                : config.ollama.model;

            if (!ollamaModel) {
                throw new Error("Ollama model is required but not configured");
            }

            // Add validation for URL
            if (!config.ollama.url) {
                throw new Error("Ollama URL is required but not configured");
            }

            return {
                type: "ollama",
                url: config.ollama.url,
                model: ollamaModel
            };
        case "mistral":
            if (!config.mistral.apiKey) {
                throw new Error("Mistral API key is required but not configured");
            }
            return {
                type: "mistral",
                apiKey: config.mistral.apiKey,
                model: config.mistral.model
            };
        default:
            throw new Error(`Unsupported provider: ${selectedProvider}`);
    }
}