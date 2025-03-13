import { debugLog } from "../debug/logger";

/**
 * Makes a request to the OpenAI API to generate a commit message
 * @param apiKey The OpenAI API key
 * @param model The model to use (e.g., "gpt-3.5-turbo")
 * @param diff Git diff to analyze
 * @returns Generated commit message
 */
export async function callOpenAIAPI(apiKey: string, model: string, diff: string): Promise<string> {
    try {
        debugLog(`Calling OpenAI API with model: ${model}`);
        const prompt = createPromptFromDiff(diff);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`OpenAI API error: ${response.status} ${errorText}`);
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        debugLog(`OpenAI API response received`);

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return formatCommitMessage(data.choices[0].message.content);
        } else {
            throw new Error('Invalid response format from OpenAI API');
        }
    } catch (error) {
        debugLog('Error in callOpenAIAPI:', error);
        throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Creates a prompt from the git diff to send to the model
 */
function createPromptFromDiff(diff: string): string {
    return `Generate a concise and informative git commit message based on the following changes.
Focus on what was changed and why. Keep the message under 72 characters for the summary line.
If verbose mode is needed, add bullet points explaining key changes.

Here are the changes:

\`\`\`
${diff}
\`\`\`

Git Commit Message:`;
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
