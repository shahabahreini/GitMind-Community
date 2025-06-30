// src/utils/onboardingManager.ts

import * as vscode from 'vscode';
import { debugLog } from "../services/debug/logger";

export interface OnboardingStep {
    title: string;
    content: string;
}

export class OnboardingManager {
    private static readonly ONBOARDING_SHOWN_KEY = 'aiCommitAssistant.onboardingShown';
    private static readonly ONBOARDING_SKIPPED_KEY = 'aiCommitAssistant.onboardingSkipped';
    private static readonly ONBOARDING_COMPLETED_KEY = 'aiCommitAssistant.onboardingCompleted';
    private static readonly FIRST_ACTIVATION_KEY = 'aiCommitAssistant.firstActivation';
    private static readonly ONBOARDING_DISABLED_PERMANENTLY_KEY = 'aiCommitAssistant.onboardingDisabledPermanently';

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
        'DeepSeek': 'https://platform.deepseek.com/api_keys',
        'Grok': 'https://console.x.ai/',
        'Perplexity': 'https://www.perplexity.ai/settings/api'
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
                const providerUrl = this.PROVIDER_DOCS && this.PROVIDER_DOCS[provider];
                if (providerUrl) {
                    await vscode.env.openExternal(vscode.Uri.parse(providerUrl));
                    // After opening the website, prompt for API key input
                    return await this.validateAndPromptForApiKey(provider);
                } else {
                    debugLog(`No documentation URL found for provider: ${provider}`);
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
            'gemini': 'gemini.apiKey',
            'Gemini': 'gemini.apiKey',
            'huggingface': 'huggingface.apiKey',
            'Hugging Face': 'huggingface.apiKey',
            'mistral': 'mistral.apiKey',
            'Mistral': 'mistral.apiKey',
            'cohere': 'cohere.apiKey',
            'Cohere': 'cohere.apiKey',
            'openai': 'openai.apiKey',
            'OpenAI': 'openai.apiKey',
            'together': 'together.apiKey',
            'Together AI': 'together.apiKey',
            'openrouter': 'openrouter.apiKey',
            'OpenRouter': 'openrouter.apiKey',
            'anthropic': 'anthropic.apiKey',
            'Anthropic': 'anthropic.apiKey',
            'deepseek': 'deepseek.apiKey',
            'DeepSeek': 'deepseek.apiKey',
            'grok': 'grok.apiKey',
            'Grok': 'grok.apiKey',
            'perplexity': 'perplexity.apiKey',
            'Perplexity': 'perplexity.apiKey'
        };
        const result = paths[provider];
        if (!result) {
            debugLog(`Warning: No setting path found for provider: ${provider}`);
        }
        return result || '';
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
                const providerUrl = this.PROVIDER_DOCS && this.PROVIDER_DOCS[provider];
                if (providerUrl) {
                    await vscode.env.openExternal(vscode.Uri.parse(providerUrl));
                } else {
                    debugLog(`No documentation URL found for provider: ${provider}`);
                }
            }
            return false;
        }

        return true;
    }

    /**
     * Check if onboarding should be shown based on multiple criteria
     */
    public static async shouldShowOnboarding(context: vscode.ExtensionContext): Promise<boolean> {
        debugLog('=== Onboarding Check Started ===');

        // Check if user has disabled onboarding permanently (either via settings or by skipping)
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        const showOnboardingSetting = config.get<boolean>('showOnboarding', true);
        const hasDisabledPermanently = context.globalState.get<boolean>(this.ONBOARDING_DISABLED_PERMANENTLY_KEY, false);

        debugLog(`Settings showOnboarding: ${showOnboardingSetting}`);
        debugLog(`Permanently disabled: ${hasDisabledPermanently}`);

        if (!showOnboardingSetting || hasDisabledPermanently) {
            debugLog('Onboarding disabled in settings or disabled permanently');
            return false;
        }

        // Check if onboarding was already completed or skipped
        const hasCompleted = context.globalState.get<boolean>(this.ONBOARDING_COMPLETED_KEY, false);
        const hasSkipped = context.globalState.get<boolean>(this.ONBOARDING_SKIPPED_KEY, false);

        debugLog(`Onboarding completed: ${hasCompleted}`);
        debugLog(`Onboarding skipped: ${hasSkipped}`);

        if (hasCompleted || hasSkipped) {
            debugLog('Onboarding already completed or skipped');
            // If user skipped, also mark as permanently disabled to prevent future shows
            if (hasSkipped && !hasDisabledPermanently) {
                await context.globalState.update(this.ONBOARDING_DISABLED_PERMANENTLY_KEY, true);
                debugLog('Marked as permanently disabled due to skip');
            }
            return false;
        }

        // Check if user already has ANY working API configuration (more permissive than current provider)
        const hasAnyWorkingConfig = await this.hasAnyValidApiConfiguration();
        debugLog(`Has any valid API configuration: ${hasAnyWorkingConfig}`);

        if (hasAnyWorkingConfig) {
            debugLog('User already has working API configuration for at least one provider, marking as completed and skipping onboarding');
            // Mark as completed since they don't need onboarding
            await this.markAsCompleted(context);
            return false;
        }

        // Check if this is truly a first-time user with more flexible criteria
        const isFirstTime = await this.isFirstTimeUser(context);
        debugLog(`Is first time user: ${isFirstTime}`);

        if (!isFirstTime) {
            debugLog('Not a first-time user, skipping onboarding');
            return false;
        }

        debugLog('All checks passed, should show onboarding');
        debugLog('=== Onboarding Check Completed ===');
        return true;
    }

    /**
     * Check if this is a first-time user by looking at various indicators
     */
    private static async isFirstTimeUser(context: vscode.ExtensionContext): Promise<boolean> {
        // Check if we've recorded first activation
        const firstActivation = context.globalState.get<string>(this.FIRST_ACTIVATION_KEY);
        const now = new Date().toISOString();

        if (!firstActivation) {
            // This is the first activation, record it
            await context.globalState.update(this.FIRST_ACTIVATION_KEY, now);
            return true;
        }

        // Check if first activation was recent (within last 30 days instead of 7)
        // This gives more flexibility for users who might have installed but not used immediately
        const firstActivationDate = new Date(firstActivation);
        const daysDiff = (Date.now() - firstActivationDate.getTime()) / (1000 * 60 * 60 * 24);

        // If it's been more than 30 days since first activation, don't show onboarding
        if (daysDiff > 30) {
            debugLog(`First activation was ${daysDiff.toFixed(1)} days ago, too old for onboarding`);
            return false;
        }

        return true;
    }

    /**
     * Check if user already has a working API configuration
     */
    private static async hasWorkingApiConfiguration(): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        const provider = config.get<string>('apiProvider');

        debugLog(`Checking API configuration for provider: ${provider}`);

        if (!provider) {
            debugLog('No API provider configured');
            return false;
        }

        // Check if the provider has required configuration
        switch (provider) {
            case 'ollama':
                // Ollama doesn't require API key, but check if it's actually working
                debugLog('Ollama provider detected, considering as configured');
                return true;
            case 'copilot':
                // Copilot is integrated, consider it configured if selected
                debugLog('Copilot provider detected, considering as configured');
                return true;
            default:
                // For other providers, check if API key exists and is not empty
                const apiKeyPath = this.getProviderSettingPath(provider);
                if (apiKeyPath) {
                    const apiKey = config.get<string>(apiKeyPath);
                    const hasValidKey = !!(apiKey && apiKey.trim().length > 0);
                    debugLog(`API key check for ${provider}: ${hasValidKey ? 'configured' : 'missing'}`);
                    return hasValidKey;
                }
                debugLog(`No API key path found for provider: ${provider}`);
                return false;
        }
    }

    /**
     * Check if any API provider has a valid configuration
     */
    private static async hasAnyValidApiConfiguration(): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');

        // List of all providers that could be configured
        const providers = ['gemini', 'huggingface', 'ollama', 'mistral', 'cohere', 'openai', 'together', 'openrouter', 'anthropic', 'copilot', 'deepseek', 'grok', 'perplexity'];

        debugLog('Checking API configuration for all providers...');

        for (const provider of providers) {
            // Check if this provider has configuration
            if (provider === 'ollama' || provider === 'copilot') {
                // These don't require API keys, check if they're the current provider
                const currentProvider = config.get<string>('apiProvider');
                if (currentProvider === provider) {
                    debugLog(`Found configured provider: ${provider} (no API key required)`);
                    return true;
                }
            } else {
                // Check for API key
                const apiKey = config.get<string>(`${provider}.apiKey`);
                debugLog(`Checking ${provider}.apiKey: ${apiKey ? `configured (${apiKey.length} chars)` : 'not configured'}`);
                if (apiKey && apiKey.trim().length > 0) {
                    debugLog(`Found API key for provider: ${provider}`);
                    return true;
                }
            }
        }

        debugLog('No valid API configuration found for any provider');
        return false;
    }

    /**
     * Mark onboarding as completed
     */
    public static async markAsCompleted(context: vscode.ExtensionContext): Promise<void> {
        await context.globalState.update(this.ONBOARDING_COMPLETED_KEY, true);
        await context.globalState.update(this.ONBOARDING_SHOWN_KEY, true);
        debugLog('Onboarding marked as completed');
    }

    /**
     * Mark onboarding as skipped (permanently disable)
     */
    public static async markAsSkipped(context: vscode.ExtensionContext): Promise<void> {
        await context.globalState.update(this.ONBOARDING_SKIPPED_KEY, true);
        await context.globalState.update(this.ONBOARDING_SHOWN_KEY, true);
        await context.globalState.update(this.ONBOARDING_DISABLED_PERMANENTLY_KEY, true);

        // Also update the settings to disable onboarding permanently
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        await config.update('showOnboarding', false, vscode.ConfigurationTarget.Global);

        debugLog('Onboarding marked as skipped and permanently disabled');
    }

    /**
     * Permanently disable onboarding (can be called when user has working API setup)
     */
    public static async disableOnboardingPermanently(context: vscode.ExtensionContext): Promise<void> {
        await context.globalState.update(this.ONBOARDING_DISABLED_PERMANENTLY_KEY, true);

        // Also update the settings to disable onboarding permanently
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        await config.update('showOnboarding', false, vscode.ConfigurationTarget.Global);

        debugLog('Onboarding disabled permanently');
    }

    /**
     * Check if onboarding is permanently disabled
     */
    public static isOnboardingPermanentlyDisabled(context: vscode.ExtensionContext): boolean {
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        const showOnboardingSetting = config.get<boolean>('showOnboarding', true);
        const hasDisabledPermanently = context.globalState.get<boolean>(this.ONBOARDING_DISABLED_PERMANENTLY_KEY, false);

        return !showOnboardingSetting || hasDisabledPermanently;
    }

    /**
     * Reset onboarding state (for testing or manual reset)
     */
    public static async resetOnboardingState(context: vscode.ExtensionContext): Promise<void> {
        await context.globalState.update(this.ONBOARDING_SHOWN_KEY, undefined);
        await context.globalState.update(this.ONBOARDING_SKIPPED_KEY, undefined);
        await context.globalState.update(this.ONBOARDING_COMPLETED_KEY, undefined);
        await context.globalState.update(this.FIRST_ACTIVATION_KEY, undefined);
        await context.globalState.update(this.ONBOARDING_DISABLED_PERMANENTLY_KEY, undefined);

        // Re-enable in settings
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        await config.update('showOnboarding', true, vscode.ConfigurationTarget.Global);

        debugLog('Onboarding state reset and re-enabled');
    }

    /**
     * Check if onboarding can be manually opened
     */
    public static canManuallyOpen(context: vscode.ExtensionContext): boolean {
        // Allow manual opening even if permanently disabled, but check settings
        const config = vscode.workspace.getConfiguration('aiCommitAssistant');
        return config.get<boolean>('showOnboarding', true);
    }
}
