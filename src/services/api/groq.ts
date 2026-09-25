import { debugLog } from "../debug/logger";
import { RequestManager } from "../../utils/requestManager";
import { APIErrorHandler } from "../../utils/errorHandler";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";
import { ProviderApiError } from "./recovery";
import { stripThinking } from "./nvidia";
import { PROVIDER_CATALOG } from "../../config/providerCatalog";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const NON_CHAT_MARKERS = [
    "whisper", "orpheus", "tts", "guard", "safeguard", "rerank", "reranker",
    "embed", "embedding", "clip", "vision", "moderation",
];

export function filterGroqChatModels(models: unknown): string[] {
    if (!Array.isArray(models)) {
        return [];
    }

    return [...new Set(models
        .filter(model => typeof model === "object" && model !== null && (model as { active?: unknown }).active !== false)
        .map(model => typeof model === "object" && model !== null && "id" in model ? (model as { id?: unknown }).id : undefined)
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        .map(id => id.trim())
        .filter(id => !NON_CHAT_MARKERS.some(marker => id.toLowerCase().includes(marker))))]
        .sort((a, b) => a.localeCompare(b));
}

export function parseGroqError(status: number, text: string): ProviderApiError {
    let errorMessage = "Unknown error";
    let code: string | undefined;
    try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.error?.message || errorData.error || errorData.code || "Unknown error";
        code = errorData.error?.code || errorData.code;
    } catch {
        if (text && text.trim()) {
            errorMessage = text.trim();
        }
    }

    if (status === 401) {
        return new ProviderApiError(
            "Invalid API key. Please check your Groq API key configuration at https://console.groq.com/keys.",
            { status, code, provider: "groq", category: "authentication", userFacing: true }
        );
    }
    if (status === 403) {
        return new ProviderApiError(
            `Groq access forbidden: ${errorMessage}. Check your Groq API key permissions at https://console.groq.com.`,
            { status, code, provider: "groq", category: "permission", userFacing: true }
        );
    }
    if (status === 404) {
        return new ProviderApiError(
            `Groq model not found: ${errorMessage}. The selected model may have been decommissioned or renamed. Check your model selection or use Load Models to refresh.`,
            { status, code, provider: "groq", category: "model-limit", userFacing: true }
        );
    }
    if (status === 429) {
        return new ProviderApiError(
            `Groq rate limit exceeded: ${errorMessage}. Please wait and try again.`,
            { status, code, provider: "groq", category: "rate-limit", userFacing: true }
        );
    }
    if (status === 400) {
        return new ProviderApiError(
            `Groq bad request: ${errorMessage}. Please verify your model selection and parameters.`,
            { status, code, provider: "groq", category: "configuration", userFacing: true }
        );
    }
    if (status >= 500) {
        return new ProviderApiError(
            `Groq server error (${status}): ${errorMessage}. Please try again later.`,
            { status, code, provider: "groq", category: "temporary-service", userFacing: true }
        );
    }
    return new ProviderApiError(
        `Groq API error (${status}): ${errorMessage}`,
        { status, code, provider: "groq", userFacing: true }
    );
}

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
                    max_completion_tokens: options?.maxTokens ?? 1000,
                    temperature: options?.temperature ?? 0.2,
                }),
                signal: controller.signal,
            }, { provider: "groq", operation: "chat.completions" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Groq API error: ${response.status} - ${errorText}`);
                throw parseGroqError(response.status, errorText);
            }

            const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };

            // OpenAI-compatible response format
            const message = data.choices?.[0]?.message?.content;
            if (!message) {
                debugLog("Unexpected Groq API response shape:", data);
                throw new ProviderApiError("No valid response from Groq API", { status: response.status, provider: "groq", category: "invalid-response" });
            }

            debugLog(`Groq API response received successfully`);
            return this.enforceCommitMessageFormat(stripThinking(message).trim());
        } catch (error) {
            debugLog(`Groq API call failed: ${error}`);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }
            if (error instanceof ProviderApiError) {
                throw error;
            }
            const errorInfo = APIErrorHandler.handleAPIError(error as Error, "groq");
            throw new Error(errorInfo.userMessage);
        }
    }

    async getModels(): Promise<string[]> {
        const curatedFallback = PROVIDER_CATALOG.groq?.curatedModels
            ? [...PROVIDER_CATALOG.groq.curatedModels]
            : ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"];

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
                throw parseGroqError(response.status, errorText);
            }

            const data = await response.json() as { data?: unknown };
            debugLog("Groq API response:", data);

            if (!data.data || !Array.isArray(data.data)) {
                debugLog("Invalid response structure - missing or invalid 'data' array");
                return curatedFallback;
            }

            const chatModels = filterGroqChatModels(data.data);
            debugLog(`Successfully filtered ${chatModels.length} Groq chat models:`, chatModels);

            return chatModels.length > 0 ? chatModels : curatedFallback;
        } catch (error) {
            debugLog("Error fetching Groq models, using curated fallback:", error);
            if (error instanceof ProviderApiError && error.category === "authentication") {
                throw error;
            }
            return curatedFallback;
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
