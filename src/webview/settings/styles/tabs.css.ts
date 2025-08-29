// src/webview/settings/styles/tabs.css.ts
export function getTabStyles(): string {
    return `
    .tabs-container {
        margin-top: 1rem;
    }
    
    .tabs-header {
        display: flex;
        border-bottom: 1px solid var(--vscode-panel-border);
        margin-bottom: 1rem;
    }
    
    .tab-button {
        background: transparent;
        border: none;
        padding: 0.5rem 1.5rem;
        cursor: pointer;
        color: var(--vscode-foreground);
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
        font-size: 1rem;
        font-weight: 500;
        letter-spacing: 0.02em;
    }
    
    .tab-button.active {
        border-bottom: 2px solid var(--vscode-button-background);
        font-weight: 600;
        color: var(--vscode-button-background);
        background: var(--vscode-editor-background);
    }
    
    .tab-content {
        display: none;
    }
    
    .tab-content.active {
        display: block;
    }
`;
}
