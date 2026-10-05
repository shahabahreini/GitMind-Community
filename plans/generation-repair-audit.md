# Generation and large-diff repair audit

Date: 2026-10-04. Scope: the supplied implementation plan, all 23 catalog options, existing Pro entitlement, and existing opt-in recovery policy. Work is local and uncommitted. No credentialed provider calls were made. Dependency version edits to package.json and pnpm-lock.yaml appeared independently during verification and were preserved; this repair did not run a dependency update. Final checks ran with the resulting installed dependencies.

## Changes

- Each generation operation owns its cancellation signal and repository registration. Each overlapping attempt owns a separate controller, transport timeout, listeners and timer. Cleanup checks ownership. Validation does not cancel generation.
- Per-attempt generation timeout remains 55 seconds and aborts transport. The fixed command timeout was removed. Git collection starts after operation registration and accepts cancellation. Queued workers stop after terminal failure, abort siblings, and await settlement.
- Structured errors retain status, code, category, retry delay and cause through adapters and recovery. User guidance is formatted at the command boundary. Authentication, billing, permission, malformed responses, input limits and cancellation do not enter generic recovery. One operation-wide retry/fallback decision is shared by workers; completed summaries survive and unfinished work uses the selected model and recomputed budget.
- Provider answers preserve intermediate summary text, join applicable text blocks, exclude reasoning blocks, and reject empty, malformed, blocked and reported truncated results. Final commit formatting happens in the command. Mistral array content is supported. Gemini topK is omitted unless model metadata advertises support.
- Planning uses the rendered analysis/final prompt, custom context, source offset labels, framing and output reservation. UTF-8 byte counting provides a conservative fallback. Runtime metadata takes precedence over verified limits; unknown models use 4,096 context tokens and up to 1,024 reserved output tokens. Runtime metadata is isolated by provider constructor, account and compatible-service endpoint. Copilot uses its runtime input limit and token counter before sending. Custom JSON framing participates in budget calculation; template substitution preserves quotes, newlines, Unicode and replacement metacharacters.
- Lossless bounded windows preserve all source text, including opaque sections and oversized lines. Continuations carry file/hunk metadata and UTF-16 offsets; oversized spans split at Unicode-safe boundaries. Provider input-limit rejection causes strictly smaller splits. Oversized prompt overhead fails with explicit guidance.
- Ordered batches continue until the complete source is analyzed, with a contiguous coverage manifest. The batch limit never caps total coverage. Summaries and their span coverage are stored on private ephemeral disk. Ordered budgeted reduction continues until the final rendered prompt fits, and fails if size does not decrease or bounded reduction rounds are exhausted. Incomplete coverage never returns a successful draft.
- Git output and NUL-delimited filenames are collected incrementally into private ephemeral spools. Filenames are not trimmed. Expected no-index exit 1 is accepted; failed collection rejects partial stdout. Spools and manifests are deleted on completion, failure and cancellation.
- Large-diff controls are registered and wired through settings initialization, form collection, autosave, save and reload. One resolver validates integers. Batch Size replaces Max Chunks; an explicitly configured legacy maxChunks value remains the fallback. Defaults are disabled, 1,000 preferred lines, five items per batch, and three concurrent workers. Subsequent batches run automatically. Pro gating is preserved.
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

## Verification commands

Final results are recorded in the execution ledger beside this report. Commands used:

- `pnpm run test:generation`
- `pnpm run compile-tests`
- `pnpm exec vscode-test --skip-extension-dependencies --code-version 1.101.0`
- `pnpm exec vscode-test --skip-extension-dependencies --code-version 1.140.0`
- `pnpm run package:vsce` (runs production packaging, type checking and lint through prepublish)
- `pnpm run package:audit`
- `pnpm run privacy:validate`
- `git diff --check`

## Limits and live verification gaps

- Credentialed calls, account-specific model discovery, throttling and entitlement responses, local Ollama/LM Studio server behavior, and Custom API deployments require separately authorized live access. Mocked conformance is not evidence of current live-service availability.
- Copilot exposes streamed answer text but no public finish reason. Empty text and explicit blocked/errors are rejected; silent output truncation without an error cannot be detected from that API. No fabricated finish status is inferred.
- Token estimates deliberately overcount when runtime tokenizers are unavailable. This can require more analysis work than a tokenizer-aware planner. Unknown models with large prompt overhead can require a larger-context model or shorter custom instructions. An arbitrary Custom API protocol remains limited to the configured request/response schema.
- Coverage proves that every captured source span received successful analysis and participated in reduction. Factual accuracy and semantic completeness of model-authored summaries still depend on model behavior.
- Source collection is disk-backed; bounded memory is tested by design and >10 MiB collection, not by an RSS benchmark. Temporary disk capacity remains an ordinary operational constraint.
- The original support log did not establish the exact Gemini/Mistral session failure; this repair addresses reproduced defects without claiming that diagnosis.

## Primary metadata references

Verified model metadata and response/options behavior were checked against [Mistral chat API](https://docs.mistral.ai/api/endpoint/chat), [Gemini generation API](https://ai.google.dev/api/generate-content), [Claude model retrieval](https://platform.claude.com/docs/en/api/models/retrieve), [Claude model overview](https://platform.claude.com/docs/en/models/overview), [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), and [Mistral Small 4](https://docs.mistral.ai/models/mistral-small-4-0-26-03). Output reservations in code are generation budgets, not advertised maximum output capacities.
