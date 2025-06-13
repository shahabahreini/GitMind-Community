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

const state: ExtensionState = {
  debugChannel: vscode.window.createOutputChannel("AI Commit Assistant Debug"),
  statusBarItem: vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  ),
  context: undefined,
};

export async function activate(context: vscode.ExtensionContext) {
  // Initialize state and logger
  state.context = context;
  initializeLogger(state.debugChannel);
  debugLog("AI Commit Assistant is now active");

  // Initialize telemetry service
  await telemetryService.initialize(context);
  telemetryService.trackEvent('extension.activated', {
    'activation.time': new Date().toISOString()
  });

  debugLog(
    "Extension configuration:",
    vscode.workspace.getConfiguration("aiCommitAssistant")
  );

  // Log supported API providers, now including Anthropic, DeepSeek, Grok, and Perplexity
  debugLog("Supported API providers: Gemini, Hugging Face, Ollama, Mistral, Cohere, OpenAI, Together AI, OpenRouter, Anthropic, GitHub Copilot, DeepSeek, Grok, Perplexity");

  // Note: VS Code SCM API doesn't provide access to existing source controls
  // so we cannot clean up previous providers programmatically

  // Create loading indicator with cancel functionality
  let loadingItem: vscode.StatusBarItem | undefined;
  let isGenerating = false;

  // Create SCM-specific status bar item
  const scmStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  scmStatusBarItem.text = "$(github-action) Generate Commit";
  scmStatusBarItem.tooltip = "Generate AI Commit Message";
  scmStatusBarItem.command = "ai-commit-assistant.generateCommitMessage";

  // Register debug toggle command
  let toggleDebugCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.toggleDebug",
    async () => {
      const config = vscode.workspace.getConfiguration("aiCommitAssistant");
      const currentDebug = config.get<boolean>("debug") || false;
      await config.update("debug", !currentDebug, true);
      debugLog(`Debug mode ${!currentDebug ? "enabled" : "disabled"}`);
      vscode.window.showInformationMessage(
        `Debug mode ${!currentDebug ? "enabled" : "disabled"}`
      );
    }
  );

  // Register cancel command
  let cancelCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.cancelGeneration",
    async () => {
      if (isGenerating) {
        cancelCurrentRequest();
        isGenerating = false;

        // Clean up loading indicator
        if (loadingItem) {
          loadingItem.dispose();
          loadingItem = undefined;
        }

        await vscode.commands.executeCommand(
          "setContext",
          "ai-commit-assistant.isGenerating",
          false
        );

        vscode.window.showInformationMessage("Commit message generation cancelled");
      }
    }
  );

  // Register main command with telemetry tracking
  let generateCommitCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.generateCommitMessage",
    async () => {
      const startTime = Date.now();
      const apiConfig = getApiConfig();

      try {
        debugLog("Command Started: generateCommitMessage");
        telemetryService.trackEvent('command.generateCommit.started', {
          'provider': apiConfig.type
        });

        // If already generating, cancel the current request
        if (isGenerating) {
          await vscode.commands.executeCommand("ai-commit-assistant.cancelGeneration");
          telemetryService.trackEvent('command.generateCommit.cancelled');
          return;
        }

        isGenerating = true;

        // Set the loading context first, before creating the indicator
        await vscode.commands.executeCommand(
          "setContext",
          "ai-commit-assistant.isGenerating",
          true
        );

        // Create and show loading indicator with cancel option
        loadingItem = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Right
        );
        loadingItem.text = "$(sync~spin) Generating... $(close) Cancel";
        loadingItem.tooltip = "AI is generating commit message. Click to cancel.";
        loadingItem.command = "ai-commit-assistant.cancelGeneration";
        loadingItem.show();

        // Check if current directory is a git repository
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          telemetryService.trackEvent('command.generateCommit.failed', {
            'error': 'no_workspace_folder'
          });
          vscode.window.showErrorMessage("No workspace folder is open");
          return;
        }
        try {
          await validateGitRepository(workspaceFolders[0]);
        } catch (error) {
          telemetryService.trackEvent('command.generateCommit.failed', {
            'error': 'not_git_repository'
          });
          vscode.window.showErrorMessage(
            "This is not a git repository. Please initialize git first."
          );
          return;
        }

        // Get git diff
        const diff = await getDiff(workspaceFolders[0]);
        if (!diff || diff.trim() === "") {
          telemetryService.trackEvent('command.generateCommit.failed', {
            'error': 'no_changes'
          });
          vscode.window.showInformationMessage(
            "No changes detected to generate a commit message for."
          );
          return;
        }

        // Get custom context if enabled
        const customContext = await PromptManager.getCustomContext();

        // Generate commit message with timeout
        const message = await Promise.race([
          generateCommitMessage(apiConfig, diff, customContext),
          new Promise<string>((_, reject) => {
            setTimeout(() => reject(new Error("Request timed out after 60 seconds")), 60000);
          })
        ]);

        const duration = Date.now() - startTime;

        if (message && message.trim() !== "") {
          // Process the AI response
          const formattedMessage = await processResponse(message);
          // Set the message in the SCM input box
          await setCommitMessage(formattedMessage);

          telemetryService.trackCommitGeneration(
            apiConfig.type,
            true,
            duration,
            Math.ceil(diff.length / 4) // Rough token estimation
          );

          vscode.window.showInformationMessage(
            "Commit message generated successfully!"
          );
        } else {
          telemetryService.trackCommitGeneration(
            apiConfig.type,
            false,
            duration,
            undefined,
            'empty_response'
          );
          // Only show generic message if we don't have a specific error
          vscode.window.showWarningMessage(
            "No commit message was generated. This may be due to API limitations or configuration issues."
          );
        }

      } catch (error) {
        const duration = Date.now() - startTime;
        debugLog("Generate Commit Error:", error);

        // Track the error
        if (error instanceof Error) {
          telemetryService.trackException(error, {
            'command': 'generateCommit',
            'provider': apiConfig.type
          });
          telemetryService.trackCommitGeneration(
            apiConfig.type,
            false,
            duration,
            undefined,
            error.name
          );
        }

        // Handle cancellation specifically
        if (error instanceof Error && error.message === 'Request was cancelled') {
          telemetryService.trackEvent('command.generateCommit.cancelled', {
            'duration.ms': duration.toString()
          });
          vscode.window.showInformationMessage("Commit message generation cancelled");
        } else if (error instanceof Error) {
          // Show the specific error message from our enhanced error handling
          const errorMessage = error.message;

          // For token limit errors, show as warning instead of error for better UX
          if (errorMessage.includes('too large') || errorMessage.includes('exceed') || errorMessage.includes('tokens')) {
            vscode.window.showWarningMessage(errorMessage, { modal: true });
          } else {
            vscode.window.showErrorMessage(errorMessage, { modal: true });
          }
        } else {
          vscode.window.showErrorMessage(
            "An unexpected error occurred while generating the commit message. Please check the debug logs for more details."
          );
        }
      } finally {
        isGenerating = false;

        // Clean up loading indicator
        if (loadingItem) {
          loadingItem.dispose();
          loadingItem = undefined;
        }
        await vscode.commands.executeCommand(
          "setContext",
          "ai-commit-assistant.isGenerating",
          false
        );
      }
    }
  );

  // Register API check command with telemetry
  let checkApiSetupCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.checkApiSetup",
    async () => {
      const startTime = Date.now();
      try {
        // Get the current provider from settings
        const apiConfig = getApiConfig();
        const provider = apiConfig.type;

        telemetryService.trackEvent('command.checkApiSetup.started', {
          'provider': provider
        });

        // Show a progress notification
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Testing ${provider} API connection...`,
            cancellable: false
          },
          async () => {
            try {
              const result = await Promise.race([
                checkApiSetup(),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error("Connection test timed out after 15 seconds")), 15000)
                )
              ]);

              const duration = Date.now() - startTime;
              telemetryService.trackAPIValidation(provider, result.success, duration);

              // Send results to webview
              if (SettingsWebview.isWebviewOpen()) {
                SettingsWebview.postMessageToWebview({
                  command: 'apiCheckResult',
                  success: result.success,
                  provider: provider,
                  model: result.model,
                  responseTime: result.responseTime,
                  details: result.details,
                  error: result.error,
                  warning: result.warning,
                  troubleshooting: result.troubleshooting
                });
              } else {
                // Show a notification if webview isn't open
                if (result.success) {
                  vscode.window.showInformationMessage(`${provider} API connection successful!`);
                } else {
                  vscode.window.showErrorMessage(`${provider} API connection failed: ${result.error}`);
                }
              }
            } catch (error) {
              const duration = Date.now() - startTime;
              debugLog("API Check Error (inner):", error);

              telemetryService.trackException(error as Error, {
                'command': 'checkApiSetup',
                'provider': provider
              });
              telemetryService.trackAPIValidation(provider, false, duration);

              // Send error to webview
              if (SettingsWebview.isWebviewOpen()) {
                SettingsWebview.postMessageToWebview({
                  command: 'apiCheckResult',
                  success: false,
                  provider: provider,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  troubleshooting: "Please check your API key and network connection."
                });
              } else {
                vscode.window.showErrorMessage(`API connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
        );
      } catch (error) {
        debugLog("API Check Error (outer):", error);
        telemetryService.trackException(error as Error, {
          'command': 'checkApiSetup'
        });
        vscode.window.showErrorMessage(`Error checking API: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Register rate limits check command with enhanced feedback
  let checkRateLimitsCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.checkRateLimits",
    async () => {
      try {
        // Get the current provider from settings
        const apiConfig = getApiConfig();
        const provider = apiConfig.type;

        // Show a progress notification
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Checking ${provider} rate limits...`,
            cancellable: false
          },
          async () => {
            try {
              const result = await Promise.race([
                checkRateLimits(),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error("Rate limits check timed out after 15 seconds")), 15000)
                )
              ]);

              // Send results to webview
              if (SettingsWebview.isWebviewOpen()) {
                SettingsWebview.postMessageToWebview({
                  command: 'rateLimitsResult',
                  success: result.success,
                  limits: result.limits,
                  notes: result.notes,
                  error: result.error
                });
              } else {
                // Show a notification if webview isn't open
                if (result.success) {
                  vscode.window.showInformationMessage(`${provider} rate limits retrieved successfully`);
                } else {
                  vscode.window.showErrorMessage(`Failed to retrieve ${provider} rate limits: ${result.error}`);
                }
              }
            } catch (error) {
              debugLog("Rate Limits Check Error (inner):", error);

              // Send error to webview
              if (SettingsWebview.isWebviewOpen()) {
                SettingsWebview.postMessageToWebview({
                  command: 'rateLimitsResult',
                  success: false,
                  provider: provider,
                  error: error instanceof Error ? error.message : 'Unknown error'
                });
              } else {
                vscode.window.showErrorMessage(`Rate limits check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
        );
      } catch (error) {
        debugLog("Rate Limits Check Error (outer):", error);
        vscode.window.showErrorMessage(`Error checking rate limits: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Register command to load Mistral models
  let loadMistralModelsCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.loadMistralModels",
    async () => {
      try {
        const config = getApiConfig();
        if (config.type !== "mistral" || !config.apiKey) {
          throw new Error("Mistral API key is required to load models");
        }

        // Show progress notification
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Loading Mistral models...",
            cancellable: false
          },
          async () => {
            try {
              const models = await fetchMistralModels(config.apiKey);

              // Send models to webview
              if (SettingsWebview.isWebviewOpen()) {
                SettingsWebview.postMessageToWebview({
                  command: 'mistralModelsLoaded',
                  success: true,
                  models: models
                });
              }
            } catch (error) {
              debugLog("Load Mistral Models Error:", error);

              // Send error to webview
              if (SettingsWebview.isWebviewOpen()) {
                SettingsWebview.postMessageToWebview({
                  command: 'mistralModelsLoaded',
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error'
                });
              }
            }
          }
        );
      } catch (error) {
        debugLog("Load Mistral Models Error:", error);
        vscode.window.showErrorMessage(`Error loading Mistral models: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  // Register command to load Hugging Face models
  let loadHuggingFaceModelsCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.loadHuggingFaceModels",
    async () => {
      try {
        const config = getApiConfig();
        if (config.type !== "huggingface" || !config.apiKey) {
          throw new Error("Hugging Face API key is required to load models");
        }

        // Show progress notification
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Loading Hugging Face models...",
            cancellable: false
          },
          async () => {
            try {
              const models = await fetchHuggingFaceModels(config.apiKey);

              // Send models to webview
              if (SettingsWebview.isWebviewOpen()) {
                SettingsWebview.postMessageToWebview({
                  command: 'huggingfaceModelsLoaded',
                  success: true,
                  models: models
                });
              }
            } catch (error) {
              debugLog("Load Hugging Face Models Error:", error);

              // Send error to webview
              if (SettingsWebview.isWebviewOpen()) {
                SettingsWebview.postMessageToWebview({
                  command: 'huggingfaceModelsLoaded',
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error'
                });
              }
            }
          }
        );
      } catch (error) {
        debugLog("Load Hugging Face Models Error:", error);
        vscode.window.showErrorMessage(`Error loading Hugging Face models: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  let loadingIndicatorCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.loadingIndicator",
    () => {
      // This is just a placeholder command that will be associated with the loading icon
      // The actual loading icon is created dynamically
    }
  );

  // Register Accept Input command
  let acceptInputCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.acceptInput",
    () => {
      // This command is used for UI interactions and input acceptance
      debugLog("Accept input command triggered");
    }
  );

  // Register Open Settings command
  let settingsCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.openSettings",
    () => {
      SettingsWebview.createOrShow(context.extensionUri);
      telemetryService.trackEvent('settings.opened');
    }
  );

  // Register Clear Last Custom Prompt command
  let clearLastPromptCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.clearLastPrompt",
    async () => {
      try {
        const lastPrompt = PromptManager.getLastPrompt();
        if (!lastPrompt) {
          vscode.window.showInformationMessage("No saved custom prompt to clear.");
          return;
        }

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
      } catch (error) {
        debugLog("Clear Last Prompt Error:", error);
        vscode.window.showErrorMessage("Failed to clear the last custom prompt.");
      }
    }
  );

  // Register View Last Custom Prompt command
  let viewLastPromptCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.viewLastPrompt",
    async () => {
      try {
        const lastPrompt = PromptManager.getLastPrompt();
        if (!lastPrompt) {
          vscode.window.showInformationMessage("No saved custom prompt available.");
          return;
        }

        const action = await vscode.window.showInformationMessage(
          `Last saved custom prompt:\n\n"${lastPrompt}"`,
          { modal: true },
          "Copy to Clipboard",
          "Clear Prompt",
          "Close"
        );

        if (action === "Copy to Clipboard") {
          await vscode.env.clipboard.writeText(lastPrompt);
          vscode.window.showInformationMessage("Prompt copied to clipboard!");
        } else if (action === "Clear Prompt") {
          await vscode.commands.executeCommand("ai-commit-assistant.clearLastPrompt");
        }
      } catch (error) {
        debugLog("View Last Prompt Error:", error);
        vscode.window.showErrorMessage("Failed to view the last custom prompt.");
      }
    }
  );

  // Register Open Onboarding command
  let openOnboardingCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.openOnboarding",
    () => {
      OnboardingWebview.createOrShow(context.extensionUri);
      telemetryService.trackEvent('onboarding.opened');
    }
  );

  // Register Complete Onboarding command
  let completeOnboardingCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.completeOnboarding",
    async () => {
      await context.globalState.update('aiCommitAssistant.onboardingShown', true);
      vscode.window.showInformationMessage("🎉 Welcome to GitMind! You're all set up and ready to generate amazing commit messages.");
      telemetryService.trackEvent('onboarding.completed');

      // Close onboarding webview
      if (OnboardingWebview.isWebviewOpen()) {
        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    }
  );

  // Register Skip Onboarding command
  let skipOnboardingCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.skipOnboarding",
    async () => {
      await context.globalState.update('aiCommitAssistant.onboardingShown', true);
      vscode.window.showInformationMessage("Onboarding skipped. You can access settings anytime through the command palette.");
      telemetryService.trackEvent('onboarding.skipped');

      // Close onboarding webview
      if (OnboardingWebview.isWebviewOpen()) {
        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    }
  );

  // Register all disposables
  context.subscriptions.push(
    state.debugChannel,
    state.statusBarItem,
    scmStatusBarItem,
    toggleDebugCommand,
    generateCommitCommand,
    cancelCommand,
    acceptInputCommand,
    settingsCommand,
    checkApiSetupCommand,
    checkRateLimitsCommand,
    loadMistralModelsCommand,
    loadHuggingFaceModelsCommand,
    clearLastPromptCommand,
    viewLastPromptCommand,
    loadingIndicatorCommand,
    openOnboardingCommand,
    completeOnboardingCommand,
    skipOnboardingCommand
  );

  // Show onboarding for new users
  const hasShownOnboarding = context.globalState.get<boolean>('aiCommitAssistant.onboardingShown');
  if (!hasShownOnboarding) {
    // Use the new interactive onboarding webview
    OnboardingWebview.createOrShow(context.extensionUri);
    telemetryService.trackEvent('extension.onboarding.webview.shown');
  } else {
    // For returning users, just log the activation
    telemetryService.trackEvent('extension.activation.existing_user');
  }

  // Show SCM status bar item if Git is active
  const gitExtension = vscode.extensions.getExtension("vscode.git");
  if (gitExtension && gitExtension.isActive) {
    scmStatusBarItem.show();
  }

  debugLog("GitMind extension activated successfully with all icons");
  telemetryService.trackEvent('extension.activation.completed');
}

export function deactivate() {
  telemetryService.trackEvent('extension.deactivated');
  telemetryService.flush();

  // Note: VS Code SCM API doesn't provide access to source controls for cleanup
  if (state.debugChannel) {
    state.debugChannel.dispose();
  }
  if (state.statusBarItem) {
    state.statusBarItem.dispose();
  }
}