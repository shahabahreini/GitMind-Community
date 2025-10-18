import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { GeminiModel } from "../../../config/types";
import { FormUtils } from "./utils/FormUtils";

export class GeminiSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        const apiKeyValue = this._settings.gemini?.apiKey || "";

        return `
            <div id="geminiSettings" class="api-settings ${this._settings.apiProvider === "gemini" ? "" : "hidden"}">
                <h3>Gemini Settings</h3>
                ${FormUtils.createPasswordField(
            'geminiApiKey',
            'API Key',
            'Your Gemini API key for authentication',
            apiKeyValue,
            { url: 'https://aistudio.google.com/app/apikey', text: 'Get a Gemini API key' }
        )}
                <div class="form-group">
                    <label for="geminiModel">Model</label>
                    <select id="geminiModel">
                        <optgroup label="Gemini 2.5 Series">
                            <option value="gemini-2.5-pro" ${this._settings.gemini?.model === "gemini-2.5-pro" ? "selected" : ""}>Gemini 2.5 Pro</option>
                            <option value="gemini-2.5-flash" ${this._settings.gemini?.model === "gemini-2.5-flash" ? "selected" : ""}>Gemini 2.5 Flash</option>
                            <option value="gemini-2.5-flash-preview" ${this._settings.gemini?.model === "gemini-2.5-flash-preview" ? "selected" : ""}>Gemini 2.5 Flash Preview</option>
                            <option value="gemini-2.5-flash-lite" ${this._settings.gemini?.model === "gemini-2.5-flash-lite" ? "selected" : ""}>Gemini 2.5 Flash-Lite</option>
                            <option value="gemini-2.5-flash-lite-preview" ${this._settings.gemini?.model === "gemini-2.5-flash-lite-preview" ? "selected" : ""}>Gemini 2.5 Flash-Lite Preview</option>
                        </optgroup>
                        <optgroup label="Gemini 2.0 Series">
                            <option value="gemini-2.0-flash" ${this._settings.gemini?.model === "gemini-2.0-flash" ? "selected" : ""}>Gemini 2.0 Flash</option>
                            <option value="gemini-2.0-flash-lite" ${this._settings.gemini?.model === "gemini-2.0-flash-lite" ? "selected" : ""}>Gemini 2.0 Flash-Lite</option>
                        </optgroup>
                    </select>
                </div>
            </div>`;
    }
}