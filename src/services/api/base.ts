import { AIProvider } from "./provider";
import { generateCommitPrompt, getPromptConfig, generateCommitHistoryAnalysisPrompt } from "./prompts";
import { debugLog } from "../debug/logger";

export interface GenerationOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
}

export abstract class BaseAIProvider implements AIProvider {
    private _defaultGenerationOptions?: GenerationOptions;

    protected constructor(protected apiKey: string, protected model: string) { }

    setDefaultGenerationOptions(options?: GenerationOptions): void {
        this._defaultGenerationOptions = options;
    }

    protected getMergedGenerationOptions(options?: GenerationOptions): GenerationOptions | undefined {
        if (!this._defaultGenerationOptions && !options) {
            return undefined;
        }
        return {
            ...(this._defaultGenerationOptions ?? {}),
            ...(options ?? {}),
        };
    }

    async generateCommitMessage(diff: string, customContext: string = ""): Promise<string> {
        debugLog(`Generating commit message with model: ${this.model}`);
        const prompt = await generateCommitPrompt(diff, getPromptConfig(), customContext);
        // Default commit message generation options can be handled by subclass or passed here
        return this.generateResponse(prompt, this.getMergedGenerationOptions(undefined));
    }

    async generateWithRawPrompt(prompt: string): Promise<string> {
        debugLog(`Generating with raw prompt with model: ${this.model}`);
        return this.generateResponse(prompt, this.getMergedGenerationOptions(undefined));
    }

    async generateCommitHistoryAnalysis(commitHistory: string, maxCommits: number, includeAuthorInfo: boolean): Promise<string> {
        debugLog(`Generating commit history analysis with model: ${this.model}`);
        const prompt = generateCommitHistoryAnalysisPrompt(commitHistory, maxCommits, includeAuthorInfo);
        // Analysis typically uses slightly higher temperature
        return this.generateResponse(prompt, this.getMergedGenerationOptions({ temperature: 0.2 }));
    }

    protected abstract generateResponse(prompt: string, options?: GenerationOptions): Promise<string>;

    abstract getModels(): Promise<string[]>;

    abstract validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }>;
}
