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
        // Replace placeholders in the template
        const formatted = requestFormat
            .replace('{{PROMPT}}', prompt)
            .replace('{{MODEL}}', model);

        return JSON.parse(formatted);
    } catch (error) {
        debugLog('Error parsing request format:', error);
        // Fallback to a simple format
        return {
            model: model,
            prompt: prompt
        };
    }
}

/**
 * Extracts response based on the response format
 */
function extractResponse(data: any, responseFormat: string): string {
    try {
        // Parse the response format as a path to the content
        const path = responseFormat.split('.');
        let result = data;

        for (const key of path) {
            if (result[key] === undefined) {
                throw new Error(`Response format path "${responseFormat}" not found in API response`);
            }
            result = result[key];
        }

        if (typeof result === 'string') {
            return result;
        } else {
            return JSON.stringify(result);
        }
    } catch (error) {
        debugLog('Error extracting response:', error);
        // Try to find any text content in the response
        if (data.text) {
            return data.text;
        }
        if (data.content) {
            return data.content;
        }
        if (data.message) {
            return data.message;
        }
        if (data.response) {
            return data.response;
        }
        if (data.output) {
            return data.output;
        }

        return JSON.stringify(data);
    }
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
