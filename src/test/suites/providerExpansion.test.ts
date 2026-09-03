import * as assert from "assert";
import { AzureOpenAIProvider } from "../../services/api/azureopenai";
import { CloudflareProvider } from "../../services/api/cloudflare";
import { LMStudioProvider } from "../../services/api/lmstudio";
import { ProviderIcon } from "../../webview/settings/components/ProviderIcon";
import { ProviderConfig } from "../../webview/settings/components/config/ProviderConfig";
import { getUiManagerScript } from "../../webview/settings/scripts/uiManager";

type FetchCall = { input: RequestInfo | URL; init?: RequestInit };

async function withFetchResponse<T>(response: object, work: (calls: FetchCall[]) => Promise<T>): Promise<T> {
    const originalFetch = globalThis.fetch;
    const calls: FetchCall[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ input, init });
        return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof globalThis.fetch;
    try {
        return await work(calls);
    } finally {
        globalThis.fetch = originalFetch;
    }
}

suite("Expanded provider contracts", () => {
    test("LM Studio is local-only and discovers models from its configured server", async () => {
        assert.throws(() => new LMStudioProvider("https://example.com/v1", "model"), /loopback/i);
        await withFetchResponse({ data: [{ id: "local-chat" }, { id: "local-chat" }] }, async calls => {
            const models = await new LMStudioProvider("http://127.0.0.1:1234/v1", "").getModels();
            assert.deepStrictEqual(models, ["local-chat"]);
            assert.strictEqual(String(calls[0].input), "http://127.0.0.1:1234/v1/models");
        });
    });

    test("Azure OpenAI uses the v1 endpoint and does not send an API key as bearer auth", async () => {
        await withFetchResponse({ data: [{ id: "deployment-a" }] }, async calls => {
            const models = await new AzureOpenAIProvider("azure-key", "deployment-a", "https://example.openai.azure.com/", "apiKey").getModels();
            assert.deepStrictEqual(models, ["deployment-a"]);
            assert.strictEqual(String(calls[0].input), "https://example.openai.azure.com/openai/v1/models");
            assert.strictEqual(new Headers(calls[0].init?.headers).get("api-key"), "azure-key");
            assert.strictEqual(new Headers(calls[0].init?.headers).get("authorization"), null);
        });
    });

    test("Cloudflare keeps direct Workers AI and AI Gateway endpoints distinct", async () => {
        await withFetchResponse({ data: [] }, async calls => {
            await new CloudflareProvider("token", "@cf/test/model", "account").getModels();
            await new CloudflareProvider("token", "@cf/test/model", "account", "gateway").getModels();
            assert.strictEqual(String(calls[0].input), "https://api.cloudflare.com/client/v4/accounts/account/ai/v1/models");
            assert.strictEqual(String(calls[1].input), "https://gateway.ai.cloudflare.com/v1/account/gateway/compat/models");
        });
    });

    test("Free model forms have no independent default options", () => {
        for (const provider of ProviderConfig.getAllProviders().filter(provider => !provider.isPro)) {
            const model = provider.fields.find(field => field.key === "model");
            if (!model) { continue; }
            assert.deepStrictEqual(model.defaultOptions ?? [], [], `${provider.id} exposes stale default model options`);
        }
    });

    test("new provider marks render in both Settings UI paths", () => {
        const settingsScript = getUiManagerScript();
        for (const provider of ["lmstudio", "azureopenai", "bedrock", "vertexai", "cloudflare"]) {
            const icon = ProviderIcon.renderIcon(provider);
            assert.match(icon, new RegExp(`provider-icon ${provider}`));
            assert.doesNotMatch(icon, /provider-icon-placeholder/);
            assert.match(settingsScript, new RegExp(`"${provider}":`));
        }
    });
});
