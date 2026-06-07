import * as assert from "assert";
import { filterNvidiaChatModels, NvidiaProvider } from "../../services/api/nvidia";
import { classifyGenerationFailure, ProviderApiError } from "../../services/api/recovery";

suite("NVIDIA Provider and Generation Recovery", () => {
    let originalFetch: typeof globalThis.fetch;

    setup(() => {
        originalFetch = globalThis.fetch;
    });

    teardown(() => {
        globalThis.fetch = originalFetch;
    });

    test("filters non-chat NVIDIA models and deduplicates IDs", () => {
        const models = filterNvidiaChatModels([
            { id: "meta/llama-3.3-70b-instruct" },
            { id: "nvidia/nv-embed-v1" },
            { id: "meta/llama-3.3-70b-instruct" },
            { id: "nvidia/nemotron-3-super-120b-a12b" },
            { nope: "invalid" },
        ]);

        assert.deepStrictEqual(models, [
            "meta/llama-3.3-70b-instruct",
            "nvidia/nemotron-3-super-120b-a12b",
        ]);
    });

    test("uses OpenAI-compatible NVIDIA chat completions", async () => {
        let requestBody: any;
        globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
            requestBody = JSON.parse(String(init?.body));
            return new Response(JSON.stringify({
                choices: [{ message: { content: "feat: add NVIDIA" } }],
            }), { status: 200, headers: { "Content-Type": "application/json" } });
        }) as typeof globalThis.fetch;

        const provider = new NvidiaProvider("test-key", "meta/llama-3.3-70b-instruct");
        const result = await provider.generateWithRawPrompt("test");

        assert.strictEqual(result, "feat: add NVIDIA");
        assert.strictEqual(requestBody.model, "meta/llama-3.3-70b-instruct");
        assert.deepStrictEqual(requestBody.messages, [{ role: "user", content: "test" }]);
    });

    test("only classifies eligible retry and fallback failures", () => {
        assert.strictEqual(classifyGenerationFailure(new Error("Request timed out"), "openai"), "timeout");
        assert.strictEqual(classifyGenerationFailure(new ProviderApiError("Gemini overloaded", 503), "gemini"), "temporary-service");
        assert.strictEqual(classifyGenerationFailure(new ProviderApiError("model rate limit reached", 429), "nvidia"), "model-limit");
        assert.strictEqual(classifyGenerationFailure(new ProviderApiError("generic rate limit", 429), "nvidia"), "unknown");
        assert.strictEqual(classifyGenerationFailure(new ProviderApiError("invalid api key", 401), "gemini"), "authentication");
        assert.strictEqual(classifyGenerationFailure(new Error("input token limit exceeded"), "gemini"), "input-limit");
        assert.strictEqual(classifyGenerationFailure(new Error("billing quota exceeded"), "gemini"), "account-limit");
    });
});
