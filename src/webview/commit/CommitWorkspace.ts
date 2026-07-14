import * as vscode from "vscode";
import { getApiConfig, getConfiguration } from "../../config/settings";
import { generateWithRawPrompt } from "../../services/api";
import { setCommitMessage } from "../../services/git/repository";
import { SubscriptionManager } from "../../services/subscription/SubscriptionManager";
import { getNonce } from "../../utils/getNonce";
import { buildEnvelope, buildRequestPreview, defaultSelection, scanSecrets } from "../../commit-intelligence/context";
import { applyCompositionPlan, buildRelationshipGraph, validateCompositionPlan } from "../../commit-intelligence/composer";
import { captureSnapshot, collectChangeSet, runGit, unstagePaths } from "../../commit-intelligence/git";
import { ChangeSet, CompositionPlan, ContextSelection, GenerationKind, RequestPreview, ReviewFinding, ValidationResult } from "../../commit-intelligence/models";
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
    const workspace = new CommitWorkspace(panel, { changeSet, selection, kind, draft: "", preview });
    this.panels.set(key, workspace);
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
      // Commit intelligence requires a fresh preflight for every network send, so automatic
      // recovery is disabled here. The user may explicitly generate or repair again.
      const response = await generateWithRawPrompt(config, renderPortablePrompt(envelope), `commit_intelligence_${requestKind}`, false, false);
      let drafts: string[];
      if (requestKind === "candidates") {
        const parsed = parseJsonObject<{ candidates?: Array<{ message?: unknown }> }>(response);
        drafts = (parsed.candidates ?? []).map(candidate => candidate.message).filter((value): value is string => typeof value === "string").slice(0, 3);
        if (drafts.length !== 3) {throw new Error("Provider did not return exactly three candidates");}
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
        return { draft: validation.normalized, validation, health: scoreCommitHealth(draft, validation, this.state.changeSet, this.state.selection) };
      });
      this.state.draft = results[0].draft; this.state.validation = results[0].validation;
      this.state.draftSnapshot = this.snapshotKey(this.state.changeSet.snapshot);
      this.panel.webview.postMessage({ type: "result", results });
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
    const preview = this.state.preview;
    const primary = isComposer
      ? `<button id="apply">Apply reviewed commits</button>`
      : `<button id="insert">${isCommit ? "Use in Source Control" : "Open Markdown preview"}</button>`;
    return `<!doctype html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style nonce="${nonce}">body{font:13px var(--vscode-font-family);color:var(--vscode-foreground);background:var(--vscode-editor-background);padding:20px;max-width:960px;margin:auto}h1{font-size:20px}section,details{border:1px solid var(--vscode-panel-border);border-radius:4px;padding:12px;margin:12px 0}summary{cursor:pointer;font-weight:600}textarea,input,select{box-sizing:border-box;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);border-radius:2px;padding:7px}input,textarea{width:100%;margin:4px 0 12px}textarea:focus,input:focus,select:focus,button:focus-visible,summary:focus-visible{outline:2px solid var(--vscode-focusBorder);outline-offset:2px}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border-top:1px solid var(--vscode-panel-border);padding:8px;text-align:left;vertical-align:top}td:last-child{width:180px}small{display:block;color:var(--vscode-descriptionForeground);margin-top:4px}button{border:1px solid var(--vscode-button-border,transparent);border-radius:2px;padding:7px 12px;margin:4px 8px 4px 0;background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);cursor:pointer}button.primary{background:var(--vscode-button-background);color:var(--vscode-button-foreground)}button:hover{background:var(--vscode-button-hoverBackground)}button:disabled{opacity:.55;cursor:default}#draft{min-height:180px}.candidate{display:block;width:100%;text-align:left;border:1px solid var(--vscode-panel-border);margin:8px 0}.disclosure{display:flex;gap:8px;flex-wrap:wrap;color:var(--vscode-descriptionForeground)}#status{white-space:pre-wrap}.warning{border-left:3px solid var(--vscode-inputValidation-warningBorder);padding-left:10px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:600px){body{padding:12px}td:last-child{width:auto}.disclosure{display:block}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}@media(forced-colors:active){section,details,button,textarea,input,select{border-color:CanvasText}}</style></head>
<body><h1>GitMind reviewed ${escapeHtml(this.state.kind)} workspace</h1><p>Generate one editable draft. GitMind changes nothing until you choose an explicit action.</p>
<section aria-labelledby="generateHeading"><h2 id="generateHeading">Generate</h2><button class="primary" id="generate">Generate</button><button id="cancel">Cancel</button><p>Clicking Generate authorizes the request described below.</p><div class="disclosure" id="requestSummary"><span id="requestProvider">Provider: ${escapeHtml(preview?.provider ?? "unknown")}</span><span id="requestModel">Model: ${escapeHtml(preview?.model ?? "unknown")}</span><span id="requestDestination">Destination: ${escapeHtml(preview?.destinationHost ?? "unknown")}</span><span id="requestFiles">Files: ${preview?.includedFiles.length ?? 0}</span><span id="requestTokens">Estimated tokens: ${preview?.estimatedInputTokens ?? 0}</span></div></section>
<details><summary>Intent and context</summary><label for="why">Why / intended outcome</label><input id="why"><label for="issue">Issue or branch context</label><input id="issue" value="${escapeHtml(this.state.changeSet.snapshot.branch ?? "")}">${issueEnabled ? '<button id="fetchIssue">Fetch selected GitHub issue</button>' : ''}<label for="notes">Request details</label><textarea id="notes"></textarea></details>
<details id="fileChoices"><summary>File customization</summary><table><thead><tr><th>Change</th><th>Context decision</th></tr></thead><tbody>${rows}</tbody></table></details>
<p id="status" role="status" aria-live="polite"></p><div id="secretReview" class="warning" tabindex="-1" hidden></div><div id="candidates"></div>
<section aria-labelledby="draftHeading"><h2 id="draftHeading">Editable draft</h2><label class="sr-only" for="draft">Editable draft</label><textarea id="draft"></textarea><button id="repair" hidden>Repair edited draft</button>${primary}<button id="copy">Copy</button></section>
<script nonce="${nonce}">const vscode=acquireVsCodeApi();const q=s=>document.querySelector(s);const healthEnabled=${healthEnabled};function selections(){return [...document.querySelectorAll('tr[data-id]')].map(r=>({atomId:r.dataset.id,decision:r.querySelector('.decision').value}))}function send(type){vscode.postMessage({type,draft:q('#draft').value,why:q('#why').value,issue:q('#issue').value,notes:q('#notes').value,selections:selections()})}function showPreview(p){q('#requestProvider').textContent='Provider: '+p.provider;q('#requestModel').textContent='Model: '+p.model;q('#requestDestination').textContent='Destination: '+p.destinationHost;q('#requestFiles').textContent='Files: '+p.includedFiles.length;q('#requestTokens').textContent='Estimated tokens: '+p.estimatedInputTokens}q('#generate').onclick=()=>send('generate');q('#repair').onclick=()=>send('repair');q('#fetchIssue')?.addEventListener('click',()=>vscode.postMessage({type:'fetchIssue',reference:q('#issue').value}));q('#cancel').onclick=()=>vscode.postMessage({type:'cancel'});q('#insert')?.addEventListener('click',()=>send('insert'));q('#apply')?.addEventListener('click',()=>send('apply'));q('#copy').onclick=()=>send('copy');addEventListener('message',event=>{const m=event.data;if(m.type==='busy'){q('#generate').disabled=m.value;q('#repair').disabled=m.value;q('#status').textContent=m.value?'Generating…':''}if(m.type==='preview')showPreview(m.preview);if(m.type==='error')q('#status').textContent=m.message;if(m.type==='stale'){q('#draft').value='';q('#status').textContent=m.message}if(m.type==='reviewSecrets'){q('#fileChoices').open=true;const box=q('#secretReview');box.hidden=false;box.textContent='Possible secrets: '+m.findings.map(f=>f.label+' — '+f.path+':'+(f.line??'unknown line')).join('; ');box.focus()}if(m.type==='issueFetched'){q('#issue').value=m.label;q('#status').textContent='Issue fetched into memory for this workflow.'}if(m.type==='result'){q('#candidates').innerHTML='';if(m.results.length>1)m.results.forEach((r,i)=>{const button=document.createElement('button');button.className='candidate';button.textContent='Candidate '+(i+1)+(healthEnabled?' · Health '+r.health.overall+'/100':'')+' · '+(r.validation.valid?'valid':r.validation.issues.map(x=>x.message).join('; '));button.onclick=()=>q('#draft').value=r.draft;q('#candidates').appendChild(button)});q('#draft').value=m.results[0].draft;q('#repair').hidden=!(healthEnabled&&!m.results[0].validation.valid);q('#status').textContent=m.results[0].validation.valid?'Draft is ready for review.':'Edit blocking findings before SCM insertion.'}});</script></body></html>`;
  }

  dispose(): void {
    for (const [key, value] of CommitWorkspace.panels) {if (value === this) {CommitWorkspace.panels.delete(key);}}
    while (this.disposables.length) {this.disposables.pop()?.dispose();}
  }

  static disposeAll(): void { for (const panel of [...this.panels.values()]) {panel.panel.dispose();} this.panels.clear(); }
}
