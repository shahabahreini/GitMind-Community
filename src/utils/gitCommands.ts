import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { debugLog } from '../services/debug/logger';
import { findGitRepository } from '../services/git/repository';

const execAsync = promisify(exec);

/**
 * Interface for Git command execution result
 */
interface GitCommandResult {
    stdout: string;
    stderr: string;
}

/**
 * Execute a git command in the git repository root
 * @param command The git command to execute
 * @param workspacePath Optional workspace path to start searching from
 * @returns Promise<GitCommandResult>
 */
async function executeGitCommand(command: string, workspacePath?: string): Promise<GitCommandResult> {
    try {
        const searchPath = workspacePath || getWorkspacePath();
        const repoRoot = await findGitRepository(searchPath);
        const { stdout, stderr } = await execAsync(command, {
            cwd: repoRoot,
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large git outputs
        });
        return { stdout, stderr };
    } catch (error) {
        debugLog('Git command execution error:', error);
        throw new Error(`Git command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get the current workspace path
 * @returns string
 * @throws Error if no workspace is open
 */
function getWorkspacePath(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder is open');
    }
    return workspaceFolders[0].uri.fsPath;
}

/**
 * Validate if the current directory is a git repository
 * @returns Promise<boolean>
 */
export async function validateGitRepository(): Promise<boolean> {
    try {
        await executeGitCommand('git rev-parse --is-inside-work-tree');
        return true;
    } catch (error) {
        debugLog('Git repository validation failed:', error);
        return false;
    }
}

/**
 * Get the git diff of staged changes
 * @returns Promise<string>
 */
export async function getDiff(): Promise<string> {
    try {
        // First check if there are any staged changes
        const { stdout: stagedFiles } = await executeGitCommand('git diff --cached --name-only');

        if (!stagedFiles.trim()) {
            throw new Error('No staged changes found. Please stage your changes using "git add" first.');
        }

        // Get the diff of staged changes
        const { stdout: diff } = await executeGitCommand('git diff --cached');

        if (!diff.trim()) {
            throw new Error('No differences found in staged changes.');
        }

        return diff;
    } catch (error) {
        debugLog('Get diff failed:', error);
        throw error;
    }
}

/**
 * Set the commit message in the SCM input box
 * @param summary The commit summary (first line)
 * @param description The commit description (subsequent lines)
 */
export async function setCommitMessage(summary: string, description?: string): Promise<void> {
    try {
        const scm = vscode.scm.createSourceControl('git', 'Git');
        const inputBox = scm.inputBox;

        // Construct the commit message
        let commitMessage = summary;
        if (description && description.trim()) {
            commitMessage += '\n\n' + description.trim();
        }

        // Set the commit message
        inputBox.value = commitMessage;

        // Dispose of the temporary SCM provider
        scm.dispose();
    } catch (error) {
        debugLog('Set commit message failed:', error);
        throw new Error('Failed to set commit message in the SCM input box');
    }
}

/**
 * Get the current branch name
 * @returns Promise<string>
 */
export async function getCurrentBranch(): Promise<string> {
    try {
        const { stdout } = await executeGitCommand('git rev-parse --abbrev-ref HEAD');
        return stdout.trim();
    } catch (error) {
        debugLog('Get current branch failed:', error);
        throw new Error('Failed to get current branch name');
    }
}

/**
 * Get the repository root directory
 * @param workspacePath Optional workspace path to start searching from
 * @returns Promise<string>
 */
export async function getRepositoryRoot(workspacePath?: string): Promise<string> {
    try {
        const searchPath = workspacePath || getWorkspacePath();
        return await findGitRepository(searchPath);
    } catch (error) {
        debugLog('Get repository root failed:', error);
        throw new Error('Failed to get repository root directory');
    }
}

/**
 * Check if there are any uncommitted changes
 * @returns Promise<boolean>
 */
export async function hasUncommittedChanges(): Promise<boolean> {
    try {
        const { stdout } = await executeGitCommand('git status --porcelain');
        return stdout.trim().length > 0;
    } catch (error) {
        debugLog('Check uncommitted changes failed:', error);
        throw new Error('Failed to check for uncommitted changes');
    }
}

/**
 * Get the last commit message
 * @returns Promise<string>
 */
export async function getLastCommitMessage(): Promise<string> {
    try {
        const { stdout } = await executeGitCommand('git log -1 --pretty=%B');
        return stdout.trim();
    } catch (error) {
        debugLog('Get last commit message failed:', error);
        throw new Error('Failed to get last commit message');
    }
}

/**
 * Get the commit history
 * @param count Number of commits to retrieve (default: 10)
 * @returns Promise<string[]>
 */
export async function getCommitHistory(count: number = 10): Promise<string[]> {
    try {
        const { stdout } = await executeGitCommand(`git log -${count} --pretty=format:"%h - %s"`);
        return stdout.split('\n').filter(line => line.trim());
    } catch (error) {
        debugLog('Get commit history failed:', error);
        throw new Error('Failed to get commit history');
    }
}

/**
 * Check if the current directory is the root of the git repository
 * @param workspacePath Optional workspace path to check
 * @returns Promise<boolean>
 */
export async function isRepositoryRoot(workspacePath?: string): Promise<boolean> {
    try {
        const currentPath = workspacePath || getWorkspacePath();
        const rootPath = await getRepositoryRoot(currentPath);
        return currentPath === rootPath;
    } catch (error) {
        debugLog('Check repository root failed:', error);
        throw new Error('Failed to check if current directory is repository root');
    }
}

/**
 * Get the git configuration value
 * @param key Configuration key
 * @returns Promise<string>
 */
export async function getGitConfig(key: string): Promise<string> {
    try {
        const { stdout } = await executeGitCommand(`git config --get ${key}`);
        return stdout.trim();
    } catch (error) {
        debugLog('Get git config failed:', error);
        throw new Error(`Failed to get git config value for key: ${key}`);
    }
}
