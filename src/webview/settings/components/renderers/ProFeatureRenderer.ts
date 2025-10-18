// src/webview/settings/components/renderers/ProFeatureRenderer.ts
import { BaseRenderer } from "./BaseRenderer";
import { FormUtils } from "../utils/FormUtils";
import { proFeaturesModernCSS } from "../../styles/pro-features-modern";

export class ProFeatureRenderer extends BaseRenderer {
    public render(): string {
        return `
        <style>
            ${proFeaturesModernCSS}
        </style>
        <div class="pro-feature-container">
            <div class="minimalist-card">
                <div class="card-content">
                    ${this.renderSecurityAndLargeDiffSection()}
                    <div class="section-divider"></div>
                    ${this.renderCommitMessageOptionsSection()}
                </div>
            </div>
        </div>
        
        <script>
            // Note: All Pro button event handlers are now managed by ScriptManager
            // to avoid conflicts with the global event handling system.
            // This includes: activateLicenseBtn, activateOrderBtn, validateLicenseBtn, deactivateProBtn
            
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
                        
                    case 'commitHistoryAnalysisResult':
                        // Reset global flag
                        if (typeof window.commitHistoryAnalysisInProgress !== 'undefined') {
                            window.commitHistoryAnalysisInProgress = false;
                        }

                        // Use the same setButtonLoadingState function for consistency
                        if (typeof setButtonLoadingState === 'function') {
                            setButtonLoadingState('analyzeCommitHistoryBtn', false, '', 'Analyze Commit History');
                        } else {
                            // Fallback if setButtonLoadingState is not available
                            const analyzeBtn = document.getElementById('analyzeCommitHistoryBtn');
                            if (analyzeBtn) {
                                analyzeBtn.disabled = false;
                                analyzeBtn.innerHTML = 'Analyze Commit History';
                                analyzeBtn.classList.remove('loading');
                            }
                        }

                        if (message.success) {
                            if (typeof showToast === 'function') {
                                showToast('Commit history analysis completed successfully!', 'success');
                            }
                        } else {
                            if (typeof showToast === 'function') {
                                showToast('Commit history analysis failed: ' + (message.error || 'Unknown error'), 'error');
                            }
                        }
                        break;

                    case 'changelogGenerationResult':
                        // Reset global flag
                        if (typeof window.changelogGenerationInProgress !== 'undefined') {
                            window.changelogGenerationInProgress = false;
                        }

                        // Use the same setButtonLoadingState function for consistency
                        if (typeof setButtonLoadingState === 'function') {
                            setButtonLoadingState('generateChangelogBtn', false, '', 'Generate Changelog');
                        } else {
                            // Fallback if setButtonLoadingState is not available
                            const changelogBtn = document.getElementById('generateChangelogBtn');
                            if (changelogBtn) {
                                changelogBtn.disabled = false;
                                changelogBtn.innerHTML = 'Generate Changelog';
                                changelogBtn.classList.remove('loading');
                            }
                        }

                        if (message.success) {
                            if (typeof showToast === 'function') {
                                showToast('Changelog generated successfully!', 'success');
                            }
                        } else {
                            if (typeof showToast === 'function') {
                                showToast('Changelog generation failed: ' + (message.error || 'Unknown error'), 'error');
                            }
                        }
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

    private renderSecurityAndLargeDiffSection(): string {
        return `
            <div class="two-column-layout">
                ${this.renderEncryptionSection()}
                ${this.renderLargeDiffHandlingSection()}
            </div>
        `;
    }

    private renderEncryptionSection(): string {
        const encryptionAvailable = this.isEncryptionAvailable();
        const encryptionEnabled = this.settings.pro?.encryptionEnabled ?? false;
        const tooltip = this.getEncryptionTooltip(encryptionAvailable);

        return `
            <div class="modern-section">
                <div class="section-header">
                    <h3 class="section-title">Security Features</h3>
                </div>
                <div class="setting-row" data-tooltip="${tooltip}">
                    <div class="setting-info">
                        <div class="setting-label">Encrypted API Key Storage</div>
                        <div class="setting-desc">Securely encrypt and store your API keys using VS Code's built-in SecretStorage</div>
                    </div>
                    <div class="setting-control">
                        <div class="switch-container ${!encryptionAvailable ? 'disabled' : ''}">
                            <input class="switch-input" type="checkbox" 
                                id="encryptionEnabled" 
                                ${encryptionEnabled ? "checked" : ""} 
                                ${!encryptionAvailable ? "disabled" : ""}
                                data-setting="pro.encryptionEnabled" />
                            <div class="switch-button">
                                <div class="switch-slider"></div>
                            </div>
                        </div>
                    </div>
                </div>
                ${encryptionAvailable ? `
                <div class="section-actions">
                    ${FormUtils.createButton('checkEncryptionStatus', 'Check Status', 'btn btn-secondary', false, 'Verify the current status of encryption features')}
                </div>` : ''}
            </div>
        `;
    }

    private renderCommitMessageOptionsSection(): string {
        const commitBodyOptions = this.settings.pro?.commitBodyOptions || { enabled: false, maxLines: 5 };
        const commitLengthOptions = this.settings.pro?.commitLengthOptions || { enabled: false, maxLength: 72 };
        const learnFromCommitHistory = this.settings.pro?.learnFromCommitHistory || { enabled: true, maxCommits: 50, includeAuthorInfo: true };
        const hasValidLicense = (this.settings.pro?.licenseKey || this.settings.pro?.orderId) && this.settings.pro?.validationStatus === 'valid';
        const disabledState = !hasValidLicense;
        const proRequiredMessage = !hasValidLicense ? '(Pro feature)' : '';

        return `
        <div class="modern-section">
            <div class="section-header">
                <h3 class="section-title">Commit Message Options ${proRequiredMessage}</h3>
                <div class="section-description">Control commit message formatting for consistency</div>
            </div>
            
            <div class="commit-options-row">
                <div class="compact-setting toggle-setting">
                    <div class="setting-info">
                        <div class="setting-label">Custom Body Line Limit</div>
                    </div>
                    <div class="switch-container ${disabledState ? 'disabled' : ''}">
                        <input class="switch-input" type="checkbox" id="commitBodyOptionsEnabled" 
                            ${commitBodyOptions.enabled ? 'checked' : ''} 
                            ${disabledState ? 'disabled' : ''} 
                            data-setting="pro.commitBodyOptions.enabled" />
                        <div class="switch-button">
                            <div class="switch-slider"></div>
                        </div>
                    </div>
                </div>
                
                <div class="compact-setting input-setting">
                    <span>Maximum Body Lines</span>
                    <input type="number" id="commitBodyOptionsMaxLines" 
                        class="input-field" 
                        value="${commitBodyOptions.maxLines}" 
                        min="3" max="15" step="1"
                        ${disabledState ? 'disabled' : ''} 
                        data-setting="pro.commitBodyOptions.maxLines" />
                </div>
            </div>
            
            <div class="commit-options-row">
                <div class="compact-setting toggle-setting">
                    <div class="setting-info">
                        <div class="setting-label">Custom Summary Length</div>
                    </div>
                    <div class="switch-container ${disabledState ? 'disabled' : ''}">
                        <input class="switch-input" type="checkbox" id="commitLengthOptionsEnabled" 
                            ${commitLengthOptions.enabled ? 'checked' : ''} 
                            ${disabledState ? 'disabled' : ''} 
                            data-setting="pro.commitLengthOptions.enabled" />
                        <div class="switch-button">
                            <div class="switch-slider"></div>
                        </div>
                    </div>
                </div>
                
                <div class="compact-setting input-setting">
                    <span>Maximum Summary Length</span>
                    <input type="number" id="commitLengthOptionsMaxLength" 
                        class="input-field" 
                        value="${commitLengthOptions.maxLength}" 
                        min="50" max="120" step="1"
                        ${disabledState ? 'disabled' : ''} 
                        data-setting="pro.commitLengthOptions.maxLength" />
                </div>
            </div>
        
        <div class="section-divider"></div>
        
        <div class="section-header">
            <h4 class="subsection-title">Learn from Commit History ${proRequiredMessage}</h4>
            <div class="section-description">Analyze your commit message style and get AI-powered insights</div>
        </div>
        
        <div class="commit-options-row">
            <div class="compact-setting input-setting">
                <span>Maximum Commits to Analyze</span>
                <input type="number" id="learnFromCommitHistoryMaxCommits" 
                    class="input-field" 
                    value="${learnFromCommitHistory.maxCommits}" 
                    min="10" max="200" step="10"
                    ${disabledState ? 'disabled' : ''} 
                    data-setting="pro.learnFromCommitHistory.maxCommits" />
            </div>
        </div>
        
        <div class="commit-options-row">
            <div class="compact-setting toggle-setting">
                <div class="setting-info">
                    <div class="setting-label">Include Author Information</div>
                </div>
                <div class="switch-container ${disabledState ? 'disabled' : ''}">
                    <input class="switch-input" type="checkbox" id="learnFromCommitHistoryIncludeAuthorInfo" 
                        ${learnFromCommitHistory.includeAuthorInfo ? 'checked' : ''} 
                        ${disabledState ? 'disabled' : ''} 
                        data-setting="pro.learnFromCommitHistory.includeAuthorInfo" />
                    <div class="switch-button">
                        <div class="switch-slider"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="commit-options-row action-row">
            <button class="action-button secondary" id="previewCommitHistoryBtn" ${disabledState ? 'disabled' : ''}>
                Preview Stats
            </button>
            <button class="action-button primary" id="analyzeCommitHistoryBtn" ${disabledState ? 'disabled' : ''}>
                Analyze Commit History
            </button>
        </div>
        <div class="button-description">Preview shows token count, commit stats, and data quality warnings</div>

        <div class="section-divider"></div>

        ${this.renderChangelogGenerationSection()}

        ${!hasValidLicense ? `
        <div class="pro-upsell">
            <p>Upgrade to GitMind Pro to enable custom commit message options.</p>
            <button class="action-button primary" id="upgradeBtn1">Upgrade to Pro</button>
        </div>` : ''}
    </div>
    `;
    }

    private renderChangelogGenerationSection(): string {
        const changelogConfig = this.settings.pro?.changelog || { enabled: true, maxCommits: 100, groupByVersion: true };
        const hasValidLicense = (this.settings.pro?.licenseKey || this.settings.pro?.orderId) && this.settings.pro?.validationStatus === 'valid';
        const disabledState = !hasValidLicense;
        const proRequiredMessage = !hasValidLicense ? '(Pro feature)' : '';

        return `
        <div class="section-header">
            <h4 class="subsection-title">Changelog Generation ${proRequiredMessage}</h4>
            <div class="section-description">Generate professional CHANGELOG.md from your git history using AI</div>
        </div>

        <div class="commit-options-row">
            <div class="compact-setting input-setting">
                <span>Maximum Commits to Analyze</span>
                <input type="number" id="changelogMaxCommits"
                    class="input-field"
                    value="${changelogConfig.maxCommits}"
                    min="10" max="500" step="10"
                    ${disabledState ? 'disabled' : ''}
                    data-setting="pro.changelog.maxCommits" />
            </div>
        </div>

        <div class="commit-options-row">
            <div class="compact-setting toggle-setting">
                <div class="setting-info">
                    <div class="setting-label">Group by Version Tags</div>
                </div>
                <div class="switch-container ${disabledState ? 'disabled' : ''}">
                    <input class="switch-input" type="checkbox" id="changelogGroupByVersion"
                        ${changelogConfig.groupByVersion ? 'checked' : ''}
                        ${disabledState ? 'disabled' : ''}
                        data-setting="pro.changelog.groupByVersion" />
                    <div class="switch-button">
                        <div class="switch-slider"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="commit-options-row action-row">
            <button class="action-button secondary" id="previewChangelogBtn" ${disabledState ? 'disabled' : ''}>
                Preview Stats
            </button>
            <button class="action-button primary" id="generateChangelogBtn" ${disabledState ? 'disabled' : ''}>
                Generate Changelog
            </button>
        </div>
        <div class="button-description">Preview shows token count, commit stats, and data quality warnings</div>
        `;
    }

    private renderLargeDiffHandlingSection(): string {
        const largeDiffHandling = this.settings.pro?.largeDiffHandling || { enabled: false, chunkSize: 1000, maxChunks: 5 };
        const hasValidLicense = (this.settings.pro?.licenseKey || this.settings.pro?.orderId) && this.settings.pro?.validationStatus === 'valid';
        const disabledState = !hasValidLicense;
        const proRequiredMessage = !hasValidLicense ? '(Pro feature)' : '';

        return `
            <div class="modern-section">
                <div class="section-header">
                    <h3 class="section-title">Large Diff Handling ${proRequiredMessage}</h3>
                </div>
                <div class="setting-row">
                    <div class="setting-info">
                        <div class="setting-label">Enable Large Diff Processing</div>
                        <div class="setting-desc">Break large diffs into smaller chunks and intelligently combine results</div>
                    </div>
                    <div class="setting-control">
                        <div class="switch-container ${disabledState ? 'disabled' : ''}">
                            <input class="switch-input" type="checkbox" id="largeDiffEnabled" 
                                ${largeDiffHandling.enabled ? 'checked' : ''} 
                                ${disabledState ? 'disabled' : ''} 
                                data-setting="pro.largeDiffHandling.enabled" />
                            <div class="switch-button">
                                <div class="switch-slider"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="compact-settings">
                    <div class="compact-setting">
                        <span>Chunk Size (lines)</span>
                        <input type="number" id="chunkSize" 
                            class="input-field" 
                            value="${largeDiffHandling.chunkSize}" 
                            min="500" max="2000" step="100"
                            ${disabledState ? 'disabled' : ''} 
                            data-setting="pro.largeDiffHandling.chunkSize" />
                    </div>
                    <div class="compact-setting">
                        <span>Max Chunks</span>
                        <input type="number" id="maxChunks" 
                            class="input-field" 
                            value="${largeDiffHandling.maxChunks}" 
                            min="1" max="10" step="1"
                            ${disabledState ? 'disabled' : ''} 
                            data-setting="pro.largeDiffHandling.maxChunks" />
                    </div>
                </div>
                
                ${!hasValidLicense ? `
                <div class="pro-upsell">
                    <p>Upgrade to GitMind Pro to enable large diff processing.</p>
                    <button class="action-button primary" id="upgradeBtn2">Upgrade to Pro</button>
                </div>` : ''}
            </div>
        `;
    }

    private getEncryptionTooltip(encryptionAvailable: boolean): string {
        if (this.isDevModeEnabled()) {
            return encryptionAvailable
                ? "Encrypt and securely store your API keys using VS Code's SecretStorage"
                : "Encryption is available in development mode, but you need to provide a license key first.";
        }

        if (encryptionAvailable) {
            return "Encrypt and securely store your API keys using VS Code's SecretStorage";
        }

        return "Encryption is a Pro feature. Please upgrade to GitMind Pro to enable this feature.";
    }
}