---
name: telemetry
description: "Skill for the Telemetry area of GitMind-Pro. 40 symbols across 11 files."
---

# Telemetry

40 symbols | 11 files | Cohesion: 75%

## When to Use

- Working with code in `src/`
- Understanding how validateGitRepository, getDiff, generateCommitMessage work
- Modifying telemetry-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/services/telemetry/telemetryService.ts` | trackMessageGenerationFailure, trackCommitGeneration, trackExtensionError, trackException, extractProviderFromContext (+8) |
| `src/services/telemetry/lightweightTelemetryService.ts` | initialize, sendTelemetryEvent, trackExtensionActivation, isTelemetryCurrentlyEnabled, trackDailyActiveUser (+8) |
| `src/commands/index.ts` | handleError, handleGenerateCommit, clampCommitBodyDescription |
| `src/services/promptManager.ts` | getCustomContext, saveLastPrompt |
| `src/services/gitmoji/GitmojiService.ts` | GitmojiService, getInstance |
| `src/services/git/repository.ts` | validateGitRepository, getDiff |
| `src/services/diffProcessor.ts` | isLargeDiff |
| `src/services/api/index.ts` | generateCommitMessage |
| `src/webview/settings/components/GitmojiCustomDialog.ts` | constructor |
| `esbuild.js` | setup |

## Entry Points

Start here when exploring this area:

- **`validateGitRepository`** (Function) — `src/services/git/repository.ts:142`
- **`getDiff`** (Function) — `src/services/git/repository.ts:174`
- **`generateCommitMessage`** (Function) — `src/services/api/index.ts:432`
- **`deactivate`** (Function) — `src/extension.ts:206`
- **`GitmojiService`** (Class) — `src/services/gitmoji/GitmojiService.ts:7`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `GitmojiService` | Class | `src/services/gitmoji/GitmojiService.ts` | 7 |
| `validateGitRepository` | Function | `src/services/git/repository.ts` | 142 |
| `getDiff` | Function | `src/services/git/repository.ts` | 174 |
| `generateCommitMessage` | Function | `src/services/api/index.ts` | 432 |
| `deactivate` | Function | `src/extension.ts` | 206 |
| `getCustomContext` | Method | `src/services/promptManager.ts` | 7 |
| `saveLastPrompt` | Method | `src/services/promptManager.ts` | 65 |
| `isLargeDiff` | Method | `src/services/diffProcessor.ts` | 25 |
| `getInstance` | Method | `src/services/gitmoji/GitmojiService.ts` | 70 |
| `constructor` | Method | `src/webview/settings/components/GitmojiCustomDialog.ts` | 8 |
| `handleError` | Function | `src/commands/index.ts` | 66 |
| `handleGenerateCommit` | Function | `src/commands/index.ts` | 165 |
| `clampCommitBodyDescription` | Function | `src/commands/index.ts` | 392 |
| `loadAppInsights` | Function | `src/services/telemetry/telemetryService.ts` | 5 |
| `trackMessageGenerationFailure` | Method | `src/services/telemetry/telemetryService.ts` | 250 |
| `trackCommitGeneration` | Method | `src/services/telemetry/telemetryService.ts` | 300 |
| `trackExtensionError` | Method | `src/services/telemetry/telemetryService.ts` | 307 |
| `trackException` | Method | `src/services/telemetry/telemetryService.ts` | 317 |
| `extractProviderFromContext` | Method | `src/services/telemetry/telemetryService.ts` | 326 |
| `setup` | Method | `esbuild.js` | 11 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `GenerateCommitMessage → GetPlainTextApiKey` | cross_community | 10 |
| `GenerateCommitMessage → ClearApiKeyCache` | cross_community | 10 |
| `HandleGenerateCommit → GetPlainTextApiKey` | cross_community | 9 |
| `HandleGenerateCommit → ClearApiKeyCache` | cross_community | 9 |
| `GenerateCommitMessage → CheckIfWasPreviouslyPro` | cross_community | 7 |
| `HandleGenerateCommit → CheckIfWasPreviouslyPro` | cross_community | 6 |
| `GenerateCommitMessage → SecureKeyManager` | cross_community | 5 |
| `GenerateCommitMessage → EvictExpiredCacheEntries` | cross_community | 5 |
| `GenerateCommitMessage → IsSecretStorageAvailable` | cross_community | 5 |
| `HandleGenerateCommit → GetConfiguration` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Api | 12 calls |
| Migration | 4 calls |
| Onboarding | 2 calls |
| Git | 2 calls |
| Commands | 1 calls |
| Gitmoji | 1 calls |
| Encryption | 1 calls |

## How to Explore

1. `gitnexus_context({name: "validateGitRepository"})` — see callers and callees
2. `gitnexus_query({query: "telemetry"})` — find related execution flows
3. Read key files listed above for implementation details
