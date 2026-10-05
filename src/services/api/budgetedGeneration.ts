import { CoverageStore } from "./coverageStore";
import { LargeDiffSettings } from "../../config/largeDiffSettings";
import { ModelCapabilities, assertPromptFitsAsync, countPromptTokens, effectiveInputBudget } from "./capabilities";
import { ProviderApiError, classifyGenerationFailure } from "./recovery";

export interface CoveredText { text: string; start: number; end: number; }
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
    send: (render: (capabilities: ModelCapabilities) => Promise<string>, signal: AbortSignal) => Promise<string>;
    signal: AbortSignal;
    progress?: (stage: "planning" | "requests" | "reduction", completed: number) => void;
}

export function isOutputTruncation(error: unknown): boolean {
    return error instanceof ProviderApiError && error.category === "invalid-response" && /\btruncated\b/i.test(error.message);
}

export async function generateBudgeted(input: DiffInput, customContext: string, settings: LargeDiffSettings, deps: BudgetedDependencies): Promise<string> {
    let store = await CoverageStore.create();
    let covered = 0;
    try {
    let completed = 0;
    let expectedEnd = 0;
    let context = "";
    let pendingLine = "";

    const analysisPrompt = (part: CoveredText, metadata: string) =>
        "Analyze this source span factually. Lead with behavior, interfaces, data, security and other impactful changes. Preserve distinct change intent and relevant filenames; group repeated mechanical changes compactly. Do not invent changes. Return a compact factual summary, not a commit message.\n" +
        customContext + "\nFile/hunk context (may overlap source):\n" + metadata +
        "\nSource UTF-16 offsets " + part.start + ".." + part.end + ":\n" + part.text;
    const analyze = async (part: CoveredText, metadata: string, signal: AbortSignal): Promise<CoveredText[]> => {
        signal.throwIfAborted();
        try {
            const text = await deps.send(async capabilities => {
                const prompt = analysisPrompt(part, metadata);
                await assertPromptFitsAsync(prompt, capabilities);
                return prompt;
            }, signal);
            deps.progress?.("requests", ++completed);
            return [{ ...part, text }];
        } catch (error) {
            if (classifyGenerationFailure(error, "") !== "input-limit" && !isOutputTruncation(error)) { throw error; }
            try { await assertPromptFitsAsync(analysisPrompt({ ...part, text: "" }, metadata), deps.capabilities()); }
            catch { throw new ProviderApiError("Prompt overhead cannot fit the model budget. Shorten custom context or choose a larger-context model.", { category: "input-limit" }); }
            const [left, right] = splitCovered(part);
            const rightContext = continuationContext(left.text, metadata);
            return [...await analyze(left, metadata, signal), ...await analyze(right, rightContext, signal)];
        }
    };
    let batch: Array<{ part: CoveredText; metadata: string }> = [];
    let pending: { part: CoveredText; metadata: string; bytes: number } | undefined;
    let planned = 0;
    const flush = async () => {
        const controller = new AbortController();
        const signal = AbortSignal.any([controller.signal, deps.signal]);
        const results: CoveredText[][] = new Array(batch.length);
        let next = 0;
        let failure: unknown;
        const worker = async () => {
            while (!signal.aborted && next < batch.length) {
                const index = next++;
                try { results[index] = await analyze(batch[index].part, batch[index].metadata, signal); }
                catch (error) { failure ??= error; controller.abort(error); }
            }
        };
        await Promise.allSettled(Array.from({ length: Math.min(settings.concurrency, batch.length) }, worker));
        if (failure) { throw failure; }
        deps.signal.throwIfAborted();
        for (const result of results.flat()) {
            if (result.start !== covered || result.end <= result.start) { throw new ProviderApiError("Diff coverage is incomplete.", { category: "invalid-response" }); }
            covered = result.end;
            await store.append(result);
        }
        batch = [];
    };
    const queuePending = async () => {
        if (!pending) { return; }
        batch.push({ part: pending.part, metadata: pending.metadata });
        pending = undefined;
        deps.progress?.("planning", ++planned);
        if (batch.length >= settings.batchSize) { await flush(); }
    };
    const initialCapabilities = deps.capabilities();
    const emptyPromptCost = initialCapabilities.countTokens(analysisPrompt({ text: "", start: 0, end: 0 }, ""));
    const windowUnits = Math.max(256, Math.min(8192, (initialCapabilities.countTokensAsync ? effectiveInputBudget(initialCapabilities) * 4 : effectiveInputBudget(initialCapabilities)) - emptyPromptCost - 64));
    for await (const part of sourceWindows(input, settings.chunkSize, windowUnits)) {
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
            const available = Math.min(512 * 1024, effectiveInputBudget(capabilities) - framing - 64);
            const candidate = pending.part.text + part.text;
            if (pending.bytes + bytes > 512 * 1024 || (capabilities.countTokensAsync
                ? await countPromptTokens(analysisPrompt({ ...pending.part, text: candidate, end: part.end }, pending.metadata), capabilities) > effectiveInputBudget(capabilities) - 64
                : pending.bytes + bytes > available)) { await queuePending(); }
        }
        if (pending) {
            pending.part.text += part.text;
            pending.part.end = part.end;
            pending.bytes += bytes;
        } else { pending = { part: { ...part }, metadata, bytes }; }
    }
    await queuePending();
    if (batch.length) { await flush(); }
    if (!covered || covered !== expectedEnd) { throw new ProviderApiError("Diff coverage is incomplete.", { category: "invalid-response" }); }

    for (let round = 0; round < 32; round++) {
        deps.signal.throwIfAborted();
        const capabilities = deps.capabilities();
        if (store.textSize < (capabilities.countTokensAsync ? effectiveInputBudget(capabilities) * 4 : capabilities.contextTokens)) {
            const parts: string[] = [];
            for await (const part of store.read()) { parts.push("[" + part.start + ".." + part.end + "] " + part.text); }
            const joined = parts.join("\n");
            try {
                return await deps.send(async current => {
                    const prompt = await deps.renderFinal(joined, current);
                    await assertPromptFitsAsync(prompt, current);
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
                        const prompt = "Compress these ordered factual change summaries. Keep behavior, interfaces, data, security and distinct change intent. Group repeated mechanical changes and use fewer words. Do not invent changes.\n" + customContext + "\n" + text;
                        await assertPromptFitsAsync(prompt, capabilities);
                        return prompt;
                    }, deps.signal);
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
        const limit = effectiveInputBudget(deps.capabilities());
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
