// src/services/api/ollama.ts
import { OllamaResponse } from "../../config/types";
import { debugLog } from "../debug/logger";
import { generateCommitPrompt } from './prompts';

export async function callOllamaAPI(
    baseUrl: string,
    model: string,
    diff: string
): Promise<string> {
    const prompt = generateCommitPrompt(diff);
    debugLog("Calling Ollama API", { baseUrl, model });
    debugLog("Prompt:", prompt);

    try {
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
