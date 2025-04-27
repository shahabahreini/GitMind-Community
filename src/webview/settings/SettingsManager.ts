// src/webview/settings/SettingsManager.ts
import * as vscode from "vscode";
import { ExtensionSettings } from "../../models/ExtensionSettings";

export class SettingsManager {
    public getSettings(): ExtensionSettings {
        const config = vscode.workspace.getConfiguration("aiCommitAssistant");

        // Get the API provider with a default
        const apiProvider = config.get<string>("apiProvider") || "huggingface";

        return {
            apiProvider,
            debug: config.get<boolean>("debug") || false,
            gemini: {
                apiKey: config.get<string>("gemini.apiKey") || "",
                model: config.get<string>("gemini.model") || "gemini-2.5-flash",
            },
            huggingface: {
                apiKey: config.get<string>("huggingface.apiKey") || "",
                model: config.get<string>("huggingface.model") || "",
            },
            ollama: {
                url: config.get<string>("ollama.url") || "",
                model: config.get<string>("ollama.model") || "",
            },
            mistral: {
                apiKey: config.get<string>("mistral.apiKey") || "",
                model: config.get<string>("mistral.model") || "mistral-large-latest",
            },
            cohere: {
                apiKey: config.get<string>("cohere.apiKey") || "",
                model: config.get<string>("cohere.model") || "command",
            },
            openai: {
                apiKey: config.get<string>("openai.apiKey") || "",
                model: config.get<string>("openai.model") || "gpt-3.5-turbo",
            },
            together: {
                apiKey: config.get<string>("together.apiKey") || "",
                model: config.get<string>("together.model") || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            },
            openrouter: {
                apiKey: config.get<string>("openrouter.apiKey") || "",
                model: config.get<string>("openrouter.model") || "google/gemma-3-27b-it:free",
            },
            promptCustomization: {
                enabled: config.get<boolean>("promptCustomization.enabled") || false,
            },
            commit: {
                verbose: config.get<boolean>("commit.verbose") ?? true,
            },
        };
    }

    public async saveSettings(settings: ExtensionSettings): Promise<void> {
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
            "gemini.model",
            settings.gemini.model,
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
        await config.update(
            "cohere.apiKey",
            settings.cohere.apiKey,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "cohere.model",
            settings.cohere.model,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "openai.apiKey",
            settings.openai.apiKey,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "openai.model",
            settings.openai.model,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "together.apiKey",
            settings.together.apiKey,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "together.model",
            settings.together.model,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "openrouter.apiKey",
            settings.openrouter.apiKey,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "openrouter.model",
            settings.openrouter.model,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "promptCustomization.enabled",
            settings.promptCustomization?.enabled ?? false,
            vscode.ConfigurationTarget.Global
        );
        await config.update(
            "commit.verbose",
            settings.commit?.verbose ?? true,
            vscode.ConfigurationTarget.Global
        );

        vscode.window.showInformationMessage("Settings saved successfully!");
    }
}
