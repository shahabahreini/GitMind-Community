import { debugLog } from "../debug/logger";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";

/**
 * OpenAI API error types
 */
interface OpenAIError {
    error: {
        message: string;
        type: string;
        param?: string;
        code?: string;
    };
}

/**
 * Configuration for different OpenAI models
 */
interface ModelConfig {
    maxTokens: number;
    temperature: number;
    supportsReasoning?: boolean;
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
    "gpt-5.5": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.5-pro": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.4": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.4-pro": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.4-mini": { maxTokens: 2000, temperature: 0.2 },
    "gpt-5.4-nano": { maxTokens: 1000, temperature: 0.2 },
    "gpt-5-mini": { maxTokens: 2000, temperature: 0.2 },
    "gpt-5-nano": { maxTokens: 1000, temperature: 0.2 },
    "gpt-5": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5-pro": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.1": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.2": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.2-pro": { maxTokens: 4000, temperature: 0.2 },
    "gpt-4.1": { maxTokens: 2000, temperature: 0.2 },
    "gpt-4.1-mini": { maxTokens: 1500, temperature: 0.2 },
    "gpt-5.3-codex": { maxTokens: 4000, temperature: 0.2 },
    "gpt-oss-120b": { maxTokens: 2000, temperature: 0.2 },
    "gpt-oss-20b": { maxTokens: 2000, temperature: 0.2 },
    "o3-pro": { maxTokens: 4000, temperature: 0.1, supportsReasoning: true },
    "o3": { maxTokens: 2000, temperature: 0.1, supportsReasoning: true },
    "gpt-4o": { maxTokens: 2000, temperature: 0.2 },
    "gpt-4o-mini": { maxTokens: 1500, temperature: 0.2 },
    "gpt-4": { maxTokens: 2000, temperature: 0.2 },
    "gpt-5.3-chat-latest": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.2-chat-latest": { maxTokens: 4000, temperature: 0.2 },
    "chat-latest": { maxTokens: 2000, temperature: 0.2 }
};

export class OpenAIProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const controller = this.getAbortController();

        try {
            debugLog(`Calling OpenAI API with model: ${this.model}`);

            // Get model-specific configuration or use provided options
            const modelConfig = MODEL_CONFIGS[this.model] || MODEL_CONFIGS["gpt-5.5"];
            const temperature = options?.temperature ?? modelConfig.temperature;
            const maxTokens = options?.maxTokens ?? modelConfig.maxTokens;
            const topP = options?.topP;

            const response = await loggedFetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
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
                    max_tokens: maxTokens
                }),
                signal: controller.signal
            }, { provider: "openai", operation: "chat.completions" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`OpenAI API error: ${response.status} ${errorText}`);

                // Parse and handle specific OpenAI errors
                let parsedError: OpenAIError | null = null;
                try {
                    parsedError = JSON.parse(errorText) as OpenAIError;
                } catch (parseError) {
                    debugLog('Failed to parse OpenAI error response');
                }

                const userFriendlyError = this.getUserFriendlyErrorMessage(response.status, parsedError);
                throw new Error(userFriendlyError);
            }

            const data = await response.json();
            debugLog(`OpenAI API response received`);

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                return this.formatCommitMessage(data.choices[0].message.content);
            } else {
                throw new Error('Invalid response format from OpenAI API');
            }
        } catch (error) {
            debugLog('Error in OpenAIProvider.generateResponse:', error);

            // Handle abort error specifically
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }

            // Re-throw our custom errors as-is
            if (error instanceof Error && error.message.includes('OpenAI')) {
                throw error;
            }

            throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getModels(): Promise<string[]> {
        try {
            debugLog('Fetching OpenAI models');

            const response = await loggedFetch("https://api.openai.com/v1/models", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Accept": "application/json"
                }
            }, { provider: "openai", operation: "models.list" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`OpenAI API error while fetching models: ${response.status} ${errorText}`);

                // Parse error for better user feedback
                let parsedError: OpenAIError | null = null;
                try {
                    parsedError = JSON.parse(errorText) as OpenAIError;
                } catch (parseError) {
                    debugLog('Failed to parse OpenAI error response');
                }

                const userFriendlyError = this.getUserFriendlyErrorMessage(response.status, parsedError);
                throw new Error(userFriendlyError);
            }

            const data = await response.json();
            debugLog(`Received ${data.data?.length || 0} models from OpenAI API`);

            // Filter to only include chat-capable models (exclude TTS, DALL-E, Whisper, embeddings, etc.)
            const chatModels = data.data
                .filter((model: any) => {
                    const id = model.id.toLowerCase();
                    // Exclude non-chat models
                    return !id.includes('tts-') &&
                        !id.includes('dall-e') &&
                        !id.includes('whisper') &&
                        !id.includes('embedding') &&
                        !id.includes('davinci-002') &&
                        !id.includes('babbage-002') &&
                        !id.includes('moderation') &&
                        !id.includes('instruct') &&
                        !id.includes('audio') &&
                        !id.includes('transcribe') &&
                        !id.includes('sora') &&
                        !id.includes('image') &&
                        !id.includes('codex') &&
                        !id.includes('search') &&
                        // Include only GPT chat models and reasoning models (o-series)
                        (id.startsWith('gpt-') || id.startsWith('o') || id.startsWith('chatgpt'));
                })
                .map((model: any) => model.id)
                .sort((a: string, b: string) => {
                    // Sort by model series priority
                    const getPriority = (id: string): number => {
                        if (id.startsWith('gpt-5')) {
                            return 0;
                        }
                        if (id.startsWith('gpt-4.1')) {
                            return 1;
                        }
                        if (id.startsWith('o4')) {
                            return 2;
                        }
                        if (id.startsWith('o3')) {
                            return 3;
                        }
                        if (id.startsWith('o1')) {
                            return 4;
                        }
                        if (id.startsWith("gpt-5.5-instant")) {
                            return 5;
                        }
                        if (id.startsWith('gpt-4-turbo')) {
                            return 6;
                        }
                        if (id.startsWith('gpt-4')) {
                            return 7;
                        }
                        return 8;
                    };

                    const priorityA = getPriority(a);
                    const priorityB = getPriority(b);

                    if (priorityA !== priorityB) {
                        return priorityA - priorityB;
                    }

                    // Within same priority, sort by name
                    return a.localeCompare(b);
                });

            debugLog(`Filtered to ${chatModels.length} chat-capable models`);
            return chatModels;

        } catch (error) {
            debugLog('Error fetching OpenAI models:', error);

            // If it's already a user-friendly error, rethrow it
            if (error instanceof Error && error.message.includes('OpenAI')) {
                throw error;
            }

            throw new Error(`Failed to load OpenAI models: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async validateApiKey(): Promise<boolean> {
        const controller = this.getAbortController();

        try {
            const response = await loggedFetch("https://api.openai.com/v1/models", {
                headers: { "Authorization": `Bearer ${this.apiKey}` },
                signal: controller.signal
            }, { provider: "openai", operation: "models.validate" });
            return response.ok;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') { return false; }
            debugLog("OpenAI API validation error:", error);
            return false;
        }
    }

    /**
     * Converts OpenAI API errors to user-friendly messages
     */
    private getUserFriendlyErrorMessage(statusCode: number, parsedError: OpenAIError | null): string {
        if (parsedError?.error) {
            const { type, code, message } = parsedError.error;

            switch (statusCode) {
                case 401:
                    return "OpenAI API key is invalid or missing. Please check your API key in settings and ensure it's correct.";

                case 429:
                    if (code === "insufficient_quota") {
                        return "OpenAI quota exceeded. Please check your plan and billing details at https://platform.openai.com/billing";
                    } else if (code === "rate_limit_exceeded") {
                        return "OpenAI rate limit exceeded. Please wait a moment and try again.";
                    }
                    return "OpenAI request limit reached. Please wait and try again.";

                case 400:
                    if (type === "invalid_request_error") {
                        if (message.includes("context_length") || message.includes("token")) {
                            return "The git diff is too large for the selected model. Try:\n• Staging fewer files\n• Using gpt-4 for larger context\n• Breaking changes into smaller commits";
                        }
                        return `OpenAI request error: ${message}. Please check your model selection.`;
                    }
                    return "Invalid request to OpenAI API. Please check your settings.";

                case 403:
                    return "Access denied to OpenAI API. Please check your API key permissions.";

                case 404:
                    return "OpenAI model not found. Please select a different model in settings.";

                case 500:
                case 502:
                case 503:
                    return "OpenAI service is temporarily unavailable. Please try again later.";

                default:
                    return `OpenAI API error (${statusCode}): ${message}`;
            }
        }

        // Fallback for unparseable errors
        switch (statusCode) {
            case 401:
                return "OpenAI API key is invalid. Please check your settings.";
            case 400:
                return "Content may be too large for the model. Try staging fewer files.";
            case 429:
                return "OpenAI rate limit or quota exceeded. Please wait and try again.";
            case 500:
                return "OpenAI service error. Please try again later.";
            default:
                return `OpenAI API error (${statusCode}). Please try again.`;
        }
    }

    /**
     * Cleans up and formats the commit message returned by the API
     */
    private formatCommitMessage(message: string): string {
        // Remove any "Git Commit Message:" or similar prefixes
        let formattedMessage = message.replace(/^(git commit message:?|commit message:?)/i, '').trim();

        // Remove any quotes that might wrap the message
        formattedMessage = formattedMessage.replace(/^["']|["']$/g, '');

        return formattedMessage;
    }
}

export async function fetchOpenAIModels(apiKey: string): Promise<string[]> {
    const provider = new OpenAIProvider(apiKey, "");
    return provider.getModels();
}
