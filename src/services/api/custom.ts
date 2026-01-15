import { debugLog } from "../debug/logger";
import { RequestManager } from "../../utils/requestManager";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";

export class CustomProvider extends BaseAIProvider {
    constructor(
        private baseUrl: string,
        private endpoint: string,
        private authType: string,
        apiKey: string,
        private headerKey: string,
        private requestFormat: string,
        private responseFormat: string,
        model: string
    ) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, _options?: GenerationOptions): Promise<string> {
        const requestManager = RequestManager.getInstance();
        const controller = requestManager.getController();

        try {
            debugLog(`Calling Custom API at ${this.baseUrl}${this.endpoint}`);

            // Build headers based on auth type
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            switch (this.authType) {
                case "bearer":
                    headers['Authorization'] = `Bearer ${this.apiKey}`;
                    break;
                case "apikey":
                    headers[this.headerKey || 'x-api-key'] = this.apiKey;
                    break;
                case "basic":
                    headers['Authorization'] = `Basic ${Buffer.from(this.apiKey).toString('base64')}`;
                    break;
            }

            // Build request body using the template
            const requestBody = this.buildRequestBody(this.requestFormat, prompt, this.model);

            const response = await loggedFetch(`${this.baseUrl}${this.endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            }, { provider: "custom", operation: "request" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`Custom API error: ${response.status} ${errorText}`);
                throw new Error(`Custom API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            debugLog(`Custom API response received`);

            // Extract response based on the response format
            const result = this.extractResponse(data, this.responseFormat);
            return this.formatCommitMessage(result);
        } catch (error) {
            debugLog('Error in CustomProvider:', error);

            // Handle abort error specifically
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }

            throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getModels(): Promise<string[]> {
        // Custom API doesn't support model fetching typically
        return [this.model];
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
        return validateCustomAPI(
            this.baseUrl,
            this.endpoint,
            this.authType,
            this.apiKey,
            this.headerKey,
            this.requestFormat,
            this.model
        );
    }

    /**
     * Builds request body using the template
     */
    private buildRequestBody(requestFormat: string, prompt: string, model: string): any {
        try {
            // If requestFormat is empty or "openai", use OpenAI-compatible format with messages array
            if (!requestFormat || requestFormat.trim() === '' || requestFormat.toLowerCase() === 'openai') {
                return {
                    model: model,
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant that generates git commit messages.' },
                        { role: 'user', content: prompt }
                    ]
                };
            }

            // Replace placeholders in the template
            let formatted = requestFormat
                // Uppercase placeholders
                .replace(/\{\{MODEL\}\}/g, model)
                .replace(/\{\{PROMPT\}\}/g, prompt)
                // Lowercase placeholders (as shown in UI examples)
                .replace(/\{\{model\}\}/g, model)
                .replace(/\{\{prompt\}\}/g, prompt);

            // Also support {{MESSAGES}} placeholder for OpenAI-style APIs
            if (formatted.includes('{{MESSAGES}}') || formatted.includes('{{messages}}')) {
                const messagesArray = [
                    { role: 'system', content: 'You are a helpful assistant that generates git commit messages.' },
                    { role: 'user', content: prompt }
                ];
                formatted = formatted
                    .replace('{{MESSAGES}}', JSON.stringify(messagesArray))
                    .replace('{{messages}}', JSON.stringify(messagesArray));
            }

            return JSON.parse(formatted);
        } catch (error) {
            debugLog('Error parsing request format:', error);
            // Fallback to OpenAI-compatible format with messages array
            return {
                model: model,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that generates git commit messages.' },
                    { role: 'user', content: prompt }
                ]
            };
        }
    }

    /**
     * Extracts response based on the response format
     */
    private extractResponse(data: any, responseFormat: string): string {
        try {
            const fmt = (responseFormat || '').trim().toLowerCase();

            // Known formats
            if (!fmt || fmt === 'openai') {
                const openai = data?.choices?.[0];
                const text = openai?.message?.content ?? openai?.text;
                if (typeof text === 'string' && text.length > 0) {
                    return text;
                }
            } else if (fmt === 'anthropic') {
                // Claude streaming or messages API often returns content as array of blocks
                const text = data?.content?.[0]?.text ?? data?.content;
                if (typeof text === 'string' && text.length > 0) {
                    return text;
                }
            } else if (fmt === 'gemini') {
                // Gemini style (Vertex/Generative Language) typical path
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
                    ?? data?.candidates?.[0]?.content?.parts?.find?.((p: any) => typeof p?.text === 'string')?.text
                    ?? data?.output_text;
                if (typeof text === 'string' && text.length > 0) {
                    return text;
                }
            } else {
                // Treat as path expression. Support arrays like choices[0].message.content
                const tokens = this.parsePathTokens(responseFormat);
                let result: any = data;
                for (const token of tokens) {
                    if (result === undefined || result === null) {
                        throw new Error(`Path segment not found for token: ${String(token)}`);
                    }
                    if (typeof token === 'number') {
                        if (!Array.isArray(result) || result.length <= token) {
                            throw new Error(`Array index out of range at token: [${token}]`);
                        }
                        result = result[token];
                    } else {
                        if (!(token in result)) {
                            throw new Error(`Key not found: ${token}`);
                        }
                        result = result[token];
                    }
                }

                if (typeof result === 'string') {
                    return result;
                }
                return JSON.stringify(result);
            }

            // Heuristics/fallbacks
            // Try OpenAI style even if format not specified correctly
            const openaiFallback = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text;
            if (typeof openaiFallback === 'string' && openaiFallback.length > 0) {
                return openaiFallback;
            }

            // Anthropic-like
            const claudeFallback = data?.content?.[0]?.text ?? data?.content;
            if (typeof claudeFallback === 'string' && claudeFallback.length > 0) {
                return claudeFallback;
            }

            // Gemini-like
            const geminiFallback = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? data?.output_text;
            if (typeof geminiFallback === 'string' && geminiFallback.length > 0) {
                return geminiFallback;
            }

            // Generic common fields
            if (typeof data?.text === 'string') {
                return data.text;
            }
            if (typeof data?.message === 'string') {
                return data.message;
            }
            if (typeof data?.response === 'string') {
                return data.response;
            }
            if (typeof data?.output === 'string') {
                return data.output;
            }

            return JSON.stringify(data);
        } catch (error) {
            debugLog('Error extracting response:', error);
            // Final fallback attempts
            const openai = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text;
            if (typeof openai === 'string' && openai.length > 0) {
                return openai;
            }
            return JSON.stringify(data);
        }
    }

    private parsePathTokens(path: string): Array<string | number> {
        const tokens: Array<string | number> = [];
        // Split by '.' but keep bracket indices
        const parts = path.split('.');
        for (const part of parts) {
            const re = /([^\[]+)|(\[(\d+)\])/g;
            let match: RegExpExecArray | null;
            while ((match = re.exec(part)) !== null) {
                if (match[1]) {
                    tokens.push(match[1]);
                } else if (match[3]) {
                    tokens.push(Number(match[3]));
                }
            }
        }
        return tokens;
    }

    /**
     * Cleans up and formats the commit message returned by the API
     */
    private formatCommitMessage(message: string): string {
        // Remove any "Git Commit Message:" or similar prefixes
        let formattedMessage = message.replace(/^(git commit message:?|commit message:?)/i, '').trim();

        // Remove any quotes that might wrap the message
        formattedMessage = formattedMessage.replace(/^["']|["']$/g, '');

        return formattedMessage;
    }
}

/**
 * Validates custom API configuration by making a test request
 * @param baseUrl The base URL of the API
 * @param endpoint The API endpoint path
 * @param authType Authentication type
 * @param authToken Authentication token
 * @param headerKey Custom header key for API key auth
 * @param requestFormat JSON template for request
 * @param model Model identifier
 * @returns Validation result with success status and optional error message
 */
export async function validateCustomAPI(
    baseUrl: string,
    endpoint: string,
    authType: string,
    authToken: string,
    headerKey: string,
    requestFormat: string,
    model: string
): Promise<{ success: boolean; error?: string; troubleshooting?: string }> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    try {
        // Validate required fields
        if (!baseUrl || !endpoint) {
            return {
                success: false,
                error: "Base URL and endpoint are required",
                troubleshooting: "Please configure Base URL and Endpoint in settings"
            };
        }

        if (!model) {
            return {
                success: false,
                error: "Model name is required",
                troubleshooting: "Please configure the model name in settings"
            };
        }

        if (authType !== "none" && !authToken) {
            return {
                success: false,
                error: "Authentication token is required",
                troubleshooting: `Please configure authentication token for ${authType} authentication`
            };
        }

        if (authType === "apikey" && !headerKey) {
            return {
                success: false,
                error: "Header key is required for API Key authentication",
                troubleshooting: "Please specify the header key name (e.g., 'x-api-key')"
            };
        }

        // We can reuse CustomProvider logic to build request body
        // But we need to instantiate it, which is circular if we use the class method
        // So we duplicate buildRequestBody logic or move it to a helper.
        // For now, duplicate buildRequestBody logic slightly or simplified

        const buildBody = (fmt: string, p: string, m: string) => {
            // simplified logic from CustomProvider
            try {
                if (!fmt || fmt.trim() === '' || fmt.toLowerCase() === 'openai') {
                    return { model: m, messages: [{ role: 'system', content: 'test' }, { role: 'user', content: p }] };
                }
                let formatted = fmt.replace(/\{\{MODEL\}\}/g, m).replace(/\{\{PROMPT\}\}/g, p)
                    .replace(/\{\{model\}\}/g, m).replace(/\{\{prompt\}\}/g, p);
                if (formatted.includes('{{MESSAGES}}') || formatted.includes('{{messages}}')) {
                    const msgs = [{ role: 'user', content: p }];
                    formatted = formatted.replace('{{MESSAGES}}', JSON.stringify(msgs)).replace('{{messages}}', JSON.stringify(msgs));
                }
                return JSON.parse(formatted);
            } catch {
                return { model: m, messages: [{ role: 'user', content: p }] };
            }
        };

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authType === 'bearer') {
            headers['Authorization'] = `Bearer ${authToken}`;
        } else if (authType === 'apikey') {
            headers[headerKey || 'x-api-key'] = authToken;
        } else if (authType === 'basic') {
            headers['Authorization'] = `Basic ${Buffer.from(authToken).toString('base64')}`;
        }

        const testPrompt = "Hello, this is a test message to verify the connection.";
        const requestBody = buildBody(requestFormat, testPrompt, model);

        debugLog(`Validating Custom API at ${baseUrl}${endpoint}`);

        // Make test request with timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Connection test timed out after 10 seconds")), 10000)
        );

        const fetchPromise = loggedFetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal
        }, { provider: "custom", operation: "validate" });

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unable to read error response');
            let troubleshooting = "Please check your API configuration";

            if (response.status === 401 || response.status === 403) {
                troubleshooting = "Authentication failed. Verify your token/key, auth type, and header key name";
            } else if (response.status === 404) {
                troubleshooting = `Endpoint not found. Verify the endpoint path: ${endpoint}`;
            } else if (response.status === 400) {
                troubleshooting = "Bad request. Check your Request Format template";
            } else if (response.status === 415) {
                troubleshooting = "Unsupported Media Type. Ensure Content-Type is application/json";
            }

            return {
                success: false,
                error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
                troubleshooting
            };
        }

        // Try to parse response
        await response.json();
        debugLog('Custom API validation successful');

        return {
            success: true
        };
    } catch (error) {
        debugLog('Error validating custom API:', error);

        if (error instanceof Error && error.name === 'AbortError') {
            return {
                success: false,
                error: 'Request was cancelled',
                troubleshooting: 'The request was aborted. Please try again'
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            troubleshooting: 'An unexpected error occurred during validation. Check your network connection and API configuration'
        };
    }
}

/**
 * Backward compatibility functions
 */
export async function callCustomAPI(
    baseUrl: string,
    endpoint: string,
    authType: string,
    authToken: string,
    headerKey: string,
    requestFormat: string,
    responseFormat: string,
    model: string,
    diff: string,
    customContext: string = ""
): Promise<string> {
    const provider = new CustomProvider(baseUrl, endpoint, authType, authToken, headerKey, requestFormat, responseFormat, model);
    return provider.generateCommitMessage(diff, customContext);
}
