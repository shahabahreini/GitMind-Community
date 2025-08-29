// src/webview/settings/components/renderers/FreeFeatureRenderer.ts
import { BaseRenderer } from "./BaseRenderer";
import { FormUtils } from "../utils/FormUtils";

export class FreeFeatureRenderer extends BaseRenderer {
    public render(): string {
        return `
            <div class="minimalist-card">
                <div class="card-content">
                    <div class="free-features-toggles">
                        ${this.renderToggleFeatures()}
                    </div>
                    
                    ${this.renderUpgradePromptIfNeeded()}
                </div>
            </div>
        `;
    }

    private renderToggleFeatures(): string {
        const features = [
            {
                id: 'commitVerbose',
                label: 'Verbose Messages',
                tooltip: 'Show detailed commit message generation progress and information',
                checked: this.settings.commit?.verbose || false,
                setting: 'commit.verbose'
            },
            {
                id: 'promptCustomizationEnabled',
                label: 'Prompt Customization',
                tooltip: 'Customize the commit message prompt to fit your needs',
                checked: this.settings.promptCustomization?.enabled || false,
                setting: 'promptCustomization.enabled'
            },
            {
                id: 'showDiagnostics',
                label: 'Show Diagnostics',
                tooltip: 'Display diagnostic information for troubleshooting issues',
                checked: this.settings.showDiagnostics || false,
                setting: 'showDiagnostics'
            },
            {
                id: 'telemetryEnabled',
                label: 'Anonymous Analytics',
                tooltip: 'Help improve GitMind by sending anonymous usage data',
                checked: this.settings.telemetry?.enabled || false,
                setting: 'telemetry.enabled'
            }
        ];

        let html = features.map(feature =>
            FormUtils.createToggle(feature.id, feature.label, feature.tooltip, feature.checked, feature.setting)
        ).join('');

        // Add conditional save last prompt toggle (always included but may be hidden)
        const isPromptCustomizationEnabled = this.settings.promptCustomization?.enabled || false;
        html += `
            <div class="toggle-item" style="display: ${isPromptCustomizationEnabled ? 'flex' : 'none'};" id="saveLastPromptRow" data-tooltip="When enabled, saves your last custom prompt and uses it as default for future commit message generation. The prompt can be copied to clipboard for editing.">
                <div class="switch-container">
                    <input class="switch-input" type="checkbox" id="saveLastPrompt" ${this.settings.promptCustomization?.saveLastPrompt ? "checked" : ""} data-setting="promptCustomization.saveLastPrompt" />
                    <div class="switch-button">
                        <div class="switch-slider"></div>
                    </div>
                </div>
                <div class="toggle-content">
                    <label class="toggle-label" for="saveLastPrompt">Save Last Custom Prompt</label>
                </div>
            </div>
        `;

        return html;
    }

    private renderUpgradePromptIfNeeded(): string {
        if (this.hasSubscriptionEmail() || this.isDevModeEnabled()) {
            return '';
        }

        return `
            <div class="upgrade-prompt">
                <div class="upgrade-content">
                    <span class="upgrade-text">Upgrade to Pro for encryption & advanced features</span>
                    <button class="upgrade-button" id="subscribeFromFreeBtn">
                        Subscribe
                    </button>
                </div>
            </div>
        `;
    }
}