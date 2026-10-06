import { requestScope } from "./requestContext";
import { normalizeProviderError, ProviderApiError } from "./recovery";
import { diagnosticLog } from "../debug/logger";
import { SupportProvider } from "../support/SupportSessionService";

type LoggedFetchMeta = {
    provider?: SupportProvider;
    operation?: string;
    operationId?: string;
};

/**
 * Fetch wrapper for operational diagnostics. It deliberately never logs request
 * URLs, headers, bodies, or response bodies; those may contain private content.
 */
export async function loggedFetch(input: RequestInfo | URL, init?: RequestInit, meta?: LoggedFetchMeta): Promise<Response> {
    const scope = requestScope.getStore();
    meta = { ...meta, operationId: meta?.operationId ?? scope?.operationId };
    if (scope) { init = { ...init, signal: init?.signal ? AbortSignal.any([init.signal, scope.controller.signal]) : scope.controller.signal }; }
    const fallbackMethod = typeof input === "string" || input instanceof URL ? "GET" : input.method;
    const method = init?.method ?? fallbackMethod;
    const startedAt = Date.now();
    const operation = "provider_request";
    const provider = meta?.provider;

    diagnosticLog({
        subsystem: "provider", event: "provider.request_started", functionName: "loggedFetch",
        operationId: meta?.operationId, provider, data: { method, requestKind: meta?.operation },
        support: { name: "operation_progress", operation, outcome: "success" },
    });
    try {
        const response = await globalThis.fetch(input, init);
        const durationMs = Date.now() - startedAt;
        diagnosticLog({
            level: response.ok ? "INFO" : "WARN", subsystem: "provider", event: "provider.request_completed",
            functionName: "loggedFetch", operationId: meta?.operationId, provider,
            outcome: response.ok ? "success" : "failure", durationMs, data: { method, httpStatus: response.status, ok: response.ok },
            support: { name: "operation_progress", operation, outcome: response.ok ? "success" : "failure", httpStatus: response.status },
        });
        if (!response.ok && scope) {
            let detail: Record<string, any> = {};
            try { detail = await response.clone().json(); } catch { /* No response body retained. */ }
            const raw = detail?.error ?? detail ?? {};
            const error = normalizeProviderError(new ProviderApiError(typeof raw.message === "string" ? raw.message : `HTTP ${response.status}`, {
                status: response.status, code: typeof raw.code === "string" ? raw.code : undefined,
                provider, retryAfterMs: retryDelay(response.headers.get("retry-after")),
            }), provider ?? "");
            if (scope) { scope.transportError = error; }
            throw error;
        }
        // Validate finish state before individual adapters consume the body.
        if (scope && response.headers.get("content-type")?.includes("json")) {
            let body: any;
            try { body = await response.clone().json(); } catch {
                throw new ProviderApiError("Provider returned malformed JSON.", { category: "invalid-response", provider });
            }
            if (body?.choices?.[0]?.message?.refusal) { throw new ProviderApiError("Provider blocked the answer.", { category: "content-filter", provider }); }
            const finish = String(body?.choices?.[0]?.finish_reason ?? body?.stop_reason ?? body?.finish_reason ?? body?.candidates?.[0]?.finishReason ?? "").toLowerCase();
            if (["length", "max_tokens"].includes(finish)) {
                throw new ProviderApiError("Provider output was truncated.", { category: "invalid-response", provider });
            }
            if (["content_filter", "safety", "recitation", "content_filtered", "guardrail_intervened"].includes(finish) || body?.promptFeedback?.blockReason) {
                throw new ProviderApiError("Provider blocked the answer.", { category: "content-filter", provider });
            }
            if (body?.status === "incomplete" || body?.incomplete_details || ((meta?.provider === "ollama" || meta?.provider === "ollamacloud") && body?.done_reason === "length")) {
                throw new ProviderApiError("Provider output was truncated.", { category: "invalid-response", provider });
            }
            // Normalize documented chat text blocks for adapters sharing this shape.
            if (Array.isArray(body?.choices?.[0]?.message?.content)) {
                const { answerText } = await import("./capabilities.js");
                body.choices[0].message.content = answerText(body.choices[0].message.content);
                return new Response(JSON.stringify(body), { status: response.status, headers: response.headers });
            }
        }
        return response;
    } catch (error) {
        if (scope && error instanceof ProviderApiError) { scope.transportError = error; }
        const durationMs = Date.now() - startedAt;
        diagnosticLog({
            level: "ERROR", subsystem: "provider", event: "provider.request_failed", functionName: "loggedFetch",
            operationId: meta?.operationId, provider, outcome: "failure", durationMs,
            data: { method, errorName: error instanceof Error ? error.name : "UnknownError" },
            support: { name: "operation_progress", operation, outcome: "failure", errorCategory: "network" },
        });
        throw error;
    }
}

function retryDelay(value: string | null): number | undefined {
    if (!value) { return undefined; }
    const seconds = Number(value);
    const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - Date.now();
    return Number.isFinite(delay) ? Math.max(0, delay) : undefined;
}
