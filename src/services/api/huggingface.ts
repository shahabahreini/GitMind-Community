import axios from 'axios';
import { HuggingFaceResponse } from '../../config/types';
import { debugLog } from '../debug/logger';
import { generateCommitPrompt, getPromptConfig } from './prompts';
import { BaseAIProvider, GenerationOptions } from './base';
import { loggedFetch } from "./loggedFetch";
import { getProviderDefaultModel, PROVIDER_CATALOG, PROVIDER_IDS } from "../../config/providerCatalog";

/**
 * Hugging Face Inference Providers router (OpenAI-compatible). Replaces the legacy
 * serverless Inference API (api-inference.huggingface.co).
 * https://huggingface.co/docs/inference-providers/index
 */
export const HUGGINGFACE_ROUTER_URL = "https://router.huggingface.co/v1";

export interface HuggingFaceModel {
    id: string;
    downloads: number;
    likes: number;
    pipeline_tag?: string;
    library_name?: string;
}

export class HuggingFaceProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        debugLog("Calling Hugging Face API", { model: this.model });
        debugLog("Prompt:", prompt);

        // Validate model name
        if (!this.model || this.model.trim() === '') {
            throw new Error("Model name is required for Hugging Face API");
        }

        // Check if this looks like a model from another provider
        const suggestion = suggestCorrectProvider(this.model);
        if (suggestion.provider !== "Hugging Face") {
            debugLog(`Warning: Model ${this.model} appears to be from ${suggestion.provider}, not Hugging Face`);
            throw new Error(`Model '${this.model}' appears to be a ${suggestion.provider} model. Please switch to the ${suggestion.provider} provider and use model '${suggestion.model}', or select a Hugging Face model like '${getProviderDefaultModel("huggingface")}'.`);
        }

        // Check if model contains slash (indicating it's a proper model path)
        if (!this.model.includes('/')) {
            debugLog("Warning: Model name doesn't contain '/', might be invalid:", this.model);
            throw new Error(`Invalid model format: '${this.model}'. Hugging Face models should be in format 'organization/model-name' like '${getProviderDefaultModel("huggingface")}'.`);
        }

        try {
            const response = await loggedFetch(
                `${HUGGINGFACE_ROUTER_URL}/chat/completions`,
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({
                        model: this.model,
                        messages: [{ role: "user", content: prompt }],
                        ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
                        ...(options?.temperature === undefined ? {} : { temperature: options.temperature }),
                        stream: false,
                    }),
                },
                { provider: "huggingface", operation: "chat.completions" },
            );

            if (!response.ok) {
                let errorMessage: string;
                let detailedError: any = null;

                try {
                    // Try to get detailed error from JSON response
                    const errorData = await response.json();
                    detailedError = errorData;
                    errorMessage = errorData.error || errorData.message || 'Unknown error';
                } catch {
                    // If JSON parsing fails, try to get text response
                    try {
                        const errorText = await response.text();
                        errorMessage = errorText || response.statusText;
                    } catch {
                        // If all fails, use status text
                        errorMessage = response.statusText;
                    }
                }

                debugLog("Hugging Face API Error Details:", {
                    status: response.status,
                    statusText: response.statusText,
                    errorMessage: errorMessage,
                    model: this.model,
                    detailedError: detailedError
                });

                // Handle specific error cases
                if (response.status === 404) {
                    const suggestion = suggestCorrectProvider(this.model);

                    if (suggestion.provider !== "Hugging Face") {
                        throw new Error(`Model '${this.model}' not found on Hugging Face. This appears to be a ${suggestion.provider} model - please switch to the ${suggestion.provider} provider and use model '${suggestion.model}' instead.`);
                    } else {
                        throw new Error(`Model '${this.model}' not found on Hugging Face. Please try a verified model like '${suggestion.model}' or check the model name.`);
                    }
                } else if (response.status === 401) {
                    throw new Error(`Authentication failed. Please verify your Hugging Face API key in settings. You can get one at https://huggingface.co/settings/tokens`);
                } else if (response.status === 403) {
                    throw new Error(`Access denied to model '${this.model}'. This model may be private or require special permissions. Please check https://huggingface.co/models for available models.`);
                } else if (response.status === 410) {
                    throw new Error(`Hugging Face API endpoint is no longer supported. Please update to use the new inference API at https://huggingface.co/docs/api-inference. You can also try using the Hugging Face Serverless API with a compatible model.`);
                } else if (response.status === 429) {
                    throw new Error(`Rate limit exceeded for Hugging Face API. Please wait before retrying. Check your usage at https://huggingface.co/settings/billing`);
                } else if (response.status === 503) {
                    throw new Error(`Model '${this.model}' is currently loading or unavailable. This is usually temporary - please try again in a few minutes or select a different model.`);
                } else {
                    throw new Error(`Hugging Face API error (${response.status}): ${errorMessage}`);
                }
            }

            const data = await response.json() as any;
            const chatText = data?.choices?.[0]?.message?.content;
            if (typeof chatText === "string" && chatText.trim()) {
                return chatText.trim();
            }
            // Some providers may still return the legacy text-generation shape.
            const result = data as HuggingFaceResponse | HuggingFaceResponse[];

            if (!result) {
                throw new Error("Empty response from Hugging Face API");
            }

            debugLog("Raw Hugging Face API Response:", result);

            let generatedText: string;

            if (Array.isArray(result)) {
                if (result.length === 0) {
                    throw new Error("Empty response array from Hugging Face API");
                }
                generatedText = result[0]?.generated_text;
            } else {
                generatedText = result.generated_text;
            }

            if (!generatedText) {
                debugLog("No generated_text in response, full response:", result);

                // Try to extract text from other possible response formats
                if (Array.isArray(result) && result[0]) {
                    const firstResult = result[0];
                    if (typeof firstResult === 'string') {
                        generatedText = firstResult;
                    } else if (typeof firstResult === 'object' && firstResult !== null) {
                        // Check for various possible text properties
                        const possibleText = (firstResult as any).text || (firstResult as any).content || (firstResult as any).output;
                        if (possibleText && typeof possibleText === 'string') {
                            generatedText = possibleText;
                        }
                    }
                }

                if (!generatedText) {
                    throw new Error(`No generated text in response. Response format: ${JSON.stringify(result).substring(0, 200)}...`);
                }
            }

            debugLog("Extracted generated text:", { generatedText });

            // Clean up the generated text
            const cleanedText = generatedText.trim();
            if (cleanedText === '' || cleanedText === prompt) {
                throw new Error("Model returned empty or identical text. This model may not be suitable for text generation.");
            }

            return cleanedText;

        } catch (error) {
            if (error instanceof Error) {
                // If it's already a formatted error, rethrow it
                if (error.message.includes("Hugging Face API error")) {
                    throw error;
                }
                // Otherwise, wrap the error with more context
                throw new Error(`Hugging Face API call failed: ${error.message}`);
            }
            // For unknown error types
            throw new Error(`Unexpected error during Hugging Face API call: ${String(error)}`);
        }
    }

    /** Chat models currently served by at least one Inference Provider. */
    async getModels(): Promise<string[]> {
        try {
            debugLog('Fetching Hugging Face Inference Providers models...');
            const response = await axios.get(`${HUGGINGFACE_ROUTER_URL}/models`, {
                headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {},
                timeout: 30000
            });
            const models = Array.isArray(response.data?.data) ? response.data.data : [];
            const ids: string[] = models
                .map((model: { id?: unknown }) => model?.id)
                .filter((id: unknown): id is string => typeof id === 'string' && id.includes('/'));
            if (ids.length === 0) {
                throw new Error('Invalid response format from Hugging Face API');
            }
            debugLog(`Successfully fetched ${ids.length} Hugging Face models`);
            return Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b));
        } catch (error) {
            debugLog('Error fetching Hugging Face models:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Invalid Hugging Face access token. Please verify your token at https://huggingface.co/settings/tokens');
                } else if (error.response?.status === 403) {
                    throw new Error('Access forbidden. Your Hugging Face token needs the "Make calls to Inference Providers" permission.');
                } else if (error.response?.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait before trying to fetch models again. Check https://huggingface.co/settings/billing for your usage.');
                } else {
                    throw new Error(`Failed to fetch models (${error.response?.status}): ${error.response?.statusText || 'Unknown error'}`);
                }
            }
            throw error;
        }
    }

    async validateApiKey(): Promise<boolean> {
        return checkHuggingFaceModel(this.apiKey, this.model || getProviderDefaultModel("huggingface"));
    }
}

/**
 * Check if a Hugging Face model exists and is accessible
 * @param apiKey The Hugging Face API key
 * @param model The model name to check
 * @returns Promise<boolean> indicating if the model is accessible
 */
export async function checkHuggingFaceModel(apiKey: string, model: string): Promise<boolean> {
    try {
        const response = await loggedFetch(`https://huggingface.co/api/models/${model}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        }, { provider: "huggingface", operation: "models.check" });

        return response.ok;
    } catch (error) {
        debugLog("Error checking Hugging Face model:", error);
        return false;
    }
}

/**
 * Suggests the correct provider based on model name
 * @param model The model name to analyze
 * @returns Suggested provider and model combination
 */
function suggestCorrectProvider(model: string): { provider: string; model: string } {
    // Hugging Face IDs are "organization/model" (e.g. "openai/gpt-oss-120b"); only bare IDs can belong elsewhere.
    if (model.includes('/')) {
        return { provider: "Hugging Face", model };
    }
    const lowerModel = model.toLowerCase();
    const hints: Array<[string, string[]]> = [
        ["deepseek", ["deepseek"]],
        ["anthropic", ["claude"]],
        ["openai", ["gpt-", "o3", "o4"]],
        ["gemini", ["gemini"]],
        ["mistral", ["mistral", "ministral", "codestral"]],
        ["grok", ["grok"]],
    ];
    for (const [id, needles] of hints) {
        if (needles.some(needle => lowerModel.startsWith(needle)) && (PROVIDER_IDS as readonly string[]).includes(id)) {
            const entry = PROVIDER_CATALOG[id as keyof typeof PROVIDER_CATALOG];
            return { provider: entry.name, model: entry.defaultModel };
        }
    }
    return { provider: "Hugging Face", model: getProviderDefaultModel("huggingface") };
}

export async function fetchHuggingFaceModels(apiKey: string): Promise<string[]> {
    const provider = new HuggingFaceProvider(apiKey, "");
    return provider.getModels();
}
