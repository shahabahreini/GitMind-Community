import { debugLog } from "../debug/logger";
import { AnthropicModel } from "../../config/types";
import { RequestManager } from "../../utils/requestManager";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";

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
        temperature: 0.2,
        top_p: 0.8
    },
    "claude-sonnet-4": {
        max_tokens: 350,
        temperature: 0.2,
        top_p: 0.8
    },

    // Claude 3.5 Series
    "claude-3-5-sonnet-20241022": {
        max_tokens: 350,
        temperature: 0.2,
        top_p: 0.8
    },
    "claude-3-5-haiku-20241022": {
        max_tokens: 350,
        temperature: 0.2,
        top_p: 0.8
    }
};

export class AnthropicProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const requestManager = RequestManager.getInstance();
        const controller = requestManager.getController();

        if (!this.apiKey || this.apiKey.trim() === '') {
            debugLog("Error: Anthropic API key is missing or empty");
            throw new Error("Anthropic API key is required but not configured");
        }

        // Validate model
        const validModels: AnthropicModel[] = [
            "claude-opus-4",
            "claude-sonnet-4",
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022"
        ];

        // Use type assertion to check if model is in validModels, but proceed even if not perfectly matching
        // to allow for newer models not yet in the list
        if (!validModels.includes(this.model as AnthropicModel)) {
            debugLog("Warning: Anthropic model specified might not be in the known list", { model: this.model });
        }

        try {
            debugLog(`Calling Anthropic API with model: ${this.model}`);
            debugLog("Sending prompt to Anthropic API");
            debugLog("Prompt:", prompt);

            // Get model-specific configuration
            const config = MODEL_CONFIGS[this.model as AnthropicModel] || MODEL_CONFIGS["claude-3-5-sonnet-20241022"];
            const temperatureOverride = options?.temperature;
            // For commit messages we want strict max tokens, for analysis we might want more (handled by option or default)
            const maxTokens = options?.maxTokens ?? config.max_tokens;
            const topP = temperatureOverride === undefined ? options?.topP : undefined;
            const topK = options?.topK;

            // Anthropic constraint: don't send both temperature and top_p.
            // If the caller explicitly sets temperature, prefer it and drop top_p.
            // If top_p is provided (and temperature isn't explicitly overridden), omit temperature.
            const shouldSendTemperature = topP === undefined;
            const temperature = shouldSendTemperature ? (temperatureOverride ?? config.temperature) : undefined;

            // Using the Messages API
            const response = await loggedFetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: maxTokens,
                    ...(temperature !== undefined ? { temperature } : {}),
                    ...(topP !== undefined ? { top_p: topP } : {}),
                    ...(topK !== undefined ? { top_k: topK } : {}),
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                }),
                signal: controller.signal
            }, { provider: "anthropic", operation: "messages.create" });

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
                const formattedMessage = this.enforceCommitMessageFormat(fullText);
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

    async getModels(): Promise<string[]> {
        debugLog("Fetching Anthropic models...");

        try {
            const response = await loggedFetch(`https://api.anthropic.com/v1/models`, {
                method: 'GET',
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
            }, { provider: "anthropic", operation: "models.list" });

            if (!response.ok) {
                let errorMessage = `API Error: ${response.status} ${response.statusText}`;

                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        const { type, message } = errorData.error;

                        switch (response.status) {
                            case 400:
                                errorMessage = `Invalid request: ${message || 'There was an issue with the format or content of your request'}`;
                                break;
                            case 401:
                                errorMessage = `Authentication failed: ${message || 'There is an issue with your API key'}`;
                                break;
                            case 403:
                                errorMessage = `Permission denied: ${message || 'Your API key does not have permission to use the specified resource'}`;
                                break;
                            case 404:
                                errorMessage = `Not found: ${message || 'The requested resource was not found'}`;
                                break;
                            case 413:
                                errorMessage = `Request too large: ${message || 'Request exceeds the maximum allowed number of bytes'}`;
                                break;
                            case 429:
                                errorMessage = `Rate limit exceeded: ${message || 'Your account has hit a rate limit. Please try again later'}`;
                                break;
                            case 500:
                                errorMessage = `Server error: ${message || 'An unexpected error has occurred internal to Anthropic systems'}`;
                                break;
                            case 529:
                                errorMessage = `Service overloaded: ${message || 'Anthropic API is temporarily overloaded. Please try again later'}`;
                                break;
                            default:
                                errorMessage = `Error ${response.status}: ${message || response.statusText}`;
                        }
                    }
                } catch (parseError) {
                    debugLog("Error parsing Anthropic API error response:", parseError);
                }

                debugLog("Anthropic API error response:", errorMessage);
                throw new Error(errorMessage);
            }

            const data: AnthropicModelResponse = await response.json();

            if (!data.data || !Array.isArray(data.data)) {
                throw new Error('Invalid response format: missing data array');
            }

            // Extract model IDs from the response
            const modelIds = data.data
                .filter(model => model.type === 'model' && model.id) // Only include actual models with valid IDs
                .map(model => model.id);

            debugLog(`Found ${modelIds.length} Anthropic models`);

            // Sort alphabetically for better user experience
            modelIds.sort();

            debugLog(`Returning ${modelIds.length} Anthropic model IDs:`, modelIds);
            return modelIds;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            debugLog("Error fetching Anthropic models:", errorMessage);
            throw new Error(`Failed to fetch Anthropic models: ${errorMessage}`);
        }
    }

    async validateApiKey(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await loggedFetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
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
            }, { provider: "anthropic", operation: "messages.validate" });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            debugLog("API Key Validation Failed:", error);
            return false;
        }
    }

    private enforceCommitMessageFormat(message: string): string {
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
}

export interface AnthropicModelInfo {
    id: string;
    display_name: string;
    created_at: string;
    type: string;
}

export interface AnthropicModelResponse {
    data: AnthropicModelInfo[];
    first_id?: string;
    has_more: boolean;
    last_id?: string;
}

/**
 * Backward compatibility functions
 */
export async function callAnthropicAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    const provider = new AnthropicProvider(apiKey, model);
    return provider.generateCommitMessage(diff, customContext);
}

export async function validateAnthropicAPIKey(apiKey: string): Promise<boolean> {
    const provider = new AnthropicProvider(apiKey, "");
    return provider.validateApiKey() as Promise<boolean>;
}

export async function fetchAnthropicModels(apiKey: string): Promise<string[]> {
    const provider = new AnthropicProvider(apiKey, "");
    return provider.getModels();
}
