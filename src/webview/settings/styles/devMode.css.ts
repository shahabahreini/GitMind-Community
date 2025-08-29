// src/webview/settings/styles/devMode.css.ts
export function getDevModeStyles(): string {
    return `
    .dev-mode-notice {
        margin-top: 1rem;
        padding: 0.6rem;
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 1px solid #f59e0b;
        border-radius: 3px;
    }
    
    .dev-mode-notice .notice-header {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: #92400e;
    }
`;
}
