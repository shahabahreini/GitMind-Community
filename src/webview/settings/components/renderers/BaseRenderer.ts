// src/webview/settings/components/renderers/BaseRenderer.ts
import { ExtensionSettings } from "../../../../models/ExtensionSettings";

export abstract class BaseRenderer {
    protected settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this.settings = settings;
    }

    public abstract render(): string;

    protected hasSubscriptionEmail(): boolean {
        return !!(this.settings.subscription?.email && this.settings.subscription.email.length > 0);
    }

    protected hasActiveSubscription(): boolean {
        return this.hasSubscriptionEmail() && this.settings.subscription?.status === 'active';
    }

    protected isDevModeEnabled(): boolean {
        return process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
    }

    protected isEncryptionAvailable(): boolean {
        return this.hasActiveSubscription() || this.hasValidLicense() || this.isDevModeEnabled();
    }

    protected hasValidLicense(): boolean {
        return this.settings.pro?.validationStatus === 'valid' && !!(this.settings.pro?.licenseKey || this.settings.pro?.orderId);
    }

    protected isProUser(): boolean {
        return this.hasActiveSubscription() || this.hasValidLicense();
    }
}