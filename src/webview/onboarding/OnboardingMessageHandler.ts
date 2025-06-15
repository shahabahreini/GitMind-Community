// src/webview/onboarding/OnboardingMessageHandler.ts
import * as vscode from "vscode";
import { SettingsWebview } from "../settings/SettingsWebview";
import { telemetryService } from "../../services/telemetry/telemetryService";

export class OnboardingMessageHandler {
    public async handleMessage(message: any): Promise<void> {
        switch (message.command) {
            case "openSettings":
                // Close onboarding and open settings
                telemetryService.trackEvent('onboarding.action.openSettings');
                await vscode.commands.executeCommand("ai-commit-assistant.openSettings");
                break;
            case "selectProvider":
                // Update the provider setting and open settings
                telemetryService.trackEvent('onboarding.action.selectProvider', {
                    'provider': message.provider
                });
                const config = vscode.workspace.getConfiguration("aiCommitAssistant");
                await config.update("apiProvider", message.provider, vscode.ConfigurationTarget.Global);

                // Check API configuration immediately after updating the provider
                await vscode.commands.executeCommand("ai-commit-assistant.checkApiConfig");

                // Open settings panel
                await vscode.commands.executeCommand("ai-commit-assistant.openSettings");
                break;
            case "completeOnboarding":
                // Mark onboarding as completed
                telemetryService.trackEvent('onboarding.action.completed');
                await vscode.commands.executeCommand("ai-commit-assistant.completeOnboarding");
                break;
            case "skipOnboarding":
                // Skip onboarding but mark as shown
                telemetryService.trackEvent('onboarding.action.skipped');
                await vscode.commands.executeCommand("ai-commit-assistant.skipOnboarding");
                break;
            case "checkApiSetup":
                // Check API setup for selected provider
                telemetryService.trackEvent('onboarding.action.checkApiSetup');
                await vscode.commands.executeCommand("ai-commit-assistant.checkApiSetup");
                break;
            case "generateFirstCommit":
                // Try to generate first commit message
                telemetryService.trackEvent('onboarding.action.generateFirstCommit');
                await vscode.commands.executeCommand("ai-commit-assistant.generateCommitMessage");
                break;
        }
    }
}
