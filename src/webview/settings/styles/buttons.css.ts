// src/webview/settings/styles/buttons.css.ts
export function getButtonStyles(): string {
  return `
      .button-group {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        justify-content: flex-end;
      }

      button.small {
        padding: 4px 8px;
        font-size: 12px;
      }
  
      button {
        background: var(--vscode-button-secondaryBackground, var(--vscode-button-background));
        color: var(--vscode-button-secondaryForeground, var(--vscode-button-foreground));
        border: none;
        padding: 8px 16px;
        cursor: pointer;
        border-radius: 2px;
        font-size: 13px;
        font-weight: 500;
        transition: background-color 0.2s;
      }
  
      button:hover {
        background: var(--vscode-button-secondaryHoverBackground, var(--vscode-button-hoverBackground));
      }
  
      button.primary {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
      }
  
      button.primary:hover {
        background: var(--vscode-button-hoverBackground);
      }
    `;
}
