---
name: subscription
description: "Skill for the Subscription area of GitMind-Pro. 71 symbols across 9 files."
---

# Subscription

71 symbols | 9 files | Cohesion: 67%

## When to Use

- Working with code in `src/`
- Understanding how activate, getInstanceId, getLastValidation work
- Modifying subscription-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/services/subscription/LemonSqueezyService.ts` | validateLicenseKey, deactivateLicenseKey, getLicenseInstances, findValidDeactivationInstance, getRecentLicenseInstance (+20) |
| `src/services/subscription/SubscriptionManager.ts` | isProUser, getUserEmail, promptForEmail, startSubscription, showProductSelection (+9) |
| `src/services/subscription/ProActivationService.ts` | ProActivationService, getInstance, activateWithLicenseKey, activateLicenseWithAPI, validateExistingLicense (+7) |
| `src/utils/proHelpers.ts` | getInstanceId, getLastValidation, needsLicenseValidation, updateProConfig, updateSubscriptionConfig (+2) |
| `src/utils/encryptionHelper.ts` | handleEncryptionToggle, migrateKeysToSecureStorage, storeLicenseKey, getLicenseKey |
| `src/services/subscription/ProNotificationService.ts` | ProNotificationService, getInstance, initialize, checkAndShowNotification |
| `src/webview/onboarding/OnboardingWebview.ts` | OnboardingWebview, createOrShow |
| `src/services/migration/SettingsMigrationService.ts` | SettingsMigrationService, getInstance |
| `src/extension.ts` | activate |

## Entry Points

Start here when exploring this area:

- **`activate`** (Function) — `src/extension.ts:54`
- **`getInstanceId`** (Function) — `src/utils/proHelpers.ts:51`
- **`getLastValidation`** (Function) — `src/utils/proHelpers.ts:61`
- **`needsLicenseValidation`** (Function) — `src/utils/proHelpers.ts:67`
- **`updateProConfig`** (Function) — `src/utils/proHelpers.ts:82`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `OnboardingWebview` | Class | `src/webview/onboarding/OnboardingWebview.ts` | 7 |
| `ProNotificationService` | Class | `src/services/subscription/ProNotificationService.ts` | 4 |
| `ProActivationService` | Class | `src/services/subscription/ProActivationService.ts` | 77 |
| `SettingsMigrationService` | Class | `src/services/migration/SettingsMigrationService.ts` | 6 |
| `LemonSqueezyService` | Class | `src/services/subscription/LemonSqueezyService.ts` | 69 |
| `activate` | Function | `src/extension.ts` | 54 |
| `getInstanceId` | Function | `src/utils/proHelpers.ts` | 51 |
| `getLastValidation` | Function | `src/utils/proHelpers.ts` | 61 |
| `needsLicenseValidation` | Function | `src/utils/proHelpers.ts` | 67 |
| `updateProConfig` | Function | `src/utils/proHelpers.ts` | 82 |
| `updateSubscriptionConfig` | Function | `src/utils/proHelpers.ts` | 96 |
| `getLicenseKey` | Function | `src/utils/proHelpers.ts` | 16 |
| `getSecureLicenseKey` | Function | `src/utils/proHelpers.ts` | 35 |
| `handleEncryptionToggle` | Method | `src/utils/encryptionHelper.ts` | 81 |
| `migrateKeysToSecureStorage` | Method | `src/utils/encryptionHelper.ts` | 107 |
| `createOrShow` | Method | `src/webview/onboarding/OnboardingWebview.ts` | 29 |
| `getInstance` | Method | `src/services/subscription/ProNotificationService.ts` | 24 |
| `getInstance` | Method | `src/services/subscription/ProActivationService.ts` | 86 |
| `getInstance` | Method | `src/services/migration/SettingsMigrationService.ts` | 9 |
| `activateWithLicenseKey` | Method | `src/services/subscription/ProActivationService.ts` | 96 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Activate → GetConfigForTarget` | cross_community | 4 |
| `Deactivate → StoreLicenseKey` | intra_community | 4 |
| `RegisterCommands → SettingsMigrationService` | cross_community | 3 |
| `Activate → SettingsMigrationService` | intra_community | 3 |
| `Activate → GetConfiguration` | cross_community | 3 |
| `Activate → CreateMigrationMapping` | cross_community | 3 |
| `Activate → PerformMigration` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Encryption | 11 calls |
| Api | 3 calls |
| Migration | 1 calls |
| Onboarding | 1 calls |
| Commands | 1 calls |
| Cluster_14 | 1 calls |
| Changelog | 1 calls |
| Settings | 1 calls |

## How to Explore

1. `gitnexus_context({name: "activate"})` — see callers and callees
2. `gitnexus_query({query: "subscription"})` — find related execution flows
3. Read key files listed above for implementation details
