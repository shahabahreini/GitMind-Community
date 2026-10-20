import { ProviderApiError } from "./recovery";
import { estimateByteTokens } from "../git/diffDigest";

export interface ModelCapabilities {
    contextTokens: number;
    outputTokens: number;
    /** No trustworthy selected-model limit was available. */
    isUnknown?: boolean;
    /** Runtime input-only limit, when the provider reports it separately. */
    maxInputTokens?: number;
    /** Output maximum the provider reported for the model; `outputTokens` stays the commit reservation. */
    maxOutputTokens?: number;
    supportedOptions: readonly string[];
    countTokens: (text: string) => number;
    countTokensAsync?: (text: string) => PromiseLike<number>;
}

/** Diffs above this size ask the provider for the selected model's real limits first. */
export const UNKNOWN_MODEL_PROBE_BYTES = 64 * 1024;
/** Default prompt size, in estimated tokens, for models without a verified limit and for condensed diffs. */
export const DEFAULT_PROMPT_TOKEN_CAP = 60_000;
/** Local servers commonly run small contexts, so they start lower. */
export const LOCAL_PROMPT_TOKEN_CAP = 6_000;
export const MIN_PROMPT_TOKENS = 4_000;
/** Output budget for long-form answers (changelog, history analysis) when the model reports no maximum. */
export const LONG_FORM_OUTPUT_TOKENS = 8_192;
/** Upper bound when the model reports a larger maximum; reasoning models spend part of it thinking. */
export const LONG_FORM_MAX_OUTPUT_TOKENS = 16_384;
export const LONG_FORM_TIMEOUT_MS = 180_000;
export function defaultPromptTokenCap(provider: string): number {
    return provider === "ollama" || provider === "lmstudio" ? LOCAL_PROMPT_TOKEN_CAP : DEFAULT_PROMPT_TOKEN_CAP;
}

/** Bounds a direct request to a model whose limit is unknown; the provider may still reject it. */
export function directProbeBudget(capabilities: ModelCapabilities, cap = DEFAULT_PROMPT_TOKEN_CAP): number {
    return capabilities.isUnknown ? cap
        : Math.min(512 * 1024, Math.max(UNKNOWN_MODEL_PROBE_BYTES, effectiveInputBudget(capabilities) * 4));
}

export function effectiveInputBudget(capabilities: ModelCapabilities): number {
    return capabilities.maxInputTokens ?? Math.max(0, capabilities.contextTokens - capabilities.outputTokens - 256);
}

/** Batched requests probe unknown models with bounded windows; provider input-limit errors still split them. */
export function batchInputBudget(capabilities: ModelCapabilities): number {
    return capabilities.isUnknown ? Math.max(directProbeBudget(capabilities), effectiveInputBudget(capabilities)) : effectiveInputBudget(capabilities);
}

export async function assertBatchPromptFits(prompt: string, capabilities: ModelCapabilities): Promise<void> {
    if (await countPromptTokens(prompt, capabilities) > batchInputBudget(capabilities)) {
        throw new ProviderApiError("Prompt exceeds the model input budget. Shorten custom context or choose a larger-context model.", { category: "input-limit" });
    }
}

/** UTF-8 bytes bound token usage conservatively for unknown tokenizers. */
export function conservativeTokenCount(text: string): number {
    return Buffer.byteLength(text, "utf8");
}

/**
 * Prompt size used to choose between direct, condensed, and batched generation.
 * Counting every byte as a token over-counts code 3-4x, so single-call decisions use
 * the byte heuristic unless the provider has an exact tokenizer.
 */
export async function measurePrompt(prompt: string, capabilities: ModelCapabilities): Promise<number> {
    return capabilities.countTokensAsync ? countPromptTokens(prompt, capabilities) : estimateByteTokens(Buffer.byteLength(prompt, "utf8"));
}

// Verified 2026-10-04: https://platform.claude.com/docs/en/models/overview
// https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
// https://docs.mistral.ai/models/mistral-small-4-0-26-03
// https://docs.cohere.com/docs/command-a
// Output values below are generation reservations, not advertised output maxima.
const VERIFIED_LIMITS: Record<string, [number, number]> = {
    "command-a-03-2025": [256000, 1024],
    "gemini-3.8-flash": [1048576, 4096],
    "mistral-small-2603": [256000, 1024],
    "claude-fable-5-1": [1000000, 8000],
    "claude-opus-5-5": [1000000, 8000],
    "claude-sonnet-5-5": [1000000, 1000],
    "claude-haiku-4-5": [200000, 1000],
    "claude-haiku-4-5-20251001": [200000, 1000],
    "mercury-3": [1000000, 4096],
    "mercury-2.5": [128000, 4096],
    "mercury-2": [128000, 4096],
    "gpt-oss:120b-cloud": [131072, 4096],
    "gpt-oss:20b-cloud": [131072, 4096],
    "qwen3-coder:480b-cloud": [131072, 4096],
    "deepseek-v3.1:671b-cloud": [131072, 8192],
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
