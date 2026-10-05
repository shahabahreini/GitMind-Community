import * as assert from "node:assert";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { sourceWindows, generateBudgeted, splitCovered } from "../../services/api/budgetedGeneration";
import { answerText, assertPromptFits, modelCapabilities } from "../../services/api/capabilities";
import { runRequest, requestScope } from "../../services/api/requestContext";
import { ProviderApiError, classifyGenerationFailure, normalizeProviderError } from "../../services/api/recovery";
import { beginGenerationOperation, cancelCurrentRequest, createRecoveryOperation, getProviderInstance, isRequestActive } from "../../services/api";
import { PROVIDER_IDS, PROVIDER_CATALOG } from "../../config/providerCatalog";
import { resolveLargeDiffSettings } from "../../config/largeDiffSettings";
import { createDiffSpool } from "../../services/git/diffSpool";
import { SupportSessionService } from "../../services/support/SupportSessionService";
import { NvidiaProvider } from "../../services/api/nvidia";
import { LMStudioProvider } from "../../services/api/lmstudio";
import { CustomProvider } from "../../services/api/custom";
import { formatSafeProviderError } from "../../utils/errorHandler";
import * as vscode from "vscode";
import { setCommitMessage } from "../../services/git/repository";

const settings = resolveLargeDiffSettings({ enabled: true, batchSize: 5 });
const sdkProviders = ["gemini", "vertexai", "bedrock", "copilot"];
const answer = "A factual answer longer than seventy two characters retains every word without any adapter truncating it.\nSecond detail.";
const textBlocks = [{ type: "thinking", thinking: "private" }, { type: "text", text: answer.slice(0, 40) }, { type: "text", text: answer.slice(40) }];

function payload(id: string, mode: string): any {
    const text = mode === "empty" ? "" : answer;
    const blocks = mode === "blocks" ? textBlocks : [{ type: "text", text }];
    if (id === "ollama") { return { response: text, done: true, done_reason: mode === "truncated" ? "length" : "stop" }; }
    if (id === "anthropic" || id === "minimax") { return { content: blocks, stop_reason: mode === "truncated" ? "max_tokens" : "end_turn" }; }
    if (id === "cohere") { return { message: { content: blocks }, finish_reason: mode === "truncated" ? "max_tokens" : "COMPLETE" }; }
    if (id === "grok" || id === "perplexity") { return { output: [{ type: "message", content: blocks.map(block => ({ ...block, type: block.type === "text" ? "output_text" : block.type })) }], status: mode === "truncated" ? "incomplete" : "completed" }; }
    if (id === "gemini" || id === "vertexai") { return { text, candidates: [{ finishReason: mode === "truncated" ? "MAX_TOKENS" : "STOP" }] }; }
    if (id === "bedrock") { return { output: { message: { content: blocks.map(block => block.type === "text" ? { text: block.text } : { reasoningContent: block }) } }, stopReason: mode === "truncated" ? "max_tokens" : "end_turn" }; }
    return { choices: [{ message: { content: mode === "blocks" ? blocks : text }, finish_reason: mode === "truncated" ? "length" : "stop" }] };
}

suite("Generation repair", () => {
    test("input-limit guidance shows a useful local estimate and Pro handling without unknown placeholders", () => {
        const error = new ProviderApiError("private provider detail", { category: "input-limit" });
        const message = formatSafeProviderError(error, "gemini", { diffSize: 2048, estimatedTokens: 7300, modelLimit: 2816, largeDiffEnabled: false });
        assert.match(message, /GitMind Pro.*Large Diff Processing/);
        assert.match(message, /7,300/);
        assert.match(message, /2,816/);
        assert.strictEqual((message.match(/Technical Details:/g) ?? []).length, 1);
        assert.doesNotMatch(message, /Unknown|private provider detail/);
        assert.doesNotMatch(formatSafeProviderError(error, "gemini", { diffSize: 500000, largeDiffEnabled: false }), /Unknown/);
    });

    test("synchronous cancellation reaches an attempt before transport setup returns", async () => {
        const controller = new AbortController();
        await assert.rejects(() => runRequest({ signal: controller.signal }, () => {
            controller.abort();
            return new Promise<never>(() => {});
        }, 100), (error: any) => error.category === "cancelled");
    });

    test("budget packing reduces requests while every source offset remains covered", async () => {
        const source = "x".repeat(400000);
        const capabilities = { ...modelCapabilities("large"), contextTokens: 1000000 };
        const spans: Array<[number, number]> = [];
        await generateBudgeted(source, "", settings, {
            signal: new AbortController().signal, capabilities: () => capabilities,
            renderFinal: async text => "FINAL " + text,
            send: async render => {
                const prompt = await render(capabilities);
                assertPromptFits(prompt, capabilities);
                if (prompt.startsWith("FINAL")) { return "feat: covered"; }
                const [, first, last] = /offsets (\d+)\.\.(\d+):/.exec(prompt)!;
                spans.push([Number(first), Number(last)]);
                return "one factual summary";
            },
        });
        assert.deepStrictEqual(spans, [[0, source.length]]);
    });

    test("reported output truncation splits work instead of accepting an incomplete summary", async () => {
        const source = "x".repeat(12000);
        const capabilities = { ...modelCapabilities("large"), contextTokens: 100000 };
        const spans: Array<[number, number]> = [];
        await generateBudgeted(source, "", settings, {
            signal: new AbortController().signal, capabilities: () => capabilities,
            renderFinal: async text => "FINAL " + text,
            send: async render => {
                const prompt = await render(capabilities);
                if (prompt.startsWith("FINAL")) { return "feat: covered"; }
                const [, first, last] = /offsets (\d+)\.\.(\d+):/.exec(prompt)!;
                if (Number(last) - Number(first) > 3000) { throw new ProviderApiError("Provider output was truncated.", { category: "invalid-response" }); }
                spans.push([Number(first), Number(last)]);
                return "fact";
            },
        });
        let end = 0;
        for (const [first, last] of spans) { assert.strictEqual(first, end); assert.ok(last - first <= 3000); end = last; }
        assert.strictEqual(end, source.length);
    });
    test("custom framing participates in budgeting and generic text remains compatible", () => {
        const provider = new CustomProvider("https://example.invalid", "/chat", "bearer", "mock", "", JSON.stringify({ system: "x".repeat(4000), prompt: "{{prompt}}" }), "openai", "unknown");
        assert.throws(() => assertPromptFits("small", provider.getCapabilities()), (error: any) => error.category === "input-limit");
        assert.strictEqual((provider as any).extractResponse({ text: "generic answer" }, "openai"), "generic answer");
        const source = 'quoted "file"\nUnicode 🌱 and literal $& {{model}}';
        const body = (provider as any).buildRequestBody('{"prompt":"{{prompt}}","messages":{{messages}}}', source, "model");
        assert.strictEqual(body.prompt, source);
        assert.strictEqual(body.messages[1].content, source);
    });
    test("runtime budgets are isolated by endpoint and account", () => {
        const first = new LMStudioProvider("http://localhost:1234/v1", "isolated-budget");
        (first as any).rememberModelLimits("isolated-budget", 32000, 1024);
        assert.strictEqual(new LMStudioProvider("http://localhost:1234/v1", "isolated-budget").getCapabilities().contextTokens, 32000);
        assert.strictEqual(new LMStudioProvider("http://localhost:5678/v1", "isolated-budget").getCapabilities().contextTokens, 4096);
        (new NvidiaProvider("account-a", "isolated-budget") as any).rememberModelLimits("isolated-budget", 16000, 1024);
        assert.strictEqual(new NvidiaProvider("account-b", "isolated-budget").getCapabilities().contextTokens, 4096);
    });
    test("overlapping transports and validation stay isolated when one operation is cancelled", async () => {
        const originalFetch = globalThis.fetch;
        const pending: Array<{ signal: AbortSignal; resolve: (response: Response) => void }> = [];
        globalThis.fetch = (async (_input, init) => new Promise<Response>((resolve, reject) => {
            const signal = init!.signal!;
            pending.push({ signal, resolve });
            signal.addEventListener("abort", () => reject(signal.reason), { once: true });
        })) as typeof fetch;
        const provider = new NvidiaProvider("mock", "test");
        const first = new AbortController();
        const second = new AbortController();
        try {
            const a = provider.generateWithRawPrompt("a", { signal: first.signal });
            const b = provider.generateWithRawPrompt("b", { signal: second.signal });
            await new Promise(resolve => setTimeout(resolve, 5));
            const validation = provider.validateApiKey();
            await new Promise(resolve => setTimeout(resolve, 5));
            assert.strictEqual(pending.length, 3);
            first.abort();
            await assert.rejects(() => a, (error: any) => error.category === "cancelled");
            assert.strictEqual(pending[1].signal.aborted, false);
            assert.strictEqual(pending[2].signal.aborted, false);
            for (const request of pending.slice(1)) {
                request.resolve(new Response(JSON.stringify({ choices: [{ message: { content: "answer" } }] }), { headers: { "content-type": "application/json" } }));
            }
            assert.strictEqual(await b, "answer");
            assert.strictEqual(await validation, true);
        } finally { globalThis.fetch = originalFetch; }
    });

    test("fallback to a smaller context replans every unfinished span", async () => {
        let capabilities = { ...modelCapabilities("primary"), contextTokens: 10000, outputTokens: 512 };
        const recovery = createRecoveryOperation({ type: "nvidia", apiKey: "mock", model: "primary" }, {
            isProUser: async () => true, notify: () => {},
            getSetting: ((key: string, fallback: unknown) => key === "pro.modelFallback.enabled" ? true : key === "pro.modelFallback.models" ? { nvidia: "fallback" } : fallback) as any,
        });
        const analyzed: Array<[number, number]> = [];
        const result = await generateBudgeted("x".repeat(14000), "", settings, {
            signal: new AbortController().signal,
            capabilities: () => capabilities,
            renderFinal: async text => "FINAL " + text,
            send: (render, signal) => recovery(async config => {
                signal.throwIfAborted();
                if (config.model === "primary") { throw new ProviderApiError("model rate limit", { status: 429 }); }
                capabilities = { ...capabilities, contextTokens: 2048 };
                const prompt = await render(capabilities);
                assertPromptFits(prompt, capabilities);
                if (prompt.startsWith("FINAL")) { return "feat: covered"; }
                const match = /offsets (\d+)\.\.(\d+):/.exec(prompt)!;
                analyzed.push([Number(match[1]), Number(match[2])]);
                return "change";
            }),
        });
        assert.strictEqual(result, "feat: covered");
        analyzed.sort((a, b) => a[0] - b[0]);
        let end = 0;
        for (const part of analyzed) { assert.strictEqual(part[0], end); assert.ok(part[1] - part[0] < 2048); end = part[1]; }
        assert.strictEqual(end, 14000);
    });

    test("ordered reduction is budgeted, preserves coverage, and requires measurable progress", async () => {
        const capabilities = modelCapabilities("unknown");
        let reductions = 0;
        let final = "";
        const analyzedStarts: number[] = [];
        const result = await generateBudgeted("x".repeat(30000), "", settings, {
            signal: new AbortController().signal, capabilities: () => capabilities,
            renderFinal: async text => "FINAL " + "framing ".repeat(150) + text,
            send: async render => {
                const prompt = await render(capabilities);
                assertPromptFits(prompt, capabilities);
                if (prompt.startsWith("FINAL")) { final = prompt; return "feat: reduced"; }
                if (prompt.startsWith("Compress")) {
                    reductions++;
                    return (prompt.match(/change\d+/g) ?? []).join(" ");
                }
                const match = /offsets (\d+)\.\./.exec(prompt)!;
                analyzedStarts.push(Number(match[1]));
                return "change" + match[1] + " " + "detail ".repeat(100);
            },
        });
        assert.strictEqual(result, "feat: reduced");
        assert.ok(reductions > 1);
        assert.ok(analyzedStarts.length > 1);
        assert.ok(final.indexOf("change" + analyzedStarts[0]) < final.indexOf("change" + analyzedStarts[1]));
        for (const start of analyzedStarts) { assert.ok(final.includes("change" + start)); }
        await assert.rejects(() => generateBudgeted("source", "", settings, {
            signal: new AbortController().signal, capabilities: () => capabilities,
            renderFinal: async text => "x".repeat(5000) + text,
            send: async render => {
                const prompt = await render(capabilities);
                assertPromptFits(prompt, capabilities);
                return prompt.startsWith("Compress") ? prompt.split("\n").pop()! : "summary";
            },
        }), (error: any) => error.category === "input-limit" && /no progress/.test(error.message));
    });

    test("SCM insertion fails clearly when the requested repository disappears", async () => {
        const original = vscode.extensions.getExtension;
        const other = { rootUri: { fsPath: "/other" }, inputBox: { value: "unchanged" } };
        (vscode.extensions as any).getExtension = () => ({ exports: { getAPI: () => ({ repositories: [other] }) } });
        try {
            await assert.rejects(() => setCommitMessage({ summary: "feat: draft", description: "" }, "/requested"), /requested repository is unavailable/);
            assert.strictEqual(other.inputBox.value, "unchanged");
        } finally { (vscode.extensions as any).getExtension = original; }
    });

    test("cancellation during planning and reduction stops subsequent scheduling", async () => {
        for (const stage of ["planning", "reduction"]) {
            const controller = new AbortController();
            let calls = 0;
            const cancellation = new ProviderApiError("Request was cancelled", { category: "cancelled" });
            await assert.rejects(() => generateBudgeted("x".repeat(10000), "", settings, {
                signal: controller.signal, capabilities: () => modelCapabilities("unknown"),
                progress: phase => { if (stage === "planning" && phase === "planning") { controller.abort(cancellation); } },
                renderFinal: async text => "FINAL " + "x".repeat(2000) + text,
                send: async render => {
                    controller.signal.throwIfAborted();
                    const prompt = await render(modelCapabilities("unknown"));
                    assertPromptFits(prompt, modelCapabilities("unknown"));
                    calls++;
                    if (prompt.startsWith("Compress")) { controller.abort(cancellation); controller.signal.throwIfAborted(); }
                    return "summary ".repeat(100);
                },
            }), (error: any) => error.category === "cancelled");
            if (stage === "planning") { assert.strictEqual(calls, 0); }
        }
    });

    test("source windows cover Unicode, CRLF, opaque patches, and thousands of file sections exactly", async () => {
        const source = "opaque preamble\r\ndiff --git a/submodule b/submodule\r\nindex abcdef..123456 160000\r\n-Subproject commit abcdef\r\n+Subproject commit 123456-dirty\r\n" + Array.from({ length: 2000 }, (_, i) => `diff --git a/" file ${i}" b/" file ${i}"\r\nold mode 100644\r\nnew mode 100755\r\nrename from old\r\nrename to new\r\nBinary files differ\r\n@@ -1 +1 @@\r\n+🌍你好\r\n`).join("") + "🌍".repeat(10000);
        const parts = [];
        for await (const part of sourceWindows(source, 10)) { parts.push(part); }
        assert.strictEqual(parts.map(part => part.text).join(""), source);
        let end = 0;
        for (const part of parts) {
            assert.strictEqual(part.start, end);
            assert.ok(!/[\uD800-\uDBFF]$/.test(part.text));
            end = part.end;
        }
        assert.strictEqual(end, source.length);
        const [left, right] = splitCovered({ text: "x🌍y", start: 0, end: 4 });
        assert.strictEqual(left.text + right.text, "x🌍y");
    });

    test("analysis continuations retain file and hunk context for oversized hunks", async () => {
        const source = "diff --git a/file b/file\nindex abc..def 100644\n--- a/file\n+++ b/file\n@@ -1 +1 @@\n" + "+line\n".repeat(2000);
        let continuations = 0;
        const capabilities = { ...modelCapabilities("context-test"), contextTokens: 4000 };
        await generateBudgeted(source, "", settings, {
            signal: new AbortController().signal, capabilities: () => capabilities,
            renderFinal: async text => "FINAL " + text,
            send: async render => {
                const prompt = await render(capabilities);
                if (prompt.startsWith("FINAL")) { return "feat: complete"; }
                const offsets = /offsets (\d+)\.\.(\d+):/.exec(prompt)!;
                if (Number(offsets[1]) > 0) {
                    const metadata = prompt.split("File/hunk context (may overlap source):\n")[1].split("\nSource UTF-16")[0];
                    assert.ok(metadata.includes("diff --git a/file b/file"));
                    assert.ok(metadata.includes("@@ -1 +1 @@"));
                    continuations++;
                }
                return "change";
            },
        });
        assert.ok(continuations > 1);
    });

    test("batch limits never cap coverage, and final summaries preserve source order", async () => {
        const source = "x".repeat(400000);
        const spans: Array<[number, number]> = [];
        let final = "";
        const capabilities = { ...modelCapabilities("test"), contextTokens: 30000 };
        await generateBudgeted(source, "", settings, {
            signal: new AbortController().signal,
            capabilities: () => capabilities,
            renderFinal: async text => "FINAL\n" + text,
            send: async render => {
                const prompt = await render(capabilities);
                if (prompt.startsWith("FINAL")) { final = prompt; return "feat: all changes"; }
                const match = /offsets (\d+)\.\.(\d+):/.exec(prompt)!;
                const span: [number, number] = [Number(match[1]), Number(match[2])];
                spans.push(span);
                // Deliberately reverse completion order.
                if (span[0] % 4096 === 0) { await new Promise(resolve => setTimeout(resolve, 1)); }
                return String(span[0]);
            },
        });
        spans.sort((a, b) => a[0] - b[0]);
        assert.ok(spans.length > 5);
        let covered = 0;
        for (const [start, end] of spans) { assert.strictEqual(start, covered); covered = end; }
        assert.strictEqual(covered, source.length);
        assert.ok(final.indexOf("[0..") < final.indexOf("[" + spans[1][0] + ".."));
    });

    test("input-limit rejection splits strictly smaller spans and rejects oversized overhead", async () => {
        const sizes: number[] = [];
        const capabilities = modelCapabilities("unknown");
        await generateBudgeted("z".repeat(8000), "", settings, {
            signal: new AbortController().signal, capabilities: () => capabilities,
            renderFinal: async text => "FINAL " + text,
            send: async render => {
                const prompt = await render(capabilities);
                if (prompt.startsWith("FINAL")) { return "feat: complete"; }
                const content = prompt.split(":\n").pop()!;
                sizes.push(content.length);
                if (content.length > 512) { throw new ProviderApiError("context length", { category: "input-limit" }); }
                return "summary";
            },
        });
        assert.ok(Math.max(...sizes) > 512 && Math.min(...sizes) <= 512 && sizes.length > 3);
        await assert.rejects(() => generateBudgeted("a", "x".repeat(5000), settings, {
            signal: new AbortController().signal, capabilities: () => capabilities,
            renderFinal: async text => text, send: async render => { assertPromptFits(await render(capabilities), capabilities); return ""; },
        }), (error: any) => error.category === "input-limit");
    });

    test("terminal failure aborts siblings and returns no partial draft", async () => {
        let aborted = false;
        await assert.rejects(() => generateBudgeted("x".repeat(20000), "", settings, {
            signal: new AbortController().signal, capabilities: () => modelCapabilities("test"),
            renderFinal: async text => text,
            send: async (render, signal) => {
                const prompt = await render(modelCapabilities("test"));
                if (prompt.includes("offsets 0..")) { await new Promise(resolve => setTimeout(resolve, 5)); throw new ProviderApiError("Denied", { category: "permission" }); }
                return new Promise((_, reject) => signal.addEventListener("abort", () => { aborted = true; reject(signal.reason); }, { once: true }));
            },
        }));
        assert.strictEqual(aborted, true);
    });

    test("overlapping repository operations retain ownership and cancel independently", async () => {
        const first = beginGenerationOperation("repo", randomUUID());
        const second = beginGenerationOperation("repo", randomUUID());
        const unrelated = beginGenerationOperation("another", randomUUID());
        first.dispose();
        assert.strictEqual(isRequestActive("repo"), true);
        cancelCurrentRequest("repo");
        assert.strictEqual(second.context.signal!.aborted, true);
        assert.strictEqual(unrelated.context.signal!.aborted, false);
        second.dispose(); unrelated.dispose();
    });

    test("concurrent failures share one fallback transition and preserve metadata on failure", async () => {
        let notices = 0;
        const recovery = createRecoveryOperation({ type: "openai", apiKey: "mock", model: "primary" }, {
            isProUser: async () => true, notify: () => { notices++; },
            getSetting: ((key: string, fallback: unknown) => key === "pro.modelFallback.enabled" ? true : key === "pro.modelFallback.models" ? { openai: "fallback" } : fallback) as any,
        });
        const results = await Promise.all(Array.from({ length: 3 }, () => recovery(async config => {
            if (config.model === "primary") { await new Promise(resolve => setTimeout(resolve, 2)); throw new ProviderApiError("rate limit", { status: 429 }); }
            return config.model;
        })));
        assert.deepStrictEqual(results, ["fallback", "fallback", "fallback"]);
        assert.strictEqual(notices, 1);
        const sdkError = normalizeProviderError({ name: "ThrottlingException", $metadata: { httpStatusCode: 429 } }, "bedrock");
        assert.strictEqual(sdkError.status, 429);
        assert.strictEqual(sdkError.code, "ThrottlingException");
        assert.strictEqual(sdkError.category, "rate-limit");
        const googleError = normalizeProviderError({ code: 429, error: { status: "RESOURCE_EXHAUSTED", details: [{ retryDelay: "12s" }] } }, "gemini");
        assert.strictEqual(googleError.code, "RESOURCE_EXHAUSTED");
        assert.strictEqual(googleError.retryAfterMs, 12000);
    });

    test("settings migrate explicit legacy values and validate numeric boundaries", () => {
        assert.deepStrictEqual(resolveLargeDiffSettings(undefined), { enabled: false, chunkSize: 1000, batchSize: 5, concurrency: 3 });
        assert.strictEqual(resolveLargeDiffSettings({ maxChunks: 9 }).batchSize, 9);
        assert.strictEqual(resolveLargeDiffSettings({ batchSize: 7, maxChunks: 9 }).batchSize, 7);
        for (const bad of [NaN, Infinity, -1, 0, 1.5, "3", null]) {
            assert.strictEqual(resolveLargeDiffSettings({ batchSize: bad, concurrency: bad, chunkSize: bad }).batchSize, 5);
        }
        assert.strictEqual(answerText(textBlocks), answer);
        assert.throws(() => answerText([{ type: "thinking", text: "reasoning" }]), ProviderApiError);
    });

    test("spool collects over 10 MiB, preserves spaced filenames, and rejects partial Git failures", async () => {
        const directory = await mkdtemp(join(tmpdir(), "gitmind-collection-test-"));
        const spool = await createDiffSpool();
        try {
            const filename = " spaced 🌍 file ";
            const content = "line\n".repeat(2200000);
            await writeFile(join(directory, filename), content);
            await spool.append(["diff", "--no-index", "--", "/dev/null", filename], directory, undefined, true);
            assert.ok(spool.size > 10 * 1024 * 1024);
            let size = 0;
            for await (const block of spool) { size += Buffer.byteLength(block); }
            assert.strictEqual(size, spool.size);
            const previous = spool.size;
            await assert.rejects(() => spool.append(["diff", "--no-index", "--", "/dev/null", "missing"], directory, undefined, true));
            assert.strictEqual(spool.size, previous);
            const controller = new AbortController(); controller.abort(new ProviderApiError("cancelled", { category: "cancelled" }));
            await assert.rejects(() => spool.append(["diff"], directory, controller.signal));
            const active = new AbortController();
            const collection = spool.append(["diff", "--no-index", "--", "/dev/null", filename], directory, active.signal, true);
            const timer = setTimeout(() => active.abort(new ProviderApiError("cancelled", { category: "cancelled" })), 1);
            try { await assert.rejects(() => collection, (error: any) => error.category === "cancelled"); }
            finally { clearTimeout(timer); }
        } finally { await spool.dispose(); await rm(directory, { recursive: true, force: true }); }
    });

    test("support stages and counters are allowlisted; private fields are rejected", () => {
        const service = new SupportSessionService();
        service.start({ extensionVersion: "6.3.0", vscodeVersion: "1.101.0", platform: "darwin", architecture: "arm64" });
        service.record({ name: "operation_progress", operation: "generate_commit", stage: "planning", completed: 10 });
        service.record({ name: "operation_progress", operation: "generate_commit", stage: "/private/path" } as any);
        service.record({ name: "operation_progress", operation: "generate_commit", completed: 1000001 });
        service.record({ name: "operation_progress", operation: "generate_commit", prompt: "private" } as any);
        const report = service.buildReport();
        assert.ok(JSON.stringify(report).includes('"stage":"planning"'));
        assert.ok(!JSON.stringify(report).includes("/private/path"));
        assert.ok(!JSON.stringify(report).includes('"prompt"'));
    });

    for (const id of PROVIDER_IDS) {
        if (sdkProviders.includes(id) && !(globalThis as any).__generationSdkMock) { continue; }
        test(`catalog conformance: ${id} success, blocks, malformed, errors, limits, cancellation, timeout`, async () => {
            const originalFetch = globalThis.fetch;
            const sdk = (globalThis as any).__generationSdkMock;
            const config: any = {
                type: id, model: PROVIDER_CATALOG[id].defaultModel || "mock-model", apiKey: "mock",
                url: "http://localhost:1234/v1", endpoint: id === "azureopenai" ? "https://mock.openai.azure.com" : "/chat/completions", authMode: "apiKey", baseUrl: "https://mock.invalid",
                authType: "bearer", authToken: "mock", requestFormat: "openai", responseFormat: "openai",
                project: "mock", projectId: "mock", location: "global", region: "us-east-1", accountId: "mock",
            };
            let mode = "success";
            let failure: { status: number; code: string; message: string } | undefined;
            let observedSignal: AbortSignal | undefined;
            const transport = async (_input: unknown, init?: RequestInit) => {
                observedSignal = init?.signal ?? undefined;
                if (mode === "wait") {
                    return new Promise<never>((_, reject) => {
                        if (observedSignal?.aborted) { reject(observedSignal.reason); }
                        observedSignal?.addEventListener("abort", () => reject(observedSignal?.reason), { once: true });
                    });
                }
                if (mode === "http") { return new Response(JSON.stringify({ error: { message: "authentication failed", code: "invalid_key" } }), { status: 401, headers: { "content-type": "application/json", "retry-after": "2" } }); }
                if (mode === "classified" && failure) { return new Response(JSON.stringify({ error: { message: failure.message, code: failure.code } }), { status: failure.status, headers: { "content-type": "application/json", "retry-after": "2" } }); }
                return new Response(JSON.stringify(mode === "malformed" ? {} : payload(id, mode)), { status: 200, headers: { "content-type": "application/json" } });
            };
            globalThis.fetch = transport as typeof fetch;
            if (sdk) { sdk.transport = transport; sdk.provider = id; }
            try {
                const provider = await getProviderInstance(config);
                assert.strictEqual(await provider.generateWithRawPrompt("Analyze changes."), answer);
                mode = "blocks";
                assert.strictEqual(await provider.generateWithRawPrompt("Analyze changes."), answer);
                for (const invalid of ["empty", "malformed", ...(id === "copilot" ? [] : ["truncated"])]) {
                    mode = invalid;
                    await assert.rejects(() => provider.generateWithRawPrompt("Analyze changes."), (error: any) => classifyGenerationFailure(error, id) === "invalid-response");
                }
                mode = "http";
                await assert.rejects(() => provider.generateWithRawPrompt("Analyze changes."), (error: any) => error.status === 401 && classifyGenerationFailure(error, id) === "authentication");
                for (const entry of [
                    { status: 413, code: "input_token_limit", message: "context length exceeded", category: "input-limit" },
                    { status: 402, code: "insufficient_quota", message: "billing quota", category: "account-limit" },
                    { status: 403, code: "access_denied", message: "permission denied", category: "permission" },
                    { status: 400, code: "blocked", message: "content filter blocked request", category: "content-filter" },
                ]) {
                    mode = "classified"; failure = entry;
                    await assert.rejects(() => provider.generateWithRawPrompt("Analyze changes."), (error: any) => error.status === entry.status && error.code === entry.code && error.category === entry.category && Boolean(error.cause));
                }
                await assert.rejects(() => provider.generateWithRawPrompt("x".repeat(provider.getCapabilities().contextTokens + 1)), (error: any) => error.category === "input-limit");
                mode = "wait";
                const controller = new AbortController();
                const request = provider.generateWithRawPrompt("Analyze changes.", { signal: controller.signal });
                await new Promise(resolve => setTimeout(resolve, 10));
                controller.abort();
                await assert.rejects(() => request, (error: any) => error.category === "cancelled");
                assert.strictEqual(observedSignal?.aborted, true);
                await assert.rejects(() => runRequest(undefined, () => (provider as any).generateResponse("Analyze changes.", { maxTokens: 1024 }), 10), (error: any) => error.category === "timeout");
                assert.strictEqual(observedSignal?.aborted, true);
                assert.strictEqual(requestScope.getStore(), undefined);
            } finally { globalThis.fetch = originalFetch; }
        });
    }
});
