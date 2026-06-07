// src/webview/settings/styles/activation.css.ts
export function getActivationStyles(): string {
    return `
    .activation-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .activation-methods {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
    
    .activation-method {
        padding: 16px;
        border: none;
        border-radius: 8px;
        background: var(--vscode-editor-background);
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    
    .activation-method:hover {
        border-color: transparent;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
    }
    
    .activation-method h5 {
        margin: 0 0 6px 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
        line-height: 1.2;
    }
    
    .method-description {
        margin: 0 0 10px 0;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.3;
    }
    
    .activation-card-highlight {
        border: 1px solid rgba(59, 130, 246, 0.4) !important;
        background: rgba(59, 130, 246, 0.06);
        border-radius: 8px;
        padding: 14px 16px;
        margin-bottom: 14px;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
    }

    .activation-card-highlight h4 {
        margin: 0 0 6px 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .activation-card-highlight p {
        margin: 0 0 10px 0;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.4;
    }

    .input-group {
        display: flex;
        gap: 6px;
        align-items: stretch;
        margin-bottom: 8px;
    }
    
    .license-input, .order-input {
        flex: 1;
        font-family: var(--vscode-editor-font-family, monospace);
        min-width: 0;
        font-size: 12px;
        height: 28px;
        padding: 6px 8px;
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        box-sizing: border-box;
    }
    
    .activated-input {
        background-color: rgba(162, 213, 198, 0.8) !important;
        color: #333 !important;
        border-color: rgba(110, 184, 168, 1) !important;
        opacity: 0.9;
        cursor: not-allowed;
    }
    
    .activated-input:disabled {
        background-color: rgba(162, 213, 198, 0.8) !important;
        color: #333 !important;
        border-color: rgba(110, 184, 168, 1) !important;
        opacity: 0.9;
        cursor: not-allowed;
    }
    
    .activation-button {
        background: rgba(59, 130, 246, 1);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
        transition: all 0.2s ease;
        flex-shrink: 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        height: 28px;
        line-height: 16px;
        box-sizing: border-box;
    }
    
    .activation-button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
    
    .activation-status {
        margin-top: 8px;
        padding: 6px 10px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 500;
        border: none;
        min-height: 20px;
    }
    
    .activation-status.status-valid {
        background: rgba(16, 185, 129, 0.1);
        border: none;
        color: rgba(16, 185, 129, 1);
    }
    
    .activation-status.status-invalid {
        background: rgba(239, 68, 68, 0.1);
        border: none;
        color: rgba(239, 68, 68, 1);
    }
    
    .status-indicator {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    
    .activation-status.status-valid .status-indicator {
        background: rgba(16, 185, 129, 1);
    }
    
    .activation-status.status-invalid .status-indicator {
        background: rgba(239, 68, 68, 1);
    }
    
    .pro-status-panel {
        margin-top: 8px;
        padding: 10px 12px;
        background: rgba(16, 185, 129, 0.05);
        border: none;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 32px;
    }
    
    .status-header {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }
    
    .pro-badge {
        background: rgba(16, 185, 129, 1);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.025em;
        text-transform: uppercase;
        line-height: 1;
        height: 16px;
        display: flex;
        align-items: center;
    }
    
    .validation-info {
        color: rgba(6, 95, 70, 1);
        font-size: 11px;
        margin: 0;
        flex: 1;
    }
    
    .pro-actions {
        display: flex;
        gap: 6px;
        margin: 0;
    }
    
    .validate-button, .deactivate-button {
        background: transparent;
        border: 1px solid rgba(16, 185, 129, 0.3);
        color: rgba(16, 185, 129, 1);
        border-radius: 4px;
        font-weight: 500;
        padding: 4px 8px;
        transition: all 0.2s ease;
        cursor: pointer;
        font-size: 10px;
        line-height: 1;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        height: 20px;
        box-sizing: border-box;
    }
    
    .deactivate-button {
        border-color: rgba(239, 68, 68, 0.3);
        color: rgba(239, 68, 68, 1);
    }
    
    .validate-button:hover {
        background: rgba(16, 185, 129, 1);
        color: white;
    }
    
    .deactivate-button:hover {
        background: rgba(239, 68, 68, 1);
        color: white;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .activation-methods {
            grid-template-columns: 1fr;
            gap: 12px;
        }
        
        .pro-status-panel {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
        }
        
        .pro-actions {
            align-self: stretch;
            justify-content: flex-end;
        }
    }

    @media (max-width: 480px) {
        .activation-method {
            padding: 12px;
        }
        
        .input-group {
            flex-direction: column;
            gap: 8px;
        }
        
        .activation-button {
            width: 100%;
            text-align: center;
        }
        
        .pro-actions {
            flex-direction: column;
            gap: 6px;
        }
        
        .validate-button, .deactivate-button {
            width: 100%;
            justify-content: center;
        }
    }
`;
}
