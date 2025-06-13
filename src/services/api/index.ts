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

        // Track the start of generation
        telemetryService.trackEvent('api.generateCommit.started', {
            'provider': config.type,
            'files.changed': filesChanged.toString(),
            'diff.size.bytes': diffSize.toString()
        });

        // First validate and potentially update the configuration
        const validatedConfig = await validateAndUpdateConfig(config);
        if (!validatedConfig) {
            debugLog("No valid configuration available");
            throw new Error(`${getProviderName(config.type)} configuration is invalid. Please check your API key and settings.`);
        }

        // Then generate the message with the validated config
        const result = await generateMessageWithConfig(validatedConfig, diff, customContext);

        const duration = Date.now() - startTime;
        telemetryService.trackProviderUsage(config.type, getModelName(config), true);
        telemetryService.trackEvent('api.generateCommit.completed', {
            'provider': config.type,
            'success': 'true',
            'duration.ms': duration.toString()
        });

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        debugLog("Generate Commit Message Error:", error);

        // Track the error
        if (error instanceof Error) {
            telemetryService.trackException(error, {
                'provider': config.type,
                'operation': 'generateCommitMessage'
            });
            telemetryService.trackProviderUsage(config.type, getModelName(config), false);
        }

        // Handle cancellation specifically
        if (error instanceof Error && (error.message === 'Request was cancelled' || error.message === 'User cancelled token count confirmation')) {
            debugLog("Request was cancelled by user");
            telemetryService.trackEvent('api.generateCommit.cancelled', {
                'provider': config.type,
                'duration.ms': duration.toString()
            });
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

    switch (config.type) {
        case "gemini": {
            const geminiConfig = config as GeminiApiConfig;
            if (!geminiConfig.apiKey) {
                const result = await vscode.window.showWarningMessage(
                    "Gemini API key is required. Would you like to configure it now?",
                    "Enter API Key",
                    "Get API Key",
                    "Cancel"
                );

                if (result === "Enter API Key") {
                    const apiKey = await vscode.window.showInputBox({
                        title: "Gemini API Key",
                        prompt: "Please enter your Gemini API key",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "gemini.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );
                        return await callGeminiAPI(apiKey.trim(), geminiConfig.model, diff, customContext);
                    }
                } else if (result === "Get API Key") {
                    await vscode.env.openExternal(
                        vscode.Uri.parse("https://aistudio.google.com/app/apikey")
                    );
                    const apiKey = await vscode.window.showInputBox({
                        title: "Gemini API Key",
                        prompt:
                            "Please enter your Gemini API key after getting it from the website",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "gemini.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );
                        return await callGeminiAPI(apiKey.trim(), geminiConfig.model, diff, customContext);
                    }
                }
                return ""; // Return empty if user cancels
            }
            return await callGeminiAPI(geminiConfig.apiKey, geminiConfig.model, diff, customContext);
        }

        case "huggingface": {
            const hfConfig = config as HuggingFaceApiConfig;
            if (!hfConfig.apiKey) {
                const result = await vscode.window.showWarningMessage(
                    "Hugging Face API key is required. Would you like to configure it now?",
                    "Enter API Key",
                    "Get API Key",
                    "Cancel"
                );

                if (result === "Enter API Key") {
                    const apiKey = await vscode.window.showInputBox({
                        title: "Hugging Face API Key",
                        prompt: "Please enter your Hugging Face API key",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "huggingface.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!hfConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callHuggingFaceAPI(
                            apiKey.trim(),
                            hfConfig.model,
                            diff,
                            customContext
                        );
                    }
                } else if (result === "Get API Key") {
                    await vscode.env.openExternal(
                        vscode.Uri.parse("https://huggingface.co/settings/tokens")
                    );
                    const apiKey = await vscode.window.showInputBox({
                        title: "Hugging Face API Key",
                        prompt:
                            "Please enter your Hugging Face API key after getting it from the website",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "huggingface.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!hfConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callHuggingFaceAPI(
                            apiKey.trim(),
                            hfConfig.model,
                            diff,
                            customContext
                        );
                    }
                }
                return "";
            }
            if (!hfConfig.model) {
                await vscode.window.showErrorMessage(
                    "Please select a Hugging Face model in the settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            return await callHuggingFaceAPI(hfConfig.apiKey, hfConfig.model, diff, customContext);
        }

        case "mistral": {
            const mistralConfig = config as MistralApiConfig;
            if (!mistralConfig.apiKey) {
                const result = await vscode.window.showWarningMessage(
                    "Mistral API key is required. Would you like to configure it now?",
                    "Enter API Key",
                    "Get API Key",
                    "Cancel"
                );

                if (result === "Enter API Key") {
                    const apiKey = await vscode.window.showInputBox({
                        title: "Mistral API Key",
                        prompt: "Please enter your Mistral API key",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "mistral.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!mistralConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callMistralAPI(
                            apiKey.trim(),
                            mistralConfig.model,
                            diff,
                            customContext
                        );
                    }
                } else if (result === "Get API Key") {
                    await vscode.env.openExternal(
                        vscode.Uri.parse("https://console.mistral.ai/api-keys/")
                    );
                    const apiKey = await vscode.window.showInputBox({
                        title: "Mistral API Key",
                        prompt:
                            "Please enter your Mistral API key after getting it from the website",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "mistral.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!mistralConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callMistralAPI(
                            apiKey.trim(),
                            mistralConfig.model,
                            diff,
                            customContext
                        );
                    }
                }
                return "";
            }
            if (!mistralConfig.model) {
                await vscode.window.showErrorMessage(
                    "Please select a Mistral model in the settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            return await callMistralAPI(
                mistralConfig.apiKey,
                mistralConfig.model,
                diff,
                customContext
            );
        }

        case "ollama": {
            const ollamaConfig = config as OllamaApiConfig;
            if (!ollamaConfig.url) {
                await vscode.window.showErrorMessage(
                    "Ollama URL not configured. Please check the extension settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            if (!ollamaConfig.model) {
                await vscode.window.showErrorMessage(
                    "Ollama model not specified. Please select a model in the extension settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
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

            return await callOllamaAPI(ollamaConfig.url, ollamaConfig.model, diff, customContext);
        }

        case "cohere": {
            const cohereConfig = config as CohereApiConfig;
            if (!cohereConfig.apiKey) {
                const result = await vscode.window.showWarningMessage(
                    "Cohere API key is required. Would you like to configure it now?",
                    "Enter API Key",
                    "Get API Key",
                    "Cancel"
                );

                if (result === "Enter API Key") {
                    const apiKey = await vscode.window.showInputBox({
                        title: "Cohere API Key",
                        prompt: "Please enter your Cohere API key",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "cohere.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!cohereConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callCohereAPI(
                            apiKey.trim(),
                            cohereConfig.model,
                            diff,
                            customContext
                        );
                    }
                } else if (result === "Get API Key") {
                    await vscode.env.openExternal(
                        vscode.Uri.parse("https://dashboard.cohere.com/api-keys")
                    );
                    const apiKey = await vscode.window.showInputBox({
                        title: "Cohere API Key",
                        prompt:
                            "Please enter your Cohere API key after getting it from the website",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "cohere.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!cohereConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callCohereAPI(
                            apiKey.trim(),
                            cohereConfig.model,
                            diff,
                            customContext
                        );
                    }
                }
                return "";
            }
            if (!cohereConfig.model) {
                await vscode.window.showErrorMessage(
                    "Please select a Cohere model in the settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            return await callCohereAPI(
                cohereConfig.apiKey,
                cohereConfig.model,
                diff,
                customContext
            );
        }

        case "openai": {
            const openaiConfig = config as OpenAIApiConfig;
            if (!openaiConfig.apiKey) {
                const result = await vscode.window.showWarningMessage(
                    "OpenAI API key is required. Would you like to configure it now?",
                    "Enter API Key",
                    "Get API Key",
                    "Cancel"
                );

                if (result === "Enter API Key") {
                    const apiKey = await vscode.window.showInputBox({
                        title: "OpenAI API Key",
                        prompt: "Please enter your OpenAI API key",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "openai.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!openaiConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callOpenAIAPI(
                            apiKey.trim(),
                            openaiConfig.model,
                            diff,
                            customContext
                        );
                    }
                } else if (result === "Get API Key") {
                    await vscode.env.openExternal(
                        vscode.Uri.parse("https://platform.openai.com/api-keys")
                    );
                    const apiKey = await vscode.window.showInputBox({
                        title: "OpenAI API Key",
                        prompt:
                            "Please enter your OpenAI API key after getting it from the website",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "openai.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!openaiConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callOpenAIAPI(
                            apiKey.trim(),
                            openaiConfig.model,
                            diff,
                            customContext
                        );
                    }
                }
                return "";
            }
            if (!openaiConfig.model) {
                await vscode.window.showErrorMessage(
                    "Please select an OpenAI model in the settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            return await callOpenAIAPI(
                openaiConfig.apiKey,
                openaiConfig.model,
                diff,
                customContext
            );
        }

        case "together": {
            const togetherConfig = config as TogetherApiConfig;
            if (!togetherConfig.apiKey) {
                const result = await vscode.window.showWarningMessage(
                    "Together AI API key is required. Would you like to configure it now?",
                    "Enter API Key",
                    "Get API Key",
                    "Cancel"
                );

                if (result === "Enter API Key") {
                    const apiKey = await vscode.window.showInputBox({
                        title: "Together AI API Key",
                        prompt: "Please enter your Together AI API key",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "together.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!togetherConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callTogetherAPI(
                            apiKey.trim(),
                            togetherConfig.model,
                            diff,
                            customContext
                        );
                    }
                } else if (result === "Get API Key") {
                    await vscode.env.openExternal(
                        vscode.Uri.parse("https://api.together.xyz/settings/api-keys")
                    );
                    const apiKey = await vscode.window.showInputBox({
                        title: "Together AI API Key",
                        prompt:
                            "Please enter your Together AI API key after getting it from the website",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "together.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!togetherConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callTogetherAPI(
                            apiKey.trim(),
                            togetherConfig.model,
                            diff,
                            customContext
                        );
                    }
                }
                return "";
            }
            if (!togetherConfig.model) {
                await vscode.window.showErrorMessage(
                    "Please select a Together AI model in the settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            return await callTogetherAPI(
                togetherConfig.apiKey,
                togetherConfig.model,
                diff,
                customContext
            );
        }

        case "openrouter": {
            const openrouterConfig = config as OpenRouterApiConfig;
            if (!openrouterConfig.apiKey) {
                const result = await vscode.window.showWarningMessage(
                    "OpenRouter API key is required. Would you like to configure it now?",
                    "Enter API Key",
                    "Get API Key",
                    "Cancel"
                );

                if (result === "Enter API Key") {
                    const apiKey = await vscode.window.showInputBox({
                        title: "OpenRouter API Key",
                        prompt: "Please enter your OpenRouter API key",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "openrouter.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!openrouterConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callOpenRouterAPI(
                            apiKey.trim(),
                            openrouterConfig.model,
                            diff,
                            customContext
                        );
                    }
                } else if (result === "Get API Key") {
                    await vscode.env.openExternal(
                        vscode.Uri.parse("https://openrouter.ai/keys")
                    );
                    const apiKey = await vscode.window.showInputBox({
                        title: "OpenRouter API Key",
                        prompt:
                            "Please enter your OpenRouter API key after getting it from the website",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "openrouter.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!openrouterConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callOpenRouterAPI(
                            apiKey.trim(),
                            openrouterConfig.model,
                            diff,
                            customContext
                        );
                    }
                }
                return "";
            }
            if (!openrouterConfig.model) {
                await vscode.window.showErrorMessage(
                    "Please select an OpenRouter model in the settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            return await callOpenRouterAPI(
                openrouterConfig.apiKey,
                openrouterConfig.model,
                diff,
                customContext
            );
        }

        case "anthropic": {
            const anthropicConfig = config as AnthropicApiConfig;
            if (!anthropicConfig.apiKey) {
                const result = await vscode.window.showWarningMessage(
                    "Anthropic API key is required. Would you like to configure it now?",
                    "Enter API Key",
                    "Get API Key",
                    "Cancel"
                );

                if (result === "Enter API Key") {
                    const apiKey = await vscode.window.showInputBox({
                        title: "Anthropic API Key",
                        prompt: "Please enter your API key",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "anthropic.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!anthropicConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callAnthropicAPI(
                            apiKey.trim(),
                            anthropicConfig.model,
                            diff,
                            customContext
                        );
                    }
                } else if (result === "Get API Key") {
                    await vscode.env.openExternal(
                        vscode.Uri.parse("https://console.anthropic.com/")
                    );
                    const apiKey = await vscode.window.showInputBox({
                        title: "Anthropic API Key",
                        prompt: "Please enter your API key after getting it from the website",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "anthropic.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!anthropicConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callAnthropicAPI(
                            apiKey.trim(),
                            anthropicConfig.model,
                            diff,
                            customContext
                        );
                    }
                }
                return "";
            }
            if (!anthropicConfig.model) {
                await vscode.window.showErrorMessage(
                    "Please select a model in the settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            return await callAnthropicAPI(
                anthropicConfig.apiKey,
                anthropicConfig.model,
                diff,
                customContext
            );
        }

        case "copilot": {
            const copilotConfig = config as CopilotApiConfig;
            if (!copilotConfig.model) {
                await vscode.window.showErrorMessage(
                    "Please select a GitHub Copilot model in the settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            return await callCopilotAPI(
                copilotConfig.model,
                diff,
                customContext
            );
        }

        case "deepseek": {
            const deepseekConfig = config as DeepSeekApiConfig;
            if (!deepseekConfig.apiKey) {
                const result = await vscode.window.showWarningMessage(
                    "DeepSeek API key is required. Would you like to configure it now?",
                    "Enter API Key",
                    "Get API Key",
                    "Cancel"
                );

                if (result === "Enter API Key") {
                    const apiKey = await vscode.window.showInputBox({
                        title: "DeepSeek API Key",
                        prompt: "Please enter your DeepSeek API key",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "deepseek.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!deepseekConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callDeepSeekAPI(
                            apiKey.trim(),
                            deepseekConfig.model,
                            diff,
                            customContext
                        );
                    }
                } else if (result === "Get API Key") {
                    await vscode.env.openExternal(
                        vscode.Uri.parse("https://platform.deepseek.com/api_keys")
                    );
                    const apiKey = await vscode.window.showInputBox({
                        title: "DeepSeek API Key",
                        prompt:
                            "Please enter your DeepSeek API key after getting it from the website",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "deepseek.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!deepseekConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callDeepSeekAPI(
                            apiKey.trim(),
                            deepseekConfig.model,
                            diff,
                            customContext
                        );
                    }
                }
                return "";
            }
            if (!deepseekConfig.model) {
                await vscode.window.showErrorMessage(
                    "Please select a DeepSeek model in the settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            return await callDeepSeekAPI(
                deepseekConfig.apiKey,
                deepseekConfig.model,
                diff,
                customContext
            );
        }

        case "grok": {
            const grokConfig = config as GrokApiConfig;
            if (!grokConfig.apiKey) {
                const result = await vscode.window.showWarningMessage(
                    "Grok API key is required. Would you like to configure it now?",
                    "Enter API Key",
                    "Get API Key",
                    "Cancel"
                );

                if (result === "Enter API Key") {
                    const apiKey = await vscode.window.showInputBox({
                        title: "Grok API Key",
                        prompt: "Please enter your Grok API key",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "grok.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!grokConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callGrokAPI(
                            apiKey.trim(),
                            grokConfig.model,
                            diff,
                            customContext
                        );
                    }
                } else if (result === "Get API Key") {
                    await vscode.env.openExternal(
                        vscode.Uri.parse("https://console.x.ai/")
                    );
                    const apiKey = await vscode.window.showInputBox({
                        title: "Grok API Key",
                        prompt:
                            "Please enter your Grok API key after getting it from the website",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "grok.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!grokConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callGrokAPI(
                            apiKey.trim(),
                            grokConfig.model,
                            diff,
                            customContext
                        );
                    }
                }
                return "";
            }
            if (!grokConfig.model) {
                await vscode.window.showErrorMessage(
                    "Please select a Grok model in the settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            return await callGrokAPI(
                grokConfig.apiKey,
                grokConfig.model,
                diff,
                customContext
            );
        }

        case "perplexity": {
            const perplexityConfig = config as PerplexityApiConfig;
            if (!perplexityConfig.apiKey) {
                const result = await vscode.window.showWarningMessage(
                    "Perplexity API key is required. Would you like to configure it now?",
                    "Enter API Key",
                    "Get API Key",
                    "Cancel"
                );

                if (result === "Enter API Key") {
                    const apiKey = await vscode.window.showInputBox({
                        title: "Perplexity API Key",
                        prompt: "Please enter your Perplexity API key",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "perplexity.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!perplexityConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callPerplexityAPI(
                            apiKey.trim(),
                            perplexityConfig.model,
                            diff,
                            customContext
                        );
                    }
                } else if (result === "Get API Key") {
                    await vscode.env.openExternal(
                        vscode.Uri.parse("https://www.perplexity.ai/settings/api")
                    );
                    const apiKey = await vscode.window.showInputBox({
                        title: "Perplexity API Key",
                        prompt:
                            "Please enter your Perplexity API key after getting it from the website",
                        password: true,
                        placeHolder: "Paste your API key here",
                        ignoreFocusOut: true,
                        validateInput: (text) =>
                            text?.trim() ? null : "API key cannot be empty",
                    });

                    if (apiKey) {
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            "perplexity.apiKey",
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );

                        if (!perplexityConfig.model) {
                            await vscode.commands.executeCommand(
                                "ai-commit-assistant.openSettings"
                            );
                            return "";
                        }
                        return await callPerplexityAPI(
                            apiKey.trim(),
                            perplexityConfig.model,
                            diff,
                            customContext
                        );
                    }
                }
                return "";
            }
            if (!perplexityConfig.model) {
                await vscode.window.showErrorMessage(
                    "Please select a Perplexity model in the settings."
                );
                await vscode.commands.executeCommand(
                    "ai-commit-assistant.openSettings"
                );
                return "";
            }
            return await callPerplexityAPI(
                perplexityConfig.apiKey,
                perplexityConfig.model,
                diff,
                customContext
            );
        }

        default: {
            const _exhaustiveCheck: never = config;
            throw new Error(`Unsupported API provider: ${(config as any).type}`);
        }
    }
}

async function showDiagnosticsInfo(config: ApiConfig, diff: string) {
    const showDiagnostics = vscode.workspace.getConfiguration('aiCommitAssistant').get('showDiagnostics');

    if (!showDiagnostics) {
        return;
    }

    const estimatedTokens = estimateTokens(diff);

    let providerName = '';
    let modelName = '';

    switch (config.type) {
        case 'gemini':
            providerName = 'Google Gemini';
            modelName = config.model || 'gemini-pro';
            break;
        case 'huggingface':
            providerName = 'Hugging Face';
            modelName = config.model;
            break;
        case 'ollama':
            providerName = 'Ollama';
            modelName = config.model;
            break;
        case 'mistral':
            providerName = 'Mistral AI';
            modelName = config.model;
            break;
        case 'cohere':
            providerName = 'Cohere';
            modelName = config.model;
            break;
        case 'openai':
            providerName = 'OpenAI';
            modelName = config.model;
            break;
        case 'together':
            providerName = 'Together AI';
            modelName = config.model;
            break;
        case 'openrouter':
            providerName = 'OpenRouter';
            modelName = config.model;
            break;
        case 'anthropic':
            providerName = 'Anthropic';
            modelName = config.model || 'claude-3-5-sonnet-20241022';
            break;
        case 'copilot':
            providerName = 'GitHub Copilot';
            modelName = config.model || 'gpt-4o';
            break;
        case 'deepseek':
            providerName = 'DeepSeek';
            modelName = config.model;
            break;
        case 'grok':
            providerName = 'Grok';
            modelName = config.model;
            break;
        case 'perplexity':
            providerName = 'Perplexity';
            modelName = config.model;
            break;
    }

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

function showModelInfo(config: ApiConfig) {
    const showModelInfo = workspace.getConfiguration('aiCommitAssistant').get('showModelInfo');

    if (!showModelInfo) {
        return;
    }

    let modelName = '';
    switch (config.type) {
        case 'gemini':
            modelName = `Gemini (${config.model || 'gemini-pro'})`;
            break;
        case 'huggingface':
            modelName = `Hugging Face (${config.model})`;
            break;
        case 'ollama':
            modelName = `Ollama (${config.model})`;
            break;
        case 'mistral':
            modelName = `Mistral (${config.model})`;
            break;
        case 'cohere':
            modelName = `Cohere (${config.model})`;
            break;
        case 'openai':
            modelName = `OpenAI (${config.model})`;
            break;
        case 'together':
            modelName = `Together AI (${config.model})`;
            break;
        case 'openrouter':
            modelName = `OpenRouter (${config.model})`;
            break;
        case "anthropic":
            modelName = config.model || 'claude-3-5-sonnet-20241022';
            break;
        case 'copilot':
            modelName = `GitHub Copilot (${config.model || 'gpt-4o'})`;
            break;
        case 'deepseek':
            modelName = `DeepSeek (${config.model})`;
            break;
        case 'grok':
            modelName = `Grok (${config.model})`;
            break;
        case 'perplexity':
            modelName = `Perplexity (${config.model})`;
            break;
    }

    vscode.window.showInformationMessage(`Using model: ${modelName}`, { modal: false });
}

function getProviderName(type: string): ApiProvider {
    const providerMap: Record<string, ApiProvider> = {
        "gemini": "Gemini",
        "huggingface": "Hugging Face",
        "ollama": "Ollama",
        "mistral": "Mistral",
        "cohere": "Cohere",
        "openai": "OpenAI",
        "together": "Together AI",
        "openrouter": "OpenRouter",
        "anthropic": "Anthropic",
        "copilot": "GitHub Copilot",
        "deepseek": "DeepSeek",
        "grok": "Grok",
        "perplexity": "Perplexity"
    };
    return providerMap[type] || "Gemini";
}

function getModelName(config: ApiConfig): string {
    // Extract model name from config based on provider type
    switch (config.type) {
        case 'gemini':
            return (config as GeminiApiConfig).model || 'unknown';
        case 'huggingface':
            return (config as HuggingFaceApiConfig).model || 'unknown';
        case 'ollama':
            return (config as OllamaApiConfig).model || 'unknown';
        case 'mistral':
            return (config as MistralApiConfig).model || 'unknown';
        case 'cohere':
            return (config as CohereApiConfig).model || 'unknown';
        case 'openai':
            return (config as OpenAIApiConfig).model || 'unknown';
        case 'together':
            return (config as TogetherApiConfig).model || 'unknown';
        case 'openrouter':
            return (config as OpenRouterApiConfig).model || 'unknown';
        case 'anthropic':
            return (config as AnthropicApiConfig).model || 'unknown';
        case 'copilot':
            return (config as CopilotApiConfig).model || 'unknown';
        case 'deepseek':
            return (config as DeepSeekApiConfig).model || 'unknown';
        case 'grok':
            return (config as GrokApiConfig).model || 'unknown';
        case 'perplexity':
            return (config as PerplexityApiConfig).model || 'unknown';
        default:
            return 'unknown';
    }
}

function getProviderSettingPath(provider: string): string {
    const paths: Record<string, string> = {
        Gemini: "gemini.apiKey",
        "Hugging Face": "huggingface.apiKey",
        Mistral: "mistral.apiKey",
        Cohere: "cohere.apiKey",
        OpenAI: "openai.apiKey",
        "Together AI": "together.apiKey",
        "OpenRouter": "openrouter.apiKey",
        "Anthropic": "anthropic.apiKey",
        "DeepSeek": "deepseek.apiKey",
        "Grok": "grok.apiKey",
        "Perplexity": "perplexity.apiKey"
    };
    return paths[provider] || "";
}

async function validateAndUpdateConfig(
    config: ApiConfig
): Promise<ApiConfig | null> {
    debugLog("Validating API configuration for provider:", config.type);

    // Skip validation for Ollama and Copilot as they don't require an API key
    if (config.type === "ollama" || config.type === "copilot") {
        return config;
    }

    const provider = getProviderName(config.type);
    debugLog("Checking API key for provider:", provider);

    // Check if API key is missing
    if (!config.apiKey) {
        debugLog("API key missing, showing configuration options");

        const result = await vscode.window.showWarningMessage(
            `${provider} API key is required. Would you like to configure it now?`,
            "Enter API Key",
            "Get API Key",
            "Cancel"
        );

        if (result === "Enter API Key") {
            const apiKey = await vscode.window.showInputBox({
                title: `${provider} API Key`,
                prompt: `Please enter your ${provider} API key`,
                password: true,
                placeHolder: "Paste your API key here",
                ignoreFocusOut: true,
                validateInput: (text) => {
                    return text && text.trim().length > 0
                        ? null
                        : "API key cannot be empty";
                },
            });

            if (apiKey) {
                const settingPath = getProviderSettingPath(provider);
                if (settingPath) {
                    const config = vscode.workspace.getConfiguration("aiCommitAssistant");
                    await config.update(
                        settingPath,
                        apiKey.trim(),
                        vscode.ConfigurationTarget.Global
                    );
                    debugLog("API key saved, returning updated configuration");
                    return getApiConfig();
                }
            }
        } else if (result === "Get API Key") {
            const providerDocs: Record<string, string> = {
                "Gemini": "https://aistudio.google.com/app/apikey",
                "Hugging Face": "https://huggingface.co/settings/tokens",
                "Mistral": "https://console.mistral.ai/api-keys/",
                "Cohere": "https://dashboard.cohere.com/api-keys",
                "OpenAI": "https://platform.openai.com/api-keys",
                "Together AI": "https://api.together.xyz/settings/api-keys",
                "OpenRouter": "https://openrouter.ai/keys",
                "Anthropic": "https://console.anthropic.com/",
                "DeepSeek": "https://platform.deepseek.com/api_keys",
                "Grok": "https://console.x.ai/",
                "Perplexity": "https://www.perplexity.ai/settings/api"
            };

            if (provider in providerDocs) {
                await vscode.env.openExternal(
                    vscode.Uri.parse(providerDocs[provider])
                );
                // After opening the website, prompt for API key input
                const apiKey = await vscode.window.showInputBox({
                    title: `${provider} API Key`,
                    prompt: `Please enter your ${provider} API key after getting it from the website`,
                    password: true,
                    placeHolder: "Paste your API key here",
                    ignoreFocusOut: true,
                    validateInput: (text) => {
                        return text && text.trim().length > 0
                            ? null
                            : "API key cannot be empty";
                    },
                });

                if (apiKey) {
                    const settingPath = getProviderSettingPath(provider);
                    if (settingPath) {
                        const config = vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            settingPath,
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );
                        debugLog("API key saved, returning updated configuration");
                        return getApiConfig();
                    }
                }
            }
        }
        return null; // User cancelled or no API key provided
    }

    // If we reach here, API key exists
    return config;
}
