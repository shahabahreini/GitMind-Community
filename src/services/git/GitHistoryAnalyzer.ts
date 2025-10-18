import { debugLog } from '../debug/logger';
import { executeGitCommand } from '../../utils/gitCommands';

export interface CommitData {
    hash: string;
    author: string;
    email: string;
    date: string;
    subject: string;
    body: string;
    filesChanged: number;
    insertions: number;
    deletions: number;
}

export interface GitHistoryStats {
    totalCommits: number;
    actualCommitsFound: number;
    estimatedTokens: number;
    averageMessageLength: number;
    uniqueAuthors: number;
    dateRange: {
        oldest: string;
        newest: string;
    };
    conventionalCommits: number;
    conventionalCommitPercentage: number;
    filesChangedStats: {
        total: number;
        average: number;
        max: number;
    };
    warnings: string[];
    recommendations: string[];
    topAuthors: Array<{ name: string; count: number }>;
    commitTypes: Record<string, number>;
    hasVersionTags: boolean;
    versionTagCount: number;
}

/**
 * Service to analyze git history and provide statistics
 */
export class GitHistoryAnalyzer {
    /**
     * Analyze git history and return comprehensive statistics
     */
    public static async analyzeHistory(
        maxCommits: number,
        includeAuthorInfo: boolean = true
    ): Promise<GitHistoryStats> {
        try {
            debugLog(`Analyzing git history with maxCommits: ${maxCommits}, includeAuthorInfo: ${includeAuthorInfo}`);

            // Get commit data
            const commits = await this.getDetailedCommits(maxCommits);
            
            if (commits.length === 0) {
                throw new Error('No commits found in repository');
            }

            // Calculate statistics
            const stats = this.calculateStats(commits, maxCommits, includeAuthorInfo);
            
            debugLog('Git history analysis complete:', stats);
            return stats;
        } catch (error) {
            debugLog('Git history analysis failed:', error);
            throw error;
        }
    }

    /**
     * Get detailed commit information
     */
    private static async getDetailedCommits(maxCommits: number): Promise<CommitData[]> {
        try {
            // Format: hash|author|email|date|subject|body|stats
            const format = '%H|%an|%ae|%ai|%s|%b|';
            const { stdout } = await executeGitCommand(
                `git log -${maxCommits} --pretty=format:"${format}" --numstat`
            );

            return this.parseCommitData(stdout);
        } catch (error) {
            debugLog('Failed to get detailed commits:', error);
            throw new Error('Failed to retrieve commit history');
        }
    }

    /**
     * Parse raw git log output into structured commit data
     */
    private static parseCommitData(output: string): CommitData[] {
        const commits: CommitData[] = [];
        const lines = output.split('\n');
        let currentCommit: Partial<CommitData> | null = null;
        let filesChanged = 0;
        let insertions = 0;
        let deletions = 0;

        for (const line of lines) {
            if (line.includes('|')) {
                // Save previous commit if exists
                if (currentCommit) {
                    commits.push({
                        ...currentCommit,
                        filesChanged,
                        insertions,
                        deletions,
                    } as CommitData);
                }

                // Parse new commit header
                const parts = line.split('|');
                if (parts.length >= 6) {
                    currentCommit = {
                        hash: parts[0],
                        author: parts[1],
                        email: parts[2],
                        date: parts[3],
                        subject: parts[4],
                        body: parts[5] || '',
                    };
                    filesChanged = 0;
                    insertions = 0;
                    deletions = 0;
                }
            } else if (line.trim() && currentCommit) {
                // Parse numstat line (insertions, deletions, filename)
                const statParts = line.trim().split(/\s+/);
                if (statParts.length >= 2) {
                    const ins = parseInt(statParts[0]) || 0;
                    const del = parseInt(statParts[1]) || 0;
                    if (!isNaN(ins) && !isNaN(del)) {
                        filesChanged++;
                        insertions += ins;
                        deletions += del;
                    }
                }
            }
        }

        // Add last commit
        if (currentCommit) {
            commits.push({
                ...currentCommit,
                filesChanged,
                insertions,
                deletions,
            } as CommitData);
        }

        return commits;
    }

    /**
     * Calculate comprehensive statistics from commits
     */
    private static async calculateStats(
        commits: CommitData[],
        requestedCount: number,
        includeAuthorInfo: boolean
    ): Promise<GitHistoryStats> {
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Basic counts
        const actualCommitsFound = commits.length;
        if (actualCommitsFound < requestedCount) {
            warnings.push(
                `Only ${actualCommitsFound} commits found (requested ${requestedCount}). Repository may have limited history.`
            );
        }

        // Token estimation (rough approximation: 1 token ≈ 4 characters)
        let totalChars = 0;
        commits.forEach(commit => {
            totalChars += commit.subject.length;
            totalChars += commit.body.length;
            if (includeAuthorInfo) {
                totalChars += commit.author.length + commit.email.length;
            }
        });
        const estimatedTokens = Math.ceil(totalChars / 4);

        // Message length analysis
        const messageLengths = commits.map(c => c.subject.length + c.body.length);
        const averageMessageLength = Math.round(
            messageLengths.reduce((a, b) => a + b, 0) / commits.length
        );

        if (averageMessageLength < 20) {
            warnings.push('Commit messages are very short. This may limit AI analysis quality.');
            recommendations.push('Consider using more descriptive commit messages in the future.');
        }

        // Author analysis
        const authorMap = new Map<string, number>();
        commits.forEach(commit => {
            const count = authorMap.get(commit.author) || 0;
            authorMap.set(commit.author, count + 1);
        });
        const uniqueAuthors = authorMap.size;
        const topAuthors = Array.from(authorMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        if (uniqueAuthors === 1) {
            recommendations.push('Single author detected. Analysis will focus on individual style.');
        }

        // Date range
        const dates = commits.map(c => new Date(c.date));
        const oldest = new Date(Math.min(...dates.map(d => d.getTime())));
        const newest = new Date(Math.max(...dates.map(d => d.getTime())));

        // Conventional commit analysis
        const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?:/;
        let conventionalCommits = 0;
        const commitTypes: Record<string, number> = {};

        commits.forEach(commit => {
            const match = commit.subject.match(conventionalPattern);
            if (match) {
                conventionalCommits++;
                const type = match[1];
                commitTypes[type] = (commitTypes[type] || 0) + 1;
            }
        });

        const conventionalCommitPercentage = Math.round(
            (conventionalCommits / commits.length) * 100
        );

        if (conventionalCommitPercentage < 30) {
            warnings.push(
                `Only ${conventionalCommitPercentage}% of commits follow conventional format. AI may have difficulty categorizing changes.`
            );
            recommendations.push('Consider adopting Conventional Commits format for better changelog generation.');
        } else if (conventionalCommitPercentage > 70) {
            recommendations.push('Good use of conventional commits! This will improve AI analysis quality.');
        }

        // Files changed statistics
        const filesChangedCounts = commits.map(c => c.filesChanged);
        const totalFilesChanged = filesChangedCounts.reduce((a, b) => a + b, 0);
        const averageFilesChanged = Math.round(totalFilesChanged / commits.length);
        const maxFilesChanged = Math.max(...filesChangedCounts);

        if (averageFilesChanged > 20) {
            warnings.push('Large number of files changed per commit. Consider more focused commits.');
        }

        // Token budget warnings
        if (estimatedTokens > 100000) {
            warnings.push(
                `Estimated ${estimatedTokens.toLocaleString()} tokens. This may exceed API limits or be costly.`
            );
            recommendations.push(`Consider reducing max commits to ${Math.floor(requestedCount / 2)} or less.`);
        } else if (estimatedTokens > 50000) {
            warnings.push(`Estimated ${estimatedTokens.toLocaleString()} tokens. This may be expensive.`);
        }

        if (estimatedTokens < 500) {
            warnings.push('Very few tokens detected. Analysis may lack sufficient data.');
            recommendations.push('Consider increasing the number of commits to analyze.');
        }

        // Check for version tags
        const hasVersionTags = await this.checkForVersionTags();
        const versionTagCount = hasVersionTags ? await this.getVersionTagCount() : 0;

        if (!hasVersionTags) {
            recommendations.push('No version tags found. Consider using semantic versioning tags for better changelog organization.');
        }

        return {
            totalCommits: requestedCount,
            actualCommitsFound,
            estimatedTokens,
            averageMessageLength,
            uniqueAuthors,
            dateRange: {
                oldest: oldest.toISOString().split('T')[0],
                newest: newest.toISOString().split('T')[0],
            },
            conventionalCommits,
            conventionalCommitPercentage,
            filesChangedStats: {
                total: totalFilesChanged,
                average: averageFilesChanged,
                max: maxFilesChanged,
            },
            warnings,
            recommendations,
            topAuthors,
            commitTypes,
            hasVersionTags,
            versionTagCount,
        };
    }

    /**
     * Check if repository has version tags
     */
    private static async checkForVersionTags(): Promise<boolean> {
        try {
            const { stdout } = await executeGitCommand('git tag -l "v*"');
            return stdout.trim().length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Get count of version tags
     */
    private static async getVersionTagCount(): Promise<number> {
        try {
            const { stdout } = await executeGitCommand('git tag -l "v*"');
            return stdout.trim().split('\n').filter((t: string) => t.trim()).length;
        } catch {
            return 0;
        }
    }
}
