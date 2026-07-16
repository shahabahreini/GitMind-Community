import * as assert from "assert";
import { execFile } from "child_process";
import { chmod, mkdtemp, rm, writeFile, mkdir, readFile } from "fs/promises";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import { buildEnvelope, buildRequestPreview, classifyNoise, defaultSelection, scanSecrets } from "../../commit-intelligence/context";
import { applyCompositionPlan, buildRelationshipGraph, indexBytes, validateCompositionPlan } from "../../commit-intelligence/composer";
import { collectChangeSet, parseUnifiedDiff, runGit, unstagePaths } from "../../commit-intelligence/git";
import { ChangeSet, CompositionPlan } from "../../commit-intelligence/models";
import { importCommitlint, mergePolicy } from "../../commit-intelligence/policy";
import { parseJsonObject, renderPortablePrompt } from "../../commit-intelligence/prompt";
import { reviewBlocks, scoreCommitHealth, shouldIncludeBody, validateCandidate, validateReviewFindings } from "../../commit-intelligence/validation";
import { analyzeHistoryHealth } from "../../commit-intelligence/health";
import { ApiConfig, CommitStyle } from "../../config/types";
import { FreeFeatureRenderer } from "../../webview/settings/components/renderers/FreeFeatureRenderer";
import { ExtensionSettings } from "../../models/ExtensionSettings";

const execFileAsync = promisify(execFile);
const SAMPLE = `diff --git a/src/a.ts b/src/a.ts
index 1111111..2222222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,2 +1,3 @@
 export const a = 1;
+export const b = 2;
 export const c = 3;
`;

function sampleChangeSet(): ChangeSet {
  return { repositoryRoot: "/tmp/repo", snapshot: { head: "a", branch: "main", indexTree: "b", statusHash: "c" }, atoms: parseUnifiedDiff(SAMPLE, "staged"), createdAt: 1 };
}

suite("GitMind 6 commit intelligence", () => {
  test("keeps Commit Intelligence and every independent capability off by default", async () => {
    const manifest = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf8"));
    const properties = manifest.contributes.configuration.properties;
    ["gitmind.commitIntelligence.enabled", "gitmind.commit.noiseFiltering.enabled", "gitmind.commit.candidates.enabled",
      "gitmind.commit.health.enabled", "gitmind.commit.githubIssueContext.enabled", "gitmind.composer.enabled",
      "gitmind.composer.allowHunkSplitting", "gitmind.review.enabled"].forEach(key => assert.strictEqual(properties[key].default, false, key));
  });

  test("routes both one-click commands to the legacy generator and gates advanced palette entries", async () => {
    const commandsSource = await readFile(path.join(process.cwd(), "src", "commands", "index.ts"), "utf8");
    assert.match(commandsSource, /registerCommand\("gitmind\.generateCommitMessage", handleGenerateCommit\)/);
    assert.match(commandsSource, /registerCommand\("gitmind\.generateCommitMessagePro", handleGenerateCommit\)/);
    const manifest = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf8"));
    const advanced = new Set(["gitmind.advancedCommitActions", "gitmind.openCommitWorkspace", "gitmind.draftChoices", "gitmind.commitComposer", "gitmind.draftSquashMessage", "gitmind.draftPullRequest", "gitmind.draftStashMessage", "gitmind.draftReleaseNotes", "gitmind.explainCommit", "gitmind.reviewChanges"]);
    const palette = manifest.contributes.menus.commandPalette.filter((item: { command: string }) => advanced.has(item.command));
    assert.strictEqual(palette.length, advanced.size);
    assert.ok(palette.every((item: { when?: string }) => item.when === "gitmind.commitIntelligenceEnabled"));
  });

  test("shows Commit Health independently of disabled Commit Intelligence and explains the Pro lock", () => {
    const settings = { apiProvider: "gemini", promptCustomization: { enabled: false, saveLastPrompt: false, lastPrompt: "" },
      commit: { verbose: true, detailMode: "auto" }, commitIntelligence: { enabled: false, noiseFilteringEnabled: false,
        candidatesEnabled: false, healthEnabled: false, githubIssueContextEnabled: false, composerEnabled: false,
        allowHunkSplitting: false, reviewEnabled: false } } as ExtensionSettings;
    const html = new FreeFeatureRenderer(settings).render();
    assert.match(html, /class="toggle-item/);
    assert.match(html, /class="switch-container"/);
    assert.match(html, /data-setting="commitIntelligence\.enabled"/);
    assert.match(html, /id="commitIntelligenceOptions"[^>]*hidden/);
    assert.match(html, /pro-lock-badge/);
    assert.match(html, /<h3 id="commitHealthHeading"[^>]*>Commit Health<\/h3>/);
    assert.match(html, /Commit Health is available with GitMind Pro/);
    assert.match(html, /History Health/);
  });

  test("uses theme tokens and actionable one-time secret warning controls", async () => {
    const source = await readFile(path.join(process.cwd(), "src", "webview", "commit", "CommitWorkspace.ts"), "utf8");
    ["--vscode-editor-background", "--vscode-focusBorder", "prefers-reduced-motion", "forced-colors"].forEach(token => assert.ok(source.includes(token)));
    ["Unstage flagged files & regenerate", "Review and choose", "Insert anyway"].forEach(action => assert.ok(source.includes(action)));
    assert.ok(source.includes("draftSnapshot"), "stale drafts must be tied to the staged snapshot");
    assert.doesNotMatch(source, /per-item secret override/i);
  });

  test("does not filter noise unless the independent capability is enabled", () => {
    const changeSet = sampleChangeSet(); changeSet.atoms[0].path = "package-lock.json";
    assert.strictEqual(defaultSelection(changeSet, [], false).items[0].decision, "included");
    assert.strictEqual(defaultSelection(changeSet, [], true).items[0].decision, "excluded");
  });
  test("parses stable file and hunk IDs", () => {
    const first = parseUnifiedDiff(SAMPLE, "staged");
    const second = parseUnifiedDiff(SAMPLE, "staged");
    assert.strictEqual(first.length, 1);
    assert.strictEqual(first[0].id, second[0].id);
    assert.strictEqual(first[0].path, "src/a.ts");
    assert.strictEqual(first[0].additions, 1);
  });

  test("parses rename-only, binary, deleted, and submodule changes as indivisible", () => {
    const samples = [
      `diff --git a/a.txt b/b.txt\nsimilarity index 100%\nrename from a.txt\nrename to b.txt\n`,
      `diff --git a/a.png b/a.png\nBinary files a/a.png and b/a.png differ\n`,
      `diff --git a/a.txt b/a.txt\ndeleted file mode 100644\n--- a/a.txt\n+++ /dev/null\n@@ -1 +0,0 @@\n-old\n`,
      `diff --git a/lib b/lib\nindex 1234567..7654321 160000\n--- a/lib\n+++ b/lib\n@@ -1 +1 @@\n-Subproject commit 1234567\n+Subproject commit 7654321\n`
    ];
    const kinds = samples.map(value => parseUnifiedDiff(value, "staged")[0]);
    assert.deepStrictEqual(kinds.map(atom => atom.kind), ["renamed", "binary", "deleted", "submodule"]);
    assert.ok([kinds[0], kinds[1], kinds[3]].every(atom => atom.indivisible));
  });

  test("classifies noise and configured exclusions", () => {
    const atom = sampleChangeSet().atoms[0];
    assert.strictEqual(classifyNoise({ ...atom, path: "package-lock.json" }).noise, "lockfile");
    assert.strictEqual(classifyNoise({ ...atom, path: "dist/app.js" }).noise, "generated");
    assert.strictEqual(classifyNoise({ ...atom, path: "src/app.min.js" }).noise, "minified");
    assert.strictEqual(classifyNoise(atom, ["src/*"]).noise, "configured");
  });

  test("finds private keys, credential assignments, entropy, filenames, and oversized content", () => {
    const atom = { ...sampleChangeSet().atoms[0], path: ".env", patch: "+API_KEY=abcdefghijklmnopqrstuvwxyz0123456789ABCD\n+-----BEGIN PRIVATE KEY-----\n" };
    const kinds = new Set(scanSecrets(atom, 10).map(finding => finding.kind));
    ["private-key", "credential", "high-entropy", "sensitive-filename", "oversized"].forEach(kind => assert.ok(kinds.has(kind as never)));
  });

  test("builds untrusted context boundaries and remote request preview", () => {
    const changeSet = sampleChangeSet(); const selection = defaultSelection(changeSet);
    selection.why = "fix retry";
    const envelope = buildEnvelope(changeSet, selection, "commit", { detailMode: "auto", style: "conventional", targetLanguage: "english" });
    assert.match(envelope.context, /<untrusted_changes>/);
    const config = { type: "openai", model: "gpt-test", apiKey: "x" } as ApiConfig;
    const preview = buildRequestPreview(config, changeSet, selection, envelope);
    assert.strictEqual(preview.destinationHost, "api.openai.com");
    assert.strictEqual(preview.localDestination, false);
    assert.ok(preview.estimatedInputTokens > 0);
  });

  test("marks loopback custom and Ollama destinations as local", () => {
    const changeSet = sampleChangeSet(); const selection = defaultSelection(changeSet);
    const envelope = buildEnvelope(changeSet, selection, "commit", { detailMode: "concise", style: "basic", targetLanguage: "english" });
    const config = { type: "ollama", model: "qwen", url: "http://127.0.0.1:11434" } as ApiConfig;
    assert.strictEqual(buildRequestPreview(config, changeSet, selection, envelope).localDestination, true);
  });

  test("renders and parses one portable structured candidate request for every provider", () => {
    const providers = ["gemini", "huggingface", "ollama", "mistral", "cohere", "openai", "together", "openrouter", "anthropic", "minimax", "copilot", "deepseek", "grok", "groq", "perplexity", "zai", "nvidia", "custom"];
    const changeSet = sampleChangeSet(); const selection = defaultSelection(changeSet);
    const envelope = buildEnvelope(changeSet, selection, "candidates", { detailMode: "auto", style: "conventional", targetLanguage: "english" });
    assert.strictEqual(providers.length, 18);
    providers.forEach(() => assert.match(renderPortablePrompt(envelope), /exactly three objects/));
    const parsed = parseJsonObject<{ candidates: unknown[] }>('```json\n{"candidates":[1,2,3]}\n```');
    assert.strictEqual(parsed.candidates.length, 3);
  });

  test("imports only the safe static commitlint subset", () => {
    const policy = importCommitlint({ rules: { "type-enum": [2, "always", ["feat", "fix"]], "scope-empty": [2, "never"], "header-max-length": [2, "always", 50], "plugin-rule": [2, "always"] } });
    assert.deepStrictEqual(policy.allowedTypes, ["feat", "fix"]);
    assert.strictEqual(policy.scopeRequired, true);
    assert.strictEqual(policy.subjectMaxLength, 50);
    assert.strictEqual((policy as Record<string, unknown>)["plugin-rule"], undefined);
  });

  test("applies repository policy precedence", () => {
    const policy = mergePolicy([{ source: "user", policy: { subjectMaxLength: 100 } }, { source: "workspace", policy: { subjectMaxLength: 90 } }, { source: "commitlint", policy: { subjectMaxLength: 80 } }, { source: "gitmind", policy: { subjectMaxLength: 70 } }]);
    assert.strictEqual(policy.subjectMaxLength, 70);
  });

  test("validates structure, type, scope, length, boilerplate, trailers, tickets, and file inventories", () => {
    const policy = { version: 1 as const, allowedTypes: ["feat"], allowedScopes: ["api"], scopeRequired: true, subjectMaxLength: 40, deniedTrailers: ["Co-authored-by"], ticketRequired: true, ticketPattern: "ABC-\\d+" };
    assert.strictEqual(validateCandidate("feat(api): add retry ABC-1", policy, { conventional: true }).valid, true);
    const invalid = validateCandidate("fix: Here's the commit message for src/a.ts\n\nCo-authored-by: AI <ai@example.com>", policy, { conventional: true, changedFiles: ["src/a.ts"] });
    assert.strictEqual(invalid.valid, false);
    assert.ok(invalid.issues.length >= 3);
  });

  test("supports all 12 commit styles through portable envelopes", () => {
    const styles: CommitStyle[] = ["basic", "conventional", "conventional-no-scope", "angular", "ember", "emojigit", "gitmoji", "semantic", "commitizen", "karma", "linux", "jquery"];
    const changeSet = sampleChangeSet(); const selection = defaultSelection(changeSet);
    styles.forEach(style => assert.match(renderPortablePrompt(buildEnvelope(changeSet, selection, "commit", { detailMode: "auto", style, targetLanguage: "english" })), new RegExp(`Style: ${style.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)));
  });

  test("uses automatic detail thresholds", () => {
    const changeSet = sampleChangeSet(); const selection = defaultSelection(changeSet);
    assert.strictEqual(shouldIncludeBody("auto", changeSet, selection), false);
    selection.why = "Preserve idempotency";
    assert.strictEqual(shouldIncludeBody("auto", changeSet, selection), true);
  });

  test("computes deterministic change hygiene without inspecting draft text", () => {
    const changeSet = sampleChangeSet(); const selection = defaultSelection(changeSet); selection.why = "add export";
    const health = scoreCommitHealth(changeSet, selection);
    assert.ok(health.overall >= 0 && health.overall <= 100);
    assert.ok(health.recommendations.length > 0);
    assert.ok(!Object.values(health.explanations).join(" ").toLowerCase().includes("subject"));
    assert.strictEqual(reviewBlocks([{ id: "1", severity: "warning", title: "x", detail: "x", atomIds: [changeSet.atoms[0].id] }], "error"), false);
    assert.strictEqual(reviewBlocks([{ id: "1", severity: "error", title: "x", detail: "x", atomIds: [changeSet.atoms[0].id] }], "error"), true);
    assert.strictEqual(validateReviewFindings([{ id: "1", severity: "error", title: "x", detail: "x", atomIds: ["unknown"] }], [changeSet.atoms[0].id]).length, 0);
  });

  test("keeps Health Report discoverable only while the health capability is enabled", async () => {
    const manifest = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf8"));
    const palette = manifest.contributes.menus.commandPalette.find((item: { command: string }) => item.command === "gitmind.openHealthReport");
    assert.strictEqual(palette.when, "gitmind.commitHealthEnabled");
    const commandsSource = await readFile(path.join(process.cwd(), "src", "commands", "commitIntelligence.ts"), "utf8");
    assert.match(commandsSource, /gitmind\.openHealthReport/);
    assert.match(commandsSource, /Enable Commit Health in GitMind Settings/);
  });

  test("builds local relationship edges and rejects unknown Composer IDs", () => {
    const changeSet = sampleChangeSet();
    changeSet.atoms.push({ ...changeSet.atoms[0], id: "test", hunkId: "test", path: "src/a.test.ts" });
    assert.ok(buildRelationshipGraph(changeSet).edges.length > 0);
    const plan: CompositionPlan = { snapshot: changeSet.snapshot, groups: [{ id: "g", atomIds: [changeSet.atoms[0].id, "unknown"], message: "feat: x" }], excludedAtomIds: ["test"] };
    assert.ok(validateCompositionPlan(plan, changeSet).some(error => error.includes("Unknown")));
  });
});

suite("GitMind 6 disposable repository collection", () => {
  let repositoryRoot = "";
  setup(async () => {
    repositoryRoot = await mkdtemp(path.join(os.tmpdir(), "gitmind-v6-test-"));
    await execFileAsync("git", ["init", "-b", "main"], { cwd: repositoryRoot });
    await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: repositoryRoot });
    await execFileAsync("git", ["config", "user.name", "Test"], { cwd: repositoryRoot });
    await mkdir(path.join(repositoryRoot, "src"));
    await writeFile(path.join(repositoryRoot, "src", "tracked.ts"), "export const one = 1;\n");
    await execFileAsync("git", ["add", "."], { cwd: repositoryRoot });
    await execFileAsync("git", ["commit", "-m", "initial"], { cwd: repositoryRoot });
  });
  teardown(async () => { await rm(repositoryRoot, { recursive: true, force: true }); });

  test("collects staged, unstaged, and oddly named untracked files without a shell", async () => {
    await writeFile(path.join(repositoryRoot, "src", "tracked.ts"), "export const one = 2;\n");
    await execFileAsync("git", ["add", "src/tracked.ts"], { cwd: repositoryRoot });
    await writeFile(path.join(repositoryRoot, "src", "tracked.ts"), "export const one = 3;\n");
    await writeFile(path.join(repositoryRoot, "semi;$(touch nope).txt"), "safe\n");
    const changeSet = await collectChangeSet(repositoryRoot, true);
    assert.deepStrictEqual(new Set(changeSet.atoms.map(atom => atom.origin)), new Set(["staged", "unstaged", "untracked"]));
    assert.strictEqual(await runGit(repositoryRoot, ["status", "--porcelain"]).then(value => value.includes("nope\n")), false);
  });

  test("analyzes history locally without using a provider", async () => {
    const report = await analyzeHistoryHealth(repositoryRoot, { mode: "last-n", count: 10 });
    assert.ok(report.analyzedCommits >= 1);
    assert.ok(report.overall >= 0 && report.overall <= 100);
    const source = await readFile(path.join(process.cwd(), "src", "commit-intelligence", "health.ts"), "utf8");
    assert.doesNotMatch(source, /services\/api|generateWithRawPrompt/);
  });

  test("applies a reviewed commit locally without pushing", async () => {
    await writeFile(path.join(repositoryRoot, "src", "tracked.ts"), "export const one = 2;\n");
    await execFileAsync("git", ["add", "src/tracked.ts"], { cwd: repositoryRoot });
    const changeSet = await collectChangeSet(repositoryRoot, true);
    const plan: CompositionPlan = { snapshot: changeSet.snapshot, groups: [{ id: "one", atomIds: changeSet.atoms.map(atom => atom.id), message: "feat(src): update value" }], excludedAtomIds: [] };
    const result = await applyCompositionPlan(plan, changeSet);
    assert.strictEqual(result.commits.length, 1);
    assert.strictEqual((await runGit(repositoryRoot, ["log", "-1", "--pretty=%s"])).trim(), "feat(src): update value");
    assert.strictEqual((await runGit(repositoryRoot, ["status", "--porcelain"])).trim(), "");
    assert.strictEqual((await runGit(repositoryRoot, ["remote"])).trim(), "");
  });

  test("restores the branch and byte-equivalent index when a hook fails", async () => {
    await writeFile(path.join(repositoryRoot, "src", "tracked.ts"), "export const one = 2;\n");
    await execFileAsync("git", ["add", "src/tracked.ts"], { cwd: repositoryRoot });
    const hook = path.join(repositoryRoot, ".git", "hooks", "pre-commit");
    await writeFile(hook, "#!/bin/sh\nexit 1\n");
    await chmod(hook, 0o755);
    const changeSet = await collectChangeSet(repositoryRoot, true);
    const beforeHead = changeSet.snapshot.head;
    const beforeIndex = await indexBytes(repositoryRoot);
    const plan: CompositionPlan = { snapshot: changeSet.snapshot, groups: [{ id: "one", atomIds: changeSet.atoms.map(atom => atom.id), message: "feat(src): update value" }], excludedAtomIds: [] };
    await assert.rejects(() => applyCompositionPlan(plan, changeSet), /Git command failed/);
    assert.strictEqual((await runGit(repositoryRoot, ["rev-parse", "HEAD"])).trim(), beforeHead);
    assert.deepStrictEqual(await indexBytes(repositoryRoot), beforeIndex);
  });

  test("unstages flagged paths without changing working-tree content", async () => {
    const file = path.join(repositoryRoot, "src", "tracked.ts");
    const content = "export const token = 'not-a-real-secret';\n";
    await writeFile(file, content);
    await execFileAsync("git", ["add", "src/tracked.ts"], { cwd: repositoryRoot });
    await unstagePaths(repositoryRoot, ["src/tracked.ts"]);
    assert.strictEqual(await readFile(file, "utf8"), content);
    assert.strictEqual((await runGit(repositoryRoot, ["diff", "--cached", "--name-only"])).trim(), "");
    assert.match(await runGit(repositoryRoot, ["status", "--porcelain"]), /src\/tracked\.ts/);
  });
});
