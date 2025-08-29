// src/webview/settings/styles/cards.css.ts
export function getCardStyles(): string {
    return `
        /* Card Styles */
        .minimalist-card {
            background: var(--vscode-editor-background);
            border-radius: 4px;
            border: 1px solid var(--vscode-panel-border);
            margin: 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .card-content {
            padding: 1rem;
        }
    `;
}
