// src/utils/onboardingManager.ts

import * as vscode from 'vscode';
import { debugLog } from "../services/debug/logger";

export interface OnboardingStep {
    title: string;
    content: string;
}

export class OnboardingManager {
    private static readonly ONBOARDING_SHOWN_KEY = 'aiCommitAssistant.onboardingShown';

    private static readonly PROVIDER_DOCS: Record<string, string> = {
        'Gemini': 'https://aistudio.google.com/app/apikey',
        'Hugging Face': 'https://huggingface.co/settings/tokens',
        'Ollama': 'https://ollama.ai/download',
        'Mistral': 'https://console.mistral.ai/api-keys/',
        'Cohere': 'https://dashboard.cohere.com/api-keys',
        'OpenAI': 'https://platform.openai.com/api-keys',
        'Together AI': 'https://api.together.xyz/settings/api-keys',
        'OpenRouter': 'https://openrouter.ai/keys',
        'Anthropic': 'https://console.anthropic.com/',
        'DeepSeek': 'https://platform.deepseek.com/api_keys'
    };

    private static steps: OnboardingStep[] = [];

    /**
     * Register onboarding steps to be shown to users
     */
    public static registerSteps(steps: OnboardingStep[]): void {
        OnboardingManager.steps = steps;
    }

    public static async showOnboarding(context: vscode.ExtensionContext): Promise<void> {
        const hasShownOnboarding = context.globalState.get<boolean>(this.ONBOARDING_SHOWN_KEY);

        if (!hasShownOnboarding && OnboardingManager.steps.length > 0) {
            for (const step of OnboardingManager.steps) {
                const result = await vscode.window.showInformationMessage(
                    step.content,
                    { modal: true, detail: step.title },
                    'Next'
                );

                if (!result) {
                    break;
                }
            }

            await context.globalState.update(this.ONBOARDING_SHOWN_KEY, true);
        }
    }

    public static async validateAndPromptForApiKey(provider: string): Promise<string | undefined> {
        debugLog(`Validating API key for ${provider}`);
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        const settingPath = this.getProviderSettingPath(provider);

        if (!settingPath) {
            debugLog(`No setting path found for ${provider}`);
            return undefined;
        }

        const apiKey = config.get<string>(settingPath);
        if (!apiKey) {
            debugLog(`No API key found for ${provider}, showing input prompt`);

            // Show the input box with "Get API Key" button
            const result = await vscode.window.showWarningMessage(
                `${provider} API key is required. Would you like to configure it now?`,
                'Enter API Key',
                'Get API Key',
                'Cancel'
            );

            if (result === 'Enter API Key') {
                const newApiKey = await vscode.window.showInputBox({
                    title: `${provider} API Key`,
                    prompt: `Please enter your ${provider} API key`,
                    password: true,
                    placeHolder: 'Paste your API key here',
                    ignoreFocusOut: true,
                    validateInput: text => {
                        return text && text.trim().length > 0 ? null : 'API key cannot be empty';
                    }
                });

                if (newApiKey?.trim()) {
                    try {
                        await config.update(settingPath, newApiKey.trim(), vscode.ConfigurationTarget.Global);
                        debugLog(`Successfully saved API key for ${provider}`);
                        return newApiKey.trim();
                    } catch (error) {
                        debugLog(`Error saving API key for ${provider}:`, error);
                        throw new Error(`Failed to save ${provider} API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            } else if (result === 'Get API Key') {
                const providerUrl = this.PROVIDER_DOCS[provider];
                if (providerUrl) {
                    await vscode.env.openExternal(vscode.Uri.parse(providerUrl));
                    // After opening the website, prompt for API key input
                    return await this.validateAndPromptForApiKey(provider);
                }
            }

            debugLog(`No API key provided for ${provider}`);
            throw new Error(`${provider} API key is required but not configured`);
        }

        return apiKey;
    }


    private static async promptForApiKey(provider: string): Promise<string | undefined> {
        const apiKey = await vscode.window.showInputBox({
            prompt: `Enter your ${provider} API key`,
            password: true,
            placeHolder: 'Paste your API key here',
            ignoreFocusOut: true,
            validateInput: text => {
                return text && text.trim().length > 0 ? null : 'API key cannot be empty';
            }
        });

        if (apiKey?.trim()) {
            try {
                const config = vscode.workspace.getConfiguration('aiCommitAssistant');
                const settingPath = this.getProviderSettingPath(provider);

                if (settingPath) {
                    await config.update(settingPath, apiKey.trim(), vscode.ConfigurationTarget.Global);
                    await vscode.window.showInformationMessage(`${provider} API key has been saved successfully!`);
                    return apiKey.trim();
                }
            } catch (error) {
                await vscode.window.showErrorMessage(
                    `Failed to save ${provider} API key: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }

        return undefined;
    }

    private static getProviderSettingPath(provider: string): string {
        const paths: Record<string, string> = {
            'Gemini': 'gemini.apiKey',
            'Hugging Face': 'huggingface.apiKey',
            'Mistral': 'mistral.apiKey',
            'Cohere': 'cohere.apiKey',
            'OpenAI': 'openai.apiKey',
            'Together AI': 'together.apiKey',
            'OpenRouter': 'openrouter.apiKey'
        };
        return paths[provider] || '';
    }

    public static async validateConfiguration(provider: string): Promise<boolean> {
        if (provider === 'Ollama') {
            return true; // Ollama doesn't require API key
        }

        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        const settingPath = this.getProviderSettingPath(provider);

        if (!settingPath) {
            return false;
        }

        const apiKey = config.get<string>(settingPath);
        if (!apiKey) {
            const result = await vscode.window.showWarningMessage(
                `${provider} API key is not configured. Would you like to configure it now?`,
                { modal: true },
                'Configure Now',
                'Get API Key',
                'Cancel'
            );

            if (result === 'Configure Now') {
                const newApiKey = await this.promptForApiKey(provider);
                return !!newApiKey;
            } else if (result === 'Get API Key') {
                const providerUrl = this.PROVIDER_DOCS[provider];
                if (providerUrl) {
                    await vscode.env.openExternal(vscode.Uri.parse(providerUrl));
                }
            }
            return false;
        }

        return true;
    }
}
