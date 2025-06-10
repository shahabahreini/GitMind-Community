import * as vscode from 'vscode';
import { debugLog } from './debug/logger';

export class PromptManager {
    /**
     * Get custom context with enhanced functionality for saved prompts
     */
    public static async getCustomContext(): Promise<string> {
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        const promptCustomizationEnabled = config.get<boolean>('promptCustomization.enabled', false);

        if (!promptCustomizationEnabled) {
            return '';
        }

        const saveLastPrompt = config.get<boolean>('promptCustomization.saveLastPrompt', false);
        const lastPrompt = config.get<string>('promptCustomization.lastPrompt', '');

        let defaultValue = '';
        let prompt = 'Add custom context for your commit (optional)';

        if (saveLastPrompt && lastPrompt) {
            defaultValue = lastPrompt;
            prompt = 'Add custom context for your commit (using last saved prompt)';
        }

        // Create input box with enhanced options
        const inputBoxOptions: vscode.InputBoxOptions = {
            prompt: prompt,
            placeHolder: saveLastPrompt && lastPrompt
                ? 'Edit your saved prompt or press Enter to use as-is'
                : 'e.g., Fixes #123, Implements feature X',
            value: defaultValue,
            ignoreFocusOut: true,
        };

        // Add copy to clipboard button for saved prompts
        if (saveLastPrompt && lastPrompt) {
            const copyAction = await vscode.window.showInformationMessage(
                'Saved prompt available. Would you like to copy it to clipboard first?',
                { modal: false },
                'Copy to Clipboard',
                'Continue'
            );

            if (copyAction === 'Copy to Clipboard') {
                await vscode.env.clipboard.writeText(lastPrompt);
                vscode.window.showInformationMessage('Last prompt copied to clipboard!');
            }
        }

        const customContext = await vscode.window.showInputBox(inputBoxOptions);

        // Save the prompt if user entered something and save is enabled
        if (customContext && customContext.trim() && saveLastPrompt) {
            await this.saveLastPrompt(customContext.trim());
            debugLog('Custom prompt saved:', customContext.trim());
        }

        return customContext || '';
    }

    /**
     * Save the last custom prompt
     */
    private static async saveLastPrompt(prompt: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        await config.update('promptCustomization.lastPrompt', prompt, vscode.ConfigurationTarget.Global);
    }

    /**
     * Get the last saved prompt
     */
    public static getLastPrompt(): string {
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        return config.get<string>('promptCustomization.lastPrompt', '');
    }

    /**
     * Clear the last saved prompt
     */
    public static async clearLastPrompt(): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        await config.update('promptCustomization.lastPrompt', '', vscode.ConfigurationTarget.Global);
    }
}
