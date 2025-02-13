// src/services/api/index.ts
import * as vscode from "vscode";
import {
    ApiConfig,
    GeminiApiConfig,
    HuggingFaceApiConfig,
    OllamaApiConfig,
    MistralApiConfig
} from "../../config/types";
import { callGeminiAPI } from "./gemini";
import { callHuggingFaceAPI } from "./huggingface";
import { callOllamaAPI } from "./ollama";
import { callMistralAPI } from "./mistral";
import { OnboardingManager } from '../../utils/onboardingManager';
import { checkOllamaAvailability, getOllamaInstallInstructions } from "../../utils/ollamaHelper";
import { debugLog } from "../debug/logger";
import { getApiConfig } from "../../config/settings";

type ApiProvider = 'Gemini' | 'Hugging Face' | 'Ollama' | 'Mistral';

export async function generateCommitMessage(config: ApiConfig, diff: string): Promise<string> {
    try {
        // First validate and potentially update the configuration
        const validatedConfig = await validateAndUpdateConfig(config);
        if (!validatedConfig) {
            const provider = getProviderName(config.type);
            const result = await vscode.window.showErrorMessage(
                `${provider} API key is not configured. Would you like to configure it now?`,
                'Configure Now',
                'Get API Key',
                'Cancel'
            );

            if (result === 'Configure Now') {
                await vscode.commands.executeCommand('ai-commit-assistant.openSettings');
                // After settings are opened, we should return to prevent further execution
                return ''; // Return empty string to indicate no message was generated
            } else if (result === 'Get API Key') {
                const providerDocs = {
                    'Gemini': 'https://aistudio.google.com/app/apikey',
                    'Hugging Face': 'https://huggingface.co/settings/tokens',
                    'Mistral': 'https://console.mistral.ai/api-keys/'
                };

                if (provider in providerDocs) {
                    await vscode.env.openExternal(vscode.Uri.parse(providerDocs[provider as keyof typeof providerDocs]));
                }
                return ''; // Return empty string to indicate no message was generated
            }
            // If user cancels, throw error to be caught by error handler
            throw new Error(`${provider} API configuration required`);
        }

        // Then generate the message with the validated config
        return await generateMessageWithConfig(validatedConfig, diff);
    } catch (error) {
        debugLog("Generate Commit Message Error:", error);
        // Handle the error but don't rethrow
        await handleApiError(error, config);
        return ''; // Return empty string to indicate no message was generated
    }
}



async function generateMessageWithConfig(config: ApiConfig, diff: string): Promise<string> {
    switch (config.type) {
        case "gemini": {
            const geminiConfig = config as GeminiApiConfig;
            if (!geminiConfig.apiKey) {
                const apiKey = await OnboardingManager.validateAndPromptForApiKey('Gemini');
                if (!apiKey) {
                    throw new Error('Gemini API key is required but not configured');
                }
                return await callGeminiAPI(apiKey, diff);
            }
            return await callGeminiAPI(geminiConfig.apiKey, diff);
        }

        case "huggingface": {
            const hfConfig = config as HuggingFaceApiConfig;
            if (!hfConfig.apiKey) {
                const apiKey = await OnboardingManager.validateAndPromptForApiKey('Hugging Face');
                if (!apiKey) {
                    throw new Error('Hugging Face API key is required but not configured');
                }
                const updatedConfig = getApiConfig() as HuggingFaceApiConfig;
                if (!updatedConfig.model) {
                    throw new Error("Please select a Hugging Face model in the settings.");
                }
                return await callHuggingFaceAPI(apiKey, updatedConfig.model, diff);
            }
            if (!hfConfig.model) {
                throw new Error("Please select a Hugging Face model in the settings.");
            }
            return await callHuggingFaceAPI(hfConfig.apiKey, hfConfig.model, diff);
        }

        case "ollama": {
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
        }

        case "mistral": {
            const mistralConfig = config as MistralApiConfig;
            if (!mistralConfig.apiKey) {
                const apiKey = await OnboardingManager.validateAndPromptForApiKey('Mistral');
                if (!apiKey) {
                    throw new Error('Mistral API key is required but not configured');
                }
                const updatedConfig = getApiConfig() as MistralApiConfig;
                if (!updatedConfig.model) {
                    throw new Error("Please select a Mistral model in the settings.");
                }
                return await callMistralAPI(apiKey, updatedConfig.model, diff);
            }
            if (!mistralConfig.model) {
                throw new Error("Please select a Mistral model in the settings.");
            }
            return await callMistralAPI(mistralConfig.apiKey, mistralConfig.model, diff);
        }

        default: {
            const _exhaustiveCheck: never = config;
            throw new Error(`Unsupported API provider: ${(config as any).type}`);
        }
    }
}

async function handleApiError(error: unknown, config: ApiConfig): Promise<void> {
    debugLog("API Error:", error);

    if (!(error instanceof Error)) {
        await vscode.window.showErrorMessage("An unknown error occurred");
        return;
    }

    const errorMessage = error.message;

    // Handle API key configuration errors
    if (errorMessage.includes('API key is required') ||
        errorMessage.includes('Please configure') ||
        errorMessage.includes('API configuration required')) {

        const provider = getProviderName(config.type);

        // Skip API key configuration for Ollama
        if (provider === 'Ollama') {
            const result = await vscode.window.showErrorMessage(
                'Ollama is not configured properly. Would you like to configure it now?',
                'Configure Now',
                'Installation Guide'
            );

            if (result === 'Configure Now') {
                await vscode.commands.executeCommand('ai-commit-assistant.openSettings');
            } else if (result === 'Installation Guide') {
                const instructions = getOllamaInstallInstructions();
                await vscode.window.showInformationMessage(instructions, { modal: true });
            }
            return;
        }

        // For other providers, show configuration options
        const result = await vscode.window.showErrorMessage(
            `${provider} API key is not configured. Would you like to configure it now?`,
            'Configure Now',
            'Get API Key',
            'Cancel'
        );

        if (result === 'Configure Now') {
            await vscode.commands.executeCommand('ai-commit-assistant.openSettings');
        } else if (result === 'Get API Key') {
            const providerDocs = {
                'Gemini': 'https://aistudio.google.com/app/apikey',
                'Hugging Face': 'https://huggingface.co/settings/tokens',
                'Mistral': 'https://console.mistral.ai/api-keys/'
            };

            if (provider in providerDocs) {
                await vscode.env.openExternal(
                    vscode.Uri.parse(providerDocs[provider as keyof typeof providerDocs])
                );
            }
        }
        return;
    }

    // Handle all other errors
    await vscode.window.showErrorMessage(`Error generating commit message: ${errorMessage}`);
}



async function validateAndUpdateConfig(config: ApiConfig): Promise<ApiConfig | null> {
    debugLog("Validating API configuration for provider:", config.type);

    // Skip validation for Ollama as it doesn't require an API key
    if (config.type === "ollama") {
        return config;
    }

    const provider = getProviderName(config.type);
    debugLog("Checking API key for provider:", provider);

    // Check if API key is missing
    if (!config.apiKey) {
        debugLog("API key missing, prompting user for input");
        const apiKey = await OnboardingManager.validateAndPromptForApiKey(provider);
        if (apiKey) {
            debugLog("New API key received, updating configuration");
            // Get the updated configuration after the API key has been set
            return getApiConfig();
        }
        debugLog("No API key provided");
        return null;
    }

    debugLog("API configuration validated successfully");
    return config;
}


function getProviderName(type: string): ApiProvider {
    switch (type) {
        case "gemini": return "Gemini";
        case "huggingface": return "Hugging Face";
        case "ollama": return "Ollama";
        case "mistral": return "Mistral";
        default: throw new Error(`Unknown provider type: ${type}`);
    }
}
