import * as assert from "assert";
import * as vscode from "vscode";
import {
    COPILOT_REQUEST_JUSTIFICATION,
    CopilotLmAccess,
    CopilotProvider,
    CopilotUnavailableError,
    detectCopilot,
    mapCopilotRequestError,
    setCopilotLmAccessForTesting,
    validateCopilotAccess,
} from "../../services/api/copilot";
import { ProviderApiError } from "../../services/api/recovery";
import { formatSafeProviderError } from "../../utils/errorHandler";

const API_KEY_WORDING = /api[\s-]?key/i;

/** Providers that authenticate without a user-supplied API key, by id and by display name. */
const KEYLESS_PROVIDERS: ReadonlyArray<readonly [string, string]> = [
    ["copilot", "GitHub Copilot"],
    ["ollama", "Ollama"],
    ["lmstudio", "LM Studio"],
    ["bedrock", "Amazon Bedrock"],
    ["vertexai", "Vertex AI"],
];

suite("Copilot and keyless provider error messaging", () => {
    test("formatting a Copilot generation error twice never mentions API keys", () => {
        // Generation formats once in services/api, then commands formats the result again.
        const first = formatSafeProviderError(
            new Error("GitHub Copilot is not available. Please ensure GitHub Copilot extension is installed."),
            "GitHub Copilot"
        );
        const second = formatSafeProviderError(new Error(first), "GitMind");
        assert.doesNotMatch(first, API_KEY_WORDING, first);
        assert.doesNotMatch(second, API_KEY_WORDING, second);
    });

    test("raw language-model failures mentioning authorization are not reported as API-key problems", () => {
        for (const raw of ["GitHub Copilot error: unauthorized", "GitHub Copilot error: No permission", "Authentication failed"]) {
            const message = formatSafeProviderError(new Error(raw), "GitHub Copilot");
            assert.doesNotMatch(message, API_KEY_WORDING, `${raw} -> ${message}`);
        }
    });

    for (const [id, name] of KEYLESS_PROVIDERS) {
        for (const status of [401, 403]) {
            test(`${name} ${status} errors avoid API-key wording (id and display name)`, () => {
                for (const provider of [id, name]) {
                    const message = formatSafeProviderError(new ProviderApiError("request rejected", { status, provider: id }), provider);
                    assert.doesNotMatch(message, API_KEY_WORDING, `${provider} ${status} -> ${message}`);
                }
            });
        }

        test(`${name} unclassified errors avoid API-key suggestions`, () => {
            const message = formatSafeProviderError(new Error("something unexpected happened"), name);
            assert.doesNotMatch(message, API_KEY_WORDING, message);
        });
    }

    test("API-key providers keep API-key guidance on 401", () => {
        const message = formatSafeProviderError(new ProviderApiError("rejected", { status: 401, provider: "openai" }), "openai");
        assert.match(message, API_KEY_WORDING);
    });
});

interface FakeModelOptions {
    maxInputTokens?: number;
    inputTokens?: number;
    failWith?: unknown;
    reply?: string;
}

interface FakeModel {
    model: vscode.LanguageModelChat;
    sends: Array<{ options: vscode.LanguageModelChatRequestOptions | undefined }>;
}

function fakeModel(id: string, opts: FakeModelOptions = {}): FakeModel {
    const sends: FakeModel["sends"] = [];
    const model = {
        id,
        name: id,
        family: id,
        vendor: "copilot",
        version: "1",
        maxInputTokens: opts.maxInputTokens ?? 100_000,
        countTokens: async () => opts.inputTokens ?? 10,
        sendRequest: async (_messages: unknown, options?: vscode.LanguageModelChatRequestOptions) => {
            sends.push({ options });
            if (opts.failWith) {
                throw opts.failWith;
            }
            return {
                text: (async function* () { yield opts.reply ?? "feat: add copilot state detection"; })(),
                stream: (async function* () { /* unused */ })(),
            };
        },
    } as unknown as vscode.LanguageModelChat;
    return { model, sends };
}

function access(overrides: Partial<CopilotLmAccess> & { models?: FakeModel[] }): CopilotLmAccess {
    return {
        hasLanguageModelApi: () => true,
        selectChatModels: async () => (overrides.models ?? []).map(m => m.model),
        isCopilotExtensionInstalled: () => true,
        appName: () => "Test Editor",
        ...overrides,
    };
}

suite("Copilot detection and requests", () => {
    teardown(() => setCopilotLmAccessForTesting());

    test("reports unsupported-host when the editor has no language model API", async () => {
        setCopilotLmAccessForTesting(access({ hasLanguageModelApi: () => false }));
        const state = await detectCopilot();
        assert.strictEqual(state.kind, "unsupported-host");
        await assert.rejects(new CopilotProvider("", "auto").generateWithRawPrompt("diff"), (error: Error) => {
            assert.ok(error instanceof CopilotUnavailableError);
            assert.match(error.message, /GitHub Copilot not detected: Test Editor/);
            assert.doesNotMatch(formatSafeProviderError(error, "copilot"), API_KEY_WORDING);
            return true;
        });
    });

    test("reports not-installed when no models and no Copilot extension", async () => {
        setCopilotLmAccessForTesting(access({ isCopilotExtensionInstalled: () => false }));
        const state = await detectCopilot();
        assert.strictEqual(state.kind, "not-installed");
        const result = await validateCopilotAccess();
        assert.strictEqual(result.success, false);
        assert.match(result.error ?? "", /GitHub Copilot not detected in Test Editor/);
    });

    test("reports no-models when Copilot is installed but offers no models", async () => {
        setCopilotLmAccessForTesting(access({}));
        const state = await detectCopilot();
        assert.strictEqual(state.kind, "no-models");
    });

    test("reports no-access when model selection is denied", async () => {
        setCopilotLmAccessForTesting(access({ selectChatModels: async () => { throw vscode.LanguageModelError.NoPermissions("denied"); } }));
        const state = await detectCopilot();
        assert.strictEqual(state.kind, "no-access");
    });

    test("maps each LanguageModelError code by .code, never to API-key wording", () => {
        const cases: Array<[vscode.LanguageModelError, string]> = [
            [vscode.LanguageModelError.NoPermissions("x"), "permission"],
            [vscode.LanguageModelError.Blocked("x"), "content-filter"],
            [vscode.LanguageModelError.NotFound("x"), "configuration"],
            [new vscode.LanguageModelError("unauthorized"), "temporary-service"],
        ];
        for (const [error, category] of cases) {
            const mapped = mapCopilotRequestError(error, "gpt-test");
            assert.strictEqual(mapped.category, category, `${error.code} -> ${mapped.category}`);
            assert.ok(mapped.userFacing);
            assert.doesNotMatch(formatSafeProviderError(mapped, "copilot"), API_KEY_WORDING);
        }
    });

    test("a failure on the selected model never sends to another model", async () => {
        const selected = fakeModel("gpt-selected", { failWith: vscode.LanguageModelError.NoPermissions("denied") });
        const other = fakeModel("gpt-other");
        setCopilotLmAccessForTesting(access({ models: [selected, other] }));
        await assert.rejects(new CopilotProvider("", "gpt-selected").generateWithRawPrompt("diff"), (error: ProviderApiError) => {
            assert.strictEqual(error.category, "permission");
            return true;
        });
        assert.strictEqual(selected.sends.length, 1);
        assert.strictEqual(other.sends.length, 0);
    });

    test("an unavailable explicit model is an error, not a silent switch", async () => {
        const other = fakeModel("gpt-other");
        setCopilotLmAccessForTesting(access({ models: [other] }));
        await assert.rejects(new CopilotProvider("", "gpt-missing").generateWithRawPrompt("diff"), /"gpt-missing" is not available/);
        assert.strictEqual(other.sends.length, 0);
    });

    test("saved model names match editor IDs despite case and separator differences", async () => {
        const target = fakeModel("claude-sonnet-4-6");
        setCopilotLmAccessForTesting(access({ models: [fakeModel("gpt-other"), target] }));
        await new CopilotProvider("", "Claude-Sonnet-4.6").generateWithRawPrompt("diff");
        assert.strictEqual(target.sends.length, 1);
    });

    test("every request carries the consent justification", async () => {
        const selected = fakeModel("gpt-selected");
        setCopilotLmAccessForTesting(access({ models: [selected] }));
        const message = await new CopilotProvider("", "auto").generateWithRawPrompt("diff");
        assert.match(message, /copilot state detection/);
        assert.strictEqual(selected.sends[0].options?.justification, COPILOT_REQUEST_JUSTIFICATION);
    });

    test("input over the model limit fails with an input-limit error before sending", async () => {
        const small = fakeModel("gpt-small", { maxInputTokens: 100, inputTokens: 500 });
        setCopilotLmAccessForTesting(access({ models: [small] }));
        await assert.rejects(new CopilotProvider("", "auto").generateWithRawPrompt("diff"), (error: ProviderApiError) => {
            assert.strictEqual(error.category, "input-limit");
            return true;
        });
        assert.strictEqual(small.sends.length, 0);
    });

    test("Test Connection sends exactly one request, to the selected model", async () => {
        const models = ["a", "b", "gpt-selected", "d", "e"].map(id => fakeModel(id));
        setCopilotLmAccessForTesting(access({ models }));
        const result = await validateCopilotAccess("gpt-selected");
        assert.strictEqual(result.success, true);
        assert.deepStrictEqual(models.map(m => m.sends.length), [0, 0, 1, 0, 0]);
        assert.strictEqual(models[2].sends[0].options?.justification, COPILOT_REQUEST_JUSTIFICATION);
    });

    test("Test Connection sends nothing when Copilot is not ready", async () => {
        setCopilotLmAccessForTesting(access({ isCopilotExtensionInstalled: () => false }));
        const result = await validateCopilotAccess("auto");
        assert.strictEqual(result.success, false);
    });

    test("user-facing errors are shown unchanged by the formatter", () => {
        const error = new ProviderApiError("GitHub Copilot not detected in Test Editor.", { provider: "copilot", userFacing: true });
        assert.strictEqual(formatSafeProviderError(error, "GitMind"), "GitHub Copilot not detected in Test Editor.");
    });
});
