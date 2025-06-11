// src/webview/settings/MessageHandler.ts
import * as vscode from "vscode";
import { SettingsManager } from "./SettingsManager";
import { ExtensionSettings } from "../../models/ExtensionSettings";

export class MessageHandler {
    private _settingsManager: SettingsManager;

    constructor(settingsManager: SettingsManager) {
        this._settingsManager = settingsManager;
    }

    public async handleMessage(message: any): Promise<void> {
        switch (message.command) {
            case "saveSettings":
                await SettingsManager.saveSettings(message.settings);
                break;
            case "executeCommand":
                await vscode.commands.executeCommand(message.commandId);
                break;
            case 'updateSetting':
                try {
                    const config = vscode.workspace.getConfiguration('aiCommitAssistant');
                    await config.update(message.key, message.value, vscode.ConfigurationTarget.Global);

                    // Handle nested settings properly
                    if (message.key === 'commit.verbose') {
                        await config.update('commit.verbose', message.value, vscode.ConfigurationTarget.Global);
                    } else if (message.key === 'showDiagnostics') {
                        await config.update('showDiagnostics', message.value, vscode.ConfigurationTarget.Global);
                    } else if (message.key === 'promptCustomization.enabled') {
                        await config.update('promptCustomization.enabled', message.value, vscode.ConfigurationTarget.Global);
                    }

                    // Provide immediate feedback
                    vscode.window.showInformationMessage(`Setting updated: ${message.key} = ${message.value}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to update setting: ${error}`);
                }
                break;
        }
    }
}
