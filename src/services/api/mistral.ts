import { debugLog } from "../debug/logger";
import { MistralResponse, MistralRateLimit } from "../../config/types";
import { BaseAIProvider, GenerationOptions } from "./base";
import { RequestContext } from "./requestContext";
import { loggedFetch } from "./loggedFetch";
import { answerText } from "./capabilities";
import { normalizeProviderError, ProviderApiError } from "./recovery";

function extractRateLimits(headers: Headers): MistralRateLimit {
    return {
        reset: parseInt(headers.get('ratelimitbysize-reset') || '0'),
        limit: parseInt(headers.get('ratelimitbysize-limit') || '0'),
        remaining: parseInt(headers.get('ratelimitbysize-remaining') || '0'),
        queryCost: parseInt(headers.get('ratelimitbysize-query-cost') || '0'),
        monthlyLimit: parseInt(headers.get('x-ratelimitbysize-limit-month') || '0'),
        monthlyRemaining: parseInt(headers.get('x-ratelimitbysize-remaining-month') || '0'),
        minuteLimit: parseInt(headers.get('x-ratelimitbysize-limit-minute') || '0'),
        minuteRemaining: parseInt(headers.get('x-ratelimitbysize-remaining-minute') || '0'),
        timestamp: Date.now()
    };
}

export class MistralProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const controller = this.getAbortController();

        debugLog("Calling Mistral API", { model: this.model });

        try {
            const response = await loggedFetch("https://api.mistral.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: "user", content: prompt }
                    ],
                    max_tokens: options?.maxTokens ?? 1024,
                    temperature: options?.temperature
                }),
                signal: controller.signal
            }, { provider: "mistral", operation: "chat.completions" });

            // Extract and log rate limits
            const rateLimits = extractRateLimits(response.headers);
            debugLog("Mistral API Rate Limits:", rateLimits);

            // Check if all rate limits are 0, which might indicate auth issues
            if (rateLimits.limit === 0 && rateLimits.remaining === 0 && rateLimits.monthlyLimit === 0) {
                debugLog("Warning: All Mistral rate limits are 0 - possible auth issue");
            }

            const result = await response.json() as MistralResponse;
            const generatedText = result?.choices?.[0]?.message?.content;
            const finish = result?.choices?.[0]?.finish_reason;
            if (finish === "length" || finish === "max_tokens") { throw new ProviderApiError("Provider output was truncated.", { category: "invalid-response" }); }
            if (finish === "content_filter") { throw new ProviderApiError("Provider blocked the answer.", { category: "content-filter" }); }
            return answerText(generatedText);

        } catch (error) {
            throw normalizeProviderError(error, "mistral");
        }
    }

    override async prepareCapabilities(context?: RequestContext): Promise<void> {
        await this.discoverLargeModel(context, signal => this.getModels(signal));
    }

    async getModels(signal?: AbortSignal): Promise<string[]> {
        try {
            const response = await loggedFetch("https://api.mistral.ai/v1/models", {
                method: "GET",
                signal,
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Accept": "application/json"
                }
            }, { provider: "mistral", operation: "models.list" });

            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            for (const model of Array.isArray(data.data) ? data.data : []) {
                this.rememberModelLimits(model.id, model.max_context_length, undefined);
            }
            // Filter models that have completion_chat capability set to true
            const chatModels = data.data
                .filter((model: any) => model.capabilities?.completion_chat === true)
                .map((model: any) => model.id);

            debugLog("Available Mistral chat models:", chatModels);
            return chatModels;
        } catch (error) {
            debugLog("Error fetching Mistral models:", error);
            throw error;
        }
    }

    async validateApiKey(): Promise<boolean> {
        // Mistral specific rate limit check as used in validation.ts is complex.
        // For now using simple model check similar to other providers.
        try {
            const response = await loggedFetch("https://api.mistral.ai/v1/models", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Accept": "application/json"
                }
            }, { provider: "mistral", operation: "models.validate" });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

}

export async function fetchMistralModels(apiKey: string): Promise<string[]> {
    const provider = new MistralProvider(apiKey, "");
    return provider.getModels();
}
