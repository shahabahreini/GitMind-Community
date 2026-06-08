import { ApiConfig } from "../../config/types";

export type GenerationFailureKind =
    | "timeout"
    | "temporary-service"
    | "model-limit"
    | "authentication"
    | "permission"
    | "account-limit"
    | "input-limit"
    | "configuration"
    | "cancelled"
    | "unknown";

export class ProviderApiError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly code?: string,
        public readonly provider?: string
    ) {
        super(message);
        this.name = "ProviderApiError";
    }
}

export function classifyGenerationFailure(error: unknown, _provider: string): GenerationFailureKind {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const status = error instanceof ProviderApiError ? error.status : undefined;
    const code = error instanceof ProviderApiError ? error.code?.toLowerCase() : undefined;

    if (message.includes("request was cancelled") || message.includes("user cancelled")) {
        return "cancelled";
    }
    if (message.includes("timed out") || message.includes("timeout") || message.includes("etimedout")) {
        return "timeout";
    }
    if (status === 401 || message.includes("invalid api key") || message.includes("authentication failed")) {
        return "authentication";
    }
    if (status === 403 || message.includes("permission") || message.includes("access denied") || message.includes("forbidden")) {
        return "permission";
    }
    if (
        message.includes("context length") ||
        message.includes("context_length") ||
        message.includes("input token") ||
        message.includes("too large") ||
        message.includes("maximum token")
    ) {
        return "input-limit";
    }
    if (
        message.includes("billing") ||
        message.includes("insufficient quota") ||
        message.includes("insufficient_quota") ||
        message.includes("account quota") ||
        message.includes("credits")
    ) {
        return "account-limit";
    }
    if (
        (status === 429 || message.includes("rate limit") || message.includes("limit reached")) &&
        (message.includes("model") || code?.includes("model"))
    ) {
        return "model-limit";
    }
    if (status === 404 || message.includes("model not found") || message.includes("invalid model") || message.includes("configuration is invalid")) {
        return "configuration";
    }
    if (
        [500, 502, 503, 504].includes(status ?? 0) ||
        message.includes("service unavailable") ||
        message.includes("temporarily unavailable") ||
        message.includes("overloaded")
    ) {
        return "temporary-service";
    }
    return "unknown";
}

export function withModel(config: ApiConfig, model: string): ApiConfig {
    return { ...config, model } as ApiConfig;
}
