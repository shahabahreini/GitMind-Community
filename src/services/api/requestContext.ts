import type { GenerationOptions } from "./base";
import type { PromptConfig } from "./prompts";
import { AsyncLocalStorage } from "node:async_hooks";
import { ProviderApiError, normalizeProviderError } from "./recovery";

export interface RequestContext {
    operationId?: string;
    promptConfig?: PromptConfig;
    generationOptions?: GenerationOptions;
    signal?: AbortSignal;
    largeDiffEnabled?: boolean;
    allowPromptProbe?: boolean;
    diffByteSize?: number;
    /** Smallest prompt an unlisted model rejected as too large during this operation. */
    rejectedPromptBytes?: number;
    metadataDiscovery?: Map<string, Promise<void>>;
    capabilitiesPrepared?: boolean;
    diagnosticBudget?: { estimatedTokens: number; modelLimit: number };
}
interface AttemptContext extends RequestContext {
    controller: AbortController;
    transportError?: ProviderApiError;
}
export const requestScope = new AsyncLocalStorage<AttemptContext>();

/** Each invocation owns its transport, including overlapping calls on one provider. */
export async function runRequest<T>(context: RequestContext | undefined, task: () => Promise<T>, timeoutMs = 55_000): Promise<T> {
    const controller = new AbortController();
    const scope: AttemptContext = { ...context, controller };
    const cancel = () => controller.abort(new ProviderApiError("Request was cancelled", { category: "cancelled" }));
    context?.signal?.addEventListener("abort", cancel, { once: true });
    if (context?.signal?.aborted) { cancel(); }
    const timer = setTimeout(() => controller.abort(new ProviderApiError("Request timed out during generation", { category: "timeout" })), timeoutMs);
    let onAbort: (() => void) | undefined;
    try {
        return await requestScope.run(scope, async () => {
            controller.signal.throwIfAborted();
            const aborted = new Promise<never>((_, reject) => {
                onAbort = () => reject(controller.signal.reason);
                controller.signal.addEventListener("abort", onAbort, { once: true });
            });
            return Promise.race([
                task(),
                aborted,
            ]);
        });
    } catch (error) {
        if (controller.signal.aborted) { throw controller.signal.reason; }
        throw scope.transportError ?? normalizeProviderError(error, "");
    } finally {
        clearTimeout(timer);
        context?.signal?.removeEventListener("abort", cancel);
        if (onAbort) { controller.signal.removeEventListener("abort", onAbort); }
    }
}
