// src/webview/settings/styles/status.css.ts
export function getStatusStyles(): string {
    return `
    .verified {
        color: rgba(16, 185, 129, 1);
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .required {
        color: rgba(239, 68, 68, 1);
        margin-left: 0.2rem;
        font-size: 0.75rem;
    }
    
    .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        font-size: 0.85rem;
        border-bottom: none;
        border-radius: 6px;
        transition: background-color 0.2s ease;
    }
    
    .status-item:hover {
        background-color: rgba(128, 128, 128, 0.03);
    }
    
    .status-item:last-child {
        border-bottom: none;
        padding-bottom: 12px;
    }
    
    .status-item:first-child {
        padding-top: 12px;
    }
    
    .status-label {
        font-weight: 500;
        color: var(--vscode-foreground);
        opacity: 0.8;
    }
    
    .status-value {
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        border: none;
    }
    
    .status-value.plan-free {
        color: rgba(100, 116, 139, 1);
        background: rgba(100, 116, 139, 0.1);
    }
    
    .status-value.plan-pro {
        color: rgba(16, 185, 129, 1);
        background: rgba(16, 185, 129, 0.1);
    }
    
    .status-value.status-active {
        color: rgba(16, 185, 129, 1);
        background: rgba(16, 185, 129, 0.1);
    }
    
    .status-value.status-inactive {
        color: rgba(239, 68, 68, 1);
        background: rgba(239, 68, 68, 0.1);
    }
`;
}
