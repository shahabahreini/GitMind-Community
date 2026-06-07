// src/services/subscription/LemonSqueezyService.ts
import * as vscode from 'vscode';
import { debugLog } from '../debug/logger';

export interface SubscriptionStatus {
    isActive: boolean;
    isPaused: boolean;
    isExpired: boolean;
    plan: string;
    renewsAt?: Date;
    endsAt?: Date;
}


export interface LemonSqueezySubscription {
    id: string;
    customerId: string;
    status: 'active' | 'paused' | 'cancelled' | 'expired' | 'past_due' | 'unpaid';
    productName: string;
    variantName: string;
    renewsAt: string | null;
    endsAt: string | null;
    testMode: boolean;
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

export interface OrderStatusResult {
    isValid: boolean;
    status: string;
    customerEmail?: string;
    customerName?: string;
    productName?: string;
    variantName?: string;
    licenseKeys?: string[];
    total?: number;
    currency?: string;
    createdAt?: Date;
    error?: string;
}

/**
 * Service for integrating with Lemon Squeezy API for subscription management
 */
export class LemonSqueezyService {
    private static instance: LemonSqueezyService;
    private readonly baseUrl = 'https://api.lemonsqueezy.com/v1';
    private readonly storeId: string;
    private readonly apiKey: string;

    private constructor() {
        // Try to load dotenv if available (development mode)
        try {
            require('dotenv').config();
        } catch (error) {
            debugLog('dotenv not available, using environment variables directly');
        }

        // Read from environment variables with fallbacks
        this.storeId = this.getEnvVar('LEMONSQUEEZY_STORE_ID', '197494');
        this.apiKey = this.getEnvVar('LEMONSQUEEZY_API_KEY', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiJlZThhODMzZDBkNGNiOTY3MjBiZjNkZTI0ZmIwNTkwOTY1ZTRkYzU4OGY3M2MzZTQyODViYTBlZGY4NDZiMjkxNmViZWRhNjdhMmFiNWEwNyIsImlhdCI6MTc1MzE2NTg0NC42Mjg2ODUsIm5iZiI6MTc1MzE2NTg0NC42Mjg2ODgsImV4cCI6MjA2ODY5ODY0NC41ODY2NzcsInN1YiI6IjUxNTIzMTQiLCJzY29wZXMiOltdfQ.GA6no3Ubep3LIb1JGRGrjlpL13HnzCgp2QMtZyp-bTYyfCauwthiF--LDSXmpzC3_ODOI7jrLa27A1VZEGsRo7p_-feZ-85XFmQjlztLbxukf623dwyyHizvj533LZuYtqd2W_w1dShanBPQCiRN8g98Xp9-Uz3Q6gQjQiPbNoXvTasnRWYCoa9KUOGb3tI-vs_9J1KS55mNWtu1w2smzzM_ofJbuCV1iVe7GYG9q9T99mlbF_sOWaQ7YQyd-NAn-cC2C-nbMjMROmjVbh5fMEZbKrv0lDw2yHoDszRhuSChIY76176X-9iTvAUhForPzEmoUisTyomw0jq0J_pBON8n5F8TomH75Jvc8ygddAYsxDNmMhUN-9xgkIYSGqZTrz1WyvNuq7s1qCHY2NtA3fsklleVusOYQE2oprRFrn58PAExrX_fJjOjfY-UEXPKDOltm_YCl53yVN4cKF8j5prfsviOoD62GA5TrUpa4TRMFFGykpiLeClW6JM62j_o');

        debugLog(`LemonSqueezy initialized with store ID: ${this.storeId}`);
        debugLog(`LemonSqueezy API key loaded: ${this.apiKey ? 'Yes' : 'No'}`);

        if (!this.apiKey) {
            debugLog('Warning: LEMONSQUEEZY_API_KEY not found in environment variables');
        }
        if (!this.storeId) {
            debugLog('Warning: LEMONSQUEEZY_STORE_ID not found in environment variables');
        }
    }

    public static getInstance(): LemonSqueezyService {
        if (!LemonSqueezyService.instance) {
            LemonSqueezyService.instance = new LemonSqueezyService();
        }
        return LemonSqueezyService.instance;
    }

    /**
     * Stable, public checkout link for the GitMind Pro one-time product.
     * Opening this directly avoids an authenticated products API round-trip
     * (which can fail even when the API key is valid, e.g. transient network
     * or an expired key) — the checkout page itself needs no API key.
     */
    public static readonly CHECKOUT_URL =
        'https://gitmind.lemonsqueezy.com/checkout/buy/cd58d4e5-92cf-4f59-a6fe-ae6e57010706';

    /**
     * Build the GitMind Pro checkout URL, prefilling the email when known.
     */
    public buildCheckoutUrl(email?: string): string {
        if (!email) {
            return LemonSqueezyService.CHECKOUT_URL;
        }
        try {
            const url = new URL(LemonSqueezyService.CHECKOUT_URL);
            url.searchParams.set('checkout[email]', email);
            return url.toString();
        } catch {
            return LemonSqueezyService.CHECKOUT_URL;
        }
    }


    /**
     * Validate subscription by customer email
     */
    public async validateSubscription(customerEmail: string): Promise<SubscriptionStatus> {
        debugLog(`Validating subscription for email: ${customerEmail}`);

        if (!this.apiKey) {
            debugLog('No API key available for subscription validation, returning free status');
            return { isActive: false, isPaused: false, isExpired: false, plan: 'free' };
        }

        // Use the fixed getSubscriptionStatus method
        return await this.getSubscriptionStatus(customerEmail);
    }

    /**
     * Validate a license key with Lemon Squeezy
     */
    public async validateLicenseKey(licenseKey: string, instanceId?: string, instanceName?: string): Promise<LicenseValidationResult> {
        debugLog(`Validating license key: ${licenseKey.substring(0, 8)}...`);

        if (!this.apiKey) {
            return {
                isValid: false,
                status: 'error',
                error: 'No API key available for license validation'
            };
        }

        try {
            const validationData: any = {
                license_key: licenseKey
            };

            // Include instance_id if provided (for validating existing instance)
            if (instanceId) {
                validationData.instance_id = instanceId;
                debugLog(`Validating with existing instance_id: ${instanceId}`);
            } else if (instanceName) {
                // For new activations, we can include instance_name
                validationData.instance_name = instanceName;
                debugLog(`Validating for new instance: ${instanceName}`);
            }

            debugLog('Validating license with data:', {
                license_key: licenseKey.substring(0, 8) + '...',
                instance_id: instanceId ? instanceId.substring(0, 8) + '...' : undefined,
                instance_name: instanceName
            });

            const response = await this.makeRequestWithRetry('/licenses/validate', 'POST', validationData);

            if (response.license_key && response.valid) {
                const licenseData = response.license_key;
                const metaData = response.meta || {};
                const instanceData = response.instance;

                const result = {
                    isValid: response.valid,
                    status: licenseData.status || 'active',
                    licenseKeyId: licenseData.id?.toString(),
                    customerId: metaData.customer_id?.toString(),
                    customerName: metaData.customer_name,
                    customerEmail: metaData.customer_email,
                    productName: metaData.product_name,
                    variantName: metaData.variant_name,
                    activationsLimit: licenseData.activation_limit,
                    activationsCount: licenseData.activation_usage,
                    expiresAt: licenseData.expires_at ? new Date(licenseData.expires_at) : undefined,
                    instanceId: instanceData?.id
                };

                debugLog('License validation successful:', result);
                return result;
            } else {
                debugLog('License validation failed:', response);
                return {
                    isValid: false,
                    status: 'invalid',
                    error: response.error || 'License key is not valid'
                };
            }
        } catch (error) {
            debugLog('License validation error:', error);
            return {
                isValid: false,
                status: 'error',
                error: error instanceof Error ? error.message : 'License validation failed'
            };
        }
    }

    /**
     * Deactivate a license key with Lemon Squeezy
     */
    public async deactivateLicenseKey(licenseKey: string, instanceId: string): Promise<any> {
        debugLog(`Deactivating license key: ${licenseKey.substring(0, 8)}... with instance: ${instanceId.substring(0, 8)}...`);

        if (!this.apiKey) {
            throw new Error('No API key available for license deactivation');
        }

        const url = `${this.baseUrl}/licenses/deactivate`;

        // Create URLSearchParams for form data as required by the Lemon Squeezy API
        const formData = new URLSearchParams();
        formData.append('license_key', licenseKey);
        formData.append('instance_id', instanceId);

        debugLog('Deactivating license with data:', {
            license_key: licenseKey.substring(0, 8) + '...',
            instance_id: instanceId.substring(0, 8) + '...'
        });

        const headers: HeadersInit = {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const options: RequestInit = {
            method: 'POST',
            headers,
            body: formData
        };

        try {
            let retries = 3;
            let lastError;

            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    // Add exponential backoff for retries
                    if (attempt > 0) {
                        const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
                        await new Promise(resolve => setTimeout(resolve, delay));
                        debugLog(`Retry attempt ${attempt + 1} for deactivate license`);
                    }

                    const response = await fetch(url, options);
                    debugLog(`Response status: ${response.status} ${response.statusText}`);

                    let result;
                    try {
                        result = await response.json();
                    } catch (jsonError) {
                        // If JSON parsing fails, fall back to text
                        const errorText = await response.text();
                        debugLog(`Failed to parse JSON response, raw text:`, errorText);
                        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                    }

                    // Always log the response for debugging
                    debugLog('License deactivation API response:', {
                        deactivated: result.deactivated,
                        error: result.error,
                        hasLicenseKey: !!result.license_key,
                        hasMeta: !!result.meta
                    });

                    // Check if the HTTP request was successful
                    if (!response.ok) {
                        const errorMessage = result.error || `HTTP ${response.status}: ${response.statusText}`;
                        debugLog(`HTTP error response:`, errorMessage);

                        // For 404 errors with instance_id not found, we want to return the result
                        // so the caller can handle it appropriately rather than throwing
                        if (response.status === 404 && result.error && result.error.includes('instance_id not found')) {
                            debugLog('Instance ID not found - returning result for caller to handle');
                            return result;
                        }

                        throw new Error(errorMessage);
                    }

                    // Return the result - let the caller handle deactivated false
                    return result;
                } catch (error) {
                    lastError = error;

                    // Don't retry certain errors
                    if (error instanceof Error) {
                        // Don't retry 4xx errors (except 429 rate limit)
                        if (error.message.includes('HTTP 4') && !error.message.includes('HTTP 429')) {
                            debugLog('Not retrying 4xx error:', error.message);
                            throw error;
                        }

                        // Don't retry instance_id not found errors
                        if (error.message.includes('instance_id not found')) {
                            debugLog('Not retrying instance_id not found error');
                            throw error;
                        }

                        debugLog(`Attempt ${attempt + 1} failed, will retry if attempts remaining:`, error.message);
                    } else {
                        debugLog(`Attempt ${attempt + 1} failed with unknown error, will retry if attempts remaining`);
                    }
                }
            }

            throw lastError || new Error(`Failed to deactivate license after ${retries} attempts`);
        } catch (error) {
            debugLog('License deactivation error:', error);
            throw error;
        }
    }

    /**
     * Check order status by order ID
     */
    public async checkOrderStatus(orderId: string): Promise<OrderStatusResult> {
        debugLog(`Checking order status for order ID: ${orderId}`);

        if (!this.apiKey) {
            return {
                isValid: false,
                status: 'error',
                error: 'No API key available for order validation'
            };
        }

        try {
            const response = await this.makeRequestWithRetry(`/orders/${orderId}`, 'GET');

            if (response.data && response.data.attributes) {
                const order = response.data.attributes;
                const result = {
                    isValid: order.status === 'paid',
                    status: order.status,
                    customerEmail: order.customer_email,
                    customerName: order.customer_name,
                    productName: order.product_name,
                    variantName: order.variant_name,
                    total: order.total,
                    currency: order.currency,
                    createdAt: order.created_at ? new Date(order.created_at) : undefined,
                    licenseKeys: []
                };

                // Try to get license keys for this order
                try {
                    const licenseKeysResponse = await this.makeRequestWithRetry(`/orders/${orderId}/license-keys`, 'GET');
                    if (licenseKeysResponse.data) {
                        result.licenseKeys = licenseKeysResponse.data.map((lk: any) => lk.attributes.key);
                    }
                } catch (licenseError) {
                    debugLog('Could not fetch license keys for order:', licenseError);
                }

                debugLog('Order status check successful:', result);
                return result;
            } else {
                return {
                    isValid: false,
                    status: 'not_found',
                    error: 'Order not found'
                };
            }
        } catch (error) {
            debugLog('Order status check error:', error);
            return {
                isValid: false,
                status: 'error',
                error: error instanceof Error ? error.message : 'Order validation failed'
            };
        }
    }

    /**
     * Get subscription status for a customer email
     */
    public async getSubscriptionStatus(customerEmail: string): Promise<SubscriptionStatus> {
        debugLog(`Getting subscription status for email: ${customerEmail}`);

        if (!this.apiKey) {
            return { isActive: false, isPaused: false, isExpired: false, plan: 'free' };
        }

        try {
            // First get customer ID from email using correct filter format
            const customersResponse = await this.makeRequestWithRetry(`/customers?filter[email]=${encodeURIComponent(customerEmail)}`);

            if (!customersResponse.data || customersResponse.data.length === 0) {
                debugLog(`No customer found with email: ${customerEmail}`);
                return { isActive: false, isPaused: false, isExpired: false, plan: 'free' };
            }

            const customerId = customersResponse.data[0].id;
            debugLog(`Found customer ID: ${customerId}`);

            // Get all subscriptions - LemonSqueezy filters are finicky, so we'll just get all and filter manually
            let customerSubscriptions = [];
            try {
                // Get all subscriptions and filter manually - this is more reliable than LemonSqueezy filters
                const allSubscriptionsResponse = await this.makeRequestWithRetry('/subscriptions');
                debugLog(`Retrieved ${allSubscriptionsResponse.data?.length || 0} total subscriptions`);

                if (allSubscriptionsResponse.data) {
                    customerSubscriptions = allSubscriptionsResponse.data.filter((sub: any) => {
                        const subCustomerId = sub.attributes?.customer_id?.toString();
                        const targetCustomerId = customerId.toString();
                        debugLog(`Comparing subscription customer_id ${subCustomerId} with target ${targetCustomerId}`);
                        return subCustomerId === targetCustomerId;
                    });
                }
            } catch (error) {
                debugLog('Failed to get subscriptions:', error);
                return { isActive: false, isPaused: false, isExpired: false, plan: 'free' };
            }

            debugLog(`Found ${customerSubscriptions.length} subscriptions for customer ${customerId}`);

            if (customerSubscriptions.length === 0) {
                debugLog(`No subscriptions found for customer ${customerId}`);
                return { isActive: false, isPaused: false, isExpired: false, plan: 'free' };
            }

            // Find the most recent active subscription
            const activeSubscription = this.findActiveSubscription(customerSubscriptions);

            if (activeSubscription) {
                debugLog(`Found active subscription:`, activeSubscription.id);
                return this.parseSubscriptionStatus(activeSubscription);
            } else {
                debugLog(`No active subscription found for customer ${customerId}`);
                return { isActive: false, isPaused: false, isExpired: false, plan: 'free' };
            }
        } catch (error) {
            debugLog('Failed to get subscription status:', error);
            return { isActive: false, isPaused: false, isExpired: false, plan: 'free' };
        }
    }


    /**
     * Get customer portal URL for managing subscription
     * @param email Customer email address
     * @returns URL to customer portal or undefined if not found
     */
    public async getCustomerPortalUrl(email: string): Promise<string | undefined> {
        if (!this.apiKey) {
            throw new Error('No API key available for customer portal access');
        }

        try {
            // First, find the customer by email
            const customersResponse = await this.makeRequest(`/customers?filter=email%3D${encodeURIComponent(email)}`);

            if (!customersResponse.data || customersResponse.data.length === 0) {
                debugLog(`No customer found for email: ${email}`);
                return undefined;
            }

            const customerId = customersResponse.data[0].id;
            debugLog(`Found customer ID: ${customerId} for email: ${email}`);

            // Generate a customer portal URL
            const portalData = {
                data: {
                    type: 'customer-portals',
                    attributes: {
                        store_id: this.storeId,
                        customer_id: customerId,
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
                    }
                }
            };

            const response = await this.makeRequest('/customer-portals', 'POST', portalData);

            if (response && response.data && response.data.attributes && response.data.attributes.url) {
                return response.data.attributes.url;
            } else {
                debugLog('Invalid customer portal response format');
                return undefined;
            }
        } catch (error) {
            debugLog('Failed to generate customer portal URL:', error);
            return undefined;
        }
    }


    /**
     * Get all instances for a license key
     */
    public async getLicenseInstances(licenseKey: string): Promise<any[]> {
        debugLog(`Getting instances for license key: ${licenseKey.substring(0, 8)}...`);

        if (!this.apiKey) {
            debugLog('No API key available for getting license instances');
            return [];
        }

        try {
            // First validate the license to get the license key ID
            const validation = await this.validateLicenseKey(licenseKey);
            if (!validation.isValid || !validation.licenseKeyId) {
                debugLog('Cannot get instances for invalid license key');
                return [];
            }

            // Get instances for this license key
            const response = await this.makeRequestWithRetry(`/license-key-instances?filter[license_key_id]=${validation.licenseKeyId}`);

            if (response.data && Array.isArray(response.data)) {
                debugLog(`Found ${response.data.length} instances for license key`);
                return response.data.map((instance: any) => ({
                    id: instance.id,
                    name: instance.attributes.name,
                    created_at: instance.attributes.created_at
                }));
            }

            return [];
        } catch (error) {
            debugLog('Error getting license instances:', error);
            return [];
        }
    }

    /**
     * Try to find a valid instance for deactivation
     */
    public async findValidDeactivationInstance(licenseKey: string): Promise<string | null> {
        try {
            const instances = await this.getLicenseInstances(licenseKey);
            if (instances.length === 0) {
                debugLog('No instances found for license key');
                return null;
            }

            debugLog(`Found ${instances.length} instances, testing each for deactivation validity`);

            // Sort instances by creation date (most recent first)
            const sortedInstances = instances.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            // Try each instance to see which one is valid for deactivation
            for (const instance of sortedInstances) {
                debugLog(`Testing instance ${instance.id} (${instance.name}) for deactivation validity`);

                try {
                    // First try a validation call with this instance to see if it's active
                    const validation = await this.validateLicenseKey(licenseKey, instance.id);
                    if (validation.isValid) {
                        debugLog(`Instance ${instance.id} is valid for deactivation`);
                        return instance.id;
                    } else {
                        debugLog(`Instance ${instance.id} failed validation:`, validation.error);
                    }
                } catch (validationError) {
                    debugLog(`Instance ${instance.id} validation failed:`, validationError);
                    // Continue to next instance
                }
            }

            debugLog('No valid instances found for deactivation');
            return null;
        } catch (error) {
            debugLog('Error finding valid deactivation instance:', error);
            return null;
        }
    }

    /**
     * Try to find the most recent instance for a license key
     */
    public async getRecentLicenseInstance(licenseKey: string): Promise<string | null> {
        try {
            const instances = await this.getLicenseInstances(licenseKey);
            if (instances.length > 0) {
                // Sort by creation date and return the most recent one
                const sortedInstances = instances.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                const recentInstance = sortedInstances[0];
                debugLog(`Found most recent instance: ${recentInstance.id} (${recentInstance.name})`);
                return recentInstance.id;
            }
            return null;
        } catch (error) {
            debugLog('Error getting recent license instance:', error);
            return null;
        }
    }

    /**
     * Clean up invalid instances for a license key by trying to deactivate them
     */
    public async cleanupInvalidInstances(licenseKey: string): Promise<{ cleaned: number; errors: string[] }> {
        debugLog(`Cleaning up invalid instances for license key: ${licenseKey.substring(0, 8)}...`);

        try {
            const instances = await this.getLicenseInstances(licenseKey);
            if (instances.length === 0) {
                debugLog('No instances to clean up');
                return { cleaned: 0, errors: [] };
            }

            let cleaned = 0;
            const errors: string[] = [];

            debugLog(`Found ${instances.length} instances, attempting to clean up invalid ones`);

            for (const instance of instances) {
                try {
                    debugLog(`Attempting to deactivate instance: ${instance.id}`);
                    const result = await this.deactivateLicenseKey(licenseKey, instance.id);

                    if (result.deactivated) {
                        debugLog(`Successfully deactivated instance: ${instance.id}`);
                        cleaned++;
                    } else {
                        debugLog(`Failed to deactivate instance ${instance.id}: ${result.error}`);
                        if (result.error && !result.error.includes('instance_id not found')) {
                            errors.push(`Instance ${instance.id}: ${result.error}`);
                        }
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    debugLog(`Error deactivating instance ${instance.id}:`, errorMessage);
                    if (!errorMessage.includes('instance_id not found')) {
                        errors.push(`Instance ${instance.id}: ${errorMessage}`);
                    }
                }
            }

            debugLog(`Cleanup complete. Cleaned: ${cleaned}, Errors: ${errors.length}`);
            return { cleaned, errors };
        } catch (error) {
            debugLog('Error during instance cleanup:', error);
            return { cleaned: 0, errors: [error instanceof Error ? error.message : 'Unknown cleanup error'] };
        }
    }

    // Private helper methods

    private async makeRequest(endpoint: string, method = 'GET', body?: any): Promise<any> {
        // Support absolute URLs (e.g. JSON:API "related" links returned by the API)
        // as well as relative endpoints.
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        const headers: HeadersInit = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
            debugLog(`Making ${method} request to: ${url}`);
            debugLog(`Headers:`, { ...headers, Authorization: 'Bearer ***' });
        } else {
            debugLog('WARNING: No API key available for request');
            throw new Error('No API key available');
        }

        const options: RequestInit = {
            method,
            headers
        };

        if (body && (method === 'POST' || method === 'PATCH')) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            debugLog(`Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Error response body:`, errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            debugLog(`Response data structure:`, {
                hasData: !!result.data,
                dataLength: Array.isArray(result.data) ? result.data.length : 'not array',
                dataType: typeof result.data,
                keys: Object.keys(result)
            });

            return result;
        } catch (error) {
            debugLog(`Request failed:`, error);
            throw error;
        }
    }

    /**
     * Make API request with retry logic
     */
    public async makeRequestWithRetry(endpoint: string, method = 'GET', body?: any, retries = 3): Promise<any> {
        let lastError;

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                // Add exponential backoff for retries
                if (attempt > 0) {
                    const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
                    await new Promise(resolve => setTimeout(resolve, delay));
                    debugLog(`Retry attempt ${attempt + 1} for ${method} ${endpoint}`);
                }

                return await this.makeRequest(endpoint, method, body);
            } catch (error) {
                lastError = error;

                // Don't retry 4xx errors (except 429 rate limit)
                if (error instanceof Error &&
                    error.message.includes('HTTP 4') &&
                    !error.message.includes('HTTP 429')) {
                    throw error;
                }

                debugLog(`Request failed (attempt ${attempt + 1}/${retries}):`, error);
            }
        }

        throw lastError || new Error(`Failed after ${retries} attempts`);
    }

    


    /**
     * Get environment variable with fallback support for compiled extension
     */
    private getEnvVar(name: string, defaultValue: string): string {
        debugLog(`Looking for environment variable: ${name}`);

        // First try process.env (loaded from .env via dotenv)
        if (typeof process !== 'undefined' && process.env && process.env[name]) {
            debugLog(`Found ${name} in process.env`);
            return process.env[name];
        }

        // Try to read from VSCode configuration as fallback
        try {
            const config = vscode.workspace.getConfiguration('gitmind');
            const envConfig = config.get('environment') as any || {};

            if (envConfig[name]) {
                debugLog(`Found ${name} in VSCode configuration`);
                return envConfig[name];
            }
        } catch (error) {
            debugLog(`Could not read ${name} from VSCode configuration:`, error);
        }

        // Try reading directly from .env file as last resort
        try {
            const fs = require('fs');
            const path = require('path');
            const workspaceFolders = vscode.workspace.workspaceFolders;

            if (workspaceFolders && workspaceFolders.length > 0) {
                const envPath = path.join(workspaceFolders[0].uri.fsPath, '.env');
                if (fs.existsSync(envPath)) {
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const envLines = envContent.split('\n');

                    for (const line of envLines) {
                        if (line.startsWith(`${name}=`)) {
                            const value = line.substring(name.length + 1).replace(/^["']|["']$/g, '');
                            debugLog(`Found ${name} in .env file`);
                            return value;
                        }
                    }
                }
            }
        } catch (error) {
            debugLog(`Could not read ${name} from .env file:`, error);
        }

        debugLog(`Using default value for ${name}`);
        return defaultValue;
    }

    private findActiveSubscription(subscriptions: any[]): any {
        // Sort by created_at and find the most recent active subscription
        const sorted = subscriptions.sort((a, b) =>
            new Date(b.attributes.created_at).getTime() - new Date(a.attributes.created_at).getTime()
        );

        return sorted.find(sub =>
            ['active', 'paused'].includes(sub.attributes.status)
        ) || sorted[0];
    }

    private parseSubscriptionStatus(subscription: any): SubscriptionStatus {
        if (!subscription || !subscription.attributes) {
            return {
                isActive: false,
                isPaused: false,
                isExpired: true,
                plan: 'free'
            };
        }

        const attributes = subscription.attributes;
        const status = attributes.status;
        const renewsAt = attributes.renews_at ? new Date(attributes.renews_at) : undefined;
        const endsAt = attributes.ends_at ? new Date(attributes.ends_at) : undefined;

        return {
            isActive: status === 'active',
            isPaused: status === 'paused',
            isExpired: ['cancelled', 'expired', 'past_due', 'unpaid'].includes(status),
            plan: attributes.product_name || 'pro',
            renewsAt,
            endsAt
        };
    }

    /**
     * Comprehensive deactivation that tries multiple strategies
     */
    public async comprehensiveDeactivation(licenseKey: string, storedInstanceId?: string): Promise<{ success: boolean; instanceId?: string; error?: string; apiResponse?: any }> {
        debugLog('Starting comprehensive deactivation process');

        // Strategy 1: Try with stored instance ID
        if (storedInstanceId) {
            debugLog(`Strategy 1: Trying with stored instance ID: ${storedInstanceId}`);
            try {
                const result = await this.deactivateLicenseKey(licenseKey, storedInstanceId);
                if (result.deactivated) {
                    debugLog('Strategy 1: Success with stored instance ID');
                    return { success: true, instanceId: storedInstanceId, apiResponse: result };
                } else {
                    debugLog('Strategy 1: Failed with stored instance ID:', result.error);
                }
            } catch (error) {
                debugLog('Strategy 1: Error with stored instance ID:', error);
            }
        }

        // Strategy 2: Find and try a valid instance
        debugLog('Strategy 2: Finding valid instance for deactivation');
        try {
            const validInstanceId = await this.findValidDeactivationInstance(licenseKey);
            if (validInstanceId) {
                debugLog(`Strategy 2: Trying with valid instance ID: ${validInstanceId}`);
                try {
                    const result = await this.deactivateLicenseKey(licenseKey, validInstanceId);
                    if (result.deactivated) {
                        debugLog('Strategy 2: Success with valid instance ID');
                        return { success: true, instanceId: validInstanceId, apiResponse: result };
                    } else {
                        debugLog('Strategy 2: Failed with valid instance ID:', result.error);
                    }
                } catch (error) {
                    debugLog('Strategy 2: Error with valid instance ID:', error);
                }
            } else {
                debugLog('Strategy 2: No valid instance found');
            }
        } catch (error) {
            debugLog('Strategy 2: Error finding valid instance:', error);
        }

        // Strategy 3: Create fresh instance and deactivate
        debugLog('Strategy 3: Creating fresh instance through activation');
        try {
            const activationData = {
                license_key: licenseKey,
                instance_name: 'vscode-extension-deactivation'
            };

            const activation = await this.makeRequestWithRetry('/licenses/activate', 'POST', activationData);

            if (activation.activated && activation.instance && activation.instance.id) {
                const freshInstanceId = activation.instance.id;
                debugLog(`Strategy 3: Created fresh instance: ${freshInstanceId}, attempting deactivation`);

                try {
                    const result = await this.deactivateLicenseKey(licenseKey, freshInstanceId);
                    if (result.deactivated) {
                        debugLog('Strategy 3: Success with fresh instance');
                        return { success: true, instanceId: freshInstanceId, apiResponse: result };
                    } else {
                        debugLog('Strategy 3: Failed to deactivate fresh instance:', result.error);
                    }
                } catch (error) {
                    debugLog('Strategy 3: Error deactivating fresh instance:', error);
                }
            } else {
                debugLog('Strategy 3: Failed to create fresh instance');
            }
        } catch (error) {
            debugLog('Strategy 3: Error creating fresh instance:', error);
        }

        debugLog('All deactivation strategies failed');
        return { success: false, error: 'All deactivation strategies failed' };
    }
}