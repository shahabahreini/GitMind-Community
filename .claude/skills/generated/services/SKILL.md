---
name: services
description: "Skill for the Services area of GitMind-Pro. 19 symbols across 3 files."
---

# Services

19 symbols | 3 files | Cohesion: 88%

## When to Use

- Working with code in `src/`
- Understanding how pushCurrent, CommitStyleManager, getInstance work
- Modifying services-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/services/commitStyleManager.ts` | CommitStyleManager, getInstance, getStyle, isStyleAvailable, getCurrentStyle (+6) |
| `src/services/diffProcessor.ts` | splitDiffIntoChunks, splitByDiffHeaders, getHeaderEndIndex, buildMinimalHeader, splitIntoHunkSegments (+2) |
| `src/commands/index.ts` | handleChangeCommitStyle |

## Entry Points

Start here when exploring this area:

- **`pushCurrent`** (Function) — `src/services/diffProcessor.ts:178`
- **`CommitStyleManager`** (Class) — `src/services/commitStyleManager.ts:14`
- **`getInstance`** (Method) — `src/services/commitStyleManager.ts:22`
- **`getStyle`** (Method) — `src/services/commitStyleManager.ts:217`
- **`isStyleAvailable`** (Method) — `src/services/commitStyleManager.ts:224`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `CommitStyleManager` | Class | `src/services/commitStyleManager.ts` | 14 |
| `pushCurrent` | Function | `src/services/diffProcessor.ts` | 178 |
| `getInstance` | Method | `src/services/commitStyleManager.ts` | 22 |
| `getStyle` | Method | `src/services/commitStyleManager.ts` | 217 |
| `isStyleAvailable` | Method | `src/services/commitStyleManager.ts` | 224 |
| `getCurrentStyle` | Method | `src/services/commitStyleManager.ts` | 264 |
| `setCommitStyle` | Method | `src/services/commitStyleManager.ts` | 272 |
| `validateAndResetStyleIfNeeded` | Method | `src/services/commitStyleManager.ts` | 303 |
| `getStyleExamples` | Method | `src/services/commitStyleManager.ts` | 324 |
| `getStyleDescription` | Method | `src/services/commitStyleManager.ts` | 332 |
| `splitDiffIntoChunks` | Method | `src/services/diffProcessor.ts` | 36 |
| `splitByDiffHeaders` | Method | `src/services/diffProcessor.ts` | 73 |
| `getHeaderEndIndex` | Method | `src/services/diffProcessor.ts` | 94 |
| `buildMinimalHeader` | Method | `src/services/diffProcessor.ts` | 130 |
| `splitIntoHunkSegments` | Method | `src/services/diffProcessor.ts` | 139 |
| `packSegmentsIntoChunks` | Method | `src/services/diffProcessor.ts` | 171 |
| `constructor` | Method | `src/services/commitStyleManager.ts` | 18 |
| `initializeStyles` | Method | `src/services/commitStyleManager.ts` | 29 |
| `handleChangeCommitStyle` | Function | `src/commands/index.ts` | 699 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Encryption | 2 calls |

## How to Explore

1. `gitnexus_context({name: "pushCurrent"})` — see callers and callees
2. `gitnexus_query({query: "services"})` — find related execution flows
3. Read key files listed above for implementation details
