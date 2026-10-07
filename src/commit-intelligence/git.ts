import { execFile } from "child_process";
import { createHash } from "crypto";
import { promisify } from "util";
import { open } from "fs/promises";
import * as path from "path";
import { ChangeAtom, ChangeKind, ChangeOrigin, ChangeSet, RepositorySnapshot } from "./models";

const execFileAsync = promisify(execFile);
const MAX_BUFFER = 20 * 1024 * 1024;
/** Binary patches (base85) are only needed when Composer re-applies changes; staged media can be hundreds of MB. */
const BINARY_PATCH_BUFFER = 1024 * 1024 * 1024;

export async function runGit(repositoryRoot: string, args: readonly string[], allowedExitCodes: readonly number[] = [0], maxBuffer = MAX_BUFFER): Promise<string> {
  try {
    const result = await execFileAsync("git", [...args], { cwd: repositoryRoot, maxBuffer, encoding: "utf8" });
    return result.stdout;
  } catch (error) {
    const result = error as { code?: number | string; stdout?: string; stderr?: string; message?: string };
    if (typeof result.code === "number" && allowedExitCodes.includes(result.code)) {
      return result.stdout ?? "";
    }
    if (result.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
      throw new Error(`Git output for "git ${args[0]}" exceeded ${Math.round(maxBuffer / 1024 / 1024)} MB. Large binary files are usually the cause.`);
    }
    throw new Error(`Git command failed: ${result.stderr?.trim() || result.message?.trim() || "unknown error"}`);
  }
}

function stableId(prefix: string, value: string): string {
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 20)}`;
}

function decodeGitPath(value: string): string {
  const trimmed = value.trim().replace(/^[ab]\//, "");
  if (!trimmed.startsWith('"')) {return trimmed;}
  try { return JSON.parse(trimmed); } catch { return trimmed.slice(1, -1); }
}

function parseRange(header: string): Pick<ChangeAtom, "oldStart" | "oldLines" | "newStart" | "newLines"> {
  const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(header);
  if (!match) {return {};}
  return { oldStart: Number(match[1]), oldLines: Number(match[2] ?? 1), newStart: Number(match[3]), newLines: Number(match[4] ?? 1) };
}

function changeKind(patch: string): ChangeKind {
  if (/^rename (?:from|to) /m.test(patch)) {return "renamed";}
  if (/^(?:Binary files .* differ|GIT binary patch)/m.test(patch)) {return "binary";}
  if (/^[+-]?Subproject commit /m.test(patch)) {return "submodule";}
  if (/^new file mode /m.test(patch) || /--- \/dev\/null/m.test(patch)) {return "added";}
  if (/^deleted file mode /m.test(patch) || /\+\+\+ \/dev\/null/m.test(patch)) {return "deleted";}
  return "modified";
}

export function parseUnifiedDiff(diff: string, origin: ChangeOrigin): ChangeAtom[] {
  if (!diff.trim()) {return [];}
  const fileBlocks = diff.split(/(?=^diff --git )/m).filter(block => block.startsWith("diff --git "));
  const atoms: ChangeAtom[] = [];
  for (const block of fileBlocks) {
    const firstLine = block.slice(0, block.indexOf("\n") < 0 ? undefined : block.indexOf("\n"));
    const pathMatch = /^diff --git (?:"a\/(.*?)"|a\/(\S+)) (?:"b\/(.*?)"|b\/(\S+))$/.exec(firstLine);
    let currentPath = decodeGitPath(pathMatch?.[3] ?? pathMatch?.[4] ?? firstLine.split(" ").at(-1) ?? "unknown");
    const oldPathMatch = /^rename from (.+)$/m.exec(block);
    const newPathMatch = /^rename to (.+)$/m.exec(block);
    if (newPathMatch) {currentPath = decodeGitPath(newPathMatch[1]);}
    const oldPath = oldPathMatch ? decodeGitPath(oldPathMatch[1]) : undefined;
    const fileId = stableId("file", `${origin}\0${oldPath ?? ""}\0${currentPath}`);
    const kind = changeKind(block);
    const headerEnd = block.search(/^@@ /m);
    const fileHeader = headerEnd >= 0 ? block.slice(0, headerEnd) : block;
    const hunkParts = headerEnd >= 0 ? block.slice(headerEnd).split(/(?=^@@ )/m) : [];
    const indivisible = kind === "binary" || kind === "renamed" || kind === "submodule" || hunkParts.length === 0;
    const parts = indivisible ? [block] : hunkParts;
    parts.forEach((part, index) => {
      const hunkHeader = /^@@[^\n]*/m.exec(part)?.[0] ?? `${kind} file`;
      const additions = (part.match(/^\+(?!\+\+)/gm) ?? []).length;
      const deletions = (part.match(/^-(?!---)/gm) ?? []).length;
      const hunkId = stableId("hunk", `${fileId}\0${hunkHeader}\0${part.replace(/\s+/g, " ").trim()}`);
      atoms.push({
        id: indivisible ? fileId : hunkId, fileId, hunkId: indivisible ? undefined : hunkId,
        path: currentPath, oldPath, origin, kind, header: hunkHeader,
        patch: indivisible ? part : `${fileHeader}${part}`, ...parseRange(hunkHeader),
        additions, deletions, indivisible, noise: kind === "binary" ? "binary" : "none"
      });
      void index;
    });
  }
  return atoms;
}

async function untrackedPatch(repositoryRoot: string, filePath: string): Promise<string> {
  const absolute = path.resolve(repositoryRoot, filePath);
  const relative = path.relative(repositoryRoot, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {throw new Error("Untracked path escaped repository");}
  // Sniff the start of the file like Git does instead of loading large media into memory.
  const handle = await open(absolute, "r");
  const head = Buffer.alloc(8000);
  let read = 0;
  try { read = (await handle.read(head, 0, head.length, 0)).bytesRead; } finally { await handle.close(); }
  if (head.subarray(0, read).includes(0)) {return `diff --git a/${filePath} b/${filePath}\nnew file mode 100644\nBinary files /dev/null and b/${filePath} differ\n`;}
  return runGit(repositoryRoot, ["diff", "--no-index", "--", "/dev/null", filePath], [0, 1]);
}

export async function captureSnapshot(repositoryRoot: string): Promise<RepositorySnapshot> {
  const [head, branch, indexTree, status] = await Promise.all([
    runGit(repositoryRoot, ["rev-parse", "HEAD"]),
    runGit(repositoryRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"], [0, 1]),
    runGit(repositoryRoot, ["write-tree"]),
    runGit(repositoryRoot, ["status", "--porcelain=v2", "-z", "--untracked-files=all"])
  ]);
  return { head: head.trim(), branch: branch.trim() || undefined, indexTree: indexTree.trim(), statusHash: stableId("status", status) };
}

export interface ChangeSetOptions {
  /**
   * Include applyable binary patches. Composer needs them to re-apply changes; scoring and
   * previews do not, and binary patches of staged media can exceed any reasonable buffer.
   */
  binaryPatches?: boolean;
}

export async function collectChangeSet(repositoryRoot: string, captureAll = true, options: ChangeSetOptions = {}): Promise<ChangeSet> {
  const binary = options.binaryPatches ?? true;
  const diffArgs = [...(binary ? ["--binary"] : []), "--find-renames", "--submodule=short", "--", "."];
  const buffer = binary ? BINARY_PATCH_BUFFER : MAX_BUFFER;
  const snapshot = await captureSnapshot(repositoryRoot);
  const staged = await runGit(repositoryRoot, ["diff", "--cached", ...diffArgs], [0], buffer);
  const unstaged = captureAll ? await runGit(repositoryRoot, ["diff", ...diffArgs], [0], buffer) : "";
  const untracked = captureAll ? (await runGit(repositoryRoot, ["ls-files", "--others", "--exclude-standard", "-z"]))
    .split("\0").filter(Boolean) : [];
  const patches = await Promise.all(untracked.map(file => untrackedPatch(repositoryRoot, file)));
  return {
    repositoryRoot, snapshot, createdAt: Date.now(),
    atoms: [
      ...parseUnifiedDiff(staged, "staged"),
      ...parseUnifiedDiff(unstaged, "unstaged"),
      ...patches.flatMap(patch => parseUnifiedDiff(patch, "untracked"))
    ]
  };
}

/** Remove paths from the index without touching their working-tree contents. */
export async function unstagePaths(repositoryRoot: string, paths: readonly string[]): Promise<void> {
  const uniquePaths = [...new Set(paths)].filter(Boolean);
  if (!uniquePaths.length) {return;}
  try { await runGit(repositoryRoot, ["reset", "HEAD", "--", ...uniquePaths]); }
  catch { await runGit(repositoryRoot, ["rm", "--cached", "--ignore-unmatch", "--", ...uniquePaths]); }
}

export async function snapshotMatches(changeSet: ChangeSet): Promise<boolean> {
  const current = await captureSnapshot(changeSet.repositoryRoot);
  return current.head === changeSet.snapshot.head && current.indexTree === changeSet.snapshot.indexTree && current.statusHash === changeSet.snapshot.statusHash;
}
