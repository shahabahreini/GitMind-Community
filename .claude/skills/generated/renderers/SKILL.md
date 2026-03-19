---
name: renderers
description: "Skill for the Renderers area of GitMind-Pro. 72 symbols across 15 files."
---

# Renderers

72 symbols | 15 files | Cohesion: 86%

## When to Use

- Working with code in `src/`
- Understanding how getSubscriptionStyles, getEmojiEnhancementStyles, SubscriptionRenderer work
- Modifying renderers-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/webview/settings/components/renderers/CommitStyleRenderer.ts` | renderEmojiTab, renderEmojiExamples, getEmojiExample, renderEmojiTabStyles, renderGitmojiSection (+14) |
| `src/webview/settings/components/renderers/SubscriptionRenderer.ts` | render, renderSubscriptionHeader, renderSubscriptionStatus, renderSubscriptionPlans, renderSubscriptionManagement (+6) |
| `src/webview/settings/components/renderers/ProFeatureRenderer.ts` | ProFeatureRenderer, render, renderSecurityAndLargeDiffSection, renderAdvancedModelConfigurationSection, renderCommitMessageOptionsSection (+4) |
| `src/webview/settings/components/utils/FormUtils.ts` | createButton, createSelect, groupOptions, createFormGroup, createPasswordField (+3) |
| `src/webview/settings/components/renderers/ModelSettingsRenderer.ts` | ModelSettingsRenderer, render, renderProviderSelector, renderAllProviderSettings, renderProviderSettings (+2) |
| `src/webview/settings/components/renderers/BaseRenderer.ts` | hasSubscriptionEmail, hasActiveSubscription, hasValidLicense, isProUser, isDevModeEnabled (+1) |
| `src/webview/settings/components/renderers/FreeFeatureRenderer.ts` | FreeFeatureRenderer, render, renderToggleFeatures, renderUpgradePromptIfNeeded |
| `src/webview/settings/styles/subscription.css.ts` | getSubscriptionStyles |
| `src/webview/settings/styles/emojiEnhancement.css.ts` | getEmojiEnhancementStyles |
| `src/webview/settings/components/ProFeaturesSettings.ts` | constructor |

## Entry Points

Start here when exploring this area:

- **`getSubscriptionStyles`** (Function) — `src/webview/settings/styles/subscription.css.ts:1`
- **`getEmojiEnhancementStyles`** (Function) — `src/webview/settings/styles/emojiEnhancement.css.ts:1`
- **`SubscriptionRenderer`** (Class) — `src/webview/settings/components/renderers/SubscriptionRenderer.ts:5`
- **`ProFeatureRenderer`** (Class) — `src/webview/settings/components/renderers/ProFeatureRenderer.ts:5`
- **`ModelSettingsRenderer`** (Class) — `src/webview/settings/components/renderers/ModelSettingsRenderer.ts:6`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SubscriptionRenderer` | Class | `src/webview/settings/components/renderers/SubscriptionRenderer.ts` | 5 |
| `ProFeatureRenderer` | Class | `src/webview/settings/components/renderers/ProFeatureRenderer.ts` | 5 |
| `ModelSettingsRenderer` | Class | `src/webview/settings/components/renderers/ModelSettingsRenderer.ts` | 6 |
| `FreeFeatureRenderer` | Class | `src/webview/settings/components/renderers/FreeFeatureRenderer.ts` | 4 |
| `CommitStyleRenderer` | Class | `src/webview/settings/components/renderers/CommitStyleRenderer.ts` | 5 |
| `TabManager` | Class | `src/webview/settings/components/managers/TabManager.ts` | 9 |
| `StyleManager` | Class | `src/webview/settings/components/managers/StyleManager.ts` | 17 |
| `ScriptManager` | Class | `src/webview/settings/components/managers/ScriptManager.ts` | 2 |
| `getSubscriptionStyles` | Function | `src/webview/settings/styles/subscription.css.ts` | 1 |
| `getEmojiEnhancementStyles` | Function | `src/webview/settings/styles/emojiEnhancement.css.ts` | 1 |
| `createButton` | Method | `src/webview/settings/components/utils/FormUtils.ts` | 127 |
| `render` | Method | `src/webview/settings/components/renderers/SubscriptionRenderer.ts` | 6 |
| `renderSubscriptionHeader` | Method | `src/webview/settings/components/renderers/SubscriptionRenderer.ts` | 116 |
| `renderSubscriptionStatus` | Method | `src/webview/settings/components/renderers/SubscriptionRenderer.ts` | 134 |
| `renderSubscriptionPlans` | Method | `src/webview/settings/components/renderers/SubscriptionRenderer.ts` | 182 |
| `renderSubscriptionManagement` | Method | `src/webview/settings/components/renderers/SubscriptionRenderer.ts` | 223 |
| `renderProActivation` | Method | `src/webview/settings/components/renderers/SubscriptionRenderer.ts` | 262 |
| `renderLicenseKeyActivationCard` | Method | `src/webview/settings/components/renderers/SubscriptionRenderer.ts` | 282 |
| `renderOrderIdActivationCard` | Method | `src/webview/settings/components/renderers/SubscriptionRenderer.ts` | 310 |
| `renderProStatusActions` | Method | `src/webview/settings/components/renderers/SubscriptionRenderer.ts` | 338 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Render → HasSubscriptionEmail` | cross_community | 4 |
| `Render → HasValidLicense` | intra_community | 4 |
| `Render → HasSubscriptionEmail` | intra_community | 4 |

## How to Explore

1. `gitnexus_context({name: "getSubscriptionStyles"})` — see callers and callees
2. `gitnexus_query({query: "renderers"})` — find related execution flows
3. Read key files listed above for implementation details
