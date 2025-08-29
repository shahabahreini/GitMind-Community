import { debugLog } from './debug/logger';

/**
 * Service for handling large git diffs by processing them in smaller chunks
 */
export class DiffProcessor {
    private static instance: DiffProcessor;
    
    private constructor() {}
    
    /**
     * Get the singleton instance
     */
    public static getInstance(): DiffProcessor {
        if (!DiffProcessor.instance) {
            DiffProcessor.instance = new DiffProcessor();
        }
        return DiffProcessor.instance;
    }
    
    /**
     * Checks if a diff is large enough to require chunking
     * @param diff The git diff
     * @param settings Chunking settings
     */
    public isLargeDiff(diff: string, settings: { threshold: number }): boolean {
        const lineCount = diff.split('\n').length;
        debugLog(`Diff line count: ${lineCount}, threshold: ${settings.threshold}`);
        return lineCount > settings.threshold;
    }
    
    /**
     * Split a large diff into manageable chunks
     * @param diff The git diff
     * @param chunkSize Maximum size of each chunk in lines
     */
    public splitDiffIntoChunks(diff: string, chunkSize: number): string[] {
        debugLog(`Splitting diff into chunks of ${chunkSize} lines`);
        
        // Split by diff headers to maintain file context
        const diffFiles = this.splitByDiffHeaders(diff);
        const chunks: string[] = [];
        let currentChunk: string[] = [];
        let currentChunkLines = 0;
        
        // Process each file diff
        for (const fileDiff of diffFiles) {
            const fileLines = fileDiff.split('\n');
            
            // If a single file is larger than chunk size, split it
            if (fileLines.length > chunkSize) {
                // If we have content in the current chunk, finalize it
                if (currentChunkLines > 0) {
                    chunks.push(currentChunk.join('\n'));
                    currentChunk = [];
                    currentChunkLines = 0;
                }
                
                // Split the large file into chunks
                for (let i = 0; i < fileLines.length; i += chunkSize) {
                    const fileChunk = fileLines.slice(i, i + chunkSize);
                    chunks.push(fileChunk.join('\n'));
                }
            } 
            // If adding this file would exceed chunk size, start a new chunk
            else if (currentChunkLines + fileLines.length > chunkSize) {
                chunks.push(currentChunk.join('\n'));
                currentChunk = [fileDiff];
                currentChunkLines = fileLines.length;
            } 
            // Otherwise add to current chunk
            else {
                currentChunk.push(fileDiff);
                currentChunkLines += fileLines.length;
            }
        }
        
        // Add the final chunk if it has content
        if (currentChunkLines > 0) {
            chunks.push(currentChunk.join('\n'));
        }
        
        debugLog(`Created ${chunks.length} diff chunks`);
        return chunks;
    }
    
    /**
     * Split diff by file headers to maintain context
     */
    private splitByDiffHeaders(diff: string): string[] {
        const headerRegex = /^diff --git /m;
        const files: string[] = [];
        let lastIndex = 0;
        
        // Find all diff headers
        let match;
        const regex = new RegExp(headerRegex);
        let remaining = diff;
        
        while ((match = regex.exec(remaining)) !== null) {
            if (match.index > 0) {
                // Add the previous file diff
                files.push(remaining.substring(0, match.index));
            }
            
            // Update remaining text and lastIndex
            remaining = remaining.substring(match.index);
            
            // Find next match
            const nextMatch = regex.exec(remaining.substring(5)); // Skip current match
            
            if (nextMatch) {
                // Add the current file diff up to the next match
                const endIndex = 5 + nextMatch.index;
                files.push(remaining.substring(0, endIndex));
                remaining = remaining.substring(endIndex);
            } else {
                // Last file
                files.push(remaining);
                break;
            }
            
            // Reset regex
            regex.lastIndex = 0;
        }
        
        // If no matches were found, return the entire diff as one file
        if (files.length === 0 && diff.trim().length > 0) {
            files.push(diff);
        }
        
        return files.filter(file => file.trim().length > 0);
    }
    
    /**
     * Merge chunk results into a consolidated summary
     * @param chunkResults Results from individual chunks
     */
    public mergeChunkResults(chunkResults: string[]): string {
        debugLog(`Merging ${chunkResults.length} chunk results`);
        
        // If only one chunk, return it directly
        if (chunkResults.length === 1) {
            return chunkResults[0];
        }
        
        // Create a summary prompt from all chunks
        const summaryPrompt = `I have analyzed ${chunkResults.length} parts of a large code change. Here are the key changes from each part:

${chunkResults.map((result, i) => `Part ${i+1}: ${result}`).join('\n\n')}

Based on these parts, provide a concise and well-structured git commit message that summarizes all the changes. Follow conventional commit format with a clear subject line (under 72 chars) and bullet points for major changes.`;
        
        return summaryPrompt;
    }
}
