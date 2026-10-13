// src/webview/settings/styles/encryptionStatus.css.ts
export function getEncryptionStatusStyles(): string {
    return `
    .encryption-status-report {
        color: var(--vscode-editor-foreground);
        max-width: 680px;
        margin: 0 auto;
        font-family: var(--vscode-font-family);
        box-sizing: border-box;
    }

    /* Hero Banner */
    .encryption-hero {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-sizing: border-box;
    }

    .encryption-hero.hero-active {
        background: rgba(16, 185, 129, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .encryption-hero.hero-inactive {
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .encryption-hero-icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .hero-active .encryption-hero-icon-container {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
    }

    .hero-inactive .encryption-hero-icon-container {
        background: rgba(239, 68, 68, 0.15);
        color: var(--vscode-errorForeground);
    }

    .encryption-hero-text {
        flex: 1;
        min-width: 0;
    }

    .encryption-hero-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 4px;
    }

    .encryption-hero-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .encryption-tier-pill {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        padding: 2px 8px;
        border-radius: 12px;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
    }

    .encryption-hero-desc {
        font-size: 0.85rem;
        color: var(--vscode-descriptionForeground);
        line-height: 1.4;
    }

    /* KPI Grid */
    .encryption-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 20px;
    }

    .encryption-kpi-card {
        background: var(--vscode-input-background, rgba(128, 128, 128, 0.08));
        border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.2));
        border-radius: 6px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .encryption-kpi-value {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--vscode-foreground);
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .encryption-kpi-value.active {
        color: #10b981;
    }

    .encryption-kpi-value.inactive {
        color: var(--vscode-errorForeground);
    }

    .encryption-kpi-label {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
    }

    /* Details Panel */
    .encryption-status-details {
        background: var(--vscode-input-background);
        padding: 14px 16px;
        border-radius: 6px;
        margin-bottom: 20px;
        border: 1px solid var(--vscode-input-border);
    }

    .encryption-status-details-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: var(--vscode-descriptionForeground);
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .encryption-status-details-content {
        color: var(--vscode-editor-foreground);
        font-size: 0.875rem;
        line-height: 1.5;
    }

    /* Provider Sections */
    .encryption-providers-section {
        margin-bottom: 18px;
    }

    .encryption-section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 10px;
        color: var(--vscode-foreground);
    }

    .encryption-count-pill {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 1px 7px;
        border-radius: 10px;
    }

    .encryption-count-pill.encrypted {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
    }

    .encryption-count-pill.plain-text {
        background: rgba(239, 68, 68, 0.15);
        color: var(--vscode-errorForeground);
    }

    .encryption-providers-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .encryption-provider-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 16px;
        font-size: 0.825rem;
        font-weight: 500;
        border: 1px solid;
    }

    .encryption-provider-chip.encrypted {
        background: rgba(16, 185, 129, 0.08);
        color: #10b981;
        border-color: rgba(16, 185, 129, 0.3);
    }

    .encryption-provider-chip.plain-text {
        background: rgba(239, 68, 68, 0.08);
        color: var(--vscode-errorForeground);
        border-color: rgba(239, 68, 68, 0.3);
    }

    /* No keys state */
    .encryption-no-keys {
        background: var(--vscode-input-background);
        padding: 24px;
        border-radius: 6px;
        text-align: center;
        border: 1px solid var(--vscode-input-border);
        margin-bottom: 16px;
    }

    .encryption-no-keys-icon {
        font-size: 28px;
        margin-bottom: 8px;
    }

    .encryption-no-keys-title {
        font-weight: 600;
        font-size: 0.95rem;
        margin-bottom: 4px;
        color: var(--vscode-foreground);
    }

    .encryption-no-keys-description {
        color: var(--vscode-descriptionForeground);
        font-size: 0.85rem;
    }

    /* Security Note Footer */
    .encryption-security-note {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 6px;
        background: var(--vscode-textBlockQuote-background, rgba(128, 128, 128, 0.06));
        border-left: 3px solid var(--vscode-focusBorder);
        font-size: 0.8rem;
        color: var(--vscode-descriptionForeground);
        line-height: 1.45;
        margin-top: 18px;
    }

    .encryption-security-note svg {
        flex-shrink: 0;
        margin-top: 2px;
        color: var(--vscode-focusBorder);
    }

    @media (max-width: 600px) {
        .encryption-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        .encryption-hero {
            flex-direction: column;
            text-align: center;
        }
        .encryption-hero-title-row {
            justify-content: center;
        }
    }
    `;
}
