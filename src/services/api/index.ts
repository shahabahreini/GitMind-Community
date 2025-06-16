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
import { RequestManager } from "../../utils/requestManager";
import { APIErrorHandler } from "../../utils/errorHandler";
import { telemetryService } from "../telemetry/telemetryService";

type ApiProvider = "Gemini" | "Hugging Face" | "Ollama" | "Mistral" | "Cohere" | "OpenAI" | "Together AI" | "OpenRouter" | "Anthropic" | "GitHub Copilot" | "DeepSeek" | "Grok" | "Perplexity";

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
    ollama: {
        name: "Ollama",
        displayName: "Ollama",
        settingPath: "",
        docsUrl: "",
        requiresApiKey: false,
        apiCall: (apiKey: string, model: string, diff: string, customContext: string) =>
            callOllamaAPI("", model, diff, customContext), // Ollama uses URL from config
    },
    copilot: {
        name: "GitHub Copilot",
        displayName: "GitHub Copilot",
        settingPath: "",
        docsUrl: "",
        requiresApiKey: false,
        defaultModel: "gpt-4o",
        apiCall: (apiKey: string, model: string, diff: string, customContext: string) =>
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
            await vscode.commands.executeCommand("ai-commit-assistant.openSettings");
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
    customContext: string = ""
): Promise<string> {
    // Calculate context for error handling
    const diffSize = diff.length;
    const filesChanged = (diff.match(/diff --git/g) || []).length;
    const context = { diffSize, filesChanged };

    const startTime = Date.now();

    try {
        // Set up request tracking
        currentRequestController = new AbortController();
        isCurrentlyActive = true;

        // Track the start of generation - using trackDailyActiveUser to ensure user activity is tracked
        telemetryService.trackDailyActiveUser();

        // First validate and potentially update the configuration
        const validatedConfig = await validateAndUpdateConfig(config);
        if (!validatedConfig) {
            debugLog("No valid configuration available");
            throw new Error(`${getProviderName(config.type)} configuration is invalid. Please check your API key and settings.`);
        }

        // Then generate the message with the validated config
        const result = await generateMessageWithConfig(validatedConfig, diff, customContext);

        const duration = Date.now() - startTime;
        telemetryService.trackCommitGeneration(config.type, true);

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        debugLog("Generate Commit Message Error:", error);

        // Track the error
        if (error instanceof Error) {
            telemetryService.trackExtensionError(
                'commit_generation_error',
                error.message,
                `provider:${config.type}`
            );
            telemetryService.trackCommitGeneration(config.type, false, error.message);
        }

        // Handle cancellation specifically
        if (error instanceof Error && (error.message === 'Request was cancelled' || error.message === 'User cancelled token count confirmation')) {
            debugLog("Request was cancelled by user");
            telemetryService.trackExtensionError(
                'commit_generation_cancelled',
                error.message,
                `provider:${config.type}`
            );
            return "";
        }

        // Check for AbortError (from fetch cancellation)
        if (error instanceof Error && error.name === 'AbortError') {
            debugLog("Request was aborted");
            throw new Error('Request was cancelled');
        }

        // Preserve detailed error messages - don't show generic fallback
        if (error instanceof Error) {
            // Check if it's already a detailed error from our API handlers
            if (error.message.includes('Together AI API error: 422 - Content exceeds model limits') ||
                error.message.includes('tokens') && error.message.includes('exceed') ||
                error.message.includes('rate limit') ||
                error.message.includes('API key') ||
                error.message.includes('quota') ||
                error.message.includes('billing') ||
                error.message.includes('Details:') || // Together AI detailed format
                error.message.includes(': ')) { // Contains provider-specific formatting
                throw error; // Re-throw detailed errors as-is
            }
        }

        // Only handle non-detailed errors with the error handler
        await handleApiError(error, config, context);
        return "";
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
    // Show diagnostics before proceeding
    await showDiagnosticsInfo(config, diff);
    // Show which model is being used
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
            await vscode.commands.executeCommand("ai-commit-assistant.openSettings");
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
        await vscode.commands.executeCommand("ai-commit-assistant.openSettings");
        return "";
    }
    if (!config.model) {
        await vscode.window.showErrorMessage(
            "Ollama model not specified. Please select a model in the extension settings."
        );
        await vscode.commands.executeCommand("ai-commit-assistant.openSettings");
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
        await vscode.commands.executeCommand("ai-commit-assistant.openSettings");
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
        const config = vscode.workspace.getConfiguration("aiCommitAssistant");
        await config.update(
            providerConfig.settingPath,
            apiKey.trim(),
            vscode.ConfigurationTarget.Global
        );
        return apiKey.trim();
    }

    return null;
}

async function showDiagnosticsInfo(config: ApiConfig, diff: string): Promise<void> {
    const showDiagnostics = vscode.workspace.getConfiguration('aiCommitAssistant').get('showDiagnostics');

    if (!showDiagnostics) {
        return;
    }

    const estimatedTokens = estimateTokens(diff);
    const providerName = getProviderDisplayName(config.type);
    const modelName = getModelName(config);

    // Create a well-formatted message with proper structure
    const message = [
        'Request Diagnostics',
        '',
        `Provider: ${providerName}`,
        `Model: ${modelName}`,
        `Estimated Tokens: ${estimatedTokens.toLocaleString()}`,
        '',
        'Would you like to proceed with this request?'
    ].join('\n');

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
    const showModelInfo = workspace.getConfiguration('aiCommitAssistant').get('showModelInfo');

    if (!showModelInfo) {
        return;
    }

    const providerName = getProviderDisplayName(config.type);
    const modelName = getModelName(config);
    const displayName = config.type === 'anthropic' ? modelName : `${providerName} (${modelName})`;

    vscode.window.showInformationMessage(`Using model: ${displayName}`, { modal: false });
}

function getProviderName(type: string): ApiProvider {
    return PROVIDER_CONFIGS[type]?.name || "Gemini";
}

function getProviderDisplayName(type: string): string {
    return PROVIDER_CONFIGS[type]?.displayName || "Unknown";
}

function getModelName(config: ApiConfig): string {
    const typedConfig = config as any;
    return typedConfig.model || PROVIDER_CONFIGS[config.type]?.defaultModel || 'unknown';
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