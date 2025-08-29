// src/webview/settings/styles/statusBanner.css.ts
import { ProviderIcon } from "../components/ProviderIcon";

export function getStatusBannerStyles(): string {
  return `
      /* Compact Status Banner - New Design */
      .status-banner-compact {
        background: var(--vscode-editor-background);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
        transition: all 0.3s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
      }

      .status-banner-compact:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
        border-color: rgba(255, 255, 255, 0.12);
      }

      .banner-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .header-content {
        flex: 1;
        min-width: 0;
      }

      .provider-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
      }

      .provider-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--vscode-foreground);
      }

      .pro-badge, .free-badge {
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 2px 6px;
        border-radius: 8px;
      }

      .pro-badge {
        background: linear-gradient(135deg, #ffd700, #ffb000);
        color: #8b4513;
        box-shadow: 0 1px 3px rgba(255, 215, 0, 0.4);
      }

      .free-badge {
        background: rgba(156, 163, 175, 0.2);
        color: #9ca3af;
        border: 1px solid rgba(156, 163, 175, 0.3);
      }

      .model-display {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        font-family: var(--vscode-editor-font-family, 'SF Mono', monospace);
        background: rgba(255, 255, 255, 0.03);
        padding: 3px 6px;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        max-width: fit-content;
        word-break: break-all;
      }

      .status-content {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .status-row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }

      .status-row.primary .inline-status {
        flex: 1;
        min-width: 120px;
      }

      .status-row.secondary .inline-status {
        flex: 1;
        min-width: 100px;
      }

      .inline-status {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .inline-label {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.7;
      }

      .inline-value {
        font-size: 11px;
        font-weight: 500;
        color: var(--vscode-foreground);
        display: flex;
        align-items: center;
        gap: 3px;
      }

      .status-indicator {
        font-size: 8px;
        margin-right: 2px;
      }

      .status-indicator.configured {
        color: #10b981;
      }

      .status-indicator.disabled {
        color: #6b7280;
      }

      /* Legacy Status Banner (keep for backwards compatibility) */
      .status-banner {
        background: var(--vscode-editor-background);
        border-radius: 8px;
        margin-bottom: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
      }

      .status-banner:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
      }
      
      .status-banner-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px 12px 20px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.02), transparent);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        gap: 16px;
      }
      
      .status-banner-title {
        display: flex;
        flex-direction: column;
        justify-content: center;
        flex: 1;
        min-width: 0;
      }

      .provider-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        flex-shrink: 0;
      }

      .provider-icon.gemini {
        background: linear-gradient(135deg, #4285f4, #34a853);
        color: white;
        box-shadow: 0 2px 6px rgba(66, 133, 244, 0.3);
      }

      .provider-icon.openai {
        background: linear-gradient(135deg, #10a37f, #1a7f64);
        color: white;
        box-shadow: 0 2px 6px rgba(16, 163, 127, 0.3);
      }

      .provider-icon.anthropic {
        background: linear-gradient(135deg, #b300ff, #8a00cc);
        color: white;
        box-shadow: 0 2px 6px rgba(179, 0, 255, 0.3);
      }

      .provider-icon.ollama {
        background: linear-gradient(135deg, #7c3aed, #5b21b6);
        color: white;
        box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
      }

      .provider-icon.copilot {
        background: linear-gradient(135deg, #1ed5a9, #00b894);
        color: white;
        box-shadow: 0 2px 6px rgba(30, 213, 169, 0.3);
      }

      .provider-icon.huggingface {
        background: linear-gradient(135deg, #ff9a00, #ff7b00);
        color: white;
        box-shadow: 0 2px 6px rgba(255, 154, 0, 0.3);
      }

      .provider-icon.mistral {
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        box-shadow: 0 2px 6px rgba(255, 107, 53, 0.3);
      }

      .provider-icon.cohere {
        background: linear-gradient(135deg, #39c5bb, #2ea19a);
        color: white;
        box-shadow: 0 2px 6px rgba(57, 197, 187, 0.3);
      }

      .provider-icon.together {
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: white;
        box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
      }

      .provider-icon.openrouter {
        background: linear-gradient(135deg, #e11d48, #be185d);
        color: white;
        box-shadow: 0 2px 6px rgba(225, 29, 72, 0.3);
      }

      .provider-icon.deepseek {
        background: linear-gradient(135deg, #1e293b, #475569);
        color: white;
        box-shadow: 0 2px 6px rgba(30, 41, 59, 0.3);
      }

      .provider-icon.grok {
        background: linear-gradient(135deg, #000000, #1f2937);
        color: white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }

      .provider-icon.perplexity {
        background: linear-gradient(135deg, #00d4aa, #00b894);
        color: white;
        box-shadow: 0 2px 6px rgba(0, 212, 170, 0.3);
      }

      .provider-title-info {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
        flex: 1;
      }
      
      .status-banner h3 {
        margin: 0;
        color: var(--vscode-foreground);
        font-size: 16px;
        font-weight: 600;
        line-height: 1.2;
      }
      
      .status-provider-name {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
        opacity: 0.6;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }

      .pro-badge-banner {
        background: linear-gradient(135deg, #ffd700, #ffb000);
        color: #8b4513;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 1px 4px rgba(255, 215, 0, 0.4);
        flex-shrink: 0;
      }
      
      .status-banner-content {
        padding: 0 20px 16px 20px;
      }

      .current-model-section {
        margin-bottom: 14px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
      }

      .current-model-label {
        font-size: 9px;
        color: var(--vscode-descriptionForeground);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 4px;
        opacity: 0.6;
      }

      .current-model-value {
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
        font-family: var(--vscode-editor-font-family, 'SF Mono', monospace);
        background: rgba(255, 255, 255, 0.03);
        padding: 6px 8px;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        word-break: break-all;
      }
      
      .status-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      
      .status-item {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        transition: all 0.2s ease;
        min-height: 50px;
        justify-content: center;
      }
      
      .status-item:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
      }
      
      .status-label {
        font-size: 9px;
        color: var(--vscode-descriptionForeground);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        opacity: 0.6;
        margin: 0;
      }
      
      .status-value {
        font-weight: 600;
        color: var(--vscode-foreground);
        font-size: 12px;
        line-height: 1.2;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 4px;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        border: none;
        transition: all 0.2s ease;
      }

      .status-badge.gemini {
        background: linear-gradient(135deg, #4285f4, #34a853);
        color: white;
        box-shadow: 0 1px 3px rgba(66, 133, 244, 0.3);
      }

      .status-badge.openai {
        background: linear-gradient(135deg, #10a37f, #1a7f64);
        color: white;
        box-shadow: 0 1px 3px rgba(16, 163, 127, 0.3);
      }

      .status-badge.anthropic {
        background: linear-gradient(135deg, #b300ff, #8a00cc);
        color: white;
        box-shadow: 0 1px 3px rgba(179, 0, 255, 0.3);
      }

      .status-badge.ollama {
        background: linear-gradient(135deg, #7c3aed, #5b21b6);
        color: white;
        box-shadow: 0 1px 3px rgba(124, 58, 237, 0.3);
      }

      .status-badge.copilot {
        background: linear-gradient(135deg, #1ed5a9, #00b894);
        color: white;
        box-shadow: 0 1px 3px rgba(30, 213, 169, 0.3);
      }

      .status-badge.huggingface {
        background: linear-gradient(135deg, #ff9a00, #ff7b00);
        color: white;
        box-shadow: 0 1px 3px rgba(255, 154, 0, 0.3);
      }

      .status-badge.mistral {
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        box-shadow: 0 1px 3px rgba(255, 107, 53, 0.3);
      }

      .status-badge.cohere {
        background: linear-gradient(135deg, #39c5bb, #2ea19a);
        color: white;
        box-shadow: 0 1px 3px rgba(57, 197, 187, 0.3);
      }

      .status-badge.together {
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: white;
        box-shadow: 0 1px 3px rgba(99, 102, 241, 0.3);
      }

      .status-badge.openrouter {
        background: linear-gradient(135deg, #e11d48, #be185d);
        color: white;
        box-shadow: 0 1px 3px rgba(225, 29, 72, 0.3);
      }

      .status-badge.deepseek {
        background: linear-gradient(135deg, #1e293b, #475569);
        color: white;
        box-shadow: 0 1px 3px rgba(30, 41, 59, 0.3);
      }

      .status-badge.grok {
        background: linear-gradient(135deg, #000000, #1f2937);
        color: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      .status-badge.perplexity {
        background: linear-gradient(135deg, #00d4aa, #00b894);
        color: white;
        box-shadow: 0 1px 3px rgba(0, 212, 170, 0.3);
      }

      .status-value.configured {
        color: #10b981;
      }

      .status-value.configured::before {
        content: '●';
        color: #10b981;
        margin-right: 4px;
        font-size: 10px;
      }

      .status-value.disabled {
        color: #6b7280;
      }

      .status-value.disabled::before {
        content: '○';
        color: #6b7280;
        margin-right: 4px;
        font-size: 10px;
      }

      .status-value.verbose {
        color: #3b82f6;
      }

      .status-value.verbose::before {
        content: '📝';
        margin-right: 4px;
        font-size: 10px;
      }

      .model-section {
        margin-bottom: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
      }

      .model-item {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .model-label {
        font-size: 9px;
        color: var(--vscode-descriptionForeground);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 3px;
        opacity: 0.6;
      }

      .model-value {
        font-size: 12px;
        font-weight: 500;
        color: var(--vscode-foreground);
        font-family: var(--vscode-editor-font-family, 'SF Mono', monospace);
        background: var(--vscode-input-background);
        padding: 6px 10px;
        border-radius: 4px;
        border: 1px solid var(--vscode-input-border, rgba(255, 255, 255, 0.1));
        word-break: break-word;
        line-height: 1.4;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .model-value:hover {
        background: var(--vscode-inputOption-hoverBackground, rgba(90, 93, 94, 0.3));
        border-color: var(--vscode-focusBorder, rgba(14, 99, 156, 0.6));
      }

      .user-type-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 10px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        transition: all 0.2s ease;
      }

      .user-type-badge.free-user {
        background: rgba(156, 163, 175, 0.2);
        color: #9ca3af;
        border: 1px solid rgba(156, 163, 175, 0.3);
      }

      .user-type-badge.pro-user {
        background: linear-gradient(135deg, #ffd700, #ffb000);
        color: #8b4513;
        box-shadow: 0 1px 3px rgba(255, 215, 0, 0.4);
        font-weight: 700;
      }

      .pro-badge-container {
        margin-left: auto;
      }

      /* Responsive design for compact banner */
      @media (max-width: 768px) {
        .status-banner-compact {
          padding: 14px;
        }

        .banner-header {
          gap: 10px;
          margin-bottom: 10px;
        }

        .provider-name {
          font-size: 14px;
        }

        .model-display {
          font-size: 10px;
        }

        .status-row {
          gap: 12px;
        }

        .status-row.primary .inline-status,
        .status-row.secondary .inline-status {
          min-width: 90px;
        }

        /* Legacy responsive */
        .status-banner-header {
          padding: 12px 16px 8px 16px;
          gap: 12px;
        }

        .status-banner-content {
          padding: 0 16px 12px 16px;
        }

        .provider-icon {
          width: 28px;
          height: 28px;
          font-size: 12px;
        }

        .status-banner h3 {
          font-size: 14px;
        }

        .status-grid {
          grid-template-columns: 1fr;
          gap: 6px;
        }

        .status-item {
          padding: 10px;
          min-height: 44px;
        }

        .current-model-section {
          margin-bottom: 10px;
          padding: 10px;
        }
      }

      @media (max-width: 480px) {
        .status-banner-compact {
          padding: 12px;
        }

        .banner-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .provider-info {
          align-self: stretch;
          justify-content: space-between;
        }

        .status-row {
          flex-direction: column;
          gap: 4px;
        }

        .inline-status {
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .inline-status:last-child {
          border-bottom: none;
        }

        /* Legacy responsive */
        .status-banner-header {
          padding: 10px 14px 6px 14px;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }

        .status-banner-title {
          width: 100%;
        }

        .pro-badge-banner {
          align-self: flex-end;
        }

        .status-banner-content {
          padding: 0 14px 10px 14px;
        }

        .provider-icon {
          width: 24px;
          height: 24px;
          font-size: 10px;
        }

        .status-banner h3 {
          font-size: 13px;
        }

        .status-item {
          padding: 8px;
          min-height: 40px;
        }

        .current-model-value {
          font-size: 11px;
          padding: 4px 6px;
        }
      }

      /* Import provider icons */
      ${ProviderIcon.getIconStyles()}
    `;
}