import { GoogleGenerativeAI } from "@google/generative-ai";
import { debugLog } from "../debug/logger";
import { GeminiModel } from "../../config/types";
import { generateCommitPrompt } from './prompts';

// Define generation configuration for different models
interface GenerationConfig {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
}

const MODEL_CONFIGS: Record<GeminiModel, GenerationConfig> = {
    // New stable Gemini 2.5 models
    [GeminiModel.GEMINI_2_5_PRO]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 8000,
    },
    [GeminiModel.GEMINI_2_5_FLASH]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 8000,
    },
    // Older models
    [GeminiModel.GEMINI_2_0_FLASH]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    [GeminiModel.GEMINI_2_0_FLASH_LITE]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    [GeminiModel.GEMINI_1_5_FLASH]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    [GeminiModel.GEMINI_1_5_FLASH_8B]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    [GeminiModel.GEMINI_1_5_PRO]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
};

export async function callGeminiAPI(apiKey: string, model: string, diff: string, customContext?: string): Promise<string> {
    try {
        debugLog(`Calling Gemini API with model: ${model}`);

        // Validate API key
        if (!apiKey) {
            throw new Error("Gemini API key is required");
        }

        // Improved model validation and fallback logic
        let selectedModel = model as GeminiModel;
        const validModels = Object.values(GeminiModel);

        if (!validModels.includes(selectedModel)) {
            // Log the issue for debugging
            debugLog("Warning: Unrecognized Gemini model, attempting to use as custom model ID", { model });

            // Try to use the provided model string directly if it looks like a valid Gemini model ID
            if (typeof model === 'string' && model.startsWith('gemini-')) {
                debugLog("Using provided model string directly", { model });
                selectedModel = model as GeminiModel;
            } else {
                // Fall back to a stable model as last resort
                debugLog("Falling back to default model", { defaultModel: GeminiModel.GEMINI_2_5_FLASH });
                selectedModel = GeminiModel.GEMINI_2_5_FLASH;
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
            model: selectedModel, // Use the string directly
            generationConfig: {
                temperature: config.temperature,
                topK: config.topK,
                topP: config.topP,
                maxOutputTokens: config.maxOutputTokens,
            },
        });
        // Generate prompt with optional custom context
        const prompt = generateCommitPrompt(
            diff,
            {}, // Removed verbose property as it's not defined in PromptConfig
            customContext
        );

        // Generate content
        const result = await generativeModel.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        debugLog("Gemini API response:", { text });
        return text;
    } catch (error) {
        // Enhanced error logging
        debugLog("Error in callGeminiAPI:", error);

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
            model: GeminiModel.GEMINI_1_5_PRO, // Use a well-established model for validation
        });

        // Simple validation request
        const result = await model.generateContent("Test connection");
        return result.response !== undefined;
    } catch (error) {
        debugLog("Gemini API validation error:", error);
        return false;
    }
}