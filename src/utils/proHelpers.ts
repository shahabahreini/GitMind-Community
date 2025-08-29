import * as vscode from 'vscode';

/**
 * Helper functions for Pro user validation and license management
 */

export function isProUser(): boolean {
    const config = vscode.workspace.getConfiguration('gitmind');
    const validationStatus = config.get('pro.validationStatus');
    return validationStatus === 'valid';
}

export function hasValidLicense(): boolean {
    return isProUser();
}

export function getLicenseKey(): string | undefined {
    const config = vscode.workspace.getConfiguration('gitmind');
    const licenseKey = config.get<string>('pro.licenseKey');

    // If it's the placeholder, we should retrieve it from secure storage
    // However, this is a sync function, so we can't do async operations here
    // The secure retrieval should be handled by the calling code
    if (licenseKey === '[ENCRYPTED]') {
        // Return undefined for encrypted keys - calling code should use secure retrieval
        return undefined;
    }

    return licenseKey;
}

/**
 * Retrieves the license key securely (async version)
 * Use this when you need to get the actual license key value
 */
export async function getSecureLicenseKey(context: vscode.ExtensionContext): Promise<string | undefined> {
    try {
        const { EncryptionHelper } = await import('./encryptionHelper.js');
        return await EncryptionHelper.getLicenseKey(context);
    } catch (error) {
        console.error('Failed to retrieve secure license key:', error);
        // Fallback to regular method
        return getLicenseKey();
    }
}

export function getOrderId(): string | undefined {
    const config = vscode.workspace.getConfiguration('gitmind');
    return config.get('pro.orderId');
}

export function getInstanceId(): string | undefined {
    const config = vscode.workspace.getConfiguration('gitmind');
    return config.get('pro.instanceId');
}

export function getValidationStatus(): 'valid' | 'invalid' | 'expired' | 'error' {
    const config = vscode.workspace.getConfiguration('gitmind');
    return config.get('pro.validationStatus', 'invalid');
}

export function getLastValidation(): Date | undefined {
    const config = vscode.workspace.getConfiguration('gitmind');
    const lastValidation = config.get('pro.lastValidation') as string;
    return lastValidation ? new Date(lastValidation) : undefined;
}

export function needsLicenseValidation(): boolean {
    const lastValidation = getLastValidation();

    if (!lastValidation) {
        return true;
    }

    const now = new Date();
    const timeDiff = now.getTime() - lastValidation.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    // Validate every 24 hours
    return hoursDiff >= 24;
}

export async function updateProConfig(config: {
    licenseKey?: string;
    orderId?: string;
    validationStatus?: 'valid' | 'invalid' | 'expired' | 'error';
    lastValidation?: string;
    instanceId?: string;
}): Promise<void> {
    const currentConfig = vscode.workspace.getConfiguration('gitmind');

    for (const [key, value] of Object.entries(config)) {
        await currentConfig.update(`pro.${key}`, value, vscode.ConfigurationTarget.Global);
    }
}

export async function updateSubscriptionConfig(config: {
    email?: string;
    plan?: string;
    status?: string;
    lastChecked?: string;
}): Promise<void> {
    const currentConfig = vscode.workspace.getConfiguration('gitmind');

    for (const [key, value] of Object.entries(config)) {
        await currentConfig.update(`subscription.${key}`, value, vscode.ConfigurationTarget.Global);
    }
}

export function isEncryptionAvailable(): boolean {
    const config = vscode.workspace.getConfiguration('gitmind');
    const hasSubscriptionEmail = !!config.get('subscription.email');
    const devModeEnabled = process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';

    return hasSubscriptionEmail || devModeEnabled || isProUser();
}

export function isEncryptionEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('gitmind');
    return config.get('pro.encryptionEnabled', false) && isEncryptionAvailable();
}
