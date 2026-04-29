// src/webview/settings/styles/pro-features-modern.ts

/**
 * Modern CSS styles for Pro Features section
 * Consistent with the main settings UI design system
 */
export const proFeaturesModernCSS: string = `
/* Scoped Pro Feature Styles - Consistent with Main Settings UI */

/* Modern Layout Grids - Compact spacing */
.pro-feature-container .two-column-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    width: 100%;
    margin-bottom: 16px;
}

.pro-feature-container .three-column-layout {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    width: 100%;
    margin-bottom: 12px;
}

.pro-feature-container .centered-setting {
    margin: 12px 0;
    text-align: center;
    width: 100%;
}

.pro-feature-container .centered-setting .compact-setting {
    max-width: 300px;
    margin: 0 auto;
    padding: 8px 12px;
}

/* Modern Section Styling - Consistent sizing */
.pro-feature-container .modern-section {
    background: var(--vscode-editor-background);
    border-radius: 8px;
    padding: 16px;
    border: none;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.pro-feature-container .section-header {
    margin-bottom: 12px;
    width: 100%;
}

.pro-feature-container .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--vscode-foreground);
    margin: 0 0 6px 0;
    padding-bottom: 0;
    border-bottom: none;
    display: block;
}

.pro-feature-container .section-description {
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
    margin: 6px 0 0 0;
    line-height: 1.4;
    max-width: 600px;
    opacity: 0.8;
}

/* Clean Setting Rows - Consistent sizing */
.pro-feature-container .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 0;
    border-bottom: none;
    width: 100%;
    border-radius: 6px;
    transition: background-color 0.2s ease;
    min-height: 36px;
}

.pro-feature-container .setting-row:hover {
    background-color: rgba(128, 128, 128, 0.03);
}

.pro-feature-container .setting-row:last-child {
    border-bottom: none;
    padding-bottom: 10px;
}

.pro-feature-container .setting-row:first-child {
    padding-top: 10px;
}

.pro-feature-container .setting-info {
    flex: 1;
    margin-right: 12px;
    min-width: 0;
}

.pro-feature-container .setting-label {
    font-weight: 500;
    color: var(--vscode-foreground);
    margin-bottom: 3px;
    display: block;
    font-size: 13px;
    line-height: 1.3;
}

.pro-feature-container .setting-desc {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    line-height: 1.4;
    margin: 0;
    opacity: 0.8;
}

.pro-feature-container .setting-control {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    margin-top: 2px;
}

/* Advanced Model Configuration - Align toggle + number input */
.pro-feature-container .advanced-model-config-control {
    display: flex;
    align-items: center;
    gap: 10px;
}

.pro-feature-container .advanced-model-config-control .advanced-number {
    width: 120px;
    min-width: 120px;
}

/* Enhanced Switch/Toggle Styling - Consistent sizing */
.pro-feature-container .switch-container {
    position: relative;
    width: 40px;
    height: 22px;
    border-radius: 11px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-block;
    background-color: rgba(128, 128, 128, 0.2);
    border: none;
    box-shadow: none;
    pointer-events: auto;
}

.pro-feature-container .switch-container.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
    border-color: var(--vscode-input-border);
}

.pro-feature-container .switch-input {
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
    /* Make the entire area clickable */
    pointer-events: auto;
}

.pro-feature-container .switch-button {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 12px;
    pointer-events: none; /* Let clicks pass through to input */
}

.pro-feature-container .switch-slider {
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
    pointer-events: none; /* Let clicks pass through to input */
}

.pro-feature-container .switch-input:checked + .switch-button .switch-slider {
    transform: translateX(20px);
    background-color: var(--vscode-button-foreground);
    border-color: var(--vscode-button-foreground);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.pro-feature-container .switch-container:has(.switch-input:checked) {
    background-color: var(--vscode-button-background);
    border-color: var(--vscode-button-background);
    box-shadow: 0 0 0 1px var(--vscode-button-background);
}

.pro-feature-container .switch-container.active {
    background-color: var(--vscode-button-background);
    border-color: var(--vscode-button-background);
    box-shadow: 0 0 0 1px var(--vscode-button-background);
}

.pro-feature-container .switch-input:focus + .switch-button {
    outline: 2px solid var(--vscode-button-background);
    outline-offset: 2px;
}

.pro-feature-container .switch-container:hover:not(.disabled) {
    border-color: var(--vscode-button-background);
    box-shadow: 0 0 0 1px var(--vscode-button-background);
}

/* Additional click area improvements */
.pro-feature-container .switch-container:hover .switch-slider {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}

.pro-feature-container .switch-container:active .switch-slider {
    transform: scale(0.95);
}

.pro-feature-container .switch-input:checked:active + .switch-button .switch-slider {
    transform: translateX(20px) scale(0.95);
}

/* Compact Settings Grid - Consistent spacing */
.pro-feature-container .compact-settings {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin: 12px 0;
    width: 100%;
}

/* Commit Message Options Specific Layout - Consistent */
.pro-feature-container .commit-options-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 12px 0;
    width: 100%;
}

.pro-feature-container .commit-options-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 12px 0;
    width: 100%;
}

.pro-feature-container .commit-summary-centered {
    display: flex;
    justify-content: center;
    margin: 12px 0;
    width: 100%;
}

.pro-feature-container .commit-summary-centered .compact-setting {
    max-width: 180px;
    width: 100%;
}

.pro-feature-container .compact-setting {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    background: var(--vscode-input-background);
    padding: 12px 8px;
    border-radius: 6px;
    border: 1px solid var(--vscode-input-border);
    min-height: 64px;
    box-sizing: border-box;
    text-align: center;
    gap: 6px;
    transition: all 0.2s ease;
}

/* Toggle-based compact settings - Consistent sizing */
.pro-feature-container .compact-setting.toggle-setting {
    flex-direction: column;
    justify-content: space-between;
    min-height: 72px;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    padding: 12px 8px;
}

.pro-feature-container .compact-setting.toggle-setting .setting-info {
    margin-bottom: 8px;
    text-align: center;
}

.pro-feature-container .compact-setting.toggle-setting .setting-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-foreground);
    margin-bottom: 0;
}

.pro-feature-container .compact-setting.toggle-setting .switch-container {
    margin-top: auto;
    align-self: center;
}

/* Input-based compact settings - Consistent sizing */
.pro-feature-container .compact-setting.input-setting {
    justify-content: space-between;
    min-height: 72px;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    padding: 12px 8px;
}

.pro-feature-container .compact-setting.input-setting span {
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-foreground);
    text-align: center;
}

.pro-feature-container .compact-setting.input-setting .input-field {
    margin-top: auto;
    width: 100%;
    max-width: 70px;
    align-self: center;
    background: var(--vscode-editor-background);
    border: 2px solid var(--vscode-input-border);
    font-weight: 600;
    font-size: 13px;
    padding: 4px 6px;
    color: var(--vscode-foreground);
    height: 28px;
    box-sizing: border-box;
}

.pro-feature-container .compact-setting:hover {
    background: var(--vscode-list-hoverBackground);
    border-color: var(--vscode-focusBorder);
}

.pro-feature-container .compact-setting .setting-info {
    margin-right: 0;
    text-align: center;
    width: 100%;
}

.pro-feature-container .compact-setting .setting-label {
    font-size: 11px;
    font-weight: 500;
    margin-bottom: 2px;
    color: var(--vscode-foreground);
}

.pro-feature-container .compact-setting .setting-desc {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    margin: 0;
    line-height: 1.2;
}

.pro-feature-container .compact-setting span {
    color: var(--vscode-foreground);
    font-size: 11px;
    font-weight: 500;
}

/* Enhanced Input Fields - Consistent sizing */
.pro-feature-container .input-field {
    background-color: var(--vscode-editor-background);
    border: 2px solid var(--vscode-focusBorder);
    border-radius: 4px;
    padding: 6px 8px;
    color: var(--vscode-foreground);
    font-size: 13px;
    font-family: var(--vscode-font-family);
    font-weight: 600;
    width: 100%;
    text-align: center;
    min-width: 54px;
    height: 28px;
    box-sizing: border-box;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    appearance: none;
    -webkit-appearance: none;
}

/* Number inputs still need auto appearance for spinners in some browsers */
.pro-feature-container input[type="number"].input-field {
    appearance: auto;
    -webkit-appearance: auto;
    -moz-appearance: textfield;
}

/* Select dropdowns need consistent height and styling */
.pro-feature-container select.input-field {
    height: 34px;
    padding: 6px 32px 6px 8px;
    text-align: left;
    line-height: 1.4;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='m6 9 6 6 6-6' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 14px;
    cursor: pointer;
}

.pro-feature-container select.input-field:hover:not(:disabled) {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='m6 9 6 6 6-6' stroke='%230078d4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

/* High Contrast Theme Support */
@media (forced-colors: active) {
    .pro-feature-container select.input-field {
        border: 1px solid ButtonText;
    }
}

/* Ensure spinner buttons are visible */
.pro-feature-container .input-field::-webkit-outer-spin-button,
.pro-feature-container .input-field::-webkit-inner-spin-button {
    -webkit-appearance: inner-spin-button;
    opacity: 1;
    height: auto;
    width: auto;
}

/* Firefox spinner buttons */
.pro-feature-container input[type="number"] {
    -moz-appearance: textfield;
}

.pro-feature-container .input-field:focus {
    outline: 2px solid var(--vscode-button-background);
    outline-offset: 1px;
    border-color: var(--vscode-button-background);
    box-shadow: 0 0 0 1px var(--vscode-button-background);
}

.pro-feature-container .input-field:hover:not(:disabled) {
    border-color: var(--vscode-button-background);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.pro-feature-container .input-field:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--vscode-input-background);
    border-color: var(--vscode-input-border);
}

/* Button Styles - Consistent sizing */
.pro-feature-container .btn {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
    height: 28px;
    line-height: 16px;
}

.pro-feature-container .btn:hover:not(:disabled) {
    background: var(--vscode-button-hoverBackground);
}

.pro-feature-container .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--vscode-disabledForeground);
    color: var(--vscode-disabledForeground);
}

.pro-feature-container .btn-secondary {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: 1px solid var(--vscode-input-border);
}

.pro-feature-container .btn-secondary:hover:not(:disabled) {
    background: var(--vscode-button-secondaryHoverBackground);
}

.pro-feature-container .btn-success {
    background: #28a745;
    color: white;
}

.pro-feature-container .btn-success:hover:not(:disabled) {
    background: #218838;
}

.pro-feature-container .btn-danger {
    background: #dc3545;
    color: white;
}

.pro-feature-container .btn-danger:hover:not(:disabled) {
    background: #c82333;
}

.pro-feature-container .action-button {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    height: 28px;
    line-height: 16px;
}

/* Activation Cards - Consistent sizing */
.pro-feature-container .activation-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
    width: 100%;
}

.pro-feature-container .activation-card {
    background: var(--vscode-editor-background);
    border-radius: 6px;
    padding: 14px;
    border: 1px solid var(--vscode-panel-border);
    box-sizing: border-box;
    transition: all 0.2s ease;
}

.pro-feature-container .activation-card:hover {
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.pro-feature-container .activation-card h4 {
    margin: 0 0 4px 0;
    color: var(--vscode-foreground);
    font-size: 13px;
    font-weight: 600;
    border-bottom: none;
    padding-bottom: 0;
}

.pro-feature-container .activation-card p {
    color: var(--vscode-descriptionForeground);
    font-size: 11px;
    margin: 0 0 8px 0;
    line-height: 1.3;
}

.pro-feature-container .input-group {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
    width: 100%;
}

.pro-feature-container .input-group input {
    flex: 1;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    padding: 6px 8px;
    color: var(--vscode-input-foreground);
    font-size: 12px;
    font-family: var(--vscode-font-family);
    transition: all 0.2s ease;
    height: 28px;
    box-sizing: border-box;
}

/* Status Badges - Consistent sizing */
.pro-feature-container .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 6px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    height: 18px;
    line-height: 14px;
}

.pro-feature-container .status-active {
    color: #28a745;
    background: rgba(40, 167, 69, 0.15);
}

.pro-feature-container .status-pro {
    color: #28a745;
    background: rgba(40, 167, 69, 0.15);
}

.pro-feature-container .status-invalid {
    color: #dc3545;
    background: rgba(220, 53, 69, 0.15);
}

/* Pro Status Actions - Consistent sizing */
.pro-feature-container .pro-status-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--vscode-input-background);
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--vscode-input-border);
    margin-top: 12px;
}

.pro-feature-container .action-buttons {
    display: flex;
    gap: 6px;
}

/* Section Actions - Compact */
.pro-feature-container .section-actions {
    margin-top: 8px;
    display: flex;
    justify-content: flex-start;
}

/* Clean Section Dividers - Compact */
.pro-feature-container .section-divider {
    height: 1px;
    background: var(--vscode-panel-border);
    margin: 16px 0;
    width: 100%;
}

/* Subscription Info Styling - Consistent sizing */
.pro-feature-container .subscription-info-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--vscode-input-background);
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 12px;
    border: 1px solid var(--vscode-panel-border);
    width: 100%;
    box-sizing: border-box;
}

.pro-feature-container .subscription-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.pro-feature-container .subscription-email {
    color: var(--vscode-foreground);
    font-weight: 500;
    font-size: 12px;
}

.pro-feature-container .subscription-status {
    color: #28a745;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.pro-feature-container .subscription-email-input {
    width: 100%;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    padding: 6px 8px;
    color: var(--vscode-input-foreground);
    font-size: 12px;
    font-family: var(--vscode-font-family);
    height: 28px;
    box-sizing: border-box;
}

/* Enhanced Pro Upsell - Consistent sizing */
.pro-feature-container .pro-upsell {
    margin-top: 12px;
    padding: 12px;
    background: linear-gradient(135deg, 
        rgba(255, 107, 107, 0.06) 0%, 
        rgba(238, 90, 36, 0.08) 100%);
    border: 1px solid rgba(255, 107, 107, 0.2);
    border-left: 3px solid #ff6b6b;
    border-radius: 4px;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
}

.pro-feature-container .pro-upsell p {
    margin: 0 0 6px 0;
    color: var(--vscode-foreground);
    font-size: 12px;
    line-height: 1.3;
}

/* Form Groups - Consistent sizing */
.pro-feature-container .form-group {
    margin-bottom: 8px;
}

.pro-feature-container .form-group label {
    display: block;
    margin-bottom: 2px;
    font-weight: 500;
    color: var(--vscode-foreground);
    font-size: 12px;
}

/* Container Spacing */
.pro-feature-container {
    width: 100%;
    margin: 0;
    padding: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
    .pro-feature-container .two-column-layout,
    .pro-feature-container .activation-cards {
        grid-template-columns: 1fr;
        gap: 16px;
    }
    
    .pro-feature-container .three-column-layout,
    .pro-feature-container .commit-options-grid {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
    
    .pro-feature-container .compact-settings,
    .pro-feature_container .commit-options-row {
        grid-template-columns: 1fr;
        gap: 12px;
    }
    
    .pro-feature-container .subscription-info-card {
        flex-direction: column;
        gap: 12px;
        text-align: center;
    }
    
    .pro-feature-container .pro-status-actions {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }
}

@media (max-width: 600px) {
    .pro-feature-container .three-column-layout,
    .pro-feature-container .commit-options-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }
    
    .pro-feature-container .modern-section {
        padding: 16px 12px;
    }
    
    .pro-feature-container .setting-row {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
    }
    
    .pro-feature-container .setting-info {
        margin-right: 0;
    }
    
    .pro-feature-container .setting-control {
        align-self: flex-start;
    }
    
    .pro-feature-container .action-buttons {
        flex-direction: column;
        width: 100%;
    }
    
    .pro-feature-container .action-buttons .btn {
        width: 100%;
    }
    
    .pro-feature-container .commit-summary-centered .compact-setting {
        max-width: 100%;
    }
}
`;