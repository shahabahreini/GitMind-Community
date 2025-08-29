// src/webview/settings/components/renderers/SubscriptionRenderer.ts
import { BaseRenderer } from "./BaseRenderer";
import { FormUtils } from "../utils/FormUtils";
import { getSubscriptionStyles } from "../../styles/subscription.css";

export class SubscriptionRenderer extends BaseRenderer {
    public render(): string {
        return `
        <style>
            ${getSubscriptionStyles()}
        </style>
        <div class="subscription-container">
            <div class="minimalist-card">
                <div class="card-content">
                    ${this.renderSubscriptionHeader()}
                    <div class="section-divider"></div>
                    ${this.renderSubscriptionPlans()}
                    <div class="section-divider"></div>
                    ${this.renderSubscriptionManagement()}
                    <div class="section-divider"></div>
                    ${this.renderProActivation()}
                </div>
            </div>
        </div>
        
        <script>
            // Note: All subscription button event handlers are now managed by ScriptManager
            // to avoid conflicts with the global event handling system.
            // This includes: subscribeBtn, manageSubscriptionBtn, refreshSubscriptionBtn, activateLicenseBtn, activateOrderBtn
            
            // Handle responses from the extension
            window.addEventListener('message', function(event) {
                const message = event.data;
                
                switch (message.command) {
                    case 'proActivationResult':
                        const activateLicenseBtn = document.getElementById('activateLicenseBtn');
                        const activateOrderBtn = document.getElementById('activateOrderBtn');
                        
                        if (activateLicenseBtn) {
                            activateLicenseBtn.disabled = false;
                            activateLicenseBtn.textContent = 'Activate License';
                        }
                        
                        if (activateOrderBtn) {
                            activateOrderBtn.disabled = false;
                            activateOrderBtn.textContent = 'Activate Order';
                        }
                        
                        if (message.success) {
                            // Don't do immediate UI updates here anymore, wait for updateSettings message
                            alert('Pro activation successful! Pro features are now available.');
                        } else {
                            alert('Activation failed: ' + message.message);
                        }
                        break;
                        
                    case 'licenseValidationResult':
                        const validateLicenseBtn = document.getElementById('validateLicenseBtn');
                        if (validateLicenseBtn) {
                            validateLicenseBtn.disabled = false;
                            validateLicenseBtn.textContent = 'Validate';
                        }
                        
                        alert(message.message);
                        break;
                        
                    case 'proDeactivationResult':
                        const deactivateProBtn = document.getElementById('deactivateProBtn');
                        if (deactivateProBtn) {
                            deactivateProBtn.disabled = false;
                            deactivateProBtn.textContent = 'Deactivate';
                        }
                        
                        // Handle LemonSqueezy API response or internal deactivation
                        if (message.apiResponse) {
                            const response = message.apiResponse;
                            
                            if (response.deactivated === true) {
                                // Successfully deactivated with API - trigger VS Code modal
                                vscode.postMessage({
                                    command: 'showDeactivationModal',
                                    apiResponse: response
                                });
                                
                                // Refresh UI after successful deactivation
                                vscode.postMessage({
                                    command: 'refreshSettings',
                                    refreshUI: true,
                                    forceReload: true
                                });
                            } else {
                                // API deactivation failed
                                let errorMsg = 'Failed to deactivate GitMind Pro through the LemonSqueezy API.\n';
                                
                                if (response.error) {
                                    errorMsg += '\nError: ' + response.error;
                                }
                                
                                alert(errorMsg);
                            }
                        } else {
                            // Local deactivation only (no API response) - show simple success
                            vscode.postMessage({
                                command: 'showSimpleMessage',
                                message: message.message || 'GitMind Pro has been deactivated locally. Your license activation status may not be updated on the LemonSqueezy servers.',
                                type: 'info'
                            });
                        }
                        break;
                }
            });
        </script>
    `;
    }

    private renderSubscriptionHeader(): string {
        const hasValidLicense = this.hasValidLicense();
        const hasEmail = this.hasSubscriptionEmail();

        return `
            <div class="subscription-header">
                <div class="subscription-title">
                    <h2>GitMind Pro Subscription</h2>
                    ${hasValidLicense ? '<div class="status-badge status-pro">PRO ACTIVE</div>' : ''}
                </div>
                <div class="subscription-description">
                    Unlock advanced features including encryption, large diff handling, custom commit styles, and more.
                </div>
                ${this.renderSubscriptionStatus()}
            </div>
        `;
    }

    private renderSubscriptionStatus(): string {
        const hasValidLicense = this.hasValidLicense();
        const hasEmail = this.hasSubscriptionEmail();
        const email = this.settings.subscription?.email || '';

        if (hasValidLicense) {
            const lastValidation = this.settings.pro?.lastValidation;
            const lastValidationText = lastValidation ?
                `Last validated: ${new Date(lastValidation).toLocaleDateString()}` : 'Never validated';

            return `
                <div class="subscription-status-card pro-active">
                    <div class="status-info">
                        <div class="status-icon">✓</div>
                        <div class="status-details">
                            <div class="status-title">GitMind Pro Active</div>
                            <div class="status-subtitle">${lastValidationText}</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (hasEmail) {
            return `
                <div class="subscription-status-card email-configured">
                    <div class="status-info">
                        <div class="status-icon">●</div>
                        <div class="status-details">
                            <div class="status-title">Email Configured: ${email}</div>
                            <div class="status-subtitle">Ready to activate Pro features</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="subscription-status-card not-configured">
                    <div class="status-info">
                        <div class="status-icon">○</div>
                        <div class="status-details">
                            <div class="status-title">Pro Not Active</div>
                            <div class="status-subtitle">Configure email or activate license to get started</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    private renderSubscriptionPlans(): string {
        const hasValidLicense = this.hasValidLicense();

        return `
            <div class="subscription-plans">
                <div class="section-header">
                    <h3 class="section-title">Upgrade to GitMind Pro</h3>
                    <div class="section-description">Choose your plan and unlock advanced features</div>
                </div>
                
                <div class="plans-container">
                    <div class="plan-card ${hasValidLicense ? 'plan-active' : ''}">
                        <div class="plan-header">
                            <h4 class="plan-name">GitMind Pro</h4>
                            <div class="plan-price">One-time purchase</div>
                        </div>
                        <div class="plan-features">
                            <div class="feature-item">✓ Encrypted API Key Storage</div>
                            <div class="feature-item">✓ Large Diff Processing</div>
                            <div class="feature-item">✓ Custom Commit Message Options</div>
                            <div class="feature-item">✓ Commit History Analysis</div>
                            <div class="feature-item">✓ Advanced Commit Styles</div>
                            <div class="feature-item">✓ Priority Support</div>
                        </div>
                        <div class="plan-action">
                            ${FormUtils.createButton('subscribeBtn', hasValidLicense ? 'Already Purchased' : 'Buy GitMind Pro',
            `btn ${hasValidLicense ? 'btn-success' : 'btn-primary'}`,
            hasValidLicense,
            hasValidLicense ? 'You already have GitMind Pro' : 'Purchase a GitMind Pro subscription')}
                        </div>
                    </div>
                </div>
                
                ${!hasValidLicense ? `
                <div class="purchase-info">
                    <p><strong>Note:</strong> GitMind Pro is a one-time purchase that provides lifetime access to all Pro features.</p>
                </div>` : ''}
            </div>
        `;
    }

    private renderSubscriptionManagement(): string {
        const hasEmail = this.hasSubscriptionEmail();
        const email = this.settings.subscription?.email || '';

        return `
            <div class="subscription-management">
                <div class="section-header">
                    <h3 class="section-title">Subscription Management</h3>
                    <div class="section-description">Manage your GitMind Pro subscription and settings</div>
                </div>
                
                <div class="management-card">
                    <div class="email-configuration">
                        <div class="form-group">
                            <label for="subscriptionEmail" class="subscription-email-label">
                                <span>Email Address</span>
                                ${hasEmail ? '<span class="email-verified">✓ Verified</span>' : ''}
                            </label>
                            <input type="email" 
                                   id="subscriptionEmail" 
                                   value="${email}" 
                                   placeholder="your-email@example.com"
                                   class="subscription-email-input ${hasEmail ? 'verified' : ''}"
                                   data-setting="subscription.email" />
                            <div class="description">
                                Enter your email to manage subscription and receive important updates
                            </div>
                        </div>
                        
                        <div class="management-actions">
                            ${FormUtils.createButton('manageSubscriptionBtn', 'Manage Subscription', 'btn btn-secondary', !hasEmail, 'Manage your GitMind Pro subscription')}
                            ${FormUtils.createButton('refreshSubscriptionBtn', 'Refresh Status', 'btn btn-secondary', !hasEmail, 'Refresh your subscription status')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private renderProActivation(): string {
        const hasValidLicense = this.hasValidLicense();

        return `
            <div class="pro-activation">
                <div class="section-header">
                    <h3 class="section-title">Pro Activation</h3>
                    <div class="section-description">Activate your GitMind Pro license or order</div>
                </div>
                
                <div class="activation-cards">
                    ${this.renderLicenseKeyActivationCard()}
                    ${this.renderOrderIdActivationCard()}
                </div>
                
                ${hasValidLicense ? this.renderProStatusActions() : ''}
            </div>
        `;
    }

    private renderLicenseKeyActivationCard(): string {
        const licenseKey = this.settings.pro?.licenseKey || '';
        const validationStatus = this.settings.pro?.validationStatus;
        const hasValidLicense = this.hasValidLicense();

        let displayValue = licenseKey;
        if (hasValidLicense && licenseKey.length > 4) {
            displayValue = '•'.repeat(licenseKey.length - 4) + licenseKey.slice(-4);
        }

        return `
            <div class="activation-card">
                <h4>License Key Activation</h4>
                <p>Activate using your GitMind Pro license key</p>
                <div class="input-group">
                    <input type="text" 
                           id="licenseKeyInput" 
                           placeholder="GITMIND-PRO-XXXX-XXXX-XXXX"
                           value="${displayValue}"
                           class="license-input ${hasValidLicense ? 'activated-input' : ''}" 
                           ${hasValidLicense ? 'disabled' : ''} />
                    ${FormUtils.createButton('activateLicenseBtn', 'Activate', 'btn', hasValidLicense === true, 'Activate your GitMind Pro license key')}
                </div>
                ${licenseKey ? this.renderActivationStatus(validationStatus, 'License') : ''}
            </div>
        `;
    }

    private renderOrderIdActivationCard(): string {
        const orderId = this.settings.pro?.orderId || '';
        const validationStatus = this.settings.pro?.validationStatus;
        const hasValidLicense = this.hasValidLicense();

        let displayValue = orderId;
        if (hasValidLicense && orderId.length > 4) {
            displayValue = '•'.repeat(orderId.length - 4) + orderId.slice(-4);
        }

        return `
            <div class="activation-card">
                <h4>Order ID Activation</h4>
                <p>Activate using your LemonSqueezy order ID</p>
                <div class="input-group">
                    <input type="text" 
                           id="orderIdInput" 
                           placeholder="Order ID from purchase receipt"
                           value="${displayValue}"
                           class="order-input ${hasValidLicense ? 'activated-input' : ''}" 
                           ${hasValidLicense ? 'disabled' : ''} />
                    ${FormUtils.createButton('activateOrderBtn', 'Activate', 'btn', hasValidLicense === true, 'Activate your GitMind Pro with your order ID')}
                </div>
                ${orderId ? this.renderActivationStatus(validationStatus, 'Order') : ''}
            </div>
        `;
    }

    private renderProStatusActions(): string {
        const lastValidation = this.settings.pro?.lastValidation;
        const lastValidationText = lastValidation ?
            `Last validated: ${new Date(lastValidation).toLocaleDateString()}` : 'Never validated';

        return `
            <div class="pro-status-actions">
                <div class="status-badge status-pro">PRO - ${lastValidationText}</div>
                <div class="action-buttons">
                    ${FormUtils.createButton('validateLicenseBtn', 'Validate License', 'btn btn-success', false, 'Validate your current license status')}
                    ${FormUtils.createButton('deactivateProBtn', 'Deactivate Pro', 'btn btn-danger', false, 'Deactivate GitMind Pro from this device')}
                </div>
            </div>
        `;
    }

    private renderActivationStatus(status: string | undefined, type: string): string {
        const isValid = status === 'valid';
        const statusClass = isValid ? 'status-active' : 'status-invalid';
        const statusText = isValid ? 'Active' : 'Invalid/Expired';

        return `
            <div class="status-badge ${statusClass}">
                ● ${type} ${statusText}
            </div>
        `;
    }
}
