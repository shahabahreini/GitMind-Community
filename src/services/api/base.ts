import { AIProvider } from "./provider";
import { generateCommitPrompt, getPromptConfig, generateCommitHistoryAnalysisPrompt } from "./prompts";
import { debugLog, diagnosticLog } from "../debug/logger";
import { RequestContext, requestScope, runRequest } from "./requestContext";
import { classifyGenerationFailure, normalizeProviderError, ProviderApiError } from "./recovery";
import { answerText, countPromptTokens, directProbeBudget, effectiveInputBudget, LONG_FORM_MAX_OUTPUT_TOKENS, measurePrompt, modelCapabilities, ModelCapabilities, UNKNOWN_MODEL_PROBE_BYTES } from "./capabilities";
import { createHash } from "node:crypto";
import { supportErrorCategory } from "../support/SupportSessionService";
import { estimateTokens } from "../../utils/tokenCounter";

export interface GenerationOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
}

export abstract class BaseAIProvider implements AIProvider {
    private _defaultGenerationOptions?: GenerationOptions;
    private static readonly runtimeCapabilities = new WeakMap<Function, Map<string, ModelCapabilities>>();

    protected constructor(protected apiKey: string, protected model: string) { }

    protected getAbortController(): AbortController {
        return requestScope.getStore()?.controller ?? new AbortController();
    }

    setDefaultGenerationOptions(options?: GenerationOptions): void {
        this._defaultGenerationOptions = options;
    }

    getDefaultGenerationOptions(): GenerationOptions | undefined { return this._defaultGenerationOptions ? { ...this._defaultGenerationOptions } : undefined; }

    protected getMergedGenerationOptions(options?: GenerationOptions): GenerationOptions | undefined {
        if (!this._defaultGenerationOptions && !options) {
            return undefined;
        }
        return {
            ...(this._defaultGenerationOptions ?? {}),
            ...(options ?? {}),
        };
    }

    async generateCommitMessage(diff: string, customContext: string = "", context?: RequestContext): Promise<string> {
        debugLog(`Generating commit message with model: ${this.model}`);
        const prompt = await generateCommitPrompt(diff, context?.promptConfig ?? getPromptConfig(), customContext);
        // Default commit message generation options can be handled by subclass or passed here
        return this.generateWithRawPrompt(prompt, context);
    }

    getCapabilities(): ModelCapabilities {
        return BaseAIProvider.runtimeCapabilities.get(this.constructor)?.get(this.capabilityKey(this.model)) ?? modelCapabilities(this.model);
    }

    protected capabilityScope(): string { return this.apiKey; }

    private capabilityKey(model: string): string {
        // Discovery is shared with generation only within the same service/account.
        return createHash("sha256").update(this.capabilityScope()).digest("hex") + ":" + model;
    }

    protected rememberModelLimits(model: string, inputTokens: unknown, outputTokens: unknown, inputOnly = false): void {
        if (typeof inputTokens !== "number" || !Number.isSafeInteger(inputTokens) || inputTokens < 512) { return; }
        const reported = typeof outputTokens === "number" && Number.isSafeInteger(outputTokens) && outputTokens > 0 ? outputTokens : undefined;
        const reserved = reported ? Math.min(modelCapabilities(model).outputTokens, reported) : 1024;
        let registry = BaseAIProvider.runtimeCapabilities.get(this.constructor);
        if (!registry) { registry = new Map(); BaseAIProvider.runtimeCapabilities.set(this.constructor, registry); }
        registry.set(this.capabilityKey(model), { ...modelCapabilities(model), contextTokens: inputOnly ? inputTokens + reserved + 256 : inputTokens, outputTokens: reserved, maxOutputTokens: reported, isUnknown: false, ...(inputOnly ? { maxInputTokens: inputTokens } : {}) });
    }

    async prepareCapabilities(_context?: RequestContext): Promise<void> {}

    /** One bounded metadata lookup per selected model and operation, shared by workers. */
    protected async discoverLargeModel(context: RequestContext | undefined, load: (signal: AbortSignal) => Promise<unknown>): Promise<void> {
        if (!context || (context.diffByteSize ?? 0) <= UNKNOWN_MODEL_PROBE_BYTES || !this.getCapabilities().isUnknown) { return; }
        const pending = context.metadataDiscovery ??= new Map<string, Promise<void>>();
        const key = `${this.constructor.name}:${this.model}`;
        if (!pending.has(key)) {
            const signal = context.signal ? AbortSignal.any([context.signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000);
            pending.set(key, load(signal).then(() => {}).catch(error => {
                if (context.signal?.aborted) { throw error; }
                if (["rate-limit", "account-limit", "authentication", "permission"].includes(classifyGenerationFailure(error, ""))) {
                    throw normalizeProviderError(error, "");
                }
                // Metadata is optional; retain the conservative unknown-model budget.
            }));
        }
        await pending.get(key);
    }

    async generateWithRawPrompt(prompt: string, context?: RequestContext): Promise<string> {
        if (!context?.capabilitiesPrepared) { await this.prepareCapabilities(context); }
        const capabilities = this.getCapabilities();
        const estimatedTokens = context?.heuristicTokens ? await measurePrompt(prompt, capabilities) : await countPromptTokens(prompt, capabilities);
        if (context) {
            context.diagnosticBudget = {
                estimatedTokens: estimateTokens(prompt),
                modelLimit: capabilities.isUnknown && context.allowPromptProbe ? 0 : effectiveInputBudget(capabilities),
            };
        }
        if (estimatedTokens > effectiveInputBudget(capabilities) && !(context?.allowPromptProbe && !capabilities.countTokensAsync && estimatedTokens <= directProbeBudget(capabilities, context.promptTokenCap))) {
            throw new ProviderApiError("Prompt exceeds the model input budget. Shorten custom context or choose a larger-context model.", { category: "input-limit" });
        }
        const merged = context?.generationOptions ?? this.getMergedGenerationOptions();
        const userMaxTokens = merged?.maxTokens && Number.isFinite(merged.maxTokens) && merged.maxTokens > 0 ? Math.floor(merged.maxTokens) : undefined;
        let maxTokens: number;
        if (userMaxTokens !== undefined) {
            let maxAllowed = capabilities.maxOutputTokens ? Math.min(capabilities.maxOutputTokens, LONG_FORM_MAX_OUTPUT_TOKENS) : LONG_FORM_MAX_OUTPUT_TOKENS;
            if (!capabilities.isUnknown && capabilities.maxInputTokens === undefined) {
                const room = capabilities.contextTokens - await measurePrompt(prompt, capabilities) - 256;
                if (room > 0) { maxAllowed = Math.min(maxAllowed, room); }
            }
            maxTokens = Math.min(maxAllowed, userMaxTokens);
        } else {
            maxTokens = context?.outputTokens ? await this.longFormOutputTokens(prompt, capabilities, context.outputTokens) : capabilities.outputTokens;
        }
        const options = {
            ...merged,
            maxTokens,
        };
        return runRequest(context, async () => {
            diagnosticLog({ subsystem: "provider", event: "generation.request", functionName: "generateWithRawPrompt", operationId: context?.operationId, support: { name: "operation_progress", operation: "provider_request", stage: "requests" } });
            let stage: "requests" | "parsing" = "requests";
            try {
                const response = await this.generateResponse(prompt, options);
                stage = "parsing";
                const text = answerText(response);
                diagnosticLog({ subsystem: "provider", event: "generation.parsed", functionName: "generateWithRawPrompt", operationId: context?.operationId, support: { name: "operation_progress", operation: "provider_request", stage } });
                return text;
            } catch (error) {
                const normalized = normalizeProviderError(error, "");
                if (normalized.category === "invalid-response") { stage = "parsing"; }
                diagnosticLog({ subsystem: "provider", event: "generation.failed", functionName: "generateWithRawPrompt", operationId: context?.operationId, outcome: "failure", data: { category: normalized.category, httpStatus: normalized.status }, support: { name: "operation_failed", operation: "provider_request", stage, outcome: "failure", httpStatus: normalized.status, errorCategory: supportErrorCategory(normalized, "") } });
                throw normalized;
            }
        });
    }

    /** Long-form answers use the reported model maximum when known, bounded by the context left after the prompt. */
    private async longFormOutputTokens(prompt: string, capabilities: ModelCapabilities, requested: number): Promise<number> {
        let target = capabilities.maxOutputTokens ? Math.min(capabilities.maxOutputTokens, LONG_FORM_MAX_OUTPUT_TOKENS) : requested;
        if (!capabilities.isUnknown && capabilities.maxInputTokens === undefined) {
            target = Math.min(target, capabilities.contextTokens - await measurePrompt(prompt, capabilities) - 256);
        }
        // Never below the reservation a commit request would get.
        return Math.max(target, capabilities.outputTokens);
    }

    async generateCommitHistoryAnalysis(commitHistory: string, maxCommits: number, includeAuthorInfo: boolean, context?: RequestContext): Promise<string> {
        debugLog(`Generating commit history analysis with model: ${this.model}`);
        const prompt = generateCommitHistoryAnalysisPrompt(commitHistory, maxCommits, includeAuthorInfo);
        // Analysis typically uses slightly higher temperature
        return this.generateWithRawPrompt(prompt, context);
    }

    protected enforceCommitMessageFormat(message: string): string {
        // Adapters return answer text; commit formatting belongs to the command.
        return answerText(message);
    }

    protected abstract generateResponse(prompt: string, options?: GenerationOptions): Promise<string>;

    abstract getModels(): Promise<string[]>;

    abstract validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }>;
}
