---
name: encryption
description: "Skill for the Encryption area of GitMind-Pro. 45 symbols across 7 files."
---

# Encryption

45 symbols | 7 files | Cohesion: 78%

## When to Use

- Working with code in `src/`
- Understanding how buildTestBody, detectStructure, truncate work
- Modifying encryption-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/services/encryption/SecureKeyManager.ts` | SecureKeyManager, evictExpiredCacheEntries, getInstance, isEncryptionAvailable, isProUser (+27) |
| `src/webview/settings/MessageHandler.ts` | handleMessage, buildTestBody, detectStructure, truncate, dfs |
| `src/utils/encryptionHelper.ts` | migrateKeysToPlainText, getSecureKeyManager |
| `src/services/commitStyleManager.ts` | getAllStyles, getAvailableStyles |
| `src/services/subscription/SubscriptionManager.ts` | SubscriptionManager, getInstance |
| `src/commands/index.ts` | handleLoadModels |
| `src/webview/settings/SettingsManager.ts` | handleApiKeyStorage |

## Entry Points

Start here when exploring this area:

- **`buildTestBody`** (Function) — `src/webview/settings/MessageHandler.ts:587`
- **`detectStructure`** (Function) — `src/webview/settings/MessageHandler.ts:679`
- **`truncate`** (Function) — `src/webview/settings/MessageHandler.ts:680`
- **`dfs`** (Function) — `src/webview/settings/MessageHandler.ts:700`
- **`SecureKeyManager`** (Class) — `src/services/encryption/SecureKeyManager.ts:12`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SecureKeyManager` | Class | `src/services/encryption/SecureKeyManager.ts` | 12 |
| `SubscriptionManager` | Class | `src/services/subscription/SubscriptionManager.ts` | 17 |
| `buildTestBody` | Function | `src/webview/settings/MessageHandler.ts` | 587 |
| `detectStructure` | Function | `src/webview/settings/MessageHandler.ts` | 679 |
| `truncate` | Function | `src/webview/settings/MessageHandler.ts` | 680 |
| `dfs` | Function | `src/webview/settings/MessageHandler.ts` | 700 |
| `migrateKeysToPlainText` | Method | `src/utils/encryptionHelper.ts` | 155 |
| `getSecureKeyManager` | Method | `src/utils/encryptionHelper.ts` | 235 |
| `handleApiKeyStorage` | Method | `src/webview/settings/SettingsManager.ts` | 283 |
| `handleMessage` | Method | `src/webview/settings/MessageHandler.ts` | 18 |
| `evictExpiredCacheEntries` | Method | `src/services/encryption/SecureKeyManager.ts` | 30 |
| `getInstance` | Method | `src/services/encryption/SecureKeyManager.ts` | 42 |
| `isEncryptionAvailable` | Method | `src/services/encryption/SecureKeyManager.ts` | 62 |
| `isProUser` | Method | `src/services/encryption/SecureKeyManager.ts` | 98 |
| `performProUserCheck` | Method | `src/services/encryption/SecureKeyManager.ts` | 118 |
| `refreshProUserCache` | Method | `src/services/encryption/SecureKeyManager.ts` | 151 |
| `clearApiKeyCache` | Method | `src/services/encryption/SecureKeyManager.ts` | 160 |
| `isSecretStorageAvailable` | Method | `src/services/encryption/SecureKeyManager.ts` | 249 |
| `storeApiKey` | Method | `src/services/encryption/SecureKeyManager.ts` | 261 |
| `getApiKey` | Method | `src/services/encryption/SecureKeyManager.ts` | 309 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `GenerateCommitMessage → GetPlainTextApiKey` | cross_community | 10 |
| `GenerateCommitMessage → ClearApiKeyCache` | cross_community | 10 |
| `GenerateWithRawPrompt → GetPlainTextApiKey` | cross_community | 10 |
| `GenerateCommitHistoryAnalysis → GetPlainTextApiKey` | cross_community | 10 |
| `HandleGenerateCommit → GetPlainTextApiKey` | cross_community | 9 |
| `HandleGenerateCommit → ClearApiKeyCache` | cross_community | 9 |
| `HandleApiKeyStorage → GetPlainTextApiKey` | intra_community | 8 |
| `GenerateCommitMessage → CheckIfWasPreviouslyPro` | cross_community | 7 |
| `GenerateWithRawPrompt → CheckIfWasPreviouslyPro` | cross_community | 7 |
| `GenerateCommitHistoryAnalysis → CheckIfWasPreviouslyPro` | cross_community | 7 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Api | 4 calls |
| Subscription | 4 calls |
| Settings | 2 calls |
| Changelog | 1 calls |
| Git | 1 calls |
| Components | 1 calls |

## How to Explore

1. `gitnexus_context({name: "buildTestBody"})` — see callers and callees
2. `gitnexus_query({query: "encryption"})` — find related execution flows
3. Read key files listed above for implementation details
