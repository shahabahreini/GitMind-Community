// src/webview/settings/styles/forms.css.ts
export function getFormStyles(): string {
  return `
      /* Form Groups - Consistent spacing */
      .form-group {
        margin-bottom: 14px;
      }
  
      .label-container {
        display: flex;
        align-items: center;
        margin-bottom: 6px;
      }
  
      label {
        display: block;
        color: var(--vscode-foreground);
        font-weight: 500;
        font-size: 13px;
      }
  
      /* Checkbox Containers - Consistent alignment */
      .checkbox-container {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        padding: 3px 0;
      }
  
      .checkbox-container input[type="checkbox"] {
        width: auto;
        margin: 0;
        cursor: pointer;
        accent-color: var(--vscode-button-background);
      }
  
      .checkbox-container label {
        cursor: pointer;
        display: inline;
        font-weight: 400;
      }
  
      /* Learn More Links - Enhanced visibility */
      .learn-more {
        color: var(--vscode-textLink-foreground);
        text-decoration: none;
        font-size: 12px;
        margin-left: 10px;
        font-weight: 500;
        transition: all 0.2s ease;
      }
  
      .learn-more:hover {
        text-decoration: underline;
        color: var(--vscode-textLink-activeForeground);
      }
  
      /* Enhanced Input and Select Styling */
      input,
      select {
        width: 100%;
        padding: 8px 10px;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.2));
        border-radius: 6px;
        font-size: 13px;
        font-family: var(--vscode-font-family);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
        height: 34px;
        line-height: 18px;
      }

      input:hover:not(:disabled),
      select:hover:not(:disabled) {
        border-color: var(--vscode-focusBorder, rgba(0, 122, 204, 0.4));
      }
  
      /* Enhanced Select Dropdown */
      select {
        height: 34px;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        padding: 6px 32px 6px 10px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='m6 9 6 6 6-6' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;
        background-size: 16px;
        border: 1px solid var(--vscode-input-border, rgba(128, 128, 128, 0.2));
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        cursor: pointer;
        color: var(--vscode-dropdown-foreground, var(--vscode-input-foreground));
        background-color: var(--vscode-dropdown-background, var(--vscode-input-background));
        font-weight: 500;
        position: relative;
        z-index: 1;
      }
  
      /* Focus States - Enhanced visibility */
      select:focus,
      input:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
      }

      /* Select hover chevron enhancement */
      select:hover:not(:disabled) {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='m6 9 6 6 6-6' stroke='%230078d4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      }
  
      /* Select Options - Better styling */
      select option {
        background-color: var(--vscode-dropdown-background);
        color: var(--vscode-dropdown-foreground);
        padding: 8px 12px;
        font-weight: 400;
        line-height: 1.5;
      }

      /* Optgroup labels — muted, uppercase, smaller */
      select optgroup {
        font-style: normal;
        font-weight: 600;
        font-size: 11px;
        color: var(--vscode-descriptionForeground, rgba(128, 128, 128, 0.85));
        text-transform: uppercase;
        letter-spacing: 0.4px;
        padding: 4px 0;
      }

      /* Optgroup children — normal weight, slightly indented */
      select optgroup option {
        font-weight: 400;
        font-size: 13px;
        text-transform: none;
        letter-spacing: normal;
        padding-left: 8px;
      }

      /* High contrast theme support for select chevrons */
      @media (forced-colors: active) {
        select {
          border: 1px solid ButtonText;
        }
      }
      
      /* Disabled States */
      input:disabled,
      select:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        background-color: var(--vscode-input-background);
        border-color: var(--vscode-input-border);
        box-shadow: none;
      }

      /* Load Models Button — placed below select dropdowns */
      .button.load-models-inline {
        margin-top: 8px;
      }

      /* Number Input Enhancements */
      input[type="number"] {
        appearance: auto;
        -webkit-appearance: auto;
        -moz-appearance: textfield;
      }

      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: inner-spin-button;
        opacity: 1;
        height: auto;
        width: auto;
      }

      /* Modern Toggle Switch Styles - Consistent with Pro Features */
      .toggle-setting {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 0;
        border-bottom: none;
        border-radius: 6px;
        transition: background-color 0.2s ease;
        min-height: 40px;
      }

      .toggle-setting:hover {
        background-color: rgba(128, 128, 128, 0.03);
      }

      .toggle-setting:last-child {
        border-bottom: none;
      }

      .setting-info {
        flex: 1;
        min-width: 0;
      }

      .setting-label {
        font-weight: 600;
        font-size: 13px;
        color: var(--vscode-foreground);
        margin-bottom: 3px;
        display: block;
        cursor: pointer;
        line-height: 1.3;
      }

      .setting-description {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.4;
        margin: 0;
      }

      /* Enhanced Switch Container - Exact Pro Features Modern Match */
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

      .toggle-switch input:focus + .toggle-slider {
        outline: 2px solid rgba(0, 122, 204, 0.5);
        outline-offset: 2px;
      }

      .toggle-switch:hover .toggle-slider {
        border-color: transparent;
        box-shadow: 0 0 0 1px rgba(0, 122, 204, 0.3);
      }

      .toggle-switch input:checked:hover + .toggle-slider {
        background-color: rgba(0, 122, 204, 0.8);
      }

      .toggle-switch input:disabled + .toggle-slider {
        opacity: 0.5;
        background-color: rgba(128, 128, 128, 0.1);
        border-color: transparent;
        cursor: not-allowed;
      }

      .toggle-switch input:disabled + .toggle-slider:before {
        box-shadow: 0 1px 2px rgba(128, 128, 128, 0.2);
      }

      /* Responsive toggle layout */
      @media (max-width: 480px) {
        .toggle-setting {
          flex-direction: column;
          gap: 10px;
        }
        
        .toggle-switch {
          align-self: flex-start;
        }
      }

      /* Compact General Settings Design - Consistent sizing */
      .general-settings-compact {
        margin-bottom: 20px;
        background: var(--vscode-editor-background);
        border: none;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }

      .general-settings-compact h3 {
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 600;
        color: var(--vscode-foreground);
        border-bottom: none;
        padding-bottom: 0;
      }

      .compact-form {
        margin-bottom: 10px;
      }

      .compact-toggles {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 16px;
        padding: 10px 0;
      }

      .compact-toggle-row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 140px;
        cursor: help;
        padding: 8px 10px;
        border-radius: 6px;
        transition: all 0.2s ease;
        position: relative;
        background: rgba(128, 128, 128, 0.05);
        border: none;
        height: 28px;
      }

      .compact-toggle-row:hover {
        background-color: rgba(128, 128, 128, 0.1);
        border-color: transparent;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      /* Enhanced tooltip styling */
      .compact-toggle-row[title] {
        position: relative;
      }

      .compact-toggle-row::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--vscode-editorHoverWidget-background, #2c2c2c);
        color: var(--vscode-editorHoverWidget-foreground, #cccccc);
        border: 1px solid var(--vscode-editorHoverWidget-border, #454545);
        padding: 10px 14px;
        border-radius: 4px;
        font-size: 12px;
        line-height: 1.5;
        white-space: normal;
        width: 280px;
        max-width: 280px;
        text-align: left;
        z-index: 12000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease 0.4s, visibility 0.3s ease 0.4s;
        pointer-events: none;
        margin-bottom: 10px;
      }

      .compact-toggle-row::before {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: var(--vscode-editorHoverWidget-border, #454545);
        z-index: 12001;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease 0.4s, visibility 0.3s ease 0.4s;
        margin-bottom: 4px;
      }

      .compact-toggle-row:hover::after,
      .compact-toggle-row:hover::before {
        opacity: 1;
        visibility: visible;
        transition-delay: 0.6s;
      }

      /* Responsive tooltip positioning */
      @media (max-width: 600px) {
        .compact-toggle-row::after {
          width: 220px;
          max-width: 220px;
          left: 0;
          transform: none;
        }
        
        .compact-toggle-row::before {
          left: 24px;
          transform: none;
        }
      }

      .compact-toggles {
        position: relative;
        padding-top: 10px;
        z-index: auto;
        overflow: visible;
      }

      .compact-toggle-row {
        /* isolation: isolate; - Removed to allow tooltips to appear above other elements */
      }

      .compact-toggle-row:hover {
        z-index: 9999;
      }

      .compact-label {
        font-size: 11px;
        color: var(--vscode-foreground);
        cursor: pointer;
        white-space: nowrap;
        font-weight: 500;
      }

      /* Compact Toggle Switch Sizing */
      .compact-toggle-row .toggle-switch {
        width: 34px;
        height: 18px;
        flex-shrink: 0;
      }

      .compact-toggle-row .toggle-slider {
        border-radius: 9px;
        background-color: rgba(128, 128, 0.2);
        border: none;
      }

      .compact-toggle-row .toggle-slider:before {
        height: 12px;
        width: 12px;
        left: 3px;
        bottom: 3px;
        border: none;
      }

      .compact-toggle-row .toggle-switch input:checked + .toggle-slider {
        background-color: rgba(0, 122, 204, 1);
        border-color: transparent;
      }

      .compact-toggle-row .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(16px);
        background-color: #ffffff;
        border-color: transparent;
      }

      /* Responsive compact layout */
      @media (max-width: 600px) {
        .compact-toggles {
          flex-direction: column;
          gap: 14px;
        }
        
        .compact-toggle-row {
          min-width: auto;
          width: 100%;
        }
      }

      /* Enhanced Password Input with Toggle Button */
      .password-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .password-input-wrapper input {
        padding-right: 80px;
      }

      .password-toggle, .copy-toggle {
        position: absolute;
        top: 2px;
        bottom: 2px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        color: var(--vscode-foreground);
        opacity: 0.9;
        transition: opacity 0.1s ease, background-color 0.1s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        width: 28px;
      }

      .copy-toggle {
        right: 38px;
      }

      .password-toggle {
        right: 6px;
      }

      .password-toggle:hover:not(.disabled), 
      .copy-toggle:hover:not(.disabled) {
        opacity: 1;
        background-color: rgba(128, 128, 128, 0.1);
        border-color: transparent;
      }

      .password-toggle:focus, .copy-toggle:focus {
        outline: none;
      }

      .password-toggle svg, .copy-toggle svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
      }

      /* Enhanced Pro feature styling */
      .copy-toggle.pro-feature {
        color: var(--vscode-button-background);
        border-color: rgba(0, 122, 204, 0.3);
      }

      .copy-toggle.pro-feature:hover {
        color: var(--vscode-button-background);
        background-color: rgba(0, 122, 204, 0.1);
        border-color: var(--vscode-button-background);
      }

      /* Enhanced Disabled state */
      .copy-toggle.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        color: var(--vscode-disabledForeground);
        pointer-events: auto;
      }

      .copy-toggle.disabled:hover {
        opacity: 0.4;
        background-color: transparent;
        border-color: transparent;
      }

      /* Enhanced Encrypted field styling */
      input[data-encrypted="true"] {
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
        background-color: rgba(255, 193, 7, 0.05);
        border-color: rgba(255, 193, 7, 0.3);
        border-width: 1px;
        box-shadow: none;
      }

      input[data-encrypted="true"]::placeholder {
        color: rgba(255, 193, 7, 0.6);
        font-style: italic;
      }

      input[data-encrypted="true"]:focus {
        outline: 2px solid rgba(255, 193, 7, 0.5);
        outline-offset: 0;
        border-color: rgba(255, 193, 7, 0.5);
      }

      /* Input validation states */
      input.error {
        border-color: rgba(239, 68, 68, 0.5);
        background-color: rgba(239, 68, 68, 0.05);
      }

      input.success {
        border-color: rgba(16, 185, 129, 0.5);
        background-color: rgba(16, 185, 129, 0.05);
      }

      /* Form validation messages */
      .validation-message {
        font-size: 11px;
        margin-top: 4px;
        line-height: 1.4;
      }

      .validation-message.error {
        color: rgba(239, 68, 68, 1);
      }

      .validation-message.success {
        color: rgba(16, 185, 129, 1);
      }

      .validation-message.warning {
        color: rgba(255, 193, 7, 1);
      }
    `;
}