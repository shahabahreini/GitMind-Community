import { BaseRenderer } from "./BaseRenderer";
import { FormUtils } from "../utils/FormUtils";

/** Pro-only Commit Health and reviewed-workflow controls. Kept out of General Settings. */
export class CommitWorkflowRenderer extends BaseRenderer {
    public render(): string {
        const intelligence = this.settings.commitIntelligence;
        const isPro = this.isProUser() || this.isDevModeEnabled();
        const status = this.settings.health;
        return `
            <section class="pro-commit-workspace" aria-labelledby="proCommitWorkspaceHeading">
                <div class="pro-workspace-heading">
                    <div><span class="section-kicker">Pro workspace</span><h3 id="proCommitWorkspaceHeading" class="section-title">Commit Health & reviewed workflows</h3><p class="section-description">Local change hygiene, alternate drafts, code review, and multi-commit composition in one place.</p></div>
                    <span class="pro-lock-badge">Pro</span>
                </div>
                ${this.renderHealth(isPro, intelligence?.healthEnabled ?? false, status)}
                <div class="workflow-settings-grid">
                    ${this.renderWorkflowCard(isPro, "Draft choices", "Compare concise, detailed, and intent-focused commit drafts.", "commitCandidatesEnabled", "commit.candidates.enabled", intelligence?.candidatesEnabled ?? false)}
                    ${this.renderWorkflowCard(isPro, "Commit composer", "Plan an atomic local series before applying reviewed commits.", "composerEnabled", "composer.enabled", intelligence?.composerEnabled ?? false)}
                    ${this.renderWorkflowCard(isPro, "Hunk splitting", "Allow the composer to place independent text hunks in separate commits.", "allowHunkSplitting", "composer.allowHunkSplitting", intelligence?.allowHunkSplitting ?? false)}
                    ${this.renderWorkflowCard(isPro, "Pre-commit review", "Review AI findings against selected changes before insertion or apply.", "reviewEnabled", "review.enabled", intelligence?.reviewEnabled ?? false)}
                </div>
            </section>`;
    }

    private renderHealth(isPro: boolean, enabled: boolean, status: typeof this.settings.health): string {
        let toggle = FormUtils.createToggle("commitHealthEnabled", "Enable Commit Health", "Assess staged scope, change size, safety, test coverage, and staging.", enabled, "commit.health.enabled");
        if (!isPro) {
            toggle = toggle.replace('class="toggle-item"', 'class="toggle-item locked"').replace('id="commitHealthEnabled"', 'id="commitHealthEnabled" disabled aria-disabled="true"').replace('>Enable Commit Health</label>', '>Enable Commit Health <span class="pro-lock-badge">Pro</span></label>');
        }
        const lastScan = status?.lastScore === undefined ? "No local scan yet" : `Last local scan ${status.lastScore}/100`;
        return `
            <article class="health-settings-card">
                <div class="health-settings-main"><div class="health-settings-copy"><span class="section-kicker">Local only</span><h4>Commit Health</h4><p>Score staged changes—not generated message wording. Local scans never need a provider.</p></div><div class="health-settings-status"><strong>${status?.currentChangeStatus ?? "Checking workspace…"}</strong><span>${lastScan}</span></div></div>
                ${toggle}
                <div class="health-actions"><button type="button" class="button primary" data-command="gitmind.openHealthReport" ${isPro ? "" : "disabled aria-disabled=\"true\""}>Open Health Report</button>${!isPro ? '<span class="field-helper">Activate Pro to use Commit Health and reviewed workflows.</span>' : ''}</div>
                <div class="history-health-panel" aria-labelledby="historyHealthHeading">
                    <div class="history-health-heading"><div><h4 id="historyHealthHeading">History Health</h4><p>Review local commit-change metadata across a focused range.</p></div><span class="local-badge">Local analysis</span></div>
                    <div class="history-health-controls">
                        <label class="compact-field" for="historyHealthMode"><span>Analyze</span><select id="historyHealthMode"><option value="last-n">Last N commits</option><option value="date-range">Date range</option></select></label>
                        <label class="compact-field" id="historyHealthCountField" for="historyHealthCount"><span>Commits</span><input id="historyHealthCount" type="number" min="1" max="500" value="25" /></label>
                        <label class="compact-field history-date-field" for="historyHealthStart"><span>From</span><input id="historyHealthStart" type="date" /></label>
                        <label class="compact-field history-date-field" for="historyHealthEnd"><span>To</span><input id="historyHealthEnd" type="date" /></label>
                        <div class="history-health-actions"><button type="button" class="button primary" id="analyzeHistoryHealth" ${isPro ? "" : "disabled aria-disabled=\"true\""}>Analyze history</button><button type="button" class="button secondary" id="getHistoryHealthGuidance" ${isPro ? "" : "disabled aria-disabled=\"true\""}>Get AI guidance</button></div>
                    </div>
                    <div id="historyHealthResult" class="history-health-result" aria-live="polite">Choose a range to create a local report.</div>
                </div>
            </article>`;
    }

    private renderWorkflowCard(isPro: boolean, label: string, description: string, id: string, setting: string, checked: boolean): string {
        let toggle = FormUtils.createToggle(id, label, description, checked, setting);
        if (!isPro) {toggle = toggle.replace('class="toggle-item"', 'class="toggle-item locked"').replace(`id="${id}"`, `id="${id}" disabled aria-disabled="true"`).replace(`>${label}</label>`, `>${label} <span class="pro-lock-badge">Pro</span></label>`);}
        return `<article class="workflow-setting-card">${toggle}<p>${description}</p></article>`;
    }
}
