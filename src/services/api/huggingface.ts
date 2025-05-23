import { HuggingFaceResponse } from "../../config/types";
import { debugLog } from "../debug/logger";
import { generateCommitPrompt } from './prompts';

export async function callHuggingFaceAPI(
    apiKey: string,
    model: string,
    diff: string,
    customContext: string = ""
): Promise<string> {
    const prompt = generateCommitPrompt(diff, undefined, customContext);
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

export async function fetchHuggingFaceModels(apiKey: string): Promise<string[]> {
    try {
        debugLog("Fetching Hugging Face models...");

        const response = await fetch("https://huggingface.co/api/models?filter=text-generation&sort=downloads&direction=-1&limit=50", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
        }

        const models = await response.json();

        // Filter models that are suitable for text generation and chat
        const suitableModels = models
            .filter((model: any) => {
                // Filter for models that support text generation and are not too large
                const modelId = model.id || '';
                const downloads = model.downloads || 0;

                // Include popular instruction-tuned models and exclude very large models
                return (
                    downloads > 1000 && // Only include models with decent popularity
                    (
                        modelId.includes('instruct') ||
                        modelId.includes('chat') ||
                        modelId.includes('instruction') ||
                        modelId.includes('conversational') ||
                        modelId.includes('7b') ||
                        modelId.includes('13b') ||
                        modelId.includes('mistral') ||
                        modelId.includes('llama') ||
                        modelId.includes('phi') ||
                        modelId.includes('gemma')
                    ) &&
                    !modelId.includes('70b') && // Exclude very large models
                    !modelId.includes('405b') &&
                    !modelId.includes('embedding') &&
                    !modelId.includes('classifier')
                );
            })
            .map((model: any) => model.id)
            .slice(0, 20); // Limit to top 20 models

        debugLog(`Fetched ${suitableModels.length} Hugging Face models`);
        return suitableModels;
    } catch (error) {
        debugLog("Error fetching Hugging Face models:", error);
        throw error;
    }
}
