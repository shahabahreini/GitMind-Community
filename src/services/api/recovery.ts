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
}

/** A provider-neutral error that retains recovery metadata without response bodies. */
export class ProviderApiError extends Error {
    public readonly status?: number;
    public readonly code?: string;
    public readonly provider?: string;
    public readonly category?: ProviderErrorCategory;
    public readonly retryAfterMs?: number;

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
    return readString(record?.code) ?? readString(responseError?.code);
}

export function classifyGenerationFailure(error: unknown, _provider: string): GenerationFailureKind {
    if (error instanceof ProviderApiError && error.category) {
        return error.category;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const status = error instanceof ProviderApiError ? error.status : extractStatus(error, message);
    const code = (error instanceof ProviderApiError ? error.code : extractCode(error))?.toLowerCase();

    if (message.includes("request was cancelled") || message.includes("user cancelled") || code === "abort_err") {
        return "cancelled";
    }
    if (message.includes("timed out") || message.includes("timeout") || message.includes("etimedout")) {
        return "timeout";
    }
    if (status === 401 || message.includes("invalid api key") || message.includes("authentication failed") || message.includes("unauthorized")) {
        return "authentication";
    }
    if (status === 403 || message.includes("permission") || message.includes("access denied") || message.includes("forbidden")) {
        return "permission";
    }
    if (message.includes("content filter") || message.includes("content policy") || message.includes("safety filter")) {
        return "content-filter";
    }
    if (
        status === 413 ||
        message.includes("context length") ||
        message.includes("context_length") ||
        message.includes("input token") ||
        message.includes("prompt too long") ||
        message.includes("too large") ||
        message.includes("maximum token")
    ) {
        return "input-limit";
    }
    if (
        status === 402 ||
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
    if (status === 429 || message.includes("rate limit") || message.includes("too many requests") || message.includes("limit reached")) {
        return message.includes("model") || code?.includes("model") ? "model-limit" : "rate-limit";
    }
    if (status === 404 || message.includes("model not found") || message.includes("invalid model") || message.includes("configuration is invalid")) {
        return "configuration";
    }
    if (message.includes("failed to fetch") || message.includes("econnreset") || message.includes("econnrefused") || message.includes("network")) {
        return "network";
    }
    if (
        [500, 502, 503, 504].includes(status ?? 0) ||
        message.includes("service unavailable") ||
        message.includes("temporarily unavailable") ||
        message.includes("overloaded")
    ) {
        return "temporary-service";
    }
    if (message.includes("invalid response") || message.includes("empty response") || message.includes("no valid response")) {
        return "invalid-response";
    }
    return "unknown";
}

export function normalizeProviderError(error: unknown, provider: string): ProviderApiError {
    if (error instanceof ProviderApiError) {
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
        cause: error,
    });
}

export function withModel(config: ApiConfig, model: string): ApiConfig {
    return { ...config, model } as ApiConfig;
}
