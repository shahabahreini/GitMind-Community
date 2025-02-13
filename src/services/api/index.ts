// src/services/api/index.ts
import * as vscode from "vscode";
import { ApiConfig } from "../../config/types";
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
                if (!config.apiKey) {
                    const configured = await OnboardingManager.validateConfiguration('Gemini');
                    if (!configured) {
                        throw new Error('Gemini API key is required but not configured');
                    }
                    // Get updated config after key input
                    const updatedConfig = getApiConfig();
                    return await callGeminiAPI(updatedConfig.apiKey, diff);
                }
                return await callGeminiAPI(config.apiKey, diff);

            case "huggingface":
                if (!config.apiKey) {
                    const configured = await OnboardingManager.validateConfiguration('Hugging Face');
                    if (!configured) {
                        throw new Error('Hugging Face API key is required but not configured');
                    }
                    const updatedConfig = getApiConfig();
                    if (!updatedConfig.model) {
                        throw new Error("Please select a Hugging Face model in the settings.");
                    }
                    return await callHuggingFaceAPI(updatedConfig.apiKey, updatedConfig.model, diff);
                }
                if (!config.model) {
                    throw new Error("Please select a Hugging Face model in the settings.");
                }
                return await callHuggingFaceAPI(config.apiKey, config.model, diff);

            case "ollama":
                if (!config.url) {
                    throw new Error("Ollama URL not configured. Please check the extension settings.");
                }
                if (!config.model) {
                    throw new Error("Ollama model not specified. Please select a model in the extension settings.");
                }

                const isOllamaAvailable = await checkOllamaAvailability(config.url);
                if (!isOllamaAvailable) {
                    const instructions = getOllamaInstallInstructions();
                    await vscode.window.showErrorMessage("Ollama Connection Error", {
                        modal: true,
                        detail: instructions
                    });
                    throw new Error("Ollama is not running. Please start Ollama and try again.");
                }

                return await callOllamaAPI(config.url, config.model, diff);

            case "mistral":
                if (!config.apiKey) {
                    const configured = await OnboardingManager.validateConfiguration('Mistral');
                    if (!configured) {
                        throw new Error('Mistral API key is required but not configured');
                    }
                    const updatedConfig = getApiConfig();
                    if (!updatedConfig.model) {
                        throw new Error("Please select a Mistral model in the settings.");
                    }
                    return await callMistralAPI(updatedConfig.apiKey, updatedConfig.model, diff);
                }
                if (!config.model) {
                    throw new Error("Please select a Mistral model in the settings.");
                }
                return await callMistralAPI(config.apiKey, config.model, diff);

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
