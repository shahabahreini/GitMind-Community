import { CommitMessage } from "../config/types";
import { debugLog } from "../services/debug/logger";

export function formatCommitMessage(message: CommitMessage): string {
    return `${message.summary}\n\n${message.description}`;
}


export async function processResponse(response: string): Promise<CommitMessage> {
    debugLog("Processing Response:", response);
    try {
        response = response
            .replace(/\*\*/g, "")
            .replace(/`/g, "");

        const lines = response
            .trim()
            .split("\n")
            .filter((line) => line.trim());

        const summaryPattern =
            /^(feat|fix|docs|style|refactor|test|chore)(\([^)]+\))?:\s+[^\n]+$/i;
        let summary = "";
        let bulletPoints: string[] = [];
        let foundSummary = false;

        for (const line of lines) {
            const cleanLine = line.trim();
            if (!foundSummary && summaryPattern.test(cleanLine)) {
                summary = cleanLine.replace(/(feat|fix|docs|style|refactor|test|chore):\s*(feat|fix|docs|style|refactor|test|chore):/, '$1:');
                foundSummary = true;
                continue;
            }

            if (foundSummary && cleanLine) {
                if (cleanLine.startsWith("-")) {
                    const cleanedPoint = cleanLine.replace(/^-\s*(feat|fix|docs|style|refactor|test|chore):\s*/, '- ');
                    bulletPoints.push(cleanedPoint);
                } else if (!cleanLine.startsWith("#") && !cleanLine.startsWith("*")) {
                    bulletPoints.push(`- ${cleanLine}`);
                }
            }
        }

        if (!summary) {
            const firstLine = lines[0]?.trim();
            if (firstLine) {
                const typeMatch = firstLine.match(/(feat|fix|docs|style|refactor|test|chore):/i);
                const type = typeMatch ? typeMatch[1].toLowerCase() : "refactor";
                const description = firstLine
                    .replace(/(feat|fix|docs|style|refactor|test|chore):/ig, '')
                    .replace(/^[-:\s]+/, '')
                    .trim();
                summary = `${type}: ${description}`;
            } else {
                summary = "refactor: update code implementation";
            }
        }

        let previousSummary: string;
        do {
            previousSummary = summary;
            summary = summary
                .replace(/\[.*?\]/g, "")
                .replace(/<[^>]+>/g, "")
                .replace(/\s+/g, " ")
                .trim();
        } while (summary !== previousSummary);

        if (typeof summary === 'string' && summary.length > 72) {
            summary = summary.substring(0, 69) + "...";
        }

        const description = bulletPoints.length > 0
            ? bulletPoints.join("\n")
            : "- Update implementation with necessary changes";

        debugLog("Processed Commit Message:", { summary, description });
        return { summary, description };
    } catch (error) {
        debugLog("Error Processing Response:", error);
        return {
            summary: "refactor: update code structure",
            description: "- Update implementation with necessary changes",
        };
    }
}
