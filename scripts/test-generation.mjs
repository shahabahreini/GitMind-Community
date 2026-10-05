import { build } from "esbuild";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const tests = [];
let hooks = { before: [], after: [] };
globalThis.suite = (_name, define) => {
    const parent = hooks;
    hooks = { before: [...parent.before], after: [...parent.after] };
    define();
    hooks = parent;
};
globalThis.setup = fn => hooks.before.push(fn);
globalThis.teardown = fn => hooks.after.push(fn);
globalThis.test = (name, fn) => tests.push({ name, fn, hooks: { before: [...hooks.before], after: [...hooks.after] } });
globalThis.__generationSdkMock = {};
const sdkTransport = `
async function invoke(signal) {
    const mock = globalThis.__generationSdkMock;
    const response = await mock.transport("", { signal });
    if (!response.ok) {
        const body = await response.json();
        const error = new Error(body.error?.message);
        error.status = response.status; error.code = body.error?.code;
        error.$metadata = { httpStatusCode: response.status };
        throw error;
    }
    return response.json();
}
`;
const vscodeStub = `
export const workspace = { workspaceFolders: [], getConfiguration: () => ({
    get: (key, fallback) => globalThis.__generationSettings?.[key] ?? fallback,
    inspect: () => ({}), update: async () => {},
}), onDidChangeConfiguration: () => ({ dispose() {} }) };
export const window = {
    withProgress: async (_options, work) => work({ report() {} }, { isCancellationRequested: false, onCancellationRequested: () => ({ dispose() {} }) }),
    showInformationMessage: async () => undefined, showErrorMessage: async () => undefined,
    showWarningMessage: async (message, _options, choice) => {
        globalThis.__generationApprovalLog?.push(message);
        const approval = globalThis.__generationApproval;
        return (typeof approval === 'function' ? approval(message) : approval) ? choice : undefined;
    },
    createOutputChannel: () => ({ appendLine() {}, dispose() {} }),
};
export const ExtensionMode = { Development: 2 };
export const ConfigurationTarget = { Global: 1 };
export const ProgressLocation = { Notification: 15 };
export const env = { appName: "Visual Studio Code", openExternal: async () => true };
export const extensions = { getExtension: () => ({}) };
export const commands = { executeCommand: async () => undefined };
export const Uri = { parse: value => value, file: value => ({ fsPath: value }) };
export class CancellationTokenSource {
    constructor() {
        this.controller = new AbortController();
        this.token = { get isCancellationRequested() { return this.signal.aborted; }, signal: this.controller.signal };
    }
    cancel() { this.controller.abort(); }
    dispose() {}
}
export class LanguageModelError extends Error {
    static NoPermissions() { return Object.assign(new this("permission"), { code: "NoPermissions" }); }
    static Blocked() { return Object.assign(new this("blocked"), { code: "Blocked" }); }
    static NotFound() { return Object.assign(new this("not found"), { code: "NotFound" }); }
}
export const LanguageModelChatMessage = { User: content => ({ role: 1, content }) };
${sdkTransport}
export const lm = { selectChatModels: async () => [{
    id: "mock-copilot", name: "Mock", vendor: "copilot", family: "gpt", maxInputTokens: 2816,
    countTokens: async message => Math.ceil(message.content.length / 4),
    sendRequest: async (messages, _options, token) => {
        globalThis.__generationCopilotPrompts?.push(messages[0].content);
        const body = await invoke(token.signal);
        if (!body.choices) { throw new Error("Invalid response"); }
        const content = body.choices[0].message.content;
        return { text: (async function* () {
            if (Array.isArray(content)) { for (const part of content) { if (part.type === "text") { yield part.text; } } }
            else { yield content; }
        })() };
    },
}] };
`;

const directory = await mkdtemp(join(tmpdir(), "gitmind-conformance-"));
try {
    const result = await build({
        entryPoints: ["src/test/suites/generationRepair.test.ts", "src/test/suites/nvidiaAndRecovery.test.ts", "src/test/suites/diffProcessor.test.ts", "src/test/suites/supportSession.test.ts"],
        outdir: directory, bundle: true, platform: "node", format: "cjs", write: false,
        plugins: [{
            name: "deterministic-transports",
            setup(builder) {
                builder.onResolve({ filter: /^vscode$/ }, () => ({ path: "vscode", namespace: "mock" }));
                builder.onResolve({ filter: /^@google\/genai$/ }, () => ({ path: "google", namespace: "mock" }));
                builder.onResolve({ filter: /^@aws-sdk\/client-bedrock-runtime$/ }, () => ({ path: "aws", namespace: "mock" }));
                builder.onResolve({ filter: /^@aws-sdk\/credential-providers$/ }, () => ({ path: "credentials", namespace: "mock" }));
                builder.onResolve({ filter: /\/subscription\/SubscriptionManager$/ }, () => ({ path: "subscription", namespace: "mock" }));
                builder.onLoad({ filter: /.*/, namespace: "mock" }, args => ({
                    contents: args.path === "vscode" ? vscodeStub
                        : args.path === "google" ? sdkTransport + "export class GoogleGenAI { models = { generateContent: async request => invoke(request.config.abortSignal) }; }"
                            : args.path === "aws" ? sdkTransport + "export class ConverseCommand { constructor(input) { this.input = input; } } export class BedrockRuntimeClient { config = { credentials: async () => ({}) }; async send(_command, options) { return invoke(options.abortSignal); } }"
                                : args.path === "credentials" ? "export const fromIni = () => async () => ({});"
                                    : "export class SubscriptionManager { static getInstance() { return { isProUser: async () => globalThis.__generationProUser === true }; } }",
                }));
            },
        }],
        logLevel: "error",
    });
    for (const output of result.outputFiles) {
        await writeFile(output.path.replace(/\.js$/, ".cjs"), output.contents);
        await import(pathToFileURL(output.path.replace(/\.js$/, ".cjs")).href);
    }
    let failed = 0;
    for (const item of tests) {
        try {
            for (const hook of item.hooks.before) { await hook(); }
            await item.fn();
            console.log("PASS " + item.name);
        } catch (error) {
            failed++;
            console.error("FAIL " + item.name + "\n" + (error.stack ?? error));
        } finally {
            for (const hook of item.hooks.after) { await hook(); }
        }
    }
    console.log(`Deterministic generation verification: ${tests.length - failed}/${tests.length} passed; SDK/HTTP transports mocked.`);
    if (failed) { process.exitCode = 1; }
} finally {
    await rm(directory, { recursive: true, force: true });
}
