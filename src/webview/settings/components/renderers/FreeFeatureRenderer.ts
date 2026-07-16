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
                    ${this.renderCommitHealth()}
                    ${this.renderCommitIntelligence()}
                    
                    ${this.renderUpgradePromptIfNeeded()}
                </div>
            </div>
        `;
    }

    private renderCommitHealth(): string {
        const intelligence = this.settings.commitIntelligence;
        const enabled = intelligence?.healthEnabled ?? false;
        const isPro = this.isProUser() || this.isDevModeEnabled();
        const status = this.settings.health;
        let toggle = FormUtils.createToggle('commitHealthEnabled', 'Enable Commit Health', 'Locally score staged changes for scope, size, safety, tests, and staging.', enabled, 'commit.health.enabled');
        if (!isPro) {
            toggle = toggle.replace('class="toggle-item"', 'class="toggle-item locked"')
                .replace('id="commitHealthEnabled"', 'id="commitHealthEnabled" disabled aria-disabled="true"')
                .replace('>Enable Commit Health</label>', '>Enable Commit Health <span class="pro-lock-badge" title="Requires GitMind Pro">Pro</span></label>');
        }
        return `
            <section class="commit-intelligence-settings" aria-labelledby="commitHealthHeading">
                <div class="commit-intelligence-banner">
                    <div class="commit-intelligence-banner-header"><h3 id="commitHealthHeading" class="section-header" style="margin:0;">Commit Health</h3><span class="commit-intelligence-badge">Local</span></div>
                    <p class="description" style="margin-bottom:12px;">A deterministic, local change-hygiene report. It evaluates staged content and metadata only—never AI output or commit-message wording.</p>
                    ${toggle}
                    ${isPro ? '<button type="button" class="button secondary" data-command="gitmind.openHealthReport">Open Health Report</button>' : '<p class="toggle-description">Commit Health is available with GitMind Pro. Activate Pro to enable local reports and history analysis.</p>'}
                    <p class="toggle-description"><strong>Status:</strong> ${status?.currentChangeStatus ?? 'Checking workspace…'}${status?.lastScore !== undefined ? ` · Last local scan: ${status.lastScore}/100` : ''}${status?.lastScanAt ? ` (${new Date(status.lastScanAt).toLocaleString()})` : ''}</p>
                </div>
                <div class="intel-card-module settings-subsection" aria-labelledby="historyHealthHeading">
                    <h4 id="historyHealthHeading" class="intel-card-title">History Health</h4>
                    <p class="intel-card-desc">Analyze local commit change metadata without sending repository content to a provider.</p>
                    <label for="historyHealthMode">Range</label>
                    <select id="historyHealthMode"><option value="last-n">Last N commits</option><option value="date-range">Date range</option></select>
                    <input id="historyHealthCount" type="number" min="1" max="500" value="25" aria-label="Number of commits" />
                    <input id="historyHealthStart" type="date" aria-label="History start date" />
                    <input id="historyHealthEnd" type="date" aria-label="History end date" />
                    <button type="button" class="button secondary" id="analyzeHistoryHealth" ${isPro ? '' : 'disabled aria-disabled="true"'}>Analyze History</button>
                    <button type="button" class="button secondary" id="getHistoryHealthGuidance" ${isPro ? '' : 'disabled aria-disabled="true"'}>Get AI Guidance</button>
                    <div id="historyHealthResult" class="toggle-description" aria-live="polite"></div>
                </div>
            </section>`;
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
                    <p class="description" style="margin-bottom:12px;">Smart AI assistance that inspects, filters, and refines code changes before committing. One-click instant generation remains unaffected.</p>
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                            Draft Options & Commit Quality
                        </h4>
                        <p class="intel-card-desc">Generate alternate message options and check commits for common issues.</p>
                        
                        ${toggle(
                            'commitCandidatesEnabled',
                            'Candidates',
                            'Generate 2–3 alternative commit message choices to compare and choose from',
                            intelligence?.candidatesEnabled ?? false,
                            'commit.candidates.enabled',
                            true,
                            'Generates 2–3 alternate commit message choices side-by-side so you can pick or combine the best message.'
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

                    <div class="intel-card-module settings-subsection">
                        <h4 class="intel-card-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                            Advanced Pro Workflows
                        </h4>
                        <p class="intel-card-desc">Compose multi-commit series, split hunks, and review AI suggestions.</p>
                        
                        ${toggle(
                            'composerEnabled',
                            'Composer',
                            'Split a large batch of changes into a clean sequence of smaller sub-commits',
                            intelligence?.composerEnabled ?? false,
                            'composer.enabled',
                            true,
                            'Composes large multi-file changes into an organized sequence of smaller, logical sub-commits.'
                        )}
                        ${toggle(
                            'allowHunkSplitting',
                            'Hunk splitting',
                            'Allows breaking apart individual code changes within a file across separate commits',
                            intelligence?.allowHunkSplitting ?? false,
                            'composer.allowHunkSplitting',
                            true,
                            'Allows splitting individual sections of changes inside a single file into separate commits.'
                        )}
                        ${toggle(
                            'reviewEnabled',
                            'Pre-commit review',
                            'Displays a final review window to confirm AI commit suggestions before inserting',
                            intelligence?.reviewEnabled ?? false,
                            'review.enabled',
                            true,
                            'Shows an interactive review panel to check and confirm AI suggestions before anything is saved to Git.'
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
