import axios from 'axios';
import { HuggingFaceResponse } from '../../config/types';
import { debugLog } from '../debug/logger';
import { generateCommitPrompt, getPromptConfig } from './prompts';
import { BaseAIProvider, GenerationOptions } from './base';

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
            throw new Error(`Model '${this.model}' appears to be a ${suggestion.provider} model. Please switch to the ${suggestion.provider} provider and use model '${suggestion.model}', or select a Hugging Face model like 'microsoft/DialoGPT-medium'.`);
        }

        // Check if model contains slash (indicating it's a proper model path)
        if (!this.model.includes('/')) {
            debugLog("Warning: Model name doesn't contain '/', might be invalid:", this.model);
            throw new Error(`Invalid model format: '${this.model}'. Hugging Face models should be in format 'organization/model-name' like 'microsoft/DialoGPT-medium'.`);
        }

        try {
            const response = await fetch(
                `https://api-inference.huggingface.co/models/${this.model}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({
                        inputs: prompt,
                        parameters: {
                            max_length: options?.maxTokens ?? 500,
                            return_full_text: false,
                            do_sample: true,
                            temperature: options?.temperature,
                        },
                    }),
                }
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

            const result = await response.json() as HuggingFaceResponse | HuggingFaceResponse[];

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

    async getModels(): Promise<string[]> {
        try {
            debugLog('Fetching all Hugging Face models...');

            const response = await axios.get('https://huggingface.co/api/models', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    limit: 10000, // Fetch a large number of models
                    sort: 'downloads', // Sort by popularity
                    direction: -1 // Descending order
                },
                timeout: 30000 // 30 second timeout
            });

            if (response.data && Array.isArray(response.data)) {
                const models = response.data
                    .filter((model: HuggingFaceModel) => model.id && typeof model.id === 'string')
                    .map((model: HuggingFaceModel) => model.id)
                    .slice(0, 5000); // Limit to first 5000 models for performance

                debugLog(`Successfully fetched ${models.length} Hugging Face models`);
                return models;
            } else {
                throw new Error('Invalid response format from Hugging Face API');
            }
        } catch (error) {
            debugLog('Error fetching Hugging Face models:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Invalid Hugging Face API key. Please verify your API key at https://huggingface.co/settings/tokens');
                } else if (error.response?.status === 403) {
                    throw new Error('Access forbidden. Your Hugging Face API key may not have permission to fetch models.');
                } else if (error.response?.status === 410) {
                    throw new Error('Hugging Face API endpoint has been deprecated. Please update your API integration. See https://huggingface.co/docs/api-inference for migration details.');
                } else if (error.response?.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait before trying to fetch models again. Check https://huggingface.co/settings/billing for your usage limits.');
                } else {
                    throw new Error(`Failed to fetch models (${error.response?.status}): ${error.response?.statusText || 'Unknown error'}`);
                }
            }
            throw error;
        }
    }

    async validateApiKey(): Promise<boolean> {
        return checkHuggingFaceModel(this.apiKey, this.model || "microsoft/DialoGPT-medium");
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
        const response = await fetch(`https://huggingface.co/api/models/${model}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

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
    const lowerModel = model.toLowerCase();

    if (lowerModel.includes('deepseek')) {
        return {
            provider: "DeepSeek",
            model: lowerModel.includes('chat') ? 'deepseek-chat' : 'deepseek-reasoner'
        };
    } else if (lowerModel.includes('claude') || lowerModel.includes('anthropic')) {
        return {
            provider: "Anthropic",
            model: 'claude-3-5-sonnet-20241022'
        };
    } else if (lowerModel.includes('gpt-') || lowerModel.includes('openai')) {
        return {
            provider: "OpenAI",
            model: 'gpt-4o'
        };
    } else if (lowerModel.includes('gemini') || lowerModel.includes('google')) {
        return {
            provider: "Gemini",
            model: 'gemini-2.0-flash'
        };
    } else if (lowerModel.includes('mistral')) {
        return {
            provider: "Mistral",
            model: 'mistral-large-latest'
        };
    } else if (lowerModel.includes('grok')) {
        return {
            provider: "Grok",
            model: 'grok-beta'
        };
    }

    return {
        provider: "Hugging Face",
        model: 'microsoft/DialoGPT-medium'
    };
}

/**
 * Backward compatibility functions
 */
export async function callHuggingFaceAPI(
    apiKey: string,
    model: string,
    diff: string,
    customContext: string = ""
): Promise<string> {
    const provider = new HuggingFaceProvider(apiKey, model);
    return provider.generateCommitMessage(diff, customContext);
}

export async function fetchHuggingFaceModels(apiKey: string): Promise<string[]> {
    const provider = new HuggingFaceProvider(apiKey, "");
    return provider.getModels();
}
