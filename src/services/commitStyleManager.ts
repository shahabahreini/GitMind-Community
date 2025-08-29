// src/services/commitStyleManager.ts
import * as vscode from 'vscode';
import { CommitStyle } from '../config/types';
import { debugLog } from './debug/logger';
import { SubscriptionManager } from './subscription/SubscriptionManager';

export interface CommitStyleDefinition {
    id: CommitStyle;
    name: string;
    description: string;
    isPro: boolean;
    examples: string[];
}

export class CommitStyleManager {
    private static instance: CommitStyleManager;
    private styles: Map<CommitStyle, CommitStyleDefinition> = new Map();

    private constructor() {
        this.initializeStyles();
    }

    public static getInstance(): CommitStyleManager {
        if (!CommitStyleManager.instance) {
            CommitStyleManager.instance = new CommitStyleManager();
        }
        return CommitStyleManager.instance;
    }

    private initializeStyles(): void {
        // Basic Style (Free)
        this.styles.set('basic', {
            id: 'basic',
            name: 'Basic',
            description: 'Simple, straightforward commit messages',
            isPro: false,
            examples: [
                'Add user authentication system',
                'Fix navigation bug in mobile view',
                'Update API documentation',
                'Remove deprecated helper functions'
            ]
        });

        // Conventional Commits (Pro)
        this.styles.set('conventional', {
            id: 'conventional',
            name: 'Conventional Commits',
            description: 'Following the Conventional Commits standard with types and scopes',
            isPro: true,
            examples: [
                'feat(auth): add two-factor authentication',
                'fix(api): resolve user login timeout issue',
                'docs(readme): update installation instructions',
                'refactor(components): simplify button component logic'
            ]
        });

        // Angular Style (Pro)
        this.styles.set('angular', {
            id: 'angular',
            name: 'Angular',
            description: 'Angular commit convention with detailed type definitions',
            isPro: true,
            examples: [
                'feat(directive): add new user directive',
                'fix(service): handle null response in data service',
                'style(component): format user component code',
                'test(unit): add tests for auth guard'
            ]
        });

        // Ember.js Style (Pro)
        this.styles.set('ember', {
            id: 'ember',
            name: 'Ember.js',
            description: 'Ember.js style with tags and detailed descriptions',
            isPro: true,
            examples: [
                '[FEATURE] Add user profile management',
                '[BUGFIX] Fix memory leak in component teardown',
                '[DOC] Update API usage examples',
                '[CLEANUP] Remove unused helper functions'
            ]
        });

        // EmojiGit Style (Pro)
        this.styles.set('emojigit', {
            id: 'emojigit',
            name: 'EmojiGit',
            description: 'Visual semantic commits with custom emojis',
            isPro: true,
            examples: [
                '✨ Add user authentication system',
                '🐛 Fix navigation bug in mobile view',
                '📚 Update API documentation',
                '♻️ Refactor user service logic'
            ]
        });

        // Gitmoji Style (Pro)
        this.styles.set('gitmoji', {
            id: 'gitmoji',
            name: 'Gitmoji',
            description: 'Official gitmoji.dev specification with standardized emojis',
            isPro: true,
            examples: [
                '✨ Add OAuth2 authentication system',
                '🐛 Fix memory leak in image processing',
                '📝 Update contributing guidelines',
                '♻️ Refactor database connection logic'
            ]
        });

        // Semantic Release Style (Pro)
        this.styles.set('semantic', {
            id: 'semantic',
            name: 'Semantic Release',
            description: 'Automated release-optimized commits for semantic versioning',
            isPro: true,
            examples: [
                'feat: add user profile management dashboard',
                'fix: resolve authentication timeout errors',
                'docs: update API reference documentation',
                'perf: optimize image loading performance'
            ]
        });

        // Commitizen Style (Pro)
        this.styles.set('commitizen', {
            id: 'commitizen',
            name: 'Commitizen',
            description: 'Interactive guided commits with validation',
            isPro: true,
            examples: [
                'feat(dashboard): add real-time analytics widgets',
                'fix(auth): resolve login timeout issues',
                'docs(api): add endpoint documentation',
                'refactor(utils): simplify validation helpers'
            ]
        });

        // Karma (Google) Style (Pro)
        this.styles.set('karma', {
            id: 'karma',
            name: 'Karma (Google)',
            description: 'Google\'s strict enterprise convention with mandatory scopes',
            isPro: true,
            examples: [
                'feat(auth): implement enterprise SSO integration',
                'fix(router): resolve memory leak in route transitions',
                'docs(security): update authentication guide',
                'test(integration): add OAuth flow tests'
            ]
        });

        // Linux Kernel Style (Pro)
        this.styles.set('linux', {
            id: 'linux',
            name: 'Linux Kernel',
            description: 'Traditional kernel development convention with subsystems',
            isPro: true,
            examples: [
                'net: fix use-after-free in TCP socket cleanup',
                'mm: improve memory allocation error handling',
                'fs: add support for extended file attributes',
                'drivers: update GPIO controller configuration'
            ]
        });

        // jQuery Style (Pro)
        this.styles.set('jquery', {
            id: 'jquery',
            name: 'jQuery',
            description: 'JavaScript project convention with issue tracking',
            isPro: true,
            examples: [
                'Core: Add ES6 modules support. Fixes #2841',
                'Events: Fix memory leak in event delegation. Fixes #2967',
                'CSS: Improve selector performance. Closes #3012',
                'Ajax: Add timeout handling for requests. Refs #2855'
            ]
        });
    }

    /**
     * Get all available commit styles
     */
    public getAllStyles(): CommitStyleDefinition[] {
        return Array.from(this.styles.values());
    }

    /**
     * Get styles available to the current user (considering Pro status)
     */
    public async getAvailableStyles(): Promise<CommitStyleDefinition[]> {
        const isProUser = await SubscriptionManager.getInstance().isProUser();
        return this.getAllStyles().filter(style => !style.isPro || isProUser);
    }

    /**
     * Get a specific style definition
     */
    public getStyle(styleId: CommitStyle): CommitStyleDefinition | undefined {
        return this.styles.get(styleId);
    }

    /**
     * Check if a style is available to the current user
     */
    public async isStyleAvailable(styleId: CommitStyle): Promise<boolean> {
        const style = this.getStyle(styleId);
        if (!style) {
            return false;
        }

        if (!style.isPro) {
            return true;
        }

        // Use the same validation logic as the frontend to ensure consistency
        const config = vscode.workspace.getConfiguration('gitmind');
        const validationStatus = config.get<string>('pro.validationStatus');
        const licenseKey = config.get<string>('pro.licenseKey');
        const orderId = config.get<string>('pro.orderId');

        // Check license/order validation status first (same logic as BaseRenderer.hasValidLicense)
        const hasValidLicense = Boolean((licenseKey || orderId) && validationStatus === 'valid');

        if (hasValidLicense) {
            debugLog(`Style ${styleId} available via valid license/order`);
            return true;
        }

        // Fallback to subscription check
        try {
            const subscriptionManager = SubscriptionManager.getInstance();
            const isProViaSubscription = await subscriptionManager.isProUser();

            debugLog(`Style availability check for ${styleId}: license=${hasValidLicense}, subscription=${isProViaSubscription}`);
            return isProViaSubscription;
        } catch (error) {
            debugLog(`Error checking subscription status: ${error}`);
            return false;
        }
    }

    /**
     * Get the currently selected commit style from configuration
     */
    public getCurrentStyle(): CommitStyle {
        const config = vscode.workspace.getConfiguration('gitmind');
        return config.get<CommitStyle>('commitStyle.style', 'conventional');
    }

    /**
     * Set the commit style in configuration
     */
    public async setCommitStyle(styleId: CommitStyle): Promise<boolean> {
        try {
            // Check if style is available
            if (!(await this.isStyleAvailable(styleId))) {
                debugLog(`Style ${styleId} is not available for current user`);
                return false;
            }

            const config = vscode.workspace.getConfiguration('gitmind');
            await config.update('commitStyle.style', styleId, vscode.ConfigurationTarget.Global);

            debugLog(`Commit style updated to: ${styleId}`);
            return true;
        } catch (error) {
            debugLog('Error setting commit style:', error);
            return false;
        }
    }

    /**
     * Modify a base prompt according to the current commit style
     */
    public async modifyPromptForCurrentStyle(basePrompt: string): Promise<string> {
        // This method is no longer needed as styles are handled in generateCommitPrompt
        debugLog('[DEBUG] modifyPromptForCurrentStyle called but styles are now handled directly in generateCommitPrompt');
        return basePrompt;
    }

    /**
     * Reset style to basic if current style becomes unavailable (e.g., Pro expires)
     */
    public async validateAndResetStyleIfNeeded(): Promise<void> {
        const currentStyleId = this.getCurrentStyle();

        if (!(await this.isStyleAvailable(currentStyleId))) {
            debugLog(`Current style ${currentStyleId} is no longer available, resetting to conventional`);
            await this.setCommitStyle('conventional');

            vscode.window.showInformationMessage(
                `Commit style has been reset to Conventional Commits as ${currentStyleId} requires GitMind Pro.`,
                'Upgrade to Pro'
            ).then(selection => {
                if (selection === 'Upgrade to Pro') {
                    vscode.commands.executeCommand('gitmind.openSettings');
                }
            });
        }
    }

    /**
     * Get style examples for UI display
     */
    public getStyleExamples(styleId: CommitStyle): string[] {
        const style = this.getStyle(styleId);
        return style ? style.examples : [];
    }

    /**
     * Get formatted style description for UI
     */
    public getStyleDescription(styleId: CommitStyle): string {
        const style = this.getStyle(styleId);
        if (!style) {
            return '';
        }

        const proLabel = style.isPro ? ' (Pro)' : '';
        return `${style.description}${proLabel}`;
    }
}