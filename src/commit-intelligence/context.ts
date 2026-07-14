import * as path from "path";
import { createHash } from "crypto";
import { ApiConfig } from "../config/types";
import { ChangeAtom, ChangeSet, ContextSelection, GenerationEnvelope, GenerationKind, NoiseKind, RequestPreview, SecretFinding } from "./models";

const LOCK_NAMES = /(?:^|\/)(?:package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.ya?ml|bun\.lockb?|Cargo\.lock|composer\.lock|Gemfile\.lock)$/i;
const GENERATED = /(?:^|\/)(?:dist|build|coverage|vendor|generated|\.next|out)\//i;
const MINIFIED = /\.min\.(?:js|css)$/i;
const SENSITIVE_NAME = /(?:^|\/)(?:\.env(?:\..+)?|id_(?:rsa|dsa|ecdsa|ed25519)|credentials?|secrets?|.*\.pem|.*\.p12|.*\.key)$/i;

function globToRegex(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "§§").replace(/\*/g, "[^/]*").replace(/§§/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

export function classifyNoise(atom: ChangeAtom, exclusions: readonly string[] = []): { noise: NoiseKind; reason?: string } {
  if (atom.kind === "binary") {return { noise: "binary", reason: "Binary content is summarized without bytes" };}
  if (exclusions.some(pattern => globToRegex(pattern).test(atom.path))) {return { noise: "configured", reason: "Matches a configured exclusion" };}
  if (LOCK_NAMES.test(atom.path)) {return { noise: "lockfile", reason: "Dependency lockfile" };}
  if (MINIFIED.test(atom.path)) {return { noise: "minified", reason: "Minified artifact" };}
  if (GENERATED.test(atom.path) || /generated (?:file|code)|do not edit/i.test(atom.patch.slice(0, 2000))) {return { noise: "generated", reason: "Generated artifact" };}
  const changed = atom.patch.split("\n").filter(line => /^[+-](?![+-])/.test(line)).map(line => line.slice(1));
  if (changed.length > 0 && changed.every(line => line.replace(/\s+/g, "") === "" || /^[{}()[\],;]+$/.test(line.trim()))) {
    return { noise: "formatting", reason: "Whitespace or punctuation-only hunk" };
  }
  return { noise: "none" };
}

function entropy(value: string): number {
  const counts = new Map<string, number>();
  for (const char of value) {counts.set(char, (counts.get(char) ?? 0) + 1);}
  let result = 0;
  for (const count of counts.values()) { const p = count / value.length; result -= p * Math.log2(p); }
  return result;
}

export function scanSecrets(atom: ChangeAtom, maxCharacters = 120_000): SecretFinding[] {
  const findings: SecretFinding[] = [];
  if (SENSITIVE_NAME.test(atom.path)) {findings.push({ atomId: atom.id, kind: "sensitive-filename", label: "Sensitive filename" });}
  if (atom.patch.length > maxCharacters) {findings.push({ atomId: atom.id, kind: "oversized", label: "Oversized content" });}
  const lines = atom.patch.split("\n");
  let newLine: number | undefined;
  lines.forEach((line, index) => {
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)/.exec(line);
    if (hunk) { newLine = Number(hunk[1]); return; }
    const isAddition = line.startsWith("+") && !line.startsWith("+++");
    const reportedLine = newLine ?? index + 1;
    if (!isAddition) { if (!line.startsWith("-") && newLine !== undefined) {newLine++;} return; }
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(line)) {findings.push({ atomId: atom.id, kind: "private-key", label: "Private key marker", line: reportedLine });}
    if (/(?:api[_-]?key|secret|password|token|authorization)\s*[:=]\s*["']?[^\s"']{8,}/i.test(line)) {findings.push({ atomId: atom.id, kind: "credential", label: "Credential-like assignment", line: reportedLine });}
    for (const match of line.matchAll(/[A-Za-z0-9+/_=-]{32,}/g)) {
      if (entropy(match[0]) >= 4.2) {findings.push({ atomId: atom.id, kind: "high-entropy", label: "High-entropy value", line: reportedLine });}
    }
    if (newLine !== undefined) {newLine++;}
  });
  return findings.filter((finding, index, all) => all.findIndex(other => other.atomId === finding.atomId && other.kind === finding.kind && other.line === finding.line) === index);
}

export function defaultSelection(changeSet: ChangeSet, exclusions: readonly string[] = [], noiseFiltering = true): ContextSelection {
  return { items: changeSet.atoms.map(atom => {
    if (!noiseFiltering) {
      atom.noise = "none";
      atom.noiseReason = undefined;
      return { atomId: atom.id, decision: "included" as const };
    }
    const classified = classifyNoise(atom, exclusions);
    atom.noise = classified.noise; atom.noiseReason = classified.reason;
    if (classified.noise === "generated") {atom.indivisible = true;}
    const decision = classified.noise === "none" ? "included" : classified.noise === "binary" ? "summarized" : "excluded";
    return { atomId: atom.id, decision, reason: classified.reason };
  }) };
}

function providerDestination(config: ApiConfig): string {
  const fixed: Record<string, string> = {
    gemini: "generativelanguage.googleapis.com", huggingface: "api-inference.huggingface.co", mistral: "api.mistral.ai",
    cohere: "api.cohere.com", openai: "api.openai.com", together: "api.together.xyz", openrouter: "openrouter.ai",
    anthropic: "api.anthropic.com", minimax: "api.minimax.chat", copilot: "GitHub Copilot language model service",
    deepseek: "api.deepseek.com", grok: "api.x.ai", groq: "api.groq.com", perplexity: "api.perplexity.ai",
    zai: "api.z.ai", nvidia: "integrate.api.nvidia.com"
  };
  if (config.type === "ollama") {return new URL(config.url).host;}
  if (config.type === "custom") { try { return new URL(config.baseUrl).host; } catch { return config.baseUrl || "custom endpoint"; } }
  return fixed[config.type] ?? config.type;
}

export function isLoopbackHost(host: string): boolean {
  const normalized = host.split(":")[0].replace(/^\[|\]$/g, "").toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function estimateTokens(value: string): number { return Math.max(1, Math.ceil(value.length / 4)); }

export function buildEnvelope(changeSet: ChangeSet, selection: ContextSelection, kind: GenerationKind, options: {
  detailMode: "auto" | "concise" | "detailed"; style: GenerationEnvelope["style"]; targetLanguage: GenerationEnvelope["targetLanguage"];
}): GenerationEnvelope {
  const decisions = new Map(selection.items.map(item => [item.atomId, item]));
  const included = changeSet.atoms.filter(atom => ["included", "summarized"].includes(decisions.get(atom.id)?.decision ?? "excluded"));
  const context = included.map(atom => {
    const item = decisions.get(atom.id);
    return item?.decision === "summarized"
      ? `<change id="${atom.id}" path="${atom.path}" mode="summary">${atom.kind}; +${atom.additions}/-${atom.deletions}</change>`
      : `<change id="${atom.id}" path="${atom.path}" origin="${atom.origin}">\n${atom.patch}\n</change>`;
  }).join("\n");
  return { version: 1, kind, detailMode: options.detailMode, style: options.style, targetLanguage: options.targetLanguage,
    context: `<untrusted_changes>\n${context}\n</untrusted_changes>`, knownAtomIds: included.map(atom => atom.id),
    intent: selection.why, issue: selection.issueSummary || selection.issueReference, notes: selection.userNotes };
}

export function buildRequestPreview(config: ApiConfig, changeSet: ChangeSet, selection: ContextSelection, envelope: GenerationEnvelope, outputTokens = 500): RequestPreview {
  const decisions = new Map(selection.items.map(item => [item.atomId, item]));
  const secretFindings = changeSet.atoms.flatMap(scanSecrets);
  const host = providerDestination(config);
  const files = (decision: string) => [...new Set(changeSet.atoms.filter(a => decisions.get(a.id)?.decision === decision).map(a => a.path))].sort();
  const categories = ["diffs", selection.why && "intent", selection.issueSummary && "issue", selection.branchName && "branch", selection.historySummary && "history", selection.userNotes && "notes"].filter((v): v is string => Boolean(v));
  return { provider: config.type, model: config.model, destinationHost: host, localDestination: isLoopbackHost(host), categories,
    includedFiles: files("included"), summarizedFiles: files("summarized"), excludedFiles: files("excluded"),
    filteringDecisions: selection.items.map(item => ({ atomId: item.atomId, decision: item.decision, reason: item.reason })),
    secretFindings, estimatedInputTokens: estimateTokens(JSON.stringify(envelope)), estimatedOutputTokens: outputTokens };
}

export function contextFingerprint(envelope: GenerationEnvelope): string {
  return createHash("sha256").update(JSON.stringify(envelope)).digest("hex");
}

export function displayPath(repositoryRoot: string, filePath: string): string { return path.relative(repositoryRoot, path.join(repositoryRoot, filePath)); }
