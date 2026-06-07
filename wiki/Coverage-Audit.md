# GitMind 5.0 Documentation Coverage Audit

> Verified against GitMind `5.0.0` on June 7, 2026.

This page records the public surface checked during the GitMind 5.0 Wiki refresh. `node scripts/validate-wiki.mjs` compares the Wiki with `package.json` and fails when a public setting is undocumented.

## User-Facing Settings

- Model Settings: provider selection, all 17 built-in provider key/model/endpoint fields, Custom API, model loading, API checks, and rate-limit checks.
- Free Features: verbose output, Capture All Changes, custom context/saved prompt behavior, diagnostics, onboarding, debug, and telemetry.
- Commit Styles: all 12 styles and all Emoji Enhancement settings.
- Pro Features: encryption, target language, summary/body limits, advanced model parameters, Automatic Recovery, history learning, and changelog settings.
- Pro Activation: license-key activation, order verification, validation/status refresh, customer portal, deactivation, device slots, and troubleshooting.

Automatically managed values such as the saved last prompt, validation timestamps/status, instance IDs, and subscription state are documented as behavior but are not presented as user-editable settings. Developer-only environment and telemetry transport configuration is intentionally excluded.

## Supported Public Commands

| Area | Commands covered |
| --- | --- |
| Generate | Generate GitMind Commit Message; Cancel Generation |
| Settings and checks | GitMind Setting; Toggle Debug Mode; Check API Setup; Check Rate Limits |
| Models | Load/detect models from the Model Settings UI |
| Prompt and style | View Last Custom Prompt; Clear Last Custom Prompt; Change Commit Message Style |
| Onboarding | Open, complete, skip, reset, and re-enable onboarding through the walkthrough/UI |
| Pro workflows | Learn from Commit History; Generate Changelog; Update Changelog |
| Pro activation | Activate with license key/order ID; validate, refresh, manage, deactivate, and repair activation |

Internal status, migration, test, and debug-state commands are intentionally not documented as supported user workflows.

## Source Checks

- Providers: `package.json` and `src/webview/settings/components/config/ProviderConfig.ts`
- Styles: `src/config/commitStyles.ts`
- Recovery: `src/services/api/recovery.ts` and `src/services/api/index.ts`
- Activation: `src/services/subscription/` and public activation UI/commands
- Screenshots: current files under `images/screenshots/`
