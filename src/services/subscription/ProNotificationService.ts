import * as vscode from 'vscode';
import { SubscriptionManager } from './SubscriptionManager';
import { GitMindLicenseService } from './GitMindLicenseService';
import { LegacyEntitlementService } from './LegacyEntitlementService';
import { debugLog } from '../debug/logger';

export const EXTENSION_ID = 'ShahabBahreiniJangjoo.ai-commit-assistant';
export const MIGRATION_GUIDE_URL = 'https://gitmind-pro.com/migrate';

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

    private constructor() { }

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
            // Customers inherited from the suspended Lemon Squeezy store keep Pro, but they
            // are the people who most need to hear what happened — so they get the migration
            // notice rather than an upsell they already paid for.
            if (LegacyEntitlementService.getInstance().hasActiveEntitlement()) {
                await this.showMigrationNotice();
                return;
            }

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

            const message = `GitMind: Upgrade to Pro! ${randomFeature}`;

            const buyAction = "Buy GitMind Pro";
            const activateAction = "Already purchased? Activate";
            const snoozeAction = "Don't show it for 3 weeks";

            const selection = await vscode.window.showInformationMessage(
                message,
                buyAction,
                activateAction,
                snoozeAction
            );

            if (selection === buyAction) {
                vscode.env.openExternal(vscode.Uri.parse(GitMindLicenseService.CHECKOUT_URL));
                // Also open the Settings UI on the "Pro Activation" tab so the user can
                // activate right after purchasing without hunting for where to enter the key.
                vscode.commands.executeCommand('gitmind.openSettings', 'subscription-tab');
            } else if (selection === activateAction) {
                vscode.commands.executeCommand('gitmind.showActivationQuickPick');
            } else if (selection === snoozeAction) {
                await this.context.globalState.update(this.MUTED_UNTIL_KEY, now + this.SNOOZE_DURATION_MS);
                debugLog('Pro notification snoozed for 3 weeks.');
            }

        } catch (error) {
            debugLog('Error in checking/showing pro notification:', error);
        }
    }

    /**
     * Tells a grandfathered Lemon Squeezy customer where they stand, once per release.
     *
     * Pacing this to extension updates rather than to a timer means it can never nag daily,
     * and an update is when people are already paying attention to the extension. The tone is
     * deliberately reassuring first: their Pro is not at risk, and the message must never read
     * as a licensing problem they have to fix today.
     */
    private async showMigrationNotice(): Promise<void> {
        const legacy = LegacyEntitlementService.getInstance();
        const version =
            vscode.extensions.getExtension(EXTENSION_ID)?.packageJSON?.version ?? 'unknown';

        if (!legacy.shouldShowMigrationNotice(version)) {
            return;
        }
        await legacy.recordMigrationNotice(version);

        const claim = 'Claim free key';
        const learnMore = 'What happened?';
        const dismiss = 'Not now';

        const selection = await vscode.window.showInformationMessage(
            'GitMind Pro is active and staying that way — nothing is broken and there is nothing ' +
            'you must do. Our old payment provider closed our store, so we have moved. Claim a ' +
            'free replacement key (no charge) to restore online validation and manage your devices.',
            claim,
            learnMore,
            dismiss
        );

        if (selection === claim) {
            // Claim in place. The old flow sent them to a browser to retype a UUID and copy a
            // key back; this asks them to confirm an email address and does the rest.
            void vscode.commands.executeCommand('gitmind.claimFreeLicense');
        } else if (selection === learnMore) {
            void vscode.env.openExternal(vscode.Uri.parse(MIGRATION_GUIDE_URL));
        }

        debugLog(`Migration notice shown for version ${version}`);
    }
}
