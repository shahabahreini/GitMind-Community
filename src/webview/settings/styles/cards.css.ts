// src/webview/settings/styles/cards.css.ts
export function getCardStyles(): string {
    return `
        /* Clean Minimal Card Styles */
        .minimalist-card {
            background: var(--vscode-editor-background);
            border-radius: 6px;
            border: 1px solid rgba(128, 128, 128, 0.12);
            margin: 0;
            position: relative;
        }

        .card-content {
            padding: 1.25rem;
            position: relative;
        }

        /* High contrast support */
        @media (prefers-contrast: high) {
            .minimalist-card {
                border-width: 2px;
            }
        }
    `;
}
