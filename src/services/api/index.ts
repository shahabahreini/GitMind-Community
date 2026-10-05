import { randomUUID } from "node:crypto";
import { RequestContext } from "./requestContext";
import { modelCapabilities, assertPromptFitsAsync, countPromptTokens, directProbeBudget, effectiveInputBudget, ModelCapabilities } from "./capabilities";
import { generateBudgeted, DiffInput, isOutputTruncation } from "./budgetedGeneration";
import { readLargeDiffSettings, LargeDiffSettings } from "../../config/largeDiffSettings";
// src/services/api/index.ts
import * as vscode from "vscode";
import {
    ApiConfig,
    GeminiApiConfig,
    HuggingFaceApiConfig,
    OllamaApiConfig,
    MistralApiConfig,
    CohereApiConfig,
    OpenAIApiConfig,
    TogetherApiConfig,
    OpenRouterApiConfig,
    AnthropicApiConfig,
    CopilotApiConfig,
    DeepSeekApiConfig,
    GrokApiConfig,
    PerplexityApiConfig,
    ZaiApiConfig,
    NvidiaApiConfig,
    LMStudioApiConfig,
    AzureOpenAIApiConfig,
    BedrockApiConfig,
    VertexAIApiConfig,
    CloudflareApiConfig,
    CustomApiConfig,
} from "../../config/types";
// Lazy-loaded provider imports - loaded only when needed to reduce bundle size
import {
    checkOllamaAvailability,
    getOllamaInstallInstructions,
} from "../../utils/ollamaHelper";
import { debugLog, diagnosticLog, startDiagnosticOperation } from "../debug/logger";
import { getApiConfig } from "../../config/settings";
import { estimateTokens } from "../../utils/tokenCounter";
import { workspace } from "vscode";
import { APIErrorHandler } from "../../utils/errorHandler";
import { SubscriptionManager } from "../subscription/SubscriptionManager";
import { DiffProcessor } from "../diffProcessor";
import { generateCommitHistoryAnalysisPrompt, validatePromptLength, generateCommitPrompt, generateCompactCommitPrompt, getPromptConfig } from './prompts';
import { BaseAIProvider, GenerationOptions } from "./base";
import { classifyGenerationFailure, normalizeProviderError, ProviderApiError, withModel } from "./recovery";
import { recordSupportEvent, SupportOperation, SupportProvider } from "../support/SupportSessionService";
import { getProviderDefaultModel, PROVIDER_CATALOG, PROVIDER_IDS, ProviderCatalogEntry, requiresApiKey } from "../../config/providerCatalog";

// Timeout configurations
const STANDARD_REQUEST_TIMEOUT = 10000; // 10 seconds for regular API requests
const COMMIT_HISTORY_ANALYSIS_TIMEOUT = 180000; // 3 minutes for commit history analysis
const LARGE_COMMIT_HISTORY_TIMEOUT = 480000; // 8 minutes for very large commit histories

// Circuit breaker for API errors
interface CircuitBreakerState {
    failureCount: number;
    lastFailureTime: number;
    isOpen: boolean;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();
const CIRCUIT_BREAKER_THRESHOLD = 3; // Max failures before opening circuit
const CIRCUIT_BREAKER_RESET_TIME = 60000; // 1 minute cooldown


/** Runtime provider label from the catalog, e.g. "GitHub Copilot". */
type ApiProvider = string;

// Type for lazy-loaded provider class
type ProviderClass = new (...args: any[]) => BaseAIProvider;

interface ProviderConfig {
    name: ApiProvider;
    displayName: string;
    settingPath: string;
    docsUrl: string;
    requiresApiKey: boolean;
    defaultModel?: string;
    // Lazy-load the provider class on demand
    getProviderClass: () => Promise<ProviderClass>;
}

// Cache for loaded provider modules to avoid re-importing
const providerModuleCache = new Map<string, ProviderClass>();

/**
 * Lazy-load a provider's class
 * This reduces initial bundle size by loading providers only when used
 */
async function loadProviderModule(provider: string): Promise<ProviderClass> {
    // Check cache first
    if (providerModuleCache.has(provider)) {
        debugLog(`[LazyLoad] Using cached module for provider: ${provider}`);
        return providerModuleCache.get(provider)!;
    }

    debugLog(`[LazyLoad] Loading module for provider: ${provider}`);

    let providerClass: ProviderClass;

    try {
        switch (provider) {
            case 'gemini':
                const geminiModule = await import('./gemini.js');
                providerClass = geminiModule.GeminiProvider;
                break;
            case 'huggingface':
                const huggingfaceModule = await import('./huggingface.js');
                providerClass = huggingfaceModule.HuggingFaceProvider;
                break;
            case 'ollama':
                const ollamaModule = await import('./ollama.js');
                providerClass = ollamaModule.OllamaProvider;
                break;
            case 'mistral':
                const mistralModule = await import('./mistral.js');
                providerClass = mistralModule.MistralProvider;
                break;
            case 'cohere':
                const cohereModule = await import('./cohere.js');
                providerClass = cohereModule.CohereProvider;
                break;
            case 'openai':
                const openaiModule = await import('./openai.js');
                providerClass = openaiModule.OpenAIProvider;
                break;
            case 'together':
                const togetherModule = await import('./together.js');
                providerClass = togetherModule.TogetherAIProvider;
                break;
            case 'openrouter':
                const openrouterModule = await import('./openrouter.js');
                providerClass = openrouterModule.OpenRouterProvider;
                break;
            case 'anthropic':
                const anthropicModule = await import('./anthropic.js');
                providerClass = anthropicModule.AnthropicProvider;
                break;
            case 'minimax':
                const minimaxModule = await import('./minimax.js');
                providerClass = minimaxModule.MiniMaxProvider;
                break;
            case 'copilot':
                const copilotModule = await import('./copilot.js');
                providerClass = copilotModule.CopilotProvider;
                break;
            case 'deepseek':
                const deepseekModule = await import('./deepseek.js');
                providerClass = deepseekModule.DeepSeekProvider;
                break;
            case 'grok':
                const grokModule = await import('./grok.js');
                providerClass = grokModule.GrokProvider;
                break;
            case 'groq':
                const groqModule = await import('./groq.js');
                providerClass = groqModule.GroqProvider;
                break;
            case 'perplexity':
                const perplexityModule = await import('./perplexity.js');
                providerClass = perplexityModule.PerplexityProvider;
                break;
            case 'zai':
                const zaiModule = await import('./zai.js');
                providerClass = zaiModule.ZaiProvider;
                break;
            case 'nvidia':
                const nvidiaModule = await import('./nvidia.js');
                providerClass = nvidiaModule.NvidiaProvider;
                break;
            case 'lmstudio':
                const lmStudioModule = await import('./lmstudio.js');
                providerClass = lmStudioModule.LMStudioProvider;
                break;
            case 'azureopenai':
                const azureOpenAIModule = await import('./azureopenai.js');
                providerClass = azureOpenAIModule.AzureOpenAIProvider;
                break;
            case 'bedrock':
                const bedrockModule = await import('./bedrock.js');
                providerClass = bedrockModule.BedrockProvider;
                break;
            case 'vertexai':
                const vertexAIModule = await import('./vertexai.js');
                providerClass = vertexAIModule.VertexAIProvider;
                break;
            case 'cloudflare':
                const cloudflareModule = await import('./cloudflare.js');
                providerClass = cloudflareModule.CloudflareProvider;
                break;
            case 'custom':
                const customModule = await import('./custom.js');
                providerClass = customModule.CustomProvider;
                break;
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }

        // Cache the loaded class
        providerModuleCache.set(provider, providerClass);
        debugLog(`[LazyLoad] Successfully loaded and cached module for provider: ${provider}`);

        return providerClass;
    } catch (error) {
        debugLog(`[LazyLoad] Failed to load module for provider ${provider}:`, error);
        throw new Error(`Failed to load provider module for ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Provider configurations derived from the canonical provider catalog, plus lazy-loaded provider classes
const PROVIDER_CONFIGS: Record<string, ProviderConfig> = Object.fromEntries(
    PROVIDER_IDS.map((id): [string, ProviderConfig] => {
        const entry = PROVIDER_CATALOG[id] as ProviderCatalogEntry;
        return [id, {
            name: entry.name,
            displayName: entry.displayName,
            settingPath: entry.settingPath,
            docsUrl: entry.docsUrl,
            requiresApiKey: requiresApiKey(id),
            defaultModel: entry.defaultModel || undefined,
            getProviderClass: async () => loadProviderModule(id),
        }];
    })
);

// Request management
const activeRequests = new Map<string, AbortController>();
const operationRepositories = new Map<string, string>();

export function cancelCurrentRequest(requestId?: string): void {
    for (const [key, controller] of activeRequests) {
        if (!requestId || key === requestId || operationRepositories.get(key) === requestId) {
            controller.abort(new ProviderApiError("Request was cancelled", { category: "cancelled" }));
        }
    }
}

export function isRequestActive(requestId?: string): boolean {
    if (requestId) {
        return activeRequests.has(requestId) || [...operationRepositories.values()].includes(requestId);
    }
    return activeRequests.size > 0;
}

/**
 * Check circuit breaker status for a provider
 */
function checkCircuitBreaker(provider: string): boolean {
    const state = circuitBreakers.get(provider);
    if (!state) {
        return true; // Circuit closed (allow requests)
    }

    const now = Date.now();

    // Reset circuit after cooldown period
    if (state.isOpen && (now - state.lastFailureTime) > CIRCUIT_BREAKER_RESET_TIME) {
        state.isOpen = false;
        state.failureCount = 0;
        debugLog(`[CircuitBreaker] Reset for provider: ${provider}`);
        return true;
    }

    return !state.isOpen;
}

/**
 * Record failure and potentially open circuit breaker
 */
function recordCircuitBreakerFailure(provider: string): void {
    const state = circuitBreakers.get(provider) || { failureCount: 0, lastFailureTime: 0, isOpen: false };

    state.failureCount++;
    state.lastFailureTime = Date.now();

    if (state.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
        state.isOpen = true;
        debugLog(`[CircuitBreaker] Opened for provider: ${provider} (${state.failureCount} failures)`);
    }

    circuitBreakers.set(provider, state);
}

async function handleApiError(
    error: unknown,
    config: ApiConfig,
    context?: { diffSize?: number; filesChanged?: number }
): Promise<Error> {
    debugLog("API Error:", error);

    const provider = getProviderName(config.type);
    const normalizedError = normalizeProviderError(error, config.type);

    // Record failure for circuit breaker
    recordCircuitBreakerFailure(provider);

    // Handle cancellation specifically
    if (classifyGenerationFailure(normalizedError, config.type) === "cancelled") {
        return normalizedError;
    }

    // Handle Ollama-specific errors
    if (
        provider === "Ollama" &&
        (normalizedError.message.includes("not configured") ||
            normalizedError.message.includes("not running"))
    ) {
        const result = await vscode.window.showErrorMessage(
            "Ollama is not configured properly. Would you like to configure it now?",
            "Configure Now",
            "Installation Guide"
        );

        if (result === "Configure Now") {
            await vscode.commands.executeCommand("gitmind.openSettings");
        } else if (result === "Installation Guide") {
            const instructions = getOllamaInstallInstructions();
            await vscode.window.showInformationMessage(instructions, { modal: true });
        }
        return new Error("Ollama is not configured or running. Open Model Settings and verify the local service URL.");
    }

    if (normalizedError.userFacing) {
        return normalizedError;
    }

    const errorInfo = APIErrorHandler.handleAPIError(normalizedError, provider, context);
    const formattedMessage = APIErrorHandler.formatUserMessage(errorInfo);
    // Already formatted: mark it so callers show it unchanged instead of re-classifying the text.
    return new ProviderApiError(formattedMessage, {
        status: normalizedError.status,
        code: normalizedError.code,
        provider: config.type,
        category: classifyGenerationFailure(normalizedError, config.type),
        retryAfterMs: normalizedError.retryAfterMs,
        userFacing: true,
    });
}

export function beginGenerationOperation(requestId: string, operationId?: string): { context: RequestContext; dispose: () => void } {
    const controller = new AbortController();
    const key = operationId ?? randomUUID();
    activeRequests.set(key, controller);
    const context = { operationId: key, signal: controller.signal };
    operationRepositories.set(key, requestId);
    return { context, dispose: () => {
        if (activeRequests.get(key) === controller) { activeRequests.delete(key); operationRepositories.delete(key); }
    } };
}

export async function generateCommitMessage(
    config: ApiConfig,
    diff: DiffInput,
    customContext: string = "",
    repositoryRoot?: string,
    operationId?: string,
    context?: RequestContext,
): Promise<string> {
    const owned = context ? undefined : beginGenerationOperation(repositoryRoot ?? "global", operationId);
    context ??= owned!.context;
    context.diffByteSize ??= typeof diff === "string" ? Buffer.byteLength(diff, "utf8") : undefined;
    const promptConfig = context.promptConfig ?? getPromptConfig();
    let inputIterator: AsyncIterator<string> | undefined;
    try {
        context.signal?.throwIfAborted();
        const validatedConfig = await validateAndUpdateConfig(config);
        if (!validatedConfig) { throw new ProviderApiError("Provider configuration is invalid.", { category: "configuration" }); }
        context.signal?.throwIfAborted();
        showModelInfo(validatedConfig);
        const settings = vscode.workspace.getConfiguration("gitmind");
        const largeDiffSettings = readLargeDiffSettings(settings);
        context.largeDiffEnabled = largeDiffSettings.enabled;
        const initialProvider = await getProviderInstance(validatedConfig);
        await initialProvider.prepareCapabilities(context);
        context.generationOptions ??= initialProvider.getDefaultGenerationOptions() ?? {};
        const recovery = createRecoveryOperation(validatedConfig, { operationId: context.operationId });
        if (typeof diff !== "string") {
            const iterator = diff[Symbol.asyncIterator]();
            inputIterator = iterator;
            let prefix = "";
            let exhausted = false;
            let nextBlock: string | undefined;
            const capabilities = initialProvider.getCapabilities();
            const budget = Math.min(1024 * 1024, Math.max(effectiveInputBudget(capabilities), directProbeBudget(capabilities)));
            while (prefix.length < budget) {
                context.signal?.throwIfAborted();
                const next = await iterator.next();
                if (next.done) { exhausted = true; break; }
                prefix += next.value;
                if (largeDiffSettings.enabled && prefix.split("\n").length > largeDiffSettings.chunkSize) { break; }
            }
            if (!exhausted && prefix.length >= budget) {
                const next = await iterator.next();
                if (next.done) { exhausted = true; }
                else { nextBlock = next.value; }
            }
            diff = exhausted ? prefix : (async function* () {
                try {
                    yield prefix;
                    if (nextBlock !== undefined) { yield nextBlock; }
                    while (true) {
                        const next = await iterator.next();
                        if (next.done) { break; }
                        yield next.value;
                    }
                } finally { await iterator.return?.(); }
            })();
        }
        let requiresChunking = typeof diff !== "string";
        if (typeof diff === "string") {
            await showDiagnosticsInfo(validatedConfig, diff);
            const prompt = await generateCommitPrompt(diff, promptConfig, customContext);
            const capabilities = initialProvider.getCapabilities();
            context.diagnosticBudget = {
                estimatedTokens: await countPromptTokens(prompt, capabilities),
                modelLimit: capabilities.isUnknown ? 0 : effectiveInputBudget(capabilities),
            };
            try { await assertPromptFitsAsync(prompt, capabilities); }
            catch (error) {
                if (classifyGenerationFailure(error, validatedConfig.type) !== "input-limit") { throw error; }
                if (capabilities.countTokens(prompt) <= directProbeBudget(capabilities)) {
                    context.allowPromptProbe = true;
                } else { requiresChunking = true; }
            }
            requiresChunking ||= largeDiffSettings.enabled && diff.split("\n").length > largeDiffSettings.chunkSize;
            if (!requiresChunking) {
                try {
                    return await recovery(async attemptConfig => {
                        const provider = await getProviderInstance(attemptConfig);
                        return provider.generateWithRawPrompt(prompt, context);
                    });
                } catch (error) {
                    // Runtime input limits or a smaller fallback can require a new plan.
                    if (classifyGenerationFailure(error, validatedConfig.type) !== "input-limit" && !isOutputTruncation(error)) { throw error; }
                    requiresChunking = true;
                } finally { context.allowPromptProbe = false; }
            }
        }
        if (!await SubscriptionManager.getInstance().isProUser()) {
            throw new ProviderApiError("This diff exceeds the model input limit. GitMind Pro can process it automatically in budgeted batches.", { category: "input-limit" });
        }
        // Pro users get safe automatic processing whenever a prompt exceeds the
        // model budget. The setting only opts into proactive line-based batching.
        context.largeDiffEnabled = true;
        return await processLargeDiff(validatedConfig, diff, customContext, largeDiffSettings, context, promptConfig, initialProvider.getCapabilities(), recovery);
    } catch (error) {
        throw normalizeProviderError(error, config.type);
    } finally {
        try { await inputIterator?.return?.(); }
        finally { owned?.dispose(); }
    }
}

type RecoveryOperation = <T>(operation: (config: ApiConfig) => Promise<T>) => Promise<T>;

export interface RecoveryDependencies {
    isProUser?: () => Promise<boolean>;
    getSetting?: <T>(key: string, defaultValue: T) => T;
    notify?: (message: string) => void;
    supportOperation?: SupportOperation;
    operationId?: string;
}

export function createRecoveryOperation(
    config: ApiConfig,
    dependencies: RecoveryDependencies = {}
): RecoveryOperation {
    let effectiveConfig = config;
    let recoveryDecision: Promise<{ config: ApiConfig; kind: "fallback" | "retry" } | null> | undefined;
    let transitioned = false;
    const supportOperation = dependencies.supportOperation ?? "generate_commit";
    const recoverySettings = vscode.workspace.getConfiguration("gitmind");
    const readSetting = dependencies.getSetting ?? (<T>(key: string, fallback: T): T => recoverySettings.get<T>(key, fallback));
    const policy = {
        retry: readSetting("pro.automaticRetry.enabled", false),
        fallback: readSetting("pro.modelFallback.enabled", false),
        models: { ...readSetting<Record<string, string>>("pro.modelFallback.models", {}) },
    };

    const decideRecovery = async (
        error: unknown,
        attemptedConfig: ApiConfig
    ): Promise<{ config: ApiConfig; kind: "fallback" | "retry" } | null> => {
        const normalizedError = normalizeProviderError(error, attemptedConfig.type);
        const isProUser = dependencies.isProUser
            ?? (() => SubscriptionManager.getInstance().isProUser(undefined, true));
        if (!await isProUser()) {
            return null;
        }

        const notify = dependencies.notify
            ?? ((message: string): void => { void vscode.window.showInformationMessage(message); });
        const retryEnabled = policy.retry;
        const fallbackEnabled = policy.fallback;
        const fallbackModels = policy.models;
        const failure = classifyGenerationFailure(normalizedError, attemptedConfig.type);

        if (fallbackEnabled && (failure === "model-limit" || failure === "rate-limit")) {
            const fallbackModel = fallbackModels[attemptedConfig.type]?.trim();
            if (fallbackModel && fallbackModel !== attemptedConfig.model) {
                effectiveConfig = withModel(attemptedConfig, fallbackModel);
                transitioned = true;
                notify(
                    `${getProviderName(attemptedConfig.type)} reached a request limit. Trying fallback model '${fallbackModel}' once.`
                );
                diagnosticLog({
                    subsystem: "recovery", event: "recovery.fallback_model_attempted", functionName: "createRecoveryOperation",
                    operationId: dependencies.operationId, provider: attemptedConfig.type as SupportProvider,
                    data: { failure }, support: { name: "recovery_attempted", operation: supportOperation, recoveryAction: "fallback_model" }
                });
                return { config: effectiveConfig, kind: "fallback" };
            }
        }

        if (retryEnabled && (failure === "timeout" || failure === "temporary-service" || failure === "network")) {
            transitioned = true;
            notify(
                `${getProviderName(attemptedConfig.type)} is temporarily unavailable. Retrying once.`
            );
            diagnosticLog({
                subsystem: "recovery", event: "recovery.retry_attempted", functionName: "createRecoveryOperation",
                operationId: dependencies.operationId, provider: attemptedConfig.type as SupportProvider,
                data: { failure }, support: { name: "recovery_attempted", operation: supportOperation, recoveryAction: "retry_same_model" }
            });
            return { config: attemptedConfig, kind: "retry" };
        }

        return null;
    };

    return async <T>(operation: (attemptConfig: ApiConfig) => Promise<T>): Promise<T> => {
        if (recoveryDecision) { await recoveryDecision; }
        const attemptedConfig = effectiveConfig;
        const beforeTransition = !transitioned;
        try {
            return await operation(attemptedConfig);
        } catch (error) {
            const failure = classifyGenerationFailure(error, attemptedConfig.type);
            if (!["model-limit", "rate-limit", "timeout", "temporary-service", "network"].includes(failure)) {
                throw normalizeProviderError(error, attemptedConfig.type);
            }
            // A shared promise makes model switching atomic for concurrent large-diff chunks.
            recoveryDecision ??= decideRecovery(error, attemptedConfig);
            const decision = await recoveryDecision;
            if (!decision || !beforeTransition) {
                throw normalizeProviderError(error, attemptedConfig.type);
            }
            transitioned = true;
            try {
                const result = await operation(decision.config);
                diagnosticLog({
                    subsystem: "recovery", event: "recovery.completed", functionName: "createRecoveryOperation",
                    operationId: dependencies.operationId, provider: attemptedConfig.type as SupportProvider, outcome: "success",
                    support: { name: "recovery_completed", operation: supportOperation, outcome: "success", recoveryAction: decision.kind === "fallback" ? "fallback_model" : "retry_same_model" }
                });
                return result;
            } catch (retryError) {
                diagnosticLog({
                    subsystem: "recovery", event: "recovery.failed", functionName: "createRecoveryOperation",
                    operationId: dependencies.operationId, provider: attemptedConfig.type as SupportProvider, outcome: "failure",
                    support: { name: "recovery_completed", operation: supportOperation, outcome: "failure", recoveryAction: decision.kind === "fallback" ? "fallback_model" : "retry_same_model" }
                });
                throw normalizeProviderError(retryError, decision.config.type);
            }
        }
    };
}

async function generateMessageWithRecovery(
    config: ApiConfig,
    diff: string,
    customContext: string,
    recovery?: RecoveryOperation,
    operationId?: string,
): Promise<string> {
    const operation = recovery ?? createRecoveryOperation(config, { operationId });
    return operation(async (attemptConfig): Promise<string> => {
        return generateMessageWithConfig(attemptConfig, diff, customContext);
    });
}

/**
 * Helper to instantiate the correct provider class
 */
export async function getProviderInstance(config: ApiConfig): Promise<BaseAIProvider> {
    const provider = await instantiateProvider(config);
    await applyAdvancedModelConfigDefaults(provider);
    return provider;
}

async function instantiateProvider(config: ApiConfig): Promise<BaseAIProvider> {
    const providerConfig = PROVIDER_CONFIGS[config.type];
    if (!providerConfig) {
        throw new Error(`Unsupported API provider: ${config.type}`);
    }

    const ProviderClass = await providerConfig.getProviderClass();

    if (config.type === 'custom') {
        const customConfig = config as CustomApiConfig;
        return new ProviderClass(
            customConfig.baseUrl,
            customConfig.endpoint,
            customConfig.authType,
            customConfig.authToken,
            customConfig.headerKey || '',
            customConfig.requestFormat,
            customConfig.responseFormat,
            customConfig.model
        );
    }

    if (config.type === 'ollama') {
        const ollamaConfig = config as OllamaApiConfig;
        return new ProviderClass(ollamaConfig.url, ollamaConfig.model);
    }

    if (config.type === 'lmstudio') {
        const lmStudioConfig = config as LMStudioApiConfig;
        return new ProviderClass(lmStudioConfig.url, lmStudioConfig.model);
    }

    if (config.type === 'azureopenai') {
        const azureConfig = config as AzureOpenAIApiConfig;
        return new ProviderClass(
            azureConfig.apiKey || "",
            azureConfig.model,
            azureConfig.endpoint,
            azureConfig.authMode,
            azureConfig.accessToken || "",
        );
    }

    if (config.type === 'bedrock') {
        const bedrockConfig = config as BedrockApiConfig;
        return new ProviderClass(bedrockConfig.model, bedrockConfig.region, bedrockConfig.profile || "");
    }

    if (config.type === 'vertexai') {
        const vertexConfig = config as VertexAIApiConfig;
        return new ProviderClass(vertexConfig.model, vertexConfig.project, vertexConfig.location);
    }

    if (config.type === 'cloudflare') {
        const cloudflareConfig = config as CloudflareApiConfig;
        return new ProviderClass(
            cloudflareConfig.apiKey || "",
            cloudflareConfig.model,
            cloudflareConfig.accountId,
            cloudflareConfig.gatewayId || "",
        );
    }

    if (config.type === 'copilot') {
        const copilotConfig = config as CopilotApiConfig;
        return new ProviderClass("", copilotConfig.model);
    }

    // Standard providers (API key + model)
    const typedConfig = config as any;

    // Check for API key requirements (should have been validated earlier, but good safety check)
    if (providerConfig.requiresApiKey && !typedConfig.apiKey) {
        throw new Error(`${providerConfig.displayName} API key is required.`);
    }

    // Special handling for Z.ai provider with endpoint configuration
    if (config.type === 'zai') {
        const zaiConfig = config as any;
        return new ProviderClass(
            zaiConfig.apiKey || "",
            zaiConfig.model,
            zaiConfig.endpoint || 'coding'
        );
    }

    return new ProviderClass(typedConfig.apiKey || "", typedConfig.model);
}

async function applyAdvancedModelConfigDefaults(provider: BaseAIProvider): Promise<void> {
    const settings = vscode.workspace.getConfiguration("gitmind");
    const proSettings = (settings.get("pro") as any) || {};
    const subscriptionSettings = (settings.get("subscription") as any) || {};
    const isProUser = proSettings.validationStatus === 'valid' || subscriptionSettings.status === 'active';
    if (!isProUser) {
        provider.setDefaultGenerationOptions(undefined);
        return;
    }
    const advanced = proSettings.advancedModelConfig;

    if (!advanced || advanced.mode !== 'custom') {
        provider.setDefaultGenerationOptions(undefined);
        return;
    }

    const options: GenerationOptions = {};
    if (advanced.maxTokensEnabled) {
        const maxTokens = Number(advanced.maxTokens);
        if (!Number.isNaN(maxTokens) && maxTokens > 0) {
            options.maxTokens = maxTokens;
        }
    }

    if (advanced.temperatureEnabled) {
        const temperature = Number(advanced.temperature);
        if (!Number.isNaN(temperature)) {
            options.temperature = temperature;
        }
    }

    // Mutual exclusion: prefer temperature over topP when both are enabled
    if (advanced.topPEnabled && options.temperature === undefined) {
        const topP = Number(advanced.topP);
        if (!Number.isNaN(topP)) {
            options.topP = topP;
        }
    }

    if (advanced.topKEnabled) {
        const topK = Number(advanced.topK);
        if (!Number.isNaN(topK) && topK >= 0) {
            options.topK = topK;
        }
    }

    provider.setDefaultGenerationOptions(options);
}

async function generateMessageWithConfig(
    config: ApiConfig,
    diff: string,
    customContext: string = ""
): Promise<string> {
    // Check specific requirements first
    const providerConfig = PROVIDER_CONFIGS[config.type];

    // Handle Ollama specific checks
    if (config.type === "ollama") {
        const ollamaConfig = config as OllamaApiConfig;
        if (!ollamaConfig.url) {
            await vscode.window.showErrorMessage(
                "Ollama URL not configured. Please check the extension settings."
            );
            await vscode.commands.executeCommand("gitmind.openSettings");
            return "";
        }
        if (!ollamaConfig.model) {
            await vscode.window.showErrorMessage(
                "Ollama model not specified. Please select a model in the extension settings."
            );
            await vscode.commands.executeCommand("gitmind.openSettings");
            return "";
        }
        const isOllamaAvailable = await checkOllamaAvailability(ollamaConfig.url);
        if (!isOllamaAvailable) {
            const instructions = getOllamaInstallInstructions();
            await vscode.window.showErrorMessage("Ollama Connection Error", {
                modal: true,
                detail: instructions,
            });
            return "";
        }
    }

    // Handle Copilot specific checks
    if (config.type === "copilot") {
        const copilotConfig = config as CopilotApiConfig;
        if (!copilotConfig.model || copilotConfig.model.trim() === "") {
            await vscode.window.showErrorMessage(
                "Please select a GitHub Copilot model in the settings."
            );
            await vscode.commands.executeCommand("gitmind.openSettings");
            return "";
        }
    }

    // Handle Custom API specific checks
    if (config.type === "custom") {
        const subscriptionManager = SubscriptionManager.getInstance();
        const isProUser = await subscriptionManager.isProUser();

        if (!isProUser) {
            await vscode.window.showErrorMessage(
                "Custom API is a Pro feature. Please upgrade to GitMind Pro to use custom API endpoints.",
                "Learn More"
            ).then(selection => {
                if (selection === "Learn More") {
                    vscode.env.openExternal(vscode.Uri.parse("https://gitmind-pro.com/pricing"));
                }
            });
            return "";
        }

        const customConfig = config as CustomApiConfig;
        if (!customConfig.baseUrl || !customConfig.endpoint) {
            await vscode.window.showErrorMessage(
                "Custom API configuration incomplete. Please configure Base URL and Endpoint in settings.",
                "Open Settings"
            ).then(selection => {
                if (selection === "Open Settings") {
                    vscode.commands.executeCommand("gitmind.openSettings");
                }
            });
            return "";
        }
    }

    // Handle Standard providers API key check
    if (providerConfig.requiresApiKey && !(config as any).apiKey) {
        const apiKey = await promptForApiKey(providerConfig);
        if (!apiKey) {
            return "";
        }
        (config as any).apiKey = apiKey;
    }

    // Standard model check
    if (!(config as any).model && config.type !== 'custom') {
        await vscode.window.showErrorMessage(
            `Please select a ${providerConfig.displayName} model in the settings.`
        );
        await vscode.commands.executeCommand("gitmind.openSettings");
        return "";
    }

    const provider = await getProviderInstance(config);
    await applyAdvancedModelConfigDefaults(provider);
    return provider.generateCommitMessage(diff, customContext);
}

async function promptForApiKey(providerConfig: ProviderConfig): Promise<string | null> {
    const result = await vscode.window.showWarningMessage(
        `${providerConfig.displayName} API key is required. Would you like to configure it now?`,
        "Enter API Key",
        "Get API Key",
        "Cancel"
    );

    if (result === "Enter API Key") {
        return await getApiKeyFromUser(providerConfig);
    } else if (result === "Get API Key") {
        await vscode.env.openExternal(vscode.Uri.parse(providerConfig.docsUrl));
        return await getApiKeyFromUser(providerConfig);
    }

    return null;
}

async function getApiKeyFromUser(providerConfig: ProviderConfig): Promise<string | null> {
    const apiKey = await vscode.window.showInputBox({
        title: `${providerConfig.displayName} API Key`,
        prompt: `Please enter your ${providerConfig.displayName} API key`,
        password: true,
        placeHolder: "Paste your API key here",
        ignoreFocusOut: true,
        validateInput: (text) =>
            text?.trim() ? null : "API key cannot be empty",
    });

    if (apiKey) {
        const config = vscode.workspace.getConfiguration("gitmind");
        await config.update(
            providerConfig.settingPath,
            apiKey.trim(),
            vscode.ConfigurationTarget.Global
        );
        return apiKey.trim();
    }

    return null;
}

async function showDiagnosticsInfo(config: ApiConfig, diff: string, repositoryName?: string): Promise<void> {
    const showDiagnostics = vscode.workspace.getConfiguration('gitmind').get('showDiagnostics');

    if (!showDiagnostics) {
        return;
    }

    const estimatedTokens = estimateTokens(diff);
    const providerName = getProviderDisplayName(config.type);
    const modelName = getModelName(config);

    // Create a well-formatted message with proper structure
    const messageLines = [
        'Request Diagnostics',
        '',
        `Provider: ${providerName}`,
        `Model: ${modelName}`,
        `Estimated Tokens: ${estimatedTokens.toLocaleString()}`
    ];

    // Add repository name if available
    if (repositoryName) {
        messageLines.push(`Repository: ${repositoryName}`);
    }

    messageLines.push('', 'Would you like to proceed with this request?');

    const message = messageLines.join('\n');

    // Show information message and wait for user confirmation
    const proceed = await vscode.window.showInformationMessage(
        message,
        { modal: true },
        'Proceed'
    );

    if (proceed !== 'Proceed') {
        throw new Error('User cancelled token count confirmation');
    }
}

function showModelInfo(config: ApiConfig): void {
    const showModelInfo = workspace.getConfiguration('gitmind').get('showModelInfo');

    if (!showModelInfo) {
        return;
    }

    const providerName = getProviderDisplayName(config.type);
    const modelName = getModelName(config);
    const displayName = config.type === 'anthropic' ? modelName : `${providerName} (${modelName})`;

    vscode.window.showInformationMessage(`Using model: ${displayName}`, { modal: false });
}

function getProviderName(type: string): string {
    const config = PROVIDER_CONFIGS[type];
    if (!config) {
        debugLog(`Warning: No provider config found for type: ${type}`);
        return "Unknown Provider";
    }
    return config.name || "Unknown Provider";
}

function getProviderDisplayName(type: string): string {
    return PROVIDER_CONFIGS[type]?.displayName || "Unknown";
}

function getModelName(config: ApiConfig): string {
    const typedConfig = config as any;
    return typedConfig.model || PROVIDER_CONFIGS[config.type]?.defaultModel || 'unknown';
}

/**
 * Process a large diff by breaking it into chunks
 * @param config API configuration
 * @param diff The git diff
 * @param customContext Custom context for the commit message
 * @param settings Settings for large diff handling
 */
async function processLargeDiff(
    config: ApiConfig,
    diff: DiffInput,
    customContext: string,
    settings: LargeDiffSettings,
    context: RequestContext,
    promptConfig: ReturnType<typeof getPromptConfig>,
    initialCapabilities: ModelCapabilities,
    recovery: RecoveryOperation = createRecoveryOperation(config, { operationId: context.operationId }),
): Promise<string> {
    let capabilities = initialCapabilities;
    return vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Processing large diff", cancellable: true }, async (progress, token) => {
        const controller = new AbortController();
        const subscription = token.onCancellationRequested(() => controller.abort(new ProviderApiError("Request was cancelled", { category: "cancelled" })));
        if (token.isCancellationRequested) { controller.abort(new ProviderApiError("Request was cancelled", { category: "cancelled" })); }
        const signal = context.signal ? AbortSignal.any([context.signal, controller.signal]) : controller.signal;
        try {
            return await generateBudgeted(diff, customContext, settings, {
                signal,
                capabilities: () => capabilities,
                renderFinal: async (text, current) => {
                    const full = await generateCommitPrompt(text, promptConfig, customContext);
                    if (current.countTokens(full) <= effectiveInputBudget(current)) { return full; }
                    return generateCompactCommitPrompt(text, promptConfig, customContext);
                },
                send: (render, requestSignal) => recovery(async attemptConfig => {
                    requestSignal.throwIfAborted();
                    const provider = await getProviderInstance(attemptConfig);
                    await provider.prepareCapabilities({ ...context, signal: requestSignal });
                    capabilities = provider.getCapabilities();
                    return provider.generateWithRawPrompt(await render(capabilities), { ...context, signal: requestSignal });
                }),
                progress: (stage, completed) => {
                    progress.report({ message: stage === "requests" ? `Analyzed ${completed} source spans` : stage === "reduction" ? `Reducing summaries (round ${completed})` : "Planning source spans" });
                    diagnosticLog({ subsystem: "provider", event: `generation.${stage}`, functionName: "processLargeDiff", operationId: context.operationId, data: { stage, completed: Math.min(completed, 1000000) }, support: { name: "operation_progress", operation: "generate_commit", stage, completed: Math.min(completed, 1000000) } });
                },
            });
        } finally { subscription.dispose(); }
    });
}

async function validateAndUpdateConfig(config: ApiConfig): Promise<ApiConfig | null> {
    debugLog("Validating API configuration for provider:", config.type);

    const providerConfig = PROVIDER_CONFIGS[config.type];
    if (!providerConfig) {
        throw new Error(`Unsupported provider: ${config.type}`);
    }

    // Skip validation for providers that don't require API keys
    if (!providerConfig.requiresApiKey) {
        return config;
    }

    debugLog("Checking API key for provider:", providerConfig.name);

    // Check if API key is missing
    if (!(config as any).apiKey) {
        debugLog("API key missing, showing configuration options");

        const result = await vscode.window.showWarningMessage(
            `${providerConfig.displayName} API key is required. Would you like to configure it now?`,
            "Enter API Key",
            "Get API Key",
            "Cancel"
        );

        if (result === "Enter API Key") {
            const apiKey = await getApiKeyFromUser(providerConfig);
            if (apiKey) {
                debugLog("API key saved, returning updated configuration");
                return getApiConfig();
            }
        } else if (result === "Get API Key") {
            await vscode.env.openExternal(vscode.Uri.parse(providerConfig.docsUrl));
            const apiKey = await getApiKeyFromUser(providerConfig);
            if (apiKey) {
                debugLog("API key saved, returning updated configuration");
                return getApiConfig();
            }
        }
        return null; // User cancelled or no API key provided
    }

    // If we reach here, API key exists
    return config;
}

/**
 * Generate content using a raw prompt without commit-specific formatting
 * This is useful for features like changelog generation that need custom prompts
 * @param config API configuration
 * @param prompt The raw prompt to send to the AI
 * @param featureName Name of the feature for diagnostic error context (e.g., 'changelog', 'analysis')
 * @param skipValidation Skip prompt length validation (use when feature has its own validation)
 * @returns Generated content from the AI
 */
export async function generateWithRawPrompt(
    config: ApiConfig,
    prompt: string,
    featureName: string = 'raw_prompt',
    skipValidation: boolean = false,
    allowRecovery: boolean = true
): Promise<string> {
    const startTime = Date.now();
    const owned = beginGenerationOperation("global", startDiagnosticOperation("provider", "generate_commit").id);

    try {

        // First validate and potentially update the configuration
        const validatedConfig = await validateAndUpdateConfig(config);
        if (!validatedConfig) {
            debugLog("No valid configuration available");
            throw new Error(`${getProviderName(config.type)} configuration is invalid. Please check your API key and settings.`);
        }

        // Show model info if enabled
        showModelInfo(validatedConfig);

        // Check circuit breaker before making request
        const provider = getProviderName(config.type);
        if (!checkCircuitBreaker(provider)) {
            throw new Error(`${provider} is temporarily unavailable due to recent failures. Please try again in a minute.`);
        }

        // Validate prompt length for the specific provider (unless validation is skipped)
        if (!skipValidation) {
            const validation = validatePromptLength(prompt, config.type.toLowerCase());
            if (!validation.valid) {
                debugLog(`[${featureName}] Prompt validation failed: ${validation.recommendation}`);
                throw new Error(`Prompt too long for ${config.type}: ${validation.recommendation}`);
            }
            debugLog(`[${featureName}] Prompt validation passed: ${validation.length} chars`);
        } else {
            debugLog(`[${featureName}] Skipping prompt validation (feature has custom validation)`);
        }

        debugLog(`[${featureName}] Calling ${provider} with prompt length: ${prompt.length}`);

        // Generate the content using the raw prompt
        const supportOperation: SupportOperation = featureName === "changelog"
            ? "generate_changelog"
            : featureName.includes("history") || featureName.includes("analysis")
                ? "learn_history"
                : "generate_commit";
        const result = allowRecovery
            ? await createRecoveryOperation(validatedConfig, { supportOperation })((attemptConfig) => generateWithRawPromptInternal(attemptConfig, prompt, owned.context))
            : await generateWithRawPromptInternal(validatedConfig, prompt, owned.context);

        return result;
    } catch (unknownError) {
        const duration = Date.now() - startTime;
        const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError));
        debugLog(`Generate ${featureName} Error:`, error);

        // Handle cancellation specifically
        if (error.message === 'Request was cancelled') {
            debugLog("Request was cancelled by user");
            return "";
        }

        // Handle API errors with context
        const errorContext = { diffSize: prompt.length };
        throw await handleApiError(error, config, errorContext);
    } finally {
        // Clean up request tracking
        owned.dispose();
    }
}

async function generateWithRawPromptInternal(
    config: ApiConfig,
    prompt: string,
    context?: RequestContext,
): Promise<string> {
    const provider = await getProviderInstance(config);
    return provider.generateWithRawPrompt(prompt, context);
}

export async function generateCommitHistoryAnalysis(
    config: ApiConfig,
    commitHistory: string,
    maxCommits: number = 50,
    includeAuthorInfo: boolean = true
): Promise<string> {
    const startTime = Date.now();
    const owned = beginGenerationOperation("global", startDiagnosticOperation("provider", "generate_commit").id);

    try {

        // First validate and potentially update the configuration
        const validatedConfig = await validateAndUpdateConfig(config);
        if (!validatedConfig) {
            debugLog("No valid configuration available");
            throw new Error(`${getProviderName(config.type)} configuration is invalid. Please check your API key and settings.`);
        }

        // Show model info if enabled
        showModelInfo(validatedConfig);

        // Generate the analysis using the dedicated function
        const recovery = createRecoveryOperation(validatedConfig, { supportOperation: "learn_history" });
        const result = await recovery((attemptConfig) =>
            generateAnalysisWithConfig(attemptConfig, commitHistory, maxCommits, includeAuthorInfo, owned.context)
        );

        return result;
    } catch (unknownError) {
        const duration = Date.now() - startTime;
        const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError));
        debugLog("Generate Commit History Analysis Error:", error);

        // Handle cancellation specifically
        if (error.message === 'Request was cancelled') {
            debugLog("Request was cancelled by user");
            return "";
        }

        // Handle API errors with context
        const errorContext = { diffSize: commitHistory.length };
        throw await handleApiError(error, config, errorContext);
    } finally {
        // Clean up request tracking
        owned.dispose();
    }
}

async function generateAnalysisWithConfig(
    config: ApiConfig,
    commitHistory: string,
    maxCommits: number,
    includeAuthorInfo: boolean,
    context?: RequestContext,
): Promise<string> {
    const providerConfig = PROVIDER_CONFIGS[config.type];
    if (!providerConfig) {
        throw new Error(`Unsupported API provider: ${config.type}`);
    }

    // Check circuit breaker before making request
    const providerName = getProviderName(config.type);
    if (!checkCircuitBreaker(providerName)) {
        throw new Error(`${providerName} is temporarily unavailable due to recent failures. Please try again in a minute.`);
    }

    const provider = await getProviderInstance(config);
    return provider.generateCommitHistoryAnalysis(commitHistory, maxCommits, includeAuthorInfo, context);
}
