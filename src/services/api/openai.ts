import { debugLog } from "../debug/logger";

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
    // Latest GPT-4.1 Series
    "gpt-4.1": {
        maxTokens: 2000,
        temperature: 0.2,
    },
    "gpt-4.1-mini": {
        maxTokens: 1500,
        temperature: 0.2,
    },
    "gpt-4.1-nano": {
        maxTokens: 1000,
        temperature: 0.2,
    },
    // Reasoning Models
    "o3": {
        maxTokens: 2000,
        temperature: 0.1,
        supportsReasoning: true,
    },
    "o4-mini": {
        maxTokens: 1500,
        temperature: 0.1,
        supportsReasoning: true,
    },
    "o3-mini": {
        maxTokens: 1000,
        temperature: 0.1,
        supportsReasoning: true,
    },
    // GPT-4o Series
    "gpt-4o": {
        maxTokens: 1500,
        temperature: 0.2,
    },
    "gpt-4o-mini": {
        maxTokens: 1000,
        temperature: 0.2,
    },
    // Legacy Models
    "gpt-4-turbo": {
        maxTokens: 1500,
        temperature: 0.2,
    },
    "gpt-4": {
        maxTokens: 1500,
        temperature: 0.2,
    },
    "gpt-3.5-turbo": {
        maxTokens: 1000,
        temperature: 0.3,
    },
};

/**
 * Makes a request to the OpenAI API to generate a commit message
 * @param apiKey The OpenAI API key
 * @param model The model to use (e.g., "gpt-3.5-turbo")
 * @param diff Git diff to analyze
 * @param customContext Additional context provided by the user
 * @returns Generated commit message
 */
export async function callOpenAIAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    try {
        debugLog(`Calling OpenAI API with model: ${model}`);
        const prompt = createPromptFromDiff(diff, customContext);

        // Get model-specific configuration
        const modelConfig = MODEL_CONFIGS[model] || MODEL_CONFIGS["gpt-3.5-turbo"];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: modelConfig.temperature,
                max_tokens: modelConfig.maxTokens
            })
        });

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

            const userFriendlyError = getUserFriendlyErrorMessage(response.status, parsedError);
            throw new Error(userFriendlyError);
        }

        const data = await response.json();
        debugLog(`OpenAI API response received`);

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return formatCommitMessage(data.choices[0].message.content);
        } else {
            throw new Error('Invalid response format from OpenAI API');
        }
    } catch (error) {
        debugLog('Error in callOpenAIAPI:', error);

        // Re-throw our custom errors as-is
        if (error instanceof Error && error.message.includes('OpenAI')) {
            throw error;
        }

        throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Converts OpenAI API errors to user-friendly messages
 */
function getUserFriendlyErrorMessage(statusCode: number, parsedError: OpenAIError | null): string {
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
        case 429:
            return "OpenAI rate limit or quota exceeded. Please wait and try again.";
        case 500:
            return "OpenAI service error. Please try again later.";
        default:
            return `OpenAI API error (${statusCode}). Please try again.`;
    }
}

/**
 * Creates a prompt from the git diff to send to the model
 * @param diff Git diff to analyze
 * @param customContext Additional context provided by the user
 * @returns Generated prompt
 */
function createPromptFromDiff(diff: string, customContext: string = ""): string {
    let prompt = `Generate a concise and informative git commit message based on the following changes.
Focus on what was changed and why. Keep the message under 72 characters for the summary line.
If verbose mode is needed, add bullet points explaining key changes.`;

    // Add custom context if provided
    if (customContext.trim()) {
        prompt += `\n\nAdditional context from the user: ${customContext.trim()}`;
    }

    prompt += `\n\nHere are the changes:

\`\`\`
${diff}
\`\`\`

Git Commit Message:`;

    return prompt;
}

/**
 * Cleans up and formats the commit message returned by the API
 */
function formatCommitMessage(message: string): string {
    // Remove any "Git Commit Message:" or similar prefixes
    let formattedMessage = message.replace(/^(git commit message:?|commit message:?)/i, '').trim();

    // Remove any quotes that might wrap the message
    formattedMessage = formattedMessage.replace(/^["']|["']$/g, '');

    return formattedMessage;
}
