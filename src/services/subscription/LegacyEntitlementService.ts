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

/** Lemon Squeezy issues license keys as UUIDs. */
const LEMON_SQUEEZY_KEY_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
        debugLog('Legacy entitlement cleared');
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
     * Returns true whenever an un-migrated legacy entitlement is active so that
     * the migration prompt can run on extension startup until claimed.
     */
    public shouldShowMigrationNotice(_currentVersion?: string): boolean {
        if (!this.context || !this.hasActiveEntitlement()) {
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
