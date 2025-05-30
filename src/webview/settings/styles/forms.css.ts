// src/webview/settings/styles/forms.css.ts
export function getFormStyles(): string {
  return `
      .form-group {
        margin-bottom: 15px;
      }
  
      .label-container {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
      }
  
      label {
        display: block;
        color: var(--vscode-foreground);
      }
  
      .checkbox-container {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 5px;
      }
  
      .checkbox-container input[type="checkbox"] {
        width: auto;
        margin: 0;
        cursor: pointer;
      }
  
      .checkbox-container label {
        cursor: pointer;
        display: inline;
      }
  
      .learn-more {
        color: var(--vscode-textLink-foreground);
        text-decoration: none;
        font-size: 12px;
        margin-left: 8px;
      }
  
      .learn-more:hover {
        text-decoration: underline;
      }
  
      input,
      select {
        width: 100%;
        padding: 8px;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        border-radius: 2px;
      }
  
      select {
        height: 32px;
        appearance: none;
        padding-right: 30px;
        background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M7.41%208.59L12%2013.17l4.59-4.58L18%2010l-6%206-6-6z%22%2F%3E%3C%2Fsvg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;
        background-size: 16px;
      }
  
      select:focus,
      input:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: -1px;
      }
  
      select option {
        background-color: var(--vscode-dropdown-background);
        color: var(--vscode-dropdown-foreground);
      }

      /* Modern Toggle Switch Styles */
      .toggle-setting {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 0;
      }

      .setting-info {
        flex: 1;
        min-width: 0;
      }

      .setting-label {
        font-weight: 500;
        font-size: 13px;
        color: var(--vscode-foreground);
        margin-bottom: 4px;
        display: block;
        cursor: pointer;
      }

      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 42px;
        height: 24px;
        flex-shrink: 0;
      }

      .toggle-switch input[type="checkbox"] {
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute;
      }

      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--vscode-input-border, #3c3c3c);
        transition: background-color 0.2s ease, box-shadow 0.2s ease;
        border-radius: 12px;
        display: block;
      }

      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: var(--vscode-input-background, #ffffff);
        transition: transform 0.2s ease, background-color 0.2s ease;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      .toggle-switch input:checked + .toggle-slider {
        background-color: var(--vscode-button-background, #0e639c);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder, #007acc);
      }

      .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(18px);
        background-color: var(--vscode-button-foreground, #ffffff);
      }

      .toggle-switch input:focus + .toggle-slider {
        box-shadow: 0 0 0 2px var(--vscode-focusBorder, #007acc);
      }

      .toggle-switch:hover .toggle-slider {
        box-shadow: 0 0 0 1px var(--vscode-focusBorder, #007acc);
      }

      .toggle-switch input:checked:hover + .toggle-slider {
        background-color: var(--vscode-button-hoverBackground, #1177bb);
      }

      .toggle-switch input:disabled + .toggle-slider {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .toggle-switch input:disabled + .toggle-slider:before {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      /* Responsive toggle layout */
      @media (max-width: 480px) {
        .toggle-setting {
          flex-direction: column;
          gap: 8px;
        }
        
        .toggle-switch {
          align-self: flex-start;
        }
      }

      /* Compact General Settings Design */
      .general-settings-compact {
        margin-bottom: 16px;
      }

      .general-settings-compact h3 {
        margin-bottom: 8px;
        font-size: 14px;
        color: var(--vscode-foreground);
      }

      .compact-form {
        margin-bottom: 8px;
      }

      .compact-toggles {
        display: flex;
        flex-wrap: wrap;
        gap: 16px 24px;
        padding: 8px 0;
      }

      .compact-toggle-row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 140px;
        cursor: help;
        padding: 4px 6px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
        position: relative;
      }

      .compact-toggle-row:hover {
        background-color: var(--vscode-list-hoverBackground, rgba(90, 93, 94, 0.1));
      }

      /* Enhanced tooltip styling for better VS Code integration */
      .compact-toggle-row[title] {
        position: relative;
      }

      /* Custom tooltip implementation for better control */
      .compact-toggle-row::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--vscode-editorHoverWidget-background, #2c2c2c);
        color: var(--vscode-editorHoverWidget-foreground, #cccccc);
        border: 1px solid var(--vscode-editorHoverWidget-border, #454545);
        padding: 8px 12px;
        border-radius: 3px;
        font-size: 12px;
        line-height: 1.4;
        white-space: normal;
        width: 260px;
        max-width: 260px;
        text-align: left;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease 0.3s, visibility 0.3s ease 0.3s;
        pointer-events: none;
        margin-bottom: 8px;
      }

      .compact-toggle-row::before {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: var(--vscode-editorHoverWidget-border, #454545);
        z-index: 1001;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease 0.3s, visibility 0.3s ease 0.3s;
        margin-bottom: 3px;
      }

      .compact-toggle-row:hover::after,
      .compact-toggle-row:hover::before {
        opacity: 1;
        visibility: visible;
        transition-delay: 0.5s;
      }

      /* Responsive tooltip positioning */
      @media (max-width: 600px) {
        .compact-toggle-row::after {
          width: 200px;
          max-width: 200px;
          left: 0;
          transform: none;
        }
        
        .compact-toggle-row::before {
          left: 20px;
          transform: none;
        }
      }

      /* Disable default browser tooltip */
      .compact-toggle-row[title] {
        position: relative;
      }

      /* Ensure tooltip doesn't interfere with layout */
      .compact-toggles {
        position: relative;
        padding-top: 8px;
      }

      .compact-label {
        font-size: 12px;
        color: var(--vscode-foreground);
        cursor: pointer;
        white-space: nowrap;
        font-weight: 400;
      }

      .compact-toggle-row .toggle-switch {
        width: 32px;
        height: 18px;
        flex-shrink: 0;
      }

      .compact-toggle-row .toggle-slider {
        border-radius: 9px;
      }

      .compact-toggle-row .toggle-slider:before {
        height: 14px;
        width: 14px;
        left: 2px;
        bottom: 2px;
      }

      .compact-toggle-row .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(14px);
      }

      /* Responsive compact layout */
      @media (max-width: 600px) {
        .compact-toggles {
          flex-direction: column;
          gap: 12px;
        }
        
        .compact-toggle-row {
          min-width: auto;
        }
      }
    `;
}
