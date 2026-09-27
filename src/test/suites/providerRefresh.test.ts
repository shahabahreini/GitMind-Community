import * as assert from "assert";
import * as vscode from "vscode";
import { getProviderDefaultModel } from "../../config/providerCatalog";
import { AnthropicProvider } from "../../services/api/anthropic";
import { CohereProvider } from "../../services/api/cohere";
import { NvidiaProvider, validateNvidiaAPIKey } from "../../services/api/nvidia";
import { DeepSeekProvider, validateDeepSeekAPIKey } from "../../services/api/deepseek";
import { MiniMaxProvider, validateMiniMaxAPIKey } from "../../services/api/minimax";
import { ZaiProvider, validateZaiAPIKey } from "../../services/api/zai";
import { OpenAIProvider } from "../../services/api/openai";
import { HUGGINGFACE_ROUTER_URL, HuggingFaceProvider } from "../../services/api/huggingface";
import { filterGroqChatModels, parseGroqError } from "../../services/api/groq";
import { extractPerplexityAgentText, PerplexityProvider, validatePerplexityAPIKey } from "../../services/api/perplexity";
import {
    RETIRED_MODEL_PREVIOUS_KEY,
    RETIRED_SHIPPED_MODEL_DEFAULTS,
    SettingsMigrationService,
} from "../../services/migration/SettingsMigrationService";

interface CapturedRequest {
    url: string;
    body: any;
}

function stubFetch(response: unknown, captured: CapturedRequest[]): typeof globalThis.fetch {
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
        captured.push({ url: String(input), body: init?.body ? JSON.parse(String(init.body)) : undefined });
        return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof globalThis.fetch;
}

suite("Provider refresh 2026-09 (API migrations and model defaults)", () => {
    let originalFetch: typeof globalThis.fetch;

    setup(() => {
        originalFetch = globalThis.fetch;
    });

    teardown(() => {
        globalThis.fetch = originalFetch;
    });

    test("Perplexity uses the Agent API request and response shape", async () => {
        const captured: CapturedRequest[] = [];
        globalThis.fetch = stubFetch({ status: "completed", output_text: "feat: use the agent api" }, captured);

        const result = await new PerplexityProvider("test-key", "sonar-pro").generateWithRawPrompt("diff");

        assert.strictEqual(result, "feat: use the agent api");
        assert.strictEqual(captured[0].url, "https://api.perplexity.ai/v1/agent");
        assert.strictEqual(captured[0].body.model, "sonar-pro");
        assert.strictEqual(captured[0].body.input, "diff");
        assert.ok(typeof captured[0].body.instructions === "string");
        assert.ok(captured[0].body.max_output_tokens > 0);
        assert.strictEqual(captured[0].body.messages, undefined, "Sonar chat-completions fields must not be sent");
    });

    test("Perplexity reads text from the typed output array when output_text is absent", () => {
        const text = extractPerplexityAgentText({ output: [{ type: "message", content: [{ type: "output_text", text: "fix: " }, { type: "output_text", text: "parse" }] }] });
        assert.strictEqual(text, "fix: parse");
    });

    test("Perplexity key validation calls the Agent API", async () => {
        const captured: CapturedRequest[] = [];
        globalThis.fetch = stubFetch({ output_text: "hi" }, captured);
        const result = await validatePerplexityAPIKey("test-key");
        assert.strictEqual(result.success, true);
        assert.strictEqual(captured[0].url, "https://api.perplexity.ai/v1/agent");
    });

    test("Hugging Face uses the Inference Providers router with chat messages", async () => {
        const captured: CapturedRequest[] = [];
        globalThis.fetch = stubFetch({ choices: [{ message: { content: "chore: route through providers" } }] }, captured);

        const model = getProviderDefaultModel("huggingface");
        const result = await new HuggingFaceProvider("hf_test", model).generateWithRawPrompt("diff");

        assert.strictEqual(result, "chore: route through providers");
        assert.strictEqual(captured[0].url, `${HUGGINGFACE_ROUTER_URL}/chat/completions`);
        assert.strictEqual(captured[0].body.model, model);
        assert.deepStrictEqual(captured[0].body.messages, [{ role: "user", content: "diff" }]);
    });

    test("Hugging Face accepts organization/model IDs from any organization", async () => {
        for (const model of ["openai/gpt-oss-120b", "mistralai/Mistral-Small-3.2-24B-Instruct-2506", "deepseek-ai/DeepSeek-V4.1-Flash", "google/gemma-4-31B-it"]) {
            globalThis.fetch = stubFetch({ choices: [{ message: { content: "feat: ok" } }] }, []);
            assert.strictEqual(await new HuggingFaceProvider("hf_test", model).generateWithRawPrompt("diff"), "feat: ok", model);
        }
    });

    test("Hugging Face still points bare other-provider IDs to the right provider", async () => {
        await assert.rejects(new HuggingFaceProvider("hf_test", "claude-sonnet-5").generateWithRawPrompt("diff"), /Anthropic/);
    });

    test("DeepSeek accepts the current and legacy model names", async () => {
        for (const model of ["deepseek-flash", "deepseek-v4-pro", "deepseek-v4-flash"]) {
            const captured: CapturedRequest[] = [];
            globalThis.fetch = stubFetch({ choices: [{ message: { content: "feat: ok" } }] }, captured);
            await new DeepSeekProvider("test-key", model).generateWithRawPrompt("diff");
            assert.strictEqual(captured[0].body.model, model);
        }
    });

    test("NVIDIA disables Nemotron thinking and strips reasoning traces from the message", async () => {
        const captured: CapturedRequest[] = [];
        globalThis.fetch = stubFetch({ choices: [{ message: { content: "<think>plan the message</think>\nfeat: add nemotron default" } }] }, captured);

        const result = await new NvidiaProvider("test-key", getProviderDefaultModel("nvidia")).generateWithRawPrompt("diff");

        assert.strictEqual(result, "feat: add nemotron default");
        assert.deepStrictEqual(captured[0].body.chat_template_kwargs, { enable_thinking: false });
    });

    test("Claude models with always-on thinking get room to think and no sampling parameters", async () => {
        for (const [model, alwaysThinks] of [["claude-opus-5-5", true], ["claude-sonnet-5", false]] as const) {
            const captured: CapturedRequest[] = [];
            globalThis.fetch = stubFetch({ content: [{ type: "thinking", thinking: "..." }, { type: "text", text: "feat: ok" }] }, captured);
            const result = await new AnthropicProvider("test-key", model).generateWithRawPrompt("diff");
            assert.strictEqual(result.trim(), "feat: ok", model);
            assert.strictEqual(captured[0].body.temperature === undefined, alwaysThinks, `${model} temperature`);
            assert.ok(alwaysThinks ? captured[0].body.max_tokens >= 4000 : captured[0].body.max_tokens <= 1000, `${model} max_tokens`);
        }
    });

    test("Cohere sends live-discovered models instead of rejecting them", async () => {
        const captured: CapturedRequest[] = [];
        globalThis.fetch = stubFetch({ message: { content: [{ type: "text", text: "feat: ok" }] } }, captured);
        await new CohereProvider("test-key", "command-a-reasoning-08-2025").generateWithRawPrompt("diff").catch(() => undefined);
        assert.strictEqual(captured[0]?.body?.model, "command-a-reasoning-08-2025");
    });

    test("Groq filters out non-chat models (audio, tts, guardrails, inactive) and retains active chat models", () => {
        const rawModels = [
            { id: "llama-3.3-70b-versatile", active: true },
            { id: "whisper-large-v3", active: true },
            { id: "whisper-large-v3-turbo", active: true },
            { id: "meta-llama/llama-prompt-guard-2-22m", active: true },
            { id: "meta-llama/llama-guard-4-12b", active: true },
            { id: "canopylabs/orpheus-v1-english", active: true },
            { id: "openai/gpt-oss-120b", active: true },
            { id: "openai/gpt-oss-20b", active: true },
            { id: "openai/gpt-oss-safeguard-20b", active: true },
            { id: "qwen/qwen3.8-27b", active: true },
            { id: "qwen3-reranker-4b", active: true },
            { id: "deprecated-chat-model", active: false },
        ];
        const filtered = filterGroqChatModels(rawModels);
        assert.deepStrictEqual(filtered, [
            "llama-3.3-70b-versatile",
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "qwen/qwen3.8-27b",
        ]);
    });

    test("Groq parses HTTP error into ProviderApiError with category and status", () => {
        const error404 = parseGroqError(404, JSON.stringify({ error: { message: "Model decommissioned", code: "model_decommissioned" } }));
        assert.strictEqual(error404.status, 404);
        assert.strictEqual(error404.category, "model-limit");
        assert.strictEqual(error404.provider, "groq");

        const error403 = parseGroqError(403, JSON.stringify({ error: { message: "Enterprise only", code: "permission_denied" } }));
        assert.strictEqual(error403.status, 403);
        assert.strictEqual(error403.category, "permission");

        const error429 = parseGroqError(429, JSON.stringify({ error: { message: "Rate limit reached" } }));
        assert.strictEqual(error429.status, 429);
        assert.strictEqual(error429.category, "rate-limit");
    });

    test("NVIDIA key validation uses active nemotron-3-super-120b-a12b model", async () => {
        const captured: CapturedRequest[] = [];
        globalThis.fetch = stubFetch({ choices: [{ message: { content: "OK" } }] }, captured);

        const result = await validateNvidiaAPIKey("test-key");
        assert.strictEqual(result, true);
        assert.strictEqual(captured[0].body.model, "nvidia/nemotron-3-super-120b-a12b");
    });

    test("MiniMax validation and fallback use MiniMax-M3", async () => {
        const captured: CapturedRequest[] = [];
        globalThis.fetch = stubFetch({ content: [{ type: "text", text: "OK" }] }, captured);

        const result = await validateMiniMaxAPIKey("test-key");
        assert.strictEqual(result, true);
        assert.strictEqual(captured[0].body.model, "MiniMax-M3");

        const provider = new MiniMaxProvider("test-key", "");
        // If API fails, getModels returns fallback list containing MiniMax-M3
        globalThis.fetch = (async () => new Response("error", { status: 500 })) as typeof globalThis.fetch;
        const models = await provider.getModels();
        assert.ok(models.includes("MiniMax-M3"));
        assert.ok(!models.includes("MiniMax-M2.5"));
    });

    test("Z.ai getModels and validation use glm-5.3", async () => {
        const captured: CapturedRequest[] = [];
        globalThis.fetch = stubFetch({ choices: [{ message: { content: "OK" } }] }, captured);

        const result = await validateZaiAPIKey("test-key");
        assert.strictEqual(result.success, true);
        assert.strictEqual(captured[0].body.model, "glm-5.3");

        const provider = new ZaiProvider("test-key", "");
        const models = await provider.getModels();
        assert.ok(models.includes("glm-5.3"));
    });

    test("DeepSeek validation uses deepseek-flash", async () => {
        const captured: CapturedRequest[] = [];
        globalThis.fetch = stubFetch({ choices: [{ message: { content: "OK" } }] }, captured);

        const result = await validateDeepSeekAPIKey("test-key");
        assert.strictEqual(result, true);
        assert.strictEqual(captured[0].body.model, "deepseek-flash");
    });

    test("OpenAI getModels sorts gpt-6 models ahead of older generations", async () => {
        globalThis.fetch = stubFetch({
            data: [
                { id: "gpt-4o" },
                { id: "gpt-5.6-terra" },
                { id: "gpt-6-sol" },
                { id: "gpt-6-luna" },
                { id: "o3" },
            ]
        }, []);

        const provider = new OpenAIProvider("test-key", "");
        const models = await provider.getModels();
        assert.strictEqual(models[0], "gpt-6-luna");
        assert.strictEqual(models[1], "gpt-6-sol");
        assert.strictEqual(models[2], "gpt-5.6-terra");
    });
});

suite("Retired default model migration", () => {
    const config = () => vscode.workspace.getConfiguration("gitmind");
    const state = new Map<string, unknown>();
    const context = {
        globalState: {
            get: <T>(key: string) => state.get(key) as T | undefined,
            update: async (key: string, value: unknown) => { state.set(key, value); },
        },
    } as unknown as vscode.ExtensionContext;

    teardown(async () => {
        state.clear();
        await config().update("grok.model", undefined, vscode.ConfigurationTarget.Global);
        await config().update("groq.model", undefined, vscode.ConfigurationTarget.Global);
    });

    test("moves a retired shipped default to the catalog default and records the previous value", async () => {
        const retired = RETIRED_SHIPPED_MODEL_DEFAULTS.grok![0];
        await config().update("grok.model", retired, vscode.ConfigurationTarget.Global);

        const migrated = await SettingsMigrationService.getInstance().migrateRetiredModelDefaults(context);

        assert.ok(migrated.includes("grok"));
        assert.strictEqual(config().inspect<string>("grok.model")?.globalValue, getProviderDefaultModel("grok"));
        assert.deepStrictEqual((state.get(RETIRED_MODEL_PREVIOUS_KEY) as any).grok, [{ target: "globalValue", value: retired }]);
    });

    test("migrates retired Groq models to catalog default", async () => {
        await config().update("groq.model", "llama-3.3-70b-versatile", vscode.ConfigurationTarget.Global);

        const migrated = await SettingsMigrationService.getInstance().migrateRetiredModelDefaults(context);

        assert.ok(migrated.includes("groq"));
        assert.strictEqual(config().inspect<string>("groq.model")?.globalValue, "openai/gpt-oss-120b");
        assert.deepStrictEqual((state.get(RETIRED_MODEL_PREVIOUS_KEY) as any).groq, [{ target: "globalValue", value: "llama-3.3-70b-versatile" }]);
    });

    test("keeps a user-chosen model that is not a retired shipped default", async () => {
        await config().update("groq.model", "openai/gpt-oss-20b", vscode.ConfigurationTarget.Global);

        const migrated = await SettingsMigrationService.getInstance().migrateRetiredModelDefaults(context);

        assert.ok(!migrated.includes("groq"));
        assert.strictEqual(config().inspect<string>("groq.model")?.globalValue, "openai/gpt-oss-20b");
    });

    test("every retired value differs from the current catalog default", () => {
        for (const [provider, retired] of Object.entries(RETIRED_SHIPPED_MODEL_DEFAULTS)) {
            assert.ok(!retired!.includes(getProviderDefaultModel(provider)), provider);
        }
    });
});
