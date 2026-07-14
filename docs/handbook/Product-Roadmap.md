# Product Roadmap

> Verified against GitMind `6.0.0` on July 14, 2026.

This roadmap distinguishes the stable v6 implementation from deliberately deferred work. GitMind continues to offer Free and Pro.

## Product Principles

- You remain in control: GitMind should preview generated content and never stage, commit, push, or add attribution without an explicit action.
- Context is opt-in and visible: before generation, you should be able to understand what will be sent to the configured provider.
- Privacy comes before convenience: local providers remain available, and sensitive content should be easy to detect and exclude.
- Better commits matter more than longer messages: output should be concise, relevant, and aligned with repository conventions.

## Shipped In v6: Quality, Context, And Privacy

The first priority is making everyday generation more dependable for everyone:

- Produce concise messages without redundant file lists, using a subject alone for simple changes and a body only when it adds value.
- Let you optionally explain the intended outcome and include relevant branch or issue context.
- Validate malformed, excessively verbose, empty, or repository-policy-breaking responses before presenting them.
- Reduce prompt noise from formatting-only changes, generated files, lockfiles, and binaries.
- Keep review and editing explicit before any Git action.
- Preview the context and approximate token volume that will be sent to the selected provider.
- Detect likely secrets and sensitive paths before submission, with controls to exclude them.

## Shipped In v6 Pro: Compose And Compare

The next Pro workflow is an interactive Commit Composer for turning a mixed working tree into clear, reviewable commits:

- Suggest logical commit groups based on how changes relate, not only on filenames.
- Let you assign files or hunks, reorder groups, edit messages, squash suggestions, or cancel before GitMind changes repository state.
- Compare concise, detailed, and intent-focused message candidates side by side.
- Use richer context only when you choose it, including issue text, repository history, session summaries, and notes.
- Highlight possible quality problems such as missing intent, mixed concerns, unusual verbosity, or repository-rule violations.

## Shipped In v6 Pro: More Git Workflows

The same context and review experience can support more than individual commit messages:

- Squash messages, pull-request descriptions, stash messages, release notes, and explanations of existing commits.
- Optional pre-commit review with severity levels; blocking remains off unless explicitly configured.
- Reviewed squash, pull-request, stash, release-note, explanation, and change-review drafts are available without creating remote or stash objects.

## Deferred Beyond v6

The organization-focused Pro track aims to make GitMind fit established development and compliance practices:

- Version-controlled repository policies for commit types, scopes, tickets, length, language, trailers, and custom validation.
- Compatibility with commitlint rules and organization-managed defaults.
- Enterprise provider gateways, multi-host issue authentication, a persistent Intent Ledger, Acceptance Learning, and a Capability Router are not part of v6.
- Local compliance summaries without remote activity tracking or product telemetry.
- AI attribution remains off by default; every trailer requires an explicit, previewed choice.

## Share Feedback

Roadmap ordering is guided by user outcomes and technical learning. To describe a workflow that is not covered here, use [Support And Requests](Support-And-Requests) and include the problem you are trying to solve, the context GitMind lacked, and what a trustworthy result would look like. Do not include source code, diffs, credentials, or private repository details in public issues.
