import { CommitMessage } from "../config/types";
import { debugLog } from "../services/debug/logger";
import sanitizeHtml from 'sanitize-html';

interface CleaningConfig {
    removePatterns: RegExp[];
    defaultType: string;
    preserveBullets: boolean;
}

const COMMIT_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build', 'revert'];
const COMMIT_TYPE_PATTERN = new RegExp(`^(${COMMIT_TYPES.join('|')})(\\([^)]+\\))?:`, 'i');
const MAX_SUMMARY_LENGTH = 72;

export function parseMarkdownContent(content: string): CommitMessage {
    const summaryMatch = content.match(/# Commit Summary\s*\n([^\n#]*)/);
    const descriptionMatch = content.match(/# Detailed Description\s*\n([\s\S]*?)(?:\n#|$)/);

    return {
        summary: summaryMatch?.[1]?.trim() || "chore: update code",
        description: descriptionMatch?.[1]?.trim() || "Update implementation"
    };
}

export function cleanDeepSeekResponse(response: string): string {
    const config: CleaningConfig = {
        removePatterns: [/<think>[\s\S]*?<\/think>/g, /^:\s*/],
        defaultType: 'chore',
        preserveBullets: true
    };

    return cleanResponseWithConfig(response, config, (cleaned) => {
        const lines = cleaned.split('\n');

        if (lines[0]?.includes('-')) {
            const match = lines[0].match(/(feat|fix|docs|style|refactor|test|chore):\s*([^-]+)/);
            if (match) {
                const [_, type, description] = match;
                return `${type}: ${description.trim()}\n\n${lines.join('\n')}`;
            }
        }

        return sanitizeHtml(cleaned, { allowedTags: [], allowedAttributes: {} });
    });
}

export function cleanGeminiResponse(response: string): string {
    const config: CleaningConfig = {
        removePatterns: [/^#\s.*$/gm, /```.*?```/gs, /\*\*/g, /`/g],
        defaultType: 'refactor',
        preserveBullets: true
    };

    return cleanResponseWithConfig(response, config, (cleaned) => {
        const lines = cleaned.split('\n').filter(line => line.trim());
        let summary = '';
        const bulletPoints: string[] = [];
        let foundSummary = false;

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed || trimmed.toLowerCase().includes('detailed description')) { continue; }

            if (!foundSummary && COMMIT_TYPE_PATTERN.test(trimmed)) {
                summary = trimmed.replace(/^([^:]+):\s*(.*)$/, (_, type, desc) => `${type.toLowerCase()}: ${desc}`).trim();
                foundSummary = true;
                continue;
            }

            if (trimmed.startsWith('-')) {
                const cleaned = trimmed.replace(/^-\s*(feat|fix|docs|style|refactor|test|chore):\s*/i, '- ').replace(/^-\s*/, '').trim();
                if (cleaned) { bulletPoints.push(`- ${cleaned}`); }
            }
        }

        if (!summary) {
            summary = generateSummary(lines[0] || '', 'refactor');
        }

        return formatCommitMessage(summary, bulletPoints.length ? bulletPoints : ['- Update implementation with necessary changes']);
    });
}

export function cleanTogetherAIResponse(response: string): string {
    const config: CleaningConfig = {
        removePatterns: [/```[a-z]*\n?|\`\`\`/g],
        defaultType: 'chore',
        preserveBullets: true
    };

    return cleanResponseWithConfig(response, config, (cleaned) => {
        debugLog('Cleaning Together AI response');

        const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        if (lines.length === 0) {
            debugLog('No content found in Together AI response');
            return 'chore: update code\n\n- Update implementation with necessary changes';
        }

        let summary = lines[0].replace(/^[*-]\s*/, '').trim();

        if (!COMMIT_TYPE_PATTERN.test(summary)) {
            const type = determineCommitType(summary);
            summary = `${type}: ${summary}`;
        }

        summary = summary.replace(/^([^:]+):\s*(.*)$/, (_, type, desc) => `${type.toLowerCase()}: ${desc}`).trim();
        summary = truncateSummary(summary);

        const bulletPoints = lines.slice(1).map(line =>
            line.match(/^[*-]\s/) ? line : `- ${line}`
        );

        debugLog(`Cleaned Together AI response: ${summary}`);
        return formatCommitMessage(summary, bulletPoints.length ? bulletPoints : ['- Update implementation with necessary changes']);
    });
}

function cleanResponseWithConfig(
    response: string,
    config: CleaningConfig,
    customProcessor?: (cleaned: string) => string
): string {
    try {
        let cleaned = response;

        // Apply remove patterns
        for (const pattern of config.removePatterns) {
            cleaned = cleaned.replace(pattern, '');
        }

        // Normalize whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return customProcessor ? customProcessor(cleaned) : cleaned;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        debugLog(`Error cleaning response: ${errorMessage}`);
        return `${config.defaultType}: error processing response\n\n- Error occurred while processing AI response`;
    }
}

function determineCommitType(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('fix')) { return 'fix'; }
    if (lower.includes('add')) { return 'feat'; }
    if (lower.includes('updat')) { return 'chore'; }
    if (lower.includes('refactor')) { return 'refactor'; }
    return 'chore';
}

function generateSummary(firstLine: string, defaultType: string): string {
    if (!firstLine?.trim()) {
        return `${defaultType}: update code implementation`;
    }

    const typeMatch = firstLine.match(COMMIT_TYPE_PATTERN);
    const type = typeMatch ? typeMatch[1].toLowerCase() : defaultType;
    const description = firstLine
        .replace(/^[^a-zA-Z]+/, '')
        .replace(COMMIT_TYPE_PATTERN, '')
        .trim();

    return `${type}: ${description || 'update code implementation'}`;
}

function truncateSummary(summary: string): string {
    return summary.length > MAX_SUMMARY_LENGTH ? summary.substring(0, 69) + '...' : summary;
}

function formatCommitMessage(summary: string, bulletPoints: string[]): string {
    return `${truncateSummary(summary)}\n\n${bulletPoints.join('\n')}`;
}