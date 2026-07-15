import * as assert from 'assert';
import * as vscode from 'vscode';
import { LegacyEntitlementService } from '../../services/subscription/LegacyEntitlementService';
import { GitMindLicenseService } from '../../services/subscription/GitMindLicenseService';
import { ProActivationService } from '../../services/subscription/ProActivationService';
import { isProUser, isLegacyProUser } from '../../utils/proHelpers';
import { invalidateConfigCache } from '../../config/settings';

/**
 * Guards the Lemon Squeezy suspension response.
 *
 * The store was suspended and its License API can no longer vouch for anyone who paid. These
 * tests pin the two behaviors that keep those customers working: a validation that cannot
 * reach an answer must never downgrade them, and a purchase that predates the migration must
 * be recognized from local state alone.
 */
suite('Legacy Lemon Squeezy entitlement', () => {
    const LS_KEY = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

    let originalGetConfiguration: typeof vscode.workspace.getConfiguration;
    let originalFetch: typeof globalThis.fetch;
    let settings: Record<string, unknown>;
    let globalStateStore: Map<string, unknown>;
    let secretStore: Map<string, string>;

    /** Minimal stand-in for the pieces of ExtensionContext the service touches. */
    const createContext = (): vscode.ExtensionContext => ({
        globalState: {
            get: (key: string) => globalStateStore.get(key),
            update: async (key: string, value: unknown) => {
                if (value === undefined) {
                    globalStateStore.delete(key);
                } else {
                    globalStateStore.set(key, value);
                }
            }
        },
        secrets: {
            get: async (key: string) => secretStore.get(key)
        }
    } as unknown as vscode.ExtensionContext);

    const mockConfig = () => {
        vscode.workspace.getConfiguration = (() => ({
            get: (key: string, defaultValue?: unknown) =>
                key in settings ? settings[key] : defaultValue,
            update: async (key: string, value: unknown) => {
                settings[key] = value;
            },
            inspect: () => ({ key: '', defaultValue: undefined }),
            has: () => true
        })) as unknown as typeof vscode.workspace.getConfiguration;
        invalidateConfigCache();
    };

    /** The service is a singleton; each test needs a clean one. */
    const freshService = async (): Promise<LegacyEntitlementService> => {
        (LegacyEntitlementService as unknown as { instance?: unknown }).instance = undefined;
        const service = LegacyEntitlementService.getInstance();
        await service.initialize(createContext());
        return service;
    };

    setup(() => {
        originalGetConfiguration = vscode.workspace.getConfiguration;
        originalFetch = globalThis.fetch;
        settings = {};
        globalStateStore = new Map();
        secretStore = new Map();
        mockConfig();
    });

    teardown(() => {
        vscode.workspace.getConfiguration = originalGetConfiguration;
        globalThis.fetch = originalFetch;
        (LegacyEntitlementService as unknown as { instance?: unknown }).instance = undefined;
        invalidateConfigCache();
    });

    suite('detection', () => {
        test('grandfathers a customer who was Pro before the upgrade', async () => {
            settings['pro.validationStatus'] = 'valid';
            settings['pro.licenseKey'] = LS_KEY;

            const service = await freshService();

            assert.strictEqual(service.hasActiveEntitlement(), true);
            assert.strictEqual(isProUser(), true);
            assert.strictEqual(isLegacyProUser(), true);
        });

        test('rescues a customer the dead API already demoted to invalid', async () => {
            // The case that matters most: their VS Code re-validated against the suspended
            // store before this update landed, so they are already marked invalid. The stored
            // key is the only surviving proof they paid, and it must be enough.
            settings['pro.validationStatus'] = 'invalid';
            settings['pro.licenseKey'] = LS_KEY;

            const service = await freshService();

            assert.strictEqual(service.hasActiveEntitlement(), true);
            assert.strictEqual(isProUser(), true, 'a demoted paying customer must be restored');
        });

        test('finds a key that only exists in secret storage', async () => {
            settings['pro.licenseKey'] = '[ENCRYPTED]';
            secretStore.set('gitmind.pro.licenseKey', LS_KEY);

            const service = await freshService();

            assert.strictEqual(service.hasActiveEntitlement(), true);
            assert.strictEqual(service.getEntitlement()?.legacyKey, LS_KEY);
        });

        test('grants nothing to a user who never paid', async () => {
            const service = await freshService();

            assert.strictEqual(service.hasActiveEntitlement(), false);
            assert.strictEqual(isProUser(), false);
        });

        test('ignores junk typed into the license field', async () => {
            // Guards the migration window: only something shaped like a real Lemon Squeezy
            // key counts, so stray text cannot mint an entitlement.
            settings['pro.licenseKey'] = 'not-a-real-license-key';

            const service = await freshService();

            assert.strictEqual(service.hasActiveEntitlement(), false);
            assert.strictEqual(isProUser(), false);
        });

        test('a cleared entitlement stays cleared', async () => {
            settings['pro.validationStatus'] = 'valid';
            settings['pro.licenseKey'] = LS_KEY;
            const service = await freshService();

            await service.clearEntitlement();

            assert.strictEqual(service.hasActiveEntitlement(), false);
        });
    });

    suite('validation fails open', () => {
        test('a grandfathered license is never sent to the network', async () => {
            settings['pro.validationStatus'] = 'valid';
            settings['pro.licenseKey'] = LS_KEY;
            await freshService();

            let called = false;
            globalThis.fetch = (async () => {
                called = true;
                throw new Error('the Lemon Squeezy store is suspended');
            }) as unknown as typeof globalThis.fetch;

            const result = await ProActivationService.getInstance().validateExistingLicense();

            assert.strictEqual(called, false, 'the suspended API must not be contacted');
            assert.strictEqual(result, true);
            assert.strictEqual(isProUser(), true);
        });

        test('a network failure does not downgrade a paying customer', async () => {
            // No legacy record here — this is the plain fail-open rule, which must hold for
            // every customer, on every provider, forever.
            settings['pro.validationStatus'] = 'valid';
            settings['pro.licenseKey'] = LS_KEY;
            settings['pro.instanceId'] = 'instance-1';
            await freshService();
            await LegacyEntitlementService.getInstance().clearEntitlement();

            globalThis.fetch = (async () => {
                throw new Error('getaddrinfo ENOTFOUND api.lemonsqueezy.com');
            }) as unknown as typeof globalThis.fetch;

            await ProActivationService.getInstance().validateExistingLicense();

            assert.notStrictEqual(
                settings['pro.validationStatus'],
                'invalid',
                'an unreachable server must never be read as proof of non-payment'
            );
            assert.strictEqual(isProUser(), true);
        });

        test('a 404 from the dead store does not downgrade a paying customer', async () => {
            settings['pro.validationStatus'] = 'valid';
            settings['pro.licenseKey'] = LS_KEY;
            settings['pro.instanceId'] = 'instance-1';
            await freshService();
            await LegacyEntitlementService.getInstance().clearEntitlement();

            globalThis.fetch = (async () => ({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: async () => ({ valid: false, error: 'license_key not found' })
            })) as unknown as typeof globalThis.fetch;

            await ProActivationService.getInstance().validateExistingLicense();

            assert.notStrictEqual(settings['pro.validationStatus'], 'invalid');
            assert.strictEqual(isProUser(), true, 'a suspended storefront must not cost Pro');
        });
    });

    suite('claiming a free replacement license', () => {
        test('claims without a legacy key — the population that was otherwise stranded', async () => {
            // Grandfathered by subscription status alone, with no key anywhere. The claim
            // endpoint used to require a Lemon Squeezy UUID, which meant these customers —
            // who had paid — were refused by the one flow built to rescue them.
            settings['subscription.status'] = 'active';
            const service = await freshService();

            assert.strictEqual(service.hasActiveEntitlement(), true);
            assert.strictEqual(service.getEntitlement()?.legacyKey, undefined);

            let sentBody: Record<string, unknown> = {};
            globalThis.fetch = (async (_url: string, init: { body: string }) => {
                sentBody = JSON.parse(init.body);
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ status: 'success', license_key: 'AAAAA-BBBBB-CCCCC-DDDDD' })
                };
            }) as unknown as typeof globalThis.fetch;

            const result = await GitMindLicenseService.getInstance()
                .claimFreeLicense('paid@example.com');

            assert.strictEqual(result.ok, true);
            assert.ok(!('legacy_key' in sentBody), 'no legacy key should be sent when none is held');
            assert.ok(sentBody.machine_id, 'the machine must always identify itself');
            assert.strictEqual(sentBody.email, 'paid@example.com');
        });

        test('sends the legacy key when one is held', async () => {
            settings['pro.validationStatus'] = 'valid';
            settings['pro.licenseKey'] = LS_KEY;
            await freshService();

            let sentBody: Record<string, unknown> = {};
            globalThis.fetch = (async (_url: string, init: { body: string }) => {
                sentBody = JSON.parse(init.body);
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ status: 'success', license_key: 'AAAAA-BBBBB-CCCCC-DDDDD' })
                };
            }) as unknown as typeof globalThis.fetch;

            const entitlement = LegacyEntitlementService.getInstance().getEntitlement();
            await GitMindLicenseService.getInstance()
                .claimFreeLicense('paid@example.com', entitlement?.legacyKey);

            assert.strictEqual(sentBody.legacy_key, LS_KEY);
        });

        test('a failed claim never costs the customer their Pro', async () => {
            // The single rule of this whole subsystem. Claiming is an *upgrade* to a real
            // licence; failing to claim must leave them exactly as they were.
            settings['pro.validationStatus'] = 'valid';
            settings['pro.licenseKey'] = LS_KEY;
            const service = await freshService();

            globalThis.fetch = (async () => {
                throw new Error('getaddrinfo ENOTFOUND gitmind-pro.com');
            }) as unknown as typeof globalThis.fetch;

            const result = await GitMindLicenseService.getInstance()
                .claimFreeLicense('paid@example.com');

            assert.strictEqual(result.ok, false);
            assert.strictEqual(service.hasActiveEntitlement(), true, 'entitlement must survive');
            assert.strictEqual(isProUser(), true, 'a failed claim must never downgrade anyone');
        });

        test('a server refusal is surfaced verbatim, and still costs nothing', async () => {
            settings['pro.validationStatus'] = 'valid';
            settings['pro.licenseKey'] = LS_KEY;
            const service = await freshService();

            globalThis.fetch = (async () => ({
                ok: false,
                status: 409,
                json: async () => ({
                    status: 'error',
                    revoked: false,
                    error: 'A free replacement licence has already been issued for this machine.'
                })
            })) as unknown as typeof globalThis.fetch;

            const result = await GitMindLicenseService.getInstance()
                .claimFreeLicense('paid@example.com');

            assert.strictEqual(result.ok, false);
            assert.ok(
                !result.ok && result.error.includes('already been issued'),
                'the user should be told what the server actually said'
            );
            assert.strictEqual(isProUser(), true);
        });
    });

    suite('migration notice', () => {
        test('shows on extension startup while un-migrated, and tracks notice count', async () => {
            settings['pro.validationStatus'] = 'valid';
            settings['pro.licenseKey'] = LS_KEY;
            const service = await freshService();

            assert.strictEqual(service.shouldShowMigrationNotice('6.1.0'), true);
            assert.strictEqual(service.getMigrationNoticeCount(), 0);

            const count1 = await service.incrementMigrationNoticeCount();
            assert.strictEqual(count1, 1);
            assert.strictEqual(service.shouldShowMigrationNotice('6.1.0'), true);

            const count2 = await service.incrementMigrationNoticeCount();
            assert.strictEqual(count2, 2);

            await service.markMigrated();
            assert.strictEqual(service.shouldShowMigrationNotice('6.1.0'), false);
            assert.strictEqual(service.getMigrationNoticeCount(), 0);
        });

        test('is never shown to someone without a legacy entitlement', async () => {
            const service = await freshService();

            assert.strictEqual(service.shouldShowMigrationNotice('6.1.0'), false);
        });
    });
});
