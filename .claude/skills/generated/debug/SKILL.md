---
name: debug
description: "Skill for the Debug area of GitMind-Pro. 12 symbols across 2 files."
---

# Debug

12 symbols | 2 files | Cohesion: 91%

## When to Use

- Working with code in `src/`
- Understanding how setCommitMessage, initializeLogger work
- Modifying debug-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/services/debug/logger.ts` | log, isDebugEnabled, logInternal, formatEntry, safeStringify (+6) |
| `src/utils/gitCommands.ts` | setCommitMessage |

## Entry Points

Start here when exploring this area:

- **`setCommitMessage`** (Function) — `src/utils/gitCommands.ts:97`
- **`initializeLogger`** (Function) — `src/services/debug/logger.ts:226`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `setCommitMessage` | Function | `src/utils/gitCommands.ts` | 97 |
| `initializeLogger` | Function | `src/services/debug/logger.ts` | 226 |
| `Logger` | Class | `src/services/debug/logger.ts` | 15 |
| `sanitize` | Function | `src/services/debug/logger.ts` | 136 |
| `log` | Method | `src/services/debug/logger.ts` | 56 |
| `isDebugEnabled` | Method | `src/services/debug/logger.ts` | 71 |
| `logInternal` | Method | `src/services/debug/logger.ts` | 76 |
| `formatEntry` | Method | `src/services/debug/logger.ts` | 109 |
| `safeStringify` | Method | `src/services/debug/logger.ts` | 114 |
| `initialize` | Method | `src/services/debug/logger.ts` | 30 |
| `dispose` | Method | `src/services/debug/logger.ts` | 60 |
| `getInstance` | Method | `src/services/debug/logger.ts` | 23 |

## How to Explore

1. `gitnexus_context({name: "setCommitMessage"})` — see callers and callees
2. `gitnexus_query({query: "debug"})` — find related execution flows
3. Read key files listed above for implementation details
