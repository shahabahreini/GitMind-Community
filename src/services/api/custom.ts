import { debugLog } from "../debug/logger";
import { RequestManager } from "../../utils/requestManager";
import { generateCommitPrompt, getPromptConfig } from './prompts';

/**
 * Makes a request to a custom API endpoint to generate a commit message
 * @param baseUrl The base URL (IP:Port) of the API
 * @param endpoint The API endpoint path
 * @param authType Authentication type
 * @param authToken Authentication token
 * @param headerKey Custom header key for API key auth
 * @param requestFormat JSON template for request
 * @param responseFormat Path to extract response from
 * @param model Model identifier
 * @param diff Git diff to analyze
 * @param customContext Additional context provided by the user
 * @returns Generated commit message
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
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    try {
        debugLog(`Calling Custom API at ${baseUrl}${endpoint}`);
        const prompt = await generateCommitPrompt(diff, getPromptConfig(), customContext);

        // Build headers based on auth type
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        switch (authType) {
            case "bearer":
                headers['Authorization'] = `Bearer ${authToken}`;
                break;
            case "apikey":
                headers[headerKey || 'x-api-key'] = authToken;
                break;
            case "basic":
                headers['Authorization'] = `Basic ${Buffer.from(authToken).toString('base64')}`;
                break;
        }

        // Build request body using the template
        const requestBody = buildRequestBody(requestFormat, prompt, model);

        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`Custom API error: ${response.status} ${errorText}`);
            throw new Error(`Custom API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        debugLog(`Custom API response received`);

        // Extract response based on the response format
        const result = extractResponse(data, responseFormat);
        return formatCommitMessage(result);
    } catch (error) {
        debugLog('Error in callCustomAPI:', error);

        // Handle abort error specifically
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request was cancelled');
        }

        throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Builds request body using the template
 */
function buildRequestBody(requestFormat: string, prompt: string, model: string): any {
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
function extractResponse(data: any, responseFormat: string): string {
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
            const tokens = parsePathTokens(responseFormat);
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

function parsePathTokens(path: string): Array<string | number> {
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
function formatCommitMessage(message: string): string {
    // Remove any "Git Commit Message:" or similar prefixes
    let formattedMessage = message.replace(/^(git commit message:?|commit message:?)/i, '').trim();

    // Remove any quotes that might wrap the message
    formattedMessage = formattedMessage.replace(/^["']|["']$/g, '');

    return formattedMessage;
}
