// src/webview/settings/styles/main.css.ts
import { getFormStyles } from "./forms.css";
import { getButtonStyles } from "./buttons.css";
import { getTabStyles } from "./tabs.css";
import { getCardStyles } from "./cards.css";
import { getToggleStyles } from "./toggle.css";
import { getStatusBannerStyles } from "./statusBanner.css";
import { getOllamaStyles } from "./ollamaStyles.css";
import { getStatusStyles } from "./status.css";
import { getActivationStyles } from "./activation.css";
import { getSubscriptionStyles } from "./subscription.css";
import { getDevModeStyles } from "./devMode.css";
import { getProFeatureStyles } from "./proFeature.css";
import { getTooltipStyles } from "./tooltip.css";
import { getCustomApiStyles } from "./customApi.css";
import { getLargeDiffStyles } from "./largeDiffStyles.css";
import { proFeaturesModernCSS } from "./pro-features-modern";
import { getCommitStyleStyles } from "./commitStyle.css";
import { getEmojiEnhancementStyles } from "./emojiEnhancement.css";
import { getSearchableDropdownStyles } from "./searchableDropdown.css";

export function getMainStyles(): string {
  return `<style>
    body {
      padding: 16px;
      color: var(--vscode-foreground);
      font-family: var(--vscode-font-family);
      background-color: var(--vscode-editor-background);
      font-size: 13px;
      line-height: 1.4;
    }

    .settings-container {
      max-width: 800px;
      margin: 0 auto;
    }

    h2, h3 {
      color: var(--vscode-foreground);
      border-bottom: none;
      padding-bottom: 0;
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }

    .settings-section {
      margin-bottom: 16px;
    }

    /* Pro Features Section Styles */
    .pro-features-section {
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 0;
      margin-bottom: 20px;
    }

    /* Card Styles for Settings */
    .minimalist-card {
      background: var(--vscode-editor-background);
      border-radius: 6px;
      overflow: visible; /* Changed from hidden to allow tooltips to display above card boundaries */
      box-shadow: none;
      border: 1px solid rgba(128, 128, 128, 0.12);
      margin-bottom: 16px;
    }

    .card-content {
      padding: 16px;
    }

    /* Form Elements Styling */
    .form-group {
      margin-bottom: 14px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: var(--vscode-foreground);
      font-size: 13px;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid rgba(128, 128, 128, 0.12);
      border-radius: 6px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-size: 13px;
      font-family: var(--vscode-font-family);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      height: 34px;
      box-sizing: border-box;
    }

    .form-group select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      padding: 6px 32px 6px 10px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='m6 9 6 6 6-6' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 16px;
      cursor: pointer;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
      box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .form-group select:hover:not(:disabled) {
      border-color: var(--vscode-focusBorder, rgba(0, 122, 204, 0.4));
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='m6 9 6 6 6-6' stroke='%230078d4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    }

    /* Hidden API Settings */
    .api-settings {
      margin-top: 1rem;
    }

    .api-settings.hidden {
      display: none;
    }

    /* Tab System Base Styles */
    .tabs-container {
      margin-top: 12px;
      width: 100%;
    }

    .tabs-header {
      display: flex;
      border-bottom: none;
      margin-bottom: 12px;
      background: rgba(128, 128, 128, 0.05);
      border-radius: 8px;
      padding: 3px;
      width: 100%;
    }

    .tab-button {
      background: transparent;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      color: var(--vscode-foreground);
      border-bottom: none;
      border-radius: 6px;
      transition: all 0.2s ease;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.02em;
      outline: none;
      white-space: nowrap;
      opacity: 0.7;
      height: 32px;
      line-height: 16px;
    }

    .tab-button:hover {
      background: rgba(128, 128, 128, 0.1);
      opacity: 1;
    }

    .tab-button.active {
      border-bottom: none;
      font-weight: 600;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      opacity: 1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .tab-content {
      display: none;
      animation: fadeIn 0.2s ease-in-out;
      width: 100%;
    }

    .tab-content.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Compact styling for general settings */
    .general-settings-compact {
      margin-bottom: 16px;
      padding-bottom: 0;
      border-bottom: none;
    }

    .general-settings-compact + .settings-section {
      margin-top: 16px;
    }

    .description {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 3px;
    }

    .settings-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid rgba(128, 128, 128, 0.12);
    }

    .settings-footer-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      opacity: 0.9;
    }

    .settings-footer-meta {
      white-space: nowrap;
    }

    .settings-footer-sep {
      opacity: 0.6;
    }

    .settings-footer-link {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      white-space: nowrap;
    }

    .settings-footer-link:hover {
      color: var(--vscode-textLink-activeForeground);
      text-decoration: underline;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      top: 16px;
      right: 16px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      padding: 10px 14px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 8000;
      transform: translateY(-100px);
      opacity: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
      font-size: 13px;
      max-width: 300px;
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

    .toast.warning {
      background-color: #f39c12;
      color: white;
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
      body {
        padding: 12px;
      }
      
      .settings-container {
        max-width: 100%;
      }
      
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
      
      .tab-button {
        padding: 6px 12px;
        font-size: 12px;
        height: 28px;
      }
      
      .form-group input, 
      .form-group select {
        height: 38px;
        padding: 10px 12px;
      }

      .form-group select {
        padding: 10px 32px 10px 12px;
      }
    }

    @media (max-width: 480px) {
      body {
        padding: 8px;
      }
      
      .card-content {
        padding: 12px;
      }
      
      .pro-features-section {
        padding: 12px;
      }
      
      .info-content {
        padding: 10px 12px;
        gap: 8px;
      }
      
      .status-dialog-content {
        width: 95%;
      }
      
      .toast {
        max-width: 280px;
        padding: 8px 12px;
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
      z-index: 9000;
    }

    .status-dialog-content {
      background-color: var(--vscode-editor-background);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .status-dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--vscode-input-border);
    }

    .status-dialog-header h3 {
      margin: 0;
      padding: 0;
      border-bottom: none;
      font-size: 14px;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--vscode-foreground);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-dialog-body {
      padding: 12px 16px;
    }

    .status-spinner {
      display: inline-block;
      width: 24px;
      height: 24px;
      margin: 0 auto 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: var(--vscode-textLink-foreground);
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .status-details {
      margin-top: 12px;
      border-radius: 6px;
      overflow: hidden;
    }

    .status-details.success {
      border-left: 3px solid #28a745;
    }

    .status-details.error {
      border-left: 3px solid #dc3545;
    }

    .status-details.warning {
      border-left: 3px solid #f39c12;
    }

    .status-success,
    .status-error,
    .status-warning {
      display: flex;
      gap: 12px;
      padding: 12px;
      background-color: var(--vscode-editor-inactiveSelectionBackground);
    }

    .status-success svg,
    .status-error svg,
    .status-warning svg {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
    }

    .status-success h4,
    .status-error h4,
    .status-warning h4 {
      margin-top: 0;
      margin-bottom: 6px;
      border-bottom: none;
      padding-bottom: 0;
      font-size: 14px;
    }

    .status-success ul,
    .status-error ul,
    .status-warning ul {
      margin: 0;
      padding-left: 16px;
    }

    .status-success p,
    .status-error p,
    .status-warning p {
      margin-bottom: 0;
      font-size: 13px;
    }

    .rate-limit-note {
      margin-top: 10px;
      padding: 8px 10px;
      background-color: var(--vscode-inputValidation-infoBackground, rgba(100, 150, 255, 0.1));
      border-left: 3px solid var(--vscode-inputValidation-infoBorder, #3794ff);
      border-radius: 4px;
    }

    .rate-limit-note p {
      margin: 0;
      color: var(--vscode-inputValidation-infoForeground, var(--vscode-foreground));
      font-size: 12px;
    }

    .api-settings.hidden {
      display: none !important;
    }

    /* Info Banner Styles for Copilot */
    .info-banner {
      background: rgba(100, 150, 255, 0.05);
      border: none;
      border-left: 3px solid rgba(100, 150, 255, 0.4);
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
      position: relative;
      transition: all 0.3s ease;
    }

    .info-banner:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(100, 150, 255, 0.1);
    }

    .info-banner::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(100, 150, 255, 0.3) 50%, 
        transparent 100%);
      opacity: 0.6;
    }

    .info-content {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 16px;
      position: relative;
    }

    .info-icon {
      font-size: 16px;
      line-height: 1;
      margin-top: 1px;
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
      line-height: 1.4;
    }

    .info-text strong {
      color: var(--vscode-inputValidation-infoBorder, #3794ff);
      font-weight: 600;
      font-size: 13px;
      display: block;
      margin-bottom: 3px;
    }

    .info-text br + * {
      margin-top: 4px;
    }

    .info-text {
      font-size: 12px;
      color: var(--vscode-inputValidation-infoForeground, var(--vscode-foreground));
      opacity: 0.9;
    }

    /* GitHub Copilot specific styling */
    .copilot-info-banner {
      background: rgba(30, 213, 169, 0.05);
      border-color: transparent;
      border-left-color: rgba(30, 213, 169, 0.4);
    }

    .copilot-info-banner::before {
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(30, 213, 169, 0.3) 50%, 
        transparent 100%);
    }

    .copilot-info-banner .info-text strong {
      color: rgba(30, 213, 169, 1);
    }

    .copilot-info-banner:hover {
      box-shadow: 0 4px 12px rgba(30, 213, 169, 0.1);
    }

    /* Additional visual enhancements */
    .info-banner .info-icon {
      background: radial-gradient(circle, 
        var(--vscode-inputValidation-infoBorder, #3794ff) 0%, 
        transparent 70%);
      background-size: 24px 24px;
      background-position: center;
      background-repeat: no-repeat;
      width: 20px;
      height: 20px;
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

    /* Dialog message styling */
    .status-dialog-body div[id$="Message"] {
      font-weight: 500;
      margin-bottom: 6px;
      font-size: 13px;
    }
    
    .status-dialog-body div[id$="Message"].status-success {
      color: #28a745;
    }
    
    .status-dialog-body div[id$="Message"].status-error {
      color: #dc3545;
    }
    
    .status-dialog-body div[id$="Message"].status-warning {
      color: #f39c12;
    }

    /* Pro Features Styles */
    .pro-features-section {
      background: var(--vscode-editor-background);
      border: none;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      position: relative;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .pro-features-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      color: var(--vscode-foreground);
      border-bottom: none;
      padding-bottom: 0;
      font-size: 14px;
    }

    .pro-icon {
      font-size: 16px;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }

    .upgrade-badge {
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-left: auto;
      height: 16px;
      line-height: 12px;
    }

    .pro-badge {
      background: linear-gradient(135deg, #00d2d3, #54a0ff);
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-left: auto;
      height: 16px;
      line-height: 12px;
    }

    .upgrade-prompt {
      background: rgba(255, 107, 107, 0.05);
      border: none;
      border-left: 3px solid rgba(255, 107, 107, 0.4);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .upgrade-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .upgrade-text {
      flex: 1;
    }

    .upgrade-text h4 {
      margin: 0 0 6px 0;
      color: var(--vscode-foreground);
      font-size: 14px;
      font-weight: 600;
    }

    .upgrade-text p {
      margin: 0;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      line-height: 1.4;
    }

    .upgrade-button {
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      display: inline-block;
      height: 32px;
      line-height: 16px;
    }

    .upgrade-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
    }

    .pro-feature-item {
      background: var(--vscode-editor-background);
      border: none;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .feature-header {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 10px;
    }

    .feature-icon {
      font-size: 16px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .feature-info h4 {
      margin: 0 0 4px 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--vscode-foreground);
    }

    .feature-description {
      margin: 0;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.4;
    }

    .feature-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .compact-toggle-row.disabled {
      opacity: 0.6;
      pointer-events: none;
    }

    .toggle-slider.disabled {
      background-color: var(--vscode-input-border);
      cursor: not-allowed;
    }

    .compact-label.disabled {
      color: var(--vscode-descriptionForeground);
      cursor: not-allowed;
    }

    .encryption-actions {
      display: flex;
      gap: 6px;
    }

    .secondary-button {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: 1px solid var(--vscode-input-border);
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      height: 28px;
      line-height: 16px;
      box-sizing: border-box;
    }

    .secondary-button:hover {
      background: var(--vscode-button-secondaryHoverBackground);
      border-color: var(--vscode-focusBorder);
    }

    .future-features-preview {
      margin-top: 16px;
      padding: 16px;
      background: rgba(128, 128, 128, 0.03);
      border-left: 3px solid rgba(128, 128, 128, 0.3);
      border-radius: 8px;
      border: none;
    }

    .future-features-preview h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--vscode-foreground);
    }

    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(128, 128, 128, 0.1);
      min-height: 24px;
    }

    .feature-item:last-child {
      border-bottom: none;
    }

    .feature-item.coming-soon {
      opacity: 0.7;
    }

    .feature-name {
      flex: 1;
      font-size: 12px;
      color: var(--vscode-foreground);
    }

    .coming-soon-badge {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      height: 18px;
      line-height: 14px;
      box-sizing: border-box;
    }

    .pro-license-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(128, 128, 128, 0.1);
    }

    .pro-license-section input.verified {
      border-color: #28a745;
      background-color: rgba(40, 167, 69, 0.1);
    }

    .required {
      color: #dc3545;
      font-weight: 600;
      font-size: 12px;
    }

    .verified {
      color: #28a745;
      font-weight: 600;
      font-size: 12px;
    }

    .dev-mode-notice {
      background: rgba(255, 193, 7, 0.05);
      border: none;
      border-left: 3px solid rgba(255, 193, 7, 0.4);
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
    }

    .notice-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    .dev-icon {
      font-size: 14px;
    }

    .dev-mode-notice p {
      margin: 0;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.4;
    }

    .dev-mode-notice code {
      background: var(--vscode-textCodeBlock-background);
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 11px;
    }

    /* Toast animations */
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    ${getFormStyles()}
    ${getButtonStyles()}
    ${getTabStyles()}
    ${getCardStyles()}
    ${getToggleStyles()}
    ${getStatusBannerStyles()}
    ${getOllamaStyles()}
    ${getStatusStyles()}
    ${getActivationStyles()}
    ${getSubscriptionStyles()}
    ${getDevModeStyles()}
    ${getProFeatureStyles()}
    ${getTooltipStyles()}
    ${getCustomApiStyles()}
    ${getLargeDiffStyles()}
    ${proFeaturesModernCSS}
    ${getCommitStyleStyles()}
    ${getEmojiEnhancementStyles()}
    ${getSearchableDropdownStyles()}
  </style>`;
}
