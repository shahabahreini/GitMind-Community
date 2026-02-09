// src/services/api/cohere.ts
import { debugLog } from "../debug/logger";
import { generateCommitPrompt, getPromptConfig } from './prompts';
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";

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
        temperature: 0.2,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_R_08_2024]: {
        temperature: 0.2,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_R_PLUS_08_2024]: {
        temperature: 0.2,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },

    // Specialized Models
    [CohereModel.AYA_EXPANSE_8B]: {
        temperature: 0.2,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.AYA_EXPANSE_32B]: {
        temperature: 0.2,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_R7B_ARABIC]: {
        temperature: 0.2,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },

    // Legacy Models
    [CohereModel.COMMAND_R]: {
        temperature: 0.2,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_R_PLUS]: {
        temperature: 0.2,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND]: {
        temperature: 0.2,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_LIGHT]: {
        temperature: 0.2,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_NIGHTLY]: {
        temperature: 0.2,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    }
};

export class CohereProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const controller = this.getAbortController();

        if (!this.apiKey || this.apiKey.trim() === '') {
            debugLog("Error: Cohere API key is missing or empty");
            throw new Error("Cohere API key is required but not configured");
        }

        // Validate model
        const validModels = Object.values(CohereModel);
        if (!validModels.includes(this.model as CohereModel)) {
            debugLog("Error: Invalid Cohere model specified", { model: this.model });
            throw new Error(`Invalid Cohere model specified: ${this.model}`);
        }

        try {
            debugLog(`Calling Cohere API with model: ${this.model}`);
            debugLog("Sending prompt to Cohere API");
            debugLog("Prompt:", prompt);

            // Get model-specific configuration
            const config = MODEL_CONFIGS[this.model];
            if (!config) {
                throw new Error(`Configuration not found for model: ${this.model}`);
            }

            const temperature = options?.temperature ?? config.temperature;
            const maxOutputTokens = options?.maxTokens ?? config.maxOutputTokens;

            // Using the v2 chat API
            const response = await loggedFetch('https://api.cohere.ai/v2/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: temperature,
                    max_tokens: maxOutputTokens,
                    p: config.topP,
                    k: config.topK
                }),
                signal: controller.signal
            }, { provider: "cohere", operation: "chat" });

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
                const formattedMessage = this.enforceCommitMessageFormat(fullText);
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

    async getModels(): Promise<string[]> {
        try {
            const response = await loggedFetch("https://api.cohere.com/v1/models", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Accept": "application/json"
                }
            }, { provider: "cohere", operation: "models.list" });

            if (!response.ok) {
                // Handle specific Cohere API errors
                let errorMessage = `Failed to fetch models: ${response.status} ${response.statusText}`;

                switch (response.status) {
                    case 400:
                        errorMessage = "Bad request - please check your API key format";
                        break;
                    case 401:
                        errorMessage = "Unauthorized - invalid API key";
                        break;
                    case 403:
                        errorMessage = "Forbidden - API key lacks necessary permissions";
                        break;
                    case 404:
                        errorMessage = "Models endpoint not found";
                        break;
                    case 422:
                        errorMessage = "Unprocessable entity - request format error";
                        break;
                    case 429:
                        errorMessage = "Rate limit exceeded - please try again later";
                        break;
                    case 498:
                        errorMessage = "Invalid token - please check your API key";
                        break;
                    case 499:
                        errorMessage = "Client closed request - request timeout";
                        break;
                    case 500:
                        errorMessage = "Internal server error - Cohere service issue";
                        break;
                    case 501:
                        errorMessage = "Not implemented - feature not available";
                        break;
                    case 503:
                        errorMessage = "Service unavailable - Cohere service temporarily down";
                        break;
                    case 504:
                        errorMessage = "Gateway timeout - request took too long";
                        break;
                    default:
                        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Filter models that support chat endpoint and are not deprecated
            const chatModels = data.models
                .filter((model: any) =>
                    model.endpoints?.includes('chat') &&
                    !model.is_deprecated
                )
                .map((model: any) => model.name)
                .sort(); // Sort alphabetically

            debugLog("Available Cohere chat models:", chatModels);
            return chatModels;
        } catch (error) {
            debugLog("Failed to fetch Cohere models:", error);
            throw error;
        }
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
        return validateCohereAPIKey(this.apiKey);
    }

}

export async function validateCohereAPIKey(
    apiKey: string
): Promise<{ success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
    try {
        const response = await loggedFetch('https://api.cohere.ai/v2/chat', {
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
        }, { provider: "cohere", operation: "validate" });

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

export async function fetchCohereModels(apiKey: string): Promise<string[]> {
    const provider = new CohereProvider(apiKey, "");
    return provider.getModels();
}
