// src/webview/onboarding/OnboardingMessageHandler.ts
import * as vscode from "vscode";
import { SettingsWebview } from "../settings/SettingsWebview";
import { telemetryService } from "../../services/telemetry/telemetryService";

export class OnboardingMessageHandler {
    public async handleMessage(message: any): Promise<void> {
        switch (message.command) {
            case "openSettings":
                // Close onboarding and open settings
                telemetryService.trackDailyActiveUser();
                await vscode.commands.executeCommand("ai-commit-assistant.openSettings");
                break;
            case "selectProvider":
                // Update the provider setting and open settings
                telemetryService.trackDailyActiveUser();
                const config = vscode.workspace.getConfiguration("aiCommitAssistant");
                await config.update("apiProvider", message.provider, vscode.ConfigurationTarget.Global);

                // Check API configuration immediately after updating the provider
                await vscode.commands.executeCommand("ai-commit-assistant.checkApiConfig");

                // Open settings panel
                await vscode.commands.executeCommand("ai-commit-assistant.openSettings");
                break;
            case "completeOnboarding":
                // Mark onboarding as completed
                telemetryService.trackDailyActiveUser();
                // Close the webview first
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                // Then execute the completion command
                await vscode.commands.executeCommand("ai-commit-assistant.completeOnboarding");
                break;
            case "skipOnboarding":
                // Skip onboarding but mark as shown
                telemetryService.trackDailyActiveUser();
                // Close the webview first
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                // Then execute the skip command
                await vscode.commands.executeCommand("ai-commit-assistant.skipOnboarding");
                break;
            case "checkApiSetup":
                // Check API setup for selected provider
                telemetryService.trackDailyActiveUser();
                await vscode.commands.executeCommand("ai-commit-assistant.checkApiSetup");
                break;
            case "generateFirstCommit":
                // Try to generate first commit message
                telemetryService.trackDailyActiveUser();
                await vscode.commands.executeCommand("ai-commit-assistant.generateCommitMessage");
                break;
        }
    }
}
