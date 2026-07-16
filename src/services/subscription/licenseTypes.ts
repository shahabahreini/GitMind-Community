/**
 * Shared licensing/subscription result types.
 *
 * These describe the shape of a license validation answer and a subscription status.
 * They are provider-agnostic: the GitMind Pro licensing API at gitmind-pro.com returns
 * them today. (They previously lived in the now-removed LemonSqueezyService.)
 */

export interface SubscriptionStatus {
    isActive: boolean;
    isPaused: boolean;
    isExpired: boolean;
    plan: string;
    renewsAt?: Date;
    endsAt?: Date;
}

/** One active device slot, as the licensing server reports it. Never carries fingerprints. */
export interface RemoteDeviceInfo {
    id: number;
    name: string;
    os: string;
    status: string;
    activatedAt?: number;
    lastSeenAt?: number;
    isCurrent: boolean;
}

export interface LicenseValidationResult {
    isValid: boolean;
    /**
     * Set only when a trusted server affirmatively states the license was revoked or refunded.
     * This is the ONLY signal permitted to downgrade a paying customer: a plain `isValid: false`
     * is inconclusive, because it is indistinguishable from a network failure. The owned
     * license server sets it; nothing else may.
     */
    revoked?: boolean;
    status: string;
    /**
     * Machine-readable error identifier from the server (e.g. 'device_limit_reached',
     * 'account_blocked', 'terms_required'). Branch on this, never on the English text.
     */
    errorCode?: string;
    /** Server-side app state: 'active', 'revoked', 'device_inactive', 'account_blocked'. */
    appState?: string;
    /** Active devices on the license — sent with device_limit_reached and /devices. */
    devices?: RemoteDeviceInfo[];
    /** Whether the "+2 devices" add-on is purchasable (sent with device_limit_reached). */
    addonAvailable?: boolean;
    licenseKeyId?: string;
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    productName?: string;
    variantName?: string;
    activationsLimit?: number;
    activationsCount?: number;
    expiresAt?: Date;
    instanceId?: string;
    error?: string;
}
