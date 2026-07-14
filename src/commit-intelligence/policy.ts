import { readFile } from "fs/promises";
import * as path from "path";

export type SubjectCase = "lower-case" | "sentence-case" | "start-case" | "pascal-case" | "upper-case" | "kebab-case";

export interface CommitPolicy {
  version: 1;
  allowedTypes?: string[];
  allowedScopes?: string[];
  scopeRequired?: boolean;
  subjectCase?: SubjectCase | SubjectCase[];
  subjectMaxLength?: number;
  bodyMaxLineLength?: number;
  footerMaxLineLength?: number;
  bodyMaxLines?: number;
  targetLanguage?: string;
  ticketPattern?: string;
  ticketRequired?: boolean;
  allowedTrailers?: string[];
  deniedTrailers?: string[];
  reviewBlockingThreshold?: "off" | "warning" | "error";
}

export interface PolicySource {
  policy: Partial<CommitPolicy>;
  source: "gitmind" | "commitlint" | "workspace" | "user";
}

const SAFE_COMMITLINT_RULES = new Set([
  "type-enum", "scope-enum", "scope-empty", "header-max-length", "subject-case", "body-max-line-length", "footer-max-line-length"
]);

function asRule(config: unknown, name: string): unknown[] | undefined {
  if (!config || typeof config !== "object") {return undefined;}
  const rules = (config as { rules?: Record<string, unknown> }).rules;
  const rule = rules?.[name];
  return Array.isArray(rule) && Number(rule[0]) > 0 ? rule : undefined;
}

export function importCommitlint(config: unknown): Partial<CommitPolicy> {
  const policy: Partial<CommitPolicy> = {};
  for (const name of SAFE_COMMITLINT_RULES) {
    const rule = asRule(config, name);
    if (!rule) {continue;}
    switch (name) {
      case "type-enum": if (Array.isArray(rule[2])) {policy.allowedTypes = rule[2].map(String);} break;
      case "scope-enum": if (Array.isArray(rule[2])) {policy.allowedScopes = rule[2].map(String);} break;
      case "scope-empty": policy.scopeRequired = rule[1] === "never"; break;
      case "header-max-length": policy.subjectMaxLength = Number(rule[2]); break;
      case "subject-case": policy.subjectCase = (Array.isArray(rule[2]) ? rule[2] : [rule[2]]).map(String) as SubjectCase[]; break;
      case "body-max-line-length": policy.bodyMaxLineLength = Number(rule[2]); break;
      case "footer-max-line-length": policy.footerMaxLineLength = Number(rule[2]); break;
    }
  }
  return policy;
}

async function readJson(file: string): Promise<unknown | undefined> {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return undefined; }
}

function validatePolicy(value: unknown): Partial<CommitPolicy> {
  if (!value || typeof value !== "object") {return {};}
  const input = value as Record<string, unknown>;
  if (input.version !== undefined && input.version !== 1) {throw new Error("Unsupported .gitmind commit policy version");}
  const result = { ...input, version: 1 } as Partial<CommitPolicy>;
  if (result.ticketPattern) { try { new RegExp(result.ticketPattern); } catch { throw new Error("Invalid ticketPattern in GitMind policy"); } }
  return result;
}

export function mergePolicy(sources: readonly PolicySource[]): CommitPolicy {
  const result: CommitPolicy = { version: 1, subjectMaxLength: 72, reviewBlockingThreshold: "off" };
  const rank = { user: 0, workspace: 1, commitlint: 2, gitmind: 3 } as const;
  [...sources].sort((a, b) => rank[a.source] - rank[b.source]).forEach(source => Object.assign(result, source.policy));
  return result;
}

export async function loadRepositoryPolicy(repositoryRoot: string, workspace: Partial<CommitPolicy> = {}, user: Partial<CommitPolicy> = {}): Promise<CommitPolicy> {
  const gitmind = validatePolicy(await readJson(path.join(repositoryRoot, ".gitmind", "commit-policy.json")));
  const packageJson = await readJson(path.join(repositoryRoot, "package.json")) as { commitlint?: unknown } | undefined;
  const rc = await readJson(path.join(repositoryRoot, ".commitlintrc")) ?? await readJson(path.join(repositoryRoot, ".commitlintrc.json"));
  const commitlint = importCommitlint(rc ?? packageJson?.commitlint);
  return mergePolicy([{ source: "user", policy: user }, { source: "workspace", policy: workspace }, { source: "commitlint", policy: commitlint }, { source: "gitmind", policy: gitmind }]);
}

