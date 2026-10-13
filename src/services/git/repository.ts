import { MEDIA_FILE } from "./media";
import { createDiffSpool, DiffSpool } from "./diffSpool";
import { describeStructuredData, isGeneratedLockfile, isStructuredData, LOCKFILE_BYTES, STRUCTURED_DATA_BYTES } from "./structuredData";
import { RequestContext } from "../api/requestContext";
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
const lstat = promisify(fs.lstat);

// Media is represented by filename only. Exceptionally large source files are
// also represented by filename so minified/generated bodies do not consume
// requests or the provider's token-per-minute quota.
const SOURCE_FILE = /\.(?:c|cc|cpp|cs|css|dart|go|h|hpp|html?|java|js|jsx|json|kt|kts|lua|m|mm|php|py|rb|rs|scala|scss|sh|sql|svelte|swift|ts|tsx|vue|xml|ya?ml)$/i;
const LARGE_SOURCE_BYTES = 1024 * 1024;

async function structuredDataNote(repoRoot: string, file: string, staged: boolean, deleted: boolean, signal?: AbortSignal): Promise<string | undefined> {
    const lockfile = isGeneratedLockfile(file);
    if (!lockfile && !isStructuredData(file)) { return undefined; }
    signal?.throwIfAborted();
    const reference = staged && !deleted ? `:${file}` : `HEAD:${file}`;
    let bytes: number;
    try {
        bytes = staged || deleted
            ? Number((await execGit(["cat-file", "-s", reference], repoRoot)).stdout.trim())
            : (await lstat(path.join(repoRoot, file))).size;
    } catch { return undefined; }
    if (!Number.isSafeInteger(bytes) || bytes < (lockfile ? LOCKFILE_BYTES : STRUCTURED_DATA_BYTES)) { return undefined; }
    if (bytes > LARGE_SOURCE_BYTES) { return `${lockfile ? "generated dependency lockfile" : "large structured data"}; ${bytes} bytes; content summarized by filename and size`; }
    signal?.throwIfAborted();
    try {
        const text = staged || deleted
            ? (await execGit(["show", reference], repoRoot, LARGE_SOURCE_BYTES + 4096)).stdout
            : await fs.promises.readFile(path.join(repoRoot, file), "utf8");
        return describeStructuredData(file, text);
    } catch { return `${lockfile ? "generated dependency lockfile" : "structured data"}; ${bytes} bytes; content summarized by filename and size`; }
}

async function omittedContentReason(repoRoot: string, file: string): Promise<string | undefined> {
    if (MEDIA_FILE.test(file)) { return "media content"; }
    if (!SOURCE_FILE.test(file)) { return undefined; }
    try {
        const info = await lstat(path.join(repoRoot, file));
        return info.isFile() && info.size > LARGE_SOURCE_BYTES ? "source file over 1 MiB" : undefined;
    } catch { return undefined; } // Deleted source still has an informative Git patch.
}

async function omittedFiles(repoRoot: string, args: string[], signal?: AbortSignal): Promise<{ excludes: string[]; notes: string[] }> {
    const excludes: string[] = [];
    const notes: string[] = [];
    const fields = gitNames(args, repoRoot, signal)[Symbol.asyncIterator]();
    try {
        for (let next = await fields.next(); !next.done; next = await fields.next()) {
            signal?.throwIfAborted();
            const status = next.value;
            const first = await fields.next();
            if (first.done) { throw new Error("Git returned an incomplete change record."); }
            const renamed = /^[RC]/.test(status);
            const second = renamed ? await fields.next() : first;
            if (second.done) { throw new Error("Git returned an incomplete rename record."); }
            const file = second.value;
            const structured = await structuredDataNote(repoRoot, file, args.includes("--staged"), status.startsWith("D"), signal)
                ?? (renamed ? await structuredDataNote(repoRoot, first.value, args.includes("--staged"), status.startsWith("D"), signal) : undefined);
            const reason = await omittedContentReason(repoRoot, first.value) || await omittedContentReason(repoRoot, file);
            if (structured || reason) {
                excludes.push(...[...new Set([first.value, file])].map(name => `:(exclude,literal)${name}`));
                const kind = ({ A: "added", D: "deleted", M: "modified", R: "renamed", C: "copied", T: "type changed" } as Record<string, string>)[status[0]] ?? status;
                const names = renamed ? `${JSON.stringify(first.value)} -> ${JSON.stringify(file)}` : JSON.stringify(file);
                notes.push(`Changed file ${names} (${kind}): ${structured ? `${structured}; detailed records omitted from AI input` : `${reason} omitted from AI input`}.\n`);
            }
        }
    } finally { await fields.return(undefined); }
    return { excludes, notes };
}

function diffPathspec(user: string[], automatic: string[]): string[] {
    return user.length || automatic.length ? ["--", ".", ...user.map(pattern => `:(exclude)${pattern}`), ...automatic] : [];
}

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

export async function getDiff(workspaceFolder: vscode.WorkspaceFolder, repositoryRoot?: string, context?: RequestContext): Promise<string> {
    const spool = await getDiffInput(workspaceFolder, repositoryRoot, context);
    try {
        let diff = "";
        for await (const block of spool) { diff += block; }
        return diff;
    } finally { await spool.dispose(); }
}

export async function getDiffInput(workspaceFolder: vscode.WorkspaceFolder, repositoryRoot?: string, context?: RequestContext): Promise<DiffSpool> {
    const repoRoot = repositoryRoot || await validateGitRepository(workspaceFolder);
    const config = vscode.workspace.getConfiguration("gitmind");
    const testSettings = (globalThis as any).__generationSettings;
    const captureAllChanges = testSettings && "commit.captureAllChanges" in testSettings ? Boolean(testSettings["commit.captureAllChanges"]) : config.get<boolean>("commit.captureAllChanges", false);
    const excludePatterns = testSettings && "commit.excludeFiles" in testSettings ? testSettings["commit.excludeFiles"] : config.get<string[]>("commit.excludeFiles", []);
    const excludeArgs = diffPathspec(excludePatterns, []);
    const signal = context?.signal;
    signal?.throwIfAborted();
    let onlyLockFiles = true;
    let stagedCount = 0;
    for await (const file of gitNames(["diff", "--staged", "--name-only", "-z"], repoRoot, signal)) {
        stagedCount++;
        onlyLockFiles &&= /(?:\.lock|-lock\.json|lock\.ya?ml|lock\.json|bun\.lockb)$/i.test(file);
    }
    onlyLockFiles &&= stagedCount > 0;
    const spool = await createDiffSpool();
    try {
        const stagedUserExcludes = onlyLockFiles ? [] : excludePatterns;
        const staged = await omittedFiles(repoRoot, ["diff", "--staged", "--name-status", "--find-renames", "-z", ...diffPathspec(stagedUserExcludes, [])], signal);
        await spool.append(["diff", "--no-ext-diff", "--no-textconv", "--unified=0", "--staged", ...diffPathspec(stagedUserExcludes, staged.excludes)], repoRoot, signal);
        if (staged.notes.length) { await spool.appendText(staged.notes.join(""), signal); }
        if (captureAllChanges || !spool.size) {
            if (!captureAllChanges) {
                const answer = await vscode.window.showWarningMessage("No staged changes found. Would you like to generate a commit message for unstaged changes?", "Yes", "No");
                signal?.throwIfAborted();
                if (answer !== "Yes") { throw new Error("Operation cancelled"); }
            }
            const unstaged = await omittedFiles(repoRoot, ["diff", "--name-status", "--find-renames", "-z", ...excludeArgs], signal);
            await spool.append(["diff", "--no-ext-diff", "--no-textconv", "--unified=0", ...diffPathspec(excludePatterns, unstaged.excludes)], repoRoot, signal);
            if (unstaged.notes.length) { await spool.appendText(unstaged.notes.join(""), signal); }
        }
        if (captureAllChanges) {
            for await (const file of gitNames(["ls-files", "--others", "--exclude-standard", "-z", ...excludeArgs], repoRoot, signal)) {
                const structured = await structuredDataNote(repoRoot, file, false, false, signal);
                const reason = await omittedContentReason(repoRoot, file);
                if (structured) { await spool.appendText(`Changed file ${JSON.stringify(file)} (added, untracked): ${structured}; detailed records omitted from AI input.\n`, signal); }
                else if (reason) { await spool.appendText(`Changed file ${JSON.stringify(file)} (added, untracked): ${reason} omitted from AI input.\n`, signal); }
                else { await spool.append(["diff", "--no-ext-diff", "--no-textconv", "--unified=0", "--no-index", "--", "/dev/null", file], repoRoot, signal, true); }
            }
        }
        return spool;
    } catch (error) { await spool.dispose(); throw error; }
}

async function* gitNames(args: readonly string[], cwd: string, signal?: AbortSignal): AsyncGenerator<string> {
    const spool = await createDiffSpool();
    try {
        await spool.append(args, cwd, signal);
        let pending = "";
        for await (const block of spool) {
            signal?.throwIfAborted();
            const names = (pending + block).split("\0");
            pending = names.pop() ?? "";
            for (const name of names) { if (name) { yield name; } }
        }
        if (pending) { throw new Error("Git returned an incomplete filename list."); }
    } finally { await spool.dispose(); }
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
            throw new Error("The requested repository is unavailable in Source Control. Reopen it and generate again.");
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
