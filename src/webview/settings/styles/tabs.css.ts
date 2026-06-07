// src/webview/settings/styles/tabs.css.ts
export function getTabStyles(): string {
    return `
    .tabs-container {
        margin-top: 1.5rem;
    }

    /* Clean Minimal Tab Header */
    .tabs-header {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 auto 1rem;
        padding: 0;
        list-style: none;
        gap: 8px;
        position: relative;
    }

    /* Clean Flat Tab Buttons */
    .tab-button {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 36px;
        min-width: 120px;
        padding: 0 16px;
        font-size: 13px;
        font-weight: 500;
        text-align: center;
        text-decoration: none;
        cursor: pointer;
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: 1px solid rgba(128, 128, 128, 0.12);
        border-radius: 6px;
        transition: all 0.2s ease;
    }

    /* Hover Effect - Subtle */
    .tab-button:hover:not(.active) {
        background: var(--vscode-button-secondaryHoverBackground);
        border-color: var(--vscode-button-background);
        color: var(--vscode-button-secondaryForeground);
    }

    /* Active Tab Styling - Simple accent */
    .tab-button.active {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-background);
        font-weight: 600;
    }

    /* Locked Tab Styling */
    .tab-button.locked {
        position: relative;
        cursor: pointer;
        opacity: 0.8;
    }

    .tab-button.locked::before {
        content: "";
        display: inline-block;
        width: 12px;
        height: 12px;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ff5252' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='11' rx='2' ry='2'></rect><path d='M7 11V7a5 5 0 0 1 10 0v4'></path></svg>");
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        margin-right: 6px;
        transition: all 0.25s ease;
    }

    .tab-button.locked:hover {
        border-color: rgba(255, 82, 82, 0.4) !important;
        background: rgba(255, 82, 82, 0.05) !important;
        color: #ff5252 !important;
        opacity: 1;
    }

    .tab-button.locked:hover::before {
        transform: scale(1.15);
    }

    /* Focus visible for accessibility */
    .tab-button:focus-visible {
        outline: 2px solid var(--vscode-focusBorder);
        outline-offset: 2px;
    }

    /* Clean Tab Content */
    .tab-content {
        display: none;
        background: transparent;
        border-radius: 0;
        padding: 20px 0;
        margin-top: 0;
        position: relative;
        border: none;
    }

    .tab-content.active {
        display: block;
        animation: fadeIn 0.2s ease-in-out;
    }

    /* Fade in animation for content */
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-5px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .tabs-header {
            gap: 6px;
        }

        .tab-button {
            min-width: 100px;
            font-size: 12px;
            padding: 0 12px;
            height: 32px;
        }
    }


    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        .tab-button {
            transition: none;
        }

        .tab-content.active {
            animation: none;
        }

        @keyframes fadeIn {
            from, to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
        .tab-button {
            border-width: 2px;
        }

        .tab-button.active {
            border-width: 2px;
        }
    }
`;
}
