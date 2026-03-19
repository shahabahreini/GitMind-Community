---
name: onboarding
description: "Skill for the Onboarding area of GitMind-Pro. 17 symbols across 7 files."
---

# Onboarding

17 symbols | 7 files | Cohesion: 72%

## When to Use

- Working with code in `src/`
- Understanding how getStatusBannerStyles, getOnboardingStyles, OnboardingMessageHandler work
- Modifying onboarding-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/webview/onboarding/OnboardingTemplateGenerator.ts` | generateHtml, generateHeader, getOnboardingScript, generateMainContent, generateQuickStart (+2) |
| `src/webview/onboarding/OnboardingWebview.ts` | close, constructor, handlePanelDispose, dispose |
| `src/webview/onboarding/OnboardingMessageHandler.ts` | OnboardingMessageHandler, handleMessage |
| `src/services/telemetry/telemetryService.ts` | trackDailyActiveUser |
| `src/webview/settings/styles/statusBanner.css.ts` | getStatusBannerStyles |
| `src/webview/settings/components/ProviderIcon.ts` | getIconStyles |
| `src/webview/onboarding/styles/onboarding.css.ts` | getOnboardingStyles |

## Entry Points

Start here when exploring this area:

- **`getStatusBannerStyles`** (Function) — `src/webview/settings/styles/statusBanner.css.ts:3`
- **`getOnboardingStyles`** (Function) — `src/webview/onboarding/styles/onboarding.css.ts:1`
- **`OnboardingMessageHandler`** (Class) — `src/webview/onboarding/OnboardingMessageHandler.ts:5`
- **`close`** (Method) — `src/webview/onboarding/OnboardingWebview.ts:15`
- **`constructor`** (Method) — `src/webview/onboarding/OnboardingWebview.ts:62`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `OnboardingMessageHandler` | Class | `src/webview/onboarding/OnboardingMessageHandler.ts` | 5 |
| `getStatusBannerStyles` | Function | `src/webview/settings/styles/statusBanner.css.ts` | 3 |
| `getOnboardingStyles` | Function | `src/webview/onboarding/styles/onboarding.css.ts` | 1 |
| `close` | Method | `src/webview/onboarding/OnboardingWebview.ts` | 15 |
| `constructor` | Method | `src/webview/onboarding/OnboardingWebview.ts` | 62 |
| `handlePanelDispose` | Method | `src/webview/onboarding/OnboardingWebview.ts` | 94 |
| `dispose` | Method | `src/webview/onboarding/OnboardingWebview.ts` | 127 |
| `handleMessage` | Method | `src/webview/onboarding/OnboardingMessageHandler.ts` | 12 |
| `generateHtml` | Method | `src/webview/onboarding/OnboardingTemplateGenerator.ts` | 14 |
| `generateHeader` | Method | `src/webview/onboarding/OnboardingTemplateGenerator.ts` | 44 |
| `getOnboardingScript` | Method | `src/webview/onboarding/OnboardingTemplateGenerator.ts` | 228 |
| `getIconStyles` | Method | `src/webview/settings/components/ProviderIcon.ts` | 52 |
| `generateMainContent` | Method | `src/webview/onboarding/OnboardingTemplateGenerator.ts` | 53 |
| `generateQuickStart` | Method | `src/webview/onboarding/OnboardingTemplateGenerator.ts` | 74 |
| `generateFeatures` | Method | `src/webview/onboarding/OnboardingTemplateGenerator.ts` | 178 |
| `generateActions` | Method | `src/webview/onboarding/OnboardingTemplateGenerator.ts` | 202 |
| `trackDailyActiveUser` | Method | `src/services/telemetry/telemetryService.ts` | 207 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → RenderIcon` | cross_community | 6 |
| `Constructor → GenerateQuickStart` | cross_community | 5 |
| `Constructor → GenerateFeatures` | cross_community | 5 |
| `Constructor → GenerateActions` | cross_community | 5 |
| `GenerateCommitMessage → GetConfiguration` | cross_community | 4 |
| `GenerateWithRawPrompt → GetConfiguration` | cross_community | 4 |
| `GenerateCommitHistoryAnalysis → GetConfiguration` | cross_community | 4 |
| `Constructor → GetConfiguration` | cross_community | 4 |
| `Constructor → GetOnboardingStyles` | cross_community | 4 |
| `Constructor → GetIconStyles` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Diagnostics | 1 calls |
| Components | 1 calls |
| Telemetry | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getStatusBannerStyles"})` — see callers and callees
2. `gitnexus_query({query: "onboarding"})` — find related execution flows
3. Read key files listed above for implementation details
