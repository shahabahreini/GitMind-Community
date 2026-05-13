import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { FormUtils } from "./utils/FormUtils";

export class CohereSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        const apiKeyValue = this._settings.cohere?.apiKey || "";

        // Define default Cohere models to show initially
        const defaultModels = [
            'command-a-03-2025',
            "command-a-reasoning",
            "command-a",
            "command-a",
            "command-a",
            'command-r',
            'command-r-plus',
            'command',
            'command-light'
        ];

        // Build the options HTML
        let optionsHtml = '';

        // Add the current saved model if it's not in the default list
        const currentModel = this._settings.cohere?.model || 'command-a-03-2025';
        if (!defaultModels.includes(currentModel)) {
            optionsHtml += `<option value="${currentModel}" selected>${currentModel}</option>`;
        }

        // Add the default models
        defaultModels.forEach(model => {
            optionsHtml += `<option value="${model}" ${model === currentModel ? 'selected' : ''}>${model}</option>`;
        });

        return `
            <div id="cohereSettings" class="api-settings ${this._settings.apiProvider === "cohere" ? "" : "hidden"}">
                <h3>Cohere Settings</h3>
                ${FormUtils.createPasswordField(
            'cohereApiKey',
            'API Key',
            'Your Cohere API key for authentication',
            apiKeyValue,
            { url: 'https://dashboard.cohere.com/api-keys', text: 'Learn more' }
        )}
                <div class="form-group">
                    <label for="cohereModel">Model</label>
                    <select id="cohereModel">
                        ${optionsHtml}
                    </select>
                    <button id="loadCohereModels" class="button small load-models-inline">Load Available Models</button>
                    <div class="description">
                        Default models shown. Click "Load Available Models" to fetch all current chat-enabled models from Cohere.
                    </div>
                </div>
            </div>`;
    }
}