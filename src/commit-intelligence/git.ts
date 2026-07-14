import { execFile } from "child_process";
import { createHash } from "crypto";
import { promisify } from "util";
import { readFile } from "fs/promises";
import * as path from "path";
import { ChangeAtom, ChangeKind, ChangeOrigin, ChangeSet, RepositorySnapshot } from "./models";

const execFileAsync = promisify(execFile);
const MAX_BUFFER = 20 * 1024 * 1024;

export async function runGit(repositoryRoot: string, args: readonly string[], allowedExitCodes: readonly number[] = [0]): Promise<string> {
  try {
    const result = await execFileAsync("git", [...args], { cwd: repositoryRoot, maxBuffer: MAX_BUFFER, encoding: "utf8" });
    return result.stdout;
  } catch (error) {
    const result = error as { code?: number; stdout?: string; stderr?: string };
    if (typeof result.code === "number" && allowedExitCodes.includes(result.code)) {
      return result.stdout ?? "";
    }
    throw new Error(`Git command failed: ${result.stderr?.trim() || "unknown error"}`);
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
  const data = await readFile(absolute);
  if (data.includes(0)) {return `diff --git a/${filePath} b/${filePath}\nnew file mode 100644\nBinary files /dev/null and b/${filePath} differ\n`;}
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

export async function collectChangeSet(repositoryRoot: string, captureAll = true): Promise<ChangeSet> {
  const snapshot = await captureSnapshot(repositoryRoot);
  const staged = await runGit(repositoryRoot, ["diff", "--cached", "--binary", "--find-renames", "--submodule=short", "--", "."]);
  const unstaged = captureAll ? await runGit(repositoryRoot, ["diff", "--binary", "--find-renames", "--submodule=short", "--", "."]) : "";
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
