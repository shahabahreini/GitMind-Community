import * as vscode from "vscode";
import { GenerationKind } from "../commit-intelligence/models";
import { validateGitRepository } from "../services/git/repository";
import { SubscriptionManager } from "../services/subscription/SubscriptionManager";
import { CommitWorkspace } from "../webview/commit/CommitWorkspace";

const COMMANDS: Array<{ id: string; kind: GenerationKind; pro: boolean; setting?: string }> = [
  { id: "gitmind.openCommitWorkspace", kind: "commit", pro: false },
  { id: "gitmind.draftChoices", kind: "candidates", pro: true, setting: "commit.candidates.enabled" },
  { id: "gitmind.commitComposer", kind: "composer", pro: true, setting: "composer.enabled" },
  { id: "gitmind.draftSquashMessage", kind: "squash", pro: true },
  { id: "gitmind.draftPullRequest", kind: "pull-request", pro: true },
  { id: "gitmind.draftStashMessage", kind: "stash", pro: true },
  { id: "gitmind.draftReleaseNotes", kind: "release-notes", pro: true },
  { id: "gitmind.explainCommit", kind: "explanation", pro: true },
  { id: "gitmind.reviewChanges", kind: "review", pro: true, setting: "review.enabled" }
];

export function registerCommitIntelligenceCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  const registrations = COMMANDS.map(entry => vscode.commands.registerCommand(entry.id, async (repository?: { rootUri?: vscode.Uri }) => {
    if (!vscode.workspace.getConfiguration("gitmind").get("commitIntelligence.enabled", false)) {
      void vscode.window.showInformationMessage("Enable Commit Intelligence (Preview) in GitMind Settings to use this action.");
      return;
    }
    if (entry.setting && !vscode.workspace.getConfiguration("gitmind").get(entry.setting, false)) {
      void vscode.window.showInformationMessage(`Enable ${entry.setting} in GitMind Settings to use this action.`);
      return;
    }
    if (entry.pro && !await SubscriptionManager.getInstance().isProUser()) {
      const action = await vscode.window.showInformationMessage("This GitMind commit-intelligence workflow requires Pro.", "Activate Pro");
      if (action === "Activate Pro") {await vscode.commands.executeCommand("gitmind.showActivationQuickPick");}
      return;
    }
    const root = repository?.rootUri?.fsPath ?? await validateGitRepository();
    await CommitWorkspace.open(context.extensionUri, root, entry.kind);
  }));
  registrations.push(vscode.commands.registerCommand("gitmind.advancedCommitActions", async () => {
    const config = vscode.workspace.getConfiguration("gitmind");
    if (!config.get("commitIntelligence.enabled", false)) {
      void vscode.window.showInformationMessage("Enable Commit Intelligence (Preview) in GitMind Settings to use advanced commit actions.");
      return;
    }
    const picked = await vscode.window.showQuickPick(
      COMMANDS.filter(entry => !entry.setting || config.get(entry.setting, false)).map(entry => ({ label: commandLabel(entry.kind), command: entry.id })),
      { title: "GitMind: Advanced Commit Actions", placeHolder: "Choose a reviewed workflow" }
    );
    if (picked) { await vscode.commands.executeCommand(picked.command); }
  }));
  return registrations;
}

function commandLabel(kind: GenerationKind): string {
  const labels: Record<GenerationKind, string> = {
    commit: "Reviewed commit generation", candidates: "Draft choices", composer: "Compose atomic commit series",
    repair: "Repair commit draft",
    squash: "Draft squash message", "pull-request": "Draft pull request", stash: "Draft stash message",
    "release-notes": "Draft release notes", explanation: "Explain commit", review: "Review changes"
  };
  return labels[kind];
}
