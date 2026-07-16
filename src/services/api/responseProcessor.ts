// src/services/api/responseProcessor.ts
import * as vscode from 'vscode';
import { diagnosticLog } from '../debug/logger';
import { CommitMessage } from '../../config/types';
import { PromptConfig } from './prompts';
import { removeCodeBlocks, cleanMarkdown } from './utils';

function clampBulletPoints(bulletPoints: string[], maxBodyLines?: number): string[] {
    if (!maxBodyLines || maxBodyLines <= 0) {
        return bulletPoints;
    }

    if (bulletPoints.length <= maxBodyLines) {
        return bulletPoints;
    }

    diagnosticLog({ subsystem: "provider", event: "response.body_clamped", functionName: "clampBulletPoints", data: { originalCount: bulletPoints.length, maxBodyLines } });
    return bulletPoints.slice(0, maxBodyLines);
}

export function processCommitMessage(response: string, config: PromptConfig = {}): CommitMessage {
    diagnosticLog({ subsystem: "provider", event: "response.processing_started", functionName: "processCommitMessage", data: { responseLength: response.length } });

    // Analyze the response for debugging
    const responseAnalysis = {
        responseLength: response.length,
        containsCodeBlocks: response.includes('```'),
        bulletPointCount: (response.match(/^- /gm) || []).length,
        nonEmptyLineCount: response.split('\n').filter(line => line.trim()).length,
        emptyLinesAfterFirst: response.split('\n').slice(1).findIndex(line => line.trim() !== '') + 1
    };

    diagnosticLog({ subsystem: "provider", event: "response.format_analyzed", functionName: "processCommitMessage", data: responseAnalysis });

    // Remove code blocks and clean markdown
    let processed = response.trim();
    processed = removeCodeBlocks(processed);
    processed = cleanMarkdown(processed);

    // Split into lines and filter out empty ones
    const lines = processed.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) {
        throw new Error("Empty response received from AI");
    }

    // Get the first line as summary and clean any duplicated colons (e.g., "feat(scope)::")
    let summary = lines[0].replace(/^([a-z0-9-]+(?:\([^)]+\))?!?)(?:\s*:){2,}/gim, '$1:');

    // Check if this is a style that should not be modified
    const isEmberStyle = config.style === 'ember' && summary.match(/^\[.+\]/);
    const isEmojiStyle = (config.style === 'emojigit' || config.style === 'gitmoji') && /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(summary);
    const isConventionalStyle = summary.match(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?: /);
    const isLinuxStyle = config.style === 'linux' && summary.match(/^[a-z]+: /);
    const isJqueryStyle = config.style === 'jquery' && summary.match(/^[A-Z][a-z]+: .+\. (Fixes|Closes|Refs) #\d+/);
    const isBasicStyle = config.style === 'basic' || !config.style;

    diagnosticLog({ subsystem: "provider", event: "response.style_detected", functionName: "processCommitMessage", data: { ember: Boolean(isEmberStyle), emoji: isEmojiStyle, conventional: Boolean(isConventionalStyle), linux: Boolean(isLinuxStyle), jquery: Boolean(isJqueryStyle), basic: isBasicStyle, configuredStyle: config.style ?? "basic" } });

    // Don't modify the summary if it already matches the expected format for the current style
    if (isEmberStyle || isEmojiStyle || isConventionalStyle || isLinuxStyle || isJqueryStyle) {
    } else if (isBasicStyle) {
        // Only add default type for basic style when no recognizable format is present
        if (
            !summary.startsWith('- ') &&
            !summary.match(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|add|update|remove|create|delete|implement|improve)(\(.+\))?: /i)
        ) {
            summary = `refactor: ${summary}`;
        }
    }


    // Get description lines (everything after the first line)
    const descriptionLines = lines.slice(1);

    // Filter and process bullet points
    const nonEmptyDescriptionLines = descriptionLines.filter(line => line.trim() !== '');

    const bulletPoints: string[] = [];
    for (const line of nonEmptyDescriptionLines) {
        if (line.startsWith('- ')) {
            bulletPoints.push(line);
        } else if (line.trim() && !line.includes('DIFF TO ANALYZE:') && !line.includes('Here is the diff')) {
            // Convert non-bullet points to bullet points if they're actual content
            const bulletLine = `- ${line}`;
            bulletPoints.push(bulletLine);
        }
    }

    const clampedBulletPoints = clampBulletPoints(bulletPoints, config.maxBodyLines);


    const description = clampedBulletPoints.join('\n');

    const result: CommitMessage = {
        summary: summary.trim(),
        description: description.trim()
    };

    diagnosticLog({ subsystem: "provider", event: "response.processing_completed", functionName: "processCommitMessage", outcome: "success", data: { summaryLength: result.summary.length, bodyLineCount: clampedBulletPoints.length } });
    return result;
}

export function applyIssueTracking(message: CommitMessage, branchName: string | undefined): CommitMessage {
    if (!branchName) {
        return message;
    }

    const config = vscode.workspace.getConfiguration("gitmind");
    const enabled = config.get<boolean>("commit.issueTracking.enabled", false);
    if (!enabled) {
        return message;
    }

    const regexStr = config.get<string>("commit.issueTracking.regex", "([A-Z]+-\\\\d+|#\\\\d+)");
    const placement = config.get<string>("commit.issueTracking.placement", "prepend");

    try {
        const regex = new RegExp(regexStr);
        const match = branchName.match(regex);
        
        // We match the first capturing group if it exists, otherwise the whole match
        if (match && match.length > 0) {
            const issueId = match[1] || match[0];
            let newSummary = message.summary;
            let newDescription = message.description || "";

            if (placement === "prepend") {
                newSummary = `[${issueId}] ${newSummary}`;
            } else if (placement === "append") {
                newSummary = `${newSummary} [${issueId}]`;
            } else if (placement === "body") {
                if (newDescription) {
                    newDescription += `\n\nResolves: ${issueId}`;
                } else {
                    newDescription = `Resolves: ${issueId}`;
                }
            }

            return {
                summary: newSummary,
                description: newDescription
            };
        }
    } catch (e) {
        diagnosticLog({ subsystem: "configuration", event: "configuration.issue_tracking_pattern_invalid", functionName: "applyIssueTracking", outcome: "failure", data: { errorName: e instanceof Error ? e.name : "UnknownError" } });
    }

    return message;
}
