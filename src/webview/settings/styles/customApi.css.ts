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
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.9rem;
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
    `;
}
