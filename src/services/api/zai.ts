import { debugLog } from "../debug/logger";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";

/**
 * Z.ai API error types
 */
interface ZaiError {
    error: {
        message: string;
        type: string;
        code?: string;
    };
}

export class ZaiProvider extends BaseAIProvider {
    private endpoint: string;

    constructor(apiKey: string, model: string, endpointType: 'regular' | 'coding' = 'coding') {
        super(apiKey, model);
        this.endpoint = endpointType === 'regular'
            ? 'https://api.z.ai/api/paas/v4/chat/completions'
            : 'https://api.z.ai/api/coding/paas/v4/chat/completions';
        debugLog(`Z.ai Provider initialized with endpoint: ${this.endpoint}`);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const controller = this.getAbortController();

        try {
            debugLog(`Calling Z.ai API with model: ${this.model} at endpoint: ${this.endpoint}`);

            const temperature = options?.temperature ?? 0.2;
            const maxTokens = options?.maxTokens; // Let API use default if not specified
            const topP = options?.topP;

            const response = await loggedFetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept-Language': 'en-US,en'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    ...(topP !== undefined && options?.temperature === undefined ? { top_p: topP } : {}),
                    temperature: temperature,
                    ...(maxTokens ? { max_tokens: maxTokens } : {})
                }),
                signal: controller.signal
            }, { provider: "zai", operation: "chat.completions" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Z.ai API error: ${response.status} ${errorText}`);

                let parsedError: ZaiError | null = null;
                try {
                    parsedError = JSON.parse(errorText) as ZaiError;
                } catch (parseError) {
                    debugLog('Failed to parse Z.ai error response');
                }

                const userFriendlyError = this.getUserFriendlyErrorMessage(response.status, parsedError);
                throw new Error(userFriendlyError);
            }

            const data = await response.json();
            debugLog(`Z.ai API response received`);

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                return this.formatCommitMessage(data.choices[0].message.content);
            } else {
                throw new Error('Invalid response format from Z.ai API');
            }
        } catch (error) {
            debugLog('Error in ZaiProvider.generateResponse:', error);

            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }

            if (error instanceof Error && error.message.includes('Z.ai')) {
                throw error;
            }

            throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getModels(): Promise<string[]> {
        return [
            'glm-5', "glm-5", "glm-5",
            "glm-5", "glm-5.1", 'glm-4.5-x', 'glm-4.5-airx', 'glm-4.5-flash',
            'glm-4-32b-0414-128k'
        ];
    }

    async validateApiKey(): Promise<boolean> {
        try {
            // Try a minimal generation request to validate key since model list endpoint might not be available
            const response = await loggedFetch('https://api.z.ai/api/coding/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "glm-5.1",
                    messages: [
                        { role: "user", content: "Hi" }
                    ],
                    max_tokens: 1
                })
            }, { provider: "zai", operation: "validate" });

            return response.ok;
        } catch (error) {
            debugLog("Z.ai API validation error:", error);
            return false;
        }
    }

    private getUserFriendlyErrorMessage(statusCode: number, parsedError: ZaiError | null): string {
        if (parsedError?.error) {
            const { message, code } = parsedError.error;

            // Handle specific Z.ai business error codes
            // Auth errors: 1000-1004
            if (['1000', '1001', '1002', '1003', '1004'].includes(code || '')) {
                return "Z.ai authentication failed. Please check your API key.";
            }

            // Account errors: 1100-1121
            if (['1110', '1111', '1112', '1121'].includes(code || '')) {
                return "Your Z.ai account is inactive, locked, or invalid. Please contact Z.ai support.";
            }
            if (code === '1113') {
                return "Your Z.ai account balance is insufficient. Please recharge your account.";
            }

            // API Call errors: 1200-1234
            if (['1211', '1212', '1220', '1221', '1222'].includes(code || '')) {
                return `The selected Z.ai model is not available or you don't have permission. Please check your model selection. (${message})`;
            }

            // Policy/Rate Limit errors: 1300-1309
            if (code === '1301') {
                return "Request blocked by Z.ai safety policy (sensitive content).";
            }
            if (['1302', '1303', '1305'].includes(code || '')) {
                return "Z.ai rate limit exceeded. Please reduce request frequency.";
            }
            if (code === '1304' || code === '1308') {
                return "Z.ai daily usage limit reached. Please check your quota.";
            }
            if (code === '1309') {
                return "Your Z.ai GLM Coding Plan has expired. Please renew your subscription.";
            }

            return `Z.ai API error (${code}): ${message}`;
        }

        switch (statusCode) {
            case 400:
                return "Z.ai bad request. Please check your input or configuration.";
            case 401:
                return "Z.ai authentication failed. Please check your API key.";
            case 404:
                return "Z.ai resource not found. Check if the model is available.";
            case 429:
                return "Z.ai rate limit or quota exceeded. Please try again later.";
            case 434:
                return "No API permission for Z.ai. Please check your account status.";
            case 435:
                return "Request size too large for Z.ai.";
            case 500:
            case 502:
            case 503:
                return "Z.ai service is temporarily unavailable. Please try again later.";
            default:
                return `Z.ai API error (${statusCode}). Please try again.`;
        }
    }

    private formatCommitMessage(message: string): string {
        let formattedMessage = message.replace(/^(git commit message:?|commit message:?)/i, '').trim();
        formattedMessage = formattedMessage.replace(/^["']|["']$/g, '');
        return formattedMessage;
    }
}

export async function fetchZaiModels(apiKey: string): Promise<string[]> {
    const provider = new ZaiProvider(apiKey, "", 'coding');
    return provider.getModels();
}

export async function validateZaiAPIKey(apiKey: string, endpointType: 'regular' | 'coding' = 'coding'): Promise<{ success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
    try {
        const endpoint = endpointType === 'regular'
            ? 'https://api.z.ai/api/paas/v4/chat/completions'
            : 'https://api.z.ai/api/coding/paas/v4/chat/completions';

        debugLog(`Validating Z.ai API key with endpoint: ${endpoint}`);

        const response = await loggedFetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "glm-5.1",
                messages: [
                    { role: "user", content: "Hi" }
                ],
                max_tokens: 1
            })
        }, { provider: "zai", operation: "validate" });

        if (response.ok) {
            return { success: true };
        }

        const errorText = await response.text();
        debugLog(`Z.ai API validation error: ${response.status} ${errorText}`);

        let errorMessage = `Z.ai API error: ${response.status}`;
        let troubleshooting = "Please check your Z.ai API key configuration";

        try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
                errorMessage = errorData.error.message;
            }
        } catch {
            // Use default error message
        }

        if (response.status === 401) {
            troubleshooting = "Please check that your Z.ai API key is correct and active";
        } else if (response.status === 429) {
            return {
                success: true,
                warning: "Z.ai rate limit exceeded",
                troubleshooting: "Your API key is valid but rate limited. Please try again later."
            };
        } else if (response.status === 403) {
            troubleshooting = "Your API key may not have the required permissions. Please check your Z.ai account.";
        }

        return { success: false, error: errorMessage, troubleshooting };
    } catch (error) {
        debugLog("Z.ai API validation error:", error);
        return {
            success: false,
            error: "Network error while validating Z.ai API key",
            troubleshooting: "Please check your internet connection and try again"
        };
    }
}
