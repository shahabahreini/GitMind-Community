import * as assert from "assert";
import { filterNvidiaChatModels, NvidiaProvider } from "../../services/api/nvidia";
import { classifyGenerationFailure, ProviderApiError } from "../../services/api/recovery";
import { ModelSettingsRenderer } from "../../webview/settings/components/renderers/ModelSettingsRenderer";
import { generateSettingsCollection } from "../../webview/settings/scripts/formGenerators";
import { getSettingsScript } from "../../webview/settings/scripts/settingsManager";

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

    test("includes Automatic Recovery controls and values in settings save payload", () => {
        const settings = {
            apiProvider: "gemini",
            pro: {
                validationStatus: "valid",
                automaticRetry: { enabled: true },
                modelFallback: { enabled: true, models: { gemini: "gemini-3.1-pro" } },
            },
            subscription: { status: "active" },
            gemini: { apiKey: "", model: "gemini-3.1-flash" },
        } as any;

        const html = new ModelSettingsRenderer(settings).render();
        const collection = generateSettingsCollection();
        const script = getSettingsScript(settings, "test-nonce");

        assert.match(html, /id="automaticRetryEnabled"[^>]*checked/);
        assert.match(html, /id="modelFallbackEnabled"[^>]*checked/);
        assert.ok(collection.includes("automaticRetryEnabled"));
        assert.ok(collection.includes("modelFallbackEnabled"));
        assert.ok(collection.includes("currentSettings.pro?.modelFallback?.models || {}"));
        assert.ok(script.includes("['automaticRetryEnabled', 'pro.automaticRetry.enabled'"));
        assert.ok(script.includes("['modelFallbackEnabled', 'pro.modelFallback.enabled'"));
        assert.ok(script.includes("automaticRetryEnabled: document.getElementById('automaticRetryEnabled')?.checked"));
        assert.ok(script.includes("modelFallbackEnabled: document.getElementById('modelFallbackEnabled')?.checked"));
    });
});
