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
     * Detect version bumps from commit messages and file changes
     */
    private async detectVersionBumpsFromCommits(commits: GitCommit[]): Promise<VersionInfo[]> {
        const versions: VersionInfo[] = [];
        let currentVersionCommits: GitCommit[] = [];
        let currentVersion: string | null = null;
        let currentDate: string | null = null;

        for (let i = 0; i < commits.length; i++) {
            const commit = commits[i];

            // Check for version bump in commit message
            const versionMatch = commit.message.match(/(?:bump|update|release|version|chore|build).*?(?:to\s+)?v?(\d+\.\d+\.\d+(?:[.-]\w+)?)/i) ||
                                commit.body.match(/(?:bump|update|release|version|chore|build).*?(?:to\s+)?v?(\d+\.\d+\.\d+(?:[.-]\w+)?)/i);

            // Check for package.json version changes in commit
            const packageVersionMatch = commit.message.match(/package\.json.*?v?(\d+\.\d+\.\d+)/i) ||
                                       commit.body.match(/version.*?v?(\d+\.\d+\.\d+)/i);

            const detectedVersion = versionMatch?.[1] || packageVersionMatch?.[1];

            if (detectedVersion) {
                // Save previous version group if exists
                if (currentVersion && currentVersionCommits.length > 0) {
                    versions.push({
                        version: currentVersion,
                        date: currentDate || commit.date,
                        commits: [...currentVersionCommits]
                    });
                }

                // Start new version group
                currentVersion = detectedVersion;
                currentDate = commit.date;
                currentVersionCommits = [commit];
            } else {
                // Add to current version group
                currentVersionCommits.push(commit);
            }
        }

        // Add final version group
        if (currentVersion && currentVersionCommits.length > 0) {
            versions.push({
                version: currentVersion,
                date: currentDate || commits[0]?.date || new Date().toISOString().split('T')[0],
                commits: currentVersionCommits
            });
        } else if (currentVersionCommits.length > 0) {
            // If no version detected, create an "Unreleased" group
            versions.push({
                version: 'Unreleased',
                date: new Date().toISOString().split('T')[0],
                commits: currentVersionCommits
            });
        }

        return versions;
    }

    /**
     * Try to detect version from package.json file changes in a commit
     */
    private async getVersionFromPackageJson(commitHash: string): Promise<string | null> {
        if (!this.workspaceRoot) {
            return null;
        }

        try {
            // Get package.json content at this commit
            const { stdout } = await execAsync(
                `git show ${commitHash}:package.json`,
                { cwd: this.workspaceRoot }
            );

            const packageJson = JSON.parse(stdout);
            if (packageJson.version && /^\d+\.\d+\.\d+/.test(packageJson.version)) {
                return packageJson.version;
            }
        } catch (error) {
            // File doesn't exist or not valid JSON, that's okay
            debugLog(`Could not get package.json version for commit ${commitHash}:`, error);
        }

        return null;
    }

    /**
     * Get commits grouped by version
     */
    private async getCommitsByVersion(maxCommits?: number): Promise<VersionInfo[]> {
        const versionTags = await this.getVersionTags();

        // If we have git tags, use them
        if (versionTags.size > 0) {
            const versions: VersionInfo[] = [];
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

        // No git tags found, try to detect versions from commit messages and package.json
        debugLog('No git tags found, attempting to detect versions from commit messages...');
        const allCommits = await this.getGitLog(undefined, maxCommits);

        if (allCommits.length === 0) {
            return [];
        }

        // Enhance commits with package.json version detection
        const enhancedCommits = await this.enhanceCommitsWithPackageVersions(allCommits);

        // Detect version bumps from commit messages and package.json changes
        const versionsFromCommits = await this.detectVersionBumpsFromCommits(enhancedCommits);

        if (versionsFromCommits.length > 0) {
            debugLog(`Detected ${versionsFromCommits.length} versions from commit analysis`);
            return versionsFromCommits;
        }

        // Fallback: treat all commits as unreleased
        debugLog('No versions detected, treating all commits as unreleased');
        return [{
            version: 'Unreleased',
            date: new Date().toISOString().split('T')[0],
            commits: allCommits
        }];
    }

    /**
     * Enhance commits with package.json version information
     */
    private async enhanceCommitsWithPackageVersions(commits: GitCommit[]): Promise<GitCommit[]> {
        const enhanced: GitCommit[] = [];

        for (const commit of commits) {
            const packageVersion = await this.getVersionFromPackageJson(commit.hash);

            // If we found a version in package.json, add it to the commit body for detection
            if (packageVersion && !commit.body.includes(packageVersion)) {
                enhanced.push({
                    ...commit,
                    body: commit.body + `\nVersion: ${packageVersion}`
                });
            } else {
                enhanced.push(commit);
            }
        }

        return enhanced;
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
     * Analyze existing changelog to extract structure and policies
     */
    private analyzeChangelogStructure(changelog: string): {
        hasKeepAChangelogHeader: boolean;
        usesEmojis: boolean;
        categoriesUsed: string[];
        versionFormat: 'v1.2.3' | '1.2.3' | 'mixed';
        bulletStyle: '-' | '*' | '+' | 'mixed';
        hasDateFormat: boolean;
        indentationStyle: 'spaces' | 'none';
        customCategories: string[];
        hasBreakingChangesSection: boolean;
        hasTechnicalSection: boolean;
    } {
        const analysis = {
            hasKeepAChangelogHeader: /keep a changelog/i.test(changelog),
            usesEmojis: /[\u{1F300}-\u{1F9FF}]/u.test(changelog),
            categoriesUsed: [] as string[],
            versionFormat: 'mixed' as 'v1.2.3' | '1.2.3' | 'mixed',
            bulletStyle: '-' as '-' | '*' | '+' | 'mixed',
            hasDateFormat: /##\s+.*\d{4}-\d{2}-\d{2}/.test(changelog),
            indentationStyle: 'none' as 'spaces' | 'none',
            customCategories: [] as string[],
            hasBreakingChangesSection: /###\s+Breaking\s+Changes/i.test(changelog),
            hasTechnicalSection: /###\s+Technical/i.test(changelog)
        };

        // Detect version format
        const versionMatches = changelog.match(/##\s+(v?\d+\.\d+\.\d+)/g);
        if (versionMatches) {
            const withV = versionMatches.filter(v => /##\s+v\d/.test(v)).length;
            const withoutV = versionMatches.length - withV;
            if (withV > 0 && withoutV === 0) {
                analysis.versionFormat = 'v1.2.3';
            } else if (withoutV > 0 && withV === 0) {
                analysis.versionFormat = '1.2.3';
            }
        }

        // Detect bullet style
        const bullets = changelog.match(/^[-*+]\s/gm);
        if (bullets) {
            const dashCount = bullets.filter(b => b.startsWith('-')).length;
            const starCount = bullets.filter(b => b.startsWith('*')).length;
            const plusCount = bullets.filter(b => b.startsWith('+')).length;

            if (dashCount > starCount && dashCount > plusCount) {
                analysis.bulletStyle = '-';
            } else if (starCount > dashCount && starCount > plusCount) {
                analysis.bulletStyle = '*';
            } else if (plusCount > dashCount && plusCount > starCount) {
                analysis.bulletStyle = '+';
            }
        }

        // Detect categories
        const standardCategories = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security', 'Technical', 'Breaking Changes'];
        const categoryMatches = changelog.match(/###\s+([^\n]+)/g);
        if (categoryMatches) {
            const categories = categoryMatches.map(m => m.replace(/###\s+/, '').trim());
            analysis.categoriesUsed = [...new Set(categories)];

            // Find custom categories (not in standard list)
            analysis.customCategories = categories.filter(
                cat => !standardCategories.some(std => std.toLowerCase() === cat.toLowerCase())
            );
        }

        // Detect indentation
        const indentedBullets = changelog.match(/^\s{2,}[-*+]\s/gm);
        if (indentedBullets && indentedBullets.length > 0) {
            analysis.indentationStyle = 'spaces';
        }

        return analysis;
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

        // Analyze existing changelog structure if it exists
        const changelogPolicy = existingChangelog
            ? this.analyzeChangelogStructure(existingChangelog)
            : null;

        // Generate changelog using AI
        const apiConfig = await getApiConfig();
        const prompt = this.buildChangelogPrompt(commitSummary, existingChangelog, changelogPolicy);

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
    private buildChangelogPrompt(
        commitSummary: string,
        existingChangelog: string | null,
        policy: ReturnType<typeof this.analyzeChangelogStructure> | null
    ): string {
        // Build policy-aware instructions
        let policyInstructions = '';

        if (policy) {
            policyInstructions = `\n**EXISTING CHANGELOG POLICY (MUST FOLLOW EXACTLY):**\n`;

            // Version format
            if (policy.versionFormat === 'v1.2.3') {
                policyInstructions += `- Version format: Use "v" prefix (e.g., v4.3.0, v1.2.3)\n`;
            } else if (policy.versionFormat === '1.2.3') {
                policyInstructions += `- Version format: NO "v" prefix (e.g., 4.3.0, 1.2.3)\n`;
            }

            // Bullet style
            policyInstructions += `- Bullet points: Use "${policy.bulletStyle}" for all list items\n`;

            // Date format
            if (policy.hasDateFormat) {
                policyInstructions += `- Date format: Include date in YYYY-MM-DD format after version (## Version - YYYY-MM-DD)\n`;
            }

            // Emojis
            if (policy.usesEmojis) {
                policyInstructions += `- Emojis: This changelog DOES use emojis - match the existing style\n`;
            } else {
                policyInstructions += `- Emojis: This changelog does NOT use emojis - do not add any\n`;
            }

            // Categories
            if (policy.categoriesUsed.length > 0) {
                policyInstructions += `- Categories used: ${policy.categoriesUsed.join(', ')}\n`;
                policyInstructions += `- ONLY use these categories that already exist in the changelog\n`;
            }

            // Custom categories
            if (policy.customCategories.length > 0) {
                policyInstructions += `- Custom categories found: ${policy.customCategories.join(', ')}\n`;
                policyInstructions += `- Include these custom categories if relevant\n`;
            }

            // Breaking changes
            if (policy.hasBreakingChangesSection) {
                policyInstructions += `- Breaking Changes: Include "### Breaking Changes" section if applicable\n`;
            }

            // Technical section
            if (policy.hasTechnicalSection) {
                policyInstructions += `- Technical: Include "### Technical" section for build/infrastructure changes\n`;
            }

            // Indentation
            if (policy.indentationStyle === 'spaces') {
                policyInstructions += `- Indentation: Use 2 spaces for nested bullet points\n`;
            }

            policyInstructions += `\n**CRITICAL: The existing changelog has an established structure and style. You MUST match it EXACTLY. Do not introduce new categories, bullet styles, or formatting that doesn't already exist.**\n`;
        }

        return `You are a professional technical writer specializing in software release documentation. Generate a changelog entry based on the provided git commit history.

**CRITICAL REQUIREMENTS:**
1. Follow industry-standard changelog format (Keep a Changelog specification)
2. Be factual, specific, and concise - avoid marketing language or superlatives
3. ${policy?.usesEmojis ? 'Match the emoji usage from the existing changelog' : 'NO emojis, exclamation marks, or casual language'}
4. Focus on WHAT changed, not WHY or HOW (implementation details belong in commit messages)
5. Group changes by category: ${policy?.categoriesUsed.length ? policy.categoriesUsed.join(', ') : 'Added, Changed, Deprecated, Removed, Fixed, Security, Technical'}
6. Use past tense for all entries (e.g., "Added feature" not "Add feature")
7. Each entry should be a single, clear statement starting with a verb
8. Avoid phrases like "improved performance" without specifics
9. Include technical details where relevant (file names, API endpoints, configuration keys)
10. Maintain professional tone suitable for enterprise documentation
${policyInstructions}
**DEFAULT FORMAT STRUCTURE (if no existing changelog):**
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

${existingChangelog ? `\n**EXISTING CHANGELOG FOR REFERENCE (MUST match this EXACT style and structure):**\n${existingChangelog.substring(0, 5000)}\n` : ''}

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
- ${policy ? 'STRICTLY adhere to the existing changelog policy and structure outlined above' : 'Use industry-standard Keep a Changelog format'}

**OUTPUT REQUIREMENTS:**
- Generate ONLY the changelog section for the new version(s)
- Use proper markdown formatting matching existing style
- ${policy?.versionFormat === 'v1.2.3' ? 'Include "v" prefix in version (e.g., ## v4.3.0)' : policy?.versionFormat === '1.2.3' ? 'NO "v" prefix in version (e.g., ## 4.3.0)' : 'Start with version number and date'}
- ${policy?.bulletStyle ? `Use "${policy.bulletStyle}" for all bullet points` : 'Use consistent bullet style'}
- NO introductory text, explanations, or meta-commentary
- NO placeholder text or template instructions
- Entries must be concrete and based on actual commits
- If multiple versions detected, generate entries for each in reverse chronological order
- Match the existing changelog's tone, style, and structure EXACTLY

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
