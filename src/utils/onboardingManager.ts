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

    public static async showAPIUnavailableNotification(provider: string): Promise<void> {
        const action = await vscode.window.showErrorMessage(
            `Unable to connect to ${provider} API. Would you like to configure the API settings?`,
            'Open Settings',
            'Learn More'
        );

        if (action === 'Open Settings') {
            await vscode.commands.executeCommand('ai-commit-assistant.openSettings');
        } else if (action === 'Learn More') {
            const providerDocs: { [key: string]: string } = {
                'Gemini': 'https://aistudio.google.com/app/apikey',
                'Hugging Face': 'https://huggingface.co/settings/tokens',
                'Ollama': 'https://ollama.ai/download',
                'Mistral': 'https://console.mistral.ai/api-keys/'
            };

            if (providerDocs[provider]) {
                await vscode.env.openExternal(vscode.Uri.parse(providerDocs[provider]));
            }
        }
    }
}
