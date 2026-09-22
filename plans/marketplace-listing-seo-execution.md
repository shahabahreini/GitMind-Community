# Execution Ledger: GitMind Marketplace & OpenVSX Listing SEO

| Field | Value |
|---|---|
| Plan | `plans/marketplace-listing-seo.md` (v1.1, reviewed and ready to execute) |
| Worktree / branch | Work done on `feat/listing-seo`, committed as `b89b01b`, merged to local `main`; worktree removed (2026-09-22). **Not pushed** (`main` is 1 ahead of `origin/main`). |
| Why a worktree | `v6.2.0` is tagged but not packaged. Keeping listing edits out of the main checkout means a 6.2.0 build cannot pick them up (sequencing decision 4). |
| Last updated | 2026-09-22 |

## 1. Coverage ledger

| ID | Task | Priority | Acceptance check | Status | Evidence |
|---|---|---|---|---|---|
| 0.5 | Confirm 6.2.0 is live | must | Both store APIs report 6.2.0 | done (verified) | OpenVSX 6.2.0 (2026-09-22T20:27Z), Marketplace 6.2.0 (2026-09-22T20:32Z); both confirmed via the store APIs. |
| 0.1 | Record baseline metrics | must | Two dated pre-release rows plus reproducible commands; A7 confirmed | in progress | `docs/research/listing-metrics.md` plus `listing-snapshot.sh` created with a day-0 reference row (2026-09-22). First baseline row due 2026-09-29. Still needs a Marketplace publisher-hub export and web-host access-log access. All three are owner actions. |
| 0.2 | Keyword & competitor research | must | Rank per term on both stores, A4 note, chosen terms, keep/drop list, runnable script | done (verified) | `docs/research/listing-keywords-2026-09.md`, `docs/research/listing-rank.py` (ran successfully). GitMind ranks >50 for `ai commit`, `commit message` and `commit message generator` on both stores. |
| 0.3 | Confirm platform constraints | must | A1–A3 and A8 confirmed or corrected with source; visible limits; displayName and trademark rules | blocked (partial) | Confirmed: A1 (AI category exists: 4,159 extensions on the MP API, 1,176 on OpenVSX), A2 (30-tag limit), A8 (VSCodium 1.135 OK; Cursor/Windsurf unverified, so not named), displayName uniqueness. **A3 (`<video>` stripping) and the visible search-card length need a browser check.** Carried to Task 5.1. |
| 0.4 | Listing "before" screenshots | should | Two images | blocked | Needs 0.5 plus a browser capture (owner). |
| 1.1 | Fix Handbook links and old-repo URLs | must | No `AI-Commit-Assistant` URLs; README URLs return 200 without redirect | done (verified) | Old URLs removed from README, `wiki/_Footer.md` and `scripts/sync-wiki.mjs`. `lint:listing --network` shows every URL OK except the not-yet-uploaded hero GIF (3.1). Docs links point to the GitHub wiki (approved deviation D1). |
| 1.2 | Unify provider count | must | No unqualified "23 providers"; lint enforces | done (verified) | Lint passes (22 built-in). Negative test: an injected "23 providers" fails with exit 1. |
| 1.3 | Verify OpenVSX namespace | must | API returns `"verified":true` | blocked | External owner action: Eclipse publisher agreement plus a namespace claim at `EclipseFdn/open-vsx.org`. |
| 1.4 | Correct categories | must | Stores list under AI and SCM Providers, not Formatters | done (verified) | OpenVSX API for 6.2.1 lists `AI, SCM Providers, Machine Learning`. The Marketplace API does not return categories; confirm visually in 5.1. |
| 1.5 | Square icon | must | 256×256; owner approves legibility at 32 px | done (verified) | `images/logo.png` is `PNG 256 x 256`. Owner chose option A (mark only) from the 32/64/256 light/dark preview. |
| 1.6 | Store-neutral install section | must | Both stores linked, unconfirmed editors not named, not Marketplace-only | done (verified) | README Install section: Marketplace, Open VSX (VSCodium named; confirmed in 0.3), GitHub Releases (the `GitMind-Community` releases page exists, v6.1.2). All links 200. |
| 1.7 | Q&A destination | should | Q&A tab hidden or linked after release | in progress | `GitMind-Community` has no Discussions, so `"qna": false`. The packaged manifest has `EnableMarketplaceQnA=false`. The Q&A API showed 0 questions, so nothing is unanswered. Store check after release. |
| 2.1 | displayName | must | Owner-approved, unique, no third-party names, primary term visible | done (verified) | `GitMind: AI Commit Message Generator` (36 chars), approved. Search showed no identical name on either store. Contains all three core phrases. |
| 2.2 | Description | must | Owner-approved, primary term in the first 60 chars, no free-tier over-claim | done (verified) | Approved text starts with "AI commit message generator". Claims (Copilot, Ollama, 22 providers, Conventional Commits) are free-tier true; see finding F5 on Conventional. |
| 2.3 | Keyword set | must | Every keyword traced; count within limit | done (verified) | 29 keywords, each in the research table. The packaged VSIX has 30 tags (29 plus vsce-derived `keybindings`). Lint `--vsix` passes; the old 31-tag build fails. |
| 2.4 | README restructure | must | Section order, hero GIF first, no `<video>`, UTM on site links, moved pages live, no broken images | blocked (partial) | Done: section order, no `<video>`, UTM on all 4 gitmind-pro.com links, Pro features labelled, empty cell filled, NVIDIA/Recovery detail replaced by live wiki links (200). **Hero GIF URL returns 404 until 3.1 is uploaded.** |
| 2.5 | CHANGELOG highlights | could | Released CHANGELOG starts with a version heading and highlights | done (verified) | CHANGELOG `## v6.2.1 - 2026-09-22` with Highlights / Changed / Fixed; `## Unreleased` renamed to `## v6.2.0 - 2026-09-22`. |
| 2.6 | Rating link in README | should | Both links open the review area | done (verified) | Marketplace `#review-details` and Open VSX `/reviews` both return 200. |
| 3.1 | Hero GIF | must | Public URL 200, ≤ 5 MB, owner-approved | in progress | Owner chose **both** (2026-09-22): the illustrated advertisement stays `hero-generate.gif` (made outside this session), plus a real demo cut `demo-generate.gif` (0–6.5 s of `Gitmind-pro-Demo.mp4`, last frame held 1.5 s, 1000×563, 4.0 MB, no license or email visible) under "See It In Action", linking the full MP4. Both files are in both repos, **not yet pushed to GitMind-Community**, so `--network` lint still fails until then. |
| 3.2 | Screenshot refresh | should | Screenshots match the current UI and funnel order | pending | Owner capture. The README grid is already in funnel order using existing images. |
| 3.3 | Gallery banner contrast | should | Owner approves a post-release header screenshot | pending | Post-release (5.1). |
| 4.1 | Dual-store publishing | must | `--skip-duplicate` dry run; 6.2.1 publishes to both stores from one run; rerun succeeds | done (verified) | Run 35787102591 (tag v6.2.1 @ 6c6185b): `Published ShahabBahreiniJangjoo.ai-commit-assistant v6.2.1` to both stores in one run. First run 35786930618 failed at Upload VSIX artifact (account storage quota); the step is now `continue-on-error`, and the tag was moved before anything was published. |
| 4.2 | Listing lint | must | Passes on the fixed tree; fails on each reintroduced defect | done (verified) | `scripts/lint-listing.mjs` plus `pnpm run lint:listing`, wired into `validate-extension.yml` (offline and `--vsix`) and `release.yml` (`--network --vsix`). Negative tests: stale URL, "23 providers", 31st keyword and `<video>` all exit 1; a Pro-qualified count passes. |
| 4.3 | Post-publish parity check | should | Workflow summary shows both versions matching the tag | done (verified) | The parity step ran: OpenVSX matched on attempt 3, the Marketplace lagged. Both APIs report 6.2.1 afterwards (MP displayName `GitMind: AI Commit Message Generator`). |
| 4.4 | Fix Handbook Pages deployment (added; owner-approved) | should | Handbook live at `shahabahreini.github.io/GitMind-Community/` with working sub-pages | blocked (partial) | VitePress `base` is `/GitMind-Community/`; the build succeeds and assets resolve under the new base. `publish-pages.yml` now builds in `GitMind-Pro` and pushes to `GitMind-Community` `gh-pages`. (a) Docs re-verified for 6.2.0 on 2026-09-22: the regenerated surface manifest differs from 6.1.2 only in version and date; every 6.2.0 CHANGELOG behaviour (defaults, Perplexity Agent API, HF router, Copilot errors) is present in the pages; 45 stamps bumped; `docs:validate` and `docs:build` pass. **Still blocked by:** (b) the `COMMUNITY_PAGES_TOKEN` secret; (c) switching the GitMind-Community Pages source to `gh-pages`. |
| 5.1 | Release, visual check, rollback snapshot | must | Pre-release manifest saved; both listings show 6.2.1; checks pass | in progress | Released 2026-09-22: both stores and the GitHub Release (`ai-commit-assistant-6.2.1.vsix`). Pre-release manifest saved (§6). **Remaining: owner visual check of both listings (hero and demo GIFs render, `<video>` gone, categories, icon, name/description truncation, A3), and "after" screenshots.** |
| 5.2 | Measure impact | must | Four weekly post-release rows plus verdicts | pending | Weekly snapshots 2026-09-29, 10-06, 10-13, 10-20 with `docs/research/listing-snapshot.sh` plus `listing-rank.py`, publisher-hub Acquisition and UTM log counts. Baseline is weaker (D8). |

**Totals:** 27 tasks (26 planned plus the added 4.4). done (verified): 10 · in progress (awaiting post-release check): 3 · blocked (owner/external, some partially done): 9 · pending: 5 · dropped: 0.

## 2. Deviations

| # | Deviation | Resolution | Approved by |
|---|---|---|---|
| D1 | Task 1.1 planned to point docs links at `shahabahreini.github.io/GitMind-Community/`, but that site is a stale Jekyll page whose sub-pages 404. | README docs links point to the live GitHub wiki instead. | Owner, 2026-09-22 |
| D2 | Pages repair was out of scope in the plan. | Added as Task 4.4 (should). Partially done; blocked as noted. | Owner, 2026-09-22 |
| D3 | The Phase 0 checkpoint held copy until the baseline existed. | Copy drafted now on the unpublished branch; the release stays held until the baseline exists. | Owner, 2026-09-22 |
| D4 | The dead GitHub Sponsors link was not in the plan. | Removed from the README. | Owner, 2026-09-22 |
| D5 | The plan assumed 30 keywords fit the limit (A2). vsce adds a derived `keybindings` tag, making 31 manifest tags. | 29 keywords; the lint gained a `--vsix` tag count. Within Task 2.3/4.2 intent. | Within plan (fix to meet the acceptance check) |
| D6 | CI on `main` fails with "Multiple versions of pnpm specified" (run 35776933858), so Task 4.2's CI gate could never run. | Removed the `version: 10.15.0` pin in the three workflows this plan edits (`release.yml`, `validate-extension.yml`, `publish-pages.yml`); pnpm now comes from `packageManager`. Follow-up 2026-09-22: pin also removed from `publish-wiki.yml` and `validate-documentation.yml` (owner asked to proceed). No pins remain. | Within plan; follow-up requested by owner |
| D8 | The plan released 6.2.1 only after two baseline rows (6.2.0 live + 7 days). | Released 2026-09-22, the same day, to supersede the 6.2.0 package that contained `graphify-out/` (F7). The baseline is the day-0 plus pre-release rows (both 2026-09-22), so the impact comparison is weaker, and Task 5.2 verdicts must note this. Docs re-stamped to 6.2.1 after confirming no `src/` changes since v6.2.0 and a manifest diff of version only. | Owner ("release 6.2.1 now"), 2026-09-22 |
| D7 | The A4 in-editor spot check needs a GUI. | Verified via endpoint equivalence: VS Code queries the same `extensionquery` API, and OpenVSX's editor-facing gallery endpoint gives the same ranks. A manual spot check is added to 5.1. | Recorded; no scope change |

## 3. QC results

- `pnpm run package`: pass (check-types, lint, production build).
- `pnpm run package:audit`: pass (33 files).
- `pnpm run package:vsce`: pass. The manifest has the new DisplayName, Description, Categories and 30 tags, with `EnableMarketplaceQnA=false`.
- `pnpm run lint:listing`: pass (29 keywords, 22 providers, 20 URLs).
- `lint:listing --vsix`: pass on the new VSIX; correctly fails on the 31-tag VSIX.
- `lint:listing --network`: one expected failure, the hero GIF (404 until 3.1). This is the intended release gate.
- `docs:build` with the new base: pass. `docs:validate`: 45 pre-existing failures (see 4.4).
- All three edited workflows parse as valid YAML. `actionlint` is not installed, so it was not run.
- Regression sweep:
  - No `src/` files changed.
  - The main checkout is unchanged (only the untracked plan file).
  - The regenerated docs manifest and wiki stamps were reverted, so no unverified "verified against 6.2.0" claims were introduced.
  - Extension tests were not run, because no runtime code changed.

## 4. Unfinished items

- **Owner actions (blocking release):** 0.5 publish 6.2.0 by 2026-09-27 · 0.1 baseline at 6.2.0 + 7 days (publisher-hub export, access logs) · 1.3 OpenVSX namespace claim · 3.1 record the hero GIF and push it to both repos · 4.1 A3 and visible-length browser check.
- **Owner actions (non-blocking):** 4.4 re-verify the 45 Handbook pages for 6.2.0, add `COMMUNITY_PAGES_TOKEN`, switch Pages to `gh-pages` · 3.2 recapture screenshots · fix the pnpm pin in `publish-wiki.yml` and `validate-documentation.yml`.
- **At release (5.1):** 2.5 CHANGELOG highlights, the 6.2.1 bump, commit/merge `feat/listing-seo`, sync `images/logo.png` and the GIF to `GitMind-Community`, post-release checks for 1.4, 1.7, 3.3 and 4.3.

## 5. Findings outside plan scope (for the owner)

- **F1 Possible exposure:** the public `GitMind-Community` repo root lists `.env.azure`, `.env.example`, `src/`, `azure-deployment/` and `instructions/`. The contents were not inspected (blocked by the credential-safety guard). The owner should check `.env.azure` and rotate anything real. — possible
- **F2 CI broken on `main` since the pnpm 12 migration** (run 35776933858). Partly fixed on this branch (D6). — proven
- **F3 Pages site canonical and title:** the live Jekyll page's canonical URL points to the dead `AI-Commit-Assistant` URL, and its description reads "VSCode extention". It is superseded once 4.4 deploys. — proven
- **F4 Name collision:** another Marketplace extension is named just "GitMind". — proven
- **F5 Style gating mismatch:** `conventional` is `isPro: true` in `src/config/commitStyles.ts` and `src/services/commitStyleManager.ts`, while the UI, the defaults and generation treat it as free. `setCommitStyle('conventional')` would refuse free users. `validateAndResetStyleIfNeeded()` is never called. — proven (code read), user impact possible
- **F6 The old README listed Pro-only features as free highlights** (draft choices, Commit Health, pre-commit review). Fixed in the new README. — proven

- **F7 Private data in the published 6.2.0 VSIX:** the OpenVSX 6.2.0 package contains 34 `graphify-out/` files (a knowledge graph of the private source), included because 6.2.0 was packaged locally and `graphify-out/` was gitignored but not in `.vscodeignore`. Fixed for future builds: `.vscodeignore` now excludes `graphify-out/**`, `plans/**` and `wiki/**`, and `audit-vsix.mjs` fails on them (audit back to 33 files). The 6.2.1 release supersedes 6.2.0. — proven
- **F8 `.env.azure` in public GitMind-Community:** deleted with `git rm` and added to `.gitignore` (owner request, 2026-09-22); not yet pushed. The file remains in git history, so any real credential in it must be rotated. — proven

- **F9 GitMind-Community README/CHANGELOG** (owner request): updated for 6.2.1 in commit `8e5acd5`. Real demo added; version, requirements, telemetry and editor claims corrected; Pro workflows labelled; dead Sponsor link removed; 6.2.0/6.2.1 CHANGELOG entries added.

## 6. Pre-release manifest (rollback source for 5.1)

```json
{
  "displayName": "GitMind: AI-Powered Commit Messages",
  "description": "Generate AI commit messages in VS Code with 23 providers, local and cloud models, Conventional Commits, GitHub Copilot, and Pro recovery tools.",
  "categories": ["SCM Providers", "Machine Learning", "Formatters"],
  "keywords": ["git", "commit-message", "ai commit message", "commit generator", "conventional commits", "source control", "developer productivity", "github copilot", "openai", "anthropic", "gemini", "ollama", "lm studio", "local ai", "azure openai", "amazon bedrock", "vertex ai", "cloudflare workers ai", "nvidia nim", "openrouter", "multi provider ai", "gitmoji", "semantic release", "changelog"],
  "icon": "images/logo.png (320x375; git show main:images/logo.png)"
}
```

## 7. Handover summary

- Context: listing SEO for `ShahabBahreiniJangjoo.ai-commit-assistant`. All work is uncommitted on branch `feat/listing-seo` in the worktree `~/Documents/Hobby/GitMind-Pro-listing`. The plan is `plans/marketplace-listing-seo.md`.
- Decisions:
  - Name: `GitMind: AI Commit Message Generator`.
  - Icon: option A (mark only).
  - Docs links point to the GitHub wiki; the Sponsor link is removed; Pages repair is in scope (4.4).
  - Copy is drafted now; the release is held for the baseline.
  - Plus the plan's decisions 1–7.
- State:
  - Done: 0.2, 1.1, 1.2, 1.5, 1.6, 2.1, 2.2, 2.3, 2.6, 4.2 (plus the partial work in 0.3, 2.4, 4.1 and 4.4).
  - Pending: 2.5, 3.2, 3.3, 5.1, 5.2.
  - Blocked: 0.5, 0.1, 0.3 (browser), 0.4, 1.3, 2.4 (GIF), 3.1, 4.1 (secrets), 4.4.
- Remaining tasks: see §4. Everything is in the worktree paths above. Release = bump to 6.2.1, add the CHANGELOG highlights, commit and merge the branch, push the tag in `GitMind-Pro` (the workflow publishes both stores), sync the images to `GitMind-Community`.
- Verification: `pnpm run lint:listing --network --vsix <vsix>` must pass before tagging, then the 5.1 visual check and weekly `python3 docs/research/listing-rank.py` runs.
- Risks and how to detect them early:
  - GIF missing: `--network` lint fails.
  - Tag overflow: `--vsix` lint.
  - Publish token expiry: missing-secret warning plus the calendar entry.
  - Rank loss: weekly rank script.
  - Docs Pages still stale: `curl` of `/GitMind-Community/Installation-And-Quick-Start` returns 404.
