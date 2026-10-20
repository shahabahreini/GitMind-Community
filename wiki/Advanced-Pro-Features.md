# Advanced Pro Features

> Verified against GitMind `6.6.0` on October 19, 2026

## Large Diff Processing

GitMind tries one request first. A diff that fits the selected model is sent as it is. When a diff is larger than the model accepts, Pro condenses it locally and still makes **one** request, with no approval prompt:

1. Generated and vendored files (lockfiles, minified bundles, source maps, snapshots, build output, generated code) are replaced by a one-line note.
2. Pure renames, mode changes, and deleted files shrink to a name plus line counts.
3. Very long files keep their first and last hunks and the headers of the hunks between them (`gitmind.pro.largeDiffHandling.perFileLines`).
4. If the diff still does not fit, every changed file is listed with its line counts and the remaining space goes to full hunks, manifests and source before tests and docs. If the list alone would use half of a tiny budget, files are counted per directory.

A short notice states how many files were summarized. The target size is the smaller of the model's input limit and `gitmind.pro.largeDiffHandling.maxPromptTokens` (automatic: 60,000 estimated tokens; 6,000 for Ollama and LM Studio, which also receive a matching `num_ctx`). If a provider rejects the prompt as too large, GitMind retries with half the size and then a quarter, for at most three provider requests in total, without approval. Token counts are estimates (about three bytes per token plus a margin) unless the provider offers an exact counter. Free access is unchanged: a diff over the model limit still returns the input-limit message.

**Deep analysis (optional).** Turn on `gitmind.pro.largeDiffHandling.enabled` to let GitMind offer multi-request analysis when condensing would drop content. The plan shows the number of calls, including the final message and expected summary reductions, and needs modal approval each time. A plan larger than `gitmind.pro.largeDiffHandling.maxCalls` (default 6) is never started; GitMind uses the condensed single request instead, as it does if you decline, if the approved total is exceeded, or if a call fails with an input limit. Approved calls run one at a time and stop on a rate limit; cancelling returns no partial commit message. `batchSize`, `chunkSize`, `concurrency`, and `maxChunks` are deprecated compatibility settings; the planner uses the model budget and sequential calls. Review results for large changes: condensed diffs omit low-priority detail by design. Audio, video, and image bodies are omitted from AI input. Source files over 1 MiB are represented by filename only. JSON record collections, JSON Lines, CSV, and TSV files from 64 KiB through 1 MiB receive a local structural summary with record or row counts, field names, size, and a short content fingerprint; larger ones use filename and size. Ordinary JSON configuration objects keep their normal diff. Generated lockfiles from 32 KiB through 1 MiB receive a size and fingerprint note. Smaller files keep their normal diff. For staged changes, these notes use the staged file content.

## Changelog Generation

Changelog generation reads committed messages and bodies from Git history. It does not read staged diffs or file contents, so large structured data and media files do not add their bodies to a changelog prompt. Its prompt asks the model to describe only changes supported by those commits.

## Commit Composer

`gitmind.commitComposer` uses the selected stable change IDs and a local relationship graph for shared paths, source/tests, imports, configuration, generated outputs, locks, renames, and hunk proximity. AI proposals may refer only to those IDs. Binary, rename-only, submodule, and generated-file atoms remain indivisible.

The editable plan supports grouping, ordering, exclusions, and group messages. Applying a reviewed plan rejects detached or stale state and active conflicts/merge/rebase/cherry-pick operations. GitMind prepares commits in a temporary detached worktree so hooks run, compare-and-swaps the original branch, preserves excluded work, restores the ref and byte-equivalent index on failure, removes temporary worktrees, and never pushes.

## Candidates, Health, And Review

- `gitmind.commit.candidates.enabled` requests 3 distinct AI candidate archetypes (**Concise 1-liner**, **Detailed breakdown**, and **Intent focus**) in one provider request.
- Interactive candidate selection (**GitMind: Draft Options & Commit Quality**) features a **live multiline preview in the top QuickPick placeholder bar**, displaying the full un-truncated commit message as you navigate choices with arrow keys.
- **Commit Health** is a deterministic local report for staged changes. Its score checks change scope, size, potential credentials/debug statements, test changes, and staging state; it never scores AI output or commit-message wording. Enable it from its own Settings card, then use **Open Health Report** or the Command Palette. History Health can analyze a last-N or date range locally; optional AI guidance receives only the aggregate score report.
- `gitmind.review.enabled` enables opt-in findings tied to stable change IDs. When active, draft generation automatically renders a **Pre-Commit Code Review Panel** in the workspace panel with color-coded severity callouts (`ERROR`, `WARNING`, `INFO`), details, and impacted file atom tags. `gitmind.review.blockingThreshold` defaults to `off`; explicit `warning` or `error` thresholds block apply/insertion when severe findings exist.
- Squash, pull-request, stash, release-note, explanation, and review commands create editable drafts only.

## Model Parameters

Set `gitmind.pro.advancedModelConfig.mode` to `custom`, then independently enable:

| Parameter | Default | Range |
| --- | --- | --- |
| Temperature | `0.2` | 0-2 |
| Top-p | `0.9` | 0-1 |
| Top-k | `40` | 0-500 |
| Max output tokens | `350` | 1-65536 |

Provider support varies. Disabled parameters and `auto` mode leave decisions to GitMind/provider defaults.

## Language And Output Limits

- `gitmind.commit.targetLanguage`: choose from the searchable language list; default English.
- Summary length: enable and set 50-100 characters; default 72.
- Body line limit: enable and set 2-15 lines; default 5.

## Learn From Commit History

Run **GitMind: Learn from Commit History (Pro)** to analyze your repository's recent conventions. Configure 10-2500 commits and whether author/date information is included. The learned context helps future messages match the repository, but generated output still requires review.

Commit history and diffs are included in provider prompts when these features use a cloud provider.

## Sanitized Support Report

The Pro Settings support tab can capture a 30-minute, memory-only session containing fixed operational categories and relative timing. It is designed for reproducing difficult provider and recovery failures without collecting code, diffs, prompts, paths, credentials, raw API bodies, raw errors, or customer identifiers. The user must review and save the JSON locally, then share it manually.
