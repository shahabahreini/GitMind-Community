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
    CustomApiConfig,
} from "../../config/types";
// Lazy-loaded provider imports - loaded only when needed to reduce bundle size
// This significantly reduces initial bundle size by ~200-300KB
import { OnboardingManager } from "../../utils/onboardingManager";
import {
    checkOllamaAvailability,
    getOllamaInstallInstructions,
} from "../../utils/ollamaHelper";
import { debugLog } from "../debug/logger";
import { getApiConfig } from "../../config/settings";
import { estimateTokens } from "../../utils/tokenCounter";
import { workspace } from "vscode";
import { DiagnosticsWebview } from "../../webview/diagnostics/DiagnosticsWebview";
import { RequestManager } from "../../utils/requestManager";
import { APIErrorHandler } from "../../utils/errorHandler";
import { telemetryService } from "../telemetry/telemetryService";
import { SubscriptionManager } from "../subscription/SubscriptionManager";
import { DiffProcessor } from "../diffProcessor";
import { generateCommitHistoryAnalysisPrompt, validatePromptLength, generateCommitPrompt, getPromptConfig } from './prompts';

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


type ApiProvider = "Gemini" | "Hugging Face" | "Ollama" | "Mistral" | "Cohere" | "OpenAI" | "Together AI" | "OpenRouter" | "Anthropic" | "MiniMax" | "GitHub Copilot" | "DeepSeek" | "Grok" | "Perplexity" | "Custom API";

// Type for lazy-loaded API call functions
type ApiCallFunction = (apiKey: string, model: string, diff: string, customContext: string) => Promise<string>;

interface ProviderConfig {
    name: ApiProvider;
    displayName: string;
    settingPath: string;
    docsUrl: string;
    requiresApiKey: boolean;
    defaultModel?: string;
    // Lazy-load the API call function on demand
    getApiCall: () => Promise<ApiCallFunction>;
}

// Cache for loaded provider modules to avoid re-importing
const providerModuleCache = new Map<string, ApiCallFunction>();

/**
 * Lazy-load a provider's API call function
 * This reduces initial bundle size by loading providers only when used
 */
async function loadProviderModule(provider: string): Promise<ApiCallFunction> {
    // Check cache first
    if (providerModuleCache.has(provider)) {
        debugLog(`[LazyLoad] Using cached module for provider: ${provider}`);
        return providerModuleCache.get(provider)!;
    }

    debugLog(`[LazyLoad] Loading module for provider: ${provider}`);

    let apiCallFunction: ApiCallFunction;

    try {
        switch (provider) {
            case 'gemini':
                const geminiModule = await import('./gemini.js');
                apiCallFunction = geminiModule.callGeminiAPI;
                break;
            case 'huggingface':
                const huggingfaceModule = await import('./huggingface.js');
                apiCallFunction = huggingfaceModule.callHuggingFaceAPI;
                break;
            case 'ollama':
                const ollamaModule = await import('./ollama.js');
                apiCallFunction = ollamaModule.callOllamaAPI;
                break;
            case 'mistral':
                const mistralModule = await import('./mistral.js');
                apiCallFunction = mistralModule.callMistralAPI;
                break;
            case 'cohere':
                const cohereModule = await import('./cohere.js');
                apiCallFunction = cohereModule.callCohereAPI;
                break;
            case 'openai':
                const openaiModule = await import('./openai.js');
                apiCallFunction = openaiModule.callOpenAIAPI;
                break;
            case 'together':
                const togetherModule = await import('./together.js');
                apiCallFunction = togetherModule.callTogetherAPI;
                break;
            case 'openrouter':
                const openrouterModule = await import('./openrouter.js');
                apiCallFunction = openrouterModule.callOpenRouterAPI;
                break;
            case 'anthropic':
                const anthropicModule = await import('./anthropic.js');
                apiCallFunction = anthropicModule.callAnthropicAPI;
                break;
            case 'minimax':
                const minimaxModule = await import('./minimax.js');
                apiCallFunction = minimaxModule.callMiniMaxAPI;
                break;
            case 'copilot':
                const copilotModule = await import('./copilot.js');
                apiCallFunction = copilotModule.callCopilotAPI;
                break;
            case 'deepseek':
                const deepseekModule = await import('./deepseek.js');
                apiCallFunction = deepseekModule.callDeepSeekAPI;
                break;
            case 'grok':
                const grokModule = await import('./grok.js');
                apiCallFunction = grokModule.callGrokAPI;
                break;
            case 'perplexity':
                const perplexityModule = await import('./perplexity.js');
                apiCallFunction = perplexityModule.callPerplexityAPI;
                break;
            case 'custom':
                const customModule = await import('./custom.js');
                // Custom API has a different signature, but we still need to return it
                // It will be called with its full parameter list in handleCustomProvider
                apiCallFunction = customModule.callCustomAPI as any;
                break;
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }

        // Cache the loaded function
        providerModuleCache.set(provider, apiCallFunction);
        debugLog(`[LazyLoad] Successfully loaded and cached module for provider: ${provider}`);

        return apiCallFunction;
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
        defaultModel: "gemini-pro",
        getApiCall: async () => loadProviderModule('gemini'),
    },
    huggingface: {
        name: "Hugging Face",
        displayName: "Hugging Face",
        settingPath: "huggingface.apiKey",
        docsUrl: "https://huggingface.co/settings/tokens",
        requiresApiKey: true,
        getApiCall: async () => loadProviderModule('huggingface'),
    },
    mistral: {
        name: "Mistral",
        displayName: "Mistral AI",
        settingPath: "mistral.apiKey",
        docsUrl: "https://console.mistral.ai/api-keys/",
        requiresApiKey: true,
        getApiCall: async () => loadProviderModule('mistral'),
    },
    cohere: {
        name: "Cohere",
        displayName: "Cohere",
        settingPath: "cohere.apiKey",
        docsUrl: "https://dashboard.cohere.com/api-keys",
        requiresApiKey: true,
        getApiCall: async () => loadProviderModule('cohere'),
    },
    openai: {
        name: "OpenAI",
        displayName: "OpenAI",
        settingPath: "openai.apiKey",
        docsUrl: "https://platform.openai.com/api-keys",
        requiresApiKey: true,
        getApiCall: async () => loadProviderModule('openai'),
    },
    together: {
        name: "Together AI",
        displayName: "Together AI",
        settingPath: "together.apiKey",
        docsUrl: "https://api.together.xyz/settings/api-keys",
        requiresApiKey: true,
        getApiCall: async () => loadProviderModule('together'),
    },
    openrouter: {
        name: "OpenRouter",
        displayName: "OpenRouter",
        settingPath: "openrouter.apiKey",
        docsUrl: "https://openrouter.ai/keys",
        requiresApiKey: true,
        getApiCall: async () => loadProviderModule('openrouter'),
    },
    anthropic: {
        name: "Anthropic",
        displayName: "Anthropic",
        settingPath: "anthropic.apiKey",
        docsUrl: "https://console.anthropic.com/",
        requiresApiKey: true,
        defaultModel: "claude-3-5-sonnet-20241022",
        getApiCall: async () => loadProviderModule('anthropic'),
    },
    minimax: {
        name: "MiniMax",
        displayName: "MiniMax",
        settingPath: "minimax.apiKey",
        docsUrl: "https://platform.minimax.io/docs/api-reference/text-anthropic-api",
        requiresApiKey: true,
        defaultModel: "MiniMax-M2",
        getApiCall: async () => loadProviderModule('minimax'),
    },
    deepseek: {
        name: "DeepSeek",
        displayName: "DeepSeek",
        settingPath: "deepseek.apiKey",
        docsUrl: "https://platform.deepseek.com/api_keys",
        requiresApiKey: true,
        getApiCall: async () => loadProviderModule('deepseek'),
    },
    grok: {
        name: "Grok",
        displayName: "Grok",
        settingPath: "grok.apiKey",
        docsUrl: "https://console.x.ai/",
        requiresApiKey: true,
        getApiCall: async () => loadProviderModule('grok'),
    },
    perplexity: {
        name: "Perplexity",
        displayName: "Perplexity",
        settingPath: "perplexity.apiKey",
        docsUrl: "https://www.perplexity.ai/settings/api",
        requiresApiKey: true,
        getApiCall: async () => loadProviderModule('perplexity'),
    },
    custom: {
        name: "Custom API",
        displayName: "Custom API",
        settingPath: "custom.authToken",
        docsUrl: "",
        requiresApiKey: false, // Handled separately in handleCustomProvider
        getApiCall: async () => loadProviderModule('custom'),
    },
    ollama: {
        name: "Ollama",
        displayName: "Ollama",
        settingPath: "",
        docsUrl: "",
        requiresApiKey: false,
        getApiCall: async () => loadProviderModule('ollama'),
    },
    copilot: {
        name: "GitHub Copilot",
        displayName: "GitHub Copilot",
        settingPath: "",
        docsUrl: "",
        requiresApiKey: false,
        defaultModel: "gpt-4o",
        getApiCall: async () => loadProviderModule('copilot'),
    },
};

// Request management
let currentRequestController: AbortController | null = null;
let isCurrentlyActive = false;

export function cancelCurrentRequest(): void {
    if (currentRequestController) {
        currentRequestController.abort();
        currentRequestController = null;
    }
    isCurrentlyActive = false;
    debugLog("Current request cancelled");
}

export function isRequestActive(): boolean {
    return isCurrentlyActive;
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
    if (error.message.includes('Together AI API error: 422') ||
        error.message.includes('tokens') && error.message.includes('exceed')) {
        // Show the detailed error message as-is for token limit errors
        await vscode.window.showErrorMessage(error.message, { modal: true });
        return;
    }

    // Use the error handler for other errors
    const errorInfo = APIErrorHandler.handleAPIError(error, provider, context);
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
        currentRequestController = new AbortController();
        isCurrentlyActive = true;

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

        // Generate the commit message
        const result = await generateMessageWithConfig(validatedConfig, diff, customContext);

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
        currentRequestController = null;
        isCurrentlyActive = false;
    }
}

async function generateMessageWithConfig(
    config: ApiConfig,
    diff: string,
    customContext: string = ""
): Promise<string> {
    // Model info is displayed in the parent function
    showModelInfo(config);

    const providerConfig = PROVIDER_CONFIGS[config.type];
    if (!providerConfig) {
        throw new Error(`Unsupported API provider: ${config.type}`);
    }

    // Handle special cases
    if (config.type === "ollama") {
        return await handleOllamaProvider(config as OllamaApiConfig, diff, customContext);
    }

    if (config.type === "copilot") {
        const copilotConfig = config as CopilotApiConfig;
        debugLog(`[Copilot Handler] Model from config: "${copilotConfig.model}", Type: ${typeof copilotConfig.model}, Falsy: ${!copilotConfig.model}`);

        if (!copilotConfig.model || copilotConfig.model.trim() === "") {
            debugLog(`[Copilot Handler] Invalid model detected, showing error message`);
            await vscode.window.showErrorMessage(
                "Please select a GitHub Copilot model in the settings."
            );
            await vscode.commands.executeCommand("gitmind.openSettings");
            return "";
        }
        // Lazy-load the Copilot API call function
        debugLog(`[Copilot Handler] Calling Copilot API with model: "${copilotConfig.model}"`);
        const copilotApiCall = await loadProviderModule('copilot');
        return await copilotApiCall("", copilotConfig.model, diff, customContext);
    }

    if (config.type === "custom") {
        return await handleCustomProvider(config as CustomApiConfig, diff, customContext);
    }

    // Handle standard providers
    return await handleStandardProvider(config, providerConfig, diff, customContext);
}

async function handleCustomProvider(
    config: CustomApiConfig,
    diff: string,
    customContext: string
): Promise<string> {
    // Check Pro status
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

    // Validate required fields
    if (!config.baseUrl || !config.endpoint) {
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

    if (!config.authToken && config.authType !== "none") {
        await vscode.window.showErrorMessage(
            "Custom API authentication token is required. Please configure it in settings.",
            "Open Settings"
        ).then(selection => {
            if (selection === "Open Settings") {
                vscode.commands.executeCommand("gitmind.openSettings");
            }
        });
        return "";
    }

    if (!config.model) {
        await vscode.window.showErrorMessage(
            "Custom API model name is required. Please configure it in settings.",
            "Open Settings"
        ).then(selection => {
            if (selection === "Open Settings") {
                vscode.commands.executeCommand("gitmind.openSettings");
            }
        });
        return "";
    }

    // Lazy-load the custom API call function
    // Note: customApiCall has a different signature than the standard ApiCallFunction
    const customApiCall = (await loadProviderModule('custom')) as any;
    return await customApiCall(
        config.baseUrl,
        config.endpoint,
        config.authType,
        config.authToken,
        config.headerKey || '',
        config.requestFormat,
        config.responseFormat,
        config.model,
        diff,
        customContext
    );
}

async function handleOllamaProvider(
    config: OllamaApiConfig,
    diff: string,
    customContext: string
): Promise<string> {
    if (!config.url) {
        await vscode.window.showErrorMessage(
            "Ollama URL not configured. Please check the extension settings."
        );
        await vscode.commands.executeCommand("gitmind.openSettings");
        return "";
    }
    if (!config.model) {
        await vscode.window.showErrorMessage(
            "Ollama model not specified. Please select a model in the extension settings."
        );
        await vscode.commands.executeCommand("gitmind.openSettings");
        return "";
    }

    const isOllamaAvailable = await checkOllamaAvailability(config.url);
    if (!isOllamaAvailable) {
        const instructions = getOllamaInstallInstructions();
        await vscode.window.showErrorMessage("Ollama Connection Error", {
            modal: true,
            detail: instructions,
        });
        return "";
    }

    // Lazy-load the Ollama API call function
    const ollamaApiCall = await loadProviderModule('ollama');
    return await ollamaApiCall(config.url, config.model, diff, customContext);
}

async function handleStandardProvider(
    config: ApiConfig,
    providerConfig: ProviderConfig,
    diff: string,
    customContext: string
): Promise<string> {
    const typedConfig = config as any;

    // Check for API key if required
    if (providerConfig.requiresApiKey && !typedConfig.apiKey) {
        const apiKey = await promptForApiKey(providerConfig);
        if (!apiKey) {
            return "";
        }
        typedConfig.apiKey = apiKey;
    }

    // Check for model
    if (!typedConfig.model) {
        await vscode.window.showErrorMessage(
            `Please select a ${providerConfig.displayName} model in the settings.`
        );
        await vscode.commands.executeCommand("gitmind.openSettings");
        return "";
    }

    // Lazy-load the provider's API call function
    const apiCallFunction = await providerConfig.getApiCall();

    return await apiCallFunction(
        typedConfig.apiKey || "",
        typedConfig.model,
        diff,
        customContext
    );
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
            return await generateMessageWithConfig(config, "", mergedPrompt);
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
        currentRequestController = new AbortController();
        isCurrentlyActive = true;

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
        currentRequestController = null;
        isCurrentlyActive = false;
    }
}

async function generateWithRawPromptInternal(
    config: ApiConfig,
    prompt: string
): Promise<string> {
    const providerConfig = PROVIDER_CONFIGS[config.type];
    if (!providerConfig) {
        throw new Error(`Unsupported API provider: ${config.type}`);
    }

    // Handle special cases
    if (config.type === "ollama") {
        return await handleOllamaRawPromptProvider(config as OllamaApiConfig, prompt);
    }

    if (config.type === "copilot") {
        const copilotConfig = config as CopilotApiConfig;
        if (!copilotConfig.model) {
            await vscode.window.showErrorMessage(
                "Please select a GitHub Copilot model in the settings."
            );
            await vscode.commands.executeCommand("gitmind.openSettings");
            return "";
        }
        return await callCopilotRawPromptAPI(copilotConfig.model, prompt);
    }

    // Handle standard providers
    return await handleStandardRawPromptProvider(config, providerConfig, prompt);
}

async function handleOllamaRawPromptProvider(
    config: OllamaApiConfig,
    prompt: string
): Promise<string> {
    if (!config.url) {
        await vscode.window.showErrorMessage(
            "Ollama URL not configured. Please check the extension settings."
        );
        await vscode.commands.executeCommand("gitmind.openSettings");
        return "";
    }
    if (!config.model) {
        await vscode.window.showErrorMessage(
            "Ollama model not specified. Please select a model in the extension settings."
        );
        await vscode.commands.executeCommand("gitmind.openSettings");
        return "";
    }

    const isOllamaAvailable = await checkOllamaAvailability(config.url);
    if (!isOllamaAvailable) {
        const instructions = getOllamaInstallInstructions();
        await vscode.window.showErrorMessage("Ollama Connection Error", {
            modal: true,
            detail: instructions,
        });
        return "";
    }

    return await callOllamaRawPromptAPI(config.url, config.model, prompt);
}

async function handleStandardRawPromptProvider(
    config: ApiConfig,
    providerConfig: ProviderConfig,
    prompt: string
): Promise<string> {
    const typedConfig = config as any;

    // Check for API key if required
    if (providerConfig.requiresApiKey && !typedConfig.apiKey) {
        const apiKey = await promptForApiKey(providerConfig);
        if (!apiKey) {
            return "";
        }
        typedConfig.apiKey = apiKey;
    }

    // Check for model
    if (!typedConfig.model) {
        await vscode.window.showErrorMessage(
            `Please select a ${providerConfig.displayName} model in the settings.`
        );
        await vscode.commands.executeCommand("gitmind.openSettings");
        return "";
    }

    return await callProviderRawPromptAPI(
        config.type,
        typedConfig.apiKey || "",
        typedConfig.model,
        prompt
    );
}

async function callProviderRawPromptAPI(
    providerType: string,
    apiKey: string,
    model: string,
    prompt: string
): Promise<string> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    switch (providerType) {
        case 'gemini': {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(apiKey);
            const generativeModel = genAI.getGenerativeModel({ model });
            const result = await generativeModel.generateContent(prompt);
            return result.response.text();
        }
        case 'openai': {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                }),
                signal: controller.signal
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
            }
            const data = await response.json();
            return data.choices[0].message.content;
        }
        case 'anthropic': {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 4096
                }),
                signal: controller.signal
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
            }
            const data = await response.json();
            return data.content[0].text;
        }
        case 'mistral': {
            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }]
                }),
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data.choices[0].message.content;
        }
        case 'cohere': {
            const response = await fetch('https://api.cohere.ai/v2/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 4096
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                const baseMessage = `Cohere API error: ${response.status} ${response.statusText}`;
                if (response.status === 404) {
                    throw new Error(
                        `${baseMessage}. The requested model or endpoint may not exist. ` +
                        `Check the model name in settings and ensure it's a Cohere chat-capable model. ` +
                        `${errorText ? `Details: ${errorText}` : ''}`
                    );
                }
                throw new Error(`${baseMessage}${errorText ? ` - ${errorText}` : ''}`);
            }

            const data = await response.json();
            const contentItems = data?.message?.content;
            if (!Array.isArray(contentItems)) {
                throw new Error('Cohere API returned an unexpected response format (missing message.content).');
            }
            const responseText = contentItems
                .filter((item: any) => item?.type === 'text' && typeof item?.text === 'string')
                .map((item: any) => item.text)
                .join('')
                .trim();

            if (!responseText) {
                throw new Error('Cohere API returned no text content.');
            }

            return responseText;
        }
        case 'together': {
            const response = await fetch('https://api.together.xyz/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }]
                }),
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`Together AI API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data.choices[0].message.content;
        }
        case 'openrouter': {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://github.com/gitmind',
                    'X-Title': 'GitMind'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }]
                }),
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data.choices[0].message.content;
        }
        case 'deepseek': {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }]
                }),
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data.choices[0].message.content;
        }
        case 'grok': {
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }]
                }),
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data.choices[0].message.content;
        }
        case 'perplexity': {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }]
                }),
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data.choices[0].message.content;
        }
        case 'huggingface': {
            const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 4096,
                        temperature: 0.7
                    }
                }),
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? data[0].generated_text : data.generated_text;
        }
        case 'custom': {
            const customConfig = vscode.workspace.getConfiguration('gitmind').get('custom') as any;
            const { callCustomAPI } = await import('./custom.js');
            return await callCustomAPI(
                customConfig.baseUrl,
                customConfig.endpoint,
                customConfig.authType,
                apiKey,
                customConfig.headerKey || '',
                customConfig.requestFormat,
                customConfig.responseFormat,
                model,
                prompt,
                ''
            );
        }
        default:
            throw new Error(`Unsupported API provider: ${providerType}`);
    }
}

async function callOllamaRawPromptAPI(url: string, model: string, prompt: string): Promise<string> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    const response = await fetch(`${url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            stream: false
        }),
        signal: controller.signal
    });
    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.response;
}

async function callCopilotRawPromptAPI(model: string, prompt: string): Promise<string> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    const copilotApi = await vscode.lm.selectChatModels({ family: model });
    if (!copilotApi || copilotApi.length === 0) {
        throw new Error('GitHub Copilot not available');
    }
    const messages = [vscode.LanguageModelChatMessage.User(prompt)];
    const cancellationToken = new vscode.CancellationTokenSource();
    controller.signal.addEventListener('abort', () => cancellationToken.cancel());
    const response = await copilotApi[0].sendRequest(messages, {}, cancellationToken.token);
    let result = '';
    for await (const chunk of response.text) {
        result += chunk;
    }
    return result;
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
        currentRequestController = new AbortController();
        isCurrentlyActive = true;

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
        currentRequestController = null;
        isCurrentlyActive = false;
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
    const provider = getProviderName(config.type);
    if (!checkCircuitBreaker(provider)) {
        throw new Error(`${provider} is temporarily unavailable due to recent failures. Please try again in a minute.`);
    }

    // Generate the analysis prompt
    const analysisPrompt = generateCommitHistoryAnalysisPrompt(
        commitHistory,
        maxCommits,
        includeAuthorInfo
    );

    // Validate prompt length for the specific provider
    const validation = validatePromptLength(analysisPrompt, config.type.toLowerCase());
    if (!validation.valid) {
        debugLog(`[CommitHistory] Prompt validation failed: ${validation.recommendation}`);
        throw new Error(`Prompt too long for ${config.type}: ${validation.recommendation}`);
    }

    // Log the complete prompt being sent to the AI provider
    debugLog('[CommitHistory] ==================== COMPLETE AI PROMPT ====================');
    debugLog(`[CommitHistory] Provider: ${config.type}, Max Commits: ${maxCommits}, Include Author: ${includeAuthorInfo}`);
    debugLog(`[CommitHistory] Prompt length: ${analysisPrompt.length} characters (validated: ${validation.valid})`);
    debugLog('[CommitHistory] Full prompt being sent to AI provider:');
    debugLog(analysisPrompt);
    debugLog('[CommitHistory] ================================================================');

    // Handle special cases
    if (config.type === "ollama") {
        return await handleOllamaAnalysisProvider(config as OllamaApiConfig, analysisPrompt);
    }

    if (config.type === "copilot") {
        const copilotConfig = config as CopilotApiConfig;
        if (!copilotConfig.model) {
            await vscode.window.showErrorMessage(
                "Please select a GitHub Copilot model in the settings."
            );
            await vscode.commands.executeCommand("gitmind.openSettings");
            return "";
        }
        return await callCopilotAnalysisAPI(copilotConfig.model, analysisPrompt);
    }

    // Handle standard providers
    return await handleStandardAnalysisProvider(config, providerConfig, analysisPrompt);
}

async function handleOllamaAnalysisProvider(
    config: OllamaApiConfig,
    analysisPrompt: string
): Promise<string> {
    if (!config.url) {
        await vscode.window.showErrorMessage(
            "Ollama URL not configured. Please check the extension settings."
        );
        await vscode.commands.executeCommand("gitmind.openSettings");
        return "";
    }
    if (!config.model) {
        await vscode.window.showErrorMessage(
            "Ollama model not specified. Please select a model in the extension settings."
        );
        await vscode.commands.executeCommand("gitmind.openSettings");
        return "";
    }

    const isOllamaAvailable = await checkOllamaAvailability(config.url);
    if (!isOllamaAvailable) {
        const instructions = getOllamaInstallInstructions();
        await vscode.window.showErrorMessage("Ollama Connection Error", {
            modal: true,
            detail: instructions,
        });
        return "";
    }

    return await callOllamaAnalysisAPI(config.url, config.model, analysisPrompt);
}

async function handleStandardAnalysisProvider(
    config: ApiConfig,
    providerConfig: ProviderConfig,
    analysisPrompt: string
): Promise<string> {
    const typedConfig = config as any;

    // Check for API key if required
    if (providerConfig.requiresApiKey && !typedConfig.apiKey) {
        const apiKey = await promptForApiKey(providerConfig);
        if (!apiKey) {
            return "";
        }
        typedConfig.apiKey = apiKey;
    }

    // Check for model
    if (!typedConfig.model) {
        await vscode.window.showErrorMessage(
            `Please select a ${providerConfig.displayName} model in the settings.`
        );
        await vscode.commands.executeCommand("gitmind.openSettings");
        return "";
    }

    return await callProviderAnalysisAPI(
        config.type,
        typedConfig.apiKey || "",
        typedConfig.model,
        analysisPrompt
    );
}

async function callProviderAnalysisAPI(
    providerType: string,
    apiKey: string,
    model: string,
    analysisPrompt: string
): Promise<string> {
    switch (providerType) {
        case 'gemini':
            return await callGeminiAnalysisAPI(apiKey, model, analysisPrompt);
        case 'openai':
            return await callOpenAIAnalysisAPI(apiKey, model, analysisPrompt);
        case 'anthropic':
            return await callAnthropicAnalysisAPI(apiKey, model, analysisPrompt);
        case 'cohere':
            return await callCohereAnalysisAPI(apiKey, model, analysisPrompt);
        case 'mistral':
            return await callMistralAnalysisAPI(apiKey, model, analysisPrompt);
        case 'together':
            return await callTogetherAnalysisAPI(apiKey, model, analysisPrompt);
        case 'openrouter':
            return await callOpenRouterAnalysisAPI(apiKey, model, analysisPrompt);
        case 'huggingface':
            return await callHuggingFaceAnalysisAPI(apiKey, model, analysisPrompt);
        case 'deepseek':
            return await callDeepSeekAnalysisAPI(apiKey, model, analysisPrompt);
        case 'grok':
            return await callGrokAnalysisAPI(apiKey, model, analysisPrompt);
        case 'perplexity':
            return await callPerplexityAnalysisAPI(apiKey, model, analysisPrompt);
        case 'custom':
            const config = vscode.workspace.getConfiguration("gitmind").get("custom") as any;
            return await callCustomAnalysisAPI(
                config.baseUrl,
                config.endpoint,
                config.authType,
                apiKey,
                config.headerKey || '',
                config.requestFormat,
                config.responseFormat,
                model,
                analysisPrompt
            );
        default:
            throw new Error(`Unsupported API provider: ${providerType}`);
    }
}

// Individual analysis API functions
async function callGeminiAnalysisAPI(apiKey: string, model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Calling Gemini API with model: ${model}`);
    debugLog('[CommitHistory] Gemini Analysis Prompt:');
    debugLog(analysisPrompt);

    try {
        // Import Gemini API utilities
        const { GoogleGenerativeAI } = await import("@google/generative-ai");

        const genAI = new GoogleGenerativeAI(apiKey);
        const generativeModel = genAI.getGenerativeModel({
            model: model,
            generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.9,
                // No maxOutputTokens limit for full commit analysis reports
            },
        });

        const result = await generativeModel.generateContent(analysisPrompt);
        const responseText = result.response.text();

        debugLog('[CommitHistory] ==================== GEMINI API RESPONSE ====================');
        debugLog(`[CommitHistory] Response length: ${responseText.length} characters`);
        debugLog('[CommitHistory] Response content:');
        debugLog(responseText);
        debugLog('[CommitHistory] ===============================================================');

        return responseText;
    } catch (error) {
        debugLog('[CommitHistory] Error in callGeminiAnalysisAPI:', error);

        // Provide more helpful error messages
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
            throw new Error(`Model '${model}' is not found or not supported for this API version. Please check the model name in settings or try a different Gemini model like 'gemini-2.0-flash'.`);
        } else if (errorMessage.includes("permission") || errorMessage.includes("access") || errorMessage.includes("403")) {
            throw new Error(`Access denied to model '${model}'. Please verify your API key has access to this model.`);
        } else if (errorMessage.includes("401") || errorMessage.includes("unauthorized") || errorMessage.includes("API key")) {
            throw new Error(`Invalid or missing Gemini API key. Please check your API key in settings.`);
        } else if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
            throw new Error(`Gemini API rate limit exceeded. Please wait a few minutes and try again.`);
        } else if (errorMessage.includes("500") || errorMessage.includes("502") || errorMessage.includes("503") || errorMessage.includes("504")) {
            throw new Error(`Gemini API service error. The service may be temporarily unavailable. Please try again later.`);
        } else {
            throw new Error(`Failed to analyze commit history with Gemini: ${errorMessage}`);
        }
    }
}

async function callOpenAIAnalysisAPI(apiKey: string, model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Calling OpenAI API with model: ${model}`);
    debugLog('[CommitHistory] OpenAI Analysis Prompt:');
    debugLog(analysisPrompt);

    // Determine timeout based on prompt size
    const promptLength = analysisPrompt.length;
    const timeout = promptLength > 50000 ? LARGE_COMMIT_HISTORY_TIMEOUT : COMMIT_HISTORY_ANALYSIS_TIMEOUT;
    debugLog(`[CommitHistory] Using timeout: ${timeout}ms for prompt of length: ${promptLength}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        debugLog('[CommitHistory] Request timed out, aborting...');
        controller.abort();
    }, timeout);

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "user",
                        content: analysisPrompt
                    }
                ],
                temperature: 0.3,
                // No max_tokens limit for full commit analysis reports
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const responseText = data.choices[0]?.message?.content || "";

        debugLog('[CommitHistory] ==================== OPENAI API RESPONSE ====================');
        debugLog(`[CommitHistory] Response length: ${responseText.length} characters`);
        debugLog('[CommitHistory] Response content:');
        debugLog(responseText);
        debugLog('[CommitHistory] ===============================================================');

        return responseText;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Commit history analysis request timed out. Please try with fewer commits or check your connection.');
        }
        throw error;
    }
}

async function callAnthropicAnalysisAPI(apiKey: string, model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Calling Anthropic API with model: ${model}`);
    debugLog('[CommitHistory] Anthropic Analysis Prompt:');
    debugLog(analysisPrompt);

    // Determine timeout based on prompt size
    const promptLength = analysisPrompt.length;
    const timeout = promptLength > 50000 ? LARGE_COMMIT_HISTORY_TIMEOUT : COMMIT_HISTORY_ANALYSIS_TIMEOUT;
    debugLog(`[CommitHistory] Using timeout: ${timeout}ms for prompt of length: ${promptLength}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        debugLog('[CommitHistory] Request timed out, aborting...');
        controller.abort();
    }, timeout);

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: model,
                temperature: 0.3,
                messages: [
                    {
                        role: "user",
                        content: analysisPrompt
                    }
                ],
                // No max_tokens limit for full commit analysis reports
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const responseText = data.content[0]?.text || "";

        debugLog('[CommitHistory] ==================== ANTHROPIC API RESPONSE ==================');
        debugLog(`[CommitHistory] Response length: ${responseText.length} characters`);
        debugLog('[CommitHistory] Response content:');
        debugLog(responseText);
        debugLog('[CommitHistory] ===============================================================');

        return responseText;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Commit history analysis request timed out. Please try with fewer commits or check your connection.');
        }
        throw error;
    }
}

async function callCohereAnalysisAPI(apiKey: string, model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Calling Cohere API with model: ${model}`);
    debugLog('[CommitHistory] Cohere Analysis Prompt:');
    debugLog(analysisPrompt);

    // Determine timeout based on prompt size
    const promptLength = analysisPrompt.length;
    const timeout = promptLength > 50000 ? LARGE_COMMIT_HISTORY_TIMEOUT : COMMIT_HISTORY_ANALYSIS_TIMEOUT;
    debugLog(`[CommitHistory] Using timeout: ${timeout}ms for prompt of length: ${promptLength}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        debugLog('[CommitHistory] Request timed out, aborting...');
        controller.abort();
    }, timeout);

    try {
        const response = await fetch("https://api.cohere.ai/v2/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "Accept": "application/json",
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "user",
                        content: analysisPrompt
                    }
                ],
                temperature: 0.3,
                // No max_tokens limit for full commit analysis reports
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            debugLog(`[CommitHistory] Cohere API error details: ${errorText}`);

            const baseMessage = `Cohere API error: ${response.status} ${response.statusText}`;
            if (response.status === 404) {
                throw new Error(
                    `${baseMessage}. The requested model or endpoint may not exist. ` +
                    `Check the model name in settings and ensure you have access to it. ` +
                    `${errorText ? `Details: ${errorText}` : ''}`
                );
            }

            throw new Error(`${baseMessage}${errorText ? ` - ${errorText}` : ''}`);
        }

        const data = await response.json();
        const contentItems = data?.message?.content;
        const responseText = Array.isArray(contentItems)
            ? contentItems
                .filter((item: any) => item?.type === 'text' && typeof item?.text === 'string')
                .map((item: any) => item.text)
                .join('')
                .trim()
            : "";

        debugLog('[CommitHistory] ==================== COHERE API RESPONSE ====================');
        debugLog(`[CommitHistory] Response length: ${responseText.length} characters`);
        debugLog('[CommitHistory] Response content:');
        debugLog(responseText);
        debugLog('[CommitHistory] ===============================================================');

        return responseText;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Commit history analysis request timed out. Please try with fewer commits or check your connection.');
        }
        throw error;
    }
}

// Placeholder functions for other providers (implement as needed)
async function callMistralAnalysisAPI(apiKey: string, model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Calling Mistral API with model: ${model} (native implementation)`);
    debugLog('[CommitHistory] Mistral Analysis Prompt:');
    debugLog(analysisPrompt);

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: "user",
                    content: analysisPrompt
                }
            ],
            temperature: 0.3,
            // max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "";

    debugLog('[CommitHistory] ==================== MISTRAL API RESPONSE ====================');
    debugLog(`[CommitHistory] Response length: ${responseText.length} characters`);
    debugLog('[CommitHistory] Response content:');
    debugLog(responseText);
    debugLog('[CommitHistory] ===============================================================');

    return responseText;
}

async function callTogetherAnalysisAPI(apiKey: string, model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Calling Together API with model: ${model} (native implementation)`);
    debugLog('[CommitHistory] Together Analysis Prompt:');
    debugLog(analysisPrompt);

    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: "user",
                    content: analysisPrompt
                }
            ],
            temperature: 0.3,
            // max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        throw new Error(`Together API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "";

    debugLog('[CommitHistory] ==================== TOGETHER API RESPONSE ====================');
    debugLog(`[CommitHistory] Response length: ${responseText.length} characters`);
    debugLog('[CommitHistory] Response content:');
    debugLog(responseText);
    debugLog('[CommitHistory] ===============================================================');

    return responseText;
}

async function callOpenRouterAnalysisAPI(apiKey: string, model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Calling OpenRouter API with model: ${model} (native implementation)`);
    debugLog('[CommitHistory] OpenRouter Analysis Prompt:');
    debugLog(analysisPrompt);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://github.com/shahabahreini/AI-Commit-Assistant",
            "X-Title": "GitMind Commit History Analysis",
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: "user",
                    content: analysisPrompt
                }
            ],
            temperature: 0.3,
            // max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "";

    debugLog('[CommitHistory] ==================== OPENROUTER API RESPONSE ==================');
    debugLog(`[CommitHistory] Response length: ${responseText.length} characters`);
    debugLog('[CommitHistory] Response content:');
    debugLog(responseText);
    debugLog('[CommitHistory] ===============================================================');

    return responseText;
}

async function callHuggingFaceAnalysisAPI(apiKey: string, model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Calling HuggingFace API with model: ${model} (native implementation)`);
    debugLog('[CommitHistory] HuggingFace Analysis Prompt:');
    debugLog(analysisPrompt);

    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            inputs: analysisPrompt,
            parameters: {
                temperature: 0.3,
                // max_new_tokens: 2000,
                return_full_text: false,
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let responseText = "";

    // Handle different HuggingFace response formats
    if (Array.isArray(data) && data.length > 0) {
        responseText = data[0].generated_text || data[0].text || "";
    } else if (data.generated_text) {
        responseText = data.generated_text;
    } else if (typeof data === 'string') {
        responseText = data;
    }

    debugLog('[CommitHistory] ==================== HUGGINGFACE API RESPONSE ==============');
    debugLog(`[CommitHistory] Response length: ${responseText.length} characters`);
    debugLog('[CommitHistory] Response content:');
    debugLog(responseText);
    debugLog('[CommitHistory] ===============================================================');

    return responseText;
}

async function callDeepSeekAnalysisAPI(apiKey: string, model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Calling DeepSeek API with model: ${model} (native implementation)`);
    debugLog('[CommitHistory] DeepSeek Analysis Prompt:');
    debugLog(analysisPrompt);

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: "user",
                    content: analysisPrompt
                }
            ],
            temperature: 0.3,
            // max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "";

    debugLog('[CommitHistory] ==================== DEEPSEEK API RESPONSE ==================');
    debugLog(`[CommitHistory] Response length: ${responseText.length} characters`);
    debugLog('[CommitHistory] Response content:');
    debugLog(responseText);
    debugLog('[CommitHistory] ===============================================================');

    return responseText;
}

async function callGrokAnalysisAPI(apiKey: string, model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Calling Grok API with model: ${model} (native implementation)`);
    debugLog('[CommitHistory] Grok Analysis Prompt:');
    debugLog(analysisPrompt);

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: "user",
                    content: analysisPrompt
                }
            ],
            temperature: 0.3,
            // max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "";

    debugLog('[CommitHistory] ==================== GROK API RESPONSE =====================');
    debugLog(`[CommitHistory] Response length: ${responseText.length} characters`);
    debugLog('[CommitHistory] Response content:');
    debugLog(responseText);
    debugLog('[CommitHistory] ===============================================================');

    return responseText;
}

async function callPerplexityAnalysisAPI(apiKey: string, model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Calling Perplexity API with model: ${model} (native implementation)`);
    debugLog('[CommitHistory] Perplexity Analysis Prompt:');
    debugLog(analysisPrompt);

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: "user",
                    content: analysisPrompt
                }
            ],
            temperature: 0.3,
            // max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "";

    debugLog('[CommitHistory] ==================== PERPLEXITY API RESPONSE ===============');
    debugLog(`[CommitHistory] Response length: ${responseText.length} characters`);
    debugLog('[CommitHistory] Response content:');
    debugLog(responseText);
    debugLog('[CommitHistory] ===============================================================');

    return responseText;
}

async function callCustomAnalysisAPI(
    baseUrl: string,
    endpoint: string,
    authType: string,
    authToken: string,
    headerKey: string,
    requestFormat: string,
    responseFormat: string,
    model: string,
    analysisPrompt: string
): Promise<string> {
    debugLog(`[CommitHistory] Calling Custom API with model: ${model}`);
    debugLog('[CommitHistory] Custom Analysis Prompt:');
    debugLog(analysisPrompt);

    const customApiCall = (await loadProviderModule('custom')) as any;
    const result = await customApiCall(
        baseUrl,
        endpoint,
        authType,
        authToken,
        headerKey,
        requestFormat,
        responseFormat,
        model,
        "",
        analysisPrompt
    );

    debugLog('[CommitHistory] ==================== CUSTOM API RESPONSE ==================');
    debugLog(`[CommitHistory] Response length: ${result.length} characters`);
    debugLog('[CommitHistory] Response content:');
    debugLog(result);
    debugLog('[CommitHistory] ===============================================================');

    return result;
}

// Additional analysis API functions that delegate to existing implementations
async function callOllamaAnalysisAPI(url: string, model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Delegating to Ollama API with model: ${model}`);
    const ollamaApiCall = await loadProviderModule('ollama');
    return await ollamaApiCall(url, model, "", analysisPrompt);
}

async function callCopilotAnalysisAPI(model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Delegating to Copilot API with model: ${model}`);
    const copilotApiCall = await loadProviderModule('copilot');
    return await copilotApiCall("", model, "", analysisPrompt);
}