# Generation repair execution ledger

Status: implemented and verified locally, 2026-10-04. User authorized the supplied repair plan and subsequent usability, provider-limit and dependency-audit repairs. The optional 360-token-efficiency companion was explicitly enabled for this session. No credentialed service calls or deployment occurred during verification.

## Acceptance coverage

| ID | Required task | Final status | Evidence |
|---|---|---|---|
| G1 | Operation ownership, isolated attempts, cancellation, 55-second transport timeout, owned cleanup, no fixed command timeout | done (verified) | requestContext.ts; api/index.ts; commands/index.ts; all-provider cancellation/timeout matrix; overlapping provider/validation/repository tests; native suites |
| G2 | Preserve structured errors; one shared opt-in Pro retry/fallback; pause transition and replan unfinished work | done (verified) | recovery.ts and createRecoveryOperation; 23-provider status/code/category/cause matrix; concurrent fallback, smaller-context fallback, ordered reduction, existing retry/entitlement tests; HTTP Retry-After and Google RetryInfo normalization |
| G3 | Normalize intermediate answers; documented text blocks; reasoning exclusion; explicit malformed/empty/blocked/truncated rejection; provider-specific options | done (verified, API limit documented) | catalog-driven actual adapter matrix covers all 23; Mistral arrays; Gemini metadata-gated topK; shared base/output checks; Copilot has no finish-reason surface, so silent truncation remains undetectable |
| L1 | Full source coverage; actual rendered prompt budget; line/character routing; runtime/verified limits and conservative unknown-model fallback; metadata and Unicode continuation; strictly smaller input-limit splits | done (verified) | capabilities.ts; budgetedGeneration.ts; source round-trip with 2,000 files/Unicode/CRLF/binary/rename/mode/submodule/opaque sections; 400,000-character few-line diff; metadata continuation test; runtime endpoint/account isolation; oversized overhead rejection |
| L2 | Unlimited ordered batches; coverage manifest; factual summaries; recursive ordered reduction; progress bound; final budget/fallback revalidation; fail closed and settle siblings | done (verified) | disk-backed CoverageStore; complete coverage beyond five chunks; reverse-completion ordering; smaller-context fallback; input halving; reduction no-progress rejection; terminal sibling cancellation; cancellation during planning/requests/reduction |
| L3 | Incremental Git output and ephemeral spool; bounded buffers; preserve filenames; expected no-index exit; reject partial failures; cancellation and cleanup | done (verified) | diffSpool.ts/repository.ts; real Git collection exceeding 10 MiB; spaced Unicode filename; NUL-delimited staged/untracked integration fixtures; expected exit 1, missing-file rejection, active/pre-cancellation; native disposable-repository suites |
| S1 | Register/load/save/reload large-diff settings; central validated resolver; Batch Size compatibility; defaults 5/3/1000 and disabled; existing Pro gating | done (verified) | package configuration registration; resolver and SettingsManager tests; legacy maxChunks migration/precedence; malformed numeric/default tests; generated frontend collection/autosave controls; existing entitlement suites |
| D1 | Allowlisted diagnostic stages and bounded counters; correlate HTTP/SDK generation; preserve privacy; exact requested SCM repository | done (verified) | support schema 3 and strict privacy-injection tests; provider/command stage events; SCM unavailable-after-generation test leaves unrelated input untouched; privacy validator |
| V1 | Deterministic catalog matrix, regressions and reproductions | done (verified) | pnpm run test:generation: 100/100 passed; actual 23 adapter options with mocked HTTP/SDK/VS Code transports; Gemini 429, Mistral blocks/status, intermediate output caps, default content omissions, direct-probe, model-metadata, Copilot tokenizer, zero-context Git collection, and oversized Pro routing regressions |
| V2 | Relevant extension suites on both requested versions, types, lint, production package, VSIX and privacy audits | done (verified) | VS Code 1.101.0: 509 passed; VS Code 1.140.0: 509 passed; all commands below exit 0; bash build.sh verifies the patched dependency and runs an unfiltered scoped audit |

## Final verification evidence

| Check | Result | Local evidence |
|---|---|---|
| pnpm run test:generation | 100/100 passed | deterministic suite output, mocked transports |
| pnpm run compile-tests | pass | direct tool output |
| Full extension suite, VS Code 1.101.0 | 509 passed, exit 0 | native extension-host output |
| Full extension suite, VS Code 1.140.0 | 509 passed, exit 0 | native extension-host output |
| pnpm run check-types | pass, exit 0 | direct tool output; also production prepublish |
| pnpm run lint | pass, exit 0 | direct tool output; also production prepublish |
| bash build.sh | frozen install, braces patch verification, scoped unfiltered dependency audit, type check, lint, production build and VSIX pass | direct tool output; ai-commit-assistant-6.3.0.vsix |
| pnpm run package:audit | pass, 33 source-listed files; development files and privileged markers excluded | direct tool output; vsce adds package metadata to the archive |
| pnpm run privacy:validate | pass, local-only support reports | direct tool output |
| git diff --check | pass | direct tool output |

The supported native host runs use locally installed VS Code and local mocked service access. They do not prove live provider availability. Logs in /tmp are ephemeral; this ledger and the companion audit persist results, reproductions and limitations in the repository. Production packaging does not ship plans, tests, scripts or source files.

## Resolved findings and verification adjustments

- Initial matrix failures exposed adapter error-wrapping, malformed/empty outputs, Mistral arrays and missing-file no-index exit behavior. Repairs preserve original transport classification and reject partial Git output.
- Full native runs exposed shared HTTP normalization affecting provider validation. Normalization now belongs to scoped generation; existing validation-specific results remain compatible. Advanced-option fixtures explicitly seed runtime capacity instead of depending on an unverified model limit.
- A final isolation review found runtime-capacity sharing between account/endpoint identities; budgets are now scoped and regression-tested.
- Custom request templates now substitute parsed JSON values, preserving source quotes/newlines/Unicode and literal replacement metacharacters. Custom framing is counted and generic response fields remain supported.
- Direct generation encountering an input limit after fallback enters budgeted processing with the same recovery operation. It does not obtain a second fallback allowance.
- Dependency version edits in package.json and pnpm-lock.yaml appeared independently during verification. They were preserved, not authored or reverted by this repair. Final checks ran after the installed dependency changes. No dependency-update command was run for this task.
- A later usability audit found conservative byte counting could route modest changes through large-diff processing even when a selected provider would accept one request. The normal path now uses a bounded direct request when token estimates are uncertain, provider-reported model limits for OpenRouter/Together/NVIDIA when available, and exact VS Code token counting for Copilot. A 221.7 KB modeled OpenRouter change is accepted in one request when its provider allows it; a modeled Copilot change uses budgeted analysis with fewer than 40 source requests and full coverage. Provider rejection moves Pro users into budgeted processing automatically even when proactive batching is off.
- Git collection now uses zero context lines so unchanged neighboring source is not sent merely for diff context; file and hunk metadata remain. A disposable repository test proves changed lines are retained and unchanged body lines omitted. Settings labels distinguish optional proactive batching from automatic overflow handling, and advanced numeric controls are collapsed by default.
- The reported `braces` advisory has no patched upstream release. A lockfile-pinned local depth-limit patch is verified for every installed instance before the build's audit. The build accepts only `GHSA-vfj7-8cjw-p6xm` on patched `braces@3.0.3`; any other advisory or malformed/failed audit remains fatal. The direct `pnpm audit` registry report still lists that advisory.
- Five later support files comprise three sessions: local OpenRouter preflight failures, a Mistral operation with 97 successful HTTP responses and nine reduction rounds before an input-limit failure, and a Gemini HTTP 429 miscategorized as billing. The new 429 classifier and formatter remove misleading billing/input-size guidance. The diagnostics notice uses the rendered prompt's approximate token count and no longer requires a Proceed click. Mistral intermediate text-block handling and output caps reduce avoidable reduction work. Audio/video and source files over 1 MiB are represented by filename only by default; the generator does not infer their content.

## Limits and deviations

Coverage uses bounded lossless windows and private disk manifests for included source instead of buffering the full patch. The user-requested default content policy omits audio/video bodies and source files over 1 MiB, retaining their names but not their semantic changes. Unknown-tokenizer estimates conservatively use UTF-8 bytes for safe chunk planning; bounded direct trials avoid false local rejection. Copilot uses its runtime tokenizer. Copilot exposes no finish reason; silent truncation without an API error cannot be verified or rejected reliably. Arbitrary Custom API deployments remain subject to their configured protocol schema. Memory is bounded structurally; no RSS benchmark was performed.

Credentialed live-service behavior is unverified and outside the authorized test scope. Account-specific model discovery, real quotas/permissions, local Ollama/LM Studio deployments and Custom endpoints require separately authorized access. Semantic accuracy of model-written summaries cannot be guaranteed by source-span coverage. The earlier support log still does not establish the original Gemini/Mistral session cause.

## Handover

All local acceptance gates passed. No publication or credentialed live-provider test was performed by this verification. See [generation-repair-audit.md](generation-repair-audit.md) for reproduction details, provider coverage, the supplied support-report assessment and remaining live-service gaps.
