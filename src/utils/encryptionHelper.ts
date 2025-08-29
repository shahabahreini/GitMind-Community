import * as vscode from 'vscode';
import { debugLog } from '../services/debug/logger';

// Placeholder text to display in settings when a key is encrypted
const ENCRYPTED_KEY_PLACEHOLDER = "[ENCRYPTED]";

/**
 * Utility functions for handling encryption settings and license key security
 */
export class EncryptionHelper {

    /**
     * Stores a license key securely using VS Code's SecretStorage
     */
    public static async storeLicenseKey(context: vscode.ExtensionContext, licenseKey: string): Promise<void> {
        if (!context.secrets) {
            // Fallback to plain text for older VS Code versions
            const config = vscode.workspace.getConfiguration('gitmind');
            await config.update('pro.licenseKey', licenseKey, vscode.ConfigurationTarget.Global);
            return;
        }

        try {
            // Always store license key securely if secret storage is available
            await context.secrets.store('gitmind.pro.licenseKey', licenseKey);
            debugLog('License key stored securely');

            // Clear plain text license key and replace with placeholder
            const config = vscode.workspace.getConfiguration('gitmind');
            await config.update('pro.licenseKey', ENCRYPTED_KEY_PLACEHOLDER, vscode.ConfigurationTarget.Global);
            debugLog('Plain text license key replaced with placeholder');

        } catch (error) {
            debugLog('Failed to store license key securely:', error);
            throw new Error(`Failed to store license key securely: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Retrieves the license key securely from VS Code's SecretStorage
     */
    public static async getLicenseKey(context: vscode.ExtensionContext): Promise<string | undefined> {
        if (!context.secrets) {
            // Fallback to plain text for older VS Code versions
            const config = vscode.workspace.getConfiguration('gitmind');
            return config.get<string>('pro.licenseKey');
        }

        try {
            // Try to get from secure storage first
            const secureKey = await context.secrets.get('gitmind.pro.licenseKey');
            if (secureKey) {
                debugLog('License key retrieved from secure storage');
                return secureKey;
            }

            // Check if there's a plain text key that needs migration
            const config = vscode.workspace.getConfiguration('gitmind');
            const plainTextKey = config.get<string>('pro.licenseKey');

            if (plainTextKey && plainTextKey !== ENCRYPTED_KEY_PLACEHOLDER) {
                // Migrate to secure storage
                debugLog('Migrating plain text license key to secure storage');
                await EncryptionHelper.storeLicenseKey(context, plainTextKey);
                return plainTextKey;
            }

            return undefined;
        } catch (error) {
            debugLog('Failed to retrieve license key:', error);

            // Fallback to plain text as last resort
            const config = vscode.workspace.getConfiguration('gitmind');
            const fallback = config.get<string>('pro.licenseKey');
            return fallback === ENCRYPTED_KEY_PLACEHOLDER ? undefined : fallback;
        }
    }

    /**
     * Handles encryption toggle - migrates keys when encryption is enabled/disabled
     */
    public static async handleEncryptionToggle(context: vscode.ExtensionContext, enabled: boolean): Promise<{ success: boolean; message: string; details?: string[] }> {
        const config = vscode.workspace.getConfiguration('gitmind');
        const wasEnabled = config.get<boolean>('pro.encryptionEnabled', false);

        // If state hasn't changed, no action needed
        if (enabled === wasEnabled) {
            return { success: true, message: `Encryption already ${enabled ? 'enabled' : 'disabled'}` };
        }

        try {
            if (enabled) {
                // Enabling encryption - migrate plain text keys to secure storage
                return await EncryptionHelper.migrateKeysToSecureStorage(context);
            } else {
                // Disabling encryption - migrate secure keys back to plain text
                return await EncryptionHelper.migrateKeysToPlainText(context);
            }
        } catch (error) {
            debugLog('Error handling encryption toggle:', error);
            return { success: false, message: `Failed to toggle encryption: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    /**
     * Migrates API keys from plain text to secure storage (for enabling encryption)
     */
    private static async migrateKeysToSecureStorage(context: vscode.ExtensionContext): Promise<{ success: boolean; message: string; details?: string[] }> {
        if (!context.secrets) {
            return { success: false, message: 'Secure storage not available in this VS Code version' };
        }

        try {
            const results: string[] = [];
            const config = vscode.workspace.getConfiguration('gitmind');

            const providers = [
                'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
                'together', 'openrouter', 'anthropic', 'deepseek', 'grok', 'perplexity'
            ];

            // Migrate API keys to secure storage
            for (const provider of providers) {
                const plainTextKey = config.get<string>(`${provider}.apiKey`);

                if (plainTextKey && plainTextKey !== ENCRYPTED_KEY_PLACEHOLDER && plainTextKey.trim().length > 0) {
                    // Store in secure storage
                    const keyName = `gitmind.${provider}.apiKey`;
                    await context.secrets.store(keyName, plainTextKey);

                    // Replace plain text with placeholder
                    await config.update(`${provider}.apiKey`, ENCRYPTED_KEY_PLACEHOLDER, vscode.ConfigurationTarget.Global);

                    results.push(`✓ ${provider.toUpperCase()} key migrated to secure storage`);
                    debugLog(`Migrated ${provider} key to secure storage`);
                }
            }

            // Enable encryption
            await config.update('pro.encryptionEnabled', true, vscode.ConfigurationTarget.Global);

            return {
                success: true,
                message: results.length > 0 ? 'API keys successfully migrated to secure storage and encryption enabled' : 'Encryption enabled - no plain text keys found to migrate',
                details: results
            };
        } catch (error) {
            debugLog('Error migrating to secure storage:', error);
            return { success: false, message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    /**
     * Migrates API keys from secure storage back to plain text (for disabling encryption)
     */
    private static async migrateKeysToPlainText(context: vscode.ExtensionContext): Promise<{ success: boolean; message: string; details?: string[] }> {
        if (!context.secrets) {
            return { success: false, message: 'Secure storage not available in this VS Code version' };
        }

        try {
            const results: string[] = [];
            const config = vscode.workspace.getConfiguration('gitmind');

            const providers = [
                'gemini', 'huggingface', 'mistral', 'cohere', 'openai',
                'together', 'openrouter', 'anthropic', 'deepseek', 'grok', 'perplexity'
            ];

            // Get all encrypted keys and move them back to plain text
            for (const provider of providers) {
                const keyName = `gitmind.${provider}.apiKey`;
                const encryptedKey = await context.secrets.get(keyName);

                if (encryptedKey) {
                    // Move to plain text storage
                    await config.update(`${provider}.apiKey`, encryptedKey, vscode.ConfigurationTarget.Global);
                    results.push(`✓ ${provider.toUpperCase()} key restored to plain text access`);
                    debugLog(`Migrated ${provider} key back to plain text storage`);
                }
            }

            // Also force restore any [ENCRYPTED] placeholders using SecureKeyManager
            try {
                const secureManager = await EncryptionHelper.getSecureKeyManager();
                if (secureManager) {
                    const restoreResult = await secureManager.forceRestoreEncryptedPlaceholders();
                    if (restoreResult.success && restoreResult.details && restoreResult.details.length > 0) {
                        results.push(...restoreResult.details);
                    }
                }
            } catch (error) {
                debugLog('Error during force restore of placeholders:', error);
                // Don't fail the entire migration for this
            }

            // Disable encryption
            await config.update('pro.encryptionEnabled', false, vscode.ConfigurationTarget.Global);

            return {
                success: true,
                message: results.length > 0 ? 'API keys successfully moved to plain text storage and encryption disabled' : 'Encryption disabled - no encrypted keys found to migrate',
                details: results
            };
        } catch (error) {
            debugLog('Error migrating to plain text:', error);
            return { success: false, message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    /**
     * Clears the license key from both secure storage and configuration
     */
    public static async clearLicenseKey(context: vscode.ExtensionContext): Promise<void> {
        try {
            // Clear from secure storage if available
            if (context.secrets) {
                await context.secrets.delete('gitmind.pro.licenseKey');
                debugLog('License key cleared from secure storage');
            }

            // Clear from configuration
            const config = vscode.workspace.getConfiguration('gitmind');
            await config.update('pro.licenseKey', '', vscode.ConfigurationTarget.Global);
            debugLog('License key cleared from configuration');

        } catch (error) {
            debugLog('Failed to clear license key:', error);
            throw new Error(`Failed to clear license key: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get the SecureKeyManager instance
     */
    private static async getSecureKeyManager(): Promise<any> {
        const { SecureKeyManager } = await import('../services/encryption/SecureKeyManager.js');
        return SecureKeyManager.getInstance();
    }
}
