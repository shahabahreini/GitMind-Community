---
name: ai
description: "Skill for the Ai area of GitMind-Pro. 7 symbols across 2 files."
---

# Ai

7 symbols | 2 files | Cohesion: 73%

## When to Use

- Working with code in `src/`
- Understanding how learnFromCommitHistory, CommitHistoryLearningService, getInstance work
- Modifying ai-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/services/ai/CommitHistoryLearningService.ts` | CommitHistoryLearningService, getInstance, isFeatureAvailable, getCommitMessages, getMaxCommitsLimit (+1) |
| `src/services/ai/learnFromCommitHistory.ts` | learnFromCommitHistory |

## Entry Points

Start here when exploring this area:

- **`learnFromCommitHistory`** (Function) — `src/services/ai/learnFromCommitHistory.ts:9`
- **`CommitHistoryLearningService`** (Class) — `src/services/ai/CommitHistoryLearningService.ts:19`
- **`getInstance`** (Method) — `src/services/ai/CommitHistoryLearningService.ts:24`
- **`isFeatureAvailable`** (Method) — `src/services/ai/CommitHistoryLearningService.ts:34`
- **`getCommitMessages`** (Method) — `src/services/ai/CommitHistoryLearningService.ts:48`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `CommitHistoryLearningService` | Class | `src/services/ai/CommitHistoryLearningService.ts` | 19 |
| `learnFromCommitHistory` | Function | `src/services/ai/learnFromCommitHistory.ts` | 9 |
| `getInstance` | Method | `src/services/ai/CommitHistoryLearningService.ts` | 24 |
| `isFeatureAvailable` | Method | `src/services/ai/CommitHistoryLearningService.ts` | 34 |
| `getCommitMessages` | Method | `src/services/ai/CommitHistoryLearningService.ts` | 48 |
| `getMaxCommitsLimit` | Method | `src/services/ai/CommitHistoryLearningService.ts` | 138 |
| `analyzeCommitMessages` | Method | `src/services/ai/CommitHistoryLearningService.ts` | 171 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Changelog | 3 calls |
| Api | 3 calls |

## How to Explore

1. `gitnexus_context({name: "learnFromCommitHistory"})` — see callers and callees
2. `gitnexus_query({query: "ai"})` — find related execution flows
3. Read key files listed above for implementation details
