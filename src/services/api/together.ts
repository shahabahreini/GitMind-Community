import { debugLog } from "../debug/logger";
import { RequestManager } from "../../utils/requestManager";

/**
 * Together AI API error interface
 */
interface TogetherAIError {
    id?: string;
    error: {
        message: string;
        type: string;
        param?: string;
        code?: string;
    };
}

/**
 * Helper function to format bytes in human-readable format
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) { return '0 B'; }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Converts Together AI API errors to user-friendly messages
 */
function getUserFriendlyErrorMessage(statusCode: number, parsedError: TogetherAIError | null): string {
    if (parsedError?.error) {
        const { type, message } = parsedError.error;

        switch (statusCode) {
            case 401:
                return "Together AI API key is invalid or missing. Please check your API key in settings.";

            case 422:
                if (message.includes("Input validation error") && message.includes("tokens")) {
                    return "The git diff is too large for the selected model. Try:\n• Staging fewer files\n• Using a model with larger context window\n• Breaking changes into smaller commits";
                } else if (message.includes("max_new_tokens")) {
                    return "Content size exceeds model limits. Please try with fewer staged files or a different model.";
                }
                return `Together AI request validation failed: ${message}`;

            case 429:
                return "Together AI rate limit exceeded. Please wait a moment and try again.";

            case 400:
                if (type === "invalid_request_error") {
                    return `Together AI request error: ${message}. Please check your model selection.`;
                }
                return "Invalid request to Together AI. Please check your settings.";

            case 403:
                return "Access denied to Together AI. Please check your API key permissions.";

            case 404:
                return "Together AI model not found. Please select a different model in settings.";

            case 500:
            case 502:
            case 503:
                return "Together AI service is temporarily unavailable. Please try again later.";

            default:
                return `Together AI API error (${statusCode}): ${message}`;
        }
    }

    // Fallback for unparseable errors
    switch (statusCode) {
        case 401:
            return "Together AI API key is invalid. Please check your settings.";
        case 422:
            return "Content is too large for the model. Try staging fewer files.";
        case 429:
            return "Together AI rate limit exceeded. Please wait and try again.";
        case 500:
            return "Together AI service error. Please try again later.";
        default:
            return `Together AI API error (${statusCode}). Please try again.`;
    }
}

export async function callTogetherAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    try {
        debugLog(`Calling Together AI API with model: ${model}`);

        // Calculate diff metrics for better error reporting
        const diffSize = diff.length;
        const estimatedTokens = Math.ceil(diffSize / 4); // Rough estimation: 1 token ≈ 4 characters
        const filesChanged = (diff.match(/diff --git/g) || []).length;

        debugLog(`Diff analysis: ${diffSize} chars, ~${estimatedTokens} tokens, ${filesChanged} files`);

        if (diffSize > 20000) { // ~5000 tokens approximation
            debugLog(`Warning: Large diff detected (${diffSize} characters). May exceed model limits.`);
        }

        const prompt = createPromptFromDiff(diff, customContext);

        const response = await fetch('https://api.together.xyz/v1/chat/completions', {
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
                        content: prompt
                    }
                ],
                max_tokens: 1000
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`Together AI API error: ${response.status} ${errorText}`);

            // Parse and handle specific Together AI errors
            let parsedError: TogetherAIError | null = null;
            try {
                parsedError = JSON.parse(errorText) as TogetherAIError;
            } catch (parseError) {
                debugLog('Failed to parse Together AI error response');
            }

            // Enhanced error handling with context
            if (parsedError?.error && response.status === 422) {
                const { message } = parsedError.error;
                if (message.includes("tokens") && message.includes("must be <=")) {
                    // Extract specific token information from the error
                    const tokenMatch = message.match(/(\d+) `inputs` tokens and (\d+) `max_new_tokens`/);
                    const inputTokens = tokenMatch ? parseInt(tokenMatch[1]) : estimatedTokens;
                    const maxNewTokens = tokenMatch ? parseInt(tokenMatch[2]) : 0;

                    // Extract model limit
                    const limitMatch = message.match(/must be <= (\d+)/);
                    const modelLimit = limitMatch ? parseInt(limitMatch[1]) : 0;

                    throw new Error(
                        `Together AI API error: 422 - Content exceeds model limits.\n\n` +
                        `Details:\n` +
                        `• Input tokens: ${inputTokens.toLocaleString()}\n` +
                        `• Max output tokens requested: ${maxNewTokens.toLocaleString()}\n` +
                        `• Model limit: ${modelLimit.toLocaleString()} tokens\n` +
                        `• Files changed: ${filesChanged}\n` +
                        `• Diff size: ${formatBytes(diffSize)}\n\n` +
                        `Solutions:\n` +
                        `• Stage fewer files (try 'git add -p' for selective staging)\n` +
                        `• Break this into ${Math.ceil(inputTokens / (modelLimit * 0.7))} smaller commits\n` +
                        `• Use a model with larger context window\n` +
                        `• Remove formatting-only changes to reduce size`
                    );
                }
            }

            const userFriendlyError = getUserFriendlyErrorMessage(response.status, parsedError);
            throw new Error(userFriendlyError);
        }

        const data = await response.json();
        debugLog(`Together AI API response received`);

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const content = data.choices[0].message.content;
            debugLog(`Processing Response:\n${content}`);

            return formatCommitMessage(content);
        } else {
            debugLog('Invalid response format from Together AI API');
            throw new Error('Invalid response format from Together AI API');
        }
    } catch (error: unknown) {
        debugLog(`Error in callTogetherAPI: ${error}`);

        // Handle abort error specifically
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request was cancelled');
        }

        // Re-throw enhanced errors as-is
        if (error instanceof Error && error.message.includes('Together AI API error: 422')) {
            throw error;
        }

        // Re-throw our custom errors as-is
        if (error instanceof Error && error.message.includes('Together AI')) {
            throw error;
        }

        throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Creates a prompt from the git diff to send to the model
 */
function createPromptFromDiff(diff: string, customContext: string = ""): string {
    let prompt = `Generate a concise and informative git commit message based on the following changes.
The message should have:
1. A summary line (max 72 characters)
2. A detailed description using bullet points

Format the response as:
<summary line>

* <detail point 1>
* <detail point 2>
...`;

    if (customContext.trim()) {
        prompt += `\n\nAdditional context: ${customContext.trim()}`;
    }

    prompt += `\n\nChanges:\n\`\`\`\n${diff}\n\`\`\``;

    return prompt;
}

/**
 * Cleans up and formats the commit message returned by the API
 * Returns a properly formatted commit message string
 */
function formatCommitMessage(message: string): string {
    // First remove thinking sections (used by models like DeepSeek)
    message = removeThinkingSections(message);

    // Remove any markdown code block markers and trim
    message = message.replace(/```[a-z]*\n?|\`\`\`/g, '').trim();

    // Split into lines and filter out empty lines
    const lines = message.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) {
        return 'chore: update code\n\n- Update implementation with necessary changes';
    }

    // First non-empty line is the summary
    let summary = lines[0];
    // Remove bullet point if present on the summary line
    summary = summary.replace(/^[*-]\s*/, '').trim();

    // Check if the summary has a conventional commit prefix, add one if not
    if (!summary.match(/^(feat|fix|docs|style|refactor|test|chore)(\([^)]+\))?:/i)) {
        // Try to determine an appropriate type from the content
        const type = summary.toLowerCase().includes('fix') ? 'fix' :
            summary.toLowerCase().includes('add') ? 'feat' :
                summary.toLowerCase().includes('updat') ? 'chore' :
                    summary.toLowerCase().includes('refactor') ? 'refactor' :
                        'chore';

        summary = `${type}: ${summary}`;
    }

    // Ensure the summary is properly formatted and not too long
    summary = summary
        .replace(/^([^:]+):\s*(.*)$/, (_, type, desc) => `${type.toLowerCase()}: ${desc}`)
        .trim();

    if (summary.length > 72) {
        summary = summary.substring(0, 69) + '...';
    }

    // Remaining lines form the description, preserving existing bullet points
    const descriptionLines = lines.slice(1);
    let description = '';

    if (descriptionLines.length > 0) {
        description = descriptionLines.map(line => {
            // Ensure line starts with a bullet point
            return line.match(/^[*-]\s/) ? line : `- ${line}`;
        }).join('\n');
    } else {
        description = '- Update implementation with necessary changes';
    }

    // Return the formatted commit message as a string with summary and description
    return `${summary}\n\n${description}`;
}

/**
 * Removes thinking sections from model responses
 * This is mainly needed for models like DeepSeek that include reasoning/thinking sections
 */
function removeThinkingSections(text: string): string {
    // Remove content between <think> and </think> tags
    let cleanedText = text.replace(/<think>[\s\S]*?<\/think>/g, '');

    // Sometimes the text has "chore: <think>" prefixes or "- </think>" lines
    cleanedText = cleanedText.replace(/^.*?<think>.*$/gm, '');
    cleanedText = cleanedText.replace(/^.*?<\/think>.*$/gm, '');

    // Remove any possible remaining HTML-like tags related to thinking
    cleanedText = cleanedText.replace(/<\/?think.*?>/g, '');

    // Clean up any incorrect prefixes that might be added
    cleanedText = cleanedText.replace(/^chore:\s+(?=\w+:)/i, '');

    // Trim and clean up whitespace
    return cleanedText.trim();
}