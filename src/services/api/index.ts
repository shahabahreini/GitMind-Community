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

type ApiProvider = "Gemini" | "Hugging Face" | "Ollama" | "Mistral" | "Cohere" | "OpenAI";

export async function generateCommitMessage(
    config: ApiConfig,
    diff: string,
    customContext: string = ""
): Promise<string> {
    try {
        // First validate and potentially update the configuration
        const validatedConfig = await validateAndUpdateConfig(config);
        if (!validatedConfig) {
            debugLog("No valid configuration available");
            return ""; // Return empty string to indicate no message was generated
        }

        // Then generate the message with the validated config
        return await generateMessageWithConfig(validatedConfig, diff, customContext);
    } catch (error) {
        debugLog("Generate Commit Message Error:", error);
        // Handle the error but don't rethrow
        await handleApiError(error, config);
        return ""; // Return empty string to indicate no message was generated
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

        default: {
            const _exhaustiveCheck: never = config;
            throw new Error(`Unsupported API provider: ${(config as any).type}`);
        }
    }
}

async function handleApiError(
    error: unknown,
    config: ApiConfig
): Promise<void> {
    debugLog("API Error:", error);

    if (!(error instanceof Error)) {
        await vscode.window.showErrorMessage("An unknown error occurred");
        return;
    }

    const errorMessage = error.message;
    const provider = getProviderName(config.type);

    // Handle Ollama-specific errors
    if (
        provider === "Ollama" &&
        (errorMessage.includes("not configured") ||
            errorMessage.includes("not running"))
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

    // Handle all other errors
    await vscode.window.showErrorMessage(
        `Error generating commit message: ${errorMessage}`
    );
}

async function showDiagnosticsInfo(config: ApiConfig, diff: string) {
    const showDiagnostics = vscode.workspace.getConfiguration('aiCommitAssistant').get('showDiagnostics');

    if (!showDiagnostics) {
        return;
    }

    const estimatedTokens = estimateTokens(diff);

    let modelInfo = '';
    switch (config.type) {
        case 'mistral':
            modelInfo = `Model: Mistral AI (${config.model})`;
            break;
        case 'gemini':
            modelInfo = 'Model: Gemini Pro';
            break;
        case 'huggingface':
            modelInfo = `Model: Hugging Face (${config.model})`;
            break;
        case 'ollama':
            modelInfo = `Model: Ollama (${config.model})`;
            break;
        case 'cohere':
            modelInfo = `Model: Cohere (${config.model})`;
            break;
    }

    const message = `${modelInfo}\nEstimated tokens to be sent: ${estimatedTokens}`;

    // Show information message and wait for user confirmation
    const proceed = await vscode.window.showInformationMessage(
        message,
        { modal: true },
        'Proceed',
        'Cancel'
    );

    if (proceed !== 'Proceed') {
        throw new Error('Operation cancelled by user');
    }
}


// async function showDiagnosticsInfo(config: ApiConfig, diff: string) {
//     const showDiagnostics = workspace.getConfiguration('aiCommitAssistant').get('showDiagnostics');

//     if (!showDiagnostics) {
//         return;
//     }

//     const estimatedTokens = estimateTokens(diff);

//     let modelInfo = '';
//     switch (config.type) {
//         case 'mistral':
//             modelInfo = `Mistral AI (${config.model})`;
//             break;
//         case 'gemini':
//             modelInfo = 'Gemini Pro';
//             break;
//         case 'huggingface':
//             modelInfo = `Hugging Face (${config.model})`;
//             break;
//         case 'ollama':
//             modelInfo = `Ollama (${config.model})`;
//             break;
//     }

//     const proceed = await DiagnosticsWebview.show(modelInfo, estimatedTokens);

//     if (!proceed) {
//         throw new Error('Operation cancelled by user');
//     }
// }


// Helper function to get the settings path for a provider
function getProviderSettingPath(provider: string): string {
    const paths: Record<string, string> = {
        Gemini: "gemini.apiKey",
        "Hugging Face": "huggingface.apiKey",
        Mistral: "mistral.apiKey",
        Cohere: "cohere.apiKey",
        OpenAI: "openai.apiKey"
    };
    return paths[provider] || "";
}

async function validateAndUpdateConfig(
    config: ApiConfig
): Promise<ApiConfig | null> {
    debugLog("Validating API configuration for provider:", config.type);

    // Skip validation for Ollama as it doesn't require an API key
    if (config.type === "ollama") {
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
            const providerDocs = {
                Gemini: "https://aistudio.google.com/app/apikey",
                "Hugging Face": "https://huggingface.co/settings/tokens",
                Mistral: "https://console.mistral.ai/api-keys/",
            };

            if (provider in providerDocs) {
                await vscode.env.openExternal(
                    vscode.Uri.parse(providerDocs[provider as keyof typeof providerDocs])
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
                        const config =
                            vscode.workspace.getConfiguration("aiCommitAssistant");
                        await config.update(
                            settingPath,
                            apiKey.trim(),
                            vscode.ConfigurationTarget.Global
                        );
                        debugLog(
                            "API key saved after website visit, returning updated configuration"
                        );
                        return getApiConfig();
                    }
                }
            }
        }

        debugLog("No API key provided, returning null");
        return null;
    }

    debugLog("API configuration validated successfully");
    return config;
}

function showModelInfo(config: ApiConfig) {
    let modelInfo = "";
    switch (config.type) {
        case "mistral":
            modelInfo = `Using Mistral AI (${config.model})`;
            break;
        case "gemini":
            modelInfo = "Using Gemini Pro";
            break;
        case "huggingface":
            modelInfo = `Using Hugging Face (${config.model})`;
            break;
        case "ollama":
            modelInfo = `Using Ollama (${config.model})`;
            break;
        case "cohere":
            modelInfo = `Using Cohere (${config.model})`;
            break;
        case "openai":
            modelInfo = `Using OpenAI (${config.model})`;
            break;
    }
    vscode.window.setStatusBarMessage(modelInfo, 3000);
}

function getProviderName(type: string): ApiProvider {
    switch (type) {
        case "gemini":
            return "Gemini";
        case "huggingface":
            return "Hugging Face";
        case "ollama":
            return "Ollama";
        case "mistral":
            return "Mistral";
        case "cohere":
            return "Cohere";
        case "openai":
            return "OpenAI";
        default:
            throw new Error(`Unknown provider type: ${type}`);
    }
}
