import { debugLog } from "../debug/logger";
import { RequestManager } from "../../utils/requestManager";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";

/**
 * Z.ai API error types
 */
interface ZaiError {
    error: {
        message: string;
        type: string;
        code?: string;
    };
}

export class ZaiProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const requestManager = RequestManager.getInstance();
        const controller = requestManager.getController();

        try {
            debugLog(`Calling Z.ai API with model: ${this.model}`);

            const temperature = options?.temperature ?? 0.2;
            const maxTokens = options?.maxTokens; // Let API use default if not specified
            const topP = options?.topP;

            const response = await loggedFetch('https://api.z.ai/api/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept-Language': 'en-US,en'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    ...(topP !== undefined && options?.temperature === undefined ? { top_p: topP } : {}),
                    temperature: temperature,
                    ...(maxTokens ? { max_tokens: maxTokens } : {})
                }),
                signal: controller.signal
            }, { provider: "zai", operation: "chat.completions" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Z.ai API error: ${response.status} ${errorText}`);

                let parsedError: ZaiError | null = null;
                try {
                    parsedError = JSON.parse(errorText) as ZaiError;
                } catch (parseError) {
                    debugLog('Failed to parse Z.ai error response');
                }

                const userFriendlyError = this.getUserFriendlyErrorMessage(response.status, parsedError);
                throw new Error(userFriendlyError);
            }

            const data = await response.json();
            debugLog(`Z.ai API response received`);

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                return this.formatCommitMessage(data.choices[0].message.content);
            } else {
                throw new Error('Invalid response format from Z.ai API');
            }
        } catch (error) {
            debugLog('Error in ZaiProvider.generateResponse:', error);

            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }

            if (error instanceof Error && error.message.includes('Z.ai')) {
                throw error;
            }

            throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getModels(): Promise<string[]> {
        // Return supported models hardcoded for now as per requirements
        return ['glm-4.7'];
    }

    async validateApiKey(): Promise<boolean> {
        try {
            // Try a minimal generation request to validate key since model list endpoint might not be available
            const response = await loggedFetch('https://api.z.ai/api/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "glm-4.7",
                    messages: [
                        { role: "user", content: "Hi" }
                    ],
                    max_tokens: 1
                })
            }, { provider: "zai", operation: "validate" });

            return response.ok;
        } catch (error) {
            debugLog("Z.ai API validation error:", error);
            return false;
        }
    }

    private getUserFriendlyErrorMessage(statusCode: number, parsedError: ZaiError | null): string {
        if (parsedError?.error) {
            const { message } = parsedError.error;
            return `Z.ai API error: ${message}`;
        }

        switch (statusCode) {
            case 401:
                return "Z.ai API key is invalid or missing. Please check your settings.";
            case 429:
                return "Z.ai rate limit exceeded. Please try again later.";
            case 500:
            case 502:
            case 503:
                return "Z.ai service is temporarily unavailable. Please try again later.";
            default:
                return `Z.ai API error (${statusCode}). Please try again.`;
        }
    }

    private formatCommitMessage(message: string): string {
        let formattedMessage = message.replace(/^(git commit message:?|commit message:?)/i, '').trim();
        formattedMessage = formattedMessage.replace(/^["']|["']$/g, '');
        return formattedMessage;
    }
}

export async function fetchZaiModels(apiKey: string): Promise<string[]> {
    const provider = new ZaiProvider(apiKey, "");
    return provider.getModels();
}
