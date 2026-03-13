import { debugLog } from "../debug/logger";
import { RequestManager } from "../../utils/requestManager";
import { APIErrorHandler } from "../../utils/errorHandler";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export class GroqProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const controller = this.getAbortController();

        debugLog(`Making API call to Groq with model: ${this.model}`);

        try {
            const response = await loggedFetch(`${GROQ_BASE_URL}/chat/completions`, {
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
                    max_completion_tokens: options?.maxTokens ?? 150,
                    temperature: options?.temperature ?? 0.2,
                }),
                signal: controller.signal,
            }, { provider: "groq", operation: "chat.completions" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Groq API error: ${response.status} - ${errorText}`);

                try {
                    const errorData = JSON.parse(errorText);
                    const errorMessage = errorData.error?.message || errorData.error || errorData.code || "Unknown error";

                    if (response.status === 401) {
                        throw new Error("Invalid API key. Please check your Groq API key configuration.");
                    } else if (response.status === 403) {
                        throw new Error(`Access forbidden: ${errorMessage}. Check your Groq API key permissions.`);
                    } else if (response.status === 404) {
                        throw new Error(`Model not found: ${errorMessage}. Please check your model selection.`);
                    } else if (response.status === 429) {
                        throw new Error("Rate limit exceeded. Groq free-tier has strict rate limits. Please wait and try again.");
                    } else if (response.status === 400) {
                        throw new Error(`Bad request: ${errorMessage}. Please check your request parameters.`);
                    } else if (response.status >= 500) {
                        throw new Error(`Groq server error (${response.status}): ${errorMessage}. Please try again later.`);
                    } else {
                        throw new Error(`Groq API error (${response.status}): ${errorMessage}`);
                    }
                } catch (parseError) {
                    if (parseError instanceof Error && parseError.message.includes('Groq')) {
                        throw parseError;
                    }

                    if (response.status === 401) {
                        throw new Error("Invalid API key. Please check your Groq API key configuration.");
                    } else if (response.status === 429) {
                        throw new Error("Rate limit exceeded. Groq free-tier has strict rate limits. Please wait and try again.");
                    } else if (response.status >= 500) {
                        throw new Error(`Groq server error (${response.status}). Please try again later.`);
                    }
                }

                throw new Error(`Groq API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // OpenAI-compatible response format
            const message = data.choices?.[0]?.message?.content;
            if (!message) {
                debugLog("Unexpected Groq API response shape:", data);
                throw new Error("No valid response from Groq API");
            }

            debugLog(`Groq API response received successfully`);
            return message.trim();
        } catch (error) {
            debugLog(`Groq API call failed: ${error}`);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }
            const errorInfo = APIErrorHandler.handleAPIError(error as Error, "groq");
            throw new Error(errorInfo.userMessage);
        }
    }

    async getModels(): Promise<string[]> {
        try {
            debugLog("Fetching Groq models from API...");

            const response = await loggedFetch(`${GROQ_BASE_URL}/models`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Accept": "application/json"
                }
            }, { provider: "groq", operation: "models.list" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Groq models API error: ${response.status} - ${errorText}`);

                try {
                    const errorData = JSON.parse(errorText);
                    const errorMessage = errorData.error?.message || errorData.error || errorData.code || "Unknown error";

                    if (response.status === 401) {
                        throw new Error("Invalid API key. Please check your Groq API key configuration.");
                    } else if (response.status === 403) {
                        throw new Error(`Access forbidden: ${errorMessage}. Check your Groq API key permissions.`);
                    } else if (response.status === 429) {
                        throw new Error("Rate limit exceeded. Please wait and try again.");
                    } else if (response.status >= 500) {
                        throw new Error(`Groq server error (${response.status}): ${errorMessage}. Please try again later.`);
                    } else {
                        throw new Error(`Groq API error (${response.status}): ${errorMessage}`);
                    }
                } catch (parseError) {
                    if (parseError instanceof Error && parseError.message.includes('Groq')) {
                        throw parseError;
                    }

                    if (response.status === 401) {
                        throw new Error("Invalid API key. Please check your Groq API key configuration.");
                    } else if (response.status === 429) {
                        throw new Error("Rate limit exceeded. Please wait and try again.");
                    } else if (response.status >= 500) {
                        throw new Error(`Groq server error (${response.status}). Please try again later.`);
                    }
                }

                throw new Error(`Groq API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            debugLog("Groq API response:", data);

            // OpenAI-compatible models list format
            if (!data.data || !Array.isArray(data.data)) {
                debugLog("Invalid response structure - missing or invalid 'data' array");
                throw new Error("Invalid response format from Groq API");
            }

            const modelIds = data.data
                .map((model: any) => {
                    if (!model || typeof model !== 'object') {
                        debugLog("Invalid model object:", model);
                        return null;
                    }
                    return model.id;
                })
                .filter((id: string) => id && typeof id === 'string');

            debugLog(`Successfully fetched ${modelIds.length} Groq models:`, modelIds);

            if (modelIds.length === 0) {
                throw new Error("No valid models found in Groq API response");
            }

            return modelIds;
        } catch (error) {
            debugLog("Error fetching Groq models:", error);

            if (error instanceof Error) {
                if (error.message.includes("HTTP") ||
                    error.message.includes("Invalid response") ||
                    error.message.includes("No valid models") ||
                    error.message.includes("Invalid API key") ||
                    error.message.includes("Rate limit") ||
                    error.message.includes("Access forbidden")) {
                    throw error;
                }
            }

            throw new Error("Failed to load Groq models. Please check your internet connection and API key, then try again.");
        }
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
        return validateGroqAPIKey(this.apiKey);
    }
}

/**
 * Validates a Groq API key by making a simple request to the models endpoint
 * @param apiKey The API key to validate
 * @returns Object with success status and optional warning/troubleshooting information
 */
export async function validateGroqAPIKey(
    apiKey: string
): Promise<{ success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
    const requestManager = RequestManager.getInstance();

    try {
        const response = await loggedFetch(`${GROQ_BASE_URL}/models`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Accept": "application/json",
            },
        }, { provider: "groq", operation: "validate.models" });

        if (response.ok) {
            return { success: true };
        }

        const errorText = await response.text();
        let errorMessage = `Groq API error (${response.status})`;

        try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
                errorMessage = errorData.error.message;
            } else if (errorData.error) {
                errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
            }
        } catch {
            if (errorText) {
                errorMessage = errorText;
            }
        }

        if (response.status === 401) {
            debugLog("Groq API key validation: 401 Unauthorized - Invalid API key");
            return {
                success: false,
                error: "Invalid API key",
                troubleshooting: "Please check that your Groq API key is correct and active. Get a key at https://console.groq.com/keys"
            };
        }

        if (response.status === 403) {
            debugLog("Groq API key validation: 403 Forbidden");
            return {
                success: false,
                error: errorMessage,
                troubleshooting: "Access forbidden. Please check your API key permissions at https://console.groq.com"
            };
        }

        if (response.status === 429) {
            debugLog("Groq API key validation: 429 Too Many Requests - Rate limited, API key appears valid");
            return { success: true };
        }

        if (response.status === 400 || response.status === 404 || response.status === 405 || response.status === 422) {
            debugLog(`Groq API key validation: ${response.status} - Request issue, API key appears valid`);
            return { success: true };
        }

        if (response.status >= 500) {
            debugLog(`Groq API key validation: ${response.status} - Server error`);
            return {
                success: false,
                error: `Groq server error (${response.status})`,
                troubleshooting: "Groq servers are experiencing issues. Please try again later."
            };
        }

        debugLog(`Groq API key validation: ${response.status} - Unknown status code`);
        return {
            success: false,
            error: `Groq API error (${response.status})`,
            troubleshooting: "Please check your API key configuration at https://console.groq.com"
        };

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            debugLog("Groq API key validation: Request aborted");
            return {
                success: false,
                error: "Request aborted",
                troubleshooting: "The API request was cancelled. Please try again"
            };
        }
        debugLog(`Groq API key validation failed with network error: ${error}`);
        return {
            success: false,
            error: "Network error",
            troubleshooting: "Unable to connect to Groq API. Please check your internet connection and try again"
        };
    }
}

export async function fetchGroqModels(apiKey: string): Promise<string[]> {
    const provider = new GroqProvider(apiKey, "");
    return provider.getModels();
}
