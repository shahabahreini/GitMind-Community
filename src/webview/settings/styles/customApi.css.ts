// src/webview/settings/styles/customApi.css.ts
export function getCustomApiStyles(): string {
    return `
    /* Custom API form styling */
    .custom-api-container {
        margin: 0;
        padding: 0;
    }
    
    .custom-api-form-group {
        margin-bottom: 1rem;
    }
    
    .custom-api-header {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--vscode-editor-foreground);
        display: flex;
        align-items: center;
    }
    
    .custom-api-header .pro-feature-badge {
        margin-left: 0.5rem;
    }
    
    .custom-api-url-container {
        display: flex;
        gap: 0.5rem;
        flex-direction: column;
    }
    
    @media (min-width: 768px) {
        .custom-api-url-container {
            flex-direction: row;
        }
        .custom-api-url-container input[type="text"]:first-child {
            flex: 3;
        }
        .custom-api-url-container input[type="text"]:last-child {
            flex: 2;
        }
    }
    
    .custom-api-test-result {
        margin-top: 0.5rem;
        padding: 0.75rem;
        border-radius: 4px;
        font-size: 0.9rem;
        line-height: 1.5;
    }
    
    .custom-api-test-success {
        background-color: rgba(0, 128, 0, 0.1);
        color: var(--vscode-testing-iconPassed);
        border: 1px solid var(--vscode-testing-iconPassed);
    }
    
    .custom-api-test-error {
        background-color: rgba(255, 0, 0, 0.1);
        color: var(--vscode-testing-iconFailed);
        border: 1px solid var(--vscode-testing-iconFailed);
    }
    
    .custom-api-test-loading {
        color: var(--vscode-foreground);
        opacity: 0.7;
    }
    
    /* Test result formatting */
    .test-result-header {
        font-weight: 600;
        font-size: 1rem;
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid currentColor;
        opacity: 0.9;
    }
    
    .test-result-section {
        margin-bottom: 0.5rem;
    }
    
    .test-result-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
    }
    
    .test-result-item {
        flex: 1;
        min-width: 150px;
    }
    
    .test-result-label {
        font-weight: 500;
        opacity: 0.8;
        font-size: 0.85rem;
        display: block;
        margin-bottom: 0.15rem;
    }
    
    .test-result-value {
        font-family: var(--vscode-editor-font-family, monospace);
        opacity: 1;
        word-break: break-all;
    }
    
    .test-result-format {
        display: inline-block;
        padding: 0.15rem 0.4rem;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        font-size: 0.85rem;
    }
    
    .test-result-path {
        font-size: 0.85rem;
        background-color: rgba(255, 255, 255, 0.05);
        padding: 0.25rem 0.4rem;
        border-radius: 3px;
        display: inline-block;
    }
    
    .test-result-preview {
        font-size: 0.85rem;
        font-style: italic;
        opacity: 0.9;
        margin-top: 0.25rem;
        display: block;
        padding: 0.4rem;
        background-color: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
        border-left: 2px solid currentColor;
    }
    
    /* Show/hide header key field based on auth type */
    #customAuthType[value="apikey"] ~ .header-key-field {
        display: block;
    }
    
    .header-key-field {
        display: none;
    }
    
    /* Custom API documentation link */
    .custom-api-docs-link {
        margin-top: 1rem;
        font-size: 0.9rem;
    }
    
    /* Pro provider styling in dropdown */
    .pro-provider {
        font-weight: 600;
        color: #DAA520 !important; /* Dark gold color */
        background-image: linear-gradient(transparent 60%, rgba(218, 165, 32, 0.1) 40%);
        position: relative;
    }
    
    /* Add a Pro badge after the text */
    .pro-provider::after {
        content: ' ✨';
        color: #DAA520;
        font-size: 0.8em;
        margin-left: 4px;
    }
    
    /* Make sure the option text color is maintained when selected */
    option.pro-provider:checked,
    option.pro-provider:hover,
    option.pro-provider:focus {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground) !important;
    }
    
    /* For selected pro options, maintain the styling */
    option.pro-provider:checked::after {
        color: var(--vscode-button-foreground);
    }
    
    /* Test connection button styling */
    #customTestConnection {
        margin-top: 0.5rem;
        margin-right: 0.5rem;
    }
    
    /* Info section styling */
    .custom-api-info {
        margin-top: 1rem;
        padding: 0.75rem;
        background-color: var(--vscode-editorWidget-background);
        border-left: 3px solid var(--vscode-button-background);
        font-size: 0.9rem;
        border-radius: 2px;
    }

    /* Locked provider settings styling */
    .locked-provider-settings {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
    }
    
    .provider-locked-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 15, 15, 0.45);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        border: 1px dashed rgba(255, 82, 82, 0.4);
        border-radius: 8px;
        box-sizing: border-box;
        animation: providerLockedFadeIn 0.3s ease-in-out;
    }

    @keyframes providerLockedFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .provider-locked-content {
        text-align: center;
        padding: 24px;
        max-width: 380px;
        color: var(--vscode-foreground);
    }

    .provider-locked-icon-container {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 54px;
        height: 54px;
        background: linear-gradient(135deg, rgba(255, 159, 67, 0.15), rgba(255, 82, 82, 0.2));
        border: 2px solid rgba(255, 82, 82, 0.4);
        border-radius: 50%;
        margin-bottom: 16px;
        box-shadow: 0 4px 12px rgba(255, 82, 82, 0.15);
        color: #ff4757;
        animation: pulseLock 2s infinite;
    }

    @keyframes pulseLock {
        0% {
            box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.4);
        }
        70% {
            box-shadow: 0 0 0 10px rgba(255, 82, 82, 0);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
        }
    }

    .provider-locked-content h4 {
        margin: 0 0 8px 0;
        font-size: 15px;
        font-weight: 650;
        color: var(--vscode-foreground);
    }

    .provider-locked-content p {
        margin: 0 0 20px 0;
        font-size: 12px;
        line-height: 1.5;
        color: var(--vscode-descriptionForeground);
    }

    .provider-locked-content .upgrade-btn {
        background: linear-gradient(135deg, #ff9f43, #ff5252);
        border: none;
        color: white;
        padding: 8px 20px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(255, 82, 82, 0.3);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: inline-block;
    }

    .provider-locked-content .upgrade-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 82, 82, 0.45);
        opacity: 0.95;
    }
    `;
}
