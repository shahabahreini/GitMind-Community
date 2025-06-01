import * as vscode from 'vscode';
import { debugLog } from "../debug/logger";
import { generateCommitPrompt } from './prompts';
import { CopilotModel } from "../../config/types";
import { RequestManager } from "../../utils/requestManager";

// Configuration for different Copilot models
interface GenerationConfig {
    maxTokens: number;
    temperature: number;
}

const MODEL_CONFIGS: Record<CopilotModel, GenerationConfig> = {
    // GPT-4 Series (GitHub Copilot)
    "gpt-4o": {
        maxTokens: 350,
        temperature: 0.3
    },
    "gpt-4o-mini": {
        maxTokens: 350,
        temperature: 0.3
    },
    "gpt-4": {
        maxTokens: 350,
        temperature: 0.3
    },
    "gpt-4-turbo": {
        maxTokens: 350,
        temperature: 0.3
    },
    // GPT-3.5 Series
    "gpt-3.5-turbo": {
        maxTokens: 350,
        temperature: 0.3
    }
};

/**
 * Enforces proper commit message format
 * @param message Raw message from API
 * @returns Properly formatted commit message
 */
function enforceCommitMessageFormat(message: string): string {
    // Split the message into lines
    const lines = message.split('\n');

    if (lines.length === 0) {
        return message;
    }

    // Get the first line (subject line)
    let subjectLine = lines[0].trim();

    // Truncate the subject line if it exceeds 72 characters
    if (subjectLine.length > 72) {
        subjectLine = subjectLine.substring(0, 72);
        // Ensure we don't cut in the middle of a word
        if (subjectLine.lastIndexOf(' ') > 0) {
            subjectLine = subjectLine.substring(0, subjectLine.lastIndexOf(' '));
        }
    }

    // Reconstruct the message with the truncated subject line
    return [subjectLine, ...lines.slice(1)].join('\n');
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
 * Makes a request to GitHub Copilot via VS Code Language Model API to generate a commit message
 * @param model The model to use (from CopilotModel enum)
 * @param diff Git diff to analyze
 * @param customContext Additional context provided by the user
 * @returns Generated commit message
 */
export async function callCopilotAPI(model: string, diff: string, customContext: string = ""): Promise<string> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    // Validate model
    const validModels: CopilotModel[] = [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4",
        "gpt-4-turbo",
        "gpt-3.5-turbo"
    ];
    if (!validModels.includes(model as CopilotModel)) {
        debugLog("Error: Invalid Copilot model specified", { model });
        throw new Error(`Invalid Copilot model specified: ${model}`);
    }

    try {
        debugLog(`Calling GitHub Copilot API with model: ${model}`);
        const promptText = generateCommitPrompt(diff, undefined, customContext);
        debugLog("Sending prompt to Copilot API");
        debugLog("Prompt:", promptText);

        // Get model-specific configuration
        const config = MODEL_CONFIGS[model as CopilotModel];
        if (!config) {
            throw new Error(`Configuration not found for model: ${model}`);
        }

        // Check if Copilot is available
        const isAvailable = await isCopilotAvailable();
        if (!isAvailable) {
            throw new Error("GitHub Copilot is not available. Please ensure GitHub Copilot extension is installed and you have access to Copilot Chat.");
        }

        // Select Copilot chat models
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: model.startsWith('gpt-4') ? 'gpt-4' : 'gpt-3.5-turbo'
        });

        if (models.length === 0) {
            throw new Error(`No Copilot models available for family: ${model}`);
        }

        const selectedModel = models[0];
        debugLog(`Selected Copilot model: ${selectedModel.id}`);

        // Create chat messages
        const messages = [
            vscode.LanguageModelChatMessage.User(promptText)
        ];

        // Create cancellation token from controller
        const token = new vscode.CancellationTokenSource();
        controller.signal.addEventListener('abort', () => {
            token.cancel();
        });

        // Send request to Copilot
        const response = await selectedModel.sendRequest(messages, {}, token.token);

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
        const formattedMessage = enforceCommitMessageFormat(fullText);
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

        // Try a simple test request
        const testModel = models[0];
        const messages = [
            vscode.LanguageModelChatMessage.User("Test")
        ];

        const token = new vscode.CancellationTokenSource();
        setTimeout(() => token.cancel(), 5000); // 5 second timeout

        try {
            const response = await testModel.sendRequest(messages, {}, token.token);
            // Just check if we can start the request
            for await (const fragment of response.text) {
                // We only need to check if we can get the first fragment
                break;
            }
            return { success: true };
        } catch (testError) {
            debugLog("Copilot test request failed:", testError);
            if (testError instanceof vscode.LanguageModelError) {
                const errorName = testError.constructor.name;
                if (errorName === 'NoPermissions') {
                    return { success: false, error: "No permission to use GitHub Copilot" };
                } else if (errorName === 'NotFound') {
                    return { success: false, error: "GitHub Copilot model not found" };
                } else if (errorName === 'Blocked') {
                    return { success: false, error: "Request blocked by GitHub Copilot" };
                }
            }
            return { success: false, error: "Failed to validate Copilot access" };
        }

    } catch (error) {
        debugLog("Copilot validation failed:", error);
        return { success: false, error: "Unexpected error during Copilot validation" };
    }
}
