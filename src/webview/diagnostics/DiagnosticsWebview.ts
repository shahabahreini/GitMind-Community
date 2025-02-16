import * as vscode from "vscode";
import { getNonce } from "../../utils/getNonce";

export class DiagnosticsWebview {
    public static readonly viewType = "aiCommitAssistant.diagnostics";
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static async show(modelInfo: string, tokenCount: number): Promise<boolean> {
        const panel = vscode.window.createWebviewPanel(
            DiagnosticsWebview.viewType,
            "Commit Generation Details",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: []
            }
        );

        return new Promise((resolve) => {
            new DiagnosticsWebview(panel, modelInfo, tokenCount, resolve);
        });
    }

    private constructor(
        panel: vscode.WebviewPanel,
        modelInfo: string,
        tokenCount: number,
        callback: (result: boolean) => void
    ) {
        this._panel = panel;
        this._update(modelInfo, tokenCount);

        this._panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case "proceed":
                        callback(true);
                        this.dispose();
                        break;
                    case "cancel":
                        callback(false);
                        this.dispose();
                        break;
                }
            },
            null,
            this._disposables
        );

        this._panel.onDidDispose(() => {
            callback(false);
            this.dispose();
        });
    }

    private _update(modelInfo: string, tokenCount: number) {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview, modelInfo, tokenCount);
    }

    private _getHtmlForWebview(webview: vscode.Webview, modelInfo: string, tokenCount: number): string {
        const nonce = getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Commit Generation Details</title>
            <style>
                body {
                    padding: 20px;
                    color: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                    line-height: 1.6;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                }
                .info-box {
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 16px;
                    margin-bottom: 20px;
                }
                .info-item {
                    margin-bottom: 12px;
                }
                .label {
                    font-weight: bold;
                    color: var(--vscode-descriptionForeground);
                }
                .value {
                    color: var(--vscode-foreground);
                }
                .buttons {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                }
                button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                }
                .proceed {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .proceed:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .cancel {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                .cancel:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Commit Generation Details</h2>
                <div class="info-box">
                    <div class="info-item">
                        <span class="label">Model:</span>
                        <span class="value">${modelInfo}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Estimated Tokens:</span>
                        <span class="value">${tokenCount}</span>
                    </div>
                </div>
                <div class="buttons">
                    <button class="cancel" onclick="cancel()">Cancel</button>
                    <button class="proceed" onclick="proceed()">Proceed</button>
                </div>
            </div>
            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                
                function proceed() {
                    vscode.postMessage({ command: 'proceed' });
                }
                
                function cancel() {
                    vscode.postMessage({ command: 'cancel' });
                }
            </script>
        </body>
        </html>`;
    }

    public dispose() {
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
