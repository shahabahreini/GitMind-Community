// src/webview/settings/styles/tooltip.css.ts
export function getTooltipStyles(): string {
    return `
    /* Tooltip styles */
    [data-tooltip] {
        position: relative;
        cursor: pointer;
    }
    
    [data-tooltip]:before,
    [data-tooltip]:after {
        visibility: hidden;
        opacity: 0;
        pointer-events: none;
        position: absolute;
        z-index: 15000;
        transition: all 0.15s ease;
        transform: translate(-50%, 10px);
        left: 50%;
        bottom: 100%;
    }
    
    /* Tooltip bubble */
    [data-tooltip]:before {
        content: attr(data-tooltip);
        background-color: var(--vscode-editor-background);
        color: var(--vscode-foreground);
        padding: 6px 10px;
        border-radius: 4px;
        white-space: nowrap;
        font-size: 12px;
        margin-bottom: 5px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        border: 1px solid var(--vscode-panel-border);
    }
    
    /* Tooltip arrow */
    [data-tooltip]:after {
        content: '';
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid var(--vscode-panel-border);
        margin-bottom: 0px;
    }
    
    /* Show tooltip on hover */
    [data-tooltip]:hover:before,
    [data-tooltip]:hover:after {
        visibility: visible;
        opacity: 1;
        transform: translate(-50%, 0);
    }
`;
}
