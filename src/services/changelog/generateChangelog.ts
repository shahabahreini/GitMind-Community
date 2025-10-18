import * as vscode from 'vscode';
import { ChangelogService } from './ChangelogService';
import { isProUser } from '../../utils/proHelpers';
import { debugLog } from '../debug/logger';

/**
 * Command handler for generating changelog from git history
 * This is a Pro feature that analyzes commits and creates/updates CHANGELOG.md
 */
export async function generateChangelog() {
    try {
        // Check if user is pro
        if (!isProUser()) {
            const action = await vscode.window.showInformationMessage(
                'Changelog Generation is a GitMind Pro feature. Upgrade to Pro to unlock AI-powered changelog generation from your git history.',
                'Upgrade to Pro',
                'Learn More'
            );

            if (action === 'Upgrade to Pro') {
                vscode.commands.executeCommand('gitmind.subscribe');
            } else if (action === 'Learn More') {
                vscode.env.openExternal(vscode.Uri.parse('https://gitmind.com/pro'));
            }

            return;
        }

        const changelogService = ChangelogService.getInstance();

        // Check if feature is enabled
        if (!changelogService.isFeatureAvailable()) {
            throw new Error('Changelog generation is not enabled. Please enable it in settings.');
        }

        // Prompt user for generation options
        const options = await vscode.window.showQuickPick([
            {
                label: '$(new-file) Generate New Changelog',
                description: 'Create CHANGELOG.md from scratch',
                mode: 'create' as const,
                detail: 'Analyzes all git history to create a comprehensive changelog'
            },
            {
                label: '$(sync) Update Existing Changelog',
                description: 'Add new entries to existing CHANGELOG.md',
                mode: 'prepend' as const,
                detail: 'Analyzes commits since last changelog entry and prepends new sections'
            },
            {
                label: '$(edit) Generate Changelog Preview',
                description: 'Preview changelog without saving',
                mode: 'preview' as const,
                detail: 'Generate changelog and open in editor for review before saving'
            }
        ], {
            placeHolder: 'Select how you want to generate the changelog',
            title: 'GitMind Pro - Changelog Generation'
        });

        if (!options) {
            return; // User cancelled
        }

        // Get configuration
        const config = vscode.workspace.getConfiguration('gitmind');
        const maxCommits = config.get<number>('pro.changelog.maxCommits', 100);
        const groupByVersion = config.get<boolean>('pro.changelog.groupByVersion', true);

        // Show progress indicator
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Generating changelog...',
                cancellable: false
            },
            async (progress) => {
                try {
                    progress.report({ message: 'Analyzing git history...' });

                    const changelog = await changelogService.generateChangelog({
                        maxCommits,
                        groupByVersion
                    });

                    if (options.mode === 'preview') {
                        // Show preview in new editor
                        progress.report({ message: 'Opening preview...' });

                        const document = await vscode.workspace.openTextDocument({
                            content: changelog,
                            language: 'markdown'
                        });

                        await vscode.window.showTextDocument(document);

                        // Ask if user wants to save
                        const saveAction = await vscode.window.showInformationMessage(
                            'Changelog preview generated. Would you like to save it to CHANGELOG.md?',
                            'Save as New',
                            'Prepend to Existing',
                            'Cancel'
                        );

                        if (saveAction === 'Save as New') {
                            await changelogService.saveChangelog(changelog, 'create');
                            vscode.window.showInformationMessage('Changelog saved to CHANGELOG.md');
                        } else if (saveAction === 'Prepend to Existing') {
                            await changelogService.saveChangelog(changelog, 'prepend');
                            vscode.window.showInformationMessage('Changelog updated successfully');
                        }

                    } else {
                        // Save directly
                        progress.report({ message: 'Saving changelog...' });
                        await changelogService.saveChangelog(changelog, options.mode);

                        // Open the saved file
                        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                        if (workspaceRoot) {
                            const changelogUri = vscode.Uri.file(`${workspaceRoot}/CHANGELOG.md`);
                            const document = await vscode.workspace.openTextDocument(changelogUri);
                            await vscode.window.showTextDocument(document);
                        }

                        vscode.window.showInformationMessage(
                            `Changelog ${options.mode === 'create' ? 'created' : 'updated'} successfully!`
                        );
                    }

                } catch (error) {
                    debugLog('Changelog generation error:', error);
                    throw error;
                }
            }
        );

    } catch (error) {
        debugLog('Changelog generation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to generate changelog: ${errorMessage}`);
    }
}

/**
 * Quick command to generate and prepend new changelog entries
 * This is a shortcut for the most common use case
 */
export async function updateChangelog() {
    try {
        if (!isProUser()) {
            vscode.commands.executeCommand('gitmind.generateChangelog');
            return;
        }

        const changelogService = ChangelogService.getInstance();

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Updating changelog...',
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Analyzing recent commits...' });

                const config = vscode.workspace.getConfiguration('gitmind');
                const maxCommits = config.get<number>('pro.changelog.maxCommits', 100);

                const changelog = await changelogService.generateChangelog({
                    maxCommits,
                    groupByVersion: true
                });

                progress.report({ message: 'Updating CHANGELOG.md...' });
                await changelogService.saveChangelog(changelog, 'prepend');

                vscode.window.showInformationMessage('Changelog updated successfully!');
            }
        );

    } catch (error) {
        debugLog('Changelog update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to update changelog: ${errorMessage}`);
    }
}
