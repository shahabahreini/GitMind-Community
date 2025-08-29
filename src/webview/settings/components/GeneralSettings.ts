// src/webview/settings/components/GeneralSettings.ts
import { ExtensionSettings } from "../../../models/ExtensionSettings";

export class GeneralSettings {
  private _settings: ExtensionSettings;

  constructor(settings: ExtensionSettings) {
    this._settings = settings;
  }

  public render(): string {
    return `
    <div class="settings-section general-settings-compact">
      <!-- Model Settings moved to dedicated tab -->
    </div>`;
  }
}
