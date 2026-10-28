import { debugLog } from "../debug/logger";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";
import { ProviderApiError } from "./recovery";
import { getProviderDefaultModel } from "../../config/providerCatalog";
import { RequestContext } from "./requestContext";
import { UNKNOWN_LIMIT_OUTPUT_TOKENS } from "./capabilities";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_MODELS = [
    "nvidia/nemotron-3-super-120b-a12b",
    "openai/gpt-oss-20b",
    "deepseek-ai/deepseek-v4.1-flash",
    "z-ai/glm-5.3-flash",
    "moonshotai/kimi-k3",
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

/** Nemotron 3 models enable reasoning by default (NVIDIA NIM docs); thinking can be turned off per request. */
export function isNemotronReasoningModel(model: string): boolean {
    return /^nvidia\/nemotron-3/i.test(model);
}

/**
 * Lowest documented reasoning per model. The hosted schema rejects unknown fields, so chat_template_kwargs is not sent;
 * Nemotron 3 documents reasoning_effort "none" (https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-super-120b-a12b, 2026-10-28).
 */
function minimalThinking(model: string): Record<string, unknown> {
    if (isNemotronReasoningModel(model)) { return { reasoning_effort: "none" }; }
    return ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "moonshotai/kimi-k3"].includes(model) ? { reasoning_effort: "low" } : {};
}

/** Removes <think>…</think> traces some hosted models emit in `content`. */
export function stripThinking(text: string): string {
    return text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^[\s\S]*?<\/think>/i, "");
}

export class NvidiaProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    override async prepareCapabilities(context?: RequestContext): Promise<void> {
        await this.discoverLargeModel(context, signal => this.getModels(signal));
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
                    // Some hosted NIM models default to 1024 when the field is omitted, which a thinking model can exhaust.
                    max_tokens: options?.maxTokens ?? UNKNOWN_LIMIT_OUTPUT_TOKENS,
                    ...(options?.topP !== undefined ? { top_p: options.topP } : {}),
                    // Nemotron reasons by default and returns the trace inside `content`; commit messages need only the answer.
                    ...minimalThinking(this.model),
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
            return this.enforceCommitMessageFormat(stripThinking(content).trim());
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw new Error("Request was cancelled");
            }
            throw error;
        }
    }

    async getModels(signal?: AbortSignal): Promise<string[]> {
        try {
            const headers: Record<string, string> = { "Accept": "application/json" };
            if (this.apiKey) {
                headers.Authorization = `Bearer ${this.apiKey}`;
            }
            const response = await loggedFetch(`${NVIDIA_BASE_URL}/models`, { headers, signal }, { provider: "nvidia", operation: "models.list" });
            if (!response.ok) {
                throw parseError(response.status, await response.text());
            }
            const data = await response.json() as { data?: unknown };
            if (Array.isArray(data.data)) {
                for (const model of data.data) {
                    if (typeof model?.id === "string") {
                        this.rememberModelLimits(model.id, model.context_length ?? model.max_model_len, model.max_output_tokens);
                    }
                }
            }
            const models = filterNvidiaChatModels(data.data);
            return models.length > 0 ? models : DEFAULT_MODELS;
        } catch (error) {
            if (signal) { throw error; }
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
    return new NvidiaProvider(apiKey, getProviderDefaultModel("nvidia", "nvidia/nemotron-3-super-120b-a12b")).getModels();
}

export async function validateNvidiaAPIKey(apiKey: string): Promise<boolean | { success: boolean; error?: string; troubleshooting?: string }> {
    return new NvidiaProvider(apiKey, getProviderDefaultModel("nvidia", "nvidia/nemotron-3-super-120b-a12b")).validateApiKey();
}
