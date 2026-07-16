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
        return response;
    } catch (error) {
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
