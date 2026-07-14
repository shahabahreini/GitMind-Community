import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { CommitMessage } from "../../config/types";
import { debugLog } from "../debug/logger";

const execFileAsync = promisify(execFile);
const execGit = async (args: readonly string[], cwd: string, maxBuffer = 1024 * 1024): Promise<{ stdout: string; stderr: string }> => {
    const result = await execFileAsync("git", [...args], { cwd, maxBuffer, encoding: "utf8" });
    return { stdout: result.stdout, stderr: result.stderr };
};
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Search for git repositories in subdirectories
 * @param searchPath The directory to search in
 * @param maxDepth Maximum depth to search (default: 3)
 * @returns Promise<string[]> Array of repository root paths found
 */
async function findGitRepositoriesInSubdirectories(searchPath: string, maxDepth: number = 3): Promise<string[]> {
    const repositories: string[] = [];
    const ignoredDirs = ["node_modules", "bower_components", "vendor"];

    async function searchRecursive(currentPath: string, depth: number): Promise<void> {
        if (depth > maxDepth) {
            return;
        }

        try {
            // Check if current directory is a git repository
            try {
                await execGit(["rev-parse", "--is-inside-work-tree"], currentPath);

                const { stdout } = await execGit(["rev-parse", "--show-toplevel"], currentPath);

                const repoRoot = stdout.trim();
                if (!repositories.includes(repoRoot)) {
                    repositories.push(repoRoot);
                }
                return; // Don't search deeper if we found a repo
            } catch {
                // Not a git repository, continue searching subdirectories
            }

            // Search subdirectories
            const entries = await readdir(currentPath);
            for (const entry of entries) {
                if (entry.startsWith('.') || ignoredDirs.includes(entry)) {
                    continue; // Skip hidden directories
                }

                const fullPath = path.join(currentPath, entry);
                try {
                    const stats = await stat(fullPath);
                    if (stats.isDirectory()) {
                        await searchRecursive(fullPath, depth + 1);
                    }
                } catch {
                    // Skip if we can't access the directory
                }
            }
        } catch {
            // Skip if we can't read the directory
        }
    }

    await searchRecursive(searchPath, 0);
    return repositories;
}

/**
 * Find the git repository root starting from a given directory
 * @param startPath The directory to start searching from
 * @returns Promise<string> The path to the git repository root
 */
export async function findGitRepository(startPath: string): Promise<string> {
    // First, try searching up the directory tree (current behavior)
    let currentPath = startPath;

    while (currentPath !== path.dirname(currentPath)) {
        try {
            await execGit(["rev-parse", "--is-inside-work-tree"], currentPath);

            // Get the actual repository root
            const { stdout } = await execGit(["rev-parse", "--show-toplevel"], currentPath);

            return stdout.trim();
        } catch (error) {
            // Continue searching in parent directory
            currentPath = path.dirname(currentPath);
        }
    }

    // If no repository found going up, search subdirectories
    debugLog(`No git repository found going up from ${startPath}, searching subdirectories...`);
    const repositories = await findGitRepositoriesInSubdirectories(startPath);

    if (repositories.length === 0) {
        throw new Error("Not a git repository");
    }

    // If multiple repositories found, try to use VS Code's Git extension to find the active one
    if (repositories.length > 1) {
        debugLog(`Found ${repositories.length} repositories:`, repositories);

        const gitExtension = vscode.extensions.getExtension("vscode.git");
        if (gitExtension) {
            const git = gitExtension.exports.getAPI(1);
            if (git?.repositories) {
                // Find a repository that VS Code already knows about
                for (const repo of git.repositories) {
                    if (repo.rootUri && repositories.includes(repo.rootUri.fsPath)) {
                        debugLog(`Using VS Code discovered repository: ${repo.rootUri.fsPath}`);
                        return repo.rootUri.fsPath;
                    }
                }
            }
        }
    }

    // Return the first repository found
    debugLog(`Using first discovered repository: ${repositories[0]}`);
    return repositories[0];
}

/**
 * Validate git repository and return the repository root path
 * Also searches all workspace folders if multiple are open
 * @param workspaceFolder The workspace folder to start searching from
 * @returns Promise<string> The path to the git repository root
 */
export async function validateGitRepository(workspaceFolder?: vscode.WorkspaceFolder): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error("No workspace folder is open");
    }

    const searchFolder = workspaceFolder || workspaceFolders[0];

    try {
        return await findGitRepository(searchFolder.uri.fsPath);
    } catch (error) {
        // If we have multiple workspace folders, try searching them too
        if (workspaceFolders.length > 1) {
            debugLog(`Repository not found in ${searchFolder.uri.fsPath}, trying other workspace folders...`);

            for (const folder of workspaceFolders) {
                if (folder === searchFolder) {
                    continue; // Skip the one we already tried
                }

                try {
                    return await findGitRepository(folder.uri.fsPath);
                } catch {
                    // Continue to next folder
                }
            }
        }

        throw new Error("Not a git repository");
    }
}

export async function getDiff(workspaceFolder: vscode.WorkspaceFolder, repositoryRoot?: string): Promise<string> {
    // Use provided repository root or find it
    const repoRoot = repositoryRoot || await validateGitRepository(workspaceFolder);

    const config = vscode.workspace.getConfiguration("gitmind");
    const captureAllChanges = config.get<boolean>("commit.captureAllChanges", false);
    
    // Build pathspec exclusions
    const excludePatterns = config.get<string[]>("commit.excludeFiles", []);
    const excludeArgs = excludePatterns && excludePatterns.length > 0
        ? ["--", ".", ...excludePatterns.map(pattern => `:(exclude)${pattern}`)]
        : [];

    // Check if there are only lock files in the staging area
    let onlyLockFilesStaged = false;
    try {
        const { stdout: nameOnlyStdout } = await execGit(["diff", "--staged", "--name-only"], repoRoot);
        const stagedFiles = nameOnlyStdout
            .split("\n")
            .map((f) => f.trim())
            .filter((f) => f.length > 0);

        if (stagedFiles.length > 0) {
            onlyLockFilesStaged = stagedFiles.every((file) => {
                const lower = file.toLowerCase();
                return (
                    lower.endsWith(".lock") ||
                    lower.endsWith("-lock.json") ||
                    lower.endsWith("lock.yaml") ||
                    lower.endsWith("lock.json") ||
                    lower.endsWith("bun.lockb")
                );
            });
        }
    } catch (error) {
        debugLog("Error checking staged files for lock files:", error);
    }

    const stagedDiffArgs = ["diff", "--staged", ...(onlyLockFilesStaged ? [] : excludeArgs)];

    if (captureAllChanges) {
        const diffParts: string[] = [];

        const { stdout: stagedDiff } = await execGit(stagedDiffArgs, repoRoot, 10 * 1024 * 1024);

        const { stdout: unstagedDiff } = await execGit(["diff", ...excludeArgs], repoRoot, 10 * 1024 * 1024);

        const { stdout: untrackedFilesStdout } = await execGit(["ls-files", "--others", "--exclude-standard", "-z"], repoRoot);

        const untrackedFiles = untrackedFilesStdout
            .split("\0")
            .map((f) => f.trim())
            .filter((f) => f.length > 0);

        if (stagedDiff?.trim()) {
            diffParts.push(stagedDiff);
        }

        if (unstagedDiff?.trim()) {
            diffParts.push(unstagedDiff);
        }

        for (const filePath of untrackedFiles) {
            try {
                const { stdout: filePatch } = await execGit(["diff", "--no-index", "--", "/dev/null", filePath], repoRoot, 10 * 1024 * 1024);
                if (filePatch?.trim()) {
                    diffParts.push(filePatch);
                }
            } catch (error: unknown) {
                // git diff --no-index exits with code 1 when there are differences; capture stdout anyway
                const stdout: unknown = (error as { stdout?: unknown } | null)?.stdout;
                if (typeof stdout === "string" && stdout.trim().length > 0) {
                    diffParts.push(stdout);
                } else {
                    debugLog(`Failed to include untracked file diff for ${filePath}:`, error);
                }
            }
        }

        const combinedDiff = diffParts.join("\n\n").trim();
        if (!combinedDiff) {
            throw new Error("No changes detected");
        }

        return combinedDiff;
    }

    const { stdout: stagedDiff } = await execGit(stagedDiffArgs, repoRoot, 10 * 1024 * 1024);

    if (!stagedDiff) {
        const { stdout: unstagedDiff } = await execGit(["diff", ...excludeArgs], repoRoot, 10 * 1024 * 1024);

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

export async function getBranchName(repositoryRoot: string): Promise<string | undefined> {
    try {
        const { stdout } = await execGit(["rev-parse", "--abbrev-ref", "HEAD"], repositoryRoot);
        return stdout.trim();
    } catch (error) {
        debugLog("Error getting branch name:", error);
        return undefined;
    }
}

export async function setCommitMessage(message: CommitMessage, repositoryRoot?: string) {
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

    let targetRepository = repositories[0]; // fallback to first repository

    if (repositoryRoot) {
        // Use the specific repository root provided
        const matchingRepo = repositories.find((repo: any) => {
            return repo.rootUri && repo.rootUri.fsPath === repositoryRoot;
        });

        if (matchingRepo) {
            targetRepository = matchingRepo;
            debugLog(`Using specific repository: ${repositoryRoot}`);
        } else {
            debugLog(`Repository not found for root ${repositoryRoot}, using first available`);
        }
    } else {
        // Legacy behavior - find the repository that matches our workspace
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error("No workspace folder is open");
        }

        try {
            const repoRoot = await findGitRepository(workspaceFolders[0].uri.fsPath);
            // Find the repository that matches our discovered root
            const matchingRepo = repositories.find((repo: any) => {
                return repo.rootUri && repo.rootUri.fsPath === repoRoot;
            });

            if (matchingRepo) {
                targetRepository = matchingRepo;
            }
        } catch (error) {
            debugLog("Could not find matching repository, using first available:", error);
        }
    }

    // The reviewed draft is authoritative; do not silently add or remove its body.
    const formattedMessage = message.description?.trim()
        ? message.summary + '\n\n' + message.description.trim()
        : message.summary;

    targetRepository.inputBox.value = formattedMessage;
}
