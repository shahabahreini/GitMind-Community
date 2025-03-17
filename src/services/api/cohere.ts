import { debugLog } from "../debug/logger";

/**
 * Makes a request to the Cohere API to generate a commit message
 * @param apiKey The Cohere API key
 * @param model The model to use (e.g., "command", "command-light")
 * @param diff Git diff to analyze
 * @param customContext Additional context provided by the user
 * @returns Generated commit message
 */
export async function callCohereAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    try {
        debugLog(`Calling Cohere API with model: ${model}`);
        const prompt = createPromptFromDiff(diff, customContext);

        // Using the v2 chat API with the proper message format
        const response = await fetch('https://api.cohere.ai/v2/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`Cohere API error: ${response.status} ${errorText}`);
            throw new Error(`Cohere API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        debugLog(`Cohere API response received`);

        // Process the response based on v2 chat API format
        if (data.message && data.message.content && data.message.content.length > 0) {
            for (const contentItem of data.message.content) {
                if (contentItem.type === "text") {
                    return formatCommitMessage(contentItem.text);
                }
            }
            throw new Error('No text content found in Cohere API response');
        } else {
            throw new Error('Invalid response format from Cohere API');
        }
    } catch (error) {
        debugLog('Error in callCohereAPI:', error);
        throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Creates a prompt from the git diff to send to the model
 */
function createPromptFromDiff(diff: string, customContext: string = ""): string {
    let prompt = `Generate a concise and informative git commit message based on the following changes.
Focus on what was changed and why. Keep the message under 72 characters for the summary line.
If verbose mode is needed, add bullet points explaining key changes.`;

    // Add custom context if provided
    if (customContext.trim()) {
        prompt += `\n\nAdditional context from the user: ${customContext.trim()}`;
    }

    prompt += `\n\nHere are the changes:

\`\`\`
${diff}
\`\`\`

Git Commit Message:`;

    return prompt;
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
