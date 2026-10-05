import { ApiConfig } from "../../config/types";

export type ProviderErrorCategory =
    | "cancelled"
    | "timeout"
    | "authentication"
    | "permission"
    | "account-limit"
    | "model-limit"
    | "rate-limit"
    | "input-limit"
    | "configuration"
    | "content-filter"
    | "network"
    | "temporary-service"
    | "invalid-response"
    | "unknown";

export type GenerationFailureKind = ProviderErrorCategory;

export interface ProviderApiErrorOptions {
    status?: number;
    code?: string;
    provider?: string;
    category?: ProviderErrorCategory;
    retryAfterMs?: number;
    cause?: unknown;
    /** The message is final, safe, user-facing text; formatters must show it unchanged. */
    userFacing?: boolean;
}

/** A provider-neutral error that retains recovery metadata without response bodies. */
export class ProviderApiError extends Error {
    public readonly status?: number;
    public readonly code?: string;
    public readonly provider?: string;
    public readonly category?: ProviderErrorCategory;
    public readonly retryAfterMs?: number;
    public readonly userFacing: boolean;

    constructor(message: string, options?: ProviderApiErrorOptions);
    /** @deprecated Prefer the options-object overload. */
    constructor(message: string, status?: number, code?: string, provider?: string);
    constructor(
        message: string,
        optionsOrStatus?: ProviderApiErrorOptions | number,
        legacyCode?: string,
        legacyProvider?: string
    ) {
        const options = typeof optionsOrStatus === "object"
            ? optionsOrStatus
            : { status: optionsOrStatus, code: legacyCode, provider: legacyProvider };
        super(message, options.cause === undefined ? undefined : { cause: options.cause });
        this.name = "ProviderApiError";
        this.status = options.status;
        this.code = options.code;
        this.provider = options.provider;
        this.category = options.category;
        this.retryAfterMs = options.retryAfterMs;
        this.userFacing = options.userFacing === true;
    }
}

function readString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === "object" && value !== null ? value as Record<string, unknown> : undefined;
}

function extractStatus(error: unknown, message: string): number | undefined {
    const record = getRecord(error);
    const response = getRecord(record?.response);
    return readNumber(record?.status)
        ?? readNumber(record?.statusCode)
        ?? readNumber(response?.status)
        ?? readNumber(getRecord(record?.$metadata)?.httpStatusCode)
        ?? (() => {
            const match = message.match(/(?:http|api error|error|status)?\s*[:( -]?\s*([45]\d{2})(?:\b|\))/i);
            return match ? Number(match[1]) : undefined;
        })();
}

function extractCode(error: unknown): string | undefined {
    const record = getRecord(error);
    const response = getRecord(record?.response);
    const responseData = getRecord(response?.data);
    const responseError = getRecord(responseData?.error);
    return readString(record?.code) ?? readString(responseError?.code) ?? readString(getRecord(record?.error)?.status) ?? readString(record?.name);
}

export function classifyGenerationFailure(error: unknown, _provider: string): GenerationFailureKind {
    if (error instanceof ProviderApiError && error.category) {
        return error.category;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const status = error instanceof ProviderApiError ? error.status : extractStatus(error, message);
    const code = (error instanceof ProviderApiError ? error.code : extractCode(error))?.toLowerCase();

    if (message.includes("request was cancelled") || message.includes("user cancelled") || code === "abort_err" || code === "aborterror" || code === "err_canceled" || message.includes("operation cancelled")) {
        return "cancelled";
    }
    if (message.includes("timed out") || message.includes("timeout") || message.includes("etimedout")) {
        return "timeout";
    }
    if (code?.includes("invalid_api_key") || code?.includes("unrecognizedclient") || code?.includes("invalidsignature") || status === 401 || message.includes("invalid api key") || message.includes("authentication failed") || message.includes("unauthorized")) {
        return "authentication";
    }
    if (
        status === 402 ||
        code?.includes("insufficient_quota") ||
        message.includes("billing") ||
        message.includes("insufficient balance") ||
        message.includes("insufficient quota") ||
        message.includes("insufficient_quota") ||
        message.includes("account quota") ||
        message.includes("organization quota") ||
        message.includes("credits")
    ) {
        return "account-limit";
    }
    if (code?.includes("accessdenied") || status === 403 || message.includes("permission") || message.includes("access denied") || message.includes("forbidden")) {
        return "permission";
    }
    if (message.includes("content filter") || message.includes("content policy") || message.includes("safety filter")) {
        return "content-filter";
    }
    if (
        status === 413 ||
        ((status === 400 || status === 422) && /(?:prompt|input|context|tokens)/.test(message) && /(?:exceed|too long|too large|must be <=)/.test(message)) ||
        code?.includes("context_length") ||
        code?.includes("input_token") ||
        message.includes("context length") ||
        message.includes("context_length") ||
        message.includes("input token") ||
        message.includes("prompt too long") ||
        message.includes("too large") ||
        message.includes("maximum token")
    ) {
        return "input-limit";
    }
    if (code?.includes("throttl") || code === "resource_exhausted" || status === 429 || message.includes("rate limit") || message.includes("too many requests") || message.includes("limit reached")) {
        return message.includes("model") || code?.includes("model") ? "model-limit" : "rate-limit";
    }
    if (status === 404 || message.includes("model not found") || message.includes("invalid model") || message.includes("configuration is invalid")) {
        return "configuration";
    }
    if (message.includes("failed to fetch") || message.includes("econnreset") || message.includes("econnrefused") || message.includes("network")) {
        return "network";
    }
    if (
        [500, 502, 503, 504, 529].includes(status ?? 0) ||
        message.includes("service unavailable") ||
        message.includes("temporarily unavailable") ||
        message.includes("overloaded")
    ) {
        return "temporary-service";
    }
    if (/invalid.*response/.test(message) || message.includes("empty response") || message.includes("no valid response") || message.includes("no generated text") || message.includes("no text content") || message.includes("malformed") || message.includes("empty generation")) {
        return "invalid-response";
    }
    return "unknown";
}

function extractRetryAfter(error: unknown): number | undefined {
    const record = getRecord(error);
    const explicit = readNumber(record?.retryAfterMs);
    if (explicit !== undefined && explicit >= 0) { return explicit; }
    const details = getRecord(record?.error)?.details ?? record?.details;
    for (const detail of Array.isArray(details) ? details : []) {
        const delay = readString(getRecord(detail)?.retryDelay);
        if (delay && /^\d+(?:\.\d+)?s$/.test(delay)) { return Number(delay.slice(0, -1)) * 1000; }
    }
    return undefined;
}

export function normalizeProviderError(error: unknown, provider: string): ProviderApiError {
    if (error instanceof ProviderApiError && error.category) {
        return error;
    }
    const message = error instanceof Error ? error.message : String(error);
    const status = extractStatus(error, message);
    const code = extractCode(error);
    return new ProviderApiError(message, {
        status,
        code,
        provider,
        category: classifyGenerationFailure(error, provider),
        retryAfterMs: error instanceof ProviderApiError ? error.retryAfterMs : extractRetryAfter(error),
        userFacing: error instanceof ProviderApiError ? error.userFacing : false,
        cause: error,
    });
}

export function withModel(config: ApiConfig, model: string): ApiConfig {
    return { ...config, model } as ApiConfig;
}
