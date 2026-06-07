import * as vscode from "vscode";
import { CommitStyle, ExtensionState } from "../config/types";
import { getApiConfig } from "../config/settings";
import { generateCommitMessage, cancelCurrentRequest, isRequestActive } from "../services/api";
import { checkApiSetup, checkRateLimits } from "../services/api/validation";
import {
  validateGitRepository,
  getDiff,
  setCommitMessage,
} from "../services/git/repository";
import { initializeLogger, debugLog } from "../services/debug/logger";
import { processCommitMessage } from "../services/api/responseProcessor";
import { getPromptConfig } from "../services/api/prompts";
import { SettingsWebview } from "../webview/settings/SettingsWebview";
import { OnboardingWebview } from "../webview/onboarding/OnboardingWebview";
import { OnboardingManager, OnboardingStep } from "../utils/onboardingManager";
import { fetchMistralModels } from "../services/api/mistral";
import { fetchHuggingFaceModels } from "../services/api/huggingface";
import { fetchCohereModels } from "../services/api/cohere";
import { fetchTogetherModels } from "../services/api/together";
import { fetchGrokModels } from "../services/api/grok";
import { fetchGroqModels } from "../services/api/groq";
import { fetchDeepSeekModels } from "../services/api/deepseek";
import { fetchGeminiModels } from "../services/api/gemini";
import { fetchAnthropicModels } from "../services/api/anthropic";
import { fetchMiniMaxModels } from "../services/api/minimax";
import { fetchOpenRouterModels } from "../services/api/openrouter";
import { fetchCopilotModels } from "../services/api/copilot";
import { fetchOpenAIModels } from "../services/api/openai";
import { fetchZaiModels } from "../services/api/zai";
import { fetchPerplexityModels } from "../services/api/perplexity";
import { fetchNvidiaModels } from "../services/api/nvidia";
import { PromptManager } from "../services/promptManager";
import { telemetryService } from "../services/telemetry/telemetryService";
import { SecureKeyManager } from "../services/encryption/SecureKeyManager";
import { SubscriptionManager } from "../services/subscription/SubscriptionManager";
import { ProActivationService } from "../services/subscription/ProActivationService";
import { LemonSqueezyService } from "../services/subscription/LemonSqueezyService";
import { SettingsMigrationService } from "../services/migration/SettingsMigrationService";
import { learnFromCommitHistory } from "../services/ai/learnFromCommitHistory";
import { CommitStyleManager } from "../services/commitStyleManager";
import { GitmojiService } from "../services/gitmoji/GitmojiService";
import { generateChangelog, updateChangelog } from "../services/changelog/generateChangelog";

import { state } from "../extension";

// Constants
const TIMEOUT_DURATION = 60000;
const API_CHECK_TIMEOUT = 15000;
export const SUPPORTED_PROVIDERS = [
  "Gemini", "Hugging Face", "Ollama", "Mistral", "Cohere", "OpenAI",
  "Together AI", "OpenRouter", "Anthropic", "MiniMax", "GitHub Copilot", "DeepSeek", "Grok", "Groq", "Perplexity", "Z.ai", "NVIDIA", "Custom API"
];

const API_KEY_PROVIDERS = [
  'gemini', 'openai', 'mistral', 'cohere', 'huggingface', 'anthropic',
  'minimax', 'together', 'openrouter', 'deepseek', 'grok', 'groq', 'perplexity', 'zai', 'nvidia'
];


// Export state for access by other modules

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
    telemetryService.trackExtensionError(error.name, error.message, `command.${command}`);

    if (isGenerating) {
      telemetryService.trackCommitGeneration(provider, false, error.message);
    }

    if (error.message === 'Request was cancelled') {
      telemetryService.trackExtensionError('UserCancellation', 'Request was cancelled', `command.${command}`);
      vscode.window.showInformationMessage(`${command} cancelled`);
      return;
    }

    const isTokenError = error.message.includes('too large') ||
      error.message.includes('exceed') ||
      error.message.includes('tokens');

    const showMethod = isTokenError ? vscode.window.showWarningMessage : vscode.window.showErrorMessage;
    showMethod(error.message, { modal: true });
  } else {
    telemetryService.trackExtensionError('UnknownError', 'An unexpected error occurred', `command.${command}`);
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
    const apiConfig = await getApiConfig();
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
    const detailsSuffix = typeof result.details === 'string' && result.details.trim().length > 0
      ? `\n${result.details}`
      : '';

    const troubleshootingSuffix = typeof result.troubleshooting === 'string' && result.troubleshooting.trim().length > 0
      ? `\n\n${result.troubleshooting}`
      : '';

    const messageText = result.success
      ? `${provider} API connection successful!${detailsSuffix}`
      : `${provider} API connection failed: ${result.error}${detailsSuffix}${troubleshootingSuffix}`;

    const showMethod = result.success ? vscode.window.showInformationMessage : vscode.window.showErrorMessage;
    showMethod(messageText);
  }
}

// Command Handlers
async function handleGenerateCommit(repository?: any): Promise<void> {
  const startTime = Date.now();
  const apiConfig = await getApiConfig();
  let isGenerating = false;
  let loadingItem: vscode.StatusBarItem | undefined;

  try {
    debugLog("Command Started: generateCommitMessage");

    // Track that user is actively using the extension
    telemetryService.trackDailyActiveUser();

    if (isRequestActive()) {
      await vscode.commands.executeCommand("gitmind.cancelGeneration");
      return;
    }

    isGenerating = true;

    await vscode.commands.executeCommand("setContext", "gitmind.isGenerating", true);

    loadingItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    loadingItem.text = "$(sync~spin) Generating... $(close) Cancel";
    loadingItem.tooltip = "AI is generating commit message. Click to cancel.";
    loadingItem.command = "gitmind.cancelGeneration";
    loadingItem.show();

    // Determine which repository to use
    let targetRepository: vscode.WorkspaceFolder;
    let repoRoot: string;

    if (repository?.rootUri) {
      // Command triggered from SCM button - use specific repository
      debugLog(`Using repository from SCM context: ${repository.rootUri.fsPath}`);
      targetRepository = { uri: repository.rootUri, name: repository.rootUri.fsPath.split('/').pop() || 'repo', index: 0 };
      repoRoot = repository.rootUri.fsPath;
    } else {
      // Command triggered from command palette or other source - use workspace logic
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        telemetryService.trackExtensionError('ConfigurationError', 'No workspace folder is open', 'generateCommit');
        vscode.window.showErrorMessage("No workspace folder is open");
        return;
      }

      try {
        repoRoot = await validateGitRepository(workspaceFolders[0]);
        targetRepository = workspaceFolders[0];
        debugLog(`Found git repository at: ${repoRoot}`);
      } catch (error) {
        telemetryService.trackExtensionError('ConfigurationError', 'Not a git repository', 'generateCommit');
        vscode.window.showErrorMessage("This is not a git repository. Please initialize git first.");
        return;
      }
    }

    const diff = await getDiff(targetRepository, repoRoot);
    if (!diff?.trim()) {
      telemetryService.trackExtensionError('UserError', 'No changes detected', 'generateCommit');
      vscode.window.showInformationMessage("No changes detected to generate a commit message for.");
      return;
    }

    const customContext = await PromptManager.getCustomContext();

    // Note: Style validation moved to extension activation only
    // to prevent interfering with user style choices during commit generation

    const message = await Promise.race([
      generateCommitMessage(apiConfig, diff, customContext, repoRoot),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out after 60 seconds")), TIMEOUT_DURATION)
      )
    ]);

    const duration = Date.now() - startTime;

    if (message?.trim()) {
      const promptConfig = getPromptConfig();
      const formattedMessage = processCommitMessage(message, promptConfig);

      // Apply gitmoji if enabled and user has Pro access
      const gitmojiService = GitmojiService.getInstance();
      const messageString = formattedMessage.description
        ? `${formattedMessage.summary}\n\n${formattedMessage.description}`
        : formattedMessage.summary;
      const finalMessageString = await gitmojiService.addEmojiToCommit(messageString);

      // Convert back to CommitMessage format
      const lines = finalMessageString.split('\n');
      const summary = lines[0] || '';
      const description = clampCommitBodyDescription(
        lines.slice(2).join('\n').trim(),
        promptConfig.maxBodyLines
      ); // Skip empty line after summary

      await setCommitMessage({ summary, description }, repoRoot);

      telemetryService.trackCommitGeneration(
        apiConfig.type,
        true
      );

      vscode.window.showInformationMessage("Commit message generated successfully!");
    } else {
      telemetryService.trackCommitGeneration(
        apiConfig.type,
        false,
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
    await vscode.commands.executeCommand("setContext", "gitmind.isGenerating", false);
  }
}

async function handleApiSetupCheck(): Promise<void> {
  const startTime = Date.now();
  const apiConfig = await getApiConfig();
  const provider = apiConfig.type;

  try {
    // Focus on core metrics only - tracking errors if API setup fails

    await withProgress(`Testing ${provider} API connection...`, async () => {
      try {
        const result = await Promise.race([
          checkApiSetup(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Connection test timed out after 15 seconds")), API_CHECK_TIMEOUT)
          )
        ]);

        await sendApiCheckResult(result, provider);
      } catch (error) {
        debugLog("API Check Error (inner):", error);

        telemetryService.trackExtensionError(
          'APIConnectionError',
          error instanceof Error ? error.message : 'Unknown API error',
          `checkApiSetup.${provider}`
        );

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
  const apiConfig = await getApiConfig();
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

// Track ongoing model loading operations to prevent duplicates
const modelLoadingInProgress = new Set<string>();

function clampCommitBodyDescription(description: string, maxBodyLines?: number): string {
  if (!maxBodyLines || maxBodyLines <= 0) {
    return description;
  }

  const lines = description
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= maxBodyLines) {
    return lines.join('\n');
  }

  debugLog(
    `Clamping commit body description from ${lines.length} to ${maxBodyLines} lines (Custom Body Line Limit)`
  );

  return lines.slice(0, maxBodyLines).join('\n');
}

async function handleLoadModels(
  modelType: 'mistral' | 'huggingface' | 'cohere' | 'together' | 'openrouter' | 'grok' | 'groq' | 'deepseek' | 'gemini' | 'anthropic' | 'minimax' | 'openai' | 'zai' | 'perplexity' | 'nvidia',
  fetchFunction: (apiKey: string) => Promise<any[]>
): Promise<void> {
  // Prevent duplicate concurrent calls for the same provider
  if (modelLoadingInProgress.has(modelType)) {
    debugLog(`Model loading already in progress for ${modelType}, ignoring duplicate request`);
    return;
  }

  modelLoadingInProgress.add(modelType);

  try {
    // Get the specific API key for the requested model type using SecureKeyManager
    // This allows loading models for any provider with a valid API key, regardless of current selection
    const secureKeyManager = SecureKeyManager.getInstance();

    // Get the actual API key (not the display placeholder) for the specific provider
    const apiKey = await secureKeyManager.getActualApiKey(modelType);

    // Validate API key before proceeding
    if (modelType !== 'nvidia' && (!apiKey || apiKey.trim() === '')) {
      const errorMessage = `${modelType.charAt(0).toUpperCase() + modelType.slice(1)} API key is required to load models. Please add your API key in the settings.`;

      // Determine the correct message command suffix
      let commandSuffix: string;
      switch (modelType) {
        case 'mistral':
          commandSuffix = 'mistralModelsLoaded';
          break;
        case 'cohere':
          commandSuffix = 'cohereModelsLoaded';
          break;
        case 'together':
          commandSuffix = 'togetherModelsLoaded';
          break;
        case 'openrouter':
          commandSuffix = 'openrouterModelsLoaded';
          break;
        case 'huggingface':
          commandSuffix = 'huggingfaceModelsLoaded';
          break;
        case 'grok':
          commandSuffix = 'grokModelsLoaded';
          break;
        case 'groq':
          commandSuffix = 'groqModelsLoaded';
          break;
        case 'deepseek':
          commandSuffix = 'deepseekModelsLoaded';
          break;
        case 'gemini':
          commandSuffix = 'geminiModelsLoaded';
          break;
        case 'anthropic':
          commandSuffix = 'anthropicModelsLoaded';
          break;
        case 'openai':
          commandSuffix = 'openaiModelsLoaded';
          break;
        case 'minimax':
          commandSuffix = 'minimaxModelsLoaded';
          break;
        case 'zai':
          commandSuffix = 'zaiModelsLoaded';
          break;
        default:
          commandSuffix = `${modelType}ModelsLoaded`;
      }

      // Send error message to webview to reset button state
      if (SettingsWebview.isWebviewOpen()) {
        SettingsWebview.postMessageToWebview({
          command: commandSuffix,
          success: false,
          error: errorMessage
        });
      }

      // Also show user-friendly error notification
      vscode.window.showErrorMessage(errorMessage);
      return;
    }

    await withProgress(`Loading ${modelType} models...`, async () => {
      try {
        const models = await fetchFunction(apiKey || "");
        let commandSuffix: string;
        switch (modelType) {
          case 'mistral':
            commandSuffix = 'mistralModelsLoaded';
            break;
          case 'cohere':
            commandSuffix = 'cohereModelsLoaded';
            break;
          case 'together':
            commandSuffix = 'togetherModelsLoaded';
            break;
          case 'openrouter':
            commandSuffix = 'openrouterModelsLoaded';
            break;
          case 'huggingface':
            commandSuffix = 'huggingfaceModelsLoaded';
            break;
          case 'grok':
            commandSuffix = 'grokModelsLoaded';
            break;
          case 'groq':
            commandSuffix = 'groqModelsLoaded';
            break;
          case 'deepseek':
            commandSuffix = 'deepseekModelsLoaded';
            break;
          case 'gemini':
            commandSuffix = 'geminiModelsLoaded';
            break;
          case 'anthropic':
            commandSuffix = 'anthropicModelsLoaded';
            break;
          case 'openai':
            commandSuffix = 'openaiModelsLoaded';
            break;
          case 'minimax':
            commandSuffix = 'minimaxModelsLoaded';
            break;
          case 'zai':
            commandSuffix = 'zaiModelsLoaded';
            break;
          default:
            commandSuffix = `${modelType}ModelsLoaded`;
        }

        if (SettingsWebview.isWebviewOpen()) {
          SettingsWebview.postMessageToWebview({
            command: commandSuffix,
            success: true,
            models
          });
        }
      } catch (error) {
        debugLog(`Load ${modelType} Models Error:`, error);
        let commandSuffix: string;
        switch (modelType) {
          case 'mistral':
            commandSuffix = 'mistralModelsLoaded';
            break;
          case 'cohere':
            commandSuffix = 'cohereModelsLoaded';
            break;
          case 'together':
            commandSuffix = 'togetherModelsLoaded';
            break;
          case 'openrouter':
            commandSuffix = 'openrouterModelsLoaded';
            break;
          case 'huggingface':
            commandSuffix = 'huggingfaceModelsLoaded';
            break;
          case 'grok':
            commandSuffix = 'grokModelsLoaded';
            break;
          case 'groq':
            commandSuffix = 'groqModelsLoaded';
            break;
          case 'deepseek':
            commandSuffix = 'deepseekModelsLoaded';
            break;
          case 'gemini':
            commandSuffix = 'geminiModelsLoaded';
            break;
          case 'anthropic':
            commandSuffix = 'anthropicModelsLoaded';
            break;
          case 'openai':
            commandSuffix = 'openaiModelsLoaded';
            break;
          case 'minimax':
            commandSuffix = 'minimaxModelsLoaded';
            break;
          case 'zai':
            commandSuffix = 'zaiModelsLoaded';
            break;
          default:
            commandSuffix = `${modelType}ModelsLoaded`;
        }

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
  } finally {
    // Always remove from tracking set when done
    modelLoadingInProgress.delete(modelType);
  }
}

async function handleLoadCopilotModels(): Promise<void> {
  const modelType = 'copilot';

  if (modelLoadingInProgress.has(modelType)) {
    debugLog(`Model loading already in progress for ${modelType}, ignoring duplicate request`);
    return;
  }

  modelLoadingInProgress.add(modelType);

  try {
    await withProgress(`Loading ${modelType} models...`, async () => {
      try {
        const models = await fetchCopilotModels();

        if (SettingsWebview.isWebviewOpen()) {
          SettingsWebview.postMessageToWebview({
            command: 'copilotModelsLoaded',
            success: true,
            models
          });
        }
      } catch (error) {
        debugLog(`Load ${modelType} Models Error:`, error);

        if (SettingsWebview.isWebviewOpen()) {
          SettingsWebview.postMessageToWebview({
            command: 'copilotModelsLoaded',
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
  } finally {
    modelLoadingInProgress.delete(modelType);
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
        await vscode.commands.executeCommand("gitmind.clearLastPrompt");
      }
    }
  } catch (error) {
    debugLog(`${action} Last Prompt Error:`, error);
    vscode.window.showErrorMessage(`Failed to ${action} the last custom prompt.`);
  }
}

async function handleChangeCommitStyle(): Promise<void> {
  try {
    const styleManager = CommitStyleManager.getInstance();
    const availableStyles = await styleManager.getAvailableStyles();
    const currentStyle = styleManager.getCurrentStyle();

    const quickPickItems = availableStyles.map((style) => ({
      label: style.name,
      description: style.isPro ? `${style.description} (Pro)` : style.description,
      picked: style.id === currentStyle,
      style,
    }));

    const selected = await vscode.window.showQuickPick(quickPickItems, {
      title: 'Select Commit Message Style',
      placeHolder: 'Choose how your AI-generated commit messages should be formatted',
      canPickMany: false,
    });

    if (!selected) {
      return;
    }

    const success = await styleManager.setCommitStyle(selected.style.id as CommitStyle);
    if (success) {
      vscode.window.showInformationMessage(
        `Commit style changed to ${selected.style.name}. New commit messages will use this style.`
      );
      debugLog(`Commit style changed to: ${selected.style.id}`);
      return;
    }

    vscode.window.showErrorMessage('Failed to change commit style. Please try again.');
  } catch (error) {
    debugLog('Change Commit Style Error:', error);
    vscode.window.showErrorMessage('Failed to change commit style.');
  }
}

async function handleOnboardingAction(action: 'complete' | 'skip', context: vscode.ExtensionContext): Promise<void> {
  const actionMethod = action === 'complete' ? OnboardingManager.markAsCompleted : OnboardingManager.markAsSkipped;
  await actionMethod(context);

  const message = action === 'complete'
    ? "Welcome to GitMind! Onboarding is complete. You can now generate commit messages from the Source Control view."
    : "Onboarding has been disabled. GitMind will no longer show the setup wizard automatically. You can reopen settings anytime from the Command Palette.";

  const actionButton = action === 'complete' ? "Try It Now" : "Open Settings Now";

  const result = await vscode.window.showInformationMessage(message, { modal: false }, actionButton, "Got it");

  if (result === actionButton) {
    const command = action === 'complete' ? "workbench.view.scm" : "gitmind.openSettings";
    await vscode.commands.executeCommand(command);
  }

  // Removed non-essential telemetry tracking

  // Note: Webview is already closed by the OnboardingMessageHandler
}

/**
 * Shows a detailed modal with deactivation success information
 */
async function showDeactivationSuccessModal(apiResponse?: any): Promise<void> {
  try {
    if (!apiResponse || !apiResponse.deactivated) {
      // Fallback to simple message if no detailed response
      vscode.window.showInformationMessage('GitMind Pro has been deactivated successfully.');
      return;
    }

    const { license_key, meta } = apiResponse;

    // Build detailed message with clean formatting
    let message = 'GitMind Pro Deactivated Successfully\n\n';
    message += 'Your license activation has been released from this device and is now available for use on another device.\n\n';

    // License Owner Section
    if (meta?.customer_name) {
      message += 'License Owner:\n';
      message += `  ${meta.customer_name}`;
      if (meta.customer_email) {
        message += ` (${meta.customer_email})`;
      }
      message += '\n\n';
    }

    // Product Information
    if (meta?.product_name) {
      message += 'Product Information:\n';
      message += `  Product: ${meta.product_name}`;
      if (meta.variant_name && meta.variant_name !== 'Default') {
        message += ` - ${meta.variant_name}`;
      }
      message += '\n\n';
    }

    // License Status and Usage
    message += 'License Status:\n';
    message += `  Status: ${license_key?.status === 'inactive' ? 'Successfully Deactivated' : (license_key?.status || 'Inactive')}\n`;

    if (license_key?.activation_limit && typeof license_key.activation_usage === 'number') {
      const used = license_key.activation_usage;
      const limit = license_key.activation_limit;
      const remaining = Math.max(0, limit - used);
      message += `  Activations Used: ${used}/${limit}\n`;
      message += `  Activations Available: ${remaining}\n`;
    }

    if (license_key?.expires_at) {
      try {
        const expiryDate = new Date(license_key.expires_at);
        if (!isNaN(expiryDate.getTime())) {
          message += `  Expires: ${expiryDate.toLocaleDateString()} at ${expiryDate.toLocaleTimeString()}\n`;
        }
      } catch (dateError) {
        debugLog('Error parsing expiry date:', dateError);
      }
    } else {
      message += '  Type: Lifetime License (No Expiration)\n';
    }

    if (license_key?.created_at) {
      try {
        const createdDate = new Date(license_key.created_at);
        if (!isNaN(createdDate.getTime())) {
          message += `  Licensed Since: ${createdDate.toLocaleDateString()}\n`;
        }
      } catch (dateError) {
        debugLog('Error parsing creation date:', dateError);
      }
    }

    message += '\nNext Steps:\n';
    message += '  • You can reactivate this license on any device using your license key\n';
    message += '  • Keep your license key safe for future activations\n';
    message += '  • GitMind will now operate in Free mode on this device';

    // Show the detailed modal with action buttons
    const action = await vscode.window.showInformationMessage(
      message,
      { modal: true },
      'Show License Key',
      'Contact Support',
      'Done'
    );

    if (action === 'Show License Key') {
      await showLicenseKeyModal(license_key, meta);
    } else if (action === 'Contact Support') {
      await openSupportEmail(meta);
    }
  } catch (error) {
    debugLog('Error in showDeactivationSuccessModal:', error);
    // Fallback to simple success message
    vscode.window.showInformationMessage('GitMind Pro has been deactivated successfully.');
  }
}

/**
 * Shows the license key in a secure modal
 */
async function showLicenseKeyModal(license_key?: any, _meta?: any): Promise<void> {
  try {
    const licenseKey = license_key?.key || 'License key not available';

    // Format the license key for display (partially masked for security)
    let displayKey = licenseKey;
    if (licenseKey.length > 36 && licenseKey !== 'License key not available') {
      // For UUID-style keys, show first 8 chars and last 12 chars
      displayKey = `${licenseKey.substring(0, 8)}-****-****-****-${licenseKey.substring(licenseKey.length - 12)}`;
    } else if (licenseKey.length > 16) {
      // For other long keys, show first 8 and last 4
      displayKey = `${licenseKey.substring(0, 8)}...${licenseKey.substring(licenseKey.length - 4)}`;
    }

    const activationLimit = license_key?.activation_limit || 'multiple';

    const keyAction = await vscode.window.showInformationMessage(
      `Your GitMind Pro License Key:\n\n${displayKey}\n\nImportant:\n  • Keep this license key secure and confidential\n  • You'll need this exact key to reactivate GitMind Pro\n  • This key can be used on up to ${activationLimit} devices`,
      { modal: true },
      'Copy Full Key',
      'Close'
    );

    if (keyAction === 'Copy Full Key' && licenseKey !== 'License key not available') {
      await vscode.env.clipboard.writeText(licenseKey);
      vscode.window.showInformationMessage('License key copied to clipboard');
    }
  } catch (error) {
    debugLog('Error showing license key modal:', error);
    vscode.window.showErrorMessage('Unable to display license key at this time.');
  }
}

/**
 * Opens the support email with pre-filled information
 */
async function openSupportEmail(meta?: any): Promise<void> {
  try {
    const supportEmail = 'support@example.com'; // Replace with your actual support email
    const subject = encodeURIComponent('GitMind Pro License Support');
    const body = encodeURIComponent(`Hi GitMind Support,

I need assistance with my GitMind Pro license.

License Details:
- Customer: ${meta?.customer_name || 'N/A'}
- Email: ${meta?.customer_email || 'N/A'}
- Product: ${meta?.product_name || 'GitMind Pro'}
- Variant: ${meta?.variant_name || 'N/A'}

Issue: [Please describe your issue here]

Thank you!`);

    const mailtoUrl = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    await vscode.env.openExternal(vscode.Uri.parse(mailtoUrl));
  } catch (error) {
    debugLog('Error opening support email:', error);
    vscode.window.showErrorMessage('Unable to open email client. Please contact support manually.');
  }
}

export async function toggleDebugSetting(): Promise<{ enabled: boolean; target: vscode.ConfigurationTarget }> {
  const config = vscode.workspace.getConfiguration("gitmind");
  const inspect = config.inspect<boolean>("debug");
  const currentDebug = config.get<boolean>("debug") ?? false;
  const nextDebug = !currentDebug;

  const target = inspect?.workspaceValue !== undefined
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;

  await config.update("debug", nextDebug, target);
  return { enabled: nextDebug, target };
}

// Command Registration
export function registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  const commands = [
    vscode.commands.registerCommand("gitmind.toggleDebug", async () => {
      const { enabled } = await toggleDebugSetting();
      const status = enabled ? "enabled" : "disabled";
      debugLog(`Debug mode ${status}`);
      vscode.window.showInformationMessage(`Debug mode ${status}`);
    }),

    vscode.commands.registerCommand("gitmind.cleanupLegacySettings", async () => {
      const migrationService = SettingsMigrationService.getInstance();
      await migrationService.forceCleanupLegacySettings();
    }),

    vscode.commands.registerCommand("gitmind.cancelGeneration", async () => {
      if (isRequestActive()) {
        cancelCurrentRequest();
        await vscode.commands.executeCommand("setContext", "gitmind.isGenerating", false);
        vscode.window.showInformationMessage("Commit message generation cancelled");
      }
    }),

    vscode.commands.registerCommand("gitmind.generateCommitMessage", handleGenerateCommit),
    vscode.commands.registerCommand("gitmind.generateCommitMessagePro", handleGenerateCommit),
    vscode.commands.registerCommand("gitmind.checkApiSetup", handleApiSetupCheck),
    vscode.commands.registerCommand("gitmind.checkRateLimits", handleRateLimitsCheck),
    vscode.commands.registerCommand("gitmind.learnFromCommitHistory", learnFromCommitHistory),
    vscode.commands.registerCommand("gitmind.generateChangelog", generateChangelog),
    vscode.commands.registerCommand("gitmind.updateChangelog", updateChangelog),

    vscode.commands.registerCommand("gitmind.loadMistralModels", () =>
      handleLoadModels('mistral', fetchMistralModels)
    ),

    vscode.commands.registerCommand("gitmind.loadCohereModels", () =>
      handleLoadModels('cohere', fetchCohereModels)
    ),

    vscode.commands.registerCommand("gitmind.loadTogetherModels", () =>
      handleLoadModels('together', fetchTogetherModels)
    ),

    vscode.commands.registerCommand("gitmind.loadOpenRouterModels", () =>
      handleLoadModels('openrouter', fetchOpenRouterModels)
    ),

    vscode.commands.registerCommand("gitmind.loadHuggingFaceModels", () =>
      handleLoadModels('huggingface', fetchHuggingFaceModels)
    ),

    vscode.commands.registerCommand("gitmind.loadGrokModels", () =>
      handleLoadModels('grok', fetchGrokModels)
    ),

    vscode.commands.registerCommand("gitmind.loadGroqModels", () =>
      handleLoadModels('groq', fetchGroqModels)
    ),

    vscode.commands.registerCommand("gitmind.loadDeepSeekModels", () =>
      handleLoadModels('deepseek', fetchDeepSeekModels)
    ),

    vscode.commands.registerCommand("gitmind.loadGeminiModels", () =>
      handleLoadModels('gemini', fetchGeminiModels)
    ),

    vscode.commands.registerCommand("gitmind.loadAnthropicModels", () =>
      handleLoadModels('anthropic', fetchAnthropicModels)
    ),

    vscode.commands.registerCommand("gitmind.loadMiniMaxModels", () =>
      handleLoadModels('minimax', fetchMiniMaxModels)
    ),

    vscode.commands.registerCommand("gitmind.loadOpenAIModels", () =>
      handleLoadModels('openai', fetchOpenAIModels)
    ),

    vscode.commands.registerCommand("gitmind.loadZaiModels", () =>
      handleLoadModels('zai', fetchZaiModels)
    ),

    vscode.commands.registerCommand("gitmind.loadPerplexityModels", () =>
      handleLoadModels('perplexity', fetchPerplexityModels)
    ),

    vscode.commands.registerCommand("gitmind.loadNvidiaModels", () =>
      handleLoadModels('nvidia', fetchNvidiaModels)
    ),

    vscode.commands.registerCommand("gitmind.loadCopilotModels", handleLoadCopilotModels),

    vscode.commands.registerCommand("gitmind.clearLastPrompt", () =>
      handlePromptAction('clear')
    ),

    vscode.commands.registerCommand("gitmind.viewLastPrompt", () =>
      handlePromptAction('view')
    ),

    vscode.commands.registerCommand("gitmind.changeCommitStyle", async () => {
      await handleChangeCommitStyle();
    }),

    vscode.commands.registerCommand("gitmind.openSettings", (initialTab?: string) => {
      SettingsWebview.createOrShow(context.extensionUri, typeof initialTab === 'string' ? initialTab : undefined);
      // Removed non-essential telemetry tracking
    }),

    vscode.commands.registerCommand("gitmind.openSettingsPro", (initialTab?: string) => {
      SettingsWebview.createOrShow(context.extensionUri, typeof initialTab === 'string' ? initialTab : undefined);
    }),

    vscode.commands.registerCommand("gitmind.openOnboarding", () => {
      if (OnboardingManager.canManuallyOpen(context)) {
        OnboardingWebview.createOrShow(context.extensionUri);
        // Removed non-essential telemetry tracking
      } else {
        vscode.window.showInformationMessage(
          "Onboarding is disabled in settings. You can enable it in the extension settings under 'Show Onboarding'.",
          "Open Settings"
        ).then(result => {
          if (result === "Open Settings") {
            vscode.commands.executeCommand("gitmind.openSettings");
          }
        });
      }
    }),

    vscode.commands.registerCommand("gitmind.completeOnboarding", () =>
      handleOnboardingAction('complete', context)
    ),

    vscode.commands.registerCommand("gitmind.skipOnboarding", async () => {
      try {
        debugLog('=== Skip Onboarding Command Called ===');
        await handleOnboardingAction('skip', context);
        debugLog('=== Skip Onboarding Command Completed ===');
      } catch (error) {
        debugLog('Error in skipOnboarding command:', error);
        vscode.window.showErrorMessage(`Failed to skip onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

    vscode.commands.registerCommand("gitmind.checkApiConfig", async () => {
      try {
        const apiConfig = await getApiConfig();
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

    vscode.commands.registerCommand("gitmind.resetOnboarding", async () => {
      await OnboardingManager.resetOnboardingState(context);
      vscode.window.showInformationMessage("Onboarding state has been reset. Restart VS Code to see the onboarding again.");
    }),

    vscode.commands.registerCommand("gitmind.resetOnboardingState", async () => {
      await OnboardingManager.resetOnboardingState(context);
      vscode.window.showInformationMessage("Onboarding state has been reset. Restart VS Code to see the onboarding again.");
    }),

    vscode.commands.registerCommand("gitmind.reEnableOnboarding", async () => {
      const config = vscode.workspace.getConfiguration('gitmind');
      await config.update('showOnboarding', true, vscode.ConfigurationTarget.Global);
      await context.globalState.update('gitmind.onboardingDisabledPermanently', undefined);

      const action = await vscode.window.showInformationMessage(
        "Onboarding has been re-enabled. You can now access the setup wizard again.",
        { modal: false },
        "Open Onboarding",
        "Got it"
      );

      if (action === "Open Onboarding") {
        OnboardingWebview.createOrShow(context.extensionUri);
        // Removed non-essential telemetry tracking
      }

      // Removed non-essential telemetry tracking
    }),

    // Placeholder commands
    vscode.commands.registerCommand("gitmind.loadingIndicator", () => { }),
    vscode.commands.registerCommand("gitmind.loadingIndicatorPro", () => { }),
    vscode.commands.registerCommand("gitmind.acceptInput", () => {
      debugLog("Accept input command triggered");
    }),

    // Subscription commands
    vscode.commands.registerCommand("gitmind.subscribe", async () => {
      try {
        const subscriptionManager = SubscriptionManager.getInstance();
        await subscriptionManager.startSubscription();
      } catch (error) {
        debugLog("Subscription start error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to start subscription';
        vscode.window.showErrorMessage(`Failed to start subscription: ${errorMessage}`);
      }
    }),

    vscode.commands.registerCommand("gitmind.manageSubscription", async () => {
      try {
        const subscriptionManager = SubscriptionManager.getInstance();
        await subscriptionManager.manageSubscription();
      } catch (error) {
        debugLog("Manage subscription error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to open customer portal';
        vscode.window.showErrorMessage(`Failed to open customer portal: ${errorMessage}`);
      }
    }), vscode.commands.registerCommand("gitmind.refreshSubscription", async (options: { silent?: boolean; email?: string } = {}) => {
      try {
        const subscriptionManager = SubscriptionManager.getInstance();

        // Keep the status bar / Pro context key in sync on every refresh
        // (activation & deactivation flows both call refreshSubscription).
        await vscode.commands.executeCommand('gitmind.internalUpdateProStatusBar');

        // Use email from options (frontend) if provided, otherwise get from settings
        let email = options.email;
        if (!email) {
          email = await subscriptionManager.getUserEmail();
        }

        if (!email) {
          const message = "Please set your subscription email in settings first.";
          if (!options.silent) {
            vscode.window.showWarningMessage(message);
          }

          // Send error back to webview if open
          if (SettingsWebview.isWebviewOpen()) {
            SettingsWebview.postMessageToWebview({
              command: 'subscriptionRefreshed',
              success: false,
              error: 'No email configured for subscription check'
            });
          }
          return;
        }

        const refreshOperation = async () => {
          // Check if user has valid license first - if so, show Pro status
          const config = vscode.workspace.getConfiguration('gitmind');
          const validationStatus = config.get<string>('pro.validationStatus');
          const licenseKey = config.get<string>('pro.licenseKey');

          let status: any;
          let statusText: string;

          if (validationStatus === 'valid' && licenseKey) {
            // User has valid license, show Pro status
            status = {
              isActive: true,
              isPaused: false,
              isExpired: false,
              plan: 'pro'
            };
            statusText = 'active';
          } else {
            // Check subscription status via API
            status = await subscriptionManager.getSubscriptionStatus(email, true);
            statusText = status.isActive ? "active" :
              status.isPaused ? "paused" :
                status.isExpired ? "expired" : "inactive";
          }

          // Only show VS Code notification if not called silently
          if (!options.silent) {
            vscode.window.showInformationMessage(
              `Subscription status refreshed. Current status: ${statusText} (${status.plan})`
            );
          }

          // Always send result back to webview if open
          if (SettingsWebview.isWebviewOpen()) {
            SettingsWebview.postMessageToWebview({
              command: 'subscriptionRefreshed',
              success: true,
              subscription: {
                email: email,
                status: statusText,
                plan: status.plan,
                isActive: status.isActive,
                isPaused: status.isPaused,
                isExpired: status.isExpired
              }
            });
          }
        };

        // Show progress notification only if not silent
        if (options.silent) {
          await refreshOperation();
        } else {
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Refreshing subscription status...",
            cancellable: false
          }, refreshOperation);
        }

      } catch (error) {
        debugLog("Refresh subscription error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to refresh subscription status';

        // Only show VS Code error if not silent
        if (!options.silent) {
          vscode.window.showErrorMessage(`Failed to refresh subscription: ${errorMessage}`);
        }

        // Always send error back to webview if open
        if (SettingsWebview.isWebviewOpen()) {
          SettingsWebview.postMessageToWebview({
            command: 'subscriptionRefreshed',
            success: false,
            error: errorMessage
          });
        }
      }
    }),

    vscode.commands.registerCommand("gitmind.handleUserStatusChange", async () => {
      try {
        const secureKeyManager = SecureKeyManager.getInstance();
        const result = await secureKeyManager.handleUserStatusChange();

        if (result.success) {
          vscode.window.showInformationMessage(result.message);
        } else {
          vscode.window.showWarningMessage(`User status change: ${result.message}`);
        }
      } catch (error) {
        debugLog("Handle user status change error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to handle user status change';
        vscode.window.showErrorMessage(`Failed to handle user status change: ${errorMessage}`);
      }
    }),

    // Pro activation commands
    vscode.commands.registerCommand("gitmind.activateWithLicenseKey", async (licenseKey?: string) => {
      try {
        const proActivationService = ProActivationService.getInstance();

        // If no license key provided, prompt user
        if (!licenseKey) {
          licenseKey = await vscode.window.showInputBox({
            prompt: 'Enter your GitMind Pro license key',
            placeHolder: 'GITMIND-PRO-XXXX-XXXX-XXXX',
            ignoreFocusOut: true
          });

          if (!licenseKey) {
            return; // User cancelled
          }
        }

        const result = await proActivationService.activateWithLicenseKey(licenseKey);

        if (result.success) {
          vscode.window.showInformationMessage(result.message);
          // Refresh UI
          vscode.commands.executeCommand('gitmind.refreshSubscription', { silent: true });
        } else {
          vscode.window.showErrorMessage(result.message);
        }
      } catch (error) {
        debugLog("License activation error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to activate license';
        vscode.window.showErrorMessage(`Failed to activate license: ${errorMessage}`);
      }
    }),

    vscode.commands.registerCommand("gitmind.activateWithOrderId", async (orderId?: string, email?: string) => {
      try {
        const proActivationService = ProActivationService.getInstance();

        // If no order ID provided, prompt user
        if (!orderId) {
          orderId = await vscode.window.showInputBox({
            prompt: 'Enter your LemonSqueezy order ID',
            placeHolder: 'Order ID from your purchase receipt',
            ignoreFocusOut: true
          });

          if (!orderId) {
            return; // User cancelled
          }
        }

        // If no email provided, prompt user (optional)
        if (!email) {
          email = await vscode.window.showInputBox({
            prompt: 'Enter the email used for purchase (optional)',
            placeHolder: 'your.email@example.com',
            ignoreFocusOut: true
          });
        }

        const result = await proActivationService.activateWithOrderId(orderId, email);

        if (result.success) {
          vscode.window.showInformationMessage(result.message);
          // Refresh UI
          vscode.commands.executeCommand('gitmind.refreshSubscription', { silent: true });
        } else {
          vscode.window.showErrorMessage(result.message);
        }
      } catch (error) {
        debugLog("Order activation error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to activate with order ID';
        vscode.window.showErrorMessage(`Failed to activate with order ID: ${errorMessage}`);
      }
    }),

    vscode.commands.registerCommand("gitmind.showActivationQuickPick", async () => {
      try {
        const items: Array<vscode.QuickPickItem & { action: string }> = [
          { label: '$(key) Enter license key', detail: 'Paste the license key from your purchase email', action: 'key' },
          { label: '$(cloud-download) Buy GitMind Pro', detail: 'Open the checkout to purchase a license', action: 'buy' },
          { label: '$(gear) Open Settings', detail: 'Manage license and Pro features in the settings UI', action: 'settings' }
        ];

        const selected = await vscode.window.showQuickPick(items, {
          title: 'Activate GitMind Pro',
          placeHolder: 'How would you like to activate GitMind Pro?'
        });

        if (!selected) {
          return;
        }

        switch (selected.action) {
          case 'key':
            vscode.commands.executeCommand('gitmind.activateWithLicenseKey');
            break;
          case 'buy':
            vscode.commands.executeCommand('gitmind.subscribe');
            break;
          case 'settings':
            vscode.commands.executeCommand('gitmind.openSettings');
            break;
        }
      } catch (error) {
        debugLog("Activation quick pick error:", error);
      }
    }),

    vscode.commands.registerCommand("gitmind.validateExistingLicense", async () => {
      try {
        const proActivationService = ProActivationService.getInstance();

        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: "Validating license...",
          cancellable: false
        }, async () => {
          const isValid = await proActivationService.validateExistingLicense();

          if (isValid) {
            vscode.window.showInformationMessage('✅ Your license is valid and active.');
          } else {
            vscode.window.showWarningMessage('❌ Your license is not valid or has expired.');
          }

          // Refresh UI
          vscode.commands.executeCommand('gitmind.refreshSubscription', { silent: true });
        });
      } catch (error) {
        debugLog("License validation error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to validate license';
        vscode.window.showErrorMessage(`Failed to validate license: ${errorMessage}`);
      }
    }),

    vscode.commands.registerCommand("gitmind.deactivatePro", async () => {
      try {
        const confirm = await vscode.window.showWarningMessage(
          'Are you sure you want to deactivate GitMind Pro? This will revert to the free version.',
          { modal: true },
          'Deactivate'
        );

        if (confirm === 'Deactivate') {
          const proActivationService = ProActivationService.getInstance();

          // Call the API to properly deactivate the license on the server
          // This ensures the license is released on the Lemon Squeezy server
          const result = await proActivationService.deactivate(true);

          if (result.success) {
            // Show detailed deactivation modal
            await showDeactivationSuccessModal(result.apiResponse);
          } else {
            vscode.window.showErrorMessage(result.message);
          }

          // Refresh UI
          vscode.commands.executeCommand('gitmind.refreshSubscription', { silent: true });
        }
      } catch (error) {
        debugLog("Pro deactivation error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate Pro';
        vscode.window.showErrorMessage(`Failed to deactivate Pro: ${errorMessage}`);
      }
    }),

    vscode.commands.registerCommand("gitmind.forceDeactivatePro", async () => {
      try {
        const confirm = await vscode.window.showWarningMessage(
          'Force deactivate GitMind Pro? This will clean up local Pro settings without attempting to contact LemonSqueezy servers.',
          { modal: true },
          'Force Deactivate'
        );

        if (confirm === 'Force Deactivate') {
          const proActivationService = ProActivationService.getInstance();

          // Force local deactivation without API call
          const result = await proActivationService.deactivate(false);

          if (result.success) {
            vscode.window.showInformationMessage('GitMind Pro has been force deactivated locally. All Pro settings have been cleared.');
          } else {
            vscode.window.showErrorMessage(result.message);
          }

          // Clear any encrypted keys
          try {
            const { EncryptionHelper } = await import('../utils/encryptionHelper.js');
            await EncryptionHelper.clearLicenseKey(context);
            debugLog('Cleared encrypted license key during force deactivation');
          } catch (error) {
            debugLog('Could not clear encrypted license key:', error);
          }

          // Refresh UI
          vscode.commands.executeCommand('gitmind.refreshSubscription', { silent: true });
        }
      } catch (error) {
        debugLog("Force Pro deactivation error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to force deactivate Pro';
        vscode.window.showErrorMessage(`Failed to force deactivate Pro: ${errorMessage}`);
      }
    }),

    vscode.commands.registerCommand("gitmind.fixLicenseActivation", async () => {
      try {
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: "Checking license activation status...",
          cancellable: false
        }, async () => {
          const proActivationService = ProActivationService.getInstance();
          const config = vscode.workspace.getConfiguration('gitmind');

          // Check if we have a license key but missing instance ID
          const licenseKey = config.get<string>('pro.licenseKey');
          const instanceId = config.get<string>('pro.instanceId');

          if (licenseKey && licenseKey !== '[ENCRYPTED]' && !instanceId) {
            debugLog('Found license key without instance ID, attempting to validate and retrieve');

            try {
              const lemonSqueezyService = LemonSqueezyService.getInstance();
              const validation = await lemonSqueezyService.validateLicenseKey(licenseKey);

              if (validation.isValid && validation.instanceId) {
                // Update config with the retrieved instance ID
                await config.update('pro.instanceId', validation.instanceId, vscode.ConfigurationTarget.Global);
                await config.update('pro.validationStatus', 'valid', vscode.ConfigurationTarget.Global);
                await config.update('pro.lastValidation', new Date().toISOString(), vscode.ConfigurationTarget.Global);

                vscode.window.showInformationMessage(`✅ License activation fixed! Instance ID retrieved and saved.`);
                debugLog(`Fixed license activation - retrieved instance ID: ${validation.instanceId}`);

                // Refresh UI
                vscode.commands.executeCommand('gitmind.refreshSubscription', { silent: true });
                return;
              }
            } catch (error) {
              debugLog('Failed to validate license during fix attempt:', error);
            }
          }

          // Check if we have encrypted license key
          if (licenseKey === '[ENCRYPTED]') {
            try {
              const { EncryptionHelper } = await import('../utils/encryptionHelper.js');
              const decryptedKey = await EncryptionHelper.getLicenseKey(context);

              if (decryptedKey && !instanceId) {
                const lemonSqueezyService = LemonSqueezyService.getInstance();
                const validation = await lemonSqueezyService.validateLicenseKey(decryptedKey);

                if (validation.isValid && validation.instanceId) {
                  await config.update('pro.instanceId', validation.instanceId, vscode.ConfigurationTarget.Global);
                  await config.update('pro.validationStatus', 'valid', vscode.ConfigurationTarget.Global);
                  await config.update('pro.lastValidation', new Date().toISOString(), vscode.ConfigurationTarget.Global);

                  vscode.window.showInformationMessage(`✅ Encrypted license activation fixed! Instance ID retrieved and saved.`);
                  debugLog(`Fixed encrypted license activation - retrieved instance ID: ${validation.instanceId}`);

                  // Refresh UI
                  vscode.commands.executeCommand('gitmind.refreshSubscription', { silent: true });
                  return;
                }
              }
            } catch (error) {
              debugLog('Failed to handle encrypted license during fix attempt:', error);
            }
          }

          // If we get here, no fix was needed or possible
          const hasLicense = !!(licenseKey && licenseKey !== '');
          const hasInstance = !!(instanceId && instanceId !== '');
          const validationStatus = config.get<string>('pro.validationStatus');

          if (hasLicense && hasInstance && validationStatus === 'valid') {
            vscode.window.showInformationMessage('✅ License activation appears to be working correctly.');
          } else if (!hasLicense) {
            vscode.window.showInformationMessage('ℹ️ No license key found. Use "Activate Pro with License Key" to activate your license.');
          } else {
            vscode.window.showWarningMessage('⚠️ License activation issues detected. You may need to reactivate your license.');
          }
        });
      } catch (error) {
        debugLog("Fix license activation error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fix license activation';
        vscode.window.showErrorMessage(`Failed to fix license activation: ${errorMessage}`);
      }
    }),

    vscode.commands.registerCommand("gitmind.debugOnboardingState", async () => {
      try {
        debugLog('=== Debug Onboarding State ===');
        const config = vscode.workspace.getConfiguration('gitmind');
        const showOnboardingSetting = config.get<boolean>('showOnboarding', true);
        const hasDisabledPermanently = context.globalState.get<boolean>('gitmind.onboardingDisabledPermanently', false);
        const hasCompleted = context.globalState.get<boolean>('gitmind.onboardingCompleted', false);
        const hasSkipped = context.globalState.get<boolean>('gitmind.onboardingSkipped', false);
        const hasShown = context.globalState.get<boolean>('gitmind.onboardingShown', false);
        const firstActivation = context.globalState.get<string>('gitmind.firstActivation');

        const state = {
          'Setting showOnboarding': showOnboardingSetting,
          'Permanently disabled': hasDisabledPermanently,
          'Completed': hasCompleted,
          'Skipped': hasSkipped,
          'Shown': hasShown,
          'First activation': firstActivation,
        };

        debugLog('Current onboarding state:', state);

        const message = Object.entries(state)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');

        vscode.window.showInformationMessage(
          `Onboarding State:\n${message}`,
          { modal: true }
        );
      } catch (error) {
        debugLog('Error checking onboarding state:', error);
        vscode.window.showErrorMessage(`Failed to check onboarding state: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

    vscode.commands.registerCommand("gitmind.showDeactivationModal", async (apiResponse?: any) => {
      try {
        await showDeactivationSuccessModal(apiResponse);
      } catch (error) {
        debugLog("Show deactivation modal error:", error);
        // Fallback to simple message
        vscode.window.showInformationMessage('GitMind Pro has been deactivated successfully.');
      }
    }),
  ];

  return commands;
}
