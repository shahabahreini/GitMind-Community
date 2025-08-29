import * as vscode from 'vscode';
import { LemonSqueezyService } from './LemonSqueezyService';
import { debugLog } from '../debug/logger';
import {
    isProUser,
    needsLicenseValidation,
    getLicenseKey,
    getInstanceId,
    updateProConfig,
    updateSubscriptionConfig
} from '../../utils/proHelpers';

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
    private readonly lemonSqueezyService: LemonSqueezyService;
    private validationInProgress = false;

    private constructor() {
        this.lemonSqueezyService = LemonSqueezyService.getInstance();
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

                // Update subscription configuration with customer info
                await updateSubscriptionConfig({
                    email: activation.meta.customer_email,
                    plan: 'pro',
                    status: 'active',
                    lastChecked: new Date().toISOString()
                });

                debugLog('Pro activation successful');

                // Refresh UI immediately to show Pro status
                vscode.commands.executeCommand('gitmind.refreshSubscription', { silent: true });

                // Show success notification
                vscode.window.showInformationMessage(
                    'GitMind Pro activated successfully! Pro features are now available.',
                    'Open Settings'
                ).then(selection => {
                    if (selection === 'Open Settings') {
                        vscode.commands.executeCommand('gitmind.openSettings');
                    }
                });

                const activationsRemaining = activation.license_key.activation_limit - activation.license_key.activation_usage;
                const expiryInfo = activation.license_key.expires_at
                    ? `Expires: ${new Date(activation.license_key.expires_at).toLocaleDateString()}`
                    : 'Lifetime license';

                return {
                    success: true,
                    message: this.formatSuccessMessage(activation.meta.customer_name, activation.meta.product_name, activationsRemaining, expiryInfo),
                    details: {
                        customerName: activation.meta.customer_name,
                        customerEmail: activation.meta.customer_email,
                        productName: activation.meta.product_name,
                        variantName: activation.meta.variant_name,
                        activationLimit: activation.license_key.activation_limit,
                        activationUsage: activation.license_key.activation_usage,
                        activationsRemaining: activationsRemaining,
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
     * Activate license using the Lemon Squeezy API
     */
    private async activateLicenseWithAPI(licenseKey: string): Promise<LicenseActivationResponse> {
        // First, try to clean up any existing instances for this license
        const existingInstanceId = getInstanceId();
        if (existingInstanceId) {
            debugLog(`Found existing instance ID: ${existingInstanceId}, attempting to deactivate before creating new instance`);
            try {
                await this.lemonSqueezyService.deactivateLicenseKey(licenseKey, existingInstanceId);
                debugLog('Successfully deactivated existing instance');
            } catch (deactivationError) {
                debugLog('Failed to deactivate existing instance (this is expected if instance was already invalid):', deactivationError);
                // Continue with activation even if deactivation fails
            }
        }

        // Also try to clean up any other invalid instances
        debugLog('Cleaning up any invalid instances for this license');
        try {
            const cleanupResult = await this.lemonSqueezyService.cleanupInvalidInstances(licenseKey);
            debugLog(`Cleanup result: cleaned ${cleanupResult.cleaned} instances, ${cleanupResult.errors.length} errors`);
        } catch (cleanupError) {
            debugLog('Failed to clean up instances (continuing with activation):', cleanupError);
        }

        const activationData = {
            license_key: licenseKey,
            instance_name: 'vscode-extension'
        };

        debugLog('Activating license with API:', {
            license_key: licenseKey.substring(0, 8) + '...',
            instance_name: activationData.instance_name
        });

        // Use the existing makeRequestWithRetry method from LemonSqueezyService
        const response = await this.lemonSqueezyService.makeRequestWithRetry('/licenses/activate', 'POST', activationData);

        debugLog('License activation API response:', {
            activated: response.activated,
            error: response.error,
            hasLicenseKey: !!response.license_key,
            hasInstance: !!response.instance,
            hasMeta: !!response.meta,
            instanceId: response.instance?.id
        });

        // Log the actual instance ID for debugging
        if (response.instance && response.instance.id) {
            debugLog(`Activation returned instance ID: ${response.instance.id}`);
        } else {
            debugLog('Warning: Activation did not return a valid instance ID');
        }

        return response;
    }

    /**
     * Activate pro features using an order ID
     */
    public async activateWithOrderId(orderId: string, customerEmail?: string): Promise<ProActivationResult> {
        debugLog(`Attempting to activate with order ID: ${orderId}`);

        if (!orderId || orderId.trim() === '') {
            return {
                success: false,
                message: 'Order ID is required. Please enter a valid order ID to continue.'
            };
        }

        try {
            // Check the order status
            const orderStatus = await this.lemonSqueezyService.checkOrderStatus(orderId);

            if (orderStatus.isValid && orderStatus.status === 'paid') {
                // If we got license keys from the order, use the first one
                if (orderStatus.licenseKeys && orderStatus.licenseKeys.length > 0) {
                    const licenseKey = orderStatus.licenseKeys[0];
                    debugLog(`Found license key in order: ${licenseKey.substring(0, 8)}...`);

                    // Activate using the license key
                    return await this.activateWithLicenseKey(licenseKey);
                } else {
                    // No license keys found, but order is valid - activate directly
                    await updateProConfig({
                        orderId: orderId,
                        lastValidation: new Date().toISOString(),
                        validationStatus: 'valid'
                    });

                    await updateSubscriptionConfig({
                        email: orderStatus.customerEmail || customerEmail || '',
                        plan: 'pro',
                        status: 'active',
                        lastChecked: new Date().toISOString()
                    });

                    return {
                        success: true,
                        message: `Welcome to GitMind Pro!\n\nYour order has been verified and your Pro features are now active.\n\nOrder Details:\n• Product: ${orderStatus.productName || 'GitMind Pro'}\n• Customer: ${orderStatus.customerName || 'N/A'}\n• Total: ${orderStatus.total ? `${orderStatus.total} ${orderStatus.currency}` : 'N/A'}`,
                        details: orderStatus
                    };
                }
            } else {
                const errorMessage = orderStatus.error || 'Order not found or payment not completed';
                return {
                    success: false,
                    message: this.formatOrderErrorMessage(errorMessage, orderStatus.status),
                    details: orderStatus
                };
            }
        } catch (error) {
            debugLog('Order activation error:', error);

            await updateProConfig({
                orderId: orderId,
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
     * Validate existing license (periodic check)
     */
    public async validateExistingLicense(): Promise<boolean> {
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
            let instanceId = getInstanceId();

            // If we don't have an instance ID, try to find existing instances first
            if (!instanceId) {
                debugLog('No instance ID found, attempting to find existing license instances');
                try {
                    const recentInstanceId = await this.lemonSqueezyService.getRecentLicenseInstance(licenseKey);
                    if (recentInstanceId) {
                        instanceId = recentInstanceId;
                        debugLog(`Found existing instance ID: ${instanceId}`);

                        // Save the instance ID for future use
                        await updateProConfig({
                            instanceId: instanceId
                        });
                    }
                } catch (findError) {
                    debugLog('Error finding existing instances:', findError);
                }
            }

            // Validate with the instance ID (if we have one)
            let validation;
            if (instanceId) {
                debugLog(`Using instance ID for validation: ${instanceId}`);
                validation = await this.lemonSqueezyService.validateLicenseKey(licenseKey, instanceId, 'vscode-extension');
            } else {
                debugLog('No instance ID available, performing validation without instance');
                validation = await this.lemonSqueezyService.validateLicenseKey(licenseKey, undefined, 'vscode-extension');

                // If validation succeeds but still no instance ID, try activation to create one
                if (validation.isValid && !validation.instanceId) {
                    debugLog('Validation successful but no instance ID returned, attempting activation to create instance');
                    try {
                        const activation = await this.activateLicenseWithAPI(licenseKey);
                        if (activation.activated && activation.instance && activation.instance.id) {
                            validation.instanceId = activation.instance.id;
                            debugLog(`Created new instance ID through activation: ${activation.instance.id}`);
                        }
                    } catch (activationError) {
                        debugLog('Failed to create instance through activation:', activationError);
                        // Continue with validation result even without instance ID
                    }
                }
            }

            const updateData: any = {
                lastValidation: new Date().toISOString(),
                validationStatus: validation.isValid ? 'valid' : 'invalid'
            };

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
            } else if (!validation.isValid) {
                await updateSubscriptionConfig({
                    plan: 'free',
                    status: 'expired',
                    lastChecked: new Date().toISOString()
                });
            }

            debugLog(`License validation result: ${validation.isValid ? 'valid' : 'invalid'}`);
            return validation.isValid;
        } catch (error) {
            debugLog('Periodic license validation failed:', error);

            await updateProConfig({
                lastValidation: new Date().toISOString(),
                validationStatus: 'error'
            });

            return false;
        } finally {
            this.validationInProgress = false;
        }
    }

    /**
     * Deactivate pro features
     */
    public async deactivate(withApiCall: boolean = true, licenseKey?: string, instanceId?: string): Promise<ProActivationResult> {
        debugLog('Deactivating pro features', { withApiCall, hasLicenseKey: !!licenseKey, hasInstanceId: !!instanceId });

        let apiResponse: LicenseDeactivationResponse | null = null;        // If no license key or instance ID was provided, try to get them from config
        if (withApiCall && (!licenseKey || !instanceId)) {
            // Try to get secure license key first, fallback to regular method
            try {
                const { getSecureLicenseKey } = await import('../../utils/proHelpers.js');

                // Get the extension context from global state
                const { state } = await import('../../extension.js');
                const context = (state as any)?.context;

                if (context) {
                    // Try to get the decrypted license key from secure storage
                    const secureLicenseKey = await getSecureLicenseKey(context);
                    if (secureLicenseKey && secureLicenseKey !== '[ENCRYPTED]') {
                        licenseKey = secureLicenseKey;
                        debugLog('Successfully retrieved decrypted license key from secure storage');
                    } else {
                        debugLog('Secure license key not available or still encrypted');
                    }
                } else {
                    debugLog('Extension context not available for secure key retrieval');
                }

                // Fallback to regular method if secure retrieval didn't work
                if (!licenseKey || licenseKey === '[ENCRYPTED]') {
                    const regularLicenseKey = getLicenseKey();
                    if (regularLicenseKey && regularLicenseKey !== '[ENCRYPTED]') {
                        licenseKey = regularLicenseKey;
                        debugLog('Retrieved license key from regular storage');
                    } else if (regularLicenseKey === '[ENCRYPTED]') {
                        debugLog('License key is encrypted and cannot be decrypted without proper context');

                        // Try one more approach - use EncryptionHelper directly if we have context
                        if (context && context.secrets) {
                            try {
                                const { EncryptionHelper } = await import('../../utils/encryptionHelper.js');
                                const directKey = await EncryptionHelper.getLicenseKey(context);
                                if (directKey && directKey !== '[ENCRYPTED]') {
                                    licenseKey = directKey;
                                    debugLog('Successfully retrieved license key using EncryptionHelper directly');
                                }
                            } catch (encryptionError) {
                                debugLog('Failed to retrieve license key using EncryptionHelper:', encryptionError);
                            }
                        }
                    }
                }
            } catch (error) {
                debugLog('Failed to retrieve secure license key:', error);
                licenseKey = getLicenseKey();
            }

            // Get instance ID from config
            if (!instanceId) {
                instanceId = getInstanceId();
                debugLog(`Retrieved instance ID from config: ${instanceId || 'not found'}`);
            }

            // If we still don't have instance ID but have a license key, try multiple approaches to find it
            if (!instanceId && licenseKey && licenseKey !== '[ENCRYPTED]') {
                debugLog('Missing instance ID, attempting multiple recovery methods');

                try {
                    // Method 1: Try to get existing instances for this license
                    debugLog('Method 1: Searching for existing license instances');
                    const recentInstanceId = await this.lemonSqueezyService.getRecentLicenseInstance(licenseKey);
                    if (recentInstanceId) {
                        instanceId = recentInstanceId;
                        debugLog(`Found existing instance ID: ${instanceId}`);

                        // Save the instance ID for future use
                        await updateProConfig({
                            instanceId: instanceId
                        });
                    } else {
                        debugLog('Method 1: No existing instances found');

                        // Method 2: Try license validation - sometimes returns instance info
                        debugLog('Method 2: Attempting license validation to find instance');
                        try {
                            const validation = await this.lemonSqueezyService.validateLicenseKey(licenseKey);
                            if (validation.isValid && validation.instanceId) {
                                instanceId = validation.instanceId;
                                debugLog(`Found instance ID through validation: ${instanceId}`);

                                // Save the instance ID for future use
                                await updateProConfig({
                                    instanceId: instanceId
                                });
                            } else {
                                debugLog('Method 2: Validation did not return instance ID');

                                // Method 3: As last resort, create a new instance through activation
                                // This should only be done if we're sure we need to deactivate
                                debugLog('Method 3: Creating new instance through activation (last resort)');
                                const activation = await this.activateLicenseWithAPI(licenseKey);
                                if (activation.activated && activation.instance && activation.instance.id) {
                                    instanceId = activation.instance.id;
                                    debugLog(`Created new instance ID through activation: ${instanceId}`);

                                    // Save the instance ID for future use
                                    await updateProConfig({
                                        instanceId: instanceId
                                    });
                                } else {
                                    debugLog('Method 3: Failed to create new instance through activation');
                                }
                            }
                        } catch (validationError) {
                            debugLog('Method 2 failed, trying Method 3:', validationError);

                            // Method 3: As last resort, create a new instance through activation
                            try {
                                debugLog('Method 3: Creating new instance through activation (fallback)');
                                const activation = await this.activateLicenseWithAPI(licenseKey);
                                if (activation.activated && activation.instance && activation.instance.id) {
                                    instanceId = activation.instance.id;
                                    debugLog(`Created new instance ID through activation: ${instanceId}`);

                                    // Save the instance ID for future use
                                    await updateProConfig({
                                        instanceId: instanceId
                                    });
                                } else {
                                    debugLog('Method 3: Failed to create new instance through activation');
                                }
                            } catch (activationError) {
                                debugLog('Method 3 also failed:', activationError);
                            }
                        }
                    }
                } catch (instanceSearchError) {
                    debugLog('All instance recovery methods failed:', instanceSearchError);
                }
            }

            debugLog('Retrieved license key and instance ID from config', {
                hasLicenseKey: !!licenseKey,
                hasInstanceId: !!instanceId,
                licenseKeyEncrypted: licenseKey === '[ENCRYPTED]'
            });
        }

        // If API deactivation is requested and we have the required parameters
        if (withApiCall && licenseKey && instanceId && licenseKey !== '[ENCRYPTED]') {
            try {
                debugLog('Attempting comprehensive API deactivation with LemonSqueezy');
                const comprehensiveResult = await this.lemonSqueezyService.comprehensiveDeactivation(licenseKey, instanceId);

                if (comprehensiveResult.success) {
                    debugLog('Comprehensive deactivation successful');

                    // Update the stored instance ID if it changed
                    if (comprehensiveResult.instanceId && comprehensiveResult.instanceId !== instanceId) {
                        debugLog(`Updating stored instance ID to: ${comprehensiveResult.instanceId}`);
                        await updateProConfig({
                            instanceId: comprehensiveResult.instanceId
                        });
                    }

                    // Use the actual API response from the comprehensive deactivation
                    apiResponse = comprehensiveResult.apiResponse || {
                        deactivated: true,
                        error: null,
                        license_key: undefined as any,
                        meta: undefined as any
                    };

                    // If the API response doesn't have license/meta information, try to get it from validation
                    if (apiResponse && (!apiResponse.license_key || !apiResponse.meta)) {
                        debugLog('API response missing license info, attempting to get from validation');
                        try {
                            const validation = await this.lemonSqueezyService.validateLicenseKey(licenseKey);
                            if (validation.isValid) {
                                // Enhance the API response with validation data
                                if (!apiResponse.meta && validation.customerName) {
                                    apiResponse.meta = {
                                        store_id: 0,
                                        order_id: 0,
                                        order_item_id: 0,
                                        product_id: 0,
                                        variant_id: 0,
                                        customer_id: 0,
                                        customer_name: validation.customerName,
                                        customer_email: validation.customerEmail || '',
                                        product_name: validation.productName || 'GitMind Pro',
                                        variant_name: validation.variantName || 'Default'
                                    };
                                }
                                if (!apiResponse.license_key && validation.activationsLimit) {
                                    apiResponse.license_key = {
                                        id: 0,
                                        status: 'active',
                                        key: licenseKey.substring(0, 8) + '...',
                                        activation_limit: validation.activationsLimit,
                                        activation_usage: validation.activationsCount || 0,
                                        created_at: new Date().toISOString(),
                                        expires_at: validation.expiresAt ? validation.expiresAt.toISOString() : null
                                    };
                                }
                                debugLog('Enhanced API response with validation data');
                            }
                        } catch (validationError) {
                            debugLog('Failed to enhance API response with validation data:', validationError);
                        }
                    }
                } else {
                    debugLog('Comprehensive deactivation failed:', comprehensiveResult.error);
                    return {
                        success: false,
                        message: 'Failed to deactivate license through LemonSqueezy API after trying multiple strategies: ' + (comprehensiveResult.error || 'Unknown error'),
                        details: comprehensiveResult
                    };
                }
            } catch (error) {
                debugLog('Comprehensive deactivation error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during API deactivation';
                return {
                    success: false,
                    message: 'Failed to deactivate license through LemonSqueezy API: ' + errorMessage,
                    details: { error }
                };
            }
        } else if (withApiCall && licenseKey === '[ENCRYPTED]') {
            debugLog('Cannot deactivate encrypted license key without proper decryption context');
            // Still proceed with local deactivation but warn user
        } else if (withApiCall && (!licenseKey || !instanceId)) {
            debugLog('Cannot perform API deactivation - missing license key or instance ID', {
                hasLicenseKey: !!licenseKey,
                hasInstanceId: !!instanceId,
                licenseKeyEncrypted: licenseKey === '[ENCRYPTED]'
            });
        }

        // Always perform local deactivation to ensure Pro features are disabled
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

            // Notify the settings webview to update if it's open
            try {
                const { SettingsWebview } = await import('../../webview/settings/SettingsWebview.js');
                if (SettingsWebview.isWebviewOpen()) {
                    // First notify of pro status change
                    SettingsWebview.postMessageToWebview({
                        command: 'proDeactivationResult',
                        success: true,
                        message: 'Pro features have been deactivated. API keys are now accessible in standard storage.'
                    });

                    // Force complete refresh of settings with updated key values
                    // Use a slight delay to ensure deactivation processing is complete
                    setTimeout(async () => {
                        try {
                            const { SettingsManager } = await import('../../webview/settings/SettingsManager.js');
                            const currentConfig = await SettingsManager.getCurrentSettings();

                            SettingsWebview.postMessageToWebview({
                                command: 'updateSettings',
                                settings: currentConfig,
                                forceRefresh: true,
                                refreshUI: true
                            });

                            // Also update encryption status specifically
                            SettingsWebview.postMessageToWebview({
                                command: 'updateEncryptionStatus'
                            });

                            // Trigger UI refresh for pro features
                            SettingsWebview.postMessageToWebview({
                                command: 'refreshProFeaturesUI'
                            });
                        } catch (settingsError) {
                            debugLog('Error refreshing settings after deactivation:', settingsError);
                        }
                    }, 500);
                }
            } catch (webviewError) {
                debugLog('Could not notify webview of pro status change:', webviewError);
            }

            // Trigger a command to refresh the subscription status
            try {
                vscode.commands.executeCommand('gitmind.refreshSubscription', { silent: true });
            } catch (commandError) {
                debugLog('Could not execute refresh subscription command:', commandError);
            }
        } catch (error) {
            debugLog('Error handling encryption during deactivation:', error);
        }

        let successMessage = 'GitMind Pro has been deactivated locally.';

        if (apiResponse && apiResponse.deactivated) {
            successMessage = this.formatDeactivationSuccessMessage(apiResponse, true);
        } else if (withApiCall && licenseKey && instanceId && licenseKey !== '[ENCRYPTED]') {
            successMessage = this.formatDeactivationSuccessMessage(undefined, true);
        } else if (withApiCall && (licenseKey === '[ENCRYPTED]' || !licenseKey || !instanceId)) {
            // More specific message for when we can't access encrypted license info
            if (licenseKey === '[ENCRYPTED]') {
                successMessage = 'GitMind Pro has been deactivated locally. Note: Could not release the license activation on LemonSqueezy servers because the license key is encrypted and secure storage is not accessible in this context. The license may still be active on the LemonSqueezy servers.\n\nTo properly deactivate the license:\n1. Re-enable Pro features temporarily\n2. Use the deactivation option from the settings\n3. This will ensure proper server-side deactivation';
            } else if (!licenseKey) {
                successMessage = 'GitMind Pro has been deactivated locally. Note: Could not release the license activation on LemonSqueezy servers because no license key was found. The license may still be active on the LemonSqueezy servers.';
            } else if (!instanceId) {
                successMessage = 'GitMind Pro has been deactivated locally. Note: Could not release the license activation on LemonSqueezy servers because no instance ID was found. This can happen when:\n\n• Encryption settings were changed\n• The license was activated in a different session\n• Configuration data was corrupted\n\nTo properly deactivate:\n1. Try reactivating your license first\n2. Then deactivate it properly to ensure server-side deactivation\n3. Or manually deactivate from your LemonSqueezy customer portal\n\nThe license may still be active on the LemonSqueezy servers and may need to be manually deactivated from your account.';
            } else {
                successMessage = 'GitMind Pro has been deactivated locally. Note: Could not release the license activation on LemonSqueezy servers due to missing license information. The license may still be active on the LemonSqueezy servers.';
            }
        }

        return {
            success: true,
            message: successMessage,
            apiResponse: apiResponse
        };
    }

    /**
     * Format success message for license activation
     */
    private formatSuccessMessage(customerName: string, productName: string, activationsRemaining: number, expiryInfo: string): string {
        return `Welcome to GitMind Pro!

Your license has been successfully activated and Pro features are now available.

Activation Details:
• Customer: ${customerName}
• Product: ${productName}
• Activations Remaining: ${activationsRemaining}
• ${expiryInfo}

You can now enjoy all Pro features including advanced AI models, unlimited commits, and priority support.`;
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
            'activation limit exceeded': 'Activation limit exceeded. You have reached the maximum number of activations for this license.',
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
     * Format error message for order-based activation failures
     */
    private formatOrderErrorMessage(error: string, status?: string): string {
        if (status === 'pending') {
            return `Order Pending

Your order is still being processed. Please wait a few minutes and try again.

If payment was recently completed, it may take some time for the order status to update.`;
        }

        if (status === 'cancelled' || status === 'refunded') {
            return `Order Cancelled

This order has been cancelled or refunded and cannot be used for activation.

Please use a valid order ID or contact support if you believe this is an error.`;
        }

        // Clean up HTTP error messages for order activation
        let cleanError = error;
        const httpMatch = error.match(/HTTP (\d+): ([^-]+) - (.+)/);
        if (httpMatch) {
            const httpStatus = httpMatch[1];
            const statusText = httpMatch[2].trim();
            const responseBody = httpMatch[3];

            try {
                const jsonResponse = JSON.parse(responseBody);
                if (jsonResponse.error) {
                    cleanError = jsonResponse.error;
                } else if (jsonResponse.message) {
                    cleanError = jsonResponse.message;
                } else {
                    cleanError = `${statusText} (${httpStatus})`;
                }
            } catch (parseError) {
                cleanError = responseBody || `${statusText} (${httpStatus})`;
            }
        }

        // Handle common order-related errors
        const lowerError = cleanError.toLowerCase();
        if (lowerError.includes('order not found') || lowerError.includes('not found')) {
            return `Order Not Found

The order ID you entered could not be found in our system.

Troubleshooting Steps:
• Verify you entered the correct order ID from your purchase receipt
• Check that payment has been completed successfully
• Ensure the order was placed with the correct email address

If you continue to have issues, please contact support with your order details.`;
        }

        if (lowerError.includes('no license keys') || lowerError.includes('license keys not found')) {
            return `No License Keys Found

This order does not have any license keys associated with it.

This could mean:
• The order is for a different product that doesn't include license keys
• The order is still being processed
• There was an issue during order fulfillment

Please contact support with your order ID for assistance.`;
        }

        const displayError = cleanError.length > 100 ? cleanError.substring(0, 100) + '...' : cleanError;

        return `Order Validation Failed

${displayError}

Please verify your order ID and ensure the payment has been completed. If you continue to experience issues, contact support.

Troubleshooting Steps:
• Double-check your order ID for typos
• Confirm payment was successful
• Allow some time for order processing if recently purchased`;
    }

    /**
     * Format success message for license deactivation
     */
    private formatDeactivationSuccessMessage(apiResponse?: LicenseDeactivationResponse, wasApiCall: boolean = false): string {
        if (!apiResponse || !apiResponse.deactivated) {
            if (wasApiCall) {
                return 'GitMind Pro has been deactivated locally. Note: The license activation status on LemonSqueezy servers was not updated.';
            }
            return 'GitMind Pro has been deactivated locally.';
        }

        const meta = apiResponse.meta;
        const licenseInfo = apiResponse.license_key;

        let message = 'GitMind Pro Deactivated Successfully\n\n';
        message += 'Your license activation has been released from this device and is now available for use on another device.\n\n';

        message += 'Deactivation Details:\n';

        if (meta?.customer_name) {
            message += `• License Owner: ${meta.customer_name}`;
            if (meta.customer_email) {
                message += ` (${meta.customer_email})`;
            }
            message += '\n';
        }

        if (meta?.product_name) {
            message += `• Product: ${meta.product_name}\n`;
        }

        if (licenseInfo?.activation_limit) {
            const remaining = licenseInfo.activation_limit - licenseInfo.activation_usage;
            message += `• License Usage: ${licenseInfo.activation_usage}/${licenseInfo.activation_limit} activations\n`;
            message += `• Activations Remaining: ${remaining}\n`;
        }

        if (licenseInfo?.expires_at) {
            const expiryDate = new Date(licenseInfo.expires_at);
            message += `• License Expires: ${expiryDate.toLocaleDateString()}\n`;
        } else {
            message += '• License Type: Lifetime\n';
        }

        message += '\nYou can reactivate your license on any device using your original license key.';

        return message;
    }
}