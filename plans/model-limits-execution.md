# Execution ledger: Real model limits + thinking across providers + model audit

Plan: `plans/ollama-cloud-thinking-and-model-audit.md` (rev 2, Reviewed and ready to execute; user instructed execution 2026-10-28)
Mode: lean · Delegation: approved (Task 0.1 research by same-tier research agents, audited) · Token efficiency: approved

## 1. Coverage ledger
| ID | Task | Priority | Acceptance check | Status | Evidence |
|---|---|---|---|---|---|
| 0.1 | Provider contract + model research | must | 26 adapters rows 1-5; 17 lists row 6; sources or undocumented; spot-check log | done (verified) | docs/research/provider-models-2026-10.md (26 adapters, 17 lists, sources/undocumented); 3 spot-checks confirmed (Perplexity IDs, Together removal, MiniMax models); research by 3 same-tier agents, audited |
| 1.1 | Trust real limits; output = real room | must | unit tests: 128000; 262144-10000-256; unknown omits; user 2000/5e6 clamp; changed assertions listed | done (verified) | base.ts rememberModelLimits trusts reported/documented; realOutputLimit; no 16K clamp; longFormOutput tests updated (changed assertions: unknown→undefined, 65536→128000 real, 32k-context room); 582 pass |
| 1.2 | Prompt cap after prepare; bytes/3 estimator | must | 300KB direct on ollamacloud; chunked on openai; maxPromptTokens 20000 chunks; 300000 bytes→100000 | done (verified) | index.ts cap after prepareCapabilities; catalog realPromptLimit for ollama/ollamacloud/lmstudio/copilot; bytes/3 estimator (300000→100000 test); discovery for every diff size (deviation D1) |
| 1.3 | Too-long errors → input-limit | must | per-adapter recorded-shape classification | done (verified) | parseOllamaCloudError 400 too-long→input-limit; recorded-shape tests anthropic/inception/zai/413; conformance suite 413 for all providers |
| 1.4 | Remove adapter output fallbacks | must | grep `maxTokens ?? [0-9]` empty; per-adapter body tests | done (verified) | grep 'maxTokens ?? [0-9]' empty; omit vs 16384 per research (anthropic, minimax, cloudflare, nvidia, perplexity anthropic/*, custom anthropic); tests mistral/cloudflare/azure/anthropic |
| 2.1 | Ollama Cloud metadata/thinking/filter | must | mapping table tests; filter; 1M context; cache | done (verified) | ollamacloud.ts: /api/show details+cache (no failure caching), ollamaReasoningEffort, filter non-completion, 400 too-long→input-limit; tests: mapping table 8 shapes, filter, cache (1 lookup), gemma none, null→absent |
| 2.2 | Local Ollama | must | think/num_ctx/num_predict/thinking-response tests | done (verified) | ollama.ts: /api/show, native think, num_ctx=prompt+answer+256 (<ctx), num_predict=reservation/user, system top-level (deviation D2), thinking-only error; recorded-shape test |
| 2.3 | Other adapters thinking + reasoning | must | per-adapter thinking + reasoning-strip tests | done (verified) | per-model minimal thinking: openai, anthropic(+sampling fix D3), gemini thinkingLevel, groq, together, openrouter, nvidia (reasoning_effort, drop chat_template_kwargs), deepseek, grok, zai, minimax, cohere, inception; azure max_completion_tokens; tests for 9 adapter shapes; mistral/hf/cloudflare/lmstudio/copilot/bedrock/vertex: no documented control → none sent |
| 2.4 | Reasoning-only clear error | should | 3 shapes get new message | done (verified) | loggedFetch onlyReasoning (OpenAI reasoning/reasoning_content, Ollama thinking, Anthropic thinking blocks) → clear message; ollama native path; tests |
| 3.1 | Model lists + documented limits | must | retired-ID grep empty; types/lint/test pass | done (verified) | catalog lists per policy; Together default→openai/gpt-oss-120b, Perplexity→perplexity/sonar (user); VERIFIED_LIMITS documented; retired-ID grep empty except negative test assertion + migration source; 582 pass |
| 4.1 | Ollama Cloud live check | must | all chat models pass 18KB + 100KB; oversized splits | done (verified) | live 2026-10-28: 22 chat models (clef:27b filtered): 21/22 pass 18KB+110KB on first run, nemotron-3-nano 18KB client timeout once then 2/2 pass in 2-3s (transient); 12 models first failed 400 'maximum output tokens' → fixed by learn-and-retry (deviation D4); 650KB to gpt-oss:120b → 400 classified input-limit, two 325KB halves 200/stop (split simulated by halves; GitMind split logic covered by unit test). Results scratchpad/live/result2.txt |
| 4.2 | Local Ollama check | must | pass table or recorded unavailable | done (verified) | local Ollama app unreachable (curl localhost:11434 exit 7); recorded-shape test covers think/num_ctx/num_predict/system/thinking-only |
| 4.3 | Full suite + package | must | all pass; changed assertions listed | done (verified) | lint ok, check-types ok, package ok; pnpm test 583 passing 0 failing (fresh compile-tests); changed pre-existing assertions listed in Deviations/QC |
| 4.4 | Regenerate docs/wiki | must | validators pass; retired grep docs empty | done (verified) | handbook: Providers-And-Models (new Output Budgets And Thinking section), Settings Reference, together/perplexity/ollamacloud pages; docs:export-product-surface + docs:sync-wiki; docs:validate ok; validate:wiki ok; retired-ID grep over handbook/reference/wiki empty (sonar-pro only in intentional migration note) |
| 4.5 | Commits (no push) | must | commits exist; status clean except plans/ | done (verified) | 1f920ce fix(api) + e8af5aa docs(providers) on main, not pushed; secret scan of diff clean; status clean except plans/ (2 commits instead of 3: catalog file mixes fix and list changes, deviation D6) |
| 4.6 | Reserved | could | n/a | dropped (approved) | reserved placeholder in plan; below cut line; nothing to do |

## 2. Delegation
| Task | Tier | Audit |
|---|---|---|
| 0.1 research (3 provider groups) | same tier, 3 parallel research agents | Executor read every row used; re-fetched 3 changed facts (Perplexity Agent API IDs, Together removal, MiniMax Anthropic-API models): all confirmed. Live Ollama data gathered by the executor. |
| All other tasks | none (current model) | n/a |

## 3. Deviations
- D1 (routine, within O2): metadata discovery now runs for every diff size, not only above 64 KB, so normal diffs also get real limits. One cached lookup per model per session.
- D2 (research finding, routine fix): local Ollama `system` moved from `options` to the top-level `/api/generate` field, where Ollama reads it (it was most likely ignored before).
- D3 (research finding, in O1 scope): Anthropic no longer sends temperature/top_p/top_k to Claude 4.7+ models, which reject them with 400 (the `claude-sonnet-5` default was affected). Pre-4.7 models keep sampling.
- D4 (assumption A4 partly falsified by Task 4.1): Ollama Cloud enforces a per-model output maximum below the context window for 12 of 22 models and reports it only in the 400 message. The adapter now learns it from the rejection, retries once, and caches it. Live re-check: 22/22 pass.
- D5 (decision clarification): paid per-token APIs keep existing behaviour: known models already went direct up to their real input budget; the 60K default applies to unknown models and chunk sizing. No new restriction added.
- D6: two commits instead of three, because `providerCatalog.ts` holds both the prompt-limit flag (fix) and list changes.
- Pretest finding: pnpm does not run `pretest` on `pnpm test` (pre/post scripts are off by default), so `compile-tests` must run first; the earlier pretest dedupe (plan oxlint-toolchain-fixes, 3.1) only affects `npm test`/explicit runs.

## 4. QC results
- Baseline on HEAD (fresh compile): 568 passing. Final: 583 passing, 0 failing (15 new tests in realModelLimits.test.ts).
- Pre-existing assertions changed (each tied to the new contract): longFormOutput (unknown models omit the cap; real maxima replace 1024/8192/16384), generationRepair (token-estimate sizes ×3 for bytes/3; discovery for all sizes; transport test pre-registers limits; oversized-prompt size), providerRefresh (Claude 4.7+ no sampling + lowest thinking; NVIDIA reasoning_effort none; Perplexity agent IDs; DeepSeek thinking disabled, retired name dropped), aiProviders/minimax/webview tests (retired IDs replaced), Ollama Cloud and Mercury capability tests (documented maxima).
- lint ok · check-types ok · package ok · docs:validate ok · validate:wiki ok.
- Live Ollama Cloud: 22/22 chat models pass 18 KB and 110 KB diffs (one transient timeout, re-run 2/2 pass); 650 KB prompt → 400 classified input-limit, halves succeed.

## 5. Unfinished items
- Live behaviour of the other 24 providers is not verified (no keys); covered by recorded-shape tests and cited docs.
- Local Ollama app was not running; recorded-shape test only.
- Pushing: not done (needs approval). Plan oxlint-toolchain-fixes Task 5.1 also still awaits the push decision.

## 6. Handover
- Context: real-limit budgets and minimal thinking across all adapters; model lists refreshed; docs regenerated.
- Decisions: see plan §2 plus D1–D6 above; Together → openai/gpt-oss-120b, Perplexity → perplexity/sonar.
- State: done 0.1–4.5; dropped 4.6 (placeholder); pending push.
- Remaining: push 6 local commits after approval; watch CI and the docs publish workflows.
- Verification: `pnpm run compile-tests && pnpm test` (583), live script scratchpad/live/check.mjs.
- Risks: providers without live tests may reject a thinking value (watch for 400s naming reasoning/thinking); large answers on paid APIs can cost more; Ollama Cloud first request per model may take one extra rejected call.
