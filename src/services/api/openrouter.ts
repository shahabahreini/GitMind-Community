import { debugLog } from "../debug/logger";
import { RequestManager } from "../../utils/requestManager";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";

export class OpenRouterProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const requestManager = RequestManager.getInstance();
        const controller = requestManager.getController();

        try {
            debugLog(`Calling OpenRouter API with model: ${this.model}`);

            const response = await loggedFetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/shahabahreini/AI-Commit-Assistant',
                    'X-Title': 'GitMind'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: options?.temperature ?? 0.7,
                    max_tokens: options?.maxTokens ?? 500
                }),
                signal: controller.signal
            }, { provider: "openrouter", operation: "chat.completions" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`OpenRouter API error: ${response.status} ${errorText}`);
                throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            debugLog(`OpenRouter API response received`);

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                return this.formatCommitMessage(data.choices[0].message.content);
            } else {
                throw new Error('Invalid response format from OpenRouter API');
            }
        } catch (error) {
            debugLog('Error in OpenRouterProvider:', error);

            // Handle abort error specifically
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }

            throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getModels(): Promise<string[]> {
        try {
            const response = await loggedFetch("https://openrouter.ai/api/v1/models", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Accept": "application/json",
                    "HTTP-Referer": "https://github.com/shahabahreini/AI-Commit-Assistant",
                    "X-Title": "GitMind"
                }
            }, { provider: "openrouter", operation: "models.list" });

            if (!response.ok) {
                // Handle specific OpenRouter API errors
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
                    case 429:
                        errorMessage = "Rate limit exceeded - please try again later";
                        break;
                    case 500:
                        errorMessage = "Internal server error - OpenRouter service issue";
                        break;
                    case 502:
                        errorMessage = "Bad gateway - OpenRouter service temporarily unavailable";
                        break;
                    case 503:
                        errorMessage = "Service unavailable - OpenRouter service temporarily down";
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

            // OpenRouter returns models in data.data array
            if (!data.data || !Array.isArray(data.data)) {
                debugLog("Unexpected OpenRouter models response format:", data);
                throw new Error("Expected data.data array from OpenRouter models API");
            }

            // Filter models that are available and have reasonable pricing
            const models = data.data
                .filter((model: any) =>
                    model.id &&
                    model.pricing &&
                    (model.pricing.prompt !== undefined || model.pricing.completion !== undefined) // Has pricing (available)
                )
                .map((model: any) => model.id)
                .sort();

            debugLog("Available OpenRouter models:", models);
            return models;
        } catch (error) {
            debugLog("Failed to fetch OpenRouter models:", error);
            throw error;
        }
    }

    async validateApiKey(): Promise<boolean> {
        try {
            const response = await loggedFetch("https://openrouter.ai/api/v1/models", {
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "HTTP-Referer": "https://github.com/shahabahreini/AI-Commit-Assistant",
                    "X-Title": "GitMind"
                }
            }, { provider: "openrouter", operation: "models.validate" });
            return response.ok;
        } catch (error) {
            debugLog("OpenRouter API validation error:", error);
            return false;
        }
    }

    /**
     * Cleans up and formats the commit message returned by the API
     */
    private formatCommitMessage(message: string): string {
        // Remove any "Git Commit Message:" or similar prefixes
        let formattedMessage = message.replace(/^(git commit message:?|commit message:?)/i, '').trim();

        // Remove any quotes that might wrap the message
        formattedMessage = formattedMessage.replace(/^["']|["']$/g, '');

        return formattedMessage;
    }
}

/**
 * Backward compatibility functions
 */
export async function callOpenRouterAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    const provider = new OpenRouterProvider(apiKey, model);
    return provider.generateCommitMessage(diff, customContext);
}

export async function fetchOpenRouterModels(apiKey: string): Promise<string[]> {
    const provider = new OpenRouterProvider(apiKey, "");
    return provider.getModels();
}
