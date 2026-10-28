import { debugLog } from "../debug/logger";
import { DeepSeekModel } from "../../config/types";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";
import { getProviderDefaultModel } from "../../config/providerCatalog";

// Configuration for different DeepSeek models
interface GenerationConfig {
    temperature: number;
}

const MODEL_CONFIGS: Record<DeepSeekModel, GenerationConfig> = {
    "deepseek-flash": {
        temperature: 0.2
    },
    "deepseek-v4-pro": {
        temperature: 0.2
    }
};

export class DeepSeekProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const controller = this.getAbortController();

        if (!this.apiKey || this.apiKey.trim() === '') {
            debugLog("Error: DeepSeek API key is missing or empty");
            throw new Error("DeepSeek API key is required but not configured");
        }

        // Live discovery is authoritative; unknown IDs are sent as-is and rejected by the API if invalid.
        const knownModels: DeepSeekModel[] = ["deepseek-flash", "deepseek-v4-pro"];
        if (!this.model || !this.model.trim()) {
            throw new Error("Please select a DeepSeek model in the settings.");
        }
        if (!knownModels.includes(this.model as DeepSeekModel)) {
            debugLog("DeepSeek model not in the known list; using as model ID", { model: this.model });
        }

        try {
            debugLog(`Calling DeepSeek API with model: ${this.model}`);
            debugLog("Sending prompt to DeepSeek API");
            debugLog("Prompt:", prompt);

            // Get model-specific configuration
            const config = MODEL_CONFIGS[this.model as DeepSeekModel] ?? MODEL_CONFIGS["deepseek-flash"];
            if (!config) {
                throw new Error(`Configuration not found for model: ${this.model}`);
            }

            // DeepSeek uses OpenAI-compatible API format
            const response = await loggedFetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    // Thinking is on by default and shares max_tokens with the answer (https://api-docs.deepseek.com/guides/thinking_mode, 2026-10-28).
                    thinking: { type: "disabled" },
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
                    temperature: options?.temperature ?? config.temperature,
                    stream: false
                }),
                signal: controller.signal
            }, { provider: "deepseek", operation: "chat.completions" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`DeepSeek API error: ${response.status} ${errorText}`);

                // Try to parse the error response
                let errorMessage = `DeepSeek API error: ${response.status}`;
                let errorType = '';

                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.error && errorData.error.message) {
                        errorMessage = errorData.error.message;
                        errorType = errorData.error.type || '';
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (parseError) {
                    errorMessage = errorText || errorMessage;
                }

                debugLog(`Parsed error - Type: ${errorType}, Message: ${errorMessage}`);

                // Handle specific error cases based on DeepSeek error codes
                if (response.status === 429) {
                    const retryAfter = response.headers.get('retry-after');
                    if (retryAfter) {
                        throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before retrying.`);
                    } else {
                        throw new Error("Rate limit exceeded. Please try again later.");
                    }
                } else if (response.status === 401) {
                    throw new Error("Authentication failed. Please check your DeepSeek API key.");
                } else if (response.status === 402) {
                    throw new Error("Insufficient balance. Please check your account's balance and add funds if needed.");
                } else if (response.status === 400) {
                    throw new Error(`Invalid request format: ${errorMessage}`);
                } else if (response.status === 422) {
                    throw new Error(`Invalid parameters: ${errorMessage}`);
                } else if (response.status === 500) {
                    throw new Error("DeepSeek server error. Please retry your request after a brief wait.");
                } else if (response.status === 503) {
                    throw new Error("DeepSeek server is overloaded. Please retry your request after a brief wait.");
                } else {
                    throw new Error(errorMessage);
                }
            }

            const data = await response.json();
            debugLog(`DeepSeek API response received`);

            // Process the response in OpenAI format
            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                const content = data.choices[0].message.content;
                debugLog(`Processing Response:\n${content}`);

                // Process the content into a formatted commit message
                const formattedMessage = this.enforceCommitMessageFormat(content);
                debugLog("DeepSeek API Response:", formattedMessage);
                return formattedMessage;
            } else {
                throw new Error('No valid response found in DeepSeek API response');
            }
        } catch (error) {
            debugLog("DeepSeek API Call Failed:", error);

            // Handle abort error specifically
            if (error instanceof Error && (error.message === 'Request was cancelled' || error.name === 'AbortError')) {
                throw new Error('Request was cancelled');
            }

            // Handle rate limiting
            if (error instanceof Error && error.message.includes("rate limit")) {
                throw new Error("Rate limit exceeded. Please try again later.");
            }

            // Handle invalid API key
            if (error instanceof Error && error.message.includes("Authentication failed")) {
                throw new Error("Invalid API key. Please check your DeepSeek API key.");
            }

            // Add specific handling for response processing errors
            if (error instanceof Error && error.message.includes("response")) {
                throw new Error("Failed to process DeepSeek response: " + error.message);
            }

            // Handle other errors
            if (error instanceof Error) {
                throw new Error(`DeepSeek API call failed: ${error.message}`);
            }

            throw new Error(`Unexpected error during DeepSeek API call: ${String(error)}`);
        }
    }

    async getModels(): Promise<string[]> {
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error("DeepSeek API key is required to fetch models");
        }

        try {
            debugLog("Fetching DeepSeek models from API");

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await loggedFetch('https://api.deepseek.com/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            }, { provider: "deepseek", operation: "models.list" });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`DeepSeek models API error: ${response.status} ${errorText}`);

                if (response.status === 401) {
                    throw new Error("Authentication failed. Please check your DeepSeek API key.");
                } else if (response.status === 429) {
                    throw new Error("Rate limit exceeded. Please try again later.");
                } else {
                    throw new Error(`Failed to fetch models: ${response.status} ${errorText}`);
                }
            }

            const data = await response.json();
            debugLog("DeepSeek models API response:", data);

            // DeepSeek API returns models in OpenAI-compatible format
            if (data.data && Array.isArray(data.data)) {
                const modelIds = data.data
                    .map((model: any) => model.id)
                    .filter((id: string) => id && typeof id === 'string')
                    .sort();

                debugLog(`Found ${modelIds.length} DeepSeek models:`, modelIds);
                return modelIds;
            } else {
                throw new Error('Invalid response format from DeepSeek models API');
            }
        } catch (error) {
            debugLog("Failed to fetch DeepSeek models:", error);

            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timeout. Please try again.');
            }

            if (error instanceof Error) {
                throw error;
            }

            throw new Error(`Unexpected error fetching DeepSeek models: ${String(error)}`);
        }
    }

    async validateApiKey(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await loggedFetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: getProviderDefaultModel("deepseek", "deepseek-flash"),
                    messages: [
                        {
                            role: "user",
                            content: "Test"
                        }
                    ],
                    stream: false
                }),
                signal: controller.signal
            }, { provider: "deepseek", operation: "validate" });

            clearTimeout(timeoutId);

            // Check if the response is successful OR if it's a valid error response indicating the API key is valid
            if (response.ok) {
                return true;
            }

            // Handle specific error codes that indicate the API key is valid but other issues exist
            if (response.status === 400 || response.status === 422) {
                // Bad request - likely means API key is valid but request format has issues
                return true;
            }

            if (response.status === 429) {
                // Rate limit - API key is valid but rate limited
                return true;
            }

            if (response.status === 402) {
                // Insufficient balance - API key is valid but no credits
                return true;
            }

            // Status 401 or 403 means invalid API key
            if (response.status === 401 || response.status === 403) {
                return false;
            }

            // For other errors, try to parse the response to get more info
            try {
                const errorText = await response.text();
                const errorData = JSON.parse(errorText);

                // If we get a structured error response, it likely means the API key is valid
                if (errorData.error && errorData.error.message) {
                    // Check if it's specifically an auth error
                    if (errorData.error.message.toLowerCase().includes('authentication') ||
                        errorData.error.message.toLowerCase().includes('api key')) {
                        return false;
                    }
                    // Other structured errors suggest valid API key
                    return true;
                }
            } catch (parseError) {
                // If we can't parse the error, fall back to response status
            }

            // Default to false for unknown errors
            return false;
        } catch (error) {
            debugLog("API Key Validation Failed:", error);
            // Network errors or timeouts - assume key is invalid for safety
            return false;
        }
    }

    protected override enforceCommitMessageFormat(message: string): string {
        return super.enforceCommitMessageFormat(message);
    }
}

export async function fetchDeepSeekModels(apiKey: string): Promise<string[]> {
    const provider = new DeepSeekProvider(apiKey, "");
    return provider.getModels();
}

export async function validateDeepSeekAPIKey(apiKey: string): Promise<boolean> {
    const provider = new DeepSeekProvider(apiKey, "");
    return provider.validateApiKey() as Promise<boolean>;
}
