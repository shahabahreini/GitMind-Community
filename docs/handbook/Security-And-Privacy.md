# Security And Privacy

> Verified against GitMind `6.0.0` on July 14, 2026.

## Data Flow

GitMind reads repository state through argument-based Git process calls and builds an in-memory change set. Raw diffs, prompts, issue bodies, and provider responses are not persisted by commit-intelligence workflows. For cloud providers, only the context selected in the request preview is sent to the configured provider.

Ollama can keep generation local when its server and model run on your machine. A remotely hosted Ollama URL is not local processing.

Every provider-bound generation and repair has its own confirmation. The preview names the provider, model, destination host, context categories, files, filtering decisions, and token estimates. Loopback endpoints still show the preview.

## Local Privacy Screening

GitMind screens selected content for private-key markers, credential-like assignments, high-entropy strings, sensitive filenames, and oversized content. It also classifies generated, minified, lock, binary, and formatting-only changes. Secret-like content needs a separate per-item override before it can be included. Detection is heuristic and never exhaustive.

Diffs, issue text, branch names, history, and notes are wrapped as untrusted data in provider prompts. GitHub issue text is fetched only after you enable the feature, select a reference, approve authentication, and approve the later provider request. It remains in memory for that workspace. Other trackers use pasted summaries.

## Git Mutation Boundary

Generation and adjacent workflows create editable drafts only. Commit Composer is the sole v6 workflow that can mutate local Git state, and only after an explicit reviewed apply. It refuses detached HEAD, conflicts, merge/rebase/cherry-pick state, and stale snapshots; runs hooks in a temporary detached worktree; updates the branch with compare-and-swap; restores the original ref and byte-equivalent index on failure; and never pushes.

## Credentials

- Free users' provider keys are stored in VS Code settings.
- Pro users can enable `gitmind.pro.encryptionEnabled` to migrate provider keys into VS Code SecretStorage.
- Custom API tokens are credentials and must be protected.
- Never commit keys in workspace settings or paste them into issues, screenshots, logs, or prompts.

## Diagnostics And Support Reports

`gitmind.showDiagnostics` shows model/token estimates before generation. Production builds do not expose raw debug logging. Development logging does not make raw commit-intelligence prompts, diffs, issue bodies, or provider responses part of support reports. Pro users can opt into a 30-minute sanitized support session from **GitMind Settings > Pro > Support Report**. The report stays in memory until the user reviews and saves it; GitMind never uploads it automatically.

The report uses a fixed allowlist: extension/VS Code versions, platform family, operation/provider categories, HTTP status, relative timing, and recovery outcomes. It rejects source code, diffs, prompts, commit content, repository/file paths, URLs, credentials, API bodies, raw errors, email, and license/customer identifiers. Review the JSON before attaching it to an issue.

## Product Telemetry

GitMind does not collect or transmit product telemetry. Provider requests still send the selected prompt and diff to the provider configured by the user, as described above; those functional requests are not analytics.

## Privacy Boundary

GitMind cannot control what a configured provider stores after a request. It also cannot make a cloud endpoint local. For sensitive repositories, use an approved provider, Ollama, or a private Custom API and follow your organization's policy.
