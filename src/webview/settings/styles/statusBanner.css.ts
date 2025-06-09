// src/webview/settings/styles/statusBanner.css.ts
import { ProviderIcon } from "../components/ProviderIcon";

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
      
      .status-banner-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--vscode-widget-border);
      }
      
      .status-banner-title {
        flex: 1;
      }
      
      .status-banner h3 {
        margin: 0 0 4px 0;
        color: var(--vscode-activityBarBadge-background);
        font-size: 16px;
        font-weight: 600;
      }
      
      .status-provider-name {
        font-size: 14px;
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
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
      
      .status-badge.openai {
        background-color: #00a67e;
      }
      
      .status-badge.anthropic {
        background-color: #d97706;
      }
      
      .status-badge.together {
        background-color: #8b5cf6;
      }
      
      .status-badge.openrouter {
        background-color: #3b82f6;
      }
      
      .status-badge.copilot {
        background-color: #1ed5a9;
        color: #000;
        font-weight: 600;
      }
      
      .status-badge.deepseek {
        background-color: #1a1a1a;
        color: #fff;
        border: 1px solid #555;
      }
      
      .status-badge.grok {
        background-color: #000000;
        color: #ffffff;
        font-weight: 600;
      }
      
      ${ProviderIcon.getIconStyles()}
    `;
}
