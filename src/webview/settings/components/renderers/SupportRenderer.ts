import { BaseRenderer } from "./BaseRenderer";

export class SupportRenderer extends BaseRenderer {
  public render(): string {
    const isPro = this.isProUser() || this.isDevModeEnabled();
    const disabled = isPro ? "" : "disabled";
    const lock = isPro ? "" : '<span class="pro-lock-badge">Pro Locked</span>';
    return `
      <div class="minimalist-card">
        <div class="card-content">
          <div class="section-header">
            <h3 class="section-title">Sanitized Support Report ${lock}</h3>
            <div class="section-description">Create a local privacy-safe report for serious troubleshooting. Nothing is uploaded automatically.</div>
          </div>
          <div class="setting-desc">
            <p><strong>How to report an issue</strong></p>
            <ol>
              <li>Start a 30-minute support session.</li>
              <li>Reproduce the problem in GitMind.</li>
              <li>Stop the session, review the privacy summary, and save the JSON report.</li>
              <li>Review the saved file and attach it manually to a GitHub issue.</li>
            </ol>
            <p><strong>Never collected:</strong> source code, diffs, prompts, commit content, file/repository paths, URLs, credentials, API bodies, raw errors, email, or license/customer data.</p>
            <p>The session is held only in memory, stops automatically after 30 minutes, and is erased when GitMind or VS Code restarts.</p>
          </div>
          <div class="commit-options-row action-row">
            <button class="action-button primary support-report-command" data-command="gitmind.startSupportSession" ${disabled}>Start Session</button>
            <button class="action-button secondary support-report-command" data-command="gitmind.stopSupportSession" ${disabled}>Stop &amp; Review</button>
            <button class="action-button secondary support-report-command" data-command="gitmind.saveSupportReport" ${disabled}>Save Report</button>
            <button class="action-button secondary support-report-command" data-command="gitmind.deleteSupportSession" ${disabled}>Delete Session</button>
          </div>
          ${isPro ? "" : '<div class="pro-upsell"><p>Activate GitMind Pro to create sanitized support reports.</p></div>'}
        </div>
      </div>
      <script>
        document.querySelectorAll('.support-report-command').forEach(function(button) {
          button.addEventListener('click', function() {
            if (typeof vscode !== 'undefined') {
              vscode.postMessage({ command: 'executeCommand', commandId: button.dataset.command });
            }
          });
        });
      </script>
    `;
  }
}
