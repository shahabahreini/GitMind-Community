import { AIProvider } from "./provider";
import { generateCommitPrompt, getPromptConfig, generateCommitHistoryAnalysisPrompt } from "./prompts";
import { debugLog } from "../debug/logger";
import { RequestManager } from "../../utils/requestManager";

export interface GenerationOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
}

export abstract class BaseAIProvider implements AIProvider {
    private _defaultGenerationOptions?: GenerationOptions;

    protected constructor(protected apiKey: string, protected model: string) { }

    protected getAbortController(): AbortController {
        return RequestManager.getInstance().getController();
    }

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

    protected enforceCommitMessageFormat(message: string): string {
        const lines = message.split('\n');

        if (lines.length === 0) {
            return message;
        }

        let subjectLine = lines[0].trim();

        if (subjectLine.length > 72) {
            subjectLine = subjectLine.substring(0, 72);
            if (subjectLine.lastIndexOf(' ') > 0) {
                subjectLine = subjectLine.substring(0, subjectLine.lastIndexOf(' '));
            }
        }

        return [subjectLine, ...lines.slice(1)].join('\n');
    }

    protected abstract generateResponse(prompt: string, options?: GenerationOptions): Promise<string>;

    abstract getModels(): Promise<string[]>;

    abstract validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }>;
}
