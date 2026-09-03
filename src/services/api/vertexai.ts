import { BaseAIProvider, GenerationOptions } from "./base";

export class VertexAIProvider extends BaseAIProvider {
    constructor(model: string, private readonly project: string, private readonly location: string) {
        super("", model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        if (!this.project.trim()) {
            throw new Error("Google Cloud project ID is required for Vertex AI.");
        }
        if (!this.model.trim()) {
            throw new Error("Choose a Vertex AI model ID before generating a commit message.");
        }
        const { GoogleGenAI } = await import("@google/genai");
        const client = new GoogleGenAI({ vertexai: true, project: this.project, location: this.location });
        const response = await client.models.generateContent({
            model: this.model,
            contents: prompt,
            config: {
                temperature: options?.temperature ?? 0.2,
                maxOutputTokens: options?.maxTokens ?? 1000,
                ...(options?.topP === undefined ? {} : { topP: options.topP }),
                abortSignal: this.getAbortController().signal,
            },
        });
        if (!response.text) {
            throw new Error("Vertex AI returned an empty generation response.");
        }
        return this.enforceCommitMessageFormat(response.text.trim());
    }

    async getModels(): Promise<string[]> {
        return this.model.trim() ? [this.model.trim()] : [];
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; troubleshooting?: string }> {
        if (!this.project.trim()) {
            return { success: false, error: "Google Cloud project ID is required for Vertex AI." };
        }
        return true;
    }
}
