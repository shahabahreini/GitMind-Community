# Listing Keyword & Competitor Research — 2026-09

> Collected 2026-09-22 against listing version 6.1.2. Reproduce with `python3 docs/research/listing-rank.py [--top]`.

## Rank for seed terms (top 50 checked)

| Term | Marketplace rank (of 50) | OpenVSX rank (of 50) |
|---|---|---|
| ai commit | >50 | >50 |
| commit message | >50 | >50 |
| commit message generator | >50 | >50 |
| conventional commits | >50 | >50 |
| copilot commit | 19 | >50 |
| ollama commit | 15 | >50 |
| git ai | 40 | >50 |
| gitmoji | 32 | 16 |
| changelog generator | 13 | >50 |

OpenVSX's editor-facing gallery endpoint (`/vscode/gallery/extensionquery`, used by editors built on OpenVSX) gives the same result: `ai commit` >50, `commit message generator` >50, `gitmoji` 16.

## What wins

- **The exact phrase in the display name wins.** Extensions with few installs whose name contains the query phrase outrank GitMind (1,219 installs). Examples: "Scribe - AI Commit Message Generator" (6 installs) is #8 and "DBZ Commit Message Generator" (17) is #2 for `commit message generator`. "PTN AI Commit Generator" (11) is #5 for `ai commit`.
- GitMind's name, "GitMind: AI-Powered Commit Messages", contains none of the three core phrases (`ai commit`, `commit message`, `commit message generator`). Its keywords already include `ai commit message` and `commit-message`, and it still ranks >50. **Conclusion: keywords carry little weight next to the display name** (A4 supported for the name; weak for keywords).
- GitMind does rank where its keywords or description are specific and competition is thin: `changelog generator` #13, `ollama commit` #15, `copilot commit` #19 (Marketplace).
- Full top-10 dumps per term are in the `--top` output. The Marketplace API does not return tags with flags 914, so competitor tags are not compared (limitation).

## A4: API rank vs in-editor rank

VS Code's Extensions view queries the same Marketplace `extensionquery` endpoint with a `searchText` filter (filterType 10) and relevance sort. Editors built on OpenVSX query `open-vsx.org/vscode/gallery/extensionquery`, which is checked above. API rank is therefore treated as equal to in-editor rank. A manual spot check in the editor is folded into Task 5.1.

## Chosen terms

**Primary (display name and description):**
1. `ai commit`: the first query users type; GitMind is currently >50 on both stores.
2. `commit message`: broad, high volume; the top results are exact-name matches.
3. `commit message generator`: exact-name matches dominate; low-install competitors rank top 10.

The single phrase **"AI Commit Message Generator"** contains all three.

**Secondary keywords (29; vsce adds a derived `keybindings` tag, so 29 keywords plus 1 derived tag = the Marketplace's 30-tag maximum):**

| Keyword | Rationale |
|---|---|
| ai commit | primary term |
| commit message | primary term |
| commit message generator | primary term |
| ai commit message | kept; exact long-tail phrase |
| git commit | common query form ("git commit message") |
| git | single-token match |
| ai | single-token match |
| git ai | GitMind already ranks #40; reinforce |
| conventional commits | kept; standard GitMind supports |
| gitmoji | kept; ranks #32 MP / #16 OV |
| semantic release | kept; supported style |
| changelog | kept; ranks #13 for `changelog generator` |
| changelog generator | new; exact phrase where GitMind already ranks |
| source control | kept; matches the SCM category |
| copilot | new short form; `copilot commit` ranks #19 |
| github copilot | kept |
| ollama | kept; `ollama commit` ranks #15 |
| lm studio | kept; local AI |
| local ai | kept |
| llm | new; generic model query |
| openai | kept |
| claude | new; Anthropic's model name is more searched than the company |
| anthropic | kept |
| gemini | kept |
| deepseek | new; supported provider with high search interest |
| openrouter | kept |
| azure openai | kept; enterprise |
| amazon bedrock | kept; enterprise |
| vertex ai | kept; enterprise |

**Dropped from the 6.1.2 keywords:**
- `commit`: dropped to stay within 30 manifest tags; several kept phrases already contain it
- `commit-message`: duplicate of `commit message`
- `commit generator`: covered by `commit message generator`
- `developer productivity`: generic, no match
- `multi provider ai`: nobody searches it
- `cloudflare workers ai`, `nvidia nim`: niche; kept in the README providers table instead

## Platform constraints (Task 0.3)

| Item | Finding | Source |
|---|---|---|
| A1 categories | The docs list no `AI` or `Chat`, but the live Marketplace has an `AI` category (4,159 extensions, led by GitHub Copilot) and OpenVSX has 1,176 in `AI`. vsce 3.6 does not validate categories locally. **Confirmed: use `AI`.** | Manifest reference; Marketplace `extensionquery` filterType 5; OpenVSX `/api/-/search?category=AI` |
| A2 keywords | "This list is currently limited to 30 keywords." Exceeding it fails the publish ("You exceeded the number of allowed tags of 30"). **Confirmed.** | Manifest reference; publishing guide |
| A3 README media | Images must resolve to HTTPS and may not be SVG unless from a trusted badge provider. The docs don't cover `<video>`; stores sanitize README HTML. **Likely stripped; not verified in a browser.** The GIF approach works either way; the owner checks this during the Task 5.1 visual check. | Publishing guide |
| displayName | "The display name must be unique to the Marketplace." Candidate names were checked with no clash. A separate Marketplace extension named plain **"GitMind"** exists, so keep the full descriptive name. | Manifest reference; search API |
| Trademarks | No explicit rule in the docs. Following the plan, third-party names stay out of the display name and appear only as compatibility keywords and README text. | Plan policy |
| Icon | At least 128×128; 256×256 for Retina. Not SVG. | Manifest reference |
| `qna` | `marketplace` (default), a URL string, or `false`. | Manifest reference |
| `pricing` | `Free` (default) or `Trial`. Left at the default. | Manifest reference |
| Marketplace auth | Marketplace (Manage) scope. Global PATs retire 2026-12-01; `vsce publish --azure-credential` (Microsoft Entra) is the durable path. | Publishing guide; Microsoft Learn |
| Visible length | Search cards truncate by pixel width, not a fixed character count. Rule: keep the primary phrase within the first ~36 characters of the name and the key message within the first ~90 characters of the description. **Estimated; not verified in a browser.** | Estimate |
| A8 engines `^1.101.0` | VSCodium 1.135.06055 (2026-09-09) meets it. The VS Code base versions of Cursor and Windsurf were not found in public sources, so the README names **only VSCodium** plus "other editors that use Open VSX". | GitHub releases API; web search |
