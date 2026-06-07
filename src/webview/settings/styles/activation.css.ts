// src/webview/settings/styles/activation.css.ts
export function getActivationStyles(): string {
    return `
    .pro-activation {
        margin-bottom: 24px;
        width: 100%;
        box-sizing: border-box;
    }

    .activation-card-unified {
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.15));
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        position: relative;
        transition: all 0.3s ease;
    }

    .activation-card-unified:hover {
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
    }

    .activation-header {
        margin-bottom: 20px;
    }

    .activation-badge {
        display: inline-block;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        background: rgba(255, 82, 82, 0.1);
        color: #ff5252;
        padding: 3px 8px;
        border-radius: 4px;
        margin-bottom: 10px;
        border: 1px solid rgba(255, 82, 82, 0.2);
    }

    .activation-header h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 6px 0;
        color: var(--vscode-foreground);
    }

    .activation-sub {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        margin: 0;
        line-height: 1.4;
    }

    /* Segmented Tab Bar */
    .activation-tabs-nav {
        display: flex;
        background: var(--vscode-input-background, rgba(128, 128, 128, 0.05));
        padding: 4px;
        border-radius: 8px;
        gap: 4px;
        margin-bottom: 20px;
        border: 1px solid rgba(128, 128, 128, 0.1);
    }

    .activation-tab-btn {
        flex: 1;
        background: transparent;
        border: none;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 500;
        color: var(--vscode-descriptionForeground);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        outline: none;
    }

    .activation-tab-btn:hover:not(.active) {
        color: var(--vscode-foreground);
        background: rgba(128, 128, 128, 0.08);
    }

    .activation-tab-btn.active {
        background: var(--vscode-editor-background);
        color: var(--vscode-foreground);
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    /* Tab Content Area */
    .activation-tab-content {
        animation: activationFadeIn 0.3s ease;
    }

    @keyframes activationFadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .tab-instruction {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        margin-top: 0;
        margin-bottom: 16px;
        line-height: 1.4;
    }

    .tab-instruction code {
        background: var(--vscode-textCodeBlock-background, rgba(128, 128, 128, 0.08));
        padding: 2px 4px;
        border-radius: 4px;
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 11px;
    }

    /* Forms and fields */
    .activation-form-row {
        display: flex;
        gap: 10px;
        align-items: center;
        width: 100%;
    }

    .activation-form-row .input-container {
        flex: 1;
    }

    .activation-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
    }

    .input-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .input-container label {
        font-size: 11px;
        font-weight: 500;
        color: var(--vscode-foreground);
    }

    .license-input-field,
    .order-input-field,
    .email-input-field {
        width: 100%;
        height: 32px;
        padding: 6px 12px;
        border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.2));
        border-radius: 6px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-size: 13px;
        font-family: var(--vscode-editor-font-family, monospace);
        box-sizing: border-box;
        transition: border-color 0.2s ease;
    }

    .email-input-field {
        font-family: var(--vscode-font-family, sans-serif);
    }

    .license-input-field:focus,
    .order-input-field:focus,
    .email-input-field:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }

    .activation-card-unified .action-btn {
        height: 32px;
        font-size: 12px;
        font-weight: 600;
        padding: 0 20px;
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        box-sizing: border-box;
    }

    .activation-card-unified .action-btn.full-width {
        width: 100%;
    }

    /* Active Status Styles */
    .activation-card-unified.active-status {
        border-color: rgba(16, 185, 129, 0.3);
        background: linear-gradient(180deg, var(--vscode-editor-background), rgba(16, 185, 129, 0.01));
    }

    .active-badge {
        display: inline-block;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        padding: 3px 8px;
        border-radius: 4px;
        margin-bottom: 16px;
        border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .activation-status-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
    }

    .status-icon-glow {
        width: 44px;
        height: 44px;
        background: rgba(16, 185, 129, 0.1);
        border: 2px solid rgba(16, 185, 129, 0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #10b981;
        box-shadow: 0 0 16px rgba(16, 185, 129, 0.15);
    }

    .status-info-text h3 {
        font-size: 15px;
        font-weight: 600;
        margin: 0 0 4px 0;
        color: var(--vscode-foreground);
    }

    .validation-time {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin: 0;
    }

    .active-license-details {
        background: var(--vscode-input-background, rgba(128, 128, 128, 0.05));
        border: 1px solid rgba(128, 128, 128, 0.1);
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 20px;
    }

    .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 12px;
    }

    .detail-row:not(:last-child) {
        border-bottom: 1px solid rgba(128, 128, 128, 0.08);
    }

    .detail-label {
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
    }

    .detail-value {
        color: var(--vscode-foreground);
        font-family: var(--vscode-editor-font-family, monospace);
        font-weight: 600;
    }

    .active-actions-row {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
    }

    .active-actions-row button {
        flex: 1;
        height: 32px;
        font-weight: 600;
        font-size: 12px;
    }

    .device-management-note {
        background: rgba(128, 128, 128, 0.03);
        border-radius: 8px;
        padding: 12px 14px;
        border-left: 3px solid var(--vscode-focusBorder, #007acc);
    }

    .device-management-note h5 {
        margin: 0 0 4px 0;
        font-size: 11px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .device-management-note p {
        margin: 0;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.4;
    }

    .device-management-note a {
        color: var(--vscode-textLink-foreground);
        text-decoration: none;
    }

    .device-management-note a:hover {
        text-decoration: underline;
    }

    /* Responsive */
    @media (max-width: 600px) {
        .activation-form-row {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
        }
        .activation-form-row .action-btn {
            width: 100%;
        }
        .activation-form-grid {
            grid-template-columns: 1fr;
            gap: 10px;
        }
        .active-actions-row {
            flex-direction: column;
        }
    }
    `;
}
