import { createReadStream } from "node:fs";
import { mkdtemp, appendFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import type { CoveredText } from "./budgetedGeneration";

/** Ordered disk-backed coverage manifest and summaries, with bounded read buffers. */
export class CoverageStore {
    private constructor(private readonly directory: string, private readonly filename: string) {}
    public count = 0;
    public textSize = 0;
    static async create(): Promise<CoverageStore> {
        const directory = await mkdtemp(join(tmpdir(), "gitmind-coverage-"));
        return new CoverageStore(directory, join(directory, "manifest.jsonl"));
    }
    async append(part: CoveredText): Promise<void> {
        await appendFile(this.filename, JSON.stringify(part) + "\n", { mode: 0o600 });
        this.count++;
        this.textSize += Buffer.byteLength("[" + part.start + ".." + part.end + "] " + part.text + "\n", "utf8");
    }
    async *read(): AsyncGenerator<CoveredText> {
        if (!this.count) { return; }
        const stream = createReadStream(this.filename, { encoding: "utf8", highWaterMark: 16384 });
        const lines = createInterface({ input: stream, crlfDelay: Infinity });
        try { for await (const line of lines) { yield JSON.parse(line) as CoveredText; } }
        finally { lines.close(); stream.destroy(); }
    }
    async dispose(): Promise<void> { await rm(this.directory, { recursive: true, force: true }); }
}
