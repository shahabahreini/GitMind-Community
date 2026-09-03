# Plan: Provider, Dependency, and Pro-Feature Modernization

| Field | Value |
|---|---|
| Objective | Modernize GitMind's dependencies, provider integrations, model discovery, and Pro entitlements without breaking supported free or Pro workflows. |
| Status | Ready for review |
| Version | 2026-09-02 |
| Created | 2026-09-02 |

## 1. Objective & Definition of Done

- Goal: Replace stale provider contracts and hard-coded model catalogues with verified, capability-aware behavior; remove unsupported free-user choices; and prove every advertised Pro feature is correctly gated, usable, and recoverable.
- Done when: every supported provider has a documented, tested contract; model choices are obtained from the provider or the local runtime whenever an authoritative discovery API exists; the remaining fallbacks are verified, text-generation-capable, and centrally owned; legacy persisted selections migrate safely; all advertised Pro operations have both UI and host-side authorization; and package, documentation, and tests agree.
- Success measures: a clean `check-types`, lint, package build, compiled-test validation, extension integration run, production dependency audit, contract-fixture suite for all 18 provider routes, and a Free/Pro entitlement matrix with no unguarded Pro operation or false denial.
- Must not happen: overwrite the existing uncommitted `package.json`/`pnpm-lock.yaml` work; silently change a user's explicit provider/model; send secrets or diffs to a new destination; grant Pro from editable configuration alone; or replace a working provider merely because its model name is old.

## 2. Context & Constraints

- Background: GitMind is a VS Code extension (`ai-commit-assistant` 6.1.1) with 18 provider adapters under `src/services/api/`, duplicated model data in the extension manifest, configuration, types, webview, migrations, and tests, plus one-time-license/legacy-entitlement flows.
- Constraints:
  - Preserve the dirty manifest and lockfile changes already present; inspect and either retain or deliberately supersede them in a dedicated commit.
  - Use provider-owned documentation and live account-specific discovery, not third-party model blogs or global hard-coded lists, as the authority.
  - Do not make network calls merely to populate UI until an API key is present and the user has initiated the action; do not persist keys, returned models, or model metadata unencrypted unless the current Free behavior explicitly permits it.
  - Treat model availability as account-, region-, plan-, and policy-dependent. A model returned by one account is not a universal fallback.
  - Preserve custom endpoints and local Ollama behavior; they cannot be validated against a single hosted vendor catalogue.
- Stakeholders: Free users selecting a reliable no-cost/local provider; Pro customers relying on paid capability and encrypted credentials; maintainers handling releases and provider churn; provider accounts and policies; support staff diagnosing licences without exposing secrets.
- Evidence collected before this plan:
  - `tsc --noEmit` and ESLint pass at baseline.
  - `pnpm run test:validate` fails because expected compiled `out/**.test.js` files are missing; the validator is being run without the compile step it requires.
  - `pnpm audit --prod --json` reports no production vulnerabilities.
  - `pnpm outdated` reports newer `@types/node` (24.13.3 to 26.4.1), `@types/vscode` (1.101.0 to 1.136.0), and TypeScript (5.9.3 to 7.0.2).
  - `src/config/providerCatalog.ts`, `package.json`, `src/config/types.ts`, API adapters, webview defaults, settings migrations, and tests carry overlapping model lists. `src/services/api/huggingface.ts` still posts to the retired `api-inference.huggingface.co/models/{id}` shape.
  - `src/utils/proHelpers.ts` is intended as the entitlement authority, but entitlement checks and legacy provider terminology remain duplicated in subscription, encryption, command, and webview layers.

## 3. Strategy

- Chosen path: Establish a single internal provider-contract registry with capability metadata and discovery adapters; make live/local discovery the source of selectable models; retain a small, explicitly versioned fallback only where discovery is unavailable; migrate stored selections at runtime; then harden each Pro feature behind one host-authoritative entitlement decision and prove the cross-product with automated tests.
- Why it wins: It stops catalogue drift at the ownership boundary instead of repeatedly editing static UI arrays, respects account-specific availability, keeps current users functional offline, and lets a provider update be a small contract/fixture change instead of a repository-wide search-and-replace.
- Alternatives rejected:
  - Updating all visible model strings by hand: immediately becomes stale again and cannot account for account availability.
  - Removing all fallbacks: breaks first-run, offline, and discovery-failure UX.
  - Letting the webview decide entitlement: browser-side state is presentation only and cannot secure command or service entry points.
  - Raising all library versions in one untested commit: makes regressions and rollback attribution needlessly difficult.

## 4. Scope

- New:
  - A canonical provider-contract/model-capability registry, discovery result normalizer, migration ledger, fixture-driven contract tests, and a checked-in provider-reference snapshot with source URLs and verification date.
  - A Pro-feature authorization matrix and automated Free/Pro/legacy/invalid-license integration suite.
  - Release gates that compile tests before validation and record dependency/provider contract verification.
- Optional provider admissions, evaluated only through the evidence gate in Task 1.4: LM Studio (local/free), Azure OpenAI, Amazon Bedrock, Google Vertex AI, and Cloudflare Workers AI.
- Updates to existing:
  - Provider adapters, API factory, settings/schema defaults, UI selectors, migrations, documentation, dependencies, licence/encryption helpers, and current tests.
- Explicitly out of scope:
  - Adding a provider outside the approved shortlist, changing pricing/plan benefits, changing the one-time licence business model, issuing refunds, or sending production requests using customer keys.
  - Replacing the custom-provider protocol beyond security and compatibility fixes required by its existing advertised behavior.
- Change policy: each provider or dependency change must be independently reviewable and revertible. Add no model to a static fallback unless the provider has no usable discovery endpoint and its exact ID/capability is confirmed in that provider's official source on the day of implementation. Record exceptions with an owner and revalidation date.

## 5. Assumptions

| # | Assumption | Validated by |
|---|---|---|
| A1 | The 18 values in `ApiProvider` are the currently supported product surface. | Compare `ApiProvider`, `PROVIDER_CONFIGS`, manifest `gitmind.apiProvider`, onboarding, and docs; reconcile before edits. |
| A2 | Direct provider keys may be used only for user-triggered validation/model discovery. | Existing privacy policy, UI copy, and manual test with redacted test accounts. |
| A3 | A current provider response can identify text-generation compatibility well enough to filter a commit-message picker. | Per-provider fixture plus official capability metadata; if not exposed, use a verified fallback and label discovery as unsupported. |
| A4 | A valid licence must remain the sole source of Pro access, including grandfathered licences. | License activation/validation/migration tests and review of `proHelpers`, `LegacyEntitlementService`, and `SecureKeyManager`. |
| A5 | VS Code/TypeScript upgrades can be adopted without increasing the published VS Code minimum until the compatibility suite proves the intended engine floor. | Compile/package/test against the current declared engine and inspect release/API compatibility notes. |
| A6 | Existing uncommitted package and lockfile changes were intentional. | Diff review with repository owner before version changes are amended or committed. |

## 6. Phases & Tasks

### Phase 1: Freeze the baseline and establish authorities

Checkpoint: the executor can name every shipped provider, model-data owner, Pro feature, and baseline failure without relying on an inferred list.

**Task 1.1 — Preserve and reproduce the current baseline**
- What: Snapshot the dirty worktree and produce a reproducible diagnostic baseline without modifying product sources.
- How: Record `git status`, targeted diffs for `package.json` and `pnpm-lock.yaml`, installed Node/pnpm versions, lockfile integrity, package scripts, audit results, and compile/lint/test results. Run the documented test compile step before `test:validate` to distinguish a workflow defect from broken tests.
- Where: repository root; `package.json`; `pnpm-lock.yaml`; `scripts/test-validator.js`; `docs/TESTING_GUIDE.md`.
- Depends on: N/A.
- Parallel: Yes, with Task 1.2 after the worktree snapshot.
- Effort: Small.
- Priority: P0.
- Done when: baseline evidence and the reason for every failing command are recorded; no user change is overwritten.

**Task 1.2 — Produce the provider and entitlement inventory**
- What: Make a machine-readable inventory of each provider, model source, request route, response parser, API-key check, model discovery capability, documentation page, UI entry, config key, migration, and tests; separately enumerate every advertised Pro operation.
- How: Trace from `ApiProvider`/`PROVIDER_CONFIGS` through `loadProviderModule`, `getProviderInstance`, settings/onboarding, manifest contributions, and command handlers. Map Pro settings and UI controls to the command/service operation that actually performs work, then mark host-side guard present/missing/not applicable.
- Where: `src/config/types.ts`, `src/config/providerCatalog.ts`, `src/config/settings.ts`, `src/services/api/**`, `src/commands/**`, `src/webview/**`, `src/services/{subscription,encryption,ai,changelog}/**`, `package.json`, and `src/test/**`.
- Depends on: Task 1.1.
- Parallel: Yes, with Task 1.3.
- Effort: Medium.
- Priority: P0.
- Done when: the checked-in inventory has exactly one row per provider and one row per Pro operation, with no orphan provider/configuration/feature discovered later in Phase 2 or 4.

**Task 1.3 — Verify official provider contracts and supported model discovery**
- What: Replace assumptions about model names, endpoints, parameters, and deprecations with provider-owned evidence.
- How: For each row in the inventory, capture the exact current endpoint, authentication header, request/response fields, pagination, capability fields, deprecation notice, and availability limitation. Use authenticated discovery only with maintainer-controlled test credentials and redact responses. Store URL, retrieval date, and fixture provenance; never ship a whole fetched account catalogue as a public fixture.
- Where: new `docs/research/provider-contracts-YYYY-MM.md` and redacted fixtures under `src/test/fixtures/providers/`.
- Depends on: Task 1.2.
- Parallel: Yes, by independent provider groups; merge through one schema owner.
- Effort: Large.
- Priority: P0.
- Done when: every provider has one of `live-discovery`, `local-discovery`, `verified-static-fallback`, or `custom-user-supplied` with official evidence and a defined failure path.

**Task 1.4 — Decide the provider-admission shortlist before expanding the surface**
- What: Turn the brainstormed candidates into an explicit product decision rather than adding overlapping endpoints opportunistically.
- How: Score each candidate against differentiated user value, authentication/security burden, reliable model discovery, no-key/local Free path, capability compatibility, privacy/residency needs, testability without customer data, ongoing maintenance, and overlap with the current 18 providers. Build a proof-of-contract spike only after approval; it must exercise discovery, one text-generation request, revoked/empty credentials, cancellation, and secret redaction. Reject candidates whose only benefit is a model already reachable through an existing direct provider or aggregator.
- Where: the Phase 1 inventory, `docs/research/provider-admission-YYYY-MM.md`, product/provider documentation, and new adapter fixtures only after a candidate passes the decision gate.
- Depends on: Tasks 1.2–1.3.
- Parallel: Yes; independent evidence gathering, one final product decision.
- Effort: Medium.
- Priority: P1.
- Done when: each candidate is marked `admit now`, `defer`, or `reject`, with official references, compatibility evidence, user-value rationale, maintenance owner, and a rollback path.

Provider-admission brainstorm and recommendation:

| Candidate | Recommendation | Why it is differentiated | Admission conditions |
|---|---|---|---|
| LM Studio | Admit first | A first-class local, no-key Free path for users who run models through LM Studio rather than Ollama; its local server exposes REST and OpenAI-compatible APIs. [Official docs](https://lmstudio.ai/docs/app) | Discover loaded local models, default to loopback only, show explicit LAN-risk warning before a non-loopback URL, never require Pro/custom-provider configuration, and reuse the OpenAI-compatible request normalizer without assuming a cloud model ID. |
| Azure OpenAI / Microsoft Foundry | Admit second | Direct OpenAI is already supported, but Azure adds organization-owned endpoints, regional deployments, API-key and Microsoft Entra authentication. [Microsoft reference](https://learn.microsoft.com/en-us/rest/api/microsoft-foundry/azureopenai/chat) | Support deployment name versus model display name, endpoint/API version configuration, key and Entra credential flows without storing refresh tokens unsafely, tenant/region errors, and enterprise proxy/TLS behavior. |
| Amazon Bedrock | Admit third | Adds AWS IAM, region/cross-region controls, Guardrails, and a unified Converse interface across vendors—an enterprise route no existing adapter supplies. [AWS APIs](https://docs.aws.amazon.com/bedrock/latest/userguide/apis.html) | Use AWS credential-provider/SigV4 rather than manually handling long-lived secrets; make region/profile explicit; query model/API support; guard against unsupported model-specific fields; do not promise every Bedrock model works through one endpoint. |
| Vertex AI | Admit fourth | Direct Gemini API keys do not cover Google Cloud IAM, project/region controls, or Application Default Credentials used by enterprise GCP deployments. [Vertex quickstart](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/start/quickstart) | Prefer ADC/gcloud and system credential discovery over raw service-account JSON; require project/location selection; distinguish Vertex model availability from Gemini Developer API availability; test no-credential and permission-denied paths. |
| Cloudflare Workers AI / AI Gateway | Admit fifth, if low-cost developer/free access is a product priority | Provides a Cloudflare-account model catalogue, a free daily allocation, local/third-party routing, and OpenAI-compatible endpoints. [REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/) | Require account ID and scoped API token; load models through the documented model-search API; make Cloudflare logging/cache behavior and paid-model billing visible before requests; offer it as an explicit provider, not a hidden proxy. |
| Cerebras | Defer | Has an official public models endpoint with useful capability metadata and can be very fast, but overlaps Groq, Together, OpenRouter, and existing open-model routes. [Models API](https://inference-docs.cerebras.ai/api-reference/models/public-models) | Admit only if user demand or performance benchmarks show a material advantage for commit generation. |
| Fireworks AI and SambaNova | Defer | Both offer OpenAI-compatible inference, but their primary differentiated value is dedicated/private deployment or enterprise capacity; their hosted model choice overlaps current aggregators. [Fireworks](https://docs.fireworks.ai/tools-sdks/openai-compatibility), [SambaNova](https://docs.sambanova.ai/docs/api-reference/chat-completions/create-chat-based-completion) | Admit only with a documented target customer needing their account/deployment controls or a benchmarked quality/latency advantage. |

Official sources to use as the implementation authority (not a permanently copied model list):

| Provider group | Primary reference and implementation implication |
|---|---|
| OpenAI | [Models API](https://platform.openai.com/docs/api-reference/models/object?lang=curl) and [model catalogue](https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4): list account-available models and choose the current supported generation API/parameters per capability. |
| Gemini | [Models API](https://ai.google.dev/api/models) and [deprecation schedule](https://ai.google.dev/gemini-api/docs/deprecations?hl=en): paginate `models.list`, filter by supported generation method, and migrate shut-down aliases. |
| Anthropic and MiniMax | [Anthropic model overview](https://docs.anthropic.com/en/docs/about-claude/models/overview) and [MiniMax text models](https://platform.minimax.io/docs/api-reference/api-overview): use Messages-compatible contracts only when the selected model supports them. |
| Mistral and Cohere | [Mistral models endpoint](https://docs.mistral.ai/api/endpoint/models) and [Cohere models](https://docs.cohere.com/docs/models): filter returned capabilities for chat/text generation. |
| Together, OpenRouter, Groq, Perplexity | [Together Models](https://docs.together.ai/reference/models), [OpenRouter Models API](https://openrouter.ai/docs/api/api-reference/models/get-models), [Groq supported models](https://console.groq.com/docs/models), and [Perplexity list models](https://docs.perplexity.ai/api-reference/models-get): use provider metadata and current account availability, not bundled names. |
| Hugging Face and Ollama | [HF Inference Providers Hub API](https://huggingface.co/docs/inference-providers/en/hub-api) and [Ollama `/api/tags`](https://docs.ollama.com/api/tags): migrate HF from the retired inference endpoint; list local Ollama tags without a remote curated list. |
| DeepSeek, Z.ai, xAI, NVIDIA | [DeepSeek API updates](https://api-docs.deepseek.com/updates/), [Z.ai chat completion](https://docs.z.ai/api-reference/llm/chat-completion), the current xAI API reference in its developer console, and [NVIDIA LLM APIs](https://docs.api.nvidia.com/nim/reference/llm-apis): validate model aliases, reasoning controls, endpoint family, and model-specific availability before retaining a fallback. |
| GitHub Copilot and custom | [VS Code Language Model API](https://code.visualstudio.com/api/extension-guides/ai/language-model): query VS Code/Copilot at user action time, honor consent and empty selections, and keep custom endpoints user-defined. |

### Phase 2: Replace scattered catalogue logic with capability-aware discovery

Checkpoint: a provider appears once in the canonical registry and all model pickers resolve through the same discovery/migration path.

**Task 2.1 — Define the canonical provider contract and capability model**
- What: Introduce a single typed registry describing provider identity, auth, endpoint family, discovery strategy, generation method, supported parameter mapping, model capabilities, fallback policy, and documentation link.
- How: Replace the untyped/diffuse `ProviderCatalogEntry` data with discriminated provider definitions and a normalized `DiscoveredModel` containing ID, display name, text-generation eligibility, context/output limits when known, parameter support, status, source, and retrieval timestamp. Keep UI labels separate from model IDs. Make provider factory registration derive from this registry rather than a parallel switch where practical; preserve lazy loading.
- Where: `src/config/providerCatalog.ts`, `src/config/types.ts`, `src/services/api/index.ts`, provider adapters, settings/UI model helpers, and new `src/services/providers/` modules if extraction reduces duplication.
- Depends on: Tasks 1.2–1.3.
- Parallel: No; it is the compatibility seam for Tasks 2.2–2.4.
- Effort: Large.
- Priority: P0.
- Done when: TypeScript exhaustiveness requires a decision for every provider; no consumer owns an independent default/curated list; unknown provider/model states have explicit user-safe errors.

**Task 2.2 — Implement authoritative discovery, filtering, caching, and failure UX**
- What: Make provider/model selection accurate for the current user without sending unusable models to generation.
- How: Implement adapter-owned discovery for hosted providers, local tag discovery for Ollama, runtime VS Code language-model discovery for Copilot, and explicit custom model input. Follow pagination; filter non-text/non-chat models using documented capabilities; preserve model IDs exactly; debounce/cancel stale UI requests; cache only minimal non-secret results with expiry and invalidate after key/provider change. On permission, network, empty-list, or unsupported-discovery failure, show source and retry guidance, then offer only a verified fallback or preserved configured model—never an invented model.
- Where: `src/services/api/{openai,gemini,anthropic,mistral,cohere,together,openrouter,minimax,copilot,deepseek,grok,groq,perplexity,zai,nvidia,huggingface,ollama}.ts`, `src/commands/index.ts`, `src/webview/settings/**`, and `src/webview/onboarding/**`.
- Depends on: Task 2.1.
- Parallel: Yes, split adapter groups after common interfaces/tests land.
- Effort: Large.
- Priority: P0.
- Done when: fixture and manual tests prove discovery filtering, pagination, cancellation, empty account result, revoked key, rate limit, and offline fallback for every strategy class.

**Task 2.3 — Remove stale static models and migrate persisted choices safely**
- What: Remove unsupported hard-coded model IDs from Free-visible selectors and eliminate duplicated lists without discarding existing configurations.
- How: Centralize defaults/fallbacks in the registry. Delete stale `enum`, union, config, webview, migration, test, and error-message references only after contract verification. On startup/settings load, resolve stored IDs in this order: currently discoverable exact ID; documented provider alias/replacement; retained verified fallback; user-visible “choose a model” state. Persist a migration record/version and display a non-blocking notice that names the old and new ID. Preserve custom, Ollama, and unknown user-entered models rather than coercing them.
- Where: `package.json`, `src/config/{providerCatalog,settings,types}.ts`, `src/services/api/**`, `src/webview/settings/scripts/**`, `src/webview/settings/components/**`, `src/services/migration/SettingsMigrationService.ts`, onboarding, docs, and tests.
- Depends on: Task 2.2.
- Parallel: Yes, documentation/tests after migration design is approved.
- Effort: Large.
- Priority: P0.
- Done when: a repository-wide model-ID scan finds only canonical registry entries, deliberate backward-compatibility aliases, or test fixtures; a Free user cannot select a retired/unsupported bundled model; an existing selection is never silently lost.

**Task 2.4 — Align generation requests with model capabilities**
- What: Prevent a newly discovered/current model from failing because the adapter sends obsolete parameter names or unsupported sampling fields.
- How: Route `temperature`, `topP`, `topK`, token ceilings, reasoning/thinking controls, and response parsing through the normalized capability model. Select the provider's documented generation endpoint rather than assuming Chat Completions is universal; retain API-specific response parsers and errors. Correct the Hugging Face integration to its supported Inference Providers path and verify the selected model/provider route. Do not expose a Pro override when the chosen model/provider rejects it; explain why and retain the setting for compatible models.
- Where: `src/services/api/**`, `src/services/api/index.ts`, `src/services/api/validation.ts`, `src/services/api/recovery.ts`, `src/webview/settings/components/renderers/ProFeatureRenderer.ts`, and advanced-model tests.
- Depends on: Tasks 2.1–2.3.
- Parallel: Yes, per adapter after shared option mapper is merged.
- Effort: Large.
- Priority: P0.
- Done when: recorded request fixtures assert endpoint, headers, body, response parsing, retry classification, and model-specific option omission for each provider; unsupported options never produce a request.

### Phase 3: Upgrade the platform and dependencies safely

Checkpoint: the extension builds, packages, and runs against its declared VS Code baseline with only intentional dependency changes.

**Task 3.1 — Stage dependency, TypeScript, and VS Code API upgrades**
- What: Update outdated packages while preserving the extension's supported editor/runtime floor.
- How: Review release notes and peer compatibility for `@types/node`, `@types/vscode`, TypeScript 7, ESLint/TypeScript-ESLint, test tooling, build tooling, and runtime dependencies. Upgrade in small lockfile-backed batches; run `pnpm install --frozen-lockfile`, typecheck, lint, tests, package, and VSIX audit after each. Do not raise `engines.vscode` or Node requirements unless code/API use and supported-host testing require it; document the rationale if raised.
- Where: `package.json`, `pnpm-lock.yaml`, `esbuild.js`, `tsconfig*.json`, ESLint configuration, and CI/release documentation.
- Depends on: Task 1.1; may run alongside Phase 2 after baseline isolation.
- Parallel: Yes, but serialize manifest/lockfile writes.
- Effort: Medium.
- Priority: P1.
- Done when: approved version changes have release-note evidence, reproducible installation, no audit findings, and complete build/test/VSIX evidence.

**Task 3.2 — Repair the test and release gates**
- What: Make the validation command reliable in a fresh clone and prevent publishing a package that was not actually tested.
- How: Change script order or validator expectations so test compilation occurs before compiled-artifact checks; remove stale expected paths only if the active test topology proves them obsolete. Add a CI/local release sequence that runs test compilation, validator, unit/integration tests, docs/privacy checks, production package, and `package:audit`. Ensure generated `out/`/`dist/` are not committed unless repository policy requires them.
- Where: `package.json`, `scripts/test-validator.js`, CI configuration if present, `docs/TESTING_GUIDE.md`, and `docs/handbook/Maintainer-Guide.md`.
- Depends on: Task 1.1.
- Parallel: Yes, with Task 3.1.
- Effort: Medium.
- Priority: P1.
- Done when: `pnpm run test:validate` succeeds from a clean checkout through the documented command and fails meaningfully when a required test is absent.

### Phase 4: Make every Pro feature host-authorized and robust

Checkpoint: entitlement is computed once, UI state is only a reflection of it, and every capability has Free/Pro proof.

**Task 4.1 — Consolidate entitlement semantics and licence lifecycle**
- What: Establish one authoritative entitlement result for current, legacy/grandfathered, invalid, expired, network-error, deactivated, and device-limit states.
- How: Define a typed `Entitlement` state/result owned by `proHelpers`/subscription domain; make subscription, activation, encryption, commands, status bar, and webview consume it rather than re-derive from mutable configuration. Remove stale LemonSqueezy/subscription terminology and unreachable branches only after license-provider behavior is verified. Preserve legacy migration and device deactivation/add-on flows with idempotency, cancellation, clock/TTL boundaries, and redacted logging.
- Where: `src/utils/proHelpers.ts`, `src/services/subscription/{SubscriptionManager,GitMindLicenseService,ProActivationService,LegacyEntitlementService,ProNotificationService}.ts`, `src/services/encryption/SecureKeyManager.ts`, `src/extension.ts`, and settings/status components.
- Depends on: Task 1.2.
- Parallel: No; it is the security boundary for Tasks 4.2–4.3.
- Effort: Large.
- Priority: P0.
- Done when: no code grants Pro solely from `subscription.plan`, `subscription.status`, or a webview value; legacy entitlement migration is lossless and revocation/downgrade takes effect everywhere without restart where feasible.

**Task 4.2 — Audit and enforce each advertised Pro capability at the operation boundary**
- What: Ensure Free users cannot execute Pro actions through commands, message handlers, settings edits, cached webview state, or direct service calls; ensure paid users can use each advertised feature.
- How: Build an authorization matrix covering: encrypted key storage and migration; custom provider; advanced model options; retry/model fallback; summary/body limits; target language; Gitmoji/custom emojis; commit-history learning; changelog generation and overwrite; multi-candidate generation; Commit Health; Composer and hunk splitting; pre-commit review/blocking; support-session actions; and any additional Pro-labelled UI/configuration found in Task 1.2. Put `assertEntitled(feature)` immediately before the effectful host operation, not only before rendering. Keep disabled controls informative and preserve their settings, but make Free behavior deterministic and safe.
- Where: `src/commands/**`, `src/services/{api,ai,changelog,encryption}/**`, `src/commit-intelligence/**`, `src/webview/settings/MessageHandler.ts`, renderers/scripts, and `package.json` settings contributions.
- Depends on: Task 4.1.
- Parallel: Yes, feature groups may be hardened independently after the shared guard is merged.
- Effort: Large.
- Priority: P0.
- Done when: static trace review finds no unguarded effectful Pro path; each matrix row passes tests for Free deny/no side effect, valid Pro allow, invalid/expired deny, legacy allow when active, and Dev mode only where explicitly permitted in non-production builds.

**Task 4.3 — Harden encrypted credential and downgrade behavior**
- What: Keep keys accessible only through intended secure storage for Pro users while making Free/Pro transitions recoverable and non-destructive.
- How: Test secret storage availability, opt-in encryption, plaintext-to-secret migration, partial migration rollback, key rotation/delete, cache invalidation, disabled encryption, licence revocation, downgrade, and reactivation. Never log actual key values or include them in support reports. Define a user-confirmed export/recovery path if existing encrypted values would otherwise become inaccessible after an entitlement change.
- Where: `src/services/encryption/SecureKeyManager.ts`, subscription services, settings message handling, support-report sanitization, and encryption/entitlement tests.
- Depends on: Tasks 4.1–4.2.
- Parallel: No; changes touch the same state transitions.
- Effort: Medium.
- Priority: P0.
- Done when: fault-injection tests prove no key loss, plaintext leak, or Free-to-Pro/Pro-to-Free authorization bypass; support output is secret-free.

### Phase 5: Verify real product behavior and release safely

Checkpoint: all tests represent customer-visible behavior and the release candidate has a reversible rollback path.

**Task 5.1 — Build provider contract and migration test suites**
- What: Make provider/model modernization regression-proof without requiring a production key in CI.
- How: Use redacted recorded fixtures plus mock fetch/VS Code language-model responses to test list pagination, capability filters, missing fields, deprecated aliases, selected-model persistence, model migration, option mapping, response parsing, and normalized errors. Add opt-in manual smoke scripts for each provider with environment-only test keys; redact output and make them non-default. Cover custom endpoint and offline Ollama separately.
- Where: `src/test/suites/aiProviders.test.ts`, provider-specific suites, new provider fixtures, `src/test/suites/{configurationManagement,settingsUI,extensionCommands}.test.ts`, and test documentation.
- Depends on: Phase 2.
- Parallel: Yes, alongside feature tests.
- Effort: Large.
- Priority: P0.
- Done when: every inventory provider has automated contract coverage and a documented manual verification status; CI needs no paid key to validate request correctness.

**Task 5.2 — Execute the Pro and release acceptance matrix**
- What: Validate end-to-end behavior across entitlement and provider states, then package a reversible release candidate.
- How: Run the 5-state entitlement matrix (Free, valid Pro, active legacy, invalid/expired, offline/network error) against every Pro capability and primary Free flow. Test fresh install, pre-upgrade configuration, in-place upgrade/migration, copied workspace configuration, corrupted cache, provider key change, account model removal, and extension reload. Build a VSIX, inspect its contents, validate docs/product-surface/privacy, and perform a clean-profile VS Code smoke test. Tag the last known-good build and record configuration rollback steps before publishing.
- Where: `src/test/**`, `scripts/**`, `docs/handbook/**`, `docs/reference/gitmind-user-surface.json`, `package.json`, VSIX output, and release notes.
- Depends on: Phases 2–4.
- Parallel: No for final release gate; the matrix may be prepared in parallel.
- Effort: Large.
- Priority: P0.
- Done when: all gates pass, manual results are recorded, release notes name user-visible migrations/deprecations, and rollback restores prior code while leaving user settings/keys intact.

## 7. Risks & Countermeasures

| Risk | Impact | Countermeasure |
|---|---|---|
| A provider returns models unsuitable for commit generation | Broken generation after model load | Capability-filter results, retain selected working ID, use documented fallback only, and fixture-test the filter. |
| Model aliases or previews disappear between releases | Free users see nonfunctional choices | Live discovery first, verified fallbacks with a review date, migration notices, and no static preview default unless explicitly approved. |
| A provider's response schema changes | Runtime parse failure | Normalizer validation, redacted contract fixtures, defensive error state, and per-provider manual smoke checklist. |
| Migration changes a user's chosen model | Loss of trust or workflow interruption | Exact-ID preservation first; migrate only documented aliases; record and disclose every replacement; provide a choice state if uncertain. |
| Entitlement checks diverge again | Free bypass or Pro customer denial | One typed host authority, operation-boundary guards, graph/static coverage audit, and state-matrix tests. |
| Encryption transition loses credentials | User lockout or secret exposure | Atomic migration/rollback strategy, secret-free logs, fault injection, and explicit recovery UX. |
| TypeScript/VS Code upgrade changes extension behavior | Build/package/runtime regression | Incremental upgrades, declared-engine tests, clean-profile smoke run, and version-pinned rollback commit. |
| Existing dirty lockfile changes are clobbered | User work lost | Snapshot/diff review before package writes; serialize lockfile work; do not reset or regenerate blindly. |
| Provider verification uses real credentials in CI/logs | Credential/data exposure | Environment-only manual smoke jobs, redaction, no fixture secrets, no diff payloads, and existing privacy validation. |

## 8. Verification & Replanning

- Per task: attach command output, test name, redacted fixture source, and changed paths to the task ledger. For contract changes, compare both positive and failure response fixtures. For a new guard, prove its effect boundary with a Free test rather than only a rendered disabled button.
- Overall:
  1. `pnpm install --frozen-lockfile`
  2. `pnpm run check-types`, `pnpm run lint`, `pnpm run compile-tests`, `pnpm run test:validate`, and the VS Code integration suite
  3. Provider discovery/generation/migration fixture suites and opt-in redacted manual smoke suite
  4. Free/Pro/legacy/invalid/offline feature matrix
  5. `pnpm audit --prod --json`, docs/privacy/product-surface checks, `pnpm run package`, and `pnpm run package:audit`
  6. Install the VSIX in a clean VS Code profile and exercise initial setup, model selection, Free flow, Pro activation, and downgrade/reload.
- Replan when: a provider has no usable discovery/capability data; official docs require a different generation API or paid product change; a model migration is ambiguous; an entitlement provider cannot supply a stable validation contract; a dependency requires a higher VS Code/Node floor; or any user setting/key cannot be preserved safely.

## 9. Traceability

| Objective | Covered by tasks |
|---|---|
| Remove outdated providers/models/methods | 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 5.1 |
| Add only differentiated providers safely | 1.4, 2.1, 2.2, 2.4, 5.1, 5.2 |
| Keep Free choices current and functional | 1.3, 2.2, 2.3, 2.4, 5.2 |
| Update libraries/platform safely | 1.1, 3.1, 3.2, 5.2 |
| Make all Pro features flawless and robust | 1.2, 4.1, 4.2, 4.3, 5.2 |
| Preserve existing functionality and customer data | 1.1, 2.3, 3.1, 4.3, 5.2 |
| Use reliable official references | 1.3, 2.2, 2.4, 5.1 |

## 10. Handover Summary

- Executor must know: model names in this project are intentionally not assumed to be stale solely by age; each must be kept, migrated, or removed only after the provider-specific official contract check. Live availability is authoritative but must not erase a user's explicit stored selection.
- Cut line: first ship the existing 18-provider modernization, dependencies, and all advertised Pro capabilities with passing proof. Add only the approved shortlist candidates that clear Task 1.4; begin with LM Studio, then enterprise providers in the stated order. Do not add lower-priority overlapping providers in the same release.
- Open questions: N/A for planning. At implementation time, each provider requiring account credentials needs a maintainer-controlled test key/tenant and documented redaction procedure; no customer credential is an acceptable substitute.
- Decision points: approve any VS Code/Node minimum-version increase; approve a changed Free default if its former model has no documented migration; approve any Pro benefit wording change if actual licence-provider policy differs from current UI copy.
