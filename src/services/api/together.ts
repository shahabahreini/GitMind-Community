import { debugLog } from "../debug/logger";

/**
 * Makes a request to the Together AI API to generate a commit message
 * @param apiKey The Together AI API key
 * @param model The model to use (e.g., "meta-llama/Llama-3.3-70B-Instruct-Turbo")
 * @param diff Git diff to analyze
 * @param customContext Optional custom context to include in the prompt
 * @returns Generated commit message object with summary and description
 */
export async function callTogetherAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<{ summary: string, description?: string }> {
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

            try {
                const formattedMessage = formatCommitMessage(content);

                // Ensure we have valid content before returning
                if (!formattedMessage || !formattedMessage.summary || formattedMessage.summary.trim() === '') {
                    debugLog('Warning: Invalid formatted message structure');
                    return {
                        summary: "Error: Invalid message format",
                        description: "The generated message was not in the expected format."
                    };
                }

                debugLog(`Formatted message: ${JSON.stringify(formattedMessage)}`);
                // Return the formatted message directly
                return {
                    summary: formattedMessage.summary,
                    description: formattedMessage.description
                };
            } catch (formatError: unknown) {
                // Properly handle the unknown type
                const errorMessage = formatError instanceof Error
                    ? formatError.message
                    : String(formatError);
                debugLog(`Error formatting commit message: ${errorMessage}`);
                throw new Error(`Error formatting commit message: ${errorMessage}`);
            }
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
 * Parses the message into summary and description parts
 */
function formatCommitMessage(message: string): { summary: string, description?: string } {
    // Remove any markdown code block markers and trim
    message = message.replace(/```[a-z]*\n?|\`\`\`/g, '').trim();

    // Split into lines and filter out empty lines
    const lines = message.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) {
        throw new Error('Empty commit message received');
    }

    // First non-empty line is the summary
    let summary = lines[0];
    // Remove bullet point if present on the summary line
    summary = summary.replace(/^[*-]\s*/, '').trim();

    // Remaining lines form the description, preserving existing bullet points
    const descriptionLines = lines.slice(1);
    const description = descriptionLines.length > 0
        ? descriptionLines
            .map(line => {
                // If line doesn't start with bullet point, add one
                return line.match(/^[*-]\s/) ? line : `* ${line}`;
            })
            .join('\n')
            .trim()
        : undefined;

    // Only include description if it's not empty
    return {
        summary,
        ...(description && description.length > 0 ? { description } : {})
    };
}