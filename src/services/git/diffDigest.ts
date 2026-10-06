import { isGeneratedLockfile } from "./structuredData";

/** Longest line text kept in memory; longer lines keep a prefix and a size marker. */
export const MAX_LINE_CHARS = 2000;
/** Per-file body ceiling when a file is capped. */
export const FILE_CAP_BYTES = 24 * 1024;
const TOKEN_BYTES = 3;
const TOKEN_MARGIN = 1.1;

/** Conservative token estimate for code: bytes / 3 with a 10% margin for emoji and CJK. */
export function estimateByteTokens(bytes: number): number {
    return Math.ceil(bytes / TOKEN_BYTES * TOKEN_MARGIN);
}
export function tokensToBytes(tokens: number): number {
    return Math.max(0, Math.floor(tokens / TOKEN_MARGIN * TOKEN_BYTES));
}

export interface DiffLine { text: string; chars: number; bytes: number; start: number; }

/** Bounded-memory line scanner. `start` and `chars` are UTF-16 offsets; `chars` includes the newline. */
export async function* diffLines(input: AsyncIterable<string>): AsyncGenerator<DiffLine> {
    let text = "";
    let chars = 0;
    let bytes = 0;
    let offset = 0;
    const finish = (): DiffLine => {
        let kept = text.endsWith("\n") ? text.slice(0, -1) : text;
        if (kept.length >= MAX_LINE_CHARS && /[\uD800-\uDBFF]/.test(kept[kept.length - 1])) { kept = kept.slice(0, -1); }
        const line = { text: kept, chars, bytes, start: offset };
        offset += chars;
        text = ""; chars = 0; bytes = 0;
        return line;
    };
    for await (const block of input) {
        let i = 0;
        while (i < block.length) {
            const newline = block.indexOf("\n", i);
            const end = newline < 0 ? block.length : newline + 1;
            const piece = block.slice(i, end);
            if (text.length < MAX_LINE_CHARS) { text += piece.slice(0, MAX_LINE_CHARS - text.length); }
            else if (newline >= 0) { text += "\n"; }
            chars += piece.length;
            bytes += Buffer.byteLength(piece, "utf8");
            i = end;
            if (newline >= 0) { yield finish(); }
        }
    }
    if (chars) { yield finish(); }
}

export type DiffFileStatus = "added" | "deleted" | "modified" | "renamed" | "note";
export interface DiffFile {
    path: string;
    oldPath?: string;
    status: DiffFileStatus;
    added: number;
    deleted: number;
    hunks: number;
    lines: number;
    binary: boolean;
    /** Rename or mode change without content hunks. */
    nameOnly: boolean;
    start: number;
    end: number;
    bytes: number;
    /** Verbatim text of a `Changed file ...` note, which is already condensed. */
    note?: string;
}
export interface DiffIndex { files: DiffFile[]; bytes: number; chars: number; }

function headerPaths(line: string): { oldPath: string; path: string } {
    const rest = line.slice("diff --git ".length);
    const strip = (value: string) => value.replace(/^"/, "").replace(/"$/, "");
    const length = (rest.length - 5) / 2;
    if (rest.startsWith("a/") && Number.isInteger(length) && rest.slice(2, 2 + length) === rest.slice(length + 5)) {
        const path = rest.slice(2, 2 + length);
        return { oldPath: path, path };
    }
    const match = /^"?a\/(.+?)"? "?b\/(.+?)"?$/.exec(rest);
    return match ? { oldPath: strip(match[1]), path: strip(match[2]) } : { oldPath: strip(rest), path: strip(rest) };
}

function notePath(line: string): string {
    const strings = [...line.matchAll(/"(?:[^"\\]|\\.)*"/g)].map(match => match[0]);
    const last = strings[strings.length - 1];
    if (last) { try { return JSON.parse(last) as string; } catch { /* fall through */ } }
    return line.slice(0, 80);
}

/** One streaming pass that records per-file sections of a unified diff. */
export async function indexDiff(input: AsyncIterable<string>): Promise<DiffIndex> {
    const files: DiffFile[] = [];
    let current: DiffFile | undefined;
    let inHunk = false;
    let chars = 0;
    let bytes = 0;
    const close = () => { if (current) { current.nameOnly = current.hunks === 0 && !current.binary; } };
    for await (const line of diffLines(input)) {
        chars = line.start + line.chars;
        bytes += line.bytes;
        if (line.text.startsWith("diff --git ")) {
            close();
            const { oldPath, path } = headerPaths(line.text);
            current = { path, oldPath: oldPath === path ? undefined : oldPath, status: "modified", added: 0, deleted: 0, hunks: 0, lines: 1, binary: false, nameOnly: false, start: line.start, end: line.start + line.chars, bytes: line.bytes };
            files.push(current);
            inHunk = false;
            continue;
        }
        if (line.text.startsWith("Changed file ")) {
            close();
            current = { path: notePath(line.text), status: "note", added: 0, deleted: 0, hunks: 0, lines: 1, binary: false, nameOnly: false, start: line.start, end: line.start + line.chars, bytes: line.bytes, note: line.text };
            files.push(current);
            close();
            current = undefined;
            continue;
        }
        if (!current) {
            // Text before any section is kept as an anonymous note so no byte is unaccounted for.
            current = { path: "", status: "note", added: 0, deleted: 0, hunks: 0, lines: 1, binary: false, nameOnly: false, start: line.start, end: line.start, bytes: 0, note: "" };
            files.push(current);
        }
        current.end = line.start + line.chars;
        current.bytes += line.bytes;
        current.lines++;
        if (current.status === "note") { if ((current.note?.length ?? 0) < 8192) { current.note = (current.note ? current.note + "\n" : "") + line.text; } continue; }
        const text = line.text;
        if (text.startsWith("@@")) { inHunk = true; current.hunks++; }
        else if (inHunk) {
            if (text.startsWith("+")) { current.added++; }
            else if (text.startsWith("-")) { current.deleted++; }
        } else if (text.startsWith("new file mode")) { current.status = "added"; }
        else if (text.startsWith("deleted file mode")) { current.status = "deleted"; }
        else if (text.startsWith("rename from ")) { current.status = "renamed"; current.oldPath = text.slice("rename from ".length); }
        else if (text.startsWith("rename to ")) { current.status = "renamed"; current.path = text.slice("rename to ".length); }
        else if (text.startsWith("Binary files ") || text.startsWith("GIT binary patch")) { current.binary = true; }
    }
    close();
    return { files, bytes, chars };
}

const NOISE_PATTERNS: Array<[RegExp, string]> = [
    [/\.min\.(?:js|css|mjs)$|\.bundle\.js$|\.chunk\.js$/i, "minified or bundled file"],
    [/\.(?:map|snap)$|(?:^|\/)__snapshots__\//i, "source map or test snapshot"],
    [/(?:^|\/)(?:dist|build|out|coverage|node_modules|vendor|third_party|\.next|target)\//i, "build output or vendored dependency"],
    [/\.(?:svg|ico|lockb)$/i, "vector or binary-like asset"],
    [/\.pb\.(?:go|cc|h|js|ts)$|_pb2?\.py$|\.g\.dart$|\.generated\.\w+$|\.designer\.cs$/i, "generated code"],
];
export function noiseReason(file: string): string | undefined {
    if (isGeneratedLockfile(file) || /\.lock$/i.test(file)) { return "dependency lockfile"; }
    return NOISE_PATTERNS.find(([pattern]) => pattern.test(file))?.[1];
}

function category(file: string): number {
    if (/(?:^|\/)(?:package\.json|tsconfig[^/]*\.json|Cargo\.toml|go\.mod|pom\.xml|build\.gradle(?:\.kts)?|requirements\.txt|pyproject\.toml|Gemfile|composer\.json)$|\.(?:proto|graphql)$|(?:^|\/)openapi[^/]*\.(?:ya?ml|json)$/i.test(file)) { return 0; }
    if (/(?:^|\/)(?:tests?|__tests__|spec)\/|\.(?:test|spec)\.\w+$/i.test(file)) { return 2; }
    if (/\.(?:md|mdx|rst|txt|adoc)$/i.test(file)) { return 3; }
    if (/\.(?:ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|cs|rb|php|swift|c|cc|cpp|h|hpp|scala|vue|svelte|sh|sql)$/i.test(file)) { return 1; }
    return 2;
}

/** Upper estimate of a capped body: the head, omission line, up to 15 hunk headers and a 30-line tail. */
function cappedSize(file: DiffFile, options: DigestOptions, cap = FILE_CAP_BYTES): number {
    const average = file.bytes / Math.max(1, file.lines);
    return Math.ceil(Math.min(file.bytes, cap + 2048, average * (options.perFileLines + 60) + 2048));
}

type Mode = "full" | "omit" | "name" | "capped" | "list";
const NOTE_BYTES = 160;

function label(file: DiffFile): string {
    const status = { added: "A", deleted: "D", modified: "M", renamed: "R", note: "N" }[file.status];
    const path = file.oldPath && file.status === "renamed" ? `${file.oldPath} -> ${file.path}` : file.path;
    return `${status} ${path.length > 200 ? path.slice(0, 200) + "…" : path}${file.binary ? " (binary)" : ` (+${file.added} -${file.deleted})`}`;
}

function omissionNote(file: DiffFile, reason: string): string {
    return `Changed file ${JSON.stringify(file.path)} (${file.status === "note" ? "changed" : file.status}, +${file.added} -${file.deleted}): ${reason} omitted from AI input.`;
}

export interface DigestOptions {
    /** Token budget for the diff text itself (prompt overhead already removed). */
    budgetTokens: number;
    perFileLines: number;
}
export interface DigestResult {
    text: string;
    tier: 0 | 1 | 2;
    condensedFiles: number;
    condensedLines: number;
    totalFiles: number;
    estimatedTokens: number;
}

interface FilePlan { mode: Mode; reason?: string; /** Body ceiling in bytes for capped files. */ cap?: number; }

/** Compaction (tier 1) and digest (tier 2) selection over a diff index. Pure; no I/O. */
export function planDigest(index: DiffIndex, options: DigestOptions): { tier: 0 | 1 | 2; plans: FilePlan[]; listTotals: boolean } {
    const budget = tokensToBytes(options.budgetTokens);
    const plans: FilePlan[] = index.files.map(() => ({ mode: "full" as Mode }));
    const size = (i: number): number => {
        const file = index.files[i];
        const plan = plans[i];
        if (file.status === "note") { return Math.min(file.bytes, Buffer.byteLength(file.note ?? "", "utf8") + 1); }
        if (plan.mode === "omit" || plan.mode === "name") { return NOTE_BYTES; }
        if (plan.mode === "capped") { return cappedSize(file, options, plan.cap); }
        if (plan.mode === "list") { return 0; }
        return file.bytes;
    };
    const total = () => index.files.reduce((sum, _file, i) => sum + size(i), 0);
    if (index.bytes <= budget) { return { tier: 0, plans, listTotals: false }; }
    const rules: Array<(file: DiffFile, plan: FilePlan) => boolean> = [
        (file, plan) => { const reason = file.status === "note" ? undefined : noiseReason(file.path); if (reason && file.bytes > NOTE_BYTES) { plan.mode = "omit"; plan.reason = reason; return true; } return false; },
        (file, plan) => { if (file.status !== "note" && file.nameOnly && file.bytes > NOTE_BYTES) { plan.mode = "name"; plan.reason = "rename or mode change without content"; return true; } return false; },
        (file, plan) => { if (file.status === "deleted" && file.bytes > NOTE_BYTES) { plan.mode = "name"; plan.reason = "deleted file content"; return true; } return false; },
        (file, plan) => { if (file.status !== "note" && plan.mode === "full" && (file.added + file.deleted > options.perFileLines || file.bytes > FILE_CAP_BYTES)) { plan.mode = "capped"; return true; } return false; },
    ];
    for (const rule of rules) {
        index.files.forEach((file, i) => { if (plans[i].mode === "full") { rule(file, plans[i]); } });
        if (total() <= budget) { return { tier: 1, plans, listTotals: false }; }
    }
    // Tier 2: complete file list first, then full bodies by priority while the budget lasts.
    let list = index.files.reduce((sum, file) => sum + Buffer.byteLength(label(file), "utf8") + 1, 0) + 256;
    const collapse = list > budget / 2;
    if (collapse) { list = Math.floor(budget / 2); }
    let remaining = budget - list;
    const order = index.files.map((_file, i) => i).filter(i => index.files[i].status !== "note")
        .sort((a, b) => category(index.files[a].path) - category(index.files[b].path)
            || (index.files[b].added + index.files[b].deleted) - (index.files[a].added + index.files[a].deleted) || a - b);
    const included = new Set<number>();
    index.files.forEach((file, i) => { if (file.status === "note") { remaining -= size(i); included.add(i); } });
    // Breadth beats depth for a commit message: share what is left among up to 30 files.
    const candidates = order.filter(i => plans[i].mode !== "omit" && plans[i].mode !== "name" && !index.files[i].binary);
    const cap = Math.max(1500, Math.min(FILE_CAP_BYTES, Math.floor(remaining / Math.max(1, Math.min(candidates.length, 30))) - 2048));
    for (const i of candidates) {
        const plan = plans[i];
        const file = index.files[i];
        const capped = file.bytes > cap || plan.mode === "capped";
        const cost = capped ? cappedSize(file, options, cap) : file.bytes;
        if (cost <= remaining) {
            remaining -= cost;
            included.add(i);
            plan.mode = capped ? "capped" : "full";
            plan.cap = cap;
        }
    }
    index.files.forEach((_file, i) => { if (!included.has(i) && plans[i].mode !== "omit" && plans[i].mode !== "name") { plans[i] = { mode: "list" }; } });
    return { tier: 2, plans, listTotals: collapse };
}

interface Renderer { push(line: DiffLine): void; finish(): string; }

function truncateLine(line: DiffLine): string {
    return line.chars - 1 > line.text.length ? `${line.text}… [${line.chars - 1 - line.text.length} more characters]` : line.text;
}

function cappedRenderer(options: DigestOptions, cap: number): Renderer {
    const head: string[] = [];
    const tail: string[] = [];
    const headers: string[] = [];
    let headBytes = 0;
    let bodyLines = 0;
    let inBody = false;
    let omitted = 0;
    let full = false;
    return {
        push(line) {
            const text = truncateLine(line);
            if (text.startsWith("@@")) { inBody = true; }
            if (!full) {
                head.push(text);
                headBytes += Buffer.byteLength(text, "utf8") + 1;
                if (inBody) { bodyLines++; }
                if (headBytes >= cap || bodyLines >= options.perFileLines) { full = true; }
                return;
            }
            omitted++;
            if (text.startsWith("@@") && headers.length < 15) { headers.push(text.slice(0, 160)); }
            tail.push(text.length > 300 ? text.slice(0, 300) + "…" : text);
            if (tail.length > 30) { tail.shift(); }
        },
        finish() {
            if (!omitted) { return head.join("\n"); }
            const dropped = omitted - tail.length;
            return [...head, `… [${Math.max(0, dropped)} lines omitted${headers.length ? "; later hunks: " + headers.join(" | ") : ""}]`, ...tail].join("\n");
        },
    };
}

function fullRenderer(): Renderer {
    const lines: string[] = [];
    return { push(line) { lines.push(truncateLine(line)); }, finish() { return lines.join("\n"); } };
}

/** Render a plan by re-reading the diff once; only selected sections are buffered. */
export async function renderDigest(read: () => AsyncIterable<string>, index: DiffIndex, planned: ReturnType<typeof planDigest>, options: DigestOptions): Promise<DigestResult> {
    const { tier, plans } = planned;
    const bodies = new Map<number, string>();
    let cursor = 0;
    let renderer: Renderer | undefined;
    const flush = () => { if (renderer) { bodies.set(cursor, renderer.finish()); renderer = undefined; } };
    if (tier !== 0) {
        for await (const line of diffLines(read())) {
            while (cursor < index.files.length && line.start >= index.files[cursor].end) { flush(); cursor++; }
            if (cursor >= index.files.length) { break; }
            const plan = plans[cursor];
            if (index.files[cursor].status === "note") { continue; }
            if (!renderer && (plan.mode === "full" || plan.mode === "capped")) { renderer = plan.mode === "capped" ? cappedRenderer(options, plan.cap ?? FILE_CAP_BYTES) : fullRenderer(); }
            renderer?.push(line);
        }
        flush();
    }
    const parts: string[] = [];
    let condensedFiles = 0;
    let condensedLines = 0;
    const real = index.files.filter(file => file.status !== "note");
    const totals = { added: real.reduce((s, f) => s + f.added, 0), deleted: real.reduce((s, f) => s + f.deleted, 0) };
    const condense = (file: DiffFile) => { condensedFiles++; condensedLines += file.added + file.deleted; };
    if (tier === 0) { return { text: "", tier: 0, condensedFiles: 0, condensedLines: 0, totalFiles: real.length, estimatedTokens: estimateByteTokens(index.bytes) }; }
    if (tier === 2) {
        parts.push(`Diff condensed to fit the model input limit: ${real.length} files changed, +${totals.added} -${totals.deleted}. Every changed file is listed; full hunks follow for the highest-priority files.`);
        if (planned.listTotals) {
            const groups = new Map<string, { files: number; added: number; deleted: number }>();
            for (const file of real) {
                const key = file.path.split("/").slice(0, -1).slice(0, 2).join("/") || ".";
                const group = groups.get(key) ?? { files: 0, added: 0, deleted: 0 };
                group.files++; group.added += file.added; group.deleted += file.deleted;
                groups.set(key, group);
            }
            const lines = [...groups].sort((a, b) => b[1].files - a[1].files).map(([key, g]) => `${key}/ (${g.files} files, +${g.added} -${g.deleted})`);
            // Even directory totals are bounded by the list budget; the remainder is counted, not dropped silently.
            let room = Math.max(512, Math.floor(tokensToBytes(options.budgetTokens) / 2));
            const kept: string[] = [];
            for (const line of lines) {
                room -= Buffer.byteLength(line, "utf8") + 1;
                if (room < 0) { break; }
                kept.push(line);
            }
            parts.push("Changed files by directory:", ...kept);
            if (kept.length < lines.length) { parts.push(`… and ${lines.length - kept.length} more directories (${[...groups.values()].slice().sort((a, b) => b.files - a.files).slice(kept.length).reduce((sum, g) => sum + g.files, 0)} files)`); }
        } else { parts.push("Changed files:", ...real.map(label)); }
    }
    index.files.forEach((file, i) => {
        const plan = plans[i];
        if (file.status === "note") { if (file.note) { parts.push(file.note); } return; }
        if (plan.mode === "omit" || plan.mode === "name") { condense(file); parts.push(omissionNote(file, plan.reason ?? "content")); return; }
        if (plan.mode === "list") { condense(file); return; }
        const body = bodies.get(i);
        if (body === undefined) { return; }
        if (plan.mode === "capped" && body.includes("lines omitted")) { condense(file); }
        parts.push(body);
    });
    const text = parts.join("\n") + "\n";
    return { text, tier, condensedFiles, condensedLines, totalFiles: real.length, estimatedTokens: estimateByteTokens(Buffer.byteLength(text, "utf8")) };
}

/** Index, plan and render a replayable diff for a token budget. Tier 0 means it already fits. */
export async function digestDiff(read: () => AsyncIterable<string>, options: DigestOptions): Promise<DigestResult & { index: DiffIndex }> {
    const index = await indexDiff(read());
    const planned = planDigest(index, options);
    const result = await renderDigest(read, index, planned, options);
    return { ...result, index };
}
