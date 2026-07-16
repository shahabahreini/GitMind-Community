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
    
    .toggle-item:hover,
    .toggle-item:focus-within {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        transform: translateY(-1px);
        z-index: 20000;
    }
    
    .toggle-item:last-child {
        margin-bottom: 0;
    }

    .toggle-content {
        flex: 1;
    }

    .toggle-label {
        font-size: 13px;
        color: var(--vscode-editor-foreground);
        cursor: pointer;
    }

    /* Commit Intelligence Modern Card Modules */
    .commit-intelligence-settings {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--vscode-panel-border);
    }
    .commit-intelligence-banner {
        background: var(--vscode-editor-inactiveSelectionBackground, rgba(0, 122, 204, 0.06));
        border: 1px solid var(--vscode-focusBorder, rgba(0, 122, 204, 0.3));
        border-radius: 8px;
        padding: 14px 16px;
        margin-bottom: 16px;
    }
    .commit-intelligence-banner-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
    }
    .commit-intelligence-badge {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        background: var(--vscode-badge-background, #007acc);
        color: var(--vscode-badge-foreground, #ffffff);
        padding: 2px 8px;
        border-radius: 10px;
        letter-spacing: 0.5px;
    }
    .commit-intelligence-options {
        margin: 16px 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .commit-intelligence-options[hidden] { display: none; }
    
    .intel-card-module {
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        padding: 14px 16px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: border-color 0.2s ease;
    }
    .intel-card-module:hover {
        border-color: var(--vscode-focusBorder);
    }
    .intel-card-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
        margin: 0 0 4px 0;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .intel-card-desc {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin: 0 0 12px 0;
        line-height: 1.4;
    }

    .settings-subsection { margin-bottom: 16px; }
    .settings-subsection h4 { margin: 0 0 8px; color: var(--vscode-editor-foreground); font-size: 13px; }
    .toggle-item.locked { opacity: 0.7; }
    .pro-lock-badge {
        margin-left: 6px;
        color: var(--vscode-badge-foreground, #ffffff);
        background: var(--vscode-button-background, #007acc);
        font-size: 10px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 4px;
        text-transform: uppercase;
    }

    /* Pro Workspace: compact, task-oriented controls rather than general toggles. */
    .pro-commit-workspace {
        margin: 0 0 20px;
        padding: 18px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        background: var(--vscode-editor-background);
    }
    .pro-workspace-heading, .health-settings-main, .history-health-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
    }
    .section-kicker { display: block; color: var(--vscode-descriptionForeground); font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 4px; }
    .pro-workspace-heading .section-title { margin: 0; font-size: 16px; }
    .pro-workspace-heading .section-description { margin: 5px 0 18px; color: var(--vscode-descriptionForeground); font-size: 12px; }
    .health-settings-card { border: 1px solid var(--vscode-focusBorder); border-radius: 8px; padding: 16px; background: var(--vscode-editor-inactiveSelectionBackground, rgba(0,122,204,.06)); }
    .health-settings-copy h4, .history-health-heading h4 { margin: 0; font-size: 14px; }
    .health-settings-copy p, .history-health-heading p { margin: 4px 0 0; color: var(--vscode-descriptionForeground); font-size: 12px; line-height: 1.45; }
    .health-settings-status { display: grid; gap: 3px; text-align: right; font-size: 12px; white-space: nowrap; }
    .health-settings-status span { color: var(--vscode-descriptionForeground); font-size: 11px; }
    .health-settings-card > .toggle-item { margin: 16px 0 10px; background: var(--vscode-editor-background); }
    .health-actions { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .field-helper { color: var(--vscode-descriptionForeground); font-size: 11px; }
    .history-health-panel { border-top: 1px solid var(--vscode-panel-border); padding-top: 15px; }
    .local-badge { border: 1px solid var(--vscode-panel-border); border-radius: 999px; padding: 3px 8px; color: var(--vscode-descriptionForeground); font-size: 10px; font-weight: 600; white-space: nowrap; }
    .history-health-controls { display: grid; grid-template-columns: minmax(150px, 1.25fr) minmax(85px, .55fr) minmax(130px, .8fr) minmax(130px, .8fr) auto; gap: 10px; align-items: end; margin-top: 14px; }
    .compact-field { display: grid; gap: 5px; min-width: 0; }
    .compact-field span { color: var(--vscode-descriptionForeground); font-size: 11px; font-weight: 600; }
    .compact-field select, .compact-field input { box-sizing: border-box; width: 100%; min-height: 31px; margin: 0; }
    .history-date-field { display: none; }
    .history-date-field.is-visible { display: grid; }
    .history-health-actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .history-health-actions .button { margin: 0; white-space: nowrap; }
    .history-health-result { min-height: 18px; margin-top: 12px; padding: 9px 10px; border-radius: 5px; background: var(--vscode-textCodeBlock-background); color: var(--vscode-descriptionForeground); font-size: 11px; line-height: 1.45; }
    .workflow-settings-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
    .workflow-setting-card { border: 1px solid var(--vscode-panel-border); border-radius: 7px; background: var(--vscode-editor-background); padding: 11px; }
    .workflow-setting-card .toggle-item { padding: 0; margin: 0; border: 0; background: transparent; }
    .workflow-setting-card p { margin: 7px 0 0; color: var(--vscode-descriptionForeground); font-size: 11px; line-height: 1.4; }

    @media (prefers-reduced-motion: reduce) {
        .toggle-item, .switch-container, .switch-slider { transition: none; }
        .toggle-item:hover { transform: none; }
    }

    @media (max-width: 760px) {
        .pro-workspace-heading, .health-settings-main, .history-health-heading { flex-direction: column; gap: 8px; }
        .health-settings-status { text-align: left; white-space: normal; }
        .history-health-controls { grid-template-columns: 1fr 1fr; }
        .history-health-actions { grid-column: 1 / -1; }
        .workflow-settings-grid { grid-template-columns: 1fr; }
    }

    @media (forced-colors: active) {
        .toggle-item, .commit-intelligence-options { border-color: CanvasText; }
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
