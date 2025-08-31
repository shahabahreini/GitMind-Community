import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { CommitMessage } from "../../config/types";
import { debugLog } from "../debug/logger";

const execAsync = promisify(exec);
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
    
    async function searchRecursive(currentPath: string, depth: number): Promise<void> {
        if (depth > maxDepth) {
            return;
        }
        
        try {
            // Check if current directory is a git repository
            try {
                await execAsync("git rev-parse --is-inside-work-tree", {
                    cwd: currentPath,
                    maxBuffer: 1024 * 1024
                });
                
                const { stdout } = await execAsync("git rev-parse --show-toplevel", {
                    cwd: currentPath,
                    maxBuffer: 1024 * 1024
                });
                
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
                if (entry.startsWith('.')) {
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
            await execAsync("git rev-parse --is-inside-work-tree", {
                cwd: currentPath,
                maxBuffer: 1024 * 1024
            });
            
            // Get the actual repository root
            const { stdout } = await execAsync("git rev-parse --show-toplevel", {
                cwd: currentPath,
                maxBuffer: 1024 * 1024
            });
            
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
    
    const { stdout: stagedDiff } = await execAsync("git diff --staged", {
        cwd: repoRoot,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large diffs
    });

    if (!stagedDiff) {
        const { stdout: unstagedDiff } = await execAsync("git diff", {
            cwd: repoRoot,
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large diffs
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

    const config = vscode.workspace.getConfiguration("gitmind");
    const isVerbose = config.get("commit.verbose", true);

    // Format message based on verbose setting
    const formattedMessage = isVerbose
        ? message.summary + '\n\n' + message.description
        : message.summary;

    targetRepository.inputBox.value = formattedMessage;
}


