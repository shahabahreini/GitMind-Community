---
name: scripts
description: "Skill for the Scripts area of GitMind-Pro. 38 symbols across 14 files."
---

# Scripts

38 symbols | 14 files | Cohesion: 99%

## When to Use

- Working with code in `src/`
- Understanding how getToastStyles, getEncryptionStatusStyles, getDetailedStatusStyles work
- Modifying scripts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `scripts/privacy-validator.js` | warning, pass, validateTelemetryService, validateExtensionUsage, validateAzureConfiguration (+4) |
| `src/webview/settings/scripts/settingsManager.ts` | getCustomApiHandlerScript, getSettingsScript, generateGlobalFormUtils, generatePasswordFieldManager, generateInitializationManager (+3) |
| `src/webview/settings/scripts/uiUtilities.ts` | getTooltipInitializationScript, getToastStylesScript, getToastScript, getEncryptionStatusScript, getDetailedStatusStylesScript (+1) |
| `src/webview/settings/scripts/formGenerators.ts` | generateFormInitialization, generateSettingsCollection, generateUpdateSettingsCode, generateUpdateSettingsCodePreserveDropdowns |
| `src/webview/settings/scripts/modelHandlers.ts` | getModelHandlingScript, getModelEventListenersScript |
| `src/webview/settings/styles/toast.css.ts` | getToastStyles |
| `src/webview/settings/styles/encryptionStatus.css.ts` | getEncryptionStatusStyles |
| `src/webview/settings/styles/detailedStatus.css.ts` | getDetailedStatusStyles |
| `src/webview/settings/scripts/uiManager.ts` | getUiManagerScript |
| `src/webview/settings/scripts/tabManager.ts` | getTabManagerScript |

## Entry Points

Start here when exploring this area:

- **`getToastStyles`** (Function) — `src/webview/settings/styles/toast.css.ts:0`
- **`getEncryptionStatusStyles`** (Function) — `src/webview/settings/styles/encryptionStatus.css.ts:1`
- **`getDetailedStatusStyles`** (Function) — `src/webview/settings/styles/detailedStatus.css.ts:1`
- **`getTooltipInitializationScript`** (Function) — `src/webview/settings/scripts/uiUtilities.ts:4`
- **`getToastStylesScript`** (Function) — `src/webview/settings/scripts/uiUtilities.ts:98`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getToastStyles` | Function | `src/webview/settings/styles/toast.css.ts` | 0 |
| `getEncryptionStatusStyles` | Function | `src/webview/settings/styles/encryptionStatus.css.ts` | 1 |
| `getDetailedStatusStyles` | Function | `src/webview/settings/styles/detailedStatus.css.ts` | 1 |
| `getTooltipInitializationScript` | Function | `src/webview/settings/scripts/uiUtilities.ts` | 4 |
| `getToastStylesScript` | Function | `src/webview/settings/scripts/uiUtilities.ts` | 98 |
| `getToastScript` | Function | `src/webview/settings/scripts/uiUtilities.ts` | 114 |
| `getEncryptionStatusScript` | Function | `src/webview/settings/scripts/uiUtilities.ts` | 160 |
| `getDetailedStatusStylesScript` | Function | `src/webview/settings/scripts/uiUtilities.ts` | 176 |
| `getDetailedStatusScript` | Function | `src/webview/settings/scripts/uiUtilities.ts` | 192 |
| `getUiManagerScript` | Function | `src/webview/settings/scripts/uiManager.ts` | 99 |
| `getTabManagerScript` | Function | `src/webview/settings/scripts/tabManager.ts` | 0 |
| `getSettingsScript` | Function | `src/webview/settings/scripts/settingsManager.ts` | 141 |
| `getModelHandlingScript` | Function | `src/webview/settings/scripts/modelHandlers.ts` | 2 |
| `getModelEventListenersScript` | Function | `src/webview/settings/scripts/modelHandlers.ts` | 199 |
| `getMessageHandlersScript` | Function | `src/webview/settings/scripts/messageHandlers.ts` | 2 |
| `getLanguageDropdownScript` | Function | `src/webview/settings/scripts/languageDropdown.ts` | 1 |
| `generateFormInitialization` | Function | `src/webview/settings/scripts/formGenerators.ts` | 2 |
| `generateSettingsCollection` | Function | `src/webview/settings/scripts/formGenerators.ts` | 246 |
| `generateUpdateSettingsCode` | Function | `src/webview/settings/scripts/formGenerators.ts` | 434 |
| `generateUpdateSettingsCodePreserveDropdowns` | Function | `src/webview/settings/scripts/formGenerators.ts` | 511 |

## How to Explore

1. `gitnexus_context({name: "getToastStyles"})` — see callers and callees
2. `gitnexus_query({query: "scripts"})` — find related execution flows
3. Read key files listed above for implementation details
