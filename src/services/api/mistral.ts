import { debugLog } from "../debug/logger";
import { MistralResponse, MistralRateLimit } from "../../config/types";
import { generateCommitPrompt } from './prompts';

function extractRateLimits(headers: Headers): MistralRateLimit {
    return {
        reset: parseInt(headers.get('ratelimitbysize-reset') || '0'),
        limit: parseInt(headers.get('ratelimitbysize-limit') || '0'),
        remaining: parseInt(headers.get('ratelimitbysize-remaining') || '0'),
        queryCost: parseInt(headers.get('ratelimitbysize-query-cost') || '0'),
        monthlyLimit: parseInt(headers.get('x-ratelimitbysize-limit-month') || '0'),
        monthlyRemaining: parseInt(headers.get('x-ratelimitbysize-remaining-month') || '0')
    };
}

function enforceCommitMessageFormat(message: string): string {
    // Split the message into lines
    const lines = message.split('\n');

    if (lines.length === 0) {
        return message;
    }

    // Get the first line (subject line)
    let subjectLine = lines[0].trim();

    // Truncate the subject line if it exceeds 72 characters
    if (subjectLine.length > 72) {
        subjectLine = subjectLine.substring(0, 72);
        // Ensure we don't cut in the middle of a word
        if (subjectLine.lastIndexOf(' ') > 0) {
            subjectLine = subjectLine.substring(0, subjectLine.lastIndexOf(' '));
        }
    }

    // Reconstruct the message with the truncated subject line
    return [subjectLine, ...lines.slice(1)].join('\n');
}

export async function callMistralAPI(apiKey: string, model: string, diff: string, customContext: string = ""): Promise<string> {
    const prompt = generateCommitPrompt(diff, undefined, customContext);
    debugLog("Calling Mistral API", { model });
    debugLog("Prompt:", prompt);

    try {
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "user", content: prompt }
                ]
            })
        });

        // Extract and log rate limits
        const rateLimits = extractRateLimits(response.headers);
        debugLog("Mistral API Rate Limits:", rateLimits);

        // Check rate limits
        if (rateLimits.remaining <= 0) {
            const resetTime = new Date(Date.now() + rateLimits.reset * 1000);
            throw new Error(`Rate limit exceeded. Reset at ${resetTime.toLocaleString()}`);
        }

        if (!response.ok) {
            let errorMessage: string;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error?.message || 'Unknown error';
            } catch {
                errorMessage = response.statusText;
            }
            throw new Error(`Mistral API error (${response.status}): ${errorMessage}`);
        }

        const result = await response.json() as MistralResponse;
        const generatedText = result.choices[0]?.message?.content;

        if (!generatedText) {
            throw new Error("No generated text in response");
        }

        // Apply the commit message formatting rules
        const formattedMessage = enforceCommitMessageFormat(generatedText);
        debugLog("Mistral API Response:", formattedMessage);
        return formattedMessage;

    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("Mistral API error")) {
                throw error;
            }
            throw new Error(`Mistral API call failed: ${error.message}`);
        }
        throw new Error(`Unexpected error during Mistral API call: ${String(error)}`);
    }
}

export async function fetchMistralModels(apiKey: string): Promise<string[]> {
    try {
        const response = await fetch("https://api.mistral.ai/v1/models", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Filter models that have completion_chat capability set to true
        const chatModels = data.data
            .filter((model: any) => model.capabilities?.completion_chat === true)
            .map((model: any) => model.id);

        debugLog("Available Mistral chat models:", chatModels);
        return chatModels;
    } catch (error) {
        debugLog("Error fetching Mistral models:", error);
        throw error;
    }
}