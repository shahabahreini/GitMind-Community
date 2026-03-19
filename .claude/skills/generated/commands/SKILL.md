---
name: commands
description: "Skill for the Commands area of GitMind-Pro. 20 symbols across 7 files."
---

# Commands

20 symbols | 7 files | Cohesion: 52%

## When to Use

- Working with code in `src/`
- Understanding how toggleDebugSetting, registerCommands, cancelCurrentRequest work
- Modifying commands-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/commands/index.ts` | handlePromptAction, handleOnboardingAction, showDeactivationSuccessModal, showLicenseKeyModal, openSupportEmail (+4) |
| `src/utils/onboardingManager.ts` | resetOnboardingState, canManuallyOpen |
| `src/services/promptManager.ts` | getLastPrompt, clearLastPrompt |
| `src/webview/settings/SettingsWebview.ts` | SettingsWebview, createOrShow |
| `src/services/api/index.ts` | cancelCurrentRequest, isRequestActive |
| `src/webview/onboarding/OnboardingWebview.ts` | postMessageToWebview, isWebviewOpen |
| `src/utils/encryptionHelper.ts` | clearLicenseKey |

## Entry Points

Start here when exploring this area:

- **`toggleDebugSetting`** (Function) — `src/commands/index.ts:924`
- **`registerCommands`** (Function) — `src/commands/index.ts:939`
- **`cancelCurrentRequest`** (Function) — `src/services/api/index.ts:322`
- **`isRequestActive`** (Function) — `src/services/api/index.ts:331`
- **`SettingsWebview`** (Class) — `src/webview/settings/SettingsWebview.ts:9`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SettingsWebview` | Class | `src/webview/settings/SettingsWebview.ts` | 9 |
| `toggleDebugSetting` | Function | `src/commands/index.ts` | 924 |
| `registerCommands` | Function | `src/commands/index.ts` | 939 |
| `cancelCurrentRequest` | Function | `src/services/api/index.ts` | 322 |
| `isRequestActive` | Function | `src/services/api/index.ts` | 331 |
| `resetOnboardingState` | Method | `src/utils/onboardingManager.ts` | 473 |
| `canManuallyOpen` | Method | `src/utils/onboardingManager.ts` | 490 |
| `clearLicenseKey` | Method | `src/utils/encryptionHelper.ts` | 213 |
| `getLastPrompt` | Method | `src/services/promptManager.ts` | 73 |
| `clearLastPrompt` | Method | `src/services/promptManager.ts` | 81 |
| `createOrShow` | Method | `src/webview/settings/SettingsWebview.ts` | 27 |
| `postMessageToWebview` | Method | `src/webview/onboarding/OnboardingWebview.ts` | 19 |
| `isWebviewOpen` | Method | `src/webview/onboarding/OnboardingWebview.ts` | 25 |
| `handlePromptAction` | Function | `src/commands/index.ts` | 654 |
| `handleOnboardingAction` | Function | `src/commands/index.ts` | 738 |
| `showDeactivationSuccessModal` | Function | `src/commands/index.ts` | 763 |
| `showLicenseKeyModal` | Function | `src/commands/index.ts` | 862 |
| `openSupportEmail` | Function | `src/commands/index.ts` | 898 |
| `hasApiKey` | Function | `src/commands/index.ts` | 61 |
| `sendApiCheckResult` | Function | `src/commands/index.ts` | 117 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `RegisterCommands → GetConfigForTarget` | cross_community | 5 |
| `RegisterCommands → GetConfiguration` | cross_community | 5 |
| `RegisterCommands → SettingsMigrationService` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Subscription | 10 calls |
| Api | 7 calls |
| Encryption | 4 calls |
| Migration | 1 calls |
| Services | 1 calls |
| Changelog | 1 calls |

## How to Explore

1. `gitnexus_context({name: "toggleDebugSetting"})` — see callers and callees
2. `gitnexus_query({query: "commands"})` — find related execution flows
3. Read key files listed above for implementation details
