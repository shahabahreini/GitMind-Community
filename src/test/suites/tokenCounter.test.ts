import * as assert from 'assert';
import { estimateTokens } from '../../utils/tokenCounter';

suite('Token Counter Tests', () => {

    test('estimateTokens should return 0 for empty string', () => {
        const result = estimateTokens('');
        assert.strictEqual(result, 0, 'Should return 0 for empty string');
    });

    test('estimateTokens should return 0 for null/undefined input', () => {
        const result1 = estimateTokens(null as any);
        const result2 = estimateTokens(undefined as any);

        assert.strictEqual(result1, 0, 'Should return 0 for null');
        assert.strictEqual(result2, 0, 'Should return 0 for undefined');
    });

    test('estimateTokens should handle single word', () => {
        const result = estimateTokens('hello');
        assert.ok(result > 0, 'Should return positive number for single word');
        assert.ok(result <= 2, 'Short word should be ~1 token');
    });

    test('estimateTokens should handle multiple words', () => {
        const result = estimateTokens('hello world');
        assert.ok(result >= 2, 'Two words should be at least 2 tokens');
        assert.ok(result <= 4, 'Two short words should be ~2-3 tokens');
    });

    test('estimateTokens should handle short words efficiently', () => {
        // Words <= 4 chars should be ~1 token each
        const shortWords = 'a an the is it';
        const result = estimateTokens(shortWords);

        // 5 short words should be ~5-7 tokens (including some punctuation buffer)
        assert.ok(result >= 5 && result <= 8,
            `Short words should be ~5-8 tokens, got ${result}`);
    });

    test('estimateTokens should handle medium words', () => {
        // Words 5-8 chars should be ~1.3 tokens each
        const mediumWords = 'testing process function method';
        const result = estimateTokens(mediumWords);

        // 4 medium words should be ~5-7 tokens
        assert.ok(result >= 5 && result <= 8,
            `Medium words should be ~5-8 tokens, got ${result}`);
    });

    test('estimateTokens should handle long words', () => {
        // Words 9-12 chars should be ~1.8 tokens each
        const longWords = 'programming development implementation';
        const result = estimateTokens(longWords);

        // 3 long words should be ~5-8 tokens
        assert.ok(result >= 5 && result <= 10,
            `Long words should be ~5-10 tokens, got ${result}`);
    });

    test('estimateTokens should handle very long words', () => {
        // Words > 12 chars should be split (length / 6)
        const veryLongWord = 'internationalization';  // 20 chars
        const result = estimateTokens(veryLongWord);

        // Should be ~3-4 tokens for 20 char word
        assert.ok(result >= 3 && result <= 5,
            `Very long word should be ~3-5 tokens, got ${result}`);
    });

    test('estimateTokens should count punctuation', () => {
        const textWithPunctuation = 'Hello, world! How are you?';
        const textWithoutPunctuation = 'Hello world How are you';

        const withPunc = estimateTokens(textWithPunctuation);
        const withoutPunc = estimateTokens(textWithoutPunctuation);

        assert.ok(withPunc > withoutPunc,
            'Text with punctuation should have more tokens');
    });

    test('estimateTokens should handle code snippets', () => {
        const codeSnippet = 'function test() { return true; }';
        const result = estimateTokens(codeSnippet);

        // Code has special chars like (), {}, ;
        assert.ok(result >= 8 && result <= 15,
            `Code snippet should be ~8-15 tokens, got ${result}`);
    });

    test('estimateTokens should handle git diff format', () => {
        const gitDiff = `diff --git a/test.js b/test.js
index 123..456 789
--- a/test.js
+++ b/test.js
@@ -1,3 +1,4 @@
 function test() {
+    console.log('test');
     return true;
 }`;

        const result = estimateTokens(gitDiff);

        // Diff format has lots of special chars and structure
        assert.ok(result > 20, 'Git diff should have substantial token count');
    });

    test('estimateTokens should handle unicode characters', () => {
        const unicode = '你好世界';  // Chinese characters
        const result = estimateTokens(unicode);

        assert.ok(result > 0, 'Should handle unicode characters');
        // Chinese characters typically need more tokens
        assert.ok(result >= 4, 'Unicode should be tokenized appropriately');
    });

    test('estimateTokens should handle emojis', () => {
        const emojis = '🚀 ✨ 🎉 🔥';
        const result = estimateTokens(emojis);

        assert.ok(result > 0, 'Should handle emojis');
        // Each emoji is typically 1-2 tokens
        assert.ok(result >= 4 && result <= 10,
            `Emojis should be ~4-10 tokens, got ${result}`);
    });

    test('estimateTokens should handle mixed content', () => {
        const mixed = 'Add feature 🚀 with code: `function() { return true; }` and text 你好';
        const result = estimateTokens(mixed);

        assert.ok(result > 10, 'Mixed content should have substantial token count');
    });

    test('estimateTokens should handle newlines and whitespace', () => {
        const multiline = `Line one
Line two
Line three`;

        const result = estimateTokens(multiline);

        // 6 words should be ~6-10 tokens
        assert.ok(result >= 6 && result <= 12,
            `Multiline text should be ~6-12 tokens, got ${result}`);
    });

    test('estimateTokens should handle tabs and multiple spaces', () => {
        const spacedText = 'Word1    Word2\t\tWord3';
        const result = estimateTokens(spacedText);

        // Should normalize whitespace and count 3 words
        assert.ok(result >= 3 && result <= 6,
            `Spaced text should be ~3-6 tokens, got ${result}`);
    });

    test('estimateTokens should handle special characters in code', () => {
        const specialChars = '&& || == != >= <= => += ->';
        const result = estimateTokens(specialChars);

        // Special operators should be tokenized
        assert.ok(result >= 5, 'Special characters should be counted');
    });

    test('estimateTokens should handle JSON format', () => {
        const json = '{"name": "test", "value": 123, "nested": {"key": "value"}}';
        const result = estimateTokens(json);

        // JSON has structure chars: {}, :, ",
        assert.ok(result >= 15 && result <= 30,
            `JSON should be ~15-30 tokens, got ${result}`);
    });

    test('estimateTokens should handle markdown format', () => {
        const markdown = `# Heading
**Bold** and *italic* text with \`code\`
- List item 1
- List item 2`;

        const result = estimateTokens(markdown);

        assert.ok(result >= 15, 'Markdown should have substantial token count');
    });

    test('estimateTokens should be consistent for same input', () => {
        const text = 'This is a test message for consistency checking';

        const result1 = estimateTokens(text);
        const result2 = estimateTokens(text);
        const result3 = estimateTokens(text);

        assert.strictEqual(result1, result2, 'Should return same result for same input');
        assert.strictEqual(result2, result3, 'Should be consistent across multiple calls');
    });

    test('estimateTokens should scale with text length', () => {
        const short = 'Short text';
        const medium = 'This is a medium length text with several words';
        const long = 'This is a much longer text that contains many more words and should therefore result in a significantly higher token count when processed';

        const shortTokens = estimateTokens(short);
        const mediumTokens = estimateTokens(medium);
        const longTokens = estimateTokens(long);

        assert.ok(shortTokens < mediumTokens, 'Short should have fewer tokens than medium');
        assert.ok(mediumTokens < longTokens, 'Medium should have fewer tokens than long');
    });

    test('estimateTokens should handle only whitespace', () => {
        const whitespace = '     \n\n\t\t  ';
        const result = estimateTokens(whitespace);

        // Should handle gracefully, likely returning minimal tokens
        assert.ok(result >= 0, 'Should handle whitespace-only input');
    });

    test('estimateTokens should handle only punctuation', () => {
        const punctuation = '.,!?;:()[]{}';
        const result = estimateTokens(punctuation);

        assert.ok(result >= 8, 'Punctuation should be counted as tokens');
    });

    test('estimateTokens should handle numbers', () => {
        const numbers = '123 456 789 10.5 3.14159';
        const result = estimateTokens(numbers);

        // Numbers are typically 1-2 tokens each
        assert.ok(result >= 5 && result <= 15,
            `Numbers should be ~5-15 tokens, got ${result}`);
    });

    test('estimateTokens should handle URLs', () => {
        const url = 'https://example.com/path/to/resource?param=value#anchor';
        const result = estimateTokens(url);

        // URLs have many special chars and segments
        assert.ok(result >= 10, 'URL should have substantial token count');
    });

    test('estimateTokens should handle file paths', () => {
        const path = '/Users/name/Documents/project/src/services/api/index.ts';
        const result = estimateTokens(path);

        // Paths have slashes and segments
        assert.ok(result >= 10, 'File path should have substantial token count');
    });

    test('estimateTokens performance: should handle 1000 words quickly', () => {
        const largeText = Array(1000).fill('word').join(' ');

        const startTime = Date.now();
        const result = estimateTokens(largeText);
        const duration = Date.now() - startTime;

        assert.ok(result > 900, 'Should estimate ~1000+ tokens for 1000 words');
        assert.ok(duration < 100, 'Should process 1000 words in under 100ms');
        console.log(`Estimated ${result} tokens for 1000 words in ${duration}ms`);
    });

    test('estimateTokens performance: should handle 10,000 characters quickly', () => {
        const largeText = 'A'.repeat(10000);

        const startTime = Date.now();
        const result = estimateTokens(largeText);
        const duration = Date.now() - startTime;

        assert.ok(result > 0, 'Should estimate tokens for large text');
        assert.ok(duration < 50, 'Should process 10k chars in under 50ms');
        console.log(`Estimated ${result} tokens for 10k chars in ${duration}ms`);
    });

    test('Accuracy: typical commit message', () => {
        const commitMessage = 'feat: add user authentication system\n\nImplemented JWT-based authentication with refresh tokens';
        const result = estimateTokens(commitMessage);

        // Typical commit message should be ~20-30 tokens
        assert.ok(result >= 15 && result <= 35,
            `Commit message should be ~15-35 tokens, got ${result}`);
    });

    test('Accuracy: typical git diff', () => {
        const diff = `diff --git a/src/auth.js b/src/auth.js
index abc123..def456 789
--- a/src/auth.js
+++ b/src/auth.js
@@ -10,6 +10,7 @@
 function authenticate(user, password) {
+    const token = generateToken(user);
     return validateCredentials(user, password);
 }`;

        const result = estimateTokens(diff);

        // Git diff should be ~40-80 tokens
        assert.ok(result >= 30 && result <= 100,
            `Git diff should be ~30-100 tokens, got ${result}`);
    });

    test('Accuracy: changelog entry', () => {
        const changelog = `## 1.2.3 - 2025-01-15

### Added
- User authentication system with JWT tokens
- Password reset functionality via email
- Multi-factor authentication support

### Fixed
- Security vulnerability in token validation
- Memory leak in session management`;

        const result = estimateTokens(changelog);

        // Changelog should be ~50-100 tokens
        assert.ok(result >= 40 && result <= 120,
            `Changelog should be ~40-120 tokens, got ${result}`);
    });

    test('Edge case: single character', () => {
        const result = estimateTokens('A');
        assert.strictEqual(result, 1, 'Single character should be 1 token');
    });

    test('Edge case: repeated character', () => {
        const repeated = 'AAAAAAAAAA';
        const result = estimateTokens(repeated);

        // Long repeated string should be tokenized
        assert.ok(result >= 1 && result <= 5,
            `Repeated characters should be ~1-5 tokens, got ${result}`);
    });

    test('Edge case: alternating characters', () => {
        const alternating = 'ababababab';
        const result = estimateTokens(alternating);

        assert.ok(result >= 1 && result <= 5,
            `Alternating pattern should be ~1-5 tokens, got ${result}`);
    });

    test('Edge case: all special characters', () => {
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
        const result = estimateTokens(special);

        // Each special char should roughly count
        assert.ok(result >= 20, 'Special characters should be counted');
    });

    test('Real world: actual ChangelogService summary', () => {
        // Simulate a real changelog summary from multiple commits
        const realSummary = `
## Version: 4.3.0 (2025-01-15)
Total commits: 25

### Commit: abc123d
Date: 2025-01-15
Author: Developer Name
Message: feat(changelog): implement ai-powered changelog generation
Details:
Added changelog service with version detection from git tags, commit messages, and package.json.
Includes policy-aware formatting to match existing changelog structure.

---

### Commit: def456e
Date: 2025-01-14
Author: Developer Name
Message: feat(large-diff): implement adaptive chunking for large diffs
Details:
Enhanced DiffProcessor with hunk-aware splitting and token budget management.

---
`;

        const result = estimateTokens(realSummary);

        // Real summary should be ~150-250 tokens
        assert.ok(result >= 100 && result <= 300,
            `Real changelog summary should be ~100-300 tokens, got ${result}`);
        console.log(`Real changelog summary: ${result} tokens`);
    });

    test('Comparison: word-based vs char-based estimation', () => {
        // Regular English text should use word-based
        const englishText = 'This is a normal English sentence with regular words';
        const englishTokens = estimateTokens(englishText);

        // High special char density should use char-based
        const codeText = '(){[]}&&||==!=>=<=>+=->$$##@@!!**//\\\\';
        const codeTokens = estimateTokens(codeText);

        assert.ok(englishTokens > 0, 'English text should be tokenized');
        assert.ok(codeTokens > 0, 'Code should be tokenized');

        console.log(`English: ${englishTokens} tokens, Code: ${codeTokens} tokens`);
    });
});
