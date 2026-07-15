import * as vscode from 'vscode';
import { GitMindLicenseService } from './GitMindLicenseService';
import { debugLog } from '../debug/logger';
import {
    isProUser,
    isLegacyProUser,
    needsLicenseValidation,
    getLicenseKey,
    getInstanceId,
    updateProConfig,
    updateSubscriptionConfig
} from '../../utils/proHelpers';
import { LegacyEntitlementService } from './LegacyEntitlementService';

export interface ProActivationResult {
    success: boolean;
    message: string;
    details?: any;
    apiResponse?: any; // For API responses like deactivation
}

export interface LicenseActivationResponse {
    activated: boolean;
    error: string | null;
    license_key: {
        id: number;
        status: string;
        key: string;
        activation_limit: number;
        activation_usage: number;
        created_at: string;
        expires_at: string | null;
        test_mode: boolean;
    };
    instance: {
        id: string;
        name: string;
        created_at: string;
    };
    meta: {
        store_id: number;
        order_id: number;
        order_item_id: number;
        variant_id: number;
        variant_name: string;
        product_id: number;
        product_name: string;
        customer_id: number;
        customer_name: string;
        customer_email: string;
    };
}

export interface LicenseDeactivationResponse {
    deactivated: boolean;
    error: string | null;
    license_key: {
        id: number;
        status: string;
        key: string;
        activation_limit: number;
        activation_usage: number;
        created_at: string;
        expires_at: string | null;
    };
    meta: {
        store_id: number;
        order_id: number;
        order_item_id: number;
        product_id: number;
        product_name: string;
        variant_id: number;
        variant_name: string;
        customer_id: number;
        customer_name: string;
        customer_email: string;
    };
}

export class ProActivationService {
    private static instance: ProActivationService;
    private readonly licenseService: GitMindLicenseService;
    private validationInProgress = false;
    private deactivationNoticeShown = false;

    private constructor() {
        this.licenseService = GitMindLicenseService.getInstance();
    }

    /**
     * The license key, wherever it currently lives.
     *
     * SecretStorage is the real home. The plain setting is only consulted for users who
     * upgraded from a build that wrote it there, and the `[ENCRYPTED]` sentinel it may
     * contain is a placeholder, not a key.
     */
    private async resolveLicenseKey(): Promise<string | undefined> {
        try {
            const { state } = await import('../../extension.js');
            const context = (state as { context?: vscode.ExtensionContext })?.context;
            if (context) {
                const { getSecureLicenseKey } = await import('../../utils/proHelpers.js');
                const secureKey = await getSecureLicenseKey(context);
                if (secureKey && secureKey !== '[ENCRYPTED]') {
                    return secureKey;
                }
            }
        } catch (error) {
            debugLog('Could not read the license key from secret storage:', error);
        }

        const settingKey = getLicenseKey();
        return settingKey && settingKey !== '[ENCRYPTED]' ? settingKey : undefined;
    }

    public static getInstance(): ProActivationService {
        if (!ProActivationService.instance) {
            ProActivationService.instance = new ProActivationService();
        }
        return ProActivationService.instance;
    }

    /**
     * Activate pro features using a license key
     */
    public async activateWithLicenseKey(licenseKey: string): Promise<ProActivationResult> {
        debugLog(`Attempting to activate with license key: ${licenseKey.substring(0, 8)}...`);

        if (!licenseKey || licenseKey.trim() === '') {
            return {
                success: false,
                message: 'License key is required. Please enter a valid license key to continue.'
            };
        }

        // Clean up the license key (remove any whitespace)
        const cleanLicenseKey = licenseKey.trim();

        try {
            // Activate the license key with Lemon Squeezy
            const activation = await this.activateLicenseWithAPI(cleanLicenseKey); if (activation.activated && !activation.error) {
                debugLog(`Storing instance ID from activation: ${activation.instance.id}`);

                // Update pro configuration with activation data
                await updateProConfig({
                    licenseKey: cleanLicenseKey,
                    lastValidation: new Date().toISOString(),
                    validationStatus: 'valid',
                    instanceId: activation.instance.id
                });

                debugLog('Pro configuration updated with instance ID');

                // Verify that the instance ID was stored correctly
                const verifyInstanceId = getInstanceId();
                if (verifyInstanceId === activation.instance.id) {
                    debugLog('Instance ID verification successful');
                } else {
                    debugLog(`Instance ID verification failed. Expected: ${activation.instance.id}, Got: ${verifyInstanceId}`);
                    // Try to update again
                    debugLog('Attempting to store instance ID again');
                    await updateProConfig({
                        instanceId: activation.instance.id
                    });
                }

                // Update subscription configuration with customer info. Only overwrite
                // the stored email when the server actually returned one — a blank
                // response must not erase the address the panel shows.
                await updateSubscriptionConfig({
                    ...(activation.meta.customer_email ? { email: activation.meta.customer_email } : {}),
                    plan: 'pro',
                    status: 'active',
                    lastChecked: new Date().toISOString()
                });

                // The migration is complete for this user: they now hold a real key that a
                // live server can vouch for, so the grandfathered entitlement has done its job
                // and the "claim your free key" notice must never appear again.
                await LegacyEntitlementService.getInstance().markMigrated();

                debugLog('Pro activation successful');

                // Apply the entitlement change to all live extension surfaces before
                // reporting success. A customer must never need to close and reopen
                // the GitMind settings view just because their license state changed.
                await this.refreshEntitlementUi();

                // Show success notification
                vscode.window.showInformationMessage(
                    'GitMind Pro activated successfully! Pro features are now available.',
                    'Open Settings'
                ).then(selection => {
                    if (selection === 'Open Settings') {
                        vscode.commands.executeCommand('gitmind.openSettings');
                    }
                });

                return {
                    success: true,
                    message: this.formatSuccessMessage(
                        activation.meta.customer_email,
                        activation.meta.product_name,
                        activation.license_key.activation_usage,
                        activation.license_key.activation_limit
                    ),
                    details: {
                        customerName: activation.meta.customer_name,
                        customerEmail: activation.meta.customer_email,
                        productName: activation.meta.product_name,
                        variantName: activation.meta.variant_name,
                        activationLimit: activation.license_key.activation_limit,
                        activationUsage: activation.license_key.activation_usage,
                        activationsRemaining: activation.license_key.activation_limit - activation.license_key.activation_usage,
                        expiresAt: activation.license_key.expires_at ? new Date(activation.license_key.expires_at) : null,
                        testMode: activation.license_key.test_mode,
                        instanceId: activation.instance.id
                    }
                };
            } else {
                // Handle activation failure
                await updateProConfig({
                    licenseKey: cleanLicenseKey,
                    lastValidation: new Date().toISOString(),
                    validationStatus: 'invalid'
                });

                const errorMessage = activation.error || 'License activation failed';

                return {
                    success: false,
                    message: this.formatErrorMessage(errorMessage),
                    details: activation
                };
            }
        } catch (error) {
            debugLog('License activation error:', error);

            await updateProConfig({
                licenseKey: cleanLicenseKey,
                lastValidation: new Date().toISOString(),
                validationStatus: 'error'
            });

            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

            return {
                success: false,
                message: this.formatErrorMessage(errorMessage),
                details: { error }
            };
        }
    }

    /**
     * Activates this machine against the GitMind licensing server.
     *
     * The server is idempotent about it: re-activating a machine that is already active is a
     * heartbeat, not an error, and it does not consume a second device slot. So there is
     * nothing to "clean up" first — the old implementation deactivated the previous instance
     * before activating, and could burn an activation in the process.
     */
    private async activateLicenseWithAPI(licenseKey: string): Promise<LicenseActivationResponse> {
        debugLog(`Activating license ${licenseKey.substring(0, 5)}… on machine ${this.licenseService.getMachineId()}`);

        const result = await this.licenseService.activate(licenseKey);

        // Reshaped into the response the rest of this class already expects, so the calling
        // code did not have to change when the provider did.
        return {
            activated: result.isValid,
            error: result.isValid ? null : (result.error ?? 'Activation failed'),
            license_key: {
                id: 0,
                status: result.status,
                key: licenseKey,
                activation_limit: result.activationsLimit ?? 0,
                activation_usage: result.activationsCount ?? 0,
                created_at: new Date().toISOString(),
                expires_at: null,
                test_mode: false
            },
            instance: {
                id: this.licenseService.getMachineId(),
                name: 'vscode-extension',
                created_at: new Date().toISOString()
            },
            meta: {
                store_id: 0,
                order_id: 0,
                order_item_id: 0,
                variant_id: 0,
                variant_name: '',
                product_id: 0,
                product_name: result.productName ?? 'GitMind Pro',
                customer_id: 0,
                customer_name: '',
                customer_email: result.customerEmail ?? ''
            }
        } as LicenseActivationResponse;
    }

    /**
     * Validate existing license (periodic check)
     */
    public async validateExistingLicense(): Promise<boolean> {
        // Grandfathered Lemon Squeezy customers are never validated against the network. The
        // store is suspended, so the API can only answer "invalid" — which would say nothing
        // about whether they paid, and everything about a provider that no longer exists.
        if (isLegacyProUser()) {
            debugLog('Skipping validation for a grandfathered Lemon Squeezy license');
            return true;
        }

        if (this.validationInProgress) {
            debugLog('License validation already in progress, skipping');
            return isProUser();
        }

        if (!needsLicenseValidation()) {
            debugLog('License validation not needed yet');
            return isProUser();
        }

        const licenseKey = getLicenseKey();
        if (!licenseKey) {
            debugLog('No license key to validate');
            return false;
        }

        this.validationInProgress = true;

        try {
            debugLog('Performing periodic license validation');

            // No instance hunting. The device identity IS vscode.env.machineId, so the server
            // can always resolve this machine from the request itself. The old code had to
            // discover, cache and sometimes re-mint an opaque "instance id" — and could burn
            // an activation slot doing it.
            const validation = await this.licenseService.check(licenseKey);

            const updateData: any = {
                lastValidation: new Date().toISOString()
            };

            // Fail open. A validation that merely failed to reach an answer — offline, a
            // timeout, a 5xx, a 404 from a store that no longer exists — proves nothing about
            // whether this customer paid, so it must never cost them Pro. Only an affirmative
            // revocation from a server we trust may downgrade someone.
            if (validation.isValid) {
                updateData.validationStatus = 'valid';
                this.deactivationNoticeShown = false;
            } else if (validation.revoked) {
                updateData.validationStatus = 'invalid';
                if (!this.deactivationNoticeShown) {
                    this.deactivationNoticeShown = true;
                    const action = await vscode.window.showWarningMessage(
                    'GitMind Pro was deactivated for this device from your account. Reactivate it in the portal or re-activate this machine.',
                    'Open Portal',
                    'Re-activate'
                    );
                    if (action === 'Open Portal') {
                        void vscode.commands.executeCommand('gitmind.openAccountPortal');
                    } else if (action === 'Re-activate') {
                        void vscode.commands.executeCommand('gitmind.activateWithLicenseKey');
                    }
                }
            } else {
                debugLog(
                    `License validation was inconclusive (${validation.status}); ` +
                    'preserving the existing Pro state'
                );
            }

            // Store instanceId if returned from validation and we don't have one already stored
            if (validation.instanceId && !getInstanceId()) {
                updateData.instanceId = validation.instanceId;
                debugLog(`Storing new instanceId from validation: ${validation.instanceId}`);
            }

            await updateProConfig(updateData);

            if (validation.isValid && validation.customerEmail) {
                await updateSubscriptionConfig({
                    email: validation.customerEmail,
                    plan: 'pro',
                    status: 'active',
                    lastChecked: new Date().toISOString()
                });
            } else if (validation.revoked) {
                await updateSubscriptionConfig({
                    plan: 'free',
                    status: 'expired',
                    lastChecked: new Date().toISOString()
                });
            }

            debugLog(`License validation result: ${validation.status}`);
            return validation.isValid || (!validation.revoked && isProUser());
        } catch (error) {
            // Same rule as above: an exception is an inconclusive answer, not a revocation.
            // Touch only the timestamp so the existing entitlement survives.
            debugLog('Periodic license validation failed; preserving existing Pro state:', error);

            await updateProConfig({
                lastValidation: new Date().toISOString()
            });

            return isProUser();
        } finally {
            this.validationInProgress = false;
        }
    }

    /**
     * Deactivate pro features
     */
    public async deactivate(withApiCall: boolean = true, licenseKey?: string, instanceId?: string): Promise<ProActivationResult> {
        debugLog('Deactivating pro features', { withApiCall });

        void instanceId; // The machine identifies itself now; no opaque instance to pass.

        let apiResponse: LicenseDeactivationResponse | null = null;

        // Release the device slot on the server, so the customer can use it on another
        // machine. Best-effort by design: if the network is down, the local state is still
        // cleared. Refusing to deactivate because a server was unreachable would trap the
        // user in exactly the position this whole rewrite exists to prevent.
        //
        // The old implementation needed ~90 lines here to recover a key that its own
        // encryption had made unreadable, and its last-resort branch re-activated the licence
        // purely to mint an instance id it could then deactivate — burning an activation slot
        // in order to free one. All of that is gone: the key lives in SecretStorage and the
        // device is just vscode.env.machineId.
        if (withApiCall) {
            const key = licenseKey ?? await this.resolveLicenseKey();

            if (key) {
                try {
                    const result = await this.licenseService.deactivate(key);
                    debugLog(`Server-side deactivation: ${result.revoked ? 'released' : 'not released'}`);
                    apiResponse = {
                        deactivated: result.revoked === true,
                        error: result.error ?? null
                    } as LicenseDeactivationResponse;
                } catch (error) {
                    debugLog('Server-side deactivation failed; clearing local state anyway:', error);
                }
            } else {
                debugLog('No license key available to deactivate against the server.');
            }
        }


        // Always perform local deactivation to ensure Pro features are disabled. The
        // grandfathered entitlement must go too — it outranks the settings below, so leaving it
        // in place would silently restore Pro on the next isProUser() call.
        await LegacyEntitlementService.getInstance().clearEntitlement();

        await updateProConfig({
            licenseKey: '',
            validationStatus: 'invalid',
            orderId: '',
            instanceId: ''
        });

        await updateSubscriptionConfig({
            plan: 'free',
            status: 'free',
            lastChecked: new Date().toISOString()
        });

        // Handle encryption and API key migration when downgrading to free
        try {
            const { SecureKeyManager } = await import('../encryption/SecureKeyManager.js');
            const secureKeyManager = SecureKeyManager.getInstance();

            // Check if encryption was enabled and handle the transition
            const config = vscode.workspace.getConfiguration('gitmind');
            const encryptionEnabled = config.get<boolean>('pro.encryptionEnabled', false);

            if (encryptionEnabled) {
                debugLog('User had encryption enabled, migrating keys to plain text...');

                // Disable encryption first
                await config.update('pro.encryptionEnabled', false, vscode.ConfigurationTarget.Global);

                // Migrate encrypted keys back to plain text
                const migrationResult = await secureKeyManager.migrateToPlainText();
                if (migrationResult.success) {
                    debugLog('Successfully migrated encrypted keys to plain text during deactivation');
                } else {
                    debugLog('Failed to migrate encrypted keys during deactivation:', migrationResult.message);
                }

                // Force restore any remaining [ENCRYPTED] placeholders
                const restoreResult = await secureKeyManager.forceRestoreEncryptedPlaceholders();
                if (restoreResult.success && restoreResult.details) {
                    debugLog('Force restored placeholders:', restoreResult.details);
                }

                // Force refresh of the pro user cache
                secureKeyManager.refreshProUserCache();

                // Clear API key cache to force re-fetch of plain text keys
                secureKeyManager.clearApiKeyCache();
            }

        } catch (error) {
            debugLog('Error handling encryption during deactivation:', error);
        }

        // Configuration, key migration, and cache cleanup are now complete. Refresh
        // commands and rebuild any open Settings document exactly once so state-only
        // updates never race with entitlement-specific markup.
        await this.refreshEntitlementUi();

        let successMessage = 'GitMind Pro has been deactivated locally.';

        if (apiResponse && apiResponse.deactivated) {
            successMessage = this.formatDeactivationSuccessMessage(apiResponse, true);
        } else if (withApiCall && licenseKey && instanceId && licenseKey !== '[ENCRYPTED]') {
            successMessage = this.formatDeactivationSuccessMessage(undefined, true);
        } else if (withApiCall && (licenseKey === '[ENCRYPTED]' || !licenseKey || !instanceId)) {
            // The local state is cleared either way; the only open question is whether
            // the device slot was released on the license server.
            successMessage = 'GitMind Pro has been deactivated locally, but the device slot could not be '
                + 'released on the license server because the stored license details were not accessible. '
                + `This device may still count against your license — you can remove it any time from your account portal at ${GitMindLicenseService.PORTAL_URL}.`;
        }

        return {
            success: true,
            message: successMessage,
            apiResponse: apiResponse
        };
    }

    /**
     * Refresh every in-memory view of entitlement without reloading the VS Code
     * window. Configuration writes alone update storage but do not force an open
     * webview, cached Pro check, or status bar to re-render.
     */
    private async refreshEntitlementUi(): Promise<void> {
        try {
            const { SecureKeyManager } = await import('../encryption/SecureKeyManager.js');
            SecureKeyManager.getInstance().refreshProUserCache();
        } catch (error) {
            debugLog('Could not refresh the Pro entitlement cache:', error);
        }

        try {
            const { updateCommitIntelligenceContext } = await import('../../config/settings.js');
            await updateCommitIntelligenceContext();
            await vscode.commands.executeCommand('gitmind.internalUpdateProStatusBar');
            await vscode.commands.executeCommand('gitmind.refreshSubscription', { silent: true });
        } catch (error) {
            debugLog('Could not refresh GitMind entitlement commands:', error);
        }

        try {
            const { SettingsWebview } = await import('../../webview/settings/SettingsWebview.js');
            await SettingsWebview.refreshEntitlementView();
        } catch (error) {
            debugLog('Could not refresh the open GitMind settings view:', error);
        }
    }

    /**
     * Format success message for license activation. Lines whose value the server did
     * not provide are omitted — an empty "Customer:" reads like something went wrong.
     */
    private formatSuccessMessage(customerEmail: string, productName: string, devicesUsed: number, devicesLimit: number): string {
        const details: string[] = [];
        if (customerEmail) {
            details.push(`• Account: ${customerEmail}`);
        }
        if (productName) {
            details.push(`• Product: ${productName}`);
        }
        if (devicesLimit > 0) {
            details.push(`• Devices in use: ${devicesUsed} of ${devicesLimit}`);
        }
        details.push('• License Type: Lifetime — no renewal required');

        return `Welcome to GitMind Pro!

Your license has been successfully activated and Pro features are now available.

Activation Details:
${details.join('\n')}

You can now enjoy all Pro features including advanced AI models, unlimited commits, and priority support.

Manage your devices (rename, remove, or reactivate) any time from your account portal at ${GitMindLicenseService.PORTAL_URL}.`;
    }

    /**
     * Format error message for failed activations
     */
    private formatErrorMessage(error: string): string {
        // Try to extract meaningful error information from HTTP error responses
        let cleanError = error;
        let httpStatus = '';

        // Check if this is an HTTP error with JSON response
        const httpMatch = error.match(/HTTP (\d+): ([^-]+) - (.+)/);
        if (httpMatch) {
            httpStatus = httpMatch[1];
            const statusText = httpMatch[2].trim();
            const responseBody = httpMatch[3];

            try {
                // Try to parse the JSON response
                const jsonResponse = JSON.parse(responseBody);
                if (jsonResponse.error) {
                    cleanError = jsonResponse.error;
                } else if (jsonResponse.message) {
                    cleanError = jsonResponse.message;
                } else {
                    cleanError = `${statusText} (${httpStatus})`;
                }
            } catch (parseError) {
                // If JSON parsing fails, use the response body as-is
                cleanError = responseBody || `${statusText} (${httpStatus})`;
            }
        }

        const commonErrors: { [key: string]: string } = {
            'license key not found': 'The license key you entered was not found in our system. Please double-check that you entered the correct license key from your purchase confirmation email.',
            'license_key not found': 'The license key you entered was not found in our system. Please double-check that you entered the correct license key from your purchase confirmation email.',
            'license key expired': 'Your license key has expired. Please contact support or purchase a new license.',
            'activation limit exceeded': 'Activation limit exceeded. You have reached the maximum number of devices for this license. Remove a device you no longer use from your account portal at https://gitmind-pro.com/portal to free up a slot, then activate this machine again.',
            'license key disabled': 'This license key has been disabled. Please contact support for assistance.',
            'invalid license key': 'Invalid license key format. Please check that you entered the license key correctly.',
            'not found (404)': 'The license key could not be found in our system. Please verify you entered the correct license key.',
            'unauthorized (401)': 'Authentication failed. There may be an issue with the license system. Please try again or contact support.',
            'forbidden (403)': 'Access denied. This license key may be disabled or restricted.'
        };

        const lowerError = cleanError.toLowerCase();
        for (const [key, message] of Object.entries(commonErrors)) {
            if (lowerError.includes(key)) {
                return `License Activation Failed

${message}

Troubleshooting Steps:
• Verify you copied the entire license key correctly (no extra spaces)
• Check your purchase confirmation email for the exact license key
• Ensure you're using a valid GitMind Pro license key
• Make sure the license hasn't expired or been deactivated

If you continue to experience issues, please contact our support team with your license key for assistance.`;
            }
        }

        // If no specific error pattern matched, provide a generic but helpful message
        const displayError = cleanError.length > 100 ? cleanError.substring(0, 100) + '...' : cleanError;

        return `License Activation Failed

${displayError}

Please verify your license key and try again. If the problem persists, contact our support team for assistance.

Troubleshooting Steps:
• Double-check your license key for typos
• Ensure your internet connection is stable
• Try again in a few minutes if this is a temporary server issue`;
    }


    /**
     * Format success message for license deactivation
     */
    private formatDeactivationSuccessMessage(apiResponse?: LicenseDeactivationResponse, wasApiCall: boolean = false): string {
        if (!apiResponse || !apiResponse.deactivated) {
            if (wasApiCall) {
                return 'GitMind Pro has been deactivated locally. Note: the device slot may not have been '
                    + `released on the license server — check your devices at ${GitMindLicenseService.PORTAL_URL}.`;
            }
            return 'GitMind Pro has been deactivated locally.';
        }

        const meta = apiResponse.meta;
        const licenseInfo = apiResponse.license_key;

        let message = 'GitMind Pro Deactivated Successfully\n\n';
        message += 'This device has been released from your license and the slot is free for another machine.\n\n';

        const details: string[] = [];
        if (meta?.customer_email) {
            details.push(`• Account: ${meta.customer_email}`);
        }
        if (meta?.product_name) {
            details.push(`• Product: ${meta.product_name}`);
        }
        if (licenseInfo?.activation_limit) {
            details.push(`• Devices in use: ${licenseInfo.activation_usage} of ${licenseInfo.activation_limit}`);
        }
        if (details.length > 0) {
            message += 'Deactivation Details:\n' + details.join('\n') + '\n';
        }

        message += '\nYou can reactivate on any device with your original license key, and manage all your '
            + `devices from your account portal at ${GitMindLicenseService.PORTAL_URL}.`;

        return message;
    }
}
