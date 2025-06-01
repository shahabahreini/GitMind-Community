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

    /* Compact styling for general settings */
    .general-settings-compact {
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-input-border);
    }

    .general-settings-compact + .settings-section {
      margin-top: 16px;
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

    /* Status Dialog */
    .status-dialog {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .status-dialog-content {
      background-color: var(--vscode-editor-background);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .status-dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--vscode-input-border);
    }

    .status-dialog-header h3 {
      margin: 0;
      padding: 0;
      border-bottom: none;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: var(--vscode-foreground);
    }

    .status-dialog-body {
      padding: 16px;
    }

    .status-spinner {
      display: inline-block;
      width: 30px;
      height: 30px;
      margin: 0 auto 16px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: var(--vscode-textLink-foreground);
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .status-details {
      margin-top: 16px;
      border-radius: 4px;
      overflow: hidden;
    }

    .status-details.success {
      border-left: 4px solid #28a745;
    }

    .status-details.error {
      border-left: 4px solid #dc3545;
    }

    .status-success,
    .status-error {
      display: flex;
      gap: 16px;
      padding: 16px;
      background-color: var(--vscode-editor-inactiveSelectionBackground);
    }

    .status-success svg {
      color: #28a745;
      flex-shrink: 0;
    }

    .status-error svg {
      color: #dc3545;
      flex-shrink: 0;
    }

    .status-success h4,
    .status-error h4 {
      margin-top: 0;
      margin-bottom: 8px;
      border-bottom: none;
      padding-bottom: 0;
    }

    .status-success ul,
    .status-error ul {
      margin: 0;
      padding-left: 20px;
    }

    .status-success p,
    .status-error p {
      margin-bottom: 0;
    }

    .rate-limit-note {
      margin-top: 12px;
      padding: 8px 12px;
      background-color: var(--vscode-inputValidation-infoBackground, rgba(100, 150, 255, 0.1));
      border-left: 4px solid var(--vscode-inputValidation-infoBorder, #3794ff);
      border-radius: 3px;
    }

    .rate-limit-note p {
      margin: 0;
      color: var(--vscode-inputValidation-infoForeground, var(--vscode-foreground));
    }

    .api-settings.hidden {
      display: none !important;
    }

    /* Info Banner Styles for Copilot */
    .info-banner {
      background: linear-gradient(135deg, 
        var(--vscode-inputValidation-infoBackground, rgba(100, 150, 255, 0.08)) 0%, 
        var(--vscode-inputValidation-infoBackground, rgba(100, 150, 255, 0.12)) 100%);
      border: 1px solid var(--vscode-inputValidation-infoBorder, rgba(100, 150, 255, 0.3));
      border-left: 4px solid var(--vscode-inputValidation-infoBorder, #3794ff);
      border-radius: 8px;
      margin-bottom: 20px;
      overflow: hidden;
      position: relative;
      transition: all 0.3s ease;
    }

    .info-banner:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(100, 150, 255, 0.15);
    }

    .info-banner::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        var(--vscode-inputValidation-infoBorder, #3794ff) 50%, 
        transparent 100%);
      opacity: 0.6;
    }

    .info-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
      position: relative;
    }

    .info-icon {
      font-size: 20px;
      line-height: 1;
      margin-top: 2px;
      flex-shrink: 0;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
      animation: gentle-pulse 3s ease-in-out infinite;
    }

    @keyframes gentle-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }

    .info-text {
      flex: 1;
      line-height: 1.5;
    }

    .info-text strong {
      color: var(--vscode-inputValidation-infoBorder, #3794ff);
      font-weight: 600;
      font-size: 14px;
      display: block;
      margin-bottom: 4px;
    }

    .info-text br + * {
      margin-top: 6px;
    }

    .info-text {
      font-size: 13px;
      color: var(--vscode-inputValidation-infoForeground, var(--vscode-foreground));
      opacity: 0.9;
    }

    /* GitHub Copilot specific styling */
    .copilot-info-banner {
      background: linear-gradient(135deg, 
        rgba(30, 213, 169, 0.08) 0%, 
        rgba(30, 213, 169, 0.12) 100%);
      border-color: rgba(30, 213, 169, 0.3);
      border-left-color: #1ed5a9;
    }

    .copilot-info-banner::before {
      background: linear-gradient(90deg, 
        transparent 0%, 
        #1ed5a9 50%, 
        transparent 100%);
    }

    .copilot-info-banner .info-text strong {
      color: #1ed5a9;
    }

    .copilot-info-banner:hover {
      box-shadow: 0 4px 12px rgba(30, 213, 169, 0.15);
    }

    /* Additional visual enhancements */
    .info-banner .info-icon {
      background: radial-gradient(circle, 
        var(--vscode-inputValidation-infoBorder, #3794ff) 0%, 
        transparent 70%);
      background-size: 30px 30px;
      background-position: center;
      background-repeat: no-repeat;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .copilot-info-banner .info-icon {
      background: radial-gradient(circle, 
        rgba(30, 213, 169, 0.2) 0%, 
        transparent 70%);
    }

    ${getFormStyles()}
    ${getButtonStyles()}
    ${getStatusBannerStyles()}
  </style>`;
}
