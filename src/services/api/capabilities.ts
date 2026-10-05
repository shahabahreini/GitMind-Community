import { ProviderApiError } from "./recovery";

export interface ModelCapabilities {
    contextTokens: number;
    outputTokens: number;
    /** No trustworthy selected-model limit was available. */
    isUnknown?: boolean;
    /** Runtime input-only limit, when the provider reports it separately. */
    maxInputTokens?: number;
    supportedOptions: readonly string[];
    countTokens: (text: string) => number;
    countTokensAsync?: (text: string) => PromiseLike<number>;
}

/** Bounds a direct request when conservative byte counting may overestimate tokens. */
export const UNKNOWN_MODEL_PROBE_BYTES = 64 * 1024;
export function directProbeBudget(capabilities: ModelCapabilities): number {
    return capabilities.isUnknown ? UNKNOWN_MODEL_PROBE_BYTES
        : Math.min(512 * 1024, Math.max(UNKNOWN_MODEL_PROBE_BYTES, effectiveInputBudget(capabilities) * 4));
}

export function effectiveInputBudget(capabilities: ModelCapabilities): number {
    return capabilities.maxInputTokens ?? Math.max(0, capabilities.contextTokens - capabilities.outputTokens - 256);
}

/** UTF-8 bytes bound token usage conservatively for unknown tokenizers. */
export function conservativeTokenCount(text: string): number {
    return Buffer.byteLength(text, "utf8");
}

// Verified 2026-10-04: https://platform.claude.com/docs/en/models/overview
// https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
// https://docs.mistral.ai/models/mistral-small-4-0-26-03
// Output values below are generation reservations, not advertised output maxima.
const VERIFIED_LIMITS: Record<string, [number, number]> = {
    "gemini-3.8-flash": [1048576, 4096],
    "mistral-small-2603": [256000, 1024],
    "claude-fable-5-1": [1000000, 8000],
    "claude-opus-5-5": [1000000, 8000],
    "claude-sonnet-5-5": [1000000, 1000],
    "claude-haiku-4-5": [200000, 1000],
    "claude-haiku-4-5-20251001": [200000, 1000],
};
export function modelCapabilities(model: string): ModelCapabilities {
    return {
        contextTokens: VERIFIED_LIMITS[model]?.[0] ?? 4096,
        outputTokens: VERIFIED_LIMITS[model]?.[1] ?? 1024,
        isUnknown: !VERIFIED_LIMITS[model],
        supportedOptions: ["maxTokens"],
        countTokens: conservativeTokenCount,
    };
}

export function assertPromptFits(prompt: string, capabilities: ModelCapabilities): void {
    // Reserve framing for adapters that wrap the user text in a chat envelope.
    if (capabilities.countTokens(prompt) > effectiveInputBudget(capabilities)) {
        throw new ProviderApiError("Prompt exceeds the model input budget. Shorten custom context or choose a larger-context model.", { category: "input-limit" });
    }
}

export async function countPromptTokens(prompt: string, capabilities: ModelCapabilities): Promise<number> {
    const count = capabilities.countTokensAsync ? await capabilities.countTokensAsync(prompt) : capabilities.countTokens(prompt);
    if (!Number.isSafeInteger(count) || count < 0) {
        throw new ProviderApiError("Model tokenizer returned an invalid token count.", { category: "invalid-response" });
    }
    return count;
}

export async function assertPromptFitsAsync(prompt: string, capabilities: ModelCapabilities): Promise<void> {
    if (await countPromptTokens(prompt, capabilities) > effectiveInputBudget(capabilities)) {
        throw new ProviderApiError("Prompt exceeds the model input budget. Shorten custom context or choose a larger-context model.", { category: "input-limit" });
    }
}

export function answerText(content: unknown): string {
    const text = typeof content === "string" ? content : Array.isArray(content)
        ? content.map(block => {
            if (!block || typeof block !== "object" || block.thought === true) { return ""; }
            return (block.type === undefined || block.type === "text" || block.type === "output_text") && typeof block.text === "string" ? block.text : "";
        }).join("") : "";
    const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*$/gi, "").trim();
    if (!cleaned) {
        throw new ProviderApiError("Provider returned an empty or malformed answer.", { category: "invalid-response" });
    }
    return cleaned;
}
