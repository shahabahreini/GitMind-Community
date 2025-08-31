// src/webview/settings/styles/detailedStatus.css.ts
export function getDetailedStatusStyles(): string {
    return `
    /* Modal specific styles - scoped to prevent interference with main page */
    .status-modal .modal-overlay {
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
        padding: 8px;
    }

    @media (min-width: 768px) {
        .status-modal .modal-overlay {
            padding: 20px;
        }
    }

    .status-modal .modal-content {
        background: var(--vscode-editor-background);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        width: calc(100% - 16px);
        max-width: 400px;
        max-height: 95vh;
        display: flex;
        flex-direction: column;
        animation: modalFadeIn 0.2s ease-out;
        margin: 0 auto;
        overflow: hidden;
        box-sizing: border-box;
    }

    @media (min-width: 480px) {
        .status-modal .modal-content {
            width: 95%;
            max-width: 500px;
            max-height: 90vh;
        }
    }

    @media (min-width: 768px) {
        .status-modal .modal-content {
            width: 90%;
            max-width: 600px;
            max-height: 85vh;
        }
    }

    @media (min-width: 1024px) {
        .status-modal .modal-content {
            width: 80%;
            max-width: 650px;
        }
    }

    .status-modal .modal-header {
        padding: 8px 12px;
        border-bottom: 1px solid var(--vscode-widget-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
    }

    @media (min-width: 480px) {
        .status-modal .modal-header {
            padding: 12px 16px;
        }
    }

    .status-modal .modal-header h3 {
        margin: 0;
        color: var(--vscode-foreground);
    }

    .status-modal .modal-close {
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

    .status-modal .modal-close:hover {
        background: var(--vscode-toolbar-hoverBackground);
    }

    .status-modal .modal-body {
        padding: 8px 12px;
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        min-height: 0;
    }

    @media (min-width: 480px) {
        .status-modal .modal-body {
            padding: 12px 16px;
        }
    }

    @media (min-width: 768px) {
        .status-modal .modal-body {
            padding: 16px 20px;
        }
    }

    .status-modal .modal-footer {
        padding: 8px 12px;
        border-top: 1px solid var(--vscode-widget-border);
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        flex-shrink: 0;
    }

    @media (min-width: 480px) {
        .status-modal .modal-footer {
            padding: 12px 16px;
        }
    }

    .status-modal .status-details {
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

    .status-modal .status-html-content {
        font-family: var(--vscode-font-family);
        font-size: 13px;
        line-height: 1.4;
        color: var(--vscode-foreground);
        width: 100%;
        box-sizing: border-box;
        overflow-wrap: break-word;
        word-wrap: break-word;
    }

    .status-modal .encryption-status-report {
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
    }

    .status-modal .status-header {
        margin-bottom: 20px;
    }

    .status-modal .status-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        margin-bottom: 12px;
        width: 100%;
        box-sizing: border-box;
        justify-items: stretch;
        overflow: hidden;
    }

    @media (min-width: 600px) {
        .status-modal .status-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 16px;
            justify-items: center;
        }
    }

    @media (min-width: 768px) {
        .status-modal .status-grid {
            gap: 16px;
        }
    }

    .status-modal .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: var(--vscode-editor-inactiveSelectionBackground);
        border-radius: 4px;
    }

    .status-modal .status-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        border-radius: 6px;
        border: 1px solid var(--vscode-widget-border);
        min-width: 0;
        width: 100%;
        max-width: 100%;
        overflow: hidden;
        box-sizing: border-box;
    }

    @media (min-width: 480px) {
        .status-modal .status-indicator {
            gap: 8px;
            padding: 8px 10px;
        }
    }

    @media (min-width: 600px) {
        .status-modal .status-indicator {
            max-width: 280px;
            width: auto;
        }
    }

    .status-modal .status-indicator.status-active {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
    }

    .status-modal .status-indicator.status-inactive {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.3);
    }

    .status-modal .status-icon {
        font-size: 18px;
        flex-shrink: 0;
    }

    @media (min-width: 480px) {
        .status-modal .status-icon {
            font-size: 20px;
        }
    }

    @media (min-width: 768px) {
        .status-modal .status-icon {
            font-size: 24px;
        }
    }

    .status-modal .status-text {
        flex: 1;
        min-width: 0;
        overflow: hidden;
    }

    .status-modal .status-title {
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    @media (min-width: 480px) {
        .status-modal .status-title {
            font-size: 13px;
        }
    }

    @media (min-width: 768px) {
        .status-modal .status-title {
            font-size: 14px;
        }
    }

    .status-modal .status-subtitle {
        font-size: 10px;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    @media (min-width: 480px) {
        .status-modal .status-subtitle {
            font-size: 11px;
            letter-spacing: 0.5px;
        }
    }
    
    /* Status item value variants */
    .status-modal .status-item .label {
        font-weight: 500;
        opacity: 0.8;
    }

    .status-modal .status-item .value {
        font-weight: 600;
    }

    .status-modal .status-item .value.success {
        color: var(--vscode-charts-green);
    }

    .status-modal .status-item .value.warning {
        color: var(--vscode-charts-orange);
    }

    .status-modal .status-item .value.error {
        color: var(--vscode-charts-red);
    }
    
    /* Section styling */
    .status-modal .status-section {
        margin-bottom: 12px;
    }

    .status-modal .section-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--vscode-foreground);
    }

    .status-modal .reason-text {
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
        background: var(--vscode-textCodeBlock-background);
        padding: 8px 12px;
        border-radius: 4px;
        border-left: 3px solid var(--vscode-activityBarBadge-background);
    }
    
    /* Provider tags */
    .status-modal .provider-list {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        margin-top: 6px;
        justify-content: flex-start;
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
    }

    @media (min-width: 480px) {
        .status-modal .provider-list {
            gap: 4px;
            margin-top: 8px;
        }
    }

    .status-modal .provider-tag {
        padding: 3px 6px;
        border-radius: 10px;
        font-size: 9px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.2px;
        display: inline-block;
        white-space: nowrap;
        flex-shrink: 1;
        min-width: 0;
        box-sizing: border-box;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 80px;
    }

    @media (min-width: 480px) {
        .status-modal .provider-tag {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            letter-spacing: 0.3px;
        }
    }

    .status-modal .provider-tag.encrypted {
        background: rgba(16, 185, 129, 0.1);
        color: var(--vscode-charts-green);
        border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .status-modal .provider-tag.plain-text {
        background: rgba(255, 193, 7, 0.1);
        color: var(--vscode-charts-orange);
        border: 1px solid rgba(255, 193, 7, 0.3);
    }

    .status-modal .empty-state {
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
