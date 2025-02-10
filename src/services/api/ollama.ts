// src/services/api/ollama.ts
import { OllamaResponse } from "../../config/types";
import { debugLog } from "../debug/logger";

export async function callOllamaAPI(
    baseUrl: string,
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

    try {
        debugLog("Calling Ollama API", { baseUrl, model });
        debugLog("Prompt:", prompt);

        const response = await fetch(`${baseUrl}/api/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    system: "You are a Git commit message generator that creates clear, concise, and informative Git commit messages based on Git diff output.",
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            debugLog("Ollama API Error:", error);
            throw new Error(`Ollama API error: ${response.status} - ${response.statusText}`);
        }

        const result = (await response.json()) as OllamaResponse;
        if (!result || !result.response) {
            throw new Error("Invalid response from Ollama API");
        }

        return result.response;
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error("Could not connect to Ollama. Please make sure Ollama is running.");
        }
        throw error;
    }
}
