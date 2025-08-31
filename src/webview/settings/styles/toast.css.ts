export function getToastStyles(): string {
  return `
    .notification-toast {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--vscode-notifications-background, #1e1e1e);
      color: var(--vscode-notifications-foreground, #cccccc);
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      z-index: 20000;
      min-width: 250px;
      max-width: 500px;
      font-size: 13px;
      font-weight: 400;
      animation: slideInFromTop 0.3s ease-out;
      margin-bottom: 8px;
      border: 1px solid var(--vscode-notifications-border, #454545);
    }

    .toast-success {
      border-left: 3px solid var(--vscode-charts-green, #4CAF50);
    }

    .toast-error {
      border-left: 3px solid var(--vscode-charts-red, #f44336);
    }

    .toast-warning {
      border-left: 3px solid var(--vscode-charts-orange, #ff9800);
    }

    .toast-info {
      border-left: 3px solid var(--vscode-charts-blue, #2196F3);
    }

    @keyframes slideInFromTop {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    
    @keyframes slideOutToTop {
      from {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      to {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
    }
    
    .toast-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .toast-message {
      flex: 1;
      line-height: 1.3;
    }
    
    .toast-close {
      background: none;
      border: none;
      color: var(--vscode-notifications-foreground, #cccccc);
      font-size: 16px;
      font-weight: normal;
      cursor: pointer;
      padding: 2px;
      margin-left: 8px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;
      flex-shrink: 0;
      opacity: 0.7;
      transition: all 0.2s;
    }
    
    .toast-close:hover {
      opacity: 1;
      background: var(--vscode-toolbar-hoverBackground, rgba(255, 255, 255, 0.1));
    }
  `;
}
