// src/webview/settings/components/ButtonGroup.ts
export class ButtonGroup {
    public render(): string {
        return `
      <div class="button-group">
        <button onclick="checkApiSetup()" class="button">Check API Setup</button>
        <button onclick="checkRateLimits()" class="button">Check Rate Limits</button>
        <button onclick="saveSettings()" class="button primary">Save Settings</button>
      </div>`;
    }
}
