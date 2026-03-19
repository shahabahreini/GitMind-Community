---
name: settings
description: "Skill for the Settings area of GitMind-Pro. 15 symbols across 4 files."
---

# Settings

15 symbols | 4 files | Cohesion: 65%

## When to Use

- Working with code in `src/`
- Understanding how SettingsTemplateGenerator, SettingsManager, MessageHandler work
- Modifying settings-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/webview/settings/SettingsManager.ts` | SettingsManager, getSettings, getCurrentSettings, buildSettingsFromConfig, getActualLicenseKey (+5) |
| `src/webview/settings/SettingsWebview.ts` | constructor, _update, dispose |
| `src/webview/settings/SettingsTemplateGenerator.ts` | SettingsTemplateGenerator |
| `src/webview/settings/MessageHandler.ts` | MessageHandler |

## Entry Points

Start here when exploring this area:

- **`SettingsTemplateGenerator`** (Class) — `src/webview/settings/SettingsTemplateGenerator.ts:10`
- **`SettingsManager`** (Class) — `src/webview/settings/SettingsManager.ts:18`
- **`MessageHandler`** (Class) — `src/webview/settings/MessageHandler.ts:10`
- **`constructor`** (Method) — `src/webview/settings/SettingsWebview.ts:58`
- **`_update`** (Method) — `src/webview/settings/SettingsWebview.ts:108`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SettingsTemplateGenerator` | Class | `src/webview/settings/SettingsTemplateGenerator.ts` | 10 |
| `SettingsManager` | Class | `src/webview/settings/SettingsManager.ts` | 18 |
| `MessageHandler` | Class | `src/webview/settings/MessageHandler.ts` | 10 |
| `constructor` | Method | `src/webview/settings/SettingsWebview.ts` | 58 |
| `_update` | Method | `src/webview/settings/SettingsWebview.ts` | 108 |
| `dispose` | Method | `src/webview/settings/SettingsWebview.ts` | 123 |
| `getSettings` | Method | `src/webview/settings/SettingsManager.ts` | 50 |
| `getCurrentSettings` | Method | `src/webview/settings/SettingsManager.ts` | 55 |
| `buildSettingsFromConfig` | Method | `src/webview/settings/SettingsManager.ts` | 68 |
| `getActualLicenseKey` | Method | `src/webview/settings/SettingsManager.ts` | 598 |
| `getEncryptionEnabledSetting` | Method | `src/webview/settings/SettingsManager.ts` | 626 |
| `saveSettings` | Method | `src/webview/settings/SettingsManager.ts` | 195 |
| `saveSettingsDebounced` | Method | `src/webview/settings/SettingsManager.ts` | 269 |
| `updateConfigurationSettings` | Method | `src/webview/settings/SettingsManager.ts` | 402 |
| `trackSettingsChanges` | Method | `src/webview/settings/SettingsManager.ts` | 504 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → SecureKeyManager` | cross_community | 6 |
| `HandleMessage → GetEncryptionEnabledSetting` | cross_community | 5 |
| `HandleMessage → GetActualLicenseKey` | cross_community | 5 |
| `HandleMessage → SecureKeyManager` | cross_community | 5 |
| `HandleMessage → IsSecretStorageAvailable` | cross_community | 5 |
| `HandleMessage → GetPlainTextApiKey` | cross_community | 5 |
| `HandleMessage → ClearPlainTextApiKey` | cross_community | 5 |
| `HandleMessage → ClearApiKeyCache` | cross_community | 5 |
| `Constructor → GetEncryptionEnabledSetting` | cross_community | 5 |
| `Constructor → GetActualLicenseKey` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Encryption | 3 calls |
| Diagnostics | 1 calls |
| Components | 1 calls |
| Telemetry | 1 calls |
| Onboarding | 1 calls |

## How to Explore

1. `gitnexus_context({name: "SettingsTemplateGenerator"})` — see callers and callees
2. `gitnexus_query({query: "settings"})` — find related execution flows
3. Read key files listed above for implementation details
