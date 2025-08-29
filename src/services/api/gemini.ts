import { GoogleGenerativeAI } from "@google/generative-ai";
import { debugLog } from "../debug/logger";
import { GeminiModel } from "../../config/types";
import { generateCommitPrompt, getPromptConfig } from './prompts';
import { RequestManager } from "../../utils/requestManager";

// Define generation configuration for different models
interface GenerationConfig {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
}

const MODEL_CONFIGS: Record<GeminiModel, GenerationConfig> = {
    // Latest Models (Recommended)
    "gemini-2.5-pro": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    "gemini-2.5-flash": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    "gemini-2.5-flash-preview-05-20": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    // Gemini 2.0 Series
    "gemini-2.0-flash": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    "gemini-2.0-flash-lite": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    // Gemini 1.5 Series
    "gemini-1.5-flash": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    "gemini-1.5-flash-8b": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    "gemini-1.5-pro": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    // Legacy/Preview Models
    "gemini-2.5-flash-preview-04-17": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    "gemini-2.5-pro-exp-03-25": {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
};

export async function callGeminiAPI(apiKey: string, model: string, diff: string, customContext?: string): Promise<string> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    try {
        debugLog(`Calling Gemini API with model: ${model}`);

        // Validate API key
        if (!apiKey) {
            throw new Error("Gemini API key is required");
        }

        // Improved model validation and fallback logic
        let selectedModel = model as GeminiModel;
        const validModels = Object.keys(MODEL_CONFIGS) as GeminiModel[];

        if (!validModels.includes(selectedModel)) {
            // Log the issue for debugging
            debugLog("Warning: Unrecognized Gemini model, attempting to use as custom model ID", { model });

            // Try to use the provided model string directly if it looks like a valid Gemini model ID
            if (typeof model === 'string' && model.startsWith('gemini-')) {
                debugLog("Using provided model string directly", { model });
                selectedModel = model as GeminiModel;
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

        // Initialize the API
        const genAI = new GoogleGenerativeAI(apiKey);
        const generativeModel = genAI.getGenerativeModel({
            model: selectedModel,
            generationConfig: {
                temperature: config.temperature,
                topK: config.topK,
                topP: config.topP,
                maxOutputTokens: config.maxOutputTokens,
            },
        });

        // Generate prompt with optional custom context
        const prompt = await generateCommitPrompt(
            diff,
            getPromptConfig(),
            customContext
        );

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

        // Provide more helpful error message
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("not found") || errorMessage.includes("invalid model")) {
            throw new Error(`Model '${model}' not available or not supported. Please check if you have access to this model or try a different model.`);
        } else if (errorMessage.includes("permission") || errorMessage.includes("access")) {
            throw new Error(`Access denied to model '${model}'. Please verify your API key has access to this model.`);
        } else {
            throw new Error(`Failed to generate commit message: ${errorMessage}`);
        }
    }
}

export async function validateGeminiAPIKey(apiKey: string): Promise<boolean> {
    try {
        if (!apiKey) {
            return false;
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Try with a stable model first
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
        });

        // Simple validation request
        const result = await model.generateContent("Test connection");
        debugLog("Gemini API validation successful:", result);
        return result.response !== undefined;
    } catch (error) {
        debugLog("Gemini API validation error:", error);
        return false;
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

export async function fetchGeminiModels(apiKey: string): Promise<string[]> {
    debugLog("Fetching Gemini models...");

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

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