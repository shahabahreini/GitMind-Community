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
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Header Styles */
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px 0;
    }

    .logo {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      border-radius: 12px;
      box-shadow: var(--box-shadow);
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(135deg, var(--primary-color), #00d4ff);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 1.2rem;
      color: var(--vscode-descriptionForeground);
      font-weight: 300;
    }

    /* Progress Bar */
    .progress-container {
      margin-bottom: 40px;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--vscode-progressBar-background, #e0e0e0);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 10px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-color), #00d4ff);
      border-radius: 4px;
      transition: width 0.5s ease;
      width: 25%;
    }

    .progress-text {
      text-align: center;
      font-size: 0.9rem;
      color: var(--vscode-descriptionForeground);
      font-weight: 500;
    }

    /* Steps Container */
    .steps-container {
      flex: 1;
      margin-bottom: 30px;
    }

    .step {
      display: none;
      animation: fadeIn 0.5s ease;
    }

    .step.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .step-icon {
      font-size: 3rem;
      text-align: center;
      margin-bottom: 20px;
    }

    .step h2 {
      font-size: 2rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 16px;
    }

    .step > p {
      text-align: center;
      font-size: 1.1rem;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 30px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .feature {
      text-align: center;
      padding: 20px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: var(--border-radius);
      transition: var(--transition);
    }

    .feature:hover {
      transform: translateY(-2px);
      box-shadow: var(--box-shadow);
    }

    .feature-icon {
      font-size: 2.5rem;
      margin-bottom: 12px;
    }

    .feature h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .feature p {
      font-size: 0.9rem;
      color: var(--vscode-descriptionForeground);
    }

    /* Providers Grid */
    .providers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .provider-card {
      background: var(--vscode-editor-background);
      border: 2px solid var(--vscode-panel-border);
      border-radius: var(--border-radius);
      padding: 20px;
      cursor: pointer;
      transition: var(--transition);
      position: relative;
    }

    .provider-card:hover {
      border-color: var(--primary-color);
      transform: translateY(-2px);
      box-shadow: var(--box-shadow);
    }

    .provider-card.selected {
      border-color: var(--primary-color);
      background: var(--vscode-list-activeSelectionBackground);
      box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.2);
    }

    .provider-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .provider-icon {
      font-size: 1.5rem;
    }

    .provider-header h3 {
      font-size: 1.1rem;
      font-weight: 600;
      flex: 1;
    }

    .provider-badge {
      font-size: 0.75rem;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .provider-badge.free {
      background: #d4edda;
      color: #155724;
    }

    .provider-badge.popular {
      background: #fff3cd;
      color: #856404;
    }

    .provider-badge.smart {
      background: #d1ecf1;
      color: #0c5460;
    }

    .provider-badge.private {
      background: #f8d7da;
      color: #721c24;
    }

    .provider-badge.open {
      background: #e7f3ff;
      color: #004085;
    }

    .provider-badge.integrated {
      background: #e2e3e5;
      color: #383d41;
    }

    .provider-card p {
      color: var(--vscode-descriptionForeground);
      margin-bottom: 12px;
      font-size: 0.9rem;
    }

    .provider-card ul {
      list-style: none;
      padding: 0;
    }

    .provider-card li {
      font-size: 0.85rem;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 4px;
      position: relative;
      padding-left: 16px;
    }

    .provider-card li::before {
      content: "✓";
      color: var(--success-color);
      position: absolute;
      left: 0;
      font-weight: bold;
    }

    /* Provider Selection */
    .provider-selection {
      text-align: center;
      padding: 20px;
      background: var(--vscode-textBlockQuote-background);
      border-left: 4px solid var(--primary-color);
      border-radius: var(--border-radius);
      margin-bottom: 20px;
    }

    .selection-hint {
      font-size: 0.9rem;
      color: var(--vscode-descriptionForeground);
      margin-top: 8px;
    }

    /* Configuration Status */
    .config-status {
      margin-bottom: 30px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: var(--border-radius);
      margin-bottom: 12px;
    }

    .status-icon {
      font-size: 1.5rem;
      width: 40px;
      text-align: center;
    }

    .status-icon.success {
      color: var(--success-color);
    }

    .status-icon.pending {
      color: var(--warning-color);
    }

    .status-icon.error {
      color: var(--danger-color);
    }

    .status-content h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .status-content p {
      font-size: 0.9rem;
      color: var(--vscode-descriptionForeground);
    }

    /* Config Actions */
    .config-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    /* Config Help */
    .config-help {
      background: var(--vscode-textBlockQuote-background);
      border-left: 4px solid var(--primary-color);
      padding: 20px;
      border-radius: var(--border-radius);
    }

    .config-help h3 {
      font-size: 1.1rem;
      margin-bottom: 8px;
    }

    .provider-link {
      display: inline-block;
      margin-top: 12px;
      padding: 8px 16px;
      background: var(--primary-color);
      color: white;
      text-decoration: none;
      border-radius: var(--border-radius);
      font-size: 0.9rem;
      transition: var(--transition);
    }

    .provider-link:hover {
      background: var(--primary-hover);
    }

    /* Demo Section */
    .demo-section {
      margin-bottom: 30px;
    }

    .demo-steps {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .demo-step {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: var(--border-radius);
    }

    .demo-number {
      width: 40px;
      height: 40px;
      background: var(--primary-color);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .demo-content h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .demo-content p {
      font-size: 0.9rem;
      color: var(--vscode-descriptionForeground);
    }

    /* Final Actions */
    .final-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    /* Completion Message */
    .completion-message {
      text-align: center;
      background: var(--vscode-textBlockQuote-background);
      border-left: 4px solid var(--success-color);
      padding: 20px;
      border-radius: var(--border-radius);
    }

    .completion-message h3 {
      color: var(--success-color);
      margin-bottom: 12px;
    }

    /* Navigation */
    .navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      border-top: 1px solid var(--vscode-panel-border);
      margin-top: auto;
      flex-wrap: wrap;
      gap: 12px;
    }

    /* Button Styles */
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: var(--border-radius);
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: var(--transition);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 40px;
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
    }

    .btn-secondary {
      background: var(--secondary-color);
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #5a6268;
    }

    .btn-success {
      background: var(--success-color);
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #218838;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .onboarding-container {
        padding: 16px;
      }

      .header h1 {
        font-size: 2rem;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }

      .providers-grid {
        grid-template-columns: 1fr;
      }

      .demo-step {
        flex-direction: column;
        text-align: center;
      }

      .navigation {
        flex-direction: column;
        gap: 16px;
      }

      .config-actions,
      .final-actions {
        flex-direction: column;
        align-items: center;
      }

      .btn {
        width: 100%;
        justify-content: center;
        max-width: 300px;
      }
    }

    /* Dark theme specific adjustments */
    body.vscode-dark .provider-badge.free {
      background: rgba(40, 167, 69, 0.2);
      color: #4ade80;
    }

    body.vscode-dark .provider-badge.popular {
      background: rgba(255, 193, 7, 0.2);
      color: #fbbf24;
    }

    body.vscode-dark .provider-badge.smart {
      background: rgba(23, 162, 184, 0.2);
      color: #38bdf8;
    }

    body.vscode-dark .provider-badge.private {
      background: rgba(220, 53, 69, 0.2);
      color: #f87171;
    }

    body.vscode-dark .provider-badge.open {
      background: rgba(0, 123, 255, 0.2);
      color: #60a5fa;
    }

    body.vscode-dark .provider-badge.integrated {
      background: rgba(108, 117, 125, 0.2);
      color: #9ca3af;
    }
    </style>
  `;
}
