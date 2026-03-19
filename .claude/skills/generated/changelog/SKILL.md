---
name: changelog
description: "Skill for the Changelog area of GitMind-Pro. 34 symbols across 4 files."
---

# Changelog

34 symbols | 4 files | Cohesion: 77%

## When to Use

- Working with code in `src/`
- Understanding how isProUser, hasValidLicense, isEncryptionAvailable work
- Modifying changelog-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/services/changelog/ChangelogService.ts` | ChangelogService, getInstance, isFeatureAvailable, extractLatestVersionFromChangelog, analyzeChangelogStructure (+21) |
| `src/utils/proHelpers.ts` | isProUser, hasValidLicense, isEncryptionAvailable, isEncryptionEnabled |
| `src/services/changelog/generateChangelog.ts` | generateChangelog, safeSendResult, updateChangelog |
| `src/commands/index.ts` | withProgress |

## Entry Points

Start here when exploring this area:

- **`isProUser`** (Function) — `src/utils/proHelpers.ts:6`
- **`hasValidLicense`** (Function) — `src/utils/proHelpers.ts:12`
- **`isEncryptionAvailable`** (Function) — `src/utils/proHelpers.ts:109`
- **`isEncryptionEnabled`** (Function) — `src/utils/proHelpers.ts:117`
- **`generateChangelog`** (Function) — `src/services/changelog/generateChangelog.ts:24`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ChangelogService` | Class | `src/services/changelog/ChangelogService.ts` | 70 |
| `isProUser` | Function | `src/utils/proHelpers.ts` | 6 |
| `hasValidLicense` | Function | `src/utils/proHelpers.ts` | 12 |
| `isEncryptionAvailable` | Function | `src/utils/proHelpers.ts` | 109 |
| `isEncryptionEnabled` | Function | `src/utils/proHelpers.ts` | 117 |
| `generateChangelog` | Function | `src/services/changelog/generateChangelog.ts` | 24 |
| `safeSendResult` | Function | `src/services/changelog/generateChangelog.ts` | 26 |
| `updateChangelog` | Function | `src/services/changelog/generateChangelog.ts` | 263 |
| `getInstance` | Method | `src/services/changelog/ChangelogService.ts` | 78 |
| `isFeatureAvailable` | Method | `src/services/changelog/ChangelogService.ts` | 88 |
| `extractLatestVersionFromChangelog` | Method | `src/services/changelog/ChangelogService.ts` | 532 |
| `analyzeChangelogStructure` | Method | `src/services/changelog/ChangelogService.ts` | 647 |
| `buildPolicyInstructions` | Method | `src/services/changelog/ChangelogService.ts` | 725 |
| `estimateChangelogTokens` | Method | `src/services/changelog/ChangelogService.ts` | 747 |
| `validateTokenLimits` | Method | `src/services/changelog/ChangelogService.ts` | 800 |
| `generateChangelog` | Method | `src/services/changelog/ChangelogService.ts` | 855 |
| `prepareCommitSummary` | Method | `src/services/changelog/ChangelogService.ts` | 979 |
| `buildChangelogPrompt` | Method | `src/services/changelog/ChangelogService.ts` | 1013 |
| `formatChangelog` | Method | `src/services/changelog/ChangelogService.ts` | 1149 |
| `getGitLog` | Method | `src/services/changelog/ChangelogService.ts` | 96 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `GenerateChangelog → ParseGitLog` | cross_community | 4 |
| `GenerateChangelog → IsWebviewOpen` | cross_community | 4 |
| `GenerateChangelog → PostMessageToWebview` | cross_community | 4 |
| `UpdateChangelog → IsWebviewOpen` | cross_community | 4 |
| `UpdateChangelog → PostMessageToWebview` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Api | 4 calls |

## How to Explore

1. `gitnexus_context({name: "isProUser"})` — see callers and callees
2. `gitnexus_query({query: "changelog"})` — find related execution flows
3. Read key files listed above for implementation details
