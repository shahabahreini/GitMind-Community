import * as vscode from "vscode";
import { ExtensionState } from "./config/types";
import { getApiConfig } from "./config/settings";
import { generateCommitMessage, cancelCurrentRequest, isRequestActive } from "./services/api";
import { checkApiSetup, checkRateLimits } from "./services/api/validation";
import {
  validateGitRepository,
  getDiff,
  setCommitMessage,
} from "./services/git/repository";
import { initializeLogger, debugLog } from "./services/debug/logger";
import { processResponse } from "./utils/commitFormatter";
import { SettingsWebview } from "./webview/settings/SettingsWebview";
import { OnboardingWebview } from "./webview/onboarding/OnboardingWebview";
import { OnboardingManager, OnboardingStep } from "./utils/onboardingManager";
import { fetchMistralModels } from "./services/api/mistral";
import { fetchHuggingFaceModels } from "./services/api/huggingface";
import { PromptManager } from "./services/promptManager";
import { telemetryService } from "./services/telemetry/telemetryService";

// Constants
const TIMEOUT_DURATION = 60000;
const API_CHECK_TIMEOUT = 15000;
const SUPPORTED_PROVIDERS = [
  "Gemini", "Hugging Face", "Ollama", "Mistral", "Cohere", "OpenAI",
  "Together AI", "OpenRouter", "Anthropic", "GitHub Copilot", "DeepSeek", "Grok", "Perplexity"
];

const API_KEY_PROVIDERS = [
  'gemini', 'openai', 'mistral', 'cohere', 'huggingface', 'anthropic',
  'together', 'openrouter', 'deepseek', 'grok', 'perplexity'
];

const state: ExtensionState = {
  debugChannel: vscode.window.createOutputChannel("AI Commit Assistant Debug"),
  statusBarItem: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100),
  context: undefined,
};

// Helper Functions
function hasApiKey(apiConfig: any): boolean {
  return apiConfig.type === "ollama" || apiConfig.type === "copilot" ||
    (API_KEY_PROVIDERS.includes(apiConfig.type) && 'apiKey' in apiConfig && !!apiConfig.apiKey);
}

async function handleError(
  error: unknown,
  command: string,
  provider: string,
  startTime: number,
  isGenerating?: boolean
): Promise<void> {
  const duration = Date.now() - startTime;
  debugLog(`${command} Error:`, error);

  if (error instanceof Error) {
    telemetryService.trackException(error, { command, provider });

    if (isGenerating) {
      telemetryService.trackCommitGeneration(provider, false, duration, undefined, error.name);
    }

    if (error.message === 'Request was cancelled') {
      telemetryService.trackEvent(`command.${command}.cancelled`, {
        'duration.ms': duration.toString()
      });
      vscode.window.showInformationMessage(`${command} cancelled`);
      return;
    }

    const isTokenError = error.message.includes('too large') ||
      error.message.includes('exceed') ||
      error.message.includes('tokens');

    const showMethod = isTokenError ? vscode.window.showWarningMessage : vscode.window.showErrorMessage;
    showMethod(error.message, { modal: true });
  } else {
    vscode.window.showErrorMessage(
      `An unexpected error occurred. Please check the debug logs for more details.`
    );
  }
}

async function withProgress<T>(
  title: string,
  task: () => Promise<T>
): Promise<T> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: false
    },
    task
  );
}

async function sendApiCheckResult(result: any, provider: string): Promise<void> {
  const message = {
    command: 'apiCheckResult',
    success: result.success,
    provider,
    model: result.model,
    responseTime: result.responseTime,
    details: result.details,
    error: result.error,
    warning: result.warning,
    troubleshooting: result.troubleshooting
  };

  if (SettingsWebview.isWebviewOpen()) {
    SettingsWebview.postMessageToWebview(message);
  }

  if (OnboardingWebview.isWebviewOpen()) {
    const apiConfig = getApiConfig();
    OnboardingWebview.postMessageToWebview({
      command: 'updateConfigStatus',
      status: { hasApiKey: hasApiKey(apiConfig) }
    });

    OnboardingWebview.postMessageToWebview({
      command: 'connectionTestResult',
      success: result.success,
      message: result.success ? "Connection successful!" : (result.error || "Connection failed")
    });
  } else if (!SettingsWebview.isWebviewOpen()) {
    const messageText = result.success
      ? `${provider} API connection successful!`
      : `${provider} API connection failed: ${result.error}`;

    const showMethod = result.success ? vscode.window.showInformationMessage : vscode.window.showErrorMessage;
    showMethod(messageText);
  }
}

// Command Handlers
async function handleGenerateCommit(): Promise<void> {
  const startTime = Date.now();
  const apiConfig = getApiConfig();
  let isGenerating = false;
  let loadingItem: vscode.StatusBarItem | undefined;

  try {
    debugLog("Command Started: generateCommitMessage");
    telemetryService.trackEvent('command.generateCommit.started', { provider: apiConfig.type });

    if (isRequestActive()) {
      await vscode.commands.executeCommand("ai-commit-assistant.cancelGeneration");
      telemetryService.trackEvent('command.generateCommit.cancelled');
      return;
    }

    isGenerating = true;

    await vscode.commands.executeCommand("setContext", "ai-commit-assistant.isGenerating", true);

    loadingItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    loadingItem.text = "$(sync~spin) Generating... $(close) Cancel";
    loadingItem.tooltip = "AI is generating commit message. Click to cancel.";
    loadingItem.command = "ai-commit-assistant.cancelGeneration";
    loadingItem.show();

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      telemetryService.trackEvent('command.generateCommit.failed', { error: 'no_workspace_folder' });
      vscode.window.showErrorMessage("No workspace folder is open");
      return;
    }

    try {
      await validateGitRepository(workspaceFolders[0]);
    } catch (error) {
      telemetryService.trackEvent('command.generateCommit.failed', { error: 'not_git_repository' });
      vscode.window.showErrorMessage("This is not a git repository. Please initialize git first.");
      return;
    }

    const diff = await getDiff(workspaceFolders[0]);
    if (!diff?.trim()) {
      telemetryService.trackEvent('command.generateCommit.failed', { error: 'no_changes' });
      vscode.window.showInformationMessage("No changes detected to generate a commit message for.");
      return;
    }

    const customContext = await PromptManager.getCustomContext();

    const message = await Promise.race([
      generateCommitMessage(apiConfig, diff, customContext),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out after 60 seconds")), TIMEOUT_DURATION)
      )
    ]);

    const duration = Date.now() - startTime;

    if (message?.trim()) {
      const formattedMessage = await processResponse(message);
      await setCommitMessage(formattedMessage);

      telemetryService.trackCommitGeneration(
        apiConfig.type,
        true,
        duration,
        Math.ceil(diff.length / 4)
      );

      vscode.window.showInformationMessage("Commit message generated successfully!");
    } else {
      telemetryService.trackCommitGeneration(
        apiConfig.type,
        false,
        duration,
        undefined,
        'empty_response'
      );
      vscode.window.showWarningMessage(
        "No commit message was generated. This may be due to API limitations or configuration issues."
      );
    }
  } catch (error) {
    await handleError(error, 'generateCommit', apiConfig.type, startTime, true);
  } finally {
    isGenerating = false;
    loadingItem?.dispose();
    await vscode.commands.executeCommand("setContext", "ai-commit-assistant.isGenerating", false);
  }
}

async function handleApiSetupCheck(): Promise<void> {
  const startTime = Date.now();
  const apiConfig = getApiConfig();
  const provider = apiConfig.type;

  try {
    telemetryService.trackEvent('command.checkApiSetup.started', { provider });

    await withProgress(`Testing ${provider} API connection...`, async () => {
      try {
        const result = await Promise.race([
          checkApiSetup(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Connection test timed out after 15 seconds")), API_CHECK_TIMEOUT)
          )
        ]);

        const duration = Date.now() - startTime;
        telemetryService.trackAPIValidation(provider, result.success, duration);
        await sendApiCheckResult(result, provider);
      } catch (error) {
        const duration = Date.now() - startTime;
        debugLog("API Check Error (inner):", error);

        telemetryService.trackException(error as Error, { command: 'checkApiSetup', provider });
        telemetryService.trackAPIValidation(provider, false, duration);

        const errorResult = {
          success: false,
          provider,
          error: error instanceof Error ? error.message : 'Unknown error',
          troubleshooting: "Please check your API key and network connection."
        };

        await sendApiCheckResult(errorResult, provider);
      }
    });
  } catch (error) {
    await handleError(error, 'checkApiSetup', provider, startTime);
  }
}

async function handleRateLimitsCheck(): Promise<void> {
  const apiConfig = getApiConfig();
  const provider = apiConfig.type;

  try {
    await withProgress(`Checking ${provider} rate limits...`, async () => {
      try {
        const result = await Promise.race([
          checkRateLimits(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Rate limits check timed out after 15 seconds")), API_CHECK_TIMEOUT)
          )
        ]);

        const message = {
          command: 'rateLimitsResult',
          success: result.success,
          limits: result.limits,
          notes: result.notes,
          error: result.error
        };

        if (SettingsWebview.isWebviewOpen()) {
          SettingsWebview.postMessageToWebview(message);
        } else {
          const messageText = result.success
            ? `${provider} rate limits retrieved successfully`
            : `Failed to retrieve ${provider} rate limits: ${result.error}`;

          const showMethod = result.success ? vscode.window.showInformationMessage : vscode.window.showErrorMessage;
          showMethod(messageText);
        }
      } catch (error) {
        debugLog("Rate Limits Check Error (inner):", error);

        const errorMessage = {
          command: 'rateLimitsResult',
          success: false,
          provider,
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        if (SettingsWebview.isWebviewOpen()) {
          SettingsWebview.postMessageToWebview(errorMessage);
        } else {
          vscode.window.showErrorMessage(
            `Rate limits check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    });
  } catch (error) {
    debugLog("Rate Limits Check Error (outer):", error);
    vscode.window.showErrorMessage(
      `Error checking rate limits: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function handleLoadModels(
  modelType: 'mistral' | 'huggingface',
  fetchFunction: (apiKey: string) => Promise<any[]>
): Promise<void> {
  try {
    const config = getApiConfig();
    const isCorrectType = config.type === modelType;
    const hasKey = 'apiKey' in config && config.apiKey;

    if (!isCorrectType || !hasKey) {
      throw new Error(`${modelType} API key is required to load models`);
    }

    await withProgress(`Loading ${modelType} models...`, async () => {
      try {
        const models = await fetchFunction(config.apiKey);
        const commandSuffix = modelType === 'mistral' ? 'mistralModelsLoaded' : 'huggingfaceModelsLoaded';

        if (SettingsWebview.isWebviewOpen()) {
          SettingsWebview.postMessageToWebview({
            command: commandSuffix,
            success: true,
            models
          });
        }
      } catch (error) {
        debugLog(`Load ${modelType} Models Error:`, error);
        const commandSuffix = modelType === 'mistral' ? 'mistralModelsLoaded' : 'huggingfaceModelsLoaded';

        if (SettingsWebview.isWebviewOpen()) {
          SettingsWebview.postMessageToWebview({
            command: commandSuffix,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    });
  } catch (error) {
    debugLog(`Load ${modelType} Models Error:`, error);
    vscode.window.showErrorMessage(
      `Error loading ${modelType} models: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function handlePromptAction(action: 'clear' | 'view'): Promise<void> {
  try {
    const lastPrompt = PromptManager.getLastPrompt();
    if (!lastPrompt) {
      vscode.window.showInformationMessage(
        action === 'clear' ? "No saved custom prompt to clear." : "No saved custom prompt available."
      );
      return;
    }

    if (action === 'clear') {
      const confirmation = await vscode.window.showWarningMessage(
        "Are you sure you want to clear the last saved custom prompt?",
        { modal: true },
        "Clear",
        "Cancel"
      );

      if (confirmation === "Clear") {
        await PromptManager.clearLastPrompt();
        vscode.window.showInformationMessage("Last custom prompt cleared successfully!");
        debugLog("Last custom prompt cleared by user");
      }
    } else {
      const actionButton = await vscode.window.showInformationMessage(
        `Last saved custom prompt:\n\n"${lastPrompt}"`,
        { modal: true },
        "Copy to Clipboard",
        "Clear Prompt",
        "Close"
      );

      if (actionButton === "Copy to Clipboard") {
        await vscode.env.clipboard.writeText(lastPrompt);
        vscode.window.showInformationMessage("Prompt copied to clipboard!");
      } else if (actionButton === "Clear Prompt") {
        await vscode.commands.executeCommand("ai-commit-assistant.clearLastPrompt");
      }
    }
  } catch (error) {
    debugLog(`${action} Last Prompt Error:`, error);
    vscode.window.showErrorMessage(`Failed to ${action} the last custom prompt.`);
  }
}

async function handleOnboardingAction(action: 'complete' | 'skip', context: vscode.ExtensionContext): Promise<void> {
  const actionMethod = action === 'complete' ? OnboardingManager.markAsCompleted : OnboardingManager.markAsSkipped;
  await actionMethod(context);

  const message = action === 'complete'
    ? "🎉 Welcome to GitMind! You're all set up and ready to generate amazing commit messages. Try it out by making some changes to your files and using the Source Control panel."
    : "Onboarding has been permanently disabled. GitMind will no longer show the setup wizard automatically. You can still access settings manually through the command palette.";

  const actionButton = action === 'complete' ? "Try It Now" : "Open Settings Now";

  const result = await vscode.window.showInformationMessage(message, { modal: false }, actionButton, "Got it");

  if (result === actionButton) {
    const command = action === 'complete' ? "workbench.view.scm" : "ai-commit-assistant.openSettings";
    await vscode.commands.executeCommand(command);
  }

  telemetryService.trackEvent(`onboarding.${action}d`);

  if (OnboardingWebview.isWebviewOpen()) {
    vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  }
}

// Command Registration
function registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  const commands = [
    vscode.commands.registerCommand("ai-commit-assistant.toggleDebug", async () => {
      const config = vscode.workspace.getConfiguration("aiCommitAssistant");
      const currentDebug = config.get<boolean>("debug") || false;
      await config.update("debug", !currentDebug, true);
      const status = !currentDebug ? "enabled" : "disabled";
      debugLog(`Debug mode ${status}`);
      vscode.window.showInformationMessage(`Debug mode ${status}`);
    }),

    vscode.commands.registerCommand("ai-commit-assistant.cancelGeneration", async () => {
      if (isRequestActive()) {
        cancelCurrentRequest();
        await vscode.commands.executeCommand("setContext", "ai-commit-assistant.isGenerating", false);
        vscode.window.showInformationMessage("Commit message generation cancelled");
      }
    }),

    vscode.commands.registerCommand("ai-commit-assistant.generateCommitMessage", handleGenerateCommit),
    vscode.commands.registerCommand("ai-commit-assistant.checkApiSetup", handleApiSetupCheck),
    vscode.commands.registerCommand("ai-commit-assistant.checkRateLimits", handleRateLimitsCheck),

    vscode.commands.registerCommand("ai-commit-assistant.loadMistralModels", () =>
      handleLoadModels('mistral', fetchMistralModels)
    ),

    vscode.commands.registerCommand("ai-commit-assistant.loadHuggingFaceModels", () =>
      handleLoadModels('huggingface', fetchHuggingFaceModels)
    ),

    vscode.commands.registerCommand("ai-commit-assistant.clearLastPrompt", () =>
      handlePromptAction('clear')
    ),

    vscode.commands.registerCommand("ai-commit-assistant.viewLastPrompt", () =>
      handlePromptAction('view')
    ),

    vscode.commands.registerCommand("ai-commit-assistant.openSettings", () => {
      SettingsWebview.createOrShow(context.extensionUri);
      telemetryService.trackEvent('settings.opened');
    }),

    vscode.commands.registerCommand("ai-commit-assistant.openOnboarding", () => {
      if (OnboardingManager.canManuallyOpen(context)) {
        OnboardingWebview.createOrShow(context.extensionUri);
        telemetryService.trackEvent('onboarding.opened');
      } else {
        vscode.window.showInformationMessage(
          "Onboarding is disabled in settings. You can enable it in the extension settings under 'Show Onboarding'.",
          "Open Settings"
        ).then(result => {
          if (result === "Open Settings") {
            vscode.commands.executeCommand("ai-commit-assistant.openSettings");
          }
        });
      }
    }),

    vscode.commands.registerCommand("ai-commit-assistant.completeOnboarding", () =>
      handleOnboardingAction('complete', context)
    ),

    vscode.commands.registerCommand("ai-commit-assistant.skipOnboarding", () =>
      handleOnboardingAction('skip', context)
    ),

    vscode.commands.registerCommand("ai-commit-assistant.checkApiConfig", async () => {
      try {
        const apiConfig = getApiConfig();
        const hasKey = hasApiKey(apiConfig);

        if (OnboardingWebview.isWebviewOpen()) {
          OnboardingWebview.postMessageToWebview({
            command: 'updateConfigStatus',
            status: { hasApiKey: hasKey }
          });
        }

        return { hasApiKey: hasKey, provider: apiConfig.type };
      } catch (error) {
        debugLog("API Config Check Error:", error);
        return { hasApiKey: false, error };
      }
    }),

    vscode.commands.registerCommand("ai-commit-assistant.resetOnboarding", async () => {
      await OnboardingManager.resetOnboardingState(context);
      vscode.window.showInformationMessage(
        "Onboarding state has been reset. The extension will treat you as a new user on next restart."
      );
      telemetryService.trackEvent('onboarding.reset');
    }),

    vscode.commands.registerCommand("ai-commit-assistant.reEnableOnboarding", async () => {
      const config = vscode.workspace.getConfiguration('aiCommitAssistant');
      await config.update('showOnboarding', true, vscode.ConfigurationTarget.Global);
      await context.globalState.update('aiCommitAssistant.onboardingDisabledPermanently', undefined);

      const action = await vscode.window.showInformationMessage(
        "Onboarding has been re-enabled. You can now access the setup wizard again.",
        { modal: false },
        "Open Onboarding",
        "Got it"
      );

      if (action === "Open Onboarding") {
        OnboardingWebview.createOrShow(context.extensionUri);
        telemetryService.trackEvent('onboarding.reopened');
      }

      telemetryService.trackEvent('onboarding.reenabled');
    }),

    // Placeholder commands
    vscode.commands.registerCommand("ai-commit-assistant.loadingIndicator", () => { }),
    vscode.commands.registerCommand("ai-commit-assistant.acceptInput", () => {
      debugLog("Accept input command triggered");
    }),
  ];

  return commands;
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  state.context = context;
  initializeLogger(state.debugChannel);
  debugLog("AI Commit Assistant is now active");

  await telemetryService.initialize(context);
  telemetryService.trackEvent('extension.activated', {
    'activation.time': new Date().toISOString()
  });

  debugLog("Extension configuration:", vscode.workspace.getConfiguration("aiCommitAssistant"));
  debugLog(`Supported API providers: ${SUPPORTED_PROVIDERS.join(", ")}`);

  const scmStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  scmStatusBarItem.text = "$(github-action) Generate Commit";
  scmStatusBarItem.tooltip = "Generate AI Commit Message";
  scmStatusBarItem.command = "ai-commit-assistant.generateCommitMessage";

  const commands = registerCommands(context);

  context.subscriptions.push(
    state.debugChannel,
    state.statusBarItem,
    scmStatusBarItem,
    ...commands
  );

  const shouldShowOnboarding = await OnboardingManager.shouldShowOnboarding(context);

  if (shouldShowOnboarding) {
    OnboardingWebview.createOrShow(context.extensionUri);
    telemetryService.trackEvent('extension.onboarding.webview.shown');
  } else {
    telemetryService.trackEvent('extension.activation.existing_user');
  }

  const gitExtension = vscode.extensions.getExtension("vscode.git");
  if (gitExtension?.isActive) {
    scmStatusBarItem.show();
  }

  debugLog("GitMind extension activated successfully with all icons");
  telemetryService.trackEvent('extension.activation.completed');
}

export function deactivate(): void {
  telemetryService.trackEvent('extension.deactivated');
  telemetryService.flush();

  state.debugChannel?.dispose();
  state.statusBarItem?.dispose();
}