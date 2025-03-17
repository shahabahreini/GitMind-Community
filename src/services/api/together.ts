import { debugLog } from "../debug/logger";

/**
 * Makes a request to the Together AI API to generate a commit message
 * @param apiKey The Together AI API key
 * @param model The model to use (e.g., "meta-llama/Llama-3.3-70B-Instruct-Turbo")
 * @param diff Git diff to analyze
 * @param customContext Optional custom context to include in the prompt
 * @returns Generated commit message as a string
 */
export async function callTogetherAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    try {
        debugLog(`Calling Together AI API with model: ${model}`);
        const prompt = createPromptFromDiff(diff, customContext);

        // Using the chat completions API format
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
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            debugLog(`Together AI API error: ${response.status} ${errorText}`);
            throw new Error(`Together AI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        debugLog(`Together AI API response received`);

        // Process the response based on the Together AI API format
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const content = data.choices[0].message.content;
            debugLog(`Processing Response:\n${content}`);

            // Format the message and return it as a string
            return formatCommitMessage(content);
        } else {
            debugLog('Invalid response format from Together AI API');
            throw new Error('Invalid response format from Together AI API');
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        debugLog(`Error in callTogetherAPI: ${errorMessage}`);
        throw error; // Let the error be handled by the caller
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