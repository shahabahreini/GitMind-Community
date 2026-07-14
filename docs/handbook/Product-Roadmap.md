# Product Roadmap

> Verified against GitMind `5.0.6` on July 13, 2026.

This roadmap describes the outcomes GitMind is exploring next. It is directional, may change as we learn, and does not promise specific features or release dates. GitMind will continue to offer Free and Pro; organization-focused capabilities are part of the Pro roadmap rather than a separate plan.

## Product Principles

- You remain in control: GitMind should preview generated content and never stage, commit, push, or add attribution without an explicit action.
- Context is opt-in and visible: before generation, you should be able to understand what will be sent to the configured provider.
- Privacy comes before convenience: local providers remain available, and sensitive content should be easy to detect and exclude.
- Better commits matter more than longer messages: output should be concise, relevant, and aligned with repository conventions.

## Now: Quality, Context, And Privacy

The first priority is making everyday generation more dependable for everyone:

- Produce concise messages without redundant file lists, using a subject alone for simple changes and a body only when it adds value.
- Let you optionally explain the intended outcome and include relevant branch or issue context.
- Validate malformed, excessively verbose, empty, or repository-policy-breaking responses before presenting them.
- Reduce prompt noise from formatting-only changes, generated files, lockfiles, and binaries.
- Keep review and editing explicit before any Git action.
- Preview the context and approximate token volume that will be sent to the selected provider.
- Detect likely secrets and sensitive paths before submission, with controls to exclude them.

## Next: Compose And Compare

The next Pro workflow is an interactive Commit Composer for turning a mixed working tree into clear, reviewable commits:

- Suggest logical commit groups based on how changes relate, not only on filenames.
- Let you assign files or hunks, reorder groups, edit messages, squash suggestions, or cancel before GitMind changes repository state.
- Compare concise, detailed, and intent-focused message candidates side by side.
- Use richer context only when you choose it, including issue text, repository history, session summaries, and notes.
- Highlight possible quality problems such as missing intent, mixed concerns, unusual verbosity, or repository-rule violations.

## Later: More Git Workflows

The same context and review experience can support more than individual commit messages:

- Squash messages, pull-request descriptions, stash messages, release notes, and explanations of existing commits.
- Optional pre-commit review with severity levels; blocking remains off unless explicitly configured.
- A local session ledger for approved intent, tradeoffs, and issue context, retained or discarded only by your choice.
- Local learning from your edits to accepted messages without uploading diffs or editing behavior.
- Guidance on which configured model best matches a preference for speed, privacy, cost, or output quality.

## Pro For Repositories And Organizations

The organization-focused Pro track aims to make GitMind fit established development and compliance practices:

- Version-controlled repository policies for commit types, scopes, tickets, length, language, trailers, and custom validation.
- Compatibility with commitlint rules and organization-managed defaults.
- Enterprise provider gateways for Azure AI Foundry/OpenAI, AWS Bedrock, and Google Vertex AI, supporting approved identity, networking, and regional deployment choices.
- Local compliance summaries without remote activity tracking or product telemetry.
- AI attribution remains off by default; every trailer requires an explicit, previewed choice.

## Share Feedback

Roadmap ordering is guided by user outcomes and technical learning. To describe a workflow that is not covered here, use [Support And Requests](Support-And-Requests) and include the problem you are trying to solve, the context GitMind lacked, and what a trustworthy result would look like. Do not include source code, diffs, credentials, or private repository details in public issues.
