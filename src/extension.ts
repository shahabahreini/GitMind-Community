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
import { SecureKeyManager } from "./services/encryption/SecureKeyManager";
import { SubscriptionManager } from "./services/subscription/SubscriptionManager";
import { ProActivationService } from "./services/subscription/ProActivationService";
import { LemonSqueezyService } from "./services/subscription/LemonSqueezyService";
import { ProNotificationService } from "./services/subscription/ProNotificationService";
import { SettingsMigrationService } from "./services/migration/SettingsMigrationService";
import { learnFromCommitHistory } from "./services/ai/learnFromCommitHistory";
import { CommitStyleManager } from "./services/commitStyleManager";
import { GitmojiService } from "./services/gitmoji/GitmojiService";
import { generateChangelog, updateChangelog } from "./services/changelog/generateChangelog";


const state: ExtensionState = {
  context: undefined,
};

export { state };

import { registerCommands, SUPPORTED_PROVIDERS } from "./commands/index";
import { LegacyEntitlementService } from "./services/subscription/LegacyEntitlementService";
import { isProUser, isLegacyProUser } from "./utils/proHelpers";
import { configChangeDisposable, updateCommitIntelligenceContext } from "./config/settings";
import { CommitWorkspace } from "./webview/commit/CommitWorkspace";

/**
 * Reflects the current Pro/Free license state in the status bar and a context key.
 * Safe to call any time license state may have changed (activate/deactivate/refresh).
 */
export function updateProStatusBar(): void {
  const item = state.statusBarItem;
  if (!item) {
    return;
  }

  const isPro = isProUser();
  // Drives walkthrough completion and any when-clauses that depend on Pro state.
  void vscode.commands.executeCommand('setContext', 'gitmind.isPro', isPro);

  if (isPro && isLegacyProUser()) {
    item.text = "$(verified) GitMind Pro";
    item.tooltip =
      "GitMind Pro is active. Your license predates our payment provider change — " +
      "no action needed. Click to manage your license.";
    item.command = "gitmind.manageSubscription";
  } else if (isPro) {
    item.text = "$(verified) GitMind Pro";
    item.tooltip = "GitMind Pro is active — click to manage your license";
    item.command = "gitmind.manageSubscription";
  } else {
    item.text = "$(star-empty) GitMind: Free";
    item.tooltip = "Activate GitMind Pro";
    item.command = "gitmind.showActivationQuickPick";
  }
  item.show();
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  state.statusBarItem = statusBarItem;
  state.context = context;
  context.subscriptions.push(await initializeLogger(undefined, context));
  debugLog("GitMind is now active");

  // Perform settings migration and cleanup first
  const migrationService = SettingsMigrationService.getInstance();
  await migrationService.migrateAndCleanupSettings(context);

  // Adopt any Pro customer inherited from the suspended Lemon Squeezy store before anything
  // else asks whether they are Pro. isProUser() is synchronous and reads the record this
  // writes, so running late here would briefly present a paying customer as Free.
  await LegacyEntitlementService.getInstance().initialize(context);
  debugLog("LegacyEntitlementService initialized");

  // Initialize SecureKeyManager
  const secureKeyManager = SecureKeyManager.getInstance();
  secureKeyManager.initialize(context);
  debugLog("SecureKeyManager initialized");

  // Initialize SubscriptionManager
  const subscriptionManager = SubscriptionManager.getInstance();
  subscriptionManager.initialize(context);
  debugLog("SubscriptionManager initialized");

  // Initialize ProNotificationService
  const proNotificationService = ProNotificationService.getInstance();
  proNotificationService.initialize(context);
  debugLog("ProNotificationService initialized");

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

  // Reflect Pro/Free state in the status bar + context key.
  // Exposed as an internal command so other modules can trigger a refresh
  // without importing extension.ts (avoids a circular import).
  context.subscriptions.push(
    configChangeDisposable,
    vscode.commands.registerCommand('gitmind.internalUpdateProStatusBar', () => updateProStatusBar())
  );
  updateProStatusBar();
  await updateCommitIntelligenceContext();

  // Set up periodic license validation (every 24 hours)
  const VALIDATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  const validationTimer = setInterval(async () => {
    try {
      await proActivationService.validateExistingLicense();
      updateProStatusBar();
    } catch (error) {
      debugLog("Periodic license validation failed:", error);
    }
  }, VALIDATION_INTERVAL);

  context.subscriptions.push({
    dispose: () => {
      clearInterval(validationTimer);
    }
  });

  debugLog("Extension configuration:", vscode.workspace.getConfiguration("gitmind"));
  debugLog(`Supported API providers: ${SUPPORTED_PROVIDERS.join(", ")}`);

  const scmStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  scmStatusBarItem.text = "$(github-action) GitMind: Generate Commit";
  scmStatusBarItem.tooltip = "Generate GitMind Commit Message";
  scmStatusBarItem.command = "gitmind.generateCommitMessage";

  const commands = registerCommands(context);

  // Deep-link activation handler so the post-purchase "thank you" page can one-click
  // activate Pro, e.g. vscode://ShahabBahreiniJangjoo.ai-commit-assistant/activate?key=XXXX
  const uriHandler = vscode.window.registerUriHandler({
    handleUri(uri: vscode.Uri) {
      debugLog(`Received URI: ${uri.toString()}`);
      if (uri.path !== '/activate') {
        return;
      }
      const params = new URLSearchParams(uri.query);
      const key = params.get('key');
      if (key) {
        vscode.commands.executeCommand('gitmind.activateWithLicenseKey', key);
      } else {
        vscode.commands.executeCommand('gitmind.showActivationQuickPick');
      }
    }
  });

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
    statusBarItem,
    scmStatusBarItem,
    configChangeListener, // Add the configuration listener
    uriHandler,
    ...commands
  );

  const shouldShowOnboarding = await OnboardingManager.shouldShowOnboarding(context);

  if (shouldShowOnboarding) {
    OnboardingWebview.createOrShow(context.extensionUri);
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
}

export function deactivate(): void {
  CommitWorkspace.disposeAll();
  state.debugChannel = undefined;
  state.statusBarItem = undefined;
  state.context = undefined;
}
