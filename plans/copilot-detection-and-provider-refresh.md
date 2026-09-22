# Plan: Copilot Detection Fix, Single Provider Registry, and Provider/Model Refresh

| Field | Value |
|---|---|
| Objective | GitHub Copilot works without any API-key messaging (models are discovered from the IDE, or the user is told "GitHub Copilot not detected"), every provider is driven from one registry, and every provider's endpoints, auth, and models match its current official documentation. |
| Status | Reviewed and ready to execute |
| Version | 2026-09-22 r2 (post-review) |
| Created | 2026-09-22 |
| Repository | `/home/shahab/Documents/Hobby/GitMind-Pro` (VS Code extension `ai-commit-assistant`, v6.1.2) |
| Related | `plans/provider-and-pro-modernization.md` (+ `-execution.md`), `docs/research/provider-contracts-2026-09.md` |

## 1. Objective & Definition of Done

- Goal: Selecting GitHub Copilot and running **Generate Commit Message** either generates with a Copilot model discovered from the IDE, or shows a precise state message ("GitHub Copilot not detected in <IDE>", "Sign in to GitHub Copilot", "Allow GitMind to use Copilot models", "No Copilot models available"). It never mentions API keys. All provider knowledge comes from one registry, and each provider adapter and default model has been checked against its current official documentation.
- Done when:
  - Regression tests prove that every `LanguageModelError` code and every Copilot availability state maps to a Copilot-specific message with no "API key" wording.
  - A manual smoke run in VS Code stable, VS Code Insiders, and at least one fork (Cursor, Windsurf, or VSCodium) shows the right state message or a successful generation (Task 5.3).
  - A parity test fails if a provider ID list, `requiresApiKey` flag, default model, or display name is defined outside the registry.
  - `docs/research/provider-contracts-2026-09.md` has one row per provider (23) with a verification date, source URLs, the endpoints in use, and the default and fallback models. Every adapter matches its row.
  - `pnpm test`, `pnpm docs:validate`, `pnpm privacy:validate`, `pnpm package:vsce`, and `pnpm package:audit` all pass.
- Success measures: No keyless provider (Copilot, Ollama, LM Studio, Bedrock, Vertex AI, and Custom when it has no token) can produce a user-facing string containing "API key". There are zero duplicate provider lists outside the registry. There are zero default or curated model IDs that the provider documents as retired.
- Must not happen:
  - Losing stored user model selections or secrets.
  - Calling `vscode.lm.selectChatModels` outside a user-initiated action (per the VS Code consent rule).
  - Echoing raw provider responses or secrets.
  - Overwriting the uncommitted dependency updates in `package.json`, `pnpm-lock.yaml`, and `pnpm-workspace.yaml`.
  - Bumping `engines.vscode` without user approval.

## 2. Context & Constraints

- Background, from code inspection on 2026-09-22:
  - **Copilot error mapping is broken (proven).** `src/services/api/copilot.ts:173` branches on `error.constructor.name` (`'NoPermissions'`, `'Blocked'`, `'NotFound'`). `vscode.LanguageModelError` identifies the failure through `.code`, and the constructor name is `LanguageModelError` (or a minified name after esbuild). The specific branches never fire, so every LM error becomes `GitHub Copilot error: <raw message>`. The official guide (https://code.visualstudio.com/api/extension-guides/ai/language-model) says to use `err.code`.
  - **The generic error formatter rewrites Copilot failures as key problems (proven mechanism).** `src/utils/errorHandler.ts:180` `handleAuthenticationError` always says "`<provider>` API key is invalid or missing." The `permission` branch (`errorHandler.ts` switch) suggests "Check the API key permissions." `classifyGenerationFailure` (`src/services/api/recovery.ts:92`) sends any message containing "unauthorized", "authentication failed", "permission", or "forbidden" to those branches. `handleCopilotError` (`errorHandler.ts:224`) exists but is never called.
  - **Detection is binary.** `isCopilotAvailable()` returns `true` or `false` from `selectChatModels({vendor:'copilot'})`. It cannot tell apart: no `vscode.lm` API in this host, Copilot Chat not installed or disabled, not signed in, consent not granted, or no models.
  - **Provider knowledge is duplicated in about 12 places, and the copies disagree (proven):**
    - `src/services/api/index.ts` `PROVIDER_CONFIGS`
    - `src/services/api/validation.ts` `VALIDATOR_CONFIGS` (stale defaults such as `gemini-2.5-flash-preview-04-17`, `microsoft/DialoGPT-medium`, `command`)
    - `src/webview/settings/scripts/apiManager.ts` (missing 5 providers)
    - `src/webview/settings/components/StatusBanner.ts` (Z.ai default `glm-4.5-flash` against catalog `glm-5.1`)
    - `src/webview/settings/scripts/uiManager.ts` (two copies)
    - `src/webview/settings/scripts/constants.ts` `API_KEY_PROVIDERS` / `NO_API_KEY_PROVIDERS`
    - `src/webview/settings/SettingsManager.ts` (same two lists)
    - `src/config/settings.ts` lines 164, 204, 299 (inline keyless lists that disagree about `custom`)
    - `src/commands/index.ts:66` `API_KEY_PROVIDERS` and `:77` `hasApiKey`
    - `src/utils/onboardingManager.ts` (`validateConfiguration` skips only `'Ollama'` by display name; the `hasAnyValidApiConfiguration` list has 17 providers)
    - `src/services/encryption/SecureKeyManager.ts:748`
    - `src/webview/settings/scripts/eventHandlers.ts:531` (14 providers)

    The earlier plan's ledger (task 2.1) records "no independent default lists" as done. That claim is contradicted by this code.
  - **Copilot silently retries on a different model (proven).** `copilot.ts:136-146`: on *any* `sendRequest` failure, including a permission error, a content-filter block, or a cancelled request, the code resends to `models.find(m => m.id !== resolvedModel.id)`. This changes the user's chosen model without telling them, can trigger a second consent prompt, spends extra premium requests, and bypasses the Pro-only `gitmind.pro.modelFallback.*` policy (`index.ts:645`).
  - **Test Connection can use up quota (proven).** `validateCopilotAccess` (`copilot.ts:244-262`) sends a `"Test"` prompt to each Copilot model in turn under one shared 5-second timeout.
  - **Consent prompt shows no reason (proven).** No `sendRequest` call passes `LanguageModelChatRequestOptions.justification`, which is available at 1.101.
  - **More duplicate provider lists:** `src/services/support/SupportSessionService.ts:9`, the provider lists in `src/services/migration/SettingsMigrationService.ts`, and the manifest enum `contributes.configuration` `gitmind.apiProvider` in `package.json`. The manifest cannot import the registry, so it must be parity-tested.
  - **Model defaults are split.** Some live in `src/config/providerCatalog.ts` `PROVIDER_CATALOG`, and others in the validator, banner, and UI copies. `copilot` has `liveDiscovery: false` with a curated list headed by `"auto"`.
- Constraints:
  - `engines.vscode ^1.101.0` and `@types/vscode 1.101.0`. Node `>=24.15.0`. pnpm. Tests run through `vscode-test --skip-extension-dependencies`, with 400 tests passing at the last ledger.
  - Uncommitted changes in `package.json`, `pnpm-lock.yaml`, and `pnpm-workspace.yaml` (pnpm 12.5.1 plus dev-dependency bumps) must be preserved.
  - Supported hosts: VS Code stable and Insiders (full Copilot support), plus Cursor, Windsurf, and VSCodium (must degrade to a clear "not detected" state).
  - Live provider smoke tests need maintainer-owned credentials. Never put credentials in code, fixtures, logs, or the ledger.
- Stakeholders: the maintainer (owner, decides and executes), extension users on the Free and Pro tiers, and the VS Code Marketplace listing (docs and README claims).
- Review decisions (user, 2026-09-22):
  - **D1:** Remove Copilot's built-in cross-model retry. Copilot follows the Pro model-fallback policy like every other provider.
  - **D2:** Copilot Test Connection first detects the state, then sends one minimal request to the selected model (or the resolved `auto` model) only.
  - **D3:** The maintainer runs the manual host checklist. The executor automates everything else, then prepares the checklist and records the maintainer's results.
- Open questions and decision points: none blocking. These are recorded as replanning triggers (§8):
  - An engine bump if a required LM API is newer than 1.101. Needs user approval.
  - A provider whose documented API change needs a new dependency. Needs user approval.

## 3. Strategy

- Chosen path:
  1. Reproduce and pin the bug with failing tests.
  2. Fix Copilot detection and error mapping at the source, and make error formatting aware of each provider's auth type.
  3. Promote `PROVIDER_CATALOG` into the single typed registry and make every consumer derive from it.
  4. Verify each provider against its official docs and apply the changes through the registry and adapters.
  5. Update docs and run the full release gates.
- Why it wins: The false "API key" message comes from two structural faults: a wrong LM error check, and auth wording that ignores whether a provider needs a key. Fixing only the message would leave the 12 drifting lists to cause the same class of bug again. A single registry turns "which providers need keys" into data that can be tested. Refreshing models through the registry means each future update is a one-file change.
- Alternatives rejected:
  - Patching only the Copilot branch. This leaves the stale defaults and inconsistent keyless lists.
  - Bundling a static Copilot model list as the authority. This conflicts with the existing research doc's rule that bundled lists are never authoritative, and Copilot models vary by account and plan.
  - Calling the GitHub Copilot HTTP API directly with a token. This is undocumented for third-party extensions and bypasses the consent model. The `vscode.lm` API is the supported route.

## 4. Scope

- New:
  - A Copilot availability detector that returns a discriminated state.
  - Copilot state messages that name the host IDE.
  - Model-list refresh on `vscode.lm.onDidChangeChatModels`.
  - An auth-aware error vocabulary (`auth.kind` per provider).
  - A registry parity test and a "no API-key wording for keyless providers" test.
  - Per-provider verification columns in the research doc.
- Updates to existing:
  - Copilot error mapping (`copilot.ts`).
  - `errorHandler.ts` and `recovery.ts` classification.
  - `PROVIDER_CATALOG`, extended into the full registry.
  - All 12 duplicate lists, which become derived.
  - Provider adapters and default or fallback models, where the docs changed.
  - `docs/research/provider-contracts-2026-09.md`, README, wiki, and handbook provider pages.
  - A deviation note in `plans/provider-and-pro-modernization-execution.md` correcting the task 2.1 claim.
- Explicitly out of scope:
  - Adding or removing providers.
  - Pro entitlement changes.
  - Direct Copilot HTTP or token access.
  - Bumping `engines.vscode` or `@types/vscode` without approval.
  - Redesigning the UI beyond the state messages and the model list.
  - Live smoke tests for providers without maintainer credentials.
- Change policy: Scope changes (a new provider, an engine bump, a new dependency) stop work and need explicit user approval, recorded in the execution ledger's Deviations section.
- Cut line: every `must` task is above the line. Below the line: Task 3.4 (should), Task 5.4 (could), Task 2.5 (should).

## 5. Assumptions

| # | Assumption | Validated by |
|---|---|---|
| A1 | The "API key" message seen on generate comes from `errorHandler.ts` auth or permission wording applied to a Copilot LM error, or from a keyless-list mismatch. It does not come from `validateAndUpdateConfig`, because Copilot has `requiresApiKey: false`. | Task 1.2 captures the exact string and debug log. If the source differs, fix that path in Phase 2 and record it. |
| A2 | `vscode.LanguageModelError.code` values are available at the pinned `@types/vscode 1.101.0`, and the codes equal `LanguageModelError.NoPermissions().code`, `.Blocked().code`, and `.NotFound().code`. | **Validated 2026-09-22** at `@types/vscode@1.101.0` `index.d.ts:20163-20182`. `readonly code: string` exists; its values are error names or `Unknown`, with the real error in `cause`. Task 2.2 still compares against `LanguageModelError.X().code` rather than literals. |
| A3 | Copilot's models appear under `vendor: 'copilot'`, and whether Copilot Chat is installed can be read with `vscode.extensions.getExtension(...)`. The current extension ID, possibly `GitHub.copilot-chat`, or Copilot being built into newer VS Code, is not confirmed. | Task 2.1 checks the current VS Code and Copilot docs and the installed extension list in stable and Insiders before coding the ID check. If Copilot is built in, the detector relies on the `vscode.lm` state only. |
| A4 | In forks (Cursor, Windsurf, VSCodium), `vscode.lm` is missing, or `selectChatModels({vendor:'copilot'})` returns `[]` or throws. | Task 5.3 runs the smoke test in at least one fork. |
| A5 | `vscode.lm.onDidChangeChatModels` exists at the 1.101 API level. | **Validated 2026-09-22:** `lm.onDidChangeChatModels` (`index.d.ts:20363`), `maxInputTokens` (`:20078`), and `countTokens` (`:20114`) exist at 1.101. No engine bump is needed. |
| A6 | Every provider in `PROVIDER_CATALOG` has public docs listing its current endpoints and models. | Task 4.1. Providers without a public model list keep an explicit model-ID field. |
| A7 | Curated or default model IDs may be stale. For example, the Anthropic list contains `claude-opus-4-8` and `claude-fable-5`, while current Anthropic releases include Fable 5.1, Opus 5.5, Sonnet 5, and Haiku 4.5. | Task 4.1 checks against each provider's models documentation or `/models` endpoint. |

## 6. Phases & Tasks

### Phase 1: Baseline and reproduction
Checkpoint: the exact failing message and its code path are recorded, and failing regression tests exist. No production code has changed yet.

**Task 1.1 — Preserve worktree and record baseline**
- What: Capture the current state and confirm the baseline passes.
- How: Run `git status --short` and `git stash list`, and copy the output into a new ledger `plans/copilot-detection-and-provider-refresh-execution.md`. Then run `pnpm run compile-tests && pnpm test` and record the pass count. Do not reset, check out, or regenerate the lockfile.
- Where: GitMind-Pro root; the new ledger file.
- Depends on: None
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: The ledger lists the 3 uncommitted files and the baseline test count, and the tests pass. If they fail, record the failures as pre-existing.

**Task 1.2 — Reproduce "API key" message on Copilot generate**
- What: Find the exact user-facing string and the function that produced it.
- How: This task has two parts.
  - Automated (executor): write a scratch harness in `src/test/suites/copilotProvider.test.ts` that feeds each `LanguageModelError` factory and the current `copilot.ts` error strings through `formatSafeProviderError(..., 'GitHub Copilot')`. Record which ones produce "API key" text.
  - Manual (maintainer, per D3): the steps below. The executor writes the checklist into the ledger, and the maintainer fills in the results.
  1. Enable GitMind debug logging.
  2. Run the Extension Development Host (F5) in VS Code stable.
  3. Select GitHub Copilot and run `gitmind.generateCommitMessage` with staged changes, in each state you can create: Copilot signed in; Copilot Chat disabled; signed out; consent dialog cancelled.
  4. Record the message text, the debug log lines from `copilot.ts`, `errorHandler.ts`, and `index.ts`, and the `classifyGenerationFailure` result.
- Where: `src/services/api/copilot.ts`, `src/utils/errorHandler.ts`, `src/services/api/recovery.ts`, `src/services/api/index.ts`.
- Depends on: 1.1
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: The ledger has the automated mapping table (input error → formatted text → failure kind) and the maintainer's manual table (state, exact message, originating function). A1 is marked confirmed or refuted. If the manual results are not back yet, Phase 2 may start on the automated evidence alone, and A1 stays "automated-confirmed" until the manual table is filled in.

**Task 1.3 — Write failing regression tests**
- What: Tests that encode the correct behavior before any fix.
- How: Add `src/test/suites/copilotProvider.test.ts` with these cases:
  - (a) A stubbed `vscode.lm.selectChatModels` that throws `LanguageModelError.NoPermissions()`, `.Blocked()`, `.NotFound()`, and a generic error. Assert that the final `formatSafeProviderError(..., 'GitHub Copilot')` text contains no `/api key/i`.
  - (b) A stub that returns `[]`. Assert the "No Copilot models available" state.
  - (c) The `vscode.lm` property missing. Assert the "not detected in <appName>" state.
  - (d) For every keyless provider in the registry, a synthetic 401 or 403 error formats without "API key".

  Stub by injecting a small `LmAccess` interface into the detector rather than monkey-patching `vscode`.
- Where: `src/test/suites/copilotProvider.test.ts` (new).
- Depends on: 1.2
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: The new tests compile, fail on current `main` for the documented reason, and existing tests are unaffected.

### Phase 2: Copilot detection and messaging fix
Checkpoint: the Phase 1 tests pass. Generating with Copilot in VS Code works, or shows a state message with no "API key" text.

**Task 2.1 — Copilot availability detector**
- What: Replace the boolean `isCopilotAvailable()` with `detectCopilot(): Promise<CopilotState>`, where `CopilotState` is one of:
  - `{kind:'unsupported-host', appName}`
  - `{kind:'not-installed', appName}`
  - `{kind:'no-access'}` (not signed in, or consent denied)
  - `{kind:'no-models'}`
  - `{kind:'ready', models: LanguageModelChat[]}`
- How:
  1. `unsupported-host`: `typeof vscode.lm?.selectChatModels !== 'function'`.
  2. `not-installed`: the Copilot Chat extension is absent or inactive (extension ID confirmed per A3). Skip this check if Copilot is built in.
  3. Call `selectChatModels({vendor:'copilot'})`, only from user-initiated paths (commands and the Load Models button).
  4. An empty result gives `no-models`. A `LanguageModelError` with the NoPermissions code gives `no-access`.

  Read the host name from `vscode.env.appName`. Remove `isCopilotAvailable()` and update all callers, including `validation.ts:273`, the `copilot` validator, `validateCopilotAccess`, `fetchCopilotModels`, and `src/test/extension.test.ts:6-27` (which currently asserts the boolean export). Log each detection result with `diagnosticLog({subsystem:'provider', event:'provider.copilot_state', provider:'copilot', data:{kind, appName, modelCount}})`. Do not log model responses or account data.
- Where: `src/services/api/copilot.ts`, `src/services/api/validation.ts`, `src/test/extension.test.ts`.
- Depends on: 1.3
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: Test cases (b) and (c) pass, no caller of `isCopilotAvailable` remains (`grep` shows 0), and the type-check passes.

**Task 2.2 — Correct LanguageModelError mapping**
- What: Map LM errors through `.code` into a `ProviderApiError` with an explicit `category`, so pattern-matching on the message text is never needed.
- How: In `CopilotProvider.generateCommitMessage`, compare `error.code` to `vscode.LanguageModelError.NoPermissions().code`, `.Blocked().code`, and `.NotFound().code`. Throw a `ProviderApiError` with `provider: 'copilot'` and one of these categories:
  - `permission`, with the Copilot message "GitMind needs permission to use GitHub Copilot models. Run the command again and choose Allow."
  - `content-filter`
  - `configuration`, with the message "Selected Copilot model is not available to your account."

  For any other code, use `temporary-service` or `unknown` with a generic Copilot message. Delete the `constructor.name` branch. Either wire `handleCopilotError` into `handleAPIError` or delete it; do not leave dead code. When the code is `Unknown`, classify from `error.cause` and never echo the raw text.
  - Per D1: delete the cross-model retry at `copilot.ts:136-146`. A failure on the selected model is raised as-is. Model fallback happens only through the existing Pro `modelFallback` policy (`index.ts:645`), which applies only to `model-limit`.
  - Pass `{ justification: 'GitMind uses GitHub Copilot to write commit messages from your staged changes.' }` to every `sendRequest`.
- Where: `src/services/api/copilot.ts`, `src/utils/errorHandler.ts`.
- Depends on: 2.1
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when:
  - Test (a) passes for all 4 error variants.
  - `grep -n "constructor.name" src/services/api/copilot.ts` returns nothing.
  - A new test proves that a NoPermissions error on the selected model sends no request to any other model.
  - Every `sendRequest` call passes `justification`.

**Task 2.3 — Auth-aware user messaging**
- What: Make error wording depend on the provider's auth type, so keyless providers never mention API keys.
- How: Add an `auth` field to the registry (Task 3.1 finalizes it; for now add it to `PROVIDER_CATALOG`) with these kinds:
  - `apiKey`
  - `none-local` (Ollama, LM Studio)
  - `ide-session` (Copilot)
  - `cloud-credentials` (Bedrock, Vertex AI, and Azure in Entra mode)
  - `custom`

  `handleAuthenticationError` and the `permission` branch pick their wording from `auth.kind`. For example, `ide-session` produces "Sign in to GitHub Copilot in <appName> and allow GitMind access", and `cloud-credentials` produces "Check your AWS or Google credentials". The `errorHandler` functions take the provider ID, not the display name, so they can look up the registry.
- Where: `src/utils/errorHandler.ts`, `src/services/api/recovery.ts`, `src/config/providerCatalog.ts`, and callers of `formatSafeProviderError` in `src/commands/index.ts`.
- Depends on: 2.2
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: Test (d) passes for every keyless provider, and existing error-handling tests (`errorHandling.test.ts`, `nvidiaAndRecovery.test.ts`) still pass.

**Task 2.4 — Copilot model discovery in Settings and on generate**
- What: Load Models shows the models discovered from the IDE, or the state message. Generate uses the same detector.
- How:
  - `handleLoadCopilotModels` (`src/commands/index.ts:769`) posts `{state, models:[{id,name,family,maxInputTokens}]}`.
  - The webview `copilotModelsLoaded` handler (`messageHandlers.ts:27`) renders the state text instead of a generic error.
  - Set `copilot.liveDiscovery: true` in the catalog. The curated list becomes a fallback shown only when the state is `ready` and the stored model is missing.
  - Resolve `"auto"`: if the detected models include one whose id or family is `auto`, use it. Otherwise map `auto` to the first model from `getPreferredCopilotModelIds` that is present. Keep the user's stored selection.
  - Subscribe to `vscode.lm.onDidChangeChatModels` (per A5) to invalidate cached Copilot models and notify the open Settings webview.
  - In `generateMessageWithConfig`, call `detectCopilot()` before sending. Show the state message with an action that fits the state:
    - `not-installed`: "Find GitHub Copilot" (`workbench.extensions.search` with `GitHub Copilot`)
    - `no-access`: "Retry", which re-runs the command and so re-triggers the consent or sign-in prompt
    - `no-models` and `unsupported-host`: "Choose Another Provider" (opens Settings)
- Where: `src/commands/index.ts`, `src/services/api/copilot.ts`, `src/services/api/index.ts` (`generateMessageWithConfig`), `src/webview/settings/scripts/messageHandlers.ts`, `src/config/providerCatalog.ts`, `src/extension.ts` (subscription registration and disposal).
- Depends on: 2.1, 2.3
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when:
  - In VS Code with Copilot signed in, Load Models lists the account's models and a generation succeeds.
  - With Copilot Chat disabled, both Settings and Generate show "GitHub Copilot not detected in Visual Studio Code" (or the exact `appName`).
  - The provider tests pass.

**Task 2.5 — Copilot token-budget awareness**
- What: Use `model.maxInputTokens` and `model.countTokens` to truncate or warn before sending large diffs to Copilot.
- How: Before `sendRequest`, call `countTokens` on the prompt. If it exceeds `maxInputTokens`, reuse the existing diff-truncation path in `src/services/diffProcessor.ts` and raise an `input-limit` `ProviderApiError`.
- Where: `src/services/api/copilot.ts`.
- Depends on: 2.4
- Skills: None
- Parallel: yes
- Effort: S
- Priority: should
- Done when: A fixture test with a stub model that reports `maxInputTokens: 100` produces an input-limit message, not an opaque failure.

**Task 2.6 — Single-request Copilot Test Connection**
- What: Replace the loop over all models with the D2 behavior. This task was added in review to cover a quota-use defect.
- How: `validateCopilotAccess` calls `detectCopilot()`. If the state is not `ready`, return `{success:false, error:<state message>}`. Otherwise resolve the selected model with `resolveCopilotChatModel`, send one `LanguageModelChatMessage.User("ping")` with `justification`, read the first fragment, and cancel. Use a per-request `CancellationTokenSource` with a 10 s timeout, and clear the timer in `finally`. Map errors through Task 2.2.
- Where: `src/services/api/copilot.ts`, `src/services/api/validation.ts` (the `copilot` validator).
- Depends on: 2.2
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: A stub test with 5 models records exactly 1 `sendRequest` call, on the selected model. Non-`ready` states record 0 calls.

### Phase 3: Single provider registry
Checkpoint: the parity test passes, and no provider list, key flag, default model, or display name is defined outside `src/config/providerCatalog.ts`.

**Task 3.1 — Extend `PROVIDER_CATALOG` into the canonical registry**
- What: One typed record per provider holding: `displayName`, `auth` (Task 2.3), `settingKeys` (apiKey, url, model, extras), `docsUrl`, `apiKeyUrl`, `discovery` (`live` | `manual-id` | `ide`), `defaultModel`, `fallbackModels`, `validator` reference, and `pro: boolean`.
- How: Evolve `src/config/providerCatalog.ts`, keeping the `satisfies Record<...>` pattern and exporting helpers: `providerIds`, `requiresApiKey(id)`, `isKeyless(id)`, `getProviderEntry(id)`, and `serializeForWebview()`. Take today's values from `index.ts` `PROVIDER_CONFIGS`. Where the copies disagree, the catalog value wins and the conflict is logged in the ledger for Task 4.1.
- Where: `src/config/providerCatalog.ts`, `src/config/types.ts` (derive `ApiProvider` from `keyof typeof PROVIDER_CATALOG`).
- Depends on: 2.3
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: The type-check passes, and `providerCatalog.test.ts` asserts 23 entries, each with a complete record.

**Task 3.2 — Derive all consumers from the registry**
- What: Replace every duplicate listed in §2 with registry lookups.
- How: Work file by file, one commit-sized change each:
  - `index.ts` `PROVIDER_CONFIGS`: keep only `getProviderClass`, merged with registry data.
  - `validation.ts` `VALIDATOR_CONFIGS`: defaults come from the registry.
  - `settings.ts` lines 164, 204, 299: use `requiresApiKey(id)`.
  - `commands/index.ts` `API_KEY_PROVIDERS` and `hasApiKey`.
  - `onboardingManager.ts`: use provider IDs, not display names, and `isKeyless`.
  - `SecureKeyManager.getProvidersWithKeys`.
  - `StatusBanner.ts`.
  - `SettingsManager.ts`.
  - `SupportSessionService.ts:9` (support provider allowlist).
  - The provider lists in `SettingsMigrationService.ts`. Frozen historical migration maps may stay as dated literals, marked with a comment and added to the parity allowlist.
  - Webview scripts (`apiManager.ts`, `uiManager.ts`, `constants.ts`, `eventHandlers.ts`): embed `JSON.stringify(serializeForWebview())` the way `apiManager.ts` already embeds its config.

  Webview scripts are template strings, so pass the data in; do not import it inside the template.
- Where: the files named above.
- Depends on: 3.1
- Skills: None
- Parallel: no (shared registry; sequential commits reduce merge conflicts)
- Effort: L
- Priority: must
- Done when: `pnpm test` passes and the grep checks in Task 3.3 find no duplicates.

**Task 3.3 — Registry parity guard test**
- What: A test that fails if provider knowledge is duplicated again.
- How: Add to `providerCatalog.test.ts`:
  - (a) Read `src/**/*.ts` and fail if any file other than `providerCatalog.ts` holds a string-array literal with 3 or more registry provider IDs. Keep an explicit allowlist, with a reason for each entry, for the `loadProviderModule` switch and the provider icon map.
  - (b) Fail if a model-ID-looking literal that equals a registry default appears outside the registry.
  - (c) For each keyless provider, `getApiConfig` never reads `<id>.apiKey`.
  - (d) The `package.json` `gitmind.apiProvider` enum equals `Object.keys(PROVIDER_CATALOG)` as a set.
- Where: `src/test/suites/providerCatalog.test.ts`.
- Depends on: 3.2
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: The test passes now, and fails when a duplicate array is re-added in a scratch edit (verify once, then revert the scratch edit).

**Task 3.4 — Correct the prior ledger claim**
- What: Record that the earlier task 2.1 "no independent default lists" claim was inaccurate and is now resolved by this plan.
- How: Add a dated Deviations entry to `plans/provider-and-pro-modernization-execution.md` that points to this plan. Do not rewrite history rows.
- Where: `plans/provider-and-pro-modernization-execution.md`.
- Depends on: 3.3
- Skills: None
- Parallel: yes
- Effort: S
- Priority: should
- Done when: The entry exists and cites the Task 3.3 test.

### Phase 4: Provider and model refresh
Checkpoint: every provider row in the research doc has a verification date and source URLs, and the adapters and registry match those rows.

**Task 4.1 — Verify each provider against official docs**
- What: For each of the 23 providers, record the current base URL and API version, auth header and scheme, model-list endpoint, generation endpoint and request-shape changes, deprecations or retirements affecting current defaults, and a current recommended default plus 2–4 fallback model IDs.
- How: Use the official docs only: the provider docs site, or Context7 or the Microsoft Learn MCP for Azure. Where a public, keyless models endpoint exists (for example OpenRouter `/api/v1/models`), fetch it. Do not use third-party blogs as the authority. Batches can run in parallel:
  - A: OpenAI, Azure OpenAI, Anthropic, Gemini, Vertex AI
  - B: Mistral, Cohere, Together, OpenRouter, Groq, xAI Grok
  - C: DeepSeek, Perplexity, Z.ai, MiniMax, NVIDIA, Hugging Face
  - D: Bedrock, Cloudflare, Ollama, LM Studio, Copilot (VS Code LM API)

  Record the Task 3.1 value conflicts here too.
- Where: `docs/research/provider-contracts-2026-09.md`. Update the existing inventory table, adding `Verified`, `Sources`, `Default`, `Fallbacks`, and `Changes needed` columns. Do not create a new doc.
- Depends on: 1.1 (it can run alongside Phases 2 and 3)
- Skills: None
- Parallel: yes
- Effort: L
- Priority: must
- Done when: 23 of 23 rows have a 2026-09 verification date and at least one official source URL. Each `Changes needed` cell either lists concrete changes or says "none".

**Task 4.2 — Apply API changes to adapters**
- What: Apply each `Changes needed` item from Task 4.1.
- How: One provider per change, each with a request-shape fixture test in `aiProviders.test.ts` or `providerExpansion.test.ts`. Any change that needs a new dependency or an engine bump triggers a replan (§8) and user approval before it is applied.
- Where: `src/services/api/<provider>.ts`, `src/services/api/validation.ts`.
- Depends on: 4.1, 3.2
- Skills: None
- Parallel: yes (per provider, after 3.2)
- Effort: L
- Priority: must
- Done when: Every `Changes needed` row is marked applied with a test name, or explicitly deferred with the user's approval recorded.

**Task 4.3 — Update registry defaults and fallbacks, and migrate retired selections**
- What: Put the verified defaults and fallbacks in the registry only, and handle stored selections that are now retired.
- How:
  - Update `defaultModel` and `fallbackModels` in `providerCatalog.ts`.
  - In `src/services/migration/SettingsMigrationService.ts`, keep a stored model the user chose themselves even if it is not in the fallbacks, because live discovery is the authority. Only rewrite a stored value when it equals an old *shipped default* the provider documents as retired, and log the change through the existing migration notice. Save the previous value under `globalState` key `gitmind.migration.retiredModelPrevious` so the rewrite can be undone.
  - Update the static-list guard tests in `providerCatalog.test.ts`.
- Where: `src/config/providerCatalog.ts`, `src/services/migration/SettingsMigrationService.ts`, `src/test/suites/providerCatalog.test.ts`, `src/test/suites/configurationManagement.test.ts`.
- Depends on: 4.1, 3.1
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: No registry default is documented as retired, the migration tests cover "retired shipped default → new default" and "user custom value preserved", and `pnpm test` passes.

### Phase 5: Documentation, verification, release gates
Checkpoint: all gates pass and the smoke matrix is recorded.

**Task 5.1 — Update user-facing docs**
- What: Explain Copilot's requirements and states, and bring the provider and model docs up to date.
- How: Update the existing README provider section, wiki provider and Copilot pages, and the handbook provider reference. Copilot requirements are: VS Code or Insiders with GitHub Copilot signed in, the consent prompt, what each state message means, and that forks are unsupported unless Copilot is available. Then run `pnpm docs:export-product-surface && pnpm docs:sync-wiki && pnpm docs:validate`. Update pages in place; do not add new pages.
- Where: `README.md`, `wiki/`, `docs/handbook/`.
- Depends on: 2.4, 4.3
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: The docs validation passes, and the Copilot section lists all 5 states with the exact message text.

**Task 5.2 — Full release gate**
- What: Run the release checks and record the results.
- How: Run `pnpm test`, `pnpm privacy:validate`, `pnpm audit --prod --json`, `pnpm package:vsce`, `pnpm package:audit`, and `git diff --check`. Record the outputs in the ledger. Add a CHANGELOG entry under a new patch version; do not bump the version unless the user asks.
- Where: GitMind-Pro root, `CHANGELOG.md`, ledger.
- Depends on: 5.1, 3.3, 4.2
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: Every command exits 0, the test count is at least the baseline plus the new tests, and the audit shows 0 vulnerabilities (or the findings are explained).

**Task 5.3 — Manual Copilot smoke matrix**
- What: Real-host verification of Copilot behavior. Per D3, the executor writes the checklist and the maintainer runs it.
- How: Install the built VSIX in each host and state below, and record the message or generation result plus a screenshot path:
  - VS Code stable: signed in; Copilot disabled; signed out; consent cancelled.
  - VS Code Insiders: signed in.
  - Cursor, Windsurf, or VSCodium (at least one): Copilot absent.
  - Optional (should): VS Code Remote-SSH or WSL window, signed in. The LM API runs in the remote extension host.
  - For each signed-in row, also confirm the D2 Test Connection sends one request, and that a generation with a Copilot premium model shows the consent text from `justification`.
- Where: ledger smoke table.
- Depends on: 5.2
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: All rows match the expected state message or show a successful generation, and none contains "API key".

**Task 5.4 — Opt-in live provider smoke**
- What: A live generation call per provider for which the maintainer has credentials.
- How: Use the existing opt-in manual flow. Credentials stay only in SecretStorage and are never logged.
- Where: ledger.
- Depends on: 5.2
- Skills: None
- Parallel: yes
- Effort: M
- Priority: could
- Done when: Each attempted provider shows pass or fail with a sanitized error category.

## 7. Risks & Countermeasures

| Risk | Impact | Countermeasure |
|---|---|---|
| The real source of the "API key" message is a path other than A1 | The fix misses the bug | Task 1.2 reproduces the bug before any code changes, and test (d) covers all keyless providers generically |
| `LanguageModelError` codes or `onDidChangeChatModels` are missing at `@types/vscode 1.101` | Compile failure or an engine bump | Compare against the static factories. If the API is missing, fall back to the button refresh; an engine bump needs approval (§8) |
| The Copilot Chat extension ID has changed, or Copilot is built into VS Code | False "not installed" state | A3 is validated in Task 2.1. Treat `vscode.lm` results as the authority and the extension check as a hint only |
| `selectChatModels` is called on activation or background refresh | Unexpected consent prompts; violates the VS Code guideline | Call it only from commands and button handlers. `onDidChangeChatModels` only invalidates the cache |
| The registry refactor breaks the webview scripts, which are template strings with no type-checking | Settings UI breaks | `webviewScriptCompilation.test.ts` plus manual Settings load in Task 5.3; sequential per-file commits |
| Model defaults change again soon after release | Stale defaults | Live discovery is authoritative, defaults sit in one file, and each research doc row carries a verification date |
| Migration rewrites a user-chosen model | User frustration | Only rewrite values equal to retired shipped defaults; tests in Task 4.3 |
| The uncommitted dependency changes are lost | Lost work | Task 1.1 records them; never reset, check out, or regenerate the lockfile |
| Removing the Copilot cross-model retry (D1) makes some Free-tier generations fail where they used to "work" on another model | Visible regression for users whose selected model is unavailable | The `configuration` (NotFound) message names the missing model and offers "Choose Another Model". `auto` resolution (Task 2.4) still picks an available model. Documented in the CHANGELOG |
| The extension is installed through Remote-SSH, WSL, or Codespaces, and the LM API behaves differently there | False `unsupported-host` state | The detector checks the API's presence, not `appName`. The Task 5.3 optional remote row covers it. Diagnostics log `kind`/`appName` for support |
| The Test Connection timer or token leaks (existing code uses `setTimeout` without clearing it) | Late cancellation of unrelated work | Task 2.6 uses a per-request token and clears it in `finally` |
| Manual checklist results are delayed | Release blocked on real-host proof | Phases 2–4 can proceed on automated evidence. Only Task 5.3 gates the release, and the ledger shows it as pending, not passed |

## 8. Verification & Replanning

- Per task: its `Done when`, plus the type-check and lint for any code task, recorded in `plans/copilot-detection-and-provider-refresh-execution.md`.
- Overall: all §1 Done-when items, Task 5.2 gates, and the Task 5.3 matrix.
- Rollback:
  - Release: publish or reinstall the previous VSIX (6.1.2). Setting keys do not change (a Task 3.2 key change is a replan trigger), so the older version reads the same settings.
  - Retired-model rewrites (Task 4.3) can be undone from `gitmind.migration.retiredModelPrevious`.
  - Source: every phase ends in its own commit(s), so `git revert` works per phase.
- Monitoring and diagnosis:
  - `provider.copilot_state` diagnostic events (Task 2.1) and the existing `provider.generation_*` events with `ProviderApiError.category`.
  - Support reports include the Copilot state `kind` and `appName`, never content or tokens.
- Replan when:
  - Task 1.2 refutes A1 and the source is outside Phases 2 and 3.
  - Any needed API is newer than `engines.vscode ^1.101.0`.
  - Task 4.1 finds a provider that needs a new SDK or dependency, or a breaking auth change.
  - A provider has been shut down or no longer offers its API. Its removal needs user approval.
  - The Task 3.2 refactor changes stored setting keys.

## 9. Traceability

| Objective | Covered by tasks |
|---|---|
| Copilot never shows API-key messaging | 1.2, 1.3, 2.2, 2.3, 5.3 |
| Copilot models fetched from the IDE, or "not detected" shown | 2.1, 2.4, 2.5, 2.6, 5.3 |
| Copilot respects the user's model, quota, and Pro policy (review D1, D2) | 2.2, 2.6, 5.3 |
| Works or degrades cleanly in VS Code, Insiders, and forks | 2.1, 5.3 |
| Single registry, with no drift | 3.1, 3.2, 3.3, 3.4 |
| Providers match current docs and APIs | 4.1, 4.2, 5.4 |
| Models up to date without breaking selections | 4.1, 4.3 |
| Docs updated and release safe | 1.1, 5.1, 5.2 |

## 10. Handover Summary

- Context: The GitMind-Pro VS Code extension shows API-key wording when generating with GitHub Copilot. The causes are a broken `LanguageModelError` check (`constructor.name` instead of `.code`), auth wording that ignores whether a provider needs a key, and about 12 drifting provider lists. The user also wants every provider checked against its current docs and models.
- Decisions:
  - Target repo: GitMind-Pro.
  - Supported hosts: VS Code stable and Insiders, plus forks, which must show "not detected".
  - Scope: fix Copilot, build the single registry, and run the full provider and model refresh.
  - No engine bump and no new dependencies without approval.
  - D1: no Copilot cross-model retry; Pro fallback policy only.
  - D2: Test Connection sends one request to the selected model.
  - D3: the maintainer runs the manual host checklist.
  - The existing research doc is updated in place.
- State: done: investigation, this plan, and the expert review (r2). Pending: all tasks. Blocked: none.
- Remaining tasks: Phase 1 (1.1–1.3), Phase 2 (2.1–2.6), Phase 3 (3.1–3.4), Phase 4 (4.1–4.3), and Phase 5 (5.1–5.4), with what, how, and where as listed in §6.
- Verification: Phase checkpoints, the new tests (`copilotProvider.test.ts` and the parity guards), Task 5.2 gates, and the Task 5.3 smoke matrix.
- Risks and how to detect them early:
  - Task 1.2 confirms the true message source before any changes.
  - A type-check at the start of Task 2.2 catches missing API types.
  - The Task 3.3 parity test catches drift.
  - The webview compile test and a manual Settings load catch UI breakage.

## 11. Review appendix

- Findings (applied in r2):
  - **R1 (high, proven):** The Copilot cross-model retry swallowed permission and content-filter errors, changed the user's model, and bypassed the Pro fallback gate. Fixed in Task 2.2 per D1.
  - **R2 (medium, proven):** Test Connection sent prompts to many models and could use up premium requests. Added Task 2.6 per D2.
  - **R3 (medium, proven):** Missing consent `justification`. Added to Task 2.2.
  - **R4 (medium, proven):** The duplicate inventory missed `SupportSessionService.ts`, `SettingsMigrationService.ts`, and the `package.json` `apiProvider` enum. Added to Task 3.2 and Task 3.3(d).
  - **R5 (medium, proven):** Removing `isCopilotAvailable` would break `src/test/extension.test.ts:6-27`. Added to Task 2.1.
  - **R6 (medium):** An agent executor cannot do the manual IDE steps. Tasks 1.2 and 5.3 were split into automated and maintainer parts per D3.
  - **R7 (low):** No rollback or monitoring was defined. Added to §8; Task 4.3 now saves the previous value.
  - **R8 (low):** Fork and remote hosts. An optional remote row was added to Task 5.3. The detector keys on the API's presence, not the host name.
  - **R9 (UX):** State messages now carry state-specific actions (Task 2.4).
- Decisions: D1, D2, and D3 in §2. Earlier user decisions (target repo, IDE set, full-refresh scope) are preserved. Task IDs 1.1–5.4 are preserved; 2.6 was added (reason: R2). No tasks were dropped.
- Remaining risks:
  - The source of the "API key" message is confirmed by the automated harness only until the maintainer's manual table is filled in (A1).
  - The Copilot Chat extension ID, or whether Copilot is built in, is still unverified (A3). The detector treats it as a hint only.
  - Provider documentation can change again after Task 4.1.
- Applicable checks and evidence:
  - A2 and A5 were checked against the pinned `@types/vscode@1.101.0` type definitions.
  - The VS Code LM guide was fetched on 2026-09-22 (consent comes from a user action; errors are identified by `err.code`).
  - Code references were verified by grep and read in GitMind-Pro on 2026-09-22.
  - Every task has the full contract fields, and the cut line is intact: Tasks 2.5 and 3.4 are should, 5.4 is could.
- Non-applicable checks and reasons:
  - Load and performance testing: the extension makes one request per user action.
  - Data-store migration beyond VS Code settings: there is no other persistence.
  - Accessibility audit of new UI: only native VS Code notifications are added, and they inherit VS Code's accessibility.
- Blockers and resolution needed: none.

