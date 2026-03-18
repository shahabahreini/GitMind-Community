import * as vscode from 'vscode';
import { CommitHistoryLearningService } from './CommitHistoryLearningService';
import { isProUser } from '../../utils/proHelpers';
import { debugLog } from '../debug/logger';

/**
 * Command handler for learning from commit history
 * This will analyze commit messages to provide insights and suggestions
 */
export async function learnFromCommitHistory() {
    let resultSent = false;
    const sendResult = async (success: boolean, error?: string) => {
        if (resultSent) { return; }
        resultSent = true;
        try {
            const { SettingsWebview } = await import('../../webview/settings/SettingsWebview.js');
            if (SettingsWebview.isWebviewOpen()) {
                SettingsWebview.postMessageToWebview({
                    command: 'commitHistoryAnalysisResult',
                    success,
                    error
                });
            }
        } catch (e) {
            debugLog('Failed to send commitHistoryAnalysisResult:', e);
        }
    };

    try {
        // Check if user is pro
        if (!isProUser()) {
            const action = await vscode.window.showInformationMessage(
                'Learn from Commit History is a GitMind Pro feature. Upgrade to Pro to unlock this feature.',
                'Upgrade to Pro',
                'Learn More'
            );

            if (action === 'Upgrade to Pro') {
                vscode.commands.executeCommand('gitmind.subscribe');
            } else if (action === 'Learn More') {
                vscode.env.openExternal(vscode.Uri.parse('https://gitmind.com/pro'));
            }

            await sendResult(false, 'Not a Pro user');
            return;
        }

        // Show progress indicator
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Analyzing commit messages...',
                cancellable: true
            },
            async (progress, token) => {
                token.onCancellationRequested(async () => {
                    debugLog('Learn from commit history cancelled by user');
                    await sendResult(false, 'Cancelled by user');
                });

                try {
                    progress.report({ message: 'Fetching commit history...' });

                    const commitService = CommitHistoryLearningService.getInstance();

                    // Check if feature is available
                    if (!commitService.isFeatureAvailable()) {
                        throw new Error('This feature is not enabled. Please enable it in settings.');
                    }

                    progress.report({ message: 'Getting current configuration...' });

                    // Get current settings for commit history analysis options
                    const config = vscode.workspace.getConfiguration('gitmind');
                    const maxCommits = config.get<number>('pro.learnFromCommitHistory.maxCommits', 50);
                    const includeAuthorInfo = config.get<boolean>('pro.learnFromCommitHistory.includeAuthorInfo', true);

                    if (token.isCancellationRequested) { return; }

                    progress.report({ message: 'Analyzing commit messages with AI...' });

                    // Use the new analyzeCommitMessages method that leverages existing API infrastructure
                    const insights = await commitService.analyzeCommitMessages(maxCommits, includeAuthorInfo);

                    if (token.isCancellationRequested) { return; }

                    // Show results in a new editor
                    const document = await vscode.workspace.openTextDocument({
                        content: `# Git Commit Message Analysis\n\n${insights}`,
                        language: 'markdown'
                    });

                    await vscode.window.showTextDocument(document);

                    // Show success message
                    vscode.window.showInformationMessage('Commit message analysis complete!');

                    // Send success message back to webview if open
                    await sendResult(true);

                } catch (error) {
                    debugLog('Learn from commit history error:', error);
                    throw error;
                }
            }
        );
    } catch (error) {
        debugLog('Learn from commit history error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to analyze commit messages: ${errorMessage}`);
        await sendResult(false, errorMessage);
    }
}
