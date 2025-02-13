// src/webview/settings/SettingsWebview.ts
import * as vscode from "vscode";
import { getNonce } from "../../utils/getNonce";

export class SettingsWebview {
    public static readonly viewType = "aiCommitAssistant.settings";
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

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

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case "saveSettings":
                        await this._saveSettings(message.settings);
                        break;
                }
            },
            null,
            this._disposables
        );

        SettingsWebview.currentPanel = this;
    }

    private async _saveSettings(settings: any) {
        const config = vscode.workspace.getConfiguration("aiCommitAssistant");

        // Update settings one by one
        await config.update(
            "apiProvider",
            settings.apiProvider,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "debug",
            settings.debug,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "gemini.apiKey",
            settings.gemini.apiKey,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "huggingface.apiKey",
            settings.huggingface.apiKey,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "huggingface.model",
            settings.huggingface.model,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "ollama.url",
            settings.ollama.url,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "ollama.model",
            settings.ollama.model,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "mistral.apiKey",
            settings.mistral.apiKey,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "mistral.model",
            settings.mistral.model,
            vscode.ConfigurationTarget.Global
        );

        vscode.window.showInformationMessage("Settings saved successfully!");
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const config = vscode.workspace.getConfiguration("aiCommitAssistant");
        const settings = {
            apiProvider: config.get("apiProvider") || "huggingface",
            debug: config.get("debug") || false,
            gemini: {
                apiKey: config.get("gemini.apiKey") || "",
            },
            huggingface: {
                apiKey: config.get("huggingface.apiKey") || "",
                model: config.get("huggingface.model") || "",
            },
            ollama: {
                url: config.get("ollama.url") || "",
                model: config.get("ollama.model") || "",
            },
            mistral: {
                apiKey: config.get("mistral.apiKey") || "",
                model: config.get("mistral.model") || "mistral-large-latest",
            },
        };

        const nonce = getNonce();

        return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Commit Assistant Settings</title>
        <style>
            body {
                padding: 20px;
                color: var(--vscode-foreground);
                font-family: var(--vscode-font-family);
                background-color: var(--vscode-editor-background);
            }
            .settings-section {
                margin-bottom: 20px;
            }
            .form-group {
                margin-bottom: 15px;
            }
            .label-container {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
            }
            label {
                display: block;
                color: var(--vscode-foreground);
            }
            .learn-more {
                color: var(--vscode-textLink-foreground);
                text-decoration: none;
                font-size: 12px;
                margin-left: 8px;
            }
            .learn-more:hover {
                text-decoration: underline;
            }
            input, select {
                width: 100%;
                padding: 8px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 2px;
            }
            select {
                height: 32px;
                appearance: none;
                padding-right: 30px;
                background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M7.41%208.59L12%2013.17l4.59-4.58L18%2010l-6%206-6-6z%22%2F%3E%3C%2Fsvg%3E");
                background-repeat: no-repeat;
                background-position: right 8px center;
                background-size: 16px;
            }
            select:focus, input:focus {
                outline: 1px solid var(--vscode-focusBorder);
                outline-offset: -1px;
            }
            select option {
                background-color: var(--vscode-dropdown-background);
                color: var(--vscode-dropdown-foreground);
            }
            button {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                cursor: pointer;
                border-radius: 2px;
            }
            button:hover {
                background: var(--vscode-button-hoverBackground);
            }
            .settings-container {
                max-width: 800px;
                margin: 0 auto;
            }
            h2, h3 {
                color: var(--vscode-foreground);
                border-bottom: 1px solid var(--vscode-input-border);
                padding-bottom: 8px;
            }
            .description {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-top: 4px;
            }
        </style>
    </head>
    <body>
        <div class="settings-container">
            <h2>AI Commit Assistant Settings</h2>
            
            <div class="settings-section">
                <h3>General Settings</h3>
                <div class="form-group">
                    <label for="apiProvider">API Provider</label>
                    <select id="apiProvider">
                        <option value="gemini">Gemini</option>
                        <option value="huggingface">Hugging Face</option>
                        <option value="ollama">Ollama</option>
                        <option value="mistral">Mistral</option>
                    </select>
                </div>
            </div>

            <div id="geminiSettings" class="settings-section">
                <h3>Gemini Settings</h3>
                <div class="form-group">
                    <div class="label-container">
                        <label for="geminiApiKey">API Key</label>
                        <a href="https://aistudio.google.com/app/apikey" class="learn-more" target="_blank">Learn more</a>
                    </div>
                    <input type="password" id="geminiApiKey" />
                </div>
            </div>

            <div id="huggingfaceSettings" class="settings-section">
                <h3>Hugging Face Settings</h3>
                <div class="form-group">
                    <div class="label-container">
                        <label for="huggingfaceApiKey">API Key</label>
                        <a href="https://huggingface.co/settings/tokens" class="learn-more" target="_blank">Learn more</a>
                    </div>
                    <input type="password" id="huggingfaceApiKey" />
                </div>
                <div class="form-group">
                    <div class="label-container">
                        <label for="huggingfaceModel">Model</label>
                        <a href="https://huggingface.co/models" class="learn-more" target="_blank">Learn more</a>
                    </div>
                    <input type="text" id="huggingfaceModel" placeholder="e.g., mistralai/Mistral-7B-Instruct-v0.3" />
                    <div class="description">Examples: mistralai/Mistral-7B-Instruct-v0.3, facebook/bart-large-cnn</div>
                </div>
            </div>

            <div id="ollamaSettings" class="settings-section">
                <h3>Ollama Settings</h3>
                <div class="form-group">
                    <label for="ollamaUrl">URL</label>
                    <input type="text" id="ollamaUrl" placeholder="http://localhost:11434" />
                </div>
                <div class="form-group">
                    <div class="label-container">
                        <label for="ollamaModel">Model</label>
                        <a href="https://ollama.ai/library" class="learn-more" target="_blank">Learn more</a>
                    </div>
                    <input type="text" id="ollamaModel" placeholder="e.g., phi4" />
                    <div class="description">Examples: mistral, llama2, codellama, phi4, qwen2.5-coder</div>
                </div>
            </div>

            <div id="mistralSettings" class="settings-section">
    <h3>Mistral Settings</h3>
    <div class="form-group">
        <div class="label-container">
            <label for="mistralApiKey">API Key</label>
            <a href="https://console.mistral.ai/api-keys/" class="learn-more" target="_blank">Learn more</a>
        </div>
        <input type="password" id="mistralApiKey" />
    </div>
    <div class="form-group">
        <label for="mistralModel">Model</label>
        <select id="mistralModel">
            <option value="mistral-tiny">Mistral Tiny</option>
            <option value="mistral-small">Mistral Small</option>
            <option value="mistral-medium">Mistral Medium</option>
            <option value="mistral-large-latest">Mistral Large (Latest)</option>
        </select>
    </div>
</div>

            <button onclick="saveSettings()">Save Settings</button>
        </div>

        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
            const currentSettings = ${JSON.stringify(settings)};

            // Initialize form with current settings
            document.getElementById('apiProvider').value = currentSettings.apiProvider;
            document.getElementById('geminiApiKey').value = currentSettings.gemini.apiKey || '';
            document.getElementById('huggingfaceApiKey').value = currentSettings.huggingface.apiKey || '';
            document.getElementById('huggingfaceModel').value = currentSettings.huggingface.model || '';
            document.getElementById('ollamaUrl').value = currentSettings.ollama.url || '';
            document.getElementById('ollamaModel').value = currentSettings.ollama.model || '';
            document.getElementById('mistralApiKey').value = currentSettings.mistral?.apiKey || '';
            document.getElementById('mistralModel').value = currentSettings.mistral?.model || 'mistral-large-latest';

            // Show/hide sections based on selected provider
            function updateVisibleSettings() {
                const provider = document.getElementById('apiProvider').value;
                document.getElementById('geminiSettings').style.display = provider === 'gemini' ? 'block' : 'none';
                document.getElementById('huggingfaceSettings').style.display = provider === 'huggingface' ? 'block' : 'none';
                document.getElementById('ollamaSettings').style.display = provider === 'ollama' ? 'block' : 'none';
                document.getElementById('mistralSettings').style.display = provider === 'mistral' ? 'block' : 'none';
            }

            document.getElementById('apiProvider').addEventListener('change', updateVisibleSettings);
            updateVisibleSettings(); // Call initially to set correct visibility

            function saveSettings() {
                const newSettings = {
                    apiProvider: document.getElementById('apiProvider').value,
                    debug: currentSettings.debug,
                    gemini: {
                        apiKey: document.getElementById('geminiApiKey').value
                    },
                    huggingface: {
                        apiKey: document.getElementById('huggingfaceApiKey').value,
                        model: document.getElementById('huggingfaceModel').value
                    },
                    ollama: {
                        url: document.getElementById('ollamaUrl').value,
                        model: document.getElementById('ollamaModel').value
                    },
                    mistral: {
                        apiKey: document.getElementById('mistralApiKey').value,
                        model: document.getElementById('mistralModel').value
                    }
                };

                vscode.postMessage({
                    command: 'saveSettings',
                    settings: newSettings
                });
            }
        </script>
    </body>
    </html>
`;
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
