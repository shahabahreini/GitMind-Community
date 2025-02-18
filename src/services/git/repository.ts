import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";
import { CommitMessage } from "../../config/types";
import { debugLog } from "../debug/logger";

const execAsync = promisify(exec);

export async function validateGitRepository(workspaceFolder: vscode.WorkspaceFolder) {
    try {
        await execAsync("git rev-parse --is-inside-work-tree", {
            cwd: workspaceFolder.uri.fsPath,
        });
    } catch (error) {
        throw new Error("Not a git repository");
    }
}

export async function getDiff(workspaceFolder: vscode.WorkspaceFolder): Promise<string> {
    const { stdout: stagedDiff } = await execAsync("git diff --staged", {
        cwd: workspaceFolder.uri.fsPath,
    });

    if (!stagedDiff) {
        const { stdout: unstagedDiff } = await execAsync("git diff", {
            cwd: workspaceFolder.uri.fsPath,
        });

        if (!unstagedDiff) {
            throw new Error("No changes detected");
        }

        const answer = await vscode.window.showWarningMessage(
            "No staged changes found. Would you like to generate a commit message for unstaged changes?",
            "Yes",
            "No"
        );

        if (answer !== "Yes") {
            throw new Error("Operation cancelled");
        }

        return unstagedDiff;
    }

    return stagedDiff;
}

export async function setCommitMessage(message: CommitMessage) {
    const gitExtension = vscode.extensions.getExtension("vscode.git");
    if (!gitExtension) {
        throw new Error("Git extension not found");
    }

    const git = gitExtension.exports.getAPI(1);
    if (!git) {
        throw new Error("Git API not available");
    }

    const repositories = git.repositories;
    if (!repositories || repositories.length === 0) {
        throw new Error("No Git repositories found");
    }

    const repository = repositories[0];
    if (repository) {
        const config = vscode.workspace.getConfiguration("aiCommitAssistant");
        const isVerbose = config.get("commit.verbose", true);

        // Format message based on verbose setting
        const formattedMessage = isVerbose
            ? message.summary + '\n\n' + message.description
            : message.summary;

        repository.inputBox.value = formattedMessage;
    }
}


