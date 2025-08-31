// src/webview/settings/styles/encryptionStatus.css.ts
export function getEncryptionStatusStyles(): string {
    return `
    .encryption-status-report {
        background: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
        padding: 24px;
        border-radius: 8px;
        max-width: 672px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid var(--vscode-panel-border);
    }

    .encryption-status-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 32px;
    }

    .encryption-status-card {
        background: var(--vscode-input-background);
        padding: 16px;
        border-radius: 8px;
        border: 1px solid var(--vscode-input-border);
    }

    .encryption-status-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
    }

    .encryption-status-card-header svg {
        width: 20px;
        height: 20px;
    }

    .encryption-status-card-header .encryption-icon {
        color: var(--vscode-charts-green);
    }

    .encryption-status-card-header .encryption-icon.inactive {
        color: var(--vscode-errorForeground);
    }

    .encryption-status-card-header .key-icon {
        color: var(--vscode-charts-green);
    }

    .encryption-status-card-header .key-icon.empty {
        color: var(--vscode-descriptionForeground);
    }

    .encryption-status-card-header .info-icon {
        color: var(--vscode-charts-blue);
    }

    .encryption-status-card-title {
        font-weight: 500;
        color: var(--vscode-editor-foreground);
    }

    .encryption-status-card-subtitle {
        font-size: 14px;
        color: var(--vscode-descriptionForeground);
    }

    .encryption-status-details {
        background: var(--vscode-input-background);
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 24px;
        border: 1px solid var(--vscode-input-border);
    }

    .encryption-status-details-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
    }

    .encryption-status-details-header svg {
        color: var(--vscode-charts-blue);
        width: 16px;
        height: 16px;
    }

    .encryption-status-details-title {
        font-weight: 500;
        font-size: 14px;
        color: var(--vscode-descriptionForeground);
    }

    .encryption-status-details-content {
        color: var(--vscode-editor-foreground);
        font-size: 14px;
        line-height: 1.5;
    }

    .encryption-providers-section {
        margin-bottom: 24px;
    }

    .encryption-providers-title {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 12px;
        color: var(--vscode-descriptionForeground);
    }

    .encryption-providers-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .encryption-provider-tag {
        padding: 4px 12px;
        background: var(--vscode-input-background);
        border-radius: 9999px;
        font-size: 14px;
        border: 1px solid;
    }

    .encryption-provider-tag.encrypted {
        color: var(--vscode-charts-green);
        border-color: var(--vscode-charts-green);
    }

    .encryption-provider-tag.plain-text {
        color: var(--vscode-errorForeground);
        border-color: var(--vscode-errorForeground);
    }

    .encryption-no-keys {
        background: var(--vscode-input-background);
        padding: 24px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid var(--vscode-input-border);
    }

    .encryption-no-keys-icon {
        font-size: 32px;
        margin-bottom: 16px;
    }

    .encryption-no-keys-title {
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--vscode-editor-foreground);
    }

    .encryption-no-keys-description {
        color: var(--vscode-descriptionForeground);
        font-size: 14px;
    }

    @media (max-width: 600px) {
        .encryption-status-grid {
            grid-template-columns: 1fr;
            gap: 16px;
        }
    }
    `;
}
