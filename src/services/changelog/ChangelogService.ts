import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { debugLog } from '../debug/logger';
import { generateCommitMessage } from '../api';
import { getApiConfig } from '../../config/settings';

const execAsync = promisify(exec);

interface VersionInfo {
    version: string;
    date: string;
    commits: GitCommit[];
}

interface GitCommit {
    hash: string;
    author: string;
    date: string;
    message: string;
    body: string;
}

interface ChangelogConfig {
    sinceVersion?: string;
    maxCommits?: number;
    includeAllCommits?: boolean;
    groupByVersion?: boolean;
}

export class ChangelogService {
    private static instance: ChangelogService;
    private workspaceRoot: string | undefined;

    private constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }

    public static getInstance(): ChangelogService {
        if (!ChangelogService.instance) {
            ChangelogService.instance = new ChangelogService();
        }
        return ChangelogService.instance;
    }

    /**
     * Check if changelog generation is available
     */
    public isFeatureAvailable(): boolean {
        const config = vscode.workspace.getConfiguration('gitmind');
        return config.get<boolean>('pro.changelog.enabled', true);
    }

    /**
     * Get git log with detailed information
     */
    private async getGitLog(since?: string, maxCommits?: number): Promise<GitCommit[]> {
        if (!this.workspaceRoot) {
            throw new Error('No workspace folder found');
        }

        // Build git log command
        let command = 'git log --pretty=format:"%H%n%an%n%ad%n%s%n%b%n---END---" --date=short';

        if (since) {
            command += ` ${since}..HEAD`;
        }

        if (maxCommits) {
            command += ` -n ${maxCommits}`;
        }

        try {
            const { stdout } = await execAsync(command, {
                cwd: this.workspaceRoot,
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });

            return this.parseGitLog(stdout);
        } catch (error) {
            debugLog('Failed to get git log:', error);
            throw new Error('Failed to retrieve git history. Ensure this is a valid git repository.');
        }
    }

    /**
     * Parse git log output into structured commits
     */
    private parseGitLog(logOutput: string): GitCommit[] {
        const commits: GitCommit[] = [];
        const commitBlocks = logOutput.split('---END---').filter(block => block.trim());

        for (const block of commitBlocks) {
            const lines = block.trim().split('\n');
            if (lines.length < 4) {
                continue;
            }

            const [hash, author, date, message, ...bodyLines] = lines;
            commits.push({
                hash: hash.trim(),
                author: author.trim(),
                date: date.trim(),
                message: message.trim(),
                body: bodyLines.join('\n').trim()
            });
        }

        return commits;
    }

    /**
     * Detect version tags in git history
     */
    private async getVersionTags(): Promise<Map<string, string>> {
        if (!this.workspaceRoot) {
            throw new Error('No workspace folder found');
        }

        try {
            const { stdout } = await execAsync(
                'git tag --sort=-version:refname --format="%(refname:short)|%(creatordate:short)"',
                { cwd: this.workspaceRoot }
            );

            const versionMap = new Map<string, string>();
            const lines = stdout.trim().split('\n').filter(line => line);

            for (const line of lines) {
                const [tag, date] = line.split('|');
                // Match version patterns: v1.2.3, 1.2.3, v1.2.3-beta, etc.
                if (/^v?\d+\.\d+\.\d+/.test(tag)) {
                    versionMap.set(tag, date);
                }
            }

            return versionMap;
        } catch (error) {
            debugLog('Failed to get version tags:', error);
            return new Map(); // Return empty map if no tags found
        }
    }

    /**
     * Get commits grouped by version
     */
    private async getCommitsByVersion(maxCommits?: number): Promise<VersionInfo[]> {
        const versionTags = await this.getVersionTags();
        const versions: VersionInfo[] = [];

        if (versionTags.size === 0) {
            // No version tags, treat all commits as unreleased
            const commits = await this.getGitLog(undefined, maxCommits);
            return [{
                version: 'Unreleased',
                date: new Date().toISOString().split('T')[0],
                commits
            }];
        }

        const sortedTags = Array.from(versionTags.entries())
            .sort((a, b) => this.compareVersions(b[0], a[0]));

        for (let i = 0; i < sortedTags.length; i++) {
            const [version, date] = sortedTags[i];
            const nextVersion = i < sortedTags.length - 1 ? sortedTags[i + 1][0] : undefined;

            try {
                const commits = await this.getGitLog(nextVersion, maxCommits);
                if (commits.length > 0) {
                    versions.push({ version, date, commits });
                }
            } catch (error) {
                debugLog(`Failed to get commits for version ${version}:`, error);
            }

            if (maxCommits && versions.reduce((sum, v) => sum + v.commits.length, 0) >= maxCommits) {
                break;
            }
        }

        return versions;
    }

    /**
     * Compare semantic version strings
     */
    private compareVersions(a: string, b: string): number {
        const cleanA = a.replace(/^v/, '').split(/[.-]/);
        const cleanB = b.replace(/^v/, '').split(/[.-]/);

        for (let i = 0; i < Math.max(cleanA.length, cleanB.length); i++) {
            const numA = parseInt(cleanA[i] || '0', 10);
            const numB = parseInt(cleanB[i] || '0', 10);

            if (numA !== numB) {
                return numA - numB;
            }
        }

        return 0;
    }

    /**
     * Read existing CHANGELOG.md if it exists
     */
    private async readExistingChangelog(): Promise<string | null> {
        if (!this.workspaceRoot) {
            return null;
        }

        try {
            const changelogUri = vscode.Uri.file(`${this.workspaceRoot}/CHANGELOG.md`);
            const content = await vscode.workspace.fs.readFile(changelogUri);
            return Buffer.from(content).toString('utf8');
        } catch (error) {
            debugLog('No existing CHANGELOG.md found or error reading it:', error);
            return null;
        }
    }

    /**
     * Extract latest version from existing changelog
     */
    private extractLatestVersionFromChangelog(changelog: string): string | null {
        const versionMatch = changelog.match(/##\s+(v?\d+\.\d+\.\d+[^\n]*)/);
        return versionMatch ? versionMatch[1].trim() : null;
    }

    /**
     * Generate changelog using AI
     */
    public async generateChangelog(config: ChangelogConfig = {}): Promise<string> {
        debugLog('Starting changelog generation with config:', config);

        const existingChangelog = await this.readExistingChangelog();
        const latestVersion = existingChangelog
            ? this.extractLatestVersionFromChangelog(existingChangelog)
            : null;

        const sinceVersion = config.sinceVersion || latestVersion || undefined;
        const maxCommits = config.maxCommits || 100;

        let versionGroups: VersionInfo[];

        if (config.groupByVersion !== false) {
            versionGroups = await this.getCommitsByVersion(maxCommits);
        } else {
            const commits = await this.getGitLog(sinceVersion, maxCommits);
            versionGroups = [{
                version: 'Recent Changes',
                date: new Date().toISOString().split('T')[0],
                commits
            }];
        }

        if (versionGroups.length === 0 || versionGroups.every(v => v.commits.length === 0)) {
            throw new Error('No commits found to generate changelog from.');
        }

        debugLog(`Found ${versionGroups.length} version groups with total commits:`,
            versionGroups.reduce((sum, v) => sum + v.commits.length, 0));

        // Prepare context for AI
        const commitSummary = this.prepareCommitSummary(versionGroups);

        // Generate changelog using AI
        const apiConfig = await getApiConfig();
        const prompt = this.buildChangelogPrompt(commitSummary, existingChangelog);

        debugLog('Calling AI API for changelog generation...');

        try {
            // Use the diff parameter to pass our prompt since generateCommitMessage
            // is designed for commit messages, we're repurposing it for changelog generation
            const changelog = await generateCommitMessage(
                apiConfig,
                prompt, // Using diff parameter for our changelog prompt
                '', // No custom context needed
                this.workspaceRoot // Pass repository root
            );

            return this.formatChangelog(changelog, existingChangelog);
        } catch (error) {
            debugLog('AI changelog generation failed:', error);
            throw new Error(`Failed to generate changelog: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Prepare commit summary for AI processing
     */
    private prepareCommitSummary(versionGroups: VersionInfo[]): string {
        let summary = '';

        for (const group of versionGroups) {
            summary += `\n## Version: ${group.version} (${group.date})\n`;
            summary += `Total commits: ${group.commits.length}\n\n`;

            for (const commit of group.commits) {
                summary += `### Commit: ${commit.hash.substring(0, 7)}\n`;
                summary += `Date: ${commit.date}\n`;
                summary += `Author: ${commit.author}\n`;
                summary += `Message: ${commit.message}\n`;

                if (commit.body && commit.body.trim()) {
                    summary += `Details:\n${commit.body}\n`;
                }

                summary += '\n---\n\n';
            }
        }

        return summary;
    }

    /**
     * Build professional changelog generation prompt
     */
    private buildChangelogPrompt(commitSummary: string, existingChangelog: string | null): string {
        return `You are a professional technical writer specializing in software release documentation. Generate a changelog entry based on the provided git commit history.

**CRITICAL REQUIREMENTS:**
1. Follow industry-standard changelog format (Keep a Changelog specification)
2. Be factual, specific, and concise - avoid marketing language or superlatives
3. NO emojis, exclamation marks, or casual language
4. Focus on WHAT changed, not WHY or HOW (implementation details belong in commit messages)
5. Group changes by category: Added, Changed, Deprecated, Removed, Fixed, Security
6. Use past tense for all entries (e.g., "Added feature" not "Add feature")
7. Each entry should be a single, clear statement starting with a verb
8. Avoid phrases like "improved performance" without specifics
9. Include technical details where relevant (file names, API endpoints, configuration keys)
10. Maintain professional tone suitable for enterprise documentation

**FORMAT STRUCTURE:**
## [Version] - YYYY-MM-DD

### Added
- New feature descriptions with technical details

### Changed
- Modifications to existing functionality

### Deprecated
- Features marked for future removal

### Removed
- Features removed in this version

### Fixed
- Bug fixes and corrections

### Security
- Security-related changes

### Technical
- Build system, dependencies, internal refactoring (if relevant to users)

**COMMIT HISTORY TO ANALYZE:**
${commitSummary}

${existingChangelog ? `\n**EXISTING CHANGELOG FOR REFERENCE (maintain this style and format):**\n${existingChangelog.substring(0, 5000)}\n` : ''}

**ANALYSIS GUIDELINES:**
- Examine commit messages for conventional commit prefixes (feat:, fix:, chore:, etc.)
- Detect breaking changes from commit messages or version bumps
- Group related commits into single changelog entries
- Filter out trivial commits (typo fixes, formatting, etc.) unless they fix user-facing issues
- Identify version numbers from commit messages, tags, or package.json updates
- For merge commits, extract the meaningful changes from the merged branch
- Prioritize user-facing changes over internal refactoring
- Include performance improvements only if quantifiable or significant
- Document API changes, configuration changes, and migration requirements

**OUTPUT REQUIREMENTS:**
- Generate ONLY the changelog section for the new version(s)
- Use proper markdown formatting
- Start with version number and date
- NO introductory text, explanations, or meta-commentary
- NO placeholder text or template instructions
- Entries must be concrete and based on actual commits
- If multiple versions detected, generate entries for each in reverse chronological order

Generate the changelog now:`;
    }

    /**
     * Format and clean the AI-generated changelog
     */
    private formatChangelog(aiResponse: string, existingChangelog: string | null): string {
        // Clean up the response
        let changelog = aiResponse.trim();

        // Remove any markdown code blocks if AI wrapped the response
        changelog = changelog.replace(/```markdown\n?/g, '').replace(/```\n?/g, '');

        // Ensure it starts with # Changelog if it's a new file
        if (!existingChangelog && !changelog.startsWith('# Changelog')) {
            changelog = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n${changelog}`;
        }

        // Clean up excessive newlines
        changelog = changelog.replace(/\n{4,}/g, '\n\n\n');

        return changelog;
    }

    /**
     * Save changelog to CHANGELOG.md
     */
    public async saveChangelog(content: string, mode: 'create' | 'update' | 'prepend'): Promise<void> {
        if (!this.workspaceRoot) {
            throw new Error('No workspace folder found');
        }

        const changelogUri = vscode.Uri.file(`${this.workspaceRoot}/CHANGELOG.md`);

        try {
            let finalContent = content;

            if (mode === 'update' || mode === 'prepend') {
                const existing = await this.readExistingChangelog();

                if (mode === 'prepend' && existing) {
                    // Extract header if exists
                    const headerMatch = existing.match(/(# Changelog[\s\S]*?)(##\s+)/);
                    if (headerMatch) {
                        const header = headerMatch[1];
                        const restOfChangelog = existing.substring(headerMatch[0].length - 3);

                        // Remove header from new content if it exists
                        const newContent = content.replace(/# Changelog[\s\S]*?(##\s+)/, '$1');

                        finalContent = `${header}\n${newContent}\n${restOfChangelog}`;
                    } else {
                        finalContent = `${content}\n\n${existing}`;
                    }
                } else if (mode === 'update' && existing) {
                    // For update mode, the AI should have generated content that can replace sections
                    finalContent = content;
                }
            }

            await vscode.workspace.fs.writeFile(changelogUri, Buffer.from(finalContent, 'utf8'));
            debugLog('Changelog saved successfully to CHANGELOG.md');

        } catch (error) {
            debugLog('Failed to save changelog:', error);
            throw new Error('Failed to save changelog file');
        }
    }
}
