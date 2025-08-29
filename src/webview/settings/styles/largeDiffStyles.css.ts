// src/webview/settings/styles/largeDiffStyles.css.ts

export function getLargeDiffStyles(): string {
    return `
    /* Large Diff Handling Section Styles */
    .large-diff-handling-section {
        padding: 12px 0;
        margin-bottom: 4px;
    }
    
    .large-diff-handling-section h3 {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 10px;
        color: var(--vscode-editor-foreground);
        border-bottom: none;
        padding-bottom: 0;
    }
    
    .feature-description {
        margin-bottom: 16px;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.5;
        max-width: 650px;
        opacity: 0.8;
    }
    
    .large-diff-options {
        display: grid;
        grid-template-columns: 1fr;
        gap: 14px;
        padding: 3px 0;
    }
    
    /* Toggle section styling */
    .toggle-row {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        margin-bottom: 8px;
        min-height: 32px;
    }
    
    .toggle-row label {
        font-size: 13px;
        font-weight: 500;
        color: var(--vscode-editor-foreground);
    }
    
    /* Settings rows styling */
    .setting-row {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 12px;
        align-items: start;
        margin-bottom: 6px;
        padding: 8px 0;
        position: relative;
        border-radius: 6px;
        transition: background-color 0.2s ease;
        min-height: 40px;
    }

    .setting-row:hover {
        background-color: rgba(128, 128, 128, 0.03);
    }
    
    .setting-row label {
        font-size: 13px;
        color: var(--vscode-editor-foreground);
        padding-top: 6px;
        font-weight: 500;
    }

    .setting-row-content {
        display: flex;
        flex-direction: column;
    }
    
    .number-input {
        width: 120px;
        max-width: 120px;
        height: 32px;
        padding: 6px 8px;
        border: 1px solid rgba(128, 128, 128, 0.2);
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border-radius: 6px;
        font-size: 13px;
        transition: all 0.2s ease;
        box-sizing: border-box;
    }
    
    .number-input:focus {
        outline: 2px solid rgba(0, 122, 204, 0.5);
        border-color: rgba(0, 122, 204, 0.5);
    }
    
    .number-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .input-description {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-top: 4px;
        max-width: 240px;
        line-height: 1.3;
    }
    
    /* Pro feature upsell styling */
    .pro-upsell {
        margin-top: 20px;
        padding: 16px;
        background-color: rgba(255, 193, 7, 0.05);
        border-radius: 8px;
        border-left: 3px solid rgba(255, 193, 7, 0.4);
        box-shadow: none;
        border: none;
    }
    
    .pro-upsell p {
        margin: 0 0 8px 0;
        font-size: 12px;
        color: var(--vscode-editor-foreground);
        line-height: 1.4;
    }

    /* Updated toggle styles to match new switch design */
    .switch-container {
        position: relative;
        border-radius: 11px;
        box-shadow: none;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 36px;
        height: 20px;
        background-color: rgba(128, 128, 128, 0.2);
        border: none;
    }

    .switch-input {
        -webkit-appearance: none;
        appearance: none;
        position: absolute;
        z-index: 1;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
    }

    .switch-button {
        display: flex;
        align-items: center;
        border-radius: inherit;
        border: none;
        background-color: transparent;
        transition: all 0.3s ease;
        width: 100%;
        height: 100%;
        position: relative;
    }

    .switch-input:checked + .switch-button {
        border-color: transparent;
        background-color: rgba(0, 122, 204, 1);
    }

    .switch-slider {
        position: absolute;
        width: 14px;
        height: 14px;
        background-color: #ffffff;
        border-radius: 50%;
        left: 3px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        border: none;
    }

    .switch-input:checked + .switch-button .switch-slider {
        transform: translateX(16px);
        background-color: #ffffff;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .setting-row {
            grid-template-columns: 1fr;
            gap: 8px;
        }
        
        .setting-row label {
            padding-top: 0;
        }
        
        .number-input {
            max-width: 100px;
        }
        
        .input-description {
            max-width: 100%;
        }
    }

    @media (max-width: 480px) {
        .large-diff-handling-section {
            padding: 8px 0;
        }
        
        .pro-upsell {
            padding: 12px;
        }
        
        .number-input {
            width: 100%;
            max-width: 100%;
        }
    }
    `;
}
