// src/webview/settings/styles/proFeature.css.ts
export function getProFeatureStyles(): string {
    return `
    .pro-feature-container {
        margin: 0;
        padding: 0;
    }
    
    .section-divider {
        height: 1px;
        background: var(--vscode-panel-border);
        margin: 1rem 0;
    }

    .automatic-recovery-card {
        margin-top: 14px;
        padding: 12px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        background: color-mix(in srgb, var(--vscode-editor-background) 94%, var(--vscode-foreground) 6%);
    }

    .automatic-recovery-header,
    .automatic-recovery-option,
    .automatic-recovery-option-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }

    .automatic-recovery-header {
        padding-bottom: 10px;
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .automatic-recovery-header h3 {
        margin: 0;
        font-size: 13px;
        line-height: 1.25;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .automatic-recovery-header p {
        margin: 2px 0 0;
        font-size: 11px;
        line-height: 1.3;
        color: var(--vscode-descriptionForeground);
    }

    .automatic-recovery-badge {
        flex: none;
        padding: 2px 7px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 600;
        color: var(--vscode-badge-foreground);
        background: var(--vscode-badge-background);
    }

    .automatic-recovery-badge.locked {
        color: var(--vscode-descriptionForeground);
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
    }

    .automatic-recovery-option {
        min-height: 34px;
        padding-top: 9px;
    }

    .automatic-recovery-option + .automatic-recovery-option {
        margin-top: 8px;
        border-top: 1px solid color-mix(in srgb, var(--vscode-panel-border) 65%, transparent);
    }

    .automatic-recovery-option.fallback {
        display: block;
    }

    .automatic-recovery-copy {
        min-width: 0;
    }

    .automatic-recovery-copy span {
        display: block;
        font-size: 12px;
        line-height: 1.3;
        font-weight: 500;
        color: var(--vscode-foreground);
    }

    .automatic-recovery-copy small {
        display: block;
        margin-top: 1px;
        font-size: 10px;
        line-height: 1.3;
        color: var(--vscode-descriptionForeground);
    }

    .automatic-recovery-fallback-select {
        margin-top: 8px;
    }

    .automatic-recovery-fallback-select .searchable-select-container {
        width: 100%;
    }

    .automatic-recovery-card.locked {
        cursor: pointer;
    }

    .automatic-recovery-card.locked .automatic-recovery-option,
    .automatic-recovery-card.locked .automatic-recovery-fallback-select {
        opacity: 0.55;
    }

    @media (max-width: 520px) {
        .automatic-recovery-card {
            padding: 10px;
        }

        .automatic-recovery-copy small {
            max-width: 230px;
        }
    }
    
    .section-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--vscode-foreground);
        margin-bottom: 0.6rem;
        padding-bottom: 0.2rem;
        border-bottom: 2px solid var(--vscode-button-background);
        display: inline-block;
    }
    
    .encryption-section, .activation-section {
        margin-bottom: 0.75rem;
    }
    
    .encryption-status-section {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid var(--vscode-panel-border);
        text-align: center;
    }
    
    /* Responsive adjustments for smaller screens */
    @media (max-width: 600px) {
        .activation-methods {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }
        
        .subscription-actions {
            flex-direction: column;
        }
        
        .action-button {
            justify-content: center;
        }
    }
`;
}
