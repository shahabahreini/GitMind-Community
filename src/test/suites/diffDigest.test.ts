import * as assert from "node:assert";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { collectChangeSet, runGit } from "../../commit-intelligence/git";
import { scoreCommitHealth } from "../../commit-intelligence/validation";
import { randomBytes } from "node:crypto";
import { FILE_CAP_BYTES, MAX_LINE_CHARS, diffLines, digestDiff, estimateByteTokens, indexDiff, noiseReason, tokensToBytes } from "../../services/git/diffDigest";

const exec = promisify(execFile);

async function* blocks(text: string, size = 65536): AsyncGenerator<string> {
    for (let i = 0; i < text.length; i += size) { yield text.slice(i, i + size); }
}
const reader = (text: string) => () => blocks(text, 7919);

function section(path: string, added: number, options: { deleted?: number; mode?: "new" | "deleted"; width?: number } = {}): string {
    const width = options.width ?? 40;
    const header = `diff --git a/${path} b/${path}\n${options.mode === "new" ? "new file mode 100644\n" : options.mode === "deleted" ? "deleted file mode 100644\n" : ""}index 1111111..2222222 100644\n--- a/${path}\n+++ b/${path}\n`;
    const body = `@@ -1,${options.deleted ?? 0} +1,${added} @@ function ${path.replace(/\W/g, "_")}\n`
        + Array.from({ length: options.deleted ?? 0 }, (_, i) => `-old ${i} ${"o".repeat(width)}\n`).join("")
        + Array.from({ length: added }, (_, i) => `+new ${i} ${"n".repeat(width)}\n`).join("");
    return header + body;
}

suite("Large diff digest", () => {
    test("the line scanner is lossless in offsets, bounded in memory, and never splits a surrogate pair", async () => {
        const long = "a".repeat(MAX_LINE_CHARS - 1) + "😀" + "b".repeat(5000);
        const text = `first\n${long}\nlast`;
        const lines: Awaited<ReturnType<typeof diffLines> extends AsyncGenerator<infer T> ? T : never>[] = [];
        for await (const line of diffLines(blocks(text, 13))) { lines.push(line); }
        assert.deepStrictEqual(lines.map(line => line.start), [0, 6, 6 + long.length + 1]);
        assert.strictEqual(lines.reduce((sum, line) => sum + line.chars, 0), text.length);
        assert.strictEqual(lines.reduce((sum, line) => sum + line.bytes, 0), Buffer.byteLength(text, "utf8"));
        assert.ok(lines[1].text.length <= MAX_LINE_CHARS);
        assert.doesNotMatch(lines[1].text, /[\uD800-\uDBFF]$/);
        assert.strictEqual(lines[2].text, "last");
    });

    test("the index matches git numstat for staged, unstaged, binary, rename-only and deleted files", async () => {
        const directory = await mkdtemp(join(tmpdir(), "gitmind-digest-"));
        try {
            const git = (...args: string[]) => exec("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd: directory });
            await git("init", "-q");
            await writeFile(join(directory, "a.ts"), "one\ntwo\nthree\n");
            await writeFile(join(directory, "gone.ts"), "x\ny\n");
            await writeFile(join(directory, "moved.ts"), "same\ncontent\nhere\nfor\nrename\n");
            await writeFile(join(directory, "img.bin"), Buffer.from([0, 1, 2, 3, 0, 255]));
            await git("add", ".");
            await git("commit", "-qm", "base");
            await writeFile(join(directory, "a.ts"), "one\nTWO\nthree\nfour\n");
            await git("rm", "-q", "gone.ts");
            await git("mv", "moved.ts", "renamed.ts");
            await writeFile(join(directory, "img.bin"), Buffer.from([9, 9, 0, 0]));
            await writeFile(join(directory, "new file.ts"), "n1\nn2\n");
            await git("add", ".");
            const args = ["diff", "--staged", "--no-ext-diff", "--no-textconv", "--unified=0", "--find-renames"];
            const diff = (await git(...args)).stdout;
            const numstat = (await git("diff", "--staged", "--numstat", "--find-renames")).stdout.trim().split("\n");
            const index = await indexDiff(blocks(diff));
            assert.strictEqual(index.files.length, numstat.length);
            const byPath = new Map(index.files.map(file => [file.path, file]));
            assert.deepStrictEqual([byPath.get("a.ts")!.added, byPath.get("a.ts")!.deleted], [2, 1]);
            assert.strictEqual(byPath.get("gone.ts")!.status, "deleted");
            assert.strictEqual(byPath.get("gone.ts")!.deleted, 2);
            assert.strictEqual(byPath.get("renamed.ts")!.status, "renamed");
            assert.strictEqual(byPath.get("renamed.ts")!.oldPath, "moved.ts");
            assert.strictEqual(byPath.get("renamed.ts")!.nameOnly, true);
            assert.strictEqual(byPath.get("img.bin")!.binary, true);
            assert.strictEqual(byPath.get("new file.ts")!.status, "added");
            assert.strictEqual(index.chars, diff.length);
            assert.strictEqual(index.bytes, Buffer.byteLength(diff, "utf8"));
            // Sections are contiguous and cover every character.
            let end = 0;
            for (const file of index.files) { assert.strictEqual(file.start, end); end = file.end; }
            assert.strictEqual(end, diff.length);
        } finally { await rm(directory, { recursive: true, force: true }); }
    });

    test("notes for omitted files are kept verbatim and never counted as hunks", async () => {
        const note = 'Changed file "data/big.csv" (modified): CSV with 9 data rows; detailed records omitted from AI input.\n';
        const diff = section("a.ts", 3) + note + section("b.ts", 2);
        const index = await indexDiff(blocks(diff));
        assert.deepStrictEqual(index.files.map(file => file.status), ["modified", "note", "modified"]);
        assert.strictEqual(index.files[1].path, "data/big.csv");
        assert.strictEqual(index.files[1].note, note.trimEnd());
        assert.strictEqual(index.files[2].added, 2);
    });

    test("estimator is bytes/3 with a margin and round-trips budgets", () => {
        assert.strictEqual(estimateByteTokens(3000), 1100);
        assert.ok(tokensToBytes(1100) <= 3000 && tokensToBytes(1100) >= 2998);
        assert.strictEqual(estimateByteTokens(0), 0);
    });

    test("a diff that fits is tier 0 and unchanged", async () => {
        const diff = section("a.ts", 5);
        const result = await digestDiff(reader(diff), { budgetTokens: 10000, perFileLines: 400 });
        assert.strictEqual(result.tier, 0);
        assert.strictEqual(result.condensedFiles, 0);
    });

    test("tier 1 drops generated files first, keeps every file name, and stays under budget", async () => {
        const lock = section("package-lock.json", 3000);
        const minified = section("dist/app.min.js", 2000, { width: 200 });
        const code = section("src/app.ts", 40) + section("src/util.ts", 30);
        const diff = code.slice(0, 0) + section("src/app.ts", 40) + lock + minified + section("src/util.ts", 30);
        const budgetTokens = Math.ceil(estimateByteTokens(Buffer.byteLength(code, "utf8")) * 1.5);
        const result = await digestDiff(reader(diff), { budgetTokens, perFileLines: 400 });
        assert.strictEqual(result.tier, 1);
        assert.ok(result.estimatedTokens <= budgetTokens, `${result.estimatedTokens} > ${budgetTokens}`);
        for (const path of ["src/app.ts", "src/util.ts", "package-lock.json", "dist/app.min.js"]) { assert.ok(result.text.includes(path), path); }
        assert.match(result.text, /dependency lockfile omitted from AI input/);
        assert.match(result.text, /minified or bundled file omitted from AI input/);
        assert.ok(result.text.includes("+new 39 "), "ordinary source stays complete");
        assert.strictEqual(result.condensedFiles, 2);
    });

    test("tier 1 reduces deleted files and pure renames to one line without losing the name", async () => {
        const removed = section("src/removed.ts", 0, { deleted: 600, mode: "deleted" });
        const diff = section("src/keep.ts", 20) + removed;
        const result = await digestDiff(reader(diff), { budgetTokens: Math.ceil(estimateByteTokens(Buffer.byteLength(section("src/keep.ts", 20), "utf8")) * 1.4), perFileLines: 400 });
        assert.strictEqual(result.tier, 1);
        assert.match(result.text, /"src\/removed.ts" \(deleted, \+0 -600\)/);
        assert.ok(!result.text.includes("-old 300"));
    });

    test("tier 1 caps one huge file with head, omission marker, later hunk headers and tail", async () => {
        const hunks = Array.from({ length: 300 }, (_, i) => `@@ -${i * 10},1 +${i * 10},1 @@ function f${i}\n-old${i}\n+new${i}\n`).join("");
        const big = `diff --git a/src/big.ts b/src/big.ts\nindex 1..2 100644\n--- a/src/big.ts\n+++ b/src/big.ts\n${hunks}`;
        const diff = big + section("src/small.ts", 10);
        const result = await digestDiff(reader(diff), { budgetTokens: 2500, perFileLines: 100 });
        assert.strictEqual(result.tier, 1);
        assert.match(result.text, /lines omitted; later hunks: @@ -/);
        assert.ok(result.text.includes("+new299"), "tail of the last hunk is kept");
        assert.ok(result.text.includes("src/small.ts"));
        assert.ok(result.estimatedTokens <= 2500);
    });

    test("tier 2 lists every file and fills the remaining budget by priority", async () => {
        let diff = section("package.json", 4) + section("README.md", 200, { width: 100 });
        for (let i = 0; i < 60; i++) { diff += section(`src/module${i}.ts`, 80); }
        diff += section("src/app.test.ts", 80);
        const paths = ["package.json", "README.md", "src/app.test.ts", ...Array.from({ length: 60 }, (_, i) => `src/module${i}.ts`)];
        const budgetTokens = 3000;
        const result = await digestDiff(reader(diff), { budgetTokens, perFileLines: 400 });
        assert.strictEqual(result.tier, 2);
        assert.ok(result.estimatedTokens <= budgetTokens, `${result.estimatedTokens} > ${budgetTokens}`);
        for (const path of paths) { assert.ok(result.text.includes(path), `missing ${path}`); }
        assert.ok(result.text.includes("+new 3 nnnn"), "manifest hunks come first");
        assert.ok(result.condensedFiles > 0);
        assert.ok(!result.text.includes("# of the docs"), "sanity");
        assert.match(result.text, /60\d? files|63 files changed/);
    });

    test("a 5 MB diff with 3000 files and a 3 MB single line stays bounded and names every file", async () => {
        let diff = "";
        for (let i = 0; i < 3000; i++) { diff += section(`pkg${i % 50}/src/file${i}.ts`, 5, { width: 20 }); }
        diff += `diff --git a/data.txt b/data.txt\nindex 1..2 100644\n--- a/data.txt\n+++ b/data.txt\n@@ -0,0 +1 @@\n+${"z".repeat(3 * 1024 * 1024)}\n`;
        assert.ok(diff.length > 3 * 1024 * 1024);
        const before = process.memoryUsage().heapUsed;
        const started = Date.now();
        const result = await digestDiff(reader(diff), { budgetTokens: 30000, perFileLines: 400 });
        console.log(`digest of ${diff.length} chars took ${Date.now() - started} ms`);
        assert.ok(result.estimatedTokens <= 30000);
        assert.strictEqual(result.index.files.length, 3001);
        assert.match(result.text, /Changed files by directory:/);
        for (let i = 0; i < 50; i++) { assert.ok(result.text.includes(`pkg${i}/src/`)); }
        assert.match(result.text, /\.\/ \(1 files, \+1 -0\)/, "root-level files are counted under \".\"");
        assert.ok(!result.text.includes("z".repeat(MAX_LINE_CHARS + 1)));
        assert.ok(process.memoryUsage().heapUsed - before < 200 * 1024 * 1024);
    });

    test("more files than the list can hold collapse to directory totals instead of dropping silently", async () => {
        let diff = "";
        for (let i = 0; i < 10000; i++) { diff += section(`area${i % 7}/sub/file${i}.ts`, 2, { width: 10 }); }
        const result = await digestDiff(reader(diff), { budgetTokens: 4000, perFileLines: 400 });
        assert.strictEqual(result.tier, 2);
        assert.ok(result.estimatedTokens <= 4000, String(result.estimatedTokens));
        assert.match(result.text, /Changed files by directory:/);
        for (let area = 0; area < 7; area++) { assert.ok(result.text.includes(`area${area}/sub/`)); }
    });

    test("generated-file classification covers lockfiles, bundles, snapshots and vendored code", () => {
        for (const path of ["yarn.lock", "web/package-lock.json", "a/b.min.js", "x.js.map", "dist/x.js", "__snapshots__/a.snap", "vendor/lib/a.go", "api/foo.pb.go"]) { assert.ok(noiseReason(path), path); }
        for (const path of ["src/app.ts", "docs/readme.md", "src/distance.ts", "lib/build.ts"]) { assert.strictEqual(noiseReason(path), undefined, path); }
        assert.ok(FILE_CAP_BYTES > 0);
    });

    test("staged media larger than the Git buffer does not break health scoring, and Composer still gets applyable patches", async () => {
        const directory = await mkdtemp(join(tmpdir(), "gitmind-media-"));
        try {
            const git = (...args: string[]) => exec("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd: directory, maxBuffer: 1 << 30 });
            await git("init", "-q");
            await writeFile(join(directory, "readme.md"), "base\n");
            await git("add", ".");
            await git("commit", "-qm", "base");
            // Random bytes: the base85 binary patch is about 31 MB, above the 20 MB default buffer.
            await writeFile(join(directory, "film.mp4"), randomBytes(25 * 1024 * 1024));
            await writeFile(join(directory, "readme.md"), "base\nmore text\n");
            await git("add", ".");
            const scoring = await collectChangeSet(directory, false, { binaryPatches: false });
            assert.deepStrictEqual(scoring.atoms.map(atom => atom.path).sort(), ["film.mp4", "readme.md"]);
            assert.strictEqual(scoring.atoms.find(atom => atom.path === "film.mp4")!.kind, "binary");
            assert.ok(scoring.atoms.every(atom => atom.patch.length < 4096), "no binary payload is loaded for scoring");
            assert.ok(scoreCommitHealth(scoring).overall >= 0);
            const composer = await collectChangeSet(directory, false);
            assert.match(composer.atoms.find(atom => atom.path === "film.mp4")!.patch, /GIT binary patch/);
            // The pre-fix path: the default 20 MB buffer cannot hold this binary patch.
            await assert.rejects(() => runGit(directory, ["diff", "--cached", "--binary"]), /exceeded 20 MB/);
            await assert.rejects(() => runGit(directory, ["diff", "--cached", "--binary"], [0], 1024 * 1024), /exceeded 1 MB\. Large binary files/);
        } finally { await rm(directory, { recursive: true, force: true }); }
    });
});
