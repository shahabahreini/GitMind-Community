import { GoogleGenerativeAI } from "@google/generative-ai";
import { debugLog } from "../debug/logger";

export async function callGeminiAPI(apiKey: string, diff: string): Promise<string> {
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

    debugLog("Prompt:", promptText);

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
    });

    const response = await result.response;
    debugLog("Gemini Response:", response.text());

    return response.text();
}
