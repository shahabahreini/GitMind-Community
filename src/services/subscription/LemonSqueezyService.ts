import { debugLog } from '../debug/logger';

export interface SubscriptionStatus {
    isActive: boolean;
    isPaused: boolean;
    isExpired: boolean;
    plan: string;
    renewsAt?: Date;
    endsAt?: Date;
}

export interface LicenseValidationResult {
    isValid: boolean;
    status: string;
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

/** Uses only Lemon Squeezy's public License API. */
export class LemonSqueezyService {
    private static instance: LemonSqueezyService;
    private readonly baseUrl = 'https://api.lemonsqueezy.com/v1';

    public static readonly CHECKOUT_URL =
        'https://gitmind.lemonsqueezy.com/checkout/buy/cd58d4e5-92cf-4f59-a6fe-ae6e57010706';

    public static getInstance(): LemonSqueezyService {
        if (!LemonSqueezyService.instance) {
            LemonSqueezyService.instance = new LemonSqueezyService();
        }
        return LemonSqueezyService.instance;
    }

    public buildCheckoutUrl(email?: string): string {
        const url = new URL(LemonSqueezyService.CHECKOUT_URL);
        if (email) {
            url.searchParams.set('checkout[email]', email);
        }
        return url.toString();
    }

    public async validateLicenseKey(licenseKey: string, instanceId?: string, _instanceName?: string): Promise<LicenseValidationResult> {
        try {
            const response = await this.request('/licenses/validate', {
                license_key: licenseKey,
                ...(instanceId ? { instance_id: instanceId } : {})
            });
            if (!response.valid || !response.license_key) {
                return { isValid: false, status: 'invalid', error: response.error || 'License key is not valid' };
            }
            return {
                isValid: true,
                status: response.license_key.status || 'active',
                licenseKeyId: response.license_key.id?.toString(),
                customerId: response.meta?.customer_id?.toString(),
                customerName: response.meta?.customer_name,
                customerEmail: response.meta?.customer_email,
                productName: response.meta?.product_name,
                variantName: response.meta?.variant_name,
                activationsLimit: response.license_key.activation_limit,
                activationsCount: response.license_key.activation_usage,
                expiresAt: response.license_key.expires_at ? new Date(response.license_key.expires_at) : undefined,
                instanceId: response.instance?.id
            };
        } catch (error) {
            debugLog('License validation error:', error);
            return {
                isValid: false,
                status: 'error',
                error: error instanceof Error ? error.message : 'License validation failed'
            };
        }
    }

    public async activateLicenseKey(licenseKey: string, instanceName = 'vscode-extension'): Promise<any> {
        return this.request('/licenses/activate', { license_key: licenseKey, instance_name: instanceName });
    }

    public async makeRequestWithRetry(endpoint: string, method = 'GET', body?: Record<string, string>): Promise<any> {
        if (method !== 'POST' || !['/licenses/activate', '/licenses/validate', '/licenses/deactivate'].includes(endpoint)) {
            throw new Error('Privileged Lemon Squeezy API operations are disabled in the extension.');
        }
        return this.request(endpoint, body || {});
    }

    public async validateSubscription(_customerEmail: string): Promise<SubscriptionStatus> {
        return { isActive: false, isPaused: false, isExpired: false, plan: 'free' };
    }

    public async getCustomerPortalUrl(_email: string): Promise<undefined> {
        return undefined;
    }

    public async checkOrderStatus(_orderId: string): Promise<any> {
        return {
            isValid: false,
            status: 'unsupported',
            error: 'Order ID activation is disabled. Use the license key from the purchase email.'
        };
    }

    public async cleanupInvalidInstances(_licenseKey: string): Promise<{ cleaned: number; errors: string[] }> {
        return { cleaned: 0, errors: [] };
    }

    public async getRecentLicenseInstance(_licenseKey: string): Promise<null> {
        return null;
    }

    public async deactivateLicenseKey(licenseKey: string, instanceId: string): Promise<any> {
        return this.request('/licenses/deactivate', { license_key: licenseKey, instance_id: instanceId });
    }

    public async comprehensiveDeactivation(
        licenseKey: string,
        storedInstanceId?: string
    ): Promise<{ success: boolean; instanceId?: string; error?: string; apiResponse?: any }> {
        if (!storedInstanceId) {
            return { success: false, error: 'No local license instance is available to deactivate.' };
        }
        try {
            const result = await this.deactivateLicenseKey(licenseKey, storedInstanceId);
            return result.deactivated
                ? { success: true, instanceId: storedInstanceId, apiResponse: result }
                : { success: false, error: result.error || 'License deactivation failed', apiResponse: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'License deactivation failed' };
        }
    }

    private async request(endpoint: string, data: Record<string, string>): Promise<any> {
        let lastError: unknown;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                if (attempt > 0) {
                    await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
                }
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams(data)
                });
                const result = await response.json();
                if (!response.ok && response.status !== 404) {
                    throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
                }
                return result;
            } catch (error) {
                lastError = error;
                if (error instanceof Error && /HTTP 4(?!29)/.test(error.message)) {
                    throw error;
                }
            }
        }
        throw lastError || new Error('Lemon Squeezy License API request failed');
    }
}
