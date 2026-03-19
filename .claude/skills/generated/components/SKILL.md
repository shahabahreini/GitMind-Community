---
name: components
description: "Skill for the Components area of GitMind-Pro. 37 symbols across 12 files."
---

# Components

37 symbols | 12 files | Cohesion: 86%

## When to Use

- Working with code in `src/`
- Understanding how getOllamaModels, OllamaProvider, GitmojiCustomDialog work
- Modifying components-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/webview/settings/components/GitmojiCustomDialog.ts` | GitmojiCustomDialog, getInstance, showCustomEmojiDialog, showEmojiInputDialog, handleCustomEmojiInput (+6) |
| `src/services/gitmoji/GitmojiService.ts` | getCustomEmojis, getEffectiveEmojis, getEmojiForType, getAvailableEmojiTypes |
| `src/webview/settings/components/ProFeaturesSettings.ts` | ProFeaturesSettings, render, isDevModeEnabled, renderDevModeNotice |
| `src/services/api/ollama.ts` | OllamaProvider, getModels, getOllamaModels |
| `src/webview/settings/components/StatusBanner.ts` | StatusBanner, getProviderInfo, render |
| `src/webview/settings/components/managers/TabManager.ts` | renderTabContainer, renderTabHeader, renderTabContent |
| `src/webview/settings/SettingsWebviewProvider.ts` | resolveWebviewPanel, dispose |
| `src/webview/settings/components/GeneralSettings.ts` | GeneralSettings, render |
| `src/webview/settings/components/ButtonGroup.ts` | ButtonGroup, render |
| `src/webview/settings/SettingsTemplateGenerator.ts` | generateHtml |

## Entry Points

Start here when exploring this area:

- **`getOllamaModels`** (Function) — `src/services/api/ollama.ts:159`
- **`OllamaProvider`** (Class) — `src/services/api/ollama.ts:27`
- **`GitmojiCustomDialog`** (Class) — `src/webview/settings/components/GitmojiCustomDialog.ts:4`
- **`StatusBanner`** (Class) — `src/webview/settings/components/StatusBanner.ts:11`
- **`ProFeaturesSettings`** (Class) — `src/webview/settings/components/ProFeaturesSettings.ts:11`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `OllamaProvider` | Class | `src/services/api/ollama.ts` | 27 |
| `GitmojiCustomDialog` | Class | `src/webview/settings/components/GitmojiCustomDialog.ts` | 4 |
| `StatusBanner` | Class | `src/webview/settings/components/StatusBanner.ts` | 11 |
| `ProFeaturesSettings` | Class | `src/webview/settings/components/ProFeaturesSettings.ts` | 11 |
| `GeneralSettings` | Class | `src/webview/settings/components/GeneralSettings.ts` | 3 |
| `ButtonGroup` | Class | `src/webview/settings/components/ButtonGroup.ts` | 1 |
| `getOllamaModels` | Function | `src/services/api/ollama.ts` | 159 |
| `resolveWebviewPanel` | Method | `src/webview/settings/SettingsWebviewProvider.ts` | 11 |
| `dispose` | Method | `src/webview/settings/SettingsWebviewProvider.ts` | 115 |
| `getCustomEmojis` | Method | `src/services/gitmoji/GitmojiService.ts` | 116 |
| `getEffectiveEmojis` | Method | `src/services/gitmoji/GitmojiService.ts` | 124 |
| `getEmojiForType` | Method | `src/services/gitmoji/GitmojiService.ts` | 193 |
| `getAvailableEmojiTypes` | Method | `src/services/gitmoji/GitmojiService.ts` | 261 |
| `getModels` | Method | `src/services/api/ollama.ts` | 74 |
| `getInstance` | Method | `src/webview/settings/components/GitmojiCustomDialog.ts` | 12 |
| `showCustomEmojiDialog` | Method | `src/webview/settings/components/GitmojiCustomDialog.ts` | 19 |
| `showEmojiInputDialog` | Method | `src/webview/settings/components/GitmojiCustomDialog.ts` | 42 |
| `handleCustomEmojiInput` | Method | `src/webview/settings/components/GitmojiCustomDialog.ts` | 74 |
| `resetToDefault` | Method | `src/webview/settings/components/GitmojiCustomDialog.ts` | 99 |
| `removeCustomMapping` | Method | `src/webview/settings/components/GitmojiCustomDialog.ts` | 110 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → RenderIcon` | cross_community | 6 |
| `ResolveWebviewPanel → SecureKeyManager` | cross_community | 5 |
| `ResolveWebviewPanel → EvictExpiredCacheEntries` | cross_community | 5 |
| `ResolveWebviewPanel → IsSecretStorageAvailable` | cross_community | 5 |
| `ResolveWebviewPanel → GetPlainTextApiKey` | cross_community | 5 |
| `ResolveWebviewPanel → NormalizeHeaders` | cross_community | 5 |
| `ResolveWebviewPanel → GetConfiguration` | cross_community | 4 |
| `ResolveWebviewPanel → GetEffectiveModel` | cross_community | 4 |
| `ResolveWebviewPanel → GetCustomEmojis` | intra_community | 4 |
| `Constructor → StatusBanner` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Api | 2 calls |
| Styles | 1 calls |
| Scripts | 1 calls |
| Managers | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getOllamaModels"})` — see callers and callees
2. `gitnexus_query({query: "components"})` — find related execution flows
3. Read key files listed above for implementation details
