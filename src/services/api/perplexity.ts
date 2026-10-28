import { debugLog } from "../debug/logger";
import { RequestManager } from "../../utils/requestManager";
import { generateCommitPrompt, getPromptConfig } from './prompts';
import { PerplexityModel } from "../../config/types";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";
import { getCuratedModels } from "../../config/providerCatalog";
import { UNKNOWN_LIMIT_OUTPUT_TOKENS } from "./capabilities";

const PERPLEXITY_BASE_URL = "https://api.perplexity.ai";
/**
 * Perplexity Agent API (replaces Sonar Chat Completions, supported only until 2026-09-27).
 * https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar/how-to
 */
const PERPLEXITY_AGENT_URL = `${PERPLEXITY_BASE_URL}/v1/agent`;
const COMMIT_INSTRUCTIONS = "You are an expert at creating concise, informative git commit messages. Focus on the most important changes and use conventional commit format when appropriate.";

/** Extracts the generated text from an Agent API response. */
export function extractPerplexityAgentText(data: any): string | undefined {
    if (typeof data?.output_text === "string" && data.output_text.trim()) {
        return data.output_text;
    }
    const parts: string[] = [];
    for (const item of Array.isArray(data?.output) ? data.output : []) {
        for (const content of Array.isArray(item?.content) ? item.content : []) {
            if (typeof content?.text === "string") {
                parts.push(content.text);
            }
        }
    }
    return parts.length > 0 ? parts.join("") : undefined;
}

// Configuration for different Perplexity models
interface GenerationConfig {
    temperature: number;
}

const MODEL_CONFIGS: Record<PerplexityModel, GenerationConfig> = {
    // Agent API models use provider/model IDs (https://docs.perplexity.ai/docs/agent-api/models, 2026-10-28)
    "perplexity/sonar": {
        temperature: 0.2
    },
    "openai/gpt-6-luna": {
        temperature: 0.2
    },
    "perplexity/glm-5.3-flash": {
        temperature: 0.2
    }
};

export class PerplexityProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const controller = this.getAbortController();

        debugLog(`Making API call to Perplexity with model: ${this.model}`);

        if (!this.apiKey || this.apiKey.trim() === '') {
            debugLog("Error: Perplexity API key is missing or empty");
            throw new Error("Perplexity API key is required but not configured");
        }

        // The Agent API accepts Sonar models and provider-prefixed models; unknown IDs use default limits.
        if (!this.model || !this.model.trim()) {
            throw new Error("Please select a Perplexity model in the settings.");
        }

        try {
            debugLog("Sending prompt to Perplexity API");

            // Get model-specific configuration
            const config = MODEL_CONFIGS[this.model as PerplexityModel] ?? MODEL_CONFIGS["perplexity/sonar"];

            const headers = {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            };

            const body = {
                model: this.model,
                instructions: COMMIT_INSTRUCTIONS,
                input: prompt,
                // Optional except for anthropic/* models, which reject a request without it.
                ...((options?.maxTokens ?? (this.model.startsWith("anthropic/") ? UNKNOWN_LIMIT_OUTPUT_TOKENS : undefined)) ? { max_output_tokens: options?.maxTokens ?? UNKNOWN_LIMIT_OUTPUT_TOKENS } : {}),
            };

            const response = await loggedFetch(PERPLEXITY_AGENT_URL, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                signal: controller.signal,
            }, { provider: "perplexity", operation: "agent.create" });

            if (!response.ok) {
                let errorText = "";
                let errorDetails = "";

                try {
                    errorText = await response.text();

                    // Check if response is HTML (common for 401 errors from proxies/load balancers)
                    if (errorText.toLowerCase().includes('<html>') || errorText.toLowerCase().includes('<!doctype html>')) {
                        // Extract title from HTML if available
                        const titleMatch = errorText.match(/<title>\s*(.*?)\s*<\/title>/i);
                        if (titleMatch && titleMatch[1].trim()) {
                            errorDetails = titleMatch[1].trim();
                        } else {
                            // Fallback: look for common HTML error patterns
                            const h1Match = errorText.match(/<h1[^>]*>\s*(.*?)\s*<\/h1>/i);
                            if (h1Match && h1Match[1].trim()) {
                                errorDetails = h1Match[1].trim();
                            } else {
                                errorDetails = "HTML error page returned";
                            }
                        }
                        debugLog(`Perplexity API returned HTML error: ${response.status} - ${errorDetails}`);
                    } else {
                        // Try to parse as JSON
                        try {
                            const errorData = JSON.parse(errorText);
                            errorDetails = errorData.error?.message || errorData.message || errorText;
                        } catch {
                            errorDetails = errorText;
                        }
                        debugLog(`Perplexity API error: ${response.status} - ${errorDetails}`);
                    }
                } catch (parseError) {
                    errorDetails = `Unable to parse error response`;
                    debugLog(`Perplexity API error parsing failed: ${response.status} - ${parseError}`);
                }

                // Handle specific error cases with improved messaging
                if (response.status === 401) {
                    if (errorText.includes('<html>') || errorText.includes('<HTML>')) {
                        throw new Error(`Authentication failed: ${errorDetails}. Please verify your Perplexity API key in the settings. Make sure you're using a valid API key from https://perplexity.ai/settings/api`);
                    } else {
                        throw new Error("Invalid or expired API key. Please verify your Perplexity API key in the settings. If you just created the key, it may take a few minutes to become active.");
                    }
                } else if (response.status === 429) {
                    throw new Error("Rate limit exceeded. Perplexity has usage limits based on your account tier. Please wait a moment before trying again.");
                } else if (response.status === 400) {
                    throw new Error(`Bad request: ${errorDetails}. Please check your request format and try again.`);
                } else if (response.status === 403) {
                    throw new Error("Access forbidden. Please check your API key permissions, account status, or ensure you have an active Perplexity subscription.");
                } else if (response.status === 402) {
                    throw new Error("Insufficient credits or payment required. Please check your Perplexity account balance and billing information.");
                } else if (response.status === 500) {
                    throw new Error("Perplexity server error. Please try again in a few moments.");
                } else if (response.status === 502 || response.status === 503 || response.status === 504) {
                    throw new Error("Perplexity service temporarily unavailable. Please try again in a few moments.");
                } else {
                    throw new Error(`Perplexity API error (${response.status}): ${errorDetails || 'Unknown error occurred'}`);
                }
            }

            const data = await response.json();
            const message = extractPerplexityAgentText(data);

            if (!message) {
                throw new Error("No valid response from Perplexity API");
            }

            debugLog(`Perplexity API response received successfully`);
            return message.trim();
        } catch (error) {
            debugLog(`Perplexity API call failed: ${error}`);

            // Handle abort error specifically
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }

            // Handle network errors
            if (error instanceof Error &&
                (error.message.includes('fetch') ||
                    error.message.includes('network') ||
                    error.message.includes('ENOTFOUND') ||
                    error.message.includes('ECONNREFUSED'))) {
                throw new Error('Network error: Unable to connect to Perplexity API. Please check your internet connection and try again.');
            }

            // Re-throw our structured errors (from the response handling above)
            if (error instanceof Error &&
                (error.message.includes('Authentication failed') ||
                    error.message.includes('Invalid or expired API key') ||
                    error.message.includes('Rate limit') ||
                    error.message.includes('Bad request') ||
                    error.message.includes('Access forbidden') ||
                    error.message.includes('Insufficient credits') ||
                    error.message.includes('server error') ||
                    error.message.includes('temporarily unavailable'))) {
                throw error;
            }

            // For unexpected errors, provide a helpful message
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Unexpected error while calling Perplexity API: ${errorMessage}. Please try again or contact support if the issue persists.`);
        }
    }

    /** The Agent API has no model-list endpoint; offer the catalog's documented Sonar models. */
    async getModels(): Promise<string[]> {
        return [...getCuratedModels("perplexity")];
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
        return validatePerplexityAPIKey(this.apiKey);
    }
}

/**
 * Validates a Perplexity API key by making a simple request
 * @param apiKey The API key to validate
 * @returns Object with validation result and error details
 */
export async function validatePerplexityAPIKey(apiKey: string): Promise<{ success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    try {
        const response = await loggedFetch(PERPLEXITY_AGENT_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "perplexity/sonar",
                input: "Hi",
                max_output_tokens: 16
            }),
            signal: controller.signal,
        }, { provider: "perplexity", operation: "validate" });

        // 200 OK: Valid API key
        if (response.ok) {
            return { success: true };
        }

        // 401 Unauthorized: Invalid API key
        if (response.status === 401) {
            return {
                success: false,
                error: "Invalid or expired API key",
                troubleshooting: "Please verify your Perplexity API key is correct. You can get a new key from https://www.perplexity.ai/settings/api"
            };
        }

        // 402 Payment Required: Valid API key but insufficient credits
        if (response.status === 402) {
            return {
                success: true,
                warning: "Insufficient credits",
                troubleshooting: "Your API key is valid but your account has insufficient credits. Please add credits to your Perplexity account."
            };
        }

        // 429 Too Many Requests: Valid API key but rate limited
        if (response.status === 429) {
            return { success: true };
        }

        // 400 Bad Request: Likely valid API key, invalid request format
        if (response.status === 400) {
            return { success: true };
        }

        // For other error codes, try to parse the response for more information
        try {
            const errorText = await response.text();            // Check if response is HTML (common for proxy/load balancer errors)
            if (errorText.toLowerCase().includes('<html>') || errorText.toLowerCase().includes('<!doctype html>')) {
                debugLog(`Perplexity API key validation: ${response.status} - HTML error page returned`);

                // For HTML responses, status code is more reliable than content
                if (response.status === 401) {
                    return {
                        success: false,
                        error: "Authentication failed",
                        troubleshooting: "Invalid API key. Please verify your Perplexity API key is correct."
                    };
                } else if (response.status === 403) {
                    return {
                        success: false,
                        error: "Access forbidden",
                        troubleshooting: "Your API key may not have the required permissions or your account may be suspended."
                    };
                }
                // For other HTML errors, assume API key might be valid but service issues
                return {
                    success: response.status < 500,
                    error: response.status >= 500 ? "Service temporarily unavailable" : undefined,
                    troubleshooting: response.status >= 500 ? "Perplexity service is experiencing issues. Please try again later." : "There may be a service configuration issue."
                };
            }

            // Try to parse as JSON
            const errorData = JSON.parse(errorText);

            if (errorData.error && errorData.error.message) {
                const errorMessage = errorData.error.message.toLowerCase();

                // Check for explicit authentication/authorization errors
                if (errorMessage.includes('authentication') ||
                    errorMessage.includes('authorization') ||
                    errorMessage.includes('api key') ||
                    errorMessage.includes('unauthorized') ||
                    errorMessage.includes('invalid key')) {
                    return {
                        success: false,
                        error: "Invalid API key",
                        troubleshooting: "The API key is invalid or expired. Please check your Perplexity API key configuration."
                    };
                }

                // Other structured errors suggest valid API key but operational issues
                return { success: true };
            }
        } catch (parseError) {
            debugLog(`Perplexity API key validation: ${response.status} - Cannot parse error response: ${parseError}`);
        }

        // For unknown status codes, err on the side of caution
        debugLog(`Perplexity API key validation: ${response.status} - Unknown status code, assuming invalid API key`);
        return {
            success: false,
            error: `API error (${response.status})`,
            troubleshooting: "Unknown error occurred. Please check your API key configuration."
        };
    } catch (error) {
        debugLog(`Perplexity API key validation failed: ${error}`);

        // Handle abort error
        if (error instanceof Error && error.name === 'AbortError') {
            debugLog('Perplexity API key validation was cancelled');
            return {
                success: false,
                error: "Request cancelled",
                troubleshooting: "The validation request was cancelled."
            };
        }

        // Handle network errors - assume invalid key to be safe
        if (error instanceof Error &&
            (error.message.includes('fetch') ||
                error.message.includes('network') ||
                error.message.includes('ENOTFOUND') ||
                error.message.includes('ECONNREFUSED'))) {
            debugLog('Network error during Perplexity API key validation');
            return {
                success: false,
                error: "Network error",
                troubleshooting: "Unable to connect to Perplexity API. Please check your internet connection and try again."
            };
        }

        // For other errors, assume invalid key to be safe
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            troubleshooting: "An unexpected error occurred during validation. Please check your API key and try again."
        };
    }
}

export async function fetchPerplexityModels(apiKey: string): Promise<string[]> {
    const provider = new PerplexityProvider(apiKey, "");
    return provider.getModels();
}
