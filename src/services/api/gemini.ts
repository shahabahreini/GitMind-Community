import {
    GoogleGenerativeAI,
    GenerateContentRequest,
    SafetySetting,
    HarmCategory,
    HarmBlockThreshold
} from "@google/generative-ai";
import { debugLog } from "../debug/logger";
import { GeminiModel } from "../../config/types";
import { generateCommitPrompt } from './prompts';

interface GenerationConfig {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
}

const MODEL_CONFIGS: Record<GeminiModel, GenerationConfig> = {
    [GeminiModel.GEMINI_2_FLASH]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 7000,
    },
    [GeminiModel.GEMINI_2_FLASH_LITE]: {
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

export async function callGeminiAPI(apiKey: string, model: string, diff: string): Promise<string> {
    if (!apiKey || apiKey.trim() === '') {
        debugLog("Error: Gemini API key is missing or empty");
        throw new Error("Gemini API key is required but not configured");
    }

    // Validate model
    if (!Object.values(GeminiModel).includes(model as GeminiModel)) {
        debugLog("Error: Invalid Gemini model specified", { model });
        throw new Error(`Invalid Gemini model specified: ${model}`);
    }

    try {
        debugLog("Initializing Gemini AI with provided API key and model", { model });
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelInstance = genAI.getGenerativeModel({ model });

        // Get model-specific configuration
        const generationConfig = MODEL_CONFIGS[model as GeminiModel];
        debugLog("Using generation config", { generationConfig });

        const promptText = generateCommitPrompt(diff);
        debugLog("Sending prompt to Gemini API");
        debugLog("Prompt:", promptText);

        const safetySettings: SafetySetting[] = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
            },
        ];

        const request: GenerateContentRequest = {
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            generationConfig,
            safetySettings,
        };

        const result = await modelInstance.generateContent(request);

        if (!result || !result.response) {
            throw new Error("Empty response from Gemini API");
        }

        const response = await result.response;
        const generatedText = response.text();

        if (!generatedText) {
            throw new Error("No generated text in response");
        }

        const formattedMessage = enforceCommitMessageFormat(generatedText);
        debugLog("Gemini API Response:", formattedMessage);
        return formattedMessage;
    } catch (error) {
        debugLog("Gemini API Call Failed:", error);

        // Handle rate limiting
        if (error instanceof Error && error.message.includes("RATE_LIMIT_EXCEEDED")) {
            throw new Error("Rate limit exceeded. Please try again later.");
        }

        // Handle quota exceeded
        if (error instanceof Error && error.message.includes("QUOTA_EXCEEDED")) {
            throw new Error("API quota exceeded. Please check your usage limits.");
        }

        // Handle invalid API key
        if (error instanceof Error && error.message.includes("INVALID_ARGUMENT")) {
            throw new Error("Invalid API key or configuration. Please check your settings.");
        }

        // Add specific handling for response processing errors
        if (error instanceof Error && error.message.includes("text")) {
            throw new Error("Failed to process Gemini response: " + error.message);
        }

        // Handle other errors
        if (error instanceof Error) {
            throw new Error(`Gemini API call failed: ${error.message}`);
        }

        throw new Error(`Unexpected error during Gemini API call: ${String(error)}`);
    }
}

export async function validateGeminiAPIKey(apiKey: string): Promise<boolean> {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: GeminiModel.GEMINI_2_FLASH });

        // Simple test prompt
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: "Test" }] }],
            generationConfig: {
                maxOutputTokens: 10,
            },
        });

        return result !== null;
    } catch (error) {
        debugLog("API Key Validation Failed:", error);
        return false;
    }
}
