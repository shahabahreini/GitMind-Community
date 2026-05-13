import { ExtensionSettings } from "../../../models/ExtensionSettings";
import { FormUtils } from "./utils/FormUtils";

export class PerplexitySettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    const apiKeyValue = this._settings.perplexity?.apiKey || "";
    const currentModel = this._settings.perplexity?.model || "sonar-pro";

    const defaultModels = [
      { value: "sonar-pro", label: "Sonar Pro" },
      { value: "sonar-reasoning-pro", label: "Sonar Reasoning Pro" },
      { value: "sonar", label: "Sonar" },
      { value: "sonar-reasoning", label: "Sonar Reasoning" },
      { value: "r1-1776", label: "R1-1776" }
    ];

    const optionsHtml = defaultModels
      .map(m => `<option value="${m.value}" ${m.value === currentModel ? "selected" : ""}>${m.label}</option>`)
      .join("");

    return `
    <div id="perplexitySettings" class="api-settings ${this._settings.apiProvider === "perplexity" ? "" : "hidden"}">
      <h3>Perplexity Settings</h3>
      ${FormUtils.createPasswordField(
      'perplexityApiKey',
      'API Key',
      'Your Perplexity API key for authentication',
      apiKeyValue,
      { url: 'https://www.perplexity.ai/settings/api', text: 'Get your API key from Perplexity API Settings' }
    )}
      <div class="form-group">
        <label for="perplexityModel">Model</label>
        <div class="model-select-container">
          <select id="perplexityModel">
            ${optionsHtml}
          </select>
          <button id="loadPerplexityModels"
                  class="button small load-models-inline"
                  data-tooltip="Default models shown. Click &quot;Load Available Models&quot; to fetch all models available on the Perplexity Agent API.">
            Load Available Models
          </button>
        </div>
      </div>
    </div>`;
  }
}
