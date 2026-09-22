# Plan: GitMind Marketplace & OpenVSX Listing SEO

| Field | Value |
|---|---|
| Objective | Make the GitMind listings on the VS Code Marketplace and OpenVSX rank for high-intent searches, convert visitors into qualified free installs, and route interested users to Pro. |
| Status | Reviewed and ready to execute |
| Version | 1.1 (expert review 2026-09-22) |
| Created | 2026-09-22 |

## 1. Objective & Definition of Done
- Goal: Every store-facing surface is correct, consistent, store-neutral, and written for search and conversion. The funnel runs from search result to listing to install to walkthrough to Pro.
- Done when:
  - All `must` tasks in Phases 1–4 are complete and shipped as a dedicated listing release (6.2.1, or the next patch after 6.2.0).
  - Both stores show that version with identical metadata.
  - The listing lint passes in CI.
  - The OpenVSX namespace shows as verified.
- Success measures, compared with the Task 0.1 baseline in weekly snapshots through +30 days after release:
  - Marketplace installs per week and OpenVSX downloads per week both rise.
  - The Marketplace publisher-hub page-view-to-install conversion rises.
  - The Marketplace `trendingweekly` value rises.
  - GitMind's search rank for the Task 0.2 primary terms improves on both stores.
  - Hits on gitmind-pro.com with `utm_source=extension-listing` appear in the web host's access logs.
  - No broken links or images.
  - No numeric uplift target is set, because no historical weekly series exists yet. Task 0.1 starts that series.
- Must not happen:
  - The extension ID `ShahabBahreiniJangjoo.ai-commit-assistant` changes.
  - The listing claims something the free tier does not deliver.
  - Store pages show broken images or links.
  - Keyword stuffing, or misuse of third-party trademarks in the name.
  - The two stores show different versions or metadata.
  - Listing work delays 6.2.0, which carries the Perplexity Agent API switch needed before the Sonar shutdown on 2026-09-27.

## 2. Context & Constraints
- Background (audit evidence, collected 2026-09-22):
  - **Live stats.** Marketplace: 1,219 installs, 5.0 average from 4 ratings, weighted rating 4.61, trendingweekly 0.33, version 6.1.2. OpenVSX: 12,250 downloads, 5.0 from 1 review, version 6.1.2, namespace `verified: false`.
  - **Broken docs links (proven).** Both Handbook links at `README.md:5` and `README.md:188` point to `shahabahreini.github.io/AI-Commit-Assistant/`, which returns 404. The live Handbook is `shahabahreini.github.io/GitMind-Community/` (200). `wiki/_Footer.md` also mentions the old path.
  - **Repo layout (proven).**
    - `github.com/shahabahreini/AI-Commit-Assistant` 301-redirects to `GitMind-Community`, the public repo. It hosts README images, the Handbook Pages and Issues, and only has `publish-wiki.yml`.
    - `origin` is `GitMind-Pro`, a private repo (404 publicly). It holds the source, tags and workflows.
    - README image URLs still use the old repo name and only work through the redirect.
    - Public content is synced to `GitMind-Community` by hand (last sync commit: "docs: update documentation and wiki for v6.1.2 release", 2026-09-03).
  - **Workflows can't run (proven).** `release.yml` and `publish-pages.yml` only run when `github.repository == 'shahabahreini/AI-Commit-Assistant'`. That condition is never true in either current repo, so every release and Pages deployment is manual today.
  - **Store publishing token (proven).** Azure DevOps global PATs stop working on 2026-12-01 (Microsoft Learn, "Use personal access tokens" and the Sprint 270 update). Marketplace publishing must use an organization-scoped PAT with the Marketplace Publish scope, or Microsoft Entra authentication.
  - **Provider count mismatch (proven).** `package.json:4` says "23 providers". `README.md:3`, `README.md:31` and `package.json:1458` (walkthrough) say "22 built-in providers".
  - **Demo video (likely).** The README demo is a `<video>` tag at `README.md:15`. Store README renderers sanitize HTML, so it most likely does not render.
  - **Category (proven).** `Formatters` is declared, but GitMind is not a code formatter. `AI` is missing.
  - **Icon (proven).** `images/logo.png` is 320×375, not square.
  - **Empty feature cell (proven).** The "Useful Free Features" cell has no image. `images/screenshots/free-features-settings.png` exists but is unused.
  - **Store-specific install wording (proven).** Install copy points only to the VS Code Marketplace, although most downloads come from OpenVSX.
  - **No website analytics (proven).** No analytics script was found in the gitmind-pro.com source (`GitMind-Pro_Website`) or on the live pages.
  - **Unreleased 6.2.0 (proven).** `v6.2.0` was tagged 2026-09-22 13:55 local time and is not yet on either store.
- Constraints:
  - One README serves both stores (store-neutral).
  - The owner records or approves visual captures.
  - In-product growth levers are out of scope.
  - CI publishing runs in the private `GitMind-Pro` repo.
  - The Pro-click metric comes from server access logs; no new website tracking.
- Stakeholders: the owner/maintainer (decides, publishes, records assets, holds store credentials), Eclipse Foundation (OpenVSX namespace verification), and Microsoft Marketplace (listing policy, publishing auth).
- Open questions and decision points: none open. Decisions are recorded in §10 and §11.

## 3. Strategy
- Chosen path:
  1. Let 6.2.0 ship unchanged.
  2. Record a baseline once 6.2.0 is live.
  3. Research the search terms that bring installs on both stores.
  4. Fix proven defects.
  5. Rewrite the name, description, keywords and README around those terms.
  6. Add a hero GIF.
  7. Automate dual-store publishing from `GitMind-Pro`, with a listing lint so the listings don't drift again.
  8. Ship everything as one listing-only patch.
  9. Measure weekly against the baseline.
- Why it wins: the defect fixes are cheap and certain. Research-led copy avoids guessing keywords. Shipping the listing changes in their own release keeps their effect measurable. Automation plus the lint fixes the cause of drift.
- Alternatives rejected:
  - Separate READMEs per store: two sources of truth.
  - Renaming the extension ID: loses installs and ratings.
  - Bundling with 6.2.0: risks the Perplexity deadline and confounds measurement.
  - Publishing from the public repo: the source is private.
  - Website analytics: expands scope and adds tracking.

## 4. Scope
- New:
  - Baseline metrics log
  - Keyword/competitor research note
  - Hero GIF
  - Square icon
  - Listing lint script and CI step
  - Store publish steps
  - Store-parity check
  - README rating link
- Updates to existing:
  - `package.json` listing fields (displayName, description, categories, keywords, icon, qna)
  - README structure, copy and image URLs
  - Walkthrough provider count
  - Screenshot set and order
  - `.vscodeignore` asset allowlist
  - `release.yml` repo check and publish steps
  - `validate-extension.yml`
  - Handbook pages (moved README sections) synced to `GitMind-Community`
- Explicitly out of scope:
  - In-product rating prompts or other UI changes in the extension
  - Website SEO and website analytics
  - Paid ads
  - Changing the extension ID or publisher
  - Pricing changes
  - Fixing `publish-pages.yml` (Handbook publishing stays manual; Task 2.4 syncs by hand)
  - Shipping 6.2.0 itself
- Change policy: any change to the displayName, extension ID or Pro claims needs owner approval before publishing. Other copy changes follow the research note. A replanning trigger (§8) reopens scope.
- Cut line: every `must` task is above the line. Tasks 0.4, 1.7, 2.5, 2.6, 3.2, 3.3 and 4.3 (`should`/`could`) sit below it.

## 5. Assumptions
| # | Assumption | Validated by |
|---|---|---|
| A1 | The Marketplace accepts `AI` as a category (along with `SCM Providers` and `Machine Learning`), and OpenVSX mirrors manifest categories | Task 0.3 (manifest reference) and Task 5.1 (live listing) |
| A2 | The Marketplace indexes at most 30 keywords (currently 24) | Task 0.3 |
| A3 | Store README renderers strip `<video>` but render animated GIFs from absolute HTTPS URLs | Task 0.3 (inspect the live 6.1.2/6.2.0 listing) and Task 5.1 |
| A4 | Store search ranks on displayName, description and keywords, plus installs, rating and trending. API search ordering approximates in-editor search | Task 0.2 compares API rank with in-editor search for 3 terms. The stores do not document ranking, so this is a working hypothesis |
| A5 | ~~Releases run from `AI-Commit-Assistant`~~ **Disproved:** that repo was renamed to `GitMind-Community`, and the workflow repo check never matches. Replaced by the owner decision that publishing runs in private `GitMind-Pro` | Evidence §2; Task 4.1 fixes the repo check |
| A6 | `GitMind-Community` stays public and keeps `main/images/**` | The Task 4.2 `--network` lint checks every image URL returns 200 |
| A7 | The web host keeps access logs with query strings for at least 30 days | Task 0.1 confirms log access and retention before the baseline |
| A8 | The engine requirement `^1.101.0` is satisfied by current Cursor, Windsurf and VSCodium builds | Task 0.3 |

## 6. Phases & Tasks

### Phase 0: Baseline & Discovery
Checkpoint: 6.2.0 is live on both stores, the baseline is recorded, the target term list is chosen, and A1–A4, A7 and A8 are confirmed or corrected before any copy is written.

**Task 0.5 — Confirm 6.2.0 is live** *(added in review: sequencing decision)*
- What: Make sure the functional release is out before the listing baseline starts.
- How: The owner publishes the existing `v6.2.0` VSIX to both stores by the current manual process, before 2026-09-27. Confirm with both store APIs that the version is `6.2.0`.
- Where: Both store APIs
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: Both APIs report `6.2.0`, with the date recorded in `docs/research/listing-metrics.md`.

**Task 0.1 — Record baseline metrics**
- What: A reproducible weekly snapshot of listing performance.
- How:
  1. Record from the Marketplace `extensionquery` API (flags 914): installs, downloadCount, averagerating, ratingcount, trendingdaily/weekly/monthly.
  2. Record from the OpenVSX `/api/ShahabBahreiniJangjoo/ai-commit-assistant` endpoint: downloadCount, averageRating, reviewCount.
  3. Export from the Marketplace publisher hub (Reports → Acquisition): page views, installs and conversion for the last 30 days.
  4. Confirm A7 by counting `gitmind-pro.com` requests carrying `utm_source=` in the host access logs (expected 0 now).
  5. Store the curl commands and the log grep command so every snapshot is identical.
  6. Take the first snapshot at 6.2.0 release + 7 days, so the release spike settles. Take one more snapshot before the listing release.
- Where: `docs/research/listing-metrics.md` (new; append-only table)
- Depends on: 0.5
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: The file has two dated pre-release rows with every field filled (or `N/A` with a reason), plus reproducible commands. A7 is confirmed or the log-based measure is dropped with a note.

**Task 0.2 — Keyword & competitor research**
- What: Find the terms users search and how the top listings for those terms phrase their name, description and tags.
- How:
  1. Query both store search APIs for the seed terms `ai commit`, `commit message`, `commit message generator`, `conventional commits`, `copilot commit`, `ollama commit`, `git ai`, `gitmoji`, `changelog generator`:
     - Marketplace: `extensionquery` with filterType 10 (`searchText`), target `Microsoft.VisualStudio.Code`, sortBy 0, pageSize 10.
     - OpenVSX: `/api/-/search?query=<term>&size=10`.
  2. For each term, record the top 10 results: name, description, tags, installs, and GitMind's rank.
  3. For 3 terms, compare the API rank with the in-editor Extensions search (A4).
  4. Pick 3 primary and up to 27 secondary terms.
  5. Mark keep/drop for every current keyword.
  6. Save the query script so Task 5.2 can rerun it.
- Where: `docs/research/listing-keywords-2026-09.md` (new), `docs/research/listing-rank.sh` (new)
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when: The note lists GitMind's rank per seed term on both stores, the A4 comparison, the chosen primary and secondary terms with a one-line rationale each, a keep/drop decision for every current keyword, and a runnable rank script.

**Task 0.3 — Confirm platform constraints**
- What: Validate A1–A3 and A8, plus the listing policy limits.
- How:
  1. Read the current VS Code Extension Manifest reference and the vsce publishing docs for:
     - the valid categories and the keyword limit
     - displayName uniqueness (the Marketplace rejects a displayName already in use)
     - trademark guidance on third-party names
  2. Inspect the live listing on both stores: whether the `<video>` renders, whether the `<table>` layout renders, and how many characters of the name and description show in search cards.
  3. Record the VS Code engine version bundled in current Cursor, Windsurf and VSCodium releases against `^1.101.0`.
- Where: "Platform constraints" section in `docs/research/listing-keywords-2026-09.md`
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: A1–A3 and A8 are each marked confirmed or corrected with a source link or screenshot. The visible character limits and the displayName and trademark rules are recorded. If A8 fails for a major fork, a replanning note exists.

**Task 0.4 — Record the listing "before" state**
- What: Full-page screenshots of both listings before any change.
- How: Browser capture of both listings after 0.5.
- Where: `docs/research/listing-screens/before-*.png`
- Depends on: 0.5
- Skills: None
- Parallel: yes
- Effort: S
- Priority: should
- Done when: Two images exist, one per store.

### Phase 1: Fix Proven Defects
Checkpoint: `pnpm run package` and `pnpm run package:audit` succeed, and every README link and image returns 200 without a redirect.

**Task 1.1 — Fix broken Handbook links and old-repo URLs**
- What: Point every public URL at the current repo.
- How:
  - Replace `shahabahreini.github.io/AI-Commit-Assistant/` with `shahabahreini.github.io/GitMind-Community/`, including the sub-paths.
  - Replace `raw.githubusercontent.com/shahabahreini/AI-Commit-Assistant/` with `raw.githubusercontent.com/shahabahreini/GitMind-Community/`.
  - Confirm each new URL returns 200 with `curl -o /dev/null -w '%{http_code}'`, without `-L`.
  - Grep the whole repo, including `wiki/` and `docs/`.
- Where: `README.md`, `wiki/_Footer.md`, any other grep hit
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: `grep -rn "AI-Commit-Assistant" README.md wiki docs package.json` finds no URL uses, and every README URL returns 200 without following a redirect.

**Task 1.2 — Unify the provider count**
- What: Use one honest phrasing everywhere.
- How: The canonical wording is "22 built-in AI providers", with Custom API described separately as a Pro option. Apply it to the description (see Task 2.2), the walkthrough and the README.
- Where: `package.json:4`, `package.json:1458`, `README.md`
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: No user-facing file says "23 providers" without a Pro qualifier, and the Task 4.2 lint enforces this.

**Task 1.3 — Verify the OpenVSX namespace**
- What: Remove the "unverified publisher" state.
- How: The owner signs the Eclipse publisher agreement if needed, then opens a namespace ownership claim for `ShahabBahreiniJangjoo` in the `EclipseFdn/open-vsx.org` GitHub repo. Start immediately; this does not block the release.
- Where: open-vsx.org account, GitHub issue
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: S (wait time is external)
- Priority: must
- Done when: `curl -s https://open-vsx.org/api/ShahabBahreiniJangjoo` returns `"verified":true`.

**Task 1.4 — Correct the categories**
- What: Drop `Formatters` and add `AI`.
- How: Set `"categories": ["AI", "SCM Providers", "Machine Learning"]`, adjusted if Task 0.3 corrects A1.
- Where: `package.json` `categories`
- Depends on: 0.3
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: After release, both stores list GitMind under AI and SCM Providers and not under Formatters.

**Task 1.5 — Square icon**
- What: A square icon that stays legible at 32 px.
- How: Pad the mark to a square transparent 256×256 PNG with about 8% margin. Check it at 32 px and 64 px on light and dark backgrounds. Keep `images/logo.png` as the filename so the `.vscodeignore` allowlist and existing references still work.
- Where: `images/logo.png`
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: `file images/logo.png` reports 256 x 256, and the owner approves its legibility at 32 px on both themes.

**Task 1.6 — Store-neutral install section**
- What: Install instructions that work for every editor.
- How:
  - Replace the single-store link and the `ext install` snippet with:
    - VS Code: Marketplace link
    - Editors that use OpenVSX: OpenVSX link, plus "search GitMind in Extensions"
    - Manual: VSIX from GitHub Releases on `GitMind-Community`, only if releases are published there; otherwise omit this line
  - Name specific editors (Cursor, Windsurf, VSCodium) only where Task 0.3 confirmed compatibility.
  - Drop the Marketplace-only line under the logo.
- Where: `README.md` header block and Quick Start
- Depends on: 0.3
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: The README links both stores with working URLs, names no editor that Task 0.3 did not confirm, and nothing implies GitMind is Marketplace-only.

**Task 1.7 — Q&A destination** *(added in review)*
- What: Stop an unmonitored Marketplace Q&A tab from showing unanswered questions.
- How:
  1. Check the listing's Q&A tab for unanswered questions and answer any.
  2. Set `"qna"`:
     - to the `GitMind-Community` Discussions URL if Discussions is enabled there;
     - otherwise to `"false"`, so the Issues link serves support.
- Where: `package.json` `qna`
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: S
- Priority: should
- Done when: After release, the listing's Q&A tab either links to Discussions or is hidden.

### Phase 2: Listing Copy
Checkpoint: the owner approves the displayName, description and keyword list before the README rewrite is merged.

**Task 2.1 — displayName**
- What: A search-optimized name that keeps the GitMind brand.
- How:
  - Start from the Task 0.2 primary terms and the Task 0.3 visible-length limit. Pattern: `GitMind: AI Commit Message Generator`, adjusted to the top primary term.
  - Keep third-party product names (Copilot, OpenAI, Claude, Cursor) out of the name.
  - Search both stores for each candidate to confirm it is unique.
  - Offer 2–3 options for owner approval.
- Where: `package.json` `displayName`
- Depends on: 0.2, 0.3
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: The owner has approved a unique name, with no third-party product names, that contains the top primary term within the visible search-card length.

**Task 2.2 — Description**
- What: A one-sentence value proposition for search cards.
- How: Lead with the outcome using the primary term, then the two strongest research-backed differentiators. Use the Task 1.2 provider wording. Remove the jargon "Pro recovery tools". Fit the key message within the visible limit.
- Where: `package.json` `description`
- Depends on: 0.2, 0.3, 1.2
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: The owner approves it, the primary term appears in the first 60 characters, and nothing claimed is unavailable in the free tier without a "Pro" qualifier.

**Task 2.3 — Keyword set**
- What: Rebuild keywords from research.
- How: Apply the Task 0.2 keep/drop list, staying within the Task 0.3 limit. Lowercase, no duplicates. Add editor names only if research shows demand and Task 0.3 confirmed compatibility.
- Where: `package.json` `keywords`
- Depends on: 0.2, 0.3
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: Every keyword traces to the research note, and the count is within the limit (the lint enforces the limit).

**Task 2.4 — Restructure the README for conversion**
- What: Order the README by visitor intent: what it is, seeing it work, trying it, trusting it, going Pro.
- How:
  1. Section order:
     1. Value statement using the primary term
     2. Hero GIF from Task 3.1, replacing the `<video>` block
     3. Install section for all editors (Task 1.6)
     4. 3-step Quick Start
     5. "Why GitMind": at most 6 outcome bullets written as user outcomes, not feature names
     6. Screenshot grid, with the empty cell filled using `free-features-settings.png` or removed
     7. Providers table
     8. Free vs Pro table, plus one Pro call to action
     9. Privacy
     10. Support
  2. Move the "NVIDIA NIM" and "Automatic Recovery" detail to `docs/handbook/`, sync it to `GitMind-Community` (the same manual docs sync used for v6.1.2), and confirm the live Handbook URLs return 200 before the README links to them.
  3. Tag every gitmind-pro.com link with `?utm_source=extension-listing&utm_medium=readme&utm_campaign=<section>`.
  4. Write descriptive alt text for every image.
- Where: `README.md`, `.vscodeignore`, `docs/handbook/`, the `GitMind-Community` repo (docs sync)
- Depends on: 1.1, 1.2, 1.6, 2.1, 2.2, 3.1
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when:
  - The README follows the section order above, with the hero GIF as the first visual.
  - No `<video>` tag remains.
  - All gitmind-pro.com links carry UTM tags.
  - The moved Handbook pages return 200 live.
  - The VS Code Markdown preview shows no broken images.

**Task 2.5 — User-facing CHANGELOG top**
- What: Make the top of the CHANGELOG readable on the store "Changelog" tab.
- How: Add a 6.2.1 heading with a 2–3 bullet "Highlights" lead above the detailed lists. Don't leave "Unreleased" at the top of a published build.
- Where: `CHANGELOG.md`
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: S
- Priority: could
- Done when: The released CHANGELOG starts with a version heading and a highlights list.

**Task 2.6 — Rating link in README** *(added in review; a listing-only rating lever that stays within the no-in-product scope)*
- What: A low-key request for a rating.
- How: In the Support section, add one line: "If GitMind saves you time, a rating helps others find it". Link it to the Marketplace review page (`.../items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant&ssr=false#review-details`) and the OpenVSX listing's reviews. No incentives.
- Where: `README.md` Support
- Depends on: 2.4
- Skills: None
- Parallel: no
- Effort: S
- Priority: should
- Done when: Both links open the correct review area.

### Phase 3: Visual Assets
Checkpoint: the hero GIF and icon are approved and served from `GitMind-Community` URLs that return 200.

**Task 3.1 — Hero GIF of the core flow**
- What: A 6–12 s loop that goes from staged changes to the GitMind SCM button to the commit message filled in.
- How:
  1. The owner records it in a clean theme at about 1280 px wide, with no personal paths, repo names or keys visible.
  2. Convert with `ffmpeg` plus `gifski`, targeting ≤ 5 MB.
  3. Commit it to `images/screenshots/hero-generate.gif` in `GitMind-Pro`, and also push it to `GitMind-Community` `main`, which is the public host.
  4. Reference it by `raw.githubusercontent.com/shahabahreini/GitMind-Community/main/...`.
  5. The existing `**/*.gif` rule keeps it out of the VSIX.
- Where: `images/screenshots/hero-generate.gif` (both repos), `README.md`
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when: The public URL returns 200 without a redirect, the file is ≤ 5 MB, and the owner has approved the content.

**Task 3.2 — Screenshot refresh and order**
- What: Screenshots ordered by the funnel.
- How: Recapture any screenshot that doesn't match the current UI. Order: candidates and review workspace, commit styles, provider/model picker, Free features, Pro. Keep each ≤ 300 KB. Sync to `GitMind-Community` and update the `.vscodeignore` allowlist if files are renamed.
- Where: `images/screenshots/`, `README.md`, `.vscodeignore`
- Depends on: 2.4
- Skills: None
- Parallel: yes
- Effort: M
- Priority: should
- Done when: Every README screenshot matches the current UI and the order matches the list above.

**Task 3.3 — Gallery banner contrast**
- What: Match `galleryBanner` to the new icon.
- How: Check the `#0066cc` dark banner against the new icon and the header text. Adjust it if they blend.
- Where: `package.json` `galleryBanner`
- Depends on: 1.5
- Skills: None
- Parallel: yes
- Effort: S
- Priority: should
- Done when: The owner approves the header in a post-release screenshot.

### Phase 4: Publishing Pipeline
Checkpoint: one tag push in `GitMind-Pro` publishes the same audited VSIX to both stores, reruns are safe, and CI fails on listing drift.

**Task 4.1 — Automate dual-store publishing**
- What: Publish the audited VSIX to both stores from the release workflow in the private `GitMind-Pro` repo.
- How:
  1. Change the repo check in `release.yml` to `github.repository == 'shahabahreini/GitMind-Pro'`.
  2. Add `ovsx` as a devDependency.
  3. After "Audit VSIX contents", add a `vsce publish --packagePath <vsix> --skip-duplicate` step using an organization-scoped Azure DevOps PAT with Marketplace Publish scope (secret `VSCE_PAT`). Global PATs die on 2026-12-01. Microsoft Entra auth (`--azure-credential`) is an acceptable alternative if the owner has an Entra identity.
  4. Add an `ovsx publish <vsix> --skip-duplicate` step (secret `OVSX_PAT`).
  5. Publish the exact audited VSIX; never rebuild.
  6. If a secret is missing, skip that step with a warning. With `--skip-duplicate`, rerunning the workflow after a partial failure is safe.
  7. Document the secrets, their scope and their expiry dates in the workflow header comment. Add the PAT expiry dates to the owner's calendar.
  8. Change the GitHub Release step's CHANGELOG link to the public repo URL.
- Where: `.github/workflows/release.yml`, `package.json` devDependencies
- Depends on: None
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when:
  - A dry run passes: `vsce publish --packagePath` against an already-published version exits 0 thanks to `--skip-duplicate`, and the same for `ovsx`.
  - The 6.2.1 release publishes to both stores from a single workflow run.
  - A rerun of that workflow succeeds with no duplicate error.

**Task 4.2 — Listing lint**
- What: A script that fails CI on listing drift.
- How: Add `scripts/lint-listing.mjs` (`pnpm run lint:listing`). It checks:
  - Keyword count ≤ the Task 0.3 limit, with no duplicates.
  - Categories are within the allowed set.
  - The icon is square and ≥ 128 px.
  - Provider-count strings in the description, walkthrough and README equal the number of entries in the `gitmind.apiProvider` enum minus `custom`, unless qualified with "Pro".
  - No `<video>` tag in the README.
  - No URL in the README contains `AI-Commit-Assistant`.
  - Every README image and link uses absolute HTTPS.
  - With `--network`, every README URL returns 2xx with no redirect.

  Run the offline checks in `validate-extension.yml`. Run `--network` in `release.yml` before the publish steps.
- Where: `scripts/lint-listing.mjs`, `package.json` scripts, `.github/workflows/validate-extension.yml`, `.github/workflows/release.yml`
- Depends on: 1.2, 0.3
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when: The lint passes on the fixed tree, and fails when any one of these is reintroduced: an `AI-Commit-Assistant` URL, a "23 providers" string, a keyword over the limit, or a `<video>` tag (each checked with a temporary local edit).

**Task 4.3 — Post-publish parity check**
- What: Confirm both stores show the tagged version.
- How: After both publish steps, poll both store APIs every 60 s for up to 10 minutes. Warn and write a job summary if a version differs.
- Where: `.github/workflows/release.yml`
- Depends on: 4.1
- Skills: None
- Parallel: no
- Effort: S
- Priority: should
- Done when: The workflow summary shows both store versions matching the tag.

### Phase 5: Release & Measure
Checkpoint: the listing release is live on both stores, visually checked, and measured weekly through +30 days.

**Task 5.1 — Release, visual check and rollback readiness**
- What: Ship the listing changes, inspect them, and keep a rollback path.
- How:
  1. Before tagging, copy the current `displayName`, `description`, `categories`, `keywords` and `icon` values into `docs/research/listing-metrics.md` under "Pre-release manifest" (the rollback source).
  2. Bump to 6.2.1 and push the tag in `GitMind-Pro`. Task 4.1 publishes.
  3. Open both listings and check the name, description, categories, icon, hero GIF, screenshots, links and the OpenVSX verified badge (if Task 1.3 is done).
  4. Capture "after" screenshots.
  5. Rollback: stores cannot revert metadata in place. If the listing renders broken, fix forward in 6.2.2 within 24 h, restoring the saved values if needed.
- Where: Both store listings, `docs/research/`
- Depends on: 0.1, all Phase 1–4 `must` tasks
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: The pre-release manifest values are saved, both listings show 6.2.1, and every check in step 3 passes.

**Task 5.2 — Measure impact**
- What: Compare against the baseline.
- How:
  1. Rerun the Task 0.1 snapshot and the Task 0.2 rank script weekly through +30 days.
  2. Compute weekly installs and downloads for each store, and the publisher-hub conversion.
  3. Count access-log UTM hits by `utm_campaign`.
  4. Note confounders such as other releases or external mentions.
  5. Write a verdict for each success measure in §1.
- Where: `docs/research/listing-metrics.md`
- Depends on: 5.1
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: At least four weekly post-release rows exist, plus a verdict line for each success measure.

## 7. Risks & Countermeasures
| Risk | Impact | Countermeasure |
|---|---|---|
| A new displayName hurts recognition or collides with an existing name | Confusion, or the publish is rejected | Keep "GitMind" first, check uniqueness, owner approval (Task 2.1) |
| The Marketplace PAT is a global PAT or expires | Publishing fails from 2026-12-01, or earlier if it expires | Organization-scoped PAT or Entra; expiry recorded and calendared; the step warns when the secret is missing (Task 4.1) |
| A partial publish (one store fails) | The stores drift | `--skip-duplicate` makes reruns safe; Task 4.3 parity check |
| The `GitMind-Community` rename redirect breaks, or the repo changes visibility | All listing images break | Task 1.1 removes the redirect dependency; A6 and the `--network` lint |
| Handbook pages moved from the README aren't synced to public Pages | New README links 404 | Task 2.4 requires the live 200 check before linking |
| A keyword change drops ranking for terms that bring installs today | Fewer installs | Research-backed keep list; weekly rank script; restore saved keywords if rank and installs both fall at +14 days |
| The hero GIF is too large or shows private data | Slow page or a leak | ≤ 5 MB, clean capture, owner approval (Task 3.1) |
| 6.2.0 slips past 2026-09-27 | Perplexity users break | Task 0.5 runs first and doesn't depend on listing work |
| Access logs are unavailable or rotate too fast | The Pro-click measure can't be observed | A7 is checked in Task 0.1; the measure is dropped with a note if it fails |
| API rank differs from what users see in the editor | Misleading rank metric | The A4 comparison in Task 0.2; rank is treated as directional |
| README over-promises Pro features as free | Bad reviews | Task 2.2 rule; accurate Free vs Pro table |

## 8. Verification & Replanning
- Per task: its "Done when" condition. Also run `pnpm run package`, `pnpm run package:audit` and `pnpm run lint:listing` after any change to `package.json`, `.vscodeignore`, `README.md` or `images/`.
- Overall:
  - `lint:listing --network` passes.
  - The Task 5.1 visual check passes on both stores.
  - Task 5.2 verdicts are recorded.
- Replan when:
  - Task 0.3 disproves A1–A3 or A8.
  - Task 0.2 shows GitMind already ranks in the top 3 for all primary terms (shift the focus to conversion assets).
  - Either store rejects the publish.
  - Installs fall on both stores at +14 days.
  - 6.2.0 cannot ship before 2026-09-27.

## 9. Traceability
| Objective | Covered by tasks |
|---|---|
| Rank for high-intent searches | 0.2, 0.3, 1.4, 2.1, 2.2, 2.3 |
| Convert visitors to installs | 1.1, 1.5, 1.6, 1.7, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3 |
| Trust signals | 1.2, 1.3, 2.6 |
| Route interested users to Pro | 2.4 (Pro CTA, UTM), 5.2 (log count) |
| Store parity and no drift | 4.1, 4.2, 4.3 |
| Don't disrupt 6.2.0 | 0.5 |
| Measurable impact | 0.1, 0.4, 5.1, 5.2 |

## 10. Handover Summary
- Context:
  - Extension `ShahabBahreiniJangjoo.ai-commit-assistant`. Source is in the private repo `~/Documents/Hobby/GitMind-Pro`. The public host (images, Handbook, Issues) is `shahabahreini/GitMind-Community`.
  - Audit evidence is in §2, collected 2026-09-22.
- Decisions (owner, 2026-09-22):
  1. Optimize for qualified installs leading to Pro.
  2. One store-neutral README.
  3. Scope: listing metadata/README, visual assets and the publishing pipeline. No in-product levers.
  4. Ship 6.2.0 unchanged first; the listing work ships as 6.2.1.
  5. Measure the Pro step through server access logs.
  6. CI publishing runs in private `GitMind-Pro`.
  7. Canonical wording: "22 built-in AI providers" plus Pro Custom API.
- State: done: audit and review. Pending: all tasks. Blocked: none (Task 1.3 waits on Eclipse; Task 0.1 waits for 6.2.0 + 7 days).
- Remaining tasks:
  - Now: 0.5, 1.3, 0.2, 0.3, 1.1, 1.2, 1.5, 3.1 and 4.1 in parallel.
  - Next: 0.1 at 6.2.0 + 7 days.
  - Then: the copy tasks (2.x) after research, the README (2.4), the lint (4.2), and the release (5.1).
  - All paths are listed per task.
- Verification: §8.
- Risks and how to detect them early:
  - Broken or redirecting URLs: `lint:listing --network`.
  - Ranking loss: the weekly rank script.
  - Publish drift: Task 4.3.
  - Token expiry: the calendar entry and the missing-secret warning.

## 11. Review appendix
- Findings (review of v1.0):
  1. A5 was false: the release and Pages workflows can never run, because they check for the renamed `AI-Commit-Assistant` repo. Fixed in Task 4.1; Pages is recorded as out of scope. — proven
  2. The images depend on the old-repo redirect. Task 1.1 was broadened, and a lint rule was added. — proven
  3. Global Azure DevOps PATs stop working on 2026-12-01, so the plan's generic `VSCE_PAT` would have broken. Task 4.1 now specifies an org-scoped PAT or Entra. — proven
  4. gitmind-pro.com has no analytics, so the UTM measure was unobservable. It now uses access logs (A7). — proven
  5. The unreleased 6.2.0 carries a deadline-bound fix and would have confounded measurement. Task 0.5 was added and the release number fixed as 6.2.1. — proven
  6. Publishing was not idempotent; a partial failure could not be rerun safely. `--skip-duplicate` added. — likely
  7. The measurement design was too thin: two snapshots, no conversion data. Weekly snapshots, publisher-hub acquisition data and a reusable rank script were added. — likely
  8. The GIF and moved Handbook pages must be synced to the public repo, or the README links break. The sync and a live check were added to Tasks 2.4, 3.1 and 3.2. — proven
  9. There was no rollback path for listing metadata. A pre-release manifest snapshot and a fix-forward window were added in Task 5.1. — likely
  10. Naming editors and trademarks in the copy needed compatibility and policy checks. Tasks 0.3, 1.6, 2.1 and 2.3 were updated (A8). — possible
  11. An unmonitored Q&A tab and the absence of any rating ask were addressed with listing-only tasks 1.7 and 2.6. — possible
- Decisions: see §10 decisions 4–6 (made in review).
- Task ID changes: added 0.5 (sequencing), 1.7 (Q&A) and 2.6 (rating link). No task was dropped or renumbered.
- Remaining risks:
  - Store ranking algorithms are undocumented, so outcomes are uncertain even with correct execution. — uncertain
  - OpenVSX verification timing is outside the owner's control. — possible
  - Weekly metrics are noisy at the current volume (~0.3 trendingweekly). The verdicts may be inconclusive at +30 days. — likely
- Applicable checks and evidence:
  - Every task has a clear user need and an observable "Done when".
  - Every risk has a countermeasure.
  - Release safety comes from the dedicated patch, `--skip-duplicate`, the parity check and the rollback snapshot.
  - Evidence: curl results against both store APIs, GitHub APIs and all README URLs; the `git tag` and `git log` output; the website source search; the Microsoft Learn PAT retirement notice.
- Non-applicable checks and reasons:
  - Structured logs, correlation IDs and alerts: no runtime service changes. Workflow job summaries cover diagnosability.
  - Data migration and concurrency: none.
  - Accessibility: limited to image alt text (Task 2.4) and icon legibility (Task 1.5).
- Blockers and resolution needed: none.
