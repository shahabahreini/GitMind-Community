# Generating Commit Messages

> Verified against GitMind `6.0.0` on July 14, 2026.

## Generate

Use the Source Control GitMind button, **GitMind: Generate GitMind Commit Message** in the Command Palette, or `Ctrl+Alt+G` / `Cmd+Alt+G`. GitMind opens a reviewed workspace for the selected repository. Nothing is sent until you choose the included, summarized, and excluded changes and approve the provider request.

Enable `gitmind.commit.captureAllChanges` to include staged, unstaged, and untracked changes. With multiple repositories, select the intended repository when prompted.

## Review Context And Intent

The workspace accepts optional **Why / intended outcome**, issue or branch context, and user notes. Changes receive stable local IDs and are classified as source, formatting-only, generated, lockfile, minified, binary, or configured exclusions. Every decision is reversible before generation.

Likely private keys, credential assignments, high-entropy strings, sensitive filenames, and oversized content are screened locally. A finding must be excluded, summarized, or separately overridden. This screening is best-effort and cannot prove that content is secret-free.

Before each generation or repair request, GitMind shows the provider, model, destination host, context categories, included/summarized/excluded files, and estimated input/output tokens. Ollama and loopback Custom API endpoints receive the same preview without the remote-data warning.

## Shape The Result

- `gitmind.commit.detailMode`: `auto`, `concise`, or `detailed`. Auto adds a body for explicit intent, multiple concerns, breaking changes, more than two files, or more than three hunks.
- `gitmind.commit.verbose`: legacy compatibility only; explicit values migrate to concise/detailed.
- `gitmind.commit.noiseFiltering.enabled`: classify lower-value context before generation.
- `gitmind.commit.candidates.enabled`: request concise, detailed, and intent-focused Pro candidates in one provider call.
- `gitmind.commit.githubIssueContext.enabled`: permit an explicitly selected GitHub issue to be fetched after authentication approval.
- `gitmind.commitStyle.style`: choose the output convention.
- `gitmind.promptCustomization.enabled`: ask for extra context before generation.
- `gitmind.promptCustomization.saveLastPrompt`: prefill the last custom context.
- **View Last Custom Prompt** and **Clear Last Custom Prompt** manage saved context.
- `gitmind.showDiagnostics`: show model and token information before sending.

Custom context should explain intent that is not obvious from the diff, such as a ticket goal or compatibility constraint. Do not paste secrets or unrelated private data.

## Validation And Repair

GitMind validates empty output, subject/body structure, style, type, scope, length, whitespace, repeated file inventories, boilerplate, trailers, ticket rules, and repository policy. Invalid drafts stay editable but cannot be inserted into Source Control. **Repair edited draft** creates a separate request with a new provider preview and confirmation.

Only a valid draft that you explicitly choose is inserted into the selected repository's SCM input. Normal generation never stages, commits, pushes, rewrites history, creates remote objects, or adds AI attribution.

## Repository Policy

Add `.gitmind/commit-policy.json` with `"version": 1` to define allowed types/scopes, scope requirements, subject case/length, body/footer limits, language, tickets, trailers, and review blocking threshold. GitMind also imports the safe static subset of JSON commitlint configuration: `type-enum`, `scope-enum`, `scope-empty`, `header-max-length`, `subject-case`, and body/footer line-length rules. JavaScript and CJS configuration is never executed.

## Common Workflows

| Goal | Configuration |
| --- | --- |
| Short commit | Set detail mode to Concise |
| Conventional Commit | Select Conventional Commits style |
| Include working tree | Enable Capture All Changes |
| Explain intent | Fill in Why / intended outcome |
| Keep changes local | Select Ollama |
| Diagnose model size | Enable diagnostics |
| Match team history | Run Pro **Learn from Commit History** |

See [Commit Styles And Emoji](Commit-Styles-And-Emoji), [Automatic Recovery](Automatic-Recovery), and [Security And Privacy](Security-And-Privacy).
