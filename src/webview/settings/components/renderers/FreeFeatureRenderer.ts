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
                    ${this.renderCommitIntelligence()}
                    
                    ${this.renderUpgradePromptIfNeeded()}
                </div>
            </div>
        `;
    }

    private renderCommitIntelligence(): string {
        const intelligence = this.settings.commitIntelligence;
        const enabled = intelligence?.enabled ?? false;
        const isPro = this.isProUser() || this.isDevModeEnabled();
        const toggle = (id: string, label: string, tooltip: string, checked: boolean, setting: string, pro = false): string => {
            let html = FormUtils.createToggle(id, label, tooltip, checked, setting);
            if (pro) {
                html = html.replace('class="toggle-item"', `class="toggle-item ${isPro ? '' : 'locked'}"`)
                    .replace(`id="${id}"`, `id="${id}" ${isPro ? '' : 'disabled aria-disabled="true"'}`)
                    .replace(`>${label}</label>`, `>${label} <span class="pro-lock-badge" title="Requires GitMind Pro">Pro</span></label>`);
            }
            return html;
        };

        return `
            <section class="commit-intelligence-settings" aria-labelledby="commitIntelligenceHeading">
                <h3 id="commitIntelligenceHeading" class="section-header">Commit Intelligence (Preview)</h3>
                <p class="description">Opt in to reviewed generation and advanced commit workflows. One-click generation stays unchanged.</p>
                ${toggle('commitIntelligenceEnabled', 'Commit Intelligence (Preview)', 'Enable reviewed generation and advanced commit actions', enabled, 'commitIntelligence.enabled').replace('id="commitIntelligenceEnabled"', `id="commitIntelligenceEnabled" aria-controls="commitIntelligenceOptions" aria-expanded="${enabled}"`)}
                <div id="commitIntelligenceOptions" class="commit-intelligence-options" ${enabled ? '' : 'hidden'} aria-hidden="${!enabled}">
                    <div class="settings-subsection">
                        <h4>Reviewed generation</h4>
                        <div class="form-group">
                            <label for="commitDetailMode">Detail mode</label>
                            ${FormUtils.createSelect('commitDetailMode', [
                                { value: 'legacy', label: 'Legacy (use Verbose Messages)', selected: !this.settings.commit?.detailMode || this.settings.commit.detailMode === 'legacy' },
                                { value: 'auto', label: 'Auto', selected: this.settings.commit?.detailMode === 'auto' },
                                { value: 'concise', label: 'Concise', selected: this.settings.commit?.detailMode === 'concise' },
                                { value: 'detailed', label: 'Detailed', selected: this.settings.commit?.detailMode === 'detailed' }
                            ]).replace('<select ', '<select data-setting="commit.detailMode" ')}
                        </div>
                        ${toggle('commitNoiseFilteringEnabled', 'Noise filtering', 'Classify generated, lock, binary, minified, and formatting-only changes', intelligence?.noiseFilteringEnabled ?? false, 'commit.noiseFiltering.enabled')}
                    </div>
                    <div class="settings-subsection">
                        <h4>Draft choices</h4>
                        ${toggle('commitCandidatesEnabled', 'Candidates', 'Generate multiple reviewed draft choices', intelligence?.candidatesEnabled ?? false, 'commit.candidates.enabled', true)}
                        ${toggle('commitHealthEnabled', 'Commit Health', 'Show advisory draft quality checks', intelligence?.healthEnabled ?? false, 'commit.health.enabled', true)}
                    </div>
                    <div class="settings-subsection">
                        <h4>Context</h4>
                        ${toggle('githubIssueContextEnabled', 'GitHub issue context', 'Fetch issue context only when explicitly requested', intelligence?.githubIssueContextEnabled ?? false, 'commit.githubIssueContext.enabled')}
                    </div>
                    <div class="settings-subsection">
                        <h4>Advanced Pro workflows</h4>
                        ${toggle('composerEnabled', 'Composer', 'Compose a reviewed atomic commit series', intelligence?.composerEnabled ?? false, 'composer.enabled', true)}
                        ${toggle('allowHunkSplitting', 'Hunk splitting', 'Allow divisible text hunks to move between Composer groups', intelligence?.allowHunkSplitting ?? false, 'composer.allowHunkSplitting', true)}
                        ${toggle('reviewEnabled', 'Pre-commit review', 'Run an opt-in review before insertion', intelligence?.reviewEnabled ?? false, 'review.enabled', true)}
                    </div>
                </div>
            </section>`;
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
                id: 'commitCaptureAllChanges',
                label: 'Capture All Changes',
                tooltip: 'Capture staged + unstaged changes (including untracked files) and skip the staging prompt',
                checked: this.settings.commit?.captureAllChanges ?? false,
                setting: 'commit.captureAllChanges'
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
