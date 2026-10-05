import { RequestContext } from "./requestContext";
import { ModelCapabilities } from "./capabilities";

/**
 * Interface for AI providers
 */
export interface AIProvider {
    getCapabilities(): ModelCapabilities;
    /**
     * Generate a commit message based on the diff
     * @param diff The git diff
     * @param customContext Optional custom context
     * @returns The generated commit message
     */
    generateCommitMessage(diff: string, customContext?: string, context?: RequestContext): Promise<string>;

    /**
     * Generate content using a raw prompt
     * @param prompt The prompt to send
     * @returns The generated content
     */
    generateWithRawPrompt(prompt: string, context?: RequestContext): Promise<string>;

    /**
     * Generate commit history analysis
     * @param commitHistory The commit history text
     * @param maxCommits Maximum number of commits included
     * @param includeAuthorInfo Whether to include author info
     * @returns The analysis result
     */
    generateCommitHistoryAnalysis(commitHistory: string, maxCommits: number, includeAuthorInfo: boolean, context?: RequestContext): Promise<string>;

    /**
     * Fetch available models
     * @returns List of model IDs
     */
    getModels(): Promise<string[]>;

    /**
     * Validate the API key
     * @returns True if valid, or detailed result
     */
    validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }>;
}
