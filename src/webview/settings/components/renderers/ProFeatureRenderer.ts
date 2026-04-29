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
                    ${this.renderAdvancedModelConfigurationSection()}
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
                        console.log('[ProFeatureRenderer] Received commitHistoryAnalysisResult:', message);
                        
                        // Reset global flag
                        if (typeof window.commitHistoryAnalysisInProgress !== 'undefined') {
                            window.commitHistoryAnalysisInProgress = false;
                        }

                        // Always reset button state, regardless of which method works
                        const analyzeBtn = document.getElementById('analyzeCommitHistoryBtn');
                        if (analyzeBtn) {
                            analyzeBtn.disabled = false;
                            analyzeBtn.textContent = 'Analyze Commit History';
                            analyzeBtn.classList.remove('loading');
                            console.log('[ProFeatureRenderer] Button state reset successfully');
                        } else {
                            console.error('[ProFeatureRenderer] Could not find analyzeCommitHistoryBtn');
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

    private renderSecurityAndLargeDiffSection(): string {
        return `
            <div class="two-column-layout">
                ${this.renderEncryptionSection()}
                ${this.renderLargeDiffHandlingSection()}
            </div>
        `;
    }

    private renderAdvancedModelConfigurationSection(): string {
        const advancedModelConfig = this.settings.pro?.advancedModelConfig ?? {
            mode: 'auto',
            temperatureEnabled: false,
            temperature: 0.2,
            topPEnabled: false,
            topP: 0.9,
            topKEnabled: false,
            topK: 40,
            maxTokensEnabled: false,
            maxTokens: 350,
        };

        const hasValidLicense = (this.settings.pro?.licenseKey || this.settings.pro?.orderId) && this.settings.pro?.validationStatus === 'valid';
        const disabledState = !hasValidLicense;
        const disabledAttr = disabledState ? 'disabled' : '';
        const customEnabled = !disabledState && advancedModelConfig.mode === 'custom';
        const overrideDisabledAttr = customEnabled ? '' : 'disabled';
        const overrideDisabledClass = customEnabled ? '' : 'disabled';
        const temperatureValueDisabledAttr = customEnabled && advancedModelConfig.temperatureEnabled ? '' : 'disabled';
        const topPValueDisabledAttr = customEnabled && advancedModelConfig.topPEnabled ? '' : 'disabled';
        const topKValueDisabledAttr = customEnabled && advancedModelConfig.topKEnabled ? '' : 'disabled';
        const maxTokensValueDisabledAttr = customEnabled && advancedModelConfig.maxTokensEnabled ? '' : 'disabled';

        const temperatureDisplayValue = customEnabled && advancedModelConfig.temperatureEnabled ? String(advancedModelConfig.temperature) : '';
        const topPDisplayValue = customEnabled && advancedModelConfig.topPEnabled ? String(advancedModelConfig.topP) : '';
        const topKDisplayValue = customEnabled && advancedModelConfig.topKEnabled ? String(advancedModelConfig.topK) : '';
        const maxTokensDisplayValue = customEnabled && advancedModelConfig.maxTokensEnabled ? String(advancedModelConfig.maxTokens) : '';

        return `
            <div class="modern-section">
                <div class="section-header">
                    <h3 class="section-title">Advanced Model Configuration</h3>
                </div>

                <div class="setting-row" data-tooltip="Control advanced generation parameters. Choose 'Let GitMind decide' to use safe provider defaults.">
                    <div class="setting-info">
                        <div class="setting-label">Mode</div>
                        <div class="setting-desc">Let GitMind decide or use your custom overrides</div>
                    </div>
                    <div class="setting-control">
                        <select id="advancedModelConfigMode" ${disabledAttr}>
                            <option value="auto" ${advancedModelConfig.mode === 'auto' ? 'selected' : ''}>Let GitMind decide</option>
                            <option value="custom" ${advancedModelConfig.mode === 'custom' ? 'selected' : ''}>Custom</option>
                        </select>
                    </div>
                </div>

                <div class="setting-row" data-tooltip="Enable a temperature override.">
                    <div class="setting-info">
                        <div class="setting-label">Temperature</div>
                        <div class="setting-desc">Higher values = more variation</div>
                    </div>
                    <div class="setting-control">
                        <div class="advanced-model-config-control">
                            <div class="switch-container ${overrideDisabledClass}">
                                <input class="switch-input" type="checkbox" id="advancedModelConfigTemperatureEnabled"
                                    ${advancedModelConfig.temperatureEnabled ? 'checked' : ''}
                                    ${overrideDisabledAttr} />
                                <div class="switch-button">
                                    <div class="switch-slider"></div>
                                </div>
                            </div>
                            <input class="advanced-number" type="number" id="advancedModelConfigTemperature" min="0" max="2" step="0.05" value="${temperatureDisplayValue}" ${temperatureValueDisabledAttr} />
                        </div>
                    </div>
                </div>

                <div class="setting-row" data-tooltip="Enable a top-p override. Some providers/models disallow specifying both temperature and top-p.">
                    <div class="setting-info">
                        <div class="setting-label">Top P</div>
                        <div class="setting-desc">Nucleus sampling probability cutoff</div>
                    </div>
                    <div class="setting-control">
                        <div class="advanced-model-config-control">
                            <div class="switch-container ${overrideDisabledClass}">
                                <input class="switch-input" type="checkbox" id="advancedModelConfigTopPEnabled"
                                    ${advancedModelConfig.topPEnabled ? 'checked' : ''}
                                    ${overrideDisabledAttr} />
                                <div class="switch-button">
                                    <div class="switch-slider"></div>
                                </div>
                            </div>
                            <input class="advanced-number" type="number" id="advancedModelConfigTopP" min="0" max="1" step="0.01" value="${topPDisplayValue}" ${topPValueDisabledAttr} />
                        </div>
                    </div>
                </div>

                <div class="setting-row" data-tooltip="Enable a top-k override.">
                    <div class="setting-info">
                        <div class="setting-label">Top K</div>
                        <div class="setting-desc">Limit sampling to the top K tokens</div>
                    </div>
                    <div class="setting-control">
                        <div class="advanced-model-config-control">
                            <div class="switch-container ${overrideDisabledClass}">
                                <input class="switch-input" type="checkbox" id="advancedModelConfigTopKEnabled"
                                    ${advancedModelConfig.topKEnabled ? 'checked' : ''}
                                    ${overrideDisabledAttr} />
                                <div class="switch-button">
                                    <div class="switch-slider"></div>
                                </div>
                            </div>
                            <input class="advanced-number" type="number" id="advancedModelConfigTopK" min="0" max="500" step="1" value="${topKDisplayValue}" ${topKValueDisabledAttr} />
                        </div>
                    </div>
                </div>

                <div class="setting-row" data-tooltip="Enable a max output tokens override.">
                    <div class="setting-info">
                        <div class="setting-label">Max Output Tokens</div>
                        <div class="setting-desc">Maximum tokens the model may generate</div>
                    </div>
                    <div class="setting-control">
                        <div class="advanced-model-config-control">
                            <div class="switch-container ${overrideDisabledClass}">
                                <input class="switch-input" type="checkbox" id="advancedModelConfigMaxTokensEnabled"
                                    ${advancedModelConfig.maxTokensEnabled ? 'checked' : ''}
                                    ${overrideDisabledAttr} />
                                <div class="switch-button">
                                    <div class="switch-slider"></div>
                                </div>
                            </div>
                            <input class="advanced-number" type="number" id="advancedModelConfigMaxTokens" min="1" max="65536" step="1" value="${maxTokensDisplayValue}" ${maxTokensValueDisabledAttr} />
                        </div>
                    </div>
                </div>
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
        const targetLanguage = this.settings.commit?.targetLanguage || 'english';
        const hasValidLicense = (this.settings.pro?.licenseKey || this.settings.pro?.orderId) && this.settings.pro?.validationStatus === 'valid';
        const disabledState = !hasValidLicense;
        const proRequiredMessage = !hasValidLicense ? '(Pro feature)' : '';

        const languageOptions = [
            { value: 'english', label: 'English' },
            { value: 'spanish', label: 'Spanish (Español)' },
            { value: 'french', label: 'French (Français)' },
            { value: 'german', label: 'German (Deutsch)' },
            { value: 'italian', label: 'Italian (Italiano)' },
            { value: 'portuguese', label: 'Portuguese (Português)' },
            { value: 'russian', label: 'Russian (Русский)' },
            { value: 'chinese', label: 'Chinese (中文)' },
            { value: 'japanese', label: 'Japanese (日本語)' },
            { value: 'korean', label: 'Korean (한국어)' },
            { value: 'arabic', label: 'Arabic (العربية)' },
            { value: 'hindi', label: 'Hindi (हिन्दी)' },
            { value: 'bengali', label: 'Bengali (বাংলা)' },
            { value: 'urdu', label: 'Urdu (اردو)' },
            { value: 'marathi', label: 'Marathi (मराठी)' },
            { value: 'telugu', label: 'Telugu (తెలుగు)' },
            { value: 'tamil', label: 'Tamil (தமிழ்)' },
            { value: 'javanese', label: 'Javanese (Basa Jawa)' },
            { value: 'tagalog', label: 'Tagalog (Filipino)' },
            { value: 'punjabi', label: 'Punjabi (ਪੰਜਾਬੀ)' },
            { value: 'kannada', label: 'Kannada (ಕನ್ನಡ)' },
            { value: 'gujarati', label: 'Gujarati (ગુજરાતી)' },
            { value: 'bhojpuri', label: 'Bhojpuri (भोजपुरी)' },
            { value: 'turkish', label: 'Turkish (Türkçe)' },
            { value: 'dutch', label: 'Dutch (Nederlands)' },
            { value: 'polish', label: 'Polish (Polski)' },
            { value: 'vietnamese', label: 'Vietnamese (Tiếng Việt)' },
            { value: 'thai', label: 'Thai (ไทย)' },
            { value: 'swedish', label: 'Swedish (Svenska)' },
            { value: 'danish', label: 'Danish (Dansk)' },
            { value: 'norwegian', label: 'Norwegian (Norsk)' },
            { value: 'finnish', label: 'Finnish (Suomi)' },
            { value: 'greek', label: 'Greek (Ελληνικά)' },
            { value: 'hebrew', label: 'Hebrew (עברית)' },
            { value: 'persian', label: 'Persian (فارسی)' },
            { value: 'ukrainian', label: 'Ukrainian (Українська)' },
            { value: 'czech', label: 'Czech (Čeština)' },
            { value: 'romanian', label: 'Romanian (Română)' },
            { value: 'hungarian', label: 'Hungarian (Magyar)' },
            { value: 'indonesian', label: 'Indonesian (Bahasa Indonesia)' },
            { value: 'malay', label: 'Malay (Bahasa Melayu)' },
            { value: 'hausa', label: 'Hausa' },
            { value: 'amharic', label: 'Amharic (አማርኛ)' },
            { value: 'yoruba', label: 'Yoruba' },
            { value: 'igbo', label: 'Igbo' },
            { value: 'oromo', label: 'Oromo' },
            { value: 'somali', label: 'Somali' },
            { value: 'bulgarian', label: 'Bulgarian (Български)' },
            { value: 'croatian', label: 'Croatian (Hrvatski)' },
            { value: 'slovak', label: 'Slovak (Slovenčina)' },
            { value: 'lithuanian', label: 'Lithuanian (Lietuvių)' },
            { value: 'latvian', label: 'Latvian (Latviešu)' },
            { value: 'estonian', label: 'Estonian (Eesti)' },
            { value: 'albanian', label: 'Albanian (Shqip)' },
            { value: 'armenian', label: 'Armenian (Հայերեն)' },
            { value: 'georgian', label: 'Georgian (ქართული)' },
            { value: 'kazakh', label: 'Kazakh (Қазақ)' },
            { value: 'uzbek', label: 'Uzbek (Ўзбек)' },
            { value: 'azerbaijani', label: 'Azerbaijani (Azərbaycanca)' }
        ];

        return `
        <div class="modern-section">
            <div class="section-header">
                <h3 class="section-title">Commit Message Options ${proRequiredMessage}</h3>
                <div class="section-description">Control commit message formatting for consistency</div>
            </div>

            <div class="commit-options-row">
                <div class="compact-setting select-setting" style="grid-column: 1 / -1;">
                    <div class="setting-info">
                        <div class="setting-label">Target Commit Language</div>
                        <div class="setting-desc">Select the language for AI-generated commit messages. Uses professional developer terminology. Start typing to search languages.</div>
                    </div>
                    <div class="searchable-language-dropdown ${disabledState ? 'disabled' : ''}">
                        <input type="text" 
                               id="commitTargetLanguageSearch"
                               class="searchable-input"
                               placeholder="Type to search languages or select from dropdown..."
                               value="${languageOptions.find(opt => opt.value === targetLanguage)?.label || 'English'}"
                               ${disabledState ? 'disabled' : ''}
                               autocomplete="off" />
                        <select id="commitTargetLanguage"
                                class="searchable-select"
                                style="display: none;"
                                ${disabledState ? 'disabled' : ''}
                                data-setting="commit.targetLanguage">
                            ${languageOptions.map(opt => `<option value="${opt.value}" ${targetLanguage === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                        </select>
                        <button type="button" class="dropdown-toggle" aria-label="Open language options" title="Open language options" ${disabledState ? 'disabled' : ''}>
                            <svg class="dropdown-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <input type="hidden" id="commitTargetLanguageValue" value="${targetLanguage}" />
                </div>
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
                <span>Max Commits</span>
                <input type="number" id="learnFromCommitHistoryMaxCommits" 
                    class="input-field" 
                    value="${learnFromCommitHistory.maxCommits}" 
                    min="10" max="2500" step="10"
                    ${disabledState ? 'disabled' : ''} 
                    data-setting="pro.learnFromCommitHistory.maxCommits" />
            </div>
            <div class="compact-setting toggle-setting">
                <div class="setting-info">
                    <div class="setting-label">Include Author Info</div>
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
        const changelogConfig = this.settings.pro?.changelog || { enabled: true, maxCommitsEnabled: false, maxCommits: 100, groupByVersion: true, versionOrder: 'newest-first', maxVersions: 10, overwriteExisting: false };
        const versionOrder = (changelogConfig as any).versionOrder || 'newest-first';
        const maxVersions = (changelogConfig as any).maxVersions || 10;
        const overwriteExisting = (changelogConfig as any).overwriteExisting || false;
        const maxCommitsEnabled = (changelogConfig as any).maxCommitsEnabled ?? false;
        const hasValidLicense = (this.settings.pro?.licenseKey || this.settings.pro?.orderId) && this.settings.pro?.validationStatus === 'valid';
        const disabledState = !hasValidLicense;
        const proRequiredMessage = !hasValidLicense ? '(Pro feature)' : '';

        return `
        <div class="section-header">
            <h4 class="subsection-title">Changelog Generation ${proRequiredMessage}</h4>
            <div class="section-description">Generate professional CHANGELOG.md from your git history using AI</div>
        </div>

        <div class="commit-options-row">
            <div class="compact-setting toggle-setting">
                <div class="setting-info">
                    <div class="setting-label">Limit Commits</div>
                    <div class="setting-desc">When disabled, commit range is determined automatically from version tags</div>
                </div>
                <div class="switch-container ${disabledState ? 'disabled' : ''}">
                    <input class="switch-input" type="checkbox" id="changelogMaxCommitsEnabled"
                        ${maxCommitsEnabled ? 'checked' : ''}
                        ${disabledState ? 'disabled' : ''}
                        data-setting="pro.changelog.maxCommitsEnabled" />
                    <div class="switch-button">
                        <div class="switch-slider"></div>
                    </div>
                </div>
            </div>
            <div class="compact-setting input-setting">
                <span>Max Commits</span>
                <input type="number" id="changelogMaxCommits"
                    class="input-field"
                    value="${changelogConfig.maxCommits}"
                    min="10" max="2500" step="10"
                    ${disabledState || !maxCommitsEnabled ? 'disabled' : ''}
                    data-setting="pro.changelog.maxCommits" />
            </div>
            <div class="compact-setting input-setting">
                <span>Max Versions</span>
                <input type="number" id="changelogMaxVersions"
                    class="input-field"
                    value="${maxVersions}"
                    min="1" max="25" step="1"
                    ${disabledState ? 'disabled' : ''}
                    data-setting="pro.changelog.maxVersions" />
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
            <div class="compact-setting select-setting">
                <span>Version Order</span>
                <select id="changelogVersionOrder"
                    class="input-field"
                    ${disabledState ? 'disabled' : ''}
                    data-setting="pro.changelog.versionOrder">
                    <option value="newest-first" ${versionOrder === 'newest-first' ? 'selected' : ''}>Newest First</option>
                    <option value="oldest-first" ${versionOrder === 'oldest-first' ? 'selected' : ''}>Oldest First</option>
                </select>
            </div>
        </div>

        <div class="commit-options-row">
            <div class="compact-setting toggle-setting">
                <div class="setting-info">
                    <div class="setting-label">Overwrite Existing Versions</div>
                    <div class="setting-desc">Replace existing changelog entries when regenerating (otherwise preserves them)</div>
                </div>
                <div class="switch-container ${disabledState ? 'disabled' : ''}">
                    <input class="switch-input" type="checkbox" id="changelogOverwriteExisting"
                        ${overwriteExisting ? 'checked' : ''}
                        ${disabledState ? 'disabled' : ''}
                        data-setting="pro.changelog.overwriteExisting" />
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
