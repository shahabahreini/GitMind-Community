// src/webview/settings/SettingsWebview.ts
import * as vscode from "vscode";
import { getNonce } from "../../utils/getNonce";
import { SettingsManager } from "./SettingsManager";
import { SettingsTemplateGenerator } from "./SettingsTemplateGenerator";
import { MessageHandler } from "./MessageHandler";
import { ExtensionSettings } from "../../models/ExtensionSettings";
import { debugLog } from "../../services/debug/logger";

export class SettingsWebview {
  public static readonly viewType = "gitmind.settings";
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _settingsManager: SettingsManager;
  private _messageHandler: MessageHandler;

  public static postMessageToWebview(message: any): void {
    if (SettingsWebview.currentPanel) {
      SettingsWebview.currentPanel._panel.webview.postMessage(message);
    }
  }

  public static isWebviewOpen(): boolean {
    return !!SettingsWebview.currentPanel;
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (SettingsWebview.currentPanel) {
      SettingsWebview.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      SettingsWebview.viewType,
      "GitMind Settings",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "dist"),
        ],
        retainContextWhenHidden: true
      }
    );

    new SettingsWebview(panel, extensionUri);
  }

  private static currentPanel: SettingsWebview | undefined;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._settingsManager = new SettingsManager();
    this._messageHandler = new MessageHandler(this._settingsManager);

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        try {
          // Let the message handler process the message first
          await this._messageHandler.handleMessage(message);

          // We'll only update the UI for specific cases to prevent redundant refreshes
          // The MessageHandler will handle sending back updated settings for most cases
          if (message.command === 'saveSettings') {
            // Instead of full DOM refresh, send updated settings via message to preserve tab state
            const updatedSettings = await this._settingsManager.getSettings();
            this._panel.webview.postMessage({
              command: 'updateSettings',
              settings: updatedSettings
            });
          } else if (message.command === 'updateSetting' &&
            (message.key?.includes('subscription') || message.key?.includes('pro'))) {
            // Instead of full refresh, send targeted update to preserve UI state (like open dropdowns)
            const updatedSettings = await this._settingsManager.getSettings();
            this._panel.webview.postMessage({
              command: 'updateSettings',
              settings: updatedSettings,
              preserveDropdowns: true // Flag to indicate dropdowns should be preserved
            });
          }
          // No automatic refresh for other updateSetting calls - MessageHandler will handle this
        } catch (error) {
          debugLog("Error handling webview message:", error);
        }
      },
      null,
      this._disposables
    );

    SettingsWebview.currentPanel = this;
  }

  private async _update() {
    const webview = this._panel.webview;
    const settings = await this._settingsManager.getSettings();
    const templateGenerator = new SettingsTemplateGenerator(settings, getNonce(), webview);
    this._panel.webview.html = templateGenerator.generateHtml();
  }

  public dispose() {
    SettingsWebview.currentPanel = undefined;

    // Clean up HuggingFace dropdown event listeners before disposing the panel
    try {
      this._panel.webview.postMessage({
        command: 'cleanupHuggingFaceDropdown'
      });
    } catch (error) {
      // Ignore errors during cleanup
      debugLog('Error during HuggingFace dropdown cleanup:', error);
    }

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
