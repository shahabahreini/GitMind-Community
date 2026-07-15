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
            // This includes the purchase, license activation, validation, and deactivation controls.
            // The account-email controls in the top panel are wired here because their
            // IDs are unique to this tab and they do not exist in the global handler map.

            (function () {
                const editRow = document.getElementById('subscriptionEmailEditRow');
                const input = document.getElementById('subscriptionEmail');
                const saveBtn = document.getElementById('saveSubscriptionEmailBtn');
                if (!editRow || !input || !saveBtn) { return; }

                // Present only when an email is already registered (label mode).
                const changeBtn = document.getElementById('changeSubscriptionEmailBtn');
                const displayRow = document.getElementById('accountEmailDisplayRow');
                const valueEl = document.getElementById('subscriptionEmailValue');
                const hint = document.getElementById('subscriptionEmailHint');
                const registeredEmail = valueEl ? valueEl.textContent.trim() : '';

                if (changeBtn) {
                    changeBtn.addEventListener('click', function () {
                        const open = editRow.style.display !== 'none';
                        editRow.style.display = open ? 'none' : 'flex';
                        if (displayRow) { displayRow.style.display = open ? 'flex' : 'none'; }
                        if (hint) { hint.style.display = open ? 'none' : 'block'; }
                        if (!open) { input.focus(); }
                    });
                }

                document.getElementById('cancelSubscriptionEmailBtn')?.addEventListener('click', function () {
                    input.value = registeredEmail;
                    editRow.style.display = 'none';
                    if (displayRow) { displayRow.style.display = 'flex'; }
                    if (hint) { hint.style.display = 'none'; }
                });

                saveBtn.addEventListener('click', function () {
                    const email = input.value.trim();
                    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
                        alert('Enter a valid email address.');
                        return;
                    }
                    if (registeredEmail && email === registeredEmail) {
                        // Nothing changed — just close the editor.
                        editRow.style.display = 'none';
                        if (displayRow) { displayRow.style.display = 'flex'; }
                        if (hint) { hint.style.display = 'none'; }
                        return;
                    }
                    if (registeredEmail && !confirm(
                        'Change the account email from ' + registeredEmail + ' to ' + email + '?\\n\\n' +
                        'This resets the stored subscription state in this editor. An activated ' +
                        'license stays on this machine and is re-checked afterwards.'
                    )) {
                        return;
                    }
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Saving…';
                    vscode.postMessage({ command: 'changeSubscriptionEmail', email: email });
                });

                window.addEventListener('message', function (event) {
                    const message = event.data;
                    if (message.command !== 'emailChangeResult') { return; }
                    saveBtn.disabled = false;
                    saveBtn.textContent = registeredEmail ? 'Save' : 'Register';
                    if (!message.success) {
                        alert('Could not save the email: ' + (message.error || 'unknown error'));
                        return;
                    }
                    // The backend re-sends full settings (refreshUI) which re-renders this
                    // tab in label mode; updating in place covers the gap until then.
                    if (valueEl) { valueEl.textContent = message.email; }
                    editRow.style.display = 'none';
                    if (displayRow) { displayRow.style.display = 'flex'; }
                    if (hint) { hint.style.display = 'none'; }
                });
            })();

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
                            validateLicenseBtn.classList.remove('loading');
                            validateLicenseBtn.textContent = 'Validate License';
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
                                let errorMsg = 'Failed to deactivate GitMind Pro on the license server.\\n';

                                if (response.error) {
                                    errorMsg += '\\nError: ' + response.error;
                                }

                                alert(errorMsg);
                            }
                        } else {
                            // Local deactivation only (no API response) - show simple success
                            vscode.postMessage({
                                command: 'showSimpleMessage',
                                message: message.message || 'GitMind Pro has been deactivated locally. This device may still show as active in your account portal until it syncs.',
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
                ${this.renderAccountEmailSection()}
            </div>
        `;
    }

    /**
     * The account email lives in the top panel because purchase, migration, and key
     * delivery all revolve around it. Once registered it renders as a plain label —
     * changing it is deliberately behind a "Change" click plus a confirm, because a
     * change resets the locally stored subscription state.
     *
     * The input keeps the id "subscriptionEmail" in BOTH modes (hidden while the
     * label is shown): the Buy button's handler reads that field, and it previously
     * dead-ended with "enter your email" when no such field existed anywhere.
     */
    private renderAccountEmailSection(): string {
        const email = this.settings.subscription?.email || '';
        const safeEmail = FormUtils.escapeHtml(email);

        if (email) {
            return `
                <div class="account-email-section">
                    <div class="account-email-row" id="accountEmailDisplayRow">
                        <span class="detail-label">Account Email</span>
                        <span class="detail-value" id="subscriptionEmailValue">${safeEmail}</span>
                        <button type="button" class="btn btn-secondary btn-small" id="changeSubscriptionEmailBtn"
                                title="Change the email associated with your GitMind Pro account">Change</button>
                    </div>
                    <div class="account-email-row" id="subscriptionEmailEditRow" style="display: none;">
                        <input type="email"
                               id="subscriptionEmail"
                               class="license-input-field"
                               placeholder="you@example.com"
                               value="${safeEmail}" />
                        <button type="button" class="btn btn-primary btn-small" id="saveSubscriptionEmailBtn">Save</button>
                        <button type="button" class="btn btn-secondary btn-small" id="cancelSubscriptionEmailBtn">Cancel</button>
                    </div>
                    <p class="email-hint" id="subscriptionEmailHint" style="display: none;">
                        Changing the account email resets the stored subscription state in this editor.
                        An activated license stays on this machine and is re-checked against the new address.
                    </p>
                </div>
            `;
        }

        return `
            <div class="account-email-section">
                <div class="account-email-row" id="subscriptionEmailEditRow">
                    <span class="detail-label">Account Email</span>
                    <input type="email"
                           id="subscriptionEmail"
                           class="license-input-field"
                           placeholder="you@example.com" />
                    <button type="button" class="btn btn-primary btn-small" id="saveSubscriptionEmailBtn">Register</button>
                </div>
                <p class="email-hint">
                    Register the email for your GitMind Pro purchase — license keys and account
                    details are delivered there. Required before buying from inside VS Code.
                </p>
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
        } else if (hasEmail && this.settings.subscription?.status === 'active') {
            return `
                <div class="subscription-status-card email-configured">
                    <div class="status-info">
                        <div class="status-icon">●</div>
                        <div class="status-details">
                            <div class="status-title">Legacy Pro Access Active</div>
                            <div class="status-subtitle">Enter your license key to migrate this activation.</div>
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
                            <div class="status-subtitle">Enter a license key to get started</div>
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
                                <span class="detail-label">Account Email</span>
                                <span class="detail-value">${FormUtils.escapeHtml(email)}</span>
                            </div>` : ''}
                        </div>

                        <div class="active-actions-row">
                            <button type="button" class="btn btn-success" id="validateLicenseBtn">Validate License</button>
                            <button type="button" class="btn btn-danger" id="deactivateProBtn">Deactivate Pro</button>
                        </div>

                        <div class="device-management-note">
                            <h5>Device Management Note</h5>
                            <p>Rename, remove, or reactivate any of your devices from your <a href="https://gitmind-pro.com/portal" target="_blank">account portal</a> — including machines you no longer have access to.</p>
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
                    
                    <div class="activation-tab-content active" id="license-tab">
                        <p class="tab-instruction">Enter the license key received in your purchase receipt email (starts with <code>GITMIND-PRO-</code>).</p>
                        <div class="activation-form-row">
                            <div class="input-container">
                                <input type="text"
                                       id="licenseKeyInput"
                                       placeholder="GITMIND-PRO-XXXX-XXXX-XXXX"
                                       class="license-input-field" />
                            </div>
                            <button type="button" class="btn btn-secondary action-btn" id="activateLicenseBtn">Activate License</button>
                            <button type="button" class="btn action-btn buy-pro-btn js-buy-pro" title="Purchase a GitMind Pro license">Buy GitMind Pro</button>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }
}
