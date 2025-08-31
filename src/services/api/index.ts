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
} from "../../config/types";
import { callGeminiAPI } from "./gemini";
import { callHuggingFaceAPI } from "./huggingface";
import { callOllamaAPI } from "./ollama";
import { callMistralAPI } from "./mistral";
import { callCohereAPI } from "./cohere";
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
import { callOpenAIAPI } from "./openai";
import { callTogetherAPI } from "./together";
import { callOpenRouterAPI } from "./openrouter";
import { callAnthropicAPI } from "./anthropic";
import { callCopilotAPI } from "./copilot";
import { callDeepSeekAPI } from "./deepseek";
import { callGrokAPI } from "./grok";
import { callPerplexityAPI } from "./perplexity";
import { callCustomAPI } from "./custom";
import { RequestManager } from "../../utils/requestManager";
import { APIErrorHandler } from "../../utils/errorHandler";
import { telemetryService } from "../telemetry/telemetryService";
import { SubscriptionManager } from "../subscription/SubscriptionManager";
import { DiffProcessor } from "../diffProcessor";
import { generateCommitHistoryAnalysisPrompt, validatePromptLength } from './prompts';

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


type ApiProvider = "Gemini" | "Hugging Face" | "Ollama" | "Mistral" | "Cohere" | "OpenAI" | "Together AI" | "OpenRouter" | "Anthropic" | "GitHub Copilot" | "DeepSeek" | "Grok" | "Perplexity" | "Custom API";

interface ProviderConfig {
    name: ApiProvider;
    displayName: string;
    settingPath: string;
    docsUrl: string;
    requiresApiKey: boolean;
    defaultModel?: string;
    apiCall: (apiKey: string, model: string, diff: string, customContext: string) => Promise<string>;
}

// Provider configurations
const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
    gemini: {
        name: "Gemini",
        displayName: "Gemini",
        settingPath: "gemini.apiKey",
        docsUrl: "https://aistudio.google.com/app/apikey",
        requiresApiKey: true,
        defaultModel: "gemini-pro",
        apiCall: callGeminiAPI,
    },
    huggingface: {
        name: "Hugging Face",
        displayName: "Hugging Face",
        settingPath: "huggingface.apiKey",
        docsUrl: "https://huggingface.co/settings/tokens",
        requiresApiKey: true,
        apiCall: callHuggingFaceAPI,
    },
    mistral: {
        name: "Mistral",
        displayName: "Mistral AI",
        settingPath: "mistral.apiKey",
        docsUrl: "https://console.mistral.ai/api-keys/",
        requiresApiKey: true,
        apiCall: callMistralAPI,
    },
    cohere: {
        name: "Cohere",
        displayName: "Cohere",
        settingPath: "cohere.apiKey",
        docsUrl: "https://dashboard.cohere.com/api-keys",
        requiresApiKey: true,
        apiCall: callCohereAPI,
    },
    openai: {
        name: "OpenAI",
        displayName: "OpenAI",
        settingPath: "openai.apiKey",
        docsUrl: "https://platform.openai.com/api-keys",
        requiresApiKey: true,
        apiCall: callOpenAIAPI,
    },
    together: {
        name: "Together AI",
        displayName: "Together AI",
        settingPath: "together.apiKey",
        docsUrl: "https://api.together.xyz/settings/api-keys",
        requiresApiKey: true,
        apiCall: callTogetherAPI,
    },
    openrouter: {
        name: "OpenRouter",
        displayName: "OpenRouter",
        settingPath: "openrouter.apiKey",
        docsUrl: "https://openrouter.ai/keys",
        requiresApiKey: true,
        apiCall: callOpenRouterAPI,
    },
    anthropic: {
        name: "Anthropic",
        displayName: "Anthropic",
        settingPath: "anthropic.apiKey",
        docsUrl: "https://console.anthropic.com/",
        requiresApiKey: true,
        defaultModel: "claude-3-5-sonnet-20241022",
        apiCall: callAnthropicAPI,
    },
    deepseek: {
        name: "DeepSeek",
        displayName: "DeepSeek",
        settingPath: "deepseek.apiKey",
        docsUrl: "https://platform.deepseek.com/api_keys",
        requiresApiKey: true,
        apiCall: callDeepSeekAPI,
    },
    grok: {
        name: "Grok",
        displayName: "Grok",
        settingPath: "grok.apiKey",
        docsUrl: "https://console.x.ai/",
        requiresApiKey: true,
        apiCall: callGrokAPI,
    },
    perplexity: {
        name: "Perplexity",
        displayName: "Perplexity",
        settingPath: "perplexity.apiKey",
        docsUrl: "https://www.perplexity.ai/settings/api",
        requiresApiKey: true,
        apiCall: callPerplexityAPI,
    },
    custom: {
        name: "Custom API",
        displayName: "Custom API",
        settingPath: "custom.authToken",
        docsUrl: "",
        requiresApiKey: true,
        apiCall: async (authToken, model, diff, customContext) => {
            // Pro feature check - only allow Custom API for Pro users
            const subscriptionManager = SubscriptionManager.getInstance();
            const isProUser = await subscriptionManager.isProUser();

            if (!isProUser) {
                throw new Error("Custom API is a Pro feature. Please upgrade to GitMind Pro to use custom API endpoints.");
            }

            const config = vscode.workspace.getConfiguration("gitmind").get("custom") as any;
            return callCustomAPI(
                config.baseUrl,
                config.endpoint,
                config.authType,
                authToken,
                config.headerKey || '',
                config.requestFormat,
                config.responseFormat,
                model,
                diff,
                customContext
            );
        },
    },
    ollama: {
        name: "Ollama",
        displayName: "Ollama",
        settingPath: "",
        docsUrl: "",
        requiresApiKey: false,
        apiCall: (_apiKey: string, model: string, diff: string, customContext: string) =>
            callOllamaAPI("", model, diff, customContext), // Ollama uses URL from config
    },
    copilot: {
        name: "GitHub Copilot",
        displayName: "GitHub Copilot",
        settingPath: "",
        docsUrl: "",
        requiresApiKey: false,
        defaultModel: "gpt-4o",
        apiCall: (_apiKey: string, model: string, diff: string, customContext: string) =>
            callCopilotAPI(model, diff, customContext),
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
        if (!copilotConfig.model) {
            await vscode.window.showErrorMessage(
                "Please select a GitHub Copilot model in the settings."
            );
            await vscode.commands.executeCommand("gitmind.openSettings");
            return "";
        }
        return await callCopilotAPI(copilotConfig.model, diff, customContext);
    }

    // Handle standard providers
    return await handleStandardProvider(config, providerConfig, diff, customContext);
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

    return await callOllamaAPI(config.url, config.model, diff, customContext);
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

    return await providerConfig.apiCall(
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
        'Proceed',
        'Cancel'
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
            // Split the diff into chunks
            const chunks = diffProcessor.splitDiffIntoChunks(diff, settings.chunkSize);
            const chunkCount = Math.min(chunks.length, settings.maxChunks);

            // Process each chunk
            const chunkResults: string[] = [];
            for (let i = 0; i < chunkCount; i++) {
                if (token.isCancellationRequested) {
                    throw new Error("Request was cancelled");
                }

                progress.report({
                    message: `Processing chunk ${i + 1}/${chunkCount}`,
                    increment: (100 / chunkCount)
                });

                // Add chunk context to help the model
                const chunkContext = `${customContext ? customContext + "\n" : ""}This is part ${i + 1} of ${chunkCount} from a large change.`;

                // Process this chunk
                const chunkResult = await generateMessageWithConfig(config, chunks[i], chunkContext);
                chunkResults.push(chunkResult);
            }

            // If processing was cancelled, stop here
            if (token.isCancellationRequested) {
                throw new Error("Request was cancelled");
            }

            // If we only have one chunk result, return it directly
            if (chunkResults.length === 1) {
                return chunkResults[0];
            }

            // Otherwise, merge the results and generate a final summary
            progress.report({ message: "Creating final summary", increment: 0 });
            const mergedPrompt = diffProcessor.mergeChunkResults(chunkResults);

            // Generate the final commit message using the merged results as context
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
        const response = await fetch("https://api.cohere.ai/v1/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model,
                message: analysisPrompt,
                temperature: 0.3,
                // No max_tokens limit for full commit analysis reports
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`[CommitHistory] Cohere API error details: ${errorText}`);
            throw new Error(`Cohere API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const responseText = data.text || data.message || "";

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

    const result = await callCustomAPI(
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
    return await callOllamaAPI(url, model, "", analysisPrompt);
}

async function callCopilotAnalysisAPI(model: string, analysisPrompt: string): Promise<string> {
    debugLog(`[CommitHistory] Delegating to Copilot API with model: ${model}`);
    return await callCopilotAPI(model, "", analysisPrompt);
}