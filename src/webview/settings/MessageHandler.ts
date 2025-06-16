// src/webview/settings/MessageHandler.ts
import * as vscode from "vscode";
import { SettingsManager } from "./SettingsManager";
import { SettingsWebview } from "./SettingsWebview";
import { ExtensionSettings } from "../../models/ExtensionSettings";

export class MessageHandler {
    private _settingsManager: SettingsManager;

    constructor(settingsManager: SettingsManager) {
        this._settingsManager = settingsManager;
    }

    public async handleMessage(message: any): Promise<void> {
        switch (message.command) {
            case "saveSettings":
                try {
                    await SettingsManager.saveSettings(message.settings);
                    // Send confirmation back to webview
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'settingsSaved'
                        });
                    }
                } catch (error) {
                    // Send error message back to webview if save fails
                    if (SettingsWebview.isWebviewOpen()) {
                        SettingsWebview.postMessageToWebview({
                            command: 'settingsSaveError',
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                    throw error;
                }
                break;
            case "executeCommand":
                await vscode.commands.executeCommand(message.commandId);
                break;
            case 'updateSetting':
                try {
                    const config = vscode.workspace.getConfiguration('aiCommitAssistant');

                    // Update the setting and wait for it to complete
                    await config.update(message.key, message.value, vscode.ConfigurationTarget.Global);

                    // Give VS Code a moment to fully process the configuration change
                    await new Promise(resolve => setTimeout(resolve, 50));

                    // Provide immediate feedback
                    // vscode.window.showInformationMessage(`Setting updated: ${message.key} = ${message.value}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to update setting: ${error}`);
                }
                break;
        }
    }
}
