import { debugLog } from "../debug/logger";
import { generateCommitPrompt } from './prompts';
import { DeepSeekModel } from "../../config/types";
import { RequestManager } from "../../utils/requestManager";

// Configuration for different DeepSeek models
interface GenerationConfig {
    max_tokens: number;
    temperature: number;
}

const MODEL_CONFIGS: Record<DeepSeekModel, GenerationConfig> = {
    "deepseek-chat": {
        max_tokens: 350,
        temperature: 0.3
    },
    "deepseek-reasoner": {
        max_tokens: 400,
        temperature: 0.2
    }
};

/**
 * Enforces proper commit message format
 * @param message Raw message from API
 * @returns Properly formatted commit message
 */
function enforceCommitMessageFormat(message: string): string {
    // Remove any markdown formatting
    let cleanMessage = message.replace(/```[^`]*```/g, '');
    cleanMessage = cleanMessage.replace(/`([^`]+)`/g, '$1');
    cleanMessage = cleanMessage.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleanMessage = cleanMessage.replace(/\*([^*]+)\*/g, '$1');

    // Remove quotes if the entire message is wrapped in them
    cleanMessage = cleanMessage.replace(/^["'](.*)["']$/s, '$1');

    // Split into lines and process
    const lines = cleanMessage.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) {
        return "chore: update code";
    }

    // Get the first line as the main commit message
    let commitMessage = lines[0];

    // Remove any prefixes like "Commit message:" or similar
    commitMessage = commitMessage.replace(/^(commit message|message|commit):\s*/i, '');

    // Ensure the commit message starts with a conventional commit type if not already
    const conventionalTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build', 'revert'];
    const hasConventionalType = conventionalTypes.some(type =>
        commitMessage.toLowerCase().startsWith(type + ':') ||
        commitMessage.toLowerCase().startsWith(type + '(')
    );

    if (!hasConventionalType) {
        // Try to infer the type based on content
        if (commitMessage.toLowerCase().includes('add') || commitMessage.toLowerCase().includes('new')) {
            commitMessage = `feat: ${commitMessage}`;
        } else if (commitMessage.toLowerCase().includes('fix') || commitMessage.toLowerCase().includes('bug')) {
            commitMessage = `fix: ${commitMessage}`;
        } else if (commitMessage.toLowerCase().includes('update') || commitMessage.toLowerCase().includes('change')) {
            commitMessage = `chore: ${commitMessage}`;
        } else {
            commitMessage = `chore: ${commitMessage}`;
        }
    }

    // Ensure proper capitalization
    const colonIndex = commitMessage.indexOf(':');
    if (colonIndex !== -1 && colonIndex < commitMessage.length - 1) {
        const prefix = commitMessage.substring(0, colonIndex + 1);
        const suffix = commitMessage.substring(colonIndex + 1).trim();
        if (suffix.length > 0) {
            commitMessage = prefix + ' ' + suffix.charAt(0).toLowerCase() + suffix.slice(1);
        }
    }

    return commitMessage;
}

/**
 * Makes a request to the DeepSeek API to generate a commit message
 * @param apiKey The DeepSeek API key
 * @param model The model to use (from DeepSeekModel enum)
 * @param diff Git diff to analyze
 * @param customContext Additional context provided by the user
 * @returns Generated commit message
 */
export async function callDeepSeekAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    if (!apiKey || apiKey.trim() === '') {
        debugLog("Error: DeepSeek API key is missing or empty");
        throw new Error("DeepSeek API key is required but not configured");
    }

    // Validate model
    const validModels: DeepSeekModel[] = ["deepseek-chat", "deepseek-reasoner"];
    if (!validModels.includes(model as DeepSeekModel)) {
        debugLog("Error: Invalid DeepSeek model specified", { model });
        throw new Error(`Invalid DeepSeek model specified: ${model}`);
    }

    try {
        debugLog(`Calling DeepSeek API with model: ${model}`);
        const promptText = generateCommitPrompt(diff, undefined, customContext);
        debugLog("Sending prompt to DeepSeek API");
        debugLog("Prompt:", promptText);

        // Get model-specific configuration
        const config = MODEL_CONFIGS[model as DeepSeekModel];
        if (!config) {
            throw new Error(`Configuration not found for model: ${model}`);
        }

        // DeepSeek uses OpenAI-compatible API format
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "user",
                        content: promptText
                    }
                ],
                max_tokens: config.max_tokens,
                temperature: config.temperature,
                stream: false
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`DeepSeek API error: ${response.status} ${errorText}`);

            // Try to parse the error response
            let errorMessage = `DeepSeek API error: ${response.status}`;
            let errorType = '';

            try {
                const errorData = JSON.parse(errorText);
                if (errorData.error && errorData.error.message) {
                    errorMessage = errorData.error.message;
                    errorType = errorData.error.type || '';
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (parseError) {
                errorMessage = errorText || errorMessage;
            }

            debugLog(`Parsed error - Type: ${errorType}, Message: ${errorMessage}`);

            // Handle specific error cases based on DeepSeek error codes
            if (response.status === 429) {
                const retryAfter = response.headers.get('retry-after');
                if (retryAfter) {
                    throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before retrying.`);
                } else {
                    throw new Error("Rate limit exceeded. Please try again later.");
                }
            } else if (response.status === 401) {
                throw new Error("Authentication failed. Please check your DeepSeek API key.");
            } else if (response.status === 402) {
                throw new Error("Insufficient balance. Please check your account's balance and add funds if needed.");
            } else if (response.status === 400) {
                throw new Error(`Invalid request format: ${errorMessage}`);
            } else if (response.status === 422) {
                throw new Error(`Invalid parameters: ${errorMessage}`);
            } else if (response.status === 500) {
                throw new Error("DeepSeek server error. Please retry your request after a brief wait.");
            } else if (response.status === 503) {
                throw new Error("DeepSeek server is overloaded. Please retry your request after a brief wait.");
            } else {
                throw new Error(errorMessage);
            }
        }

        const data = await response.json();
        debugLog(`DeepSeek API response received`);

        // Process the response in OpenAI format
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const content = data.choices[0].message.content;
            debugLog(`Processing Response:\n${content}`);

            // Process the content into a formatted commit message
            const formattedMessage = enforceCommitMessageFormat(content);
            debugLog("DeepSeek API Response:", formattedMessage);
            return formattedMessage;
        } else {
            throw new Error('No valid response found in DeepSeek API response');
        }
    } catch (error) {
        debugLog("DeepSeek API Call Failed:", error);

        // Handle abort error specifically
        if (error instanceof Error && (error.message === 'Request was cancelled' || error.name === 'AbortError')) {
            throw new Error('Request was cancelled');
        }

        // Handle rate limiting
        if (error instanceof Error && error.message.includes("rate limit")) {
            throw new Error("Rate limit exceeded. Please try again later.");
        }

        // Handle invalid API key
        if (error instanceof Error && error.message.includes("Authentication failed")) {
            throw new Error("Invalid API key. Please check your DeepSeek API key.");
        }

        // Add specific handling for response processing errors
        if (error instanceof Error && error.message.includes("response")) {
            throw new Error("Failed to process DeepSeek response: " + error.message);
        }

        // Handle other errors
        if (error instanceof Error) {
            throw new Error(`DeepSeek API call failed: ${error.message}`);
        }

        throw new Error(`Unexpected error during DeepSeek API call: ${String(error)}`);
    }
}

/**
 * Validates a DeepSeek API key by making a simple request
 * @param apiKey The API key to validate
 * @returns Boolean indicating if the API key is valid
 */
export async function validateDeepSeekAPIKey(apiKey: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "user",
                        content: "Test"
                    }
                ],
                max_tokens: 10,
                stream: false
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        debugLog("API Key Validation Failed:", error);
        return false;
    }
}
