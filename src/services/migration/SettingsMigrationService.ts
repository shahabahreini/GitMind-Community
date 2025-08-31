import * as vscode from 'vscode';
import { debugLog } from '../debug/logger';

/**
 * Service to handle migration and cleanup of legacy extension settings
 */
export class SettingsMigrationService {
    private static instance: SettingsMigrationService;

    public static getInstance(): SettingsMigrationService {
        if (!SettingsMigrationService.instance) {
            SettingsMigrationService.instance = new SettingsMigrationService();
        }
        return SettingsMigrationService.instance;
    }

    /**
     * Perform migration from old aiCommitAssistant settings to new gitmind settings
     * and cleanup old settings to prevent conflicts
     */
    public async migrateAndCleanupSettings(): Promise<void> {
        debugLog("Starting settings migration and cleanup...");

        try {
            const workspaceConfig = vscode.workspace.getConfiguration();
            const hasOldSettings = await this.checkForLegacySettings(workspaceConfig);

            if (!hasOldSettings) {
                debugLog("No legacy aiCommitAssistant settings found, skipping migration");
                return;
            }

            debugLog("Legacy aiCommitAssistant settings detected, performing migration...");

            // Get old configuration
            const oldConfig = vscode.workspace.getConfiguration('aiCommitAssistant');
            const newConfig = vscode.workspace.getConfiguration('gitmind');

            // Migration mapping - only migrate settings that don't already exist in new config
            const migrationMap = await this.createMigrationMapping(oldConfig, newConfig);

            if (migrationMap.length === 0) {
                debugLog("No settings to migrate (all already exist in new configuration), proceeding with cleanup only");
            }

            // Perform the migration
            const migratedCount = await this.performMigration(migrationMap);

            // Perform complete and thorough cleanup of all legacy configuration
            const cleanupResult = await this.performCompleteCleanup();

            debugLog(`Settings migration and cleanup completed successfully. Migrated: ${migratedCount}, Cleaned: ${cleanupResult.totalRemoved}`);

            // Verify migration success
            if (cleanupResult.success) {
                debugLog("Migration verification: All legacy settings successfully removed");
            } else {
                debugLog("Migration verification: Some legacy settings may remain:", cleanupResult.remainingSettings);
            }

            // Only notify user if we actually migrated or cleaned up settings
            if (migratedCount > 0 || cleanupResult.totalRemoved > 0) {
                this.showMigrationNotification(migratedCount, cleanupResult.totalRemoved);
            } else {
                debugLog("No migration or cleanup performed, skipping user notification");
            }

        } catch (error) {
            debugLog("Error during settings migration:", error);
            // Don't throw - migration failure shouldn't break extension activation
        }
    }    /**
     * Check if any legacy aiCommitAssistant settings exist
     */
    private async checkForLegacySettings(_workspaceConfig: vscode.WorkspaceConfiguration): Promise<boolean> {
        debugLog("Checking for legacy aiCommitAssistant settings...");

        const targets = [
            vscode.ConfigurationTarget.Global,
            vscode.ConfigurationTarget.Workspace,
            vscode.ConfigurationTarget.WorkspaceFolder
        ];

        // Get all aiCommitAssistant configuration
        const oldConfig = vscode.workspace.getConfiguration('aiCommitAssistant');

        // Check each target for any aiCommitAssistant settings
        for (const target of targets) {
            try {
                const targetConfig = this.getConfigForTarget('aiCommitAssistant', target);
                if (targetConfig && typeof targetConfig === 'object') {
                    const keys = Object.keys(targetConfig);
                    if (keys.length > 0) {
                        debugLog(`Found ${keys.length} legacy settings in ${vscode.ConfigurationTarget[target]}: ${keys.join(', ')}`);
                        return true;
                    }
                }
            } catch (error) {
                debugLog(`Error checking target ${vscode.ConfigurationTarget[target]}:`, error);
            }
        }

        // Also check by inspecting individual known settings
        const knownSettings = [
            'apiProvider', 'debug', 'showOnboarding',
            'gemini.apiKey', 'gemini.model',
            'huggingface.apiKey', 'huggingface.model',
            'ollama.url', 'ollama.model',
            'mistral.apiKey', 'mistral.model',
            'cohere.apiKey', 'cohere.model',
            'openai.apiKey', 'openai.model',
            'together.apiKey', 'together.model',
            'openrouter.apiKey', 'openrouter.model',
            'anthropic.apiKey', 'anthropic.model',
            'copilot.model',
            'deepseek.apiKey', 'deepseek.model',
            'grok.apiKey', 'grok.model',
            'perplexity.apiKey', 'perplexity.model',
            'commit.verbose',
            'promptCustomization.enabled', 'promptCustomization.saveLastPrompt', 'promptCustomization.lastPrompt',
            'telemetry.enabled', 'telemetry.connectionString', 'showDiagnostics',
            'pro.licenseKey', 'pro.encryptionEnabled', 'pro.orderId', 'pro.validationStatus', 'pro.lastValidation', 'pro.instanceId',
            'subscription.email', 'subscription.plan', 'subscription.status', 'subscription.lastChecked'
        ];

        for (const setting of knownSettings) {
            const inspection = oldConfig.inspect(setting);
            if (inspection?.globalValue !== undefined ||
                inspection?.workspaceValue !== undefined ||
                inspection?.workspaceFolderValue !== undefined) {
                debugLog(`Found legacy setting: aiCommitAssistant.${setting}`);
                return true;
            }
        }

        debugLog("No legacy aiCommitAssistant settings found");
        return false;
    }

    /**
     * Create mapping of settings to migrate
     */
    private async createMigrationMapping(
        oldConfig: vscode.WorkspaceConfiguration,
        newConfig: vscode.WorkspaceConfiguration
    ): Promise<Array<{ key: string; value: any; target: vscode.ConfigurationTarget }>> {
        const migrations: Array<{ key: string; value: any; target: vscode.ConfigurationTarget }> = [];

        // Define settings mapping (old nested key -> new nested key)
        const settingsMap: Record<string, string> = {
            // Main provider setting
            'apiProvider': 'apiProvider',
            'debug': 'debug',
            'showOnboarding': 'showOnboarding',

            // API Keys for each provider
            'gemini.apiKey': 'gemini.apiKey',
            'gemini.model': 'gemini.model',
            'huggingface.apiKey': 'huggingface.apiKey',
            'huggingface.model': 'huggingface.model',
            'ollama.url': 'ollama.url',
            'ollama.model': 'ollama.model',
            'mistral.apiKey': 'mistral.apiKey',
            'mistral.model': 'mistral.model',
            'cohere.apiKey': 'cohere.apiKey',
            'cohere.model': 'cohere.model',
            'openai.apiKey': 'openai.apiKey',
            'openai.model': 'openai.model',
            'together.apiKey': 'together.apiKey',
            'together.model': 'together.model',
            'openrouter.apiKey': 'openrouter.apiKey',
            'openrouter.model': 'openrouter.model',
            'anthropic.apiKey': 'anthropic.apiKey',
            'anthropic.model': 'anthropic.model',
            'copilot.model': 'copilot.model',
            'deepseek.apiKey': 'deepseek.apiKey',
            'deepseek.model': 'deepseek.model',
            'grok.apiKey': 'grok.apiKey',
            'grok.model': 'grok.model',
            'perplexity.apiKey': 'perplexity.apiKey',
            'perplexity.model': 'perplexity.model',

            // Commit settings
            'commit.verbose': 'commit.verbose',

            // Prompt customization
            'promptCustomization.enabled': 'promptCustomization.enabled',
            'promptCustomization.saveLastPrompt': 'promptCustomization.saveLastPrompt',
            'promptCustomization.lastPrompt': 'promptCustomization.lastPrompt',

            // Telemetry
            'telemetry.enabled': 'telemetry.enabled',
            'telemetry.connectionString': 'telemetry.connectionString',
            'showDiagnostics': 'showDiagnostics',

            // Pro features
            'pro.licenseKey': 'pro.licenseKey',
            'pro.encryptionEnabled': 'pro.encryptionEnabled',
            'pro.orderId': 'pro.orderId',
            'pro.validationStatus': 'pro.validationStatus',
            'pro.lastValidation': 'pro.lastValidation',
            'pro.instanceId': 'pro.instanceId',

            // Subscription
            'subscription.email': 'subscription.email',
            'subscription.plan': 'subscription.plan',
            'subscription.status': 'subscription.status',
            'subscription.lastChecked': 'subscription.lastChecked',

            // Environment (legacy)
            'environment.LEMONSQUEEZY_API_KEY': 'environment.LEMONSQUEEZY_API_KEY',
            'environment.LEMONSQUEEZY_STORE_ID': 'environment.LEMONSQUEEZY_STORE_ID'
        };

        // Check each configuration target
        const targets = [
            vscode.ConfigurationTarget.Global,
            vscode.ConfigurationTarget.Workspace,
            vscode.ConfigurationTarget.WorkspaceFolder
        ];

        for (const target of targets) {
            for (const [oldKey, newKey] of Object.entries(settingsMap)) {
                const oldValue = oldConfig.inspect(oldKey);
                const newValue = newConfig.inspect(newKey);

                let valueToMigrate: any = undefined;

                // Determine which value to migrate based on target
                switch (target) {
                    case vscode.ConfigurationTarget.Global:
                        valueToMigrate = oldValue?.globalValue;
                        break;
                    case vscode.ConfigurationTarget.Workspace:
                        valueToMigrate = oldValue?.workspaceValue;
                        break;
                    case vscode.ConfigurationTarget.WorkspaceFolder:
                        valueToMigrate = oldValue?.workspaceFolderValue;
                        break;
                }

                // Only migrate if old value exists and new value doesn't exist at this target
                if (valueToMigrate !== undefined) {
                    let shouldMigrate = false;

                    switch (target) {
                        case vscode.ConfigurationTarget.Global:
                            shouldMigrate = newValue?.globalValue === undefined;
                            break;
                        case vscode.ConfigurationTarget.Workspace:
                            shouldMigrate = newValue?.workspaceValue === undefined;
                            break;
                        case vscode.ConfigurationTarget.WorkspaceFolder:
                            shouldMigrate = newValue?.workspaceFolderValue === undefined;
                            break;
                    }

                    if (shouldMigrate) {
                        migrations.push({
                            key: newKey,
                            value: valueToMigrate,
                            target
                        });
                        debugLog(`Preparing to migrate: ${oldKey} -> ${newKey} (${vscode.ConfigurationTarget[target]})`);
                    }
                }
            }
        }

        return migrations;
    }

    /**
     * Perform the actual migration of settings
     */
    private async performMigration(
        migrations: Array<{ key: string; value: any; target: vscode.ConfigurationTarget }>
    ): Promise<number> {
        const newConfig = vscode.workspace.getConfiguration('gitmind');
        let migratedCount = 0;

        for (const migration of migrations) {
            try {
                await newConfig.update(migration.key, migration.value, migration.target);
                debugLog(`Migrated setting: ${migration.key} to target ${vscode.ConfigurationTarget[migration.target]}`);
                migratedCount++;
            } catch (error) {
                debugLog(`Failed to migrate setting ${migration.key}:`, error);
            }
        }

        return migratedCount;
    }

    /**
     * Remove all legacy aiCommitAssistant settings
     */
    private async cleanupLegacySettings(_workspaceConfig: vscode.WorkspaceConfiguration): Promise<number> {
        debugLog("Cleaning up legacy aiCommitAssistant settings...");

        const targets = [
            vscode.ConfigurationTarget.Global,
            vscode.ConfigurationTarget.Workspace,
            vscode.ConfigurationTarget.WorkspaceFolder
        ];

        const oldConfig = vscode.workspace.getConfiguration('aiCommitAssistant');
        let cleanedUpCount = 0;

        // Known settings that might exist
        const knownSettings = [
            'apiProvider', 'debug', 'showOnboarding',
            'gemini.apiKey', 'gemini.model',
            'huggingface.apiKey', 'huggingface.model',
            'ollama.url', 'ollama.model',
            'mistral.apiKey', 'mistral.model',
            'cohere.apiKey', 'cohere.model',
            'openai.apiKey', 'openai.model',
            'together.apiKey', 'together.model',
            'openrouter.apiKey', 'openrouter.model',
            'anthropic.apiKey', 'anthropic.model',
            'copilot.model',
            'deepseek.apiKey', 'deepseek.model',
            'grok.apiKey', 'grok.model',
            'perplexity.apiKey', 'perplexity.model',
            'commit.verbose',
            'promptCustomization.enabled', 'promptCustomization.saveLastPrompt', 'promptCustomization.lastPrompt',
            'telemetry.enabled', 'telemetry.connectionString', 'showDiagnostics',
            'pro.licenseKey', 'pro.encryptionEnabled', 'pro.orderId', 'pro.validationStatus', 'pro.lastValidation', 'pro.instanceId',
            'subscription.email', 'subscription.plan', 'subscription.status', 'subscription.lastChecked',
            'environment.LEMONSQUEEZY_API_KEY', 'environment.LEMONSQUEEZY_STORE_ID'
        ];

        // Also dynamically discover any other settings
        const allKeys = new Set<string>(knownSettings);

        // Collect all possible keys from all targets
        for (const target of targets) {
            try {
                const targetConfig = this.getConfigForTarget('aiCommitAssistant', target);
                if (targetConfig && typeof targetConfig === 'object') {
                    Object.keys(targetConfig).forEach(key => allKeys.add(key));
                }
            } catch (error) {
                debugLog(`Error collecting keys for target ${vscode.ConfigurationTarget[target]}:`, error);
            }
        }

        debugLog(`Found ${allKeys.size} potential legacy settings to check: ${Array.from(allKeys).join(', ')}`);

        // Remove settings from each target
        for (const target of targets) {
            for (const key of allKeys) {
                try {
                    const inspection = oldConfig.inspect(key);
                    let hasValueAtTarget = false;

                    switch (target) {
                        case vscode.ConfigurationTarget.Global:
                            hasValueAtTarget = inspection?.globalValue !== undefined;
                            break;
                        case vscode.ConfigurationTarget.Workspace:
                            hasValueAtTarget = inspection?.workspaceValue !== undefined;
                            break;
                        case vscode.ConfigurationTarget.WorkspaceFolder:
                            hasValueAtTarget = inspection?.workspaceFolderValue !== undefined;
                            break;
                    }

                    if (hasValueAtTarget) {
                        await oldConfig.update(key, undefined, target);
                        debugLog(`Removed legacy setting: aiCommitAssistant.${key} from ${vscode.ConfigurationTarget[target]}`);
                        cleanedUpCount++;
                    }
                } catch (error) {
                    debugLog(`Failed to remove legacy setting ${key}:`, error);
                }
            }
        }

        debugLog(`Cleanup completed. Removed ${cleanedUpCount} legacy settings.`);
        return cleanedUpCount;
    }

    /**
     * Perform aggressive cleanup by removing the entire aiCommitAssistant configuration section
     */
    private async performAggressiveCleanup(): Promise<number> {
        debugLog("Performing aggressive cleanup of aiCommitAssistant configuration...");

        const targets = [
            vscode.ConfigurationTarget.Global,
            vscode.ConfigurationTarget.Workspace,
            vscode.ConfigurationTarget.WorkspaceFolder
        ];

        let totalRemoved = 0;

        for (const target of targets) {
            try {
                // Get the configuration for this target
                const config = vscode.workspace.getConfiguration();

                // Get the current settings for this target
                let targetSettings: any = {};
                const inspection = config.inspect('');

                switch (target) {
                    case vscode.ConfigurationTarget.Global:
                        targetSettings = inspection?.globalValue || {};
                        break;
                    case vscode.ConfigurationTarget.Workspace:
                        targetSettings = inspection?.workspaceValue || {};
                        break;
                    case vscode.ConfigurationTarget.WorkspaceFolder:
                        targetSettings = inspection?.workspaceFolderValue || {};
                        break;
                }

                // Check if aiCommitAssistant exists in the settings
                if (targetSettings && targetSettings.aiCommitAssistant) {
                    const settingsCount = Object.keys(targetSettings.aiCommitAssistant).length;

                    // Remove the entire aiCommitAssistant section
                    await config.update('aiCommitAssistant', undefined, target);
                    debugLog(`Removed entire aiCommitAssistant section with ${settingsCount} settings from ${vscode.ConfigurationTarget[target]}`);
                    totalRemoved += settingsCount;
                }
            } catch (error) {
                debugLog(`Failed to perform aggressive cleanup for target ${vscode.ConfigurationTarget[target]}:`, error);
            }
        }

        return totalRemoved;
    }

    /**
     * Remove the entire aiCommitAssistant workspace configuration
     * This is the most aggressive cleanup that removes the workspace entirely
     */
    private async removeEntireWorkspaceConfiguration(): Promise<number> {
        debugLog("Removing entire aiCommitAssistant workspace configuration...");

        const targets = [
            vscode.ConfigurationTarget.Global,
            vscode.ConfigurationTarget.Workspace,
            vscode.ConfigurationTarget.WorkspaceFolder
        ];

        let totalRemoved = 0;

        for (const target of targets) {
            try {
                const config = vscode.workspace.getConfiguration();

                // Check if the aiCommitAssistant workspace exists
                const inspection = config.inspect('aiCommitAssistant');
                let hasConfigAtTarget = false;
                let settingsCount = 0;

                switch (target) {
                    case vscode.ConfigurationTarget.Global:
                        if (inspection?.globalValue) {
                            hasConfigAtTarget = true;
                            settingsCount = typeof inspection.globalValue === 'object'
                                ? Object.keys(inspection.globalValue).length
                                : 1;
                        }
                        break;
                    case vscode.ConfigurationTarget.Workspace:
                        if (inspection?.workspaceValue) {
                            hasConfigAtTarget = true;
                            settingsCount = typeof inspection.workspaceValue === 'object'
                                ? Object.keys(inspection.workspaceValue).length
                                : 1;
                        }
                        break;
                    case vscode.ConfigurationTarget.WorkspaceFolder:
                        if (inspection?.workspaceFolderValue) {
                            hasConfigAtTarget = true;
                            settingsCount = typeof inspection.workspaceFolderValue === 'object'
                                ? Object.keys(inspection.workspaceFolderValue).length
                                : 1;
                        }
                        break;
                }

                if (hasConfigAtTarget) {
                    // Remove the entire aiCommitAssistant workspace configuration
                    await config.update('aiCommitAssistant', undefined, target);
                    debugLog(`Completely removed aiCommitAssistant workspace configuration with ${settingsCount} settings from ${vscode.ConfigurationTarget[target]}`);
                    totalRemoved += settingsCount;

                    // Also try to remove any potential remaining fragments
                    try {
                        const oldConfig = vscode.workspace.getConfiguration('aiCommitAssistant');
                        const remainingInspection = oldConfig.inspect('');

                        // If there are still fragments, try to clear them individually
                        if (remainingInspection) {
                            switch (target) {
                                case vscode.ConfigurationTarget.Global:
                                    if (remainingInspection.globalValue) {
                                        await oldConfig.update('', undefined, target);
                                    }
                                    break;
                                case vscode.ConfigurationTarget.Workspace:
                                    if (remainingInspection.workspaceValue) {
                                        await oldConfig.update('', undefined, target);
                                    }
                                    break;
                                case vscode.ConfigurationTarget.WorkspaceFolder:
                                    if (remainingInspection.workspaceFolderValue) {
                                        await oldConfig.update('', undefined, target);
                                    }
                                    break;
                            }
                        }
                    } catch (fragmentError) {
                        debugLog(`Warning: Could not clear potential configuration fragments for ${vscode.ConfigurationTarget[target]}:`, fragmentError);
                    }
                }
            } catch (error) {
                debugLog(`Failed to remove aiCommitAssistant workspace configuration for target ${vscode.ConfigurationTarget[target]}:`, error);
            }
        }

        if (totalRemoved > 0) {
            debugLog(`Successfully removed entire aiCommitAssistant workspace configuration (${totalRemoved} settings total)`);
        } else {
            debugLog("No aiCommitAssistant workspace configuration found to remove");
        }

        return totalRemoved;
    }

    /**
     * Perform complete and thorough cleanup - combines all cleanup methods
     * This is the most aggressive approach to ensure all legacy configuration is removed
     */
    public async performCompleteCleanup(): Promise<{ totalRemoved: number; success: boolean; remainingSettings: string[] }> {
        debugLog("Performing complete cleanup of all aiCommitAssistant configuration...");

        try {
            const workspaceConfig = vscode.workspace.getConfiguration();

            // Run all cleanup methods in sequence
            const cleanedUpCount = await this.cleanupLegacySettings(workspaceConfig);
            const aggressiveCleanedCount = await this.performAggressiveCleanup();
            const workspaceCleanedCount = await this.removeEntireWorkspaceConfiguration();

            // Additional cleanup: try to remove any configuration fragments
            let fragmentsRemoved = 0;
            try {
                // Attempt to clear the entire aiCommitAssistant configuration space
                const config = vscode.workspace.getConfiguration();
                const targets = [
                    vscode.ConfigurationTarget.Global,
                    vscode.ConfigurationTarget.Workspace,
                    vscode.ConfigurationTarget.WorkspaceFolder
                ];

                for (const target of targets) {
                    try {
                        // Force clear any remaining aiCommitAssistant configuration
                        await config.update('aiCommitAssistant', undefined, target);

                        // Also try with explicit empty object to ensure complete removal
                        await config.update('aiCommitAssistant', {}, target);
                        await config.update('aiCommitAssistant', undefined, target);

                        fragmentsRemoved++;
                        debugLog(`Force-cleared aiCommitAssistant configuration fragments from ${vscode.ConfigurationTarget[target]}`);
                    } catch (error) {
                        // Ignore individual failures as they may indicate nothing to remove
                    }
                }
            } catch (error) {
                debugLog("Fragment cleanup failed:", error);
            }

            const totalRemoved = cleanedUpCount + aggressiveCleanedCount + workspaceCleanedCount + fragmentsRemoved;

            // Verify complete removal
            const verificationResult = await this.verifyMigrationSuccess();

            debugLog(`Complete cleanup finished. Total items removed: ${totalRemoved}, Success: ${verificationResult.success}`);

            return {
                totalRemoved,
                success: verificationResult.success,
                remainingSettings: verificationResult.legacySettingsFound
            };
        } catch (error) {
            debugLog("Error during complete cleanup:", error);
            return {
                totalRemoved: 0,
                success: false,
                remainingSettings: [`Error during cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`]
            };
        }
    }

    /**
     * Helper to get configuration for a specific target
     */
    private getConfigForTarget(section: string, target: vscode.ConfigurationTarget): any {
        const config = vscode.workspace.getConfiguration(section);
        const inspection = config.inspect('');

        switch (target) {
            case vscode.ConfigurationTarget.Global:
                return inspection?.globalValue;
            case vscode.ConfigurationTarget.Workspace:
                return inspection?.workspaceValue;
            case vscode.ConfigurationTarget.WorkspaceFolder:
                return inspection?.workspaceFolderValue;
            default:
                return undefined;
        }
    }

    /**
     * Show notification to user about migration
     */
    private showMigrationNotification(migratedCount: number, cleanedUpCount: number): void {
        let message = 'GitMind: ';

        if (migratedCount > 0 && cleanedUpCount > 0) {
            message += `Successfully migrated ${migratedCount} setting${migratedCount !== 1 ? 's' : ''} and cleaned up ${cleanedUpCount} legacy setting${cleanedUpCount !== 1 ? 's' : ''} from the previous version.`;
        } else if (migratedCount > 0) {
            message += `Successfully migrated ${migratedCount} setting${migratedCount !== 1 ? 's' : ''} from the previous version.`;
        } else if (cleanedUpCount > 0) {
            message += `Successfully cleaned up ${cleanedUpCount} legacy setting${cleanedUpCount !== 1 ? 's' : ''} from the previous version.`;
        }

        vscode.window.showInformationMessage(message, 'OK');
    }

    /**
     * Force cleanup of legacy settings (for manual cleanup)
     */    public async forceCleanupLegacySettings(): Promise<void> {
        debugLog("Force cleaning up legacy aiCommitAssistant settings...");

        try {
            // Use the comprehensive cleanup method
            const cleanupResult = await this.performCompleteCleanup();

            if (cleanupResult.success) {
                if (cleanupResult.totalRemoved > 0) {
                    vscode.window.showInformationMessage(
                        `GitMind: Successfully cleaned up ${cleanupResult.totalRemoved} legacy setting${cleanupResult.totalRemoved !== 1 ? 's' : ''} and completely removed all aiCommitAssistant configuration.`,
                        'OK'
                    );
                } else {
                    vscode.window.showInformationMessage(
                        'GitMind: No legacy settings found to clean up. All configurations are up to date.',
                        'OK'
                    );
                }
            } else {
                vscode.window.showWarningMessage(
                    `GitMind: Cleanup completed with ${cleanupResult.totalRemoved} items removed, but ${cleanupResult.remainingSettings.length} legacy items may still remain. Check the output panel for details.`,
                    'Show Details',
                    'OK'
                ).then(result => {
                    if (result === 'Show Details') {
                        debugLog("Remaining legacy settings after cleanup:", cleanupResult.remainingSettings);
                        vscode.window.showInformationMessage(
                            `Remaining legacy items: ${cleanupResult.remainingSettings.join(', ')}`,
                            'OK'
                        );
                    }
                });
            }
        } catch (error) {
            debugLog("Error during force cleanup:", error);
            vscode.window.showErrorMessage(
                'GitMind: Failed to clean up legacy settings. Please check the output panel for details.'
            );
        }
    }

    /**
     * Verify that migration was successful by checking if any legacy settings remain
     */
    public async verifyMigrationSuccess(): Promise<{ success: boolean; legacySettingsFound: string[] }> {
        debugLog("Verifying migration success...");

        const legacySettingsFound: string[] = [];
        const workspaceConfig = vscode.workspace.getConfiguration();
        const oldConfig = vscode.workspace.getConfiguration('aiCommitAssistant');

        // Check for any remaining legacy settings
        const targets = [
            vscode.ConfigurationTarget.Global,
            vscode.ConfigurationTarget.Workspace,
            vscode.ConfigurationTarget.WorkspaceFolder
        ];

        for (const target of targets) {
            try {
                const targetConfig = this.getConfigForTarget('aiCommitAssistant', target);
                if (targetConfig && typeof targetConfig === 'object') {
                    const keys = Object.keys(targetConfig);
                    if (keys.length > 0) {
                        legacySettingsFound.push(...keys.map(key => `aiCommitAssistant.${key} (${vscode.ConfigurationTarget[target]})`));
                    }
                }

                // Additional check: see if the aiCommitAssistant workspace itself exists
                const config = vscode.workspace.getConfiguration();
                const inspection = config.inspect('aiCommitAssistant');

                switch (target) {
                    case vscode.ConfigurationTarget.Global:
                        if (inspection?.globalValue !== undefined) {
                            legacySettingsFound.push(`aiCommitAssistant workspace exists (${vscode.ConfigurationTarget[target]})`);
                        }
                        break;
                    case vscode.ConfigurationTarget.Workspace:
                        if (inspection?.workspaceValue !== undefined) {
                            legacySettingsFound.push(`aiCommitAssistant workspace exists (${vscode.ConfigurationTarget[target]})`);
                        }
                        break;
                    case vscode.ConfigurationTarget.WorkspaceFolder:
                        if (inspection?.workspaceFolderValue !== undefined) {
                            legacySettingsFound.push(`aiCommitAssistant workspace exists (${vscode.ConfigurationTarget[target]})`);
                        }
                        break;
                }
            } catch (error) {
                debugLog(`Error checking target ${vscode.ConfigurationTarget[target]}:`, error);
            }
        }

        // Also check if any individual settings are still accessible
        const knownSettings = [
            'apiProvider', 'debug', 'showOnboarding',
            'gemini.apiKey', 'gemini.model',
            'huggingface.apiKey', 'huggingface.model',
            'ollama.url', 'ollama.model',
            'mistral.apiKey', 'mistral.model',
            'cohere.apiKey', 'cohere.model',
            'openai.apiKey', 'openai.model',
            'together.apiKey', 'together.model',
            'openrouter.apiKey', 'openrouter.model',
            'anthropic.apiKey', 'anthropic.model',
            'copilot.model',
            'deepseek.apiKey', 'deepseek.model',
            'grok.apiKey', 'grok.model',
            'perplexity.apiKey', 'perplexity.model',
            'commit.verbose',
            'promptCustomization.enabled', 'promptCustomization.saveLastPrompt', 'promptCustomization.lastPrompt',
            'telemetry.enabled', 'telemetry.connectionString', 'showDiagnostics',
            'pro.licenseKey', 'pro.encryptionEnabled', 'pro.orderId', 'pro.validationStatus', 'pro.lastValidation', 'pro.instanceId',
            'subscription.email', 'subscription.plan', 'subscription.status', 'subscription.lastChecked'
        ];

        for (const setting of knownSettings) {
            try {
                const inspection = oldConfig.inspect(setting);
                if (inspection?.globalValue !== undefined ||
                    inspection?.workspaceValue !== undefined ||
                    inspection?.workspaceFolderValue !== undefined) {
                    legacySettingsFound.push(`aiCommitAssistant.${setting} (individual setting)`);
                }
            } catch (error) {
                // Ignore inspection errors as they may indicate the setting doesn't exist
            }
        }

        // Remove duplicates
        const uniqueLegacySettings = [...new Set(legacySettingsFound)];

        const success = uniqueLegacySettings.length === 0;
        debugLog(`Migration verification result: ${success ? 'SUCCESS' : 'FAILURE'}`);
        if (!success) {
            debugLog('Legacy settings still found:', uniqueLegacySettings);
        }

        return { success, legacySettingsFound: uniqueLegacySettings };
    }
}
