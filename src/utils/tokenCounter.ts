export function estimateTokens(text: string): number {
    if (!text || text.length === 0) {
        return 0;
    }

    const charCount = text.length;
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    // Count special characters that typically become separate tokens
    const punctuationCount = (text.match(/[.,!?;:()[\]{}"'\-_]/g) || []).length;
    const specialCharCount = (text.match(/[^\w\s.,!?;:()[\]{}"'\-_]/g) || []).length;

    // Base word estimation with length-based tokenization
    let wordBasedEstimate = 0;
    for (const word of words) {
        if (word.length <= 4) {
            wordBasedEstimate += 1;
        } else if (word.length <= 8) {
            wordBasedEstimate += 1.3;
        } else if (word.length <= 12) {
            wordBasedEstimate += 1.8;
        } else {
            wordBasedEstimate += Math.ceil(word.length / 6);
        }
    }

    // Character-based fallback for edge cases
    const charBasedEstimate = charCount / 3.7;

    // Add tokens for punctuation and special characters
    const extraTokens = punctuationCount * 0.7 + specialCharCount * 0.9;

    // Choose primary estimate based on content characteristics
    let estimate: number;
    if (wordCount === 0) {
        estimate = charBasedEstimate;
    } else if (specialCharCount > charCount * 0.15) {
        // High special character density (code, non-Latin text)
        estimate = charBasedEstimate + extraTokens;
    } else {
        // Regular text - use word-based with character fallback
        estimate = Math.max(wordBasedEstimate + extraTokens, charBasedEstimate);
    }

    return Math.ceil(Math.max(1, estimate));
}