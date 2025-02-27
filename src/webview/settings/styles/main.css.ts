// src/webview/settings/styles/main.css.ts
import { getFormStyles } from "./forms.css";
import { getButtonStyles } from "./buttons.css";
import { getStatusBannerStyles } from "./statusBanner.css";

export function getMainStyles(): string {
    return `<style>
    body {
      padding: 20px;
      color: var(--vscode-foreground);
      font-family: var(--vscode-font-family);
      background-color: var(--vscode-editor-background);
    }

    .settings-container {
      max-width: 800px;
      margin: 0 auto;
    }

    h2, h3 {
      color: var(--vscode-foreground);
      border-bottom: 1px solid var(--vscode-input-border);
      padding-bottom: 8px;
    }

    .settings-section {
      margin-bottom: 20px;
    }

    .description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      transform: translateY(-100px);
      opacity: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .toast.success {
      background-color: #28a745;
    }

    .toast.error {
      background-color: #dc3545;
    }

    .toast.info {
      background-color: var(--vscode-infoBackground, #17a2b8);
      color: var(--vscode-infoForeground, white);
    }

    /* Animation for status banner updates */
    .banner-updated {
      animation: highlight 1s ease-in-out;
    }

    @keyframes highlight {
      0% { background-color: var(--vscode-editor-inactiveSelectionBackground); }
      50% { background-color: var(--vscode-diffEditor-insertedTextBackground, rgba(155, 185, 85, 0.2)); }
      100% { background-color: var(--vscode-editor-inactiveSelectionBackground); }
    }

    /* Responsive Adjustments */
    @media (max-width: 768px) {
      .settings-content {
        grid-template-columns: 1fr;
      }
      
      .button-group {
        flex-direction: column;
        gap: 8px;
      }
      
      .button-group button {
        width: 100%;
      }
    }

    ${getFormStyles()}
    ${getButtonStyles()}
    ${getStatusBannerStyles()}
  </style>`;
}
