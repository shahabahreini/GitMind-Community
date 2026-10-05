import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { ProviderApiError } from "../api/recovery";

export interface DiffSpool extends AsyncIterable<string> {
    size: number;
    append: (args: readonly string[], cwd: string, signal?: AbortSignal, noIndex?: boolean) => Promise<void>;
    dispose: () => Promise<void>;
}

/** Private ephemeral disk storage; failed Git commands never expose partial stdout. */
export async function createDiffSpool(): Promise<DiffSpool> {
    const directory = await mkdtemp(join(tmpdir(), "gitmind-diff-"));
    const paths: string[] = [];
    let disposed = false;
    const spool: DiffSpool = {
        size: 0,
        async append(args, cwd, signal, noIndex = false) {
            signal?.throwIfAborted();
            const file = join(directory, String(paths.length));
            const child = spawn("git", [...args], { cwd, stdio: ["ignore", "pipe", "pipe"] });
            let stderrBytes = 0;
            child.stderr.on("data", (block: Buffer) => { stderrBytes = Math.min(4096, stderrBytes + block.length); });
            const abort = () => child.kill("SIGTERM");
            signal?.addEventListener("abort", abort, { once: true });
            const closed = new Promise<number | null>((resolve, reject) => {
                child.once("error", reject);
                child.once("close", resolve);
            });
            try {
                const [code] = await Promise.all([closed, pipeline(child.stdout, createWriteStream(file, { mode: 0o600 }))]);
                signal?.throwIfAborted();
                if (code !== 0 && !(noIndex && code === 1 && stderrBytes === 0)) {
                    throw new ProviderApiError("Git diff collection failed; no partial diff was accepted.", { category: "configuration" });
                }
                const size = (await stat(file)).size;
                paths.push(file);
                spool.size += size;
            } catch (error) {
                child.kill("SIGTERM");
                await closed.catch(() => undefined);
                throw error;
            } finally { signal?.removeEventListener("abort", abort); }
        },
        async *[Symbol.asyncIterator]() {
            if (disposed) { throw new Error("Diff spool is closed."); }
            for (const file of paths) {
                const stream = createReadStream(file, { encoding: "utf8", highWaterMark: 64 * 1024 });
                try { for await (const block of stream) { yield String(block); } }
                finally { stream.destroy(); }
            }
        },
        async dispose() {
            disposed = true;
            await rm(directory, { recursive: true, force: true });
        },
    };
    return spool;
}
