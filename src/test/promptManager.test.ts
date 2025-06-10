import * as vscode from 'vscode';
import * as assert from 'assert';
import { PromptManager } from '../services/promptManager';

suite('PromptManager Tests', () => {
    let originalGetConfiguration: typeof vscode.workspace.getConfiguration;
    let mockConfig: any;

    setup(() => {
        // Mock VS Code configuration
        originalGetConfiguration = vscode.workspace.getConfiguration;
        mockConfig = {
            get: (key: string, defaultValue?: any) => {
                switch (key) {
                    case 'promptCustomization.enabled':
                        return true;
                    case 'promptCustomization.saveLastPrompt':
                        return true;
                    case 'promptCustomization.lastPrompt':
                        return 'Test saved prompt';
                    default:
                        return defaultValue;
                }
            },
            update: async (key: string, value: any, target: vscode.ConfigurationTarget) => {
                // Mock update method
                return Promise.resolve();
            }
        };

        (vscode.workspace as any).getConfiguration = () => mockConfig;
    });

    teardown(() => {
        // Restore original configuration
        vscode.workspace.getConfiguration = originalGetConfiguration;
    });

    test('should return saved prompt as default when saveLastPrompt is enabled', async () => {
        // Mock the input box to return undefined (user cancels)
        const originalShowInputBox = vscode.window.showInputBox;
        (vscode.window as any).showInputBox = async () => undefined;

        try {
            const lastPrompt = PromptManager.getLastPrompt();
            assert.strictEqual(lastPrompt, 'Test saved prompt');
        } finally {
            vscode.window.showInputBox = originalShowInputBox;
        }
    });

    test('should save prompt when user enters custom context', async () => {
        let savedPrompt: string | undefined;

        mockConfig.update = async (key: string, value: any) => {
            if (key === 'promptCustomization.lastPrompt') {
                savedPrompt = value;
            }
        };

        // Mock the input box to return a custom prompt
        const originalShowInputBox = vscode.window.showInputBox;
        const originalShowInformationMessage = vscode.window.showInformationMessage;

        (vscode.window as any).showInputBox = async () => 'New custom prompt';
        (vscode.window as any).showInformationMessage = async () => 'Continue';

        try {
            const result = await PromptManager.getCustomContext();
            assert.strictEqual(result, 'New custom prompt');
            assert.strictEqual(savedPrompt, 'New custom prompt');
        } finally {
            vscode.window.showInputBox = originalShowInputBox;
            vscode.window.showInformationMessage = originalShowInformationMessage;
        }
    });

    test('should return empty string when prompt customization is disabled', async () => {
        mockConfig.get = (key: string, defaultValue?: any) => {
            if (key === 'promptCustomization.enabled') {
                return false;
            }
            return defaultValue;
        };

        const result = await PromptManager.getCustomContext();
        assert.strictEqual(result, '');
    });

    test('should clear last prompt correctly', async () => {
        let clearedPrompt: string | undefined;

        mockConfig.update = async (key: string, value: any) => {
            if (key === 'promptCustomization.lastPrompt') {
                clearedPrompt = value;
            }
        };

        await PromptManager.clearLastPrompt();
        assert.strictEqual(clearedPrompt, '');
    });
});
