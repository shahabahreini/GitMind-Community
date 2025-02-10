import { HuggingFaceResponse } from "../../config/types";
import { debugLog } from "../debug/logger";

export async function callHuggingFaceAPI(
    apiKey: string,
    model: string,
    diff: string
): Promise<string> {
    const prompt = `As a Git commit message generator, analyze this specific diff and create ONE commit message that accurately describes these changes:

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
