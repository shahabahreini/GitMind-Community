// src/services/api/utils.ts

/**
 * Remove code block markers from text
 * @param text The text to process
 * @returns Text with code block markers removed
 */
export function removeCodeBlocks(text: string): string {
    return text.replace(/```[a-z]*\n|```/g, "");
}

/**
 * Clean markdown formatting from text
 * @param text The text to process
 * @returns Text with markdown formatting removed
 */
export function cleanMarkdown(text: string): string {
    return text
        .replace(/\*\*/g, "")  // Remove bold markers
        .replace(/`/g, "");    // Remove code markers
}
