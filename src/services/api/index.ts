// src/services/api/index.ts
import * as vscode from "vscode";
import { ApiConfig, GeminiApiConfig, HuggingFaceApiConfig, OllamaApiConfig, MistralApiConfig } from "../../config/types";
import { callGeminiAPI } from "./gemini";
import { callHuggingFaceAPI } from "./huggingface";
import { callOllamaAPI } from "./ollama";
import { callMistralAPI } from "./mistral";
import { OnboardingManager } from '../../utils/onboardingManager';
import { checkOllamaAvailability, getOllamaInstallInstructions } from "../../utils/ollamaHelper";
import { debugLog } from "../debug/logger";
import { getApiConfig } from "../../config/settings";

export async function generateCommitMessage(config: ApiConfig, diff: string): Promise<string> {
    try {
        switch (config.type) {
            case "gemini":
                const geminiConfig = config as GeminiApiConfig;
                if (!geminiConfig.apiKey) {
                    const configured = await OnboardingManager.validateConfiguration('Gemini');
                    if (!configured) {
                        throw new Error('Gemini API key is required but not configured');
                    }
                    const updatedConfig = getApiConfig() as GeminiApiConfig;
                    return await callGeminiAPI(updatedConfig.apiKey, diff);
                }
                return await callGeminiAPI(geminiConfig.apiKey, diff);

            case "huggingface":
                const huggingFaceConfig = config as HuggingFaceApiConfig;
                if (!huggingFaceConfig.apiKey) {
                    const configured = await OnboardingManager.validateConfiguration('Hugging Face');
                    if (!configured) {
                        throw new Error('Hugging Face API key is required but not configured');
                    }
                    const updatedConfig = getApiConfig() as HuggingFaceApiConfig;
                    if (!updatedConfig.model) {
                        throw new Error("Please select a Hugging Face model in the settings.");
                    }
                    return await callHuggingFaceAPI(updatedConfig.apiKey, updatedConfig.model, diff);
                }
                if (!huggingFaceConfig.model) {
                    throw new Error("Please select a Hugging Face model in the settings.");
                }
                return await callHuggingFaceAPI(huggingFaceConfig.apiKey, huggingFaceConfig.model, diff);

            case "ollama":
                const ollamaConfig = config as OllamaApiConfig;
                if (!ollamaConfig.url) {
                    throw new Error("Ollama URL not configured. Please check the extension settings.");
                }
                if (!ollamaConfig.model) {
                    throw new Error("Ollama model not specified. Please select a model in the extension settings.");
                }

                const isOllamaAvailable = await checkOllamaAvailability(ollamaConfig.url);
                if (!isOllamaAvailable) {
                    const instructions = getOllamaInstallInstructions();
                    await vscode.window.showErrorMessage("Ollama Connection Error", {
                        modal: true,
                        detail: instructions
                    });
                    throw new Error("Ollama is not running. Please start Ollama and try again.");
                }

                return await callOllamaAPI(ollamaConfig.url, ollamaConfig.model, diff);

            case "mistral":
                const mistralConfig = config as MistralApiConfig;
                if (!mistralConfig.apiKey) {
                    const configured = await OnboardingManager.validateConfiguration('Mistral');
                    if (!configured) {
                        throw new Error('Mistral API key is required but not configured');
                    }
                    const updatedConfig = getApiConfig() as MistralApiConfig;
                    if (!updatedConfig.model) {
                        throw new Error("Please select a Mistral model in the settings.");
                    }
                    return await callMistralAPI(updatedConfig.apiKey, updatedConfig.model, diff);
                }
                if (!mistralConfig.model) {
                    throw new Error("Please select a Mistral model in the settings.");
                }
                return await callMistralAPI(mistralConfig.apiKey, mistralConfig.model, diff);

            default:
                const _exhaustiveCheck: never = config;
                throw new Error(`Unsupported API provider: ${(config as any).type}`);
        }
    }
    catch (error) {
        debugLog("API Error:", error);

        // If the error is related to API key configuration, let it propagate
        if (error instanceof Error &&
            (error.message.includes('API key is required') ||
                error.message.includes('Please configure'))) {
            throw error;
        }

        // Format the error message for display
        let errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

        // Only show modal for Ollama connection issues
        if (config.type === "ollama" && errorMessage.includes("Ollama is not running")) {
            const instructions = getOllamaInstallInstructions();
            await vscode.window.showErrorMessage("Ollama Connection Error", {
                modal: true,
                detail: instructions
            });
        } else {
            // For other errors, show a regular error message
            vscode.window.showErrorMessage(`Error generating commit message: ${errorMessage}`);
        }

        throw error;
    }
}

// Helper function to validate and potentially update API configuration
async function validateAndUpdateConfig(config: ApiConfig): Promise<ApiConfig> {
    const updatedConfig = { ...config };

    switch (config.type) {
        case "gemini":
        case "huggingface":
        case "mistral":
            if (!config.apiKey) {
                const configured = await OnboardingManager.validateConfiguration(config.type);
                if (configured) {
                    return getApiConfig();
                }
            }
            break;
    }

    return updatedConfig;
}
