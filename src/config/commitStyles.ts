// src/config/commitStyles.ts
import { CommitStyle } from './types';

export interface CommitStyleOption {
    id: CommitStyle;
    label: string;
    description: string;
    example: string;
    category: 'standard' | 'framework' | 'emoji' | 'enterprise';
    isPro: boolean;
}

export const COMMIT_STYLE_OPTIONS: CommitStyleOption[] = [
    {
        id: 'basic',
        label: 'Basic',
        description: 'Clean, simple descriptions without prefixes',
        example: 'Add user authentication support',
        category: 'standard',
        isPro: false
    },
    {
        id: 'conventional',
        label: 'Conventional Commits',
        description: 'Industry standard with semantic versioning support',
        example: 'feat(auth): add OAuth2 integration',
        category: 'standard',
        isPro: true
    },
    {
        id: 'conventional-no-scope',
        label: 'Conventional Commits (No Scope)',
        description: 'Conventional Commits types without scopes (feat: ..., fix: ...)',
        example: 'feat: add OAuth2 integration',
        category: 'standard',
        isPro: true
    },
    {
        id: 'angular',
        label: 'Angular',
        description: 'Enterprise-grade with strict conventions',
        example: 'feat(core): add dependency injection support',
        category: 'framework',
        isPro: true
    },
    {
        id: 'ember',
        label: 'Ember.js',
        description: 'Tag-based semantic categorization',
        example: '[FEATURE] Add user profile management',
        category: 'framework',
        isPro: true
    },
    {
        id: 'emojigit',
        label: 'EmojiGit',
        description: 'Visual semantic commits with custom emojis',
        example: '✨ Add real-time chat functionality',
        category: 'emoji',
        isPro: true
    },
    {
        id: 'gitmoji',
        label: 'Gitmoji',
        description: 'Official gitmoji.dev specification',
        example: '✨ Add OAuth2 authentication system',
        category: 'emoji',
        isPro: true
    },
    {
        id: 'semantic',
        label: 'Semantic Release',
        description: 'Automated release-optimized commits',
        example: 'feat: add user profile management dashboard',
        category: 'standard',
        isPro: true
    },
    {
        id: 'commitizen',
        label: 'Commitizen',
        description: 'Interactive guided commits with validation',
        example: 'feat(dashboard): add real-time analytics widgets',
        category: 'enterprise',
        isPro: true
    },
    {
        id: 'karma',
        label: 'Karma (Google)',
        description: 'Google\'s strict enterprise convention',
        example: 'feat(auth): implement enterprise SSO integration',
        category: 'enterprise',
        isPro: true
    },
    {
        id: 'linux',
        label: 'Linux Kernel',
        description: 'Traditional kernel development convention',
        example: 'net: fix use-after-free in TCP socket cleanup',
        category: 'enterprise',
        isPro: true
    },
    {
        id: 'jquery',
        label: 'jQuery',
        description: 'JavaScript project convention with issue tracking',
        example: 'Core: Add ES6 modules support. Fixes #2841',
        category: 'framework',
        isPro: true
    }
];

export const getCommitStylesByCategory = () => {
    return COMMIT_STYLE_OPTIONS.reduce((acc, style) => {
        if (!acc[style.category]) {
            acc[style.category] = [];
        }
        acc[style.category].push(style);
        return acc;
    }, {} as Record<string, CommitStyleOption[]>);
};

export const getCommitStyleOption = (styleId: CommitStyle): CommitStyleOption | undefined => {
    return COMMIT_STYLE_OPTIONS.find(option => option.id === styleId);
};

export const getValidCommitStyles = (): CommitStyle[] => {
    return COMMIT_STYLE_OPTIONS.map(option => option.id);
};

export const getCommitStyleDisplayName = (style: CommitStyle): string => {
    const option = COMMIT_STYLE_OPTIONS.find(opt => opt.id === style);
    return option ? option.label : style;
};

export const validateCommitStyle = (style: string): style is CommitStyle => {
    return COMMIT_STYLE_OPTIONS.some(option => option.id === style);
};
