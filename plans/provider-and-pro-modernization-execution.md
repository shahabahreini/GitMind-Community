# Execution Ledger: Provider, Pro, and Marketplace Modernization

| Field | Value |
|---|---|
| Plan | `plans/provider-and-pro-modernization.md` |
| Started | 2026-09-02 |
| Status | In progress |
| Scope approval | User explicitly approved all five shortlisted providers and VS Code Marketplace SEO on 2026-09-02. |

## Coverage Ledger

| ID | Name | Priority | Acceptance check | Status | Evidence |
|---|---|---|---|---|---|
| 1.1 | Preserve and reproduce baseline | P0 | Diagnostic baseline recorded without overwriting user work | done (verified) | `git status --short` captured user changes in `.gitignore`, `.ignore`, `package.json`, and `pnpm-lock.yaml`; `pnpm run compile-tests && pnpm run test:validate` passed; `pnpm audit --prod --json` reported 0 vulnerabilities. |
| 1.2 | Provider and entitlement inventory | P0 | Every provider and Pro operation has a traceable inventory row | done (verified) | `docs/research/provider-contracts-2026-09.md` inventories all 23 choices and every listed Pro operation. |
| 1.3 | Official provider contract verification | P0 | Each provider has a documented discovery/fallback strategy and failure path | done (verified) | `docs/research/provider-contracts-2026-09.md` records the selection, generation, and failure contract plus primary provider references. |
| 1.4 | Provider-admission decision | P1 | Each approved provider has an implementation contract, owner, and rollback path | done (verified) | Admission/rollback table in `docs/research/provider-contracts-2026-09.md`; user approved LM Studio, Azure OpenAI, Amazon Bedrock, Vertex AI, and Cloudflare Workers AI. |
| 2.1 | Canonical provider contract | P0 | One typed provider authority; no independent default lists | pending | — |
| 2.2 | Discovery, filtering, caching, failure UX | P0 | Automated strategy-class coverage for discovery/failure behavior | pending | — |
| 2.3 | Static-model removal and safe migration | P0 | No stale Free-visible bundled model; stored selections preserved/migrated | pending | — |
| 2.4 | Capability-aligned generation | P0 | Request/response fixtures prove supported option mapping | pending | — |
| 3.1 | Dependency/platform upgrades | P1 | Reproducible install, no audit findings, build/test proof | pending | — |
| 3.2 | Test and release gates | P1 | Validation works from documented clean command | pending | — |
| 4.1 | Authoritative entitlement lifecycle | P0 | No editable UI/config alone grants Pro | pending | — |
| 4.2 | Pro-operation boundary guards | P0 | Free/Pro/legacy/invalid state checks cover every operation | pending | — |
| 4.3 | Credential encryption/downgrade hardening | P0 | Fault paths show no key loss/leak/bypass | pending | — |
| 5.1 | Provider contract and migration tests | P0 | All providers have automated contract coverage | pending | — |
| 5.2 | Pro/release acceptance matrix | P0 | Overall gates and release candidate checks pass | pending | — |
| SEO-1 | VS Code Marketplace metadata and discoverability | P0 | Marketplace manifest, README, keywords, category, badges, and links validate without misleading claims | pending | Explicit user-approved scope expansion. |

## Deviations

- 2026-09-02 — User explicitly expanded the approved provider shortlist from staged admissions to all five candidates and added Marketplace SEO. Accepted; SEO-1 was added and all five providers are in scope. No provider outside the prior shortlist is authorized.

## QC Results

- Phase 1 baseline: passed `compile-tests`, `test:validate`, and production audit. The earlier validator failure was a missing prerequisite, not a failing test suite.

## Unfinished Items

- Phase 1 is complete. Provider implementation, canonicalization, entitlement hardening, and release verification remain.

## Handover Summary

- Preserve unrelated worktree changes. Do not reset, checkout, or regenerate the lockfile without retaining the existing approved dependency updates.
- Use provider account credentials only in opt-in/manual smoke tests; do not place them in code, fixtures, ledger, terminal output, or support artifacts.
- External-provider live verification remains subject to maintainer-controlled credentials. Automated fixture coverage must not claim live account verification.
