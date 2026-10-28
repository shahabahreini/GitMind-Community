import * as assert from "assert";
import { chooseOllamaThinking, filterOllamaCloudModels, OllamaCloudProvider, ollamaReasoningEffort, parseOllamaCloudError, parseOllamaModelDetails } from "../../services/api/ollamacloud";
import { OllamaProvider } from "../../services/api/ollama";
import { conservativeTokenCount, DEFAULT_PROMPT_TOKEN_CAP, defaultPromptTokenCap, effectiveInputBudget, modelCapabilities, UNKNOWN_LIMIT_OUTPUT_TOKENS } from "../../services/api/capabilities";
import { classifyGenerationFailure } from "../../services/api/recovery";
import { GroqProvider } from "../../services/api/groq";
import { ZaiProvider } from "../../services/api/zai";
import { CohereProvider } from "../../services/api/cohere";
import { OpenAIProvider } from "../../services/api/openai";
import { CloudflareProvider } from "../../services/api/cloudflare";
import { AzureOpenAIProvider } from "../../services/api/azureopenai";
import { MistralProvider } from "../../services/api/mistral";
import { InceptionProvider } from "../../services/api/inception";
import { AnthropicProvider } from "../../services/api/anthropic";

interface Captured { url: string; body: any }

/** Routes /api/show to model details and every other request to the given answer, recording request bodies. */
function stubOllama(details: unknown, answer: unknown, captured: Captured[]): typeof globalThis.fetch {
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        captured.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
        const body = url.endsWith("/api/show") ? details : answer;
        return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof globalThis.fetch;
}

function stubJson(response: unknown, captured: Captured[], status = 200): typeof globalThis.fetch {
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
        captured.push({ url: String(input), body: init?.body ? JSON.parse(String(init.body)) : undefined });
        return new Response(JSON.stringify(response), { status, headers: { "Content-Type": "application/json" } });
    }) as typeof globalThis.fetch;
}

const chatAnswer = { choices: [{ message: { content: "feat: ok" }, finish_reason: "stop" }] };

suite("Real model limits and minimal thinking", () => {
    let originalFetch: typeof globalThis.fetch;
    setup(() => { originalFetch = globalThis.fetch; });
    teardown(() => { globalThis.fetch = originalFetch; });

    test("Ollama thinking choice uses the lowest level each model reports and never turns thinking on", () => {
        // Values observed live on Ollama Cloud /api/show, 2026-10-28.
        const cases: Array<[Array<string | boolean> | undefined, false | string | undefined, string | undefined]> = [
            [["low", "high", "max"], "low", "low"],                       // glm-5.3
            [[false, "high", "max"], false, "none"],                      // glm-5.2
            [[false, "low", "medium", "high", "max"], false, "none"],     // muse-spark-open
            [[false, true], false, "none"],                               // kimi-k2.6 (default on)
            [[false, true], false, "none"],                               // gemma4 (default off) stays off
            [["low", "medium", "high"], "low", "low"],                    // gpt-oss
            [["low", "medium", "high", "xhigh", "max"], "low", "low"],    // beam
            [undefined, undefined, undefined],                            // mistral-large-4: no metadata
        ];
        for (const [values, native, effort] of cases) {
            assert.strictEqual(chooseOllamaThinking(values), native, JSON.stringify(values));
            assert.strictEqual(ollamaReasoningEffort(values), effort, JSON.stringify(values));
        }
    });

    test("Ollama model details read the context window, thinking values and capabilities", () => {
        const details = parseOllamaModelDetails({
            capabilities: ["completion", "thinking", "tools"],
            thinking: { values: ["low", "high", "max"], default: "max" },
            model_info: { "glm_dsa_moe.context_length": 1048576, "glm_dsa_moe.embedding_length": 0 },
        });
        assert.deepStrictEqual(details, { contextTokens: 1048576, thinkingValues: ["low", "high", "max"], capabilities: ["completion", "thinking", "tools"] });
    });

    test("Ollama Cloud hides models that cannot complete text", () => {
        const models = filterOllamaCloudModels({ models: [
            { name: "glm-5.3", capabilities: ["completion", "thinking", "tools"] },
            { name: "clef:27b", capabilities: ["decision", "vision"] },
            { name: "legacy-model" },
        ] });
        assert.deepStrictEqual(models, ["glm-5.3", "legacy-model"]);
    });

    test("Ollama Cloud sends the real remaining context and the lowest thinking level, looking details up once", async () => {
        const captured: Captured[] = [];
        globalThis.fetch = stubOllama({
            capabilities: ["completion", "thinking"], thinking: { values: ["low", "high", "max"], default: "max" },
            model_info: { "glm.context_length": 1048576 },
        }, chatAnswer, captured);
        const prompt = "x".repeat(30_000);
        assert.strictEqual(await new OllamaCloudProvider("cloud-key-a", "glm-5.3-test").generateWithRawPrompt(prompt, { heuristicTokens: true }), "feat: ok");
        const chat = captured.filter(request => request.url.endsWith("/v1/chat/completions"));
        assert.strictEqual(chat[0].body.reasoning_effort, "low");
        assert.strictEqual(chat[0].body.max_tokens, 1048576 - Math.ceil(30_000 / 3 * 1.1) - 256);

        await new OllamaCloudProvider("cloud-key-a", "glm-5.3-test").generateWithRawPrompt("diff");
        assert.strictEqual(captured.filter(request => request.url.endsWith("/api/show")).length, 1, "details are cached per model");
    });

    test("Ollama Cloud never enables thinking for a model that does not think by default", async () => {
        const captured: Captured[] = [];
        globalThis.fetch = stubOllama({ capabilities: ["completion"], thinking: { values: [false, true], default: false }, model_info: { "gemma4.context_length": 262144 } }, chatAnswer, captured);
        await new OllamaCloudProvider("cloud-key-b", "gemma4-test").generateWithRawPrompt("diff");
        assert.strictEqual(captured.find(request => request.url.endsWith("/v1/chat/completions"))!.body.reasoning_effort, "none");

        const none: Captured[] = [];
        globalThis.fetch = stubOllama({ capabilities: ["completion"], model_info: { "mistral4.context_length": 1048576 } }, chatAnswer, none);
        await new OllamaCloudProvider("cloud-key-b", "mistral-test").generateWithRawPrompt("diff");
        assert.strictEqual(none.find(request => request.url.endsWith("/v1/chat/completions"))!.body.reasoning_effort, undefined);
    });

    test("Ollama Cloud learns a model's output maximum from the rejection, retries once, and remembers it", async () => {
        const bodies: any[] = [];
        globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            if (url.endsWith("/api/show")) {
                return new Response(JSON.stringify({ model_info: { "deepseek.context_length": 1048576 }, thinking: { values: [false, true] } }), { status: 200, headers: { "Content-Type": "application/json" } });
            }
            const body = JSON.parse(String(init!.body));
            bodies.push(body);
            if (body.max_tokens > 65536) {
                return new Response(JSON.stringify({ error: { message: `max_tokens (${body.max_tokens}) exceeds model's maximum output tokens (65536) for model deepseek-v4-pro:0813`, type: "invalid_request_error" } }), { status: 400, headers: { "Content-Type": "application/json" } });
            }
            return new Response(JSON.stringify(chatAnswer), { status: 200, headers: { "Content-Type": "application/json" } });
        }) as typeof globalThis.fetch;
        assert.strictEqual(await new OllamaCloudProvider("cloud-key-d", "deepseek-v4-pro-test").generateWithRawPrompt("diff"), "feat: ok");
        assert.deepStrictEqual(bodies.map(body => body.max_tokens > 65536), [true, false]);
        assert.strictEqual(bodies[1].max_tokens, 65536);

        bodies.length = 0;
        await new OllamaCloudProvider("cloud-key-d", "deepseek-v4-pro-test").generateWithRawPrompt("diff");
        assert.deepStrictEqual(bodies.map(body => body.max_tokens), [65536], "the learned maximum is reused without another rejection");
    });

    test("an oversized Ollama Cloud prompt is an input limit, so the diff is split", () => {
        const error = parseOllamaCloudError(400, JSON.stringify({ error: { message: "The prompt is too long: 160419, model maximum context length: 131072", type: "invalid_request_error" } }));
        assert.strictEqual(error.category, "input-limit");
    });

    test("an answer made only of reasoning gets a clear error instead of a generic truncation", async () => {
        const captured: Captured[] = [];
        globalThis.fetch = stubOllama({ model_info: { "glm.context_length": 1048576 } },
            { choices: [{ message: { content: "", reasoning: "thinking about the diff" }, finish_reason: "length" }] }, captured);
        await assert.rejects(new OllamaCloudProvider("cloud-key-c", "reasoning-only").generateWithRawPrompt("diff"),
            (error: any) => /spent its whole output budget thinking/.test(error.message) && error.category === "invalid-response");
    });

    test("local Ollama sends the native think switch, sizes the window to the request, and reads the answer only", async () => {
        const captured: Captured[] = [];
        globalThis.fetch = stubOllama({ capabilities: ["completion", "thinking"], thinking: { values: [false, true] }, model_info: { "gemma4.context_length": 262144 } },
            { response: "feat: local", thinking: "planning", done: true }, captured);
        const provider = new OllamaProvider("http://localhost:11434", "gemma4-local");
        assert.strictEqual(await provider.generateWithRawPrompt("x".repeat(9000)), "feat: local");
        const body = captured.find(request => request.url.endsWith("/api/generate"))!.body;
        assert.strictEqual(body.think, false);
        assert.strictEqual(body.system, "You analyze source changes and follow the requested output format.");
        assert.strictEqual(body.options.num_predict, provider.getCapabilities().outputTokens);
        assert.strictEqual(body.options.num_ctx, conservativeTokenCount("x".repeat(9000)) + provider.getCapabilities().outputTokens + 256);
        assert.ok(body.options.num_ctx < 262144, "the window is not the model maximum");

        const thinkingOnly: Captured[] = [];
        globalThis.fetch = stubOllama({ model_info: { "gemma4.context_length": 262144 } }, { response: "", thinking: "only thoughts", done: true }, thinkingOnly);
        await assert.rejects(new OllamaProvider("http://localhost:11434", "gemma4-local").generateWithRawPrompt("diff"), /spent its whole output budget thinking/);
    });

    test("prompt caps follow real limits only for providers not billed per token", () => {
        const known = { ...modelCapabilities("unknown"), contextTokens: 1048576, outputTokens: 16384, isUnknown: false };
        assert.strictEqual(defaultPromptTokenCap("ollamacloud", known), effectiveInputBudget(known));
        assert.strictEqual(defaultPromptTokenCap("lmstudio", known), effectiveInputBudget(known));
        assert.strictEqual(defaultPromptTokenCap("openai", known), DEFAULT_PROMPT_TOKEN_CAP);
        assert.strictEqual(defaultPromptTokenCap("ollamacloud", modelCapabilities("unknown")), DEFAULT_PROMPT_TOKEN_CAP);
    });

    test("token estimates count about three bytes per token", () => {
        assert.strictEqual(conservativeTokenCount("x".repeat(300_000)), 100_000);
    });

    test("documented limits are real maxima, not small reservations", () => {
        assert.strictEqual(modelCapabilities("claude-sonnet-5").maxOutputTokens, 128000);
        assert.strictEqual(modelCapabilities("gemini-3.8-flash").maxOutputTokens, 65536);
        assert.strictEqual(modelCapabilities("glm-5.3").maxOutputTokens, 128000);
        assert.strictEqual(modelCapabilities("mistral-small-2603").isUnknown, true, "no documented maximum output, so the API applies its own");
    });

    test("adapters send each model's lowest documented thinking setting", async () => {
        const cases: Array<[() => { generateWithRawPrompt(prompt: string): Promise<string> }, unknown, (body: any) => unknown, unknown]> = [
            [() => new GroqProvider("k", "qwen/qwen3.8-27b"), chatAnswer, body => body.reasoning_effort, "none"],
            [() => new GroqProvider("k", "openai/gpt-oss-120b"), chatAnswer, body => body.reasoning_effort, "low"],
            [() => new ZaiProvider("k", "glm-5.3"), chatAnswer, body => body.reasoning_effort, "low"],
            [() => new ZaiProvider("k", "glm-5.2"), chatAnswer, body => body.thinking, { type: "disabled" }],
            [() => new OpenAIProvider("k", "gpt-6-sol"), chatAnswer, body => body.reasoning_effort, "none"],
            [() => new OpenAIProvider("k", "gpt-6-astra"), chatAnswer, body => body.reasoning_effort, "low"],
            [() => new InceptionProvider("k", "mercury-2.5"), chatAnswer, body => body.reasoning_effort, "instant"],
            [() => new CohereProvider("k", "command-a-reasoning-08-2025"), { message: { content: [{ type: "text", text: "feat: ok" }] }, finish_reason: "COMPLETE" }, body => body.thinking, { type: "disabled" }],
            [() => new AnthropicProvider("k", "claude-haiku-5-5"), { content: [{ type: "text", text: "feat: ok" }], stop_reason: "end_turn" }, body => body.thinking, { type: "disabled" }],
        ];
        for (const [make, answer, read, expected] of cases) {
            const captured: Captured[] = [];
            globalThis.fetch = stubJson(answer, captured);
            await make().generateWithRawPrompt("diff").catch(() => undefined);
            const request = captured.find(entry => entry.body?.messages || entry.body?.input || entry.body?.message);
            assert.deepStrictEqual(read(request?.body ?? {}), expected, `${request?.url} ${JSON.stringify(request?.body)}`);
        }
    });

    test("output budgets are omitted when unknown, except where the API needs a number", async () => {
        const omitted: Captured[] = [];
        globalThis.fetch = stubJson(chatAnswer, omitted);
        await new MistralProvider("k", "mistral-unlisted").generateWithRawPrompt("diff");
        assert.strictEqual(omitted[omitted.length - 1].body.max_tokens, undefined);

        const cloudflare: Captured[] = [];
        globalThis.fetch = stubJson(chatAnswer, cloudflare);
        await new CloudflareProvider("token", "@cf/unlisted", "account").generateWithRawPrompt("diff");
        assert.strictEqual(cloudflare[cloudflare.length - 1].body.max_tokens, UNKNOWN_LIMIT_OUTPUT_TOKENS, "Workers AI defaults to 256 when omitted");

        const azure: Captured[] = [];
        globalThis.fetch = stubJson(chatAnswer, azure);
        await new AzureOpenAIProvider("key", "deployment", "https://example.openai.azure.com", "apiKey").generateWithRawPrompt("diff", { generationOptions: { maxTokens: 2000 } });
        const azureBody = azure[azure.length - 1].body;
        assert.strictEqual(azureBody.max_completion_tokens, 2000);
        assert.strictEqual(azureBody.max_tokens, undefined, "reasoning deployments reject max_tokens");

        const anthropic: Captured[] = [];
        globalThis.fetch = stubJson({ content: [{ type: "text", text: "feat: ok" }], stop_reason: "end_turn" }, anthropic);
        await new AnthropicProvider("k", "claude-unlisted-model").generateWithRawPrompt("diff");
        assert.strictEqual(anthropic[anthropic.length - 1].body.max_tokens, UNKNOWN_LIMIT_OUTPUT_TOKENS, "Messages requires max_tokens");
    });

    test("documented too-long errors are classified as input limits", () => {
        const shapes: Array<[number, string, string]> = [
            [400, "anthropic", "prompt is too long: 1200000 tokens > 1000000 maximum"],
            [400, "inception", "You exceeded the maximum context length for this model of 128000. Please reduce the length of the messages or completion."],
            [400, "zai", "Prompt too long"],
            [413, "openai", "context length exceeded"],
        ];
        for (const [status, provider, message] of shapes) {
            const error = Object.assign(new Error(message), { status });
            assert.strictEqual(classifyGenerationFailure(error, provider), "input-limit", `${provider}: ${message}`);
        }
    });
});
