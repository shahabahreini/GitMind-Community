// src/webview/settings/styles/detailedStatus.css.ts
export function getDetailedStatusStyles(): string {
    return `
    /* Modal specific styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: 20px;
    }

    .modal-content {
        background: var(--vscode-editor-background);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        animation: modalFadeIn 0.2s ease-out;
        margin: 0 auto;
    }

    .modal-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--vscode-widget-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h3 {
        margin: 0;
        color: var(--vscode-foreground);
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--vscode-foreground);
        padding: 0;
        width: 30px;
        height: 30px;
        border-radius: 4px;
    }

    .modal-close:hover {
        background: var(--vscode-toolbar-hoverBackground);
    }

    .modal-body {
        padding: 24px;
        max-height: 500px;
        overflow-y: auto;
    }

    .status-details {
        font-family: var(--vscode-editor-font-family);
        font-size: 13px;
        line-height: 1.4;
        margin: 0;
        color: var(--vscode-foreground);
        white-space: pre-wrap;
        background: var(--vscode-textCodeBlock-background);
        padding: 12px;
        border-radius: 4px;
    }

    .status-html-content {
        font-family: var(--vscode-font-family);
        font-size: 13px;
        line-height: 1.4;
        color: var(--vscode-foreground);
    }

    .encryption-status-report {
        width: 100%;
    }

    .status-header {
        margin-bottom: 20px;
    }

    .status-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 24px;
    }

    .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: var(--vscode-editor-inactiveSelectionBackground);
        border-radius: 4px;
    }

    .status-indicator {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--vscode-widget-border);
    }

    .status-indicator.status-active {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
    }

    .status-indicator.status-inactive {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.3);
    }

    .status-icon {
        font-size: 24px;
    }

    .status-text {
        flex: 1;
    }

    .status-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 2px;
    }

    .status-subtitle {
        font-size: 12px;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* Status item value variants */
    .status-item .label {
        font-weight: 500;
        opacity: 0.8;
    }

    .status-item .value {
        font-weight: 600;
    }

    .status-item .value.success {
        color: var(--vscode-charts-green);
    }

    .status-item .value.warning {
        color: var(--vscode-charts-orange);
    }

    .status-item .value.error {
        color: var(--vscode-charts-red);
    }
    
    /* Section styling */
    .status-section {
        margin-bottom: 16px;
    }

    .section-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--vscode-foreground);
    }

    .reason-text {
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
        background: var(--vscode-textCodeBlock-background);
        padding: 8px 12px;
        border-radius: 4px;
        border-left: 3px solid var(--vscode-activityBarBadge-background);
    }
    
    /* Provider tags */
    .provider-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .provider-tag {
        padding: 5px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: inline-block;
    }

    .provider-tag.encrypted {
        background: rgba(16, 185, 129, 0.1);
        color: var(--vscode-charts-green);
        border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .provider-tag.plain-text {
        background: rgba(255, 193, 7, 0.1);
        color: var(--vscode-charts-orange);
        border: 1px solid rgba(255, 193, 7, 0.3);
    }

    .empty-state {
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
        text-align: center;
        padding: 16px;
        background: var(--vscode-editor-inactiveSelectionBackground);
        border-radius: 6px;
        margin: 8px 0;
    }

    @keyframes modalFadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
    `;
}
