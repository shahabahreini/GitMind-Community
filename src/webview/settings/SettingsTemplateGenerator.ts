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
      <style>
        /* Critical CSS - Prevent FOUC (Flash of Unstyled Content) */
        /* Ensure page is completely hidden until styles are ready */
        html {
          visibility: hidden;
          opacity: 0;
        }
        html.ready {
          visibility: visible;
          opacity: 1;
        }
        html, body {
          margin: 0;
          padding: 0;
        }
        body.loading {
          visibility: hidden !important;
        }
        body {
          visibility: visible;
          opacity: 1;
          animation: fadeIn 0.15s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* Critical banner styles to prevent flash */
        .status-banner-compact {
          background: var(--vscode-editor-background);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }
        .banner-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .provider-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--vscode-foreground);
        }
      </style>
      ${getMainStyles()}
      <script nonce="${this._nonce}">
        // Immediately hide document before any rendering
        (function() {
          document.documentElement.style.visibility = 'hidden';
          document.documentElement.style.opacity = '0';
        })();
      </script>
    </head>
    <body class="loading" style="visibility: hidden;">
      <div class="settings-container" style="opacity: 0;">
        <div id="statusBannerContainer" style="opacity: 0;">
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
