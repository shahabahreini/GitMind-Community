import { ProviderApiError } from "./recovery";
import { estimateByteTokens } from "../git/diffDigest";
import { PROVIDER_CATALOG, ProviderCatalogEntry } from "../../config/providerCatalog";
import type { ApiProvider } from "../../config/types";

export interface ModelCapabilities {
    contextTokens: number;
    outputTokens: number;
    /** No trustworthy selected-model limit was available. */
    isUnknown?: boolean;
    /** Runtime input-only limit, when the provider reports it separately. */
    maxInputTokens?: number;
    /** Output maximum the provider reported for the model; `outputTokens` stays the commit reservation. */
    maxOutputTokens?: number;
    /** The answer may use whatever context the prompt leaves (Ollama caps output at the context length). */
    outputUsesRemainingContext?: boolean;
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
/**
 * Output budget for a model whose real limit is unknown, used only by APIs that require the field or whose
 * documented default when it is omitted is too small for a thinking model (e.g. Cloudflare's 256).
 */
export const UNKNOWN_LIMIT_OUTPUT_TOKENS = 16_384;
/** Context held back for the answer (thinking plus message) when sizing the prompt; never caps the answer itself. */
export const ANSWER_RESERVE_TOKENS = 16_384;
export const LONG_FORM_TIMEOUT_MS = 180_000;
/** Providers without per-token billing default to the model's real input limit once it is known. */
export function defaultPromptTokenCap(provider: string, capabilities?: ModelCapabilities): number {
    if (capabilities && !capabilities.isUnknown && (PROVIDER_CATALOG[provider as ApiProvider] as ProviderCatalogEntry | undefined)?.realPromptLimit) {
        return Math.max(MIN_PROMPT_TOKENS, effectiveInputBudget(capabilities));
    }
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

/** Code diffs measure about 3.9 UTF-8 bytes per token; 3 keeps a margin, and provider input-limit errors still split. */
export function conservativeTokenCount(text: string): number {
    return Math.ceil(Buffer.byteLength(text, "utf8") / 3);
}

/**
 * Prompt size used to choose between direct, condensed, and batched generation.
 * Counting every byte as a token over-counts code 3-4x, so single-call decisions use
 * the byte heuristic unless the provider has an exact tokenizer.
 */
export async function measurePrompt(prompt: string, capabilities: ModelCapabilities): Promise<number> {
    return capabilities.countTokensAsync ? countPromptTokens(prompt, capabilities) : estimateByteTokens(Buffer.byteLength(prompt, "utf8"));
}

// Real [context window, maximum output] from official model documentation, verified 2026-10-28.
// Sources per value: docs/research/provider-models-2026-10.md. Provider metadata, when reported, takes precedence.
// Models with no documented maximum output are deliberately absent: their adapters omit the field or discover limits.
const VERIFIED_LIMITS: Record<string, [number, number]> = {
    // OpenAI (https://developers.openai.com/api/docs/models)
    "gpt-6.1-sol": [1050000, 128000],
    "gpt-6.1-terra": [1050000, 128000],
    "gpt-6-sol": [1050000, 128000],
    "gpt-6-luna": [1050000, 128000],
    "gpt-6-astra": [1050000, 128000],
    "gpt-5.6-sol": [1050000, 128000],
    "gpt-5.6-terra": [1050000, 128000],
    "gpt-5.6-luna": [1050000, 128000],
    // Anthropic (https://platform.claude.com/docs/en/about-claude/models/overview)
    "claude-sonnet-5": [1000000, 128000],
    "claude-sonnet-5-5": [1000000, 128000],
    "claude-opus-5-5": [1000000, 128000],
    "claude-fable-5-1": [1000000, 128000],
    "claude-haiku-5-5": [1000000, 128000],
    "claude-haiku-4-5": [200000, 64000],
    "claude-haiku-4-5-20251001": [200000, 64000],
    // Gemini (https://ai.google.dev/gemini-api/docs/models)
    "gemini-3.8-flash": [1048576, 65536],
    "gemini-3.6-flash": [1048576, 65536],
    "gemini-3.5-flash-lite": [1048576, 65536],
    "gemini-3.1-flash-lite": [1048576, 65536],
    "gemini-3.1-pro-preview": [1048576, 65536],
    // Cohere (https://docs.cohere.com/docs/models)
    "command-a-plus-05-2026": [128000, 64000],
    "north-mini-code-1.0": [256000, 64000],
    "command-a-reasoning-08-2025": [256000, 32000],
    "command-a-03-2025": [256000, 8000],
    // Z.ai (https://docs.z.ai/guides/llm)
    "glm-5.3": [1000000, 128000],
    "glm-5.3-flash": [1000000, 128000],
    "glm-5.3-flashx": [1000000, 128000],
    "glm-5.2": [1000000, 128000],
    "glm-5.1": [200000, 128000],
    "glm-5": [200000, 128000],
    "glm-4.7": [200000, 128000],
    "glm-4.7-flashx": [200000, 128000],
    "glm-4.7-flash": [200000, 128000],
    "glm-4.6": [200000, 128000],
    "glm-4.5": [128000, 96000],
    "glm-4.5-air": [128000, 96000],
    "glm-4.5-flash": [128000, 96000],
    // MiniMax (https://platform.minimax.io/docs/api-reference/text-chat-openai)
    "MiniMax-M3": [1000000, 131072],
    // Inception (https://docs.inceptionlabs.ai/api-reference/chat/create-a-chat-completion)
    "mercury-3": [1000000, 131072],
    "mercury-2.5": [260000, 65536],
    "mercury-2": [128000, 50000],
    // NVIDIA hosted NIM; /v1/models reports no limits (https://docs.api.nvidia.com/nim/reference)
    "nvidia/nemotron-3-super-120b-a12b": [256000, 32768],
    "openai/gpt-oss-20b": [131072, 4096],
    "moonshotai/kimi-k3": [1048576, 65536],
    // DeepSeek (https://api-docs.deepseek.com/api/create-chat-completion)
    "deepseek-flash": [1000000, 393216],
    "deepseek-v4-pro": [1000000, 393216],
};
export function modelCapabilities(model: string): ModelCapabilities {
    const verified = VERIFIED_LIMITS[model];
    return {
        contextTokens: verified?.[0] ?? 4096,
        outputTokens: verified ? answerReservation(verified[0], verified[1]) : 1024,
        maxOutputTokens: verified?.[1],
        isUnknown: !verified,
        supportedOptions: ["maxTokens"],
        countTokens: conservativeTokenCount,
    };
}

/** Context kept free for the answer when sizing prompts: the real maximum, bounded so small contexts keep room for input. */
export function answerReservation(contextTokens: number, maxOutputTokens?: number): number {
    return Math.max(256, Math.min(maxOutputTokens ?? ANSWER_RESERVE_TOKENS, ANSWER_RESERVE_TOKENS, Math.floor(contextTokens / 4)));
}

/**
 * Output budget from the model's real limits: its maximum output, bounded by the context the prompt leaves.
 * Undefined means no trustworthy limit is known, so adapters omit the field and the provider applies its own maximum.
 */
export function realOutputLimit(capabilities: ModelCapabilities, promptTokens: number): number | undefined {
    if (capabilities.isUnknown) { return undefined; }
    const cap = capabilities.maxOutputTokens ?? (capabilities.outputUsesRemainingContext ? capabilities.contextTokens : undefined);
    if (cap === undefined) { return undefined; }
    if (capabilities.maxInputTokens !== undefined) { return cap; }
    return Math.max(256, Math.min(cap, capabilities.contextTokens - promptTokens - 256));
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
