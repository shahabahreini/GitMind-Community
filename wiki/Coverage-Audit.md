# GitMind 6.x Documentation Coverage Audit

> Verified against GitMind `6.1.1` on July 17, 2026

This page records the public surface checked directly against the current `package.json`. `npm run docs:validate` compares the handbook and generated Wiki with the generated sanitized product manifest.

## Verified Counts

| Surface | GitMind 6.1.1 |
| --- | ---: |
| Provider choices | 18: 17 built-in plus Pro Custom API |
| Registered settings | 106 |
| User-documentable settings | 96 |
| Registered commands | 55 |
| Supported public commands | 44 |
| Commit styles | 12 |
| Primary settings tabs | 5 |

## User-Facing Settings

- Model Settings: provider selection, all 17 built-in provider key/model/endpoint fields, Custom API, model loading, API checks, and rate-limit checks.
- Free Features: verbose output, Capture All Changes, custom context/saved prompt behavior, diagnostics, onboarding, and the default-off Commit Intelligence (Preview) controls.
- Commit Styles: all 12 styles and all Emoji Enhancement settings.
- Pro Features: encryption, target language, summary/body limits, advanced model parameters, Automatic Recovery, history learning, changelog settings, and sanitized Support Reports.
- Pro Activation: license-key activation, validation, deactivation, device slots, legacy-access migration, and troubleshooting.

Automatically managed values such as the saved last prompt, validation timestamps/status, instance IDs, and subscription state are documented as behavior but are not presented as user-editable settings.

## Supported Public Commands

| Area | Commands covered |
| --- | --- |
| Generate | Generate GitMind Commit Message; Cancel Generation |
| Settings and checks | GitMind Setting; Check API Setup; Check Rate Limits |
| Models | Load/detect models from the Model Settings UI |
| Prompt and style | View Last Custom Prompt; Clear Last Custom Prompt; Change Commit Message Style |
| Onboarding | Open, complete, skip, reset, and re-enable onboarding through the walkthrough/UI |
| Pro workflows | Three candidates; Commit Composer; change review; squash, pull-request, stash, release-note, and explanation drafts; Learn from Commit History; Generate Changelog; Update Changelog |
| Pro support | Start, stop/review, save, and delete a sanitized Support Report session |
| Pro activation | Activate with license key; validate, deactivate, repair activation, and migrate legacy access |

Internal status, migration, test, and debug-state commands are intentionally not documented as supported user workflows.

## Source Checks

- Contract source: current `package.json`
- Sanitized contract: `docs/reference/gitmind-user-surface.json`
- Screenshots: current files under `images/screenshots/`

The provider selector exposes 18 choices: 17 built-in providers plus the Pro-only Custom API provider.
