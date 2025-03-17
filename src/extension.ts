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
import { OnboardingManager } from "./utils/onboardingManager";
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

  // Log supported API providers, now including OpenAI
  debugLog("Supported API providers: Gemini, Hugging Face, Ollama, Mistral, Cohere, OpenAI");

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

        // Create and show loading indicator
        loadingItem = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Right
        );
        loadingItem.text = "$(sync~spin) Generating commit message...";
        loadingItem.show();

        await vscode.commands.executeCommand(
          "setContext",
          "ai-commit-assistant.isGenerating",
          true
        );

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          throw new Error("No workspace folder found");
        }

        await validateGitRepository(workspaceFolder);
        const diff = await getDiff(workspaceFolder);

        if (!diff) {
          vscode.window.showInformationMessage(
            "No changes detected to generate commit message."
          );
          return;
        }

        // Check if prompt customization is enabled
        const config = vscode.workspace.getConfiguration("aiCommitAssistant");
        const promptCustomizationEnabled = config.get("promptCustomization.enabled", false);

        // Get custom context if enabled
        let customContext = "";
        if (promptCustomizationEnabled) {
          customContext = await vscode.window.showInputBox({
            prompt: "Add any additional context to help generate a better commit message",
            placeHolder: "e.g., Fixing the login bug, Implementing feature X, etc.",
            ignoreFocusOut: true
          }) || "";
        }

        const apiConfig = getApiConfig();
        const rawResponse = await generateCommitMessage(apiConfig, diff, customContext);

        // Only process and set the commit message if we got a response
        if (rawResponse) {
          const commitMessage = await processResponse(rawResponse);
          if (commitMessage) {
            await setCommitMessage(commitMessage);
          }
        }
      } catch (error: unknown) {
        debugLog("Command Error:", error);
        if (error instanceof Error) {
          // Only show error message if it's not an API configuration error
          if (!error.message.includes("API configuration required")) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
          }
        } else {
          vscode.window.showErrorMessage("An unknown error occurred");
        }
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
