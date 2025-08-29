// src/services/gitmoji/GitmojiService.ts
import * as vscode from 'vscode';

export interface GitmojiMapping {
    [key: string]: string;
}

export class GitmojiService {
    private static instance: GitmojiService;
    
    // Default gitmoji mappings based on conventional commit types
    private readonly defaultMappings: GitmojiMapping = {
        'feat': '✨',
        'fix': '🐛',
        'docs': '📚',
        'style': '💄',
        'refactor': '♻️',
        'perf': '⚡',
        'test': '✅',
        'build': '👷',
        'ci': '💚',
        'chore': '🔧',
        'revert': '⏪',
        'security': '🔒',
        'breaking': '💥',
        'deprecate': '🗑️',
        'remove': '🔥',
        'add': '➕',
        'update': '⬆️',
        'downgrade': '⬇️',
        'pin': '📌',
        'init': '🎉',
        'release': '🔖',
        'hotfix': '🚑',
        'config': '🔧',
        'merge': '🔀',
        'wip': '🚧',
        'typo': '✏️',
        'lint': '🚨',
        'format': '🎨',
        'move': '🚚',
        'rename': '🚚',
        'license': '📄',
        'analytics': '📈',
        'seo': '🔍',
        'docker': '🐳',
        'k8s': '☸️',
        'kubernetes': '☸️',
        'database': '🗃️',
        'api': '🔌',
        'ui': '💄',
        'ux': '💄',
        'accessibility': '♿',
        'i18n': '🌐',
        'localization': '🌐',
        'mock': '🤡',
        'egg': '🥚',
        'see-no-evil': '🙈',
        'snapshot': '📸',
        'experiment': '⚗️',
        'improve': '📈',
        'review': '👌',
        'animation': '💫',
        'responsive': '📱',
        'compiler': '⚙️',
        'external': '📦'
    };

    private constructor() {}

    public static getInstance(): GitmojiService {
        if (!GitmojiService.instance) {
            GitmojiService.instance = new GitmojiService();
        }
        return GitmojiService.instance;
    }

    /**
     * Check if gitmoji feature is enabled and user has Pro access
     */
    public async isGitmojiEnabled(): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('gitmind');
        const gitmojiEnabled = config.get<boolean>('commitStyle.gitmoji.enabled', false);
        
        if (!gitmojiEnabled) {
            return false;
        }

        // Check if user has Pro access
        const hasProAccess = await this.hasProAccess();
        return hasProAccess;
    }

    /**
     * Check if user has Pro access
     */
    private async hasProAccess(): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('gitmind');
        const licenseKey = config.get<string>('pro.licenseKey', '');
        const orderId = config.get<string>('pro.orderId', '');
        const validationStatus = config.get<string>('pro.validationStatus', 'invalid');
        
        return Boolean((licenseKey || orderId) && validationStatus === 'valid');
    }

    /**
     * Get emoji placement setting
     */
    public getEmojiPlacement(): 'summary' | 'body' | 'both' {
        const config = vscode.workspace.getConfiguration('gitmind');
        return config.get<'summary' | 'body' | 'both'>('commitStyle.gitmoji.placement', 'summary');
    }

    /**
     * Get custom emoji mappings from settings
     */
    public getCustomEmojis(): GitmojiMapping {
        const config = vscode.workspace.getConfiguration('gitmind');
        return config.get<GitmojiMapping>('commitStyle.gitmoji.customEmojis', {});
    }

    /**
     * Get effective emoji mappings (custom + default)
     */
    public getEffectiveEmojis(): GitmojiMapping {
        const customEmojis = this.getCustomEmojis();
        return { ...this.defaultMappings, ...customEmojis };
    }

    /**
     * Extract commit type from commit message
     */
    public extractCommitType(message: string): string | null {
        // Try conventional commit format first: type(scope): description
        const conventionalMatch = message.match(/^([a-z]+)(?:\([^)]*\))?:/);
        if (conventionalMatch) {
            return conventionalMatch[1];
        }

        // Try Angular format: type(scope): description
        const angularMatch = message.match(/^([a-z]+)\([^)]*\):/);
        if (angularMatch) {
            return angularMatch[1];
        }

        // Try semantic release format: type: description
        const semanticMatch = message.match(/^([a-z]+):/);
        if (semanticMatch) {
            return semanticMatch[1];
        }

        // Try to infer from common keywords
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) {
            return 'fix';
        }
        if (lowerMessage.includes('add') || lowerMessage.includes('new')) {
            return 'feat';
        }
        if (lowerMessage.includes('update') || lowerMessage.includes('improve')) {
            return 'update';
        }
        if (lowerMessage.includes('remove') || lowerMessage.includes('delete')) {
            return 'remove';
        }
        if (lowerMessage.includes('doc')) {
            return 'docs';
        }
        if (lowerMessage.includes('test')) {
            return 'test';
        }
        if (lowerMessage.includes('refactor')) {
            return 'refactor';
        }
        if (lowerMessage.includes('style') || lowerMessage.includes('format')) {
            return 'style';
        }
        if (lowerMessage.includes('perf')) {
            return 'perf';
        }
        if (lowerMessage.includes('config')) {
            return 'config';
        }
        if (lowerMessage.includes('merge')) {
            return 'merge';
        }

        return null;
    }

    /**
     * Get emoji for a commit type
     */
    public getEmojiForType(type: string): string | null {
        const mappings = this.getEffectiveEmojis();
        return mappings[type.toLowerCase()] || null;
    }

    /**
     * Add emoji to commit message based on settings
     */
    public async addEmojiToCommit(commitMessage: string): Promise<string> {
        if (!(await this.isGitmojiEnabled())) {
            return commitMessage;
        }

        const lines = commitMessage.split('\n');
        const summaryLine = lines[0];
        const bodyLines = lines.slice(1);

        const commitType = this.extractCommitType(summaryLine);
        if (!commitType) {
            return commitMessage;
        }

        const emoji = this.getEmojiForType(commitType);
        if (!emoji) {
            return commitMessage;
        }

        const placement = this.getEmojiPlacement();
        let modifiedSummary = summaryLine;
        let modifiedBody = bodyLines.join('\n');

        // Add emoji to summary if needed
        if (placement === 'summary' || placement === 'both') {
            // Check if emoji already exists
            if (!summaryLine.includes(emoji)) {
                // For conventional commits, add after the type
                const conventionalMatch = summaryLine.match(/^([a-z]+)(\([^)]*\))?:\s*(.*)$/);
                if (conventionalMatch) {
                    const [, type, scope, description] = conventionalMatch;
                    modifiedSummary = `${type}${scope || ''}: ${emoji} ${description}`;
                } else {
                    // For other formats, add at the beginning
                    modifiedSummary = `${emoji} ${summaryLine}`;
                }
            }
        }

        // Add emoji to body if needed
        if (placement === 'body' || placement === 'both') {
            if (bodyLines.length > 0 && !modifiedBody.includes(emoji)) {
                // Add emoji to the first non-empty line of the body
                const bodyLinesArray = bodyLines.slice();
                for (let i = 0; i < bodyLinesArray.length; i++) {
                    if (bodyLinesArray[i].trim()) {
                        bodyLinesArray[i] = `${emoji} ${bodyLinesArray[i]}`;
                        break;
                    }
                }
                modifiedBody = bodyLinesArray.join('\n');
            }
        }

        return [modifiedSummary, ...modifiedBody.split('\n')].join('\n').trim();
    }

    /**
     * Get available emoji types for UI display
     */
    public getAvailableEmojiTypes(): Array<{ type: string; emoji: string; description: string }> {
        const mappings = this.getEffectiveEmojis();
        const descriptions: { [key: string]: string } = {
            'feat': 'New features',
            'fix': 'Bug fixes',
            'docs': 'Documentation changes',
            'style': 'Code formatting and styling',
            'refactor': 'Code refactoring',
            'perf': 'Performance improvements',
            'test': 'Adding or updating tests',
            'build': 'Build system changes',
            'ci': 'CI/CD changes',
            'chore': 'Maintenance tasks',
            'revert': 'Reverting changes',
            'security': 'Security fixes',
            'breaking': 'Breaking changes',
            'deprecate': 'Deprecating features',
            'remove': 'Removing code or files',
            'add': 'Adding dependencies',
            'update': 'Updating dependencies',
            'downgrade': 'Downgrading dependencies',
            'pin': 'Pinning dependencies',
            'init': 'Initial commit',
            'release': 'Creating releases',
            'hotfix': 'Critical hotfixes',
            'config': 'Configuration changes',
            'merge': 'Merging branches',
            'wip': 'Work in progress',
            'typo': 'Fixing typos',
            'lint': 'Fixing linter warnings',
            'format': 'Code formatting',
            'move': 'Moving or renaming files',
            'rename': 'Renaming files',
            'license': 'Adding or updating license',
            'analytics': 'Adding analytics',
            'seo': 'SEO improvements',
            'docker': 'Docker related changes',
            'k8s': 'Kubernetes related changes',
            'kubernetes': 'Kubernetes related changes',
            'database': 'Database related changes',
            'api': 'API related changes',
            'ui': 'UI changes',
            'ux': 'UX improvements',
            'accessibility': 'Accessibility improvements',
            'i18n': 'Internationalization',
            'localization': 'Localization',
            'mock': 'Adding or updating mocks',
            'egg': 'Easter eggs',
            'see-no-evil': 'Ignoring files',
            'snapshot': 'Adding or updating snapshots',
            'experiment': 'Experimenting',
            'improve': 'General improvements',
            'review': 'Code review changes',
            'animation': 'Adding or updating animations',
            'responsive': 'Responsive design',
            'compiler': 'Compiler related changes',
            'external': 'External dependencies'
        };

        return Object.entries(mappings).map(([type, emoji]) => ({
            type,
            emoji,
            description: descriptions[type] || `${type} related changes`
        }));
    }
}
