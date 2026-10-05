import { CoverageStore } from "./coverageStore";
import { LargeDiffSettings } from "../../config/largeDiffSettings";
import { ModelCapabilities, assertBatchPromptFits, batchInputBudget, countPromptTokens } from "./capabilities";
import { ProviderApiError, classifyGenerationFailure } from "./recovery";

export interface CoveredText { text: string; start: number; end: number; metadata?: string; }
export type DiffInput = string | AsyncIterable<string>;

/** Lossless, bounded source windows, including opaque patches and very long lines. */
export async function* sourceWindows(input: DiffInput, preferredLines: number, maxUnits = 2048): AsyncGenerator<CoveredText> {
    const stream = typeof input === "string" ? (async function* () { yield input; })() : input;
    let buffer = "";
    let offset = 0;
    const drain = function* (final: boolean): Generator<CoveredText> {
        while (buffer.length >= maxUnits || (final && buffer.length)) {
            let end = Math.min(maxUnits, buffer.length);
            // Never separate a surrogate pair.
            if (end < buffer.length && /[\uD800-\uDBFF]/.test(buffer[end - 1])) { end--; }
            let lines = 0;
            for (let i = 0; i < end; i++) {
                if (buffer[i] === "\n" && ++lines >= preferredLines) { end = i + 1; break; }
            }
            yield { text: buffer.slice(0, end), start: offset, end: offset + end };
            buffer = buffer.slice(end);
            offset += end;
        }
    };
    for await (const block of stream) {
        // Even a string caller is consumed in bounded pieces.
        for (let i = 0; i < block.length; i += maxUnits) {
            buffer += block.slice(i, i + maxUnits);
            yield* drain(false);
        }
    }
    yield* drain(true);
}

export function splitCovered(part: CoveredText): [CoveredText, CoveredText] {
    let midpoint = Math.floor(part.text.length / 2);
    if (midpoint && /[\uD800-\uDBFF]/.test(part.text[midpoint - 1])) { midpoint--; }
    if (!midpoint) { throw new ProviderApiError("Prompt overhead cannot fit the model budget. Shorten custom context or choose a larger-context model.", { category: "input-limit" }); }
    return [
        { text: part.text.slice(0, midpoint), start: part.start, end: part.start + midpoint },
        { text: part.text.slice(midpoint), start: part.start + midpoint, end: part.end },
    ];
}

export interface BudgetedDependencies {
    capabilities: () => ModelCapabilities;
    renderFinal: (text: string, capabilities: ModelCapabilities) => Promise<string>;
    send: (render: (capabilities: ModelCapabilities) => Promise<string>, signal: AbortSignal, summaryOutputTokens?: number) => Promise<string>;
    signal: AbortSignal;
    progress?: (stage: "planning" | "requests" | "reduction", completed: number) => void;
    approve?: (estimatedTotal: number) => Promise<void>;
}

export function isOutputTruncation(error: unknown): boolean {
    return error instanceof ProviderApiError && error.category === "invalid-response" && /\btruncated\b/i.test(error.message);
}

export async function generateBudgeted(input: DiffInput, customContext: string, _settings: LargeDiffSettings, deps: BudgetedDependencies): Promise<string> {
    let store = await CoverageStore.create();
    let covered = 0;
    try {
    let completed = 0;
    let expectedEnd = 0;
    let context = "";
    let pendingLine = "";

    const analysisPrompt = (part: CoveredText, metadata: string) =>
        "Analyze this source span factually in at most 120 words. Lead with behavior, interfaces, data, security and other impactful changes. Preserve distinct change intent and relevant filenames; group repeated mechanical changes compactly. Do not invent changes. Return a compact factual summary, not a commit message.\n" +
        customContext + "\nFile/hunk context (may overlap source):\n" + metadata +
        "\nSource UTF-16 offsets " + part.start + ".." + part.end + ":\n" + part.text;
    const fitToCurrentBudget = async function* (part: CoveredText, metadata: string): AsyncGenerator<{ part: CoveredText; metadata: string }> {
        deps.signal.throwIfAborted();
        if (await countPromptTokens(analysisPrompt(part, metadata), deps.capabilities()) <= batchInputBudget(deps.capabilities())) {
            yield { part, metadata };
            return;
        }
        try { await assertBatchPromptFits(analysisPrompt({ ...part, text: "" }, metadata), deps.capabilities()); }
        catch { throw new ProviderApiError("Prompt overhead cannot fit the model budget. Shorten custom context or choose a larger-context model.", { category: "input-limit" }); }
        const [left, right] = splitCovered(part);
        yield* fitToCurrentBudget(left, metadata);
        yield* fitToCurrentBudget(right, continuationContext(left.text, metadata));
    };
    const analyze = async (part: CoveredText, metadata: string, signal: AbortSignal): Promise<CoveredText[]> => {
        signal.throwIfAborted();
        try {
            const text = await deps.send(async capabilities => {
                const prompt = analysisPrompt(part, metadata);
                await assertBatchPromptFits(prompt, capabilities);
                return prompt;
            }, signal, 768);
            deps.progress?.("requests", ++completed);
            return [{ ...part, text }];
        } catch (error) {
            if (classifyGenerationFailure(error, "") !== "input-limit" && !isOutputTruncation(error)) { throw error; }
            try { await assertBatchPromptFits(analysisPrompt({ ...part, text: "" }, metadata), deps.capabilities()); }
            catch { throw new ProviderApiError("Prompt overhead cannot fit the model budget. Shorten custom context or choose a larger-context model.", { category: "input-limit" }); }
            const [left, right] = splitCovered(part);
            const rightContext = continuationContext(left.text, metadata);
            return [...await analyze(left, metadata, signal), ...await analyze(right, rightContext, signal)];
        }
    };
    const plan = await CoverageStore.create();
    let pending: { part: CoveredText; metadata: string; bytes: number } | undefined;
    let planned = 0;
    const queuePending = async () => {
        if (!pending) { return; }
        await plan.append({ ...pending.part, metadata: pending.metadata });
        pending = undefined;
        planned++;
        deps.progress?.("planning", planned);
    };
    const initialCapabilities = deps.capabilities();
    const emptyPromptCost = initialCapabilities.countTokens(analysisPrompt({ text: "", start: 0, end: 0 }, ""));
    const windowUnits = Math.max(2, Math.min(512 * 1024, (initialCapabilities.countTokensAsync ? batchInputBudget(initialCapabilities) * 4 : batchInputBudget(initialCapabilities)) - emptyPromptCost - 64));
    try {
    for await (const part of sourceWindows(input, Number.MAX_SAFE_INTEGER, windowUnits)) {
        deps.signal.throwIfAborted();
        const metadata = context;
        // Capture complete diff metadata and latest hunk across window boundaries.
        const lines = (pendingLine + part.text).split("\n");
        const tail = lines.pop() ?? "";
        pendingLine = tail.slice(0, 8192);
        for (const line of lines) {
            if (line.startsWith("diff --git ")) { context = line; }
            else if (/^(index |--- |\+\+\+ |(?:new|deleted) file mode |(?:old|new) mode |rename |similarity )/.test(line)) { context += "\n" + line; }
            else if (line.startsWith("@@")) { context = context.replace(/\n@@.*$/, "") + "\n" + line; }
        }
        // Metadata itself is bounded; source always remains fully covered.
        if (context.length > 1024) { context = context.slice(0, 8192); }
        expectedEnd = part.end;
        const bytes = Buffer.byteLength(part.text, "utf8");
        if (pending) {
            const capabilities = deps.capabilities();
            const framing = capabilities.countTokens(analysisPrompt({ text: "", start: pending.part.start, end: part.end }, pending.metadata));
            // Bounded memory while using most of the effective input budget.
            const available = Math.min(512 * 1024, batchInputBudget(capabilities) - framing - 64);
            if (pending.bytes + bytes > 512 * 1024) { await queuePending(); }
            else {
                const candidate = pending.part.text + part.text;
                if (capabilities.countTokensAsync
                    ? await countPromptTokens(analysisPrompt({ ...pending.part, text: candidate, end: part.end }, pending.metadata), capabilities) > batchInputBudget(capabilities) - 64
                    : pending.bytes + bytes > available) { await queuePending(); }
            }
        }
        if (pending) {
            pending.part.text += part.text;
            pending.part.end = part.end;
            pending.bytes += bytes;
        } else { pending = { part: { ...part }, metadata, bytes }; }
    }
    await queuePending();
    if (!planned) { throw new ProviderApiError("Diff coverage is incomplete.", { category: "invalid-response" }); }
    // Each analysis asks for at most 120 words. Include likely reduction rounds
    // and the final generation in the count shown before any provider call.
    const summariesPerCall = Math.max(2, Math.floor((batchInputBudget(deps.capabilities()) - 320) / 768));
    let remaining = planned;
    let reductions = 0;
    while (remaining > summariesPerCall && reductions < 1000000) {
        remaining = Math.ceil(remaining / summariesPerCall);
        reductions += remaining;
    }
    await deps.approve?.(planned + reductions + 1);
    for await (const entry of plan.read()) {
        deps.signal.throwIfAborted();
        const part = entry as CoveredText & { metadata?: string };
        for await (const fitting of fitToCurrentBudget(part, part.metadata ?? "")) {
            for (const result of await analyze(fitting.part, fitting.metadata, deps.signal)) {
                if (result.start !== covered || result.end <= result.start) { throw new ProviderApiError("Diff coverage is incomplete.", { category: "invalid-response" }); }
                covered = result.end;
                await store.append(result);
            }
        }
    }
    if (!covered || covered !== expectedEnd) { throw new ProviderApiError("Diff coverage is incomplete.", { category: "invalid-response" }); }

    for (let round = 0; round < 32; round++) {
        deps.signal.throwIfAborted();
        const capabilities = deps.capabilities();
        if (store.textSize < (capabilities.countTokensAsync ? batchInputBudget(capabilities) * 4 : Math.max(capabilities.contextTokens, batchInputBudget(capabilities)))) {
            const parts: string[] = [];
            for await (const part of store.read()) { parts.push("[" + part.start + ".." + part.end + "] " + part.text); }
            const joined = parts.join("\n");
            try {
                return await deps.send(async current => {
                    const prompt = await deps.renderFinal(joined, current);
                    await assertBatchPromptFits(prompt, current);
                    return prompt;
                }, deps.signal);
            } catch (error) {
                if (classifyGenerationFailure(error, "") !== "input-limit") { throw error; }
            }
        }
        const previousSize = store.textSize;
        const reduced = await CoverageStore.create();
        try {
        let group: CoveredText[] = [];
        const reduceGroup = async () => {
            if (!group.length) { return; }
            const start = group[0].start;
            const end = group[group.length - 1].end;
            const text = group.map(part => part.text).join("\n");
            const compress = async (text: string): Promise<string> => {
                try {
                    return await deps.send(async capabilities => {
                        const prompt = "Compress these ordered factual change summaries to at most 120 words. Keep behavior, interfaces, data, security and distinct change intent. Group repeated mechanical changes and use fewer words. Do not invent changes.\n" + customContext + "\n" + text;
                        await assertBatchPromptFits(prompt, capabilities);
                        return prompt;
                    }, deps.signal, 768);
                } catch (error) {
                    if (classifyGenerationFailure(error, "") !== "input-limit" && !isOutputTruncation(error)) { throw error; }
                    const [left, right] = splitCovered({ text, start: 0, end: text.length });
                    return await compress(left.text) + "\n" + await compress(right.text);
                }
            };
            const result = await compress(text);
            await reduced.append({ text: result, start, end });
            group = [];
        };
        const limit = batchInputBudget(deps.capabilities());
        for await (const part of store.read()) {
            const prospective = [...group, part].map(value => value.text).join("\n");
            if (await countPromptTokens(customContext + prospective, deps.capabilities()) + 160 > limit) { await reduceGroup(); }
            group.push(part);
        }
        await reduceGroup();
        if (reduced.textSize >= previousSize) { throw new ProviderApiError("Summary reduction made no progress. Choose a larger-context model or shorten custom context.", { category: "input-limit" }); }
        } catch (error) { await reduced.dispose(); throw error; }
        await store.dispose();
        store = reduced;
        deps.progress?.("reduction", round + 1);
    }
    throw new ProviderApiError("Summary reduction exceeded its bounded rounds.", { category: "input-limit" });
    } finally { await plan.dispose(); }
    } finally { await store.dispose(); }
}

function continuationContext(text: string, initial: string): string {
    let context = initial;
    for (const line of text.split("\n").slice(0, -1)) {
        if (line.startsWith("diff --git ")) { context = line; }
        else if (/^(index |--- |\+\+\+ |(?:new|deleted) file mode |(?:old|new) mode |rename |similarity )/.test(line)) { context += "\n" + line; }
        else if (line.startsWith("@@")) { context = context.replace(/\n@@.*$/, "") + "\n" + line; }
    }
    return context;
}
