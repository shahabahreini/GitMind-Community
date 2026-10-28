# Execution ledger: Toolchain fixes after the oxlint migration

Plan: `plans/oxlint-toolchain-fixes.md` (Reviewed and ready to execute; user instructed execution 2026-10-27)
Mode: lean · Delegation: approved, but no task is delegated (each is a one- or two-line edit, so a subagent's startup cost exceeds the work) · Token efficiency: approved

## 1. Coverage ledger
| ID | Task | Priority | Acceptance check | Status | Evidence |
|---|---|---|---|---|---|
| 1.1 | Commit oxlint migration | must | lint 0 findings; tsc ok; commit lists 7 paths | done (verified) | b98b5c8; lint exit 0, 0 findings; tsc ok; 7 paths |
| 2.1 | Drop duplicate CI build | must | no `run package$`/Build extension; YAML valid; local pipeline passes | done (verified) | fada8a9; grep empty; YAML valid; local vsce+audit+listing pass, 1 prepublish |
| 3.1 | Dedupe pretest | could | pretest passes; injected type error fails; injection reverted | done (verified) | 1655c9a; clean run: 1 tsc, 1 oxlint, dist built; injected TS2322 failed at compile-tests; injection reverted |
| 4.1 | Pin oxlint ^1.89.0, drop exclusions | must | spec ^1.89.0; lock only 1.89.0; no oxlint in workspace; frozen install; lint 0; diff oxlint-only; 1.90.0 refused | done (verified) | 5af61c0; spec ^1.89.0; lock oxlint+bindings 1.89.0, 0x 1.90.0; 0 oxlint exclusions; frozen install ok; lint ok on 1.89.0; lock diff oxlint-only. Age check active: install refused 1.90.0 entries (ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION). Explicit 'pnpm add oxlint@1.90.0' was NOT refused: pnpm auto-added exclusions (non-strict mode); reverted |
| 5.1 | Push and read CI log | should | run green; prepublish count 1; audit passed; docs runs green | needs decision | 4 commits local (ahead 4); push question interrupted by user 2026-10-28; not pushed |
