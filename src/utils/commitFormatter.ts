import { CommitMessage } from "../config/types";
import { debugLog } from "../services/debug/logger";

export function formatCommitMessage(message: CommitMessage): string {
    return `${message.summary}\n\n${message.description}`;
}

function analyzeResponseFormat(response: string): void {
    debugLog("=== RESPONSE FORMAT ANALYSIS ===");

    const analysisData = {
        responseLength: response.length,
        containsCodeBlocks: response.includes("```"),
        firstLine: response.split("\n")[0],
    };
    debugLog("Basic format info", analysisData);

    // Check for bullet points
    const bulletPointRegex = /^[-*•]\s+.+/gm;
    const bulletPoints = response.match(bulletPointRegex);

    const bulletPointInfo = {
        count: bulletPoints ? bulletPoints.length : 0,
        samples: bulletPoints ? bulletPoints.slice(0, 3) : []
    };
    debugLog("Bullet point analysis", bulletPointInfo);

    // Check for line breaks
    const lines = response.split("\n").filter(line => line.trim());

    // Check for empty lines after first line
    const firstLineIndex = response.indexOf("\n");
    let emptyLinesAfterFirst = null;
    if (firstLineIndex > -1) {
        const nextNonEmptyLine = response.substring(firstLineIndex + 1).split("\n").findIndex(line => line.trim());
        emptyLinesAfterFirst = nextNonEmptyLine;
    }

    const lineInfo = {
        nonEmptyLineCount: lines.length,
        emptyLinesAfterFirst
    };
    debugLog("Line structure analysis", lineInfo);

    debugLog("=== END ANALYSIS ===");
}

export async function processResponse(response: string): Promise<CommitMessage> {
    debugLog("Processing Response (original)", response);

    // Call the analysis function
    analyzeResponseFormat(response);

    try {
        // Log the response before any processing
        debugLog("Response before processing", JSON.stringify(response));

        // Remove code block markers if present
        const withoutCodeBlocks = response.replace(/```[a-z]*\n|```/g, "");
        debugLog("After code block removal", JSON.stringify(withoutCodeBlocks));

        // Clean up markdown formatting
        const cleanedMarkdown = withoutCodeBlocks
            .replace(/\*\*/g, "")
            .replace(/`/g, "");
        debugLog("After markdown cleanup", JSON.stringify(cleanedMarkdown));

        const lines = cleanedMarkdown
            .trim()
            .split("\n")
            .filter((line) => line.trim());
        debugLog("Split lines", lines);

        if (lines.length === 0) {
            debugLog("No lines found, returning default");
            return {
                summary: "refactor: update code implementation",
                description: "- Update implementation with necessary changes",
            };
        }

        // Extract summary (first line)
        let summary = lines[0].trim();
        debugLog("Initial summary", summary);

        // Check if summary has a conventional commit type
        const typePattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([^)]+\))?:/i;
        const hasType = typePattern.test(summary);
        debugLog("Has conventional type", hasType);

        if (!hasType) {
            // No type found, add a default type
            summary = `refactor: ${summary}`;
            debugLog("Added default type", summary);
        }

        // Clean up the summary
        const originalSummary = summary;
        summary = summary
            .replace(/\[.*?\]/g, "")
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();
        debugLog("Cleaned summary", { summary, changed: originalSummary !== summary });

        // Truncate summary if needed, preserving the type prefix
        if (summary.length > 72) {
            debugLog("Summary needs truncation", { length: summary.length });
            const typeMatch = summary.match(typePattern);
            if (typeMatch) {
                const prefix = typeMatch[0];
                const rest = summary.substring(prefix.length).trim();
                const availableSpace = 72 - prefix.length - 3; // -3 for space and "..."
                const truncatedRest = rest.substring(0, availableSpace) + "...";
                summary = `${prefix} ${truncatedRest}`;
                debugLog("Truncated with prefix", summary);
            } else {
                summary = summary.substring(0, 69) + "...";
                debugLog("Simple truncation", summary);
            }
        }

        // Extract description (remaining lines)
        const descriptionLines = lines.slice(1);
        debugLog("Description lines before processing", descriptionLines);

        // Skip empty lines at the beginning of description
        let startIndex = 0;
        while (startIndex < descriptionLines.length && !descriptionLines[startIndex].trim()) {
            startIndex++;
        }

        const nonEmptyDescriptionLines = descriptionLines.slice(startIndex);
        debugLog("Non-empty description lines", nonEmptyDescriptionLines);

        // Process bullet points
        let bulletPoints: string[] = [];

        for (let i = 0; i < nonEmptyDescriptionLines.length; i++) {
            const line = nonEmptyDescriptionLines[i].trim();

            // Skip empty lines and headings
            if (!line || line.startsWith('#')) {
                continue;
            }

            // Check if it's already a bullet point
            if (line.match(/^[-*•]\s+.+/)) {
                bulletPoints.push(line);
                debugLog("Found bullet point", line);
            } else {
                // Convert to bullet point if not already
                const bulletPoint = `- ${line}`;
                bulletPoints.push(bulletPoint);
                debugLog("Created bullet point", bulletPoint);
            }
        }

        debugLog("Processed bullet points", bulletPoints);

        // Use default description only if no bullet points were found
        const description = bulletPoints.length > 0
            ? bulletPoints.join("\n")
            : "- Update implementation with necessary changes";

        debugLog("Final description", description);
        debugLog("Final commit message", { summary, description });

        return { summary, description };
    } catch (error) {
        debugLog("Error Processing Response", error);
        return {
            summary: "refactor: update code implementation",
            description: "- Update implementation with necessary changes",
        };
    }
}
