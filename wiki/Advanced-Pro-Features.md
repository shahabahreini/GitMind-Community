# Advanced Pro Features

> Verified against GitMind `6.0.0` on July 14, 2026.

## Large Diff Processing

GitMind Pro estimates available model context and splits substantial diffs into manageable chunks. Chunk summaries are combined into the final commit message. Large diffs still cost more, take longer, and may omit low-priority detail; review the result.

## Commit Composer

`gitmind.commitComposer` uses the selected stable change IDs and a local relationship graph for shared paths, source/tests, imports, configuration, generated outputs, locks, renames, and hunk proximity. AI proposals may refer only to those IDs. Binary, rename-only, submodule, and generated-file atoms remain indivisible.

The editable plan supports grouping, ordering, exclusions, and group messages. Applying a reviewed plan rejects detached or stale state and active conflicts/merge/rebase/cherry-pick operations. GitMind prepares commits in a temporary detached worktree so hooks run, compare-and-swaps the original branch, preserves excluded work, restores the ref and byte-equivalent index on failure, removes temporary worktrees, and never pushes.

## Candidates, Health, And Review

- `gitmind.commit.candidates.enabled` requests 3 distinct AI candidate archetypes (**Concise 1-liner**, **Detailed breakdown**, and **Intent focus**) in one provider request.
- Interactive candidate selection (**GitMind: Draft Options & Commit Quality**) features a **live multiline preview in the top QuickPick placeholder bar**, displaying the full un-truncated commit message as you navigate choices with arrow keys.
- **Commit Health Rating Gauge** displays a visual score meter (0–100) weighted 30% relevance, 25% atomicity, 25% rule compliance, 10% intent completeness, and 10% verbosity, with line-item conventional compliance status checks.
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
