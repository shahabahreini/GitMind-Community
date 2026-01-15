import { debugLog } from "../debug/logger";

type LoggableHeaders = Record<string, string>;

type LoggedFetchMeta = {
    provider?: string;
    operation?: string;
};

const MAX_LOG_BODY_CHARS = 8_000;

function truncateString(value: string, maxChars: number): string {
    if (value.length <= maxChars) {
        return value;
    }
    return `${value.slice(0, maxChars)}\n... (truncated, total ${value.length} chars)`;
}

function normalizeHeaders(headers: HeadersInit | undefined): LoggableHeaders {
    if (!headers) {
        return {};
    }

    const result: LoggableHeaders = {};

    if (headers instanceof Headers) {
        headers.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    if (Array.isArray(headers)) {
        for (const [key, value] of headers) {
            result[key] = value;
        }
        return result;
    }

    return { ...headers };
}

function sanitizeHeaders(headers: LoggableHeaders): LoggableHeaders {
    const redactedKeys = new Set([
        "authorization",
        "cookie",
        "set-cookie",
        "x-api-key",
        "api-key",
        "proxy-authorization",
    ]);

    const sanitized: LoggableHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
        const lowerKey = key.toLowerCase();
        sanitized[key] = redactedKeys.has(lowerKey) ? "[REDACTED]" : value;
    }
    return sanitized;
}

function redactJson(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => redactJson(item));
    }

    if (value && typeof value === "object") {
        const obj = value as Record<string, unknown>;
        const out: Record<string, unknown> = {};

        for (const [key, v] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();
            if (lowerKey === "authorization" || lowerKey === "api_key" || lowerKey === "apikey" || lowerKey === "api-key") {
                out[key] = "[REDACTED]";
                continue;
            }
            out[key] = redactJson(v);
        }

        return out;
    }

    return value;
}

function safeBodyPreview(body: BodyInit | null | undefined): { preview?: string; isJson?: boolean } {
    if (body === undefined || body === null) {
        return {};
    }

    if (typeof body === "string") {
        const trimmed = body.trim();
        const isJson = trimmed.startsWith("{") || trimmed.startsWith("[");
        if (isJson) {
            try {
                const parsed = JSON.parse(body) as unknown;
                const redacted = redactJson(parsed);
                return { preview: truncateString(JSON.stringify(redacted, null, 2), MAX_LOG_BODY_CHARS), isJson: true };
            } catch {
                return { preview: truncateString(body, MAX_LOG_BODY_CHARS), isJson: false };
            }
        }
        return { preview: truncateString(body, MAX_LOG_BODY_CHARS), isJson: false };
    }

    return { preview: `[body: ${Object.prototype.toString.call(body)}]`, isJson: false };
}

export async function loggedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
    meta?: LoggedFetchMeta,
): Promise<Response> {
    const url =
        typeof input === "string"
            ? input
            : input instanceof URL
                ? input.toString()
                : input.url;

    const fallbackMethod =
        typeof input === "string" || input instanceof URL ? "GET" : input.method;
    const method = init?.method ?? fallbackMethod;

    const headers = sanitizeHeaders(normalizeHeaders(init?.headers));
    const requestBody = safeBodyPreview(init?.body ?? null);

    const start = Date.now();

    debugLog("[API] Request", {
        provider: meta?.provider,
        operation: meta?.operation,
        method,
        url,
        headers,
        ...(requestBody.preview ? { body: requestBody.preview } : {}),
    });

    try {
        const response = await fetch(input, init);
        const durationMs = Date.now() - start;

        let responseBodyPreview: string | undefined;
        try {
            const clone = response.clone();
            const text = await clone.text();
            const trimmed = text.trim();
            const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");
            if (looksJson) {
                try {
                    const parsed = JSON.parse(text) as unknown;
                    const redacted = redactJson(parsed);
                    responseBodyPreview = truncateString(JSON.stringify(redacted, null, 2), MAX_LOG_BODY_CHARS);
                } catch {
                    responseBodyPreview = truncateString(text, MAX_LOG_BODY_CHARS);
                }
            } else {
                responseBodyPreview = truncateString(text, MAX_LOG_BODY_CHARS);
            }
        } catch {
            responseBodyPreview = "[unavailable]";
        }

        debugLog("[API] Response", {
            provider: meta?.provider,
            operation: meta?.operation,
            method,
            url,
            status: response.status,
            ok: response.ok,
            durationMs,
            body: responseBodyPreview,
        });

        return response;
    } catch (error) {
        const durationMs = Date.now() - start;
        debugLog("[API] Request failed", {
            provider: meta?.provider,
            operation: meta?.operation,
            method,
            url,
            durationMs,
            error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error),
        });
        throw error;
    }
}
