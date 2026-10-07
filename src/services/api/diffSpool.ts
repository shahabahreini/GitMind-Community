import { createReadStream } from "node:fs";
import { appendFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DiffInput } from "./budgetedGeneration";

/** Replay a one-shot diff without retaining the whole stream in memory. */
export class DiffSpool {
    private constructor(private readonly directory: string, private readonly filename: string, public readonly bytes: number) {}

    static async create(input: AsyncIterable<string>, signal?: AbortSignal): Promise<DiffSpool> {
        const directory = await mkdtemp(join(tmpdir(), "gitmind-diff-"));
        const filename = join(directory, "diff.txt");
        let bytes = 0;
        let pending = "";
        try {
            for await (const block of input) {
                signal?.throwIfAborted();
                const joined = pending + block;
                const last = joined.charCodeAt(joined.length - 1);
                pending = last >= 0xd800 && last <= 0xdbff ? joined.slice(-1) : "";
                const ready = pending ? joined.slice(0, -1) : joined;
                bytes += Buffer.byteLength(ready, "utf8");
                await appendFile(filename, ready, { encoding: "utf8", mode: 0o600 });
            }
            if (pending) { bytes += Buffer.byteLength(pending, "utf8"); await appendFile(filename, pending, { encoding: "utf8" }); }
            return new DiffSpool(directory, filename, bytes);
        } catch (error) {
            await rm(directory, { recursive: true, force: true });
            throw error;
        }
    }

    async *read(): AsyncGenerator<string> {
        for await (const block of createReadStream(this.filename, { encoding: "utf8", highWaterMark: 64 * 1024 })) {
            yield block as string;
        }
    }

    async boundedString(maxBytes: number): Promise<string | undefined> {
        if (this.bytes > maxBytes) { return undefined; }
        let text = "";
        for await (const block of this.read()) { text += block; }
        return text;
    }

    asInput(): DiffInput { return this.read(); }
    async dispose(): Promise<void> { await rm(this.directory, { recursive: true, force: true }); }
}
