# Generating Commit Messages

> Verified against GitMind `6.1.2` on September 3, 2026

## Generate

Use the Source Control GitMind button, **GitMind: Generate GitMind Commit Message** in the Command Palette, or `Ctrl+Alt+G` / `Cmd+Alt+G`. GitMind opens a reviewed workspace for the selected repository. Nothing is sent until you choose the included, summarized, and excluded changes and approve the provider request.

Enable `gitmind.commit.captureAllChanges` to include staged, unstaged, and untracked changes. With multiple repositories, select the intended repository when prompted.

## Review Context And Intent

The workspace uses a guided 3-step dashboard (`1: Scope & Intent` ➔ `2: Generate Draft` ➔ `3: Quality Review & Insertion`) with Git branch badges and vector line icons. It accepts optional **Why / intended outcome**, issue or branch context, and user notes. Changes receive stable local IDs with file line diff stats (`+24/-10`) and are classified as source, formatting-only, generated, lockfile, minified, binary, or configured exclusions. Every decision is reversible before generation, with quick bulk context buttons (`Include All`, `Summarize All`, `Exclude All`).

Likely private keys, credential assignments, high-entropy strings, sensitive filenames, and oversized content are screened locally. A finding must be excluded, summarized, or separately overridden. This screening is best-effort and cannot prove that content is secret-free.

Before each generation or repair request, GitMind shows the provider, model, destination host, context categories, included/summarized/excluded files, and estimated input/output tokens. Ollama and loopback Custom API endpoints receive the same preview without the remote-data warning.

## Candidate Selection & QuickPick Multiline Preview

When `gitmind.commit.candidates.enabled` is active:
- Running **GitMind: Draft Options & Commit Quality** (`gitmind.draftChoices`) prompts the AI model for 3 distinct candidate archetypes: **Candidate 1 (Concise 1-liner)**, **Candidate 2 (Detailed breakdown)**, and **Candidate 3 (Intent focus)**.
- The interactive VS Code QuickPick selector features a **live multiline preview in the top placeholder bar**: as you navigate between candidate choices using arrow keys, the full un-truncated commit message (subject and body) is rendered instantly.
- Selecting a candidate inserts the draft directly into your SCM input box or launches the Reviewed Workspace panel for deeper review.

## Quality Review & Pre-Commit Code Review

- **Commit Health**: A Pro, local staged-change report that scores scope, size, safety, test coverage, and staging—not the generated commit message. Open it from Settings or **GitMind: Open Commit Health Report**.
- **Pre-Commit Code Review Panel**: When `gitmind.review.enabled` is active, GitMind automatically executes a pre-commit code review pass and renders findings with color-coded severity callouts (`ERROR`, `WARNING`, `INFO`), details, and impacted file atom tags right above the editable draft.

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

GitMind validates empty output, subject/body structure, style, type, scope, length, whitespace, repeated file inventories, boilerplate, trailers, ticket rules, and repository policy. It also automatically cleans and deduplicates trailing colons across all built-in providers to prevent invalid formatting like `feat(commit)::`. Invalid drafts stay editable but cannot be inserted into Source Control. **Repair edited draft** creates a separate request with a new provider preview and confirmation.

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
