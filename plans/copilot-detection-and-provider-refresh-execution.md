# Execution Ledger: Copilot Detection Fix, Single Provider Registry, Provider/Model Refresh

| Field | Value |
|---|---|
| Plan | `plans/copilot-detection-and-provider-refresh.md` (r2, Reviewed and ready to execute) |
| Started | 2026-09-22 |
| Status | Automated work complete; blocked only on the maintainer checklist (5.3, and the manual part of 1.2/2.4) |
| Basis | User invoked `/360-execute` after `/360-expert-review` in the same session. Token-efficiency overlay approved for this session. |

## Toolchain note (read first)

`pnpm run <script>` currently fails before running anything, because pnpm verifies the lockfile first. The uncommitted `pnpm-lock.yaml` pins 4 packages published on 2026-09-22 (`@smithy/core@3.35.0`, `@smithy/types@4.19.0`, `fs-extra@11.4.1`, `ignore@7.0.10`), which the `minimumReleaseAge` policy rejects.

- **User decision:** a one-off `pnpm install --frozen-lockfile --config.minimum-release-age=0`, with no persistent policy change.
- That install rewrote `pnpm-workspace.yaml` to add an `allowBuilds` placeholder for `@google/genai`. The file was restored byte-for-byte from the backup. `package.json` and `pnpm-lock.yaml` were verified unchanged with `cmp`.
- Run the tools directly:
  - `B=node_modules/.bin`
  - Type-check: `$B/tsc --noEmit`
  - Lint: `$B/eslint "src/**/*.{ts,tsx}"`
  - Compile tests: `$B/tsc -p . --outDir out`
  - Build: `node esbuild.js`
  - Tests: `$B/vscode-test --skip-extension-dependencies` (no xvfb on this machine)

## Coverage Ledger

| ID | Name | Priority | Acceptance check | Status | Evidence |
|---|---|---|---|---|---|
| 1.1 | Preserve worktree and record baseline | must | Uncommitted files and baseline test count recorded; tests pass | done (verified) | `git status --short`: M `package.json`, M `pnpm-lock.yaml`, M `pnpm-workspace.yaml`, ?? `graphify-out/`, ?? plan file. HEAD `ad573df`. Baseline: type-check 0, lint 0, compile-tests 0, esbuild 0, **401 passing**. |
| 1.2 | Reproduce API-key message | must | Automated mapping table plus maintainer manual table; A1 confirmed or refuted | in progress (automated verified; maintainer table M1–M4 pending) | **A1 automated-confirmed**, plus the double-formatting root cause. See *Task 1.2 evidence*. |
| 1.3 | Failing regression tests | must | New tests fail on current code for the documented reason | done (verified) | `src/test/suites/copilotProvider.test.ts`: 17 failing on the unmodified code (402 passing / 17 failing), e.g. `GitHub Copilot error: unauthorized -> GitHub Copilot: GitHub Copilot API key is invalid or missing.`; all pass after Phase 2. |
| 2.1 | Copilot availability detector | must | Tests (b) and (c) pass; 0 `isCopilotAvailable` callers; type-check passes | done (verified) | `detectCopilot()` returns 5 states through an injectable `CopilotLmAccess`, and logs `provider.copilot_state`. Tests for unsupported-host, not-installed, no-models, and no-access pass. `grep -rn isCopilotAvailable src` gives 0. `extension.test.ts` was migrated. |
| 2.2 | LanguageModelError mapping, retry removal, justification | must | Test (a); no `constructor.name`; no cross-model send on NoPermissions; justification on every send | done (verified) | `mapCopilotRequestError` compares `.code` with `LanguageModelError.X().code`. `grep -cF constructor.name` gives 0. The "never sends to another model" test passes (selected 1, other 0). Both `sendRequest` calls (lines 294 and 345) pass `justification`. The dead `handleCopilotError` was deleted. |
| 2.3 | Auth-aware messaging | must | Test (d) for all keyless providers; existing error tests pass | done (verified) | `PROVIDER_CATALOG` gained `name` and `auth` (5 kinds), plus `resolveProviderId`, `getProviderAuth`, and `requiresApiKey`. `errorHandler.getCredentialGuidance` drives the auth and permission wording and the generic fallback. `ProviderApiError.userFacing` stops double formatting. Tests for 5 keyless providers × {401, 403, unclassified} × {id, name} pass; `errorHandling`/`nvidiaAndRecovery` pass. |
| 2.4 | Copilot discovery in Settings and generate | must | Settings and generate states; provider tests pass | in progress (automated verified; real-IDE rows in 5.3) | `handleLoadCopilotModels` posts `{state, models, modelDetails}` or the state message. The webview shows the Copilot state text. `handleError` shows state-specific actions (Find GitHub Copilot / Retry / Choose Another Provider). `lm.onDidChangeChatModels` notifies the settings UI only. `auto` resolves to model id `auto` if present, else the first model. The info panel wording was updated. Real-IDE confirmation happens in Task 5.3. |
| 2.5 | Copilot token budget | should | Stub `maxInputTokens: 100` gives an input-limit message | done (verified) | `countTokens` is checked against `maxInputTokens` before sending, giving an `input-limit` `ProviderApiError`. The test passes (0 sends). |
| 2.6 | Single-request Test Connection | must | 5-model stub gives exactly 1 send; non-ready states give 0 | done (verified) | Test: sends `[0,0,1,0,0]`, with justification. The not-ready test passes. `checkApiSetup` passes the selected model. The timer is cleared in `finally`. |
| 3.1 | Canonical registry | must | 23 complete entries; type-check passes | done (verified) | `providerCatalog.ts` entries carry `name`, `displayName`, `auth{kind,credentialLabel,optional}`, `docsUrl`, `settingPath`, `defaultModel`, `liveDiscovery`, `curatedModels`. Helpers: `PROVIDER_IDS`, `SECRET_PROVIDER_IDS`, `API_KEY_PROVIDER_IDS`, `KEYLESS_PROVIDER_IDS`, `resolveProviderId`, `getProviderEntry`, `getProviderAuth`, `requiresApiKey`, `serializeProvidersForWebview`. The test *every catalog entry is complete* passes (23). |
| 3.2 | Derive consumers from registry | must | tests pass; parity grep clean | done (verified) | Derived: `api/index.ts` PROVIDER_CONFIGS, `validation.ts` flags and defaults, the `settings.ts` 3 inline checks and PROVIDER_DEFAULTS models, `commands/index.ts` SUPPORTED_PROVIDERS/API_KEY_PROVIDERS/hasApiKey, `SecureKeyManager` ×6, `encryptionHelper` ×2, `SupportSessionService`, `onboardingManager` (docs, paths, keyless), `SettingsManager`, `StatusBanner`, `uiManager` ×2, `apiManager`, `eventHandlers`, webview `constants.ts`, `ProviderConfig.ts` names and options, onboarding cards and links, the `gemini.ts` fallback. The scanner (`scratchpad/scan.js`) reports only the allowlisted files and per-provider behavior tables. **Tests: 439 passing.** |
| 3.3 | Registry parity guard | must | Passes now; fails on a scratch duplicate | done (verified) | *Provider registry parity guard* (7 tests) passes. Scratch edit `scratchKeyless = ['ollama','copilot','lmstudio']` in `api/utils.ts` gave 438 passing / 1 failing (the guard), then was reverted (clean `git diff`). |
| 3.4 | Correct prior ledger claim | should | Deviation entry exists and cites the 3.3 test | done (verified) | `plans/provider-and-pro-modernization-execution.md` Deviations: "Correction to task 2.1" cites *Provider registry parity guard*. |
| 4.1 | Verify providers against official docs | must | 23/23 rows dated with sources and Changes needed | done (verified) | `docs/research/provider-contracts-2026-09.md` › *Verification 2026-09-22*: 23 rows, each with a date and a source link (Custom API marked N/A). 17 rows were fetched on 2026-09-22. Ollama, LM Studio, Bedrock, Vertex AI, and Cloudflare keep 2026-09-02 and are marked "not re-fetched". |
| 4.2 | Apply API changes | must | Every Changes-needed row applied with a test, or deferral approved | done (verified) | Covered by `providerRefresh.test.ts`: Perplexity Agent API (3 tests), Hugging Face router (3), DeepSeek names, Cohere live models, NVIDIA Nemotron thinking off plus `<think>` strip, Claude always-thinking budget. Also fixed: Anthropic key validation used the retired `claude-3-5-haiku-20241022`; Mistral/Grok validation used stale literals; `context.ts` data-destination hosts for HF and MiniMax. |
| 4.3 | Registry defaults, fallbacks, and retired-model migration | must | No retired defaults; migration tests; tests pass | done (verified) | Catalog, `package.json` and handbook defaults are aligned. `SettingsMigrationService.migrateRetiredModelDefaults` (7 providers) saves previous values under `gitmind.migration.retiredModelPrevious`. Tests: retired default migrated; user choice kept; retired values differ from current defaults. **452 passing.** |
| 5.1 | User-facing docs | must | `docs:validate` passes; Copilot section lists 5 states | done (verified) | `docs/handbook/providers/copilot.md` has a 5-row message table; Troubleshooting, Perplexity, and HF pages updated; 12 provider pages and 2 reference pages have new defaults; the README keyless line is fixed. `validate-docs`: 45 pages / 23 providers passed; `sync-wiki --check` passed. |
| 5.2 | Full release gate | must | All gate commands exit 0 | done (verified) | Direct equivalents of the pnpm scripts: check-types 0, lint 0, compile-tests 0, **tests 452 passing**, privacy passed, `pnpm audit --prod` 0 vulnerabilities, docs validation passed, `git diff --check` 0, `vsce package` 0 (`ai-commit-assistant-6.1.2.vsix`, 69 files, 1.95 MB; release-age bypass by env var, same one-off approval; lockfile, workspace, and package.json verified unchanged), `audit-vsix` passed. CHANGELOG has an *Unreleased* entry; version not bumped. |
| 5.3 | Manual Copilot smoke matrix (maintainer, D3) | must | All rows as expected; no "API key" | blocked (awaiting maintainer run of checklist M1–M9) | Needs a real editor, sign-in, and the consent dialog, which the agent cannot operate (D3). Use the VSIX above. |
| 5.4 | Opt-in live provider smoke | could | Pass or fail per attempted provider | pending (below cut line; needs maintainer credentials) | Not attempted: no credentials, by design. |

## Deviations

- 2026-09-22 — Dependency install was blocked by the release-age policy. User approved a one-off bypass; no persistent file changes (see the toolchain note).
- 2026-09-22 — `xvfb-run` is not installed. `vscode-test` runs directly against the desktop display.
- 2026-09-22 — **Task 1.2 finding beyond A1:** the generation path formatted Copilot errors twice. `services/api/index.ts` `handleApiError` formatted once and added the suggestion "Check your configuration and API key". Then `commands/index.ts` `handleError` passed that text to `formatSafeProviderError` again, where the `'API key'` keyword rule turned it into "API key is invalid or missing". Fixed inside Task 2.3's scope with `ProviderApiError.userFacing`; no scope change.
- 2026-09-22 — Task 2.5 (should): raises an `input-limit` error, which uses the existing token-limit message and suggestions, instead of calling the diff-truncation path. Minor; within intent.
- 2026-09-22 — **User direction (mid-execution): update hard-coded models and use each provider's latest models.** This replaces the "change defaults only when retired" rule from Phase 4.
  - New defaults: Gemini `gemini-3.8-flash`, OpenAI `gpt-6-sol`, MiniMax `MiniMax-M3`, Z.ai `glm-5.3`.
  - Known-model tables (types, Gemini, Anthropic, MiniMax, OpenAI, Grok, Groq, Z.ai, Copilot) were updated.
  - Exceptions, recorded in the research doc: Groq, Together, and Hugging Face keep the newest *non-reasoning* default, because their newest models reason and the adapters' output budgets (150/1000/500 tokens) would cut off the answer.
  - Safety fixes found while doing this:
    - Nemotron's reasoning trace appears inside `content`, so thinking is turned off and traces are stripped.
    - Claude Opus 5.5 and Fable 5.1 always think, so they get an 8000-token budget and no sampling parameters.
    - Anthropic key validation called a retired model.
- 2026-09-22 — `vsce package` runs the prepublish step, which hits the lockfile release-age block. It was run with the release-age check disabled by an environment variable for that one command, under the same one-off approval; all three dependency files were verified unchanged.
- 2026-09-22 — **Phase 3 findings fixed in scope:**
  - `SecureKeyManager`/`encryptionHelper` secret lists omitted Azure OpenAI and Cloudflare (and some omitted MiniMax, Z.ai, Groq), so those keys were skipped by migration, encryption status, and listing. They are now `SECRET_PROVIDER_IDS`.
  - In `uiManager` the webview's provider display table was serialized with `JSON.stringify`, which dropped its `apiConfigured` functions, so calling it would throw. It is now an in-page helper.
  - `eventHandlers` wired API-key listeners for only 11 providers.
  - Onboarding lacked 7 providers (Groq, Z.ai, LM Studio, Azure, Bedrock, Vertex, Cloudflare) and had a wrong Grok link. They were added, with names and links from the catalog.
  - Visible names change to catalog names (e.g. "Z.ai (GLM)" becomes "Z.ai"; error messages say "Google Gemini", "xAI Grok", "NVIDIA hosted NIM").
- 2026-09-22 — Phase 3 migration: the Hugging Face catalog default was aligned to the value users already get from `package.json`/`settings.ts` (`mistralai/Mistral-7B-Instruct-v0.3`). The static `ProviderConfig.ts` model options were dead data (already replaced at runtime by `withCatalogModels`), so removing them changes nothing users see. The webview's curated fallback lists moved into the catalog `curatedModels`.
- 2026-09-22 — Task 2.4: explicit Copilot models no longer fall back silently to the first available model (consistent with D1). Matching tolerates case and separators. The retired Copilot aliases `gpt-4-turbo` and `gemini-3-pro` were removed.

## QC Results

- **Final gate (after the latest-model update):** see row 5.2. 452 passing, 0 failing; the parity scanner is clean apart from allowlisted wiring; the stale-model grep is clean apart from the intentional Gemini alias table and the retired-default migration table.

- Baseline (Task 1.1): 401 passing.
- Task 1.3 red run: 402 passing, 17 failing (all in the new suite).
- Phase 2 checkpoint (automated): type-check 0, lint 0, compile-tests 0, esbuild 0, **432 passing, 0 failing**. The real-IDE part of the checkpoint is the maintainer's (D3), in Task 5.3.
- Phase 3 checkpoint: lint 0, compile-tests 0, esbuild 0, **439 passing, 0 failing**. The parity guard proved it catches duplicates with a scratch edit.

## Task 1.2 evidence (automated)

| Input error (from current code paths) | Formatted text before fix | Failure kind |
|---|---|---|
| `GitHub Copilot error: unauthorized` (LM error with the constructor.name mismatch) | `GitHub Copilot: GitHub Copilot API key is invalid or missing.` | authentication |
| `GitHub Copilot is not available…` (unavailable) | `…could not complete the request. Check your configuration and API key…` | unknown → generic |
| First-pass output re-formatted by `commands/handleError` | `API key` keyword rule → `API key is invalid or missing` | auth pattern |
| 401/403 for Ollama, LM Studio, Bedrock, Vertex AI, Copilot | `<provider> API key is invalid or missing` / "Check the API key permissions" | authentication / permission |

## Maintainer checklist (D3; fill in the results)

Build the VSIX once Phase 5 is ready (or press F5 now in VS Code stable). Select **GitHub Copilot**, stage a change, and run **GitMind: Generate Commit Message**. Check that no message mentions an API key.

| # | Host / state | Expected | Result |
|---|---|---|---|
| M1 | VS Code stable, Copilot signed in | Commit message generated; the first run shows the consent dialog with the GitMind justification | |
| M2 | VS Code stable, Copilot Chat disabled | "GitHub Copilot not detected in Visual Studio Code…" + **Find GitHub Copilot** | |
| M3 | VS Code stable, signed out of GitHub | "No GitHub Copilot models are available…" or "…permission…" | |
| M4 | VS Code stable, cancel the consent dialog | "GitMind needs permission to use GitHub Copilot models…" + **Retry** | |
| M5 | VS Code Insiders, signed in | Generated | |
| M6 | Cursor / Windsurf / VSCodium | "GitHub Copilot not detected…" (either variant) | |
| M7 | Settings → Load Models (Copilot, signed in) | Account models listed, with `auto` first | |
| M8 | Settings → Test Connection (Copilot) | Success; exactly one request (Copilot usage shows 1) | |
| M9 (optional) | Remote-SSH/WSL window, signed in | Generated | |

## Unfinished Items

- **5.3 (must), blocked:** the maintainer runs checklist M1–M9 with `ai-commit-assistant-6.1.2.vsix`, which also closes the manual parts of 1.2 and 2.4.
- **5.4 (could), pending:** optional live provider calls with maintainer credentials.
- Not changed, noted: `.gitignore` gained `graphify-out` from an external tool during this session (not part of this work; left as is).
- Handbook pages keep the 2026-09-03 audit stamp because the validator needs one date for every page; the 2026-09-22 verification is recorded in the research doc.

## Handover Summary

- Context: see the plan §10.
- Decisions: D1, D2, D3 (plan §2); the one-off install bypass above.
- State: done (automated): 1.1, 1.3, 2.1–2.3, 2.5, 2.6, 3.1–3.4, 4.1–4.3, 5.1, 5.2. Pending on the maintainer: 5.3 (plus the manual rows of 1.2/2.4). Optional: 5.4.
- Next action: run checklist M1–M9, fill in the Result column, then flip 1.2, 2.4, and 5.3 to done.
- Remaining tasks: every task not marked done above.
- Verification: the direct-binary commands in the toolchain note.
- Risks: running `pnpm run` or `pnpm install` without the bypass flag fails, and may rewrite `pnpm-workspace.yaml`. Back it up first.
