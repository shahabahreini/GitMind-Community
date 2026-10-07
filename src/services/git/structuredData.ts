import { createHash } from "node:crypto";

export const STRUCTURED_DATA_BYTES = 64 * 1024;
export const LOCKFILE_BYTES = 32 * 1024;

export function isStructuredData(file: string): boolean {
    return /\.(?:json|jsonl|ndjson|csv|tsv)$/i.test(file);
}

export function isGeneratedLockfile(file: string): boolean {
    return /(?:^|\/)(?:Cargo\.lock|pnpm-lock\.yaml|package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|bun\.lockb?)$/i.test(file);
}

function fields(value: unknown): string[] {
    if (!value || typeof value !== "object" || Array.isArray(value)) { return []; }
    return Object.keys(value).slice(0, 16).map(key => key.slice(0, 80));
}

function csvRows(text: string, delimiter: string): { rows: number; columns: string[] } {
    let quoted = false;
    let cell = "";
    let row: string[] = [];
    let rows = 0;
    let columns: string[] = [];
    let started = false;
    const finishRow = () => {
        row.push(cell);
        cell = "";
        if (!rows) { columns = row.slice(0, 16).map(value => value.slice(0, 80)); }
        rows++;
        row = [];
        started = false;
    };
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        started = true;
        if (char === '"') {
            if (quoted && text[i + 1] === '"') { if (!rows && cell.length < 80) { cell += '"'; } i++; }
            else { quoted = !quoted; }
        } else if (!quoted && char === delimiter) { row.push(cell); cell = ""; }
        else if (!quoted && char === "\n") { finishRow(); }
        else if (char !== "\r" || quoted) { if (!rows && cell.length < 80) { cell += char; } }
    }
    if (started) { finishRow(); }
    return { rows: Math.max(0, rows - 1), columns };
}

/** Small, deterministic metadata for data-heavy files. Ordinary JSON objects keep their diff. */
export function describeStructuredData(file: string, text: string): string | undefined {
    const bytes = Buffer.byteLength(text, "utf8");
    const fingerprint = createHash("sha256").update(text).digest("hex").slice(0, 12);
    const suffix = `; ${bytes} bytes; content SHA-256 ${fingerprint}`;
    if (isGeneratedLockfile(file)) { return `generated dependency lockfile${suffix}`; }
    try {
        if (/\.json$/i.test(file)) {
            const data: unknown = JSON.parse(text);
            const object = data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : undefined;
            const recordKey = object && ["records", "items", "features", "rows", "results", "data"].find(key => Array.isArray(object[key]));
            const records = Array.isArray(data) ? data : recordKey ? object![recordKey] as unknown[] : undefined;
            if (!records) { return undefined; }
            const sample = records.find(item => fields(item).length);
            const keys = fields(sample);
            return `JSON ${recordKey ? `${recordKey} array` : "array"} with ${records.length} records${keys.length ? `; fields ${JSON.stringify(keys)}` : ""}${suffix}`;
        }
        if (/\.(?:jsonl|ndjson)$/i.test(file)) {
            const lines = text.split(/\r?\n/).filter(line => line.trim());
            const sample: unknown = lines.length ? JSON.parse(lines[0]) : undefined;
            const keys = fields(sample);
            return `JSON Lines with ${lines.length} records${keys.length ? `; fields ${JSON.stringify(keys)}` : ""}${suffix}`;
        }
        if (/\.(?:csv|tsv)$/i.test(file)) {
            const { rows, columns } = csvRows(text, /\.tsv$/i.test(file) ? "\t" : ",");
            return `${/\.tsv$/i.test(file) ? "TSV" : "CSV"} with ${rows} data rows${columns.length ? `; columns ${JSON.stringify(columns)}` : ""}${suffix}`;
        }
    } catch { if (/\.json$/i.test(file)) { return undefined; } }
    return `structured data${suffix}`;
}
