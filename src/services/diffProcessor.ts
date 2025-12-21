import { debugLog } from './debug/logger';

/**
 * Service for handling large git diffs by processing them in smaller chunks
 */
export class DiffProcessor {
    private static instance: DiffProcessor;

    private constructor() { }

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
        debugLog(`Splitting diff into chunks of ${chunkSize} lines (hunk-aware)`);

        const fileDiffs = this.splitByDiffHeaders(diff);
        const chunks: string[] = [];

        for (const fileDiff of fileDiffs) {
            const lines = fileDiff.split('\n');
            if (lines.length === 0) {
                continue;
            }

            const headerEnd = this.getHeaderEndIndex(lines);
            const headerLines = lines.slice(0, headerEnd);
            const minimalHeader = this.buildMinimalHeader(headerLines);

            // Collect hunk segments (each starts with @@) or treat the remainder as a single segment
            const segments = this.splitIntoHunkSegments(lines, headerEnd);

            // Header-only diffs (binary, rename-only, etc.) should still yield a chunk.
            if (segments.length === 0) {
                chunks.push(minimalHeader);
                continue;
            }

            // Pack segments respecting chunkSize; ensure each emitted chunk includes minimal header
            const packed = this.packSegmentsIntoChunks(minimalHeader, segments, chunkSize);
            chunks.push(...packed);
        }

        debugLog(`Created ${chunks.length} diff chunks`);
        return chunks;
    }

    /**
     * Split diff by file headers to maintain context
     */
    private splitByDiffHeaders(diff: string): string[] {
        // Robustly split by lines that start with "diff --git "
        const matches = Array.from(diff.matchAll(/^diff --git .+$/gm));
        if (matches.length === 0) {
            return diff.trim().length > 0 ? [diff] : [];
        }

        const files: string[] = [];
        for (let i = 0; i < matches.length; i++) {
            const start = matches[i].index ?? 0;
            const end = i + 1 < matches.length ? (matches[i + 1].index ?? diff.length) : diff.length;
            files.push(diff.slice(start, end));
        }

        return files.filter(f => f.trim().length > 0);
    }

    /**
     * Determine the end index (exclusive) of header lines for a single file diff.
     * Tries to include standard header lines and stops before the first hunk ("@@").
     */
    private getHeaderEndIndex(lines: string[]): number {
        const firstHunkIdx = lines.findIndex(l => l.startsWith('@@'));
        if (firstHunkIdx !== -1) {
            return firstHunkIdx;
        }

        // No hunks found - include typical header lines if present
        let lastHeaderIdx = 0;
        for (let i = 0; i < Math.min(lines.length, 50); i++) {
            const l = lines[i];
            if (
                l.startsWith('diff --git ') ||
                l.startsWith('index ') ||
                l.startsWith('new file mode') ||
                l.startsWith('deleted file mode') ||
                l.startsWith('similarity index') ||
                l.startsWith('rename from') ||
                l.startsWith('rename to') ||
                l.startsWith('Binary files ') ||
                l.startsWith('--- ') ||
                l.startsWith('+++ ')
            ) {
                lastHeaderIdx = i;
                continue;
            }
            // Stop when we reach an unrelated line after some headers
            if (lastHeaderIdx > 0) {
                break;
            }
        }
        return Math.min(lastHeaderIdx + 1, lines.length);
    }

    /**
     * Build a minimal header string from collected header lines for reuse in sub-chunks.
     */
    private buildMinimalHeader(headerLines: string[]): string {
        // Ensure we include at least diff, index, and path lines when available.
        return headerLines.join('\n');
    }

    /**
     * Split lines into hunk segments starting at headerEnd.
     * If no hunks exist, return a single segment for the remaining lines.
     */
    private splitIntoHunkSegments(lines: string[], headerEnd: number): string[][] {
        const segments: string[][] = [];
        let i = headerEnd;

        // Find positions of all hunks
        const hunkIdxs: number[] = [];
        for (let idx = headerEnd; idx < lines.length; idx++) {
            if (lines[idx].startsWith('@@')) {
                hunkIdxs.push(idx);
            }
        }

        if (hunkIdxs.length === 0) {
            // No hunks - treat the remainder as one segment (could be binary/rename-only diff)
            if (headerEnd < lines.length) {
                segments.push(lines.slice(headerEnd));
            }
            return segments;
        }

        for (let h = 0; h < hunkIdxs.length; h++) {
            const start = hunkIdxs[h];
            const end = h + 1 < hunkIdxs.length ? hunkIdxs[h + 1] : lines.length;
            segments.push(lines.slice(start, end));
        }
        return segments;
    }

    /**
     * Pack hunk segments into chunks respecting a line budget.
     * Ensures each chunk contains the minimal header for context.
     */
    private packSegmentsIntoChunks(minimalHeader: string, segments: string[][], chunkSize: number): string[] {
        const chunks: string[] = [];
        const headerLinesCount = minimalHeader.split('\n').length;

        let current: string[] = [];
        let currentLines = 0;

        const pushCurrent = () => {
            if (current.length > 0) {
                chunks.push([minimalHeader, ...current].join('\n'));
                current = [];
                currentLines = 0;
            }
        };

        for (const seg of segments) {
            const segLen = seg.length;
            const withHeader = (currentLines === 0 ? headerLinesCount : 0) + currentLines + segLen;

            if (withHeader <= chunkSize) {
                // Safe to add segment
                current.push(...seg);
                currentLines += segLen;
                continue;
            }

            // If current is empty and a single segment is too large, split the segment itself
            if (currentLines === 0 && headerLinesCount + segLen > chunkSize) {
                const budget = Math.max(1, chunkSize - headerLinesCount);
                for (let i = 0; i < seg.length; i += budget) {
                    const piece = seg.slice(i, i + budget);
                    chunks.push([minimalHeader, ...piece].join('\n'));
                }
                continue;
            }

            // Otherwise, flush current and start a new chunk with this segment
            pushCurrent();
            // If still too big, handle like above
            if (headerLinesCount + segLen > chunkSize) {
                const budget = Math.max(1, chunkSize - headerLinesCount);
                for (let i = 0; i < seg.length; i += budget) {
                    const piece = seg.slice(i, i + budget);
                    chunks.push([minimalHeader, ...piece].join('\n'));
                }
            } else {
                current.push(...seg);
                currentLines += segLen;
            }
        }

        // Flush remainder
        pushCurrent();
        return chunks;
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

${chunkResults.map((result, i) => `Part ${i + 1}: ${result}`).join('\n\n')}

Based on these parts, provide a concise and well-structured git commit message that summarizes all the changes. Follow conventional commit format with a clear subject line (under 72 chars) and bullet points for major changes.`;

        return summaryPrompt;
    }
}
