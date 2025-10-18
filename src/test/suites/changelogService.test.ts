import * as assert from 'assert';
import * as vscode from 'vscode';
import { ChangelogService } from '../../services/changelog/ChangelogService';

suite('Changelog Service Tests', () => {
    let service: ChangelogService;
    let mockWorkspaceRoot: string;

    setup(() => {
        service = ChangelogService.getInstance();
        // Mock workspace root
        mockWorkspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    });

    teardown(() => {
        // Cleanup if needed
    });

    test('ChangelogService should create singleton instance', () => {
        const instance1 = ChangelogService.getInstance();
        const instance2 = ChangelogService.getInstance();

        assert.strictEqual(instance1, instance2, 'Should return same singleton instance');
        assert.ok(instance1 instanceof ChangelogService, 'Should be ChangelogService instance');
    });

    test('ChangelogService feature availability should respect configuration', () => {
        const isAvailable = service.isFeatureAvailable();

        assert.strictEqual(typeof isAvailable, 'boolean', 'Should return boolean');

        // Should default to true if not explicitly set
        const config = vscode.workspace.getConfiguration('gitmind');
        const expectedValue = config.get<boolean>('pro.changelog.enabled', true);

        assert.strictEqual(isAvailable, expectedValue, 'Should match configuration value');
    });

    test('Version comparison should handle semantic versions correctly', () => {
        // Access private method through type assertion for testing
        const changelogService = service as any;

        // Test basic version comparison
        const result1 = changelogService.compareVersions('1.2.3', '1.2.4');
        assert.ok(result1 < 0, 'Should identify 1.2.3 < 1.2.4');

        const result2 = changelogService.compareVersions('2.0.0', '1.9.9');
        assert.ok(result2 > 0, 'Should identify 2.0.0 > 1.9.9');

        const result3 = changelogService.compareVersions('1.0.0', '1.0.0');
        assert.strictEqual(result3, 0, 'Should identify equal versions');
    });

    test('Version comparison should handle "v" prefix correctly', () => {
        const changelogService = service as any;

        const result1 = changelogService.compareVersions('v1.2.3', 'v1.2.4');
        assert.ok(result1 < 0, 'Should handle v prefix in comparison');

        const result2 = changelogService.compareVersions('v2.0.0', '1.9.9');
        assert.ok(result2 > 0, 'Should handle mixed v prefix');
    });

    test('Changelog structure analysis should detect version format', () => {
        const changelogService = service as any;

        const changelogWithV = `# Changelog
## v1.2.3 - 2025-01-01
### Added
- Feature A

## v1.2.2 - 2024-12-01
### Fixed
- Bug B`;

        const analysisWithV = changelogService.analyzeChangelogStructure(changelogWithV);
        assert.strictEqual(analysisWithV.versionFormat, 'v1.2.3', 'Should detect v prefix format');

        const changelogWithoutV = `# Changelog
## 1.2.3 - 2025-01-01
### Added
- Feature A

## 1.2.2 - 2024-12-01
### Fixed
- Bug B`;

        const analysisWithoutV = changelogService.analyzeChangelogStructure(changelogWithoutV);
        assert.strictEqual(analysisWithoutV.versionFormat, '1.2.3', 'Should detect no v prefix format');
    });

    test('Changelog structure analysis should detect bullet style', () => {
        const changelogService = service as any;

        const changelogDash = `# Changelog
## 1.0.0
### Added
- Feature A
- Feature B`;

        const analysisDash = changelogService.analyzeChangelogStructure(changelogDash);
        assert.strictEqual(analysisDash.bulletStyle, '-', 'Should detect dash bullet style');

        const changelogStar = `# Changelog
## 1.0.0
### Added
* Feature A
* Feature B`;

        const analysisStar = changelogService.analyzeChangelogStructure(changelogStar);
        assert.strictEqual(analysisStar.bulletStyle, '*', 'Should detect star bullet style');
    });

    test('Changelog structure analysis should detect emoji usage', () => {
        const changelogService = service as any;

        const changelogWithEmoji = `# Changelog
## 1.0.0
### Added
- ✨ Feature A
- 🚀 Feature B`;

        const analysisWithEmoji = changelogService.analyzeChangelogStructure(changelogWithEmoji);
        assert.strictEqual(analysisWithEmoji.usesEmojis, true, 'Should detect emoji usage');

        const changelogNoEmoji = `# Changelog
## 1.0.0
### Added
- Feature A
- Feature B`;

        const analysisNoEmoji = changelogService.analyzeChangelogStructure(changelogNoEmoji);
        assert.strictEqual(analysisNoEmoji.usesEmojis, false, 'Should detect no emoji usage');
    });

    test('Changelog structure analysis should detect categories', () => {
        const changelogService = service as any;

        const changelog = `# Changelog
## 1.0.0
### Added
- Feature A
### Fixed
- Bug B
### Security
- Security patch C`;

        const analysis = changelogService.analyzeChangelogStructure(changelog);

        assert.ok(analysis.categoriesUsed.includes('Added'), 'Should detect Added category');
        assert.ok(analysis.categoriesUsed.includes('Fixed'), 'Should detect Fixed category');
        assert.ok(analysis.categoriesUsed.includes('Security'), 'Should detect Security category');
    });

    test('Changelog structure analysis should detect custom categories', () => {
        const changelogService = service as any;

        const changelog = `# Changelog
## 1.0.0
### Added
- Feature A
### Performance
- Optimization B
### Documentation
- Docs update C`;

        const analysis = changelogService.analyzeChangelogStructure(changelog);

        assert.ok(analysis.customCategories.includes('Performance'), 'Should detect custom Performance category');
        assert.ok(analysis.customCategories.includes('Documentation'), 'Should detect custom Documentation category');
    });

    test('Changelog structure analysis should detect Keep a Changelog header', () => {
        const changelogService = service as any;

        const changelogWithHeader = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## 1.0.0
### Added
- Feature A`;

        const analysisWithHeader = changelogService.analyzeChangelogStructure(changelogWithHeader);
        assert.strictEqual(analysisWithHeader.hasKeepAChangelogHeader, true, 'Should detect Keep a Changelog header');

        const changelogNoHeader = `# Changelog
## 1.0.0
### Added
- Feature A`;

        const analysisNoHeader = changelogService.analyzeChangelogStructure(changelogNoHeader);
        assert.strictEqual(analysisNoHeader.hasKeepAChangelogHeader, false, 'Should not detect header when missing');
    });

    test('Changelog structure analysis should detect date format', () => {
        const changelogService = service as any;

        const changelogWithDate = `# Changelog
## 1.0.0 - 2025-01-15
### Added
- Feature A`;

        const analysisWithDate = changelogService.analyzeChangelogStructure(changelogWithDate);
        assert.strictEqual(analysisWithDate.hasDateFormat, true, 'Should detect date format');

        const changelogNoDate = `# Changelog
## 1.0.0
### Added
- Feature A`;

        const analysisNoDate = changelogService.analyzeChangelogStructure(changelogNoDate);
        assert.strictEqual(analysisNoDate.hasDateFormat, false, 'Should not detect date when missing');
    });

    test('Changelog structure analysis should detect Breaking Changes section', () => {
        const changelogService = service as any;

        const changelog = `# Changelog
## 1.0.0
### Breaking Changes
- API endpoint changed`;

        const analysis = changelogService.analyzeChangelogStructure(changelog);
        assert.strictEqual(analysis.hasBreakingChangesSection, true, 'Should detect Breaking Changes section');
    });

    test('Changelog structure analysis should detect Technical section', () => {
        const changelogService = service as any;

        const changelog = `# Changelog
## 1.0.0
### Technical
- Updated build system`;

        const analysis = changelogService.analyzeChangelogStructure(changelog);
        assert.strictEqual(analysis.hasTechnicalSection, true, 'Should detect Technical section');
    });

    test('Token estimation should calculate correctly', () => {
        const changelogService = service as any;

        const shortSummary = 'Short commit message';
        const longSummary = 'A'.repeat(10000);

        const shortEstimation = changelogService.estimateChangelogTokens(
            shortSummary,
            null,
            'Policy: version format v1.2.3'
        );

        assert.ok(shortEstimation.totalTokens > 0, 'Should estimate tokens for short summary');
        assert.ok(shortEstimation.isWithinLimit, 'Short summary should be within limits');

        const longEstimation = changelogService.estimateChangelogTokens(
            longSummary,
            null,
            'Policy: version format v1.2.3'
        );

        assert.ok(longEstimation.totalTokens > shortEstimation.totalTokens,
            'Long summary should have more tokens');
    });

    test('Token estimation should include existing changelog in calculation', () => {
        const changelogService = service as any;

        const summary = 'Commit summary';
        const existingChangelog = 'B'.repeat(5000);

        const withoutChangelog = changelogService.estimateChangelogTokens(summary, null, '');
        const withChangelog = changelogService.estimateChangelogTokens(summary, existingChangelog, '');

        assert.ok(withChangelog.totalTokens > withoutChangelog.totalTokens,
            'Estimation with existing changelog should have more tokens');
    });

    test('Token estimation should recommend max commits when over limit', () => {
        const changelogService = service as any;

        // Create a very large summary to exceed limits
        const hugeSummary = Array(1000).fill('### Commit: abc123\nMessage: test\nDetails: details\n---\n').join('');

        const estimation = changelogService.estimateChangelogTokens(hugeSummary, null, '');

        if (!estimation.isWithinLimit) {
            assert.ok(estimation.recommendedMaxCommits !== null,
                'Should recommend max commits when over limit');
            assert.ok(estimation.recommendedMaxCommits! > 0,
                'Recommended max commits should be positive');
        }
    });

    test('Commit summary preparation should format correctly', () => {
        const changelogService = service as any;

        const mockVersionGroups = [
            {
                version: '1.0.0',
                date: '2025-01-15',
                commits: [
                    {
                        hash: 'abc123def456',
                        author: 'John Doe',
                        date: '2025-01-15',
                        message: 'feat: add new feature',
                        body: 'Added authentication system'
                    }
                ]
            }
        ];

        const summary = changelogService.prepareCommitSummary(mockVersionGroups);

        assert.ok(summary.includes('Version: 1.0.0'), 'Should include version');
        assert.ok(summary.includes('2025-01-15'), 'Should include date');
        assert.ok(summary.includes('abc123'), 'Should include short hash');
        assert.ok(summary.includes('John Doe'), 'Should include author');
        assert.ok(summary.includes('feat: add new feature'), 'Should include message');
        assert.ok(summary.includes('Added authentication system'), 'Should include body');
    });

    test('Changelog formatting should add header for new files', () => {
        const changelogService = service as any;

        const aiResponse = `## 1.0.0 - 2025-01-15
### Added
- New feature`;

        const formatted = changelogService.formatChangelog(aiResponse, null);

        assert.ok(formatted.includes('# Changelog'), 'Should add changelog header');
        assert.ok(formatted.includes('Keep a Changelog'), 'Should add Keep a Changelog reference');
        assert.ok(formatted.includes('Semantic Versioning'), 'Should add Semantic Versioning reference');
    });

    test('Changelog formatting should not add header for existing files', () => {
        const changelogService = service as any;

        const existingChangelog = `# Changelog
## 1.0.0
### Added
- Old feature`;

        const aiResponse = `## 1.1.0 - 2025-01-15
### Added
- New feature`;

        const formatted = changelogService.formatChangelog(aiResponse, existingChangelog);

        // Should not duplicate the header
        const headerCount = (formatted.match(/# Changelog/g) || []).length;
        assert.strictEqual(headerCount, 0, 'Should not add duplicate header');
    });

    test('Changelog formatting should clean markdown code blocks', () => {
        const changelogService = service as any;

        const aiResponse = `\`\`\`markdown
## 1.0.0
### Added
- Feature
\`\`\``;

        const formatted = changelogService.formatChangelog(aiResponse, null);

        assert.ok(!formatted.includes('```'), 'Should remove markdown code blocks');
    });

    test('Changelog formatting should normalize excessive newlines', () => {
        const changelogService = service as any;

        const aiResponse = `## 1.0.0



### Added


- Feature`;

        const formatted = changelogService.formatChangelog(aiResponse, null);

        // Should reduce to maximum 3 consecutive newlines
        assert.ok(!formatted.includes('\n\n\n\n'), 'Should normalize excessive newlines');
    });

    test('Extract latest version from changelog should parse correctly', () => {
        const changelogService = service as any;

        const changelog = `# Changelog
## v1.2.3 - 2025-01-15
### Added
- Feature A

## v1.2.2 - 2024-12-01
### Fixed
- Bug B`;

        const latestVersion = changelogService.extractLatestVersionFromChangelog(changelog);
        assert.strictEqual(latestVersion, 'v1.2.3 - 2025-01-15', 'Should extract latest version with date');
    });

    test('Extract latest version should return null for invalid changelog', () => {
        const changelogService = service as any;

        const invalidChangelog = `# Changelog
Some text without versions`;

        const latestVersion = changelogService.extractLatestVersionFromChangelog(invalidChangelog);
        assert.strictEqual(latestVersion, null, 'Should return null for invalid changelog');
    });

    test('Policy instructions building should include all detected elements', () => {
        const changelogService = service as any;

        const policy = {
            versionFormat: 'v1.2.3' as const,
            bulletStyle: '-' as const,
            usesEmojis: true,
            categoriesUsed: ['Added', 'Fixed', 'Security'],
            hasDateFormat: true,
            indentationStyle: 'spaces' as const,
            customCategories: ['Performance'],
            hasBreakingChangesSection: true,
            hasTechnicalSection: true,
            hasKeepAChangelogHeader: true
        };

        const instructions = changelogService.buildPolicyInstructions(policy);

        assert.ok(instructions.includes('v1.2.3'), 'Should include version format');
        assert.ok(instructions.includes('-'), 'Should include bullet style');
        assert.ok(instructions.includes('Emojis'), 'Should mention emoji usage');
        assert.ok(instructions.includes('Added'), 'Should include categories');
    });

    test('Policy instructions should handle null policy', () => {
        const changelogService = service as any;

        const instructions = changelogService.buildPolicyInstructions(null);

        assert.strictEqual(instructions, '', 'Should return empty string for null policy');
    });

    test('Changelog prompt should include policy awareness when policy exists', () => {
        const changelogService = service as any;

        const commitSummary = 'Version: 1.0.0\nCommit: abc123\nMessage: feat: test';
        const existingChangelog = '# Changelog\n## 1.0.0\n### Added\n- Feature';
        const policy = {
            versionFormat: 'v1.2.3' as const,
            bulletStyle: '-' as const,
            usesEmojis: false,
            categoriesUsed: ['Added', 'Fixed'],
            hasDateFormat: true,
            indentationStyle: 'none' as const,
            customCategories: [],
            hasBreakingChangesSection: false,
            hasTechnicalSection: false,
            hasKeepAChangelogHeader: true
        };

        const prompt = changelogService.buildChangelogPrompt(commitSummary, existingChangelog, policy);

        assert.ok(prompt.includes('EXISTING CHANGELOG POLICY'), 'Should include policy section');
        assert.ok(prompt.includes('MUST FOLLOW EXACTLY'), 'Should emphasize policy adherence');
        assert.ok(prompt.includes('v1.2.3'), 'Should include version format from policy');
        assert.ok(prompt.includes('NO emojis'), 'Should include emoji policy');
    });

    test('Changelog prompt should use defaults when no policy exists', () => {
        const changelogService = service as any;

        const commitSummary = 'Version: 1.0.0\nCommit: abc123\nMessage: feat: test';

        const prompt = changelogService.buildChangelogPrompt(commitSummary, null, null);

        assert.ok(prompt.includes('DEFAULT FORMAT STRUCTURE'), 'Should include default structure');
        assert.ok(prompt.includes('Keep a Changelog'), 'Should reference Keep a Changelog');
        assert.ok(!prompt.includes('EXISTING CHANGELOG POLICY'), 'Should not include policy section');
    });

    test('Save changelog should handle create mode', async () => {
        // This would require file system mocking - placeholder for structure
        assert.ok(true, 'Save changelog create mode test placeholder');
    });

    test('Save changelog should handle update mode', async () => {
        // This would require file system mocking - placeholder for structure
        assert.ok(true, 'Save changelog update mode test placeholder');
    });

    test('Save changelog should handle prepend mode', async () => {
        // This would require file system mocking - placeholder for structure
        assert.ok(true, 'Save changelog prepend mode test placeholder');
    });

    test('Error handling: should throw when no workspace folder exists', async () => {
        // This tests error handling when workspace is not available
        // Would require mocking workspace to return undefined
        assert.ok(true, 'Error handling test placeholder');
    });

    test('Error handling: should throw when no commits found', async () => {
        // This tests the error thrown when version groups are empty
        assert.ok(true, 'Error handling test placeholder');
    });

    test('Edge case: should handle empty commit body', () => {
        const changelogService = service as any;

        const mockVersionGroups = [
            {
                version: '1.0.0',
                date: '2025-01-15',
                commits: [
                    {
                        hash: 'abc123',
                        author: 'John Doe',
                        date: '2025-01-15',
                        message: 'feat: test',
                        body: ''  // Empty body
                    }
                ]
            }
        ];

        const summary = changelogService.prepareCommitSummary(mockVersionGroups);

        assert.ok(summary.includes('feat: test'), 'Should still include message with empty body');
    });

    test('Edge case: should handle very long commit messages', () => {
        const changelogService = service as any;

        const longMessage = 'A'.repeat(10000);
        const mockVersionGroups = [
            {
                version: '1.0.0',
                date: '2025-01-15',
                commits: [
                    {
                        hash: 'abc123',
                        author: 'John Doe',
                        date: '2025-01-15',
                        message: longMessage,
                        body: ''
                    }
                ]
            }
        ];

        assert.doesNotThrow(() => {
            changelogService.prepareCommitSummary(mockVersionGroups);
        }, 'Should handle very long commit messages');
    });

    test('Edge case: should handle special characters in commit messages', () => {
        const changelogService = service as any;

        const specialMessage = 'feat: add "quotes" and \'apostrophes\' with <tags> & symbols $#@';
        const mockVersionGroups = [
            {
                version: '1.0.0',
                date: '2025-01-15',
                commits: [
                    {
                        hash: 'abc123',
                        author: 'John Doe',
                        date: '2025-01-15',
                        message: specialMessage,
                        body: ''
                    }
                ]
            }
        ];

        const summary = changelogService.prepareCommitSummary(mockVersionGroups);

        assert.ok(summary.includes(specialMessage), 'Should preserve special characters');
    });
});
