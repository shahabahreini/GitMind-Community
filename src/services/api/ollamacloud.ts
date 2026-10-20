// src/services/api/ollamacloud.ts
import { debugLog } from "../debug/logger";
import { RequestManager } from "../../utils/requestManager";
import { APIErrorHandler } from "../../utils/errorHandler";
import { BaseAIProvider, GenerationOptions } from "./base";
import { RequestContext } from "./requestContext";
import { loggedFetch } from "./loggedFetch";
import { ProviderApiError } from "./recovery";
import { stripThinking } from "./nvidia";
import { PROVIDER_CATALOG } from "../../config/providerCatalog";

export const OLLAMA_CLOUD_BASE_URL = "https://ollama.com";

const NON_CHAT_MARKERS = [
    "embed", "embedding", "clip", "rerank", "reranker", "bge",
];

export function filterOllamaCloudModels(raw: unknown): string[] {
    if (!raw || typeof raw !== "object") {
        return [];
    }

    const modelNames: string[] = [];

    // Format 1: Ollama native /api/tags -> { models: [ { name: "...", ... } ] }
    const withModels = raw as { models?: unknown };
    if (Array.isArray(withModels.models)) {
        for (const item of withModels.models) {
            if (item && typeof item === "object") {
                const name = (item as { name?: unknown; model?: unknown }).name ?? (item as { model?: unknown }).model;
                if (typeof name === "string" && name.trim().length > 0) {
                    modelNames.push(name.trim());
                }
            }
        }
    }

    // Format 2: OpenAI-compatible /v1/models -> { data: [ { id: "...", ... } ] }
    const withData = raw as { data?: unknown };
    if (Array.isArray(withData.data)) {
        for (const item of withData.data) {
            if (item && typeof item === "object") {
                const id = (item as { id?: unknown }).id;
                if (typeof id === "string" && id.trim().length > 0) {
                    modelNames.push(id.trim());
                }
            }
        }
    }

    return [...new Set(modelNames)]
        .filter(name => !NON_CHAT_MARKERS.some(marker => name.toLowerCase().includes(marker)))
        .sort((a, b) => a.localeCompare(b));
}

export function parseOllamaCloudError(status: number, text: string): ProviderApiError {
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
            "Invalid API key. Please check your Ollama Cloud API key at https://ollama.com/settings/keys.",
            { status, code, provider: "ollamacloud", category: "authentication", userFacing: true }
        );
    }
    if (status === 403) {
        return new ProviderApiError(
            `Ollama Cloud access forbidden: ${errorMessage}. Check your account access and key permissions at https://ollama.com.`,
            { status, code, provider: "ollamacloud", category: "permission", userFacing: true }
        );
    }
    if (status === 404) {
        return new ProviderApiError(
            `Ollama Cloud model not found: ${errorMessage}. The selected model may not exist or may have been renamed. Check your model selection or click 'Load Available Models'.`,
            { status, code, provider: "ollamacloud", category: "model-limit", userFacing: true }
        );
    }
    if (status === 429) {
        return new ProviderApiError(
            `Ollama Cloud rate limit exceeded: ${errorMessage}. Please wait and try again.`,
            { status, code, provider: "ollamacloud", category: "rate-limit", userFacing: true }
        );
    }
    if (status === 400) {
        return new ProviderApiError(
            `Ollama Cloud bad request: ${errorMessage}. Please verify your model selection and parameters.`,
            { status, code, provider: "ollamacloud", category: "configuration", userFacing: true }
        );
    }
    if (status >= 500) {
        return new ProviderApiError(
            `Ollama Cloud server error (${status}): ${errorMessage}. Please try again later.`,
            { status, code, provider: "ollamacloud", category: "temporary-service", userFacing: true }
        );
    }
    return new ProviderApiError(
        `Ollama Cloud API error (${status}): ${errorMessage}`,
        { status, code, provider: "ollamacloud", userFacing: true }
    );
}

export class OllamaCloudProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    override async prepareCapabilities(context?: RequestContext): Promise<void> {
        await this.discoverLargeModel(context, signal => this.getModels(signal));
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const controller = this.getAbortController();

        debugLog(`Making API call to Ollama Cloud with model: ${this.model}`);

        try {
            const response = await loggedFetch(`${OLLAMA_CLOUD_BASE_URL}/v1/chat/completions`, {
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
                    max_tokens: options?.maxTokens ?? 4096,
                    temperature: options?.temperature ?? 0.2,
                }),
                signal: controller.signal,
            }, { provider: "ollamacloud", operation: "chat.completions" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Ollama Cloud API error: ${response.status} - ${errorText}`);
                throw parseOllamaCloudError(response.status, errorText);
            }

            const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
            const message = data.choices?.[0]?.message?.content;
            if (!message) {
                debugLog("Unexpected Ollama Cloud API response shape:", data);
                throw new ProviderApiError("No valid response from Ollama Cloud API", {
                    status: response.status,
                    provider: "ollamacloud",
                    category: "invalid-response"
                });
            }

            debugLog(`Ollama Cloud API response received successfully`);
            return this.enforceCommitMessageFormat(stripThinking(message).trim());
        } catch (error) {
            debugLog(`Ollama Cloud API call failed: ${error}`);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }
            if (error instanceof ProviderApiError) {
                throw error;
            }
            const errorInfo = APIErrorHandler.handleAPIError(error as Error, "ollamacloud");
            throw new Error(errorInfo.userMessage);
        }
    }

    async getModels(signal?: AbortSignal): Promise<string[]> {
        const curatedFallback = PROVIDER_CATALOG.ollamacloud?.curatedModels
            ? [...PROVIDER_CATALOG.ollamacloud.curatedModels]
            : ["gpt-oss:120b-cloud", "gpt-oss:20b-cloud", "qwen3-coder:480b-cloud", "deepseek-v3.1:671b-cloud"];

        try {
            debugLog("Fetching Ollama Cloud models from API...");

            // First attempt: /api/tags
            let response = await loggedFetch(`${OLLAMA_CLOUD_BASE_URL}/api/tags`, {
                method: "GET",
                signal,
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    Accept: "application/json"
                }
            }, { provider: "ollamacloud", operation: "tags.list" });

            // Fallback attempt to /v1/models if /api/tags 404s
            if (!response.ok && response.status === 404) {
                response = await loggedFetch(`${OLLAMA_CLOUD_BASE_URL}/v1/models`, {
                    method: "GET",
                    signal,
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        Accept: "application/json"
                    }
                }, { provider: "ollamacloud", operation: "models.list" });
            }

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Ollama Cloud models API error: ${response.status} - ${errorText}`);
                throw parseOllamaCloudError(response.status, errorText);
            }

            const data = await response.json();
            debugLog("Ollama Cloud API response:", data);

            const filtered = filterOllamaCloudModels(data);
            debugLog(`Successfully filtered ${filtered.length} Ollama Cloud models:`, filtered);

            const result = filtered.length > 0 ? filtered : curatedFallback;
            for (const name of result) {
                this.rememberModelLimits(name, 131072, 4096);
            }
            return result;
        } catch (error) {
            debugLog("Error fetching Ollama Cloud models, using curated fallback:", error);
            if (error instanceof ProviderApiError && error.category === "authentication") {
                throw error;
            }
            for (const name of curatedFallback) {
                this.rememberModelLimits(name, 131072, 4096);
            }
            return curatedFallback;
        }
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
        return validateOllamaCloudAPIKey(this.apiKey);
    }
}

/**
 * Validates an Ollama Cloud API key by making a request to the tags/models endpoint
 */
export async function validateOllamaCloudAPIKey(
    apiKey: string
): Promise<{ success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
    try {
        let response = await loggedFetch(`${OLLAMA_CLOUD_BASE_URL}/api/tags`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: "application/json",
            },
        }, { provider: "ollamacloud", operation: "validate.tags" });

        if (!response.ok && response.status === 404) {
            response = await loggedFetch(`${OLLAMA_CLOUD_BASE_URL}/v1/models`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    Accept: "application/json",
                },
            }, { provider: "ollamacloud", operation: "validate.models" });
        }

        if (response.ok) {
            return { success: true };
        }

        const errorText = await response.text();
        let errorMessage = `Ollama Cloud API error (${response.status})`;

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
            debugLog("Ollama Cloud API key validation: 401 Unauthorized - Invalid API key");
            return {
                success: false,
                error: "Invalid API key",
                troubleshooting: "Please check that your Ollama Cloud API key is correct and active. Get a key at https://ollama.com/settings/keys"
            };
        }

        if (response.status === 403) {
            debugLog("Ollama Cloud API key validation: 403 Forbidden");
            return {
                success: false,
                error: errorMessage,
                troubleshooting: "Access forbidden. Please check your account status and key permissions at https://ollama.com"
            };
        }

        if (response.status === 429) {
            debugLog("Ollama Cloud API key validation: 429 Too Many Requests - Rate limited, API key appears valid");
            return { success: true };
        }

        if (response.status === 400 || response.status === 404 || response.status === 405 || response.status === 422) {
            debugLog(`Ollama Cloud API key validation: ${response.status} - Request issue, API key appears valid`);
            return { success: true };
        }

        if (response.status >= 500) {
            debugLog(`Ollama Cloud API key validation: ${response.status} - Server error`);
            return {
                success: false,
                error: `Ollama Cloud server error (${response.status})`,
                troubleshooting: "Ollama Cloud servers are experiencing issues. Please try again later."
            };
        }

        debugLog(`Ollama Cloud API key validation: ${response.status} - Unknown status code`);
        return {
            success: false,
            error: `Ollama Cloud API error (${response.status})`,
            troubleshooting: "Please check your API key configuration at https://ollama.com/settings/keys"
        };
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            debugLog("Ollama Cloud API key validation: Request aborted");
            return {
                success: false,
                error: "Request aborted",
                troubleshooting: "The API request was cancelled. Please try again"
            };
        }
        debugLog(`Ollama Cloud API key validation failed with network error: ${error}`);
        return {
            success: false,
            error: "Network error",
            troubleshooting: "Unable to connect to Ollama Cloud. Please check your internet connection and try again"
        };
    }
}

export async function fetchOllamaCloudModels(apiKey: string): Promise<string[]> {
    const provider = new OllamaCloudProvider(apiKey, "");
    return provider.getModels();
}
