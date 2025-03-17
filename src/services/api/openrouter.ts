import { debugLog } from "../debug/logger";
import { generateCommitPrompt } from './prompts';

/**
 * Makes a request to the OpenRouter API to generate a commit message
 * @param apiKey The OpenRouter API key
 * @param model The model to use
 * @param diff Git diff to analyze
 * @param customContext Additional context provided by the user
 * @returns Generated commit message
 */
export async function callOpenRouterAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    try {
        debugLog(`Calling OpenRouter API with model: ${model}`);
        const prompt = generateCommitPrompt(diff, undefined, customContext);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/shahabahreini/AI-Commit-Assistant',
                'X-Title': 'GitMind: AI Commit Assistant'
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
            debugLog(`OpenRouter API error: ${response.status} ${errorText}`);
            throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        debugLog(`OpenRouter API response received`);

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return formatCommitMessage(data.choices[0].message.content);
        } else {
            throw new Error('Invalid response format from OpenRouter API');
        }
    } catch (error) {
        debugLog('Error in callOpenRouterAPI:', error);
        throw new Error(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
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
