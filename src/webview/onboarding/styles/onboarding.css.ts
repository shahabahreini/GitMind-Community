// src/webview/onboarding/styles/onboarding.css.ts
export function getOnboardingStyles(): string {
    return `
    <style>
    :root {
      --primary-color: #007acc;
      --primary-hover: #005c99;
      --success-color: #28a745;
      --warning-color: #ffc107;
      --danger-color: #dc3545;
      --secondary-color: #6c757d;
      --light-bg: #f8f9fa;
      --dark-bg: #343a40;
      --border-radius: 8px;
      --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      --transition: all 0.3s ease;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      overflow-x: hidden;
    }

    .onboarding-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      min-height: 100vh;
    }

    /* Header Styles */
    .header {
      text-align: center;
      margin-bottom: 60px;
      padding: 20px 0;
    }

    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: var(--vscode-foreground);
    }

    .subtitle {
      font-size: 1.2rem;
      color: var(--vscode-descriptionForeground);
      font-weight: 400;
    }

    /* Main Content */
    .main-content {
      display: flex;
      flex-direction: column;
      gap: 60px;
    }

    .content-section {
      width: 100%;
    }

    .content-section h2 {
      font-size: 1.8rem;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--vscode-foreground);
    }

    .section-description {
      font-size: 1rem;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 30px;
    }

    /* Quick Start */
    .quick-start {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: var(--border-radius);
      padding: 30px;
    }

    .steps-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: var(--vscode-sideBar-background);
      border-radius: var(--border-radius);
      transition: var(--transition);
    }

    .step-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 122, 204, 0.1);
    }

    .step-number {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--primary-color), #00d4ff);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .step-content h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }

    .step-content p {
      font-size: 0.95rem;
      color: var(--vscode-descriptionForeground);
      line-height: 1.5;
    }

    /* Provider Selection */
    .provider-selection {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: var(--border-radius);
      padding: 30px;
    }

    .provider-category {
      margin-bottom: 40px;
    }

    .provider-category:last-child {
      margin-bottom: 0;
    }

    .category-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 20px;
      color: var(--vscode-foreground);
      padding-bottom: 10px;
      border-bottom: 2px solid var(--vscode-panel-border);
    }

    .providers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .provider-card {
      background: var(--vscode-sideBar-background);
      border: 2px solid var(--vscode-panel-border);
      border-radius: var(--border-radius);
      padding: 20px;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .provider-card:hover {
      border-color: var(--primary-color);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 122, 204, 0.15);
    }

    .provider-card.selected {
      border-color: var(--primary-color);
      background: var(--vscode-list-activeSelectionBackground);
      box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.2);
    }

    .provider-icon-container {
      flex-shrink: 0;
    }

    .provider-info {
      flex: 1;
    }

    .provider-info h4 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }

    .provider-tier {
      display: inline-block;
      font-size: 0.75rem;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 500;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .provider-tier.paid {
      background: rgba(0, 122, 204, 0.1);
      color: var(--primary-color);
    }

    .provider-tier.free {
      background: rgba(40, 167, 69, 0.1);
      color: var(--success-color);
    }

    .provider-tier.free-tier {
      background: rgba(40, 167, 69, 0.1);
      color: var(--success-color);
    }

    .provider-tier.premium {
      background: rgba(255, 193, 7, 0.1);
      color: var(--warning-color);
    }

    .provider-tier.subscription {
      background: rgba(108, 117, 125, 0.1);
      color: var(--secondary-color);
    }

    .provider-tier.pro {
      background: rgba(220, 53, 69, 0.1);
      color: var(--danger-color);
    }

    .provider-info p {
      color: var(--vscode-descriptionForeground);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .provider-selection-status {
      margin-top: 30px;
      padding: 20px;
      background: var(--vscode-sideBar-background);
      border-radius: var(--border-radius);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-label {
      font-weight: 600;
      color: var(--vscode-foreground);
    }

    .status-value {
      color: var(--vscode-descriptionForeground);
    }

    /* Features Section */
    .features-section {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: var(--border-radius);
      padding: 30px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 24px;
    }

    .feature-card {
      padding: 24px;
      background: var(--vscode-sideBar-background);
      border-radius: var(--border-radius);
      transition: var(--transition);
      border: 1px solid transparent;
    }

    .feature-card:hover {
      border-color: var(--vscode-panel-border);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .feature-card h4 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }

    .feature-card p {
      font-size: 0.9rem;
      color: var(--vscode-descriptionForeground);
      line-height: 1.5;
    }

    /* Actions Section */
    .actions-section {
      text-align: center;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: var(--border-radius);
      padding: 40px 30px;
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 30px;
      flex-wrap: wrap;
    }

    .additional-actions {
      margin-top: 24px;
    }

    /* Button Styles */
    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: var(--border-radius);
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      transition: var(--transition);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 44px;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
    }

    .btn-secondary {
      background: transparent;
      color: var(--vscode-foreground);
      border: 1px solid var(--vscode-panel-border);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--vscode-sideBar-background);
      border-color: var(--primary-color);
    }

    .btn-text {
      background: transparent;
      color: var(--vscode-descriptionForeground);
      padding: 8px 16px;
      font-size: 0.9rem;
    }

    .btn-text:hover:not(:disabled) {
      color: var(--vscode-foreground);
      text-decoration: underline;
    }

    .btn-large {
      padding: 14px 32px;
      font-size: 1rem;
      min-width: 200px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .onboarding-container {
        padding: 24px 16px;
      }

      .header {
        margin-bottom: 40px;
      }

      .header h1 {
        font-size: 2rem;
      }

      .main-content {
        gap: 40px;
      }

      .steps-list {
        grid-template-columns: 1fr;
      }

      .providers-grid {
        grid-template-columns: 1fr;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }

      .provider-selection-status {
        flex-direction: column;
        align-items: stretch;
      }

      .action-buttons {
        flex-direction: column;
        align-items: center;
      }

      .btn {
        width: 100%;
        max-width: 320px;
      }
    }

    /* Animation */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .content-section {
      animation: fadeIn 0.6s ease-out;
    }

    /* Dark theme specific adjustments */
    body.vscode-dark .provider-tier.paid {
      background: rgba(0, 122, 204, 0.2);
      color: #60a5fa;
    }

    body.vscode-dark .provider-tier.free,
    body.vscode-dark .provider-tier.free-tier {
      background: rgba(40, 167, 69, 0.2);
      color: #4ade80;
    }

    body.vscode-dark .provider-tier.premium {
      background: rgba(255, 193, 7, 0.2);
      color: #fbbf24;
    }

    body.vscode-dark .provider-tier.subscription {
      background: rgba(108, 117, 125, 0.2);
      color: #9ca3af;
    }

    body.vscode-dark .provider-tier.pro {
      background: rgba(220, 53, 69, 0.2);
      color: #f87171;
    }
    </style>
  `;
}
