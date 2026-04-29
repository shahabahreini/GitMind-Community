// src/webview/settings/components/ProFeaturesSettings.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { ModelSettingsRenderer } from "./renderers/ModelSettingsRenderer";
import { FreeFeatureRenderer } from "./renderers/FreeFeatureRenderer";
import { ProFeatureRenderer } from "./renderers/ProFeatureRenderer";
import { SubscriptionRenderer } from "./renderers/SubscriptionRenderer";
import { CommitStyleRenderer } from "./renderers/CommitStyleRenderer";
import { TabManager } from "./managers/TabManager";
import { ScriptManager } from "./managers/ScriptManager";

export class ProFeaturesSettings {
    private _settings: ExtensionSettings;
    private modelRenderer: ModelSettingsRenderer;
    private freeRenderer: FreeFeatureRenderer;
    private proRenderer: ProFeatureRenderer;
    private subscriptionRenderer: SubscriptionRenderer;
    private commitStyleRenderer: CommitStyleRenderer;
    private tabManager: TabManager;
    private scriptManager: ScriptManager;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
        this.modelRenderer = new ModelSettingsRenderer(settings);
        this.freeRenderer = new FreeFeatureRenderer(settings);
        this.proRenderer = new ProFeatureRenderer(settings);
        this.subscriptionRenderer = new SubscriptionRenderer(settings);
        this.commitStyleRenderer = new CommitStyleRenderer(settings);
        this.tabManager = new TabManager();
        this.scriptManager = new ScriptManager();
    }

    public render(): string {
        const devModeEnabled = this.isDevModeEnabled();

        return `
            <div id="proFeaturesSettings" class="settings-section pro-features-section">
                ${this.tabManager.renderTabContainer([
            { id: 'model-tab', label: 'Model Settings', content: this.modelRenderer.render() },
            { id: 'free-tab', label: 'Free Features', content: this.freeRenderer.render() },
            { id: 'commit-style-tab', label: 'Commit Styles', content: this.commitStyleRenderer.render() },
            { id: 'pro-tab', label: 'Pro Features', content: this.proRenderer.render() },
            { id: 'subscription-tab', label: 'Get Pro', content: this.subscriptionRenderer.render() }
        ])}
                
                ${devModeEnabled ? this.renderDevModeNotice() : ''}
            </div>
            ${this.scriptManager.renderScript()}
        `;
    }

    private isDevModeEnabled(): boolean {
        return process.env.GITMIND_ENCRYPTION_DEV_MODE === 'true';
    }

    private renderDevModeNotice(): string {
        return `
            <div class="dev-mode-notice">
                <div class="notice-header">
                    <span class="dev-icon">⚡</span>
                    <strong>Development Mode Active</strong>
                </div>
                <p>Encryption features are enabled for testing. Set <code>GITMIND_ENCRYPTION_DEV_MODE=true</code> environment variable to enable.</p>
            </div>
        `;
    }
}
