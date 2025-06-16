// src/webview/settings/SettingsManager.ts
import * as vscode from "vscode";
import { ExtensionSettings } from "../../models/ExtensionSettings";
import { telemetryService } from "../../services/telemetry/telemetryService";
import { debugLog } from "../../services/debug/logger";

interface ProviderConfig {
    apiKey?: string;
    model: string;
    url?: string;
}

interface ProviderDefaults {
    [key: string]: ProviderConfig;
}

export class SettingsManager {
    private static readonly CONFIG_PREFIX = "aiCommitAssistant";

    private static readonly PROVIDER_DEFAULTS: ProviderDefaults = {
        gemini: { model: "gemini-2.5-flash-preview-04-17" },
        huggingface: { model: "" },
        ollama: { model: "", url: "" },
        mistral: { model: "mistral-large-latest" },
        cohere: { model: "command-a-03-2025" },
        openai: { model: "gpt-4o" },
        together: { model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
        openrouter: { model: "google/gemma-3-27b-it:free" },
        anthropic: { model: "claude-3-5-sonnet-20241022" },
        copilot: { model: "gpt-4o" },
        deepseek: { model: "deepseek-chat" },
        grok: { model: "grok-3" },
        perplexity: { model: "sonar-pro" }
    };

    private static readonly API_KEY_PROVIDERS = [
        'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
        'together', 'openrouter', 'anthropic', 'deepseek', 'grok', 'perplexity'
    ];

    private static readonly NO_API_KEY_PROVIDERS = ['ollama', 'copilot'];

    public getSettings(): ExtensionSettings {
        const config = vscode.workspace.getConfiguration(SettingsManager.CONFIG_PREFIX);
        return SettingsManager.buildSettingsFromConfig(config);
    }

    public static async getCurrentSettings(): Promise<ExtensionSettings> {
        const config = vscode.workspace.getConfiguration(SettingsManager.CONFIG_PREFIX);
        return SettingsManager.buildSettingsFromConfig(config);
    }

    private static buildSettingsFromConfig(config: vscode.WorkspaceConfiguration): ExtensionSettings {
        const settings: ExtensionSettings = {
            apiProvider: config.get<string>("apiProvider") || "huggingface",
            debug: config.get<boolean>("debug") || false,
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
        } as ExtensionSettings;

        // Build provider configurations dynamically
        Object.entries(SettingsManager.PROVIDER_DEFAULTS).forEach(([provider, defaults]) => {
            const providerConfig: ProviderConfig = {
                model: config.get<string>(`${provider}.model`) || defaults.model,
            };

            if (SettingsManager.API_KEY_PROVIDERS.includes(provider)) {
                providerConfig.apiKey = config.get<string>(`${provider}.apiKey`) || "";
            }

            if (provider === 'ollama') {
                providerConfig.url = config.get<string>(`${provider}.url`) || "";
            }

            (settings as any)[provider] = providerConfig;
        });

        return settings;
    }

    public static async saveSettings(settings: ExtensionSettings): Promise<void> {
        try {
            debugLog("Starting settings save process...");
            const config = vscode.workspace.getConfiguration(SettingsManager.CONFIG_PREFIX);
            const currentSettings = await SettingsManager.getCurrentSettings();

            debugLog("Incoming settings to save:", {
                apiProvider: settings.apiProvider,
                commitVerbose: settings.commit?.verbose,
                showDiagnostics: settings.showDiagnostics,
                telemetryEnabled: settings.telemetry?.enabled,
                promptCustomizationEnabled: settings.promptCustomization?.enabled
            });

            SettingsManager.trackSettingsChanges(currentSettings, settings);
            await SettingsManager.updateConfigurationSettings(config, settings);

            // Allow VS Code to persist changes
            await new Promise(resolve => setTimeout(resolve, 100));

            const verificationSettings = await SettingsManager.getCurrentSettings();
            debugLog("Settings verification:", {
                originalApiProvider: settings.apiProvider,
                savedApiProvider: verificationSettings.apiProvider,
                originalCommitVerbose: settings.commit?.verbose,
                savedCommitVerbose: verificationSettings.commit?.verbose
            });

            debugLog("Settings saved successfully");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            debugLog("Error saving settings:", errorMessage);

            telemetryService.trackExtensionError(
                'settings_save_error',
                errorMessage,
                'saveSettings'
            );

            throw error;
        }
    }

    private static async updateConfigurationSettings(
        config: vscode.WorkspaceConfiguration,
        settings: ExtensionSettings
    ): Promise<void> {
        const target = vscode.ConfigurationTarget.Global;

        // Core settings
        const coreUpdates = [
            config.update("apiProvider", settings.apiProvider, target),
            config.update("debug", settings.debug, target),
            config.update("promptCustomization.enabled", settings.promptCustomization.enabled, target),
            config.update("promptCustomization.saveLastPrompt", settings.promptCustomization.saveLastPrompt, target),
            config.update("promptCustomization.lastPrompt", settings.promptCustomization.lastPrompt, target),
            config.update("commit.verbose", settings.commit?.verbose ?? true, target),
            config.update("showDiagnostics", settings.showDiagnostics ?? false, target),
            config.update("telemetry.enabled", settings.telemetry?.enabled ?? true, target)
        ];

        // Provider settings
        const providerUpdates: Thenable<void>[] = [];

        Object.keys(SettingsManager.PROVIDER_DEFAULTS).forEach(provider => {
            const providerSettings = (settings as any)[provider];
            if (providerSettings) {
                providerUpdates.push(
                    config.update(`${provider}.model`, providerSettings.model, target)
                );

                if (SettingsManager.API_KEY_PROVIDERS.includes(provider)) {
                    providerUpdates.push(
                        config.update(`${provider}.apiKey`, providerSettings.apiKey, target)
                    );
                }

                if (provider === 'ollama' && providerSettings.url !== undefined) {
                    providerUpdates.push(
                        config.update(`${provider}.url`, providerSettings.url, target)
                    );
                }
            }
        });

        await Promise.all([...coreUpdates, ...providerUpdates]);
    }

    private static trackSettingsChanges(
        currentSettings: ExtensionSettings,
        newSettings: ExtensionSettings
    ): void {
        const changes: Array<{ setting: string; oldValue: string; newValue: string }> = [];

        // Track core setting changes
        if (currentSettings.apiProvider !== newSettings.apiProvider) {
            changes.push({
                setting: 'apiProvider',
                oldValue: currentSettings.apiProvider,
                newValue: newSettings.apiProvider
            });
        }

        if (currentSettings.debug !== newSettings.debug) {
            changes.push({
                setting: 'debug',
                oldValue: String(currentSettings.debug || false),
                newValue: String(newSettings.debug || false)
            });
        }

        // Track provider changes
        Object.keys(SettingsManager.PROVIDER_DEFAULTS).forEach(provider => {
            const currentProvider = (currentSettings as any)[provider];
            const newProvider = (newSettings as any)[provider];

            if (currentProvider && newProvider) {
                // Only track API key changes for providers that use API keys
                if (SettingsManager.API_KEY_PROVIDERS.includes(provider)) {
                    const oldHasKey = Boolean(currentProvider.apiKey);
                    const newHasKey = Boolean(newProvider.apiKey);

                    if (oldHasKey !== newHasKey) {
                        changes.push({
                            setting: `${provider}.apiKey.configured`,
                            oldValue: String(oldHasKey),
                            newValue: String(newHasKey)
                        });
                    }
                }

                if (newProvider.model !== currentProvider.model) {
                    changes.push({
                        setting: `${provider}.model`,
                        oldValue: currentProvider.model || 'none',
                        newValue: newProvider.model || 'none'
                    });
                }

                // Track URL changes for Ollama
                if (provider === 'ollama' && newProvider.url !== currentProvider.url) {
                    changes.push({
                        setting: `${provider}.url`,
                        oldValue: currentProvider.url || 'none',
                        newValue: newProvider.url || 'none'
                    });
                }
            }
        });

        telemetryService.trackDailyActiveUser();
    }
}