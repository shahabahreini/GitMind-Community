import { CommitMessage } from "../config/types";
import { debugLog } from "../services/debug/logger";

interface ResponseAnalysis {
    responseLength: number;
    containsCodeBlocks: boolean;
    firstLine: string;
    bulletPointCount: number;
    nonEmptyLineCount: number;
    emptyLinesAfterFirst: number | null;
}

interface ProcessingStep {
    stage: string;
    content: string;
}

export function formatCommitMessage(message: CommitMessage): string {
    return `${message.summary}\n\n${message.description}`;
}

function analyzeResponseFormat(response: string): ResponseAnalysis {
    debugLog("=== RESPONSE FORMAT ANALYSIS ===");

    const bulletPointRegex = /^[-*•]\s+.+/gm;
    const bulletPoints = response.match(bulletPointRegex);
    const lines = response.split("\n").filter(line => line.trim());

    const firstLineIndex = response.indexOf("\n");
    let emptyLinesAfterFirst = null;
    if (firstLineIndex > -1) {
        const nextNonEmptyLine = response.substring(firstLineIndex + 1).split("\n").findIndex(line => line.trim());
        emptyLinesAfterFirst = nextNonEmptyLine;
    }

    const analysis: ResponseAnalysis = {
        responseLength: response.length,
        containsCodeBlocks: response.includes("```"),
        firstLine: response.split("\n")[0],
        bulletPointCount: bulletPoints?.length || 0,
        nonEmptyLineCount: lines.length,
        emptyLinesAfterFirst
    };

    debugLog("Response analysis", analysis);
    if (bulletPoints) { debugLog("Bullet point samples", bulletPoints.slice(0, 3)); }
    debugLog("=== END ANALYSIS ===");

    return analysis;
}

function cleanResponse(response: string): ProcessingStep[] {
    const steps: ProcessingStep[] = [];

    steps.push({ stage: "original", content: response });

    // Remove code block markers
    const withoutCodeBlocks = response.replace(/```[a-z]*\n|```/g, "");
    steps.push({ stage: "code_blocks_removed", content: withoutCodeBlocks });

    // Clean markdown formatting
    const cleanedMarkdown = withoutCodeBlocks
        .replace(/\*\*/g, "")
        .replace(/`/g, "");
    steps.push({ stage: "markdown_cleaned", content: cleanedMarkdown });

    steps.forEach(step => debugLog(`After ${step.stage}`, JSON.stringify(step.content)));

    return steps;
}

function processSummary(summary: string): string {
    const typePattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([^)]+\))?:/i;
    let processedSummary = summary.trim();

    debugLog("Initial summary", processedSummary);

    // Add conventional commit type if missing
    if (!typePattern.test(processedSummary)) {
        processedSummary = `refactor: ${processedSummary}`;
        debugLog("Added default type", processedSummary);
    }

    // Clean up summary
    const originalSummary = processedSummary;
    processedSummary = processedSummary
        .replace(/\[.*?\]/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();

    if (originalSummary !== processedSummary) {
        debugLog("Cleaned summary", processedSummary);
    }

    // Truncate if needed
    if (processedSummary.length > 72) {
        debugLog("Summary needs truncation", { length: processedSummary.length });
        const typeMatch = processedSummary.match(typePattern);

        if (typeMatch) {
            const prefix = typeMatch[0];
            const rest = processedSummary.substring(prefix.length).trim();
            const availableSpace = 72 - prefix.length - 3;
            processedSummary = `${prefix} ${rest.substring(0, availableSpace)}...`;
        } else {
            processedSummary = processedSummary.substring(0, 69) + "...";
        }
        debugLog("Truncated summary", processedSummary);
    }

    return processedSummary;
}

function processDescription(lines: string[]): string {
    debugLog("Description lines before processing", lines);

    // Skip empty lines at beginning
    const startIndex = lines.findIndex(line => line.trim());
    const nonEmptyLines = startIndex >= 0 ? lines.slice(startIndex) : [];

    debugLog("Non-empty description lines", nonEmptyLines);

    const bulletPoints: string[] = [];

    for (const line of nonEmptyLines) {
        const trimmedLine = line.trim();

        // Skip empty lines and headings
        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue;
        }

        // Convert to bullet point if not already
        if (trimmedLine.match(/^[-*•]\s+.+/)) {
            bulletPoints.push(trimmedLine);
            debugLog("Found bullet point", trimmedLine);
        } else {
            const bulletPoint = `- ${trimmedLine}`;
            bulletPoints.push(bulletPoint);
            debugLog("Created bullet point", bulletPoint);
        }
    }

    debugLog("Processed bullet points", bulletPoints);

    return bulletPoints.length > 0
        ? bulletPoints.join("\n")
        : "- Update implementation with necessary changes";
}

export async function processResponse(response: string): Promise<CommitMessage> {
    debugLog("Processing Response (original)", response);

    try {
        analyzeResponseFormat(response);

        const cleaningSteps = cleanResponse(response);
        const cleanedContent = cleaningSteps[cleaningSteps.length - 1].content;

        const lines = cleanedContent
            .trim()
            .split("\n")
            .filter(line => line.trim());

        debugLog("Split lines", lines);

        if (lines.length === 0) {
            debugLog("No lines found, returning default");
            return {
                summary: "refactor: update code implementation",
                description: "- Update implementation with necessary changes",
            };
        }

        const summary = processSummary(lines[0]);
        const description = processDescription(lines.slice(1));

        const result = { summary, description };
        debugLog("Final commit message", result);

        return result;
    } catch (error) {
        debugLog("Error Processing Response", error);
        return {
            summary: "refactor: update code implementation",
            description: "- Update implementation with necessary changes",
        };
    }
}