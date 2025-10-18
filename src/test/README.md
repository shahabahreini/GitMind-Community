# GitMind Extension Test Suite

## Overview
Comprehensive test coverage for the GitMind VS Code extension to ensure quality and catch issues early before compilation.

## Test Structure

```
src/test/
├── comprehensive.test.ts          # Main test runner
├── extension.test.ts              # Extension activation tests
├── promptManager.test.ts          # Prompt management tests
├── suites/                        # Individual test suites
│   ├── aiProviders.test.ts       # AI provider configuration (30+ tests)
│   ├── changelogService.test.ts  # Changelog generation (35 tests) ✨ NEW
│   ├── configurationManagement.test.ts  # Config operations (25+ tests)
│   ├── coreServices.test.ts      # Core services (60+ tests) ✨ ENHANCED
│   ├── diffProcessor.test.ts     # Diff processing (35 tests) ✨ NEW
│   ├── errorHandling.test.ts     # Error scenarios (20+ tests)
│   ├── extensionCommands.test.ts # Command registration (15+ tests)
│   ├── gitIntegration.test.ts    # Git operations (20+ tests)
│   ├── settingsUI.test.ts        # Settings UI (40+ tests)
│   ├── telemetryToggleSimple.test.ts  # Telemetry (10+ tests)
│   ├── tokenCounter.test.ts      # Token estimation (45 tests) ✨ NEW
│   └── webviewComponents.test.ts # Webview lifecycle (25+ tests)
└── README.md                      # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suite
```bash
npm test -- --grep "Changelog Service"
npm test -- --grep "DiffProcessor"
npm test -- --grep "Token Counter"
npm test -- --grep "ResponseProcessor"
```

### Watch Mode
```bash
npm run watch-tests
```

### Compile Tests Only
```bash
npm run compile-tests
```

### Validate Test Structure
```bash
npm run test:validate
```

### Check Test Status
```bash
npm run test:status
```

## Test Categories

### 1. AI Provider Tests (`aiProviders.test.ts`)
Tests all 13 AI provider integrations:
- Configuration validation
- API key handling
- Model selection
- Provider switching
- Error handling
- Mock API calls

**Providers Covered:**
- OpenAI (GPT-4, GPT-3.5, O1)
- Anthropic (Claude 4, Claude 3.5)
- Google Gemini (2.5, 2.0, 1.5)
- DeepSeek (Chat, Reasoner)
- Grok (3, 3-fast, 3-mini)
- Perplexity (Sonar Pro, Sonar Reasoning)
- Mistral, Cohere, HuggingFace
- Together AI, OpenRouter
- Ollama (local models)
- GitHub Copilot

### 2. Changelog Service Tests (`changelogService.test.ts`) ✨ NEW
Tests the AI-powered changelog generation feature:
- Version detection from git tags
- Version detection from commit messages
- Version detection from package.json
- Changelog structure analysis
- Policy awareness (format, bullets, emojis)
- Token estimation and limits
- Multi-version grouping
- Edge cases and error handling

**Key Features Tested:**
- 3-tier version detection strategy
- Existing changelog policy extraction
- Token limit validation with warnings
- Format preservation (v1.2.3 vs 1.2.3)
- Category detection (standard + custom)

### 3. DiffProcessor Tests (`diffProcessor.test.ts`) ✨ NEW
Tests the enhanced diff processing with adaptive chunking:
- Large diff detection
- Hunk-aware splitting
- Header preservation
- Multi-file diff handling
- Binary file diffs
- Rename/delete diffs
- Chunk size budget compliance
- Performance validation

**Scenarios Covered:**
- Single-file and multi-file diffs
- Multiple hunks per file
- Very large diffs (1000+ lines)
- 100+ files in one diff
- Unicode and special characters

### 4. Token Counter Tests (`tokenCounter.test.ts`) ✨ NEW
Tests token estimation for API cost management:
- Empty/null input
- Word-based estimation
- Character-based estimation
- Punctuation and special characters
- Code snippets and git diffs
- Unicode and emojis
- Performance tests
- Accuracy validation

**Content Types Tested:**
- Plain text (English, multi-language)
- Code (JavaScript, TypeScript, JSON)
- Git diffs and commit messages
- Changelogs and markdown
- URLs and file paths

### 5. Core Services Tests (`coreServices.test.ts`) ✨ ENHANCED
Tests core service functionality including ResponseProcessor:
- DiffProcessor singleton
- GitmojiService functionality
- SecureKeyManager operations
- ResponseProcessor enhancements:
  - Conventional commit formats
  - Empty response handling
  - Multiple commit styles
  - Markdown cleaning
  - Edge cases and artifacts

**Commit Styles Tested:**
- Conventional (feat, fix, docs, etc.)
- Gitmoji/Emojigit
- Ember ([FEATURE], [BUGFIX])
- Linux kernel style
- jQuery style
- Basic style

### 6. Error Handling Tests (`errorHandling.test.ts`)
Tests error scenarios and recovery:
- API errors (rate limits, token limits)
- Network failures
- Invalid configurations
- Circuit breaker pattern
- Provider-specific errors
- User-friendly error messages

### 7. Git Integration Tests (`gitIntegration.test.ts`)
Tests git repository operations:
- Repository detection
- Diff retrieval
- Commit message injection
- Multi-repository support
- Nested repository discovery

### 8. Settings UI Tests (`settingsUI.test.ts`)
Tests settings webview functionality:
- Provider selection
- API key management
- Model selection
- Commit style configuration
- Pro feature settings
- Save/load operations

### 9. Configuration Management Tests (`configurationManagement.test.ts`)
Tests VS Code configuration:
- Setting read/write
- Default values
- Migration between versions
- Workspace vs user settings
- Encrypted storage (Pro)

### 10. Extension Commands Tests (`extensionCommands.test.ts`)
Tests command registration and execution:
- Command availability
- Command execution
- Error handling
- Context menu integration

### 11. Webview Components Tests (`webviewComponents.test.ts`)
Tests webview lifecycle:
- Webview creation
- Message handling
- State management
- Disposal and cleanup

### 12. Telemetry Tests (`telemetryToggleSimple.test.ts`)
Tests telemetry behavior:
- Respects VS Code settings
- Privacy compliance
- Event tracking
- Opt-out functionality

## Test Quality Standards

### Test Naming Convention
```typescript
test('[Component] should [expected behavior] when [condition]', () => {
    // Arrange
    // Act
    // Assert
});
```

### Example
```typescript
test('ChangelogService should detect version from package.json when git tags missing', () => {
    // Arrange
    const service = ChangelogService.getInstance();
    const mockCommits = createMockCommitsWithPackageVersion('4.3.0');

    // Act
    const versions = await service.detectVersions(mockCommits);

    // Assert
    assert.strictEqual(versions.length, 1);
    assert.strictEqual(versions[0].version, '4.3.0');
});
```

### Performance Requirements
- Individual tests: < 100ms each
- Total suite: < 5 seconds (unit tests)
- No flaky tests
- Deterministic results

### Coverage Requirements
- Critical path: 100% coverage
- Unit tests: 80% coverage minimum
- Integration tests: 60% coverage minimum
- Overall: 70% coverage target

## Continuous Integration

### Pre-commit
```bash
npm run lint
npm run check-types
npm test          # Fast unit tests only
```

### Pre-push
```bash
npm test          # Full test suite
npm run compile   # Verify build
```

### CI/CD Pipeline
```yaml
- npm ci
- npm run lint
- npm run check-types
- npm test
- npm run compile
- npm run package
```

## Key Features Tested

### Recently Added Features ✨
1. **AI-Powered Changelog Generation** (v4.3.0)
   - 3-tier version detection
   - Policy-aware formatting
   - Token limit management
   - Large history handling

2. **Adaptive Diff Chunking** (v4.2.0)
   - Hunk-aware splitting
   - Token budget compliance
   - Multi-file support
   - Header preservation

3. **Enhanced Response Processing** (v4.2.0)
   - Multiple commit styles
   - Artifact filtering
   - Edge case handling
   - Format preservation

### Core Features
- 13 AI provider integrations
- 50+ AI models supported
- Multiple commit message styles
- Secure API key storage (Pro)
- Commit history learning (Pro)
- Multi-repository support
- Telemetry with privacy controls

## Test Development Guidelines

### Adding New Tests
1. Create test file in appropriate suite
2. Follow naming convention
3. Use Arrange-Act-Assert pattern
4. Test happy path first
5. Add edge cases
6. Add error scenarios
7. Validate performance if needed

### Test File Template
```typescript
import * as assert from 'assert';
import { YourService } from '../../services/YourService';

suite('YourService Tests', () => {
    let service: YourService;

    setup(() => {
        service = YourService.getInstance();
    });

    test('YourService should do something when condition', () => {
        // Arrange
        const input = 'test';

        // Act
        const result = service.doSomething(input);

        // Assert
        assert.ok(result);
    });
});
```

### Edge Cases to Consider
- Empty/null inputs
- Very large inputs (performance)
- Special characters (unicode, emojis)
- Concurrent operations
- Error conditions
- Boundary values
- Invalid formats

## Debugging Tests

### VS Code Debugging
1. Set breakpoint in test file
2. Open "Run and Debug" panel
3. Select "Extension Tests" configuration
4. Press F5 to start debugging

### Console Output
```typescript
console.log('Debug info:', value);
debugLog('Using debug logger:', value);
```

### Isolating Tests
```typescript
test.only('This test only', () => {
    // Only this test runs
});

test.skip('Skip this test', () => {
    // This test is skipped
});
```

## Common Issues

### Issue: Tests fail in CI but pass locally
**Solution:** Check for:
- Environment-specific paths
- Timing dependencies
- Mock data consistency
- VS Code API availability

### Issue: Slow test execution
**Solution:**
- Reduce test data size
- Mock expensive operations
- Use parallel execution
- Profile with `--inspect-brk`

### Issue: Flaky tests
**Solution:**
- Remove timing dependencies
- Ensure proper cleanup
- Use deterministic test data
- Avoid shared state

## Resources

### Documentation
- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Mocha Documentation](https://mochajs.org/)
- [Node Assert API](https://nodejs.org/api/assert.html)

### Project Documentation
- `docs/TEST_COVERAGE_PLAN.md` - Comprehensive test plan
- `docs/TEST_IMPLEMENTATION_SUMMARY.md` - Implementation summary
- `docs/CHANGELOG_GENERATION.md` - Changelog feature docs
- `CLAUDE.md` - Project architecture

## Statistics

### Test Count by Category
| Category | Tests | Status |
|----------|-------|--------|
| AI Providers | 30+ | ✅ |
| Changelog Service | 35 | ✅ NEW |
| DiffProcessor | 35 | ✅ NEW |
| Token Counter | 45 | ✅ NEW |
| Core Services | 60+ | ✅ Enhanced |
| Settings UI | 40+ | ✅ |
| Git Integration | 20+ | ✅ |
| Configuration | 25+ | ✅ |
| Error Handling | 20+ | ✅ |
| Commands | 15+ | ✅ |
| Webview | 25+ | ✅ |
| Telemetry | 10+ | ✅ |
| **Total** | **290+** | **✅** |

### Coverage Metrics
- **Test Files:** 12 suites
- **Test Cases:** 290+ tests
- **Code Coverage:** ~70%+ estimated
- **Execution Time:** < 5 seconds (unit tests)
- **Success Rate:** 100% (all tests passing)

## Changelog

### v4.3.0 (2025-01-18)
- ✨ Added ChangelogService tests (35 tests)
- ✨ Added DiffProcessor tests (35 tests)
- ✨ Added TokenCounter tests (45 tests)
- ✨ Enhanced ResponseProcessor tests (25+ new tests)
- 📝 Created comprehensive test documentation
- 🔧 Fixed type errors and compilation issues

### Previous Versions
- v4.2.0: Added basic test suites
- v4.1.0: Initial test framework setup

## License
MIT - See LICENSE file for details

## Contributors
- GitMind Team
- Community Contributors

## Support
For issues or questions about tests:
1. Check existing test examples
2. Review documentation
3. Open GitHub issue
4. Contact maintainers
