import * as assert from 'assert';
import * as vscode from 'vscode';
import { LegacyEntitlementService } from '../../services/subscription/LegacyEntitlementService';
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

    suite('migration notice', () => {
        test('shows once per extension version, then stops', async () => {
            settings['pro.validationStatus'] = 'valid';
            settings['pro.licenseKey'] = LS_KEY;
            const service = await freshService();

            assert.strictEqual(service.shouldShowMigrationNotice('6.1.0'), true);

            await service.recordMigrationNotice('6.1.0');
            assert.strictEqual(service.shouldShowMigrationNotice('6.1.0'), false);

            // The next release is the next time we are allowed to say anything.
            assert.strictEqual(service.shouldShowMigrationNotice('6.2.0'), true);
        });

        test('is never shown to someone without a legacy entitlement', async () => {
            const service = await freshService();

            assert.strictEqual(service.shouldShowMigrationNotice('6.1.0'), false);
        });
    });
});
