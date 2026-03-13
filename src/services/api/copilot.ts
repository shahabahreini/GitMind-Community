import * as vscode from 'vscode';
import { debugLog } from "../debug/logger";
import { generateCommitPrompt, getPromptConfig } from './prompts';
import { CopilotModel, KnownCopilotModel } from "../../config/types";
import { BaseAIProvider, GenerationOptions } from './base';

function getPreferredCopilotModelIds(model: string): string[] {
    switch (model) {
        case 'raptor-mini':
            return ['oswe-vscode-secondary', 'oswe-vscode-prime'];
        case 'gpt-4o-mini':
            return ['copilot-fast'];
        default:
            return [];
    }
}

function resolveCopilotChatModel(
    configuredModel: string,
    available: readonly vscode.LanguageModelChat[]
): vscode.LanguageModelChat {
    if (available.length === 0) {
        throw new Error('No Copilot models found');
    }

    if (configuredModel === 'auto') {
        return available[0];
    }

    const preferredIds = getPreferredCopilotModelIds(configuredModel);
    if (preferredIds.length > 0) {
        const preferred = available.find(m => preferredIds.includes(m.id));
        if (preferred) {
            return preferred;
        }
    }

    const exact = available.find(m => m.id === configuredModel);
    if (exact) {
        return exact;
    }

    return available[0];
}

// Configuration for different Copilot models
interface GenerationConfig {
    maxTokens: number;
    temperature: number;
}

const DEFAULT_MODEL_CONFIG: GenerationConfig = {
    maxTokens: 350,
    temperature: 0.2
};

const MODEL_CONFIGS: Record<KnownCopilotModel, GenerationConfig> = {
    // Auto
    "auto": DEFAULT_MODEL_CONFIG,
    // OpenAI Models (Legacy)
    "gpt-4o": DEFAULT_MODEL_CONFIG,
    "gpt-4o-mini": {
        maxTokens: 300,
        temperature: 0.2
    },
    // OpenAI Models (Current)
    "o3-mini": {
        maxTokens: 500,
        temperature: 0.2
    },
    "o4-mini": {
        maxTokens: 400,
        temperature: 0.2
    },
    // Anthropic Models
    "claude-3.5-sonnet": {
        maxTokens: 400,
        temperature: 0.2
    },
    "claude-3.7-sonnet": {
        maxTokens: 400,
        temperature: 0.2
    },
    "claude-sonnet-4": {
        maxTokens: 400,
        temperature: 0.2
    },
    // Google Models
    "gemini-2.5-pro": {
        maxTokens: 400,
        temperature: 0.2
    },
    "gemini-2.0-flash": {
        maxTokens: 400,
        temperature: 0.2
    },
    // Other Models
    "raptor-mini": {
        maxTokens: 300,
        temperature: 0.2
    }
};

export class CopilotProvider extends BaseAIProvider {
    constructor(_apiKey: string, model: string) {
        // Copilot does not use API key, so we pass empty string
        super("", model);
    }

    protected async generateResponse(prompt: string, _options?: GenerationOptions): Promise<string> {
        const controller = this.getAbortController();


        try {
            debugLog(`Calling GitHub Copilot API with model: ${this.model}`);
            debugLog("Sending prompt to Copilot API");
            debugLog("Prompt:", prompt);


            // Check if Copilot is available
            const isAvailable = await isCopilotAvailable();
            if (!isAvailable) {
                throw new Error("GitHub Copilot is not available. Please ensure GitHub Copilot extension is installed and you have access to Copilot Chat.");
            }

            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
            });

            if (models.length === 0) {
                throw new Error('No Copilot models found');
            }

            const resolvedModel = resolveCopilotChatModel(this.model, models);
            debugLog(`Selected Copilot model: ${resolvedModel.id}`);

            // Create chat messages
            const messages = [
                vscode.LanguageModelChatMessage.User(prompt)
            ];

            // Create cancellation token from controller
            const token = new vscode.CancellationTokenSource();
            controller.signal.addEventListener('abort', () => {
                token.cancel();
            });

            // Send request to Copilot
            let response: vscode.LanguageModelChatResponse;
            try {
                response = await resolvedModel.sendRequest(messages, {}, token.token);
            } catch (requestError) {
                const fallbackModel = models.find(m => m.id !== resolvedModel.id);
                if (!fallbackModel) {
                    throw requestError;
                }

                debugLog(`Primary Copilot model failed, retrying with: ${fallbackModel.id}`);
                response = await fallbackModel.sendRequest(messages, {}, token.token);
            }

            // Collect the response
            let fullText = "";
            for await (const fragment of response.text) {
                if (token.token.isCancellationRequested) {
                    throw new Error('Request was cancelled');
                }
                fullText += fragment;
            }

            debugLog(`Processing Response:\n${fullText}`);

            // Process the full text into a formatted commit message
            const formattedMessage = this.enforceCommitMessageFormat(fullText);
            debugLog("Copilot API Response:", formattedMessage);
            return formattedMessage;

        } catch (error) {
            debugLog("Copilot API Call Failed:", error);

            // Handle abort error specifically
            if (error instanceof Error && (error.message === 'Request was cancelled' || error.name === 'AbortError')) {
                throw new Error('Request was cancelled');
            }

            // Handle VS Code Language Model specific errors
            if (error instanceof vscode.LanguageModelError) {
                debugLog(`Language Model Error - Message: ${error.message}`);
                const errorName = error.constructor.name;

                if (errorName === 'NoPermissions') {
                    throw new Error("No permission to use GitHub Copilot. Please ensure you have access to Copilot Chat.");
                } else if (errorName === 'Blocked') {
                    throw new Error("Request was blocked by GitHub Copilot content filters.");
                } else if (errorName === 'NotFound') {
                    throw new Error("GitHub Copilot model not found. Please check your Copilot subscription.");
                } else if (errorName === 'RequestFailed') {
                    throw new Error("GitHub Copilot request failed. Please try again.");
                } else {
                    throw new Error(`GitHub Copilot error: ${error.message}`);
                }
            }

            // Handle other errors
            if (error instanceof Error) {
                throw new Error(`GitHub Copilot API call failed: ${error.message}`);
            }

            throw new Error(`Unexpected error during GitHub Copilot API call: ${String(error)}`);
        }
    }

    async getModels(): Promise<string[]> {
        return fetchCopilotModels();
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
        return validateCopilotAccess();
    }

}

/**
 * Checks if GitHub Copilot Chat models are available
 * @returns Boolean indicating if Copilot models are available
 */
export async function isCopilotAvailable(): Promise<boolean> {
    try {
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot'
        });
        return models.length > 0;
    } catch (error) {
        debugLog("Copilot availability check failed:", error);
        return false;
    }
}

/**
 * Validates GitHub Copilot availability by checking for available models
 * @returns Object with success status and optional error message
 */
export async function validateCopilotAccess(): Promise<{ success: boolean, error?: string }> {
    try {
        const isAvailable = await isCopilotAvailable();
        if (!isAvailable) {
            return { success: false, error: "GitHub Copilot models not available" };
        }

        // Try to select a model to verify access
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot'
        });

        if (models.length === 0) {
            return { success: false, error: "No Copilot models found" };
        }

        const token = new vscode.CancellationTokenSource();
        setTimeout(() => token.cancel(), 5000); // 5 second timeout

        const messages = [vscode.LanguageModelChatMessage.User("Test")];

        const orderedModels = [
            ...models.filter(m => m.id === 'copilot-fast'),
            ...models.filter(m => m.id === 'gpt-4o' || m.id === 'gpt-4o-mini'),
            ...models.filter(m => m.id === 'oswe-vscode-secondary' || m.id === 'oswe-vscode-prime'),
            ...models.filter(m => m.id !== 'copilot-fast' && m.id !== 'oswe-vscode-secondary' && m.id !== 'oswe-vscode-prime'),
        ];

        for (const model of orderedModels) {
            try {
                const response = await model.sendRequest(messages, {}, token.token);
                for await (const fragment of response.text) {
                    void fragment;
                    break;
                }
                return { success: true };
            } catch (testError) {
                debugLog(`Copilot test request failed for model: ${model.id}`, testError);

                if (testError instanceof vscode.LanguageModelError) {
                    const errorName = testError.constructor.name;
                    if (errorName === 'NoPermissions') {
                        return { success: false, error: "No permission to use GitHub Copilot" };
                    }
                    if (errorName === 'Blocked') {
                        return { success: false, error: "Request blocked by GitHub Copilot" };
                    }
                }
            }
        }

        return { success: false, error: "Failed to validate Copilot access" };

    } catch (error) {
        debugLog("Copilot validation failed:", error);
        return { success: false, error: "Unexpected error during Copilot validation" };
    }
}

/**
 * Fetches available GitHub Copilot models
 * @returns Array of available model IDs
 */
export async function fetchCopilotModels(): Promise<string[]> {
    try {
        debugLog("Fetching available Copilot models");

        const isAvailable = await isCopilotAvailable();
        if (!isAvailable) {
            throw new Error("GitHub Copilot is not available");
        }

        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot'
        });

        if (models.length === 0) {
            throw new Error("No Copilot models found");
        }

        const detectedModels = new Set<string>();

        for (const model of models) {
            // Log full model details for debugging
            debugLog("Detected Copilot model:", {
                id: model.id,
                name: model.name,
                family: model.family,
                vendor: model.vendor,
                version: model.version
            });

            const modelId = model.id;
            detectedModels.add(modelId);

            // Also add friendly mappings so users can select the user-facing names
            if (modelId === 'oswe-vscode-secondary' || modelId === 'oswe-vscode-prime') {
                // Both oswe-vscode-secondary and oswe-vscode-prime map to raptor-mini
                detectedModels.add('raptor-mini');
            }
            if (modelId === 'copilot-fast') {
                detectedModels.add('gpt-4o-mini');
            }
            if (modelId === 'gpt-4-0125-preview') {
                detectedModels.add('gpt-4-turbo');
            }
            if (modelId === 'gemini-3-pro-preview') {
                detectedModels.add('gemini-3-pro');
            }
        }

        // Always include 'auto' at the beginning, then sort remaining models for stable UI
        const modelsList = Array.from(detectedModels).filter(id => id !== 'auto');
        modelsList.sort((a, b) => a.localeCompare(b));
        const result = ['auto', ...modelsList];

        debugLog(`Detected ${detectedModels.size} unique Copilot models:`, result);

        return result;
    } catch (error) {
        debugLog("Error fetching Copilot models:", error);
        throw error;
    }
}

