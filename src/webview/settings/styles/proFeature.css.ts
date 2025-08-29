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
