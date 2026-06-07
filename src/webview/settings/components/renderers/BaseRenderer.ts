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
        // `validationStatus === 'valid'` is the authoritative Pro signal — it is
        // only set after a successful license/subscription validation, and it is
        // what the rest of the app uses (see utils/proHelpers.isProUser()).
        //
        // We intentionally do NOT also require licenseKey/orderId to be present:
        // when the key is stored encrypted in secure storage, it is not always
        // carried into the settings object at render time, which previously made
        // genuine Pro users look unlicensed and stripped Pro-only UI (e.g. the
        // Emoji Enhancement tab).
        return this.settings.pro?.validationStatus === 'valid';
    }

    protected isProUser(): boolean {
        return this.hasActiveSubscription() || this.hasValidLicense();
    }
}