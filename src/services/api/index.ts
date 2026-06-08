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
    CustomApiConfig,
} from "../../config/types";
// Lazy-loaded provider imports - loaded only when needed to reduce bundle size
import {
    checkOllamaAvailability,
    getOllamaInstallInstructions,
} from "../../utils/ollamaHelper";
import { debugLog } from "../debug/logger";
import { getApiConfig } from "../../config/settings";
import { estimateTokens } from "../../utils/tokenCounter";
import { workspace } from "vscode";
import { APIErrorHandler } from "../../utils/errorHandler";
import { telemetryService } from "../telemetry/telemetryService";
import { SubscriptionManager } from "../subscription/SubscriptionManager";
import { DiffProcessor } from "../diffProcessor";
import { generateCommitHistoryAnalysisPrompt, validatePromptLength, generateCommitPrompt, getPromptConfig } from './prompts';
import { BaseAIProvider, GenerationOptions } from "./base";
import { classifyGenerationFailure, withModel } from "./recovery";

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


type ApiProvider = "Gemini" | "Hugging Face" | "Ollama" | "Mistral" | "Cohere" | "OpenAI" | "Together AI" | "OpenRouter" | "Anthropic" | "MiniMax" | "GitHub Copilot" | "DeepSeek" | "Grok" | "Groq" | "Perplexity" | "Z.ai" | "NVIDIA" | "Custom API";

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

// Provider configurations with lazy-loaded API call functions
const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
    gemini: {
        name: "Gemini",
        displayName: "Gemini",
        settingPath: "gemini.apiKey",
        docsUrl: "https://aistudio.google.com/app/apikey",
        requiresApiKey: true,
        defaultModel: "gemini-3.1-flash",
        getProviderClass: async () => loadProviderModule('gemini'),
    },
    huggingface: {
        name: "Hugging Face",
        displayName: "Hugging Face",
        settingPath: "huggingface.apiKey",
        docsUrl: "https://huggingface.co/settings/tokens",
        requiresApiKey: true,
        getProviderClass: async () => loadProviderModule('huggingface'),
    },
    mistral: {
        name: "Mistral",
        displayName: "Mistral AI",
        settingPath: "mistral.apiKey",
        docsUrl: "https://console.mistral.ai/api-keys/",
        requiresApiKey: true,
        getProviderClass: async () => loadProviderModule('mistral'),
    },
    cohere: {
        name: "Cohere",
        displayName: "Cohere",
        settingPath: "cohere.apiKey",
        docsUrl: "https://dashboard.cohere.com/api-keys",
        requiresApiKey: true,
        getProviderClass: async () => loadProviderModule('cohere'),
    },
    openai: {
        name: "OpenAI",
        displayName: "OpenAI",
        settingPath: "openai.apiKey",
        docsUrl: "https://platform.openai.com/api-keys",
        requiresApiKey: true,
        getProviderClass: async () => loadProviderModule('openai'),
    },
    together: {
        name: "Together AI",
        displayName: "Together AI",
        settingPath: "together.apiKey",
        docsUrl: "https://api.together.xyz/settings/api-keys",
        requiresApiKey: true,
        getProviderClass: async () => loadProviderModule('together'),
    },
    openrouter: {
        name: "OpenRouter",
        displayName: "OpenRouter",
        settingPath: "openrouter.apiKey",
        docsUrl: "https://openrouter.ai/keys",
        requiresApiKey: true,
        getProviderClass: async () => loadProviderModule('openrouter'),
    },
    anthropic: {
        name: "Anthropic",
        displayName: "Anthropic",
        settingPath: "anthropic.apiKey",
        docsUrl: "https://console.anthropic.com/",
        requiresApiKey: true,
        defaultModel: "claude-sonnet-4.6",
        getProviderClass: async () => loadProviderModule('anthropic'),
    },
    minimax: {
        name: "MiniMax",
        displayName: "MiniMax",
        settingPath: "minimax.apiKey",
        docsUrl: "https://platform.minimax.io/docs/api-reference/text-anthropic-api",
        requiresApiKey: true,
        defaultModel: "MiniMax-M2",
        getProviderClass: async () => loadProviderModule('minimax'),
    },
    deepseek: {
        name: "DeepSeek",
        displayName: "DeepSeek",
        settingPath: "deepseek.apiKey",
        docsUrl: "https://platform.deepseek.com/api_keys",
        requiresApiKey: true,
        getProviderClass: async () => loadProviderModule('deepseek'),
    },
    grok: {
        name: "Grok",
        displayName: "Grok",
        settingPath: "grok.apiKey",
        docsUrl: "https://console.x.ai/",
        requiresApiKey: true,
        getProviderClass: async () => loadProviderModule('grok'),
    },
    groq: {
        name: "Groq",
        displayName: "Groq",
        settingPath: "groq.apiKey",
        docsUrl: "https://console.groq.com/keys",
        requiresApiKey: true,
        defaultModel: "meta-llama/llama-4-scout-17b-16e-instruct",
        getProviderClass: async () => loadProviderModule('groq'),
    },
    perplexity: {
        name: "Perplexity",
        displayName: "Perplexity",
        settingPath: "perplexity.apiKey",
        docsUrl: "https://www.perplexity.ai/settings/api",
        requiresApiKey: true,
        getProviderClass: async () => loadProviderModule('perplexity'),
    },
    zai: {
        name: "Z.ai",
        displayName: "Z.ai (GLM)",
        settingPath: "zai.apiKey",
        docsUrl: "https://api.z.ai/",
        requiresApiKey: true,
        defaultModel: "glm-5.1",
        getProviderClass: async () => loadProviderModule('zai'),
    },
    nvidia: {
        name: "NVIDIA",
        displayName: "NVIDIA",
        settingPath: "nvidia.apiKey",
        docsUrl: "https://build.nvidia.com/models",
        requiresApiKey: true,
        defaultModel: "meta/llama-3.3-70b-instruct",
        getProviderClass: async () => loadProviderModule('nvidia'),
    },
    custom: {
        name: "Custom API",
        displayName: "Custom API",
        settingPath: "custom.authToken",
        docsUrl: "",
        requiresApiKey: false, // Handled separately
        getProviderClass: async () => loadProviderModule('custom'),
    },
    ollama: {
        name: "Ollama",
        displayName: "Ollama",
        settingPath: "",
        docsUrl: "",
        requiresApiKey: false,
        getProviderClass: async () => loadProviderModule('ollama'),
    },
    copilot: {
        name: "GitHub Copilot",
        displayName: "GitHub Copilot",
        settingPath: "",
        docsUrl: "",
        requiresApiKey: false,
        defaultModel: "gpt-5.5-instant",
        getProviderClass: async () => loadProviderModule('copilot'),
    },
};

// Request management
const activeRequests = new Map<string, AbortController>();

export function cancelCurrentRequest(requestId?: string): void {
    if (requestId) {
        const controller = activeRequests.get(requestId);
        if (controller) {
            controller.abort();
            activeRequests.delete(requestId);
            debugLog(`Request cancelled for ${requestId}`);
        }
    } else {
        for (const controller of activeRequests.values()) {
            controller.abort();
        }
        activeRequests.clear();
        debugLog("All current requests cancelled");
    }
}

export function isRequestActive(requestId?: string): boolean {
    if (requestId) {
        return activeRequests.has(requestId);
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
): Promise<void> {
    debugLog("API Error:", error);

    if (!(error instanceof Error)) {
        await vscode.window.showErrorMessage("An unknown error occurred");
        return;
    }

    const provider = getProviderName(config.type);

    // Record failure for circuit breaker
    recordCircuitBreakerFailure(provider);

    // Handle cancellation specifically
    if (error.message === 'Request was cancelled') {
        return;
    }

    // Handle Ollama-specific errors
    if (
        provider === "Ollama" &&
        (error.message.includes("not configured") ||
            error.message.includes("not running"))
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
        return;
    }

    // Enhanced error handling with context
    let safeMessage = error.message;
    // Scrub potential API keys
    safeMessage = safeMessage.replace(/(sk-[a-zA-Z0-9]{20,})/g, "sk-...[REDACTED]");
    safeMessage = safeMessage.replace(/(Bearer\s+[a-zA-Z0-9\-\._~+\/]{20,})/gi, "Bearer [REDACTED]");

    if (safeMessage.includes('Together AI API error: 422') ||
        safeMessage.includes('tokens') && safeMessage.includes('exceed')) {
        // Show the detailed error message as-is for token limit errors
        await vscode.window.showErrorMessage(safeMessage, { modal: true });
        return;
    }

    // Use the error handler for other errors
    const tempError = new Error(safeMessage);
    tempError.name = error.name;
    const errorInfo = APIErrorHandler.handleAPIError(tempError, provider, context);
    const formattedMessage = APIErrorHandler.formatUserMessage(errorInfo);

    await vscode.window.showErrorMessage(formattedMessage, { modal: true });
}

export async function generateCommitMessage(
    config: ApiConfig,
    diff: string,
    customContext: string = "",
    repositoryRoot?: string
): Promise<string> {
    const startTime = Date.now();

    try {
        // Set up request tracking
        const controller = new AbortController();
        const requestId = repositoryRoot || 'global';
        activeRequests.set(requestId, controller);

        // Track the start of generation
        telemetryService.trackDailyActiveUser();

        // First validate and potentially update the configuration
        const validatedConfig = await validateAndUpdateConfig(config);
        if (!validatedConfig) {
            debugLog("No valid configuration available");
            throw new Error(`${getProviderName(config.type)} configuration is invalid. Please check your API key and settings.`);
        }

        // Log estimated token usage
        const tokenEstimate = estimateTokens(diff);
        debugLog(`Estimated tokens for diff: ${tokenEstimate}`);

        // Get repository name for diagnostics
        let repositoryName: string | undefined;
        if (repositoryRoot) {
            // Extract repository name from path
            repositoryName = repositoryRoot.split('/').pop() || 'Unknown Repository';
        } else {
            // Fallback to old behavior for backward compatibility
            try {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders) {
                    const { validateGitRepository } = await import('../git/repository.js');
                    const repoPath = await validateGitRepository(workspaceFolders[0]);
                    repositoryName = repoPath.split('/').pop() || 'Unknown Repository';
                }
            } catch (error) {
                debugLog('Could not get repository name for diagnostics:', error);
            }
        }

        // Show diagnostics if enabled
        await showDiagnosticsInfo(validatedConfig, diff, repositoryName);

        // Show model info if enabled
        showModelInfo(validatedConfig);

        // Check if this is a large diff and if the Pro feature is enabled
        const subscriptionManager = SubscriptionManager.getInstance();
        const settings = vscode.workspace.getConfiguration("gitmind");
        const proSettings = settings.get("pro") as any || {};
        const largeDiffSettings = proSettings.largeDiffHandling || { enabled: false, chunkSize: 1000, maxChunks: 5 };

        const diffProcessor = DiffProcessor.getInstance();
        const isLargeDiff = diffProcessor.isLargeDiff(diff, { threshold: largeDiffSettings.chunkSize });

        // If it's a large diff and the Pro feature is enabled, use chunked processing
        if (isLargeDiff && largeDiffSettings.enabled && await subscriptionManager.isProUser()) {
            debugLog("Using large diff handling for commit generation");
            return await processLargeDiff(validatedConfig, diff, customContext, largeDiffSettings);
        }

        // Generate the commit message, with at most one Pro recovery attempt.
        const result = await generateMessageWithRecovery(validatedConfig, diff, customContext);

        const duration = Date.now() - startTime;
        telemetryService.trackCommitGeneration(config.type, true);

        return result;
    } catch (unknownError) {
        const duration = Date.now() - startTime;
        const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError));
        debugLog("Generate Commit Message Error:", error);

        // Track the error
        telemetryService.trackExtensionError(
            'commit_generation_error',
            error.message,
            `provider:${config.type}`
        );
        telemetryService.trackCommitGeneration(config.type, false);

        // Handle cancellation specifically
        if (error.message === 'Request was cancelled' || error.message === 'User cancelled token count confirmation') {
            debugLog("Request was cancelled by user");
            telemetryService.trackExtensionError(
                'commit_generation_cancelled',
                error.message,
                `provider:${config.type}`
            );
            return "";
        }

        // Handle API errors with context
        const errorContext = { diffSize: diff.length };
        await handleApiError(error, config, errorContext);

        // Rethrow to be handled upstream
        throw error;
    } finally {
        // Clean up request tracking
        const requestId = repositoryRoot || 'global';
        activeRequests.delete(requestId);
    }
}

async function generateMessageWithRecovery(
    config: ApiConfig,
    diff: string,
    customContext: string
): Promise<string> {
    const attempt = async (attemptConfig: ApiConfig): Promise<string> => {
        let timeout: NodeJS.Timeout | undefined;
        try {
            return await Promise.race([
                generateMessageWithConfig(attemptConfig, diff, customContext),
                new Promise<string>((_, reject) => {
                    timeout = setTimeout(() => reject(new Error("Request timed out during generation")), 55000);
                }),
            ]);
        } finally {
            if (timeout) {
                clearTimeout(timeout);
            }
        }
    };

    try {
        return await attempt(config);
    } catch (error) {
        const subscriptionManager = SubscriptionManager.getInstance();
        if (!await subscriptionManager.isProUser(undefined, true)) {
            throw error;
        }

        const settings = vscode.workspace.getConfiguration("gitmind");
        const retryEnabled = settings.get<boolean>("pro.automaticRetry.enabled", false);
        const fallbackEnabled = settings.get<boolean>("pro.modelFallback.enabled", false);
        const fallbackModels = settings.get<Record<string, string>>("pro.modelFallback.models", {});
        const failure = classifyGenerationFailure(error, config.type);

        if (fallbackEnabled && (failure === "model-limit" || failure === "temporary-service")) {
            const fallbackModel = fallbackModels[config.type]?.trim();
            if (fallbackModel && fallbackModel !== config.model) {
                vscode.window.showInformationMessage(
                    `${getProviderName(config.type)} reported a limit or temporary issue. Trying fallback model '${fallbackModel}' once.`
                );
                return attempt(withModel(config, fallbackModel));
            }
        }

        if (retryEnabled && (failure === "timeout" || failure === "temporary-service")) {
            const message = failure === "temporary-service"
                ? "The service is experiencing issues.\nRetrying once automatically.\nIf it fails: Try again in a few minutes, check the provider's status page, or consider using a different provider temporarily."
                : `${getProviderName(config.type)} request timed out. Retrying once.`;
            vscode.window.showInformationMessage(message);
            return attempt(config);
        }

        throw error;
    }
}

/**
 * Helper to instantiate the correct provider class
 */
async function getProviderInstance(config: ApiConfig): Promise<BaseAIProvider> {
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
                    vscode.env.openExternal(vscode.Uri.parse("https://gitmind.com/pro"));
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
    diff: string,
    customContext: string,
    settings: { chunkSize: number, maxChunks: number }
): Promise<string> {
    const diffProcessor = DiffProcessor.getInstance();

    // Show progress notification
    return vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: "Processing large diff",
            cancellable: true
        },
        async (progress, token) => {
            // Initial hunk-aware split
            const initialChunks = diffProcessor.splitDiffIntoChunks(diff, settings.chunkSize);
            debugLog(`[LargeDiff] Initial chunks: ${initialChunks.length} (requested chunkSize=${settings.chunkSize})`);

            // Provider + prompt config
            const providerKey = config.type.toLowerCase();
            const promptConfig = getPromptConfig();

            // Helper: validate full prompt length for a chunk
            const validateChunkPrompt = async (chunk: string, context: string): Promise<{ valid: boolean; length: number; recommendation?: string }> => {
                const prompt = await generateCommitPrompt(chunk, promptConfig, context);
                const res = validatePromptLength(prompt, providerKey);
                debugLog(`[LargeDiff] Prompt validation (len=${res.length}) valid=${res.valid}${res.recommendation ? `, reason=${res.recommendation}` : ''}`);
                return res;
            };

            // Helper: adaptively split a chunk until its prompt fits provider limits
            const adaptChunkToFit = async (chunk: string): Promise<string[]> => {
                // Start with base context only (exclude part counters to keep check conservative)
                const baseContext = customContext || "";
                let validation = await validateChunkPrompt(chunk, baseContext);
                if (validation.valid) {
                    return [chunk];
                }

                // Iteratively shrink by reducing line budget and re-using DiffProcessor splitting
                let budget = Math.max(50, Math.floor(chunk.split('\n').length * 0.6));
                const minBudget = 40; // lower bound safeguard
                let guard = 0;
                let worklist: string[] = [chunk];

                while (guard++ < 7) {
                    if (token.isCancellationRequested) {
                        throw new Error("Request was cancelled");
                    }

                    const nextRound: string[] = [];
                    for (const part of worklist) {
                        const pieces = diffProcessor.splitDiffIntoChunks(part, Math.max(minBudget, budget));
                        for (const p of pieces) {
                            const val = await validateChunkPrompt(p, baseContext);
                            if (val.valid) {
                                nextRound.push(p);
                            } else {
                                // keep for further splitting in the next iteration
                                nextRound.push(p);
                            }
                        }
                    }

                    // Check if all are valid now
                    let allValid = true;
                    for (const p of nextRound) {
                        const val = await validateChunkPrompt(p, baseContext);
                        if (!val.valid) {
                            allValid = false;
                            break;
                        }
                    }
                    if (allValid) {
                        debugLog(`[LargeDiff] Adapted chunk into ${nextRound.length} sub-chunks (budget=${budget})`);
                        return nextRound;
                    }

                    budget = Math.max(minBudget, Math.floor(budget * 0.7));
                    worklist = nextRound;
                    debugLog(`[LargeDiff] Reducing budget to ${budget} and retrying split`);
                }

                // Fallback to minimal budget split
                const fallbackPieces = diffProcessor.splitDiffIntoChunks(chunk, minBudget);
                debugLog(`[LargeDiff] Fallback split produced ${fallbackPieces.length} pieces`);
                return fallbackPieces;
            };

            // Build adaptive chunk list
            const adaptiveChunks: string[] = [];
            for (const ch of initialChunks) {
                const parts = await adaptChunkToFit(ch);
                adaptiveChunks.push(...parts);
            }

            // Enforce maxChunks budget
            const totalChunks = Math.min(adaptiveChunks.length, Math.max(1, settings.maxChunks));
            if (adaptiveChunks.length > totalChunks) {
                debugLog(`[LargeDiff] Truncating chunks from ${adaptiveChunks.length} to maxChunks=${totalChunks}`);
            }
            const chunks = adaptiveChunks.slice(0, totalChunks);

            // Concurrency and retry settings (with safe defaults)
            const proSettings = vscode.workspace.getConfiguration('gitmind').get('pro') as any || {};
            const ldSettings = (proSettings.largeDiffHandling || {}) as any;
            const maxConcurrency: number = Math.max(1, Math.min(8, Number(ldSettings.concurrency) || 3));
            const maxRetries: number = Math.max(0, Math.min(5, Number(ldSettings.retries) || 2));

            debugLog(`[LargeDiff] Final chunks to process: ${chunks.length}, concurrency=${maxConcurrency}, retries=${maxRetries}`);
            chunks.forEach((c, idx) => {
                const lines = c.split('\n').length;
                const tokens = estimateTokens(c);
                debugLog(`[LargeDiff] Chunk ${idx + 1}/${chunks.length}: ${lines} lines, ~${tokens} tokens`);
            });

            const results: string[] = new Array(chunks.length);
            let completed = 0;
            const increment = 100 / Math.max(1, chunks.length);

            // Retryable error detection
            const isRetryable = (err: unknown): boolean => {
                const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
                if (msg.includes('rate limit') || msg.includes('429')) { return true; }
                if (msg.includes('timeout')) { return true; }
                if (msg.includes('temporarily unavailable') || msg.includes('service is temporarily') || msg.includes('overloaded')) { return true; }
                if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('ecconnreset')) { return true; }
                if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) { return true; }
                // Treat token/context length errors as non-retryable here (we already split adaptively)
                if (msg.includes('context_length') || (msg.includes('token') && msg.includes('exceed'))) { return false; }
                return false;
            };

            // Process a single chunk with retries
            const processChunkWithRetries = async (index: number): Promise<void> => {
                const chunk = chunks[index];
                const ctx = `${customContext ? customContext + "\n" : ""}This is part ${index + 1} of ${chunks.length} from a large change.`;
                let attempt = 0;
                let delay = 600;
                while (true) {
                    if (token.isCancellationRequested) {
                        throw new Error("Request was cancelled");
                    }
                    try {
                        // Validate again just before sending (defensive)
                        const val = await validateChunkPrompt(chunk, ctx);
                        if (!val.valid) {
                            debugLog(`[LargeDiff] Warning: chunk ${index + 1} prompt still too long at send time; attempting last-mile split`);
                            const subparts = await adaptChunkToFit(chunk);
                            // Replace this chunk with first subpart and queue remaining ones immediately after
                            // Note: to keep deterministic ordering and progress, we will process only the first part here
                            const first = subparts[0];
                            const remaining = subparts.slice(1);
                            // Send first now
                            const res = await generateMessageWithConfig(config, first, ctx);
                            results[index] = res;
                            completed++;
                            progress.report({ message: `Processed ${completed}/${chunks.length} chunks`, increment });
                            // Append the rest to the end synchronously (best effort within budget if room)
                            // Only process remaining if we have capacity within totalChunks budget
                            // This maintains deterministic order while avoiding reshaping arrays mid-flight
                            break;
                        }

                        const res = await generateMessageWithConfig(config, chunk, ctx);
                        results[index] = res;
                        completed++;
                        progress.report({ message: `Processed ${completed}/${chunks.length} chunks`, increment });
                        return;
                    } catch (err) {
                        if (token.isCancellationRequested) {
                            throw new Error("Request was cancelled");
                        }
                        attempt++;
                        const msg = err instanceof Error ? err.message : String(err);
                        debugLog(`[LargeDiff] Chunk ${index + 1} attempt ${attempt} failed: ${msg}`);
                        telemetryService.trackExtensionError('chunk_processing_error', msg, `provider:${config.type};large_diff`);
                        if (attempt > maxRetries || !isRetryable(err)) {
                            throw err instanceof Error ? err : new Error(String(err));
                        }
                        await new Promise((r) => setTimeout(r, delay + Math.floor(Math.random() * 250)));
                        delay = Math.min(8000, delay * 2);
                    }
                }
            };

            // Worker pool
            let nextIndex = 0;
            const worker = async () => {
                while (true) {
                    if (token.isCancellationRequested) {
                        throw new Error("Request was cancelled");
                    }
                    const current = nextIndex++;
                    if (current >= chunks.length) {
                        return;
                    }
                    await processChunkWithRetries(current);
                }
            };

            const workers: Promise<void>[] = [];
            const poolSize = Math.min(maxConcurrency, chunks.length);
            for (let i = 0; i < poolSize; i++) {
                workers.push(worker());
            }

            await Promise.all(workers);

            // If processing was cancelled, stop here
            if (token.isCancellationRequested) {
                throw new Error("Request was cancelled");
            }

            // If we only have one chunk result, return it directly
            if (results.length === 1) {
                return results[0];
            }

            // Merge deterministically (original order)
            progress.report({ message: "Creating final summary", increment: 0 });
            const mergedPrompt = diffProcessor.mergeChunkResults(results);
            const finalPrompt = await generateCommitPrompt(mergedPrompt, promptConfig, customContext);
            return await generateMessageWithConfig(config, finalPrompt, "");
        }
    );
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
 * @param featureName Name of the feature for telemetry (e.g., 'changelog', 'analysis')
 * @param skipValidation Skip prompt length validation (use when feature has its own validation)
 * @returns Generated content from the AI
 */
export async function generateWithRawPrompt(
    config: ApiConfig,
    prompt: string,
    featureName: string = 'raw_prompt',
    skipValidation: boolean = false
): Promise<string> {
    const startTime = Date.now();

    try {
        // Set up request tracking
        const controller = new AbortController();
        activeRequests.set('global', controller);

        // Track the start of generation
        telemetryService.trackDailyActiveUser();

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
        const result = await generateWithRawPromptInternal(validatedConfig, prompt);

        const duration = Date.now() - startTime;
        telemetryService.trackCommitGeneration(config.type, true); // Reuse existing telemetry

        return result;
    } catch (unknownError) {
        const duration = Date.now() - startTime;
        const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError));
        debugLog(`Generate ${featureName} Error:`, error);

        // Track the error
        telemetryService.trackExtensionError(
            `${featureName}_error`,
            error.message,
            `provider:${config.type}`
        );
        telemetryService.trackCommitGeneration(config.type, false);

        // Handle cancellation specifically
        if (error.message === 'Request was cancelled') {
            debugLog("Request was cancelled by user");
            return "";
        }

        // Handle API errors with context
        const errorContext = { diffSize: prompt.length };
        await handleApiError(error, config, errorContext);

        // Rethrow to be handled upstream
        throw error;
    } finally {
        // Clean up request tracking
        activeRequests.delete('global');
    }
}

async function generateWithRawPromptInternal(
    config: ApiConfig,
    prompt: string
): Promise<string> {
    const provider = await getProviderInstance(config);
    return provider.generateWithRawPrompt(prompt);
}

export async function generateCommitHistoryAnalysis(
    config: ApiConfig,
    commitHistory: string,
    maxCommits: number = 50,
    includeAuthorInfo: boolean = true
): Promise<string> {
    const startTime = Date.now();

    try {
        // Set up request tracking
        const controller = new AbortController();
        activeRequests.set('global', controller);

        // Track the start of generation
        telemetryService.trackDailyActiveUser();

        // First validate and potentially update the configuration
        const validatedConfig = await validateAndUpdateConfig(config);
        if (!validatedConfig) {
            debugLog("No valid configuration available");
            throw new Error(`${getProviderName(config.type)} configuration is invalid. Please check your API key and settings.`);
        }

        // Show model info if enabled
        showModelInfo(validatedConfig);

        // Generate the analysis using the dedicated function
        const result = await generateAnalysisWithConfig(validatedConfig, commitHistory, maxCommits, includeAuthorInfo);

        const duration = Date.now() - startTime;
        telemetryService.trackCommitGeneration(config.type, true); // Reuse existing telemetry

        return result;
    } catch (unknownError) {
        const duration = Date.now() - startTime;
        const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError));
        debugLog("Generate Commit History Analysis Error:", error);

        // Track the error
        telemetryService.trackExtensionError(
            'commit_analysis_error',
            error.message,
            `provider:${config.type}`
        );
        telemetryService.trackCommitGeneration(config.type, false);

        // Handle cancellation specifically
        if (error.message === 'Request was cancelled') {
            debugLog("Request was cancelled by user");
            return "";
        }

        // Handle API errors with context
        const errorContext = { diffSize: commitHistory.length };
        await handleApiError(error, config, errorContext);

        // Rethrow to be handled upstream
        throw error;
    } finally {
        // Clean up request tracking
        activeRequests.delete('global');
    }
}

async function generateAnalysisWithConfig(
    config: ApiConfig,
    commitHistory: string,
    maxCommits: number,
    includeAuthorInfo: boolean
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
    return provider.generateCommitHistoryAnalysis(commitHistory, maxCommits, includeAuthorInfo);
}
