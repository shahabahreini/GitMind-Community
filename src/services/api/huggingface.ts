import axios from 'axios';
import { HuggingFaceResponse } from '../../config/types';
import { debugLog } from '../debug/logger';
import { generateCommitPrompt } from './prompts';

export interface HuggingFaceModel {
    id: string;
    downloads: number;
    likes: number;
    pipeline_tag?: string;
    library_name?: string;
}

export async function callHuggingFaceAPI(
    apiKey: string,
    model: string,
    diff: string,
    customContext: string = ""
): Promise<string> {
    const prompt = generateCommitPrompt(diff, undefined, customContext);
    debugLog("Calling Hugging Face API", { model });
    debugLog("Prompt:", prompt);

    try {
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_length: 500,
                        return_full_text: false,
                        do_sample: true,
                    },
                }),
            }
        );

        if (!response.ok) {
            let errorMessage: string;
            try {
                // Try to get detailed error from JSON response
                const errorData = await response.json();
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
                errorMessage: errorMessage
            });

            throw new Error(`Hugging Face API error (${response.status}): ${errorMessage}`);
        }

        const result = await response.json() as HuggingFaceResponse | HuggingFaceResponse[];

        if (!result) {
            throw new Error("Empty response from Hugging Face API");
        }

        const generatedText = Array.isArray(result)
            ? result[0]?.generated_text
            : result.generated_text;

        if (!generatedText) {
            throw new Error("No generated text in response");
        }

        debugLog("Hugging Face API Response:", { generatedText });
        return generatedText;

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

export async function fetchHuggingFaceModels(apiKey: string): Promise<string[]> {
    try {
        debugLog('Fetching all Hugging Face models...');

        const response = await axios.get('https://huggingface.co/api/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
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
                throw new Error('Invalid Hugging Face API key');
            } else if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            } else {
                throw new Error(`API request failed: ${error.response?.status || 'Unknown error'}`);
            }
        }
        throw error;
    }
}
