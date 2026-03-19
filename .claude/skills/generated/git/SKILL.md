---
name: git
description: "Skill for the Git area of GitMind-Pro. 14 symbols across 3 files."
---

# Git

14 symbols | 3 files | Cohesion: 91%

## When to Use

- Working with code in `src/`
- Understanding how executeGitCommand, getRepositoryRoot, isRepositoryRoot work
- Modifying git-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/services/git/GitHistoryAnalyzer.ts` | analyzeHistory, getDetailedCommits, parseCommitData, calculateStats, checkForVersionTags (+1) |
| `src/utils/gitCommands.ts` | executeGitCommand, getWorkspacePath, getRepositoryRoot, isRepositoryRoot |
| `src/services/git/repository.ts` | findGitRepository, setCommitMessage, findGitRepositoriesInSubdirectories, searchRecursive |

## Entry Points

Start here when exploring this area:

- **`executeGitCommand`** (Function) — `src/utils/gitCommands.ts:23`
- **`getRepositoryRoot`** (Function) — `src/utils/gitCommands.ts:138`
- **`isRepositoryRoot`** (Function) — `src/utils/gitCommands.ts:196`
- **`findGitRepository`** (Function) — `src/services/git/repository.ts:80`
- **`setCommitMessage`** (Function) — `src/services/git/repository.ts:274`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `executeGitCommand` | Function | `src/utils/gitCommands.ts` | 23 |
| `getRepositoryRoot` | Function | `src/utils/gitCommands.ts` | 138 |
| `isRepositoryRoot` | Function | `src/utils/gitCommands.ts` | 196 |
| `findGitRepository` | Function | `src/services/git/repository.ts` | 80 |
| `setCommitMessage` | Function | `src/services/git/repository.ts` | 274 |
| `analyzeHistory` | Method | `src/services/git/GitHistoryAnalyzer.ts` | 47 |
| `getDetailedCommits` | Method | `src/services/git/GitHistoryAnalyzer.ts` | 75 |
| `parseCommitData` | Method | `src/services/git/GitHistoryAnalyzer.ts` | 93 |
| `calculateStats` | Method | `src/services/git/GitHistoryAnalyzer.ts` | 159 |
| `checkForVersionTags` | Method | `src/services/git/GitHistoryAnalyzer.ts` | 307 |
| `getVersionTagCount` | Method | `src/services/git/GitHistoryAnalyzer.ts` | 319 |
| `getWorkspacePath` | Function | `src/utils/gitCommands.ts` | 43 |
| `findGitRepositoriesInSubdirectories` | Function | `src/services/git/repository.ts` | 18 |
| `searchRecursive` | Function | `src/services/git/repository.ts` | 22 |

## How to Explore

1. `gitnexus_context({name: "executeGitCommand"})` — see callers and callees
2. `gitnexus_query({query: "git"})` — find related execution flows
3. Read key files listed above for implementation details
