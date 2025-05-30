import { debugLog } from "../debug/logger";
import { generateCommitPrompt } from './prompts';
import { AnthropicModel } from "../../config/types";
import { RequestManager } from "../../utils/requestManager";

// Configuration for different Anthropic models
interface GenerationConfig {
    max_tokens: number;
    temperature: number;
    top_p: number;
    top_k?: number;
}

const MODEL_CONFIGS: Record<AnthropicModel, GenerationConfig> = {
    // Claude 4 Series (Latest)
    "claude-opus-4": {
        max_tokens: 350,
        temperature: 0.3,
        top_p: 0.8
    },
    "claude-sonnet-4": {
        max_tokens: 350,
        temperature: 0.3,
        top_p: 0.8
    },

    // Claude 3.7 Series
    "claude-sonnet-3.7": {
        max_tokens: 350,
        temperature: 0.3,
        top_p: 0.8
    },

    // Claude 3.5 Series
    "claude-3-5-sonnet-20241022": {
        max_tokens: 350,
        temperature: 0.3,
        top_p: 0.8
    },
    "claude-3-5-sonnet-20240620": {
        max_tokens: 350,
        temperature: 0.3,
        top_p: 0.8
    },
    "claude-3-5-haiku-20241022": {
        max_tokens: 350,
        temperature: 0.3,
        top_p: 0.8
    },

    // Claude 3 Series
    "claude-3-opus-20240229": {
        max_tokens: 350,
        temperature: 0.3,
        top_p: 0.8
    },
    "claude-3-sonnet-20240229": {
        max_tokens: 350,
        temperature: 0.3,
        top_p: 0.8
    },
    "claude-3-haiku-20240307": {
        max_tokens: 350,
        temperature: 0.3,
        top_p: 0.8
    }
};

/**
 * Enforces proper commit message format
 * @param message Raw message from API
 * @returns Properly formatted commit message
 */
function enforceCommitMessageFormat(message: string): string {
    // Split the message into lines
    const lines = message.split('\n');

    if (lines.length === 0) {
        return message;
    }

    // Get the first line (subject line)
    let subjectLine = lines[0].trim();

    // Truncate the subject line if it exceeds 72 characters
    if (subjectLine.length > 72) {
        subjectLine = subjectLine.substring(0, 72);
        // Ensure we don't cut in the middle of a word
        if (subjectLine.lastIndexOf(' ') > 0) {
            subjectLine = subjectLine.substring(0, subjectLine.lastIndexOf(' '));
        }
    }

    // Reconstruct the message with the truncated subject line
    return [subjectLine, ...lines.slice(1)].join('\n');
}

/**
 * Makes a request to the Anthropic API to generate a commit message
 * @param apiKey The Anthropic API key
 * @param model The model to use (from AnthropicModel enum)
 * @param diff Git diff to analyze
 * @param customContext Additional context provided by the user
 * @returns Generated commit message
 */
export async function callAnthropicAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    if (!apiKey || apiKey.trim() === '') {
        debugLog("Error: Anthropic API key is missing or empty");
        throw new Error("Anthropic API key is required but not configured");
    }

    // Validate model
    const validModels: AnthropicModel[] = [
        "claude-opus-4",
        "claude-sonnet-4",
        "claude-sonnet-3.7",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet-20240620",
        "claude-3-5-haiku-20241022",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307"
    ];
    if (!validModels.includes(model as AnthropicModel)) {
        debugLog("Error: Invalid Anthropic model specified", { model });
        throw new Error(`Invalid Anthropic model specified: ${model}`);
    }

    try {
        debugLog(`Calling Anthropic API with model: ${model}`);
        const promptText = generateCommitPrompt(diff, undefined, customContext);
        debugLog("Sending prompt to Anthropic API");
        debugLog("Prompt:", promptText);

        // Get model-specific configuration
        const config = MODEL_CONFIGS[model as AnthropicModel];
        if (!config) {
            throw new Error(`Configuration not found for model: ${model}`);
        }

        // Using the Messages API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: config.max_tokens,
                temperature: config.temperature,
                top_p: config.top_p,
                messages: [
                    {
                        role: "user",
                        content: promptText
                    }
                ]
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`Anthropic API error: ${response.status} ${errorText}`);

            // Try to parse the error response
            let errorMessage = `Anthropic API error: ${response.status}`;
            let errorType = '';

            try {
                const errorData = JSON.parse(errorText);
                // Handle Anthropic API error structure: { "error": { "message": "...", "type": "..." }, "type": "error" }
                if (errorData.error && errorData.error.message) {
                    errorMessage = errorData.error.message;
                    errorType = errorData.error.type || '';
                }
                // Fallback: check if there's a direct message field
                else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (parseError) {
                // If we can't parse the error, use the raw text
                errorMessage = errorText || errorMessage;
            }

            debugLog(`Parsed error - Type: ${errorType}, Message: ${errorMessage}`);

            // Handle specific error cases with more detailed messages
            if (response.status === 429) {
                const retryAfter = response.headers.get('retry-after');
                if (retryAfter) {
                    throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before retrying.`);
                } else {
                    throw new Error("Rate limit exceeded. Please try again later.");
                }
            } else if (response.status === 401) {
                // For 401 errors, use the actual error message from the API
                throw new Error(errorMessage);
            } else if (response.status === 400) {
                // For 400 errors, provide context based on error type
                if (errorType === 'invalid_request_error') {
                    throw new Error(`Invalid request: ${errorMessage}`);
                } else {
                    throw new Error(`Bad request: ${errorMessage}`);
                }
            } else if (response.status === 403) {
                // 403 typically indicates insufficient credits or permissions
                throw new Error(errorMessage);
            } else {
                throw new Error(errorMessage);
            }
        }

        const data = await response.json();
        debugLog(`Anthropic API response received`);

        // Log rate limiting information from response headers
        const headers = response.headers;
        const rateLimit = {
            requestsLimit: headers.get('anthropic-ratelimit-requests-limit'),
            requestsRemaining: headers.get('anthropic-ratelimit-requests-remaining'),
            requestsReset: headers.get('anthropic-ratelimit-requests-reset'),
            tokensLimit: headers.get('anthropic-ratelimit-tokens-limit'),
            tokensRemaining: headers.get('anthropic-ratelimit-tokens-remaining'),
            tokensReset: headers.get('anthropic-ratelimit-tokens-reset'),
            inputTokensLimit: headers.get('anthropic-ratelimit-input-tokens-limit'),
            inputTokensRemaining: headers.get('anthropic-ratelimit-input-tokens-remaining'),
            outputTokensLimit: headers.get('anthropic-ratelimit-output-tokens-limit'),
            outputTokensRemaining: headers.get('anthropic-ratelimit-output-tokens-remaining')
        };

        debugLog('Anthropic Rate Limit Info:', rateLimit);

        // Process the response based on Messages API format
        if (data.content && data.content.length > 0) {
            let fullText = "";
            for (const contentItem of data.content) {
                if (contentItem.type === "text") {
                    fullText += contentItem.text;
                }
            }

            debugLog(`Processing Response:\n${fullText}`);

            // Process the full text into a formatted commit message
            const formattedMessage = enforceCommitMessageFormat(fullText);
            debugLog("Anthropic API Response:", formattedMessage);
            return formattedMessage;
        } else {
            throw new Error('No text content found in Anthropic API response');
        }
    } catch (error) {
        debugLog("Anthropic API Call Failed:", error);

        // Handle abort error specifically
        if (error instanceof Error && (error.message === 'Request was cancelled' || error.name === 'AbortError')) {
            throw new Error('Request was cancelled');
        }

        // Handle rate limiting
        if (error instanceof Error && error.message.includes("rate limit")) {
            throw new Error("Rate limit exceeded. Please try again later.");
        }

        // Handle invalid API key
        if (error instanceof Error && error.message.includes("Invalid API key")) {
            throw new Error("Invalid API key. Please check your Anthropic API key.");
        }

        // Add specific handling for response processing errors
        if (error instanceof Error && error.message.includes("text")) {
            throw new Error("Failed to process Anthropic response: " + error.message);
        }

        // Handle other errors
        if (error instanceof Error) {
            throw new Error(`Anthropic API call failed: ${error.message}`);
        }

        throw new Error(`Unexpected error during Anthropic API call: ${String(error)}`);
    }
}

/**
 * Validates an Anthropic API key by making a simple request
 * @param apiKey The API key to validate
 * @returns Boolean indicating if the API key is valid
 */
export async function validateAnthropicAPIKey(apiKey: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: "claude-3-5-haiku-20241022",
                max_tokens: 10,
                messages: [
                    {
                        role: "user",
                        content: "Test"
                    }
                ]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        debugLog("API Key Validation Failed:", error);
        return false;
    }
}
