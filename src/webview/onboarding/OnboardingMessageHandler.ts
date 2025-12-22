// src/webview/onboarding/OnboardingMessageHandler.ts
import * as vscode from "vscode";
import { SettingsWebview } from "../settings/SettingsWebview";
import { telemetryService } from "../../services/telemetry/telemetryService";

export class OnboardingMessageHandler {
    private readonly _closeOnboarding: () => void;

    public constructor(closeOnboarding: () => void) {
        this._closeOnboarding = closeOnboarding;
    }

    public async handleMessage(message: any): Promise<void> {
        switch (message.command) {
            case "openSettings":
                // Close onboarding and open settings
                telemetryService.trackDailyActiveUser();
                await vscode.commands.executeCommand("gitmind.openSettings");
                break;
            case "selectProvider":
                // Update the provider setting and open settings
                telemetryService.trackDailyActiveUser();
                const config = vscode.workspace.getConfiguration("gitmind");
                await config.update("apiProvider", message.provider, vscode.ConfigurationTarget.Global);

                // Check API configuration immediately after updating the provider
                await vscode.commands.executeCommand("gitmind.checkApiConfig");

                // Open settings panel
                await vscode.commands.executeCommand("gitmind.openSettings");
                break;
            case "completeOnboarding":
                // Mark onboarding as completed
                telemetryService.trackDailyActiveUser();
                this._closeOnboarding();
                // Then execute the completion command
                await vscode.commands.executeCommand("gitmind.completeOnboarding");
                break;
            case "skipOnboarding":
                // Skip onboarding but mark as shown
                telemetryService.trackDailyActiveUser();
                try {
                    this._closeOnboarding();
                    // Then execute the skip command
                    await vscode.commands.executeCommand("gitmind.skipOnboarding");
                } catch (error) {
                    console.error('Error in skipOnboarding handler:', error);
                    vscode.window.showErrorMessage(
                        `Failed to disable onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`
                    );
                }
                break;
            case "checkApiSetup":
                // Check API setup for selected provider
                telemetryService.trackDailyActiveUser();
                await vscode.commands.executeCommand("gitmind.checkApiSetup");
                break;
            case "generateFirstCommit":
                // Try to generate first commit message
                telemetryService.trackDailyActiveUser();
                await vscode.commands.executeCommand("gitmind.generateCommitMessage");
                break;
            case "openExternal":
                // Open external URL
                if (message.url) {
                    telemetryService.trackDailyActiveUser();
                    await vscode.env.openExternal(vscode.Uri.parse(message.url));
                }
                break;
        }
    }
}
