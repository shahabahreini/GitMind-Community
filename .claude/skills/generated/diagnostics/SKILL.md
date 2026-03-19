---
name: diagnostics
description: "Skill for the Diagnostics area of GitMind-Pro. 11 symbols across 4 files."
---

# Diagnostics

11 symbols | 4 files | Cohesion: 87%

## When to Use

- Working with code in `src/`
- Understanding how getNonce, OnboardingTemplateGenerator, DiagnosticsWebview work
- Modifying diagnostics-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/webview/diagnostics/DiagnosticsWebview.ts` | constructor, _setupEventHandlers, _getHtmlForWebview, _getStyles, _renderInfoItem (+3) |
| `src/utils/getNonce.ts` | getNonce |
| `src/webview/onboarding/OnboardingWebview.ts` | _update |
| `src/webview/onboarding/OnboardingTemplateGenerator.ts` | OnboardingTemplateGenerator |

## Entry Points

Start here when exploring this area:

- **`getNonce`** (Function) — `src/utils/getNonce.ts:0`
- **`OnboardingTemplateGenerator`** (Class) — `src/webview/onboarding/OnboardingTemplateGenerator.ts:5`
- **`DiagnosticsWebview`** (Class) — `src/webview/diagnostics/DiagnosticsWebview.ts:8`
- **`_update`** (Method) — `src/webview/onboarding/OnboardingWebview.ts:116`
- **`constructor`** (Method) — `src/webview/diagnostics/DiagnosticsWebview.ts:30`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `OnboardingTemplateGenerator` | Class | `src/webview/onboarding/OnboardingTemplateGenerator.ts` | 5 |
| `DiagnosticsWebview` | Class | `src/webview/diagnostics/DiagnosticsWebview.ts` | 8 |
| `getNonce` | Function | `src/utils/getNonce.ts` | 0 |
| `_update` | Method | `src/webview/onboarding/OnboardingWebview.ts` | 116 |
| `constructor` | Method | `src/webview/diagnostics/DiagnosticsWebview.ts` | 30 |
| `_setupEventHandlers` | Method | `src/webview/diagnostics/DiagnosticsWebview.ts` | 40 |
| `_getHtmlForWebview` | Method | `src/webview/diagnostics/DiagnosticsWebview.ts` | 58 |
| `_getStyles` | Method | `src/webview/diagnostics/DiagnosticsWebview.ts` | 93 |
| `_renderInfoItem` | Method | `src/webview/diagnostics/DiagnosticsWebview.ts` | 143 |
| `dispose` | Method | `src/webview/diagnostics/DiagnosticsWebview.ts` | 152 |
| `show` | Method | `src/webview/diagnostics/DiagnosticsWebview.ts` | 13 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Constructor → RenderIcon` | cross_community | 6 |
| `Constructor → GenerateQuickStart` | cross_community | 5 |
| `Constructor → GenerateFeatures` | cross_community | 5 |
| `Constructor → GenerateActions` | cross_community | 5 |
| `Constructor → GetOnboardingStyles` | cross_community | 4 |
| `Constructor → GetIconStyles` | cross_community | 4 |
| `Constructor → GenerateHeader` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Onboarding | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getNonce"})` — see callers and callees
2. `gitnexus_query({query: "diagnostics"})` — find related execution flows
3. Read key files listed above for implementation details
