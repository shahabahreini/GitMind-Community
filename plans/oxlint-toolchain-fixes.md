# Plan: Toolchain fixes after the oxlint migration

| Field | Value |
|---|---|
| Objective | Commit the oxlint migration, then remove duplicate build/typecheck work and restore the release-age check for oxlint, without changing the extension or its release gates |
| Status | Reviewed and ready to execute |
| Version | 2026-10-27 |
| Created | 2026-10-27 |
| Source audit | `plans/oxlint-toolchain-optimize.md` (sections 4, 5, 10, 11) |

## 1. Objective & Definition of Done

- **Goal**:
  - O1: the accepted ESLint → oxlint migration is committed on its own.
  - O2: each CI job builds the extension once.
  - O3: `pnpm test` typechecks and lints once.
  - O4: oxlint no longer bypasses `minimumReleaseAge`.
- **Done when**:
  - The migration is one commit on `main`, followed by one commit per fix.
  - `validate-extension.yml` and `release.yml` contain no explicit `pnpm run package` step, and `package:audit` runs after `package:vsce`.
  - `pretest` is `pnpm run compile-tests && pnpm run lint && node esbuild.js`.
  - `package.json` has `"oxlint": "^1.89.0"`, the lockfile resolves `oxlint@1.89.0`, and `pnpm-workspace.yaml` has no `oxlint` / `@oxlint/` exclusion entries.
- **Success measures**:
  - `pnpm run lint` reports 0 findings.
  - The full local release pipeline passes: `pnpm run package:vsce --out <tmp>.vsix && pnpm run package:audit && pnpm run lint:listing --vsix <tmp>.vsix`.
  - The first CI run on `main` shows exactly one `Executing prepublish script` and no separate "Build extension" step.
- **Expected results**:
  - Phase 1: `git log` shows the migration commit, and `git status` is clean apart from the plan files.
  - Phase 2: the local pipeline above passes, and a CI log shows one build.
  - Phase 3: `pnpm test` runs one `tsc`.
  - Phase 4: `grep oxlint pnpm-workspace.yaml` prints nothing, and `pnpm install --frozen-lockfile` succeeds.
- **Must not happen**:
  - A type error or build failure stops failing the release or validate job.
  - VSIX contents change.
  - `dist/extension.js` bundle settings change.
  - A same-day package is admitted.
  - Tag-based release behavior changes.

## 2. Context & Constraints

- **Background**: The audit (`plans/oxlint-toolchain-optimize.md`) found two things:
  - vsce 3.9.2 always runs `vscode:prepublish` (`npm run vscode:prepublish` → `pnpm run package`) during `vsce package`. See `node_modules/@vscode/vsce/out/package.js:1396-1399, 1487`.
  - The CI workflows also run `pnpm run package` beforehand, so each job builds twice.
- **More background**:
  - `pretest` runs `compile-tests` (a full tsc using the same tsconfig), then `compile` (tsc again plus lint plus esbuild), then lint again.
  - `oxlint@1.90.0` was published on 2026-10-27 and is admitted only through 20 `minimumReleaseAgeExclude` entries.
  - `oxlint@1.89.0` was published on 2026-10-19.
- **Constraints**:
  - Commits go directly on `main` (user choice).
  - No new dependencies or files apart from these plan files.
  - The esbuild config and `.vscodeignore` don't change.
  - Use the pnpm 12.5.1 pinned in `packageManager`.
- **Stakeholders**: the owner, who also publishes the release. Marketplace and OpenVSX users are only indirectly affected (VSIX must be identical in content).
- **Open questions and decision points**: none. All were resolved on 2026-10-27:
  - pin `^1.89.0` now
  - migration commit first, then one commit per fix, all on `main`
  - CI is verified by reading the log, not by timing it
  - no new dependencies or files

## 3. Strategy

- **Chosen path**:
  1. Commit the migration as-is.
  2. Edit the two workflows.
  3. Edit `pretest`.
  4. Re-pin oxlint with `pnpm add -D oxlint@1.89.0`, then delete the exclusion entries.
  5. Verify each step locally before its commit, and verify CI once after pushing.
- **Why it wins**: Each fix edits existing lines only and can be reverted on its own. Local checks cover everything except CI log shape.
- **Alternatives rejected**:
  - A single combined commit: harder to revert any one part.
  - A branch plus `workflow_dispatch` dry run: the user chose `main`.
  - Keeping 1.90.0 and cleaning up later: leaves the release-age bypass open.

## 4. Scope

- **New**: none. This plan file is the only new file.
- **Updates to existing**:
  - `.github/workflows/validate-extension.yml`
  - `.github/workflows/release.yml`
  - `package.json` (`pretest`, `oxlint` spec)
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
- **Explicitly out of scope** (each is listed as a handoff in the audit):
  - running tests in CI
  - `--deny-warnings`
  - the oxlint `correctness` category
  - `yarn.lock` removal
  - lazy-loading the AWS SDK
  - replacing axios
  - removing `prepare`
- **Change policy**: anything beyond the listed files or lines needs the user's approval and a replan.
- **Cut line**:
  - Above (must): Tasks 1.1, 2.1, 4.1.
  - Below: 3.1 (could, local-only ~1.7 s saving) and 5.1 (should, post-push CI confirmation).
- **Footprint**: 1 file created (this plan) · 6 edited · 0 dependencies added (oxlint version only) · 0 abstractions.

## 5. Assumptions

| # | Assumption | Validated by |
|---|---|---|
| A1 | `vsce package` in CI still runs `vscode:prepublish` → `pnpm run package`, so removing the explicit step keeps one full build (clean + tsc + lint + esbuild --production) | Proven locally: vsce 3.9.2 source lines above. Re-confirmed by Task 5.1 CI log |
| A2 | `scripts/audit-vsix.mjs` needs only `dist/extension.js` and `vsce ls` (which does not prepublish), so running it after `package:vsce` is equivalent | Proven: `audit-vsix.mjs:1-36`; `vsce ls` action has no prepublish call |
| A3 | `compile-tests` (`tsc -p . --outDir out`) uses the same tsconfig as `check-types` and exits non-zero on type errors | Task 3.1 injects a type error and observes `pnpm test` fail before tests run |
| A4 | `pnpm add -D oxlint@1.89.0` writes `^1.89.0` and locks 1.89.0 without needing exclusions | Task 4.1 checks `package.json`, `pnpm-lock.yaml`, and an install with exclusions removed |
| A5 | oxlint 1.89.0 supports the current `.oxlintrc.json` (`$schema`, `plugins: [typescript]`, `categories`, the 3 rules) and reports 0 findings | Task 4.1 runs `pnpm run lint`; falsified by config errors or new findings |
| A6 | `release.yml` publish steps only consume the VSIX produced by `package:vsce`, so dropping "Build extension (production)" changes nothing downstream | Proven by reading `release.yml`; the next real tag release is the final confirmation |

## 6. Phases & Tasks

### Phase 1: Land the migration

Checkpoint: `git log -1` shows the oxlint migration commit, and `git status` shows only the two plan files as untracked.

**Task 1.1 — Commit the ESLint → oxlint migration**
- What: commit the working-tree migration unchanged.
- How:
  1. Run `pnpm run lint` and `pnpm run check-types`. Both must pass with 0 lint findings.
  2. Stage `.gitignore`, `.vscodeignore`, `eslint.config.mjs` (deletion), `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` and `.oxlintrc.json`.
  3. Commit with a Conventional Commits message, e.g. `chore(lint): replace eslint with oxlint`, ending with the session's `Co-Authored-By` line.
- Where: repo root
- Depends on: none
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: the commit exists; `pnpm run lint` exits 0 with no findings; `git show --stat HEAD` lists exactly those 7 paths.

### Phase 2: One build per CI job

Checkpoint: the local pipeline `pnpm run package:vsce --out /tmp/gm.vsix && pnpm run package:audit && pnpm run lint:listing --vsix /tmp/gm.vsix` passes, with one `Executing prepublish script` line.

**Task 2.1 — Remove the explicit package step from both workflows**
- What: delete the redundant production build steps and keep the audit after packaging.
- How:
  - In `validate-extension.yml`, delete `- run: pnpm run package`. Then order the remaining steps as `package:vsce --out /tmp/gitmind-validation.vsix` → `package:audit` → `lint:listing` → `lint:listing --vsix /tmp/gitmind-validation.vsix`.
  - In `release.yml`, delete the step named "Build extension (production)".
  - Leave every other step, its order, its env and its secrets unchanged.
  - Run the local pipeline, then commit as `ci(github-actions): drop duplicate production build`.
- Where: `.github/workflows/validate-extension.yml`, `.github/workflows/release.yml`
- Depends on: 1.1
- Skills: None
- Parallel: yes (with 3.1)
- Effort: S
- Priority: must
- Done when:
  - `grep -n "run package$\|Build extension" .github/workflows/*.yml` returns nothing.
  - `ruby -e 'require "yaml"; YAML.load_file(ARGV[0]); YAML.load_file(ARGV[1])' .github/workflows/validate-extension.yml .github/workflows/release.yml` succeeds.
  - The local pipeline passes.

### Phase 3: One typecheck per test run

Checkpoint: `pnpm run pretest` prints one `tsc` invocation and one `oxlint` invocation, and still builds `dist/extension.js`.

**Task 3.1 — Deduplicate `pretest`**
- What: stop `pretest` from running tsc twice and lint twice.
- How:
  1. Set `"pretest": "pnpm run compile-tests && pnpm run lint && node esbuild.js"`.
  2. Verify that `pnpm run pretest` passes.
  3. Temporarily add `const x: number = "a";` to any `src` file and confirm `pnpm run pretest` fails at `compile-tests`. Revert the injection.
  4. Commit as `build(scripts): remove duplicate typecheck and lint from pretest`.
- Where: `package.json:1595`
- Depends on: 1.1
- Skills: None
- Parallel: yes (with 2.1)
- Effort: S
- Priority: could
- Done when: the clean run passes; the injected run exits non-zero before esbuild; `git diff` shows the injection reverted; `dist/extension.js` exists after a clean run.

### Phase 4: Restore the release-age check

Checkpoint: `grep -c oxlint pnpm-workspace.yaml` prints `0`, and `pnpm install --frozen-lockfile` succeeds.

**Task 4.1 — Pin oxlint ^1.89.0 and drop the 20 exclusions**
- What: move to an oxlint version that is old enough to pass `minimumReleaseAge`, and remove the bypass.
- How:
  1. Delete the 20 `@oxlint/binding-*@1.90.0` and `oxlint@1.90.0` lines from `minimumReleaseAgeExclude`. Keep the 4 existing non-oxlint entries.
  2. Run `pnpm add -D oxlint@1.89.0`.
  3. Run `pnpm install --frozen-lockfile`, then `pnpm run lint`.
  4. Check that only oxlint entries changed: `git diff pnpm-lock.yaml | grep -E '^[+-]  [^ ]' | grep -vE 'oxlint'` should print nothing.
  5. Prove the age check is active. `pnpm config get minimumReleaseAge` prints `undefined`, so the default is unproven. Before 2026-10-28 05:51Z, run `pnpm add -D oxlint@1.90.0`. It must be refused for release age. Then run `git checkout -- package.json pnpm-lock.yaml pnpm-workspace.yaml` and repeat step 2. After that time, record this check as "not checkable".
  6. Commit as `build(deps): pin oxlint to 1.89 and restore release-age check`.
- Where: `pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml`
- Depends on: 1.1, and 3.1 only if 3.1 is being done (both edit `package.json`)
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when:
  - `package.json` has `"oxlint": "^1.89.0"`.
  - `grep -E "^  oxlint@" pnpm-lock.yaml` shows only `1.89.0`.
  - The workspace file has no oxlint entries.
  - The frozen install passes.
  - `pnpm run lint` exits 0 with no findings.
  - The lockfile diff touches only oxlint packages.
  - The 1.90.0 add was refused, or the check is recorded as not checkable with the time.

### Phase 5: Confirm in CI

Checkpoint: the GitHub Actions run of `Validate Extension` for the pushed commits is green, and its log shows one build.

**Task 5.1 — Push and read the CI log**
- What: confirm A1 on the real runner.
- How:
  1. Push `main`. Pushing is outward-facing, so confirm with the user first. Tell them the push changes `package.json` and `pnpm-lock.yaml`, which also triggers three other workflows:
     - `Validate Documentation`
     - `Publish Documentation Pages`, which force-pushes the Handbook to the public GitMind-Community `gh-pages`
     - `Publish Wiki`, which publishes the public wiki

     Docs content is unchanged, so these should republish identical output.
  2. Run `gh run watch` or `gh run view --log` for `Validate Extension`.
  3. Count prepublish executions.
- Where: GitHub Actions
- Depends on: 2.1, 4.1 (and 3.1 if done)
- Skills: None
- Parallel: no
- Effort: S
- Priority: should
- Done when: the run is green; `gh run view <id> --log | grep -c "Executing prepublish script"` prints `1`; the `package:audit` step passed; the docs workflows triggered by the push are green (`gh run list --commit <sha>`).

## 7. Risks & Countermeasures

| Risk | Impact | Countermeasure |
|---|---|---|
| A build error now surfaces inside the `vsce package` step instead of a dedicated step | Slightly harder-to-read failing log; the job still fails | Accepted. vsce prints `Executing prepublish script` before the build output |
| A future vsce version stops running prepublish by default | CI would package a stale or missing `dist/` | `package:audit` fails if `dist/extension.js` is missing. Re-check A1 on any vsce upgrade |
| oxlint 1.89.0 rejects the config or reports findings | Lint step fails | Task 4.1 gate. Fix the config to 1.89 syntax, or keep 1.90.0 and replan the cleanup |
| `pnpm add` re-resolves unrelated packages | Unreviewed lockfile churn | Review `git diff --stat pnpm-lock.yaml`. Only oxlint/@oxlint entries should change. Otherwise reset and replan |
| The deleted step in `release.yml` hides a problem until the next tag | Release fails at tag time | Validate-extension runs the identical `package:vsce` path on every main push (Task 5.1) |
| The type-error injection in 3.1 is left in the tree | Broken build committed | The done-when check requires `git diff` to show it reverted before the commit |
| The push redeploys the public Handbook and wiki | Unexpected public publish; a docs build failure shows as a red run | Name these workflows in the push confirmation; check them in 5.1. Content is unchanged |
| pnpm's release-age default is not actually active (config prints `undefined`) | O4 holds only on paper | Negative check in 4.1 step 5 (time-bound until 2026-10-28 05:51Z) |
| All commits reach CI in one push, so a red run doesn't name the commit at fault | Slower diagnosis | Each commit can be reverted alone; bisect locally with the Phase 2 pipeline |

## 8. Verification & Replanning

- **Per task**: the "Done when" checks above. Commit only after they pass.
- **Overall**: the local release pipeline passes on the final tree; `pnpm run lint` reports 0; Task 5.1 CI log shows one build.
- **Not verified by this plan**: CI time saved (deliberately unmeasured) and the next tag release run.
- **Replan when**:
  - oxlint 1.89.0 fails A5.
  - The lockfile diff touches non-oxlint packages.
  - CI shows 0 or 2+ prepublish runs.
  - The user wants a branch or a single commit after all.

## 9. Traceability

| Objective | Covered by tasks |
|---|---|
| O1 Migration committed separately | 1.1 |
| O2 One build per CI job | 2.1, 5.1 |
| O3 One typecheck/lint per test run | 3.1 |
| O4 Release-age check restored for oxlint | 4.1 |

## 10. Handover Summary

- **Context**: Follows `plans/oxlint-toolchain-optimize.md`. The oxlint migration was accepted and is uncommitted. Two small duplicate-work fixes and one supply-chain pin were found.
- **Decisions** (2026-10-27):
  - pin `^1.89.0` now and drop all 20 exclusions
  - migration commit first, then one commit per fix, directly on `main`
  - verify CI from the log, not by timing it
  - no new dependencies or files
- **State**: done = audit, this plan, and its review. Pending = Tasks 1.1–5.1. The plan files stay untracked unless the user asks to commit them. Blocked = none. Task 5.1 needs the user's approval to push.
- **Remaining tasks**: see section 6 (each with what, how and where).
- **Verification**: see section 8. Local pipeline commands are in the Phase 2 checkpoint.
- **Risks and how to detect them early**:
  - lockfile diff beyond oxlint → `git diff --stat`
  - lint findings after the re-pin → `pnpm run lint`
  - prepublish count ≠ 1 → CI log grep

## 11. Review appendix

- **Lenses applied and why**:
  - Operations (CI/release edits and a push to `main`)
  - Security / supply chain (release-age bypass)
  - QA (whether the done-when checks prove the objectives)
  - Engineering (task ordering and ambiguity)
  - Product/UX: N/A. Nothing user-facing changes.
- **Findings**:
  1. Operations, proven. Pushing `package.json`/`pnpm-lock.yaml` to `main` also triggers `Publish Documentation Pages` and `Publish Wiki`, both of which publish to the public GitMind-Community repo. See the `paths:` filters in both workflows. Fix: name these in the push confirmation and check them in 5.1.
  2. QA, likely. O4 could pass without the age check being active, because `pnpm config get minimumReleaseAge` prints `undefined` (default unproven). Fix: negative `pnpm add oxlint@1.90.0` check in 4.1, valid until 2026-10-28 05:51Z.
  3. Engineering, proven. Task 4.1 said "run after 3.1", but 3.1 is optional. Fix: depend on 3.1 only if it is being done.
  4. QA, possible. `pnpm add` could churn unrelated lockfile entries. Fix: an explicit lockfile-diff filter in 4.1 step 4.
  - Engineering, none. vsce prepublish runs via `npm run` (`package.js:1396-1399`), which CI already relies on. `lint:listing` reads only `package.json`, `README.md` and an optional VSIX, so the step reorder is safe. `@oxlint/binding-*@1.89.0` is published.
- **Decisions**: user decisions preserved, with no changes.
- **Remaining risks**:
  - Build errors surface inside the vsce step's log.
  - The release workflow change is fully exercised only on the next tag.
  - The age-check proof expires at 2026-10-28 05:51Z.
- **Cuts made and footprint change versus the draft**: 0 tasks cut, 0 added. Steps added inside 4.1 and 5.1. Footprint unchanged: 6 edited files, 0 new dependencies or settings.
- **Applicable checks and evidence**: workflow `paths:` filters; vsce 3.9.2 source; `scripts/lint-listing.mjs:18-23`; `npm view @oxlint/binding-linux-x64-gnu@1.89.0`; lockfile key format `  oxlint@<v>:`.
- **Non-applicable checks and reasons**:
  - Performance timing: the user chose log-based verification.
  - Monitoring: a one-off CI change, covered by the CI result itself.
  - Data migration: none.
- **Blockers and resolution needed**: none. This is a reviewed plan, not a verified implementation; no task has run.
