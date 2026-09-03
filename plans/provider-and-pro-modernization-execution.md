# Execution Ledger: Provider, Pro, and Marketplace Modernization

| Field | Value |
|---|---|
| Plan | `plans/provider-and-pro-modernization.md` |
| Started | 2026-09-02 |
| Status | Complete |
| Scope approval | User explicitly approved all five shortlisted providers and VS Code Marketplace SEO on 2026-09-02. |

## Coverage Ledger

| ID | Name | Priority | Acceptance check | Status | Evidence |
|---|---|---|---|---|---|
| 1.1 | Preserve and reproduce baseline | P0 | Diagnostic baseline recorded without overwriting user work | done (verified) | `git status --short` captured user changes in `.gitignore`, `.ignore`, `package.json`, and `pnpm-lock.yaml`; `pnpm run compile-tests && pnpm run test:validate` passed; `pnpm audit --prod --json` reported 0 vulnerabilities. |
| 1.2 | Provider and entitlement inventory | P0 | Every provider and Pro operation has a traceable inventory row | done (verified) | `docs/research/provider-contracts-2026-09.md` inventories all 23 choices and every listed Pro operation. |
| 1.3 | Official provider contract verification | P0 | Each provider has a documented discovery/fallback strategy and failure path | done (verified) | `docs/research/provider-contracts-2026-09.md` records the selection, generation, and failure contract plus primary provider references. |
| 1.4 | Provider-admission decision | P1 | Each approved provider has an implementation contract, owner, and rollback path | done (verified) | Admission/rollback table in `docs/research/provider-contracts-2026-09.md`; user approved LM Studio, Azure OpenAI, Amazon Bedrock, Vertex AI, and Cloudflare Workers AI. |
| 2.1 | Canonical provider contract | P0 | One typed provider authority; no independent default lists | done (verified) | `ApiProvider`, `PROVIDER_CATALOG`, settings, validation, dispatch, support allowlist, UI and manifest consistently register 23 providers; registration-count test passes. |
| 2.2 | Discovery, filtering, caching, failure UX | P0 | Automated strategy-class coverage for discovery/failure behavior | done (verified) | LM Studio and Azure model discovery plus Cloudflare direct/Gateway endpoint behavior are fixture-tested in `providerExpansion.test.ts`; account-scoped providers accept explicit deployment/model IDs rather than shipping stale inventories. |
| 2.3 | Static-model removal and safe migration | P0 | No stale Free-visible bundled model; stored selections preserved/migrated | done (verified) | The in-app selector is catalog-backed; all VS Code `*.model` schema enums/descriptions/examples were removed. `providerCatalog.test.ts` prevents a second static manifest list, while current defaults remain compatible with stored string selections. |
| 2.4 | Capability-aligned generation | P0 | Request/response fixtures prove supported option mapping | done (verified) | Native Bedrock Converse and Vertex SDK paths plus OpenAI-compatible Azure, Cloudflare, and LM Studio adapters are typed and dispatched through the provider factory; request-shape fixtures cover new HTTP-compatible adapters. |
| 3.1 | Dependency/platform upgrades | P1 | Reproducible install, no audit findings, build/test proof | done (verified) | Official AWS Bedrock runtime and credential-provider SDKs added to `package.json`/lockfile; final production audit reports 0 vulnerabilities across 116 dependencies. |
| 3.2 | Test and release gates | P1 | Validation works from documented clean command | done (verified) | `pnpm test` uses the installed VS Code build with `--skip-extension-dependencies`; final production package succeeds. |
| 4.1 | Authoritative entitlement lifecycle | P0 | No editable UI/config alone grants Pro | done (verified) | `VerifiedEntitlementService` stores server-verified state in extension-private `globalState`; `isProUser()` no longer reads writable validation status. A regression test proves an edited `valid` setting grants no access. |
| 4.2 | Pro-operation boundary guards | P0 | Free/Pro/legacy/invalid state checks cover every operation | done (verified) | Existing central `isProUser()` guards now resolve only legacy local entitlement or verified private state; lifecycle tests cover activation, revocation, and fail-open network/404 behavior. |
| 4.3 | Credential encryption/downgrade hardening | P0 | Fault paths show no key loss/leak/bypass | done (verified) | Startup validates entitlement before user-status-driven secret migration. Inconclusive validation preserves a previously verified entitlement; only trusted affirmative revocation removes it. |
| 5.1 | Provider contract and migration tests | P0 | All providers have automated contract coverage | done (verified) | 400 extension-host tests pass, including registration parity, catalog defaults, static-list removal, provider endpoint/auth discovery fixtures, and entitlement migration regressions. |
| 5.2 | Pro/release acceptance matrix | P0 | Overall gates and release candidate checks pass | done (verified) | Final `pnpm test`, docs export/sync/validation, privacy validation, production audit, VSIX package/audit, and `git diff --check` all passed. |
| SEO-1 | VS Code Marketplace metadata and discoverability | P0 | Marketplace manifest, README, keywords, category, badges, and links validate without misleading claims | done (verified) | Manifest, README, provider reference, keyword set, setup documentation and generated user-surface data reflect 23 choices; package content audit passed. |

## Deviations

- 2026-09-02 — User explicitly expanded the approved provider shortlist from staged admissions to all five candidates and added Marketplace SEO. Accepted; SEO-1 was added and all five providers are in scope. No provider outside the prior shortlist is authorized.

## QC Results

- Baseline: `compile-tests`, `test:validate`, and production audit passed before modification.
- Final: `pnpm test` passed **400 tests**; types, lint, and production build are included in that command.
- Final: `pnpm docs:export-product-surface`, `pnpm docs:sync-wiki`, and `pnpm docs:validate` passed: 45 handbook pages, 23 providers, 112 public settings, and 44 public commands.
- Final: `pnpm privacy:validate`, `pnpm audit --prod --json` (0 vulnerabilities), `pnpm package:vsce`, `pnpm package:audit` (33 audited files), and `git diff --check` passed.
- Final VSIX: 35 packaged files, 1.75 MB. `graft/**` is excluded from the artifact.

## Unfinished Items

- No source or release-gate item remains. Live-provider smoke tests require maintainer-controlled credentials and intentionally were not run; automated fixtures verify request paths, authentication shape, and error-safe behavior without exposing credentials.

## Handover Summary

- Preserve unrelated worktree changes. Do not reset, checkout, or regenerate the lockfile without retaining the existing approved dependency updates.
- Use provider account credentials only in opt-in/manual smoke tests; do not place them in code, fixtures, ledger, terminal output, or support artifacts.
- External-provider live verification remains subject to maintainer-controlled credentials. Automated fixture coverage must not claim live account verification.
- Marketplace publishing and credentialed provider smoke tests remain deliberate maintainer actions; no publishing or external account state was changed.
