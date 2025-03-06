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
