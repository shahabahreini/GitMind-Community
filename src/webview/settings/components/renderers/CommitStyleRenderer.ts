// src/webview/settings/components/renderers/CommitStyleRenderer.ts
import { ExtensionSettings } from "../../../../models/ExtensionSettings";
import { BaseRenderer } from "./BaseRenderer";

export class CommitStyleRenderer extends BaseRenderer {
    constructor(settings: ExtensionSettings) {
        super(settings);
    }

    public render(): string {
        const currentStyle = this.settings.commitStyle?.style || 'conventional';
        const hasProAccess = this.isProUser() || this.isDevModeEnabled();

        return `
            <div class="gm-commit-style-section">
                <div class="gm-section-header">
                    <h3 class="gm-section-title">
                        Commit Message Style
                    </h3>
                    <p class="gm-section-description">
                        Choose how your AI-generated commit messages are formatted and structured
                    </p>
                </div>

                <div class="gm-content-wrapper">
                    <div class="gm-tab-navigation">
                        <button class="gm-tab-btn gm-tab-btn-active" data-gm-tab="selection" type="button">
                            Style Selection
                        </button>
                        ${hasProAccess ? '<button class="gm-tab-btn" data-gm-tab="emoji" type="button">Emoji Enhancement</button>' : ''}
                        <button class="gm-tab-btn" data-gm-tab="reference" type="button">
                            Reference Guide
                        </button>
                    </div>

                    <div class="gm-tab-container">
                        <div class="gm-tab-content gm-tab-content-active" data-gm-content="selection">
                            <div class="gm-style-grid">
                                ${this.renderSimpleStyleOption('basic', 'Basic', 'Simple, straightforward commit messages', false, currentStyle, hasProAccess)}
                                ${this.renderSimpleStyleOption('conventional', 'Conventional Commits', 'Standard with types and scopes (feat, fix, docs, etc.)', false, currentStyle, hasProAccess)}
                                ${this.renderSimpleStyleOption('conventional-no-scope', 'Conventional Commits (No Scope)', 'Types without scopes (feat: ..., fix: ...)', true, currentStyle, hasProAccess)}
                                ${this.renderSimpleStyleOption('angular', 'Angular', 'Angular commit convention with detailed type definitions', true, currentStyle, hasProAccess)}
                                ${this.renderSimpleStyleOption('ember', 'Ember.js', 'Ember.js style with tags like [FEATURE], [BUGFIX]', true, currentStyle, hasProAccess)}
                                ${this.renderSimpleStyleOption('emojigit', 'EmojiGit', 'Visual semantic commits with custom emojis', true, currentStyle, hasProAccess)}
                                ${this.renderSimpleStyleOption('gitmoji', 'Gitmoji', 'Official gitmoji.dev specification with standardized emojis', true, currentStyle, hasProAccess)}
                                ${this.renderSimpleStyleOption('semantic', 'Semantic Release', 'Automated release-optimized commits for semantic versioning', true, currentStyle, hasProAccess)}
                                ${this.renderSimpleStyleOption('commitizen', 'Commitizen', 'Interactive guided commits with validation', true, currentStyle, hasProAccess)}
                                ${this.renderSimpleStyleOption('karma', 'Karma (Google)', 'Google\'s strict enterprise convention with mandatory scopes', true, currentStyle, hasProAccess)}
                                ${this.renderSimpleStyleOption('linux', 'Linux Kernel', 'Traditional kernel development convention with subsystems', true, currentStyle, hasProAccess)}
                                ${this.renderSimpleStyleOption('jquery', 'jQuery', 'JavaScript project convention with issue tracking', true, currentStyle, hasProAccess)}
                            </div>
                            
                            ${!hasProAccess ? this.renderProUpgradeSection() : ''}
                        </div>

                        ${hasProAccess ? this.renderEmojiTab(currentStyle) : ''}
                        
                        <div class="gm-tab-content" data-gm-content="reference">
                            <div class="gm-reference-container">
                                ${this.renderReferenceGuide()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${this.renderScript(hasProAccess, currentStyle)}
        `;
    }

    private renderScript(hasProAccess: boolean, currentStyle: string): string {
        return `
            <script>
                (function() {
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', initializeCommitStyleRenderer);
                    } else {
                        initializeCommitStyleRenderer();
                    }

                    function initializeCommitStyleRenderer() {
                        console.log('[CommitStyleRenderer] Initializing...');
                        
                        initializeTabSystem();
                        initializeStyleSelection();
                        initializeExamplesToggle();
                        initializeEmojiHandlers();
                        initializeSettingsHandling();
                        
                        updateCommitStyleSelection('${currentStyle}');
                        
                        console.log('[CommitStyleRenderer] Initialization complete');
                    }

                    function initializeTabSystem() {
                        const tabButtons = document.querySelectorAll('.gm-tab-btn');
                        const tabContents = document.querySelectorAll('.gm-tab-content');

                        tabButtons.forEach(button => {
                            button.addEventListener('click', function() {
                                const targetTab = this.getAttribute('data-gm-tab');
                                
                                tabButtons.forEach(btn => btn.classList.remove('gm-tab-btn-active'));
                                this.classList.add('gm-tab-btn-active');
                                
                                tabContents.forEach(content => {
                                    content.classList.remove('gm-tab-content-active');
                                    if (content.getAttribute('data-gm-content') === targetTab) {
                                        content.classList.add('gm-tab-content-active');
                                    }
                                });
                                
                                console.log('[CommitStyleRenderer] Tab switched to:', targetTab);
                            });
                        });
                    }

                    function initializeStyleSelection() {
                        const styleOptions = document.querySelectorAll('.gm-style-option');
                        
                        styleOptions.forEach(option => {
                            const mainArea = option.querySelector('.gm-style-main');
                            if (mainArea) {
                                mainArea.addEventListener('click', function(e) {
                                    // Don't trigger if clicking the examples toggle button
                                    if (e.target.closest('.gm-examples-toggle')) return;
                                    
                                    const radioInput = option.querySelector('.gm-radio-input');
                                    if (!radioInput || radioInput.disabled) return;
                                    
                                    const styleId = radioInput.value;
                                    const isProStyle = radioInput.getAttribute('data-gm-is-pro') === 'true';
                                    const hasLicense = ${hasProAccess};

                                    if (isProStyle && !hasLicense) {
                                        console.log('[CommitStyleRenderer] Pro style requires license');
                                        if (typeof showToast === 'function') {
                                            showToast('This commit style requires GitMind Pro. Upgrade to unlock premium styles!', 'error');
                                        }
                                        return;
                                    }

                                    updateCommitStyleSelection(styleId);
                                    
                                    if (typeof vscode !== 'undefined') {
                                        vscode.postMessage({
                                            command: 'updateSetting',
                                            key: 'commitStyle.style',
                                            value: styleId
                                        });
                                    }
                                    
                                    console.log('[CommitStyleRenderer] Style changed to:', styleId);
                                });
                            }
                        });
                    }

                    function initializeExamplesToggle() {
                        const toggleButtons = document.querySelectorAll('.gm-examples-toggle');
                        
                        toggleButtons.forEach(button => {
                            button.addEventListener('click', function(e) {
                                e.stopPropagation();
                                
                                const styleOption = this.closest('.gm-style-option');
                                const examplesContainer = styleOption.querySelector('.gm-inline-examples');
                                const toggleIcon = this.querySelector('.gm-toggle-icon');
                                const toggleText = this.querySelector('.gm-toggle-text');
                                
                                if (examplesContainer.classList.contains('gm-examples-expanded')) {
                                    examplesContainer.classList.remove('gm-examples-expanded');
                                    toggleIcon.textContent = '▼';
                                    toggleText.textContent = 'View Examples';
                                } else {
                                    examplesContainer.classList.add('gm-examples-expanded');
                                    toggleIcon.textContent = '▲';
                                    toggleText.textContent = 'Hide Examples';
                                }
                                
                                console.log('[CommitStyleRenderer] Examples toggled');
                            });
                        });
                    }

                    function initializeEmojiHandlers() {
                        // Handle emoji checkbox
                        const emojiCheckbox = document.querySelector('.gm-emoji-checkbox');
                        if (emojiCheckbox) {
                            emojiCheckbox.addEventListener('change', function() {
                                const isEnabled = this.checked;
                                const optionsContainer = document.querySelector('.gm-emoji-options');
                                
                                if (optionsContainer) {
                                    if (isEnabled) {
                                        optionsContainer.classList.add('gm-emoji-options-visible');
                                    } else {
                                        optionsContainer.classList.remove('gm-emoji-options-visible');
                                    }
                                }
                                
                                if (typeof vscode !== 'undefined') {
                                    vscode.postMessage({
                                        command: 'updateSetting',
                                        key: 'commitStyle.gitmoji.enabled',
                                        value: isEnabled
                                    });
                                }
                                
                                console.log('[CommitStyleRenderer] Emoji injection enabled:', isEnabled);
                            });
                        }

                        // Handle placement radio buttons
                        const placementRadios = document.querySelectorAll('input[name="gm-emoji-placement"]');
                        placementRadios.forEach(radio => {
                            radio.addEventListener('change', function() {
                                if (this.checked) {
                                    const placement = this.value;
                                    
                                    if (typeof vscode !== 'undefined') {
                                        vscode.postMessage({
                                            command: 'updateSetting',
                                            key: 'commitStyle.gitmoji.placement',
                                            value: placement
                                        });
                                    }
                                    
                                    console.log('[CommitStyleRenderer] Emoji placement:', placement);
                                }
                            });
                        });

                    }

                    function openCustomEmojiDialog(styleId) {
                        if (typeof vscode !== 'undefined') {
                            vscode.postMessage({
                                command: 'openCustomEmojiDialog',
                                styleId: styleId
                            });
                        }
                    }

                    function initializeSettingsHandling() {
                        window.addEventListener('message', function(event) {
                            const message = event.data;
                            if (message.command === 'updateSettings' && message.settings) {
                                const currentStyle = message.settings.commitStyle?.style || 'conventional';
                                updateCommitStyleSelection(currentStyle);
                                updateGitmojiSettings(message.settings.commitStyle?.gitmoji);
                                console.log('[CommitStyleRenderer] Settings updated:', currentStyle);
                            }
                        });
                    }

                    function updateGitmojiSettings(gitmojiSettings) {
                        if (!gitmojiSettings) return;
                        
                        // Update emoji checkbox
                        const checkbox = document.querySelector('.gm-emoji-checkbox');
                        if (checkbox) {
                            checkbox.checked = gitmojiSettings.enabled || false;
                            const optionsContainer = document.querySelector('.gm-emoji-options');
                            if (optionsContainer) {
                                if (gitmojiSettings.enabled) {
                                    optionsContainer.classList.add('gm-emoji-options-visible');
                                } else {
                                    optionsContainer.classList.remove('gm-emoji-options-visible');
                                }
                            }
                        }
                        
                        // Update placement radios
                        const placement = gitmojiSettings.placement || 'summary';
                        const placementRadios = document.querySelectorAll('input[name="gm-emoji-placement"]');
                        placementRadios.forEach(radio => {
                            radio.checked = radio.value === placement;
                        });
                    }

                    function updateCommitStyleSelection(styleId) {
                        const allOptions = document.querySelectorAll('.gm-style-option');
                        const allRadios = document.querySelectorAll('.gm-radio-input[name="gm-commit-style"]');
                        
                        // Reset all options
                        allOptions.forEach(option => option.classList.remove('gm-style-option-selected'));
                        allRadios.forEach(radio => radio.checked = false);
                        
                        // Select the target option
                        const targetRadio = document.querySelector(\`input[name="gm-commit-style"][value="\${styleId}"]\`);
                        if (targetRadio) {
                            targetRadio.checked = true;
                            targetRadio.closest('.gm-style-option').classList.add('gm-style-option-selected');
                        }
                    }

                    function getStyleDisplayName(styleId) {
                        const names = {
                            'basic': 'Basic Style',
                            'conventional': 'Conventional Commits',
                            'angular': 'Angular Style',
                            'ember': 'Ember.js Style',
                            'emojigit': 'EmojiGit Style',
                            'gitmoji': 'Gitmoji Style',
                            'semantic': 'Semantic Release',
                            'commitizen': 'Commitizen Style',
                            'karma': 'Karma (Google)',
                            'linux': 'Linux Kernel',
                            'jquery': 'jQuery Style'
                        };
                        return names[styleId] || 'Unknown Style';
                    }

                    function getStyleExamples(styleId) {
                        const examples = {
                            'basic': [
                                'Add user authentication system',
                                \`Update API documentation for v2.0

- Add new endpoint specifications
- Include authentication examples
- Update rate limiting information\`
                            ],
                            'conventional': [
                                'feat(auth): add two-factor authentication',
                                \`fix(api): resolve user login timeout issue

- Increase connection timeout to 30 seconds
- Add retry logic for failed requests
- Improve error messaging for timeouts\`
                            ],
                            'angular': [
                                'feat(directive): add new user directive',
                                \`fix(service): handle null response in data service

- Add null checks for API responses
- Implement fallback data handling
- Update unit tests for edge cases\`
                            ],
                            'ember': [
                                '[FEATURE] Add user profile management',
                                \`[BUGFIX] Fix memory leak in component teardown

- Properly destroy event listeners
- Clear component references on destroy
- Add cleanup to component lifecycle\`
                            ],
                            'emojigit': [
                                '✨ Add user authentication system',
                                \`🐛 Fix navigation bug in mobile view

- Resolve touch event conflicts
- Update responsive breakpoints
- Improve mobile menu accessibility\`
                            ],
                            'gitmoji': [
                                '✨ Add OAuth2 authentication system',
                                \`🐛 Fix memory leak in image processing

- Properly dispose of image buffers
- Add garbage collection triggers
- Update memory monitoring\`
                            ],
                            'semantic': [
                                'feat: add user profile management dashboard',
                                \`fix: resolve authentication timeout errors

- Increase session timeout to 30 minutes
- Add automatic token refresh
- Improve error handling for expired sessions\`
                            ],
                            'commitizen': [
                                'feat(dashboard): add real-time analytics widgets',
                                \`fix(auth): resolve login timeout issues

- Implement proper session management
- Add retry logic for failed authentication
- Update error messaging for better UX\`
                            ],
                            'karma': [
                                'feat(auth): implement enterprise SSO integration',
                                \`fix(router): resolve memory leak in route transitions

- Properly cleanup event listeners
- Clear component references on route change
- Add memory usage monitoring\`
                            ],
                            'linux': [
                                'net: fix use-after-free in TCP socket cleanup',
                                \`mm: improve memory allocation error handling

- Add proper error checking for allocation failures
- Implement fallback allocation strategies
- Update documentation for memory management\`
                            ],
                            'jquery': [
                                'Core: Add ES6 modules support. Fixes #2841',
                                \`Events: Fix memory leak in event delegation. Fixes #2967

- Properly cleanup delegated event handlers
- Add memory usage monitoring
- Update event system documentation\`
                            ]
                        };
                        return examples[styleId] || examples['basic'];
                    }
                })();
            </script>
        `;
    }

    private renderSimpleStyleOption(
        id: string,
        name: string,
        description: string,
        isPro: boolean,
        currentStyle: string,
        hasLicense: boolean = false
    ): string {
        const isSelected = currentStyle === id;
        const isDisabled = isPro && !hasLicense;
        const examples = this.getExamplesForStyle(id);

        return `
            <div class="gm-style-option ${isSelected ? 'gm-style-option-selected' : ''} ${isDisabled ? 'gm-style-disabled' : ''}" data-gm-style-id="${id}">
                <div class="gm-style-main">
                    <input type="radio" 
                           name="gm-commit-style" 
                           value="${id}" 
                           class="gm-radio-input"
                           data-gm-is-pro="${isPro}"
                           ${isSelected ? 'checked' : ''}
                           ${isDisabled ? 'disabled' : ''} />
                    <div class="gm-style-header">
                        <span class="gm-style-name">${name}</span>
                        ${isPro ? '<span class="gm-pro-badge">Pro</span>' : ''}
                    </div>
                    <p class="gm-style-description">${description}</p>
                    <button class="gm-examples-toggle" type="button" aria-label="Toggle examples">
                        <span class="gm-toggle-text">View Examples</span>
                        <span class="gm-toggle-icon">▼</span>
                    </button>
                </div>
                
                <div class="gm-inline-examples" data-gm-style="${id}">
                    <div class="gm-examples-content">
                        <h5 class="gm-inline-examples-title">Example Messages</h5>
                        <div class="gm-examples-list">
                            ${examples.map((example, index) => {
            const label = index === 0 ? 'Single-line example' : 'Multi-line example';
            return `<div class="gm-example-item">
                                        <div class="gm-example-label">${label}</div>
                                        <div class="gm-example-content">${example}</div>
                                    </div>`;
        }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private renderEmojiTab(currentStyle: string): string {
        const gitmojiSettings = this.settings.commitStyle?.gitmoji;
        const isEnabled = gitmojiSettings?.enabled || false;
        const placement = gitmojiSettings?.placement || 'summary';

        // Check if current style has emoji conflicts
        const hasEmojiConflict = ['emojigit', 'gitmoji'].includes(currentStyle);
        const hasFormatConflict = ['ember', 'linux', 'jquery'].includes(currentStyle);

        return `
            <div class="gm-tab-content" data-gm-content="emoji">
                <div class="gm-emoji-enhancement-container">
                    <div class="gm-emoji-header">
                        <h3 class="gm-emoji-title">🎨 Emoji Enhancement</h3>
                        <p class="gm-emoji-description">
                            Add emojis to your commit messages for better visual communication and semantic meaning.
                        </p>
                    </div>
                    
                    ${this.renderCompatibilityWarning(currentStyle, hasEmojiConflict, hasFormatConflict)}
                    
                    <div class="gm-emoji-controls">
                        <div class="gm-emoji-toggle-section">
                            <label class="gm-emoji-toggle-label">
                                <input type="checkbox" 
                                       class="gm-emoji-checkbox" 
                                       ${isEnabled ? 'checked' : ''}
                                       ${hasEmojiConflict ? 'disabled' : ''} />
                                <span class="gm-emoji-toggle-text">Enable emoji injection for "${this.getStyleDisplayName(currentStyle)}" style</span>
                            </label>
                        </div>
                        
                        <div class="gm-emoji-options ${isEnabled && !hasEmojiConflict ? 'gm-emoji-options-visible' : ''}">
                            <div class="gm-placement-section">
                                <h4 class="gm-placement-title">Injection Location</h4>
                                <div class="gm-placement-options">
                                    <label class="gm-placement-item">
                                        <input type="radio" name="gm-emoji-placement" value="summary" ${placement === 'summary' ? 'checked' : ''} />
                                        <span class="gm-placement-text">Inject to one line summary</span>
                                    </label>
                                    <label class="gm-placement-item">
                                        <input type="radio" name="gm-emoji-placement" value="body" ${placement === 'body' ? 'checked' : ''} />
                                        <span class="gm-placement-text">Inject to message body</span>
                                    </label>
                                    <label class="gm-placement-item">
                                        <input type="radio" name="gm-emoji-placement" value="both" ${placement === 'both' ? 'checked' : ''} />
                                        <span class="gm-placement-text">Both</span>
                                    </label>
                                </div>
                            </div>
                            
                            ${this.renderEmojiExamples(currentStyle, placement)}
                            
                            ${this.renderEmojiReference()}
                        </div>
                    </div>
                </div>
                
            </div>
        `;
    }

    private renderEmojiExamples(currentStyle: string, _placement: string): string {
        const summaryExample = this.getEmojiExample(currentStyle, 'summary');
        const bodyExample = this.getEmojiExample(currentStyle, 'body');

        return `
            <div class="gm-emoji-examples">
                <h4 class="gm-examples-title">Examples</h4>
                <div class="gm-examples-grid">
                    <div class="gm-example-item">
                        <div class="gm-example-label">Summary injection:</div>
                        <div class="gm-example-content">${summaryExample}</div>
                    </div>
                    <div class="gm-example-item">
                        <div class="gm-example-label">Body injection:</div>
                        <div class="gm-example-content">${bodyExample}</div>
                    </div>
                </div>
            </div>
        `;
    }

    private getEmojiExample(styleId: string, type: 'summary' | 'body'): string {
        const examples = {
            'basic': {
                'summary': '✨ Add user authentication system',
                'body': `Add user authentication system

✨ Implement OAuth2 login flow
🔒 Add password encryption
📝 Update documentation`
            },
            'conventional': {
                'summary': '✨ feat(auth): add two-factor authentication',
                'body': `feat(auth): add two-factor authentication

✨ Add 2FA setup flow
🔒 Implement TOTP verification
📱 Add mobile app support`
            },
            'angular': {
                'summary': '✨ feat(directive): add new user directive',
                'body': `feat(directive): add new user directive

✨ Create user profile directive
🎨 Add styling and animations
✅ Include comprehensive tests`
            }
        };

        const styleExamples = examples[styleId as keyof typeof examples] || examples['basic'];
        return styleExamples[type];
    }

    private renderGitmojiSection(currentStyle: string): string {
        const gitmojiSettings = this.settings.commitStyle?.gitmoji;
        const isEnabled = gitmojiSettings?.enabled || false;
        const placement = gitmojiSettings?.placement || 'summary';

        // Check if current style has emoji conflicts
        const hasEmojiConflict = ['emojigit', 'gitmoji'].includes(currentStyle);
        const hasFormatConflict = ['ember', 'linux', 'jquery'].includes(currentStyle);

        return `
            <div class="gm-gitmoji-section">
                <div class="gm-gitmoji-header">
                    <h4 class="gm-gitmoji-title">🎨 Gitmoji Enhancement</h4>
                    <p class="gm-gitmoji-description">Add emojis to your commit messages for better visual communication</p>
                </div>
                
                ${this.renderCompatibilityWarning(currentStyle, hasEmojiConflict, hasFormatConflict)}
                
                <div class="gm-gitmoji-controls">
                    <div class="gm-gitmoji-toggle">
                        <label class="gm-toggle-label">
                            <input type="checkbox" 
                                   class="gm-gitmoji-checkbox" 
                                   ${isEnabled ? 'checked' : ''}
                                   ${hasEmojiConflict ? 'disabled' : ''} />
                            <span class="gm-toggle-slider"></span>
                            <span class="gm-toggle-text">Enable Gitmoji for "${this.getStyleDisplayName(currentStyle)}" style</span>
                        </label>
                    </div>
                    
                    <div class="gm-gitmoji-options ${isEnabled && !hasEmojiConflict ? 'gm-gitmoji-options-visible' : ''}">
                        <div class="gm-placement-section">
                            <h5 class="gm-placement-title">Emoji Placement</h5>
                            <div class="gm-placement-options">
                                <label class="gm-radio-label">
                                    <input type="radio" name="gm-gitmoji-placement" value="summary" ${placement === 'summary' ? 'checked' : ''} />
                                    <span class="gm-radio-text">Summary line only</span>
                                </label>
                                <label class="gm-radio-label">
                                    <input type="radio" name="gm-gitmoji-placement" value="body" ${placement === 'body' ? 'checked' : ''} />
                                    <span class="gm-radio-text">Body only</span>
                                </label>
                                <label class="gm-radio-label">
                                    <input type="radio" name="gm-gitmoji-placement" value="both" ${placement === 'both' ? 'checked' : ''} />
                                    <span class="gm-radio-text">Both summary and body</span>
                                </label>
                            </div>
                        </div>
                        
                        ${this.renderEmojiReference()}
                    </div>
                </div>
                
                ${this.renderGitmojiStyles()}
            </div>
        `;
    }

    private renderCompatibilityWarning(currentStyle: string, hasEmojiConflict: boolean, hasFormatConflict: boolean): string {
        if (!hasEmojiConflict && !hasFormatConflict) {
            return '';
        }

        let warningMessage = '';
        let warningType = 'warning';

        if (hasEmojiConflict) {
            warningType = 'error';
            warningMessage = `The "${this.getStyleDisplayName(currentStyle)}" style already includes emojis by design. Gitmoji enhancement is not compatible with this style.`;
        } else if (hasFormatConflict) {
            warningMessage = `The "${this.getStyleDisplayName(currentStyle)}" style has specific formatting requirements. Emojis may not align perfectly with this style's conventions.`;
        }

        return `
            <div class="gm-compatibility-warning gm-warning-${warningType}">
                <div class="gm-warning-icon">${warningType === 'error' ? '⚠️' : '💡'}</div>
                <div class="gm-warning-content">
                    <div class="gm-warning-title">${warningType === 'error' ? 'Style Conflict' : 'Style Notice'}</div>
                    <div class="gm-warning-message">${warningMessage}</div>
                </div>
            </div>
        `;
    }

    private getStyleDisplayName(styleId: string): string {
        const styleNames: { [key: string]: string } = {
            'conventional': 'Conventional Commits',
            'gitmoji': 'Gitmoji',
            'angular': 'Angular',
            'atom': 'Atom',
            'ember': 'Ember.js',
            'eslint': 'ESLint',
            'jshint': 'JSHint',
            'karma': 'Karma (Google)',
            'linux': 'Linux Kernel',
            'jquery': 'jQuery'
        };
        return styleNames[styleId] || styleId;
    }

    private renderEmojiReference(): string {
        const emojiMappings = [
            { type: 'feat', emoji: '✨', description: 'Introduce new features' },
            { type: 'fix', emoji: '🐛', description: 'Fix a bug' },
            { type: 'docs', emoji: '📚', description: 'Add or update documentation' },
            { type: 'style', emoji: '💎', description: 'Add or update the UI and style files' },
            { type: 'refactor', emoji: '♻️', description: 'Refactor code' },
            { type: 'perf', emoji: '⚡️', description: 'Improve performance' },
            { type: 'test', emoji: '🧪', description: 'Add, update, or pass tests' },
            { type: 'build', emoji: '📦️', description: 'Add or update development scripts' },
            { type: 'ci', emoji: '👷', description: 'Add or update CI build system' },
            { type: 'chore', emoji: '🔧', description: 'Add or update development tools' },
            { type: 'revert', emoji: '⏪️', description: 'Revert changes' },
            { type: 'wip', emoji: '🚧', description: 'Work in progress' },
            { type: 'hotfix', emoji: '🚑️', description: 'Critical hotfix' },
            { type: 'security', emoji: '🔒️', description: 'Fix security issues' },
            { type: 'breaking', emoji: '💥', description: 'Introduce breaking changes' }
        ];

        const emojiRows = emojiMappings.map(mapping => `
            <tr class="gm-emoji-row">
                <td class="gm-emoji-cell">${mapping.emoji}</td>
                <td class="gm-type-cell"><code>${mapping.type}</code></td>
                <td class="gm-description-cell">${mapping.description}</td>
            </tr>
        `).join('');

        return `
            <div class="gm-emoji-reference">
                <h4 class="gm-reference-title">Emoji Reference Guide</h4>
                <p class="gm-reference-description">
                    Common emoji mappings for commit types. These emojis will be automatically added to your commit messages.
                </p>
                
                <div class="gm-reference-table-container">
                    <table class="gm-reference-table">
                        <thead>
                            <tr>
                                <th>Emoji</th>
                                <th>Type</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${emojiRows}
                        </tbody>
                    </table>
                </div>
                
                <div class="gm-reference-note">
                    <p><strong>💡 Tip:</strong> You can customize these emoji mappings in your VSCode settings under <code>gitmind.commitStyle.gitmoji.customEmojis</code></p>
                </div>
            </div>
        `;
    }

    private renderGitmojiStyles(): string {
        return `
            <style>
                .gm-gitmoji-section {
                    margin-top: 24px;
{{ ... }}
                    padding: 20px;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                }
                
                .gm-gitmoji-header {
                    margin-bottom: 16px;
                }
                
                .gm-gitmoji-title {
                    margin: 0 0 8px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }
                
                .gm-gitmoji-description {
                    margin: 0;
                    font-size: 14px;
                    color: var(--vscode-descriptionForeground);
                }
                
                .gm-compatibility-warning {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px;
                    margin-bottom: 16px;
                    border-radius: 6px;
                    font-size: 14px;
                }
                
                .gm-warning-error {
                    background: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                }
                
                .gm-warning-warning {
                    background: var(--vscode-inputValidation-warningBackground);
                    border: 1px solid var(--vscode-inputValidation-warningBorder);
                }
                
                .gm-warning-icon {
                    font-size: 16px;
                    margin-top: 2px;
                }
                
                .gm-warning-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: var(--vscode-foreground);
                }
                
                .gm-warning-message {
                    color: var(--vscode-descriptionForeground);
                    line-height: 1.4;
                }
                
                .gm-gitmoji-toggle {
                    margin-bottom: 16px;
                }
                
                .gm-toggle-label {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                .gm-toggle-label input[type="checkbox"] {
                    position: relative;
                    width: 44px;
                    height: 24px;
                    appearance: none;
                    background: var(--vscode-checkbox-background);
                    border: 1px solid var(--vscode-checkbox-border);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .gm-toggle-label input[type="checkbox"]:checked {
                    background: var(--vscode-checkbox-selectBackground);
                    border-color: var(--vscode-checkbox-selectBorder);
                }
                
                .gm-toggle-label input[type="checkbox"]:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .gm-toggle-label input[type="checkbox"]::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 18px;
                    height: 18px;
                    background: var(--vscode-checkbox-foreground);
                    border-radius: 50%;
                    transition: transform 0.2s ease;
                }
                
                .gm-toggle-label input[type="checkbox"]:checked::after {
                    transform: translateX(20px);
                }
                
                .gm-gitmoji-options {
                    display: none;
                    padding: 16px;
                    background: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 6px;
                }
                
                .gm-gitmoji-options-visible {
                    display: block;
                }
                
                .gm-placement-section {
                    margin-bottom: 20px;
                }
                
                .gm-placement-title {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }
                
                .gm-placement-options {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .gm-radio-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                .gm-radio-label input[type="radio"] {
                    margin: 0;
                }
                
                .gm-emoji-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                
                .gm-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border: 1px solid var(--vscode-button-border);
                    border-radius: 4px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                }
                
                .gm-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                
                .gm-btn-secondary {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                
                .gm-btn-secondary:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                
                .gm-btn-icon {
                    font-size: 14px;
                }
                
                .gm-emoji-reference {
                    margin-top: 24px;
                    padding: 20px;
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                }
                
                .gm-reference-title {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }
                
                .gm-reference-description {
                    margin: 0 0 20px 0;
                    font-size: 14px;
                    color: var(--vscode-descriptionForeground);
                    line-height: 1.5;
                }
                
                .gm-reference-table-container {
                    max-height: 300px;
                    overflow-y: auto;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                }
                
                .gm-reference-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                
                .gm-reference-table th {
                    background: var(--vscode-editor-background);
                    color: var(--vscode-foreground);
                    font-weight: 600;
                    padding: 8px 12px;
                    text-align: left;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    position: sticky;
                    top: 0;
                }
                
                .gm-emoji-row {
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                
                .gm-emoji-row:hover {
                    background: var(--vscode-list-hoverBackground);
                }
                
                .gm-emoji-cell {
                    padding: 8px 12px;
                    font-size: 16px;
                    text-align: center;
                    width: 50px;
                }
                
                .gm-type-cell {
                    padding: 8px 12px;
                    width: 80px;
                }
                
                .gm-type-cell code {
                    background: var(--vscode-textPreformat-background);
                    color: var(--vscode-textPreformat-foreground);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: 12px;
                }
                
                .gm-description-cell {
                    padding: 8px 12px;
                    color: var(--vscode-foreground);
                }
                
                .gm-reference-note {
                    margin-top: 16px;
                    padding: 12px;
                    background: var(--vscode-textBlockQuote-background);
                    border-left: 3px solid var(--vscode-textBlockQuote-border);
                    border-radius: 0 4px 4px 0;
                }
                
                .gm-reference-note p {
                    margin: 0;
                    font-size: 13px;
                    color: var(--vscode-foreground);
                }
                
                .gm-reference-note code {
                    background: var(--vscode-textPreformat-background);
                    color: var(--vscode-textPreformat-foreground);
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: 12px;
                }
            </style>
        `;
    }

    private renderStyleExamples(currentStyle: string): string {
        const examples = this.getExamplesForStyle(currentStyle);
        return examples.map((example, index) => {
            const label = index === 0 ? 'Single-line example' : 'Multi-line example';
            return `<div class="gm-example-item">
                <div class="gm-example-label">${label}</div>
                <div class="gm-example-content">${example}</div>
            </div>`;
        }).join('');
    }

    private renderProUpgradeSection(): string {
        return `
        <div class="gm-pro-upgrade-section">
            <h4 class="gm-upgrade-title">Unlock Premium Commit Styles</h4>
            <p class="gm-upgrade-description">
                Get access to all premium commit styles: Conventional Commits, Angular, Ember, EmojiGit, Gitmoji, Semantic Release, Commitizen, Karma (Google), Linux Kernel, and jQuery styles with GitMind Pro
            </p>
            <button class="gm-upgrade-button" id="upgradeToGitMindProBtn">
                Upgrade to GitMind Pro
            </button>
        </div>
    `;
    }

    private getExamplesForStyle(styleId: string): string[] {
        const examples: { [key: string]: string[] } = {
            'basic': [
                'Add user authentication system',
                `Update API documentation for v2.0

- Add new endpoint specifications
- Include authentication examples
- Update rate limiting information`
            ],
            'conventional': [
                'feat(auth): add two-factor authentication',
                `fix(api): resolve user login timeout issue

- Increase connection timeout to 30 seconds
- Add retry logic for failed requests
- Improve error messaging for timeouts`
            ],
            'conventional-no-scope': [
                'feat: add two-factor authentication',
                `fix: resolve user login timeout issue

- Increase connection timeout to 30 seconds
- Add retry logic for failed requests
- Improve error messaging for timeouts`
            ],
            'angular': [
                'feat(directive): add new user directive',
                `fix(service): handle null response in data service

- Add null checks for API responses
- Implement fallback data handling
- Update unit tests for edge cases`
            ],
            'ember': [
                '[FEATURE] Add user profile management',
                `[BUGFIX] Fix memory leak in component teardown

- Properly destroy event listeners
- Clear component references on destroy
- Add cleanup to component lifecycle`
            ],
            'emojigit': [
                '✨ Add user authentication system',
                `🐛 Fix navigation bug in mobile view

- Resolve touch event conflicts
- Update responsive breakpoints
- Improve mobile menu accessibility`
            ],
            'gitmoji': [
                '✨ Add OAuth2 authentication system',
                `🐛 Fix memory leak in image processing

- Properly dispose of image buffers
- Add garbage collection triggers
- Update memory monitoring`
            ],
            'semantic': [
                'feat: add user profile management dashboard',
                `fix: resolve authentication timeout errors

- Increase session timeout to 30 minutes
- Add automatic token refresh
- Improve error handling for expired sessions`
            ],
            'commitizen': [
                'feat(dashboard): add real-time analytics widgets',
                `fix(auth): resolve login timeout issues

- Implement proper session management
- Add retry logic for failed authentication
- Update error messaging for better UX`
            ],
            'karma': [
                'feat(auth): implement enterprise SSO integration',
                `fix(router): resolve memory leak in route transitions

- Properly cleanup event listeners
- Clear component references on route change
- Add memory usage monitoring`
            ],
            'linux': [
                'net: fix use-after-free in TCP socket cleanup',
                `mm: improve memory allocation error handling

- Add proper error checking for allocation failures
- Implement fallback allocation strategies
- Update documentation for memory management`
            ],
            'jquery': [
                'Core: Add ES6 modules support. Fixes #2841',
                `Events: Fix memory leak in event delegation. Fixes #2967

- Properly cleanup delegated event handlers
- Add memory usage monitoring
- Update event system documentation`
            ]
        };
        return examples[styleId] || examples['basic'];
    }

    private renderGitmojiToggle(styleId: string, hasLicense: boolean): string {
        if (!hasLicense) {
            return ''; // Only show for Pro users
        }

        const gitmojiEnabled = this.settings.commitStyle?.gitmoji?.enabled || false;
        const gitmojiPlacement = this.settings.commitStyle?.gitmoji?.placement || 'summary';

        return `
            <div class="gm-gitmoji-section" data-style="${styleId}">
                <div class="gm-gitmoji-toggle">
                    <label class="gm-toggle-label">
                        <input type="checkbox" 
                               class="gm-gitmoji-checkbox" 
                               data-style="${styleId}"
                               ${gitmojiEnabled ? 'checked' : ''} />
                        <span class="gm-toggle-slider"></span>
                        <span class="gm-toggle-text">Enable Gitmoji 🎯</span>
                        <span class="gm-pro-badge-small">Pro</span>
                    </label>
                </div>
                
                <div class="gm-gitmoji-options ${gitmojiEnabled ? 'gm-gitmoji-options-visible' : ''}" data-style="${styleId}">
                    <div class="gm-placement-options">
                        <label class="gm-placement-label">Emoji Placement:</label>
                        <div class="gm-placement-radios">
                            <label class="gm-radio-label">
                                <input type="radio" name="gm-gitmoji-placement-${styleId}" value="summary" 
                                       ${gitmojiPlacement === 'summary' ? 'checked' : ''} />
                                <span>Summary</span>
                            </label>
                            <label class="gm-radio-label">
                                <input type="radio" name="gm-gitmoji-placement-${styleId}" value="body" 
                                       ${gitmojiPlacement === 'body' ? 'checked' : ''} />
                                <span>Body</span>
                            </label>
                            <label class="gm-radio-label">
                                <input type="radio" name="gm-gitmoji-placement-${styleId}" value="both" 
                                       ${gitmojiPlacement === 'both' ? 'checked' : ''} />
                                <span>Both</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="gm-custom-emojis">
                        <button type="button" class="gm-custom-emojis-btn" data-style="${styleId}">
                            Customize Emojis
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    private renderReferenceGuide(): string {
        return `
        <h3 class="gm-reference-title">Commit Styles Reference Guide</h3>
        
        <div class="gm-table-of-contents">
            <h4 class="gm-toc-title">📋 Table of Contents</h4>
            <div class="gm-toc-grid">
                <div class="gm-toc-column">
                    <div class="gm-toc-section">
                        <h5 class="gm-toc-section-title">Open Standards</h5>
                        <ul class="gm-toc-list">
                            <li><a href="#style-conventional" class="gm-toc-link">Conventional Commits</a></li>
                            <li><a href="#style-gitmoji" class="gm-toc-link">Gitmoji Style</a></li>
                        </ul>
                    </div>
                    <div class="gm-toc-section">
                        <h5 class="gm-toc-section-title">Framework Conventions</h5>
                        <ul class="gm-toc-list">
                            <li><a href="#style-angular" class="gm-toc-link">Angular Style</a></li>
                            <li><a href="#style-ember" class="gm-toc-link">Ember.js Style</a></li>
                            <li><a href="#style-jquery" class="gm-toc-link">jQuery Style</a></li>
                        </ul>
                    </div>
                </div>
                <div class="gm-toc-column">
                    <div class="gm-toc-section">
                        <h5 class="gm-toc-section-title">Tooling-Driven</h5>
                        <ul class="gm-toc-list">
                            <li><a href="#style-semantic" class="gm-toc-link">Semantic Release</a></li>
                            <li><a href="#style-commitizen" class="gm-toc-link">Commitizen Style</a></li>
                        </ul>
                    </div>
                    <div class="gm-toc-section">
                        <h5 class="gm-toc-section-title">Enterprise & Historical</h5>
                        <ul class="gm-toc-list">
                            <li><a href="#style-karma" class="gm-toc-link">Karma (Google)</a></li>
                            <li><a href="#style-linux" class="gm-toc-link">Linux Kernel</a></li>
                        </ul>
                    </div>
                </div>
                <div class="gm-toc-column">
                    <div class="gm-toc-section">
                        <h5 class="gm-toc-section-title">Visual & Community</h5>
                        <ul class="gm-toc-list">
                            <li><a href="#style-basic" class="gm-toc-link">Basic Style</a></li>
                            <li><a href="#style-emojigit" class="gm-toc-link">EmojiGit Style</a></li>
                        </ul>
                    </div>
                    <div class="gm-toc-section">
                        <h5 class="gm-toc-section-title">Quick Reference</h5>
                        <ul class="gm-toc-list">
                            <li><a href="#comparison-table" class="gm-toc-link">Comparison Table</a></li>
                            <li><a href="#selection-guidelines" class="gm-toc-link">Selection Guidelines</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="gm-styles-reference">
        ${this.renderStyleCard('basic', 'Basic Style', 'Traditional straightforward approach', {
            status: 'Informal convention',
            context: `Basic style represents the traditional, straightforward approach to commit messages used in early Git repositories and open-source projects. It emphasizes clarity and simplicity without formal structure.`,
            specification: {
                status: 'Informal convention',
                standardization: 'No formal specification',
                governance: 'Community best practices'
            },
            types: [
                'Action-based descriptions: Add, Fix, Update, Remove',
                'Natural language focus on clarity',
                'Context-driven descriptions'
            ],
            scope: 'Not used - scope is implicit in the description',
            bestFor: [
                'Small teams or solo developers',
                'Simple projects without complex release processes',
                'Teams new to structured commit conventions'
            ],
            example: `Add user authentication system

- Implement JWT-based authentication flow
- Add login and registration endpoints
- Include password hashing and validation`
        })}

        ${this.renderStyleCard('conventional', 'Conventional Commits', 'Official open standard', {
            status: 'Official open standard',
            context: `Conventional Commits emerged in 2017 as an evolution of Angular's commit convention. It provides a standardized format that enables automated tooling and semantic versioning.`,
            specification: {
                status: 'Official open standard',
                version: '1.0.0 (Released 2020)',
                governance: 'Conventional Commits organization'
            },
            types: [
                'feat: New features',
                'fix: Bug fixes',
                'docs: Documentation changes',
                'style: Code formatting',
                'refactor: Code restructuring',
                'perf: Performance improvements'
            ],
            scope: 'Strongly encouraged, lowercase descriptive areas',
            bestFor: [
                'Modern software development teams',
                'Projects requiring automated releases',
                'Open-source projects with multiple contributors'
            ],
            example: `feat: add two-factor authentication

- Add TOTP-based 2FA support for user accounts
- Include backup recovery codes for account recovery
- Add verification flow and validation messages`
        })}

        ${this.renderStyleCard('angular', 'Angular Style', 'Enterprise Angular framework convention', {
            status: 'Team convention',
            context: `Developed by the Angular team in 2015-2016 for large-scale TypeScript framework development. Handles complexity of monorepo development with multiple packages.`,
            specification: {
                status: 'Internal team convention',
                governance: 'Angular team and community',
                documentation: 'Part of Angular contributing guidelines'
            },
            types: [
                'feat: New features for users',
                'fix: Bug fixes affecting users',
                'docs: Documentation changes',
                'style: Code formatting',
                'refactor: Code restructuring',
                'test: Test modifications'
            ],
            scope: 'Highly recommended, Angular-specific areas preferred',
            bestFor: [
                'Angular application development',
                'Enterprise Angular projects',
                'Angular monorepos with multiple packages'
            ],
            example: `feat(forms): add custom async validator

Implement server-side email validation for registration forms.
Includes debouncing to prevent excessive API calls.

Closes #1234`
        })}

        ${this.renderStyleCard('ember', 'Ember.js Style', 'Tag-based semantic categorization', {
            status: 'Community convention',
            context: `Originated from Ember.js core team's need for semantic categorization without conventional prefixes. Provides clear visual categorization while maintaining Ember's philosophy.`,
            specification: {
                status: 'Community convention',
                governance: 'Ember.js core team and RFC process',
                documentation: 'Part of Ember contributing guidelines'
            },
            types: [
                '[FEATURE]: New functionality',
                '[BUGFIX]: Bug fixes and corrections',
                '[DOC]: Documentation updates',
                '[CLEANUP]: Code cleanup and refactoring',
                '[SECURITY]: Security-related changes',
                '[PERFORMANCE]: Performance optimizations'
            ],
            scope: 'Not used - context embedded in description',
            bestFor: [
                'Ember.js applications and addons',
                'Teams following Ember conventions',
                'Projects emphasizing visual categorization'
            ],
            example: `[FEATURE] Add real-time collaboration support

- Implement WebSocket connection for live updates
- Add conflict resolution for simultaneous edits
- Include presence indicators for active users`
        })}

        ${this.renderStyleCard('emojigit', 'EmojiGit Style', 'Visual semantic commits with emojis', {
            status: 'Community-driven',
            context: `Emerged from GitHub community around 2016-2017 as developers sought more visual ways to categorize commits. Influenced by emoji usage in digital communication.`,
            specification: {
                status: 'Community-driven convention',
                standardization: 'Various interpretations (gitmoji.dev popular)',
                governance: 'Community consensus and usage patterns'
            },
            types: [
                '✨: New features and capabilities',
                '🐛: Bug fixes and corrections',
                '📚: Documentation updates',
                '💄: UI improvements and styling',
                '♻️: Code refactoring',
                '✅: Test-related changes'
            ],
            scope: 'Not used - context conveyed through emoji and description',
            bestFor: [
                'Open-source projects emphasizing engagement',
                'Teams wanting visual commit history',
                'Creative and design-focused development'
            ],
            example: `✨ Add dark mode toggle to user preferences

- Implement CSS custom properties for theme switching
- Add user preference persistence to localStorage
- Include system theme detection for default setting`
        })}

        ${this.renderStyleCard('gitmoji', 'Gitmoji Style', 'Official standardized emoji commits', {
            status: 'Official specification',
            context: `Created by Carlos Cuesta in 2016 with gitmoji.dev as the official specification. Provides standardized emoji meanings for consistent visual commit categorization across projects.`,
            specification: {
                status: 'Official specification',
                version: 'Continuously maintained at gitmoji.dev',
                governance: 'Carlos Cuesta and community contributors'
            },
            types: [
                '🎉: Initial commit',
                '✨: New features',
                '🐛: Bug fixes',
                '📝: Documentation',
                '🎨: Code structure improvements',
                '⚡️: Performance improvements'
            ],
            scope: 'Not used - emoji provides semantic context',
            bestFor: [
                'Teams wanting standardized visual commits',
                'Open-source projects with gitmoji tooling',
                'Projects emphasizing commit history readability'
            ],
            example: `🎉 Initial commit with project structure

- Set up TypeScript configuration
- Add ESLint and Prettier setup
- Create basic folder structure`
        })}

        ${this.renderStyleCard('semantic', 'Semantic Release', 'Automated release optimization', {
            status: 'Tooling convention',
            context: `Developed for semantic-release tool ecosystem to enable fully automated package releases. Focuses on commit message parsing for version bumping and changelog generation.`,
            specification: {
                status: 'Tooling-driven convention',
                governance: 'semantic-release community',
                documentation: 'Part of semantic-release docs'
            },
            types: [
                'feat: New features (minor version)',
                'fix: Bug fixes (patch version)',
                'perf: Performance improvements (patch)',
                'docs: Documentation (no version)',
                'style: Code formatting (no version)',
                'BREAKING CHANGE: Major version bump'
            ],
            scope: 'Optional but helpful for release note organization',
            bestFor: [
                'NPM packages with automated releases',
                'Projects using semantic versioning',
                'Teams wanting automated changelog generation'
            ],
            example: `feat: add user profile management dashboard

- Implement user settings interface
- Add avatar upload functionality
- Include privacy controls for profile visibility`
        })}

        ${this.renderStyleCard('commitizen', 'Commitizen Style', 'Interactive guided commits with validation', {
            status: 'Tooling convention',
            context: `Created for Commitizen CLI tool to provide interactive commit message creation with validation. Enforces consistency through guided prompts and predefined options.`,
            specification: {
                status: 'Tooling-driven convention',
                governance: 'Commitizen community',
                documentation: 'Commitizen CLI documentation'
            },
            types: [
                'feat: New features',
                'fix: Bug fixes',
                'docs: Documentation',
                'style: Code formatting',
                'refactor: Code restructuring',
                'test: Testing improvements'
            ],
            scope: 'Validated against predefined list',
            bestFor: [
                'Teams adopting commit conventions',
                'Enterprise environments requiring consistency',
                'Projects with strict commit validation'
            ],
            example: `feat(dashboard): add real-time analytics widgets

- Implement WebSocket connection for live data
- Add configurable refresh intervals
- Include error handling and reconnection logic`
        })}

        ${this.renderStyleCard('karma', 'Karma (Google)', 'Google enterprise convention', {
            status: 'Enterprise convention',
            context: `Developed by Google for Karma project and adopted across Google's JavaScript projects. Emphasizes strict scope requirements and enterprise-grade structure for large-scale development.`,
            specification: {
                status: 'Internal enterprise convention',
                governance: 'Google engineering teams',
                documentation: 'Google internal style guides'
            },
            types: [
                'feat: User-visible features',
                'fix: User-impacting bug fixes',
                'docs: Documentation improvements',
                'style: Code formatting',
                'refactor: Code restructuring',
                'test: Testing changes'
            ],
            scope: 'Mandatory - must be from approved list',
            bestFor: [
                'Large enterprise applications',
                'Teams requiring strict conventions',
                'Projects with complex module boundaries'
            ],
            example: `feat(auth): implement enterprise SSO integration

- Add SAML 2.0 support for authentication
- Integrate with Google Workspace identity
- Include automatic role mapping from LDAP`
        })}

        ${this.renderStyleCard('linux', 'Linux Kernel', 'Traditional kernel development', {
            status: 'Historical convention',
            context: `Established by Linus Torvalds and the Linux kernel community since the early 2000s. Represents traditional software development practices with emphasis on detailed explanations.`,
            specification: {
                status: 'Historical convention',
                governance: 'Linux kernel maintainers',
                documentation: 'Kernel development documentation'
            },
            types: [
                'Subsystem prefixes: mm, fs, net, sched',
                'Focus on technical subsystems',
                'Detailed problem and solution explanation'
            ],
            scope: 'Subsystem prefix indicates scope',
            bestFor: [
                'System-level software development',
                'Projects with clear subsystem boundaries',
                'Teams emphasizing detailed change explanations'
            ],
            example: `net: fix use-after-free in TCP socket cleanup

When TCP socket is closed during data transmission, cleanup
code was freeing memory still accessible by network stack.
Added proper reference counting to ensure memory validity.

Fixes: commit abc123def456
Signed-off-by: Developer Name <dev@company.com>`
        })}

        ${this.renderStyleCard('jquery', 'jQuery Style', 'JavaScript project convention', {
            status: 'Community convention',
            context: `Established by jQuery project and adopted by many JavaScript libraries. Emphasizes component-based organization with mandatory issue tracking integration.`,
            specification: {
                status: 'Community convention',
                governance: 'jQuery Foundation and community',
                documentation: 'jQuery contributing guidelines'
            },
            types: [
                'Component: Description format',
                'Core, UI, Events, Ajax, Build, Tests',
                'Mandatory issue number reference'
            ],
            scope: 'Component prefix indicates scope',
            bestFor: [
                'JavaScript libraries and frameworks',
                'Open-source projects with issue tracking',
                'Teams emphasizing component boundaries'
            ],
            example: `Core: Add ES6 modules support. Fixes #2841

- Implement proper ES6 module exports
- Add tree shaking compatibility
- Maintain backward compatibility with UMD`
        })}

        </div>

        ${this.renderExtendedComparisonTable()}
    `;
    }

    private renderStyleCard(id: string, title: string, subtitle: string, data: any): string {
        const statusClass = data.status.includes('Official') ? 'gm-status-formal' :
            data.status.includes('Community') ? 'gm-status-community' : 'gm-status-informal';

        return `
            <div class="gm-style-card" id="style-${id}">
                <div class="gm-style-card-header">
                    <h4 class="gm-style-card-title">
                        ${title}
                        <span class="gm-status-badge ${statusClass}">${data.status}</span>
                    </h4>
                    <p class="gm-style-card-subtitle">${subtitle}</p>
                </div>
                <div class="gm-style-card-content">
                    <div class="gm-info-section">
                        <h5 class="gm-info-title">Historical Context</h5>
                        <div class="gm-info-content">${data.context}</div>
                    </div>

                    <div class="gm-info-section">
                        <h5 class="gm-info-title">Specification Status</h5>
                        <ul class="gm-info-list">
                            ${Object.entries(data.specification).map(([key, value]) =>
            `<li><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</li>`
        ).join('')}
                        </ul>
                    </div>

                    <div class="gm-info-section">
                        <h5 class="gm-info-title">Type Definitions</h5>
                        <ul class="gm-info-list">
                            ${data.types.map((type: string) => `<li>${type}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="gm-info-section">
                        <h5 class="gm-info-title">Scope Requirements</h5>
                        <div class="gm-info-content">${data.scope}</div>
                    </div>

                    <div class="gm-info-section">
                        <h5 class="gm-info-title">Best For</h5>
                        <ul class="gm-info-list">
                            ${data.bestFor.map((item: string) => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="gm-info-section">
                        <h5 class="gm-info-title">Example</h5>
                        <div class="gm-code-block">${data.example}</div>
                    </div>
                </div>
            </div>
        `;
    }

    private renderExtendedComparisonTable(): string {
        return `
        <div class="gm-style-card" id="comparison-table">
            <div class="gm-style-card-header">
                <h4 class="gm-style-card-title">Complete Comparison Table</h4>
            </div>
            <div class="gm-style-card-content">
                <table class="gm-comparison-table">
                    <thead>
                        <tr>
                            <th>Aspect</th>
                            <th>Basic</th>
                            <th>Conventional</th>
                            <th>Angular</th>
                            <th>Ember</th>
                            <th>EmojiGit</th>
                            <th>Gitmoji</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Formality</strong></td>
                            <td>Informal</td>
                            <td>Formal spec</td>
                            <td>Team convention</td>
                            <td>Community standard</td>
                            <td>Visual convention</td>
                            <td>Official spec</td>
                        </tr>
                        <tr>
                            <td><strong>Learning Curve</strong></td>
                            <td>Minimal</td>
                            <td>Moderate</td>
                            <td>Moderate</td>
                            <td>Low</td>
                            <td>Low</td>
                            <td>Low</td>
                        </tr>
                        <tr>
                            <td><strong>Tooling Support</strong></td>
                            <td>Limited</td>
                            <td>Extensive</td>
                            <td>Angular-specific</td>
                            <td>Ember-specific</td>
                            <td>Community tools</td>
                            <td>Extensive</td>
                        </tr>
                        <tr>
                            <td><strong>Visual Scanning</strong></td>
                            <td>Text-based</td>
                            <td>Structured</td>
                            <td>Structured</td>
                            <td>Tag-based</td>
                            <td>Emoji-based</td>
                            <td>Standardized emoji</td>
                        </tr>
                        <tr>
                            <td><strong>Best For</strong></td>
                            <td>Simple projects</td>
                            <td>Professional teams</td>
                            <td>Angular apps</td>
                            <td>Ember projects</td>
                            <td>Open source</td>
                            <td>Visual consistency</td>
                        </tr>
                    </tbody>
                </table>

                <table class="gm-comparison-table" style="margin-top: 2rem;">
                    <thead>
                        <tr>
                            <th>Aspect</th>
                            <th>Semantic</th>
                            <th>Commitizen</th>
                            <th>Karma</th>
                            <th>Linux</th>
                            <th>jQuery</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Formality</strong></td>
                            <td>Tooling-driven</td>
                            <td>Guided validation</td>
                            <td>Enterprise-grade</td>
                            <td>Historical standard</td>
                            <td>Community-driven</td>
                        </tr>
                        <tr>
                            <td><strong>Learning Curve</strong></td>
                            <td>Moderate</td>
                            <td>Low (guided)</td>
                            <td>High</td>
                            <td>High</td>
                            <td>Moderate</td>
                        </tr>
                        <tr>
                            <td><strong>Tooling Support</strong></td>
                            <td>Release automation</td>
                            <td>CLI validation</td>
                            <td>Enterprise tools</td>
                            <td>Traditional tools</td>
                            <td>Issue tracking</td>
                        </tr>
                        <tr>
                            <td><strong>Visual Scanning</strong></td>
                            <td>Type-structured</td>
                            <td>Validated structure</td>
                            <td>Strict structure</td>
                            <td>Subsystem-based</td>
                            <td>Component-based</td>
                        </tr>
                        <tr>
                            <td><strong>Best For</strong></td>
                            <td>Automated releases</td>
                            <td>Team adoption</td>
                            <td>Large enterprises</td>
                            <td>System software</td>
                            <td>JS libraries</td>
                        </tr>
                    </tbody>
                </table>

                <div style="margin-top: 2rem;" id="selection-guidelines">
                    <h5>Selection Guidelines</h5>
                    <ul class="gm-info-list">
                        <li><strong>Start simple:</strong> Begin with Basic or Conventional for team adoption</li>
                        <li><strong>Framework alignment:</strong> Use Angular/Ember styles for respective frameworks</li>
                        <li><strong>Visual preference:</strong> Choose EmojiGit/Gitmoji for visual commit scanning</li>
                        <li><strong>Automation needs:</strong> Select Semantic for automated releases</li>
                        <li><strong>Enterprise requirements:</strong> Consider Karma for strict governance</li>
                        <li><strong>Legacy systems:</strong> Linux style for system-level development</li>
                        <li><strong>Library development:</strong> jQuery style for component-based projects</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    }
}
