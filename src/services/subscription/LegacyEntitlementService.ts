import * as vscode from 'vscode';
import { debugLog } from '../debug/logger';

/**
 * A Pro entitlement inherited from the Lemon Squeezy era.
 *
 * The Lemon Squeezy store was suspended and its License API can no longer confirm that
 * these customers paid — the merchant API key is expired and no export was possible. The
 * only surviving evidence a customer bought Pro lives on their own machine, so we capture
 * it once, durably, and honor it for good. `migrated` flips to true once they redeem a
 * replacement key from the new provider, at which point the normal license path takes over.
 */
export interface LegacyEntitlement {
    legacyKey?: string;
    email?: string;
    detectedAt: string;
    source: 'lemonsqueezy';
    migrated: boolean;
}

const ENTITLEMENT_KEY = 'gitmind.pro.legacyEntitlement';
const NOTICE_VERSION_KEY = 'gitmind.pro.lastMigrationNoticeVersion';
const NOTICE_COUNT_KEY = 'gitmind.pro.migrationNoticeCount';
const NOTICE_DISMISSED_KEY = 'gitmind.pro.migrationNoticeDismissed';

/** Lemon Squeezy issues license keys as UUIDs. */
const LEMON_SQUEEZY_KEY_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GitMind (Polar-era) keys look like A7K2M-XR4PT-9WQND-3HJ5V. */
const GITMIND_KEY_PATTERN = /^[A-Z0-9]{5}(-[A-Z0-9]{5}){3}$/i;

export class LegacyEntitlementService {
    private static instance: LegacyEntitlementService;
    private context: vscode.ExtensionContext | undefined;
    private cached: LegacyEntitlement | undefined;

    private constructor() { }

    public static getInstance(): LegacyEntitlementService {
        if (!LegacyEntitlementService.instance) {
            LegacyEntitlementService.instance = new LegacyEntitlementService();
        }
        return LegacyEntitlementService.instance;
    }

    /**
     * Must run before the first isProUser() call of the session, since that check is
     * synchronous and reads the cache this populates.
     */
    public async initialize(context: vscode.ExtensionContext): Promise<void> {
        this.context = context;
        this.cached = context.globalState.get<LegacyEntitlement>(ENTITLEMENT_KEY);
        await this.detectAndGrandfather();
    }

    /**
     * Grants Pro while the customer has not yet moved to a replacement key. Synchronous so
     * that isProUser() can consult it.
     */
    public hasActiveEntitlement(): boolean {
        return !!this.cached && !this.cached.migrated;
    }

    public getEntitlement(): LegacyEntitlement | undefined {
        return this.cached;
    }

    public async markMigrated(): Promise<void> {
        if (!this.context || !this.cached) {
            return;
        }
        this.cached = { ...this.cached, migrated: true };
        await this.context.globalState.update(ENTITLEMENT_KEY, this.cached);
        await this.context.globalState.update(NOTICE_COUNT_KEY, undefined);
        debugLog('Legacy entitlement marked as migrated');
    }

    public async clearEntitlement(): Promise<void> {
        if (!this.context) {
            return;
        }
        this.cached = undefined;
        await this.context.globalState.update(ENTITLEMENT_KEY, undefined);
        await this.context.globalState.update(NOTICE_COUNT_KEY, undefined);
        await this.context.globalState.update(NOTICE_DISMISSED_KEY, undefined);
        debugLog('Legacy entitlement cleared');
    }

    /**
     * The Lemon Squeezy chapter is over for this user: a live server has vouched for a
     * real GitMind key. Archive the entitlement (kept with migrated:true as local
     * evidence, per "remove or archive — just in case") and scrub every LS-era leftover,
     * so from here on this user is indistinguishable from a fresh customer and no
     * legacy branch ever fires for them again.
     */
    public async retireLegacyState(): Promise<void> {
        if (!this.context) {
            return;
        }

        const hadLegacyTraces = this.cached !== undefined;

        if (this.cached && !this.cached.migrated) {
            await this.markMigrated();
        }

        await this.context.globalState.update(NOTICE_COUNT_KEY, undefined);
        await this.context.globalState.update(NOTICE_VERSION_KEY, undefined);
        await this.context.globalState.update(NOTICE_DISMISSED_KEY, undefined);

        // pro.orderId only ever held a Lemon Squeezy order id.
        try {
            const config = vscode.workspace.getConfiguration('gitmind');
            if (config.get<string>('pro.orderId')) {
                await config.update('pro.orderId', undefined, vscode.ConfigurationTarget.Global);
            }
        } catch (error) {
            debugLog('Could not clear the legacy order id:', error);
        }

        if (hadLegacyTraces) {
            debugLog('Legacy Lemon Squeezy state retired');
        }
    }

    /** Stops the migration notice permanently without touching the entitlement. */
    public async dismissMigrationNotice(): Promise<void> {
        await this.context?.globalState.update(NOTICE_DISMISSED_KEY, true);
    }

    public getMigrationNoticeCount(): number {
        return this.context?.globalState.get<number>(NOTICE_COUNT_KEY) ?? 0;
    }

    public async incrementMigrationNoticeCount(): Promise<number> {
        const nextCount = this.getMigrationNoticeCount() + 1;
        await this.context?.globalState.update(NOTICE_COUNT_KEY, nextCount);
        return nextCount;
    }

    /**
     * True while there is genuinely something to migrate AND the user has not told us
     * to stop asking. Notably false once a real GitMind key validates — the claim
     * already happened through another door — and capped so the notice can never
     * become the every-launch nag it once was.
     */
    public shouldShowMigrationNotice(_currentVersion?: string): boolean {
        if (!this.context || !this.hasActiveEntitlement()) {
            return false;
        }
        if (this.context.globalState.get<boolean>(NOTICE_DISMISSED_KEY) === true) {
            return false;
        }
        // A working REPLACEMENT license means migration is effectively done even if
        // the record has not been flipped yet (it will be, on the next validation).
        // The key shape matters: 'valid' alone is exactly the stale LS-era setting
        // that grandfathering keys off, so it must not silence the notice by itself.
        const config = vscode.workspace.getConfiguration('gitmind');
        const storedKey = config.get<string>('pro.licenseKey');
        if (config.get<string>('pro.validationStatus') === 'valid'
            && !!storedKey && GITMIND_KEY_PATTERN.test(storedKey.trim())) {
            return false;
        }
        // Three unanswered notices are enough; after that the claim stays available
        // from the command palette and the settings view, silently.
        if (this.getMigrationNoticeCount() >= 3) {
            return false;
        }
        return true;
    }

    public async recordMigrationNotice(currentVersion: string): Promise<void> {
        await this.context?.globalState.update(NOTICE_VERSION_KEY, currentVersion);
    }

    /**
     * Captures proof-of-purchase from local state exactly once.
     *
     * Deliberately accepts a stored license key even when validationStatus is already
     * 'invalid' or 'error': customers whose VS Code re-validated against the dead Lemon
     * Squeezy API before this update landed have *already* been demoted, and they are
     * precisely the people this exists to rescue. A key is only trusted if it matches the
     * Lemon Squeezy UUID shape, so stray text in the license field grants nothing.
     */
    private async detectAndGrandfather(): Promise<void> {
        if (!this.context || this.cached) {
            return;
        }

        const config = vscode.workspace.getConfiguration('gitmind');
        const validationStatus = config.get<string>('pro.validationStatus');
        const subscriptionStatus = config.get<string>('subscription.status');
        const email = config.get<string>('subscription.email');

        const legacyKey = await this.findStoredLicenseKey(config);
        const hadWorkingLicense =
            validationStatus === 'valid' || subscriptionStatus === 'active';

        if (!legacyKey && !hadWorkingLicense) {
            return;
        }

        const entitlement: LegacyEntitlement = {
            legacyKey,
            email,
            detectedAt: new Date().toISOString(),
            source: 'lemonsqueezy',
            migrated: false
        };

        await this.context.globalState.update(ENTITLEMENT_KEY, entitlement);
        this.cached = entitlement;

        debugLog(
            `Grandfathered a Lemon Squeezy Pro user (key: ${legacyKey ? 'present' : 'absent'}, ` +
            `priorStatus: ${validationStatus ?? 'none'})`
        );
    }

    private async findStoredLicenseKey(
        config: vscode.WorkspaceConfiguration
    ): Promise<string | undefined> {
        const candidates: (string | undefined)[] = [config.get<string>('pro.licenseKey')];

        try {
            candidates.push(await this.context?.secrets.get('gitmind.pro.licenseKey'));
        } catch (error) {
            debugLog('Could not read the license key from secret storage:', error);
        }

        return candidates.find(
            (key): key is string => !!key && LEMON_SQUEEZY_KEY_PATTERN.test(key.trim())
        )?.trim();
    }
}
