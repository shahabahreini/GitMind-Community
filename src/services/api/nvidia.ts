import { debugLog } from "../debug/logger";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";
import { ProviderApiError } from "./recovery";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_MODELS = [
    "meta/llama-3.3-70b-instruct",
    "nvidia/nemotron-3-super-120b-a12b",
    "mistralai/mistral-large-3-675b-instruct-2512",
    "qwen/qwen3-coder-480b-a35b-instruct",
];

const NON_CHAT_MARKERS = [
    "embed", "embedding", "retriever", "rerank", "guard", "safety", "reward",
    "parse", "detector", "clip", "deplot", "vision", "multimodal", "translate",
    "vila", "neva", "cosmos", "fuyu", "kosmos",
];

interface NvidiaErrorResponse {
    error?: { message?: string; code?: string };
    message?: string;
}

export function filterNvidiaChatModels(models: unknown): string[] {
    if (!Array.isArray(models)) {
        return [];
    }

    return [...new Set(models
        .map(model => typeof model === "object" && model !== null && "id" in model ? (model as { id?: unknown }).id : undefined)
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        .map(id => id.trim())
        .filter(id => !NON_CHAT_MARKERS.some(marker => id.toLowerCase().includes(marker))))]
        .sort((a, b) => a.localeCompare(b));
}

function parseError(status: number, text: string): ProviderApiError {
    let body: NvidiaErrorResponse | undefined;
    try {
        body = JSON.parse(text) as NvidiaErrorResponse;
    } catch {
        // Keep the raw response as the most useful diagnostic.
    }
    const detail = body?.error?.message || body?.message || text || "Unknown NVIDIA API error";
    const code = body?.error?.code;

    if (status === 401) {
        return new ProviderApiError("NVIDIA API key is invalid or missing. Check the key in Model Settings.", status, code, "nvidia");
    }
    if (status === 403) {
        return new ProviderApiError(`NVIDIA access denied: ${detail}`, status, code, "nvidia");
    }
    if (status === 429) {
        return new ProviderApiError(`NVIDIA request limit reached: ${detail}`, status, code, "nvidia");
    }
    if (status === 404) {
        return new ProviderApiError(`NVIDIA model not found: ${detail}`, status, code, "nvidia");
    }
    if ([500, 502, 503, 504].includes(status)) {
        return new ProviderApiError(`NVIDIA service is temporarily unavailable: ${detail}`, status, code, "nvidia");
    }
    return new ProviderApiError(`NVIDIA API error (${status}): ${detail}`, status, code, "nvidia");
}

export class NvidiaProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        try {
            const response = await loggedFetch(`${NVIDIA_BASE_URL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: options?.temperature ?? 0.2,
                    max_tokens: options?.maxTokens ?? 1000,
                    ...(options?.topP !== undefined ? { top_p: options.topP } : {}),
                }),
                signal: this.getAbortController().signal,
            }, { provider: "nvidia", operation: "chat.completions" });

            if (!response.ok) {
                throw parseError(response.status, await response.text());
            }

            const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
            const content = data.choices?.[0]?.message?.content;
            if (!content) {
                throw new ProviderApiError("NVIDIA returned an invalid chat completion response.", undefined, undefined, "nvidia");
            }
            return this.enforceCommitMessageFormat(content.trim());
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw new Error("Request was cancelled");
            }
            throw error;
        }
    }

    async getModels(): Promise<string[]> {
        try {
            const headers: Record<string, string> = { "Accept": "application/json" };
            if (this.apiKey) {
                headers.Authorization = `Bearer ${this.apiKey}`;
            }
            const response = await loggedFetch(`${NVIDIA_BASE_URL}/models`, { headers }, { provider: "nvidia", operation: "models.list" });
            if (!response.ok) {
                throw parseError(response.status, await response.text());
            }
            const data = await response.json() as { data?: unknown };
            const models = filterNvidiaChatModels(data.data);
            return models.length > 0 ? models : DEFAULT_MODELS;
        } catch (error) {
            debugLog("Failed to fetch NVIDIA models; using curated defaults:", error);
            return DEFAULT_MODELS;
        }
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; troubleshooting?: string }> {
        if (!this.apiKey) {
            return { success: false, error: "NVIDIA API key is required." };
        }
        try {
            await this.generateResponse("Reply with OK.", { maxTokens: 2, temperature: 0 });
            return true;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                troubleshooting: "Create or verify your key at https://build.nvidia.com/models",
            };
        }
    }
}

export async function fetchNvidiaModels(apiKey: string = ""): Promise<string[]> {
    return new NvidiaProvider(apiKey, "meta/llama-3.3-70b-instruct").getModels();
}

export async function validateNvidiaAPIKey(apiKey: string): Promise<boolean | { success: boolean; error?: string; troubleshooting?: string }> {
    return new NvidiaProvider(apiKey, "meta/llama-3.3-70b-instruct").validateApiKey();
}
