# Plan: Real model limits and thinking-model reliability across all providers, plus model-list audit

| Field | Value |
|---|---|
| Objective | Every provider and model in GitMind uses its real limits and minimal thinking, so thinking models stop failing with empty or truncated answers, and every bundled model list matches current official docs |
| Status | Reviewed and ready to execute |
| Version | 2026-10-28 (rev 2: scope widened by the user from Ollama to all providers during review) |
| Created | 2026-10-28 |

## 1. Objective & Definition of Done

### Goal

- **O1. Thinking models produce commit messages on every provider.** No more "output was truncated" or "no valid response" when the provider logged success.
- **O2. Real limits.** Output and input budgets come from the model's real limits, in this order:
  1. provider metadata API
  2. documented values from official docs
  3. otherwise the API's own maximum (the field is omitted where optional)

  They never come from GitMind's 1,024-token unknown-model cap, per-adapter fallbacks (150, 500, 1000, 1024, 2048, 4096), or the 16,384 long-form clamp. **Prompt cap:** the model's real input limit for Ollama Cloud, local Ollama, LM Studio and Copilot. Per-token paid APIs keep the 60,000 default (user decision). The user setting overrides both.
- **O3. Minimal thinking.** Where a provider and model support a thinking control, GitMind sends the lowest supported level (off if available). It never switches thinking on for a model whose default is off.
- **O4. Thinking output is handled.** Reasoning delivered in separate fields or inline `<think>` blocks never becomes the commit message. An answer that is only reasoning gets a clear error.
- **O5. Oversized prompts split instead of failing.** Every adapter maps the provider's "prompt too long" error to the `input-limit` category so the existing recovery splits the diff.
- **O6. Model lists.** Bundled models are current: retired ones are removed, current recommended ones added, and defaults change only if retired.
- **O7. Non-text models hidden.** Models that cannot write text (e.g. Ollama `clef:27b`) are not offered.
- **O8. Docs agree.** Docs, wiki and the generated product surface match the code.

### Done when

- **Ollama Cloud live check** (key available), over all chat models from `/api/tags`, using the exact bodies GitMind builds:
  - ~18 KB and ≥100 KB diffs: every model returns 200 / `stop` / non-empty content.
  - A prompt larger than a 131,072-context model (e.g. 650 KB to `gpt-oss:120b`) ends in a successful split generation, not an error.
- **Local Ollama:** a live check if the app is reachable at `http://localhost:11434`; otherwise recorded-shape tests.
- **Every other provider:** recorded-shape unit tests (built from documented response shapes) prove:
  - (a) a request for a model with unknown limits sends no small cap: the field is omitted, or set to the documented provider maximum when the API requires it
  - (b) known limits produce `max_tokens` = min(documented max output, context − prompt − 256)
  - (c) the thinking control matches the research table
  - (d) a reasoning-only response yields the new clear error
  - (e) a "too long" error is classified `input-limit`
- **Retired IDs:** a `grep` for every retired model ID from the audit returns nothing outside `CHANGELOG.md`, `plans/` and `docs/research/`.
- **Checks pass:** `pnpm run check-types`, `pnpm run lint`, `pnpm test`, `pnpm run package`, `pnpm run docs:validate`, `pnpm run validate:wiki`.

### Success measures

- Ollama Cloud: 22 of 22 chat models pass at both sizes (today GLM-5.3 and Kimi K2.6 fail at 1,024).
- 0 adapters keep a hardcoded small output fallback.
- 0 retired models in bundled lists.

### Expected results

- **Phase 0:** `docs/research/provider-models-2026-10.md` exists. Per provider it records models, status, real limits, thinking controls, response fields and the too-long error shape, each with a source.
- **Phase 1:** in VS Code, a large change on any provider no longer reports truncation when the model thinks; GitMind's output log shows `max_tokens` equal to the model's real room.
- **Phase 2:** GLM-5.3, Muse and Kimi work on Ollama Cloud and on local Ollama; `clef:27b` is gone from the picker.
- **Phase 3:** Settings show the updated suggestions.
- **Phase 4:** all checks pass, docs are regenerated, and three to five local commits exist.

### Must not happen

- Thinking switched on for a non-thinking model. Live evidence: `reasoning_effort: "low"` turned thinking on for `gemma4:31b`.
- An unsupported thinking value is sent. Live evidence: `"none"` to `glm-5.3` (values low/high/max) ran away.
- A user's Max Tokens or max-prompt setting is overridden.
- Paid per-token APIs default above 60,000 prompt tokens.
- A non-retired default changes.
- Any API key is logged, committed or sent anywhere except its own provider.

## 2. Context & Constraints

### Root cause (proven 2026-10-28)

- **The global cap.** `rememberModelLimits` (`src/services/api/base.ts:62-70`) caps the output reservation at `min(modelCapabilities(model).outputTokens, reported)`. `modelCapabilities` returns 1,024 for any model missing from `VERIFIED_LIMITS` (`capabilities.ts:94`), so even when a provider's metadata reports a larger limit, unknown models are capped at 1,024.
- **Without user Max Tokens,** `generateWithRawPrompt` sends `capabilities.outputTokens` (`base.ts:115`), which is 1,024.
- **The same cap hits every provider that discovers limits:** Gemini, Mistral, OpenRouter, Together, NVIDIA, Cohere, Copilot, Anthropic.
- **Adapter fallbacks (`options.maxTokens ?? N`):**

  | N | Adapters |
  |---|---|
  | 150 | grok |
  | 500 | huggingface, openrouter |
  | 1000 | bedrock, groq, nvidia, together, openaiCompatible, vertexai |
  | 1024 | mistral, ollama `num_predict` |
  | 2048 | custom, inception |
  | 4096 | ollamacloud |

- **Long-form clamp:** `LONG_FORM_MAX_OUTPUT_TOKENS` = 16,384 clamps user and long-form output (`base.ts:108,141`).
- **Prompt caps:** `DEFAULT_PROMPT_TOKEN_CAP` = 60,000 and `LOCAL_PROMPT_TOKEN_CAP` = 6,000. They are set at `index.ts:397`, *before* `prepareCapabilities` at `index.ts:401`, and used at `index.ts:405-422, 982`.
- **Token estimator:** `conservativeTokenCount` counts 1 token per byte (`capabilities.ts:56`). Measured on Ollama Cloud: code diffs are about 3.94 bytes/token (300 KB → 76,139 prompt tokens), so GitMind overestimates prompts about 4×.
- **Thinking handling** exists only in some adapters (stripThinking/reasoning fields in custom, groq, inception, nvidia, ollamacloud, together; Anthropic `thinking`). No adapter chooses a minimal thinking level from model metadata.
- **Ollama Cloud evidence:**
  - At 1,024 output, glm-5.3 and kimi-k2.6 return `finish_reason: "length"` with empty `content` and only `message.reasoning`.
  - Gemma does not think by default, which is why it works.
  - `/api/show` returns `capabilities`, `thinking.values/default` and `model_info.*.context_length`.
  - The server caps output at context length: kimi rejected 2,000,000 citing "maximum output tokens (262144)"; glm-5.3 accepted 1,040,000.
  - Oversized prompts return 400 "The prompt is too long: 160419, model maximum context length: 131072". Ollama does not truncate silently, but `parseOllamaCloudError` labels 400 `configuration`, so GitMind fails instead of splitting.
  - `/api/tags` includes `capabilities`; `clef:27b` is `["decision","vision"]` and is rejected by chat.
  - Curated `qwen3-coder:480b-cloud` and `deepseek-v3.1:671b-cloud` were retired on 2026-07-15.
- **Observed Ollama thinking values:**

  | Model | Values | Default |
  |---|---|---|
  | glm-5.3 | low/high/max | max |
  | glm-5.2 | false/high/max | high |
  | muse-spark-open | false/low/medium/high/max | high |
  | kimi-k2.6, nemotron-3-nano:30b | false/true | true |
  | gemma4:31b | false/true | false |
  | gpt-oss:120b | low/medium/high | medium |
  | beam | low/medium/high/xhigh/max | max |
  | mistral-large-4, mistral-large-3:675b | null | null |

  mistral-large-4 still emits reasoning, so a large budget is its only protection.
- **Ollama docs:** https://docs.ollama.com/api/openai-compatibility (`reasoning_effort`; unsupported names → model default; `"none"` → `false`) and https://docs.ollama.com/capabilities/thinking (`think`, `message.thinking`).
- **Bundled model IDs live in:**
  - `src/config/providerCatalog.ts` (source of truth)
  - mirrored in `src/config/types.ts`, `package.json`, `capabilities.ts` `VERIFIED_LIMITS`, some adapter files and tests
  - generated docs via `docs:export-product-surface` and `docs:sync-wiki`, plus the handbook pages

### Constraints

- Existing patterns: `BaseAIProvider`, `loggedFetch`, `ProviderApiError`, `rememberModelLimits`, `classifyGenerationFailure`.
- No new dependencies and no new settings.
- Metadata lookups are bounded (5 s), optional, and cached per provider+model per session; failures are not cached.
- Live checks read keys only from `~/Downloads/<provider>.key` in scratchpad scripts. Only `ollamacloud.key` exists.

### Decisions (user, 2026-10-28)

- Real model limits, not fixed numbers.
- Lowest thinking level automatically.
- Fix local Ollama too.
- Fix across all providers.
- Prompt cap: real limits for Ollama Cloud, local Ollama, LM Studio and Copilot; per-token paid APIs keep the 60K default; user setting overrides.
- No other keys: use recorded shapes.
- Model lists: drop retired, add current; defaults change only if retired. This supersedes, for this work, the 2026-09-22 default policy in `docs/research/provider-contracts-2026-09.md`.
- Scope is code + regenerated docs.
- Hide non-text models.
- Commits on `main`, no push without asking.

### State

- The 4 oxlint commits from `plans/oxlint-toolchain-fixes.md` are local and unpushed; that plan's Task 5.1 is `needs decision`.

### Open questions

None blocking.

## 3. Strategy

### Chosen path

1. **Research first** (one pass for limits, thinking controls, response fields, error shapes and model lists).
2. **Fix the shared budget core once** in `base.ts`/`capabilities.ts`/`index.ts` so every adapter inherits real limits.
3. **Remove adapter fallbacks.**
4. **Add per-provider thinking control and reasoning handling** from the research table.
5. **Update model lists and documented limits.**
6. **Verify:** live on Ollama Cloud (and local Ollama if available), recorded shapes elsewhere.

### Why it wins

The 1,024 cap and the fixed fallbacks are shared causes, so one core fix covers every provider. Thinking controls and response fields really do differ per API, so those stay per adapter.

### Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Add each model to `VERIFIED_LIMITS` | Goes stale with every release; this is why GLM and Muse broke |
| One global `reasoning_effort` | Proven harmful (Gemma, GLM-5.3) |
| Retry on truncation | Doubles cost and hides the cause |
| Real prompt cap for paid APIs | User declined (cost) |

## 4. Scope

### New

- `docs/research/provider-models-2026-10.md`: per provider, models with status and real limits, thinking controls, reasoning response fields, too-long error shape, and sources.
- Recorded-shape test cases in the existing suites, or new sibling suites following `ollamacloudIntegrationChecklist.test.ts`.

### Updates to existing

- **Shared core:** `src/services/api/base.ts`, `capabilities.ts`, `index.ts`, `loggedFetch.ts`.
- **All adapters in `src/services/api/`:**
  - anthropic, azureopenai, bedrock, cloudflare, cohere, copilot, custom, deepseek, gemini, grok, groq
  - huggingface, inception, lmstudio, minimax, mistral, nvidia, ollama, ollamacloud, openai
  - openaiCompatible, openrouter, perplexity, together, vertexai, zai
- **Catalog and settings:** `src/config/providerCatalog.ts`, `types.ts`, `package.json`.
- **Tests, docs, wiki and handbook.**

### Explicitly out of scope

- New providers, pricing, and UI redesign.
- A thinking-level setting.
- Live tests for providers without keys.
- Pushing.
- The unpushed oxlint commits.

### Change policy

- These need user approval and a replan:
  - a new setting
  - a default change for a non-retired model
  - raising the paid-API prompt cap
  - any change to the request contract (headers, endpoints, auth)
- Implementation details are the executor's call: helper names, test layout, per-adapter wiring.

### Cut line

- Above (must): 0.1, 1.1–1.4, 2.1–2.3, 3.1, 4.1–4.5.
- Below: 2.4 (should: clear "reasoning-only" error) and 4.6 (could: local Ollama live check when the app is unavailable is skipped, not built around).

### Footprint

- 1 doc created.
- About 35–50 files edited (6 core + 26 adapters + catalog/settings + tests + generated docs).
- 0 dependencies.
- 1 optional `rememberModelLimits` parameter and 1 capability field (`outputUsesRemainingContext` / documented `maxOutputTokens`), serving O2. No new abstractions.

## 5. Assumptions

| # | Assumption | Validated by |
|---|---|---|
| A1 | Ollama `/api/show` (cloud and local) reports context and thinking values | Proven for cloud (11 models). Local verified in 4.2 or recorded |
| A2 | "false if listed, else lowest named level, else omit" never enables thinking on a default-off model | Proven live (gemma `"none"` → no reasoning). Re-checked in 4.1 |
| A3 | OpenAI-compatible APIs accept an omitted `max_tokens` and then use the model's remaining capacity | Research 0.1 cites each provider's docs. Adapters whose docs say the field is required (e.g. Anthropic Messages) send the documented maximum instead |
| A4 | Ollama Cloud accepts `max_tokens` up to context length | Proven live (glm 1,040,000; gemma 260,000; gpt-oss 130,000) |
| A5 | Estimating 1 token per 3 bytes stays at or above real counts for code diffs, and any undercount is caught by input-limit splitting | Measured 3.94 bytes/token. 1.3 makes too-long errors split; 4.1 oversized-prompt check |
| A6 | Each provider's too-long error is recognisable from its documented shape | Research 0.1; unclassifiable ones are recorded and fall back to the existing generic patterns |
| A7 | Official docs publish models, limits and thinking controls for each provider | Research 0.1; gaps are marked `undocumented` and keep conservative behaviour (omit the field, no thinking param) |
| A8 | `gpt-oss:120b-cloud` (Ollama Cloud default) is not retired | Proven live |

## 6. Phases & Tasks

### Phase 0: Research

Checkpoint: `docs/research/provider-models-2026-10.md` opens with one section per provider (26 adapters; model lists for the 17 with bundled lists), and every value cites an official URL or is marked `undocumented`.

**Task 0.1 — Provider contract and model research**
- What: one research pass covering everything later phases need.
- How: for each adapter, record:
  1. the output-budget field, and whether it's optional or required, with its documented maximum
  2. the metadata endpoint and its limit fields
  3. thinking controls and allowed values per model family, and the default
  4. where reasoning appears in responses
  5. the too-long error status and message shape
  6. for the 17 providers with bundled lists, the model list with status (active / deprecated with date / retired with date / unverified), documented context and max output, and current recommended text models
  7. the proposed list and default changes, with defaults changing only if retired

  Use primary sources only. Ollama Cloud rows use the live `/api/tags` and `/api/show` results. Split the work across up to 3 parallel research agents by provider group; the executor spot-checks every changed ID and limit against its cited page.
- Where: `docs/research/provider-models-2026-10.md`
- Depends on: none
- Skills: research
- Parallel: yes (with 1.1)
- Effort: L
- Priority: must
- Done when: all 26 adapters have rows 1–5 and the 17 listed providers have row 6; every cell cites a source or says `undocumented`; the spot-check log lists each changed ID as confirmed.

### Phase 1: Shared budget core

Checkpoint: `pnpm test` passes. A recorded-shape test shows a model with unknown limits on an OpenAI-compatible adapter no longer sends 1,024, and a model with known limits sends its real room.

**Task 1.1 — Trust real limits; output uses the real room**
- What: stop capping known or reported limits at 1,024 and 16,384.
- How:
  1. In `base.ts`, give `rememberModelLimits` an optional `trusted` parameter that records the reported output limit as given.
  2. Add a capability field for the documented or discovered maximum output.
  3. Default `maxTokens`:
     - known: min(max output, context − measured prompt − 256)
     - unknown: `undefined`, so adapters omit the field
  4. User Max Tokens is clamped only by that real room.
  5. Remove the `LONG_FORM_MAX_OUTPUT_TOKENS` clamp wherever a real maximum is known; keep it only as the unknown-model ceiling for long-form operations that need a number.
  6. The answer reservation used for input budgeting = min(max output, 16,384).
- Where: `src/services/api/base.ts`, `src/services/api/capabilities.ts`
- Depends on: none
- Skills: None
- Parallel: yes (with 0.1)
- Effort: M
- Priority: must
- Done when unit tests show:
  - a 1M-context / 128K-max-output model with a 10K prompt sends 128,000
  - a 262,144 Ollama model with a 10K prompt sends 262,144 − 10,000 − 256 (± estimator rounding)
  - an unknown model sends no field
  - user 2,000 sends 2,000; user 5,000,000 is clamped to the room
  - existing provider tests are updated only where they asserted the old 1,024/16,384 numbers, with each such change listed in the ledger

**Task 1.2 — Prompt cap and estimator**
- What: size prompts against real limits where the user chose that.
- How:
  1. In `index.ts`, compute the default `promptTokenCap` *after* `prepareCapabilities` (`index.ts:397` → after `:401`).
  2. The default is `effectiveInputBudget(capabilities)` for ollamacloud, ollama, lmstudio and copilot when known; 60,000 for every other provider. `largeDiff.maxPromptTokens` overrides.
  3. Change `conservativeTokenCount` to `ceil(bytes / 3)`.
- Where: `src/services/api/index.ts`, `src/services/api/capabilities.ts`
- Depends on: 1.1
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when unit tests show:
  - a 300 KB diff with Ollama Cloud context 1,048,576 goes as one direct request
  - the same diff on OpenAI is chunked at the 60K cap
  - `maxPromptTokens: 20000` chunks on Ollama Cloud
  - the estimator returns 100,000 for 300,000 bytes

**Task 1.3 — Too-long errors split**
- What: make "prompt too long" errors trigger the existing split recovery on every adapter.
- How:
  1. Fix `parseOllamaCloudError`: a 400 whose message matches `/prompt is too long|maximum context length/i` gets category `input-limit`.
  2. For every other adapter, use the 0.1 error shapes to make sure the error reaches `input-limit`, either through the generic classifier patterns or an adapter-level category.
- Where: the adapters with explicit categories, plus `src/services/api/utils.ts`/`recovery.ts` only if patterns need extending
- Depends on: 0.1
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when: a recorded-shape test per adapter classifies its documented too-long error as `input-limit`; for adapters with no documented shape, the ledger records the generic-pattern fallback.

**Task 1.4 — Remove adapter output fallbacks**
- What: stop adapters from replacing a missing budget with a small number.
- How:
  1. Replace each `options.maxTokens ?? N` (the fallbacks listed in §2) with pass-through.
  2. When `maxTokens` is undefined, omit the field.
  3. Where 0.1 says the field is required, send that API's documented maximum for the model, or the provider-documented ceiling when per-model data is absent.
- Where: grok, huggingface, openrouter, bedrock, groq, nvidia, together, openaiCompatible, vertexai, mistral, custom, inception, ollamacloud (+ any adapter with an implicit default found in 0.1)
- Depends on: 0.1, 1.1
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when: `grep -nE "maxTokens \?\? [0-9]" src/services/api/*.ts` returns nothing, and a request-body test per adapter shows field omitted vs documented maximum, matching 0.1.

### Phase 2: Thinking control and reasoning handling

Checkpoint: in VS Code, GLM-5.3, Muse and Kimi generate on Ollama Cloud and local Ollama; recorded-shape tests pass for every adapter's thinking row.

**Task 2.1 — Ollama Cloud**
- What: Ollama Cloud metadata, thinking level and model filtering.
- How:
  1. `fetchOllamaCloudModelDetails`: POST `/api/show`; returns context, thinking values and capabilities; cached; failures are not cached; auth/rate-limit errors rethrow.
  2. `prepareCapabilities` always looks up details for `this.model` and records trusted limits (context; max output = context).
  3. `chooseOllamaThinking(values)`: `"none"` if `false` is listed, else the lowest of low < medium < high < xhigh < max, else omit. Send it as `reasoning_effort`.
  4. `filterOllamaCloudModels` drops entries whose `capabilities` lacks `"completion"` and keeps entries without the field.
  5. Replace the retired curated IDs (see 3.1).
- Where: `src/services/api/ollamacloud.ts`
- Depends on: 1.1
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when unit tests show the mapping for every shape in the §2 table (glm-5.3 → low, glm-5.2 → none, muse → none, kimi → none, gemma → none, gpt-oss → low, beam → low, null → absent), plus filtering of the live `/api/tags` shape, the 1M context recorded, and a second call served from cache.

**Task 2.2 — Local Ollama**
- What: give local Ollama the same real limits and thinking handling.
- How:
  1. Use the local `/api/show` for context and thinking values (cached; failures fall back to current behaviour).
  2. Send native `think` per the same rule:
     - `false` if listed
     - else the lowest named level
     - for boolean-only models with no `false` → omit
     - null → omit
  3. Set `num_predict` from 1.1; when unknown, leave it unset (Ollama default).
  4. Set `num_ctx` = min(context_length, prompt tokens + answer reservation), not the full context, to protect local VRAM.
  5. Ignore `thinking` in the response and read `response` only.
  6. If `response` is empty and `thinking` is not, raise the 2.4 error.
- Where: `src/services/api/ollama.ts`
- Depends on: 1.1, 1.2
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when: recorded-shape tests cover a thinking model (`thinking` + `response`), a reasoning-only response, a `num_ctx` bounded by prompt + reservation, and `think` absent for null metadata.

**Task 2.3 — Every other adapter**
- What: apply minimal thinking and reasoning handling everywhere else.
- How:
  1. Per the 0.1 table, send the provider's documented minimal-thinking control only for models documented to support it, and only with documented values. Examples to confirm in 0.1, not to assume: OpenAI-style `reasoning_effort`, Gemini thinking budget/level, Z.ai `thinking`, Groq/Together/OpenRouter reasoning options.
  2. Make sure the answer text excludes separate reasoning fields, and that `stripThinking` covers inline `<think>` for adapters whose docs show it.
  3. Adapters with no documented control (e.g. Copilot, Bedrock and Vertex for some models, Custom, LM Studio) get no thinking param and rely on Phase 1 budgets.
- Where: the remaining adapters in `src/services/api/`
- Depends on: 0.1, 1.1
- Skills: None
- Parallel: yes
- Effort: L
- Priority: must
- Done when: one recorded-shape test per adapter checks the thinking param (present with the documented value, or absent) and that a response carrying reasoning plus answer returns only the answer.

**Task 2.4 — Clear error when only reasoning came back**
- What: replace the generic truncation and "no valid response" messages for this case.
- How: in `loggedFetch.ts` and the adapter parse paths, when the answer is empty and reasoning is present, raise `ProviderApiError("The model spent its whole output budget thinking and returned no answer. Raise GitMind Max Tokens or choose another model.", { category: "invalid-response" })`.
- Where: `src/services/api/loggedFetch.ts`, adapter parse paths
- Depends on: 2.1–2.3
- Skills: None
- Parallel: no
- Effort: S
- Priority: should
- Done when: recorded-shape tests for an OpenAI-compatible body, an Ollama native body and an Anthropic thinking block get the new message with the same category.

### Phase 3: Model lists and documented limits

Checkpoint: Settings → model suggestions show the updated lists after `pnpm run compile`.

**Task 3.1 — Apply list, default and limit changes**
- What: update every place that hardcodes changed model IDs or limits.
- How:
  1. Edit `providerCatalog.ts` first, then mirror the changes in `types.ts`, `package.json` (defaults/enums/descriptions), adapter files and tests.
  2. `VERIFIED_LIMITS`: remove retired entries, and set documented `[context, maxOutput]` for every curated model that has documented values.
  3. Ollama Cloud: replace `qwen3-coder:480b-cloud` and `deepseek-v3.1:671b-cloud` with current chat models from `/api/tags`; keep `gpt-oss:120b-cloud` as default.
- Where: as listed
- Depends on: 0.1, 1.1, 2.1
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: `grep -rF` for each retired ID over `src/ package.json` returns nothing; `check-types`, `lint` and `test` pass.

### Phase 4: Verification, docs, commits

Checkpoint: the live and recorded-shape results are in the execution ledger; the docs validators pass; local commits exist.

**Task 4.1 — Ollama Cloud live check**
- What: prove the fix against the real Ollama Cloud service.
- How:
  1. Write a scratchpad script that reads the key file and builds GitMind's exact bodies (same thinking rule; `max_tokens` = real room).
  2. Run all chat models with the ~18 KB and ≥100 KB diffs.
  3. Run a 650 KB prompt against `gpt-oss:120b` through GitMind's split path. Drive it through a compiled test harness, or simulate the split by running the same chunk sizes `index.ts` would produce.
  4. Print a table without the key.
- Where: scratchpad
- Depends on: 1.2, 1.3, 2.1
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: all chat models pass both sizes, and the oversized case produces a message, not an error.

**Task 4.2 — Local Ollama check**
- What: run the 4.1 checks against the local Ollama app if it's running.
- How:
  1. If `curl -s localhost:11434/api/version` answers, run the 4.1 subset (one thinking cloud tag such as `glm-5.3:cloud` and one local model if installed) through the native `/api/generate` body from 2.2.
  2. Otherwise record "app unavailable" and rely on the 2.2 recorded shapes.
- Where: scratchpad
- Depends on: 2.2
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: there is a pass table, or the ledger records "unavailable, recorded shapes only".

**Task 4.3 — Full suite and package**
- What: run every check once more on the final tree.
- How: run `pnpm run check-types`, `pnpm run lint`, `pnpm test` and `pnpm run package`.
- Where: repo
- Depends on: 1.1–3.1
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: everything passes; the ledger lists every pre-existing test assertion that changed and why.

**Task 4.4 — Regenerate docs and wiki**
- What: bring the generated docs in line with the code.
- How:
  1. Run `pnpm run docs:export-product-surface` and `pnpm run docs:sync-wiki`.
  2. Hand-update the handbook provider pages and `Providers-And-Models.md`. Explain that budgets follow each model's real limits, thinking is minimised automatically, and paid APIs keep a 60K default prompt cap.
  3. Run `docs:validate` and `validate:wiki`.
- Where: `docs/`, `wiki/`
- Depends on: 3.1
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: both validators pass and retired-ID greps over the docs are empty.

**Task 4.5 — Commits**
- What: commit the work locally.
- How: Conventional Commits on `main`, each ending with the session's `Co-Authored-By` line:
  - `fix(api): use real model limits and minimal thinking across providers` (core + adapters)
  - `chore(providers): refresh bundled models and documented limits`
  - `docs: …`

  Review `git diff` for secrets first. Do not push.
- Where: repo
- Depends on: 4.1–4.4
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: `git log` shows the commits; `git status` is clean except `plans/`.

**Task 4.6 — (reserved)**
- What: nothing. A local Ollama live check is attempted in 4.2 and is not built around when unavailable.
- How: n/a
- Where: n/a
- Depends on: n/a
- Skills: None
- Parallel: n/a
- Effort: S
- Priority: could
- Done when: n/a. Kept only to preserve the cut-line reference.

## 7. Risks & Countermeasures

| Risk | Impact | Countermeasure |
|---|---|---|
| Omitting `max_tokens` lets a provider default to a small value instead of the model maximum | Truncation persists on that provider | 0.1 records each API's documented default. If it's small, the adapter sends the documented maximum instead (1.4) |
| Real output budgets let rambling models run long | Latency and paid-token cost on paid APIs | Minimal thinking; models stop when done; user Max Tokens overrides; paid prompt cap stays 60K |
| The bytes/3 estimator undercounts, e.g. CJK-heavy diffs | Too-long errors | 1.3 makes them split; 4.1 oversized check |
| Large `num_ctx` exhausts local VRAM | Local Ollama slows or fails | 2.2 sizes `num_ctx` to prompt + reservation, not the full context |
| Docs research gives wrong IDs or limits | Broken models shipped | Primary sources only; executor spot-check of every changed value; `undocumented` means conservative behaviour |
| A thinking param is rejected by a model family | 400 errors | Only documented values for documented families; per-adapter recorded tests; live on Ollama |
| Changing base budgets breaks many existing tests | Large test churn | 1.1 done-when requires listing each changed assertion with a reason |
| Users with a retired model selected | Errors after the update | Provider error text is surfaced as-is (Ollama names the replacement); not migrated (no settings changes) |
| Live checks spend the user's Ollama quota | Cost | ~50 requests per run; at most 2 runs |
| Key exposure | Security | Keys only in scratchpad scripts; never echoed or committed; `git diff` reviewed before commit |

## 8. Verification & Replanning

- **Per task:** the "Done when" checks above.
- **Overall:** §1 Done when.
- **Not verified:** live behaviour of the 24 providers without keys (recorded shapes only), and local Ollama if the app isn't running. The correctness of the lists and limits rests on cited docs.
- **Replan when:**
  - an Ollama chat model fails 4.1
  - 0.1 finds an API whose omitted `max_tokens` defaults small *and* has no documented maximum
  - a thinking control would need a new setting
  - a non-retired default would have to change
  - the paid-API prompt cap would need to change
  - the base change breaks a provider in a way recorded shapes can't explain

## 9. Traceability

| Objective | Covered by tasks |
|---|---|
| O1 Thinking models produce messages | 1.1, 1.4, 2.1–2.3, 4.1, 4.2 |
| O2 Real limits, prompt cap per decision | 0.1, 1.1, 1.2, 1.4, 3.1 |
| O3 Minimal thinking | 0.1, 2.1, 2.2, 2.3 |
| O4 Reasoning handled, clear error | 2.1–2.3, 2.4 |
| O5 Too-long errors split | 1.3, 4.1 |
| O6 Current model lists | 0.1, 3.1 |
| O7 Hide non-text models | 2.1 |
| O8 Docs agree | 4.4 |

## 10. Handover Summary

- **Context:** Root cause proven live on 2026-10-28. A global 1,024 cap applies to every model GitMind doesn't recognise, and small per-adapter fallbacks pile on top; models that think spend the budget and return empty answers that the provider logs as success. Evidence scripts are in the session scratchpad (`probe.mjs`, `probe2.mjs`, `over.mjs`, `probe1.json`).
- **Decisions:** §2.
- **State:**
  - done = investigation, plan and review
  - pending = all tasks
  - blocked = none
  - `plans/oxlint-toolchain-fixes.md` Task 5.1 (push) awaits the user
- **Remaining tasks:** §6.
- **Verification:** §8.
- **Risks and how to detect them early:**
  - 4.1 failure table
  - recorded-shape test failures per adapter
  - the 1.1 list of changed assertions
  - retired-ID greps
  - docs validators

## 11. Review appendix

- **Lenses applied and why:**
  - Engineering (shared budget code)
  - QA (verification without keys)
  - Operations/cost (paid-API prompts)
  - Security (key handling)
  - Domain (provider API contracts)
  - Product/UX (error messages, model picker)
- **Findings:**
  1. **Engineering, proven.** The 1,024 cap is global (`base.ts:62-70`), not Ollama-specific, and it overrides limits reported by provider metadata. Fix: 1.1.
  2. **Engineering, proven.** `promptTokenCap` is computed before `prepareCapabilities` (`index.ts:397` vs `:401`), so planning never saw discovered limits. Fix: 1.2.
  3. **Engineering, proven.** Ollama Cloud's "prompt is too long" 400 is labelled `configuration`, so oversized prompts fail instead of splitting. Fix: 1.3.
  4. **Engineering, proven.** The estimator counts bytes as tokens (measured 3.94 bytes/token), wasting about 75% of real context. Fix: 1.2 with 1.3 as a safety net.
  5. **Domain, proven.** 13 adapters hardcode small output fallbacks (150–4096). Fix: 1.4.
  6. **Domain, proven.** Ollama thinking values vary per model; a blind value harms Gemma and GLM-5.3. Fix: 2.1 rule, sourced from `/api/show`.
  7. **Scope, user-confirmed.** Local Ollama has the same 1,024 `num_predict` cap and ignores `thinking`. Fix: 2.2, with VRAM-safe `num_ctx`.
  8. **Operations, proven.** Real prompt caps on paid APIs could cost dollars per commit. Fix: the user chose to keep 60K for paid APIs.
  9. **QA, proven.** Only the Ollama key exists. Fix: recorded-shape tests per adapter; limits disclosed.
  10. **Engineering, possible.** Omitting `max_tokens` may fall back to a small provider default on some APIs. Fix: 0.1 records defaults; 1.4 sends the documented maximum there.
- **Decisions:** all user decisions are in §2. Rev 2 widened the scope at the user's request.
- **Remaining risks:** §7, chiefly the untested-live providers and possible docs errors.
- **Cuts made and footprint change versus the draft:**
  - Task IDs were renumbered because the scope grew from one provider to all. Draft → rev 2: 1.1/1.2/1.3/1.4 → 2.1; 1.5 → 4.1; 1.6 → 2.4; 1.7 → 1.2; 2.1 → 0.1; 2.2 → 3.1; 3.1 → 4.4; 3.2 → 4.5.
  - Added: 1.1 (generalised), 1.3, 1.4, 2.2, 2.3, 4.2, 4.3.
  - Cut: the separate "metadata before planning" step, because `prepareCapabilities` already runs at `index.ts:401`; only the cap ordering changes.
  - Footprint grew from ~15–20 files to ~35–50, with 0 dependencies throughout.
- **Applicable checks and evidence:**
  - live Ollama probes (23 models; 18 KB diff; 1,024 vs 4,096 budgets; thinking variants; max_tokens limits; oversized prompt)
  - code reads: `base.ts:62-70, 100-145`; `capabilities.ts:19-56, 80-100`; `index.ts:385-422, 982`; `loggedFetch.ts:50-75`
  - adapter inventory grep
- **Non-applicable checks and reasons:**
  - Data migration: no persisted data changes.
  - Monitoring: diagnostics already log request budgets.
  - Rollback: per-commit revert is sufficient.
- **Blockers and resolution needed:** none. This is a reviewed plan, not a verified implementation; nothing has run.
