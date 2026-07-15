import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as os from 'os';
import { debugLog } from '../debug/logger';
import type { LicenseValidationResult } from './licenseTypes';

/**
 * Client for the GitMind Pro licensing API at gitmind-pro.com.
 *
 * ── Authentication ─────────────────────────────────────────────────────────
 *
 * There is no bearer token to ship inside the VSIX. The license key itself is the HMAC
 * secret, so the only credential involved is one the user already holds. Every request
 * carries a timestamp and a single-use nonce, and the server enforces both — a captured
 * request cannot be replayed.
 *
 * ── Fail open ──────────────────────────────────────────────────────────────
 *
 * The server answers with an explicit `revoked` flag, and that flag is the ONLY thing
 * that may downgrade a paying customer. Everything else — offline, DNS failure, a 500,
 * an expired certificate, a captive portal on hotel wifi — is inconclusive and leaves
 * Pro exactly as it was.
 *
 * This is not a nicety. The previous implementation treated any unhappy answer as proof
 * of non-payment, so when the Lemon Squeezy store was suspended it began silently
 * demoting people who had paid. Never do that again.
 */
export class GitMindLicenseService {
    private static instance: GitMindLicenseService;

    private readonly baseUrl = 'https://gitmind-pro.com/api/v1';

    /** Rejects a request whose clock is more than five minutes out. */
    private readonly requestTimeoutMs = 15_000;

    public static readonly SITE_URL = 'https://gitmind-pro.com';
    public static readonly CHECKOUT_URL = 'https://gitmind-pro.com/pricing';
    public static readonly MIGRATE_URL = 'https://gitmind-pro.com/migrate';
    public static readonly RESEND_KEY_URL = 'https://gitmind-pro.com/portal/resend-key';
    /** Where a customer manages their license, sees active devices, and deactivates them. */
    public static readonly PORTAL_URL = 'https://gitmind-pro.com/portal';

    public static getInstance(): GitMindLicenseService {
        if (!GitMindLicenseService.instance) {
            GitMindLicenseService.instance = new GitMindLicenseService();
        }
        return GitMindLicenseService.instance;
    }

    /**
     * Identifies this installation to the licensing server.
     *
     * `vscode.env.machineId` is a stable, anonymous UUID the editor derives per install —
     * it is not a hardware serial and carries no PII, but it is consistent across restarts,
     * which is exactly what a device slot needs.
     */
    public getMachineId(): string {
        return vscode.env.machineId;
    }

    private getDeviceName(): string {
        try {
            return `${os.hostname()} (${os.platform()})`;
        } catch {
            return 'VS Code';
        }
    }

    private getAppVersion(): string {
        return vscode.extensions.getExtension('ShahabBahreiniJangjoo.ai-commit-assistant')
            ?.packageJSON?.version ?? 'unknown';
    }

    /** Builds the URL that lets a legacy customer exchange their old key, prefilled. */
    public buildMigrationUrl(legacyKey?: string): string {
        const url = new URL(GitMindLicenseService.MIGRATE_URL);
        if (legacyKey) {
            url.searchParams.set('key', legacyKey);
        }
        return url.toString();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API
    // ─────────────────────────────────────────────────────────────────────────

    public async activate(licenseKey: string): Promise<LicenseValidationResult> {
        return this.call('/activate', licenseKey, {
            device_fingerprint: this.getMachineId(),
            device_name: this.getDeviceName(),
            device_os: os.platform(),
            app_version: this.getAppVersion()
        });
    }

    public async check(licenseKey: string): Promise<LicenseValidationResult> {
        return this.call('/check', licenseKey, {
            device_fingerprint: this.getMachineId(),
            app_version: this.getAppVersion()
        });
    }

    public async deactivate(licenseKey: string): Promise<LicenseValidationResult> {
        return this.call('/deactivate', licenseKey, {
            device_fingerprint: this.getMachineId()
        });
    }

    /**
     * Exchanges a Lemon Squeezy purchase for a free replacement license.
     *
     * Unauthenticated, so it cannot go through `call()` — there is no key to sign with yet,
     * which is the entire problem it solves.
     *
     * `legacyKey` is optional. Plenty of legitimate customers cannot produce one: the key may
     * be sitting behind the `[ENCRYPTED]` placeholder, or they may have been recognised by
     * their subscription record rather than by a key at all. Requiring it would turn away
     * exactly the people this exists to rescue. The server bounds the endpoint by machine,
     * window and rate limit instead — none of which depend on the key.
     *
     * @returns the new license key, or an error message safe to show the user.
     */
    public async claimFreeLicense(
        email: string,
        legacyKey?: string
    ): Promise<{ ok: true; licenseKey: string } | { ok: false; error: string }> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/migrate/claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    machine_id: this.getMachineId(),
                    email: email.trim(),
                    ...(legacyKey ? { legacy_key: legacyKey } : {})
                }),
                signal: controller.signal
            });

            const result = await response.json() as Record<string, unknown>;

            if (result.status === 'success' && typeof result.license_key === 'string') {
                return { ok: true, licenseKey: result.license_key };
            }

            return {
                ok: false,
                error: typeof result.error === 'string'
                    ? result.error
                    : `The licence server responded with HTTP ${response.status}.`
            };
        } catch (error) {
            debugLog('Free license claim failed:', error);
            return {
                ok: false,
                error: error instanceof Error && error.name === 'AbortError'
                    ? 'The licence server took too long to respond.'
                    : 'Could not reach the licence server.'
            };
        } finally {
            clearTimeout(timer);
        }
    }

    public async createCheckout(email: string): Promise<{ ok: true; checkoutRef: string; pollToken: string; checkoutUrl: string } | { ok: false; error: string }> {
        const result = await this.callPublic('/checkout', { email: email.trim() });
        if (result.status === 'success' && typeof result.checkout_ref === 'string' && typeof result.poll_token === 'string' && typeof result.checkout_url === 'string') {
            return { ok: true, checkoutRef: result.checkout_ref, pollToken: result.poll_token, checkoutUrl: result.checkout_url };
        }
        return { ok: false, error: typeof result.error === 'string' ? result.error : 'Could not create checkout.' };
    }

    public async pollCheckoutStatus(checkoutRef: string, pollToken: string): Promise<{ status: 'pending' | 'paid' | 'expired'; licenseKey?: string }> {
        const result = await this.callPublic('/checkout/status', { checkout_ref: checkoutRef, poll_token: pollToken });
        const status = result.status;
        if (status === 'paid' && typeof result.license_key === 'string') return { status, licenseKey: result.license_key };
        return { status: status === 'pending' ? 'pending' : 'expired' };
    }

    private async callPublic(endpoint: string, body: Record<string, string>): Promise<Record<string, unknown>> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
            return await response.json() as Record<string, unknown>;
        } catch (error) {
            debugLog(`Public checkout request to ${endpoint} failed:`, error);
            return { status: 'error', error: error instanceof Error && error.name === 'AbortError' ? 'The licence server took too long to respond.' : 'Could not reach the licence server.' };
        } finally { clearTimeout(timer); }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Transport
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Signs and sends one request.
     *
     * The signature covers the method, path, timestamp, nonce and the exact body bytes, so
     * none of them can be altered in flight. The body is serialised once and both signed
     * and sent — re-serialising would risk a byte-level difference and a signature that
     * fails for no visible reason.
     */
    private async call(
        endpoint: string,
        licenseKey: string,
        payload: Record<string, string>
    ): Promise<LicenseValidationResult> {
        const key = licenseKey.trim().toUpperCase();
        const path = `/api/v1${endpoint}`;
        const body = JSON.stringify(payload);
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = crypto.randomBytes(32).toString('hex');

        const signedString = ['POST', path, timestamp, nonce, body].join('\n');
        const signature = crypto.createHmac('sha256', key).update(signedString).digest('hex');

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-License-Key': key,
                    'X-Timestamp': timestamp,
                    'X-Nonce': nonce,
                    'X-Signature': signature
                },
                body,
                signal: controller.signal
            });

            const result = await response.json() as Record<string, unknown>;
            return this.interpret(result, response.status);
        } catch (error) {
            // We could not reach an answer. That says nothing about whether this person
            // paid, so it must not cost them anything: `revoked` stays false and the
            // caller preserves whatever entitlement they already had.
            debugLog(`License request to ${endpoint} failed (treating as inconclusive):`, error);
            return {
                isValid: false,
                revoked: false,
                status: 'error',
                error: error instanceof Error ? error.message : 'Could not reach the license server'
            };
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * Translates a server response into the shape the rest of the extension understands.
     *
     * The one rule that matters: `revoked` is taken *only* from the server saying so
     * explicitly. It is never inferred from a status code, because "the server said no"
     * and "the server didn't answer" are different facts, and conflating them is what
     * demoted paying customers last time.
     */
    private interpret(result: Record<string, unknown>, httpStatus: number): LicenseValidationResult {
        const revoked = result.revoked === true;
        const appState = typeof result.app_state === 'string' ? result.app_state : '';
        const isActive = result.status === 'success' && appState === 'active';

        if (isActive) {
            const data = (result.data ?? {}) as Record<string, unknown>;
            return {
                isValid: true,
                revoked: false,
                status: 'active',
                customerEmail: typeof result.user_email === 'string' ? result.user_email : undefined,
                productName: typeof result.plan_name === 'string' ? result.plan_name : undefined,
                activationsCount: this.toNumber(result.active_devices ?? data.active_devices_count),
                activationsLimit: this.toNumber(result.max_devices ?? data.max_devices),
                instanceId: this.getMachineId()
            };
        }

        return {
            isValid: false,
            revoked,
            status: revoked ? 'revoked' : 'error',
            error: typeof result.message === 'string'
                ? result.message
                : typeof result.error === 'string'
                    ? result.error
                    : `License check failed (HTTP ${httpStatus})`
        };
    }

    private toNumber(value: unknown): number | undefined {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
    }
}
