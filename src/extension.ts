import * as vscode from "vscode";
import { ExtensionState } from "./config/types";
import { getApiConfig } from "./config/settings";
import { generateCommitMessage } from "./services/api";
import { checkApiSetup, checkRateLimits } from "./services/api/validation";
import {
  validateGitRepository,
  getDiff,
  setCommitMessage,
} from "./services/git/repository";
import { initializeLogger, debugLog } from "./services/debug/logger";
import { processResponse } from "./utils/commitFormatter";
import { SettingsWebview } from "./webview/settings/SettingsWebview";
import { OnboardingManager, OnboardingStep } from "./utils/onboardingManager";
import { fetchMistralModels } from "./services/api/mistral";
// Add import for Cohere (if needed in the future)
// import { fetchCohereModels } from "./services/api/cohere";

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
  debugLog(
    "Extension configuration:",
    vscode.workspace.getConfiguration("aiCommitAssistant")
  );

  // Log supported API providers, now including Together AI
  debugLog("Supported API providers: Gemini, Hugging Face, Ollama, Mistral, Cohere, OpenAI, Together AI, OpenRouter");

  // Initialize SCM provider
  const scmProvider = vscode.scm.createSourceControl(
    "ai-commit-assistant",
    "AI Commit Assistant"
  );
  const inputBox = scmProvider.inputBox;

  // Create SCM resource group
  const generateActionButton = scmProvider.createResourceGroup(
    "generate",
    "Generate Commit Message"
  );
  generateActionButton.hideWhenEmpty = true;

  // Configure SCM provider
  scmProvider.quickDiffProvider = undefined;
  scmProvider.acceptInputCommand = {
    command: "ai-commit-assistant.generateCommitMessage",
    title: "Generate AI Commit Message",
  };

  // Create loading indicator
  let loadingItem: vscode.StatusBarItem | undefined;

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

  // Register main command
  let generateCommitCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.generateCommitMessage",
    async () => {
      try {
        debugLog("Command Started: generateCommitMessage");

        // Set the loading context first, before creating the indicator
        await vscode.commands.executeCommand(
          "setContext",
          "ai-commit-assistant.isGenerating",
          true
        );

        // Create and show loading indicator with animation
        loadingItem = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Right
        );
        loadingItem.text = "$(sync~spin) Generating commit message...";
        loadingItem.tooltip = "AI Commit Assistant is generating a commit message";
        loadingItem.show();

        // Check if current directory is a git repository
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          vscode.window.showErrorMessage("No workspace folder is open");
          return;
        }
        try {
          await validateGitRepository(workspaceFolders[0]);
        } catch (error) {
          vscode.window.showErrorMessage(
            "This is not a git repository. Please initialize git first."
          );
          return;
        }

        // Get configuration
        const apiConfig = getApiConfig();

        // Get git diff
        const diff = await getDiff(workspaceFolders[0]);
        if (!diff || diff.trim() === "") {
          vscode.window.showInformationMessage(
            "No changes detected to generate a commit message for."
          );
          return;
        }

        // Get custom context if enabled
        let customContext = "";
        if (vscode.workspace.getConfiguration("aiCommitAssistant").get("promptCustomization.enabled")) {
          customContext = await vscode.window.showInputBox({
            prompt: "Add custom context for your commit (optional)",
            placeHolder: "e.g., Fixes #123, Implements feature X"
          }) || "";
        }

        // Generate commit message
        const message = await generateCommitMessage(apiConfig, diff, customContext);

        if (message && message.trim() !== "") {
          // Process the AI response
          const formattedMessage = await processResponse(message);
          // Set the message in the SCM input box
          await setCommitMessage(formattedMessage);
          vscode.window.showInformationMessage(
            "Commit message generated successfully!"
          );
        } else {
          vscode.window.showErrorMessage(
            "Failed to generate commit message. Please try again."
          );
        }

      } catch (error) {
        debugLog("Generate Commit Error:", error);
        vscode.window.showErrorMessage(
          `Error generating commit message: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      } finally {
        // Clean up loading indicator
        if (loadingItem) {
          loadingItem.dispose();
        }
        await vscode.commands.executeCommand(
          "setContext",
          "ai-commit-assistant.isGenerating",
          false
        );
      }
    }
  );

  // Register settings command
  let settingsCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.openSettings",
    () => {
      SettingsWebview.createOrShow(context.extensionUri);
    }
  );

  // Handle SCM visibility changes
  context.subscriptions.push(
    vscode.window.onDidChangeVisibleTextEditors(() => {
      const gitExtension = vscode.extensions.getExtension("vscode.git");
      if (gitExtension && gitExtension.isActive) {
        scmStatusBarItem.show();
      } else {
        scmStatusBarItem.hide();
      }
    })
  );

  // Register accept input command
  let acceptInputCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.acceptInput",
    async () => {
      const message = inputBox.value;
      if (message) {
        debugLog("Accepting input message:", message);
        try {
          // If there's already a message in the input box, use it directly
          // This allows users to manually edit or accept the generated message
          await vscode.commands.executeCommand("git.commit");
          vscode.window.showInformationMessage("Commit created successfully!");
        } catch (error) {
          debugLog("Accept Input Error:", error);
          vscode.window.showErrorMessage(`Error creating commit: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // If direct commit fails, fall back to generating a message
          await vscode.commands.executeCommand("ai-commit-assistant.generateCommitMessage");
        }
      } else {
        // If no message exists, generate one
        await vscode.commands.executeCommand("ai-commit-assistant.generateCommitMessage");
      }
    }
  );

  // Register API check command with enhanced feedback
  let checkApiSetupCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.checkApiSetup",
    async () => {
      try {
        // Get the current provider from settings
        const apiConfig = getApiConfig();
        const provider = apiConfig.type;

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
              debugLog("API Check Error (inner):", error);

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

  let loadingIndicatorCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.loadingIndicator",
    () => {
      // This is just a placeholder command that will be associated with the loading icon
      // The actual loading icon is created dynamically
    }
  );

  // Add to context.subscriptions
  context.subscriptions.push(
    // ...existing subscriptions
    loadingIndicatorCommand
  );

  // Register all disposables
  context.subscriptions.push(
    state.debugChannel,
    state.statusBarItem,
    scmStatusBarItem,
    scmProvider,
    toggleDebugCommand,
    generateCommitCommand,
    acceptInputCommand,
    settingsCommand,
    checkApiSetupCommand,
    checkRateLimitsCommand,
    loadMistralModelsCommand
  );

  // Show onboarding for new users
  await OnboardingManager.showOnboarding(context);

  // Update onboarding step to mention Together AI
  const steps: OnboardingStep[] = [
    {
      title: 'Step 1: Choose an AI Provider',
      content: 'GitMind supports multiple AI providers:\n• Gemini (Google)\n• Hugging Face\n• Ollama (Local)\n• Mistral AI\n• Cohere\n• OpenAI\n• Together AI\n• OpenRouter\n\nClick Next to learn how to configure your chosen provider.',
    },
    {
      title: 'Step 2: Configure API Settings',
      content: 'Open the settings panel using the command palette (Ctrl+Shift+P or Cmd+Shift+P) and search for "AI Commit: Open Settings".',
    },
    {
      title: 'Step 3: Generate Commit Messages',
      content: 'After making changes to your code, click the "Generate Commit" button in the Source Control panel or use the command palette.',
    },
    {
      title: 'Step 4: Review & Commit',
      content: 'Review the AI-generated commit message, make any needed edits, and commit your changes as usual.',
    }
  ];

  // Register steps with OnboardingManager
  OnboardingManager.registerSteps(steps);

  // Show SCM status bar item if Git is active
  const gitExtension = vscode.extensions.getExtension("vscode.git");
  if (gitExtension && gitExtension.isActive) {
    scmStatusBarItem.show();
  }
}

export function deactivate() {
  if (state.statusBarItem) {
    state.statusBarItem.dispose();
  }
  if (state.debugChannel) {
    state.debugChannel.dispose();
  }
}
