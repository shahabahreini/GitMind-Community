// src/services/api/cohere.ts
import { debugLog } from "../debug/logger";
import { generateCommitPrompt } from './prompts';

// Define Cohere model types
export enum CohereModel {
    // Latest Models
    COMMAND_A_03_2025 = "command-a-03-2025",
    COMMAND_R_08_2024 = "command-r-08-2024",
    COMMAND_R_PLUS_08_2024 = "command-r-plus-08-2024",

    // Specialized Models
    AYA_EXPANSE_8B = "aya-expanse-8b",
    AYA_EXPANSE_32B = "aya-expanse-32b",
    COMMAND_R7B_ARABIC = "command-r7b-arabic",

    // Legacy Models
    COMMAND_R = "command-r",
    COMMAND_R_PLUS = "command-r-plus",
    COMMAND = "command",
    COMMAND_LIGHT = "command-light",
    COMMAND_NIGHTLY = "command-nightly"
}

// Configuration for different Cohere models
interface GenerationConfig {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
}

const MODEL_CONFIGS: Record<string, GenerationConfig> = {
    // Latest Models
    [CohereModel.COMMAND_A_03_2025]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_R_08_2024]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_R_PLUS_08_2024]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },

    // Specialized Models
    [CohereModel.AYA_EXPANSE_8B]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.AYA_EXPANSE_32B]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_R7B_ARABIC]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },

    // Legacy Models
    [CohereModel.COMMAND_R]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_R_PLUS]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_LIGHT]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_NIGHTLY]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
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
 * Makes a request to the Cohere API to generate a commit message
 * @param apiKey The Cohere API key
 * @param model The model to use (from CohereModel enum)
 * @param diff Git diff to analyze
 * @param customContext Additional context provided by the user
 * @returns Generated commit message
 */
export async function callCohereAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    if (!apiKey || apiKey.trim() === '') {
        debugLog("Error: Cohere API key is missing or empty");
        throw new Error("Cohere API key is required but not configured");
    }

    // Validate model
    const validModels = Object.values(CohereModel);
    if (!validModels.includes(model as CohereModel)) {
        debugLog("Error: Invalid Cohere model specified", { model });
        throw new Error(`Invalid Cohere model specified: ${model}`);
    }

    try {
        debugLog(`Calling Cohere API with model: ${model}`);
        const promptText = generateCommitPrompt(diff, undefined, customContext);
        debugLog("Sending prompt to Cohere API");
        debugLog("Prompt:", promptText);

        // Get model-specific configuration
        const config = MODEL_CONFIGS[model];
        if (!config) {
            throw new Error(`Configuration not found for model: ${model}`);
        }

        // Using the v2 chat API
        const response = await fetch('https://api.cohere.ai/v2/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "user",
                        content: promptText
                    }
                ],
                temperature: config.temperature,
                max_tokens: config.maxOutputTokens,
                p: config.topP,
                k: config.topK
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`Cohere API error: ${response.status} ${errorText}`);

            // Handle specific error cases based on status codes
            switch (response.status) {
                case 400:
                    throw new Error("Bad Request: Invalid request body. Please check the request format and required fields.");
                case 401:
                    throw new Error("Invalid API key. Please check your Cohere API key.");
                case 402:
                    throw new Error("Payment Required: Account has reached billing limit. Please add or update your payment method at https://dashboard.cohere.com/billing?tab=payment");
                case 404:
                    throw new Error("Not Found: The requested model or resource was not found. Please check the model ID.");
                case 429:
                    const rateLimitMessage = errorText.includes("Trial key")
                        ? "Trial key rate limit exceeded (40 API calls/minute). Consider upgrading to a Production key at https://dashboard.cohere.com/api-keys"
                        : "Rate limit exceeded. Please wait and try again later.";
                    throw new Error(rateLimitMessage);
                case 499:
                    throw new Error("Request was cancelled. Please try again.");
                case 500:
                    throw new Error("Internal server error. Please contact Cohere support if this persists.");
                default:
                    throw new Error(`Cohere API error: ${response.status} - ${errorText}`);
            }
        }

        const data = await response.json();
        debugLog(`Cohere API response received`);

        // Process the response based on v2 chat API format
        if (data.message && data.message.content && data.message.content.length > 0) {
            let fullText = "";
            for (const contentItem of data.message.content) {
                if (contentItem.type === "text") {
                    fullText += contentItem.text;
                }
            }

            debugLog(`Processing Response:\n${fullText}`);

            // Process the full text into a formatted commit message
            const formattedMessage = enforceCommitMessageFormat(fullText);
            debugLog("Cohere API Response:", formattedMessage);
            return formattedMessage;
        } else {
            throw new Error('No text content found in Cohere API response');
        }
    } catch (error) {
        debugLog("Cohere API Call Failed:", error);

        // Handle specific error types
        if (error instanceof Error) {
            // Rate limiting errors
            if (error.message.includes("rate limit") || error.message.includes("Rate limit")) {
                throw error; // Re-throw the detailed rate limit message
            }

            // Authentication errors
            if (error.message.includes("Invalid API key") || error.message.includes("Unauthorized")) {
                throw error; // Re-throw the detailed auth message
            }

            // Payment/billing errors
            if (error.message.includes("Payment Required") || error.message.includes("billing")) {
                throw error; // Re-throw the detailed billing message
            }

            // Resource not found errors
            if (error.message.includes("Not Found") || error.message.includes("not found")) {
                throw error; // Re-throw the detailed not found message
            }

            // Request cancellation errors
            if (error.message.includes("cancelled") || error.message.includes("Request was cancelled")) {
                throw error; // Re-throw the detailed cancellation message
            }

            // Server errors
            if (error.message.includes("Internal server error") || error.message.includes("500")) {
                throw error; // Re-throw the detailed server error message
            }

            // Response processing errors
            if (error.message.includes("text") || error.message.includes("response")) {
                throw new Error("Failed to process Cohere response: " + error.message);
            }

            // Generic API errors
            throw new Error(`Cohere API call failed: ${error.message}`);
        }

        throw new Error(`Unexpected error during Cohere API call: ${String(error)}`);
    }
}

/**
 * Validates a Cohere API key by making a simple request
 * @param apiKey The API key to validate
 * @returns Object with success status and optional warning/troubleshooting information
 */
export async function validateCohereAPIKey(
    apiKey: string
): Promise<{ success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
    try {
        const response = await fetch('https://api.cohere.ai/v2/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: CohereModel.COMMAND_LIGHT,
                messages: [
                    {
                        role: "user",
                        content: "Test"
                    }
                ],
                max_tokens: 10
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`Cohere API key validation failed: ${response.status} ${errorText}`);

            // Parse error response for more detailed information
            let errorMessage = `Cohere API error (${response.status})`;
            try {
                const errorData = JSON.parse(errorText);
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (parseError) {
                // Use raw text if JSON parsing fails
                if (errorText) {
                    errorMessage = errorText;
                }
            }

            // Handle specific error cases based on status codes
            switch (response.status) {
                case 400:
                    debugLog("Cohere API key validation: 400 Bad Request - Invalid request format");
                    return {
                        success: false,
                        error: "Bad Request: Invalid request body or missing required fields",
                        troubleshooting: "Please check the API request format. This may indicate an issue with the validation request."
                    };

                case 401:
                    debugLog("Cohere API key validation: 401 Unauthorized - Invalid API key");
                    return {
                        success: false,
                        error: "Invalid API key",
                        troubleshooting: "Please check that your Cohere API key is correct and active"
                    };

                case 402:
                    debugLog("Cohere API key validation: 402 Payment Required - Billing limit reached");
                    // For insufficient balance, return success with warning since API key is valid
                    return {
                        success: true,
                        warning: "Billing limit reached",
                        troubleshooting: "Your Cohere account has reached its billing limit. Please add or update your payment method at https://dashboard.cohere.com/billing?tab=payment to continue using the API"
                    };

                case 404:
                    debugLog("Cohere API key validation: 404 Not Found - Model or resource not found");
                    return {
                        success: false,
                        error: "Model or resource not found",
                        troubleshooting: "The requested model or resource was not found. Please check the model ID or contact Cohere support."
                    };

                case 429:
                    debugLog("Cohere API key validation: 429 Too Many Requests - Rate limit exceeded");
                    const rateLimitTroubleshooting = errorMessage.includes("Trial key")
                        ? "Trial key rate limit exceeded (40 API calls/minute). Consider upgrading to a Production key at https://dashboard.cohere.com/api-keys"
                        : "Rate limit exceeded. Please wait and try again later.";

                    // Rate limit means API key is valid
                    return {
                        success: true,
                        warning: "Rate limit exceeded",
                        troubleshooting: rateLimitTroubleshooting
                    };

                case 499:
                    debugLog("Cohere API key validation: 499 Request Cancelled");
                    return {
                        success: false,
                        error: "Request was cancelled",
                        troubleshooting: "The API request was cancelled. Please try again."
                    };

                case 500:
                    debugLog("Cohere API key validation: 500 Internal Server Error");
                    return {
                        success: false,
                        error: "Internal server error",
                        troubleshooting: "Cohere API is experiencing internal issues. Please contact Cohere support if this persists."
                    };

                default:
                    debugLog(`Cohere API key validation: ${response.status} - Unknown status code`);
                    return {
                        success: false,
                        error: errorMessage,
                        troubleshooting: "Please check your API key configuration and try again."
                    };
            }
        }

        debugLog("Cohere API key validation: Success");
        return { success: true };

    } catch (error) {
        debugLog("Cohere API Key Validation Failed:", error);
        return {
            success: false,
            error: "Network error",
            troubleshooting: "Unable to connect to Cohere API. Please check your internet connection and try again."
        };
    }
}
