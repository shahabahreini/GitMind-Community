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
    subject: string;  // Commit summary/title only
    body?: string;    // Optional commit body (first few lines)
    author?: string;
    date?: string;
    timestamp?: number; // Unix timestamp for sorting/analysis
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
     * Get optimized commit history with only essential information
     */
    public async getCommitMessages(maxCommits: number = 10, includeAuthorInfo: boolean = true): Promise<CommitInfo[]> {
        if (!this.isFeatureAvailable()) {
            throw new Error('This feature is only available for GitMind Pro users.');
        }

        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const repoPath = workspaceFolder.uri.fsPath;

            // Optimized git command to get only essential commit information:
            // %H = full hash, %s = subject (summary), %b = body, %an = author, %at = timestamp, %ad = date
            // We'll parse subject and body separately for better control
            const separator = '|||COMMIT_SEP|||';
            const bodySeparator = '|||BODY_SEP|||';
            
            const format = includeAuthorInfo
                ? `--pretty=format:"%H|%s${bodySeparator}%b|%an|%ad|%at${separator}"`
                : `--pretty=format:"%H|%s${bodySeparator}%b|%at${separator}"`;

            const gitCommand = `git log ${format} --date=short -n ${maxCommits}`;

            debugLog(`[CommitHistory] Executing optimized git command: ${gitCommand}`);

            const { stdout } = await execAsync(gitCommand, {
                cwd: repoPath,
                maxBuffer: 5 * 1024 * 1024 // Reduced buffer since we're getting less data
            });

            if (!stdout.trim()) {
                return [];
            }

            const commits: CommitInfo[] = stdout
                .trim()
                .split(separator)
                .filter(entry => entry.trim().length > 0)
                .map(entry => {
                    const parts = entry.trim().split('|');
                    
                    if (parts.length < 3) {
                        return null;
                    }

                    // Parse subject and body from the second part
                    const subjectAndBody = parts[1].split(bodySeparator);
                    const subject = subjectAndBody[0]?.trim() || '';
                    const rawBody = subjectAndBody[1]?.trim() || '';
                    
                    // Limit body to first 3 lines to keep it concise
                    const bodyLines = rawBody.split('\n').filter(line => line.trim().length > 0);
                    const body = bodyLines.length > 0 ? bodyLines.slice(0, 3).join('\n') : undefined;

                    const commit: CommitInfo = {
                        hash: parts[0].substring(0, 8), // Short hash for efficiency
                        subject: subject
                    };

                    // Only include body if it exists and adds value
                    if (body && body !== subject) {
                        commit.body = body;
                    }

                    if (includeAuthorInfo && parts.length >= 5) {
                        commit.author = parts[2];
                        commit.date = parts[3];
                        commit.timestamp = parseInt(parts[4], 10);
                    } else if (!includeAuthorInfo && parts.length >= 3) {
                        commit.timestamp = parseInt(parts[2], 10);
                    }

                    return commit;
                })
                .filter((commit): commit is CommitInfo => commit !== null && commit.subject.trim().length > 0);

            debugLog(`[CommitHistory] Retrieved ${commits.length} optimized commits`);
            return commits;

        } catch (error) {
            debugLog('[CommitHistory] Error getting commit messages:', error);
            throw error;
        }
    }

    /**
     * Get the configured maximum commits limit from pro settings
     */
    private getMaxCommitsLimit(): number {
        const config = vscode.workspace.getConfiguration('gitmind');
        const proSettings = config.get('pro') as any || {};
        const commitHistorySettings = proSettings.commitHistoryAnalysis || {};
        
        // Default to 10, but allow pro users to configure up to 100
        const configuredLimit = commitHistorySettings.maxCommits || 10;
        return Math.min(Math.max(configuredLimit, 1), 100); // Clamp between 1-100
    }

    /**
     * Analyze commit messages using the configured AI provider
     */
    public async analyzeCommitMessages(
        maxCommits?: number,
        includeAuthorInfo: boolean = true
    ): Promise<string> {
        const analysisId = Date.now(); // Unique ID for this analysis
        debugLog(`[CommitHistory-${analysisId}] Starting commit history analysis`);

        if (!this.isFeatureAvailable()) {
            throw new Error('This feature is only available for GitMind Pro users.');
        }

        try {
            // Use configured limit if maxCommits not provided
            const actualMaxCommits = maxCommits ?? this.getMaxCommitsLimit();
            debugLog(`[CommitHistory-${analysisId}] Using maxCommits: ${actualMaxCommits}`);
            
            // Get commit messages
            const commits = await this.getCommitMessages(actualMaxCommits, includeAuthorInfo);

            if (commits.length === 0) {
                return 'No commit messages found in the repository.';
            }

            // Format optimized commit history for analysis
            let commitHistory = '';
            commits.forEach((commit, index) => {
                // Use concise format with just essential information
                commitHistory += `${index + 1}. ${commit.subject}`;
                
                // Add body only if it exists and provides additional value
                if (commit.body && commit.body.length > 0) {
                    commitHistory += `\n   ${commit.body.replace(/\n/g, '\n   ')}`; // Indent body lines
                }
                
                if (includeAuthorInfo && commit.author && commit.date) {
                    commitHistory += ` (${commit.author}, ${commit.date})`;
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
                actualMaxCommits,
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