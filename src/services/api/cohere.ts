// src/services/api/cohere.ts
import { debugLog } from "../debug/logger";
import { generateCommitPrompt } from './prompts';

// Define Cohere model types
export enum CohereModel {
    // Latest Models
    COMMAND_A_03_2025 = "command-a-03-2025",
    COMMAND_R_08_2024 = "command-r-08-2024",
    COMMAND_R_PLUS_08_2024 = "command-r-plus-08-2024",

    // Specialized Models
    AYA_EXPANSE_8B = "aya-expanse-8b",
    AYA_EXPANSE_32B = "aya-expanse-32b",
    COMMAND_R7B_ARABIC = "command-r7b-arabic",

    // Legacy Models
    COMMAND_R = "command-r",
    COMMAND_R_PLUS = "command-r-plus",
    COMMAND = "command",
    COMMAND_LIGHT = "command-light",
    COMMAND_NIGHTLY = "command-nightly"
}

// Configuration for different Cohere models
interface GenerationConfig {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
}

const MODEL_CONFIGS: Record<string, GenerationConfig> = {
    // Latest Models
    [CohereModel.COMMAND_A_03_2025]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_R_08_2024]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_R_PLUS_08_2024]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },

    // Specialized Models
    [CohereModel.AYA_EXPANSE_8B]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.AYA_EXPANSE_32B]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_R7B_ARABIC]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },

    // Legacy Models
    [CohereModel.COMMAND_R]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_R_PLUS]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_LIGHT]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    },
    [CohereModel.COMMAND_NIGHTLY]: {
        temperature: 0.3,
        maxOutputTokens: 350,
        topP: 0.8,
        topK: 40
    }
};

/**
 * Enforces proper commit message format
 * @param message Raw message from API
 * @returns Properly formatted commit message
 */
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

/**
 * Makes a request to the Cohere API to generate a commit message
 * @param apiKey The Cohere API key
 * @param model The model to use (from CohereModel enum)
 * @param diff Git diff to analyze
 * @param customContext Additional context provided by the user
 * @returns Generated commit message
 */
export async function callCohereAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    if (!apiKey || apiKey.trim() === '') {
        debugLog("Error: Cohere API key is missing or empty");
        throw new Error("Cohere API key is required but not configured");
    }

    // Validate model
    const validModels = Object.values(CohereModel);
    if (!validModels.includes(model as CohereModel)) {
        debugLog("Error: Invalid Cohere model specified", { model });
        throw new Error(`Invalid Cohere model specified: ${model}`);
    }

    try {
        debugLog(`Calling Cohere API with model: ${model}`);
        const promptText = generateCommitPrompt(diff, undefined, customContext);
        debugLog("Sending prompt to Cohere API");
        debugLog("Prompt:", promptText);

        // Get model-specific configuration
        const config = MODEL_CONFIGS[model];
        if (!config) {
            throw new Error(`Configuration not found for model: ${model}`);
        }

        // Using the v2 chat API
        const response = await fetch('https://api.cohere.ai/v2/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "user",
                        content: promptText
                    }
                ],
                temperature: config.temperature,
                max_tokens: config.maxOutputTokens,
                p: config.topP,
                k: config.topK
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`Cohere API error: ${response.status} ${errorText}`);

            // Handle specific error cases
            if (response.status === 429) {
                throw new Error("Rate limit exceeded. Please try again later.");
            } else if (response.status === 401) {
                throw new Error("Invalid API key. Please check your Cohere API key.");
            } else {
                throw new Error(`Cohere API error: ${response.status} - ${errorText}`);
            }
        }

        const data = await response.json();
        debugLog(`Cohere API response received`);

        // Process the response based on v2 chat API format
        if (data.message && data.message.content && data.message.content.length > 0) {
            let fullText = "";
            for (const contentItem of data.message.content) {
                if (contentItem.type === "text") {
                    fullText += contentItem.text;
                }
            }

            debugLog(`Processing Response:\n${fullText}`);

            // Process the full text into a formatted commit message
            const formattedMessage = enforceCommitMessageFormat(fullText);
            debugLog("Cohere API Response:", formattedMessage);
            return formattedMessage;
        } else {
            throw new Error('No text content found in Cohere API response');
        }
    } catch (error) {
        debugLog("Cohere API Call Failed:", error);

        // Handle rate limiting
        if (error instanceof Error && error.message.includes("rate limit")) {
            throw new Error("Rate limit exceeded. Please try again later.");
        }

        // Handle invalid API key
        if (error instanceof Error && error.message.includes("Invalid API key")) {
            throw new Error("Invalid API key. Please check your Cohere API key.");
        }

        // Add specific handling for response processing errors
        if (error instanceof Error && error.message.includes("text")) {
            throw new Error("Failed to process Cohere response: " + error.message);
        }

        // Handle other errors
        if (error instanceof Error) {
            throw new Error(`Cohere API call failed: ${error.message}`);
        }

        throw new Error(`Unexpected error during Cohere API call: ${String(error)}`);
    }
}

/**
 * Validates a Cohere API key by making a simple request
 * @param apiKey The API key to validate
 * @returns Boolean indicating if the API key is valid
 */
export async function validateCohereAPIKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.cohere.ai/v2/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: CohereModel.COMMAND_LIGHT,
                messages: [
                    {
                        role: "user",
                        content: "Test"
                    }
                ],
                max_tokens: 10
            })
        });

        return response.ok;
    } catch (error) {
        debugLog("API Key Validation Failed:", error);
        return false;
    }
}
