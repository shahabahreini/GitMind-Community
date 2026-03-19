---
name: migration
description: "Skill for the Migration area of GitMind-Pro. 15 symbols across 2 files."
---

# Migration

15 symbols | 2 files | Cohesion: 70%

## When to Use

- Working with code in `src/`
- Understanding how getConfiguration, getApiConfigSync, checkForLegacySettings work
- Modifying migration-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/services/migration/SettingsMigrationService.ts` | checkForLegacySettings, cleanupLegacySettings, performAggressiveCleanup, removeEntireWorkspaceConfiguration, performCompleteCleanup (+7) |
| `src/config/settings.ts` | getConfiguration, getApiConfigSync, getEffectiveModel |

## Entry Points

Start here when exploring this area:

- **`getConfiguration`** (Function) — `src/config/settings.ts:89`
- **`getApiConfigSync`** (Function) — `src/config/settings.ts:218`
- **`checkForLegacySettings`** (Method) — `src/services/migration/SettingsMigrationService.ts:74`
- **`cleanupLegacySettings`** (Method) — `src/services/migration/SettingsMigrationService.ts:297`
- **`performAggressiveCleanup`** (Method) — `src/services/migration/SettingsMigrationService.ts:387`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getConfiguration` | Function | `src/config/settings.ts` | 89 |
| `getApiConfigSync` | Function | `src/config/settings.ts` | 218 |
| `checkForLegacySettings` | Method | `src/services/migration/SettingsMigrationService.ts` | 74 |
| `cleanupLegacySettings` | Method | `src/services/migration/SettingsMigrationService.ts` | 297 |
| `performAggressiveCleanup` | Method | `src/services/migration/SettingsMigrationService.ts` | 387 |
| `removeEntireWorkspaceConfiguration` | Method | `src/services/migration/SettingsMigrationService.ts` | 440 |
| `performCompleteCleanup` | Method | `src/services/migration/SettingsMigrationService.ts` | 540 |
| `getConfigForTarget` | Method | `src/services/migration/SettingsMigrationService.ts` | 606 |
| `forceCleanupLegacySettings` | Method | `src/services/migration/SettingsMigrationService.ts` | 641 |
| `verifyMigrationSuccess` | Method | `src/services/migration/SettingsMigrationService.ts` | 686 |
| `migrateAndCleanupSettings` | Method | `src/services/migration/SettingsMigrationService.ts` | 20 |
| `createMigrationMapping` | Method | `src/services/migration/SettingsMigrationService.ts` | 142 |
| `performMigration` | Method | `src/services/migration/SettingsMigrationService.ts` | 275 |
| `showMigrationNotification` | Method | `src/services/migration/SettingsMigrationService.ts` | 625 |
| `getEffectiveModel` | Function | `src/config/settings.ts` | 254 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `RegisterCommands → GetConfigForTarget` | cross_community | 5 |
| `RegisterCommands → GetConfiguration` | cross_community | 5 |
| `HandleGenerateCommit → GetConfiguration` | cross_community | 5 |
| `Activate → GetConfigForTarget` | cross_community | 4 |
| `GenerateCommitMessage → GetConfiguration` | cross_community | 4 |
| `GenerateCommitMessage → GetEffectiveModel` | cross_community | 4 |
| `GenerateWithRawPrompt → GetConfiguration` | cross_community | 4 |
| `GenerateWithRawPrompt → GetEffectiveModel` | cross_community | 4 |
| `GenerateCommitHistoryAnalysis → GetConfiguration` | cross_community | 4 |
| `GenerateCommitHistoryAnalysis → GetEffectiveModel` | cross_community | 4 |

## How to Explore

1. `gitnexus_context({name: "getConfiguration"})` — see callers and callees
2. `gitnexus_query({query: "migration"})` — find related execution flows
3. Read key files listed above for implementation details
