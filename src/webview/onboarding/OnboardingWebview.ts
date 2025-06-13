// src/webview/onboarding/OnboardingWebview.ts
import * as vscode from "vscode";
import { getNonce } from "../../utils/getNonce";
import { OnboardingTemplateGenerator } from "./OnboardingTemplateGenerator";
import { OnboardingMessageHandler } from "./OnboardingMessageHandler";
import { telemetryService } from "../../services/telemetry/telemetryService";

export class OnboardingWebview {
    public static readonly viewType = "aiCommitAssistant.onboarding";
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _messageHandler: OnboardingMessageHandler;

    public static postMessageToWebview(message: any): void {
        if (OnboardingWebview.currentPanel) {
            OnboardingWebview.currentPanel._panel.webview.postMessage(message);
        }
    }

    public static isWebviewOpen(): boolean {
        return !!OnboardingWebview.currentPanel;
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (OnboardingWebview.currentPanel) {
            OnboardingWebview.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            OnboardingWebview.viewType,
            "Welcome to GitMind",
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, "media"),
                    vscode.Uri.joinPath(extensionUri, "dist"),
                    vscode.Uri.joinPath(extensionUri, "resources"),
                ],
                retainContextWhenHidden: true
            }
        );

        new OnboardingWebview(panel, extensionUri);
    }

    private static currentPanel: OnboardingWebview | undefined;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._messageHandler = new OnboardingMessageHandler();

        // Track onboarding webview creation
        telemetryService.trackEvent('onboarding.webview.created');

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                await this._messageHandler.handleMessage(message);
            },
            null,
            this._disposables
        );

        OnboardingWebview.currentPanel = this;
    }

    private async _update() {
        const webview = this._panel.webview;
        const templateGenerator = new OnboardingTemplateGenerator(this._extensionUri, getNonce());
        this._panel.webview.html = templateGenerator.generateHtml(webview);
    }

    public dispose() {
        OnboardingWebview.currentPanel = undefined;
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
