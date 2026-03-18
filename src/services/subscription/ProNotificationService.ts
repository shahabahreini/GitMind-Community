import * as vscode from 'vscode';
import { SubscriptionManager } from './SubscriptionManager';
import { debugLog } from '../debug/logger';

export class ProNotificationService {
    private static instance: ProNotificationService;
    private context: vscode.ExtensionContext | undefined;
    private readonly MUTED_UNTIL_KEY = 'gitmind.proNotificationMutedUntil';
    private readonly SNOOZE_DURATION_MS = 21 * 24 * 60 * 60 * 1000; // 3 weeks

    private readonly PRO_FEATURES = [
        "Unlock premium AI models natively like Claude 3.5 Sonnet, GPT-4o, and Gemini 1.5 Pro.",
        "Secure your workflow with End-to-End Encryption for all your API keys.",
        "Access unlimited AI commit generations and advanced features to boost productivity.",
        "Get early access to all new GitMind features and prioritized support."
    ];

    // Discount Configuration - update these values before publishing to apply a promo
    private readonly DISCOUNT_CODE = 'K2NZIWNW';
    private readonly DISCOUNT_PERCENT = 15;
    private readonly DISCOUNT_EXPIRY = new Date('2026-06-01T00:00:00Z'); // Valid UNTIL end of May 2026 (thus exp = June 1)

    private constructor() {}

    public static getInstance(): ProNotificationService {
        if (!ProNotificationService.instance) {
            ProNotificationService.instance = new ProNotificationService();
        }
        return ProNotificationService.instance;
    }

    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        // Delay the check slightly so it doesn't interrupt immediate startup tasks
        setTimeout(() => this.checkAndShowNotification(), 10000); // 10 seconds delay
    }

    private async checkAndShowNotification(): Promise<void> {
        if (!this.context) {
            return;
        }

        try {
            const subscriptionManager = SubscriptionManager.getInstance();
            const isPro = await subscriptionManager.isProUser(undefined, true);

            if (isPro) {
                // User is already pro, do nothing
                return;
            }

            const mutedUntil = this.context.globalState.get<number>(this.MUTED_UNTIL_KEY);
            const now = Date.now();

            if (mutedUntil && now < mutedUntil) {
                const remainingDays = Math.ceil((mutedUntil - now) / (1000 * 60 * 60 * 24));
                debugLog(`Pro notification is muted for another ${remainingDays} days.`);
                return;
            }

            // Pick a random feature to highlight
            const randomFeature = this.PRO_FEATURES[Math.floor(Math.random() * this.PRO_FEATURES.length)];
            
            let message = `GitMind: Upgrade to Pro! ${randomFeature}`;

            // Check if there is an active discount
            if (new Date() < this.DISCOUNT_EXPIRY) {
                const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
                const expiryString = this.DISCOUNT_EXPIRY.toLocaleDateString(undefined, options);
                message += ` 🎉 Use code ${this.DISCOUNT_CODE} for ${this.DISCOUNT_PERCENT}% OFF! (Valid until ${expiryString})`;
            }

            const buyAction = "Buy GitMind Pro";
            const snoozeAction = "Don't show it for 3 weeks";

            const selection = await vscode.window.showInformationMessage(
                message,
                buyAction,
                snoozeAction
            );

            if (selection === buyAction) {
                vscode.env.openExternal(vscode.Uri.parse('https://gitmind.app/pricing'));
                // Trigger the subscription manager start if applicable, or just let them buy on site
                subscriptionManager.startSubscription().catch(e => debugLog('Failed to start sub', e));
            } else if (selection === snoozeAction) {
                await this.context.globalState.update(this.MUTED_UNTIL_KEY, now + this.SNOOZE_DURATION_MS);
                debugLog('Pro notification snoozed for 3 weeks.');
            }

        } catch (error) {
            debugLog('Error in checking/showing pro notification:', error);
        }
    }
}
