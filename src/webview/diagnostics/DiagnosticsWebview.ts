import * as vscode from "vscode";
import { getNonce } from "../../utils/getNonce";

interface DiagnosticInfo {
    modelInfo: string;
    tokenCount: number;
}

export class DiagnosticsWebview {
    public static readonly viewType = "aiCommitAssistant.diagnostics";
    private readonly _panel: vscode.WebviewPanel;
    private readonly _disposables: vscode.Disposable[] = [];

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
            new DiagnosticsWebview(panel, { modelInfo, tokenCount }, resolve);
        });
    }

    private constructor(
        panel: vscode.WebviewPanel,
        diagnosticInfo: DiagnosticInfo,
        callback: (result: boolean) => void
    ) {
        this._panel = panel;
        this._panel.webview.html = this._getHtmlForWebview(diagnosticInfo);
        this._setupEventHandlers(callback);
    }

    private _setupEventHandlers(callback: (result: boolean) => void): void {
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                if (message.command === "proceed") {
                    callback(true);
                    this.dispose();
                }
            },
            null,
            this._disposables
        );

        this._panel.onDidDispose(() => {
            callback(false);
            this.dispose();
        }, null, this._disposables);
    }

    private _getHtmlForWebview(diagnosticInfo: DiagnosticInfo): string {
        const nonce = getNonce();
        const { modelInfo, tokenCount } = diagnosticInfo;

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Commit Generation Details</title>
            <style>
                ${this._getStyles()}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Commit Generation Details</h2>
                <div class="info-box">
                    ${this._renderInfoItem("Model", modelInfo)}
                    ${this._renderInfoItem("Estimated Tokens", tokenCount.toString())}
                </div>
                <div class="buttons">
                    <button class="proceed" onclick="proceed()">Proceed</button>
                </div>
            </div>
            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                function proceed() {
                    vscode.postMessage({ command: 'proceed' });
                }
            </script>
        </body>
        </html>`;
    }

    private _getStyles(): string {
        return `
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
        `;
    }

    private _renderInfoItem(label: string, value: string): string {
        return `
            <div class="info-item">
                <span class="label">${label}:</span>
                <span class="value">${value}</span>
            </div>
        `;
    }

    public dispose(): void {
        this._panel.dispose();
        this._disposables.forEach(disposable => disposable.dispose());
        this._disposables.length = 0;
    }
}