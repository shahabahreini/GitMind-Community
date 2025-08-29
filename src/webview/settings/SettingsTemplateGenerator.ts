// src/webview/settings/SettingsTemplateGenerator.ts
import * as vscode from "vscode";
import { ExtensionSettings } from "../../models/ExtensionSettings";
import { getMainStyles } from "./styles/main.css";
import { StatusBanner } from "./components/StatusBanner";
import { GeneralSettings } from "./components/GeneralSettings";
import { ButtonGroup } from "./components/ButtonGroup";
import { getSettingsScript } from "./scripts/settingsManager";
import { ProFeaturesSettings } from "./components/ProFeaturesSettings";

export class SettingsTemplateGenerator {
  private _settings: ExtensionSettings;
  private _nonce: string;
  private _webview: vscode.Webview;

  constructor(settings: ExtensionSettings, nonce: string, webview: vscode.Webview) {
    this._settings = settings;
    this._nonce = nonce;
    this._webview = webview;
  }

  public generateHtml(): string {
    const statusBanner = new StatusBanner(this._settings);
    const generalSettings = new GeneralSettings(this._settings);
    const buttonGroup = new ButtonGroup();
    const proFeaturesSettings = new ProFeaturesSettings(this._settings);

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>GitMind Settings</title>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${this._webview.cspSource}; script-src 'unsafe-inline' ${this._webview.cspSource}; worker-src ${this._webview.cspSource}; child-src ${this._webview.cspSource}; frame-src ${this._webview.cspSource}; connect-src ${this._webview.cspSource}; img-src ${this._webview.cspSource} data:;">
      ${getMainStyles()}
    </head>
    <body>
      <div class="settings-container">
        <div id="statusBannerContainer">
          ${statusBanner.render()}
        </div>
        <h2>GitMind Settings</h2>
        ${proFeaturesSettings.render()}
        ${generalSettings.render()}
        ${buttonGroup.render()}
      </div>
      ${getSettingsScript(this._settings, this._nonce)}
    </body>
    </html>`;
  }
}
