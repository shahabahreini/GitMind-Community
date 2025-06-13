// src/webview/settings/SettingsTemplateGenerator.ts
import { ExtensionSettings } from "../../models/ExtensionSettings";
import { getMainStyles } from "./styles/main.css";
import { StatusBanner } from "./components/StatusBanner";
import { GeneralSettings } from "./components/GeneralSettings";
import { GeminiSettings } from "./components/GeminiSettings";
import { HuggingFaceSettings } from "./components/HuggingFaceSettings";
import { OllamaSettings } from "./components/OllamaSettings";
import { MistralSettings } from "./components/MistralSettings";
import { CohereSettings } from "./components/CohereSettings";
import { OpenAISettings } from "./components/OpenAISettings";
import { TogetherSettings } from "./components/TogetherSettings";
import { OpenRouterSettings } from "./components/OpenRouterSettings";
import { ButtonGroup } from "./components/ButtonGroup";
import { getSettingsScript } from "./scripts/settingsManager";
import { AnthropicSettings } from "./components/AnthropicSettings";
import { CopilotSettings } from "./components/CopilotSettings";
import { DeepSeekSettings } from "./components/DeepSeekSettings";
import { GrokSettings } from "./components/GrokSettings";
import { PerplexitySettings } from "./components/PerplexitySettings";

export class SettingsTemplateGenerator {
  private _settings: ExtensionSettings;
  private _nonce: string;

  constructor(settings: ExtensionSettings, nonce: string) {
    this._settings = settings;
    this._nonce = nonce;
  }

  public generateHtml(): string {
    const statusBanner = new StatusBanner(this._settings);
    const generalSettings = new GeneralSettings(this._settings);
    const geminiSettings = new GeminiSettings(this._settings);
    const huggingFaceSettings = new HuggingFaceSettings(this._settings);
    const ollamaSettings = new OllamaSettings(this._settings);
    const mistralSettings = new MistralSettings(this._settings);
    const cohereSettings = new CohereSettings(this._settings);
    const openaiSettings = new OpenAISettings(this._settings);
    const togetherSettings = new TogetherSettings(this._settings);
    const openrouterSettings = new OpenRouterSettings(this._settings);
    const buttonGroup = new ButtonGroup();
    const anthropicSettings = new AnthropicSettings(this._settings);
    const copilotSettings = new CopilotSettings(this._settings);
    const deepseekSettings = new DeepSeekSettings(this._settings);
    const grokSettings = new GrokSettings(this._settings);
    const perplexitySettings = new PerplexitySettings(this._settings);

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>AI Commit Assistant Settings</title>
      ${getMainStyles()}
    </head>
    <body>
      <div class="settings-container">
        <div id="statusBannerContainer">
          ${statusBanner.render()}
        </div>
        <h2>AI Commit Assistant Settings</h2>
        ${generalSettings.render()}
        ${geminiSettings.render()}
        ${huggingFaceSettings.render()}
        ${ollamaSettings.render()}
        ${mistralSettings.render()}
        ${cohereSettings.render()}
        ${openaiSettings.render()}
        ${togetherSettings.render()}
        ${openrouterSettings.render()}
        ${anthropicSettings.render()}
        ${copilotSettings.render()}
        ${deepseekSettings.render()}
        ${grokSettings.render()}
        ${perplexitySettings.render()}
        ${buttonGroup.render()}
      </div>
      ${getSettingsScript(this._settings, this._nonce)}
      <script nonce="${this._nonce}">
            (function() {
                const vscode = acquireVsCodeApi();
                
                // Add event listeners for settings changes - removed to avoid conflicts
                // These are now handled in the main settings script to prevent duplication
                
                // ...existing code...
            })();
        </script>
    </body>
    </html>`;
  }
}
