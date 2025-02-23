import {
    GoogleGenerativeAI,
    GenerateContentRequest,
    SafetySetting,
    HarmCategory,
    HarmBlockThreshold
} from "@google/generative-ai";
import { debugLog } from "../debug/logger";
import { GeminiModel } from "../../config/types";

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
        maxOutputTokens: 1024,
    },
    [GeminiModel.GEMINI_2_FLASH_LITE]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
    },
    [GeminiModel.GEMINI_1_5_FLASH]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
    },
    [GeminiModel.GEMINI_1_5_FLASH_8B]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
    },
    [GeminiModel.GEMINI_1_5_PRO]: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
    },
};

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

        const promptText = `You are a Git commit message generator. Analyze the following diff and create ONE commit message that accurately describes these changes.

Git Diff:
${diff}

Requirements:

1. Subject Line (First Line):
   - Must start with one of: feat|fix|docs|style|refactor|test|chore
   - Maximum 72 characters
   - Use imperative mood ("Add" not "Added")
   - No period at the end
   - Must be technical and specific

2. Type Definitions:
   - feat: New feature or significant enhancement
   - fix: Bug fix
   - docs: Documentation changes only
   - style: Code style/formatting changes (no code change)
   - refactor: Code refactoring (no functional change)
   - test: Adding/modifying tests
   - chore: Maintenance tasks, build changes, etc.

3. Format:
<type>: <concise description>

- <detailed change explanation>
- <additional context if needed>

Generate exactly ONE commit message following this format. Be concise and technical. No alternatives or explanations.`;

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

        const response = result.response;

        // Check for blocked response
        if (response.promptFeedback?.blockReason) {
            throw new Error(`Response blocked: ${response.promptFeedback.blockReason}`);
        }

        const commitMessage = response.text().trim();
        debugLog("Gemini Response:", commitMessage);

        // Validate commit message format
        if (!commitMessage.match(/^(feat|fix|docs|style|refactor|test|chore):/)) {
            throw new Error("Invalid commit message format: Missing or invalid type prefix");
        }

        return commitMessage;
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