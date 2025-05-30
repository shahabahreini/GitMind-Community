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
    `;
}
