// src/webview/settings/components/renderers/CommitStyleRenderer.ts
import { ExtensionSettings } from "../../../../models/ExtensionSettings";
import { BaseRenderer } from "./BaseRenderer";

export class CommitStyleRenderer extends BaseRenderer {
    constructor(settings: ExtensionSettings) {
        super(settings);
    }

    public render(): string {
        const currentStyle = this.settings.commitStyle?.style || 'conventional';
        const hasValidLicense = Boolean((this.settings.pro?.licenseKey || this.settings.pro?.orderId) && this.settings.pro?.validationStatus === 'valid');

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
                        <button class="gm-tab-btn" data-gm-tab="reference" type="button">
                            Reference Guide
                        </button>
                    </div>

                    <div class="gm-tab-container">
                        <div class="gm-tab-content gm-tab-content-active" data-gm-content="selection">
                            <div class="gm-style-grid">
                                ${this.renderStyleOption('basic', 'Basic', 'Simple, straightforward commit messages', false, currentStyle, hasValidLicense)}
                                ${this.renderStyleOption('conventional', 'Conventional Commits', 'Standard with types and scopes (feat, fix, docs, etc.)', false, currentStyle, hasValidLicense)}
                                ${this.renderStyleOption('angular', 'Angular', 'Angular commit convention with detailed type definitions', true, currentStyle, hasValidLicense)}
                                ${this.renderStyleOption('ember', 'Ember.js', 'Ember.js style with tags like [FEATURE], [BUGFIX]', true, currentStyle, hasValidLicense)}
                                ${this.renderStyleOption('emojigit', 'EmojiGit', 'Visual semantic commits with custom emojis', true, currentStyle, hasValidLicense)}
                                ${this.renderStyleOption('gitmoji', 'Gitmoji', 'Official gitmoji.dev specification with standardized emojis', true, currentStyle, hasValidLicense)}
                                ${this.renderStyleOption('semantic', 'Semantic Release', 'Automated release-optimized commits for semantic versioning', true, currentStyle, hasValidLicense)}
                                ${this.renderStyleOption('commitizen', 'Commitizen', 'Interactive guided commits with validation', true, currentStyle, hasValidLicense)}
                                ${this.renderStyleOption('karma', 'Karma (Google)', 'Google\'s strict enterprise convention with mandatory scopes', true, currentStyle, hasValidLicense)}
                                ${this.renderStyleOption('linux', 'Linux Kernel', 'Traditional kernel development convention with subsystems', true, currentStyle, hasValidLicense)}
                                ${this.renderStyleOption('jquery', 'jQuery', 'JavaScript project convention with issue tracking', true, currentStyle, hasValidLicense)}
                            </div>
                            
                            ${!hasValidLicense ? this.renderProUpgradeSection() : ''}
                        </div>

                        <div class="gm-tab-content" data-gm-content="reference">
                            <div class="gm-reference-container">
                                ${this.renderReferenceGuide()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${this.renderScript(hasValidLicense, currentStyle)}
        `;
    }

    private renderStyles(): string {
        // Styles now loaded from separate CSS file via main.css.ts
        return '';
    }

    private renderScript(hasValidLicense: boolean, currentStyle: string): string {
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
                                    const hasLicense = ${hasValidLicense};

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

                    function initializeSettingsHandling() {
                        window.addEventListener('message', function(event) {
                            const message = event.data;
                            if (message.command === 'updateSettings' && message.settings) {
                                const currentStyle = message.settings.commitStyle?.style || 'conventional';
                                updateCommitStyleSelection(currentStyle);
                                console.log('[CommitStyleRenderer] Settings updated:', currentStyle);
                            }
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

    private renderStyleOption(
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
    private getStyleDisplayName(styleId: string): string {
        const names: { [key: string]: string } = {
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
            example: `feat(auth): add OAuth2 social login integration

- Implement Google and GitHub OAuth providers
- Add social account linking to existing users
- Include fallback for authentication failures`
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