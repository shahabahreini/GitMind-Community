// src/services/subscription/SubscriptionManager.ts
import * as vscode from 'vscode';
import type { SubscriptionStatus } from './licenseTypes';
import { GitMindLicenseService } from './GitMindLicenseService';
import { debugLog } from '../debug/logger';
import { SecureKeyManager } from '../encryption/SecureKeyManager';
import { SettingsWebview } from '../../webview/settings/SettingsWebview';
import { isProUser as sharedIsProUser } from '../../utils/proHelpers';

/** A user without a valid license key is Free. Pro is granted by the license, not by a
 *  subscription lookup — GitMind Pro is a one-time purchase, so there is nothing to poll. */
const FREE_STATUS: SubscriptionStatus = { isActive: false, isPaused: false, isExpired: false, plan: 'free' };

export interface UserSubscription {
    email: string;
    status: SubscriptionStatus;
    lastChecked: Date;
    cacheValidUntil: Date;
}

/**
 * Manages the cached Pro/Free state derived from the user's license key.
 */
export class SubscriptionManager {
    private static instance: SubscriptionManager;
    private context: vscode.ExtensionContext | undefined;
    private subscriptionCache: Map<string, UserSubscription> = new Map();
    private readonly cacheExpiration = 5 * 60 * 1000; // 5 minutes

    private constructor() { }

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
        // Delegates to the one authority in proHelpers rather than re-deriving entitlement.
        // This used to carry its own subtly different rules, which meant a grandfathered
        // customer could read as Pro in one part of the UI and Free in another.
        void email;
        void preventPrompt;
        return sharedIsProUser();
    }

    /**
     * Get subscription status for a user
     */    public async getSubscriptionStatus(email: string, forceRefresh = false): Promise<SubscriptionStatus> {
        debugLog(`getSubscriptionStatus called for ${email}, forceRefresh: ${forceRefresh}`);

        // First check if user has a valid license key - this takes priority over subscription validation
        const config = vscode.workspace.getConfiguration('gitmind');
        const validationStatus = config.get<string>('pro.validationStatus');
        const licenseKey = config.get<string>('pro.licenseKey');
        const legacyOrderId = config.get<string>('pro.orderId');
        const legacySubscriptionStatus = config.get<string>('subscription.status');

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

        if ((validationStatus === 'valid' && legacyOrderId) || legacySubscriptionStatus === 'active') {
            return { isActive: true, isPaused: false, isExpired: false, plan: 'pro-legacy' };
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
        const lockTime = this.context?.globalState.get<number>(ongoingRequestKey);
        if (lockTime && Math.abs(Date.now() - lockTime) < 30000) {
            debugLog(`Subscription validation already in progress for ${email}, waiting...`);
            // Return cached result if available, otherwise return free status
            return cached?.status || FREE_STATUS;
        }

        // Mark validation as in progress
        if (this.context) {
            await this.context.globalState.update(ongoingRequestKey, Date.now());
        }

        debugLog(`Fetching fresh subscription status for ${email}`);

        try {
            // Pro is determined by the license key check above. Without one, the account is
            // Free — there is no subscription endpoint to poll for a one-time product.
            const status = FREE_STATUS;

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
        const quick = 'Quick checkout — enter email here';
        const details = 'View pricing details on website';
        if (await vscode.window.showQuickPick([quick, details], { placeHolder: 'Buy GitMind Pro' }) !== quick) {
            await vscode.env.openExternal(vscode.Uri.parse(GitMindLicenseService.CHECKOUT_URL));
            return;
        }
        const email = await vscode.window.showInputBox({ prompt: 'Email for your GitMind Pro license', value: await this.getUserEmail(true), validateInput: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'Enter a valid email address.' });
        if (!email) return;
        const checkout = await GitMindLicenseService.getInstance().createCheckout(email);
        if (!checkout.ok) { vscode.window.showErrorMessage(`${checkout.error} Opening pricing details instead.`); await vscode.env.openExternal(vscode.Uri.parse(GitMindLicenseService.CHECKOUT_URL)); return; }

        // Remember the email so the settings panel can show which address the
        // license belongs to, and remember the checkout so payment confirmation can
        // be re-checked later — the server keeps the session alive for an hour, far
        // longer than anyone keeps a progress notification open.
        const config = vscode.workspace.getConfiguration('gitmind');
        await config.update('subscription.email', email.trim(), vscode.ConfigurationTarget.Global);
        await this.context?.globalState.update(SubscriptionManager.PENDING_CHECKOUT_KEY, {
            checkoutRef: checkout.checkoutRef,
            pollToken: checkout.pollToken,
            email: email.trim(),
            createdAt: Date.now(),
        });

        await vscode.env.openExternal(vscode.Uri.parse(checkout.checkoutUrl));
        const outcome = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Waiting for GitMind Pro payment… (you can close this — GitMind keeps checking)', cancellable: true }, async (_progress, cancellation) => {
            const deadline = Date.now() + 900_000;
            while (Date.now() < deadline && !cancellation.isCancellationRequested) {
                const status = await GitMindLicenseService.getInstance().pollCheckoutStatus(checkout.checkoutRef, checkout.pollToken);
                if (status.status === 'paid' && status.licenseKey) return { paid: status.licenseKey };
                if (status.status === 'expired') return { expired: true };
                // 'error' is inconclusive — back off a little and keep waiting.
                await new Promise(resolve => setTimeout(resolve, status.status === 'error' ? 10_000 : 5_000));
            }
            return {};
        });

        if (outcome.paid) {
            await this.completePendingCheckout(outcome.paid);
        } else if (outcome.expired) {
            await this.context?.globalState.update(SubscriptionManager.PENDING_CHECKOUT_KEY, undefined);
            vscode.window.showWarningMessage('The checkout session expired before payment was completed. No charge was made — you can start again any time.', 'Buy GitMind Pro').then(choice => { if (choice === 'Buy GitMind Pro') void vscode.commands.executeCommand('gitmind.subscribe'); });
        } else {
            vscode.window.showInformationMessage('Payment confirmation has not reached GitMind yet. If you completed the payment, use "Check payment status" in a moment — GitMind also re-checks automatically on the next start. Your license and account details will be emailed either way.', 'Check payment status', 'Open Account Portal').then(choice => {
                if (choice === 'Check payment status') void this.resumePendingCheckout({ silent: false });
                if (choice === 'Open Account Portal') void vscode.commands.executeCommand('gitmind.openAccountPortal');
            });
        }
        void vscode.commands.executeCommand('gitmind.refreshSubscription', { silent: true });
    }

    private static readonly PENDING_CHECKOUT_KEY = 'gitmind.pendingCheckout';

    /** Server-side checkout sessions live for one hour. */
    private static readonly PENDING_CHECKOUT_TTL_MS = 60 * 60 * 1000;

    /**
     * Re-check a checkout that was paid (or abandoned) after the progress
     * notification was cancelled or timed out.
     *
     * This exists because the original flow had exactly one shot: if the poll loop
     * ended before the payment confirmation reached the server, the buyer was told
     * to wait for an email even though the server would happily hand over the key
     * for another hour. Called from the "Check payment status" button and once,
     * silently, on extension startup.
     */
    public async resumePendingCheckout(options: { silent?: boolean } = {}): Promise<void> {
        const pending = this.context?.globalState.get<{ checkoutRef: string; pollToken: string; email: string; createdAt: number }>(SubscriptionManager.PENDING_CHECKOUT_KEY);
        if (!pending) {
            if (!options.silent) vscode.window.showInformationMessage('There is no pending GitMind Pro checkout to check.');
            return;
        }
        if (Date.now() - pending.createdAt > SubscriptionManager.PENDING_CHECKOUT_TTL_MS) {
            await this.context?.globalState.update(SubscriptionManager.PENDING_CHECKOUT_KEY, undefined);
            if (!options.silent) vscode.window.showInformationMessage('The previous checkout session has expired. If you paid, activate with the key from your email — or contact support and we will sort it out.', 'Enter License Key').then(choice => { if (choice === 'Enter License Key') void vscode.commands.executeCommand('gitmind.showActivationQuickPick'); });
            return;
        }

        const status = await GitMindLicenseService.getInstance().pollCheckoutStatus(pending.checkoutRef, pending.pollToken);
        if (status.status === 'paid' && status.licenseKey) {
            await this.completePendingCheckout(status.licenseKey);
            void vscode.commands.executeCommand('gitmind.refreshSubscription', { silent: true });
            return;
        }
        if (status.status === 'expired') {
            await this.context?.globalState.update(SubscriptionManager.PENDING_CHECKOUT_KEY, undefined);
            if (!options.silent) vscode.window.showInformationMessage('That checkout was not completed and has expired. No charge was made.');
            return;
        }
        if (!options.silent) {
            vscode.window.showInformationMessage(status.status === 'pending'
                ? 'Payment has not been confirmed yet. If you just paid, give it a few seconds and check again.'
                : 'Could not reach the licence server to check. Your payment state is unaffected — try again in a moment.');
        }
    }

    /** Payment confirmed: activate the freshly minted key and clear the pending state. */
    private async completePendingCheckout(licenseKey: string): Promise<void> {
        await this.context?.globalState.update(SubscriptionManager.PENDING_CHECKOUT_KEY, undefined);
        const result = await (await import('./ProActivationService.js')).ProActivationService.getInstance().activateWithLicenseKey(licenseKey);
        vscode.window.showInformationMessage(result.success ? '✅ Pro activated on this machine. Account details were emailed to you.' : result.message, 'Manage Devices').then(choice => { if (choice === 'Manage Devices') void vscode.commands.executeCommand('gitmind.openAccountPortal'); });
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
        vscode.commands.executeCommand('gitmind.openSettings', 'subscription-tab');
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

            // Stored under 'subscription_details' (see storeSecureSubscriptionDetails);
            // 'gitmind.subscription.details' was never the write key, so deleting it
            // here left the real record behind on email change.
            await this.context.secrets.delete('subscription_details');
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
