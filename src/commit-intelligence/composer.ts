import { access, copyFile, mkdtemp, readFile, rm } from "fs/promises";
import { spawn } from "child_process";
import * as os from "os";
import * as path from "path";
import { ChangeAtom, ChangeSet, CompositionPlan } from "./models";
import { runGit, snapshotMatches } from "./git";

export interface RelationshipEdge { from: string; to: string; reasons: string[]; weight: number }
export interface RelationshipGraph { atomIds: string[]; edges: RelationshipEdge[] }

function basenameStem(file: string): string {
  return path.basename(file).replace(/\.(?:test|spec)\.[^.]+$/i, "").replace(/\.[^.]+$/, "").toLowerCase();
}

export function buildRelationshipGraph(changeSet: ChangeSet): RelationshipGraph {
  const edges: RelationshipEdge[] = [];
  for (let leftIndex = 0; leftIndex < changeSet.atoms.length; leftIndex++) {
    for (let rightIndex = leftIndex + 1; rightIndex < changeSet.atoms.length; rightIndex++) {
      const left = changeSet.atoms[leftIndex]; const right = changeSet.atoms[rightIndex];
      const reasons: string[] = [];
      if (path.dirname(left.path) === path.dirname(right.path)) {reasons.push("file proximity");}
      if (basenameStem(left.path) === basenameStem(right.path)) {reasons.push("source/test or rename relationship");}
      if (left.patch.includes(path.basename(right.path)) || right.patch.includes(path.basename(left.path))) {reasons.push("import or symbol reference");}
      if (/\b(?:config|settings|manifest)\b/i.test(left.path + right.path)) {reasons.push("configuration relationship");}
      if ((left.noise === "lockfile") !== (right.noise === "lockfile") && path.dirname(left.path) === path.dirname(right.path)) {reasons.push("dependency/lock relationship");}
      if ((left.noise === "generated") !== (right.noise === "generated")) {
        const generated = left.noise === "generated" ? left : right;
        const source = generated === left ? right : left;
        if (generated.patch.includes(path.basename(source.path))) {reasons.push("generated output relationship");}
      }
      if (left.oldPath === right.path || right.oldPath === left.path) {reasons.push("rename relationship");}
      if (left.path === right.path) {reasons.push("hunk proximity");}
      if (reasons.length) {edges.push({ from: left.id, to: right.id, reasons, weight: Math.min(1, reasons.length * .25) });}
    }
  }
  return { atomIds: changeSet.atoms.map(atom => atom.id), edges };
}

export function validateCompositionPlan(plan: CompositionPlan, changeSet: ChangeSet): string[] {
  const errors: string[] = [];
  const known = new Set(changeSet.atoms.map(atom => atom.id));
  const assigned = [...plan.groups.flatMap(group => group.atomIds), ...plan.excludedAtomIds];
  const seen = new Set<string>();
  for (const id of assigned) {
    if (!known.has(id)) {errors.push(`Unknown change ID: ${id}`);}
    if (seen.has(id)) {errors.push(`Change ID assigned more than once: ${id}`);}
    seen.add(id);
  }
  known.forEach(id => { if (!seen.has(id)) {errors.push(`Change ID is unassigned: ${id}`);} });
  plan.groups.forEach(group => {
    if (!group.id.trim()) {errors.push("Composition group ID cannot be empty");}
    if (group.atomIds.length === 0) {errors.push(`Composition group ${group.id} is empty`);}
    if (!group.message.trim()) {errors.push(`Composition group ${group.id} has no commit message`);}
  });
  if (plan.snapshot.head !== changeSet.snapshot.head || plan.snapshot.indexTree !== changeSet.snapshot.indexTree || plan.snapshot.statusHash !== changeSet.snapshot.statusHash) {errors.push("Composition plan snapshot does not match its change set");}
  return errors;
}

async function exists(file: string): Promise<boolean> { try { await access(file); return true; } catch { return false; } }

async function applyPatch(repositoryRoot: string, patch: string, cached: boolean): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const args = ["apply", "--whitespace=nowarn", ...(cached ? ["--cached"] : ["--index"]), "-"];
    const child = spawn("git", args, { cwd: repositoryRoot, stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.setEncoding("utf8"); child.stderr.on("data", data => { stderr += data; });
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve() : reject(new Error(`Unable to apply selected change: ${stderr.trim()}`)));
    child.stdin.end(patch);
  });
}

function combinedPatch(atoms: readonly ChangeAtom[]): string {
  return atoms.map(atom => atom.patch.endsWith("\n") ? atom.patch : `${atom.patch}\n`).join("");
}

export interface ComposerApplyResult { commits: string[]; branch: string; recovery: string[] }

export async function applyCompositionPlan(plan: CompositionPlan, changeSet: ChangeSet, signal?: AbortSignal): Promise<ComposerApplyResult> {
  const errors = validateCompositionPlan(plan, changeSet);
  if (errors.length) {throw new Error(errors.join("; "));}
  if (!changeSet.snapshot.branch) {throw new Error("Composer cannot apply on a detached HEAD");}
  if (!await snapshotMatches(changeSet)) {throw new Error("Worktree or index changed after Composer review");}
  const unmerged = await runGit(changeSet.repositoryRoot, ["diff", "--name-only", "--diff-filter=U"]);
  if (unmerged.trim()) {throw new Error("Composer cannot apply while conflicts are present");}
  const gitDir = (await runGit(changeSet.repositoryRoot, ["rev-parse", "--git-dir"])).trim();
  const absoluteGitDir = path.resolve(changeSet.repositoryRoot, gitDir);
  for (const marker of ["MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "rebase-merge", "rebase-apply"]) {
    if (await exists(path.join(absoluteGitDir, marker))) {throw new Error(`Composer cannot apply during ${marker.toLowerCase().replace(/[_-]/g, " ")}`);}
  }
  const indexPathRaw = (await runGit(changeSet.repositoryRoot, ["rev-parse", "--git-path", "index"])).trim();
  const indexPath = path.resolve(changeSet.repositoryRoot, indexPathRaw);
  const backupDirectory = await mkdtemp(path.join(os.tmpdir(), "gitmind-index-"));
  const backupIndex = path.join(backupDirectory, "index");
  await copyFile(indexPath, backupIndex);
  const tempWorktree = await mkdtemp(path.join(os.tmpdir(), "gitmind-composer-"));
  const branchRef = `refs/heads/${changeSet.snapshot.branch}`;
  const commits: string[] = [];
  let refUpdated = false;
  const recovery: string[] = [];
  try {
    await runGit(changeSet.repositoryRoot, ["worktree", "add", "--detach", tempWorktree, changeSet.snapshot.head]);
    const byId = new Map(changeSet.atoms.map(atom => [atom.id, atom]));
    for (const group of plan.groups) {
      if (signal?.aborted) {throw new Error("Composer apply cancelled");}
      const atoms = group.atomIds.map(id => byId.get(id)).filter((atom): atom is ChangeAtom => Boolean(atom));
      await applyPatch(tempWorktree, combinedPatch(atoms), false);
      await runGit(tempWorktree, ["commit", "--no-gpg-sign", "-m", group.message]);
      commits.push((await runGit(tempWorktree, ["rev-parse", "HEAD"])).trim());
    }
    if (!await snapshotMatches(changeSet)) {throw new Error("Worktree or index became stale while Composer was preparing commits");}
    const newHead = commits.at(-1) ?? changeSet.snapshot.head;
    await runGit(changeSet.repositoryRoot, ["update-ref", branchRef, newHead, changeSet.snapshot.head]);
    refUpdated = true;
    await runGit(changeSet.repositoryRoot, ["read-tree", newHead]);
    const excludedStaged = changeSet.atoms.filter(atom => atom.origin === "staged" && plan.excludedAtomIds.includes(atom.id));
    if (excludedStaged.length) {await applyPatch(changeSet.repositoryRoot, combinedPatch(excludedStaged), true);}
    return { commits, branch: changeSet.snapshot.branch, recovery };
  } catch (error) {
    if (refUpdated) {
      const newHead = commits.at(-1);
      try { await runGit(changeSet.repositoryRoot, ["update-ref", branchRef, changeSet.snapshot.head, ...(newHead ? [newHead] : [])]); recovery.push("Restored original branch ref"); }
      catch (rollbackError) { recovery.push(`Branch ref needs manual recovery: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`); }
    }
    try { await copyFile(backupIndex, indexPath); recovery.push("Restored byte-equivalent original index"); }
    catch (rollbackError) { recovery.push(`Index backup remains at ${backupIndex}: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`); }
    const detail = recovery.length ? ` Recovery: ${recovery.join("; ")}.` : "";
    throw new Error(`${error instanceof Error ? error.message : String(error)}.${detail}`);
  } finally {
    try { await runGit(changeSet.repositoryRoot, ["worktree", "remove", "--force", tempWorktree]); } catch { /* recovery detail is available from git worktree list */ }
    await rm(tempWorktree, { recursive: true, force: true });
    if (!recovery.some(item => item.includes("backup remains"))) {await rm(backupDirectory, { recursive: true, force: true });}
  }
}

export async function indexBytes(repositoryRoot: string): Promise<Buffer> {
  const indexPath = path.resolve(repositoryRoot, (await runGit(repositoryRoot, ["rev-parse", "--git-path", "index"])).trim());
  return readFile(indexPath);
}

