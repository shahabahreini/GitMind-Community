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
                await this._settingsManager.saveSettings(message.settings);
                break;
            case "executeCommand":
                await vscode.commands.executeCommand(message.commandId);
                break;
        }
    }
}
