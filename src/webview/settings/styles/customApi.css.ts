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

    /* Modern Card Layout */
    .custom-api-settings-panel {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .custom-card {
        background: var(--vscode-editorWidget-background, rgba(30, 30, 30, 0.4));
        border: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.2));
        border-radius: 8px;
        padding: 1rem 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: border-color 0.2s ease;
    }

    .custom-card:hover {
        border-color: var(--vscode-focusBorder, rgba(0, 122, 204, 0.4));
    }

    .custom-card-header {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 0.85rem;
        padding-bottom: 0.65rem;
        border-bottom: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.15));
    }

    .custom-card-icon {
        font-size: 1.15rem;
        line-height: 1.2;
    }

    .custom-card-title-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .custom-card-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .custom-card-desc {
        font-size: 0.8rem;
        color: var(--vscode-descriptionForeground);
    }

    .custom-card-content {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
    }

    /* Quick Configuration Presets */
    .custom-presets-card {
        background: linear-gradient(135deg, rgba(0, 122, 204, 0.05), rgba(218, 165, 32, 0.05));
        border-color: rgba(0, 122, 204, 0.25);
    }

    .custom-presets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 0.65rem;
    }

    .custom-preset-btn {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 0.55rem 0.75rem;
        border-radius: 6px;
        border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.25));
        background: var(--vscode-editor-background);
        color: var(--vscode-foreground);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: left;
    }

    .custom-preset-btn:hover {
        border-color: var(--vscode-focusBorder);
        background: var(--vscode-list-hoverBackground);
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .custom-preset-btn:active {
        transform: translateY(0);
    }

    .custom-preset-btn .preset-name {
        font-weight: 600;
        font-size: 0.85rem;
        color: var(--vscode-foreground);
    }

    .custom-preset-btn .preset-desc {
        font-size: 0.72rem;
        color: var(--vscode-descriptionForeground);
        margin-top: 2px;
    }

    /* Real-Time Live URL Preview */
    .custom-target-preview {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--vscode-textCodeBlock-background, rgba(0, 0, 0, 0.15));
        padding: 0.45rem 0.65rem;
        border-radius: 4px;
        border: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.2));
        margin-top: 0.2rem;
        overflow-x: auto;
    }

    .target-preview-label {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--vscode-descriptionForeground);
        white-space: nowrap;
    }

    .target-preview-code {
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 0.82rem;
        color: var(--vscode-textLink-foreground);
        word-break: break-all;
    }

    /* Test Connection Actions */
    .custom-test-actions {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        flex-wrap: wrap;
    }

    .custom-test-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-weight: 600;
        padding: 6px 14px;
        cursor: pointer;
    }

    .test-btn-icon.rotating {
        display: inline-block;
        animation: testSpin 1s linear infinite;
    }

    @keyframes testSpin {
        100% { transform: rotate(360deg); }
    }

    .test-hint-text {
        font-size: 0.8rem;
        color: var(--vscode-descriptionForeground);
    }

    /* Diagnostics & Test Results */
    .custom-api-test-result {
        margin-top: 0.85rem;
        padding: 0.85rem 1rem;
        border-radius: 6px;
        font-size: 0.85rem;
        line-height: 1.5;
        animation: testFadeIn 0.25s ease;
    }

    @keyframes testFadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .custom-api-test-loading {
        background-color: var(--vscode-editor-inactiveSelectionBackground, rgba(128, 128, 128, 0.1));
        border: 1px dashed var(--vscode-focusBorder);
    }

    .test-loading-row {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        color: var(--vscode-foreground);
    }

    .test-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid var(--vscode-focusBorder);
        border-top-color: transparent;
        border-radius: 50%;
        animation: testSpin 0.8s linear infinite;
    }

    .custom-api-test-success {
        background-color: rgba(46, 160, 67, 0.1);
        border: 1px solid var(--vscode-testing-iconPassed, #2ea043);
    }

    .custom-api-test-error {
        background-color: rgba(248, 81, 73, 0.1);
        border: 1px solid var(--vscode-testing-iconFailed, #f85149);
    }

    /* Diagnostic Card Header & Pills */
    .test-result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        padding-bottom: 0.6rem;
        border-bottom: 1px solid rgba(128, 128, 128, 0.2);
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
    }

    .test-result-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .test-status-badge {
        font-weight: 700;
        font-size: 0.88rem;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
    }

    .test-status-badge.success {
        color: var(--vscode-testing-iconPassed, #2ea043);
    }

    .test-status-badge.error {
        color: var(--vscode-testing-iconFailed, #f85149);
    }

    .test-result-endpoint {
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 0.78rem;
        opacity: 0.85;
        word-break: break-all;
    }

    .test-status-pill {
        font-size: 0.72rem;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .test-status-pill.success {
        background: rgba(46, 160, 67, 0.2);
        color: var(--vscode-testing-iconPassed, #2ea043);
        border: 1px solid rgba(46, 160, 67, 0.4);
    }

    .test-status-pill.error {
        background: rgba(248, 81, 73, 0.2);
        color: var(--vscode-testing-iconFailed, #f85149);
        border: 1px solid rgba(248, 81, 73, 0.4);
    }

    /* KPI Row & Metric Chips */
    .test-kpi-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(105px, 1fr));
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .test-kpi-chip {
        background: var(--vscode-editor-background, rgba(0, 0, 0, 0.2));
        border: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.15));
        border-radius: 4px;
        padding: 0.4rem 0.6rem;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .kpi-label {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--vscode-descriptionForeground);
    }

    .kpi-value {
        font-size: 0.85rem;
        font-weight: 600;
        font-family: var(--vscode-editor-font-family, monospace);
        color: var(--vscode-foreground);
    }

    .kpi-value.fast {
        color: var(--vscode-testing-iconPassed, #2ea043);
    }

    .kpi-value.medium {
        color: var(--vscode-editorWarning-foreground, #cca700);
    }

    .kpi-value.slow {
        color: var(--vscode-testing-iconFailed, #f85149);
    }

    .kpi-value.format {
        text-transform: capitalize;
    }

    /* Diagnostics Table & Rows */
    .test-diagnostics-table {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        font-size: 0.8rem;
    }

    .test-diagnostic-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        padding: 0.35rem 0.5rem;
        background: var(--vscode-editor-background, rgba(0, 0, 0, 0.15));
        border-radius: 4px;
    }

    .test-diagnostic-row.preview-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.35rem;
    }

    .diagnostic-label {
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
        font-size: 0.74rem;
    }

    .diagnostic-code {
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 0.78rem;
        color: var(--vscode-foreground);
    }

    .diagnostic-code.highlight {
        color: var(--vscode-textLink-foreground);
        font-weight: 600;
    }

    .diagnostic-preview {
        width: 100%;
        box-sizing: border-box;
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 0.78rem;
        padding: 0.4rem 0.6rem;
        background: var(--vscode-textCodeBlock-background, rgba(0, 0, 0, 0.25));
        border-radius: 4px;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 120px;
        overflow-y: auto;
    }

    /* Error Details & Solution Hints */
    .test-error-body {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 0.4rem;
    }

    .test-error-message {
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 0.78rem;
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background, rgba(0, 0, 0, 0.2));
        padding: 0.5rem 0.75rem;
        border-radius: 4px;
        border-left: 3px solid var(--vscode-testing-iconFailed, #f85149);
        word-break: break-word;
    }

    .test-error-hint {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: rgba(234, 179, 8, 0.1);
        border: 1px solid rgba(234, 179, 8, 0.3);
        border-radius: 4px;
        color: var(--vscode-foreground);
    }

    .hint-icon {
        font-size: 0.95rem;
        line-height: 1.2;
    }

    .hint-content {
        font-size: 0.78rem;
        line-height: 1.4;
    }

    /* Custom Guidelines Collapsible */
    .custom-guidelines-details {
        margin-top: 1rem;
        font-size: 0.82rem;
        border: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.2));
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        background: var(--vscode-editor-background, rgba(0, 0, 0, 0.1));
    }

    .custom-guidelines-details summary {
        cursor: pointer;
        font-weight: 500;
        color: var(--vscode-textLink-foreground);
    }

    .guidelines-content {
        margin-top: 0.5rem;
        font-size: 0.78rem;
        color: var(--vscode-foreground);
        line-height: 1.5;
    }

    .guidelines-content ul {
        padding-left: 1.2rem;
        margin: 0.4rem 0 0 0;
    }

    .guidelines-content li {
        margin-bottom: 0.25rem;
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
