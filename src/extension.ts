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

        const apiConfig = getApiConfig();
        const rawResponse = await generateCommitMessage(apiConfig, diff);

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
        await vscode.commands.executeCommand(
          "ai-commit-assistant.generateCommitMessage"
        );
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
    settingsCommand
  );

  // Activate API check and limit rate check
  let checkApiSetupCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.checkApiSetup",
    async () => {
      await checkApiSetup();
    }
  );

  let checkRateLimitsCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.checkRateLimits",
    async () => {
      await checkRateLimits();
    }
  );
  context.subscriptions.push(
    checkApiSetupCommand,
    checkRateLimitsCommand,
    checkApiSetupCommand,
    checkRateLimitsCommand
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
