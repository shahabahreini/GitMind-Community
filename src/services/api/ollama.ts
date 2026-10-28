// src/services/api/ollama.ts
import { OllamaResponse } from "../../config/types";
import { debugLog } from "../debug/logger";
import { generateCommitPrompt, getPromptConfig } from './prompts';
import { BaseAIProvider, GenerationOptions } from "./base";
import { RequestContext, requestScope } from "./requestContext";
import { loggedFetch } from "./loggedFetch";
import { chooseOllamaThinking, fetchOllamaModelDetails } from "./ollamacloud";
import { conservativeTokenCount } from "./capabilities";
import { ProviderApiError } from "./recovery";

interface OllamaModel {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
        parent_model: string;
        format: string;
        family: string;
        families: string[];
        parameter_size: string;
        quantization_level: string;
    };
}

interface OllamaModelsResponse {
    models: OllamaModel[];
}

export class OllamaProvider extends BaseAIProvider {
    // For Ollama, apiKey is effectively the baseUrl
    constructor(baseUrl: string, model: string) {
        super(baseUrl, model);
    }

    private think?: false | string;

    /** Reads the model's real context and lowest thinking level from the local server; without them the conservative local defaults stay. */
    override async prepareCapabilities(context?: RequestContext): Promise<void> {
        const details = await fetchOllamaModelDetails(this.apiKey, this.model, {}, context?.signal, "ollama");
        this.think = chooseOllamaThinking(details?.thinkingValues);
        if (details?.contextTokens) {
            this.rememberModelLimits(this.model, details.contextTokens, undefined, false, true);
        }
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        debugLog("Calling Ollama API", { baseUrl: this.apiKey, model: this.model });
        debugLog("Prompt:", prompt);

        const scope = requestScope.getStore();
        const capabilities = this.getCapabilities();
        // A local server allocates memory for the whole window, so size it to the prompt plus the answer, not the model maximum.
        const answerTokens = scope?.generationOptions?.maxTokens ?? (capabilities.isUnknown ? undefined : capabilities.outputTokens);
        const numCtx = capabilities.isUnknown
            ? (scope?.promptTokenCap ? Math.max(4096, scope.promptTokenCap + 2048) : undefined)
            : Math.min(capabilities.contextTokens, conservativeTokenCount(prompt) + (answerTokens ?? 0) + 256);
        try {
            const response = await loggedFetch(`${this.apiKey}/api/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    system: "You analyze source changes and follow the requested output format.",
                    stream: false,
                    ...(this.think === undefined ? {} : { think: this.think }),
                    options: {
                        temperature: options?.temperature,
                        // Unset num_predict lets the model answer until it finishes, bounded by num_ctx.
                        ...(answerTokens ? { num_predict: answerTokens } : {}),
                        // Without num_ctx the server's default window silently truncates long prompts.
                        ...(numCtx ? { num_ctx: numCtx } : {}),
                    },
                }),
            }, { provider: "ollama", operation: "generate" });

            if (!response.ok) {
                const error = await response.text();
                debugLog("Ollama API Error:", error);
                throw new Error(`Ollama API error: ${response.status} - ${response.statusText}`);
            }

            const result = (await response.json()) as OllamaResponse;
            if (!result?.response?.trim() && result?.thinking?.trim()) {
                throw new ProviderApiError("The model spent its whole output budget thinking and returned no answer. Raise GitMind Max Tokens or choose another model.", { category: "invalid-response", provider: "ollama" });
            }
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

    async getModels(): Promise<string[]> {
        debugLog("Fetching available Ollama models", { baseUrl: this.apiKey });

        try {
            const url = `${this.apiKey}/api/tags`;
            debugLog("Making request to Ollama API", { url });

            const response = await loggedFetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            }, { provider: "ollama", operation: "tags" });

            debugLog("Ollama API response status", {
                status: response.status,
                statusText: response.statusText,
                contentType: response.headers.get('content-type')
            });

            if (!response.ok) {
                const error = await response.text();
                debugLog("Ollama Models API Error Response:", error);
                throw new Error(`Ollama Models API error: ${response.status} - ${response.statusText}. Response: ${error}`);
            }

            const responseText = await response.text();
            debugLog("Ollama API raw response text", { responseText });

            let result: OllamaModelsResponse;
            try {
                result = JSON.parse(responseText) as OllamaModelsResponse;
            } catch (parseError) {
                debugLog("Failed to parse JSON response", { parseError, responseText });
                throw new Error("Invalid JSON response from Ollama API");
            }

            debugLog("Ollama API parsed response", { result });

            if (!result || !result.models || !Array.isArray(result.models)) {
                debugLog("Invalid response structure", { result });
                throw new Error("Invalid response structure from Ollama Models API - expected 'models' array");
            }

            // Extract model names and sort them
            const modelNames = result.models.map(model => {
                if (!model.name) {
                    debugLog("Model without name found", { model });
                    return "unknown";
                }
                return model.name;
            }).filter(name => name !== "unknown").sort();

            debugLog("Available Ollama models extracted:", { count: modelNames.length, modelNames });
            return modelNames;
        } catch (error) {
            debugLog("Error in getOllamaModels", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });

            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error("Could not connect to Ollama. Please make sure Ollama is running and accessible at " + this.apiKey);
            }

            // Re-throw the error with more context
            throw error;
        }
    }

    async validateApiKey(): Promise<boolean> {
        try {
            const response = await loggedFetch(`${this.apiKey}/api/version`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            }, { provider: "ollama", operation: "version" });
            return response.ok;
        } catch (error) {
            debugLog("Ollama availability check error:", error);
            return false;
        }
    }
}

export async function getOllamaModels(baseUrl: string): Promise<string[]> {
    const provider = new OllamaProvider(baseUrl, "");
    return provider.getModels();
}
