import { GoogleGenerativeAI } from "@google/generative-ai";
import { debugLog } from "../debug/logger";

export async function callGeminiAPI(apiKey: string, diff: string): Promise<string> {
    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
        debugLog("Error: Gemini API key is missing or empty");
        throw new Error("Gemini API key is required but not configured");
    }

    try {
        debugLog("Initializing Gemini AI with provided API key");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const promptText = `As a Git commit message generator, analyze this specific diff and create ONE commit message that accurately describes these changes:

Git Diff:
${diff}

## Requirements

### Subject Line (First Line)
- Must start with one of these types:
  - feat: New feature
  - fix: Bug fix
  - docs: Documentation changes
  - style: Code style/formatting changes (no code change)
  - refactor: Code refactoring (no functional change)
  - test: Adding/modifying tests
  - chore: Maintenance tasks, build changes, etc.
- Maximum 72 characters
- Use imperative mood ("Add" not "Added")
- No period at the end
- Must be technical and specific


## Expected Format
<type>: <concise description>

- <detailed change explanation>
- <additional context if needed>

Generate exactly ONE commit message following this format. No alternatives or explanations.`;

        debugLog("Sending prompt to Gemini API");
        debugLog("Prompt:", promptText);

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: promptText }] }],
            });

            if (!result || !result.response) {
                throw new Error("Empty response from Gemini API");
            }

            const response = await result.response;
            debugLog("Gemini Response:", response.text());

            if (!response.text()) {
                throw new Error("No text in Gemini API response");
            }

            return response.text();
        } catch (apiError) {
            debugLog("Gemini API Generation Error:", apiError);
            // Check for specific API errors
            if (apiError instanceof Error) {
                if (apiError.message.includes('API key')) {
                    throw new Error("Invalid Gemini API key. Please check your configuration.");
                }
                throw new Error(`Gemini API error: ${apiError.message}`);
            }
            throw new Error("Failed to generate content with Gemini API");
        }
    } catch (error) {
        debugLog("Gemini API Call Failed:", error);
        // Propagate the error with clear context
        if (error instanceof Error) {
            // If it's already our error message, just throw it
            if (error.message.includes("Gemini API")) {
                throw error;
            }
            // Otherwise, wrap it with context
            throw new Error(`Gemini API call failed: ${error.message}`);
        }
        // For unknown error types
        throw new Error(`Unexpected error during Gemini API call: ${String(error)}`);
    }
}
