import * as vscode from 'vscode';
import { debugLog } from '../debug/logger';
import { isProUser } from '../../utils/proHelpers';
import { exec } from 'child_process';
import { promisify } from 'util';
import { generateCommitHistoryAnalysis } from '../api/index';
import { getApiConfig } from '../../config/settings';

const execAsync = promisify(exec);

export interface CommitInfo {
    hash: string;
    message: string;
    author?: string;
    date?: string;
}

export class CommitHistoryLearningService {
    private static instance: CommitHistoryLearningService;

    private constructor() { }

    public static getInstance(): CommitHistoryLearningService {
        if (!CommitHistoryLearningService.instance) {
            CommitHistoryLearningService.instance = new CommitHistoryLearningService();
        }
        return CommitHistoryLearningService.instance;
    }

    /**
     * Check if the Learn from Commit History feature is available
     */
    public isFeatureAvailable(): boolean {
        // Check if user is pro
        const isPro = isProUser();

        // Check if feature is enabled in settings
        const config = vscode.workspace.getConfiguration('gitmind');
        const featureEnabled = config.get<boolean>('pro.learnFromCommitHistory.enabled', false);

        return isPro && featureEnabled;
    }

    /**
     * Get commit messages history
     */
    public async getCommitMessages(maxCommits: number = 50, includeAuthorInfo: boolean = true): Promise<CommitInfo[]> {
        if (!this.isFeatureAvailable()) {
            throw new Error('This feature is only available for GitMind Pro users.');
        }

        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const repoPath = workspaceFolder.uri.fsPath;

            // Format for git log command to capture full commit messages (including multi-line)
            // Using %B instead of %s to get the complete commit message body
            // Using a custom separator that's unlikely to appear in commit messages
            const separator = '|||COMMIT_SEPARATOR|||';
            const format = includeAuthorInfo
                ? `--pretty=format:"%H|%B|%an|%ad${separator}"`
                : `--pretty=format:"%H|%B${separator}"`;

            const gitCommand = `git log ${format} --date=short -n ${maxCommits}`;

            debugLog(`[CommitHistory] Executing git command: ${gitCommand}`);

            const { stdout } = await execAsync(gitCommand, {
                cwd: repoPath,
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer to handle large git outputs
            });

            if (!stdout.trim()) {
                return [];
            }

            const commits: CommitInfo[] = stdout
                .trim()
                .split(separator)
                .filter(entry => entry.trim().length > 0)
                .map(entry => {
                    const lines = entry.trim().split('\n');
                    if (lines.length === 0) {
                        return null;
                    }

                    const firstLine = lines[0];
                    const parts = firstLine.split('|');

                    if (parts.length < 2) {
                        return null;
                    }

                    const commit: CommitInfo = {
                        hash: parts[0],
                        message: parts[1] || ''
                    };

                    // If there are more lines after the first one, they are part of the commit message
                    if (lines.length > 1) {
                        // Join all lines from index 1 onwards and add to the message
                        const additionalLines = lines.slice(1).join('\n');
                        commit.message = commit.message + '\n' + additionalLines;
                    }

                    if (includeAuthorInfo && parts.length >= 4) {
                        commit.author = parts[2];
                        commit.date = parts[3];
                    }

                    return commit;
                })
                .filter((commit): commit is CommitInfo => commit !== null && commit.message.trim().length > 0);

            debugLog(`[CommitHistory] Retrieved ${commits.length} commits`);
            return commits;

        } catch (error) {
            debugLog('[CommitHistory] Error getting commit messages:', error);
            throw error;
        }
    }

    /**
     * Analyze commit messages using the configured AI provider
     */
    public async analyzeCommitMessages(
        maxCommits: number = 50,
        includeAuthorInfo: boolean = true
    ): Promise<string> {
        const analysisId = Date.now(); // Unique ID for this analysis
        debugLog(`[CommitHistory-${analysisId}] Starting commit history analysis`);

        if (!this.isFeatureAvailable()) {
            throw new Error('This feature is only available for GitMind Pro users.');
        }

        try {
            // Get commit messages
            const commits = await this.getCommitMessages(maxCommits, includeAuthorInfo);

            if (commits.length === 0) {
                return 'No commit messages found in the repository.';
            }

            // Format commit history for analysis
            let commitHistory = '';
            commits.forEach((commit, index) => {
                commitHistory += `${index + 1}. ${commit.message}`;
                if (includeAuthorInfo && commit.author && commit.date) {
                    commitHistory += ` (by ${commit.author} on ${commit.date})`;
                }
                commitHistory += '\n';
            });

            debugLog(`[CommitHistory-${analysisId}] Formatted ${commits.length} commits for analysis`);

            // Log the complete commit history being sent for analysis
            debugLog(`[CommitHistory-${analysisId}] ==================== COMMIT HISTORY CONTENT ====================`);
            debugLog(`[CommitHistory-${analysisId}] Complete commit history being sent to AI provider:`);
            debugLog(commitHistory);
            debugLog(`[CommitHistory-${analysisId}] ================================================================`);

            // Get the current API configuration
            const apiConfig = await getApiConfig();
            if (!apiConfig) {
                throw new Error('No API provider configured. Please configure an API provider in settings.');
            }

            debugLog(`[CommitHistory-${analysisId}] Using API provider: ${apiConfig.type}`);

            debugLog(`[CommitHistory-${analysisId}] Starting commit history analysis with dedicated function...`);

            // Use the dedicated commit history analysis function
            const result = await generateCommitHistoryAnalysis(
                apiConfig,
                commitHistory,
                maxCommits,
                includeAuthorInfo
            );

            debugLog(`[CommitHistory-${analysisId}] Analysis completed successfully`);
            return result;

        } catch (error) {
            debugLog(`[CommitHistory-${analysisId}] Error analyzing commit messages:`, error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to analyze commit messages: ${errorMessage}`);
        }
    }
}