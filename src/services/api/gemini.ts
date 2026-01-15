import { GoogleGenerativeAI } from "@google/generative-ai";
import { debugLog } from "../debug/logger";
import { GeminiModel } from "../../config/types";
import { RequestManager } from "../../utils/requestManager";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";

// Define generation configuration for different models
interface GenerationConfig {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
}

const MODEL_CONFIGS: Record<GeminiModel, GenerationConfig> = {
    // Gemini 2.5 Series - Max output: 65,536 tokens
    "gemini-2.5-pro": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 65536,
    },
    "gemini-2.5-flash": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 65536,
    },
    "gemini-2.5-flash-preview": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 65536,
    },
    "gemini-2.5-flash-lite": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 65536,
    },
    "gemini-2.5-flash-lite-preview": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 65536,
    },
    // Gemini 2.0 Series - Max output: 8,192 tokens
    "gemini-2.0-flash": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 8192,
    },
    "gemini-2.0-flash-lite": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 8192,
    },
};

type GeminiValidationResult = {
    success: boolean;
    error?: string;
    warning?: string;
    troubleshooting?: string;
};

export class GeminiProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const requestManager = RequestManager.getInstance();
        const controller = requestManager.getController();

        try {
            debugLog(`Calling Gemini API with model: ${this.model}`);

            // Validate API key
            if (!this.apiKey) {
                throw new Error("Gemini API key is required");
            }

            // Improved model validation and fallback logic
            let selectedModel = this.model as GeminiModel;
            const validModels = Object.keys(MODEL_CONFIGS) as GeminiModel[];

            if (!validModels.includes(selectedModel)) {
                // Log the issue for debugging
                debugLog("Warning: Unrecognized Gemini model, attempting to use as custom model ID", { model: this.model });

                // Try to use the provided model string directly if it looks like a valid Gemini model ID
                if (typeof this.model === 'string' && this.model.startsWith('gemini-')) {
                    debugLog("Using provided model string directly", { model: this.model });
                    selectedModel = this.model as GeminiModel;
                } else {
                    // Fall back to a stable model as last resort
                    debugLog("Falling back to default model", { defaultModel: "gemini-2.5-flash" });
                    selectedModel = "gemini-2.5-flash";
                }
            }

            // Get configuration for the selected model or use a reasonable default
            const config = MODEL_CONFIGS[selectedModel] || {
                temperature: 0.2,
                topK: 40,
                topP: 0.9,
                maxOutputTokens: 8000,
            };

            const temperature = options?.temperature ?? config.temperature;
            const maxOutputTokens = options?.maxTokens ?? config.maxOutputTokens;
            const topK = options?.topK ?? config.topK;
            const topP = options?.topP ?? config.topP;

            // Initialize the API
            const genAI = new GoogleGenerativeAI(this.apiKey);
            const generativeModel = genAI.getGenerativeModel({
                model: selectedModel,
                generationConfig: {
                    temperature: temperature,
                    topK: topK,
                    topP: topP,
                    maxOutputTokens: maxOutputTokens,
                },
            });

            // Generate content with abort signal support
            const result = await Promise.race([
                generativeModel.generateContent(prompt),
                new Promise((_, reject) => {
                    controller.signal.addEventListener('abort', () => {
                        reject(new Error('Request was cancelled'));
                    });
                })
            ]);

            const response = (result as any).response;
            const text = response.text();

            debugLog("Gemini API response:", { text });
            return text;
        } catch (error) {
            debugLog("Error in callGeminiAPI:", error);

            // Handle abort error specifically
            if (error instanceof Error && (error.message === 'Request was cancelled' || error.name === 'AbortError')) {
                throw new Error('Request was cancelled');
            }

            const status =
                typeof error === "object" &&
                    error !== null &&
                    "status" in error &&
                    typeof (error as { status?: unknown }).status === "number"
                    ? (error as { status: number }).status
                    : undefined;

            if (status === 429) {
                const retryDelay = this.getRetryDelaySeconds(error);
                const retryMessage = retryDelay ? ` Please retry in ${retryDelay}.` : " Please retry shortly.";
                throw new Error(
                    `Gemini rate limit / quota exceeded.${retryMessage} You can check quotas at https://ai.google.dev/gemini-api/docs/rate-limits and usage at https://ai.dev/rate-limit.`
                );
            }

            if (status === 401) {
                throw new Error("Authentication failed. Please verify your Gemini API key in settings.");
            }

            if (status === 403) {
                throw new Error(
                    `Access forbidden. Your Gemini API key may not have access to model '${this.model}' or you may have billing/quota restrictions.`
                );
            }

            // Provide more helpful error message
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes("not found") || errorMessage.includes("invalid model")) {
                throw new Error(`Model '${this.model}' not available or not supported. Please check if you have access to this model or try a different model.`);
            } else if (errorMessage.includes("permission") || errorMessage.includes("access")) {
                throw new Error(`Access denied to model '${this.model}'. Please verify your API key has access to this model.`);
            } else {
                throw new Error(`Failed to generate commit message: ${errorMessage}`);
            }
        }
    }

    async getModels(): Promise<string[]> {
        debugLog("Fetching Gemini models...");

        try {
            const response = await loggedFetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }, { provider: "gemini", operation: "models.list" });

            if (!response.ok) {
                let errorMessage = `API Error: ${response.status} ${response.statusText}`;

                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        const { code, message, status } = errorData.error;

                        switch (response.status) {
                            case 400:
                                errorMessage = `Invalid request: ${message || 'The request is malformed or missing required parameters'}`;
                                break;
                            case 401:
                                errorMessage = `Authentication failed: ${message || 'Invalid or missing API key'}`;
                                break;
                            case 403:
                                errorMessage = `Access denied: ${message || 'API key does not have permission to access models'}`;
                                break;
                            case 404:
                                errorMessage = `Not found: ${message || 'The models endpoint was not found'}`;
                                break;
                            case 429:
                                errorMessage = `Rate limit exceeded: ${message || 'Too many requests. Please try again later'}`;
                                break;
                            case 500:
                            case 502:
                            case 503:
                            case 504:
                                errorMessage = `Server error: ${message || 'Gemini API is experiencing issues. Please try again later'}`;
                                break;
                            default:
                                errorMessage = `Error ${code || response.status}: ${message || response.statusText}`;
                        }
                    }
                } catch (parseError) {
                    debugLog("Error parsing Gemini API error response:", parseError);
                }

                debugLog("Gemini API error response:", errorMessage);
                throw new Error(errorMessage);
            }

            const data: GeminiModelResponse = await response.json();

            if (!data.models || !Array.isArray(data.models)) {
                throw new Error('Invalid response format: missing models array');
            }

            // Filter models that support generateContent and are not legacy/experimental
            const supportedModels = data.models.filter(model =>
                model.supportedGenerationMethods?.includes('generateContent') &&
                !model.name.includes('legacy') &&
                !model.name.includes('experimental')
            );

            debugLog(`Found ${supportedModels.length} supported Gemini models`);

            // Extract model IDs from the filtered models
            const modelIds = supportedModels.map(model => {
                const modelId = model.name.replace('models/', ''); // Remove 'models/' prefix if present
                return modelId;
            });

            // Sort alphabetically for better user experience
            modelIds.sort();

            debugLog(`Returning ${modelIds.length} Gemini model IDs:`, modelIds);
            return modelIds;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            debugLog("Error fetching Gemini models:", errorMessage);
            throw new Error(`Failed to fetch Gemini models: ${errorMessage}`);
        }
    }

    async validateApiKey(): Promise<boolean | GeminiValidationResult> {
        try {
            if (!this.apiKey) {
                return { success: false, error: "API key not configured", troubleshooting: "Please enter your Gemini API key in the settings" };
            }

            const genAI = new GoogleGenerativeAI(this.apiKey);

            // Try with a stable model first
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
            });

            // Simple validation request
            const result = await model.generateContent("Test connection");
            debugLog("Gemini API validation successful:", result);

            if ((result as { response?: unknown }).response !== undefined) {
                return { success: true };
            }

            return {
                success: false,
                error: "Connection test failed",
                troubleshooting: "The Gemini API did not return a valid response. Please try again.",
            };
        } catch (error) {
            debugLog("Gemini API validation error:", error);

            const status =
                typeof error === "object" &&
                    error !== null &&
                    "status" in error &&
                    typeof (error as { status?: unknown }).status === "number"
                    ? (error as { status: number }).status
                    : undefined;

            if (status === 429) {
                const retryDelay = this.getRetryDelaySeconds(error);
                return {
                    success: true,
                    warning: "Rate limit / quota exceeded",
                    troubleshooting: retryDelay
                        ? `Gemini returned 429 Too Many Requests. Please wait ${retryDelay} before retrying, or upgrade your plan / increase quotas.`
                        : "Gemini returned 429 Too Many Requests. Please wait and retry, or upgrade your plan / increase quotas.",
                };
            }

            if (status === 401) {
                return {
                    success: false,
                    error: "Authentication failed",
                    troubleshooting: "Invalid or missing Gemini API key. Please verify your key in settings.",
                };
            }

            if (status === 403) {
                return {
                    success: false,
                    error: "Access forbidden",
                    troubleshooting: "Your Gemini API key may not have access to this model or your project may have restrictions. Check permissions and billing/quota settings.",
                };
            }

            const message = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                error: "Connection test failed",
                troubleshooting: message.trim().length > 0 ? message : "Please check your network connection and try again.",
            };
        }
    }

    private getRetryDelaySeconds(error: unknown): string | undefined {
        if (typeof error !== "object" || error === null) {
            return undefined;
        }

        const retryDelay = (error as { errorDetails?: unknown }).errorDetails;
        if (!Array.isArray(retryDelay)) {
            return undefined;
        }

        for (const detail of retryDelay) {
            if (
                typeof detail === "object" &&
                detail !== null &&
                "@type" in detail &&
                (detail as { "@type"?: unknown })["@type"] === "type.googleapis.com/google.rpc.RetryInfo" &&
                "retryDelay" in detail
            ) {
                const value = (detail as { retryDelay?: unknown }).retryDelay;
                if (typeof value === "string" && value.trim().length > 0) {
                    return value;
                }
            }
        }

        return undefined;
    }
}

export interface GeminiModelInfo {
    name: string;
    displayName: string;
    description: string;
    inputTokenLimit: number;
    outputTokenLimit: number;
    supportedGenerationMethods: string[];
    temperature: number;
    topP: number;
    topK: number;
}

export interface GeminiModelResponse {
    models: GeminiModelInfo[];
}

/**
 * Backward compatibility functions
 */
export async function callGeminiAPI(apiKey: string, model: string, diff: string, customContext?: string): Promise<string> {
    const provider = new GeminiProvider(apiKey, model);
    return provider.generateCommitMessage(diff, customContext);
}

export async function validateGeminiAPIKey(apiKey: string): Promise<boolean | GeminiValidationResult> {
    const provider = new GeminiProvider(apiKey, "");
    return provider.validateApiKey();
}

export async function fetchGeminiModels(apiKey: string): Promise<string[]> {
    const provider = new GeminiProvider(apiKey, "");
    return provider.getModels();
}
