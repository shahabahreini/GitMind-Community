import { CommitMessage } from "../config/types";
import { debugLog } from "../services/debug/logger";
import sanitizeHtml from 'sanitize-html';

export function parseMarkdownContent(content: string): CommitMessage {
    const summaryMatch = content.match(/# Commit Summary\s*\n([^\n#]*)/);
    const descriptionMatch = content.match(
        /# Detailed Description\s*\n([\s\S]*?)(?:\n#|$)/
    );

    const summary = summaryMatch ? summaryMatch[1].trim() : "chore: update code";
    const description = descriptionMatch
        ? descriptionMatch[1].trim()
        : "Update implementation";

    return { summary, description };
}

export function cleanDeepSeekResponse(response: string): string {
    response = response.replace(/^:\s*/, '');
    const lines = response.split('\n');

    if (lines[0].includes('-')) {
        const match = lines[0].match(/(feat|fix|docs|style|refactor|test|chore):\s*([^-]+)/);
        if (match) {
            const [_, type, description] = match;
            return `${type}: ${description.trim()}\n\n${lines.join('\n')}`;
        }
    }

    let previous;
    do {
        previous = response;
        response = response
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    } while (response !== previous);

    response = sanitizeHtml(response, {
        allowedTags: [],
        allowedAttributes: {}
    });

    return response;
}

export function cleanGeminiResponse(response: string): string {
    response = response
        .replace(/^#\s.*$/gm, '')
        .replace(/```.*?```/gs, '')
        .replace(/\*\*/g, '')
        .replace(/`/g, '');

    const lines = response.split('\n').filter(line => line.trim());
    let summary = '';
    let bulletPoints: string[] = [];
    let foundSummary = false;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.toLowerCase().includes('detailed description')) {
            continue;
        }

        if (!foundSummary && trimmedLine.match(/^(feat|fix|docs|style|refactor|test|chore)(\([^)]+\))?:/i)) {
            summary = trimmedLine
                .replace(/^([^:]+):\s*(.*)$/, (_, type, desc) => `${type.toLowerCase()}: ${desc}`)
                .trim();
            foundSummary = true;
            continue;
        }

        if (trimmedLine.startsWith('-')) {
            const cleanedPoint = trimmedLine
                .replace(/^-\s*(feat|fix|docs|style|refactor|test|chore):\s*/i, '- ')
                .replace(/^-\s*/, '')
                .trim();

            if (cleanedPoint) {
                bulletPoints.push(`- ${cleanedPoint}`);
            }
        }
    }

    if (!summary && lines.length > 0) {
        const firstLine = lines[0].trim();
        if (firstLine) {
            const typeMatch = firstLine.match(/(feat|fix|docs|style|refactor|test|chore):/i);
            const type = typeMatch ? typeMatch[1].toLowerCase() : 'refactor';

            const description = firstLine
                .replace(/^[^a-zA-Z]+/, '')
                .replace(/^(feat|fix|docs|style|refactor|test|chore):\s*/i, '')
                .trim();

            summary = `${type}: ${description}`;
        } else {
            summary = 'refactor: update code implementation';
        }
    }

    if (summary.length > 72) {
        summary = summary.substring(0, 69) + '...';
    }

    if (bulletPoints.length === 0) {
        bulletPoints = ['- Update implementation with necessary changes'];
    }

    return `${summary}\n\n${bulletPoints.join('\n')}`;
}

/**
 * Cleans and formats responses from Together AI to a standard format
 * @param response The raw response from Together AI
 * @returns A formatted string with summary and description
 */
export function cleanTogetherAIResponse(response: string): string {
    try {
        debugLog(`Cleaning Together AI response`);

        // Remove any markdown code blocks and trim
        response = response.replace(/```[a-z]*\n?|\`\`\`/g, '').trim();

        // Split into lines and filter out empty lines
        const lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        if (lines.length === 0) {
            debugLog(`No content found in Together AI response`);
            return 'chore: update code\n\n- Update implementation with necessary changes';
        }

        // First line is the summary
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
        let bulletPoints: string[] = [];

        if (descriptionLines.length > 0) {
            bulletPoints = descriptionLines.map(line => {
                // Ensure line starts with a bullet point
                return line.match(/^[*-]\s/) ? line : `- ${line}`;
            });
        } else {
            bulletPoints = ['- Update implementation with necessary changes'];
        }

        debugLog(`Cleaned Together AI response: ${summary}`);
        return `${summary}\n\n${bulletPoints.join('\n')}`;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        debugLog(`Error cleaning Together AI response: ${errorMessage}`);
        return 'chore: error processing response\n\n- Error occurred while processing AI response';
    }
}