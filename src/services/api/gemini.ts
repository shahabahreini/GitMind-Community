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
    [GeminiModel.GEMINI_2_5_FLASH_PREVIEW]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 8000,
    },
    [GeminiModel.GEMINI_2_5_PRO_PREVIEW]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 8000,
    },
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

        // Validate model
        const validModels = Object.values(GeminiModel);
        if (!validModels.includes(model as GeminiModel)) {
            debugLog("Warning: Unrecognized Gemini model, using default", { model });
            model = GeminiModel.GEMINI_2_5_FLASH_PREVIEW;
        }

        // Get configuration for the selected model
        const config = MODEL_CONFIGS[model as GeminiModel] || MODEL_CONFIGS[GeminiModel.GEMINI_2_5_FLASH_PREVIEW];

        // Initialize the API
        const genAI = new GoogleGenerativeAI(apiKey);
        const generativeModel = genAI.getGenerativeModel({
            model: model,
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
        debugLog("Error in callGeminiAPI:", error);
        throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function validateGeminiAPIKey(apiKey: string): Promise<boolean> {
    try {
        if (!apiKey) {
            return false;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: GeminiModel.GEMINI_2_5_FLASH_PREVIEW,
        });

        // Simple validation request
        const result = await model.generateContent("Test connection");
        return result.response !== undefined;
    } catch (error) {
        debugLog("Gemini API validation error:", error);
        return false;
    }
}
