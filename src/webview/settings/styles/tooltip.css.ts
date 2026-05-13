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
        padding: 8px 12px;
        border-radius: 6px;
        white-space: normal;
        max-width: 250px;
        width: max-content;
        min-width: 150px;
        font-size: 11px;
        line-height: 1.4;
        margin-bottom: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        border: 1px solid var(--vscode-panel-border);
        text-align: center;
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
