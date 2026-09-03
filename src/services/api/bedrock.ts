import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { fromIni } from "@aws-sdk/credential-providers";
import { BaseAIProvider, GenerationOptions } from "./base";

export class BedrockProvider extends BaseAIProvider {
    constructor(model: string, private readonly region: string, private readonly profile = "") {
        super("", model);
    }

    private client(): BedrockRuntimeClient {
        return new BedrockRuntimeClient({
            region: this.region,
            ...(this.profile.trim() ? { credentials: fromIni({ profile: this.profile.trim() }) } : {}),
        });
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        if (!this.model.trim()) {
            throw new Error("Choose an Amazon Bedrock model ID before generating a commit message.");
        }
        const response = await this.client().send(new ConverseCommand({
            modelId: this.model,
            messages: [{ role: "user", content: [{ text: prompt }] }],
            inferenceConfig: {
                temperature: options?.temperature ?? 0.2,
                maxTokens: options?.maxTokens ?? 1000,
                ...(options?.topP === undefined ? {} : { topP: options.topP }),
            },
        }), { abortSignal: this.getAbortController().signal });
        const content = response.output?.message?.content?.find(part => typeof part.text === "string")?.text;
        if (!content) {
            throw new Error("Amazon Bedrock returned an empty Converse response.");
        }
        return this.enforceCommitMessageFormat(content.trim());
    }

    async getModels(): Promise<string[]> {
        return this.model.trim() ? [this.model.trim()] : [];
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; troubleshooting?: string }> {
        try {
            await this.client().config.credentials();
            return true;
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error), troubleshooting: "Configure AWS credentials or an AWS profile with Amazon Bedrock access." };
        }
    }
}
