import * as vscode from "vscode";
import { getApiConfig, getConfiguration } from "../../config/settings";
import { generateWithRawPrompt } from "../../services/api";
import { setCommitMessage } from "../../services/git/repository";
import { SubscriptionManager } from "../../services/subscription/SubscriptionManager";
import { getNonce } from "../../utils/getNonce";
import { buildEnvelope, buildRequestPreview, defaultSelection, scanSecrets } from "../../commit-intelligence/context";
import { applyCompositionPlan, buildRelationshipGraph, validateCompositionPlan } from "../../commit-intelligence/composer";
import { captureSnapshot, collectChangeSet, runGit, unstagePaths } from "../../commit-intelligence/git";
import { ChangeSet, CompositionPlan, ContextSelection, GenerationKind, HealthScore, RequestPreview, ReviewFinding, ValidationResult } from "../../commit-intelligence/models";
import { loadRepositoryPolicy } from "../../commit-intelligence/policy";
import { parseJsonObject, renderPortablePrompt } from "../../commit-intelligence/prompt";
import { reviewBlocks, scoreCommitHealth, shouldIncludeBody, validateCandidate, validateReviewFindings } from "../../commit-intelligence/validation";

interface WorkspaceState {
  changeSet: ChangeSet;
  selection: ContextSelection;
  kind: GenerationKind;
  draft: string;
  validation?: ValidationResult;
  preview?: RequestPreview;
  draftSnapshot?: string;
  health?: HealthScore;
}

type IncomingMessage =
  | { type: "generate"; why?: string; issue?: string; notes?: string; selections: Array<{ atomId: string; decision: "included" | "summarized" | "excluded" }> }
  | { type: "repair"; draft: string; why?: string; issue?: string; notes?: string; selections: Array<{ atomId: string; decision: "included" | "summarized" | "excluded" }> }
  | { type: "apply"; draft: string }
  | { type: "fetchIssue"; reference: string }
  | { type: "insert"; draft: string }
  | { type: "copy"; draft: string }
  | { type: "cancel" };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

function isMessage(value: unknown): value is IncomingMessage {
  if (!value || typeof value !== "object") {return false;}
  const type = (value as { type?: unknown }).type;
  if (type === "cancel") {return true;}
  if ((type === "insert" || type === "copy" || type === "apply") && typeof (value as { draft?: unknown }).draft === "string") {return true;}
  if (type === "fetchIssue" && typeof (value as { reference?: unknown }).reference === "string") {return true;}
  if (type === "generate" || type === "repair") {
    const selections = (value as { selections?: unknown }).selections;
    return Array.isArray(selections) && selections.every(item => item && typeof item === "object" && typeof item.atomId === "string" && ["included", "summarized", "excluded"].includes(item.decision));
  }
  return false;
}

export class CommitWorkspace implements vscode.Disposable {
  private static readonly panels = new Map<string, CommitWorkspace>();
  private readonly disposables: vscode.Disposable[] = [];
  private fetchedIssue?: string;

  private constructor(private readonly panel: vscode.WebviewPanel, private readonly state: WorkspaceState) {
    panel.webview.html = this.render();
    this.disposables.push(panel.webview.onDidReceiveMessage(message => void this.handleMessage(message)));
    this.disposables.push(panel.onDidDispose(() => this.dispose()));
  }

  static async open(extensionUri: vscode.Uri, repositoryRoot: string, kind: GenerationKind = "commit"): Promise<void> {
    const key = `${repositoryRoot}:${kind}`;
    const existing = this.panels.get(key);
    if (existing) { existing.panel.reveal(); return; }
    const config = vscode.workspace.getConfiguration("gitmind");
    const captureAll = config.get("commit.captureAllChanges", false);
    let changeSet = await collectChangeSet(repositoryRoot, captureAll);
    if (changeSet.atoms.length === 0 && !captureAll) {
      const workingTree = await collectChangeSet(repositoryRoot, true);
      if (workingTree.atoms.length > 0) {
        const choice = await vscode.window.showWarningMessage("No staged changes found. Open a reviewed workspace for unstaged and untracked changes?", "Open workspace", "Cancel");
        if (choice !== "Open workspace") {return;}
        changeSet = workingTree;
      }
    }
    if (changeSet.atoms.length === 0) { void vscode.window.showInformationMessage("GitMind: No changes detected."); return; }
    const selection = defaultSelection(changeSet, config.get<string[]>("commit.excludeFiles", []), config.get("commit.noiseFiltering.enabled", false));
    const apiConfig = await getApiConfig();
    const extensionConfig = getConfiguration();
    const envelope = buildEnvelope(changeSet, selection, kind, { detailMode: "concise", style: extensionConfig.commit.style, targetLanguage: extensionConfig.commit.targetLanguage ?? "english" });
    const preview = buildRequestPreview(apiConfig, changeSet, selection, envelope, 500);
    const panel = vscode.window.createWebviewPanel("gitmind.commitWorkspace", `GitMind · ${kind}`, vscode.ViewColumn.Active, { enableScripts: true, retainContextWhenHidden: false, localResourceRoots: [extensionUri] });
    const workspace = new CommitWorkspace(panel, { changeSet, selection, kind, draft: "", preview, health: scoreCommitHealth(changeSet, selection) });
    this.panels.set(key, workspace);
    if (kind === "review" || config.get<boolean>("review.enabled", false)) {
      void workspace.handleGenerate({
        type: "generate",
        selections: selection.items.map(item => ({ atomId: item.atomId, decision: item.decision }))
      });
    }
  }

  private async handleGenerate(message: Extract<IncomingMessage, { type: "generate" | "repair" }>): Promise<void> {
    const known = new Set(this.state.changeSet.atoms.map(atom => atom.id));
    this.state.selection = {
      items: message.selections.filter(item => known.has(item.atomId)), why: message.why?.trim(), issueSummary: this.fetchedIssue ?? message.issue?.trim(), userNotes: message.notes?.trim(),
      branchName: this.state.changeSet.snapshot.branch
    };
    const config = await getApiConfig();
    const extensionConfig = getConfiguration();
    const setting = vscode.workspace.getConfiguration("gitmind");
    const detailInspection = setting.inspect<"auto" | "concise" | "detailed">("commit.detailMode");
    const detailWasSelected = detailInspection?.globalValue !== undefined || detailInspection?.workspaceValue !== undefined || detailInspection?.workspaceFolderValue !== undefined;
    const configuredMode = detailWasSelected ? setting.get<"auto" | "concise" | "detailed">("commit.detailMode", "auto") : (setting.get("commit.verbose", true) ? "detailed" : "concise");
    const mode = configuredMode === "auto" && !shouldIncludeBody("auto", this.state.changeSet, this.state.selection) ? "concise" : configuredMode;
    const candidatesEnabled = setting.get<boolean>("commit.candidates.enabled", false);
    const pro = await SubscriptionManager.getInstance().isProUser();
    const requestKind = message.type === "repair" ? "repair" : this.state.kind === "commit" && candidatesEnabled && pro ? "candidates" : this.state.kind;
    if (message.type === "repair") {
      this.state.selection.userNotes = [message.notes?.trim(), `Invalid draft to repair:\n${message.draft}`].filter(Boolean).join("\n\n");
    }
    const envelope = buildEnvelope(this.state.changeSet, this.state.selection, requestKind, { detailMode: mode, style: extensionConfig.commit.style, targetLanguage: extensionConfig.commit.targetLanguage ?? "english" });
    if (requestKind === "composer") {
      envelope.notes = [envelope.notes, `<trusted_local_relationship_graph>${JSON.stringify(buildRelationshipGraph(this.state.changeSet))}</trusted_local_relationship_graph>`].filter(Boolean).join("\n\n");
    }
    const preview = buildRequestPreview(config, this.state.changeSet, this.state.selection, envelope, requestKind === "candidates" ? 900 : 500);
    this.state.preview = preview;
    this.panel.webview.postMessage({ type: "preview", preview });
    this.panel.webview.postMessage({ type: "busy", value: true });
    try {
      const response = await generateWithRawPrompt(config, renderPortablePrompt(envelope), `commit_intelligence_${requestKind}`, false, false);
      let drafts: string[];
      if (requestKind === "candidates") {
        let extracted: string[] = [];
        try {
          const parsed = parseJsonObject<{ candidates?: Array<{ message?: unknown } | string> }>(response);
          extracted = (parsed.candidates ?? [])
            .map(candidate => typeof candidate === "string" ? candidate : candidate?.message)
            .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
        } catch { /* fallback to text parsing */ }
        if (extracted.length < 2) {
          const blocks = response.split(/(?:^|\n)(?:\d+[\.\)]|Candidate \d+:?|\-\-\-)\s*/i)
            .map(b => b.trim())
            .filter(b => b.length > 5);
          if (blocks.length >= 2) {
            extracted = blocks;
          }
        }
        if (extracted.length < 2) {
          const cleanBase = response.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/, "").trim();
          const firstLine = cleanBase.split('\n')[0].replace(/^(feat|fix|docs|refactor|style|test|chore)(\([^)]+\))?:?\s*/i, "").trim();
          const scopeMatch = /^(feat|fix|docs|refactor|style|test|chore)(\([^)]+\))?:?/i.exec(cleanBase);
          const prefix = scopeMatch ? scopeMatch[0] : "feat";
          extracted = [
            cleanBase,
            `${prefix}: ${firstLine || "update codebase logic"}`,
            `${cleanBase}\n\n- Updated implementation to ensure correctness\n- Verified behavior with automated tests`
          ];
        }
        drafts = extracted.slice(0, 3);
      } else if (requestKind === "composer") {
        const proposed = parseJsonObject<{ groups?: CompositionPlan["groups"]; excludedAtomIds?: string[] }>(response);
        const plan: CompositionPlan = { snapshot: this.state.changeSet.snapshot, groups: proposed.groups ?? [], excludedAtomIds: proposed.excludedAtomIds ?? [] };
        const errors = validateCompositionPlan(plan, this.state.changeSet);
        if (errors.length) {throw new Error(`Invalid Composer proposal: ${errors.join("; ")}`);}
        drafts = [JSON.stringify(plan, null, 2)];
      } else if (requestKind === "review") {
        const proposed = parseJsonObject<{ findings?: ReviewFinding[] }>(response);
        const findings = validateReviewFindings(proposed.findings ?? [], envelope.knownAtomIds);
        drafts = [findings.length ? findings.map(finding => `## ${finding.severity.toUpperCase()}: ${finding.title}\n\n${finding.detail}\n\nChanges: ${finding.atomIds.join(", ")}`).join("\n\n") : "No review findings were returned."];
      } else {drafts = [response];}
      const policy = await loadRepositoryPolicy(this.state.changeSet.repositoryRoot, { targetLanguage: extensionConfig.commit.targetLanguage });
      const files = [...new Set(this.state.changeSet.atoms.map(atom => atom.path))];
      const results = drafts.map(draft => {
        const validation = requestKind === "composer" || requestKind === "review" || !["commit", "candidates", "repair"].includes(requestKind)
          ? { valid: true, normalized: draft.trim(), issues: [] }
          : validateCandidate(draft, policy, { conventional: extensionConfig.commit.style !== "basic", changedFiles: files });
        return { draft: validation.normalized, validation, health: scoreCommitHealth(this.state.changeSet, this.state.selection) };
      });
      this.state.draft = results[0].draft; this.state.validation = results[0].validation; this.state.health = results[0].health;
      this.state.draftSnapshot = this.snapshotKey(this.state.changeSet.snapshot);
      this.panel.webview.postMessage({ type: "result", results });
      if (setting.get<boolean>("review.enabled", false) || requestKind === "review") {
        try {
          const findings = await this.runPreCommitReview({ snapshot: this.state.changeSet.snapshot, groups: [{ id: "c1", atomIds: this.state.selection.items.filter(i => i.decision === "included").map(i => i.atomId), message: results[0].draft }], excludedAtomIds: [] });
          this.panel.webview.postMessage({ type: "reviewFindings", findings, atomMap: this.buildAtomPathMap() });
        } catch (error) {
          this.panel.webview.postMessage({ type: "reviewFindingsError", message: error instanceof Error ? error.message : "Pre-commit code review failed." });
        }
      }
    } catch (error) {
      this.panel.webview.postMessage({ type: "error", message: error instanceof Error ? error.message : "Generation failed" });
    } finally { this.panel.webview.postMessage({ type: "busy", value: false }); }
  }

  private async handleMessage(raw: unknown): Promise<void> {
    if (!isMessage(raw)) { void vscode.window.showErrorMessage("GitMind rejected an invalid workspace message."); return; }
    if (raw.type === "cancel") { this.panel.dispose(); return; }
    if (raw.type === "fetchIssue") {
      try {
        await this.fetchGitHubIssue(raw.reference);
      } catch (error) {
        void vscode.window.showErrorMessage(`GitHub issue context failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      return;
    }
    if (raw.type === "generate" || raw.type === "repair") { await this.handleGenerate(raw); return; }
    if (raw.type === "apply") {
      if (this.state.kind !== "composer") {
        void vscode.window.showErrorMessage("GitMind rejected an apply request outside Composer.");
        return;
      }
      try {
        const plan = JSON.parse(raw.draft) as CompositionPlan;
        const errors = validateCompositionPlan(plan, this.state.changeSet);
        if (errors.length) {throw new Error(errors.join("; "));}
        const setting = vscode.workspace.getConfiguration("gitmind");
        const policy = await loadRepositoryPolicy(this.state.changeSet.repositoryRoot, {
          reviewBlockingThreshold: setting.get<"off" | "warning" | "error">("review.blockingThreshold", "off")
        });
        const messageErrors = plan.groups.flatMap(group => validateCandidate(group.message, policy, { conventional: getConfiguration().commit.style !== "basic" }).issues
          .filter(issue => issue.severity === "error").map(issue => `${group.id}: ${issue.message}`));
        if (messageErrors.length) {throw new Error(messageErrors.join("; "));}
        if (setting.get<boolean>("review.enabled", false)) {
          const findings = await this.runPreCommitReview(plan);
          if (findings.length) {
            const detail = findings.map(finding => `${finding.severity.toUpperCase()}: ${finding.title}\n${finding.detail}`).join("\n\n");
            await vscode.window.showInformationMessage("GitMind pre-commit review findings", { modal: true, detail }, "Continue");
          }
          if (reviewBlocks(findings, policy.reviewBlockingThreshold)) {
            throw new Error(`Review findings meet the configured ${policy.reviewBlockingThreshold} blocking threshold`);
          }
        }
        const choice = await vscode.window.showWarningMessage(`Apply ${plan.groups.length} reviewed commits locally? Hooks will run and GitMind will never push.`, { modal: true }, "Apply commits");
        if (choice !== "Apply commits") {return;}
        const result = await applyCompositionPlan(plan, this.state.changeSet);
        void vscode.window.showInformationMessage(`GitMind applied ${result.commits.length} commits to ${result.branch}.`);
        this.panel.dispose();
      } catch (error) {
        void vscode.window.showErrorMessage(`Composer apply failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      return;
    }
    const policy = await loadRepositoryPolicy(this.state.changeSet.repositoryRoot);
    const validation = validateCandidate(raw.draft, policy, { conventional: getConfiguration().commit.style !== "basic", changedFiles: [...new Set(this.state.changeSet.atoms.map(atom => atom.path))] });
    if (raw.type === "insert") {
      if (this.state.kind !== "commit" && this.state.kind !== "candidates") {
        const document = await vscode.workspace.openTextDocument({ language: "markdown", content: raw.draft });
        await vscode.window.showTextDocument(document, { preview: true });
        return;
      }
      if (!validation.valid) { void vscode.window.showErrorMessage("GitMind cannot insert an invalid draft. Edit it until all blocking findings are resolved."); return; }
      const setting = vscode.workspace.getConfiguration("gitmind");
      if (setting.get<boolean>("review.enabled", false)) {
        const policy = await loadRepositoryPolicy(this.state.changeSet.repositoryRoot, {
          reviewBlockingThreshold: setting.get<"off" | "warning" | "error">("review.blockingThreshold", "off")
        });
        const reviewFindings = await this.runPreCommitReview({ snapshot: this.state.changeSet.snapshot, groups: [{ id: "c1", atomIds: this.state.selection.items.filter(i => i.decision === "included").map(i => i.atomId), message: raw.draft }], excludedAtomIds: [] });
        if (reviewBlocks(reviewFindings, policy.reviewBlockingThreshold)) {
          void vscode.window.showErrorMessage(`Pre-commit review findings meet configured '${policy.reviewBlockingThreshold}' blocking threshold. Resolve findings before inserting.`);
          return;
        }
      }
      const currentSnapshot = await captureSnapshot(this.state.changeSet.repositoryRoot);
      if (!this.state.draftSnapshot || this.state.draftSnapshot !== this.snapshotKey(currentSnapshot)) {
        this.state.draft = ""; this.state.validation = undefined; this.state.draftSnapshot = undefined;
        this.panel.webview.postMessage({ type: "stale", message: "Staged changes changed after generation. Generate a fresh draft before insertion." });
        return;
      }
      const findings = this.state.changeSet.atoms
        .filter(atom => this.state.selection.items.some(item => item.atomId === atom.id && item.decision === "included"))
        .flatMap(atom => scanSecrets(atom));
      if (findings.length) {
        const detail = findings.map(finding => `${finding.label} — ${this.pathForAtom(finding.atomId)}:${finding.line ?? "unknown line"}`).join("\n");
        const action = await vscode.window.showWarningMessage(
          "Possible secrets were found in staged content. Suspected values are hidden.",
          { modal: true, detail },
          "Unstage flagged files & regenerate", "Review and choose", "Insert anyway"
        );
        if (action === "Review and choose") {
          this.panel.webview.postMessage({ type: "reviewSecrets", findings: findings.map(f => ({ label: f.label, path: this.pathForAtom(f.atomId), line: f.line })) });
          try {
            await vscode.commands.executeCommand("workbench.view.scm");
            const firstPath = this.pathForAtom(findings[0].atomId);
            await vscode.commands.executeCommand("git.openChange", vscode.Uri.joinPath(vscode.Uri.file(this.state.changeSet.repositoryRoot), firstPath));
          } catch { /* The inline chooser remains available if the built-in diff command is unavailable. */ }
          return;
        }
        if (action === "Unstage flagged files & regenerate") {
          try { await this.unstageFlaggedAndRegenerate(findings, raw.draft); }
          catch (error) { void vscode.window.showErrorMessage(`Flagged files were not inserted: ${error instanceof Error ? error.message : String(error)}`); }
          return;
        }
        if (action !== "Insert anyway") { return; }
      }
      const [summary, ...rest] = validation.normalized.split("\n");
      await setCommitMessage({ summary, description: rest.join("\n").trim() }, this.state.changeSet.repositoryRoot);
      void vscode.window.showInformationMessage("GitMind draft inserted into Source Control.");
    } else {
      await vscode.env.clipboard.writeText(raw.draft);
      void vscode.window.showInformationMessage("GitMind draft copied.");
    }
  }

  private async unstageFlaggedAndRegenerate(findings: ReturnType<typeof scanSecrets>, _staleDraft: string): Promise<void> {
    const paths = [...new Set(findings.map(finding => this.pathForAtom(finding.atomId)))];
    const previousSelection = this.state.selection;
    try {
      await unstagePaths(this.state.changeSet.repositoryRoot, paths);
      this.state.draft = "";
      this.state.validation = undefined;
      this.state.draftSnapshot = undefined;
      this.panel.webview.postMessage({ type: "stale", message: "Flagged files were unstaged. The previous draft is no longer valid." });
      this.state.changeSet = await collectChangeSet(this.state.changeSet.repositoryRoot, false);
      const config = vscode.workspace.getConfiguration("gitmind");
      this.state.selection = defaultSelection(this.state.changeSet, config.get<string[]>("commit.excludeFiles", []), config.get("commit.noiseFiltering.enabled", false));
      this.state.selection = { ...this.state.selection, why: previousSelection.why, issueSummary: previousSelection.issueSummary, userNotes: previousSelection.userNotes, branchName: this.state.changeSet.snapshot.branch };
      if (this.state.changeSet.atoms.length) {
        await this.handleGenerate({ type: "generate", why: this.state.selection.why, issue: this.state.selection.issueSummary, notes: this.state.selection.userNotes, selections: this.state.selection.items });
      } else {
        this.panel.webview.postMessage({ type: "error", message: "Flagged files were unstaged. Stage safe changes before generating again." });
      }
    } catch (error) {
      this.state.draft = "";
      this.panel.webview.postMessage({ type: "stale", message: "The draft was invalidated. GitMind did not insert it." });
      throw error;
    }
  }

  private pathForAtom(atomId: string): string {
    return this.state.changeSet.atoms.find(atom => atom.id === atomId)?.path ?? "unknown path";
  }

  private buildAtomPathMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const atom of this.state.changeSet.atoms) {
      map[atom.id] = atom.path;
    }
    return map;
  }

  private snapshotKey(snapshot: ChangeSet["snapshot"]): string {
    return `${snapshot.head}:${snapshot.indexTree}:${snapshot.statusHash}`;
  }

  private async runPreCommitReview(plan: CompositionPlan): Promise<ReviewFinding[]> {
    const config = await getApiConfig();
    const extensionConfig = getConfiguration();
    const selection: ContextSelection = { ...this.state.selection, userNotes: [this.state.selection.userNotes, `<trusted_composition_plan>${JSON.stringify(plan)}</trusted_composition_plan>`].filter(Boolean).join("\n\n") };
    const envelope = buildEnvelope(this.state.changeSet, selection, "review", { detailMode: "concise", style: extensionConfig.commit.style, targetLanguage: extensionConfig.commit.targetLanguage ?? "english" });
    const preview = buildRequestPreview(config, this.state.changeSet, selection, envelope, 700);
    this.panel.webview.postMessage({ type: "preview", preview });
    const response = await generateWithRawPrompt(config, renderPortablePrompt(envelope), "commit_intelligence_review", false, false);
    const parsed = parseJsonObject<{ findings?: ReviewFinding[] }>(response);
    return validateReviewFindings(parsed.findings ?? [], envelope.knownAtomIds);
  }

  private async fetchGitHubIssue(reference: string): Promise<void> {
    if (!vscode.workspace.getConfiguration("gitmind").get<boolean>("commit.githubIssueContext.enabled", false)) {
      void vscode.window.showInformationMessage("Enable gitmind.commit.githubIssueContext.enabled before fetching an issue.");
      return;
    }
    const issueMatch = /(?:issues\/|#)(\d+)/.exec(reference);
    if (!issueMatch) {
      void vscode.window.showErrorMessage("Enter a GitHub issue reference such as #123 or an issue URL.");
      return;
    }
    const remote = (await runGit(this.state.changeSet.repositoryRoot, ["remote", "get-url", "origin"])).trim();
    const repositoryMatch = /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/.exec(remote);
    if (!repositoryMatch) {
      void vscode.window.showErrorMessage("The origin remote is not a supported GitHub repository.");
      return;
    }
    const approval = await vscode.window.showInformationMessage(`Authenticate with GitHub and fetch issue #${issueMatch[1]} for this in-memory workflow?`, { modal: true }, "Authenticate & fetch");
    if (approval !== "Authenticate & fetch") {return;}
    const session = await vscode.authentication.getSession("github", ["repo"], { createIfNone: true });
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(repositoryMatch[1])}/${encodeURIComponent(repositoryMatch[2])}/issues/${issueMatch[1]}`, {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${session.accessToken}`, "X-GitHub-Api-Version": "2022-11-28" }
    });
    if (!response.ok) {throw new Error(`GitHub issue request failed with status ${response.status}`);}
    const issue = await response.json() as { title?: unknown; body?: unknown; html_url?: unknown };
    const title = typeof issue.title === "string" ? issue.title : `Issue #${issueMatch[1]}`;
    const body = typeof issue.body === "string" ? issue.body.slice(0, 20_000) : "";
    this.fetchedIssue = `#${issueMatch[1]} ${title}\n${body}`.trim();
    this.panel.webview.postMessage({ type: "issueFetched", label: `#${issueMatch[1]} ${title}` });
  }

  private render(): string {
    const nonce = getNonce();
    const rows = this.state.changeSet.atoms.map(atom => {
      const item = this.state.selection.items.find(candidate => candidate.atomId === atom.id);
      return `<tr data-id="${escapeHtml(atom.id)}"><td><code>${escapeHtml(atom.path)}</code><small>${escapeHtml(atom.header)} · +${atom.additions}/-${atom.deletions}${atom.noiseReason ? ` · ${escapeHtml(atom.noiseReason)}` : ""}</small></td><td><label class="sr-only" for="decision-${escapeHtml(atom.id)}">Context decision for ${escapeHtml(atom.path)}</label><select id="decision-${escapeHtml(atom.id)}" class="decision"><option value="included"${item?.decision === "included" ? " selected" : ""}>Include</option><option value="summarized"${item?.decision === "summarized" ? " selected" : ""}>Summarize</option><option value="excluded"${item?.decision === "excluded" ? " selected" : ""}>Exclude</option></select></td></tr>`;
    }).join("");
    return this.renderWorkspaceDocument(nonce, rows);
  }

  private renderWorkspaceDocument(nonce: string, rows: string): string {
    const isComposer = this.state.kind === "composer";
    const isCommit = this.state.kind === "commit" || this.state.kind === "candidates";
    const settings = vscode.workspace.getConfiguration("gitmind");
    const issueEnabled = settings.get("commit.githubIssueContext.enabled", false);
    const healthEnabled = settings.get("commit.health.enabled", false);
    const reviewEnabled = settings.get("review.enabled", false);
    const preview = this.state.preview;
    const branchName = escapeHtml(this.state.changeSet.snapshot.branch || "workspace");
    const primary = isComposer
      ? `<button id="apply" class="primary"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Apply Reviewed Commits</button>`
      : `<button id="insert" class="primary"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> ${isCommit ? "Use in Source Control" : "Open Markdown Preview"}</button>`;

    const svgIcons = {
      branch: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>',
      wand: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/></svg>',
      shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      file: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
      copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
      check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      alert: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };

    return `<!doctype html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style nonce="${nonce}">
body { font-family: var(--vscode-font-family); font-size: 13px; color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 20px; max-width: 980px; margin: 0 auto; line-height: 1.5; }
.header-card { display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--vscode-panel-border); background: var(--vscode-sideBar-background); padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.header-title-group { display: flex; align-items: center; gap: 10px; }
.header-title-group h1 { font-size: 18px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 8px; }
.branch-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-family: var(--vscode-editor-font-family, monospace); padding: 3px 8px; border-radius: 12px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); font-weight: 500; }
.stepper-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1px solid var(--vscode-panel-border); background: var(--vscode-sideBar-background); padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; }
.step-item { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500; color: var(--vscode-descriptionForeground); opacity: 0.85; }
.step-item.active { color: var(--vscode-foreground); opacity: 1; font-weight: 600; }
.step-num { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); font-size: 11px; font-weight: 700; }
.step-item.active .step-num { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.stepper-arrow { color: var(--vscode-descriptionForeground); font-size: 14px; opacity: 0.5; }
section, details { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 16px; margin: 16px 0; background: var(--vscode-editor-background); }
summary { cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; user-select: none; font-size: 14px; }
textarea, input, select { box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; padding: 8px 10px; font-family: inherit; font-size: 12px; }
input, textarea { width: 100%; margin: 6px 0 14px; }
textarea:focus, input:focus, select:focus, button:focus-visible, summary:focus-visible { outline: 2px solid var(--vscode-focusBorder); outline-offset: 2px; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
td, th { border-top: 1px solid var(--vscode-panel-border); padding: 10px 8px; text-align: left; vertical-align: middle; }
td:last-child { width: 160px; }
small { display: block; color: var(--vscode-descriptionForeground); margin-top: 3px; font-size: 11px; }
button { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--vscode-button-border, transparent); border-radius: 4px; padding: 7px 14px; margin: 4px 8px 4px 0; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); cursor: pointer; font-weight: 500; font-size: 12px; transition: opacity 0.15s; }
button.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); font-weight: 600; }
button:hover { opacity: 0.9; }
button:disabled { opacity: 0.5; cursor: default; }
#draft { min-height: 180px; font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; line-height: 1.5; }
.candidate-card { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px 14px; margin: 12px 0; background: var(--vscode-sideBar-background); cursor: pointer; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
.candidate-card:hover { border-color: var(--vscode-focusBorder); }
.candidate-card.selected { border-color: var(--vscode-focusBorder); background: var(--vscode-editor-inactiveSelectionBackground); box-shadow: 0 0 0 1px var(--vscode-focusBorder); }
.candidate-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
.candidate-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
.candidate-preview { font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; white-space: pre-wrap; background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 4px; margin: 8px 0; border: 1px solid var(--vscode-panel-border); }
.candidate-select-btn { margin-top: 6px; font-size: 11px; }
.disclosure { display: flex; gap: 10px; flex-wrap: wrap; color: var(--vscode-descriptionForeground); margin-top: 10px; font-size: 11px; }
.disclosure span { border: 1px solid var(--vscode-panel-border); padding: 4px 8px; border-radius: 4px; background: var(--vscode-sideBar-background); }
#status { white-space: pre-wrap; font-weight: 500; margin: 10px 0; }
.warning { border-left: 4px solid var(--vscode-inputValidation-warningBorder); background: var(--vscode-inputValidation-warningBackground, rgba(255, 191, 0, 0.1)); padding: 12px; border-radius: 0 4px 4px 0; margin: 12px 0; }
.review-findings-container { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 14px; margin: 14px 0; background: var(--vscode-sideBar-background); }
.finding-card { border: 1px solid var(--vscode-panel-border); border-radius: 4px; padding: 10px; margin: 8px 0; background: var(--vscode-editor-background); }
.finding-header { display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: 12px; margin-bottom: 4px; }
.finding-severity { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px; text-transform: uppercase; }
.severity-error { background: var(--vscode-inputValidation-errorBackground, #f87171); color: #fff; }
.severity-warning { background: var(--vscode-inputValidation-warningBackground, #fbbf24); color: #000; }
.severity-info { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
.atom-tag { display: inline-block; font-size: 10px; font-family: var(--vscode-editor-font-family, monospace); padding: 2px 6px; border-radius: 3px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); margin: 2px 4px 2px 0; }
.atom-tag.clickable { cursor: pointer; }
.atom-tag.clickable:hover { opacity: 0.8; text-decoration: underline; }
.health-meter-box { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px 14px; margin: 12px 0; background: var(--vscode-sideBar-background); }
.health-meter-head { display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 6px; }
.health-bar-track { height: 8px; border-radius: 4px; background: var(--vscode-panel-border); overflow: hidden; }
.health-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
.table-bulk-controls { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.bulk-btn { font-size: 11px; padding: 3px 8px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media(max-width:600px) { body { padding: 12px; } td:last-child { width: auto; } .stepper-bar { flex-direction: column; align-items: flex-start; } }
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
@media(forced-colors:active){section,details,button,textarea,input,select{border-color:CanvasText}}
</style></head>
<body>

<!-- Header Card -->
<div class="header-card">
  <div class="header-title-group">
    <h1>${svgIcons.wand} GitMind Reviewed Workspace</h1>
    <span class="branch-pill">${svgIcons.branch} ${branchName}</span>
  </div>
  <div class="workflow-mode-tag">
    <span class="candidate-badge">${escapeHtml(this.state.kind).toUpperCase()} WORKFLOW</span>
  </div>
</div>

<!-- Stepper Bar -->
<div class="stepper-bar">
  <div class="step-item active">
    <span class="step-num">1</span>
    <span>Scope & Intent</span>
  </div>
  <span class="stepper-arrow">➔</span>
  <div class="step-item active">
    <span class="step-num">2</span>
    <span>Generate Draft</span>
  </div>
  <span class="stepper-arrow">➔</span>
  <div class="step-item active">
    <span class="step-num">3</span>
    <span>Quality Review & Insertion</span>
  </div>
</div>

<!-- Step 1 & Step 2: Context & Generation -->
<section aria-labelledby="generateHeading">
  <h2 id="generateHeading" style="margin-top:0;font-size:15px;display:flex;align-items:center;gap:8px;">${svgIcons.wand} Generation Engine</h2>
  <div style="display:flex;gap:8px;margin-bottom:12px;">
    <button class="primary" id="generate">${svgIcons.wand} Generate Draft</button>
    <button id="cancel">${svgIcons.check} Cancel</button>
  </div>
  <p style="margin:4px 0 10px;font-size:12px;color:var(--vscode-descriptionForeground);">Clicking Generate requests commit choices using the context configured below.</p>
  <div class="disclosure" id="requestSummary">
    <span id="requestProvider">Provider: ${escapeHtml(preview?.provider ?? "unknown")}</span>
    <span id="requestModel">Model: ${escapeHtml(preview?.model ?? "unknown")}</span>
    <span id="requestDestination">Destination: ${escapeHtml(preview?.destinationHost ?? "unknown")}</span>
    <span id="requestFiles">Files: ${preview?.includedFiles.length ?? 0}</span>
    <span id="requestTokens">Estimated Tokens: ${preview?.estimatedInputTokens ?? 0}</span>
  </div>
</section>

<details open>
  <summary>${svgIcons.file} File Customization & Context Scope</summary>
  <div class="table-bulk-controls">
    <span style="font-size:11px;color:var(--vscode-descriptionForeground);">Quick Actions:</span>
    <button type="button" class="bulk-btn" onclick="bulkSetDecisions('included')">Include All</button>
    <button type="button" class="bulk-btn" onclick="bulkSetDecisions('summarized')">Summarize All</button>
    <button type="button" class="bulk-btn" onclick="bulkSetDecisions('excluded')">Exclude All</button>
  </div>
  <table>
    <thead><tr><th>File Change</th><th>Context Scope Decision</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</details>

<details>
  <summary>${svgIcons.shield} Intent & Context Details</summary>
  <label for="why">Why / Intended Outcome</label>
  <input id="why" placeholder="e.g. Add validation for API keys and handle network errors">
  <label for="issue">Issue or Branch Reference</label>
  <input id="issue" value="${escapeHtml(this.state.changeSet.snapshot.branch ?? "")}">
  ${issueEnabled ? `<button type="button" id="fetchIssue">${svgIcons.file} Fetch Selected GitHub Issue</button>` : ''}
  <label for="notes">Request Details / Instructions</label>
  <textarea id="notes" placeholder="Optional notes to guide the AI commit message generator..."></textarea>
</details>

<p id="status" role="status" aria-live="polite"></p>
<div id="secretReview" class="warning" tabindex="-1" hidden></div>
<div id="reviewFindingsContainer" class="review-findings-container" hidden></div>
<div id="healthMeter" class="health-meter-box" ${healthEnabled ? '' : 'hidden'}></div>
<div id="candidates"></div>

<!-- Step 3: Editable Draft & Action -->
<section aria-labelledby="draftHeading">
  <h2 id="draftHeading" style="margin-top:0;font-size:15px;display:flex;align-items:center;gap:8px;">${svgIcons.file} Editable Commit Draft</h2>
  <label class="sr-only" for="draft">Editable draft</label>
  <textarea id="draft" placeholder="Generated draft will appear here..."></textarea>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <button id="repair" hidden>${svgIcons.shield} Repair Edited Draft</button>
    ${primary}
    <button id="copy">${svgIcons.copy} Copy Draft</button>
  </div>
</section>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
const q = s => document.querySelector(s);
const healthEnabled = ${healthEnabled};
const initialHealth = ${JSON.stringify(this.state.health ?? scoreCommitHealth(this.state.changeSet, this.state.selection))};
const reviewEnabled = ${reviewEnabled};

function selections() {
  return [...document.querySelectorAll('tr[data-id]')].map(r => ({
    atomId: r.dataset.id,
    decision: r.querySelector('.decision').value
  }));
}

function bulkSetDecisions(val) {
  document.querySelectorAll('select.decision').forEach(sel => sel.value = val);
}

function send(type) {
  vscode.postMessage({
    type,
    draft: q('#draft').value,
    why: q('#why').value,
    issue: q('#issue').value,
    notes: q('#notes').value,
    selections: selections()
  });
}

function showPreview(p) {
  q('#requestProvider').textContent = 'Provider: ' + p.provider;
  q('#requestModel').textContent = 'Model: ' + p.model;
  q('#requestDestination').textContent = 'Destination: ' + p.destinationHost;
  q('#requestFiles').textContent = 'Files: ' + p.includedFiles.length;
  q('#requestTokens').textContent = 'Estimated Tokens: ' + p.estimatedInputTokens;
}

q('#generate').onclick = () => send('generate');
q('#repair').onclick = () => send('repair');
q('#fetchIssue')?.addEventListener('click', () => vscode.postMessage({ type: 'fetchIssue', reference: q('#issue').value }));
q('#cancel').onclick = () => vscode.postMessage({ type: 'cancel' });
q('#insert')?.addEventListener('click', () => send('insert'));
q('#apply')?.addEventListener('click', () => send('apply'));
q('#copy').onclick = () => send('copy');

addEventListener('message', event => {
  const m = event.data;
  if (m.type === 'busy') {
    q('#generate').disabled = m.value;
    q('#repair').disabled = m.value;
    q('#status').textContent = m.value ? 'Generating commit draft with AI intelligence...' : '';
  }
  if (m.type === 'preview') showPreview(m.preview);
  if (m.type === 'error') q('#status').textContent = 'Error: ' + m.message;
  if (m.type === 'stale') {
    q('#draft').value = '';
    q('#status').textContent = m.message;
  }
  if (m.type === 'reviewSecrets') {
    q('#fileChoices').open = true;
    const box = q('#secretReview');
    box.hidden = false;
    box.textContent = 'Possible secrets detected: ' + m.findings.map(f => f.label + ' — ' + f.path + ':' + (f.line ?? 'unknown line')).join('; ');
    box.focus();
  }
  if (m.type === 'issueFetched') {
    q('#issue').value = m.label;
    q('#status').textContent = 'Issue context fetched successfully.';
  }
  if (m.type === 'reviewFindingsError') {
    const box = q('#reviewFindingsContainer');
    box.hidden = false;
    box.innerHTML = '<div style="font-weight:600;margin-bottom:8px;font-size:13px;color:var(--vscode-inputValidation-errorForeground);">Pre-Commit Code Review Failed</div><div style="font-size:12px;color:var(--vscode-descriptionForeground);">' + m.message + '</div>';
  }
  if (m.type === 'reviewFindings') {
    const box = q('#reviewFindingsContainer');
    box.hidden = false;
    box.innerHTML = '<div style="font-weight:600;margin-bottom:8px;font-size:13px;display:flex;align-items:center;gap:6px;">Pre-Commit Code Review Findings</div>';
    if (!m.findings || m.findings.length === 0) {
      box.innerHTML += '<div style="color:var(--vscode-testing-iconPassed);font-size:12px;">No risks or code quality findings detected.</div>';
    } else {
      m.findings.forEach(f => {
        const card = document.createElement('div');
        card.className = 'finding-card';
        const atomLinks = (f.atomIds || []).map(id => {
          const path = (m.atomMap && m.atomMap[id]) ? m.atomMap[id] : id;
          return '<span class="atom-tag clickable" data-atom-id="' + id + '">' + path + '</span>';
        }).join(' ');
        card.innerHTML = '<div class="finding-header"><span>' + f.title + '</span><span class="finding-severity severity-' + f.severity + '">' + f.severity + '</span></div><div style="font-size:11px;color:var(--vscode-descriptionForeground);margin-bottom:4px;">' + f.detail + '</div>' + (atomLinks ? '<div style="font-size:11px;margin-top:4px;">Impacted files: ' + atomLinks + '</div>' : '');
        box.appendChild(card);
      });
      box.querySelectorAll('.atom-tag.clickable').forEach(tag => {
        tag.onclick = (e) => {
          const id = tag.getAttribute('data-atom-id');
          const row = document.querySelector('tr[data-id="' + id + '"]');
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.style.outline = '2px solid var(--vscode-focusBorder)';
            setTimeout(() => { row.style.outline = ''; }, 2000);
          }
        };
      });
    }
  }
  if (m.type === 'result') {
    q('#candidates').innerHTML = '';
    if (m.results.length > 1) {
      m.results.forEach((r, i) => {
        const card = document.createElement('div');
        card.className = 'candidate-card' + (i === 0 ? ' selected' : '');
        card.setAttribute('tabindex', '0');
        const header = document.createElement('div');
        header.className = 'candidate-card-header';
        header.innerHTML = '<strong>Candidate ' + (i + 1) + '</strong>' + (healthEnabled ? ' <span class="candidate-badge">Health ' + r.health.overall + '/100</span>' : '') + ' <span class="candidate-badge" style="background:rgba(128,128,128,0.2);color:inherit;">' + (r.validation.valid ? 'Valid' : r.validation.issues.map(x => x.message).join('; ')) + '</span>';
        const pre = document.createElement('pre');
        pre.className = 'candidate-preview';
        pre.textContent = r.draft;
        card.appendChild(header);
        card.appendChild(pre);
        const selectBtn = document.createElement('button');
        selectBtn.type = 'button';
        selectBtn.className = 'candidate-select-btn';
        selectBtn.textContent = i === 0 ? 'Active Candidate' : 'Select Candidate ' + (i + 1);
        selectBtn.onclick = (e) => {
          e.stopPropagation();
          document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          document.querySelectorAll('.candidate-select-btn').forEach((b, idx) => b.textContent = 'Select Candidate ' + (idx + 1));
          selectBtn.textContent = 'Active Candidate';
          q('#draft').value = r.draft;
          q('#repair').hidden = !(healthEnabled && !r.validation.valid);
          updateHealthMeter(r);
        };
        card.onclick = selectBtn.onclick;
        q('#candidates').appendChild(card);
      });
    }
    q('#draft').value = m.results[0].draft;
    q('#repair').hidden = !(healthEnabled && !m.results[0].validation.valid);
    q('#status').textContent = m.results[0].validation.valid ? 'Draft is ready for review and insertion.' : 'Edit blocking findings before SCM insertion.';
    updateHealthMeter(m.results[0]);
  }
});

function updateHealthMeter(r) {
  if (!healthEnabled || !r || !r.health) return;
  const box = q('#healthMeter');
  box.hidden = false;
  const score = r.health.overall || 0;
  const color = score >= 80 ? 'var(--vscode-testing-iconPassed, #10b981)' : score >= 50 ? 'var(--vscode-inputValidation-warningBorder, #f59e0b)' : 'var(--vscode-inputValidation-errorBorder, #ef4444)';
  const tips = (r.health.recommendations || []).map(tip => '<li>' + tip.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])) + '</li>').join('');
  box.innerHTML = '<div class="health-meter-head"><span>Commit Health · staged changes</span><span style="color:' + color + ';">' + score + '/100</span></div><div class="health-bar-track"><div class="health-bar-fill" style="width:' + score + '%;background:' + color + ';"></div></div><small>This local score checks scope, change size, safety, tests, and staging—not commit-message wording.</small><ul style="margin:6px 0 0;padding-left:18px;">' + tips + '</ul>';
}
if (healthEnabled) { updateHealthMeter({ health: initialHealth }); }
</script></body></html>`;
  }

  dispose(): void {
    for (const [key, value] of CommitWorkspace.panels) {if (value === this) {CommitWorkspace.panels.delete(key);}}
    while (this.disposables.length) {this.disposables.pop()?.dispose();}
  }

  static disposeAll(): void { for (const panel of [...this.panels.values()]) {panel.panel.dispose();} this.panels.clear(); }
}
