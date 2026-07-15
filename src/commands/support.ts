import * as vscode from "vscode";
import { homedir } from "os";
import { SubscriptionManager } from "../services/subscription/SubscriptionManager";
import {
  supportSessionService,
  SUPPORT_SESSION_DURATION_MS
} from "../services/support/SupportSessionService";

const ISSUE_URL = "https://github.com/shahabahreini/GitMind-Community/issues/new";

async function requirePro(): Promise<boolean> {
  if (await SubscriptionManager.getInstance().isProUser(undefined, true)) {
    return true;
  }
  const action = await vscode.window.showInformationMessage(
    "Sanitized Support Reports are available with GitMind Pro.",
    "Activate Pro"
  );
  if (action === "Activate Pro") {
    await vscode.commands.executeCommand("gitmind.showActivationQuickPick");
  }
  return false;
}

async function startSupportSession(context: vscode.ExtensionContext): Promise<void> {
  if (!await requirePro()) { return; }
  const confirmation = await vscode.window.showInformationMessage(
    "Start a 30-minute sanitized support session? It records only allowlisted operational metadata in memory. It never records source code, diffs, prompts, paths, credentials, or raw API data.",
    { modal: true },
    "Start Session"
  );
  if (confirmation !== "Start Session") { return; }

  supportSessionService.start({
    extensionVersion: String(context.extension.packageJSON.version ?? "unknown"),
    vscodeVersion: vscode.version,
    platform: process.platform,
    architecture: process.arch
  });
  vscode.window.showInformationMessage(
    `Sanitized support session started. It stops automatically after ${SUPPORT_SESSION_DURATION_MS / 60000} minutes. Reproduce the issue, then use “Stop & Review Support Session”.`
  );
}

async function stopAndReviewSupportSession(): Promise<void> {
  if (!await requirePro()) { return; }
  const before = supportSessionService.getStatus();
  if (!before.active) {
    vscode.window.showInformationMessage("No sanitized support session is currently running.");
    return;
  }
  const status = supportSessionService.stop("user");
  const choice = await vscode.window.showInformationMessage(
    `Support session stopped with ${status.eventCount} allowlisted events (${status.droppedEvents} dropped by privacy/size checks). Review the privacy summary before saving.`,
    { modal: true },
    "Review & Save",
    "Delete"
  );
  if (choice === "Review & Save") {
    await vscode.commands.executeCommand("gitmind.saveSupportReport");
  } else if (choice === "Delete") {
    supportSessionService.delete();
  }
}

async function saveSupportReport(): Promise<void> {
  if (!await requirePro()) { return; }
  const status = supportSessionService.getStatus();
  if (status.active) { supportSessionService.stop("exported"); }
  if (status.eventCount === 0 && !status.active) {
    vscode.window.showInformationMessage("No sanitized support session is available to save.");
    return;
  }

  const confirmation = await vscode.window.showInformationMessage(
    "Privacy review: the JSON report includes versions, platform family, operation/provider enums, HTTP status, relative timing, and recovery outcomes. It excludes source, diffs, prompts, commits, paths, URLs, credentials, request/response data, raw errors, emails, and license/customer identifiers.",
    { modal: true },
    "Choose Save Location",
    "Delete"
  );
  if (confirmation === "Delete") {
    supportSessionService.delete();
    return;
  }
  if (confirmation !== "Choose Save Location") { return; }

  let serialized: string;
  try {
    serialized = supportSessionService.serializeReport();
  } catch {
    vscode.window.showErrorMessage("The support report failed its privacy validation. Nothing was saved.");
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destination = await vscode.window.showSaveDialog({
    saveLabel: "Save Sanitized Support Report",
    filters: { "JSON report": ["json"] },
    defaultUri: vscode.Uri.joinPath(vscode.Uri.file(homedir()), `gitmind-support-${timestamp}.json`)
  });
  if (!destination) { return; }

  try {
    await vscode.workspace.fs.writeFile(destination, new TextEncoder().encode(serialized));
    supportSessionService.stop("exported");
    const next = await vscode.window.showInformationMessage(
      "Sanitized support report saved locally. Review it, then attach it manually to a GitHub issue.",
      "Open GitHub Issue",
      "Delete Session"
    );
    if (next === "Open GitHub Issue") {
      await vscode.env.openExternal(vscode.Uri.parse(ISSUE_URL));
    } else if (next === "Delete Session") {
      supportSessionService.delete();
    }
  } catch {
    vscode.window.showErrorMessage("GitMind could not save the support report to that location.");
  }
}

async function deleteSupportSession(): Promise<void> {
  if (!await requirePro()) { return; }
  supportSessionService.delete();
  vscode.window.showInformationMessage("Sanitized support session data deleted from memory.");
}

export function registerSupportCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  context.subscriptions.push({ dispose: () => supportSessionService.dispose() });
  return [
    vscode.commands.registerCommand("gitmind.startSupportSession", () => startSupportSession(context)),
    vscode.commands.registerCommand("gitmind.stopSupportSession", stopAndReviewSupportSession),
    vscode.commands.registerCommand("gitmind.saveSupportReport", saveSupportReport),
    vscode.commands.registerCommand("gitmind.deleteSupportSession", deleteSupportSession)
  ];
}
