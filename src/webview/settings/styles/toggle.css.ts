// src/webview/settings/styles/toggle.css.ts
export function getToggleStyles(): string {
    return `
    /* Toggle Item Container - Enhanced */
    .toggle-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 16px;
        margin-bottom: 8px;
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        transition: all 0.2s ease;
        min-height: auto;
        position: relative;
    }
    
    .toggle-item:hover {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        transform: translateY(-1px);
    }
    
    .toggle-item:last-child {
        margin-bottom: 0;
    }

    .toggle-item:focus-within {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .toggle-content {
        flex: 1;
    }

    .toggle-label {
        font-size: 13px;
        color: var(--vscode-editor-foreground);
        cursor: pointer;
    }

    /* Modern Switch Container - Exact Pro Features Modern Sizing */
    .switch-container {
        position: relative;
        border-radius: 11px;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 40px;
        height: 22px;
        flex-shrink: 0;
        background-color: rgba(128, 128, 128, 0.2);
        border: none;
        box-shadow: none;
        pointer-events: auto;
        overflow: visible;
    }
    
    .switch-input {
        opacity: 0;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        margin: 0;
        padding: 0;
        cursor: pointer;
        z-index: 2;
        pointer-events: auto;
        -webkit-appearance: none;
        appearance: none;
    }
    
    .switch-button {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 12px;
        pointer-events: none;
    }

    .switch-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background: var(--vscode-editor-background);
        border-radius: 50%;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        border: 1px solid var(--vscode-focusBorder);
        pointer-events: none;
    }

    .switch-input:checked + .switch-button .switch-slider {
        transform: translateX(20px);
        background-color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-foreground);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    .switch-container:has(.switch-input:checked),
    .switch-container.active {
        background-color: var(--vscode-button-background);
        border-color: var(--vscode-button-background);
        box-shadow: 0 0 0 1px var(--vscode-button-background);
    }

    .switch-input:disabled + .switch-button {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .switch-container.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
        border-color: var(--vscode-input-border);
    }

    .switch-container:hover:not(.disabled) {
        border-color: var(--vscode-button-background);
        box-shadow: 0 0 0 1px var(--vscode-button-background);
    }

    /* Legacy Toggle Switch Support - Updated to match Pro Features Modern exactly */
    .toggle-switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 22px;
        margin-right: 12px;
        flex-shrink: 0;
        margin-top: 2px;
        border-radius: 11px;
        cursor: pointer;
        transition: all 0.3s ease;
        background-color: rgba(128, 128, 128, 0.2);
        border: none;
        box-shadow: none;
        pointer-events: auto;
        overflow: visible;
    }
    
    .toggle-switch input[type="checkbox"] {
        opacity: 0;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        margin: 0;
        padding: 0;
        cursor: pointer;
        z-index: 2;
        pointer-events: auto;
        -webkit-appearance: none;
        appearance: none;
    }
    
    .toggle-slider {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 12px;
        pointer-events: none;
    }
    
    .toggle-slider:before {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background: var(--vscode-editor-background);
        border-radius: 50%;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        border: 1px solid var(--vscode-focusBorder);
        pointer-events: none;
    }
    
    /* Checked State */
    .toggle-switch input:checked + .toggle-slider {
        background-color: var(--vscode-button-background);
        border-color: var(--vscode-button-background);
        box-shadow: 0 0 0 1px var(--vscode-button-background);
    }
    
    .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(20px);
        background-color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-foreground);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    .toggle-switch:has(input:checked),
    .toggle-switch.active {
        background-color: var(--vscode-button-background);
        border-color: var(--vscode-button-background);
        box-shadow: 0 0 0 1px var(--vscode-button-background);
    }
    
    /* Focus States - Pro Features Modern style */
    .toggle-switch input:focus + .toggle-slider,
    .switch-input:focus + .switch-button {
        outline: 2px solid var(--vscode-button-background);
        outline-offset: 2px;
    }

    .toggle-switch input:focus-visible + .toggle-slider,
    .switch-input:focus-visible + .switch-button {
        outline: 2px solid var(--vscode-button-background);
        outline-offset: 2px;
    }
    
    /* Hover Effects - Pro Features Modern style */
    .toggle-switch:hover:not(.disabled),
    .switch-container:hover:not(.disabled) {
        border-color: var(--vscode-button-background);
        box-shadow: 0 0 0 1px var(--vscode-button-background);
    }
    
    /* Disabled States - Consistent with Pro Features Modern */
    .toggle-switch.disabled,
    .toggle-switch input:disabled + .toggle-slider {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }

    .toggle-switch.disabled .toggle-slider {
        background-color: rgba(128, 128, 128, 0.2);
        border-color: var(--vscode-input-border);
    }

    .toggle-switch.disabled .toggle-slider:before {
        background-color: var(--vscode-editor-background);
        border-color: var(--vscode-input-border);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    /* Toggle Content */
    .toggle-content {
        flex: 1;
        min-width: 0;
    }
    
    .toggle-label {
        font-size: 14px;
        color: var(--vscode-foreground);
        font-weight: 600;
        margin-bottom: 4px;
        line-height: 1.3;
        cursor: pointer;
        display: block;
    }

    .toggle-description {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.4;
        margin: 0;
        cursor: pointer;
    }

    /* Compact Toggle Variant - Pro Features Modern sizing */
    .toggle-switch.compact {
        width: 40px;
        height: 22px;
    }

    .toggle-switch.compact .toggle-slider {
        border-radius: 12px;
    }

    .toggle-switch.compact .toggle-slider:before {
        height: 16px;
        width: 16px;
        left: 2px;
        top: 2px;
    }

    .toggle-switch.compact input:checked + .toggle-slider:before {
        transform: translateX(20px);
    }

    /* Small Toggle Variant - Matches Pro Features Modern default size */
    .toggle-switch.small {
        width: 40px;
        height: 22px;
    }

    .toggle-switch.small .toggle-slider {
        border-radius: 12px;
        border-width: 1px;
    }

    .toggle-switch.small .toggle-slider:before {
        height: 16px;
        width: 16px;
        left: 2px;
        top: 2px;
        border-width: 1px;
    }

    .toggle-switch.small input:checked + .toggle-slider:before {
        transform: translateX(20px);
    }

    /* Large Toggle Variant - Even larger than Pro Features Modern */
    .toggle-switch.large {
        width: 48px;
        height: 26px;
    }

    .toggle-switch.large .toggle-slider {
        border-radius: 13px;
    }

    .toggle-switch.large .toggle-slider:before {
        height: 20px;
        width: 20px;
        left: 2px;
        top: 2px;
    }

    .toggle-switch.large input:checked + .toggle-slider:before {
        transform: translateX(24px);
    }

    /* Toggle Group Layout */
    .toggle-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 16px 0;
    }

    .toggle-group .toggle-item {
        margin-bottom: 0;
    }

    /* Inline Toggle Layout */
    .toggle-inline {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(128, 128, 128, 0.1);
    }

    .toggle-inline:last-child {
        border-bottom: none;
    }

    .toggle-inline .toggle-switch {
        margin-right: 0;
        margin-top: 0;
    }

    .toggle-inline .toggle-content {
        margin-right: 0;
    }

    /* Animation for Toggle Interaction - Simplified */
    @keyframes toggleBounce {
        0% { transform: scale(1); }
        50% { transform: scale(0.98); }
        100% { transform: scale(1); }
    }

    .toggle-switch input:checked + .toggle-slider,
    .switch-input:checked + .switch-button {
        animation: toggleBounce 0.15s ease-in-out;
    }

    /* Active State Animation - Pro Features Modern sizing */
    .toggle-switch:active:not(.disabled) .toggle-slider:before,
    .switch-container:active:not(.disabled) .switch-slider {
        transform: scale(0.95);
    }

    .toggle-switch input:checked:active + .toggle-slider:before {
        transform: translateX(20px) scale(0.95);
    }

    .toggle-switch.compact input:checked:active + .toggle-slider:before,
    .toggle-switch.small input:checked:active + .toggle-slider:before {
        transform: translateX(20px) scale(0.95);
    }

    .toggle-switch.large input:checked:active + .toggle-slider:before {
        transform: translateX(24px) scale(0.95);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .toggle-item {
            padding: 12px;
        }
        
        .toggle-switch {
            margin-right: 10px;
        }
        
        .toggle-label {
            font-size: 13px;
        }
        
        .toggle-description {
            font-size: 11px;
        }
    }

    @media (max-width: 480px) {
        .toggle-item {
            flex-direction: column;
            gap: 10px;
        }
        
        .toggle-switch {
            margin-right: 0;
            margin-top: 0;
            align-self: flex-start;
        }
        
        .toggle-inline {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }
    }

    /* High Contrast Mode Support */
    @media (prefers-contrast: high) {
        .toggle-slider {
            border-width: 2px;
        }
        
        .toggle-switch input:checked + .toggle-slider {
            border-width: 2px;
        }
        
        .switch-button {
            border-width: 2px;
        }
    }

    /* Reduced Motion Support */
    @media (prefers-reduced-motion: reduce) {
        .toggle-slider,
        .toggle-slider:before,
        .switch-button,
        .switch-slider {
            transition: none;
        }
        
        .toggle-switch input:checked + .toggle-slider,
        @keyframes toggleBounce {
            animation: none;
        }
        
        .toggle-switch:active:not(.disabled) .toggle-slider:before,
        .toggle-switch input:checked:active + .toggle-slider:before {
            transform: none;
        }
    }

    /* Dark Mode Enhancements */
    @media (prefers-color-scheme: dark) {
        .toggle-item {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        
        .toggle-item:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .toggle-slider:before,
        .switch-slider {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        
        .toggle-switch input:checked + .toggle-slider:before,
        .switch-input:checked + .switch-button .switch-slider {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
        }
    }
`;
}