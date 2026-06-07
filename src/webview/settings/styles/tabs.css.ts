// src/webview/settings/styles/tabs.css.ts
export function getTabStyles(): string {
    return `
    .tabs-container {
        margin-top: 1.5rem;
    }

    /* Unified Flat Segmented Control Track */
    .tabs-header {
        display: flex;
        background: rgba(128, 128, 128, 0.05);
        border: 1px solid var(--gm-border-color, rgba(128, 128, 128, 0.12));
        border-radius: 8px;
        padding: 3px;
        margin: 0 auto 1.25rem;
        list-style: none;
        gap: 2px;
        align-items: center;
        justify-content: center;
        width: fit-content;
    }

    /* Clean Flat Tab Buttons */
    .tab-button {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 30px;
        min-width: 110px;
        padding: 0 16px;
        font-size: 12px;
        font-weight: 500;
        text-align: center;
        text-decoration: none;
        cursor: pointer;
        background: transparent;
        color: var(--vscode-foreground);
        border: none;
        border-radius: 6px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        outline: none;
        opacity: 0.65;
    }

    /* Hover Effect - Subtle Track Pill */
    .tab-button:hover:not(.active):not(.locked) {
        background: var(--vscode-toolbar-hoverBackground, rgba(128, 128, 128, 0.05));
        color: var(--vscode-foreground);
        opacity: 0.95;
    }

    /* Active Tab Styling - Accent Pill */
    .tab-button.active {
        background: var(--vscode-button-background);
        color: #ffffff;
        font-weight: 600;
        opacity: 1;
    }

    /* Active Tab Hover - Slight dim, always white text */
    .tab-button.active:hover {
        background: var(--vscode-button-hoverBackground, var(--vscode-button-background));
        color: #ffffff;
        opacity: 0.9;
    }

    /* Locked Tab Styling */
    .tab-button.locked {
        position: relative;
        cursor: pointer;
    }

    .tab-button.locked::before {
        content: "";
        display: inline-block;
        width: 11px;
        height: 11px;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ff5252' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='11' rx='2' ry='2'></rect><path d='M7 11V7a5 5 0 0 1 10 0v4'></path></svg>");
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        margin-right: 5px;
        transition: all 0.2s ease;
    }

    .tab-button.locked:hover:not(.active) {
        background: rgba(255, 82, 82, 0.08) !important;
        color: #ff5252 !important;
        opacity: 1;
    }

    .tab-button.locked:hover::before {
        transform: scale(1.1);
    }

    /* Focus visible for accessibility */
    .tab-button:focus-visible {
        outline: 2px solid var(--vscode-focusBorder);
        outline-offset: 1px;
    }

    /* Clean Tab Content */
    .tab-content {
        display: none;
        background: transparent;
        border-radius: 0;
        padding: 16px 0;
        margin-top: 0;
        position: relative;
        border: none;
    }

    .tab-content.active {
        display: block;
        animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Fade in animation for content */
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-3px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .tabs-header {
            gap: 2px;
            padding: 2px;
        }

        .tab-button {
            min-width: 90px;
            font-size: 11px;
            padding: 0 10px;
            height: 26px;
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
            border: 1px solid transparent;
        }

        .tab-button.active {
            border: 2px solid var(--vscode-contrastBorder, var(--vscode-focusBorder));
        }
    }
`;
}
