import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class GrokSettings {
    private _settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this._settings = settings;
    }

    public render(): string {
        return `
    <div id="grokSettings" class="api-settings ${this._settings.apiProvider === "grok" ? "" : "hidden"}">
      <h3>Grok Settings</h3>
      <div class="form-group">
        <label for="grokApiKey">API Key</label>
        <input type="password" id="grokApiKey" value="${this._settings.grok?.apiKey || ""}" />
        <div class="description">
          Get your API key from <a href="https://api.x.ai/" target="_blank">X.ai API Platform</a>
        </div>
      </div>
      <div class="form-group">
        <label for="grokModel">Model</label>
        <select id="grokModel">
          <optgroup label="Grok 3 Series (Latest)">
            <option value="grok-3" ${this._settings.grok?.model === "grok-3" ? "selected" : ""}>Grok 3 (Most Capable)</option>
            <option value="grok-3-fast" ${this._settings.grok?.model === "grok-3-fast" ? "selected" : ""}>Grok 3 Fast (High Performance)</option>
            <option value="grok-3-mini" ${this._settings.grok?.model === "grok-3-mini" ? "selected" : ""}>Grok 3 Mini (Cost Effective)</option>
          </optgroup>
          <optgroup label="Grok 2 Series">
            <option value="grok-2" ${this._settings.grok?.model === "grok-2" ? "selected" : ""}>Grok 2 (General Purpose)</option>
            <option value="grok-2-vision" ${this._settings.grok?.model === "grok-2-vision" ? "selected" : ""}>Grok 2 Vision (Image Understanding)</option>
            <option value="grok-2-mini" ${this._settings.grok?.model === "grok-2-mini" ? "selected" : ""}>Grok 2 Mini (Compact)</option>
            <option value="grok-2-turbo" ${this._settings.grok?.model === "grok-2-turbo" ? "selected" : ""}>Grok 2 Turbo (High Speed)</option>
            <option value="grok-2-vision-turbo" ${this._settings.grok?.model === "grok-2-vision-turbo" ? "selected" : ""}>Grok 2 Vision Turbo (Fast Multimodal)</option>
            <option value="grok-2-fast" ${this._settings.grok?.model === "grok-2-fast" ? "selected" : ""}>Grok 2 Fast (Speed Optimized)</option>
          </optgroup>
          <optgroup label="Beta Models">
            <option value="grok-beta" ${this._settings.grok?.model === "grok-beta" ? "selected" : ""}>Grok Beta (Experimental Features)</option>
            <option value="grok-vision-beta" ${this._settings.grok?.model === "grok-vision-beta" ? "selected" : ""}>Grok Vision Beta (Vision Capabilities)</option>
            <option value="grok-image-beta" ${this._settings.grok?.model === "grok-image-beta" ? "selected" : ""}>Grok Image Beta (Image Generation)</option>
            <option value="grok-image-mini" ${this._settings.grok?.model === "grok-image-mini" ? "selected" : ""}>Grok Image Mini (Compact Image)</option>
          </optgroup>
        </select>
        <div class="description">
          Choose the Grok model that fits your needs. Grok 3 series offers the latest capabilities, while Grok 2 series provides proven performance. Vision models support image understanding.
        </div>
      </div>
    </div>`;
    }
}
