import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { FormUtils } from "./utils/FormUtils";

export class CustomSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        // Get custom settings from the extension settings
        const baseUrl = this._settings.custom?.baseUrl || "";
        const endpoint = this._settings.custom?.endpoint || "";
        const authType = this._settings.custom?.authType || "bearer";
        const authToken = this._settings.custom?.authToken || "";
        const headerKey = this._settings.custom?.headerKey || "";
        const requestFormat = this._settings.custom?.requestFormat || "";
        const responseFormat = this._settings.custom?.responseFormat || "";
        const model = this._settings.custom?.model || "";
        const enabled = this._settings.custom?.enabled || false;

        return `
            <div id="customSettings" class="api-settings pro-feature ${this._settings.apiProvider === "custom" ? "" : "hidden"}">
                <h3>Custom API Settings</h3>
                <div class="pro-feature-badge">
                    <span class="badge">Pro</span>
                </div>
                
                <div class="description">
                    Configure your private cloud AI model endpoint. This feature allows connection to custom API endpoints with configurable authentication methods and request/response formats.
                </div>

                ${FormUtils.createToggle(
                    'customEnabled',
                    'Enable Custom API',
                    'Enable or disable the custom API provider',
                    enabled,
                    'custom.enabled'
                )}

                ${FormUtils.createTextField(
                    'customBaseUrl',
                    'Base URL',
                    'The base URL of your API (e.g., https://api.example.com)',
                    baseUrl,
                    'https://api.example.com'
                )}

                ${FormUtils.createTextField(
                    'customEndpoint',
                    'Endpoint Path',
                    'The path to the API endpoint (e.g., /v1/completions)',
                    endpoint,
                    '/v1/completions'
                )}

                <div class="form-group">
                    <label for="customAuthType">Authentication Type</label>
                    <select id="customAuthType">
                        <option value="bearer" ${authType === "bearer" ? "selected" : ""}>Bearer Token</option>
                        <option value="apikey" ${authType === "apikey" ? "selected" : ""}>API Key</option>
                        <option value="basic" ${authType === "basic" ? "selected" : ""}>Basic Auth</option>
                        <option value="none" ${authType === "none" ? "selected" : ""}>No Authentication</option>
                    </select>
                </div>

                ${FormUtils.createPasswordField(
                    'customAuthToken',
                    'Authentication Token',
                    'Your API authentication token/key',
                    authToken
                )}

                <div class="form-group api-key-header ${authType === "apikey" ? "" : "hidden"}" id="customHeaderKeyGroup">
                    <label for="customHeaderKey">Header Key Name</label>
                    <input type="text" id="customHeaderKey" value="${headerKey}" placeholder="X-API-Key" />
                    <div class="description">
                        The name of the header used for API key authentication (e.g., X-API-Key)
                    </div>
                </div>

                <div class="form-group">
                    <label for="customRequestFormat">Request Format</label>
                    <textarea id="customRequestFormat" 
                              placeholder='{"model": "{{model}}", "prompt": "{{prompt}}", "max_tokens": 500}'
                              rows="6">${requestFormat}</textarea>
                    <div class="description">
                        JSON template for request body. Use placeholders:
                        <ul>
                            <li><code>{{model}}</code> - The model identifier</li>
                            <li><code>{{prompt}}</code> - The commit message prompt</li>
                        </ul>
                    </div>
                </div>

                <div class="form-group">
                    <label for="customResponseFormat">Response Format</label>
                    <input type="text" 
                           id="customResponseFormat" 
                           value="${responseFormat}" 
                           placeholder="choices[0].message.content or response.text" />
                    <div class="description">
                        JSON path to extract the response text (e.g., choices[0].message.content)
                    </div>
                </div>

                ${FormUtils.createTextField(
                    'customModel',
                    'Model Identifier',
                    'The model identifier to use with this API',
                    model,
                    'gpt-4 or your-custom-model-id'
                )}

                <div class="form-actions">
                    ${FormUtils.createButton('testCustomConnectionBtn', 'Test Connection', 'action-button primary', false, 'Test the connection to your custom API')}
                </div>

                <script>
                    // Show/hide header key field based on auth type
                    document.getElementById('customAuthType')?.addEventListener('change', function() {
                        const headerKeyGroup = document.getElementById('customHeaderKeyGroup');
                        if (this.value === 'apikey') {
                            headerKeyGroup?.classList.remove('hidden');
                        } else {
                            headerKeyGroup?.classList.add('hidden');
                        }
                    });

                    // Test connection button handler
                    document.getElementById('testCustomConnectionBtn')?.addEventListener('click', function() {
                        // Send message to extension to test the connection
                        vscode.postMessage({
                            command: 'testCustomConnection',
                            baseUrl: document.getElementById('customBaseUrl')?.value,
                            endpoint: document.getElementById('customEndpoint')?.value,
                            authType: document.getElementById('customAuthType')?.value,
                            authToken: document.getElementById('customAuthToken')?.value,
                            headerKey: document.getElementById('customHeaderKey')?.value,
                            requestFormat: document.getElementById('customRequestFormat')?.value,
                            responseFormat: document.getElementById('customResponseFormat')?.value,
                            model: document.getElementById('customModel')?.value
                        });

                        // Show loading state
                        this.disabled = true;
                        this.textContent = 'Testing...';
                    });
                </script>
            </div>`;
    }
}
