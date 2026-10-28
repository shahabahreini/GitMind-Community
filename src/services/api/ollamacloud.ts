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
                // Models that report capabilities but cannot complete text (e.g. decision models) reject chat requests.
                const capabilities = (item as { capabilities?: unknown }).capabilities;
                if (Array.isArray(capabilities) && !capabilities.includes("completion")) { continue; }
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

export interface OllamaModelDetails {
    contextTokens?: number;
    /** Ollama Cloud enforces a per-model output maximum it reports only in a rejection message. */
    maxOutputTokens?: number;
    thinkingValues?: Array<string | boolean>;
    capabilities?: string[];
}

/** Reads the limits and thinking levels Ollama's /api/show reports for one model. */
export function parseOllamaModelDetails(raw: unknown): OllamaModelDetails {
    const data = raw && typeof raw === "object" ? raw as { model_info?: Record<string, unknown>; thinking?: { values?: unknown }; capabilities?: unknown } : {};
    const contextEntry = Object.entries(data.model_info ?? {}).find(([key, value]) => key.endsWith(".context_length") && typeof value === "number" && Number.isSafeInteger(value) && value > 0);
    const values = Array.isArray(data.thinking?.values) ? data.thinking.values.filter((value): value is string | boolean => typeof value === "string" || typeof value === "boolean") : undefined;
    return {
        contextTokens: contextEntry ? contextEntry[1] as number : undefined,
        thinkingValues: values,
        capabilities: Array.isArray(data.capabilities) ? data.capabilities.filter((value): value is string => typeof value === "string") : undefined,
    };
}

const THINKING_LEVELS = ["low", "medium", "high", "xhigh", "max"];

/**
 * Lowest thinking the model supports, in Ollama's native `think` form: false when it can be turned off,
 * otherwise its lowest named level. Undefined leaves the model default, so a model that does not think is never switched on.
 */
export function chooseOllamaThinking(values: ReadonlyArray<string | boolean> | undefined): false | string | undefined {
    if (!values || values.length === 0) { return undefined; }
    if (values.includes(false)) { return false; }
    return THINKING_LEVELS.find(level => values.includes(level));
}

/** The same choice as an OpenAI-compatible `reasoning_effort`, where "none" requests false. */
export function ollamaReasoningEffort(values: ReadonlyArray<string | boolean> | undefined): string | undefined {
    const choice = chooseOllamaThinking(values);
    return choice === false ? "none" : choice;
}

const modelDetailsCache = new Map<string, OllamaModelDetails>();

/** Reads the real output maximum from Ollama Cloud's rejection, e.g. "max_tokens (1041414) exceeds model's maximum output tokens (131072)". */
export function reportedMaxOutputTokens(message: string): number | undefined {
    const match = /maximum output tokens \((\d+)\)/i.exec(message);
    const value = match ? Number(match[1]) : NaN;
    return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

/** One bounded /api/show lookup per server and model; failures are not cached so the next request retries. */
export async function fetchOllamaModelDetails(baseUrl: string, model: string, headers: Record<string, string>, signal: AbortSignal | undefined, provider: "ollama" | "ollamacloud"): Promise<OllamaModelDetails | undefined> {
    const key = `${baseUrl}\u0000${model}`;
    const cached = modelDetailsCache.get(key);
    if (cached) { return cached; }
    const bounded = signal ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000);
    try {
        const response = await loggedFetch(`${baseUrl}/api/show`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ model }),
            signal: bounded,
        }, { provider, operation: "models.show" });
        if (!response.ok) {
            if (provider === "ollamacloud" && [401, 403, 429].includes(response.status)) {
                throw parseOllamaCloudError(response.status, await response.text());
            }
            return undefined;
        }
        const details = parseOllamaModelDetails(await response.json());
        modelDetailsCache.set(key, details);
        return details;
    } catch (error) {
        if (signal?.aborted || (error instanceof ProviderApiError && ["authentication", "permission", "rate-limit"].includes(error.category ?? ""))) { throw error; }
        debugLog(`Ollama model details unavailable for ${model}:`, error);
        return undefined;
    }
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
    if (status === 400 && /prompt is too long|maximum context length|context length exceeded/i.test(errorMessage)) {
        return new ProviderApiError(
            `Ollama Cloud prompt is too long for the model: ${errorMessage}`,
            { status, code, provider: "ollamacloud", category: "input-limit", userFacing: true }
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

    private reasoningEffort?: string;
    private details?: OllamaModelDetails;

    /** Every request uses the selected model's real context and its lowest thinking level, whatever the diff size. */
    override async prepareCapabilities(context?: RequestContext): Promise<void> {
        const details = await fetchOllamaModelDetails(OLLAMA_CLOUD_BASE_URL, this.model, { Authorization: `Bearer ${this.apiKey}` }, context?.signal, "ollamacloud");
        this.details = details;
        this.reasoningEffort = ollamaReasoningEffort(details?.thinkingValues);
        // The answer may use whatever context the prompt leaves, up to the model's output maximum once the server has reported it.
        this.rememberModelLimits(this.model, details?.contextTokens ?? 131072, details?.maxOutputTokens, false, true);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const controller = this.getAbortController();

        debugLog(`Making API call to Ollama Cloud with model: ${this.model}`);

        const send = (maxTokens: number | undefined) => loggedFetch(`${OLLAMA_CLOUD_BASE_URL}/v1/chat/completions`, {
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
                ...(maxTokens ? { max_tokens: maxTokens } : {}),
                ...(this.reasoningEffort ? { reasoning_effort: this.reasoningEffort } : {}),
                temperature: options?.temperature ?? 0.2,
            }),
            signal: controller.signal,
        }, { provider: "ollamacloud", operation: "chat.completions" });

        try {
            let response: Response;
            try {
                response = await send(options?.maxTokens);
            } catch (error) {
                // The output maximum is not in /api/show; learn it from the rejection once, then retry within it.
                const maxOutput = error instanceof Error ? reportedMaxOutputTokens(error.message) : undefined;
                if (!maxOutput || !options?.maxTokens || options.maxTokens <= maxOutput) { throw error; }
                if (this.details) { this.details.maxOutputTokens = maxOutput; }
                this.rememberModelLimits(this.model, this.getCapabilities().contextTokens, maxOutput, false, true);
                response = await send(maxOutput);
            }

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
        const curatedFallback = [...(PROVIDER_CATALOG.ollamacloud?.curatedModels ?? [])];

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

            // Limits come from /api/show for the selected model in prepareCapabilities.
            return filtered.length > 0 ? filtered : curatedFallback;
        } catch (error) {
            debugLog("Error fetching Ollama Cloud models, using curated fallback:", error);
            if (error instanceof ProviderApiError && error.category === "authentication") {
                throw error;
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
