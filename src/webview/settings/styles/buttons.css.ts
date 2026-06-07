// src/webview/settings/styles/buttons.css.ts
export function getButtonStyles(): string {
  return `
      /* Button Groups and Layout */
      .button-group {
        display: flex;
        gap: 12px;
        margin-top: 16px;
        justify-content: flex-end;
        align-items: center;
      }

      .button-group.start {
        justify-content: flex-start;
      }

      .button-group.center {
        justify-content: center;
      }

      .button-group.space-between {
        justify-content: space-between;
      }

      /* Base Button Styles */
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        cursor: pointer;
        padding: 8px 14px;
        border: none;
        border-radius: 6px;
        background-color: var(--vscode-button-secondaryBackground, var(--vscode-button-background));
        color: var(--vscode-button-secondaryForeground, var(--vscode-button-foreground));
        font-size: 12px;
        font-weight: 500;
        font-family: var(--vscode-font-family);
        line-height: 1.2;
        text-decoration: none;
        white-space: nowrap;
        min-height: 28px;
        height: 28px;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        box-sizing: border-box;
      }

      button:hover:not([disabled]):not(.disabled) {
        background-color: var(--vscode-button-secondaryHoverBackground, var(--vscode-button-hoverBackground));
        border-color: transparent;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
      }

      button:focus-visible {
        outline: 2px solid rgba(0, 122, 204, 0.5);
        outline-offset: 2px;
      }

      button:active:not([disabled]):not(.disabled) {
        transform: translateY(0);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }

      /* Button Size Variants */
      button.small {
        padding: 4px 8px;
        font-size: 11px;
        min-height: 24px;
        height: 24px;
      }

      button.large {
        padding: 10px 18px;
        font-size: 13px;
        font-weight: 600;
        min-height: 32px;
        height: 32px;
      }

      button.icon-only {
        padding: 6px;
        width: 28px;
        height: 28px;
        min-height: 28px;
      }

      button.icon-only.small {
        padding: 4px;
        width: 24px;
        height: 24px;
        min-height: 24px;
      }

      /* Primary Button Styles */
      button.primary {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: transparent;
        font-weight: 600;
      }

      button.primary:hover:not([disabled]):not(.disabled) {
        background-color: var(--vscode-button-hoverBackground);
        border-color: transparent;
      }

      /* Secondary Button Styles */
      button.secondary {
        background-color: rgba(128, 128, 128, 0.1);
        color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
        border-color: transparent;
      }

      button.secondary:hover:not([disabled]):not(.disabled) {
        background-color: rgba(128, 128, 128, 0.15);
        border-color: transparent;
      }

      /* Success Button Styles */
      button.success {
        background-color: #28a745;
        color: white;
        border-color: #28a745;
      }

      button.success:hover:not([disabled]):not(.disabled) {
        background-color: #218838;
        border-color: #1e7e34;
      }

      /* Warning Button Styles */
      button.warning {
        background-color: #ffc107;
        color: #212529;
        border-color: #ffc107;
      }

      button.warning:hover:not([disabled]):not(.disabled) {
        background-color: #e0a800;
        border-color: #d39e00;
      }

      /* Danger Button Styles */
      button.danger {
        background-color: #dc3545;
        color: white;
        border-color: #dc3545;
      }

      button.danger:hover:not([disabled]):not(.disabled) {
        background-color: #c82333;
        border-color: #bd2130;
      }

      /* Info Button Styles */
      button.info {
        background-color: var(--vscode-button-background, #17a2b8);
        color: var(--vscode-button-foreground, white);
        border-color: var(--vscode-button-background, #17a2b8);
      }

      button.info:hover:not([disabled]):not(.disabled) {
        background-color: var(--vscode-button-hoverBackground, #138496);
        border-color: var(--vscode-button-hoverBackground, #117a8b);
      }

      /* Outline Button Variants */
      button.outline {
        background-color: transparent;
        border-width: 1px;
        border-style: solid;
        box-shadow: none;
      }

      button.outline.primary {
        color: var(--vscode-button-background);
        border-color: rgba(0, 122, 204, 0.3);
      }

      button.outline.primary:hover:not([disabled]):not(.disabled) {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
      }

      button.outline.success {
        color: rgba(16, 185, 129, 1);
        border-color: rgba(16, 185, 129, 0.3);
      }

      button.outline.success:hover:not([disabled]):not(.disabled) {
        background-color: rgba(16, 185, 129, 1);
        color: white;
      }

      button.outline.danger {
        color: rgba(239, 68, 68, 1);
        border-color: rgba(239, 68, 68, 0.3);
      }

      button.outline.danger:hover:not([disabled]):not(.disabled) {
        background-color: rgba(239, 68, 68, 1);
        color: white;
      }

      /* Ghost Button Styles */
      button.ghost {
        background-color: transparent;
        border-color: transparent;
        color: var(--vscode-foreground);
        box-shadow: none;
      }

      button.ghost:hover:not([disabled]):not(.disabled) {
        background-color: rgba(128, 128, 128, 0.1);
        border-color: transparent;
      }

      /* Link Button Styles */
      button.link {
        background-color: transparent;
        border-color: transparent;
        color: var(--vscode-textLink-foreground);
        text-decoration: underline;
        padding: 6px 10px;
        min-height: auto;
        box-shadow: none;
      }

      button.link:hover:not([disabled]):not(.disabled) {
        color: var(--vscode-textLink-activeForeground);
        background-color: transparent;
        transform: none;
        box-shadow: none;
      }

      /* Disabled Button States */
      button[disabled],
      button.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
        background-color: var(--vscode-disabledForeground, rgba(158, 158, 158, 0.3)) !important;
        color: var(--vscode-disabledForeground, rgba(127, 127, 127, 0.8)) !important;
        border-color: var(--vscode-disabledForeground, rgba(158, 158, 158, 0.3)) !important;
        transform: none !important;
        box-shadow: none !important;
      }

      /* Pro Feature Button States */
      button.pro-feature-disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: rgba(255, 215, 0, 0.1);
        color: var(--vscode-descriptionForeground);
        border-color: transparent;
        box-shadow: 0 0 0 1px rgba(255, 215, 0, 0.2);
        pointer-events: auto;
        position: relative;
      }

      button.pro-feature-disabled:hover {
        opacity: 0.8;
        box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.3);
        background-color: rgba(255, 215, 0, 0.1);
        transform: none;
      }

      button.pro-feature-disabled::after {
        content: '🔒';
        position: absolute;
        top: -2px;
        right: -2px;
        font-size: 10px;
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        color: #856404;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }

      /* Loading Button State */
      button.loading {
        opacity: 0.8;
        cursor: wait;
        pointer-events: none;
        position: relative;
      }

      button.loading::before {
        content: '';
        position: absolute;
        width: 14px;
        height: 14px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: buttonSpin 1s linear infinite;
      }

      @keyframes buttonSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      button.loading .button-text {
        opacity: 0;
      }

      /* Button with Icons */
      button .icon {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }

      button.small .icon {
        width: 12px;
        height: 12px;
      }

      button.large .icon {
        width: 16px;
        height: 16px;
      }

      /* Button States for Better Feedback */
      button.success-state {
        background-color: #28a745 !important;
        color: white !important;
        border-color: #28a745 !important;
      }

      button.error-state {
        background-color: #dc3545 !important;
        color: white !important;
        border-color: #dc3545 !important;
      }

      /* Grouped Buttons */
      .button-group.connected button {
        border-radius: 0;
        border-right-width: 0;
        box-shadow: none;
      }

      .button-group.connected button:first-child {
        border-top-left-radius: 6px;
        border-bottom-left-radius: 6px;
      }

      .button-group.connected button:last-child {
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
        border-right-width: 1px;
      }

      .button-group.connected button:only-child {
        border-radius: 6px;
        border-right-width: 1px;
      }

      /* Copy Toggle Specific Styles */
      .copy-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 4px;
        color: var(--vscode-foreground);
        cursor: pointer;
        transition: all 0.2s ease;
        opacity: 0.9;
      }

      .copy-toggle:hover:not(.disabled) {
        opacity: 1;
        background-color: rgba(128, 128, 128, 0.1);
        border-color: transparent;
        transform: scale(1.05);
      }

      .copy-toggle:focus-visible {
        outline: 2px solid rgba(0, 122, 204, 0.5);
        outline-offset: 2px;
      }

      .copy-toggle svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
      }

      .copy-toggle.pro-feature {
        color: var(--vscode-button-background);
        border-color: transparent;
      }

      .copy-toggle.pro-feature:hover:not(.disabled) {
        background-color: rgba(0, 122, 204, 0.1);
        border-color: transparent;
      }

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
        transform: none;
      }

      /* Responsive Button Design */
      @media (max-width: 768px) {
        .button-group {
          flex-direction: column;
          gap: 8px;
        }
        
        .button-group button {
          width: 100%;
          justify-content: center;
        }

        .button-group.connected {
          flex-direction: row;
        }

        .button-group.connected button {
          width: auto;
          flex: 1;
        }
      }

      @media (max-width: 480px) {
        button {
          padding: 10px 16px;
          font-size: 14px;
          min-height: 32px;
        }

        button.small {
          padding: 6px 12px;
          font-size: 12px;
          min-height: 28px;
        }

        .button-group {
          gap: 10px;
        }
      }

      /* High Contrast Mode Support */
      @media (prefers-contrast: high) {
        button {
          border-width: 2px;
        }
        
        button:hover:not([disabled]):not(.disabled) {
          border-width: 2px;
        }
        
        button.pro-feature-disabled {
          border-width: 2px;
        }
      }

      /* Reduced Motion Support */
      @media (prefers-reduced-motion: reduce) {
        button {
          transition: none;
        }

        button:hover:not([disabled]):not(.disabled) {
          transform: none;
        }

        .copy-toggle:hover:not(.disabled) {
          transform: none;
        }

        @keyframes buttonSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
      }

      /* Unsaved Changes Indicator */
      .unsaved-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        background-color: #ffc107;
        border-radius: 50%;
        margin-right: 6px;
        animation: pulse 2s ease-in-out infinite;
        box-shadow: 0 0 4px rgba(255, 193, 7, 0.5);
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.7;
          transform: scale(1.1);
        }
      }

      button.has-unsaved-changes {
        background-color: #ffc107 !important;
        color: #212529 !important;
        border-color: #ffc107 !important;
        font-weight: 600;
      }

      button.has-unsaved-changes:hover:not([disabled]):not(.disabled) {
        background-color: #e0a800 !important;
        border-color: #d39e00 !important;
      }

      .unsaved-changes-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        background-color: rgba(255, 193, 7, 0.15);
        color: #ffc107;
        border: 1px solid rgba(255, 193, 7, 0.3);
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.3px;
        white-space: nowrap;
        animation: fadeIn 0.3s ease-in-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .unsaved-indicator {
          animation: none;
        }

        .unsaved-changes-badge {
          animation: none;
        }
      }
      /* Model Loading Specific Styles */
      .model-select-container {
        display: flex;
        gap: 8px;
        align-items: center;
        width: 100%;
        margin-bottom: 4px;
      }

      .model-select-container .searchable-select-container {
        flex: 1;
      }

      .load-models-inline {
        flex-shrink: 0;
        white-space: nowrap;
        background-color: var(--vscode-button-secondaryBackground, rgba(128, 128, 128, 0.1));
        /* Use the secondary-button foreground so the label always contrasts with the
           secondary background. --vscode-foreground (editor text) can match the
           secondary background in some light themes, making the text invisible. */
        color: var(--vscode-button-secondaryForeground, var(--vscode-foreground, #1f1f1f));
        border: 1px solid var(--vscode-button-border, rgba(128, 128, 128, 0.15));
      }

      .load-models-inline:hover:not([disabled]) {
        background-color: var(--vscode-button-secondaryHoverBackground, rgba(128, 128, 128, 0.2));
        color: var(--vscode-button-secondaryForeground, var(--vscode-foreground, #1f1f1f));
        border-color: var(--vscode-focusBorder, rgba(0, 122, 204, 0.4));
      }

      /* Load Models Button in Searchable Dropdown */
      .load-models-btn {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: transparent !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        padding: 4px !important;
        color: var(--vscode-icon-foreground, var(--vscode-foreground, #1f1f1f)) !important;
        transition: all 0.2s ease !important;
        width: 28px !important;
        height: 28px !important;
        opacity: 0.8 !important;
        box-shadow: none !important;
      }

      .load-models-btn:hover:not(:disabled) {
        background: rgba(128, 128, 128, 0.15) !important;
        opacity: 1 !important;
        color: var(--vscode-focusBorder) !important;
      }

      .load-models-btn.loading svg {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
}