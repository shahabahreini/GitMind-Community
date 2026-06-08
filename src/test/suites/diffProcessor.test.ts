import * as assert from 'assert';
import { DiffProcessor } from '../../services/diffProcessor';

suite('DiffProcessor Tests', () => {
    let processor: DiffProcessor;

    setup(() => {
        processor = DiffProcessor.getInstance();
    });

    test('DiffProcessor should create singleton instance', () => {
        const instance1 = DiffProcessor.getInstance();
        const instance2 = DiffProcessor.getInstance();

        assert.strictEqual(instance1, instance2, 'Should return same singleton instance');
        assert.ok(instance1 instanceof DiffProcessor, 'Should be DiffProcessor instance');
    });

    test('isLargeDiff should correctly identify small diffs', () => {
        const smallDiff = 'line1\nline2\nline3';
        const result = processor.isLargeDiff(smallDiff, { threshold: 100 });

        assert.strictEqual(result, false, 'Should identify small diff correctly');
    });

    test('isLargeDiff should correctly identify large diffs', () => {
        const largeDiff = Array(200).fill('line').join('\n');
        const result = processor.isLargeDiff(largeDiff, { threshold: 100 });

        assert.strictEqual(result, true, 'Should identify large diff correctly');
    });

    test('isLargeDiff should handle exact threshold', () => {
        const exactDiff = Array(100).fill('line').join('\n');
        const result = processor.isLargeDiff(exactDiff, { threshold: 100 });

        // 100 lines joined with \n creates 100 lines (not 101)
        assert.strictEqual(result, false, 'Should not exceed threshold at exact count');
    });

    test('isLargeDiff should handle empty diff', () => {
        const emptyDiff = '';
        const result = processor.isLargeDiff(emptyDiff, { threshold: 10 });

        assert.strictEqual(result, false, 'Empty diff should not be large');
    });

    test('splitDiffIntoChunks should split single-file diff correctly', () => {
        const singleFileDiff = `diff --git a/test.js b/test.js
index 123..456 789
--- a/test.js
+++ b/test.js
@@ -1,3 +1,4 @@
 function test() {
+    console.log('test');
     return true;
 }`;

        const chunks = processor.splitDiffIntoChunks(singleFileDiff, 50);

        assert.ok(Array.isArray(chunks), 'Should return array of chunks');
        assert.ok(chunks.length > 0, 'Should have at least one chunk');
        assert.ok(chunks[0].includes('diff --git'), 'Chunk should include diff header');
    });

    test('splitDiffIntoChunks should split multi-file diff correctly', () => {
        const multiFileDiff = `diff --git a/file1.js b/file1.js
index 111..222 333
--- a/file1.js
+++ b/file1.js
@@ -1,2 +1,3 @@
 function one() {
+    console.log('one');
 }
diff --git a/file2.js b/file2.js
index 444..555 666
--- a/file2.js
+++ b/file2.js
@@ -1,2 +1,3 @@
 function two() {
+    console.log('two');
 }`;

        const chunks = processor.splitDiffIntoChunks(multiFileDiff, 50);

        assert.ok(chunks.length >= 2, 'Should create separate chunks for multiple files');
        const hasFile1 = chunks.some(c => c.includes('file1.js'));
        const hasFile2 = chunks.some(c => c.includes('file2.js'));
        assert.ok(hasFile1, 'Should include file1.js in chunks');
        assert.ok(hasFile2, 'Should include file2.js in chunks');
    });

    test('splitDiffIntoChunks should preserve diff headers in each chunk', () => {
        const diff = `diff --git a/test.js b/test.js
index 123..456 789
--- a/test.js
+++ b/test.js
@@ -1,10 +1,11 @@
${Array(20).fill(' line').join('\n')}`;

        const chunks = processor.splitDiffIntoChunks(diff, 10);

        // Each chunk should have the minimal header
        chunks.forEach(chunk => {
            assert.ok(chunk.includes('diff --git a/test.js b/test.js'),
                'Each chunk should include diff header');
        });
    });

    test('splitDiffIntoChunks should handle multiple hunks correctly', () => {
        const multiHunkDiff = `diff --git a/test.js b/test.js
index 123..456 789
--- a/test.js
+++ b/test.js
@@ -1,3 +1,4 @@
 function one() {
+    console.log('one');
 }
@@ -10,3 +11,4 @@
 function two() {
+    console.log('two');
 }`;

        const chunks = processor.splitDiffIntoChunks(multiHunkDiff, 50);

        assert.ok(chunks.length > 0, 'Should create chunks from multi-hunk diff');
        // Verify hunks are present
        const combinedChunks = chunks.join('\n');
        assert.ok(combinedChunks.includes('function one'), 'Should include first hunk');
        assert.ok(combinedChunks.includes('function two'), 'Should include second hunk');
    });

    test('splitDiffIntoChunks should handle very large single hunk', () => {
        const largeLines = Array(200).fill('+    new line').join('\n');
        const largeDiff = `diff --git a/large.js b/large.js
index 111..222 333
--- a/large.js
+++ b/large.js
@@ -1,200 +1,200 @@
${largeLines}`;

        const chunks = processor.splitDiffIntoChunks(largeDiff, 50);

        assert.ok(chunks.length > 1, 'Should split very large hunk into multiple chunks');

        // Verify all chunks have headers
        chunks.forEach(chunk => {
            assert.ok(chunk.includes('diff --git a/large.js b/large.js'),
                'Large hunk chunks should have headers');
        });
    });

    test('splitDiffIntoChunks should handle binary file diffs', () => {
        const binaryDiff = `diff --git a/image.png b/image.png
index 111..222 333
Binary files a/image.png and b/image.png differ`;

        const chunks = processor.splitDiffIntoChunks(binaryDiff, 50);

        assert.ok(chunks.length > 0, 'Should handle binary file diff');
        assert.ok(chunks[0].includes('Binary files'), 'Should include binary file marker');
    });

    test('splitDiffIntoChunks should handle rename-only diffs', () => {
        const renameDiff = `diff --git a/old.js b/new.js
similarity index 100%
rename from old.js
rename to new.js`;

        const chunks = processor.splitDiffIntoChunks(renameDiff, 50);

        assert.ok(chunks.length > 0, 'Should handle rename-only diff');
        assert.ok(chunks[0].includes('rename from'), 'Should include rename info');
        assert.ok(chunks[0].includes('rename to'), 'Should include rename destination');
    });

    test('splitDiffIntoChunks should handle new file diffs', () => {
        const newFileDiff = `diff --git a/new.js b/new.js
new file mode 100644
index 000..111 222
--- /dev/null
+++ b/new.js
@@ -0,0 +1,3 @@
+function newFunc() {
+    return true;
+}`;

        const chunks = processor.splitDiffIntoChunks(newFileDiff, 50);

        assert.ok(chunks.length > 0, 'Should handle new file diff');
        assert.ok(chunks[0].includes('new file mode'), 'Should include new file marker');
    });

    test('splitDiffIntoChunks should handle deleted file diffs', () => {
        const deletedFileDiff = `diff --git a/deleted.js b/deleted.js
deleted file mode 100644
index 111..000 222
--- a/deleted.js
+++ /dev/null
@@ -1,3 +0,0 @@
-function oldFunc() {
-    return false;
-}`;

        const chunks = processor.splitDiffIntoChunks(deletedFileDiff, 50);

        assert.ok(chunks.length > 0, 'Should handle deleted file diff');
        assert.ok(chunks[0].includes('deleted file mode'), 'Should include deleted file marker');
    });

    test('splitDiffIntoChunks should handle empty diff', () => {
        const emptyDiff = '';
        const chunks = processor.splitDiffIntoChunks(emptyDiff, 50);

        assert.strictEqual(chunks.length, 0, 'Should return empty array for empty diff');
    });

    test('splitDiffIntoChunks should respect chunk size budget', () => {
        const diff = `diff --git a/test.js b/test.js
index 123..456 789
--- a/test.js
+++ b/test.js
@@ -1,50 +1,50 @@
${Array(50).fill('+    line').join('\n')}`;

        const chunkSize = 20;
        const chunks = processor.splitDiffIntoChunks(diff, chunkSize);

        // Each chunk should not exceed chunkSize by much (allowing for headers)
        chunks.forEach(chunk => {
            const lineCount = chunk.split('\n').length;
            assert.ok(lineCount <= chunkSize + 10,
                `Chunk should respect size budget (was ${lineCount}, max ~${chunkSize + 10})`);
        });
    });

    test('mergeChunkResults should handle single chunk', () => {
        const singleResult = ['feat: add new feature'];
        const merged = processor.mergeChunkResults(singleResult);

        assert.strictEqual(merged, 'feat: add new feature', 'Should return single result as-is');
    });

    test('mergeChunkResults should merge multiple chunks', () => {
        const multipleResults = [
            'feat: add authentication',
            'fix: resolve validation bug',
            'refactor: improve performance'
        ];

        const merged = processor.mergeChunkResults(multipleResults);

        assert.ok(typeof merged === 'string', 'Should return string result');
        assert.ok(merged.includes('Part 1'), 'Should reference first part');
        assert.ok(merged.includes('Part 2'), 'Should reference second part');
        assert.ok(merged.includes('Part 3'), 'Should reference third part');
        assert.ok(merged.includes('authentication'), 'Should include first result');
        assert.ok(merged.includes('validation bug'), 'Should include second result');
        assert.ok(merged.includes('performance'), 'Should include third result');
    });

    test('mergeChunkResults should create summary prompt', () => {
        const results = ['Change A', 'Change B'];
        const merged = processor.mergeChunkResults(results);

        assert.ok(merged.includes('The following is a summary of changes'), 'Should include analysis context');
        assert.ok(merged.includes('generate the final commit message.'), 'Should include format instructions');
    });

    test('Edge case: splitDiffIntoChunks with chunk size smaller than header', () => {
        const diff = `diff --git a/test.js b/test.js
index 123..456 789
--- a/test.js
+++ b/test.js
@@ -1,2 +1,3 @@
 line1
+line2`;

        // Very small chunk size
        const chunks = processor.splitDiffIntoChunks(diff, 2);

        // Should still create chunks even if chunk size is smaller than header
        assert.ok(chunks.length > 0, 'Should create chunks even with very small chunk size');
    });

    test('Edge case: diff with no hunks (header only)', () => {
        const headerOnlyDiff = `diff --git a/test.js b/test.js
index 123..456 789
--- a/test.js
+++ b/test.js`;

        const chunks = processor.splitDiffIntoChunks(headerOnlyDiff, 50);

        assert.ok(chunks.length > 0, 'Should handle diff with header only');
    });

    test('Edge case: diff with malformed hunk header', () => {
        const malformedDiff = `diff --git a/test.js b/test.js
index 123..456 789
--- a/test.js
+++ b/test.js
@@ invalid hunk header
 some line`;

        const chunks = processor.splitDiffIntoChunks(malformedDiff, 50);

        // Should handle gracefully without throwing
        assert.ok(Array.isArray(chunks), 'Should return array even with malformed hunk');
    });

    test('Edge case: diff with very long lines', () => {
        const longLine = 'A'.repeat(10000);
        const longLineDiff = `diff --git a/test.js b/test.js
index 123..456 789
--- a/test.js
+++ b/test.js
@@ -1,1 +1,1 @@
+${longLine}`;

        assert.doesNotThrow(() => {
            processor.splitDiffIntoChunks(longLineDiff, 50);
        }, 'Should handle very long lines without throwing');
    });

    test('Edge case: diff with unicode characters', () => {
        const unicodeDiff = `diff --git a/test.js b/test.js
index 123..456 789
--- a/test.js
+++ b/test.js
@@ -1,1 +1,1 @@
+const message = '你好世界 🌍 Привет мир';`;

        const chunks = processor.splitDiffIntoChunks(unicodeDiff, 50);

        assert.ok(chunks.length > 0, 'Should handle unicode characters');
        assert.ok(chunks[0].includes('你好世界'), 'Should preserve unicode');
        assert.ok(chunks[0].includes('🌍'), 'Should preserve emojis');
    });

    test('Performance: should handle 1000+ line diff efficiently', () => {
        const massiveDiff = `diff --git a/massive.js b/massive.js
index 111..222 333
--- a/massive.js
+++ b/massive.js
@@ -1,1000 +1,1000 @@
${Array(1000).fill('+    line').join('\n')}`;

        const startTime = Date.now();
        const chunks = processor.splitDiffIntoChunks(massiveDiff, 100);
        const duration = Date.now() - startTime;

        assert.ok(chunks.length > 0, 'Should process massive diff');
        assert.ok(duration < 1000, 'Should process in under 1 second');
        console.log(`Processed 1000+ lines in ${duration}ms`);
    });

    test('Performance: should handle 100 files efficiently', () => {
        const files = Array(100).fill(0).map((_, i) => `diff --git a/file${i}.js b/file${i}.js
index 111..222 333
--- a/file${i}.js
+++ b/file${i}.js
@@ -1,5 +1,6 @@
 function test${i}() {
+    console.log('test');
     return true;
 }`).join('\n');

        const startTime = Date.now();
        const chunks = processor.splitDiffIntoChunks(files, 100);
        const duration = Date.now() - startTime;

        assert.ok(chunks.length >= 100, 'Should process all files');
        assert.ok(duration < 2000, 'Should process in under 2 seconds');
        console.log(`Processed 100 files in ${duration}ms`);
    });

    test('Consistency: should produce deterministic results', () => {
        const diff = `diff --git a/test.js b/test.js
index 123..456 789
--- a/test.js
+++ b/test.js
@@ -1,10 +1,11 @@
${Array(10).fill('+    line').join('\n')}`;

        const chunks1 = processor.splitDiffIntoChunks(diff, 50);
        const chunks2 = processor.splitDiffIntoChunks(diff, 50);

        assert.deepStrictEqual(chunks1, chunks2, 'Should produce identical results on repeated calls');
    });

    test('Integration: full workflow with large diff', () => {
        const largeDiff = `diff --git a/file1.js b/file1.js
index 111..222 333
--- a/file1.js
+++ b/file1.js
@@ -1,100 +1,100 @@
${Array(100).fill('+    line in file 1').join('\n')}
diff --git a/file2.js b/file2.js
index 444..555 666
--- a/file2.js
+++ b/file2.js
@@ -1,100 +1,100 @@
${Array(100).fill('+    line in file 2').join('\n')}`;

        // 1. Detect it's large
        const isLarge = processor.isLargeDiff(largeDiff, { threshold: 50 });
        assert.strictEqual(isLarge, true, 'Should detect as large diff');

        // 2. Split into chunks
        const chunks = processor.splitDiffIntoChunks(largeDiff, 50);
        assert.ok(chunks.length > 2, 'Should create multiple chunks');

        // 3. Simulate processing each chunk
        const chunkResults = chunks.map((_chunk, i) => `Result ${i + 1}: Changes detected`);

        // 4. Merge results
        const finalResult = processor.mergeChunkResults(chunkResults);
        assert.ok(finalResult.includes('Result 1'), 'Should include all chunk results');
    });
});
