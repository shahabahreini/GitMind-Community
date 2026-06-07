# GitMind 5.x Documentation Coverage Audit

> Verified against GitMind `5.0.2` on June 7, 2026.

This page records the public surface checked against the packaged GitMind 5.0.2 release. `npm run docs:validate` compares the handbook and generated Wiki with the sanitized product manifest.

## Verified Counts

| Surface | GitMind 5.0.2 |
| --- | ---: |
| Provider choices | 18: 17 built-in plus Pro Custom API |
| Registered settings | 97 |
| User-documentable settings | 85 |
| Registered commands | 43 |
| Supported public commands | 34 |
| Commit styles | 12 |
| Primary settings tabs | 5 |

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

- Contract source: packaged `ai-commit-assistant-5.0.2.vsix`
- Sanitized contract: `docs/reference/gitmind-user-surface.json`
- Screenshots: current files under `images/screenshots/`

## Sanitized Source Inconsistencies

- The 5.0.2 walkthrough text says "17 built-in providers"; this is correct, while the provider selector exposes 18 choices because Custom API is the Pro-only eighteenth choice.
- Older public repository metadata still describes the open-source 3.5.7 surface and 13 providers. It is not used as the 5.x documentation contract.
