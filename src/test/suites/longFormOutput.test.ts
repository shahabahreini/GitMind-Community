import * as assert from "node:assert";
import { BaseAIProvider, GenerationOptions } from "../../services/api/base";
import { MistralProvider } from "../../services/api/mistral";
import { OllamaCloudProvider } from "../../services/api/ollamacloud.js";
import { generateWithRawPrompt, generateCommitHistoryAnalysis } from "../../services/api";
import { LONG_FORM_OUTPUT_TOKENS, LONG_FORM_MAX_OUTPUT_TOKENS, modelCapabilities } from "../../services/api/capabilities";
import { ChangelogService } from "../../services/changelog/ChangelogService";
import { ApiConfig } from "../../config/types";
import { supportSessionService } from "../../services/support/SupportSessionService";

/** Records the options each request would send and lets a test register discovered limits. */
class RecordingProvider extends BaseAIProvider {
    sent: GenerationOptions[] = [];
    constructor(model: string) { super(`key-${model}`, model); }
    remember(input: number, output: number | undefined, inputOnly = false): void { this.rememberModelLimits(this.model, input, output, inputOnly); }
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

    test("commit requests keep the model reservation", async () => {
        const provider = new RecordingProvider("unlisted-commit-model");
        await provider.generateWithRawPrompt("diff");
        assert.strictEqual(provider.sent[0].maxTokens, modelCapabilities("unlisted-commit-model").outputTokens);
    });

    test("long-form requests on unknown models get the long-form budget", async () => {
        const provider = new RecordingProvider("unlisted-long-model");
        await provider.generateWithRawPrompt("history", { outputTokens: LONG_FORM_OUTPUT_TOKENS });
        assert.strictEqual(provider.sent[0].maxTokens, LONG_FORM_OUTPUT_TOKENS);
    });

    test("a reported output maximum bounds the long-form budget", async () => {
        const small = new RecordingProvider("reported-small-output");
        small.remember(200_000, 4_000);
        await small.generateWithRawPrompt("history", { outputTokens: LONG_FORM_OUTPUT_TOKENS });
        assert.strictEqual(small.sent[0].maxTokens, 4_000);
        assert.strictEqual(small.getCapabilities().maxOutputTokens, 4_000);
        assert.ok(small.getCapabilities().outputTokens <= 1024, "commit reservation is unchanged");

        const large = new RecordingProvider("reported-large-output");
        large.remember(1_000_000, 65_536);
        await large.generateWithRawPrompt("history", { outputTokens: LONG_FORM_OUTPUT_TOKENS });
        assert.strictEqual(large.sent[0].maxTokens, LONG_FORM_MAX_OUTPUT_TOKENS);
    });

    test("a known context leaves room for the prompt but never drops below the reservation", async () => {
        const provider = new RecordingProvider("reported-32k-context");
        provider.remember(32_000, 16_000);
        const reservation = provider.getCapabilities().outputTokens;
        await provider.generateWithRawPrompt("x".repeat(80_000), { outputTokens: LONG_FORM_OUTPUT_TOKENS, heuristicTokens: true });
        const sent = provider.sent[0].maxTokens!;
        assert.ok(sent >= reservation && sent < LONG_FORM_OUTPUT_TOKENS, `sent ${sent}`);
    });

    test("an explicit Max Tokens setting still caps long-form output", async () => {
        const provider = new RecordingProvider("unlisted-user-cap");
        await provider.generateWithRawPrompt("history", { outputTokens: LONG_FORM_OUTPUT_TOKENS, generationOptions: { maxTokens: 500 } });
        assert.strictEqual(provider.sent[0].maxTokens, 500);
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
        assert.deepStrictEqual(sentMaxTokens, [LONG_FORM_OUTPUT_TOKENS]);
    });

    test("history analysis sends the long-form budget through the real adapter", async () => {
        const config = { type: "mistral", apiKey: "test-key", model: "mistral-large-2512" } as ApiConfig;
        await generateCommitHistoryAnalysis(config, "abc1234 feat: add things", 10, false);
        assert.deepStrictEqual(sentMaxTokens, [LONG_FORM_OUTPUT_TOKENS]);
    });

    test("commit-size raw prompts through the real adapter keep the reservation", async () => {
        const provider = new MistralProvider("test-key", "mistral-large-2512");
        await provider.generateWithRawPrompt("diff");
        assert.deepStrictEqual(sentMaxTokens, [modelCapabilities("mistral-large-2512").outputTokens]);
    });

    test("Ollama Cloud commit requests send the 4096 reasoning-safe reservation", async () => {
        const provider = new OllamaCloudProvider("test-key", "gpt-oss:120b-cloud");
        await provider.generateWithRawPrompt("diff");
        assert.deepStrictEqual(sentMaxTokens.slice(-1), [4096]);
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
