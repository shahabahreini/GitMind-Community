import * as assert from "node:assert";
import { BaseAIProvider, GenerationOptions } from "../../services/api/base";
import { MistralProvider } from "../../services/api/mistral";
import { OllamaCloudProvider } from "../../services/api/ollamacloud.js";
import { generateWithRawPrompt, generateCommitHistoryAnalysis } from "../../services/api";
import { LONG_FORM_OUTPUT_TOKENS } from "../../services/api/capabilities";
import { ChangelogService } from "../../services/changelog/ChangelogService";
import { ApiConfig } from "../../config/types";
import { supportSessionService } from "../../services/support/SupportSessionService";

/** Records the options each request would send and lets a test register discovered limits. */
class RecordingProvider extends BaseAIProvider {
    sent: GenerationOptions[] = [];
    constructor(model: string) { super(`key-${model}`, model); }
    remember(input: number, output: number | undefined, inputOnly = false, remainingContext = false): void { this.rememberModelLimits(this.model, input, output, inputOnly, remainingContext); }
    protected async generateResponse(_prompt: string, options?: GenerationOptions): Promise<string> {
        this.sent.push({ ...options });
        return "ok";
    }
    async getModels(): Promise<string[]> { return [this.model]; }
    async validateApiKey(): Promise<boolean> { return true; }
}

suite("Long-form output budget", () => {
    const originalFetch = globalThis.fetch;
    let sentMaxTokens: number[] = [];

    setup(() => {
        sentMaxTokens = [];
        globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
            if (typeof init?.body === "string") { sentMaxTokens.push(JSON.parse(init.body).max_tokens); }
            return new Response(JSON.stringify({ choices: [{ message: { content: "## [1.0.0]\n- Added things" }, finish_reason: "stop" }] }), {
                status: 200, headers: { "Content-Type": "application/json" },
            });
        }) as typeof globalThis.fetch;
    });

    teardown(() => { globalThis.fetch = originalFetch; });

    test("unknown models send no output cap so the provider applies the model's own maximum", async () => {
        const provider = new RecordingProvider("unlisted-commit-model");
        await provider.generateWithRawPrompt("diff");
        assert.strictEqual(provider.sent[0].maxTokens, undefined);

        const longForm = new RecordingProvider("unlisted-long-model");
        await longForm.generateWithRawPrompt("history", { outputTokens: LONG_FORM_OUTPUT_TOKENS });
        assert.strictEqual(longForm.sent[0].maxTokens, undefined);
    });

    test("a reported output maximum is used in full, without the old 16k clamp", async () => {
        const small = new RecordingProvider("reported-small-output");
        small.remember(200_000, 4_000);
        await small.generateWithRawPrompt("history", { outputTokens: LONG_FORM_OUTPUT_TOKENS });
        assert.strictEqual(small.sent[0].maxTokens, 4_000);
        assert.strictEqual(small.getCapabilities().maxOutputTokens, 4_000);

        const large = new RecordingProvider("reported-large-output");
        large.remember(1_000_000, 128_000);
        await large.generateWithRawPrompt("diff");
        assert.strictEqual(large.sent[0].maxTokens, 128_000);
    });

    test("models whose output shares the context get all the room the prompt leaves", async () => {
        const provider = new RecordingProvider("remaining-context-model");
        provider.remember(262_144, undefined, false, true);
        const prompt = "x".repeat(30_000);
        await provider.generateWithRawPrompt(prompt, { heuristicTokens: true });
        const promptTokens = Math.ceil(30_000 / 3 * 1.1);
        assert.strictEqual(provider.sent[0].maxTokens, 262_144 - promptTokens - 256);
    });

    test("a known context bounds the answer by what the prompt leaves", async () => {
        const provider = new RecordingProvider("reported-32k-context");
        provider.remember(32_000, 30_000);
        await provider.generateWithRawPrompt("x".repeat(60_000), { outputTokens: LONG_FORM_OUTPUT_TOKENS, heuristicTokens: true });
        assert.strictEqual(provider.sent[0].maxTokens, 32_000 - Math.ceil(60_000 / 3 * 1.1) - 256);
    });

    test("an explicit Max Tokens setting wins within the model's real limit", async () => {
        const provider = new RecordingProvider("unlisted-user-cap");
        await provider.generateWithRawPrompt("history", { outputTokens: LONG_FORM_OUTPUT_TOKENS, generationOptions: { maxTokens: 500 } });
        assert.strictEqual(provider.sent[0].maxTokens, 500);

        const known = new RecordingProvider("known-user-cap");
        known.remember(200_000, 32_000);
        await known.generateWithRawPrompt("diff", { generationOptions: { maxTokens: 5_000_000 } });
        assert.strictEqual(known.sent[0].maxTokens, 32_000);
    });

    test("an explicit Max Tokens setting on commit requests is not clamped to the 1024 reservation", async () => {
        const provider = new RecordingProvider("unlisted-commit-override");
        await provider.generateWithRawPrompt("diff", { generationOptions: { maxTokens: 4000 } });
        assert.strictEqual(provider.sent[0].maxTokens, 4000);

        const lower = new RecordingProvider("unlisted-commit-lower");
        await lower.generateWithRawPrompt("diff", { generationOptions: { maxTokens: 500 } });
        assert.strictEqual(lower.sent[0].maxTokens, 500);
    });

    test("Copilot-style input-only limits do not invent an output maximum", () => {
        const provider = new RecordingProvider("input-only-model");
        provider.remember(128_000, undefined, true);
        assert.strictEqual(provider.getCapabilities().maxOutputTokens, undefined);
    });

    test("changelog requests send the long-form budget through the real adapter", async () => {
        const config = { type: "mistral", apiKey: "test-key", model: "mistral-large-2512" } as ApiConfig;
        const changelog = await generateWithRawPrompt(config, "Write a changelog", "changelog", true);
        assert.match(changelog, /Added things/);
        assert.deepStrictEqual(sentMaxTokens, [undefined]);
    });

    test("history analysis sends the long-form budget through the real adapter", async () => {
        const config = { type: "mistral", apiKey: "test-key", model: "mistral-large-2512" } as ApiConfig;
        await generateCommitHistoryAnalysis(config, "abc1234 feat: add things", 10, false);
        assert.deepStrictEqual(sentMaxTokens, [undefined]);
    });

    test("commit-size raw prompts through the real adapter omit the cap for a model with unknown limits", async () => {
        const provider = new MistralProvider("test-key", "mistral-large-2512");
        await provider.generateWithRawPrompt("diff");
        assert.deepStrictEqual(sentMaxTokens, [undefined]);
    });

    test("Ollama Cloud commit requests may use the whole remaining context", async () => {
        const provider = new OllamaCloudProvider("test-key", "gpt-oss:120b-cloud");
        await provider.generateWithRawPrompt("diff");
        const sent = sentMaxTokens.slice(-1)[0];
        assert.ok(sent > 100_000, `sent ${sent}`);
    });

    test("changelog sizing reserves room for the long-form answer", () => {
        const service = ChangelogService.getInstance() as any;
        // ~24k-token summary: fits a 32k input budget alone, but not with the answer.
        const summary = "### Commit: abc1234\nMessage: feat: add things\n---\n".repeat(2_000);
        const prompt = service.estimateChangelogTokens(summary, null, "").promptTokens;
        const tight = service.estimateChangelogTokens(summary, null, "", prompt + 1_000);
        const roomy = service.estimateChangelogTokens(summary, null, "", prompt + LONG_FORM_OUTPUT_TOKENS);
        assert.strictEqual(tight.isWithinLimit, false);
        assert.strictEqual(roomy.isWithinLimit, true);
    });

    test("support logs record truncation as invalid_response and transport failures as network", async () => {
        const failures = async (fetchImpl: typeof globalThis.fetch) => {
            globalThis.fetch = fetchImpl;
            supportSessionService.start({ extensionVersion: "6.6.0", vscodeVersion: "1.101.0", platform: "darwin", architecture: "arm64" });
            try {
                await assert.rejects(new MistralProvider("test-key", "mistral-large-2512").generateWithRawPrompt("Write a changelog", { outputTokens: LONG_FORM_OUTPUT_TOKENS }));
                return supportSessionService.buildReport().events.filter(event => event.outcome === "failure").map(event => event.errorCategory);
            } finally { supportSessionService.stop(); }
        };
        const truncated = await failures((async () => new Response(JSON.stringify({ choices: [{ message: { content: "## [1.0.0]" }, finish_reason: "length" }] }), {
            status: 200, headers: { "Content-Type": "application/json" },
        })) as typeof globalThis.fetch);
        assert.deepStrictEqual(truncated, ["invalid_response", "invalid_response"]);
        const offline = await failures((async () => { throw new TypeError("fetch failed"); }) as typeof globalThis.fetch);
        assert.strictEqual(offline[0], "network");
    });
});
