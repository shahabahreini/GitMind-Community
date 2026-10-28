# Optimize audit — build, lint and CI toolchain (oxlint migration in flight)

Date: 2026-10-27 · Scope: uncommitted ESLint → oxlint migration plus the build/lint/typecheck/CI chain around it · Status: Ready for review

## 1. Contract

What must not change:

- **VSIX contents and bundle**: `dist/extension.js` built by `esbuild.js --production` (CJS, `target: node22`, `external: vscode`, console/debugger dropped). `node22` matches the Node bundled with VS Code 1.101 (`engines.vscode ^1.101.0`); this is parity-bound.
- **Release gates**: tag/version match, `package:audit` (forbidden-file list + bundled-source checks), `lint:listing`, store publish with `--skip-duplicate`, parity check. A broken build or type error must still fail the release.
- **Developer commands**: `compile`, `package`, `check-types`, `lint`, `test`, `watch` keep their names and pass/fail meaning.
- **Lint policy as it stood at HEAD**: every ESLint rule was `warn`, so lint never failed a build. Changing that is a policy decision, not an optimization.

## 2. Stack inventory

| Role | Tool / library | Resolved version | Effective configuration | Cost or win here | Suspect? |
|---|---|---|---|---|---|
| Package manager | pnpm | 12.5.1 (`packageManager`) | `minimumReleaseAgeExclude` has 20 new oxlint entries; `allowBuilds` list; `braces` patch | Install dominates CI jobs (unmeasured) | Yes: release-age exclusions |
| Stale lockfile | yarn.lock | last touched 2026-07-14 (9e00fc7) | Tracked; excluded from VSIX by `.vscodeignore` and `audit-vsix.mjs`. vsce would infer yarn from it, but `"vsce": {"yarn": false}` overrides | Dead weight; latent hazard | Yes → handoff |
| Typecheck | TypeScript | 5.9.3 | `tsc --noEmit`, strict, 192 `.ts` files / 64.5k lines | 1.49–1.74 s per run (n=6) | Run 2–3× per pipeline |
| Lint | oxlint | 1.90.0 (published 2026-10-27 05:51Z, today) | `typescript` plugin; `correctness` category **off**; `curly`, `eqeqeq`, `no-throw-literal` = warn; exit 0 on warnings | 0.18–0.21 s per run (n=3); 0 findings | Release age; parity |
| Lint (removed) | eslint 10 + @typescript-eslint 8 | — | Same 3 rules + `semi` + import `naming-convention`, all warn | Baseline time **unmeasured** (no longer installed) | — |
| Bundler | esbuild | 0.28.2 | See contract; tree-shaking; no metafile | 0.14–0.18 s production build | No |
| Packaging | @vscode/vsce | 3.9.2 | `package` always runs `vscode:prepublish` (`out/package.js:1487`, no skip flag); `ls` does not | Re-runs the full `package` script | **Yes: duplicate build** |
| Test runner | @vscode/test-cli / test-electron | 0.0.15 / 3.1.0 | 30 suites in `src/test/suites`; **not run by any workflow** | — | → handoff |
| Docs | vitepress | 1.6.4 | Separate workflows | Out of scope | — |
| Lifecycle | `prepare` | — | `pnpm run compile` (tsc + lint + dev esbuild) on install | Extra build on fresh installs, including CI (likely; not observed locally because the up-to-date install skipped scripts) | Candidate |
| Runtime bundle | `dist/extension.js` | — | 2.91 MB minified. src 48%, @google/genai 14%, @smithy/core 6%, mime-db 5%, google-auth-library 4%, axios 3% | V8 compile of the file: 20.6–21.0 ms (n=5); activation time **unmeasured** | Candidate only |
| CI | GitHub Actions | checkout/setup-node/pnpm action v6 | `validate-extension` on every push to main; `release` on tags | Each runs install(prepare) + `package` + `vsce package`(prepublish → `package`) | **Yes** |

Out of scope: docs/wiki/pages workflows, runtime provider code paths (generation latency is network-bound), webview UI.

## 3. Measurement

Environment: macOS (darwin 27), Node 24.14.0, local machine, warm caches. CI runner times not measured.

Declared thresholds (before measuring):
- CI or dev-loop change: admit only if it removes ≥1 s per run locally **and** carries no behavior risk.
- Runtime/bundle change: needs an activation-time measurement in a real VS Code host; no admission from bundle size alone.

| What | Result |
|---|---|
| `tsc --noEmit` | 1.49, 1.50, 1.54, 1.57, 1.74 s |
| `oxlint src/` | 0.18–0.21 s, 0 findings |
| `node esbuild.js --production` | 0.14–0.18 s |
| `pnpm run package` (clean + tsc + lint + esbuild) | 2.54, 2.71 s |
| `node scripts/audit-vsix.mjs` | 0.67 s, passes (33 files) |
| V8 compile of `dist/extension.js` | ~21 ms |
| oxlint with `correctness` enabled | 217 warnings: 203 no-unused-vars, 12 no-useless-escape, 2 constant-condition (one test line) |
| Lockfile packages | 832 (HEAD) → 786 (working tree) |

Unmeasured: ESLint baseline time, CI job durations, extension activation time, whether `prepare` fires in CI (pnpm documents it does for the root project on install).

## 4. Recommendation verdicts

The supplied item is the in-flight working-tree change.

| Item | Verdict | Evidence |
|---|---|---|
| Replace ESLint + @typescript-eslint with oxlint | **Accept** (weight proven; speed unmeasured) | −46 lockfile packages, 3 devDeps → 1. Same 3 enforced rules, 0 findings. Lost `semi` and import `naming-convention`, both warn-only and never build-failing; the naming rule has 0 current violations (grep of all default/namespace imports). `correctness: off` matches the old config, which had no correctness rules. |
| Pin `oxlint@1.90.0` via 20 `minimumReleaseAgeExclude` entries | **Defer (human decision)** | 1.90.0 is hours old; the exclusions bypass the release-age cooling you configured. 1.89.0 (2026-10-19) exists. Choose: pin `^1.89.0` and drop the 20 entries, or keep 1.90.0 and delete the entries once it ages past the window. Either way, confirm `oxlint src/` still reports 0. |

## 5. Ranked gains (passed the Zero-Cost Gate)

| # | Change · axis | Evidence | Baseline | Expected effect | Holds when | Falsified when | Rank | Effort · class |
|---|---|---|---|---|---|---|---|---|
| G1 | Drop the explicit `pnpm run package` step from `validate-extension.yml` and `release.yml`; let `vsce package` build it via `vscode:prepublish`. In validate, move `package:audit` after `package:vsce`. · speed | vsce 3.9.2 `packageCommand` always calls `prepublish` → `npm run vscode:prepublish` → `pnpm run package`. `audit-vsix.mjs` only needs `dist/` + `vsce ls` (which does not prepublish). | 2 full `package` runs per job | Removes one `package` run: ~2.5 s locally; **end-to-end unknown** (job time dominated by install) | vsce keeps running prepublish on `package` | A vsce upgrade adds a skip-prepublish default, or CI logs show no second build | low | S · safe now |
| G2 | `pretest`: replace `compile-tests && compile && lint` with `compile-tests && lint && node esbuild.js` · speed | `compile-tests` (`tsc -p . --outDir out`) already typechecks with the same tsconfig and exits non-zero on errors; `compile` repeats tsc and lint, then pretest lints a third time | 2 tsc + 2 lint per `pnpm test` | ~1.7 s saved per local test run (one tsc + one lint); **local only**, tests are not in CI | tsconfig stays shared between both scripts | `compile-tests` moves to a separate tsconfig with looser checks | low | S · safe now |

Neither gain stacks into a larger number; both are small and only worth doing because they carry no risk.

## 6. Upgrades

None admitted beyond accepting the oxlint migration (section 4).

## 7. Restructures

None. Nothing in the current shape forces extra I/O or serialized work on a hot path.

## 8. Rejected

| Idea | Failed check |
|---|---|
| Raise esbuild `target` to `node24` to match `engines.node` | Contract-bound: VS Code 1.101's runtime is Node 22 |
| Swap `tsc` for a native/alternative type checker | Gain ceiling: tsc is 1.5 s; a second compiler adds weight and parity risk for ≤1.5 s |
| Further lint speedups | Ceiling: lint is 0.2 s of a 2.6 s `package` run (~7%) |
| Drop stale `dist/extension.js.map` after production builds | Gain: none; `.vscodeignore` already excludes `**/*.map` |

Unresolved candidates (not admitted; next check named):

| Candidate | Missing evidence | Next check |
|---|---|---|
| Make `@aws-sdk/*` load lazily at activation | `src/services/api/validation.ts:16` statically imports `./bedrock`, defeating the dynamic `import('./bedrock.js')` in `index.ts:193`. Activation cost unmeasured; compile floor is only ~21 ms | Measure activation with VS Code's "Developer: Show Running Extensions" before/after |
| Replace axios (3 uses, `huggingface.ts`; ~2.7% of bundle) with `fetch` | Error classification reads axios shapes (`response.status`, `ERR_CANCELED`) → Function check unknown | Contract tests for HF errors/cancellation first |
| Remove `prepare: compile` | Changes contributor install behavior; CI cost unmeasured | Decide policy; check a CI install log for the prepare build |
| Enable oxlint `correctness` category | 217 warnings, mostly unused vars; output change, not speed | Your call on lint policy |

## 9. Handoff (for a correctness audit)

- 30 test suites exist but no workflow runs `pnpm test`; CI green does not mean tests pass.
- Lint can never fail CI: every rule is `warn` and oxlint exits 0 on warnings. `--deny-warnings` would cost nothing today (0 findings), but it is a policy choice.
- `yarn.lock` is stale (last touched 2026-07-14) next to `pnpm-lock.yaml`. It stays out of the VSIX, but it is dead weight and a vsce yarn-inference hazard if `"vsce.yarn": false` is ever removed.
- `src/test/suites/generationRepair.test.ts:432` asserts `num_ctx` against the literal `8048 > 4096 ? 8048 : 4096`. That is a constant, so the test doesn't check the rule it describes.

## 10. Verification

- G1: push to a branch and run `validate-extension` manually. The log should show exactly one `Executing prepublish script` / `tsc --noEmit` per job, and `package:audit` should still pass. Rollback: revert the workflow edit.
- G2: run `pnpm test` locally. It should still fail on a deliberately injected type error and still produce `dist/extension.js`. Rollback: revert the script line.
- oxlint pin: `pnpm install` then `pnpm run lint` should still report 0 findings.
- Silent-break detector: `package:audit` and `lint:listing --vsix` still pass on the produced VSIX.

## 11. Implementation plan

### New
- None.

### Updates to existing work

| ID | What | How | Where | Depends on | Skills | Parallel | Effort | Priority | Done when |
|---|---|---|---|---|---|---|---|---|---|
| T1 | Remove the duplicate CI build | Delete `pnpm run package` step(s); in validate, run `package:vsce` before `package:audit` | `.github/workflows/validate-extension.yml`, `.github/workflows/release.yml` | — | None | yes | S | should | One prepublish build per job in the CI log; audits pass |
| T2 | Remove the duplicate typecheck/lint in pretest | `"pretest": "pnpm run compile-tests && pnpm run lint && node esbuild.js"` | `package.json` | — | None | yes | S | could | `pnpm test` runs one tsc and one lint, and still fails on type errors |
| T3 | Resolve oxlint release-age exclusions | Pin `^1.89.0` and drop the 20 entries, **or** drop them after 1.90.0 ages out | `package.json`, `pnpm-workspace.yaml` | Decision | None | yes | S | should | `pnpm install --frozen-lockfile` passes with no oxlint exclusions; lint reports 0 |

## 12. Handover

- **Context**: ESLint → oxlint migration is uncommitted in the working tree; this audit covers it plus the build/CI chain.
- **Decisions**: migration accepted. `correctness` stays off for parity unless you decide otherwise.
- **State**: done = audit. Pending = T1–T3. Blocked = T3 on your pin choice.
- **Remaining tasks**: see section 11.
- **Verification**: section 10. Nothing was changed by this audit.
- **Risks**: G1 moves build errors into the `vsce package` step's log, so they are less obvious there but still fail the job. The oxlint same-day release bypasses your supply-chain cooling until T3 is done.
