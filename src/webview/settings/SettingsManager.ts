// src/webview/settings/SettingsManager.ts
import * as vscode from "vscode";
import { ExtensionSettings } from "../../models/ExtensionSettings";
import { telemetryService } from "../../services/telemetry/telemetryService";
import { debugLog } from "../../services/debug/logger";
import { SecureKeyManager } from '../../services/encryption/SecureKeyManager';

interface ProviderConfig {
    apiKey?: string;
    model: string;
    url?: string;
}

interface ProviderDefaults {
    [key: string]: ProviderConfig;
}

export class SettingsManager {
    private static readonly CONFIG_PREFIX = "gitmind";
    private static _saveInProgress = false;
    private static _saveTimeout: NodeJS.Timeout | undefined;

    private static readonly PROVIDER_DEFAULTS: ProviderDefaults = {
        gemini: { model: "gemini-2.5-flash" },
        huggingface: { model: "" },
        ollama: { model: "", url: "" },
        mistral: { model: "mistral-large-latest" },
        cohere: { model: "command-r-plus" },
        openai: { model: "gpt-4o" },
        together: { model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
        openrouter: { model: "google/gemma-3-27b-it:free" },
        anthropic: { model: "claude-3-5-sonnet-20241022" },
        copilot: { model: "gpt-4o" },
        deepseek: { model: "deepseek-chat" },
        grok: { model: "grok-3" },
        perplexity: { model: "llama-3.1-sonar-large-128k-online" },
        custom: { model: "" }
    };

    private static readonly API_KEY_PROVIDERS = [
        'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
        'together', 'openrouter', 'anthropic', 'deepseek', 'grok', 'perplexity'
    ];

    private static readonly NO_API_KEY_PROVIDERS = ['ollama', 'copilot', 'custom'];

    public async getSettings(): Promise<ExtensionSettings> {
        const config = vscode.workspace.getConfiguration(SettingsManager.CONFIG_PREFIX);
        return await SettingsManager.buildSettingsFromConfig(config);
    }

    public static async getCurrentSettings(): Promise<ExtensionSettings> {
        const config = vscode.workspace.getConfiguration(SettingsManager.CONFIG_PREFIX);

        // Debug: Log the exact value being read for telemetry
        const telemetryEnabled = config.get<boolean>("telemetry.enabled");
        const telemetryEnabledWithDefault = config.get<boolean>("telemetry.enabled") ?? false;
        console.log('DEBUG getCurrentSettings - telemetry.enabled raw:', telemetryEnabled);
        console.log('DEBUG getCurrentSettings - telemetry.enabled with default:', telemetryEnabledWithDefault);
        console.log('DEBUG getCurrentSettings - config inspect:', config.inspect("telemetry.enabled"));

        return await SettingsManager.buildSettingsFromConfig(config);
    }

    private static async buildSettingsFromConfig(config: vscode.WorkspaceConfiguration): Promise<ExtensionSettings> {
        const settings = {
            apiProvider: config.get<string>("apiProvider") || "gemini",
            debug: config.get<boolean>("debug") || false,
            promptCustomization: {
                enabled: config.get<boolean>("promptCustomization.enabled") || false,
                saveLastPrompt: config.get<boolean>("promptCustomization.saveLastPrompt") || false,
                lastPrompt: config.get<string>("promptCustomization.lastPrompt") || "",
            },
            commit: {
                verbose: config.get<boolean>("commit.verbose") ?? true,
            },
            commitStyle: {
                style: config.get<string>("commitStyle.style") || "conventional",
            },
            showDiagnostics: config.get<boolean>("showDiagnostics") ?? false,
            telemetry: {
                enabled: config.get<boolean>("telemetry.enabled") ?? false,
            },
            pro: {
                encryptionEnabled: SettingsManager.getEncryptionEnabledSetting(config),
                licenseKey: await SettingsManager.getActualLicenseKey(config),
                orderId: config.get<string>("pro.orderId") || "",
                instanceId: config.get<string>("pro.instanceId") || "",
                validationStatus: config.get<'valid' | 'invalid' | 'expired' | 'error'>("pro.validationStatus") || "invalid",
                lastValidation: config.get<string>("pro.lastValidation") || "",
                commitBodyOptions: {
                    enabled: config.get<boolean>("pro.commitBodyOptions.enabled") ?? false,
                    maxLines: config.get<number>("pro.commitBodyOptions.maxLines") ?? 5,
                },
                commitLengthOptions: {
                    enabled: config.get<boolean>("pro.commitLengthOptions.enabled") ?? false,
                    maxLength: config.get<number>("pro.commitLengthOptions.maxLength") ?? 72,
                },
                learnFromCommitHistory: {
                    enabled: config.get<boolean>("pro.learnFromCommitHistory.enabled") ?? true,
                    maxCommits: config.get<number>("pro.learnFromCommitHistory.maxCommits") ?? 50,
                    includeAuthorInfo: config.get<boolean>("pro.learnFromCommitHistory.includeAuthorInfo") ?? true,
                },
                changelog: {
                    enabled: config.get<boolean>("pro.changelog.enabled") ?? true,
                    maxCommits: config.get<number>("pro.changelog.maxCommits") ?? 100,
                    groupByVersion: config.get<boolean>("pro.changelog.groupByVersion") ?? true,
                    maxVersions: config.get<number>("pro.changelog.maxVersions") ?? 10,
                    versionOrder: config.get<'newest-first' | 'oldest-first'>("pro.changelog.versionOrder") ?? 'newest-first',
                }

            },
            subscription: {
                email: config.get<string>("subscription.email") || "",
                plan: config.get<string>("subscription.plan") || "free",
                status: config.get<string>("subscription.status") || "inactive",
                lastChecked: config.get<string>("subscription.lastChecked") || "",
            },
        } as ExtensionSettings;

        // Debug: Log what we're setting for telemetry
        console.log('DEBUG buildSettingsFromConfig - setting telemetry.enabled to:', config.get<boolean>("telemetry.enabled") ?? false);

        // Build provider configurations dynamically with proper API key handling
        const secureKeyManager = SecureKeyManager.getInstance();

        for (const [provider, defaults] of Object.entries(SettingsManager.PROVIDER_DEFAULTS)) {
            const providerConfig: ProviderConfig = {
                model: config.get<string>(`${provider}.model`) || defaults.model,
            };

            if (SettingsManager.API_KEY_PROVIDERS.includes(provider)) {
                try {
                    // Use SecureKeyManager to get the appropriate API key based on encryption settings
                    const apiKey = await secureKeyManager.getApiKey(provider);
                    providerConfig.apiKey = apiKey || "";
                } catch (error) {
                    debugLog(`Failed to get API key for ${provider}:`, error);
                    // Fallback to plain text if secure key retrieval fails
                    providerConfig.apiKey = config.get<string>(`${provider}.apiKey`) || "";
                }
            }

            if (provider === 'ollama') {
                providerConfig.url = config.get<string>(`${provider}.url`) || "";
            }

            // Read custom provider extras and enabled flag
            if (provider === 'custom') {
                (providerConfig as any).baseUrl = config.get<string>('custom.baseUrl') || "";
                (providerConfig as any).endpoint = config.get<string>('custom.endpoint') || "";
                (providerConfig as any).authType = config.get<string>('custom.authType') || 'bearer';
                // Retrieve token using SecureKeyManager for proper placeholder display when encrypted
                try {
                    const tokenDisplay = await secureKeyManager.getApiKey('custom');
                    (providerConfig as any).authToken = tokenDisplay || "";
                } catch (err) {
                    (providerConfig as any).authToken = config.get<string>('custom.authToken') || "";
                }
                (providerConfig as any).headerKey = config.get<string>('custom.headerKey') || "";
                (providerConfig as any).requestFormat = config.get<string>('custom.requestFormat') || "";
                (providerConfig as any).responseFormat = config.get<string>('custom.responseFormat') || "";
                (providerConfig as any).enabled = config.get<boolean>('custom.enabled') ?? false;
            }

            (settings as any)[provider] = providerConfig;
        }

        return settings;
    }

    public static async saveSettings(settings: ExtensionSettings): Promise<void> {
        // Prevent concurrent saves
        if (SettingsManager._saveInProgress) {
            debugLog("Save already in progress, skipping duplicate save request");
            return;
        }

        // Clear any pending save timeout
        if (SettingsManager._saveTimeout) {
            clearTimeout(SettingsManager._saveTimeout);
            SettingsManager._saveTimeout = undefined;
        }

        SettingsManager._saveInProgress = true;

        try {
            debugLog("Starting settings save process...");
            const config = vscode.workspace.getConfiguration(SettingsManager.CONFIG_PREFIX);
            const currentSettings = await SettingsManager.getCurrentSettings();

            debugLog("Incoming settings to save:", {
                apiProvider: settings.apiProvider,
                commitVerbose: settings.commit?.verbose,
                commitStyle: settings.commitStyle?.style,
                showDiagnostics: settings.showDiagnostics,
                telemetryEnabled: settings.telemetry?.enabled,
                promptCustomizationEnabled: settings.promptCustomization?.enabled,
                encryptionEnabled: settings.pro?.encryptionEnabled
            });

            SettingsManager.trackSettingsChanges(currentSettings, settings);
            await SettingsManager.updateConfigurationSettings(config, settings);

            // Handle API key storage based on encryption settings
            await SettingsManager.handleApiKeyStorage(settings, currentSettings);

            // Allow VS Code to persist changes
            await new Promise(resolve => setTimeout(resolve, 100));

            const verificationSettings = await SettingsManager.getCurrentSettings();
            debugLog("Settings verification:", {
                originalApiProvider: settings.apiProvider,
                savedApiProvider: verificationSettings.apiProvider,
                originalCommitVerbose: settings.commit?.verbose,
                savedCommitVerbose: verificationSettings.commit?.verbose,
                originalCommitStyle: settings.commitStyle?.style,
                savedCommitStyle: verificationSettings.commitStyle?.style,
                originalEncryption: settings.pro?.encryptionEnabled,
                savedEncryption: verificationSettings.pro?.encryptionEnabled
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
        } finally {
            SettingsManager._saveInProgress = false;
        }
    }

    /**
     * Debounced save settings method to prevent multiple rapid saves
     * 
     * NOTE: Auto-save is disabled as per user request. Settings are only saved
     * when explicitly requested through the manual save button.
     */
    public static async saveSettingsDebounced(settings: ExtensionSettings, _delay: number = 300): Promise<void> {
        // This method is now only called by explicit user action through the Save button
        // No debouncing needed, just directly save the settings
        try {
            await SettingsManager.saveSettings(settings);
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Handles API key storage based on encryption settings and user status
     */
    private static async handleApiKeyStorage(
        newSettings: ExtensionSettings,
        currentSettings: ExtensionSettings
    ): Promise<void> {
        const secureKeyManager = SecureKeyManager.getInstance();

        // Use async version for more accurate subscription check
        const isProUser = await secureKeyManager.isEncryptionAvailableAsync();
        const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
        const encryptionAvailable = isProUser || devModeEnabled;
        const encryptionEnabled = newSettings.pro?.encryptionEnabled ?? false;

        debugLog("API key storage handling:", {
            isProUser,
            devModeEnabled,
            encryptionAvailable,
            encryptionEnabled,
            previousEncryption: currentSettings.pro?.encryptionEnabled
        });

        // Check if encryption setting changed
        const encryptionToggled = currentSettings.pro?.encryptionEnabled !== newSettings.pro?.encryptionEnabled;

        if (encryptionToggled && encryptionAvailable) {
            // Handle encryption toggle with dedicated method
            debugLog(`Encryption toggled: ${currentSettings.pro?.encryptionEnabled} -> ${encryptionEnabled}`);
            try {
                const result = await secureKeyManager.handleEncryptionToggle(encryptionEnabled);
                debugLog("Encryption toggle result:", result);

                if (result.success) {
                    debugLog(`Encryption toggle successful: ${result.message}`);
                } else {
                    debugLog(`Encryption toggle failed: ${result.message}`);
                }
            } catch (error) {
                debugLog("Failed to handle encryption toggle:", error);
            }
        } else {
            // Handle normal API key storage for new/updated keys
            for (const provider of SettingsManager.API_KEY_PROVIDERS) {
                const newProviderSettings = (newSettings as any)[provider];
                const currentProviderSettings = (currentSettings as any)[provider];

                if (newProviderSettings && newProviderSettings.apiKey) {
                    const apiKey = newProviderSettings.apiKey.trim();

                    // Only store if the key is different from current or if it's new
                    const currentKey = currentProviderSettings?.apiKey || "";

                    if (apiKey.length > 0 && apiKey !== currentKey) {
                        try {
                            debugLog(`Storing updated ${provider} API key`);
                            await secureKeyManager.storeApiKey(provider, apiKey);

                            // Clear from plain text settings if encryption is enabled
                            if (encryptionAvailable && encryptionEnabled) {
                                const config = vscode.workspace.getConfiguration(SettingsManager.CONFIG_PREFIX);
                                await config.update(`${provider}.apiKey`, "", vscode.ConfigurationTarget.Global);
                            }
                        } catch (error) {
                            debugLog(`Failed to store API key for ${provider}:`, error);
                            // Continue with other providers
                        }
                    }
                }
            }
        }

        // Handle custom provider authToken storage using the same secure mechanism
        const newCustom = (newSettings as any).custom;
        const currentCustom = (currentSettings as any).custom;
        if (newCustom && typeof newCustom.authToken === 'string') {
            const token = newCustom.authToken.trim();
            const currentToken = currentCustom?.authToken || "";
            if (token.length > 0 && token !== currentToken) {
                try {
                    debugLog('Storing updated custom auth token');
                    await secureKeyManager.storeApiKey('custom', token);
                    if (encryptionAvailable && encryptionEnabled) {
                        const cfg = vscode.workspace.getConfiguration(SettingsManager.CONFIG_PREFIX);
                        await cfg.update('custom.authToken', "", vscode.ConfigurationTarget.Global);
                    }
                } catch (e) {
                    debugLog('Failed to store custom auth token:', e);
                }
            }
        }

        // Handle subscription changes that might affect encryption availability
        const subscriptionChanged = currentSettings.subscription?.email !== newSettings.subscription?.email ||
            currentSettings.subscription?.status !== newSettings.subscription?.status;
        if (subscriptionChanged) {
            debugLog("Subscription changed, triggering migration...");
            try {
                await secureKeyManager.handleUserStatusChange();
            } catch (error) {
                debugLog("Failed to handle user status change:", error);
            }
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
            config.update("commitStyle.style", settings.commitStyle?.style || "conventional", target),
            config.update("showDiagnostics", settings.showDiagnostics ?? false, target),
            config.update("telemetry.enabled", settings.telemetry?.enabled ?? false, target),
            config.update("pro.encryptionEnabled", settings.pro?.encryptionEnabled ?? false, target),
            config.update("pro.licenseKey", settings.pro?.licenseKey || "", target),
            config.update("pro.orderId", settings.pro?.orderId || "", target),
            config.update("pro.instanceId", settings.pro?.instanceId || "", target),
            config.update("pro.validationStatus", settings.pro?.validationStatus || "invalid", target),
            config.update("pro.lastValidation", settings.pro?.lastValidation || "", target),
            config.update("pro.commitBodyOptions.enabled", settings.pro?.commitBodyOptions?.enabled ?? false, target),
            config.update("pro.commitBodyOptions.maxLines", settings.pro?.commitBodyOptions?.maxLines ?? 5, target),
            config.update("pro.commitLengthOptions.enabled", settings.pro?.commitLengthOptions?.enabled ?? false, target),
            config.update("pro.commitLengthOptions.maxLength", settings.pro?.commitLengthOptions?.maxLength ?? 72, target),
            // Add the missing Learn from Commit History settings
            config.update("pro.learnFromCommitHistory.enabled", settings.pro?.learnFromCommitHistory?.enabled ?? true, target),
            config.update("pro.learnFromCommitHistory.maxCommits", settings.pro?.learnFromCommitHistory?.maxCommits ?? 50, target),
            config.update("pro.learnFromCommitHistory.includeAuthorInfo", settings.pro?.learnFromCommitHistory?.includeAuthorInfo ?? true, target),
            // Add changelog settings
            config.update("pro.changelog.enabled", settings.pro?.changelog?.enabled ?? true, target),
            config.update("pro.changelog.maxCommits", settings.pro?.changelog?.maxCommits ?? 100, target),
            config.update("pro.changelog.groupByVersion", settings.pro?.changelog?.groupByVersion ?? true, target),
            config.update("pro.changelog.maxVersions", settings.pro?.changelog?.maxVersions ?? 10, target),
            config.update("pro.changelog.versionOrder", settings.pro?.changelog?.versionOrder ?? 'newest-first', target),
            config.update("subscription.email", settings.subscription?.email || "", target),
            config.update("subscription.plan", settings.subscription?.plan || "free", target),
            config.update("subscription.status", settings.subscription?.status || "inactive", target),
            config.update("subscription.lastChecked", settings.subscription?.lastChecked || "", target)
        ];

        // Provider settings (excluding API keys for now - they're handled separately)
        const providerUpdates: Thenable<void>[] = [];

        Object.keys(SettingsManager.PROVIDER_DEFAULTS).forEach(provider => {
            const providerSettings = (settings as any)[provider];
            if (providerSettings) {
                // Update model and URL settings
                providerUpdates.push(
                    config.update(`${provider}.model`, providerSettings.model, target)
                );

                // Update URL for Ollama
                if (provider === 'ollama' && providerSettings.url !== undefined) {
                    providerUpdates.push(
                        config.update(`${provider}.url`, providerSettings.url, target)
                    );
                }

                // Persist custom provider extras and enabled flag
                if (provider === 'custom') {
                    providerUpdates.push(
                        config.update('custom.baseUrl', providerSettings.baseUrl, target)
                    );
                    providerUpdates.push(
                        config.update('custom.endpoint', providerSettings.endpoint, target)
                    );
                    providerUpdates.push(
                        config.update('custom.authType', providerSettings.authType, target)
                    );
                    // Handle authToken with encryption rules similar to other providers
                    {
                        const encryptionEnabled = settings.pro?.encryptionEnabled ?? false;
                        const encryptionAvailable = !!(settings.subscription?.email) || process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
                        if (!encryptionEnabled || !encryptionAvailable) {
                            providerUpdates.push(
                                config.update('custom.authToken', providerSettings.authToken, target)
                            );
                        } else {
                            providerUpdates.push(
                                config.update('custom.authToken', undefined, target)
                            );
                        }
                    }
                    providerUpdates.push(
                        config.update('custom.headerKey', providerSettings.headerKey, target)
                    );
                    providerUpdates.push(
                        config.update('custom.requestFormat', providerSettings.requestFormat, target)
                    );
                    providerUpdates.push(
                        config.update('custom.responseFormat', providerSettings.responseFormat, target)
                    );
                    providerUpdates.push(
                        config.update('custom.enabled', providerSettings.enabled ?? false, target)
                    );
                }

                // Handle API key - only save to plain text if encryption is not being used
                const encryptionEnabled = settings.pro?.encryptionEnabled ?? false;
                const encryptionAvailable = !!(settings.subscription?.email) || process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';

                if (!encryptionEnabled || !encryptionAvailable) {
                    providerUpdates.push(
                        config.update(`${provider}.apiKey`, providerSettings.apiKey, target)
                    );
                } else {
                    // When encryption is enabled, explicitly remove any existing API keys from settings.json
                    providerUpdates.push(
                        config.update(`${provider}.apiKey`, undefined, target)
                    );
                }
            }
        });

        await Promise.all([...coreUpdates, ...providerUpdates]);
    }

    /**
     * Track changes in settings for telemetry
     */
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

        // Track pro settings changes
        if (currentSettings.pro?.encryptionEnabled !== newSettings.pro?.encryptionEnabled) {
            changes.push({
                setting: 'pro.encryptionEnabled',
                oldValue: String(currentSettings.pro?.encryptionEnabled || false),
                newValue: String(newSettings.pro?.encryptionEnabled || false)
            });
        }

        // Track subscription changes
        if (currentSettings.subscription?.email !== newSettings.subscription?.email) {
            changes.push({
                setting: 'subscription.email',
                oldValue: currentSettings.subscription?.email || '',
                newValue: newSettings.subscription?.email || ''
            });
        }

        if (currentSettings.subscription?.status !== newSettings.subscription?.status) {
            changes.push({
                setting: 'subscription.status',
                oldValue: currentSettings.subscription?.status || 'inactive',
                newValue: newSettings.subscription?.status || 'inactive'
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

    /**
     * Gets the actual license key (not the encrypted placeholder) for display purposes
     */
    private static async getActualLicenseKey(config: vscode.WorkspaceConfiguration): Promise<string> {
        const plainTextLicenseKey = config.get<string>("pro.licenseKey") || "";

        // If it's not the encrypted placeholder, return it as is
        if (plainTextLicenseKey !== "[ENCRYPTED]") {
            return plainTextLicenseKey;
        }

        // If it's the encrypted placeholder, get the actual key from secure storage
        try {
            // Import the state from extension.ts to access the context
            const { state } = await import('../../extension.js');

            if (state.context?.secrets) {
                const secureKey = await state.context.secrets.get('gitmind.pro.licenseKey');
                return secureKey || "";
            }
        } catch (error) {
            debugLog('Failed to retrieve secure license key for display:', error);
        }

        // Fallback to empty string if we can't retrieve the secure key
        return "";
    }

    /**
     * Determines the encryption enabled setting based on user status and current configuration
     */
    private static getEncryptionEnabledSetting(config: vscode.WorkspaceConfiguration): boolean {
        // Check for subscription email as a quick indicator
        const subscriptionEmail = config.get<string>("subscription.email");
        const hasSubscriptionEmail = !!(subscriptionEmail && subscriptionEmail.length > 0);

        const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
        const encryptionAvailable = hasSubscriptionEmail || devModeEnabled;

        // Get the current setting value
        const currentSetting = config.get<boolean>("pro.encryptionEnabled");

        // If explicitly set, respect the setting (but only if available)
        if (currentSetting !== undefined) {
            return encryptionAvailable ? currentSetting : false;
        }

        // Default based on user status
        return encryptionAvailable;
    }
}