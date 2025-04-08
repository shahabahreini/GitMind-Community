import { CommitMessage } from "../config/types";
import { debugLog } from "../services/debug/logger";

export function formatCommitMessage(message: CommitMessage): string {
    return `${message.summary}\n\n${message.description}`;
}

export async function processResponse(response: string): Promise<CommitMessage> {
    debugLog("Processing Response:", response);
    try {
        // Remove code block markers if present
        response = response.replace(/```[a-z]*\n|```/g, "");

        // Clean up markdown formatting
        response = response
            .replace(/\*\*/g, "")
            .replace(/`/g, "");

        const lines = response
            .trim()
            .split("\n")
            .filter((line) => line.trim());

        if (lines.length === 0) {
            return {
                summary: "refactor: update code implementation",
                description: "- Update implementation with necessary changes",
            };
        }

        // Extract summary (first line)
        let summary = lines[0].trim();

        // Check if summary has a conventional commit type
        const typePattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([^)]+\))?:/i;
        if (!typePattern.test(summary)) {
            // No type found, add a default type
            summary = `refactor: ${summary}`;
        }

        // Clean up the summary
        summary = summary
            .replace(/\[.*?\]/g, "")
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();

        // Truncate summary if needed, preserving the type prefix
        if (summary.length > 72) {
            const typeMatch = summary.match(typePattern);
            if (typeMatch) {
                const prefix = typeMatch[0];
                const rest = summary.substring(prefix.length).trim();
                const availableSpace = 72 - prefix.length - 3; // -3 for space and "..."
                const truncatedRest = rest.substring(0, availableSpace) + "...";
                summary = `${prefix} ${truncatedRest}`;
            } else {
                summary = summary.substring(0, 69) + "...";
            }
        }

        // Extract description (remaining lines)
        let bulletPoints = [];

        // Skip the first line (summary) and process the rest
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines and headings
            if (!line || line.startsWith('#')) {
                continue;
            }

            // Check if it's a bullet point already
            if (line.match(/^[-*•]\s+.+/)) {
                bulletPoints.push(line);
            } else if (i > 1 && bulletPoints.length > 0) {
                // If we've already found bullet points and this isn't one,
                // it might be a continuation of the previous point
                bulletPoints[bulletPoints.length - 1] += " " + line;
            }
        }

        // Join bullet points into description
        const description = bulletPoints.length > 0
            ? bulletPoints.join("\n")
            : "- Update implementation with necessary changes";

        debugLog("Processed Commit Message:", { summary, description });
        return { summary, description };
    } catch (error) {
        debugLog("Error Processing Response:", error);
        return {
            summary: "refactor: update code implementation",
            description: "- Update implementation with necessary changes",
        };
    }
}

