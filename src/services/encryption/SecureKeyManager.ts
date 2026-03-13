// src/services/encryption/SecureKeyManager.ts
import * as vscode from 'vscode';
import { debugLog } from '../debug/logger';

// Placeholder text to display in settings when a key is encrypted
export const ENCRYPTED_KEY_PLACEHOLDER = "[ENCRYPTED]";


/**
 * Manages secure storage and retrieval of API keys using VSCode's SecretStorage API
 * This class ensures API keys are encrypted and stored securely, only accessible to this extension
 */
export class SecureKeyManager {
    private static instance: SecureKeyManager;
    private context: vscode.ExtensionContext | undefined;

    // Add cache mechanism to prevent excessive pro user checks
    private proUserCache: { result: boolean; timestamp: number } | null = null;
    private readonly CACHE_DURATION = 5000; // 5 seconds

    // Add cache mechanism to prevent excessive API key retrieval calls
    private apiKeyCache: Map<string, { key: string | undefined; timestamp: number }> = new Map();
    private readonly API_KEY_CACHE_DURATION = 2000; // 2 seconds
    private readonly API_KEY_CACHE_MAX_SIZE = 50; // Maximum entries before forced cleanup

    private constructor() { }

    /**
     * Evicts expired entries from the API key cache to prevent unbounded growth
     */
    private evictExpiredCacheEntries(): void {
        const now = Date.now();
        for (const [key, entry] of this.apiKeyCache) {
            if (now - entry.timestamp >= this.API_KEY_CACHE_DURATION) {
                this.apiKeyCache.delete(key);
            }
        }
    }

    /**
     * Gets the singleton instance of SecureKeyManager
     */
    public static getInstance(): SecureKeyManager {
        if (!SecureKeyManager.instance) {
            SecureKeyManager.instance = new SecureKeyManager();
        }
        return SecureKeyManager.instance;
    }

    /**
     * Initializes the SecureKeyManager with the extension context
     * Must be called during extension activation
     */
    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        debugLog('SecureKeyManager initialized');
    }

    /**
     * Checks if encryption is available for the current user (sync version using cache)
     * This feature is only available for pro users or when dev mode is enabled
     */
    public isEncryptionAvailable(): boolean {
        // Check for development mode override
        const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
        if (devModeEnabled) {
            debugLog('Encryption available: Development mode enabled');
            return true;
        }

        // Check if user has pro subscription (sync version using cache)
        const proEnabled = this.isProUser();
        debugLog(`Encryption available: Pro user status = ${proEnabled}`);
        return proEnabled;
    }

    /**
     * Checks if encryption is available for the current user (async version with real-time check)
     * This feature is only available for pro users or when dev mode is enabled
     */
    public async isEncryptionAvailableAsync(): Promise<boolean> {
        // Check for development mode override
        const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
        if (devModeEnabled) {
            debugLog('Encryption available: Development mode enabled');
            return true;
        }

        // Check if user has pro subscription (async version with real-time check)
        const proEnabled = await this.isProUserAsync();
        debugLog(`Encryption available: Pro user status = ${proEnabled}`);
        return proEnabled;
    }

    /**
     * Checks if the user has a pro subscription (sync version using cache)
     * Uses LemonSqueezy subscription status
     */
    public isProUser(): boolean {
        const now = Date.now();

        // Check if we have a valid cached result
        if (this.proUserCache && (now - this.proUserCache.timestamp) < this.CACHE_DURATION) {
            return this.proUserCache.result;
        }

        // Perform the actual check
        const result = this.performProUserCheck();

        // Cache the result
        this.proUserCache = { result, timestamp: now };

        return result;
    }

    /**
     * Performs the actual pro user check without caching
     */
    private performProUserCheck(): boolean {
        // Check if the user has a valid subscription
        const config = vscode.workspace.getConfiguration('gitmind');

        // Check for subscription email (LemonSqueezy)
        const subscriptionEmail = config.get<string>('subscription.email');
        const subscriptionStatus = config.get<string>('subscription.status');

        // Check if subscription is explicitly active
        if (subscriptionEmail && subscriptionEmail.length > 0 && subscriptionStatus === 'active') {
            return true;
        }

        // Check for dev mode
        if (process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true') {
            return true;
        }

        // Check if user was previously pro but is now free - trigger transition
        const wasProUser = this.checkIfWasPreviouslyPro();
        if (wasProUser) {
            debugLog('User transitioned from Pro to Free - triggering free mode transition');
            // Use setTimeout to avoid blocking the current call
            setTimeout(() => this.handleFreeUserTransition(), 100);
        }

        return false;
    }

    /**
     * Forces a refresh of the pro user cache
     * Call this when subscription status changes
     */
    public refreshProUserCache(): void {
        this.proUserCache = null;
        debugLog('Pro user cache refreshed');
    }

    /**
     * Clears the API key cache for a specific provider or all providers
     * Call this when API keys are updated
     */
    public clearApiKeyCache(provider?: string): void {
        if (provider) {
            // Clear cache for specific provider (both display and non-display versions)
            this.apiKeyCache.delete(`${provider}_true`);
            this.apiKeyCache.delete(`${provider}_false`);
            debugLog(`API key cache cleared for provider: ${provider}`);
        } else {
            // Clear all API key cache
            this.apiKeyCache.clear();
            debugLog('All API key cache cleared');
        }
    }

    /**
     * Checks if the user has a pro subscription (async version with real-time check)
     * Uses both legacy license key and real-time Lemon Squeezy subscription validation
     */
    private async isProUserAsync(): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('gitmind');

        // If a valid license/order ID exists, treat as Pro without requiring subscription email.
        // This avoids interactive prompts during background checks (and in test runners).
        const validationStatus = config.get<string>('pro.validationStatus');
        const licenseKey = config.get<string>('pro.licenseKey');
        const orderId = config.get<string>('pro.orderId');
        if (validationStatus === 'valid' && ((licenseKey && licenseKey.length > 0) || (orderId && orderId.length > 0))) {
            return true;
        }

        // Never prompt the user for email during a Pro check. If no email is configured,
        // we can't validate subscription status.
        const subscriptionEmail = config.get<string>('subscription.email');
        if (!subscriptionEmail || subscriptionEmail.trim().length === 0) {
            return false;
        }

        // Legacy license key check removed - now only using subscription

        // Check subscription via SubscriptionManager
        try {
            const SubscriptionManager = (await import('../subscription/SubscriptionManager.js')).SubscriptionManager;
            const subscriptionManager = SubscriptionManager.getInstance();

            // Check if user has an active subscription
            const isProUser = await subscriptionManager.isProUser(subscriptionEmail);
            if (isProUser) {
                debugLog('Pro user detected via Lemon Squeezy subscription');
                return true;
            }
        } catch (error) {
            debugLog('Failed to check subscription status:', error);
            // Fallback to cached check if real-time check fails
        }

        // Fallback: Check subscription via email (cached result)
        // Note: This only checks cached subscription status for performance.
        // Real-time validation happens in SubscriptionManager.
        const cached = this.getCachedSubscriptionStatus(subscriptionEmail);
        if (cached?.isActive) {
            debugLog('Pro user detected via cached Lemon Squeezy subscription');
            return true;
        }

        return false;
    }

    /**
     * Get cached subscription status for quick checks
     */
    private getCachedSubscriptionStatus(email: string): { isActive: boolean } | null {
        // This is a simplified check - full subscription management is handled by SubscriptionManager
        // We just check if there's a recent cached positive result
        try {
            if (this.context) {
                const cached = this.context.globalState.get<{ [email: string]: any }>('subscriptionCache');
                const userCache = cached?.[email.toLowerCase()];
                if (userCache && userCache.status?.isActive && new Date() < new Date(userCache.cacheValidUntil)) {
                    return { isActive: true };
                }
            }
        } catch (error) {
            debugLog('Failed to get cached subscription status:', error);
        }
        return null;
    }

    /**
     * Checks if SecretStorage API is available
     */
    private isSecretStorageAvailable(): boolean {
        return !!this.context && !!this.context.secrets;
    }

    /**
     * Stores an API key securely using VSCode's SecretStorage
     * @param provider The AI provider name (e.g., 'openai', 'anthropic')
     * @param apiKey The API key to store securely
     */
    /**
     * Stores an API key securely and manages plain text storage based on user status
     */
    public async storeApiKey(provider: string, apiKey: string): Promise<void> {
        if (!this.isSecretStorageAvailable()) {
            throw new Error('Secure storage is not available in this VS Code version.');
        }

        const secretKey = `gitmind.${provider}.apiKey`;
        const isProUser = this.isProUser();
        const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
        const encryptionAvailable = isProUser || devModeEnabled;

        // Get current encryption setting from configuration
        const config = vscode.workspace.getConfiguration('gitmind');
        const encryptionEnabled = config.get<boolean>('pro.encryptionEnabled', false);

        try {
            // Always store the key securely (as backup even for free users)
            await this.context!.secrets.store(secretKey, apiKey);
            debugLog(`API key stored securely for provider: ${provider}`);

            // Clear cache for this provider since we're updating the key
            this.clearApiKeyCache(provider);

            if (encryptionAvailable && encryptionEnabled) {
                // Pro users with encryption enabled: clear plain text and use secure storage
                await this.clearPlainTextApiKey(provider);
                debugLog(`Cleared plain text key for Pro user with encryption enabled: ${provider}`);
            } else {
                // Free users OR Pro users with encryption disabled: also store in plain text for accessibility
                await config.update(`${provider}.apiKey`, apiKey, vscode.ConfigurationTarget.Global);
                debugLog(`Stored key in both secure and plain text for ${encryptionAvailable ? 'Pro user with encryption disabled' : 'free user'}: ${provider}`);
            }

        } catch (error) {
            debugLog(`Failed to store API key for ${provider}:`, error);
            throw new Error(`Failed to store API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Retrieves an API key securely from VSCode's SecretStorage
     * @param provider The AI provider name
     * @returns The decrypted API key or undefined if not found
     * Gets an API key for a provider with robust logic:
     * - Always try secure storage first (keys are always encrypted)
     * - For Pro users: use secure storage and auto-migrate from plain text
     * - For free users: use plain text storage but keep secure keys as backup
     * - When encryption is enabled, returns a placeholder for UI display
     */
    public async getApiKey(provider: string, forDisplay: boolean = true): Promise<string | undefined> {
        // Evict expired entries periodically to prevent unbounded cache growth
        if (this.apiKeyCache.size > this.API_KEY_CACHE_MAX_SIZE) {
            this.evictExpiredCacheEntries();
        }

        // Check cache first to prevent excessive calls
        const cacheKey = `${provider}_${forDisplay}`;
        const cached = this.apiKeyCache.get(cacheKey);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < this.API_KEY_CACHE_DURATION) {
            return cached.key;
        }

        if (!this.isSecretStorageAvailable()) {
            debugLog('Secret storage not available, falling back to plain text');
            const result = this.getPlainTextApiKey(provider);
            // Cache the result
            this.apiKeyCache.set(cacheKey, { key: result, timestamp: now });
            return result;
        }

        const secretKey = `gitmind.${provider}.apiKey`;
        const isProUser = this.isProUser();
        const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
        const encryptionAvailable = isProUser || devModeEnabled;

        // Get current encryption setting from configuration
        const config = vscode.workspace.getConfiguration('gitmind');
        const encryptionEnabled = config.get<boolean>('pro.encryptionEnabled', false);

        try {
            // Try to get the key from secure storage first
            const secureKey = await this.context!.secrets.get(secretKey);

            let result: string | undefined;

            if (secureKey) {
                // We have a secure key
                if (encryptionAvailable && encryptionEnabled) {
                    // Pro user with encryption enabled: use secure key
                    debugLog(`Using secure API key for provider: ${provider}`);

                    // If this is for display purposes (UI or settings.json), return the placeholder
                    if (forDisplay) {
                        result = ENCRYPTED_KEY_PLACEHOLDER;
                    } else {
                        // Otherwise return the actual key for API calls
                        result = secureKey;
                    }
                } else {
                    // Free user or encryption disabled: use plain text but keep secure key as backup
                    const plainTextKey = this.getPlainTextApiKey(provider);
                    if (!plainTextKey || plainTextKey === ENCRYPTED_KEY_PLACEHOLDER) {
                        // If no plain text key exists or it's just the placeholder, restore from secure storage
                        // This happens when a user downgrades from Pro or disables encryption
                        debugLog(`Restoring API key from secure storage for provider: ${provider}`);
                        await this.restoreToPlainText(provider, secureKey);
                        result = secureKey;
                    } else {
                        result = plainTextKey;
                    }
                }
            } else {
                // No secure key exists, use plain text
                const plainTextKey = this.getPlainTextApiKey(provider);

                // If we're a pro user with encryption enabled and have a plain text key,
                // we should migrate it to secure storage (but only if not called too frequently)
                if (plainTextKey && plainTextKey.trim() !== '' && encryptionAvailable && encryptionEnabled && !forDisplay) {
                    debugLog(`Auto-migrating API key to secure storage for provider: ${provider}`);
                    await this.storeApiKey(provider, plainTextKey);

                    // Return placeholder for display if encryption is enabled
                    if (forDisplay) {
                        result = ENCRYPTED_KEY_PLACEHOLDER;
                    } else {
                        result = plainTextKey;
                    }
                } else {
                    // Return the plain text key (could be empty string) - don't return placeholder for empty keys
                    result = plainTextKey;
                }
            }

            // Cache the result
            this.apiKeyCache.set(cacheKey, { key: result, timestamp: now });
            return result;

        } catch (error) {
            debugLog(`Error retrieving API key for ${provider}:`, error);
            const fallback = this.getPlainTextApiKey(provider);
            // Cache the fallback result
            this.apiKeyCache.set(cacheKey, { key: fallback, timestamp: now });
            return fallback;
        }
    }

    /**
     * Gets the actual API key for internal use (API calls)
     * This always returns the real key, never a placeholder
     */
    public async getActualApiKey(provider: string): Promise<string | undefined> {
        return this.getApiKey(provider, false);
    }

    /**
     * Deletes an API key from secure storage
     * @param provider The AI provider name
     */
    public async deleteApiKey(provider: string): Promise<void> {
        if (!this.isSecretStorageAvailable()) {
            throw new Error('Secure storage is not available in this VS Code version.');
        }

        const secretKey = `gitmind.${provider}.apiKey`;

        try {
            await this.context!.secrets.delete(secretKey);
            debugLog(`API key deleted for provider: ${provider}`);

            // Clear cache for this provider since we're deleting the key
            this.clearApiKeyCache(provider);

            // Also clear plain text key
            await this.clearPlainTextApiKey(provider);

        } catch (error) {
            debugLog(`Failed to delete API key for ${provider}:`, error);
            throw new Error(`Failed to delete API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Migrates existing plain text API keys to secure storage
     * This should be called during extension activation for pro users
     */
    /**
     * Migrates API keys based on current user status
     * This is the same as handleUserStatusChange but with different messaging
     */
    public async migrateToSecureStorage(): Promise<{ success: boolean; message: string; details?: string[] }> {
        debugLog('Starting API key migration process...');

        const result = await this.handleUserStatusChange();

        // Update the messaging to be more specific to manual migration
        if (result.success && result.details && result.details.length > 0) {
            const hasActualMigrations = result.details.some(detail => detail.includes('migrated') || detail.includes('restored'));
            if (hasActualMigrations) {
                return {
                    ...result,
                    message: result.message.replace('migrated', 'migrated via manual process')
                };
            }
        }

        return result;
    }

    /**
     * Migrate keys back to plain text storage (for when user downgrades from Pro)
     */
    public async migrateToPlainText(): Promise<{ success: boolean; message: string; details?: string[] }> {
        if (!this.context) {
            return { success: false, message: 'SecureKeyManager not initialized' };
        }

        try {
            const results: string[] = [];
            const config = vscode.workspace.getConfiguration('gitmind');

            const providers = [
                'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
                'together', 'openrouter', 'anthropic', 'minimax', 'deepseek', 'grok', 'groq', 'perplexity', 'zai', 'custom'
            ];

            // Get all encrypted keys and move them back to plain text
            for (const provider of providers) {
                const keyName = `gitmind.${provider}.apiKey`;
                const encryptedKey = await this.context.secrets.get(keyName);

                if (encryptedKey) {
                    // Move to plain text storage
                    await config.update(`${provider}.apiKey`, encryptedKey, vscode.ConfigurationTarget.Global);
                    // Remove from encrypted storage - no need to delete as we keep it as backup
                    results.push(`✓ ${provider.toUpperCase()} key restored to plain text access`);
                    debugLog(`Migrated ${provider} key back to plain text storage`);
                }
            }

            // Force restore any [ENCRYPTED] placeholders
            const placeholderResult = await this.forceRestoreEncryptedPlaceholders();
            if (placeholderResult.success && placeholderResult.details && placeholderResult.details.length > 0) {
                results.push(...placeholderResult.details);
            }

            // Disable all pro features
            await config.update('pro.encryptionEnabled', false, vscode.ConfigurationTarget.Global);

            // Add other pro feature disabling here as they're added
            // Example: await config.update('pro.advancedAnalytics', false, vscode.ConfigurationTarget.Global);

            debugLog('All pro features disabled for free user');

            return {
                success: true,
                message: results.length > 0 ? 'API keys successfully moved to plain text storage and pro features disabled' : 'Pro features disabled - no encrypted keys found to migrate',
                details: results
            };
        } catch (error) {
            debugLog('Error migrating to plain text:', error);
            return { success: false, message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    /**
     * Auto-migrate keys based on current user status
     */
    public async autoMigrateBasedOnUserStatus(): Promise<void> {
        const isCurrentlyPro = this.isProUser();
        const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
        const encryptionStatus = this.getEncryptionStatus();

        // If encryption was previously enabled but user is not pro (and not in dev mode), migrate back to plain text
        if (!isCurrentlyPro && !devModeEnabled) {
            const config = vscode.workspace.getConfiguration('gitmind');
            const encryptionWasEnabled = config.get<boolean>('pro.encryptionEnabled', false);

            if (encryptionWasEnabled) {
                debugLog('User is no longer Pro but encryption is enabled. Auto-migrating to plain text...');
                try {
                    const result = await this.migrateToPlainText();
                    if (result.success) {
                        vscode.window.showInformationMessage(
                            `GitMind: API keys have been moved back to standard storage as you're no longer a Pro user.`
                        );
                    }
                } catch (error) {
                    debugLog('Failed to auto-migrate to plain text:', error);
                }
            }
        }
    }

    /**
     * Handles user status changes and migrates keys accordingly
     * Called when license key is added/removed
     */
    public async handleUserStatusChange(): Promise<{ success: boolean; message: string; details?: string[] }> {
        if (!this.isSecretStorageAvailable()) {
            return { success: false, message: 'VS Code SecretStorage not available' };
        }

        try {
            const providers = [
                'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
                'together', 'openrouter', 'anthropic', 'minimax', 'deepseek', 'grok', 'groq', 'perplexity', 'zai', 'custom'
            ];

            const isProUser = this.isProUser();
            const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
            const encryptionAvailable = isProUser || devModeEnabled;

            let migratedCount = 0;
            const results: string[] = [];

            for (const provider of providers) {
                try {
                    const secureKey = await this.context!.secrets.get(`gitmind.${provider}.apiKey`);
                    const plainTextKey = this.getPlainTextApiKey(provider);

                    if (encryptionAvailable) {
                        // Became Pro: migrate plain text to secure, clear plain text
                        if (plainTextKey && !secureKey) {
                            await this.context!.secrets.store(`gitmind.${provider}.apiKey`, plainTextKey);
                            await this.clearPlainTextApiKey(provider);
                            migratedCount++;
                            results.push(`✓ ${provider.toUpperCase()} key migrated to secure storage`);
                        } else if (plainTextKey && secureKey) {
                            // Both exist, clear plain text
                            await this.clearPlainTextApiKey(provider);
                            results.push(`✓ ${provider.toUpperCase()} plain text key cleared (secure version retained)`);
                        }
                    } else {
                        // Became Free: ensure plain text access while keeping secure backup
                        if (secureKey && !plainTextKey) {
                            await this.restoreToPlainText(provider, secureKey);
                            migratedCount++;
                            results.push(`✓ ${provider.toUpperCase()} key restored to plain text access`);
                        }
                    }
                } catch (error) {
                    debugLog(`Failed to handle status change for ${provider}:`, error);
                    results.push(`✗ ${provider.toUpperCase()} migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            const statusType = encryptionAvailable ? 'Pro' : 'Free';

            // If user became free, ensure all pro features are disabled
            if (!encryptionAvailable) {
                await this.handleFreeUserTransition();
            }

            if (migratedCount > 0) {
                return {
                    success: true,
                    message: `Successfully migrated ${migratedCount} API keys for ${statusType} user`,
                    details: results
                };
            } else {
                return {
                    success: true,
                    message: `No API key migration needed for ${statusType} user`,
                    details: results.length > 0 ? results : [`All API keys are already properly configured for ${statusType} users`]
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            debugLog('Failed to handle user status change:', errorMessage);
            return { success: false, message: `Migration failed: ${errorMessage}` };
        }
    }

    /**
     * Handles encryption toggle - migrates keys between storage types
     */
    public async handleEncryptionToggle(enabled: boolean): Promise<{ success: boolean; message: string; details?: string[] }> {
        if (!this.isSecretStorageAvailable()) {
            return { success: false, message: 'VS Code SecretStorage not available' };
        }

        const isProUser = this.isProUser();
        const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
        const encryptionAvailable = isProUser || devModeEnabled;

        debugLog(`Encryption toggle - isProUser: ${isProUser}, devMode: ${devModeEnabled}, available: ${encryptionAvailable}, enabled: ${enabled}`);

        if (!encryptionAvailable) {
            return { success: false, message: 'Encryption not available for your account level' };
        }

        try {
            const providers = [
                'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
                'together', 'openrouter', 'anthropic', 'minimax', 'deepseek', 'grok', 'groq', 'perplexity', 'zai', 'custom'
            ];

            let migratedCount = 0;
            const results: string[] = [];

            for (const provider of providers) {
                try {
                    const secureKey = await this.context!.secrets.get(`gitmind.${provider}.apiKey`);
                    const plainTextKey = this.getPlainTextApiKey(provider);

                    if (enabled) {
                        // Encryption turned ON: migrate from plain text to secure storage
                        if (plainTextKey && !secureKey) {
                            await this.context!.secrets.store(`gitmind.${provider}.apiKey`, plainTextKey);
                            await this.clearPlainTextApiKey(provider);
                            migratedCount++;
                            results.push(`✓ ${provider.toUpperCase()} key migrated to secure storage`);
                        } else if (plainTextKey && secureKey) {
                            // Both exist, clear plain text and keep secure
                            await this.clearPlainTextApiKey(provider);
                            results.push(`✓ ${provider.toUpperCase()} plain text key cleared (secure version retained)`);
                        } else if (secureKey) {
                            results.push(`✓ ${provider.toUpperCase()} key already in secure storage`);
                        }
                    } else {
                        // Encryption turned OFF: migrate from secure to plain text storage
                        if (secureKey && !plainTextKey) {
                            await this.restoreToPlainText(provider, secureKey);
                            migratedCount++;
                            results.push(`✓ ${provider.toUpperCase()} key restored to plain text access`);
                        } else if (plainTextKey) {
                            results.push(`✓ ${provider.toUpperCase()} key already accessible in plain text`);
                        }
                    }
                } catch (error) {
                    debugLog(`Failed to handle encryption toggle for ${provider}:`, error);
                    results.push(`✗ ${provider.toUpperCase()} migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            const action = enabled ? 'enabled' : 'disabled';
            if (migratedCount > 0) {
                return {
                    success: true,
                    message: `Successfully ${action} encryption and migrated ${migratedCount} API keys`,
                    details: results
                };
            } else {
                return {
                    success: true,
                    message: `Encryption ${action} - no key migration needed`,
                    details: results.length > 0 ? results : [`All API keys are already properly configured for encryption ${action}`]
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            debugLog('Failed to handle encryption toggle:', errorMessage);
            return { success: false, message: `Encryption toggle failed: ${errorMessage}` };
        }
    }

    /**
     * Gets API key from plain text VSCode settings (fallback for non-pro users)
     */
    private getPlainTextApiKey(provider: string): string | undefined {
        const config = vscode.workspace.getConfiguration('gitmind');
        return config.get<string>(`${provider}.apiKey`);
    }

    /**
     * Clears API key from plain text VSCode settings
     */
    private async clearPlainTextApiKey(provider: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('gitmind');
        await config.update(`${provider}.apiKey`, undefined, vscode.ConfigurationTarget.Global);
        debugLog(`Cleared plain text API key for provider: ${provider}`);
    }

    /**
     * Checks if a provider has an API key (either secure or plain text)
     */
    public async hasApiKey(provider: string): Promise<boolean> {
        const apiKey = await this.getApiKey(provider);
        return !!apiKey && apiKey.trim().length > 0;
    }

    /**
     * Lists all providers that have stored API keys
     */
    public async getProvidersWithKeys(): Promise<string[]> {
        const providers = [
            'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
            'together', 'openrouter', 'anthropic', 'minimax', 'deepseek', 'grok', 'groq', 'perplexity', 'zai', 'custom'
        ];

        const providersWithKeys: string[] = [];

        for (const provider of providers) {
            if (await this.hasApiKey(provider)) {
                providersWithKeys.push(provider);
            }
        }

        return providersWithKeys;
    }

    /**
     * Gets encryption status for the UI
     */
    public getEncryptionStatus(): {
        available: boolean;
        enabled: boolean;
        reason: string;
    } {
        const devMode = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
        const isProUser = this.isProUser();
        const secretStorageAvailable = this.isSecretStorageAvailable();
        const config = vscode.workspace.getConfiguration('gitmind');
        const encryptionEnabled = config.get<boolean>('pro.encryptionEnabled', false);

        if (devMode) {
            return {
                available: secretStorageAvailable,
                enabled: secretStorageAvailable && encryptionEnabled,
                reason: encryptionEnabled ? 'Development mode - encryption active' : 'Development mode - encryption available but disabled'
            };
        }

        if (isProUser) {
            if (!secretStorageAvailable) {
                return {
                    available: false,
                    enabled: false,
                    reason: 'Pro user - VS Code SecretStorage unavailable'
                };
            }
            return {
                available: secretStorageAvailable,
                enabled: secretStorageAvailable && encryptionEnabled,
                reason: encryptionEnabled ? 'Pro user - encryption active' : 'Pro user - encryption available but disabled'
            };
        }

        return {
            available: false,
            enabled: false,
            reason: 'Upgrade to GitMind Pro for encrypted API key storage'
        };
    }    /**
     * Gets detailed encryption status for enhanced UI display
     */
    public async getDetailedEncryptionStatus(): Promise<{
        basicStatus: {
            available: boolean;
            enabled: boolean;
            reason: string;
        };
        userType: string;
        vscodeVersion: string;
        totalProviders: number;
        encryptedProviders: string[];
        plainTextProviders: string[];
        providersWithKeys: string[];
    }> {
        const isProUser = this.isProUser();
        const devMode = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
        const vscodeVersion = vscode.version;

        // Get basic encryption status
        const basicStatus = this.getEncryptionStatus();

        const providers = [
            'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
            'together', 'openrouter', 'anthropic', 'deepseek', 'grok', 'groq', 'perplexity', 'custom'
        ];

        const encryptedProviders: string[] = [];
        const plainTextProviders: string[] = [];

        // Check each provider's storage method
        for (const provider of providers) {
            const plainTextKey = this.getPlainTextApiKey(provider);
            let hasSecureKey = false;

            try {
                if (this.context?.secrets) {
                    const secureKey = await this.context.secrets.get(`gitmind.${provider}.apiKey`);
                    hasSecureKey = !!secureKey;
                }
            } catch (error) {
                debugLog(`Error checking secure key for ${provider}:`, error);
            }

            // Determine storage method based on what's available
            if (plainTextKey && plainTextKey !== ENCRYPTED_KEY_PLACEHOLDER) {
                plainTextProviders.push(provider);
            } else if (hasSecureKey) {
                encryptedProviders.push(provider);
            }
        }

        // Combine all providers with keys
        const providersWithKeys = [...encryptedProviders, ...plainTextProviders];

        return {
            basicStatus,
            userType: devMode ? 'developer' : (isProUser ? 'pro' : 'free'),
            vscodeVersion,
            totalProviders: providersWithKeys.length,
            encryptedProviders,
            plainTextProviders,
            providersWithKeys
        };
    }

    /**
     * Restores a key from secure storage back to plain text (for downgraded users)
     */
    private async restoreToPlainText(provider: string, secureKey: string): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('gitmind');
            await config.update(`${provider}.apiKey`, secureKey, vscode.ConfigurationTarget.Global);
            debugLog(`Restored API key to plain text for provider: ${provider}`);
        } catch (error) {
            debugLog(`Failed to restore API key to plain text for ${provider}:`, error);
            throw error;
        }
    }

    /**
     * Handles transition to free mode - disables all pro features
     */
    private async handleFreeUserTransition(): Promise<void> {
        debugLog('Handling transition to free user mode...');

        try {
            const config = vscode.workspace.getConfiguration('gitmind');

            // Check if any pro features were enabled
            const encryptionEnabled = config.get<boolean>('pro.encryptionEnabled', false);
            let hadProFeatures = encryptionEnabled;

            if (encryptionEnabled) {
                debugLog('Disabling encryption for free user...');
                await config.update('pro.encryptionEnabled', false, vscode.ConfigurationTarget.Global);

                // Migrate any encrypted keys back to plain text
                const migrationResult = await this.migrateToPlainText();
                if (migrationResult.success) {
                    debugLog('Successfully migrated encrypted keys to plain text for free user');
                } else {
                    debugLog('Failed to migrate encrypted keys:', migrationResult.message);
                }
            }

            // Disable any other pro features here as they're added
            // Example: 
            // const advancedAnalytics = config.get<boolean>('pro.advancedAnalytics', false);
            // if (advancedAnalytics) {
            //     await config.update('pro.advancedAnalytics', false, vscode.ConfigurationTarget.Global);
            //     hadProFeatures = true;
            // }

            // Notify user if pro features were disabled
            if (hadProFeatures) {
                vscode.window.showInformationMessage(
                    'GitMind: Switched to Free mode. Pro features have been disabled and your API keys are now accessible in standard storage.'
                );
            }

            debugLog('Free user transition completed');
        } catch (error) {
            debugLog('Failed to handle free user transition:', error);
        }
    }

    /**
     * Checks if the user was previously a pro user (has pro features enabled)
     */
    private checkIfWasPreviouslyPro(): boolean {
        try {
            const config = vscode.workspace.getConfiguration('gitmind');

            // Check if encryption was enabled (indicates they were previously pro)
            const encryptionEnabled = config.get<boolean>('pro.encryptionEnabled', false);

            // Add other pro feature checks here as they're added
            // Example: const advancedAnalytics = config.get<boolean>('pro.advancedAnalytics', false);

            return encryptionEnabled; // || advancedAnalytics || other pro features
        } catch (error) {
            debugLog('Failed to check if user was previously pro:', error);
            return false;
        }
    }

    /**
     * Forces a check of user status and handles transitions appropriately
     * This should be called when subscription email changes
     */
    public async checkAndHandleUserStatusTransition(): Promise<void> {
        const isCurrentlyPro = this.isProUser();
        const wasProUser = this.checkIfWasPreviouslyPro();

        debugLog(`User status transition check - isCurrentlyPro: ${isCurrentlyPro}, wasProUser: ${wasProUser}`);

        if (wasProUser && !isCurrentlyPro) {
            debugLog('User transitioned from Pro to Free - handling transition');
            await this.handleFreeUserTransition();
        } else if (!wasProUser && isCurrentlyPro) {
            debugLog('User transitioned from Free to Pro - no special handling needed (features will be enabled on demand)');
        } else {
            debugLog('No user status transition detected');
        }
    }

    /**
     * Forces restoration of all [ENCRYPTED] placeholders back to actual keys
     * This should be called when encryption is disabled
     */
    public async forceRestoreEncryptedPlaceholders(): Promise<{ success: boolean; message: string; details?: string[] }> {
        if (!this.context) {
            return { success: false, message: 'SecureKeyManager not initialized' };
        }

        try {
            const results: string[] = [];
            const config = vscode.workspace.getConfiguration('gitmind');

            const providers = [
                'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
                'together', 'openrouter', 'anthropic', 'minimax', 'deepseek', 'grok', 'groq', 'perplexity', 'zai', 'custom'
            ];

            // Check each provider and restore if it has [ENCRYPTED] placeholder
            for (const provider of providers) {
                const plainTextKey = this.getPlainTextApiKey(provider);

                if (plainTextKey === ENCRYPTED_KEY_PLACEHOLDER) {
                    // Try to get the actual key from secure storage
                    const keyName = `gitmind.${provider}.apiKey`;
                    const actualKey = await this.context.secrets.get(keyName);

                    if (actualKey) {
                        // Restore the actual key to plain text
                        await config.update(`${provider}.apiKey`, actualKey, vscode.ConfigurationTarget.Global);
                        results.push(`✓ ${provider.toUpperCase()} key restored from [ENCRYPTED] placeholder`);
                        debugLog(`Restored ${provider} key from encrypted placeholder`);

                        // Clear cache for this provider
                        this.clearApiKeyCache(provider);
                    } else {
                        results.push(`⚠ ${provider.toUpperCase()} shows [ENCRYPTED] but no secure key found`);
                        debugLog(`Warning: ${provider} has [ENCRYPTED] placeholder but no secure key found`);
                    }
                }
            }

            return {
                success: true,
                message: results.length > 0 ? `Restored ${results.length} keys from [ENCRYPTED] placeholders` : 'No [ENCRYPTED] placeholders found to restore',
                details: results
            };
        } catch (error) {
            debugLog('Error restoring encrypted placeholders:', error);
            return { success: false, message: `Restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }
}