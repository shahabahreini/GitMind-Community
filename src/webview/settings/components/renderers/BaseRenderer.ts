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
        return this.isProUser();
    }

    /**
     * Reads the entitlement the host already decided (SettingsManager sets `pro.isPro` from
     * utils/proHelpers.isProUser()). Renderers must not re-derive Pro from raw settings —
     * doing so is what let a grandfathered customer look Free in parts of the UI.
     */
    protected isProUser(): boolean {
        return this.settings.pro?.isPro === true;
    }

    protected isLegacyProUser(): boolean {
        return this.settings.pro?.isLegacyPro === true;
    }
}