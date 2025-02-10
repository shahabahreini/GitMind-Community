// src/services/api/ollama.ts
import { OllamaResponse } from "../../config/types";
import { debugLog } from "../debug/logger";

export async function callOllamaAPI(
    baseUrl: string,
    model: string,
    diff: string
): Promise<string> {
    const prompt = `You are an AI assistant that will generate a professional Git commit message from a provided diff. 

Follow these steps carefully:

0. Understand the meaning of each commit type:
   - feat: Adding a new feature or enhancement
   - fix: Fixing a bug or issue
   - docs: Making documentation-only changes (e.g., README, JSDoc)
   - style: Formatting or style changes that do not affect code logic (e.g., lint fixes, cosmetic adjustments)
   - refactor: Code changes that do not fix bugs or add features but improve structure or clarity
   - test: Adding or updating tests
   - chore: Maintenance tasks or minor updates that don’t change app logic (e.g., updating dependencies, build scripts)
   
1. Look at the provided diff, which is stored in the variable diff content.
   - Identify the nature of the changes: 
       * Are they adding a new feature (feat)?
       * Fixing a bug (fix)?
       * Updating documentation (docs)?
       * Changing formatting or style (style)?
       * Refactoring code without changing functionality (refactor)?
       * Adding or modifying tests (test)?
       * Performing chores or maintenance (chore)?

2. Write the first line of the commit message:
   - It must start with exactly one of these words: feat, fix, docs, style, refactor, test, chore
   - It must use imperative mood (e.g., "Add feature" rather than "Adds" or "Added")
   - It must be under 72 characters (rephrase it if the generated if needed to fit under 72 characters)
   - It must be short, direct, and technical

3. Leave exactly one blank line after the first line.

4. Write a concise description in bullet points that explains:
   - **What** was changed and **where** it was changed (e.g., which file or function)
   - **Why** it matters or its **impact** (if this is relevant)
   - Avoid buzzwords, marketing jargon, or fluff. Be direct and technical.

5. Output your result **exactly** in this format (no extra text or explanation before or after):

<type>: <short description>

<point 1>
<point 2 and more if needed>

**Here is the diff** Here is the file changes (diff) content in the following lines:
${diff}`;

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
