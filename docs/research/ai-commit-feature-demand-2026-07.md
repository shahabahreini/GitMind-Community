# AI Commit Feature Demand: Evidence and Recommendations

> Internal product research, July 14, 2026. This document is advisory and does not promise release dates.

## v6 Implementation Status

GitMind 6.0.0 implements the approved release subset: reviewed context selection and privacy preflights, deterministic validation and repair, three candidates, repository policy and safe commitlint import, advisory Commit Health, transactional Commit Composer, opt-in review, and adjacent draft workflows. Enterprise gateways, non-GitHub tracker authentication, a persistent Intent Ledger, Acceptance Learning, and a Capability Router remain evidence-backed future options and are not v6 product claims.

## Executive Decision

GitMind should first make a single generated message more relevant, concise, policy-compliant, and safe to review. It should then make commit composition interactive and reversible. The strongest product opportunity is not another one-click diff summarizer; it is a trusted workflow that combines the diff with human intent, separates unrelated work, previews every mutation, and makes the provider boundary visible.

The recommended sequence is:

1. **P0 — quality, intent, validation, and privacy:** improve subject/body selection, collect optional “why,” filter semantic noise, validate output, preserve explicit review, and preview outbound context.
2. **P1 — choice, composition, and policy:** offer multiple candidates, interactive atomic-commit composition, commit-health feedback, and version-controlled repository rules.
3. **P2 — adjacent workflows and approved infrastructure:** extend the context engine to review, squash/PR/stash/release workflows and add enterprise provider gateways.

The evidence supports keeping two commercial tiers. Daily relevance, editing, and privacy affordances belong in Free because users must trust the core action. Multi-candidate comparison, interactive composition, deeper context, health scoring, policy management, and enterprise connectivity are coherent Pro investments. Team-oriented capabilities are a Pro track, not a third plan.

## Research Question and Method

This review asks which AI-assisted commit capabilities users repeatedly request, which have become competitive table stakes, and where GitMind can make an original product bet.

Sources were selected from first-party product documentation, public issue trackers, marketplace listings, and representative public discussions. Research was conducted on July 14, 2026. Product pages without a trustworthy publication date are marked “observed” rather than assigned an inferred release date.

Signal labels mean:

- **Strong:** a concrete incident or request with substantial visible agreement, or the same capability implemented across several established products.
- **Medium:** a specific request with corroboration, maintainer acknowledgement, or repeated implementation in competitors.
- **Anecdotal:** a single discussion, marketplace listing, or author claim that is useful directionally but not representative.

These categories are deliberately different:

- **Direct demand** is a user asking for a capability or reporting a problem.
- **Table stakes** are capabilities shipped by competitors; presence demonstrates feasibility and market convention, not user demand by itself.
- **Product inference** is a GitMind recommendation derived from several signals. It must not be represented as a requested feature.

Forum comments and reaction counts are qualitative evidence. They are not survey results and do not establish market prevalence.

## GitMind Baseline

The repository baseline examined on July 14, 2026 (package manifest version 5.1.0) already has a useful foundation: staged-diff generation, editable SCM output, short or verbose output, several commit styles, optional custom context, branch-derived issue references, configurable file-pattern exclusions, cancellation, model/token diagnostics, 17 built-in providers, a Pro Custom API, local Ollama support, output length controls, large-diff chunking, and Pro learning from commit history. The handbook also states that product telemetry is not collected.

The roadmap should reuse those assets rather than duplicate them:

- Turn the existing custom-context prompt into a structured intent input.
- Turn diagnostics into a plain-language privacy and token preview.
- Extend existing output limits into deterministic validation and repair.
- Extend existing path-pattern exclusions into previewable semantic filtering before the chunking pipeline.
- Reuse model discovery for capability-aware routing.
- Reuse commit-history learning for local acceptance learning, with a narrower privacy contract.

The largest current gaps are semantic grouping and filtering beyond static patterns, explicit outbound-context control, repository-enforced policy, alternatives, and an interactive review surface before Git mutations.

## Evidence-Backed Findings

### 1. A diff explains “what,” but often cannot explain “why”

This is the clearest quality limitation. In [VS Code issue #273271](https://github.com/microsoft/vscode/issues/273271), opened October 25, 2025, the reporter says source-control generation omitted the complex rationale present in the chat session and requested chat context plus model selection. The issue received 16 positive reactions in the captured evidence, another user agreed, and a VS Code maintainer moved it to the backlog. The maintainer also improved the default model and prompt priority, which supports the claim that model and instruction handling materially affect quality.

The May 2025 [Hacker News acmsg discussion](https://news.ycombinator.com/item?id=43982941) makes the same point more sharply: a commenter argues that information recoverable from code is not the information they seek in a commit message. Another asks that an amended commit include already committed code as context. This is anecdotal, but it is consistent with the VS Code request.

OpenCommit exposes an experimental `OCO_WHY` setting and explicitly says accurate “why” generation requires repository knowledge or retrieval; its [README links that work to issue #398](https://github.com/di-sukharev/opencommit#output-why-the-changes-were-done-wip). That is both competitor acknowledgement and a warning: GitMind must not hallucinate rationale from a diff.

**Implication:** add an optional structured **Why / intended outcome** field, then incorporate explicit branch, issue, and selected session context. Clearly distinguish user-supplied intent from model inference.

### 2. Generic, verbose, and policy-breaking output causes rejection

The same [VS Code request](https://github.com/microsoft/vscode/issues/273271) reports intermittent failure to obey 72-character and whitespace instructions, even with custom commit-generation instructions. Microsoft’s official [custom-instructions guidance](https://code.visualstudio.com/blogs/2025/03/26/custom-instructions) confirms that repository/user instructions are an expected control surface, while [JetBrains prompt documentation](https://www.jetbrains.com/help/ai-assistant/prompt-library.html) allows customization of its built-in commit-generation prompt.

A representative Reddit thread, [“What AI slop brings us: a 30+ line commit message adding 2 log statements”](https://www.reddit.com/r/softwaredevelopment/comments/1s2droy/what_ai_slop_brings_us_a_30_line_commit_message/), illustrates the trust cost of disproportionate verbosity. This is anecdotal and cannot establish frequency, but the failure mode matches direct issue reports and the length/style controls shipped by aicommits, OpenCommit, CleanCommit, VS Code, and JetBrains.

**Implication:** default to the shortest message that preserves meaning; add a body only when complexity or user intent warrants it. Reject or repair empty, malformed, repetitive, overlong, and policy-breaking model output deterministically.

### 3. Model choice, local execution, and multiple candidates are established expectations

[aicommits](https://github.com/Nutlope/aicommits) supports provider/model selection, Ollama and LM Studio, custom OpenAI-compatible endpoints, exclusions, custom prompts, multiple generated recommendations, output formats, and editable hook workflows. [OpenCommit](https://github.com/di-sukharev/opencommit) supports multiple cloud providers, Ollama, llama.cpp, model discovery, repository-local configuration, commitlint integration, ignore files, and confirmation before commit. GitKraken AI exposes provider/model and prompt settings, including custom/private endpoints, in its [official AI documentation](https://help.gitkraken.com/gitkraken-desktop/gkd-gitkraken-ai/).

These implementations are table-stakes evidence, not proof that every user wants every option. However, the explicit model request in VS Code issue #273271 and the HN request for Ollama provide direct qualitative corroboration.

**Implication:** keep model selection and local/private operation easy to understand. Add three meaningfully different candidates—not three temperature variations—and expose token/cost consequences before generation.

### 4. Logical splitting is the highest-value Pro workflow

GitKraken Desktop’s AI Commit Composer proposes multiple commits and lets the user reorder, squash, edit, create, or cancel them; the feature is documented as Preview in the [GitKraken AI overview](https://help.gitkraken.com/gitkraken-desktop/gkd-gitkraken-ai/). GitLens describes draft commits, preview-before-apply, model switching, custom instructions, and AI or manual composition in its [official feature guide](https://help.gitkraken.com/gitlens/gitlens-features/). The open-source [llm-git compose mode](https://github.com/can1357/llm-git) also splits staged changes into logical atomic commits.

This is strong table-stakes evidence for an emerging premium workflow, but it is not enough to claim broad direct demand. GitMind’s opportunity is to outperform filename-based grouping through a semantic change graph and a hunk-level, reversible UI.

**Implication:** build an interactive composer that creates drafts only. Users assign files/hunks, edit, reorder, squash, or cancel; no staging or commit mutation occurs until an explicit final action.

### 5. Noise filtering improves quality, cost, and privacy at once

[OpenCommit](https://github.com/di-sukharev/opencommit#ignore-files) supports `.opencommitignore` and ignores common lockfiles by default. [aicommits](https://github.com/Nutlope/aicommits) has an `--exclude` option. CleanCommit caps outbound diff size and says only the staged diff is sent in its [Marketplace documentation](https://marketplace.visualstudio.com/items?itemName=brandonpalmeros.clean-commit). These are table-stakes signals that raw diffs need selection and bounds.

No reviewed source demonstrates a universally correct semantic-noise algorithm. Formatting-only detection, generated-file detection, lockfile summarization, binary exclusion, and secret/path warnings are therefore product inferences. Each should be previewable and reversible because “noise” can carry release or supply-chain meaning.

There is also direct qualitative demand: [OpenCommit issue #541](https://github.com/di-sukharev/opencommit/issues/541), opened March 7, 2026, requests an AST-aware semantic diff because formatting consumes tokens, bloats messages, and can hide important changes. The reporter suggests separating lower-value changes and possibly routing them to a cheaper model. This is one request, so its strength is medium rather than representative, but it directly supports both semantic filtering and capability routing.

**Implication:** show included, summarized, and excluded context before sending. Default-exclude binaries and obvious generated artifacts; summarize lockfiles and formatting-only changes; let users restore any item.

### 6. Surprising attribution or Git mutation causes an outsized trust failure

The strongest trust evidence is Microsoft’s [VS Code issue #314311](https://github.com/microsoft/vscode/issues/314311), opened May 5, 2026. Microsoft reports that an AI co-author default change plus a bug added Copilot attribution even when AI features were disabled. The issue showed 236 negative reactions in the captured evidence. Microsoft reverted attribution to off, required consent before adding a trailer, and committed to ensuring attribution is never applied to non-AI changes. A separate [GitHub Community report](https://github.com/orgs/community/discussions/194075) says a Copilot trailer appeared after the user had reviewed and replaced the generated message.

Competitor behavior shows why safe defaults matter. Aider auto-commits its edits and marks authorship by default, although both can be disabled, according to its [Git integration documentation](https://aider.chat/docs/git.html). Smart Commit Copilot documents defaults that can auto-stage, auto-commit, and auto-push in its [Marketplace listing](https://marketplace.visualstudio.com/items?itemName=nietao.smart-commit-copilot). Those are product choices, not direct evidence that users prefer automation.

**Implication:** GitMind must never stage, commit, push, rewrite history, or add attribution as a side effect of generation. Every trailer requires explicit, previewed consent. Composition should use a plan/apply boundary and show the exact Git operations before applying them.

## Evidence Ledger

| Source and date | Category | Observed need or behavior | Signal | Competing implementation | GitMind implication | Tier | User value | Complexity | Privacy risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [VS Code #273271](https://github.com/microsoft/vscode/issues/273271), Oct. 25, 2025–Jan. 14, 2026 | Direct demand | Better model, chat context, “why,” and reliable instruction compliance | **Medium**: specific request, 16 reactions, corroboration, backlog | Model changed; instruction priority raised; chat context considered | Structured intent, optional session context, validation, model choice | Free/Pro | High | Medium | Medium |
| [VS Code #314311](https://github.com/microsoft/vscode/issues/314311), May 5, 2026 | Incident/direct feedback | No surprise AI trailers; consent and correct attribution | **Strong**: acknowledged incident and 236 negative reactions | Default reverted off; consent promised | Attribution off; per-use previewed consent only | Free | High | Low | Low |
| [GitHub Community #194075](https://github.com/orgs/community/discussions/194075), May 2026 | Direct feedback | Reviewed text should not be silently changed | **Medium**: concrete corroborating report | Public escalation | Treat SCM text as user-owned; diff any later changes | Free | High | Low | Low |
| [HN acmsg discussion](https://news.ycombinator.com/item?id=43982941), May 2025 | Direct discussion | Commit messages should preserve intent not derivable from code; local use requested | **Anecdotal**: 19 comments, mixed reception | Community scripts and Ollama guidance | Ask for intent; offer local generation | Free | High | Medium | Medium |
| [Reddit verbosity example](https://www.reddit.com/r/softwaredevelopment/comments/1s2droy/what_ai_slop_brings_us_a_30_line_commit_message/), Apr. 2026 | Direct complaint | Message length should be proportional to change | **Anecdotal** | None | Complexity-aware subject/body and verbosity checks | Free | High | Low | Low |
| [OpenCommit README / #398](https://github.com/di-sukharev/opencommit#output-why-the-changes-were-done-wip), observed Jul. 14, 2026 | Table stakes + maintainer inference | “Why” needs context beyond raw diff | **Medium**: shipped WIP plus linked issue | Optional `OCO_WHY`; proposed retrieval | Never invent rationale; bind to explicit/contextual evidence | Free/Pro | High | High | Medium |
| [OpenCommit #541](https://github.com/di-sukharev/opencommit/issues/541), Mar. 7, 2026 | Direct demand | Ignore or de-emphasize formatting noise to save tokens and surface meaning | **Medium**: specific feature request with detailed rationale | Proposed AST/semantic diff and cheaper-model route | Previewable semantic filtering and capability routing | Free/Pro | High | High | Medium |
| [OpenCommit #523](https://github.com/di-sukharev/opencommit/issues/523), Oct. 23, 2025 | Direct failure report | Empty model responses need reliable handling and useful errors | **Medium**: concrete repeated failure report | Issue remains a point-in-time report | Validate, retry, and produce actionable fallback | Free | High | Medium | Low |
| [OpenCommit #518](https://github.com/di-sukharev/opencommit/issues/518), Sep. 4, 2025 | Direct demand | Produce one useful message for squash-only histories | **Medium**: specific workflow request | Proposed commit-range and rebase integration | Reuse context engine for squash messages | Pro | Medium | Medium | Medium |
| [OpenCommit #522](https://github.com/di-sukharev/opencommit/issues/522), Oct. 22, 2025 | Competitor roadmap signal | Optional pre-commit AI review | **Anecdotal**: maintainer proposal, not validated demand | Proposed always/never/ask modes | Prototype advice-only review; require explicit blocking config | Pro | Medium | High | High |
| [aicommits](https://github.com/Nutlope/aicommits), v3.2.0 May 11, 2026 | Table stakes | Multiple choices, formats, exclusions, prompts, provider/model/local choice, editability | **Strong** for competitive convention | CLI flags/config/hook | Candidates, exclusions, model picker, editable result | Free/Pro | High | Medium | Medium |
| [OpenCommit](https://github.com/di-sukharev/opencommit), observed Jul. 14, 2026 | Table stakes | Local models, prompt/model choice, lockfile/ignore filtering, commitlint, confirmation | **Strong** for competitive convention | Ollama/llama.cpp, `.opencommitignore`, `@commitlint` | Noise filter, local path, policies, review gate | Free/Pro | High | Medium | Low–Medium |
| [GitKraken AI](https://help.gitkraken.com/gitkraken-desktop/gkd-gitkraken-ai/), updated Apr. 2026 | Table stakes | Editable generation, prompt/provider choice, commit composition, explain/PR/stash reuse | **Strong**: established product across several workflows | Paid AI suite and Composer Preview | Composer and reusable context engine | Pro | High | High | Medium |
| [GitLens features](https://help.gitkraken.com/gitlens/gitlens-features/), observed Jul. 14, 2026 | Table stakes | Draft commits, preview, manual/AI grouping, model switching, custom instructions | **Strong**: mature editor integration | Pro Commit Composer | Hunk-aware draft UI and plan/apply boundary | Pro | High | High | Medium |
| [Aider Git integration](https://aider.chat/docs/git.html), observed Jul. 14, 2026 | Table stakes / caution | Chat history improves messages; auto-mutation and attribution need controls | **Medium** | Diff + chat history; configurable auto-commit/attribution | Reuse opt-in session context; safer defaults than agent tools | Pro | Medium | Medium | Medium |
| [VS Code source control](https://code.visualstudio.com/docs/sourcecontrol/staging-commits), observed Jul. 14, 2026 | Table stakes | One-click editable generation and custom instructions in SCM | **Strong**: default IDE surface | Copilot sparkle action | Core flow must remain fast and editable | Free | High | Low | Medium |
| [JetBrains AI VCS](https://www.jetbrains.com/help/ai-assistant/ai-in-vcs-integration.html), observed Jul. 14, 2026 | Table stakes | Diff-based generation, editability, custom length/language prompt, PR generation | **Strong**: established IDE suite | Built-in VCS AI actions | Repository/user rules and adjacent PR workflow | Free/Pro | High | Medium | Medium |
| [CleanCommit Marketplace](https://marketplace.visualstudio.com/items?itemName=brandonpalmeros.clean-commit), observed Jul. 14, 2026 | Marketplace signal | Multi-provider, staged diff, conventional format, regenerate, body toggle, privacy statement | **Anecdotal**: low-install listing with no ratings observed | Free VS Code extension | These capabilities are baseline, not differentiation | Free | Medium | Low | Medium |
| [Smart Commit Copilot Marketplace](https://marketplace.visualstudio.com/items?itemName=nietao.smart-commit-copilot), observed Jul. 14, 2026 | Marketplace signal / caution | Pre-commit review, policy validation, repository config, PR reuse; automation defaults | **Anecdotal**: feature-rich listing, adoption not established | Review scoring, validation/retry, local history, commit/push flow | Opt-in review and policies; avoid automatic mutation defaults | Pro | High | High | High |
| [llm-git](https://github.com/can1357/llm-git), observed Jul. 14, 2026 | Open-source signal | Split staged work into atomic commits | **Anecdotal** | CLI compose mode | Confirms feasibility; UI safety is differentiation | Pro | High | High | Medium |

## Competitor Matrix

“Yes” means the reviewed first-party source documents the capability. “Limited” means the capability exists with a narrower scope or requires manual configuration. A blank means “not established by reviewed evidence,” not “does not exist.”

| Product | Editable before commit | Model/provider choice | Local/private path | Repo/custom rules | Multiple candidates | Logical composition | Extra intent/context | Noise exclusion | Adjacent Git writing | Pre-commit review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **GitMind repository baseline (5.1.0 manifest)** | Yes | Yes | Ollama/Custom API | Custom prompt + history learning |  |  | Manual context + branch issue ID | File-pattern exclusions | Changelog |  |
| [GitKraken AI](https://help.gitkraken.com/gitkraken-desktop/gkd-gitkraken-ai/) | Yes | Yes | Custom/internal URL | Custom prompts | Model retry | Yes, Preview | Instructions |  | PR, stash, explain | Conflict workflow |
| [GitLens](https://help.gitkraken.com/gitlens/gitlens-features/) | Yes, drafts | Yes | VS Code/custom providers | Custom instructions | Model switching | Yes, Pro | Guidance | Manual composition | PR/changelog/explain | AI code review |
| [Aider](https://aider.chat/docs/git.html) | Limited; agent-centric | Strong model config | Local model options elsewhere in product | Commit prompt |  | Agent-sized commits | Diff + chat history |  | Undo/commit |  |
| [aicommits](https://github.com/Nutlope/aicommits) | Yes | Yes | Ollama, LM Studio, custom endpoint | Prompt, format, length | Yes |  | Manual prompt | `--exclude` | Commit/hook |  |
| [OpenCommit](https://github.com/di-sukharev/opencommit) | Yes | Yes | Ollama, llama.cpp, proxy/custom URL | Repo config + commitlint | Regenerate |  | WIP “why,” template | Ignore file + lockfiles | Commit/push/action/hook |  |
| [VS Code Copilot](https://code.visualstudio.com/docs/sourcecontrol/staging-commits) | Yes | Limited in SCM action | Copilot service | Custom instructions |  |  | Chat request is backlog |  | PR description | Review action |
| [JetBrains AI](https://www.jetbrains.com/help/ai-assistant/ai-in-vcs-integration.html) | Yes | Multiple activation paths | Local model supported in AI Assistant | Prompt library/project rules | Regenerate |  | Additional input in prompt workflows |  | PR and explain | Broader AI review |
| [CleanCommit](https://marketplace.visualstudio.com/items?itemName=brandonpalmeros.clean-commit) | Yes | Four providers |  | Conventional only | Regenerate |  |  | Diff-size cap | Commit |  |
| [Smart Commit Copilot](https://marketplace.visualstudio.com/items?itemName=nietao.smart-commit-copilot) | Yes | OpenAI-compatible | Private gateway possible | Strong repo policy/config | Refine/regenerate |  | Draft + branch context | Chunking | Commit, push, PR/MR, reports | Yes, scored |

### Competitive interpretation

- **Baseline/table stakes:** staged-diff generation, editable output, conventional formatting, provider/model configuration, custom prompts, regeneration, and some bound/exclusion mechanism.
- **Premium convention forming now:** logical composition with draft review, richer context, repository rules, pre-commit review, and reuse for PR/stash/explanation workflows.
- **Open differentiation space:** trustworthy intent capture, secret/path screening, local edit learning, transparent capability routing, and behavior-based commit grouping.

## Recommendation Scoring

Scores are directional product judgments, not measured forecasts. Demand, differentiation, retention, and Pro conversion use 1 (low) to 5 (high). Effort, maintenance, and safety/privacy risk use 1 (low) to 5 (high/burdensome). Priority score is:

`2× demand + differentiation + retention + Pro conversion − effort − maintenance − risk`

Free trust features can score low on Pro conversion and still rank highly because they protect activation and retention.

| Recommendation | Demand | Differentiation | Retention | Pro conversion | Effort | Maintenance | Risk | Score | Phase / tier |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Complexity-aware concise baseline | 5 | 2 | 5 | 1 | 2 | 2 | 1 | **13** | P0 Free |
| Optional “Why / intended outcome” + branch/issue context | 5 | 4 | 5 | 3 | 3 | 3 | 3 | **13** | P0 Free; richer Pro context |
| Deterministic output validation/repair | 4 | 3 | 5 | 2 | 2 | 2 | 1 | **13** | P0 Free |
| Noise filtering with preview/restore | 4 | 4 | 4 | 2 | 3 | 3 | 2 | **10** | P0 Free |
| Explicit review; no automatic Git mutation or attribution | 5 | 3 | 5 | 1 | 2 | 1 | 1 | **15** | P0 Free |
| Privacy + token/context preview | 4 | 5 | 5 | 2 | 3 | 3 | 2 | **12** | P0 Free |
| Three purposefully different candidates | 4 | 2 | 4 | 4 | 3 | 2 | 1 | **12** | P1 Pro |
| Interactive atomic Commit Composer | 4 | 4 | 5 | 5 | 5 | 4 | 4 | **9** | P1 Pro |
| Commit Health scoring | 3 | 4 | 4 | 4 | 4 | 4 | 2 | **8** | P1 Pro |
| Version-controlled repository policies + commitlint | 4 | 3 | 5 | 5 | 4 | 4 | 2 | **11** | P1 Pro/team track |
| Opt-in pre-commit review with severity | 3 | 3 | 4 | 4 | 4 | 4 | 4 | **5** | P2 Pro |
| PR/squash/stash/release/explain reuse | 4 | 2 | 4 | 4 | 4 | 4 | 2 | **8** | P2 Pro |
| Approved enterprise gateways | 3 | 3 | 4 | 5 | 5 | 5 | 4 | **4** | P2 Pro/team track |
| Intent Ledger | 3 | 5 | 4 | 4 | 4 | 3 | 3 | **9** | P1/P2 Pro |
| Privacy Firewall | 4 | 5 | 5 | 4 | 4 | 4 | 3 | **11** | P0/P1 Free + Pro controls |
| Local Acceptance Learning | 3 | 5 | 5 | 4 | 5 | 4 | 3 | **8** | P2 Pro |
| Capability Router | 3 | 4 | 4 | 3 | 3 | 4 | 2 | **8** | P1 Pro |
| Semantic Commit Graph | 4 | 5 | 5 | 5 | 5 | 5 | 3 | **10** | P1/P2 Pro |

## Recommended Roadmap

### P0: Make the daily action trustworthy

1. **Complexity-aware output:** generate one concise imperative subject by default. Add a body only for multi-concern changes, breaking behavior, important tradeoffs, or explicit user intent. Do not repeat filenames already visible in Source Control.
2. **Structured intent:** offer an optional “Why / intended outcome” field alongside branch and detected issue references. Label inferred context and never manufacture intent.
3. **Deterministic validation:** parse the selected style and enforce required type/scope rules, subject/body limits, whitespace, forbidden boilerplate, repeated file lists, empty output, and unrequested trailers. Retry once with machine-readable violations, then fall back to an editable safe result.
4. **Semantic-noise preview:** classify changes as included, summarized, or excluded. Handle formatting-only diffs, generated artifacts, lockfiles, binaries, and oversized files; allow one-click restoration.
5. **Review ownership:** generation writes an editable draft only. Never stage, unstage, commit, push, amend, rebase, or append attribution automatically.
6. **Privacy/token preview:** before provider submission, show provider/model, local-versus-remote status, approximate tokens, included context categories, exclusions, and likely sensitive paths or secret patterns.

### P1: Turn generation into composition

1. **Interactive Commit Composer:** propose atomic draft commits based on change relationships. Let users assign files and hunks, reorder, edit, squash, regenerate one draft, or cancel. Present an exact operation plan before touching the index.
2. **Three candidates:** compare concise, detailed, and intent-focused variants. Share preprocessing/context across candidates and explain increased token use.
3. **Richer opt-in context:** issue title/body, selected chat/session summary, user notes, branch name, and relevant repository history. Context selection must be explicit and inspectable.
4. **Commit Health:** score relevance, atomicity, repository-rule compliance, missing intent, and suspicious verbosity. Show reasons and suggested edits; do not present a probabilistic score as objective truth.
5. **Repository policy:** add a version-controlled policy file for allowed types/scopes, ticket rules, length, language, trailers, and custom validation. Support commitlint-compatible rules and protected organization defaults.

### P2: Reuse the engine and meet approved infrastructure needs

1. **Adjacent writing:** use the same approved context and policy engine for squash messages, PR descriptions, stash messages, release notes, changelogs, and commit explanations.
2. **Opt-in pre-commit review:** findings have severity and confidence. Default to advice only; blocking must be explicitly configured by the repository/user.
3. **Enterprise gateways:** add Azure AI Foundry/OpenAI, AWS Bedrock, and Vertex AI connections with enterprise identity, regional endpoints, and private-network patterns. Continue to position this as a team-oriented Pro track.
4. **Local compliance summary:** report policy outcomes locally without product telemetry or remote activity tracking.

## Original GitMind Product Insights

These concepts are product inferences, not direct user requests.

### Intent Ledger

Retain user-approved intent, constraints, issue context, and tradeoffs for the current work session. Each entry shows its source and which generated artifacts used it. Default to memory-only session retention; discard or persist locally only through explicit choice. This creates a reliable “why” source for commits and PRs without pretending the diff contains rationale.

### Privacy Firewall

Run local checks before any provider request for likely credentials, private keys, high-entropy tokens, environment/config secrets, sensitive path patterns, and oversized/minified/generated content. Present findings as warnings with include/exclude controls. Never claim complete secret detection.

### Acceptance Learning

Learn locally from the delta between generated and user-approved messages: preferred length, type/scope habits, body frequency, phrasing, and rejected boilerplate. Do not store source diffs or upload edit telemetry. Provide inspect, reset, export, and disable controls. Require enough examples before adapting to avoid overfitting.

### Capability Router

Given configured providers and user priorities—fast, private, inexpensive, or highest quality—recommend a suitable model using known context limits, structured-output support, local availability, and recent local success. Explain the recommendation and never switch providers silently.

### Semantic Commit Graph

Build a local graph linking changed symbols, tests, configuration, documentation, migrations, and generated outputs. Use it to propose behavioral groups before asking a model to write prose. The model names and explains candidate groups; deterministic Git diff/hunk logic remains the source of truth.

## Implementation Guardrails

- Separate **analyze**, **generate**, and **apply**. Analyze and generate are non-mutating; apply requires a reviewed plan and explicit action.
- Preserve the current SCM text until the user chooses to replace it. If any operation changes it later, show a diff.
- Keep preprocessing local. Send only the approved, minimized context representation to the configured provider.
- Treat issue text, branch names, chat summaries, diffs, and repository files as untrusted prompt input. Delimit sources and prevent them from overriding policy/system instructions.
- Use deterministic parsers for Conventional Commits and policy checks. Do not ask a model to grade its own compliance as the only validator.
- Make filtered content and context truncation visible. Silent omission can produce confidently incomplete messages.
- For composer apply, snapshot index state, verify the worktree/index has not changed since analysis, execute the smallest Git operation set, and provide recovery instructions.
- Keep attribution off by default. A global preference must not replace per-commit preview and consent.
- Do not claim a cloud gateway is private merely because it is custom. Show the actual destination host and configured deployment mode.

## Success Measures

Measure locally or through explicit research participation; GitMind’s no-product-telemetry promise should remain intact.

- **First-pass acceptance:** user accepts with no edit or only formatting edits.
- **Semantic edit distance:** categorize edits as intent addition, verbosity reduction, type/scope correction, factual correction, or style change; avoid storing source text in aggregate research.
- **Regeneration rate:** lower is better only when acceptance remains high.
- **Policy pass rate:** deterministic validation succeeds before the draft reaches SCM input.
- **Context efficiency:** accepted result per outbound token, plus percentage of filtered content restored by users.
- **Composer recovery:** cancellation and failed apply leave index/worktree exactly as found.
- **Trust:** usability study participants can accurately predict what data leaves the machine and what Git state will change.

## Risks and Open Questions

- Chat and issue context can improve “why” while also leaking unrelated or sensitive material. Selection and summarization must be opt-in and inspectable.
- Automatic filtering can hide meaningful dependency, formatting, migration, or generated-code changes. All filters need visibility and overrides.
- Hunk movement is technically and cognitively risky when hunks overlap or depend on unstaged edits. Start with file-level composition, then add hunks behind strong conflict handling.
- Repository-history learning can reproduce bad conventions. Policy must outrank learned preference.
- Candidate generation raises latency and provider cost. Cache preprocessing and offer deliberate, differentiated variants.
- Enterprise gateway support carries long-term authentication, SDK, region, and compliance maintenance. Validate customer demand before implementing all three clouds.
- Commit Health can create false authority. Expose reasons and uncertainty; never use one opaque score as a default hard gate.

## Evidence Limitations

This is representative qualitative research, not an exhaustive census of GitHub, Reddit, Hacker News, or extension marketplaces. Marketplace feature lists show supply, not necessarily adoption or satisfaction. GitHub reactions can be coordinated or context-specific. Product documentation may change after the research date. Pricing, install counts, and plan packaging were used only to interpret competitive positioning and should not be copied into the public roadmap.

The highest-confidence conclusions are narrow: users need intent beyond the diff; generated output needs stronger instruction and verbosity control; explicit review matters; local/provider choice is expected; and surprise attribution or Git mutation is unacceptable. Logical composition and GitMind’s five original concepts remain promising product hypotheses that require prototype testing.
