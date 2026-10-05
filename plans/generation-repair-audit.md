# Generation and large-diff repair audit

Date: 2026-10-04. Scope: the supplied implementation plan, follow-up usability and dependency reports, all 23 catalog options, existing Pro entitlement, and existing opt-in recovery policy. Verification was local; no credentialed provider calls were made. Dependency version edits to package.json and pnpm-lock.yaml appeared independently during verification and were preserved; this repair did not run a general dependency update. Final checks ran with the resulting installed dependencies.

## Changes

- Each generation operation owns its cancellation signal and repository registration. Each overlapping attempt owns a separate controller, transport timeout, listeners and timer. Cleanup checks ownership. Validation does not cancel generation.
- Per-attempt generation timeout remains 55 seconds and aborts transport. The fixed command timeout was removed. Git collection starts after operation registration and accepts cancellation. Queued workers stop after terminal failure, abort siblings, and await settlement.
- Structured errors retain status, code, category, retry delay and cause through adapters and recovery. User guidance is formatted at the command boundary. Authentication, billing, permission, malformed responses, input limits and cancellation do not enter generic recovery. One operation-wide retry/fallback decision is shared by workers; completed summaries survive and unfinished work uses the selected model and recomputed budget.
- Provider answers preserve intermediate summary text, join applicable text blocks, exclude reasoning blocks, and reject empty, malformed, blocked and reported truncated results. Final commit formatting happens in the command. Mistral array content is supported. Gemini topK is omitted unless model metadata advertises support.
- Planning uses the rendered analysis/final prompt, custom context, source offset labels, framing and output reservation. UTF-8 byte counting provides a conservative fallback for chunk planning. Runtime metadata takes precedence over verified limits; unknown models use 4,096 context tokens and up to 1,024 reserved output tokens. Runtime metadata is isolated by provider constructor, account and compatible-service endpoint. Copilot uses its runtime input limit and actual VS Code token counter for planning and sending. Custom JSON framing participates in budget calculation; template substitution preserves quotes, newlines, Unicode and replacement metacharacters.
- Lossless bounded windows preserve every included source span, including opaque sections and oversized lines. Continuations carry file/hunk metadata and UTF-16 offsets; oversized spans split at Unicode-safe boundaries. Provider input-limit rejection causes strictly smaller splits. Oversized prompt overhead fails with explicit guidance. A later user-requested default content policy omits audio/video bodies and source files over 1 MiB while retaining filenames as change metadata.
- Ordered batches continue until the complete source is analyzed, with a contiguous coverage manifest. The batch limit never caps total coverage. Summaries and their span coverage are stored on private ephemeral disk. Ordered budgeted reduction continues until the final rendered prompt fits, and fails if size does not decrease or bounded reduction rounds are exhausted. Incomplete coverage never returns a successful draft.
- Git output and NUL-delimited filenames are collected incrementally into private ephemeral spools. The collected diff uses zero context lines, so unchanged neighboring source is omitted while changed lines, file metadata, and hunk positions remain. Filenames are not trimmed. Default media and exceptional source-content omissions use filename-only notes. Expected no-index exit 1 is accepted; failed collection rejects partial stdout. Spools and manifests are deleted on completion, failure and cancellation.
- Large-diff controls are registered and wired through settings initialization, form collection, autosave, save and reload. One resolver validates integers. Batch Size replaces Max Chunks; an explicitly configured legacy maxChunks value remains the fallback. Defaults are disabled, 1,000 preferred lines, five items per batch, and three concurrent workers. The disabled switch now means no proactive line-based batching; Pro still handles a genuine model overflow automatically. Numeric controls are optional and collapsed. Subsequent batches run automatically. Pro gating is preserved.
- Support schema version 3 permits only fixed collection/planning/requests/parsing/reduction/formatting/scm_insertion stages and bounded counters. Transport and SDK generation stages correlate with the parent operation. Existing source, prompt, path, credential and response exclusions remain. SCM insertion requires the requested repository and fails clearly if unavailable.

## Reproductions and deterministic evidence

`pnpm run test:generation` bundles actual adapter implementations with mocked HTTP, Google SDK, AWS SDK and VS Code language-model transports. It makes no live provider calls. The regression suite verifies:

- Concurrent requests on one provider plus validation; canceling one leaves unrelated transports active. Repository registrations remain independent and stale cleanup does not clear newer work.
- Every source span in a 400,000-character few-line diff is analyzed, well beyond the former five-chunk cap. Reverse worker completion still yields ordered summaries.
- Unicode-safe splitting, CRLF, oversized lines, 2,000 file sections, quoted/spaced names, binary, rename-only, submodule and mode metadata, and opaque sections round-trip without omission. Analysis-continuation tests verify file/hunk context on oversized hunks; existing diff suites check packing.
- Input-limit rejections halve source spans; unsplittable overhead fails. Smaller-context fallback replans unfinished spans. Concurrent failures share one transition. Ordered reduction fits its effective budget and rejects lack of progress.
- Terminal worker failure cancels active siblings. Cancellation during planning, requests, reduction, pre-collection and active Git collection stops further work.
- Real disposable Git no-index output greater than 10 MiB is collected completely, spaced Unicode filenames survive, missing-file failures do not expose partial output, and cleanup runs.
- Settings defaults, numeric validation, legacy precedence, initialization/save/reload and generated frontend fields. Existing extension suites verify entitlement behavior.
- Allowlisted diagnostic stages/counters and rejection of injected private fields. SCM insertion failure after generation leaves another repository untouched.

The catalog matrix exercises success, documented text-block extraction, empty/malformed answers, reported truncation, HTTP/SDK authentication errors, input-limit/billing/permission/blocked classification, local budget guards, cancellation and timeout. Status, code, category and cause preservation are asserted. Transport timeout tests shorten the attempt timeout to 10 ms; production remains 55 seconds.

| Provider option | Transport in deterministic matrix | Result |
|---|---|---|
| Gemini | Google SDK mock | pass |
| Hugging Face | HTTP mock | pass |
| Ollama | HTTP mock | pass |
| Mistral | HTTP mock | pass |
| Cohere | HTTP mock | pass |
| OpenAI | HTTP mock | pass |
| Together | HTTP mock | pass |
| OpenRouter | HTTP mock | pass |
| Anthropic | HTTP mock | pass |
| MiniMax | HTTP mock | pass |
| Copilot | VS Code language-model mock | pass; no finish-reason API |
| DeepSeek | HTTP mock | pass |
| Grok | HTTP mock | pass |
| Groq | HTTP mock | pass |
| Perplexity | HTTP mock | pass |
| Z.ai | HTTP mock | pass |
| NVIDIA | HTTP mock | pass |
| LM Studio | inherited compatible adapter / HTTP mock | pass |
| Azure OpenAI | inherited compatible adapter / HTTP mock | pass |
| Bedrock | AWS SDK mock | pass |
| Vertex AI | Google SDK mock | pass |
| Cloudflare | inherited compatible adapter / HTTP mock | pass |
| Custom API | HTTP mock plus JSON framing/template tests | pass |

The native VS Code suite excludes four SDK matrix rows whose deterministic mocks are only installed by test:generation. The standalone matrix covers all 23; native Copilot and provider-specific suites separately test real VS Code integration surfaces with local stubs.

## Follow-up usability and dependency audit

The user-supplied report at `/Users/shahabbahreinijangjoo/Downloads/gitmind-support-2026-10-04T22-55-14-060Z.json` has schema version 2 and 13 allowlisted events. It records one Mistral HTTP 200 followed by an unclassified command failure, and two unclassified Gemini command failures. It contains no OpenRouter, Together AI, NVIDIA, Copilot, planning, reduction, or large-diff events. Current code emits schema version 3 and stage events. The report therefore cannot establish the cause of the later large-diff complaint or verify behavior of the revised build. No prompt, source, path, credential, or raw response was copied into this audit.

The follow-up code audit found a concrete false-positive path: for models without a usable tokenizer, one UTF-8 byte was counted as one token. A modest 18.7 KB change could fail the local 4,096-token fallback before the selected provider saw it. Even a model with an advertised window could be overestimated for code. The planner now attempts one bounded direct request for uncertain modest prompts; a provider input-limit response triggers Pro's automatic budgeted path. For genuinely large changes, OpenRouter, Together AI, and NVIDIA each make at most one bounded, operation-shared model-metadata lookup when the selected model has no known limit. Advertised context length is used only when it is a valid numeric value. A lookup rate-limit or account failure stops the operation rather than flooding the provider with small requests. Copilot uses VS Code's model tokenizer for prompt and batch packing. These changes keep the normal single-request path for changes that actually fit.

The Git collection audit found that default hunk context sent unchanged neighboring lines. Collection now requests zero context lines from Git, retaining changed lines and hunk/file metadata. For large diffs that must be batched, adjacent source windows are packed to the effective prompt budget, intermediate summaries prioritize behavior and distinct changes, and ordered reduction compresses repeated details. The source coverage manifest still requires every collected span to receive analysis; no cap silently drops later batches. The final prompt switches to a compact style-preserving template when the full template cannot fit a small model. Provider request and token quotas can still stop an operation; the UI states this plainly and keeps numeric tuning under optional Advanced controls.

`bash build.sh` originally stopped on [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) in `braces@3.0.3`, reached through the VSIX tooling. No fixed upstream release was available at verification time. The repository now pins a depth-limit patch, verifies the hash and behavior of every installed `braces` instance, then runs `pnpm audit --json` without a global ignore. Only that exact advisory on the verified patched version is allowed; any other advisory, malformed report, or audit failure stops the build. The advisory remains visible in a direct registry audit and must be revisited when an upstream fix is released. The patch and audit scripts are excluded from the VSIX.

Follow-up deterministic reproductions verify one successful request for an 18.7 KB unknown-model prompt through OpenRouter, Together AI, and NVIDIA; one request for a modest streamed diff; a provider-rejected direct attempt that automatically replans for Pro; one model lookup plus one accepted request for a modeled 221.7 KB OpenRouter diff; and a modeled 221.7 KB Copilot diff with full ordered coverage and fewer than 40 source analysis requests using its tokenizer. A moderate Copilot diff that fits its true token limit remains a single request even when byte counting alone would exceed the limit. A disposable repository proves unchanged source lines are omitted. These are mocked transport and tokenizer results, not measured live-service latency or cost. [OpenRouter's model endpoint](https://openrouter.ai/docs/api/api-reference/models/get-model) documents the model context fields used by the adapter.

| Risk or remaining observation | Severity | Practical limit |
|---|---|---|
| Provider quotas can stop a large operation even after packing; a very small-context model may still need many requests | medium | Explicit failure and rate-limit guidance; no partial successful draft. Live quota behavior remains unverified. |
| Missing or malformed provider model metadata retains the conservative budget | medium | A bounded direct trial avoids modest false positives; larger inputs use safe batching. |
| Copilot provides no public finish reason for streamed text | medium | Explicit errors and empty results are rejected, but silent truncation without an API signal cannot be proved. |
| Legacy `DiffProcessor.splitDiffIntoChunks` and adapter-local formatting helpers are no longer on the generation path | low | They are retained for compatibility; their tests do not substitute for the new pipeline's coverage checks. |
| The local `braces` patch guards known nested-pattern and AST stack-exhaustion reproductions, while the registry still reports the advisory | medium | Build verifies exact patched files and runs a scoped audit; replace with an upstream fix when available. |

## Five-report follow-up and default content policy

The five newly supplied schema-3 reports represent three distinct sessions. `00-19-50-067Z` records two OpenRouter operations that failed local input-limit checks before generation, plus one HTTP 200 metadata request. `00-27-26-968Z` and `00-27-28-544Z` duplicate one Mistral operation: it completed 25 source analyses and nine reduction rounds, recorded 97 HTTP 200 provider responses, then failed with an input-limit category after 216,196 ms. The reports do not expose the final prompt or exact exception, so they establish excessive reduction work and failure, not its exact internal cause. `00-42-14-909Z` and `00-42-16-410Z1` duplicate one Gemini `gemini-2.5-pro` operation: a single request returned HTTP 429 and the command categorized it as billing/quota after 1,405 ms. There were no large-diff planning stages in that Gemini session. No report proves an account billing problem or a model input-limit problem for that request. These reports were read locally; no prompt, source, path, credential, or raw response was copied here.

The Gemini confirmation used a heuristic estimate of the diff alone (8,754 in the user's dialog). The later 37,739 figure came from a conservative UTF-8-byte upper bound on the full rendered prompt and was incorrectly labeled as tokens. The diagnostic notice now uses an approximate token estimate of the same rendered prompt used for generation and no longer blocks the request. The internal byte bound remains for safe planning; user-facing error context uses the approximate count. Only input-limit errors show diff and model-budget details. HTTP 429 responses show quota guidance without implying billing. The classifier no longer treats generic 429 text containing “billing” or a model name as proof of billing or model-specific throttling. Explicit payment status/code remains distinct. [Google's rate-limit documentation](https://ai.google.dev/gemini-api/docs/rate-limits) describes 429 RESOURCE_EXHAUSTED for request, token and spend rate limits; the support report cannot distinguish which one applied.

The Mistral adapter now joins documented text blocks, rejects blocked/truncated/empty output, and preserves structured transport status and category. Intermediate analysis and reduction requests ask for at most 120 words and cap output tokens (768 by default, 2,048 for Gemini/Vertex thinking models); the final commit request retains its normal output budget. This reduces avoidable reduction and token-per-minute use but cannot guarantee live-service latency or quota availability. New deterministic tests cover Mistral block responses, structured 429, intermediate output caps, and the Gemini 429/diagnostic sequence.

Per the user's default-content preference, staged, unstaged and untracked audio/video files are represented by filename only. Source files over 1 MiB are also represented by filename only; GitMind does not inspect their changed lines for message content. Smaller source files keep their zero-context changed lines, including `.ts` code. This is an explicit accuracy/cost tradeoff: a commit message cannot infer the semantic effect of omitted file contents. The Pro settings description states the policy and provider-rate-limit caveat.

## Verification commands

Final results are recorded in the execution ledger beside this report. The final deterministic suite passed 100/100 tests; each native extension suite passed 509 tests. Commands used:

- `pnpm run test:generation`
- `pnpm run compile-tests`
- `pnpm exec vscode-test --skip-extension-dependencies --code-version 1.101.0`
- `pnpm exec vscode-test --skip-extension-dependencies --code-version 1.140.0`
- `bash build.sh` (frozen install, braces patch verification, scoped dependency audit, production packaging, type checking, lint, and VSIX content audit)
- `pnpm run privacy:validate`
- `git diff --check`

## Limits and live verification gaps

- Credentialed calls, account-specific model discovery, throttling and entitlement responses, local Ollama/LM Studio server behavior, and Custom API deployments require separately authorized live access. Mocked conformance is not evidence of current live-service availability.
- Copilot exposes streamed answer text but no public finish reason. Empty text and explicit blocked/errors are rejected; silent output truncation without an error cannot be detected from that API. No fabricated finish status is inferred.
- Token estimates deliberately overcount when runtime tokenizers are unavailable. This can require more analysis work than a tokenizer-aware planner. Unknown models with large prompt overhead can require a larger-context model or shorter custom instructions. An arbitrary Custom API protocol remains limited to the configured request/response schema.
- Coverage proves that every included source span received successful analysis and participated in reduction. Default content omissions retain filenames but intentionally omit audio/video and source files over 1 MiB. Factual accuracy and semantic completeness of model-authored summaries still depend on model behavior.
- Source collection is disk-backed; bounded memory is tested by design and >10 MiB collection, not by an RSS benchmark. Temporary disk capacity remains an ordinary operational constraint.
- The original support log did not establish the exact Gemini/Mistral session failure. The later Gemini report establishes HTTP 429, while the specific provider quota dimension remains unknown; the Mistral reports establish repeated reduction and final input-limit classification, not the precise internal exception.

## Primary metadata references

Verified model metadata and response/options behavior were checked against [Mistral chat API](https://docs.mistral.ai/api/endpoint/chat), [Gemini generation API](https://ai.google.dev/api/generate-content), [Claude model retrieval](https://platform.claude.com/docs/en/api/models/retrieve), [Claude model overview](https://platform.claude.com/docs/en/models/overview), [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), and [Mistral Small 4](https://docs.mistral.ai/models/mistral-small-4-0-26-03). Output reservations in code are generation budgets, not advertised maximum output capacities.
