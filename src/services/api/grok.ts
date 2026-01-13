import { debugLog } from "../debug/logger";
import { RequestManager } from "../../utils/requestManager";
import { APIErrorHandler } from "../../utils/errorHandler";
import { generateCommitPrompt, getPromptConfig } from "./prompts";
import { BaseAIProvider, GenerationOptions } from "./base";

const GROK_BASE_URL = "https://api.x.ai/v1";

export class GrokProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const requestManager = RequestManager.getInstance();
        const controller = requestManager.getController();

        debugLog(`Making API call to Grok with model: ${this.model}`);

        try {
            const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    max_tokens: options?.maxTokens ?? 150,
                    temperature: options?.temperature ?? 0.2,
                    stream: false,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Grok API error: ${response.status} - ${errorText}`);

                // Parse and handle structured error responses
                try {
                    const errorData = JSON.parse(errorText);

                    // Handle X.ai specific error structure
                    if (errorData.error || errorData.code) {
                        const errorMessage = errorData.error || errorData.code;

                        // Handle specific error cases based on Grok API documentation
                        if (response.status === 400) {
                            // Bad Request: Invalid argument or incorrect API key
                            if (errorMessage.toLowerCase().includes('api key') ||
                                errorMessage.toLowerCase().includes('incorrect api key') ||
                                errorMessage.toLowerCase().includes('invalid api key')) {
                                throw new Error("Invalid API key. Please check your Grok API key configuration.");
                            } else {
                                throw new Error(`Bad request: ${errorMessage}. Please check your request parameters.`);
                            }
                        } else if (response.status === 401) {
                            // Unauthorized: No authorization header or invalid token
                            throw new Error("Invalid API key. Please check your Grok API key configuration.");
                        } else if (response.status === 403) {
                            // Forbidden: No permission or API key blocked
                            if (errorMessage.includes('credits') || errorMessage.includes('balance')) {
                                throw new Error("Insufficient credits. Please purchase credits at https://console.x.ai to continue using Grok API.");
                            } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
                                throw new Error("Access denied. Your API key doesn't have permission. Ask your team admin for permission.");
                            } else if (errorMessage.includes('blocked')) {
                                throw new Error("Your API key or team is blocked. Please contact support.");
                            } else {
                                throw new Error(`Access forbidden: ${errorMessage}. Check your API key permissions.`);
                            }
                        } else if (response.status === 404) {
                            // Not Found: Model not found or invalid endpoint
                            if (errorMessage.toLowerCase().includes('model')) {
                                throw new Error(`Model not found: ${errorMessage}. Please check your model selection.`);
                            } else {
                                throw new Error("Endpoint not found. Please check the API endpoint URL.");
                            }
                        } else if (response.status === 405) {
                            // Method Not Allowed: Wrong HTTP method
                            throw new Error("HTTP method not allowed. This is likely a configuration issue.");
                        } else if (response.status === 415) {
                            // Unsupported Media Type: Missing Content-Type or empty body
                            throw new Error("Unsupported media type. Please ensure proper request headers are set.");
                        } else if (response.status === 422) {
                            // Unprocessable Entity: Invalid format in request body
                            throw new Error(`Invalid request format: ${errorMessage}. Please check your request parameters.`);
                        } else if (response.status === 429) {
                            // Too Many Requests: Rate limit exceeded
                            throw new Error("Rate limit exceeded. Please reduce your request rate or increase your rate limit at https://console.x.ai");
                        } else if (response.status === 202) {
                            // Accepted: Request queued for processing
                            throw new Error("Request is being processed. Please try again in a moment.");
                        } else if (response.status >= 500) {
                            // 5XX Server errors
                            throw new Error(`Grok server error (${response.status}): ${errorMessage}. Please try again later or check https://status.x.ai for service status.`);
                        } else {
                            // Any other error codes
                            throw new Error(`Grok API error (${response.status}): ${errorMessage}`);
                        }
                    }
                } catch (parseError) {
                    // If JSON parsing fails, fall back to generic error
                    if (parseError instanceof Error && parseError.message.includes('Grok API')) {
                        throw parseError; // Re-throw our structured errors
                    }

                    // Handle non-JSON error responses based on status code
                    if (response.status === 400) {
                        throw new Error("Bad request. Please check your API key and request parameters.");
                    } else if (response.status === 401) {
                        throw new Error("Invalid API key. Please check your Grok API key configuration.");
                    } else if (response.status === 403) {
                        throw new Error("Access forbidden. Please check your API key permissions or purchase credits at https://console.x.ai");
                    } else if (response.status === 404) {
                        throw new Error("Model or endpoint not found. Please check your model selection and API endpoint.");
                    } else if (response.status === 405) {
                        throw new Error("HTTP method not allowed. This is likely a configuration issue.");
                    } else if (response.status === 415) {
                        throw new Error("Unsupported media type. Please ensure proper request headers are set.");
                    } else if (response.status === 422) {
                        throw new Error("Invalid request format. Please check your request parameters.");
                    } else if (response.status === 429) {
                        throw new Error("Rate limit exceeded. Please reduce your request rate or increase your rate limit at https://console.x.ai");
                    } else if (response.status >= 500) {
                        throw new Error(`Grok server error (${response.status}). Please try again later or check https://status.x.ai for service status.`);
                    }
                }

                // Fallback for non-JSON errors
                throw new Error(`Grok API error: ${response.status} - ${errorText}. Check https://status.x.ai for service status.`);
            }

            const data = await response.json();
            const message =
                data.choices?.[0]?.message?.content || data.message?.content;

            if (!message) {
                throw new Error("No valid response from Grok API");
            }

            debugLog(`Grok API response received successfully`);
            return message.trim();
        } catch (error) {
            debugLog(`Grok API call failed: ${error}`);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }
            const errorInfo = APIErrorHandler.handleAPIError(error as Error, "grok");
            throw new Error(errorInfo.userMessage);
        }
    }

    async getModels(): Promise<string[]> {
        try {
            debugLog("Fetching Grok models from API...");

            const response = await fetch(`${GROK_BASE_URL}/language-models`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Grok models API error: ${response.status} - ${errorText}`);

                // Parse and handle structured error responses
                try {
                    const errorData = JSON.parse(errorText);

                    // Handle X.ai specific error structure
                    if (errorData.error || errorData.code) {
                        const errorMessage = errorData.error || errorData.code;

                        // Handle specific error cases based on Grok API documentation
                        if (response.status === 400) {
                            // Bad Request: Invalid argument or incorrect API key
                            if (errorMessage.toLowerCase().includes('api key') ||
                                errorMessage.toLowerCase().includes('incorrect api key') ||
                                errorMessage.toLowerCase().includes('invalid api key')) {
                                throw new Error("Invalid API key. Please check your Grok API key configuration.");
                            } else {
                                throw new Error(`Bad request: ${errorMessage}. Please check your request parameters.`);
                            }
                        } else if (response.status === 401) {
                            // Unauthorized: No authorization header or invalid token
                            throw new Error("Invalid API key. Please check your Grok API key configuration.");
                        } else if (response.status === 403) {
                            // Forbidden: No permission or API key blocked
                            if (errorMessage.includes('credits') || errorMessage.includes('balance')) {
                                throw new Error("Insufficient credits. Please purchase credits at https://console.x.ai to continue using Grok API.");
                            } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
                                throw new Error("Access denied. Your API key doesn't have permission to access models. Ask your team admin for permission.");
                            } else if (errorMessage.includes('blocked')) {
                                throw new Error("Your API key or team is blocked. Please contact support.");
                            } else {
                                throw new Error(`Access forbidden: ${errorMessage}. Check your API key permissions.`);
                            }
                        } else if (response.status === 404) {
                            // Not Found: Invalid endpoint URL or model not found
                            throw new Error("The Grok models endpoint was not found. This may indicate the endpoint is not available for your account or has been moved.");
                        } else if (response.status === 405) {
                            // Method Not Allowed: Wrong HTTP method
                            throw new Error("HTTP method not allowed. This is likely a configuration issue.");
                        } else if (response.status === 415) {
                            // Unsupported Media Type: Missing Content-Type or empty body
                            throw new Error("Unsupported media type. Please ensure proper request headers are set.");
                        } else if (response.status === 422) {
                            // Unprocessable Entity: Invalid format in request body
                            throw new Error(`Invalid request format: ${errorMessage}. Please check the request parameters.`);
                        } else if (response.status === 429) {
                            // Too Many Requests: Rate limit exceeded
                            throw new Error("Rate limit exceeded. Please reduce your request rate or increase your rate limit at https://console.x.ai");
                        } else if (response.status === 202) {
                            // Accepted: Request queued for processing (shouldn't happen for models endpoint, but handle it)
                            throw new Error("Request is being processed. Please try again in a moment.");
                        } else if (response.status >= 500) {
                            // 5XX Server errors
                            throw new Error(`Grok server error (${response.status}): ${errorMessage}. Please try again later or check https://status.x.ai for service status.`);
                        } else {
                            // Any other error codes
                            throw new Error(`Grok API error (${response.status}): ${errorMessage}`);
                        }
                    }
                } catch (parseError) {
                    // If JSON parsing fails, fall back to generic error
                    if (parseError instanceof Error && parseError.message.includes('Grok')) {
                        throw parseError; // Re-throw our structured errors
                    }

                    // Handle non-JSON error responses based on status code
                    if (response.status === 400) {
                        throw new Error("Bad request. Please check your API key and request parameters.");
                    } else if (response.status === 401) {
                        throw new Error("Invalid API key. Please check your Grok API key configuration.");
                    } else if (response.status === 403) {
                        throw new Error("Access forbidden. Please check your API key permissions or purchase credits at https://console.x.ai");
                    } else if (response.status === 404) {
                        throw new Error("The Grok models endpoint was not found. This may not be available for your account.");
                    } else if (response.status === 405) {
                        throw new Error("HTTP method not allowed. This is likely a configuration issue.");
                    } else if (response.status === 415) {
                        throw new Error("Unsupported media type. Please ensure proper request headers are set.");
                    } else if (response.status === 422) {
                        throw new Error("Invalid request format. Please check the request parameters.");
                    } else if (response.status === 429) {
                        throw new Error("Rate limit exceeded. Please reduce your request rate or increase your rate limit at https://console.x.ai");
                    } else if (response.status >= 500) {
                        throw new Error(`Grok server error (${response.status}). Please try again later or check https://status.x.ai for service status.`);
                    }
                }

                // Fallback for non-JSON errors
                throw new Error(`Grok API error: ${response.status} - ${errorText}. Check https://status.x.ai for service status.`);
            }

            const data = await response.json();
            debugLog("Grok API response:", data);

            // Validate response structure
            if (!data.models || !Array.isArray(data.models)) {
                debugLog("Invalid response structure - missing or invalid 'models' array");
                throw new Error("Invalid response format from Grok API");
            }

            // Extract model IDs from the response
            const modelIds = data.models
                .map((model: any) => {
                    if (!model || typeof model !== 'object') {
                        debugLog("Invalid model object:", model);
                        return null;
                    }
                    return model.id;
                })
                .filter((id: string) => id && typeof id === 'string'); // Filter out null/undefined/empty IDs

            debugLog(`Successfully fetched ${modelIds.length} Grok models:`, modelIds);

            if (modelIds.length === 0) {
                throw new Error("No valid models found in Grok API response");
            }

            return modelIds;
        } catch (error) {
            debugLog("Error fetching Grok models:", error);

            // Re-throw with a more user-friendly message if it's a generic error
            if (error instanceof Error) {
                // If it's already a meaningful error message from above, keep it
                if (error.message.includes("HTTP") ||
                    error.message.includes("credits") ||
                    error.message.includes("permission") ||
                    error.message.includes("Invalid response") ||
                    error.message.includes("No valid models")) {
                    throw error;
                }
            }

            // Generic network/connection errors
            throw new Error("Failed to load Grok models. Please check your internet connection and API key, then try again.");
        }
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
        return validateGrokAPIKey(this.apiKey);
    }
}

/**
 * Validates a Grok API key by making a simple request
 * @param apiKey The API key to validate
 * @returns Object with success status and optional warning/troubleshooting information
 */
export async function validateGrokAPIKey(
    apiKey: string
): Promise<{ success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    try {
        // Try the models endpoint first (lightweight approach)
        let response = await fetch(`${GROK_BASE_URL}/models`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            signal: controller.signal,
        });

        if (response.ok) {
            return { success: true };
        }

        // If models endpoint doesn't work (404/405), try a minimal completion request
        if (response.status === 404 || response.status === 405) {
            response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "grok-3",
                    messages: [
                        {
                            role: "user",
                            content: "Test",
                        },
                    ],
                    max_tokens: 1,
                    temperature: 0.2,
                    stream: false,
                }),
                signal: controller.signal,
            });
        }

        // Handle X.ai specific status codes according to their documentation
        if (response.ok) {
            return { success: true };
        }

        // Get error response for detailed error handling
        const errorText = await response.text();
        let errorMessage = `Grok API error (${response.status})`;
        let troubleshooting = "Please check your API key configuration";

        // Parse X.ai error response
        try {
            const errorData = JSON.parse(errorText);
            if (errorData.error || errorData.code) {
                errorMessage = errorData.error || errorData.code;
            }
        } catch (parseError) {
            // Use raw text if JSON parsing fails
            if (errorText) {
                errorMessage = errorText;
            }
        }

        // 401 Unauthorized: No authorization header or invalid authorization token
        if (response.status === 401) {
            debugLog("Grok API key validation: 401 Unauthorized - Invalid API key");
            return {
                success: false,
                error: "Invalid API key",
                troubleshooting: "Please check that your Grok API key is correct and active"
            };
        }

        // 403 Forbidden: API key doesn't have permission or is blocked
        if (response.status === 403) {
            debugLog("Grok API key validation: 403 Forbidden - API key blocked or insufficient permissions");

            // Provide specific troubleshooting based on error message
            if (errorMessage.toLowerCase().includes('credits') || errorMessage.toLowerCase().includes('balance')) {
                // For insufficient credits, return success with warning since API key is valid
                return {
                    success: true,
                    warning: "Insufficient credits detected",
                    troubleshooting: "Your Grok account has insufficient credits. Please purchase credits at https://console.x.ai to continue using the API"
                };
            } else if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('access')) {
                troubleshooting = "Your API key may not have the required permissions. Please check your account settings at https://console.x.ai";
            } else {
                troubleshooting = "Access forbidden. Please check your API key permissions or contact X.ai support";
            }

            return {
                success: false,
                error: errorMessage,
                troubleshooting: troubleshooting
            };
        }

        // 400 Bad Request: Could be invalid API key (per X.ai docs) or invalid request format
        if (response.status === 400) {
            try {
                const errorText = await response.text();
                const errorData = JSON.parse(errorText);

                // Check if the error message indicates an API key issue
                if (errorData.error && errorData.error.message) {
                    const errorMessage = errorData.error.message.toLowerCase();
                    if (errorMessage.includes('api key') ||
                        errorMessage.includes('incorrect api key') ||
                        errorMessage.includes('invalid api key')) {
                        debugLog("Grok API key validation: 400 Bad Request - Invalid API key specified in error message");
                        return {
                            success: false,
                            error: "Invalid API key",
                            troubleshooting: "Please check that your Grok API key is correct and active"
                        };
                    }
                }

                // If it's not an API key error, the key is likely valid but request format is wrong
                debugLog("Grok API key validation: 400 Bad Request - Request format issue, API key appears valid");
                return { success: true };
            } catch (parseError) {
                // If we can't parse the error, assume it's a request format issue (API key valid)
                debugLog("Grok API key validation: 400 Bad Request - Cannot parse error, assuming API key valid");
                return { success: true };
            }
        }

        // 404 Not Found: Model not found or invalid endpoint (API key is valid)
        if (response.status === 404) {
            debugLog("Grok API key validation: 404 Not Found - Model/endpoint not found, API key appears valid");
            return { success: true };
        }

        // 405 Method Not Allowed: Wrong HTTP method (API key is valid)
        if (response.status === 405) {
            debugLog("Grok API key validation: 405 Method Not Allowed - Wrong method, API key appears valid");
            return { success: true };
        }

        // 415 Unsupported Media Type: Empty body or wrong Content-Type (API key is valid)
        if (response.status === 415) {
            debugLog("Grok API key validation: 415 Unsupported Media Type - Request format issue, API key appears valid");
            return { success: true };
        }

        // 422 Unprocessable Entity: Invalid format in request body (API key is valid)
        if (response.status === 422) {
            debugLog("Grok API key validation: 422 Unprocessable Entity - Invalid request format, API key appears valid");
            return { success: true };
        }

        // 429 Too Many Requests: Rate limit exceeded (API key is valid)
        if (response.status === 429) {
            debugLog("Grok API key validation: 429 Too Many Requests - Rate limited, API key appears valid");
            return { success: true };
        }

        // 202 Accepted: Deferred completion queued (API key is valid)
        if (response.status === 202) {
            debugLog("Grok API key validation: 202 Accepted - Request queued, API key appears valid");
            return { success: true };
        }

        // For any other error codes, try to parse the response for more information
        try {
            const errorText = await response.text();
            const errorData = JSON.parse(errorText);

            if (errorData.error && errorData.error.message) {
                const errorMessage = errorData.error.message.toLowerCase();

                // Check for explicit authentication/authorization errors
                if (errorMessage.includes('authentication') ||
                    errorMessage.includes('authorization') ||
                    errorMessage.includes('api key') ||
                    errorMessage.includes('unauthorized') ||
                    errorMessage.includes('forbidden')) {
                    debugLog(`Grok API key validation: ${response.status} - Authentication error in message`);
                    return {
                        success: false,
                        error: "Invalid API key",
                        troubleshooting: "Please check that your Grok API key is correct and active"
                    };
                }

                // Other structured errors suggest valid API key but operational issues
                debugLog(`Grok API key validation: ${response.status} - Structured error response, API key appears valid`);
                return { success: true };
            }
        } catch (parseError) {
            debugLog(`Grok API key validation: ${response.status} - Cannot parse error response`);
        }

        // For unknown status codes, err on the side of caution
        debugLog(`Grok API key validation: ${response.status} - Unknown status code, assuming invalid API key`);
        return {
            success: false,
            error: `Grok API error (${response.status})`,
            troubleshooting: "Please check your API key configuration"
        };

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            debugLog("Grok API key validation: Request aborted");
            return {
                success: false,
                error: "Request aborted",
                troubleshooting: "The API request was cancelled. Please try again"
            };
        }
        debugLog(`Grok API key validation failed with network error: ${error}`);
        return {
            success: false,
            error: "Network error",
            troubleshooting: "Unable to connect to Grok API. Please check your internet connection and try again"
        };
    }
}

/**
 * Backward compatibility functions
 */
export async function callGrokAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    const provider = new GrokProvider(apiKey, model);
    return provider.generateCommitMessage(diff, customContext);
}

export async function fetchGrokModels(apiKey: string): Promise<string[]> {
    const provider = new GrokProvider(apiKey, "");
    return provider.getModels();
}
