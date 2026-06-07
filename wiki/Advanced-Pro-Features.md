# Advanced Pro Features

> Verified against GitMind `5.0.0` on June 7, 2026.

## Large Diff Processing

GitMind Pro estimates available model context and splits substantial diffs into manageable chunks. Chunk summaries are combined into the final commit message. Large diffs still cost more, take longer, and may omit low-priority detail; review the result.

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
