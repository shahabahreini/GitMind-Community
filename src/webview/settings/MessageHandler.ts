// src/webview/settings/MessageHandler.ts
import * as vscode from "vscode";
import { SettingsManager } from "./SettingsManager";
import { SettingsWebview } from "./SettingsWebview";
import { ExtensionSettings } from "../../models/ExtensionSettings";
import { getOllamaModels } from "../../services/api/ollama";
import { debugLog } from "../../services/debug/logger";
import { SecureKeyManager } from "../../services/encryption/SecureKeyManager";
import { GitHistoryAnalyzer } from "../../services/git/GitHistoryAnalyzer";

export class MessageHandler {
    private _settingsManager: SettingsManager;
    private _updateLocks = new Map<string, boolean>();

    constructor(settingsManager: SettingsManager) {
        this._settingsManager = settingsManager;
    }

    public async handleMessage(message: any): Promise<void> {
        switch (message.command) {
            case "saveSettings":
                try {
                    // Log the incoming settings for debugging
                    console.log('Saving settings - telemetry.enabled:', message.settings.telemetry?.enabled);

                    await SettingsManager.saveSettings(message.settings);

                    // Get the updated settings from VS Code to ensure they were saved correctly
                    const updatedSettings = await SettingsManager.getCurrentSettings();

                    // Log the retrieved settings for debugging
                    console.log('Retrieved settings after save - telemetry.enabled:', updatedSettings.telemetry?.enabled);
                    console.log('Full telemetry object:', updatedSettings.telemetry);

                    // Send confirmation back to webview with updated settings
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'settingsSaved',
                            settings: updatedSettings
                        });
                    }
                } catch (error) {
                    // Send error message back to webview if save fails
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'settingsSaveError',
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                    throw error;
                }
                break;
            case "executeCommand":
                await vscode.commands.executeCommand(message.commandId);
                break;
            case 'previewCommitHistoryStats':
                try {
                    debugLog('Previewing commit history stats:', { maxCommits: message.maxCommits, includeAuthorInfo: message.includeAuthorInfo });
                    const commitHistoryStats = await GitHistoryAnalyzer.analyzeHistory(
                        message.maxCommits,
                        message.includeAuthorInfo
                    );

                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'commitHistoryStatsReady',
                            stats: commitHistoryStats
                        });
                    }
                } catch (error) {
                    debugLog('Failed to preview commit history stats:', error);
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'commitHistoryStatsError',
                            error: error instanceof Error ? error.message : 'Failed to analyze git history'
                        });
                    }
                }
                break;
            case 'previewChangelogStats':
                try {
                    debugLog('Previewing changelog stats:', { maxCommits: message.maxCommits, groupByVersion: message.groupByVersion });
                    const changelogStats = await GitHistoryAnalyzer.analyzeHistory(
                        message.maxCommits,
                        false // Don't include author info for changelog
                    );

                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'changelogStatsReady',
                            stats: changelogStats
                        });
                    }
                } catch (error) {
                    debugLog('Failed to preview changelog stats:', error);
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'changelogStatsError',
                            error: error instanceof Error ? error.message : 'Failed to analyze git history'
                        });
                    }
                }
                break;
            case 'updateSetting':
                // Prevent duplicate updates for the same setting key
                const settingKey = message.key;
                if (this._updateLocks.get(settingKey)) {
                    debugLog(`Update for ${settingKey} already in progress, skipping duplicate request`);
                    return;
                }

                // Lock this specific setting key
                this._updateLocks.set(settingKey, true);

                try {
                    const config = vscode.workspace.getConfiguration('gitmind');
                    const oldValue = config.get(message.key);

                    debugLog(`Updating setting ${message.key} from ${oldValue} to ${message.value}`);

                    // Update the setting and wait for it to complete
                    await config.update(message.key, message.value, vscode.ConfigurationTarget.Global);

                    // Give VS Code a moment to fully process the configuration change
                    await new Promise(resolve => setTimeout(resolve, 50));

                    // Verify the setting was actually updated
                    const newValue = config.get(message.key);
                    debugLog(`Setting ${message.key} verification: requested=${message.value}, actual=${newValue}`);

                    // Handle subscription status changes - trigger automatic migration
                    if (message.key === 'subscription.status' || message.key === 'subscription.email') {
                        const oldSubscriptionStatus = message.key === 'subscription.status' ? oldValue as string || 'inactive' : config.get<string>('subscription.status') || 'inactive';
                        const newSubscriptionStatus = message.key === 'subscription.status' ? message.value as string || 'inactive' : config.get<string>('subscription.status') || 'inactive';

                        const oldSubscriptionEmail = message.key === 'subscription.email' ? oldValue as string || '' : config.get<string>('subscription.email') || '';
                        const newSubscriptionEmail = message.key === 'subscription.email' ? message.value as string || '' : config.get<string>('subscription.email') || '';

                        // Enhanced pro user detection including mock mode
                        const wasProUser = !!(oldSubscriptionEmail && oldSubscriptionEmail.length > 0 &&
                            (oldSubscriptionStatus === 'active' || oldSubscriptionEmail.includes('test')));
                        const isNowProUser = !!(newSubscriptionEmail && newSubscriptionEmail.length > 0 &&
                            (newSubscriptionStatus === 'active' || newSubscriptionEmail.includes('test')));

                        if (wasProUser !== isNowProUser) {
                            debugLog(`User status changed: ${wasProUser ? 'Pro' : 'Free'} -> ${isNowProUser ? 'Pro' : 'Free'}`);

                            // Refresh the pro user cache to reflect the new status
                            const secureKeyManager = SecureKeyManager.getInstance();
                            secureKeyManager.refreshProUserCache();

                            // Automatically handle key migration based on new status
                            const migrationResult = await secureKeyManager.handleUserStatusChange();

                            if (migrationResult.success) {
                                debugLog('Automatic key migration completed:', migrationResult.message);

                                // Optionally notify the webview of the automatic migration
                                if (SettingsWebview.isWebviewOpen()) {
                                    SettingsWebview.postMessageToWebview({
                                        command: 'migrationResult',
                                        success: true,
                                        message: `${migrationResult.message}`,
                                        details: migrationResult.details,
                                        automatic: true,
                                        persistent: true
                                    });
                                }
                            } else {
                                debugLog('Automatic key migration failed:', migrationResult.message);
                            }
                        }
                    }

                    // Get the updated settings and send them back to the webview
                    // ONLY send back if this is a significant change that affects encryption/pro status
                    if (message.key === 'subscription.status' || message.key === 'subscription.email' ||
                        message.key === 'pro.encryptionEnabled' || message.key === 'pro.licenseKey' ||
                        message.key === 'commitStyle.style') {

                        // For commitStyle.style, add a small delay to ensure the change is fully processed
                        const delay = message.key === 'commitStyle.style' ? 100 : 0;

                        setTimeout(async () => {
                            const updatedSettings = await SettingsManager.getCurrentSettings();
                            if (SettingsWebview.isWebviewOpen()) {
                                SettingsWebview.postMessageToWebview({
                                    command: 'updateSettings',
                                    settings: updatedSettings
                                });
                            }
                        }, delay);
                    }
                    // For other settings, don't send back updateSettings to prevent loops

                    // Provide immediate feedback
                    // vscode.window.showInformationMessage(`Setting updated: ${message.key} = ${message.value}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to update setting: ${error}`);
                } finally {
                    // Release the lock for this specific setting key
                    this._updateLocks.delete(settingKey);
                }
                break;

            case 'loadOllamaModels':
                try {
                    debugLog("Loading Ollama models", { baseUrl: message.baseUrl });
                    const models = await getOllamaModels(message.baseUrl);

                    // Send models back to webview
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'ollamaModelsLoaded',
                            success: true,
                            models: models
                        });
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    debugLog("Failed to load Ollama models", { error: errorMessage });

                    // Send error back to webview
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'ollamaModelsLoaded',
                            success: false,
                            error: errorMessage
                        });
                    }
                }
                break;

            case 'migrateToSecure':
                try {
                    const secureKeyManager = SecureKeyManager.getInstance();
                    const result = await secureKeyManager.migrateToSecureStorage();

                    // Send success message back to webview
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'migrationResult',
                            success: result.success,
                            message: result.message,
                            details: result.details,
                            persistent: true
                        });
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    debugLog("Failed to migrate to secure storage:", errorMessage);

                    // Send error back to webview
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'migrationResult',
                            success: false,
                            error: errorMessage,
                            persistent: true
                        });
                    }
                }
                break;

            case 'checkEncryptionStatus':
                try {
                    const secureKeyManager = SecureKeyManager.getInstance();
                    const detailedStatus = await secureKeyManager.getDetailedEncryptionStatus();

                    // Send detailed status back to webview
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'encryptionStatus',
                            status: detailedStatus.basicStatus,
                            detailedStatus: detailedStatus,
                            providersWithKeys: detailedStatus.providersWithKeys,
                            persistent: true
                        });
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    debugLog("Failed to check encryption status:", errorMessage);

                    // Send error back to webview
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'encryptionStatus',
                            error: errorMessage,
                            persistent: true
                        });
                    }
                }
                break;

            case 'gitmind.subscription.subscribe':
                try {
                    await vscode.commands.executeCommand('gitmind.subscribe');
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'subscriptionResult',
                            success: true,
                            message: 'Subscription process initiated'
                        });
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'subscriptionResult',
                            success: false,
                            error: errorMessage
                        });
                    }
                }
                break;

            case 'gitmind.subscription.manage':
                try {
                    await vscode.commands.executeCommand('gitmind.manageSubscription');
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'subscriptionResult',
                            success: true,
                            message: 'Subscription management opened'
                        });
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'subscriptionResult',
                            success: false,
                            error: errorMessage
                        });
                    }
                }
                break;

            case 'gitmind.subscription.refresh':
                try {
                    // Use email from frontend if provided, otherwise fall back to saved email
                    const frontendEmail = message.email;
                    const commandOptions = frontendEmail ?
                        { silent: true, email: frontendEmail } :
                        { silent: true };

                    await vscode.commands.executeCommand('gitmind.refreshSubscription', commandOptions);
                    // The command will handle posting back to the webview with subscription data
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'subscriptionRefreshed',
                            success: false,
                            error: errorMessage
                        });
                    }
                }
                break;

            case 'checkUserStatusTransition':
                try {
                    const secureKeyManager = SecureKeyManager.getInstance();
                    await secureKeyManager.checkAndHandleUserStatusTransition();
                } catch (error) {
                    debugLog('Failed to check user status transition:', error);
                }
                break;

            case 'activateProLicense':
                try {
                    const { ProActivationService } = await import('../../services/subscription/ProActivationService.js');
                    const proService = ProActivationService.getInstance();

                    const result = await proService.activateWithLicenseKey(message.licenseKey);

                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'proActivationResult',
                            success: result.success,
                            message: result.message,
                            details: result.details,
                            licenseKey: message.licenseKey  // Include the license key for UI masking
                        });
                    }

                    // If successful, refresh the settings
                    if (result.success) {
                        // Get updated settings and send them back
                        const updatedSettings = await SettingsManager.getCurrentSettings();
                        if (SettingsWebview.isWebviewOpen()) {
                            SettingsWebview.postMessageToWebview({
                                command: 'updateSettings',
                                settings: updatedSettings
                            });
                        }
                    }
                } catch (error) {
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'proActivationResult',
                            success: false,
                            message: `Activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                        });
                    }
                }
                break;

            case 'activateProOrder':
                try {
                    const { ProActivationService } = await import('../../services/subscription/ProActivationService.js');
                    const proService = ProActivationService.getInstance();

                    const result = await proService.activateWithOrderId(message.orderId, message.customerEmail);

                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'proActivationResult',
                            success: result.success,
                            message: result.message,
                            details: result.details,
                            orderId: message.orderId  // Include the order ID for UI masking
                        });
                    }

                    // If successful, refresh the settings
                    if (result.success) {
                        const updatedSettings = await SettingsManager.getCurrentSettings();
                        if (SettingsWebview.isWebviewOpen()) {
                            SettingsWebview.postMessageToWebview({
                                command: 'updateSettings',
                                settings: updatedSettings
                            });
                        }
                    }
                } catch (error) {
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'proActivationResult',
                            success: false,
                            message: `Activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                        });
                    }
                }
                break;

            case 'validateProLicense':
                try {
                    const { ProActivationService } = await import('../../services/subscription/ProActivationService.js');
                    const proService = ProActivationService.getInstance();

                    const isValid = await proService.validateExistingLicense();

                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'licenseValidationResult',
                            success: true,
                            isValid: isValid,
                            message: isValid ? 'License is valid and active' : 'License is not valid or has expired'
                        });
                    }

                    // Refresh settings to show updated status
                    const updatedSettings = await SettingsManager.getCurrentSettings();
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'updateSettings',
                            settings: updatedSettings
                        });
                    }
                } catch (error) {
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'licenseValidationResult',
                            success: false,
                            message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                        });
                    }
                }
                break;

            case 'testCustomApiConnection':
                try {
                    debugLog('Test Connection: Initiated custom API connection test');

                    // Check if user is Pro first
                    const { SubscriptionManager } = await import('../../services/subscription/SubscriptionManager.js');
                    const subscriptionManager = SubscriptionManager.getInstance();
                    const isProUser = await subscriptionManager.isProUser();

                    debugLog('Test Connection: Pro user status', { isProUser });

                    if (!isProUser) {
                        debugLog('Test Connection: Access denied - user is not Pro');
                        if (SettingsWebview.isWebviewOpen()) {
                            SettingsWebview.postMessageToWebview({
                                command: 'customApiTestResult',
                                success: false,
                                message: 'Custom API is a Pro feature. Please upgrade to GitMind Pro to use custom API endpoints.'
                            });
                        }
                        return;
                    }

                    // Get custom API settings from the message
                    const settings = message.settings || {};

                    // Sanitize settings for logging (hide sensitive data)
                    const sanitizedSettings = {
                        baseUrl: settings.baseUrl?.trim(),
                        endpoint: settings.endpoint?.trim(),
                        authType: settings.authType,
                        headerKey: settings.headerKey?.trim(),
                        requestFormat: settings.requestFormat || 'openai',
                        responseFormat: settings.responseFormat || 'openai',
                        model: settings.model?.trim(),
                        authToken: settings.authToken ? `[${settings.authToken.length} chars]` : '[not provided]'
                    };
                    debugLog('Test Connection: Configuration', sanitizedSettings);

                    // Validate required fields
                    const baseUrl = settings.baseUrl?.trim();
                    const endpoint = settings.endpoint?.trim();
                    const authType = settings.authType;

                    // Resolve token: prefer secure storage if UI holds placeholder/empty
                    const secureKeyManager = SecureKeyManager.getInstance();
                    let tokenForUse: string = settings.authToken || '';
                    try {
                        const storedToken = await secureKeyManager.getApiKey('custom', false);
                        if (storedToken && (tokenForUse.trim().length === 0 || tokenForUse.trim() === '[ENCRYPTED]')) {
                            tokenForUse = storedToken;
                        }
                    } catch (e) {
                        debugLog('Test Connection: Unable to retrieve secure custom token', e);
                    }

                    // Validation checks
                    if (!baseUrl) {
                        debugLog('Test Connection: Validation failed - Base URL is missing');
                        throw new Error('Base URL is required');
                    }

                    if (!endpoint) {
                        debugLog('Test Connection: Validation failed - Endpoint is missing');
                        throw new Error('API endpoint path is required');
                    }

                    // If auth type is apikey, make sure a header key is provided
                    if (authType === 'apikey' && !settings.headerKey?.trim()) {
                        debugLog('Test Connection: Validation failed - Header key is missing for API Key auth');
                        throw new Error('Header key name is required for API Key authentication');
                    }

                    // If auth type requires token (bearer, apikey, basic), make sure it's provided
                    if ((authType === 'bearer' || authType === 'apikey' || authType === 'basic') && !tokenForUse) {
                        debugLog('Test Connection: Validation failed - Auth token is missing');
                        throw new Error('Authentication token is required for the selected authentication type');
                    }

                    debugLog('Test Connection: Validation passed, preparing test request');

                    // Create minimal test payload
                    const testPayload = {
                        messages: [
                            { role: 'system', content: 'You are a helpful assistant.' },
                            { role: 'user', content: 'Hello, this is a test message to verify the connection.' }
                        ]
                    };

                    debugLog('Test Connection: Test payload', testPayload);

                    // Attempt to call the API with a short timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                    // Build headers based on auth type
                    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                    if (authType === 'bearer') {
                        headers['Authorization'] = `Bearer ${tokenForUse}`;
                    } else if (authType === 'apikey') {
                        headers[settings.headerKey?.trim() || 'x-api-key'] = tokenForUse;
                    } else if (authType === 'basic') {
                        headers['Authorization'] = `Basic ${Buffer.from(tokenForUse).toString('base64')}`;
                    }

                    // Build request body using simple templating similar to custom.ts
                    const buildTestBody = (): any => {
                        const requestFormat: string = settings.requestFormat || 'openai';
                        const model = settings.model || 'gpt-3.5-turbo';
                        const prompt = JSON.stringify(testPayload);

                        try {
                            if (!requestFormat || requestFormat.trim() === '' || requestFormat.toLowerCase() === 'openai') {
                                return {
                                    model,
                                    messages: [
                                        { role: 'system', content: 'You are a helpful assistant that generates git commit messages.' },
                                        { role: 'user', content: 'Hello, this is a test message to verify the connection.' }
                                    ]
                                };
                            }

                            let formatted = requestFormat
                                .replace(/\{\{MODEL\}\}/g, model)
                                .replace(/\{\{PROMPT\}\}/g, prompt)
                                .replace(/\{\{model\}\}/g, model)
                                .replace(/\{\{prompt\}\}/g, prompt);

                            if (formatted.includes('{{MESSAGES}}') || formatted.includes('{{messages}}')) {
                                const messagesArray = [
                                    { role: 'system', content: 'You are a helpful assistant that generates git commit messages.' },
                                    { role: 'user', content: 'Hello, this is a test message to verify the connection.' }
                                ];
                                formatted = formatted
                                    .replace('{{MESSAGES}}', JSON.stringify(messagesArray))
                                    .replace('{{messages}}', JSON.stringify(messagesArray));
                            }

                            return JSON.parse(formatted);
                        } catch (e) {
                            debugLog('Test Connection: Failed to parse custom request format, falling back to OpenAI format');
                            return {
                                model,
                                messages: [
                                    { role: 'system', content: 'You are a helpful assistant that generates git commit messages.' },
                                    { role: 'user', content: 'Hello, this is a test message to verify the connection.' }
                                ]
                            };
                        }
                    };

                    debugLog('Test Connection: Sending request to API (5 second timeout)');

                    try {
                        const startTime = Date.now();
                        const response = await fetch(`${baseUrl}${endpoint}`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify(buildTestBody()),
                            signal: controller.signal
                        });
                        const duration = Date.now() - startTime;

                        const status = response.status;
                        const ok = response.ok;
                        const contentType = response.headers.get('content-type') || 'unknown';
                        const rawText = await response.text();
                        const responseSize = Buffer.byteLength(rawText || '', 'utf8');

                        if (!ok) {
                            let errorMessage = `Connection failed: HTTP ${status}`;
                            if (rawText) {
                                const snippet = rawText.length > 300 ? `${rawText.slice(0, 300)}…` : rawText;
                                errorMessage += `\nResponse: ${snippet}`;
                            }

                            // Add hints based on status
                            if (status === 401 || status === 403) {
                                errorMessage += `\nHint: Authentication failed. Verify token/key, auth type, and header key name.`;
                            } else if (status === 404) {
                                errorMessage += `\nHint: Endpoint not found. Verify the endpoint path (${endpoint}).`;
                            } else if (status === 400) {
                                errorMessage += `\nHint: Bad request. Check your Request Format template.`;
                            } else if (status === 415) {
                                errorMessage += `\nHint: Unsupported Media Type. Ensure 'Content-Type: application/json'.`;
                            }

                            throw new Error(errorMessage);
                        }

                        // Try to parse JSON to detect structure
                        let data: any = undefined;
                        try {
                            data = contentType.includes('application/json') ? JSON.parse(rawText) : JSON.parse(rawText);
                        } catch {
                            // Non-JSON response; proceed with raw text
                        }

                        const detectStructure = (payload: any): { format: string; path?: string; valuePreview?: string } => {
                            const truncate = (s: string) => (s.length > 200 ? `${s.slice(0, 200)}…` : s);
                            if (payload && typeof payload === 'object') {
                                const openai = payload?.choices?.[0];
                                const openaiText = openai?.message?.content ?? openai?.text;
                                if (typeof openaiText === 'string' && openaiText.length > 0) {
                                    return { format: 'openai-like', path: 'choices[0].message.content', valuePreview: truncate(openaiText) };
                                }
                                const claudeText = payload?.content?.[0]?.text ?? payload?.content;
                                if (typeof claudeText === 'string' && claudeText.length > 0) {
                                    return { format: 'anthropic-like', path: 'content[0].text', valuePreview: truncate(claudeText) };
                                }
                                const geminiText = payload?.candidates?.[0]?.content?.parts?.[0]?.text
                                    ?? payload?.candidates?.[0]?.content?.parts?.find?.((p: any) => typeof p?.text === 'string')?.text
                                    ?? payload?.output_text;
                                if (typeof geminiText === 'string' && geminiText.length > 0) {
                                    return { format: 'gemini-like', path: 'candidates[0].content.parts[0].text', valuePreview: truncate(geminiText) };
                                }

                                // Generic DFS to find first string and path
                                const seen = new Set<any>();
                                const dfs = (obj: any, path: string): { path: string; value: string } | undefined => {
                                    if (!obj || typeof obj !== 'object' || seen.has(obj)) {
                                        return undefined;
                                    }
                                    seen.add(obj);
                                    if (Array.isArray(obj)) {
                                        for (let i = 0; i < obj.length; i++) {
                                            const v = obj[i];
                                            if (typeof v === 'string' && v.trim()) {
                                                return { path: `${path}[${i}]`, value: v };
                                            }
                                            const child = dfs(v, `${path}[${i}]`);
                                            if (child) { return child; }
                                        }
                                    } else {
                                        for (const k of Object.keys(obj)) {
                                            const v = obj[k];
                                            if (typeof v === 'string' && v.trim()) {
                                                return { path: path ? `${path}.${k}` : k, value: v };
                                            }
                                            const child = dfs(v, path ? `${path}.${k}` : k);
                                            if (child) { return child; }
                                        }
                                    }
                                    return undefined;
                                };
                                const found = dfs(payload, '');
                                if (found) {
                                    return { format: 'custom', path: found.path || '', valuePreview: truncate(found.value) };
                                }
                                return { format: 'unknown' };
                            }
                            if (typeof payload === 'string' && payload.trim()) {
                                return { format: 'text', valuePreview: truncate(payload) };
                            }
                            return { format: 'unknown' };
                        };

                        const structure = detectStructure(data ?? rawText);

                        debugLog('Test Connection: SUCCESS', {
                            duration: `${duration}ms`,
                            endpoint: `${baseUrl}${endpoint}`,
                            status,
                            contentType,
                            responseSize,
                            structure
                        });

                        // Build formatted HTML message
                        const messageHtml = `
                            <div class="test-result-header">Connection Successful</div>
                            <div class="test-result-section">
                                <div class="test-result-label">Endpoint</div>
                                <div class="test-result-value">${baseUrl}${endpoint}</div>
                            </div>
                            <div class="test-result-row">
                                <div class="test-result-item">
                                    <span class="test-result-label">HTTP Status:</span>
                                    <span class="test-result-value">${status}</span>
                                </div>
                                <div class="test-result-item">
                                    <span class="test-result-label">Latency:</span>
                                    <span class="test-result-value">${duration}ms</span>
                                </div>
                            </div>
                            <div class="test-result-row">
                                <div class="test-result-item">
                                    <span class="test-result-label">Content-Type:</span>
                                    <span class="test-result-value">${contentType}</span>
                                </div>
                                <div class="test-result-item">
                                    <span class="test-result-label">Response Size:</span>
                                    <span class="test-result-value">${responseSize} bytes</span>
                                </div>
                            </div>
                            <div class="test-result-section">
                                <div class="test-result-label">Detected Format</div>
                                <div class="test-result-value test-result-format">${structure.format}</div>
                            </div>
                            ${structure.path ? `
                            <div class="test-result-section">
                                <div class="test-result-label">Suggested Response Path</div>
                                <div class="test-result-value test-result-path">${structure.path}</div>
                            </div>
                            ` : ''}
                            ${structure.valuePreview ? `
                            <div class="test-result-section">
                                <div class="test-result-label">Response Preview</div>
                                <div class="test-result-value test-result-preview">${structure.valuePreview}</div>
                            </div>
                            ` : ''}
                        `;

                        if (SettingsWebview.isWebviewOpen()) {
                            SettingsWebview.postMessageToWebview({
                                command: 'customApiTestResult',
                                success: true,
                                message: messageHtml
                            });
                        }
                    } catch (apiError: any) {
                        // API call failed
                        let errorMessage = 'Connection failed: ';

                        if (apiError?.name === 'AbortError') {
                            errorMessage += 'Request timed out after 5 seconds.';
                        } else if (typeof apiError?.message === 'string') {
                            errorMessage += apiError.message;
                        } else {
                            errorMessage += 'Unknown error occurred';
                        }

                        // Common actionable hints for network-level failures
                        if (typeof apiError?.message === 'string') {
                            if (apiError.message.includes('ENOTFOUND') || apiError.message.includes('getaddrinfo')) {
                                errorMessage += '\nHint: Host not reachable. Check Base URL and network connectivity.';
                            } else if (apiError.message.includes('ECONNREFUSED')) {
                                errorMessage += '\nHint: Connection refused. Ensure the server is running and accessible.';
                            } else if (apiError.message.includes('EAI_AGAIN')) {
                                errorMessage += '\nHint: DNS lookup timed out. Try again or verify DNS configuration.';
                            }
                        }

                        debugLog('Test Connection: FAILED', {
                            error: apiError?.message || 'Unknown error',
                            errorName: apiError?.name,
                            endpoint: `${baseUrl}${endpoint}`
                        });

                        if (SettingsWebview.isWebviewOpen()) {
                            SettingsWebview.postMessageToWebview({
                                command: 'customApiTestResult',
                                success: false,
                                message: errorMessage
                            });
                        }
                    } finally {
                        clearTimeout(timeoutId);
                    }
                } catch (error: any) {
                    // General error in validation or setup
                    debugLog('Test Connection: Configuration error', {
                        error: error.message || 'Unknown error',
                        stack: error.stack
                    });

                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'customApiTestResult',
                            success: false,
                            message: `Configuration error: ${error.message || 'Unknown error'}`
                        });
                    }
                }
                break;

            case 'deactivatePro':
                try {
                    const { ProActivationService } = await import('../../services/subscription/ProActivationService.js');
                    const proService = ProActivationService.getInstance();

                    // Check if API call is requested and we have the required parameters
                    const callApi = message.callApi === true;
                    let licenseKey = message.licenseKey;
                    let instanceId = message.instanceId;

                    // If API call is requested but license key or instance ID wasn't provided from webview,
                    // try to get them from current configuration
                    if (callApi && (!licenseKey || !instanceId)) {
                        const currentSettings = await SettingsManager.getCurrentSettings();
                        if (!licenseKey) {
                            const configLicenseKey = currentSettings.pro?.licenseKey || '';
                            // If license key is encrypted, we'll let the deactivate method handle it
                            // since it has access to secure storage through ProActivationService
                            licenseKey = configLicenseKey;
                        }
                        if (!instanceId) {
                            instanceId = currentSettings.pro?.instanceId || '';
                        }
                        debugLog('Retrieved license info from config:', {
                            hasLicenseKey: !!licenseKey,
                            hasInstanceId: !!instanceId,
                            isEncrypted: licenseKey === '[ENCRYPTED]'
                        });
                    }

                    debugLog('Deactivating Pro license:', {
                        callApi,
                        hasLicenseKey: !!licenseKey,
                        hasInstanceId: !!instanceId
                    });

                    const result = await proService.deactivate(callApi, licenseKey, instanceId);

                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'proDeactivationResult',
                            success: result.success,
                            message: result.message,
                            apiResponse: result.apiResponse
                        });
                    }

                    // Refresh settings to show updated status
                    if (result.success) {
                        const updatedSettings = await SettingsManager.getCurrentSettings();
                        if (SettingsWebview.isWebviewOpen()) {
                            SettingsWebview.postMessageToWebview({
                                command: 'updateSettings',
                                settings: updatedSettings
                            });
                        }
                    }
                } catch (error) {
                    debugLog('Deactivation error:', error);
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'proDeactivationResult',
                            success: false,
                            message: `Deactivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                        });
                    }
                }
                break;

            case 'showDeactivationModal':
                try {
                    // Import the showDeactivationSuccessModal function and call it
                    vscode.commands.executeCommand('gitmind.showDeactivationModal', message.apiResponse);
                } catch (error) {
                    debugLog('Error showing deactivation modal:', error);
                }
                break;

            case 'showSimpleMessage':
                try {
                    const messageType = message.type || 'info';
                    const messageText = message.message || 'Operation completed';

                    if (messageType === 'info') {
                        vscode.window.showInformationMessage(messageText);
                    } else if (messageType === 'warning') {
                        vscode.window.showWarningMessage(messageText);
                    } else if (messageType === 'error') {
                        vscode.window.showErrorMessage(messageText);
                    }
                } catch (error) {
                    debugLog('Error showing simple message:', error);
                }
                break;

            case 'refreshSettings':
                try {
                    // Get the current settings from VSCode configuration
                    const currentConfig = await SettingsManager.getCurrentSettings();

                    // Send updated settings back to webview
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'updateSettings',
                            settings: currentConfig,
                            forceRefresh: message.forceReload || false,
                            refreshUI: message.refreshUI || false
                        });
                    }
                } catch (error) {
                    debugLog('Error refreshing settings:', error);
                }
                break;

            case 'getActualApiKey':
                try {
                    const secureKeyManager = SecureKeyManager.getInstance();
                    const provider = message.provider;

                    if (!provider) {
                        throw new Error('Provider is required for getActualApiKey');
                    }

                    // Security check: Only Pro users should be able to copy encrypted keys
                    const isProUser = secureKeyManager.isProUser();
                    if (!isProUser) {
                        throw new Error('Copy API Key is a Pro feature. Upgrade to GitMind Pro to unlock this functionality.');
                    }

                    // Additional security check: Only allow copying if encryption is actually enabled
                    const encryptionStatus = secureKeyManager.getEncryptionStatus();
                    if (!encryptionStatus.enabled) {
                        // If encryption is not enabled, the key should already be visible in plain text
                        throw new Error('Encryption is not enabled. The API key should already be visible in the settings.');
                    }

                    // Get the actual API key (not for display, so we get the real decrypted value)
                    const actualKey = await secureKeyManager.getActualApiKey(provider);

                    // Only send the key if it exists and is not empty
                    if (actualKey && actualKey.trim() !== '' && actualKey !== '[ENCRYPTED]') {
                        // Send the actual key back to webview for copying
                        if (SettingsWebview.isWebviewOpen()) {
                            SettingsWebview.postMessageToWebview({
                                command: 'actualApiKeyResponse',
                                provider: provider,
                                apiKey: actualKey,
                                success: true
                            });
                        }
                    } else {
                        throw new Error('No API key found for the specified provider');
                    }
                } catch (error) {
                    debugLog('Error getting actual API key:', error);

                    // Send error response back to webview
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'actualApiKeyResponse',
                            provider: message.provider,
                            apiKey: '',
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }
                break;
        }
    }
}
