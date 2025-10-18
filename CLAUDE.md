# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitMind is a VS Code extension that provides AI-powered commit message generation. It supports 13 different AI providers (OpenAI, Anthropic, Google Gemini, DeepSeek, Grok, Perplexity, Mistral, Cohere, HuggingFace, Together AI, OpenRouter, Ollama, GitHub Copilot) with 50+ models and multiple commit message styles.

**Technology Stack:**
- TypeScript
- VS Code Extension API
- esbuild for bundling
- Multiple AI provider APIs
- VS Code SecretStorage for encrypted API keys

## Build & Development Commands

### Building
```bash
# Compile (type check, lint, and build)
npm run compile

# Watch mode (parallel watch for esbuild and TypeScript)
npm run watch

# Production build (minified, no sourcemaps)
npm run package

# Package for VS Code marketplace
npm run package:vsce
```

### Testing
```bash
# Run all tests
npm test

# Compile tests
npm run compile-tests

# Watch tests
npm run watch-tests

# Validate test structure
npm run test:validate

# Check test status
npm run test:status
```

### Other Commands
```bash
# Type checking only (no compilation)
npm run check-types

# Lint all TypeScript files
npm run lint

# Clean build artifacts
npm run clean
```

### VS Code Debugging
- **Run Extension**: F5 or use "Run Extension" launch config
- **Run Extension (Dev Mode)**: Use "Run Extension (Dev Mode)" with `GITMIND_ENCRYPTION_DEV_MODE=true`
- **Run Extension (Watch Mode)**: Use "Run Extension (Watch Mode)" for live reload during development
- **Extension Tests**: Use "Extension Tests" launch config

## Architecture Overview

### High-Level Structure

The extension follows a modular architecture with clear separation between:
1. **Core Extension Logic** (`src/extension.ts`) - Entry point, command registration, and lifecycle management
2. **Service Layer** (`src/services/`) - Business logic and external integrations
3. **Webview Components** (`src/webview/`) - UI for settings, onboarding, and diagnostics
4. **Configuration** (`src/config/`) - Type definitions and settings management
5. **Utilities** (`src/utils/`) - Shared helper functions

### Key Architectural Patterns

#### 1. Multi-Provider AI Abstraction

The extension uses a **unified provider configuration system** (`PROVIDER_CONFIGS` in `src/services/api/index.ts`):
- Each provider has a dedicated module in `src/services/api/` (e.g., `gemini.ts`, `openai.ts`, `anthropic.ts`)
- All providers implement a common interface for API calls
- Provider-specific configurations are stored in `src/config/types.ts` with strongly-typed interfaces
- Main API orchestration happens in `src/services/api/index.ts` via `generateCommitMessage()`

**Flow:**
1. User triggers commit generation
2. `getApiConfig()` retrieves provider configuration from VS Code settings
3. Provider-specific API call function is invoked (e.g., `callGeminiAPI()`)
4. Response is processed through `processCommitMessage()` for formatting
5. Result is injected into Git SCM panel

#### 2. Secure API Key Management

The extension supports both plain-text and encrypted API key storage:
- **SecureKeyManager** (`src/services/encryption/SecureKeyManager.ts`) - Handles VS Code SecretStorage integration
- **Encryption Helper** (`src/utils/encryptionHelper.ts`) - Encryption/decryption utilities
- **Migration Service** (`src/services/migration/SettingsMigrationService.ts`) - Handles migration between storage modes

**Pro Feature Logic:**
- API key encryption requires Pro subscription
- Subscription validation via LemonSqueezy API
- Pro features are gated through `SubscriptionManager` (`src/services/subscription/SubscriptionManager.ts`)

#### 3. Webview Architecture

The extension uses three main webviews:
- **Settings Webview** (`src/webview/settings/`) - Main configuration UI
  - `SettingsWebview.ts` - Webview controller
  - `SettingsTemplateGenerator.ts` - HTML/CSS generation
  - `MessageHandler.ts` - Extension-webview communication
  - `SettingsManager.ts` - Client-side form handling
- **Onboarding Webview** (`src/webview/onboarding/`) - First-time user experience
- **Diagnostics Webview** (`src/webview/diagnostics/`) - Token estimation and request details

**Communication Pattern:**
1. Extension creates webview and registers message handlers
2. Webview sends messages via `vscode.postMessage()`
3. Extension processes via `MessageHandler.handleMessage()`
4. Extension sends responses back to webview
5. Webview updates UI accordingly

#### 4. Commit History Analysis (Pro)

Advanced feature that learns from repository commit history:
- **CommitHistoryLearningService** (`src/services/ai/learnFromCommitHistory.ts`)
- Analyzes past commits to understand project conventions
- Generates analysis prompt with historical context
- Uses larger timeouts (3-8 minutes) for API calls
- Configurable commit count and author info inclusion

#### 5. Changelog Generation (Pro)

Professional changelog generation from git history with intelligent version detection and policy awareness:
- **ChangelogService** (`src/services/changelog/ChangelogService.ts`) - Core service with 3-tier version detection
- **Version Detection Strategy:**
  1. **Git Tags** (Primary): Detects semantic version tags (v1.2.3, 1.2.3, etc.)
  2. **Commit Messages** (Secondary): Parses version bumps from commit messages (e.g., "chore: bump version to 4.3.0")
  3. **package.json** (Enhanced): Reads package.json at each commit to detect version changes
  4. **Fallback**: Creates "Unreleased" section if no versions detected
- **Changelog Policy Awareness:**
  - **Structure Analysis**: Analyzes existing CHANGELOG.md to extract format rules
  - **Format Preservation**: Detects and matches version format (v1.2.3 vs 1.2.3), bullet style (-, *, +), date format, emoji usage
  - **Category Detection**: Identifies existing categories and custom categories unique to the project
  - **Exact Matching**: AI prompt dynamically adapts to match existing changelog's style, tone, and structure exactly
  - **No Format Drift**: Prevents introduction of new formatting that doesn't match established conventions
- **Industry-Standard Output:**
  - Follows Keep a Changelog specification by default
  - Categories: Added, Changed, Deprecated, Removed, Fixed, Security, Technical (or matches existing)
  - Professional tone, NO emojis (unless existing changelog uses them)
  - Factual and concise with technical details
- **User Guidance:**
  - Interactive tips modal before generation with best practices
  - Version detection strategies explained
  - Changelog policy awareness highlighted
  - "Learn More" option to view CHANGELOG_FEATURE_GUIDE.md
- **Multi-Language Support:**
  - JavaScript/TypeScript: package.json version detection
  - Python/Go/Other: Git tags and commit message analysis
  - DevOps/IaC: Universal commit message detection
  - Works for any project type with intelligent fallbacks
- **Commands:**
  - `gitmind.generateChangelog` - Interactive with 3 modes (create, update, preview)
  - `gitmind.updateChangelog` - Quick update command
- **Configuration:**
  - `gitmind.pro.changelog.enabled` (default: true)
  - `gitmind.pro.changelog.maxCommits` (default: 100, range: 10-500)
  - `gitmind.pro.changelog.groupByVersion` (default: true)
- Uses 8-minute timeout for comprehensive changelog generation

#### 6. Large Diff Processing (Pro)

Handles repositories with massive diffs via adaptive chunking:
- **DiffProcessor** (`src/services/diffProcessor.ts`) - Splits large diffs into manageable chunks
- Token-aware splitting with provider-specific limits
- Concurrency control for parallel chunk processing
- Retry logic with exponential backoff
- Cancellation support and progress reporting
- Deterministic merging of chunk results

**Key Methods:**
- `splitDiffIntoChunks()` - Iterative splitting with shrinking budgets
- `validatePromptLength()` - Provider-specific token validation
- `mergeChunkResults()` - Combines chunk analyses into final message

#### 7. Telemetry System

Anonymous usage analytics via Azure Application Insights:
- **TelemetryService** (`src/services/telemetry/telemetryService.ts`)
- Tracks command usage, errors, and performance
- Respects VS Code telemetry settings
- Privacy-first: no code content, file names, or personal data
- Lazy-loaded `applicationinsights` to reduce bundle size

### Multi-Repository Support

The extension fully supports multi-repository workspaces:
- Each repository in VS Code Source Control panel has independent GitMind buttons
- Repository context is passed through command handlers via VS Code SCM API
- `validateGitRepository()` discovers repositories both up (parent folders) and down (subdirectories)
- Diagnostics display repository-specific information
- Each repository maintains its own Git context and diff analysis

### Configuration Management

Settings are stored in VS Code's workspace/user configuration:
- Configuration keys use `gitmind.*` namespace
- Pro features use `gitmind.pro.*` namespace
- Subscription settings use `gitmind.subscription.*` namespace
- Settings migration handled automatically on extension updates
- API keys can be stored in plain text or encrypted (Pro)

**Important Settings:**
- `gitmind.apiProvider` - Selected AI provider
- `gitmind.commitStyle.style` - Commit message format
- `gitmind.pro.encryptionEnabled` - Enable encrypted API key storage
- `gitmind.pro.learnFromCommitHistory.enabled` - Enable commit history analysis

### Error Handling

Comprehensive error handling system:
- **APIErrorHandler** (`src/utils/errorHandler.ts`) - Centralized error processing
- Provider-specific error parsing with actionable guidance
- Token limit detection with recommendations
- Rate limit handling with retry suggestions
- Circuit breaker pattern for repeated failures (3 failures = 1 minute cooldown)

### State Management

Extension state is maintained in:
- **ExtensionState interface** - Debug channel, status bar, VS Code context
- **Global State** - Onboarding completion, last validation times
- **Workspace State** - Repository-specific settings
- **SecretStorage** - Encrypted API keys (Pro)

## Important Implementation Details

### Commit Message Generation Flow

1. User clicks "Generate GitMind Commit Message" in SCM panel
2. Extension validates Git repository and checks for changes
3. `getDiff()` retrieves staged/unstaged changes
4. If diagnostics enabled, shows token estimation dialog
5. If prompt customization enabled, prompts for custom context
6. If Pro + commit history analysis enabled, includes historical context
7. Calls provider-specific API with generated prompt
8. Processes response through `processCommitMessage()`
9. Applies commit style formatting and gitmoji (if enabled)
10. Injects result into Git SCM input box

### Provider API Call Pattern

Each provider module (`src/services/api/*.ts`) follows this pattern:
```typescript
export async function callProviderAPI(
  apiKey: string,
  model: string,
  diff: string,
  customContext: string
): Promise<string>
```

The function:
1. Validates API key (if required)
2. Constructs provider-specific request format
3. Makes HTTP request with timeout and cancellation support
4. Parses provider-specific response format
5. Returns commit message text
6. Throws descriptive errors on failure

### Settings Webview Communication

Messages between extension and webview use typed message format:
```typescript
interface Message {
  command: string;
  [key: string]: any;
}
```

Common commands:
- `saveSettings` - User saves configuration
- `loadMistralModels` / `loadHuggingFaceModels` - Dynamic model loading
- `activateWithLicenseKey` / `activateWithOrderId` - Pro activation
- `subscribe` - Initiate subscription flow
- `refreshSubscription` - Update subscription status

### Testing Strategy

Tests are organized in `src/test/suites/`:
- `aiProviders.test.ts` - Provider API integration tests
- `gitIntegration.test.ts` - Git repository operations
- `settingsUI.test.ts` - Settings webview functionality
- `configurationManagement.test.ts` - Config read/write operations
- `extensionCommands.test.ts` - Command registration and execution
- `errorHandling.test.ts` - Error scenarios and recovery
- `telemetryToggleSimple.test.ts` - Telemetry on/off behavior
- `webviewComponents.test.ts` - Webview lifecycle

### Bundle Optimization

The extension uses aggressive tree-shaking and code splitting:
- Production builds drop console statements and debugger
- `applicationinsights` is externalized to reduce bundle size
- Final bundle: ~1.1 MB (down from 5.57 MB)
- Source maps only in development builds
- Target: Node 16+ for modern JavaScript features

## Common Development Workflows

### Adding a New AI Provider

1. Create provider module in `src/services/api/newprovider.ts`
2. Define types in `src/config/types.ts` (e.g., `NewProviderApiConfig`)
3. Add provider to `ApiProvider` union type
4. Implement `callNewProviderAPI()` function
5. Add provider config to `PROVIDER_CONFIGS` in `src/services/api/index.ts`
6. Update `getApiConfig()` in `src/config/settings.ts`
7. Add settings schema in `package.json` under `contributes.configuration.properties`
8. Create UI component in `src/webview/settings/components/NewProviderSettings.ts`
9. Update `SettingsTemplateGenerator.ts` to include new provider UI
10. Add validation logic in `src/services/api/validation.ts`

### Adding a New Commit Style

1. Add style to `CommitStyle` type in `src/config/types.ts`
2. Define style configuration in `src/config/commitStyles.ts`
3. Update `COMMIT_STYLES` constant with style details
4. Add enum option to `gitmind.commitStyle.style` in `package.json`
5. Update `CommitStyleManager` (`src/services/commitStyleManager.ts`) if custom logic needed
6. Update settings webview to display new style option

### Modifying Webview UI

1. Locate component in `src/webview/settings/components/`
2. Modify TypeScript component class
3. Update styles in `src/webview/settings/styles/` (CSS modules)
4. If adding new settings, update `MessageHandler.ts` for message handling
5. Add corresponding setting to `package.json` configuration schema
6. Update `SettingsManager.ts` for client-side form binding
7. Test in both light and dark VS Code themes

### Debugging API Integration Issues

1. Enable debug mode: `gitmind.debug: true` in settings
2. Check "GitMind Debug" output channel in VS Code
3. Use "Run Extension (Dev Mode)" launch config for enhanced logging
4. Review network requests in provider-specific API modules
5. Check error messages in `APIErrorHandler.ts` for classification
6. Verify token estimation in diagnostics webview
7. Test with minimal diff first, then gradually increase size

## Important Files Reference

- **`src/extension.ts`** - Extension entry point and command registration
- **`src/services/api/index.ts`** - Main API orchestration and provider routing
- **`src/services/api/prompts.ts`** - Prompt generation for all commit styles
- **`src/config/settings.ts`** - Configuration retrieval and API config building
- **`src/config/types.ts`** - All TypeScript interfaces and type definitions
- **`src/services/git/repository.ts`** - Git operations (diff, validation, commit message injection)
- **`src/webview/settings/SettingsWebview.ts`** - Settings UI webview controller
- **`src/services/subscription/SubscriptionManager.ts`** - Pro subscription validation
- **`src/utils/errorHandler.ts`** - Centralized error processing and user feedback
- **`package.json`** - Extension manifest, commands, settings schema, and dependencies

## Notes for Future Development

- The extension maintains backward compatibility with VS Code 1.63.0+
- Pro features are feature-flagged through subscription validation
- All webviews use VS Code's built-in theme variables for consistency
- Error messages should be actionable and provider-specific
- Large diff processing uses adaptive chunking - test with repositories >10MB
- Telemetry is disabled by default and respects VS Code global setting
- Multi-repository support requires testing with nested Git repositories
- API timeouts vary: 10s (standard), 3min (commit history), 8min (large histories)
