// src/services/api/inception.ts
import { debugLog } from "../debug/logger";
import { APIErrorHandler } from "../../utils/errorHandler";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";
import { ProviderApiError } from "./recovery";
import { stripThinking } from "./nvidia";
import { PROVIDER_CATALOG } from "../../config/providerCatalog";

export const INCEPTION_BASE_URL = "https://api.inceptionlabs.ai";

const NON_CHAT_MARKERS = [
    "decide", "fim", "edit", "embed", "embedding", "rerank",
];

export function filterInceptionModels(raw: unknown): string[] {
    if (!raw || typeof raw !== "object") {
        return [];
    }

    const modelNames: string[] = [];
    const withData = raw as { data?: unknown };

    if (Array.isArray(withData.data)) {
        for (const item of withData.data) {
            if (item && typeof item === "object") {
                const modelObj = item as { id?: unknown; supported_endpoints?: unknown };
                const id = typeof modelObj.id === "string" ? modelObj.id.trim() : "";
                if (!id) {
                    continue;
                }

                // Check endpoints if available
                const endpoints = Array.isArray(modelObj.supported_endpoints)
                    ? modelObj.supported_endpoints.filter((e): e is string => typeof e === "string")
                    : [];

                const isChatCompatible = endpoints.length === 0 || endpoints.includes("chat.completions");
                const hasNonChatMarker = NON_CHAT_MARKERS.some(marker => id.toLowerCase().includes(marker));

                if (isChatCompatible && !hasNonChatMarker) {
                    modelNames.push(id);
                }
            }
        }
    }

    return [...new Set(modelNames)].sort((a, b) => a.localeCompare(b));
}

export function parseInceptionError(status: number, text: string): ProviderApiError {
    let errorMessage = "Unknown error";
    let code: string | undefined;
    try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.error?.message || errorData.error || errorData.message || errorData.code || "Unknown error";
        code = errorData.error?.code || errorData.code;
    } catch {
        if (text && text.trim()) {
            errorMessage = text.trim();
        }
    }

    if (status === 401) {
        return new ProviderApiError(
            "Invalid API key. Please check your Inception Labs API key at https://platform.inceptionlabs.ai.",
            { status, code, provider: "inception", category: "authentication", userFacing: true }
        );
    }
    if (status === 403) {
        return new ProviderApiError(
            `Inception Labs access forbidden: ${errorMessage}. Check your account access and key permissions at https://platform.inceptionlabs.ai.`,
            { status, code, provider: "inception", category: "permission", userFacing: true }
        );
    }
    if (status === 404) {
        return new ProviderApiError(
            `Inception Labs model not found: ${errorMessage}. The selected model may not exist or may have been renamed. Check your model selection or click 'Load Available Models'.`,
            { status, code, provider: "inception", category: "model-limit", userFacing: true }
        );
    }
    if (status === 429) {
        return new ProviderApiError(
            `Inception Labs rate limit exceeded: ${errorMessage}. Please wait and try again.`,
            { status, code, provider: "inception", category: "rate-limit", userFacing: true }
        );
    }
    if (status === 400) {
        return new ProviderApiError(
            `Inception Labs bad request: ${errorMessage}. Please verify your model selection and parameters.`,
            { status, code, provider: "inception", category: "configuration", userFacing: true }
        );
    }
    if (status >= 500) {
        return new ProviderApiError(
            `Inception Labs server error (${status}): ${errorMessage}. Please try again later.`,
            { status, code, provider: "inception", category: "temporary-service", userFacing: true }
        );
    }
    return new ProviderApiError(
        `Inception Labs API error (${status}): ${errorMessage}`,
        { status, code, provider: "inception", userFacing: true }
    );
}

export class InceptionProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const controller = this.getAbortController();

        debugLog(`Making API call to Inception Labs with model: ${this.model}`);

        try {
            const response = await loggedFetch(`${INCEPTION_BASE_URL}/v1/chat/completions`, {
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
                    max_tokens: options?.maxTokens ?? 1024,
                    temperature: options?.temperature ?? 0.2,
                }),
                signal: controller.signal,
            }, { provider: "inception", operation: "chat.completions" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Inception Labs API error: ${response.status} - ${errorText}`);
                throw parseInceptionError(response.status, errorText);
            }

            const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
            const message = data.choices?.[0]?.message?.content;
            if (!message) {
                debugLog("Unexpected Inception Labs API response shape:", data);
                throw new ProviderApiError("No valid response from Inception Labs API", {
                    status: response.status,
                    provider: "inception",
                    category: "invalid-response"
                });
            }

            debugLog("Inception Labs API response received successfully");
            return this.enforceCommitMessageFormat(stripThinking(message).trim());
        } catch (error) {
            debugLog(`Inception Labs API call failed: ${error}`);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }
            if (error instanceof ProviderApiError) {
                throw error;
            }
            const errorInfo = APIErrorHandler.handleAPIError(error as Error, "inception");
            throw new Error(errorInfo.userMessage);
        }
    }

    async getModels(): Promise<string[]> {
        const curatedFallback = PROVIDER_CATALOG.inception?.curatedModels
            ? [...PROVIDER_CATALOG.inception.curatedModels]
            : ["mercury-2.5", "mercury-2"];

        try {
            debugLog("Fetching Inception Labs models from API...");

            const response = await loggedFetch(`${INCEPTION_BASE_URL}/v1/models`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    Accept: "application/json"
                }
            }, { provider: "inception", operation: "models.list" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Inception Labs models API error: ${response.status} - ${errorText}`);
                throw parseInceptionError(response.status, errorText);
            }

            const data = await response.json();
            debugLog("Inception Labs API response:", data);

            const filtered = filterInceptionModels(data);
            debugLog(`Successfully filtered ${filtered.length} Inception Labs models:`, filtered);

            return filtered.length > 0 ? filtered : curatedFallback;
        } catch (error) {
            debugLog("Error fetching Inception Labs models, using curated fallback:", error);
            if (error instanceof ProviderApiError && error.category === "authentication") {
                throw error;
            }
            return curatedFallback;
        }
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
        return validateInceptionAPIKey(this.apiKey);
    }
}

/**
 * Validates an Inception Labs API key by making a request to the models endpoint
 */
export async function validateInceptionAPIKey(
    apiKey: string
): Promise<{ success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
    try {
        const response = await loggedFetch(`${INCEPTION_BASE_URL}/v1/models`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: "application/json",
            },
        }, { provider: "inception", operation: "validate.models" });

        if (response.ok) {
            return { success: true };
        }

        const errorText = await response.text();
        let errorMessage = `Inception Labs API error (${response.status})`;

        try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
                errorMessage = errorData.error.message;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData.error) {
                errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
            }
        } catch {
            if (errorText) {
                errorMessage = errorText;
            }
        }

        if (response.status === 401) {
            debugLog("Inception Labs API key validation: 401 Unauthorized - Invalid API key");
            return {
                success: false,
                error: "Invalid API key",
                troubleshooting: "Please check that your Inception Labs API key is correct and active. Get a key at https://platform.inceptionlabs.ai"
            };
        }

        if (response.status === 403) {
            debugLog("Inception Labs API key validation: 403 Forbidden");
            return {
                success: false,
                error: errorMessage,
                troubleshooting: "Access forbidden. Please check your account status and key permissions at https://platform.inceptionlabs.ai"
            };
        }

        if (response.status === 429) {
            debugLog("Inception Labs API key validation: 429 Too Many Requests - Rate limited, API key appears valid");
            return { success: true };
        }

        if (response.status === 400 || response.status === 404 || response.status === 405 || response.status === 422) {
            debugLog(`Inception Labs API key validation: ${response.status} - Request issue, API key appears valid`);
            return { success: true };
        }

        if (response.status >= 500) {
            debugLog(`Inception Labs API key validation: ${response.status} - Server error`);
            return {
                success: false,
                error: `Inception Labs server error (${response.status})`,
                troubleshooting: "Inception Labs servers are experiencing issues. Please try again later."
            };
        }

        debugLog(`Inception Labs API key validation: ${response.status} - Unknown status code`);
        return {
            success: false,
            error: `Inception Labs API error (${response.status})`,
            troubleshooting: "Please check your API key configuration at https://platform.inceptionlabs.ai"
        };
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            debugLog("Inception Labs API key validation: Request aborted");
            return {
                success: false,
                error: "Request aborted",
                troubleshooting: "The API request was cancelled. Please try again"
            };
        }
        debugLog(`Inception Labs API key validation failed with network error: ${error}`);
        return {
            success: false,
            error: "Network error",
            troubleshooting: "Unable to connect to Inception Labs. Please check your internet connection and try again"
        };
    }
}

export async function fetchInceptionModels(apiKey: string): Promise<string[]> {
    const provider = new InceptionProvider(apiKey, "");
    return provider.getModels();
}
