export function estimateTokens(text: string): number {
    // Split into words (considering sequences of non-whitespace as words)
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const charCount = text.length;

    // Calculate two estimates: character-based and word-based
    const charsEstimate = charCount / 4;  // Original character-based estimate
    const wordsEstimate = wordCount * 1.3;  // Average 1.3 tokens per word

    // Return weighted average of both estimates
    return Math.ceil((charsEstimate + wordsEstimate) / 2);
}