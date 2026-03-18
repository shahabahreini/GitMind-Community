import * as vscode from "vscode";
import { CommitStyle, ExtensionState } from "./config/types";
import { getApiConfig } from "./config/settings";
import { generateCommitMessage, cancelCurrentRequest, isRequestActive } from "./services/api";
import { checkApiSetup, checkRateLimits } from "./services/api/validation";
import {
  validateGitRepository,
  getDiff,
  setCommitMessage,
} from "./services/git/repository";
import { initializeLogger, debugLog } from "./services/debug/logger";
import { processCommitMessage } from "./services/api/responseProcessor";
import { getPromptConfig } from "./services/api/prompts";
import { SettingsWebview } from "./webview/settings/SettingsWebview";
import { OnboardingWebview } from "./webview/onboarding/OnboardingWebview";
import { OnboardingManager, OnboardingStep } from "./utils/onboardingManager";
import { fetchMistralModels } from "./services/api/mistral";
import { fetchHuggingFaceModels } from "./services/api/huggingface";
import { fetchCohereModels } from "./services/api/cohere";
import { fetchTogetherModels } from "./services/api/together";
import { fetchGrokModels } from "./services/api/grok";
import { fetchGroqModels } from "./services/api/groq";
import { fetchDeepSeekModels } from "./services/api/deepseek";
import { fetchGeminiModels } from "./services/api/gemini";
import { fetchAnthropicModels } from "./services/api/anthropic";
import { fetchMiniMaxModels } from "./services/api/minimax";
import { fetchOpenRouterModels } from "./services/api/openrouter";
import { fetchCopilotModels } from "./services/api/copilot";
import { fetchOpenAIModels } from "./services/api/openai";
import { fetchZaiModels } from "./services/api/zai";
import { PromptManager } from "./services/promptManager";
import { telemetryService } from "./services/telemetry/telemetryService";
import { SecureKeyManager } from "./services/encryption/SecureKeyManager";
import { SubscriptionManager } from "./services/subscription/SubscriptionManager";
import { ProActivationService } from "./services/subscription/ProActivationService";
import { LemonSqueezyService } from "./services/subscription/LemonSqueezyService";
import { SettingsMigrationService } from "./services/migration/SettingsMigrationService";
import { learnFromCommitHistory } from "./services/ai/learnFromCommitHistory";
import { CommitStyleManager } from "./services/commitStyleManager";
import { GitmojiService } from "./services/gitmoji/GitmojiService";
import { generateChangelog, updateChangelog } from "./services/changelog/generateChangelog";


const state: ExtensionState = {
  debugChannel: vscode.window.createOutputChannel("GitMind Debug"),
  statusBarItem: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100),
  context: undefined,
};

export { state };

import { registerCommands } from "./commands/index";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  state.context = context;
  context.subscriptions.push(await initializeLogger(state.debugChannel, context));
  debugLog("GitMind is now active");

  // Perform settings migration and cleanup first
  const migrationService = SettingsMigrationService.getInstance();
  await migrationService.migrateAndCleanupSettings();

  // Initialize SecureKeyManager
  const secureKeyManager = SecureKeyManager.getInstance();
  secureKeyManager.initialize(context);
  debugLog("SecureKeyManager initialized");

  // Initialize SubscriptionManager
  const subscriptionManager = SubscriptionManager.getInstance();
  subscriptionManager.initialize(context);
  debugLog("SubscriptionManager initialized");

  // Initialize ProActivationService
  const proActivationService = ProActivationService.getInstance();
  debugLog("ProActivationService initialized");

  // Auto-migrate based on user status (handle free users with encryption enabled)
  await secureKeyManager.autoMigrateBasedOnUserStatus();

  // Perform startup license validation
  try {
    await proActivationService.validateExistingLicense();
  } catch (error) {
    debugLog("Startup license validation failed:", error);
  }

  // Set up periodic license validation (every 24 hours)
  const VALIDATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  const validationTimer = setInterval(async () => {
    try {
      await proActivationService.validateExistingLicense();
    } catch (error) {
      debugLog("Periodic license validation failed:", error);
    }
  }, VALIDATION_INTERVAL);

  context.subscriptions.push({
    dispose: () => {
      clearInterval(validationTimer);
    }
  });

  await telemetryService.initialize(context);

  // Debug: Check telemetry configuration from all scopes
  const config = vscode.workspace.getConfiguration("gitmind");
  const telemetryInspect = config.inspect("telemetry.enabled");
  debugLog("Telemetry configuration inspection:", telemetryInspect);
  debugLog("Telemetry setting value:", config.get("telemetry.enabled"));

  telemetryService.trackDailyActiveUser();

  debugLog("Extension configuration:", vscode.workspace.getConfiguration("gitmind"));
  debugLog(`Supported API providers: ${SUPPORTED_PROVIDERS.join(", ")}`);

  const scmStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  scmStatusBarItem.text = "$(github-action) GitMind: Generate Commit";
  scmStatusBarItem.tooltip = "Generate GitMind Commit Message";
  scmStatusBarItem.command = "gitmind.generateCommitMessage";

  const commands = registerCommands(context);

  // Add configuration change listener for encryption toggle and license key security
  const configChangeListener = vscode.workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration('gitmind.pro.encryptionEnabled')) {
      debugLog('Encryption setting changed, handling toggle...');
      const config = vscode.workspace.getConfiguration('gitmind');
      const encryptionEnabled = config.get<boolean>('pro.encryptionEnabled', false);

      try {
        const { EncryptionHelper } = await import('./utils/encryptionHelper.js');
        const result = await EncryptionHelper.handleEncryptionToggle(context, encryptionEnabled);
        if (result.success) {
          vscode.window.showInformationMessage(`GitMind: ${result.message}`);
          debugLog('Encryption toggle handled successfully:', result.details);
        } else {
          vscode.window.showWarningMessage(`GitMind: ${result.message}`);
          debugLog('Encryption toggle failed:', result.message);
        }
      } catch (error) {
        debugLog('Error handling encryption toggle:', error);
        vscode.window.showErrorMessage('GitMind: Failed to toggle encryption');
      }
    }

    // Handle license key security
    if (event.affectsConfiguration('gitmind.pro.licenseKey')) {
      debugLog('License key setting changed, securing license key...');
      const config = vscode.workspace.getConfiguration('gitmind');
      const licenseKey = config.get<string>('pro.licenseKey', '');

      // If a new license key was set and it's not already the placeholder, secure it
      if (licenseKey && licenseKey !== '[ENCRYPTED]' && licenseKey.length > 10) {
        try {
          const { EncryptionHelper } = await import('./utils/encryptionHelper.js');
          await EncryptionHelper.storeLicenseKey(context, licenseKey);
          debugLog('License key secured successfully');
        } catch (error) {
          debugLog('Error securing license key:', error);
        }
      }
    }
  });

  context.subscriptions.push(
    state.debugChannel,
    state.statusBarItem,
    scmStatusBarItem,
    configChangeListener, // Add the configuration listener
    ...commands
  );

  const shouldShowOnboarding = await OnboardingManager.shouldShowOnboarding(context);

  if (shouldShowOnboarding) {
    OnboardingWebview.createOrShow(context.extensionUri);
    // Removed non-essential telemetry tracking
  } else {
    // Removed non-essential telemetry tracking
  }

  // Auto-migrate API keys for pro users
  try {
    if (secureKeyManager.isEncryptionAvailable()) {
      await secureKeyManager.migrateToSecureStorage();
    }
  } catch (error) {
    debugLog("Auto-migration failed:", error);
    // Don't show error to user as this is optional
  }

  const gitExtension = vscode.extensions.getExtension("vscode.git");
  if (gitExtension?.isActive) {
    scmStatusBarItem.show();
  }

  debugLog("GitMind extension activated successfully with all icons");
  // Removed non-essential telemetry tracking
}

export function deactivate(): void {
  // Removed non-essential telemetry tracking
  telemetryService.flush();

  state.debugChannel?.dispose();
  state.statusBarItem?.dispose();
}