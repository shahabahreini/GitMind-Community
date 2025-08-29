// src/webview/styles/largeDiffStyles.css.ts

export function getLargeDiffStyles(): string {
    return `
    /* Large Diff Handling Section Styles */
    .large-diff-handling-section {
        padding: 10px 0;
    }
    
    .large-diff-handling-section h3 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
        color: var(--vscode-editor-foreground);
    }
    
    .feature-description {
        margin-bottom: 16px;
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.5;
    }
    
    .large-diff-options {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    
    /* Toggle Button Styles - Updated to match new switch design */
    /* Note: These selectors are prefixed with .large-diff-handling-section or .pro-feature-container
       to prevent conflicts with free feature toggles */
    .pro-feature-container .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 6px;
    }
    
    .pro-feature-container .toggle-row label {
        font-size: 13px;
        color: var(--vscode-editor-foreground);
    }

    .pro-feature-container .toggle-description {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin: 0 0 16px 0;
        line-height: 1.4;
    }
    
    /* Update to use new switch-container instead of toggle-container */
    .pro-feature-container .switch-container {
        position: relative;
        border-radius: 1.5em;
        box-shadow: 0 0.0625em 0.125em rgba(0, 0, 0, 0.15);
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 32px;
        height: 18px;
    }
    
    .pro-feature-container .switch-input {
        -webkit-appearance: none;
        appearance: none;
        position: absolute;
        z-index: 1;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
    }
    
    /* Updated switch button styles to match new design */
    .pro-feature-container .switch-button {
        display: flex;
        align-items: center;
        border-radius: inherit;
        border: 1px solid var(--vscode-input-border);
        background-color: var(--vscode-input-background);
        transition: all 0.2s ease;
        width: 100%;
        height: 100%;
        position: relative;
    }

    .pro-feature-container .switch-input:checked + .switch-button {
        border-color: var(--vscode-button-background);
        background-color: var(--vscode-button-background);
    }

    .pro-feature-container .switch-slider {
        position: absolute;
        width: 12px;
        height: 12px;
        background-color: var(--vscode-editor-background);
        border-radius: 50%;
        left: 2px;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        border: 1px solid var(--vscode-input-border);
    }

    .pro-feature-container .switch-input:checked + .switch-button .switch-slider {
        transform: translateX(14px);
        background-color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-foreground);
    }

    .pro-feature-container .switch-input:disabled + .switch-button {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .pro-feature-container .switch-container.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }
    
    .setting-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    
    .setting-row label {
        font-size: 13px;
        color: var(--vscode-editor-foreground);
    }
    
    .setting-row-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    
    .number-input {
        width: 100%;
        max-width: 120px;
        height: 28px;
        padding: 4px 8px;
        border: 1px solid var(--vscode-input-border);
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border-radius: 2px;
    }
    
    .number-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .input-description {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-top: 2px;
    }
    
    .pro-upsell {
        margin-top: 20px;
        padding: 12px;
        background-color: var(--vscode-editorWidget-background);
        border-radius: 4px;
        border-left: 3px solid var(--vscode-statusBarItem-warningBackground);
    }
    
    .pro-upsell p {
        margin: 0 0 10px 0;
        font-size: 13px;
        color: var(--vscode-editor-foreground);
    }
    `;
}
