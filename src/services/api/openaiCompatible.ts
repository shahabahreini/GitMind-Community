import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";
import { ProviderApiError } from "./recovery";

export type OpenAICompatibleHeaders = Record<string, string>;

function normalizeBaseUrl(url: string): string {
    return url.trim().replace(/\/+$/, "");
}

export abstract class OpenAICompatibleProvider extends BaseAIProvider {
    protected constructor(
        apiKey: string,
        model: string,
        private readonly baseUrl: string,
        private readonly provider: "lmstudio" | "azureopenai" | "cloudflare",
        private readonly headers: OpenAICompatibleHeaders,
    ) {
        super(apiKey, model);
    }

    protected get endpoint(): string {
        return normalizeBaseUrl(this.baseUrl);
    }

    protected assertConfigured(): void {
        if (!this.model.trim()) {
            throw new Error(`Choose a ${this.provider} model before generating a commit message.`);
        }
        if (!this.endpoint) {
            throw new Error(`${this.provider} endpoint is required.`);
        }
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        this.assertConfigured();
        const response = await loggedFetch(`${this.endpoint}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...this.headers },
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: "user", content: prompt }],
                temperature: options?.temperature ?? 0.2,
                max_tokens: options?.maxTokens ?? 1000,
                ...(options?.topP === undefined ? {} : { top_p: options.topP }),
            }),
            signal: this.getAbortController().signal,
        }, { provider: this.provider, operation: "chat.completions" });

        if (!response.ok) {
            throw new ProviderApiError(
                `${this.provider} chat completion failed (${response.status}).`,
                response.status,
                undefined,
                this.provider,
            );
        }

        const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        const content = body.choices?.[0]?.message?.content;
        if (!content) {
            throw new ProviderApiError(`${this.provider} returned an invalid chat completion response.`, undefined, undefined, this.provider);
        }
        return this.enforceCommitMessageFormat(content.trim());
    }

    async getModels(): Promise<string[]> {
        if (!this.endpoint) {
            return [];
        }
        const response = await loggedFetch(`${this.endpoint}/models`, {
            headers: { Accept: "application/json", ...this.headers },
        }, { provider: this.provider, operation: "models.list" });
        if (!response.ok) {
            throw new ProviderApiError(`${this.provider} model discovery failed (${response.status}).`, response.status, undefined, this.provider);
        }
        const body = await response.json() as { data?: Array<{ id?: unknown }> };
        return [...new Set((body.data ?? [])
            .map(model => typeof model.id === "string" ? model.id.trim() : "")
            .filter((id): id is string => id.length > 0))]
            .sort((a, b) => a.localeCompare(b));
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; troubleshooting?: string }> {
        try {
            await this.getModels();
            return true;
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
}
