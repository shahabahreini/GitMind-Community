import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { FormUtils } from "./utils/FormUtils";

export class OpenAISettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        const apiKeyValue = this._settings.openai?.apiKey || "";

        return `
            <div id="openaiSettings" class="api-settings ${this._settings.apiProvider === "openai" ? "" : "hidden"}">
                <h3>OpenAI Settings</h3>
                ${FormUtils.createPasswordField(
            'openaiApiKey',
            'API Key',
            'Your OpenAI API key for authentication',
            apiKeyValue,
            { url: 'https://platform.openai.com/api-keys', text: 'Learn more' }
        )}
                <div class="form-group">
                    <label for="openaiModel">Model</label>
                    <select id="openaiModel">
                        <optgroup label="GPT-5.1 Series">
                            <option value="gpt-5.1" ${this._settings.openai?.model === "gpt-5.1" ? "selected" : ""}>GPT-5.1 (Latest)</option>
                            <option value="gpt-5.1-chat-latest" ${this._settings.openai?.model === "gpt-5.1-chat-latest" ? "selected" : ""}>GPT-5.1 Chat (Latest)</option>
                            <option value="gpt-5.1-codex" ${this._settings.openai?.model === "gpt-5.1-codex" ? "selected" : ""}>GPT-5.1 Codex</option>
                            <option value="gpt-5.1-codex-mini" ${this._settings.openai?.model === "gpt-5.1-codex-mini" ? "selected" : ""}>GPT-5.1 Codex Mini</option>
                        </optgroup>
                        <optgroup label="GPT-5 Series">
                            <option value="gpt-5" ${this._settings.openai?.model === "gpt-5" ? "selected" : ""}>GPT-5</option>
                            <option value="gpt-5-chat-latest" ${this._settings.openai?.model === "gpt-5-chat-latest" ? "selected" : ""}>GPT-5 Chat (Latest)</option>
                            <option value="gpt-5-mini" ${this._settings.openai?.model === "gpt-5-mini" ? "selected" : ""}>GPT-5 Mini</option>
                            <option value="gpt-5-nano" ${this._settings.openai?.model === "gpt-5-nano" ? "selected" : ""}>GPT-5 Nano</option>
                            <option value="gpt-5-pro" ${this._settings.openai?.model === "gpt-5-pro" ? "selected" : ""}>GPT-5 Pro</option>
                            <option value="gpt-5-codex" ${this._settings.openai?.model === "gpt-5-codex" ? "selected" : ""}>GPT-5 Codex</option>
                        </optgroup>
                        <optgroup label="GPT-4.1 Series">
                            <option value="gpt-4.1" ${this._settings.openai?.model === "gpt-4.1" ? "selected" : ""}>GPT-4.1</option>
                            <option value="gpt-4.1-mini" ${this._settings.openai?.model === "gpt-4.1-mini" ? "selected" : ""}>GPT-4.1 Mini</option>
                            <option value="gpt-4.1-nano" ${this._settings.openai?.model === "gpt-4.1-nano" ? "selected" : ""}>GPT-4.1 Nano</option>
                        </optgroup>
                        <optgroup label="Reasoning Models">
                            <option value="o4-mini" ${this._settings.openai?.model === "o4-mini" ? "selected" : ""}>o4-mini (Advanced Reasoning)</option>
                            <option value="o3" ${this._settings.openai?.model === "o3" ? "selected" : ""}>o3 (Advanced Reasoning)</option>
                            <option value="o3-mini" ${this._settings.openai?.model === "o3-mini" ? "selected" : ""}>o3-mini (Efficient Reasoning)</option>
                            <option value="o1" ${this._settings.openai?.model === "o1" ? "selected" : ""}>o1 (Reasoning)</option>
                        </optgroup>
                        <optgroup label="GPT-4o Series">
                            <option value="gpt-5.5-instant" ${this._settings.openai?.model === "gpt-5.5-instant" ? "selected" : ""}>GPT-4o (Multimodal)</option>
                            <option value="gpt-5.5-instant" ${this._settings.openai?.model === "gpt-5.5-instant" ? "selected" : ""}>GPT-4o Mini</option>
                            <option value="gpt-4o-mini-tts" ${this._settings.openai?.model === "gpt-4o-mini-tts" ? "selected" : ""}>GPT-4o Mini TTS</option>
                        </optgroup>
                        <optgroup label="Legacy Models">
                            <option value="gpt-4-turbo" ${this._settings.openai?.model === "gpt-4-turbo" ? "selected" : ""}>GPT-4 Turbo</option>
                            <option value="gpt-4" ${this._settings.openai?.model === "gpt-4" ? "selected" : ""}>GPT-4</option>
                            <option value="gpt-3.5-turbo" ${this._settings.openai?.model === "gpt-3.5-turbo" ? "selected" : ""}>GPT-3.5 Turbo</option>
                        </optgroup>
                    </select>
                </div>
            </div>`;
    }
}