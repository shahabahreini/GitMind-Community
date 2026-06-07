// src/webview/settings/components/renderers/SubscriptionRenderer.ts
import { BaseRenderer } from "./BaseRenderer";
import { FormUtils } from "../utils/FormUtils";

export class SubscriptionRenderer extends BaseRenderer {
    public render(): string {
        const hasValidLicense = this.hasValidLicense();

        // When the user has NOT activated yet, put activation front-and-center
        // ("Already purchased? Activate here") above the buy/management sections.
        // Once Pro is active, lead with status and keep buy options last.
        const sections = hasValidLicense
            ? [
                this.renderSubscriptionHeader(),
                this.renderProActivation(),
                this.renderSubscriptionManagement(),
                this.renderSubscriptionPlans()
            ]
            : [
                this.renderSubscriptionHeader(),
                this.renderProActivation(),
                this.renderSubscriptionPlans()
            ];

        return `
        <div class="subscription-container">
            <div class="minimalist-card">
                <div class="card-content">
                    ${sections.join('\n<div class="section-divider"></div>\n')}
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
                                let errorMsg = 'Failed to deactivate GitMind Pro through the LemonSqueezy API.\\n';
                                
                                if (response.error) {
                                    errorMsg += '\\nError: ' + response.error;
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
        const licenseKey = this.settings.pro?.licenseKey || '';
        const orderId = this.settings.pro?.orderId || '';
        const email = this.settings.subscription?.email || '';
        const lastValidation = this.settings.pro?.lastValidation;
        
        const lastValidationText = lastValidation ?
            new Date(lastValidation).toLocaleDateString() : 'Never validated';

        if (hasValidLicense) {
            let activeDetailLabel = 'License Key';
            let activeDetailValue = 'Active';
            if (licenseKey) {
                activeDetailLabel = 'License Key';
                activeDetailValue = licenseKey.length > 8 
                    ? 'GITMIND-PRO-••••-••••-' + licenseKey.slice(-4)
                    : licenseKey;
            } else if (orderId) {
                activeDetailLabel = 'Order ID';
                activeDetailValue = orderId.length > 4 
                    ? '••••' + orderId.slice(-4)
                    : orderId;
            }

            return `
                <div class="pro-activation">
                    <div class="activation-card-unified active-status">
                        <div class="active-badge">✓ PRO ACTIVE</div>
                        <div class="activation-status-header">
                            <div class="status-icon-glow">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    <polyline points="9 11 11 13 15 9"></polyline>
                                </svg>
                            </div>
                            <div class="status-info-text">
                                <h3>Your GitMind Pro License is Active</h3>
                                <p class="validation-time">Verified device protection. Last checked: ${lastValidationText}</p>
                            </div>
                        </div>
                        
                        <div class="active-license-details">
                            <div class="detail-row">
                                <span class="detail-label">${activeDetailLabel}</span>
                                <span class="detail-value">${activeDetailValue}</span>
                            </div>
                            ${email ? `
                            <div class="detail-row">
                                <span class="detail-label">Associated Email</span>
                                <span class="detail-value">${email}</span>
                            </div>` : ''}
                        </div>

                        <div class="active-actions-row">
                            <button type="button" class="btn btn-success" id="validateLicenseBtn">Validate License</button>
                            <button type="button" class="btn btn-danger" id="deactivateProBtn">Deactivate Pro</button>
                        </div>

                        <div class="device-management-note">
                            <h5>Device Management Note</h5>
                            <p>Each license can be deactivated directly from the device it is registered on. If a device becomes unavailable and you need to free up a slot, please <a href="https://github.com/shahabahreini/Gitmind-Pro/issues" target="_blank">raise a support ticket</a>.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="pro-activation">
                <div class="activation-card-unified">
                    <div class="activation-header">
                        <div class="activation-badge">GITMIND PRO ACTIVATION</div>
                        <h3>Unlock GitMind Pro Features</h3>
                        <p class="activation-sub">Choose your activation method below to get started immediately.</p>
                    </div>
                    
                    <div class="activation-tabs-nav">
                        <button type="button" class="activation-tab-btn active" data-tab-target="license-tab">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; display: inline-block; vertical-align: middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            License Key
                        </button>
                        <button type="button" class="activation-tab-btn" data-tab-target="order-tab">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; display: inline-block; vertical-align: middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            Order ID
                        </button>
                    </div>

                    <div class="activation-tab-content active" id="license-tab">
                        <p class="tab-instruction">Enter the license key received in your purchase receipt email (starts with <code>GITMIND-PRO-</code>).</p>
                        <div class="activation-form-row">
                            <div class="input-container">
                                <input type="text" 
                                       id="licenseKeyInput" 
                                       placeholder="GITMIND-PRO-XXXX-XXXX-XXXX"
                                       class="license-input-field" />
                            </div>
                            <button type="button" class="btn btn-primary action-btn" id="activateLicenseBtn">Activate License</button>
                        </div>
                    </div>

                    <div class="activation-tab-content" id="order-tab" style="display: none;">
                        <p class="tab-instruction">Enter your LemonSqueezy Order ID and purchase Email Address to activate your device.</p>
                        <div class="activation-form-grid">
                            <div class="input-container">
                                <label for="orderIdInput">Order ID</label>
                                <input type="text" 
                                       id="orderIdInput" 
                                       placeholder="e.g. 1234567"
                                       class="order-input-field" />
                            </div>
                            <div class="input-container">
                                <label for="subscriptionEmail">Email Address</label>
                                <input type="email" 
                                       id="subscriptionEmail" 
                                       value="${email}"
                                       placeholder="e.g. name@example.com"
                                       class="email-input-field"
                                       data-setting="subscription.email" />
                            </div>
                        </div>
                        <button type="button" class="btn btn-primary action-btn full-width" id="activateOrderBtn">Activate Order</button>
                    </div>
                </div>
            </div>

            <script>
                (function() {
                    const tabs = document.querySelectorAll('.activation-tab-btn');
                    tabs.forEach(tab => {
                        tab.addEventListener('click', () => {
                            tabs.forEach(t => t.classList.remove('active'));
                            tab.classList.add('active');
                            
                            const target = tab.getAttribute('data-tab-target');
                            document.querySelectorAll('.activation-tab-content').forEach(content => {
                                if (content.id === target) {
                                    content.style.display = 'block';
                                    content.classList.add('active');
                                } else {
                                    content.style.display = 'none';
                                    content.classList.remove('active');
                                }
                            });
                        });
                    });
                })();
            </script>
        `;
    }
}
