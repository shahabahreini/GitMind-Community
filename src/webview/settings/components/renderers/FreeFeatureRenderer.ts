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
        const toggle = (id: string, label: string, tooltip: string, checked: boolean, setting: string, pro = false, helperText = ''): string => {
            let html = FormUtils.createToggle(id, label, tooltip, checked, setting);
            if (helperText) {
                html = html.replace('</label>', `</label><p class="toggle-description">${helperText}</p>`);
            }
            if (pro) {
                html = html.replace('class="toggle-item"', `class="toggle-item ${isPro ? '' : 'locked'}"`)
                    .replace(`id="${id}"`, `id="${id}" ${isPro ? '' : 'disabled aria-disabled="true"'}`)
                    .replace(`>${label}</label>`, `>${label} <span class="pro-lock-badge" title="Requires GitMind Pro">Pro</span></label>`);
            }
            return html;
        };

        return `
            <section class="commit-intelligence-settings" aria-labelledby="commitIntelligenceHeading">
                <div class="commit-intelligence-banner">
                    <div class="commit-intelligence-banner-header">
                        <h3 id="commitIntelligenceHeading" class="section-header" style="margin:0;">Commit Intelligence</h3>
                        <span class="commit-intelligence-badge">Preview</span>
                    </div>
                    <p class="description" style="margin-bottom:12px;">Core reviewed-generation controls. Commit Health and advanced workflows are organized in the Pro Workspace tab.</p>
                    ${toggle(
                        'commitIntelligenceEnabled',
                        'Enable Commit Intelligence Features',
                        'Opt in to smart review tools, noise removal, draft options, and multi-commit composing',
                        enabled,
                        'commitIntelligence.enabled'
                    ).replace('id="commitIntelligenceEnabled"', `id="commitIntelligenceEnabled" aria-controls="commitIntelligenceOptions" aria-expanded="${enabled}"`)}
                </div>

                <div id="commitIntelligenceOptions" class="commit-intelligence-options" ${enabled ? '' : 'hidden'} aria-hidden="${!enabled}">
                    <div class="intel-card-module settings-subsection">
                        <h4 class="intel-card-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            Reviewed Generation & Noise Filtering
                        </h4>
                        <p class="intel-card-desc">Control how detailed AI messages should be and filter out clutter.</p>
                        
                        <div class="form-group" style="margin-bottom: 12px;" data-tooltip="Set message detail level: Auto adjusts length automatically, Concise creates quick summaries, Detailed includes full breakdowns.">
                            <label for="commitDetailMode" style="margin-bottom: 4px;">Detail mode</label>
                            ${FormUtils.createSelect('commitDetailMode', [
                                { value: 'legacy', label: 'Legacy (Use Verbose Messages setting)', selected: !this.settings.commit?.detailMode || this.settings.commit.detailMode === 'legacy' },
                                { value: 'auto', label: 'Auto (Adapts length to change complexity)', selected: this.settings.commit?.detailMode === 'auto' },
                                { value: 'concise', label: 'Concise (Short 1-line summary)', selected: this.settings.commit?.detailMode === 'concise' },
                                { value: 'detailed', label: 'Detailed (In-depth multi-bullet explanation)', selected: this.settings.commit?.detailMode === 'detailed' }
                            ]).replace('<select ', '<select data-setting="commit.detailMode" ')}
                        </div>
                        
                        ${toggle(
                            'commitNoiseFilteringEnabled',
                            'Noise filtering',
                            'Ignores lockfiles, minified files, binaries, and minor formatting so the AI focuses on code logic',
                            intelligence?.noiseFilteringEnabled ?? false,
                            'commit.noiseFiltering.enabled',
                            false,
                            'Ignores auto-generated lockfiles (package-lock.json), minified assets, and minor formatting so the AI focuses purely on real code logic.'
                        )}
                    </div>

                    <div class="intel-card-module settings-subsection">
                        <h4 class="intel-card-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                            External Ticket Context
                        </h4>
                        <p class="intel-card-desc">Connect issue details from GitHub into AI commit generation.</p>
                        
                        ${toggle(
                            'githubIssueContextEnabled',
                            'GitHub issue context',
                            'Pulls issue details from GitHub to reference ticket numbers and descriptions',
                            intelligence?.githubIssueContextEnabled ?? false,
                            'commit.githubIssueContext.enabled',
                            false,
                            'Fetch linked issue information from GitHub only when requested so commit messages automatically reference fixed ticket numbers.'
                        )}
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
