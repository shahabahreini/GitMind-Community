// src/webview/settings/SettingsWebview.ts
import * as vscode from "vscode";
import { getNonce } from "../../utils/getNonce";
import { SettingsManager } from "./SettingsManager";
import { SettingsTemplateGenerator } from "./SettingsTemplateGenerator";
import { MessageHandler } from "./MessageHandler";
import { ExtensionSettings } from "../../models/ExtensionSettings";

export class SettingsWebview {
  public static readonly viewType = "aiCommitAssistant.settings";
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
      "AI Commit Assistant Settings",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "dist"),
        ],
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
        await this._messageHandler.handleMessage(message);
        // Refresh the webview after settings updates with a delay
        // to ensure VS Code configuration is fully updated
        if (message.command === 'updateSetting' || message.type === 'updateSetting') {
          setTimeout(async () => {
            await this._update();
          }, 250); // Increased delay to ensure config is updated
        } else if (message.command === 'saveSettings') {
          // Longer delay for bulk save operations
          setTimeout(async () => {
            await this._update();
          }, 350); // Longer delay for bulk configuration updates
        }
      },
      null,
      this._disposables
    );

    SettingsWebview.currentPanel = this;
  }

  private async _update() {
    const webview = this._panel.webview;
    const settings = this._settingsManager.getSettings();
    const templateGenerator = new SettingsTemplateGenerator(settings, getNonce());
    this._panel.webview.html = templateGenerator.generateHtml();
  }

  public dispose() {
    SettingsWebview.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
