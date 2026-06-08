// src/services/subscription/SubscriptionManager.ts
import * as vscode from 'vscode';
import { LemonSqueezyService, SubscriptionStatus } from './LemonSqueezyService';
import { debugLog } from '../debug/logger';
import { SecureKeyManager } from '../encryption/SecureKeyManager';
import { SettingsWebview } from '../../webview/settings/SettingsWebview';

export interface UserSubscription {
    email: string;
    status: SubscriptionStatus;
    lastChecked: Date;
    cacheValidUntil: Date;
}

/**
 * Manages user subscription state and integrates with Lemon Squeezy
 */
export class SubscriptionManager {
    private static instance: SubscriptionManager;
    private context: vscode.ExtensionContext | undefined;
    private lemonSqueezy: LemonSqueezyService;
    private subscriptionCache: Map<string, UserSubscription> = new Map();
    private readonly cacheExpiration = 5 * 60 * 1000; // 5 minutes

    private constructor() {
        this.lemonSqueezy = LemonSqueezyService.getInstance();
    }

    public static getInstance(): SubscriptionManager {
        if (!SubscriptionManager.instance) {
            SubscriptionManager.instance = new SubscriptionManager();
        }
        return SubscriptionManager.instance;
    }

    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        this.loadCachedSubscriptions();
    }

    /**
     * Check if user has an active subscription
     */
    public async isProUser(email?: string, preventPrompt: boolean = false): Promise<boolean> {
        // First check if user has a valid license key - this takes priority
        const config = vscode.workspace.getConfiguration('gitmind');
        const validationStatus = config.get<string>('pro.validationStatus');
        const licenseKey = config.get<string>('pro.licenseKey');
        const orderId = config.get<string>('pro.orderId');

        // If license key OR order ID is valid, user is pro regardless of subscription status
        if (validationStatus === 'valid' && (licenseKey || orderId)) {
            debugLog('User has valid license key/order ID, returning true for isProUser');
            return true;
        }

        // Fall back to subscription check only if license validation failed/missing
        if (!email) {
            email = await this.getUserEmail(preventPrompt);
        }

        if (!email) {
            debugLog('No email available for subscription check and no valid license, returning false');
            return false;
        }

        const subscription = await this.getSubscriptionStatus(email);
        const result = subscription.isActive;
        debugLog(`Subscription check for ${email}: ${result}`);
        return result;
    }

    /**
     * Get subscription status for a user
     */    public async getSubscriptionStatus(email: string, forceRefresh = false): Promise<SubscriptionStatus> {
        debugLog(`getSubscriptionStatus called for ${email}, forceRefresh: ${forceRefresh}`);

        // First check if user has a valid license key - this takes priority over subscription validation
        const config = vscode.workspace.getConfiguration('gitmind');
        const validationStatus = config.get<string>('pro.validationStatus');
        const licenseKey = config.get<string>('pro.licenseKey');

        debugLog(`License check: validationStatus=${validationStatus}, hasLicenseKey=${!!licenseKey}`);

        if (validationStatus === 'valid' && licenseKey) {
            // User has a valid license, return Pro status
            debugLog(`User has valid license key, returning Pro status for ${email}`);
            const proStatus: SubscriptionStatus = {
                isActive: true,
                isPaused: false,
                isExpired: false,
                plan: 'pro'
            };

            // Update the config to reflect Pro status if it doesn't already
            const currentPlan = config.get<string>('subscription.plan');
            const currentStatus = config.get<string>('subscription.status');
            debugLog(`Current config: plan=${currentPlan}, status=${currentStatus}`);

            if (currentPlan !== 'pro' || currentStatus !== 'active') {
                debugLog('Updating subscription config to reflect license-based Pro status');
                await config.update('subscription.plan', 'pro', vscode.ConfigurationTarget.Global);
                await config.update('subscription.status', 'active', vscode.ConfigurationTarget.Global);
                debugLog('Updated subscription config to reflect license-based Pro status');
            }

            return proStatus;
        }

        const cacheKey = email.toLowerCase();
        const cached = this.subscriptionCache.get(cacheKey);

        // Return cached result if valid and not forcing refresh
        if (!forceRefresh && cached && new Date() < cached.cacheValidUntil) {
            debugLog(`Using cached subscription status for ${email}`);
            return cached.status;
        }

        // Prevent duplicate concurrent requests for the same email
        const ongoingRequestKey = `validation_${cacheKey}`;
        if (this.context && this.context.globalState.get(ongoingRequestKey)) {
            debugLog(`Subscription validation already in progress for ${email}, waiting...`);
            // Return cached result if available, otherwise return free status
            return cached?.status || { isActive: false, isPaused: false, isExpired: false, plan: 'free' };
        }

        // Mark validation as in progress
        if (this.context) {
            await this.context.globalState.update(ongoingRequestKey, true);
        }

        debugLog(`Fetching fresh subscription status for ${email}`);

        try {
            const status = await this.lemonSqueezy.validateSubscription(email);

            // Cache the result
            const userSubscription: UserSubscription = {
                email,
                status,
                lastChecked: new Date(),
                cacheValidUntil: new Date(Date.now() + this.cacheExpiration)
            };

            this.subscriptionCache.set(cacheKey, userSubscription);
            await this.saveCachedSubscriptions();

            // Save subscription status to VSCode configuration
            await this.saveSubscriptionStatusToConfig(status);

            return status;
        } catch (error) {
            debugLog('Failed to get subscription status:', error);

            // Return cached result if available, otherwise return free status (not expired)
            if (cached) {
                return cached.status;
            }

            const freeStatus = { isActive: false, isPaused: false, isExpired: false, plan: 'free' };

            // Save free status to VSCode configuration on error
            await this.saveSubscriptionStatusToConfig(freeStatus);

            return freeStatus;
        } finally {
            // Clear the ongoing request flag
            if (this.context) {
                await this.context.globalState.update(ongoingRequestKey, undefined);
            }
        }
    }

    /**
     * Get user's email from various sources
     */
    public async getUserEmail(preventPrompt: boolean = false): Promise<string | undefined> {
        // Check if email is stored in settings
        const config = vscode.workspace.getConfiguration('gitmind');
        let email = config.get<string>('subscription.email');

        if (email) {
            return email;
        }

        // Try to get email from Git config
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
            if (gitExtension) {
                const repo = gitExtension.getRepository(vscode.workspace.workspaceFolders?.[0]?.uri);
                if (repo) {
                    const gitConfig = repo.repository.getConfig();
                    email = gitConfig?.get('user.email');
                    if (email) {
                        debugLog(`Found email from Git config: ${email}`);
                        return email;
                    }
                }
            }
        } catch (error) {
            debugLog('Failed to get email from Git config:', error);
        }

        // Prompt user for email if not prevented
        if (!preventPrompt) {
            return await this.promptForEmail();
        }
        return undefined;
    }

    /**
     * Set user's email for subscription
     */
    public async setUserEmail(email: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('gitmind');
        const previousEmail = config.get<string>('subscription.email');
        const previousStatus = config.get<string>('subscription.status');

        // Clear subscription status in config
        await config.update('subscription.status', undefined, vscode.ConfigurationTarget.Global);
        await config.update('subscription.plan', undefined, vscode.ConfigurationTarget.Global);
        // Set new email
        await config.update('subscription.email', email, vscode.ConfigurationTarget.Global);
        // Clear cache
        this.subscriptionCache.clear();
        // Clear secure storage
        await this.clearSecureSubscriptionDetails();
        // Force refresh subscription status
        const newStatus = await this.getSubscriptionStatus(email, true);

        // Check if user transitioned from pro to free and notify UI to update
        if (previousEmail && previousStatus === 'active' && newStatus.isActive === false) {
            await this.handleProToFreeTransition();
        }

        debugLog(`User email changed to ${email}, cleared subscription status and cache`);
    }

    /**
     * Start subscription process
     */
    public async startSubscription(): Promise<void> {
        // Open the stable public checkout link directly. This does NOT require the
        // products API (which can fail even with a valid key), so "Buy" always works.
        const checkoutUrl = this.lemonSqueezy.buildCheckoutUrl(
            // Prefill the email if we already know it, but never block on it —
            // the checkout page collects the email itself.
            await this.getUserEmail(true)
        );

        try {
            await vscode.env.openExternal(vscode.Uri.parse(checkoutUrl));
        } catch (error) {
            debugLog('Failed to open checkout URL:', error);
            const copy = 'Copy Checkout Link';
            const choice = await vscode.window.showErrorMessage(
                'Could not open the GitMind Pro checkout automatically.',
                copy
            );
            if (choice === copy) {
                await vscode.env.clipboard.writeText(LemonSqueezyService.CHECKOUT_URL);
                vscode.window.showInformationMessage('Checkout link copied to clipboard.');
            }
            return;
        }

        // After paying, the user receives a license key by email and enters it here.
        const enterKey = 'Enter License Key';
        const openAgain = 'Open Checkout Again';

        const action = await vscode.window.showInformationMessage(
            `🚀 GitMind Pro checkout opened!\n\nComplete your purchase in the browser window. You'll receive a license key by email — click "Enter License Key" to activate.`,
            { modal: false },
            enterKey,
            openAgain
        );

        if (action === enterKey) {
            await vscode.commands.executeCommand('gitmind.activateWithLicenseKey');
        } else if (action === openAgain) {
            await vscode.env.openExternal(vscode.Uri.parse(checkoutUrl));
        }
    }

    /**
     * Refresh subscription status
     */
    public async refreshSubscription(): Promise<void> {
        const email = await this.getUserEmail();
        if (!email) {
            vscode.window.showWarningMessage('No email configured for subscription check.');
            return;
        }

        try {
            const status = await this.getSubscriptionStatus(email, true);

            if (status.isActive) {
                vscode.window.showInformationMessage('✅ GitMind Pro subscription is active! Enjoy your premium features.');

                // Trigger migration to secure storage if encryption is available
                vscode.commands.executeCommand('gitmind.handleUserStatusChange');
            } else if (status.isPaused) {
                vscode.window.showWarningMessage('⏸️ Your GitMind Pro subscription is paused. Some features may be limited.');
            } else {
                vscode.window.showInformationMessage('No active GitMind Pro subscription found. Consider upgrading for premium features.');
            }
        } catch (error) {
            debugLog('Failed to refresh subscription:', error);
            vscode.window.showErrorMessage('Failed to check subscription status. Please try again.');
        }
    }

    /**
     * Manage subscription (open customer portal or settings)
     */
    public async manageSubscription(): Promise<void> {
        // If they have a valid license key, opening the settings view is appropriate
        const config = vscode.workspace.getConfiguration('gitmind');
        const validationStatus = config.get<string>('pro.validationStatus');
        const licenseKey = config.get<string>('pro.licenseKey');

        if (validationStatus === 'valid' && licenseKey) {
            vscode.commands.executeCommand('gitmind.openSettings');
            return;
        }

        const email = await this.getUserEmail();
        if (!email) {
            vscode.window.showWarningMessage('No email configured for subscription management.');
            return;
        }

        try {
            const portalUrl = await this.lemonSqueezy.getCustomerPortalUrl(email);

            if (portalUrl) {
                await vscode.env.openExternal(vscode.Uri.parse(portalUrl));
            } else {
                vscode.window.showErrorMessage('Could not find your subscription. Please contact support.');
            }
        } catch (error) {
            debugLog('Failed to open customer portal:', error);
            vscode.window.showErrorMessage('Failed to open subscription management. Please try again.');
        }
    }

    /**
     * Clear subscription cache
     */
    public clearCache(): void {
        this.subscriptionCache.clear();
        if (this.context) {
            this.context.globalState.update('subscriptionCache', undefined);

            // Also clear secure storage subscription details
            if (this.context.secrets) {
                // Use void to properly handle the Promise without awaiting
                void (async () => {
                    try {
                        await this.context!.secrets.delete('subscription_details');
                        debugLog('Cleared secure subscription details');
                    } catch (error) {
                        debugLog('Failed to clear secure subscription details:', error);
                    }
                })();
            }
        }
    }

    /**
     * Get detailed subscription information from secure storage
     * This provides access to the full subscription details that were securely stored
     */
    private async getSecureSubscriptionDetails(): Promise<SubscriptionStatus | null> {
        try {
            if (!this.context?.secrets) {
                return null;
            }

            const secureDetails = await this.context.secrets.get('subscription_details');
            if (!secureDetails) {
                return null;
            }

            const parsedDetails = JSON.parse(secureDetails);
            return parsedDetails.status;
        } catch (error) {
            debugLog('Failed to retrieve secure subscription details:', error);
            return null;
        }
    }

    /**
     * Clears subscription details from secure storage
     */
    private async clearSecureSubscriptionDetails(): Promise<void> {
        if (!this.context) {
            return;
        }

        try {
            if (!this.context?.secrets) {
                return;
            }

            await this.context.secrets.delete('gitmind.subscription.details');
        } catch (error) {
            console.error('Failed to clear secure subscription details:', error);
        }
    }

    /**
     * Handles the transition from Pro to Free user status
     * Disables pro features and notifies the UI to update
     */
    private async handleProToFreeTransition(): Promise<void> {
        try {
            // Disable pro features in configuration
            const config = vscode.workspace.getConfiguration('gitmind');
            await config.update('pro.encryptionEnabled', false, vscode.ConfigurationTarget.Global);

            // Notify the settings webview to update if it's open
            if (SettingsWebview.isWebviewOpen()) {
                SettingsWebview.postMessageToWebview({
                    command: 'proStatusChanged',
                    status: 'free',
                    message: 'Subscription status changed to free. Pro features have been disabled.'
                });
            }

            // Show notification to user
            vscode.window.showInformationMessage('GitMind: Switched to Free mode. Pro features have been disabled.');

            // Migrate any encrypted keys back to plain text if needed
            const secureKeyManager = SecureKeyManager.getInstance();
            await secureKeyManager.migrateToPlainText();

        } catch (error) {
            console.error('Failed to handle Pro to Free transition:', error);
        }
    }

    // Private helper methods

    private async promptForEmail(): Promise<string | undefined> {
        const email = await vscode.window.showInputBox({
            title: 'GitMind Pro Subscription',
            prompt: 'Enter your email address for subscription management',
            placeHolder: 'your-email@example.com',
            validateInput: (value) => {
                if (!value || !value.includes('@')) {
                    return 'Please enter a valid email address';
                }
                return null;
            }
        });

        if (email) {
            await this.setUserEmail(email);
        }

        return email;
    }

    private async loadCachedSubscriptions(): Promise<void> {
        if (!this.context) {
            return;
        }

        try {
            const cached = this.context.globalState.get<{ [email: string]: UserSubscription }>('subscriptionCache');
            if (cached) {
                // Convert to Map and filter out expired entries
                const now = new Date();
                Object.entries(cached).forEach(([email, subscription]) => {
                    if (new Date(subscription.cacheValidUntil) > now) {
                        this.subscriptionCache.set(email, {
                            ...subscription,
                            lastChecked: new Date(subscription.lastChecked),
                            cacheValidUntil: new Date(subscription.cacheValidUntil)
                        });
                    }
                });
            }
        } catch (error) {
            debugLog('Failed to load cached subscriptions:', error);
        }
    }

    private async saveCachedSubscriptions(): Promise<void> {
        if (!this.context) {
            return;
        }

        try {
            const cacheObject: { [email: string]: UserSubscription } = {};
            this.subscriptionCache.forEach((subscription, email) => {
                cacheObject[email] = subscription;
            });

            await this.context.globalState.update('subscriptionCache', cacheObject);
        } catch (error) {
            debugLog('Failed to save cached subscriptions:', error);
        }
    }

    /**
     * Save subscription status to VSCode configuration and secure storage
     * This ensures the UI and features reflect the correct subscription status
     * while also securely storing sensitive subscription details
     */
    private async saveSubscriptionStatusToConfig(status: SubscriptionStatus): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('gitmind');

            // Update subscription status in VSCode configuration (minimal info needed for UI)
            await config.update('subscription.status', status.isActive ? 'active' : 'free', vscode.ConfigurationTarget.Global);
            await config.update('subscription.plan', status.plan, vscode.ConfigurationTarget.Global);

            // Store full subscription details in secure storage if available
            if (this.context?.secrets) {
                // Store detailed subscription info securely
                const subscriptionDetails = JSON.stringify({
                    status: status,
                    lastUpdated: new Date().toISOString()
                });

                await this.context.secrets.store('subscription_details', subscriptionDetails);
                debugLog('Saved detailed subscription information to secure storage');
            }

            debugLog(`Saved subscription status to config: ${status.isActive ? 'active' : 'free'}, plan: ${status.plan}`);
        } catch (error) {
            debugLog('Failed to save subscription status to config:', error);
        }
    }
}
