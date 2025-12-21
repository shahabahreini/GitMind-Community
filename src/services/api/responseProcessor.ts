// src/services/api/responseProcessor.ts
import { debugLog } from '../debug/logger';
import { CommitMessage } from '../../config/types';
import { PromptConfig } from './prompts';
import { removeCodeBlocks, cleanMarkdown } from './utils';

export function processCommitMessage(response: string, config: PromptConfig = {}): CommitMessage {
    debugLog("Processing Response (original)");
    debugLog(response);

    // Analyze the response for debugging
    const responseAnalysis = {
        responseLength: response.length,
        containsCodeBlocks: response.includes('```'),
        firstLine: response.split('\n')[0],
        bulletPointCount: (response.match(/^- /gm) || []).length,
        nonEmptyLineCount: response.split('\n').filter(line => line.trim()).length,
        emptyLinesAfterFirst: response.split('\n').slice(1).findIndex(line => line.trim() !== '') + 1
    };

    debugLog("=== RESPONSE FORMAT ANALYSIS ===");
    debugLog("Response analysis", responseAnalysis);

    const bulletPointSamples = (response.match(/^- .+$/gm) || []).slice(0, 3);
    debugLog("Bullet point samples", bulletPointSamples);
    debugLog("=== END ANALYSIS ===");

    // Remove code blocks and clean markdown
    let processed = response.trim();
    debugLog("After original", JSON.stringify(processed));

    processed = removeCodeBlocks(processed);
    debugLog("After code_blocks_removed", JSON.stringify(processed));

    processed = cleanMarkdown(processed);
    debugLog("After markdown_cleaned", JSON.stringify(processed));

    // Split into lines and filter out empty ones
    const lines = processed.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    debugLog("Split lines", lines);

    if (lines.length === 0) {
        throw new Error("Empty response received from AI");
    }

    // Get the first line as summary
    let summary = lines[0];
    debugLog("Initial summary", summary);

    // Check if this is a style that should not be modified
    const isEmberStyle = config.style === 'ember' && summary.match(/^\[.+\]/);
    const isEmojiStyle = (config.style === 'emojigit' || config.style === 'gitmoji') && /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(summary);
    const isConventionalStyle = summary.match(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?: /);
    const isLinuxStyle = config.style === 'linux' && summary.match(/^[a-z]+: /);
    const isJqueryStyle = config.style === 'jquery' && summary.match(/^[A-Z][a-z]+: .+\. (Fixes|Closes|Refs) #\d+/);
    const isBasicStyle = config.style === 'basic' || !config.style;

    debugLog(`Style detection: ember=${isEmberStyle}, emoji=${isEmojiStyle}, conventional=${isConventionalStyle}, linux=${isLinuxStyle}, jquery=${isJqueryStyle}, basic=${isBasicStyle}, configStyle=${config.style}`);

    // Don't modify the summary if it already matches the expected format for the current style
    if (isEmberStyle || isEmojiStyle || isConventionalStyle || isLinuxStyle || isJqueryStyle) {
        debugLog("Summary already has correct format for style, not modifying");
    } else if (isBasicStyle) {
        // Only add default type for basic style when no recognizable format is present
        if (
            !summary.startsWith('- ') &&
            !summary.match(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|add|update|remove|create|delete|implement|improve)(\(.+\))?: /i)
        ) {
            summary = `refactor: ${summary}`;
            debugLog("Added default type", summary);
        }
    }

    debugLog("Final summary after processing", summary);

    // Get description lines (everything after the first line)
    const descriptionLines = lines.slice(1);
    debugLog("Description lines before processing", descriptionLines);

    // Filter and process bullet points
    const nonEmptyDescriptionLines = descriptionLines.filter(line => line.trim() !== '');
    debugLog("Non-empty description lines", nonEmptyDescriptionLines);

    const bulletPoints: string[] = [];
    for (const line of nonEmptyDescriptionLines) {
        if (line.startsWith('- ')) {
            debugLog("Found bullet point", line);
            bulletPoints.push(line);
        } else if (line.trim() && !line.includes('DIFF TO ANALYZE:') && !line.includes('Here is the diff')) {
            // Convert non-bullet points to bullet points if they're actual content
            const bulletLine = `- ${line}`;
            debugLog("Converted to bullet point", bulletLine);
            bulletPoints.push(bulletLine);
        }
    }

    debugLog("Processed bullet points", bulletPoints);

    const description = bulletPoints.join('\n');

    const result: CommitMessage = {
        summary: summary.trim(),
        description: description.trim()
    };

    debugLog("Final commit message", result);
    return result;
}