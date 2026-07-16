import { ChangeAtom, ChangeSet, HistoryHealthReport, HealthScore } from "./models";
import { collectChangeSet, runGit } from "./git";
import { scoreCommitHealth } from "./validation";

export type HistoryHealthOptions = { mode: "last-n"; count: number } | { mode: "date-range"; start: string; end: string };

const lastScans = new Map<string, { score: HealthScore; scannedAt: number }>();

export async function analyzeCurrentHealth(repositoryRoot: string): Promise<HealthScore> {
  const score = scoreCommitHealth(await collectChangeSet(repositoryRoot, false));
  recordHealthScan(repositoryRoot, score);
  return score;
}

export function recordHealthScan(repositoryRoot: string, score: HealthScore): void {
  lastScans.set(repositoryRoot, { score, scannedAt: Date.now() });
}

export function getLastHealthScan(repositoryRoot: string): { score: HealthScore; scannedAt: number } | undefined {
  return lastScans.get(repositoryRoot);
}

function atom(path: string, additions: number, deletions: number): ChangeAtom {
  return { id: path, fileId: path, path, origin: "staged", kind: "modified", header: "committed file", patch: "", additions, deletions, indivisible: true, noise: "none" };
}

export async function analyzeHistoryHealth(repositoryRoot: string, options: HistoryHealthOptions): Promise<HistoryHealthReport> {
  const args = ["log", "--format=%H%x1f%ct%x1e", "--numstat"];
  if (options.mode === "last-n") {args.push(`--max-count=${Math.max(1, Math.min(options.count, 500))}`);}
  else {args.push(`--since=${options.start}`, `--until=${options.end}`);}
  const raw = await runGit(repositoryRoot, args);
  const scores = raw.split("\x1e").map(block => block.trim()).filter(Boolean).map(block => {
    const [header, ...rows] = block.split("\n");
    const [hash, timestamp] = header.split("\x1f");
    const atoms = rows.map(row => row.split("\t")).filter(row => row.length >= 3).map(([added, deleted, file]) => atom(file, Number(added) || 0, Number(deleted) || 0));
    const changeSet: ChangeSet = { repositoryRoot, snapshot: { head: hash, indexTree: hash, statusHash: hash }, atoms, createdAt: Number(timestamp) * 1000 };
    return { hash, timestamp: Number(timestamp) * 1000, score: scoreCommitHealth(changeSet) };
  });
  const overall = scores.length ? Math.round(scores.reduce((sum, entry) => sum + entry.score.overall, 0) / scores.length) : 0;
  const recommendations = [...new Set(scores.flatMap(entry => entry.score.recommendations))].slice(0, 4);
  return { mode: options.mode, analyzedCommits: scores.length, overall, latestCommitAt: scores[0]?.timestamp, recommendations: recommendations.length ? recommendations : ["No commits matched this range."], scores };
}
