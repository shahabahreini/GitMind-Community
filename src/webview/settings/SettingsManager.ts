// src/webview/settings/SettingsManager.ts
import * as vscode from "vscode";
import { ExtensionSettings } from "../../models/ExtensionSettings";
import { debugLog } from "../../services/debug/logger";
import { SecureKeyManager } from '../../services/encryption/SecureKeyManager';
import { getProviderDefaultModel } from '../../config/providerCatalog';
import { isProUser, isLegacyProUser } from '../../utils/proHelpers';

interface ProviderConfig {
    apiKey?: string;
    model: string;
    url?: string;
    endpoint?: string;
}

interface ProviderDefaults {
    [key: string]: ProviderConfig;
}

export class SettingsManager {
    private static readonly CONFIG_PREFIX = "gitmind";
    private static _saveInProgress = false;
    private static _saveTimeout: NodeJS.Timeout | undefined;

    private static readonly PROVIDER_DEFAULTS: ProviderDefaults = {
        gemini: { model: getProviderDefaultModel("gemini") },
        huggingface: { model: "" },
        ollama: { model: "", url: "" },
        mistral: { model: getProviderDefaultModel("mistral") },
        cohere: { model: getProviderDefaultModel("cohere") },
        openai: { model: getProviderDefaultModel("openai") },
        together: { model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
        openrouter: { model: "google/gemma-3-27b-it:free" },
        anthropic: { model: getProviderDefaultModel("anthropic") },
        minimax: { model: getProviderDefaultModel("minimax") },
        copilot: { model: getProviderDefaultModel("copilot") },
        deepseek: { model: getProviderDefaultModel("deepseek") },
        grok: { model: getProviderDefaultModel("grok") },
        groq: { model: "meta-llama/llama-4-scout-17b-16e-instruct" },
        perplexity: { model: getProviderDefaultModel("perplexity") },
        zai: { model: "glm-5.1", endpoint: "coding" },
        nvidia: { model: "meta/llama-3.3-70b-instruct" },
        custom: { model: "" }
    };

    private static readonly API_KEY_PROVIDERS = [
        'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
        'together', 'openrouter', 'anthropic', 'minimax', 'deepseek', 'grok', 'groq', 'perplexity', 'zai', 'nvidia'
    ];

    private static readonly NO_API_KEY_PROVIDERS = ['ollama', 'copilot', 'custom'];

    public async getSettings(): Promise<ExtensionSettings> {
        const config = vscode.workspace.getConfiguration(SettingsManager.CONFIG_PREFIX);
        return await SettingsManager.buildSettingsFromConfig(config);
    }

    public static async getCurrentSettings(): Promise<ExtensionSettings> {
        const config = vscode.workspace.getConfiguration(SettingsManager.CONFIG_PREFIX);

        return await SettingsManager.buildSettingsFromConfig(config);
    }

    private static async buildSettingsFromConfig(config: vscode.WorkspaceConfiguration): Promise<ExtensionSettings> {
        const settings = {
            apiProvider: config.get<string>("apiProvider") || "gemini",
            promptCustomization: {
                enabled: config.get<boolean>("promptCustomization.enabled") || false,
                saveLastPrompt: config.get<boolean>("promptCustomization.saveLastPrompt") || false,
                lastPrompt: config.get<string>("promptCustomization.lastPrompt") || "",
            },
            commit: {
                verbose: config.get<boolean>("commit.verbose") ?? true,
                detailMode: (() => {
                    const detail = config.inspect<'auto' | 'concise' | 'detailed'>("commit.detailMode");
                    const explicitlySet = detail?.globalValue !== undefined || detail?.workspaceValue !== undefined || detail?.workspaceFolderValue !== undefined;
                    return explicitlySet ? config.get<'auto' | 'concise' | 'detailed'>("commit.detailMode", 'auto') : 'legacy';
                })(),
                captureAllChanges: config.get<boolean>("commit.captureAllChanges") ?? false,
                targetLanguage: config.get<string>("commit.targetLanguage") ?? "english",
            },
            commitIntelligence: {
                enabled: config.get<boolean>("commitIntelligence.enabled") ?? false,
                noiseFilteringEnabled: config.get<boolean>("commit.noiseFiltering.enabled") ?? false,
                candidatesEnabled: config.get<boolean>("commit.candidates.enabled") ?? false,
                healthEnabled: config.get<boolean>("commit.health.enabled") ?? false,
                githubIssueContextEnabled: config.get<boolean>("commit.githubIssueContext.enabled") ?? false,
                composerEnabled: config.get<boolean>("composer.enabled") ?? false,
                allowHunkSplitting: config.get<boolean>("composer.allowHunkSplitting") ?? false,
                reviewEnabled: config.get<boolean>("review.enabled") ?? false,
            },
            commitStyle: {
                style: config.get<string>("commitStyle.style") || "conventional",
            },
            showDiagnostics: config.get<boolean>("showDiagnostics") ?? false,
            pro: {
                // Entitlement is decided once, here, by the host — the webview must never
                // re-derive it from the raw settings below, or a grandfathered customer ends up
                // Pro in one panel and Free in another.
                isPro: isProUser(),
                isLegacyPro: isLegacyProUser(),
                encryptionEnabled: SettingsManager.getEncryptionEnabledSetting(config),
                licenseKey: await SettingsManager.getActualLicenseKey(config),
                orderId: config.get<string>("pro.orderId") || "",
                instanceId: config.get<string>("pro.instanceId") || "",
                validationStatus: config.get<'valid' | 'invalid' | 'expired' | 'error'>("pro.validationStatus") || "invalid",
                lastValidation: config.get<string>("pro.lastValidation") || "",
                advancedModelConfig: {
                    mode: config.get<'auto' | 'custom'>("pro.advancedModelConfig.mode") ?? 'auto',
                    temperatureEnabled: config.get<boolean>("pro.advancedModelConfig.temperatureEnabled") ?? false,
                    temperature: config.get<number>("pro.advancedModelConfig.temperature") ?? 0.2,
                    topPEnabled: config.get<boolean>("pro.advancedModelConfig.topPEnabled") ?? false,
                    topP: config.get<number>("pro.advancedModelConfig.topP") ?? 0.9,
                    topKEnabled: config.get<boolean>("pro.advancedModelConfig.topKEnabled") ?? false,
                    topK: config.get<number>("pro.advancedModelConfig.topK") ?? 40,
                    maxTokensEnabled: config.get<boolean>("pro.advancedModelConfig.maxTokensEnabled") ?? false,
                    maxTokens: config.get<number>("pro.advancedModelConfig.maxTokens") ?? 350,
                },
                automaticRetry: {
                    enabled: config.get<boolean>("pro.automaticRetry.enabled") ?? false,
                },
                modelFallback: {
                    enabled: config.get<boolean>("pro.modelFallback.enabled") ?? false,
                    models: config.get<Record<string, string>>("pro.modelFallback.models") ?? {},
                },
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
                    maxCommitsEnabled: config.get<boolean>("pro.changelog.maxCommitsEnabled") ?? false,
                    maxCommits: config.get<number>("pro.changelog.maxCommits") ?? 100,
                    groupByVersion: config.get<boolean>("pro.changelog.groupByVersion") ?? true,
                    maxVersions: config.get<number>("pro.changelog.maxVersions") ?? 10,
                    versionOrder: config.get<'newest-first' | 'oldest-first'>("pro.changelog.versionOrder") ?? 'newest-first',
                    overwriteExisting: config.get<boolean>("pro.changelog.overwriteExisting") ?? false,
                }

            },
            subscription: {
                email: config.get<string>("subscription.email") || "",
                plan: config.get<string>("subscription.plan") || "free",
                status: config.get<string>("subscription.status") || "inactive",
                lastChecked: config.get<string>("subscription.lastChecked") || "",
            },
        } as ExtensionSettings;

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

            // Read z.ai specific configuration
            if (provider === 'zai') {
                (providerConfig as any).endpoint = config.get<string>('zai.endpoint') || 'coding';
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
                promptCustomizationEnabled: settings.promptCustomization?.enabled,
                encryptionEnabled: settings.pro?.encryptionEnabled
            });

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

            debugLog(`Custom token save check: newToken=${token ? `[${token.length} chars]` : 'empty'}, currentToken=${currentToken ? `[${currentToken.length} chars]` : 'empty'}, isPlaceholder=${currentToken === '[ENCRYPTED]'}`);

            // Store if token is not empty and not a placeholder
            // Skip if token is the placeholder (means user didn't change it)
            const isPlaceholder = token === '[ENCRYPTED]';
            const shouldStore = token.length > 0 && !isPlaceholder && token !== currentToken;

            debugLog(`Custom token shouldStore: ${shouldStore}`);

            if (shouldStore) {
                try {
                    debugLog(`Storing custom auth token (length: ${token.length})`);
                    await secureKeyManager.storeApiKey('custom', token);
                    debugLog('Custom auth token stored successfully in SecureKeyManager');

                    if (encryptionAvailable && encryptionEnabled) {
                        const cfg = vscode.workspace.getConfiguration(SettingsManager.CONFIG_PREFIX);
                        await cfg.update('custom.authToken', "", vscode.ConfigurationTarget.Global);
                        debugLog('Cleared custom auth token from plain text settings');
                    }
                } catch (e) {
                    debugLog('Failed to store custom auth token:', e);
                }
            } else {
                debugLog(`Skipping custom token storage - shouldStore=false`);
            }
        } else {
            debugLog(`Custom token not found in newSettings or not a string`);
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

    private static async updateSingleSetting(
        config: vscode.WorkspaceConfiguration,
        section: string,
        value: any,
        target: vscode.ConfigurationTarget
    ): Promise<void> {
        try {
            await config.update(section, value, target);
        } catch (error) {
            const errorStr = String(error);
            if (errorStr.includes("not a registered configuration")) {
                debugLog(`Warning: Setting '${section}' is not registered in VS Code:`, error);
            } else {
                throw error;
            }
        }
    }

    private static async updateConfigurationSettings(
        config: vscode.WorkspaceConfiguration,
        settings: ExtensionSettings
    ): Promise<void> {
        const target = vscode.ConfigurationTarget.Global;

        const coreUpdates: Promise<void>[] = [
            SettingsManager.updateSingleSetting(config, "apiProvider", settings.apiProvider, target),
            SettingsManager.updateSingleSetting(config, "promptCustomization.enabled", settings.promptCustomization?.enabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "promptCustomization.saveLastPrompt", settings.promptCustomization?.saveLastPrompt ?? false, target),
            SettingsManager.updateSingleSetting(config, "promptCustomization.lastPrompt", settings.promptCustomization?.lastPrompt ?? "", target),
            SettingsManager.updateSingleSetting(config, "commit.verbose", settings.commit?.verbose ?? true, target),
            SettingsManager.updateSingleSetting(config, "commit.detailMode", settings.commit?.detailMode === 'legacy' ? undefined : settings.commit?.detailMode, target),
            SettingsManager.updateSingleSetting(config, "commit.captureAllChanges", settings.commit?.captureAllChanges ?? false, target),
            SettingsManager.updateSingleSetting(config, "commit.targetLanguage", settings.commit?.targetLanguage ?? "english", target),
            SettingsManager.updateSingleSetting(config, "commitStyle.style", settings.commitStyle?.style || "conventional", target),
            SettingsManager.updateSingleSetting(config, "showDiagnostics", settings.showDiagnostics ?? false, target),
            SettingsManager.updateSingleSetting(config, "commitIntelligence.enabled", settings.commitIntelligence?.enabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "commit.noiseFiltering.enabled", settings.commitIntelligence?.noiseFilteringEnabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "commit.candidates.enabled", settings.commitIntelligence?.candidatesEnabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "commit.health.enabled", settings.commitIntelligence?.healthEnabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "commit.githubIssueContext.enabled", settings.commitIntelligence?.githubIssueContextEnabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "composer.enabled", settings.commitIntelligence?.composerEnabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "composer.allowHunkSplitting", settings.commitIntelligence?.allowHunkSplitting ?? false, target),
            SettingsManager.updateSingleSetting(config, "review.enabled", settings.commitIntelligence?.reviewEnabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "pro.encryptionEnabled", settings.pro?.encryptionEnabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "pro.advancedModelConfig.mode", settings.pro?.advancedModelConfig?.mode ?? 'auto', target),
            SettingsManager.updateSingleSetting(config, "pro.advancedModelConfig.temperatureEnabled", settings.pro?.advancedModelConfig?.temperatureEnabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "pro.advancedModelConfig.temperature", settings.pro?.advancedModelConfig?.temperature ?? 0.2, target),
            SettingsManager.updateSingleSetting(config, "pro.advancedModelConfig.topPEnabled", settings.pro?.advancedModelConfig?.topPEnabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "pro.advancedModelConfig.topP", settings.pro?.advancedModelConfig?.topP ?? 0.9, target),
            SettingsManager.updateSingleSetting(config, "pro.advancedModelConfig.topKEnabled", settings.pro?.advancedModelConfig?.topKEnabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "pro.advancedModelConfig.topK", settings.pro?.advancedModelConfig?.topK ?? 40, target),
            SettingsManager.updateSingleSetting(config, "pro.advancedModelConfig.maxTokensEnabled", settings.pro?.advancedModelConfig?.maxTokensEnabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "pro.advancedModelConfig.maxTokens", settings.pro?.advancedModelConfig?.maxTokens ?? 350, target),
            SettingsManager.updateSingleSetting(config, "pro.automaticRetry.enabled", settings.pro?.automaticRetry?.enabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "pro.modelFallback.enabled", settings.pro?.modelFallback?.enabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "pro.modelFallback.models", settings.pro?.modelFallback?.models ?? {}, target),
            SettingsManager.updateSingleSetting(config, "pro.licenseKey", settings.pro?.licenseKey || "", target),
            SettingsManager.updateSingleSetting(config, "pro.orderId", settings.pro?.orderId || "", target),
            SettingsManager.updateSingleSetting(config, "pro.instanceId", settings.pro?.instanceId || "", target),
            SettingsManager.updateSingleSetting(config, "subscription.email", settings.subscription?.email || "", target),
            SettingsManager.updateSingleSetting(config, "subscription.plan", settings.subscription?.plan || "free", target),
            SettingsManager.updateSingleSetting(config, "subscription.status", settings.subscription?.status || "inactive", target),
            SettingsManager.updateSingleSetting(config, "subscription.lastChecked", settings.subscription?.lastChecked || "", target),
            SettingsManager.updateSingleSetting(config, "pro.commitBodyOptions.enabled", settings.pro?.commitBodyOptions?.enabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "pro.commitBodyOptions.maxLines", settings.pro?.commitBodyOptions?.maxLines ?? 5, target),
            SettingsManager.updateSingleSetting(config, "pro.commitLengthOptions.enabled", settings.pro?.commitLengthOptions?.enabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "pro.commitLengthOptions.maxLength", settings.pro?.commitLengthOptions?.maxLength ?? 72, target),
            SettingsManager.updateSingleSetting(config, "pro.learnFromCommitHistory.enabled", settings.pro?.learnFromCommitHistory?.enabled ?? true, target),
            SettingsManager.updateSingleSetting(config, "pro.learnFromCommitHistory.maxCommits", settings.pro?.learnFromCommitHistory?.maxCommits ?? 50, target),
            SettingsManager.updateSingleSetting(config, "pro.learnFromCommitHistory.includeAuthorInfo", settings.pro?.learnFromCommitHistory?.includeAuthorInfo ?? true, target),
            SettingsManager.updateSingleSetting(config, "pro.changelog.enabled", settings.pro?.changelog?.enabled ?? true, target),
            SettingsManager.updateSingleSetting(config, "pro.changelog.maxCommitsEnabled", settings.pro?.changelog?.maxCommitsEnabled ?? false, target),
            SettingsManager.updateSingleSetting(config, "pro.changelog.maxCommits", settings.pro?.changelog?.maxCommits ?? 100, target),
            SettingsManager.updateSingleSetting(config, "pro.changelog.groupByVersion", settings.pro?.changelog?.groupByVersion ?? true, target),
            SettingsManager.updateSingleSetting(config, "pro.changelog.maxVersions", settings.pro?.changelog?.maxVersions ?? 10, target),
            SettingsManager.updateSingleSetting(config, "pro.changelog.versionOrder", settings.pro?.changelog?.versionOrder ?? "newest-first", target),
            SettingsManager.updateSingleSetting(config, "pro.changelog.overwriteExisting", settings.pro?.changelog?.overwriteExisting ?? false, target),
        ];

        const providerUpdates: Promise<void>[] = [];

        Object.keys(SettingsManager.PROVIDER_DEFAULTS).forEach((provider) => {
            const providerSettings = (settings as any)[provider] as any;
            if (!providerSettings) {
                return;
            }

            providerUpdates.push(SettingsManager.updateSingleSetting(config, `${provider}.model`, providerSettings.model, target));

            if (provider === "ollama" && providerSettings.url !== undefined) {
                providerUpdates.push(SettingsManager.updateSingleSetting(config, `${provider}.url`, providerSettings.url, target));
            }

            if (provider === "zai" && providerSettings.endpoint !== undefined) {
                providerUpdates.push(SettingsManager.updateSingleSetting(config, "zai.endpoint", providerSettings.endpoint, target));
            }

            if (provider === "custom") {
                providerUpdates.push(SettingsManager.updateSingleSetting(config, "custom.baseUrl", providerSettings.baseUrl, target));
                providerUpdates.push(SettingsManager.updateSingleSetting(config, "custom.endpoint", providerSettings.endpoint, target));
                providerUpdates.push(SettingsManager.updateSingleSetting(config, "custom.authType", providerSettings.authType, target));
                providerUpdates.push(SettingsManager.updateSingleSetting(config, "custom.headerKey", providerSettings.headerKey, target));
                providerUpdates.push(SettingsManager.updateSingleSetting(config, "custom.requestFormat", providerSettings.requestFormat, target));
                providerUpdates.push(SettingsManager.updateSingleSetting(config, "custom.responseFormat", providerSettings.responseFormat, target));
                providerUpdates.push(SettingsManager.updateSingleSetting(config, "custom.enabled", providerSettings.enabled ?? false, target));

                const encryptionEnabled = settings.pro?.encryptionEnabled ?? false;
                const encryptionAvailable = Boolean(settings.subscription?.email) || process.env.GITMIND_ENCRYPTION_DEV_MODE === "true";
                if (!encryptionEnabled || !encryptionAvailable) {
                    providerUpdates.push(SettingsManager.updateSingleSetting(config, "custom.authToken", providerSettings.authToken, target));
                } else {
                    providerUpdates.push(SettingsManager.updateSingleSetting(config, "custom.authToken", undefined, target));
                }
            }

            const encryptionEnabled = settings.pro?.encryptionEnabled ?? false;
            const encryptionAvailable = Boolean(settings.subscription?.email) || process.env.GITMIND_ENCRYPTION_DEV_MODE === "true";
            if (!encryptionEnabled || !encryptionAvailable) {
                providerUpdates.push(SettingsManager.updateSingleSetting(config, `${provider}.apiKey`, providerSettings.apiKey, target));
            } else {
                providerUpdates.push(SettingsManager.updateSingleSetting(config, `${provider}.apiKey`, undefined, target));
            }
        });

        await Promise.all([...coreUpdates, ...providerUpdates]);
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
