// src/webview/settings/SettingsManager.ts
import * as vscode from "vscode";
import { ExtensionSettings } from "../../models/ExtensionSettings";
import { telemetryService } from "../../services/telemetry/telemetryService";
import { debugLog } from "../../services/debug/logger";

export class SettingsManager {
    public getSettings(): ExtensionSettings {
        const config = vscode.workspace.getConfiguration("aiCommitAssistant");

        // Get the API provider with a default
        const apiProvider = config.get<string>("apiProvider") || "huggingface";

        return {
            apiProvider,
            debug: config.get<boolean>("debug") || false,
            gemini: {
                apiKey: config.get<string>("gemini.apiKey") || "",
                model: config.get<string>("gemini.model") || "gemini-2.5-flash-preview-04-17",
            },
            huggingface: {
                apiKey: config.get<string>("huggingface.apiKey") || "",
                model: config.get<string>("huggingface.model") || "",
            },
            ollama: {
                url: config.get<string>("ollama.url") || "",
                model: config.get<string>("ollama.model") || "",
            },
            mistral: {
                apiKey: config.get<string>("mistral.apiKey") || "",
                model: config.get<string>("mistral.model") || "mistral-large-latest",
            },
            cohere: {
                apiKey: config.get<string>("cohere.apiKey") || "",
                model: config.get<string>("cohere.model") || "command-a-03-2025",
            },
            openai: {
                apiKey: config.get<string>("openai.apiKey") || "",
                model: config.get<string>("openai.model") || "gpt-3.5-turbo",
            },
            together: {
                apiKey: config.get<string>("together.apiKey") || "",
                model: config.get<string>("together.model") || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            },
            openrouter: {
                apiKey: config.get<string>("openrouter.apiKey") || "",
                model: config.get<string>("openrouter.model") || "google/gemma-3-27b-it:free",
            },
            anthropic: {
                apiKey: config.get<string>("anthropic.apiKey") || "",
                model: config.get<string>("anthropic.model") || "claude-3-5-sonnet-20241022",
            },
            copilot: {
                model: config.get<string>("copilot.model") || "gpt-4o",
            },
            deepseek: {
                apiKey: config.get<string>("deepseek.apiKey") || "",
                model: config.get<string>("deepseek.model") || "deepseek-chat",
            },
            grok: {
                apiKey: config.get<string>("grok.apiKey") || "",
                model: config.get<string>("grok.model") || "grok-3",
            },
            perplexity: {
                apiKey: config.get<string>("perplexity.apiKey") || "",
                model: config.get<string>("perplexity.model") || "sonar-pro",
            },
            promptCustomization: {
                enabled: config.get<boolean>("promptCustomization.enabled") || false,
                saveLastPrompt: config.get<boolean>("promptCustomization.saveLastPrompt") || false,
                lastPrompt: config.get<string>("promptCustomization.lastPrompt") || "",
            },
            commit: {
                verbose: config.get<boolean>("commit.verbose") ?? true,
            },
            showDiagnostics: config.get<boolean>("showDiagnostics") ?? false,
            telemetry: {
                enabled: config.get<boolean>("telemetry.enabled") ?? true,
            },
        };
    }

    public static async getCurrentSettings(): Promise<ExtensionSettings> {
        const config = vscode.workspace.getConfiguration("aiCommitAssistant");

        return {
            apiProvider: config.get<string>("apiProvider") || "huggingface",
            debug: config.get<boolean>("debug") || false,
            gemini: {
                apiKey: config.get<string>("gemini.apiKey") || "",
                model: config.get<string>("gemini.model") || "gemini-2.5-flash-preview-04-17",
            },
            huggingface: {
                apiKey: config.get<string>("huggingface.apiKey") || "",
                model: config.get<string>("huggingface.model") || "",
            },
            ollama: {
                url: config.get<string>("ollama.url") || "",
                model: config.get<string>("ollama.model") || "",
            },
            mistral: {
                apiKey: config.get<string>("mistral.apiKey") || "",
                model: config.get<string>("mistral.model") || "mistral-large-latest",
            },
            cohere: {
                apiKey: config.get<string>("cohere.apiKey") || "",
                model: config.get<string>("cohere.model") || "command-a-03-2025",
            },
            openai: {
                apiKey: config.get<string>("openai.apiKey") || "",
                model: config.get<string>("openai.model") || "gpt-3.5-turbo",
            },
            together: {
                apiKey: config.get<string>("together.apiKey") || "",
                model: config.get<string>("together.model") || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            },
            openrouter: {
                apiKey: config.get<string>("openrouter.apiKey") || "",
                model: config.get<string>("openrouter.model") || "google/gemma-3-27b-it:free",
            },
            anthropic: {
                apiKey: config.get<string>("anthropic.apiKey") || "",
                model: config.get<string>("anthropic.model") || "claude-3-5-sonnet-20241022",
            },
            copilot: {
                model: config.get<string>("copilot.model") || "gpt-4o",
            },
            deepseek: {
                apiKey: config.get<string>("deepseek.apiKey") || "",
                model: config.get<string>("deepseek.model") || "deepseek-chat",
            },
            grok: {
                apiKey: config.get<string>("grok.apiKey") || "",
                model: config.get<string>("grok.model") || "grok-3",
            },
            perplexity: {
                apiKey: config.get<string>("perplexity.apiKey") || "",
                model: config.get<string>("perplexity.model") || "sonar-pro",
            },
            promptCustomization: {
                enabled: config.get<boolean>("promptCustomization.enabled") || false,
                saveLastPrompt: config.get<boolean>("promptCustomization.saveLastPrompt") || false,
                lastPrompt: config.get<string>("promptCustomization.lastPrompt") || "",
            },
            commit: {
                verbose: config.get<boolean>("commit.verbose") ?? true,
            },
            showDiagnostics: config.get<boolean>("showDiagnostics") ?? false,
            telemetry: {
                enabled: config.get<boolean>("telemetry.enabled") ?? true,
            },
        };
    }

    public static async saveSettings(settings: ExtensionSettings): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration("aiCommitAssistant");
            const currentSettings = await this.getCurrentSettings();

            // Track settings changes for telemetry
            const changes: Array<{ setting: string, oldValue: string, newValue: string }> = [];

            // Check for provider change
            if (currentSettings.apiProvider !== settings.apiProvider) {
                changes.push({
                    setting: 'apiProvider',
                    oldValue: currentSettings.apiProvider,
                    newValue: settings.apiProvider
                });
            }

            // Check for debug mode change
            if (currentSettings.debug !== settings.debug) {
                changes.push({
                    setting: 'debug',
                    oldValue: (currentSettings.debug || false).toString(),
                    newValue: (settings.debug || false).toString()
                });
            }

            // Track API key configuration changes (without exposing the actual keys)
            const apiProviders = ['gemini', 'huggingface', 'ollama', 'mistral', 'cohere', 'openai', 'together', 'openrouter', 'anthropic', 'deepseek', 'grok', 'perplexity'];

            apiProviders.forEach(provider => {
                const currentProvider = (currentSettings as any)[provider];
                const newProvider = (settings as any)[provider];

                if (currentProvider && newProvider && typeof newProvider === 'object' && newProvider.apiKey !== undefined) {
                    const oldHasKey = !!(currentProvider?.apiKey);
                    const newHasKey = !!(newProvider.apiKey);

                    if (oldHasKey !== newHasKey) {
                        changes.push({
                            setting: `${provider}.apiKey.configured`,
                            oldValue: oldHasKey.toString(),
                            newValue: newHasKey.toString()
                        });
                    }

                    // Track model changes
                    if (newProvider.model !== currentProvider?.model) {
                        changes.push({
                            setting: `${provider}.model`,
                            oldValue: currentProvider?.model || 'none',
                            newValue: newProvider.model || 'none'
                        });
                    }
                }
            });

            // Save all settings
            await config.update("apiProvider", settings.apiProvider, vscode.ConfigurationTarget.Global);
            await config.update("debug", settings.debug, vscode.ConfigurationTarget.Global);
            await config.update(
                "gemini.apiKey",
                settings.gemini.apiKey,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "gemini.model",
                settings.gemini.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "huggingface.apiKey",
                settings.huggingface.apiKey,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "huggingface.model",
                settings.huggingface.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "ollama.url",
                settings.ollama.url,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "ollama.model",
                settings.ollama.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "mistral.apiKey",
                settings.mistral.apiKey,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "mistral.model",
                settings.mistral.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "cohere.apiKey",
                settings.cohere.apiKey,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "cohere.model",
                settings.cohere.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "openai.apiKey",
                settings.openai.apiKey,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "openai.model",
                settings.openai.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "together.apiKey",
                settings.together.apiKey,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "together.model",
                settings.together.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "openrouter.apiKey",
                settings.openrouter.apiKey,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "openrouter.model",
                settings.openrouter.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "anthropic.apiKey",
                settings.anthropic.apiKey,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "anthropic.model",
                settings.anthropic.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "copilot.model",
                settings.copilot.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "deepseek.apiKey",
                settings.deepseek.apiKey,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "deepseek.model",
                settings.deepseek.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "grok.apiKey",
                settings.grok.apiKey,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "grok.model",
                settings.grok.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "perplexity.apiKey",
                settings.perplexity.apiKey,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "perplexity.model",
                settings.perplexity.model,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "promptCustomization.enabled",
                settings.promptCustomization.enabled,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "promptCustomization.saveLastPrompt",
                settings.promptCustomization.saveLastPrompt,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "promptCustomization.lastPrompt",
                settings.promptCustomization.lastPrompt,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "commit.verbose",
                settings.commit?.verbose ?? true,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "showDiagnostics",
                settings.showDiagnostics ?? false,
                vscode.ConfigurationTarget.Global
            );
            await config.update(
                "telemetry.enabled",
                settings.telemetry?.enabled ?? true,
                vscode.ConfigurationTarget.Global
            );

            // Track the changes in telemetry
            telemetryService.trackEvent('settings.saved', {
                'changes.count': changes.length.toString()
            });

            changes.forEach(change => {
                telemetryService.trackSettingsChanged(change.setting, change.oldValue, change.newValue);
            });

            debugLog("Settings saved successfully");
        } catch (error) {
            telemetryService.trackException(error as Error, {
                'operation': 'saveSettings'
            });
            debugLog("Error saving settings:", error);
            throw error;
        }
    }
}
