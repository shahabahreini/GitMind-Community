// src/webview/settings/styles/statusBanner.css.ts
export function getStatusBannerStyles(): string {
  return `
      .status-banner {
        background-color: var(--vscode-editor-inactiveSelectionBackground);
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border-left: 4px solid var(--vscode-activityBarBadge-background);
        transition: background-color 0.3s ease;
      }
      
      .status-banner h3 {
        margin-top: 0;
        margin-bottom: 12px;
        border-bottom: none;
        padding-bottom: 0;
        color: var(--vscode-activityBarBadge-background);
        font-size: 16px;
      }
      
      .status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
      }
      
      .status-item {
        display: flex;
        flex-direction: column;
      }
      
      .status-label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 4px;
      }
      
      .status-value {
        font-weight: 500;
        color: var(--vscode-foreground);
      }
      
      .status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        background-color: var(--vscode-activityBarBadge-background);
        color: var(--vscode-activityBarBadge-foreground);
      }
      
      .status-badge.gemini {
        background-color: #1a73e8;
      }
      
      .status-badge.huggingface {
        background-color: #ffbd59;
        color: #000;
      }
      
      .status-badge.ollama {
        background-color: #7c3aed;
      }
      
      .status-badge.mistral {
        background-color: #10b981;
      }
      
      .status-badge.cohere {
        background-color:rgb(179, 240, 24);
      }
    `;
}
