// src/utils/onboardingManager.ts

import * as vscode from 'vscode';

export class OnboardingManager {
    private static readonly ONBOARDING_SHOWN_KEY = 'aiCommitAssistant.onboardingShown';

    public static async showOnboarding(context: vscode.ExtensionContext) {
        const hasShownOnboarding = context.globalState.get(this.ONBOARDING_SHOWN_KEY);

        if (!hasShownOnboarding) {
            const response = await vscode.window.showInformationMessage(
                'Welcome to GitMind: AI Commit Assistant! Would you like to see a quick setup guide?',
                'Yes, show me',
                'No, thanks'
            );

            if (response === 'Yes, show me') {
                await this.showOnboardingSteps();
            }

            await context.globalState.update(this.ONBOARDING_SHOWN_KEY, true);
        }
    }

    private static async showOnboardingSteps() {
        const steps = [
            {
                title: 'Step 1: Choose an AI Provider',
                content: 'GitMind supports multiple AI providers:\n• Gemini (Google)\n• Hugging Face\n• Ollama (Local)\n• Mistral AI\n\nClick Next to learn how to configure your chosen provider.',
            },
            {
                title: 'Step 2: Configure API Settings',
                content: 'Click the ⚙️ icon in the Source Control panel or use the command palette to open settings.\nConfigure your chosen provider\'s API key and model settings.',
            },
            {
                title: 'Step 3: Generate Commit Messages',
                content: 'To generate a commit message:\n1. Stage your changes\n2. Click the AI icon in the Source Control panel\n3. Review and edit the generated message\n4. Commit as usual',
            },
            {
                title: 'Ready to Start!',
                content: 'You\'re all set! Need help? Check our documentation on GitHub or open the settings to configure the extension.',
            }
        ];

        for (const step of steps) {
            await vscode.window.showInformationMessage(
                `${step.title}\n\n${step.content}`,
                { modal: true },
                'Next'
            );
        }
    }

    public static async showAPIUnavailableNotification(provider: string): Promise<boolean> {
        const providerDocs: { [key: string]: string } = {
            'Gemini': 'https://aistudio.google.com/app/apikey',
            'Hugging Face': 'https://huggingface.co/settings/tokens',
            'Ollama': 'https://ollama.ai/download',
            'Mistral': 'https://console.mistral.ai/api-keys/'
        };

        const enterKeyAction = 'Enter API Key';
        const getKeyAction = 'Get API Key';

        const result = await vscode.window.showWarningMessage(
            `${provider} API key is not configured. Would you like to enter it now?`,
            { modal: true },
            enterKeyAction,
            getKeyAction
        );

        if (result === enterKeyAction) {
            return await this.promptForApiKey(provider);
        } else if (result === getKeyAction && providerDocs[provider]) {
            await vscode.env.openExternal(vscode.Uri.parse(providerDocs[provider]));
        }

        return false;
    }

    private static async promptForApiKey(provider: string): Promise<boolean> {
        const apiKey = await vscode.window.showInputBox({
            prompt: `Enter your ${provider} API key`,
            password: true,
            placeHolder: 'Paste your API key here',
            ignoreFocusOut: true,
            validateInput: text => {
                return text && text.trim().length > 0 ? null : 'API key cannot be empty';
            }
        });

        if (apiKey) {
            try {
                const config = vscode.workspace.getConfiguration('aiCommitAssistant');
                const settingPath = this.getProviderSettingPath(provider);

                if (settingPath) {
                    await config.update(settingPath, apiKey, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage(`${provider} API key has been saved successfully!`);
                    return true;
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to save ${provider} API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return false;
    }

    private static getProviderSettingPath(provider: string): string {
        switch (provider) {
            case 'Gemini':
                return 'gemini.apiKey';
            case 'Hugging Face':
                return 'huggingface.apiKey';
            case 'Mistral':
                return 'mistral.apiKey';
            default:
                return '';
        }
    }

    public static async validateConfiguration(provider: string): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        const settingPath = this.getProviderSettingPath(provider);

        if (!settingPath) {
            return true; // For providers that don't require API key (like Ollama)
        }

        const apiKey = config.get<string>(settingPath);
        if (!apiKey) {
            return await this.showAPIUnavailableNotification(provider);
        }

        return true;
    }
}
