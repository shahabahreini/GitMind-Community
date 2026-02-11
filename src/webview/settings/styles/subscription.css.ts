// src/webview/settings/styles/subscription.css.ts
export function getSubscriptionStyles(): string {
    return `
    /* Subscription Tab Styles */
    .subscription-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .subscription-header {
        text-align: center;
        margin-bottom: 1rem;
    }
    
    .subscription-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
    }
    
    .subscription-title h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--vscode-foreground);
    }
    
    .subscription-description {
        color: var(--vscode-descriptionForeground);
        font-size: 0.9rem;
        line-height: 1.4;
        margin-bottom: 1rem;
    }
    
    .subscription-status-card {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        border-radius: 6px;
        margin-top: 1rem;
        border: 1px solid rgba(128, 128, 128, 0.12);
        background: var(--vscode-editor-background);
    }

    .subscription-status-card.pro-active {
        background: var(--vscode-inputValidation-infoBackground);
    }

    .subscription-status-card.email-configured {
        background: var(--vscode-inputValidation-infoBackground);
    }

    .subscription-status-card.not-configured {
        background: var(--vscode-editor-background);
    }
    
    .status-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .status-icon {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .pro-active .status-icon {
        color: var(--vscode-testing-iconPassed);
    }

    .email-configured .status-icon {
        color: var(--vscode-symbolIcon-colorForeground);
    }

    .not-configured .status-icon {
        color: var(--vscode-descriptionForeground);
    }
    
    .status-details {
        flex: 1;
    }
    
    .status-title {
        font-weight: 500;
        color: var(--vscode-foreground);
        margin-bottom: 0.2rem;
    }
    
    .status-subtitle {
        font-size: 0.85rem;
        color: var(--vscode-descriptionForeground);
    }
    
    /* Plans Section */
    .subscription-plans {
        margin: 1.5rem 0;
    }
    
    .plans-container {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .plan-card {
        flex: 1;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        padding: 1.5rem;
        background: var(--vscode-editor-background);
        transition: all 0.2s ease;
    }
    
    .plan-card:hover {
        border-color: var(--vscode-focusBorder);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .plan-card.plan-active {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.05);
    }
    
    .plan-header {
        text-align: center;
        margin-bottom: 1.5rem;
    }
    
    .plan-name {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: var(--vscode-foreground);
    }
    
    .plan-price {
        font-size: 0.9rem;
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
    }
    
    .plan-features {
        margin-bottom: 1.5rem;
    }
    
    .feature-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0;
        font-size: 0.9rem;
        color: var(--vscode-foreground);
    }
    
    .feature-item::before {
        content: '';
        display: inline-block;
        width: 4px;
        height: 4px;
        background: #10b981;
        border-radius: 50%;
        margin-right: 0.5rem;
    }
    
    .plan-action {
        text-align: center;
    }
    
    .purchase-info {
        margin-top: 1rem;
        padding: 0.75rem;
        background: var(--vscode-textBlockQuote-background);
        border-left: 3px solid var(--vscode-focusBorder);
        border-radius: 3px;
    }
    
    .purchase-info p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--vscode-foreground);
    }
    
    /* Management Section */
    .subscription-management {
        margin: 1.5rem 0;
    }
    
    .management-card {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        padding: 1rem;
        background: var(--vscode-editor-background);
    }
    
    .email-configuration {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .subscription-email-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        margin-bottom: 0.3rem;
        color: var(--vscode-foreground);
    }
    
    .email-verified {
        color: #10b981;
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    .subscription-email-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-size: 0.9rem;
        font-family: var(--vscode-font-family);
        transition: all 0.15s ease;
        box-sizing: border-box;
    }
    
    .subscription-email-input:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }
    
    .subscription-email-input.verified {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.05);
    }
    
    .management-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .description {
        font-size: 0.8rem;
        color: var(--vscode-descriptionForeground);
        margin-top: 0.3rem;
        line-height: 1.3;
    }
    
    /* Activation Section */
    .pro-activation {
        margin: 1.5rem 0;
    }
    
    .activation-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .activation-card {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        padding: 1rem;
        background: var(--vscode-editor-background);
    }
    
    .activation-card h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--vscode-foreground);
    }
    
    .activation-card p {
        margin: 0 0 1rem 0;
        font-size: 0.85rem;
        color: var(--vscode-descriptionForeground);
    }
    
    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .license-input, .order-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-size: 0.9rem;
        font-family: var(--vscode-font-family);
        transition: all 0.15s ease;
        box-sizing: border-box;
    }
    
    .license-input:focus, .order-input:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }
    
    .license-input.activated-input, .order-input.activated-input {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.05);
    }
    
    .pro-status-actions {
        margin-top: 1.5rem;
        padding: 1rem;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        background: var(--vscode-editor-background);
    }
    
    .action-buttons {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.75rem;
        flex-wrap: wrap;
    }
    
    .device-management-info {
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        border: 1px solid var(--vscode-editorInfo-foreground, rgba(75, 156, 211, 0.4));
        border-radius: 6px;
        background: var(--vscode-textBlockQuote-background, rgba(75, 156, 211, 0.08));
        font-size: 0.8rem;
        line-height: 1.5;
        color: var(--vscode-foreground);
    }
    
    .device-management-info p {
        margin: 0 0 0.4rem 0;
    }
    
    .device-management-info p:last-child {
        margin-bottom: 0;
    }
    
    .device-management-info a {
        color: var(--vscode-textLink-foreground);
        text-decoration: underline;
    }
    
    .device-management-info a:hover {
        color: var(--vscode-textLink-activeForeground);
    }

    /* Status Badges */
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3rem 0.6rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .status-badge.status-pro {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    .status-badge.status-active {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    .status-badge.status-invalid {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    /* Section Headers */
    .section-header {
        margin-bottom: 1rem;
    }
    
    .section-title {
        margin: 0 0 0.3rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--vscode-foreground);
    }
    
    .section-description {
        margin: 0;
        font-size: 0.85rem;
        color: var(--vscode-descriptionForeground);
        line-height: 1.4;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
        .activation-cards {
            grid-template-columns: 1fr;
        }
        
        .plans-container {
            flex-direction: column;
        }
        
        .action-buttons {
            flex-direction: column;
        }
        
        .management-actions {
            flex-direction: column;
        }
    }
    
    /* Legacy styles for backward compatibility */
    .subscription-section {
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--vscode-panel-border);
    }
    
    .subscription-section h4, .subscription-section h3 {
        margin: 0 0 0.6rem 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--vscode-foreground);
    }
    
    .subscription-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 0.3rem;
    }
    
    .subscription-status {
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 0.6rem;
        margin-top: 0.5rem;
    }
    
    .pro-override-note {
        font-size: 0.75rem;
        color: #10b981;
        font-weight: 500;
        margin-top: 0.4rem;
        padding: 0.3rem 0.5rem;
        background: rgba(16, 185, 129, 0.1);
        border-radius: 3px;
        display: flex;
        align-items: center;
        gap: 0.3rem;
        border: 1px solid rgba(16, 185, 129, 0.2);
    }
    
    .upgrade-prompt {
        margin-top: 0.75rem;
        padding: 0.6rem;
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border: 1px solid #93c5fd;
        border-radius: 3px;
    }
    
    .upgrade-content {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.85rem;
    }
    
    .upgrade-text {
        flex: 1;
        color: var(--vscode-foreground);
        font-weight: 500;
        line-height: 1.3;
    }
    
    .upgrade-button {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.4rem 0.6rem;
        border-radius: 3px;
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.15s ease;
        text-decoration: none;
        white-space: nowrap;
    }
    
    .upgrade-button:hover {
        background: #2563eb;
        transform: translateY(-1px);
    }
    `;
}
