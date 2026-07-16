import { ApiProvider, CommitStyle, TargetCommitLanguage } from "../config/types";

export type ChangeOrigin = "staged" | "unstaged" | "untracked";
export type ChangeKind = "modified" | "added" | "deleted" | "renamed" | "binary" | "submodule";
export type NoiseKind = "none" | "formatting" | "generated" | "lockfile" | "binary" | "minified" | "configured";
export type SelectionDecision = "included" | "summarized" | "excluded";

export interface ChangeAtom {
  id: string;
  fileId: string;
  hunkId?: string;
  path: string;
  oldPath?: string;
  origin: ChangeOrigin;
  kind: ChangeKind;
  header: string;
  patch: string;
  oldStart?: number;
  oldLines?: number;
  newStart?: number;
  newLines?: number;
  additions: number;
  deletions: number;
  indivisible: boolean;
  noise: NoiseKind;
  noiseReason?: string;
}

export interface RepositorySnapshot {
  head: string;
  branch?: string;
  indexTree: string;
  statusHash: string;
}

export interface ChangeSet {
  repositoryRoot: string;
  snapshot: RepositorySnapshot;
  atoms: ChangeAtom[];
  createdAt: number;
}

export interface ContextItemSelection {
  atomId: string;
  decision: SelectionDecision;
  reason?: string;
  secretOverride?: boolean;
}

export interface ContextSelection {
  items: ContextItemSelection[];
  why?: string;
  issueReference?: string;
  issueSummary?: string;
  userNotes?: string;
  branchName?: string;
  historySummary?: string;
  sessionNotes?: string;
}

export type SecretKind = "private-key" | "credential" | "high-entropy" | "sensitive-filename" | "oversized";

export interface SecretFinding {
  atomId: string;
  kind: SecretKind;
  label: string;
  line?: number;
}

export interface RequestPreview {
  provider: ApiProvider;
  model: string;
  destinationHost: string;
  localDestination: boolean;
  categories: string[];
  includedFiles: string[];
  summarizedFiles: string[];
  excludedFiles: string[];
  filteringDecisions: Array<{ atomId: string; decision: SelectionDecision; reason?: string }>;
  secretFindings: SecretFinding[];
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}

export type GenerationKind = "commit" | "candidates" | "composer" | "repair" | "review" |
  "squash" | "pull-request" | "stash" | "release-notes" | "explanation";

export interface GenerationEnvelope {
  version: 1;
  kind: GenerationKind;
  detailMode: "auto" | "concise" | "detailed";
  style: CommitStyle;
  targetLanguage: TargetCommitLanguage;
  context: string;
  knownAtomIds: string[];
  intent?: string;
  issue?: string;
  notes?: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: "warning" | "error";
  line?: number;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  normalized: string;
}

export interface HealthSubscores {
  scope: number;
  changeSize: number;
  safety: number;
  testCoverage: number;
  staging: number;
}

export interface HealthScore {
  overall: number;
  subscores: HealthSubscores;
  explanations: Record<keyof HealthSubscores, string>;
  recommendations: string[];
}

export interface HistoryHealthReport {
  mode: "last-n" | "date-range";
  analyzedCommits: number;
  overall: number;
  latestCommitAt?: number;
  recommendations: string[];
  scores: Array<{ hash: string; timestamp: number; score: HealthScore }>;
}

export interface CompositionGroup {
  id: string;
  atomIds: string[];
  message: string;
}

export interface CompositionPlan {
  snapshot: RepositorySnapshot;
  groups: CompositionGroup[];
  excludedAtomIds: string[];
}

export interface ReviewFinding {
  id: string;
  severity: "info" | "warning" | "error";
  title: string;
  detail: string;
  atomIds: string[];
}
