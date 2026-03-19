# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitMind is a VS Code extension that provides AI-powered commit message generation. It supports 14 different AI providers (OpenAI, Anthropic, Google Gemini, DeepSeek, Grok, Perplexity, Mistral, Cohere, HuggingFace, Together AI, OpenRouter, Ollama, GitHub Copilot, Cursor Agent) with 50+ models and 11 professional commit message styles.

**Technology Stack:**
- TypeScript
- VS Code Extension API
- esbuild for bundling
- Multiple AI provider APIs
- VS Code SecretStorage for encrypted API keys

**Key Features:**
- 14 AI providers (15 with Custom API in Pro)
- 11 professional commit styles (including Conventional Commits No Scope)
- Flexible change capture (staged-only or all changes including untracked)
- Pro features: Changelog generation, commit history analysis, API key encryption, large diff processing

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
- **Run Extension**: Press F5 in VS Code to launch Extension Development Host
- **Watch Mode**: Use `npm run watch` for live TypeScript compilation during development
- **Dev Mode**: Set environment variable `GITMIND_ENCRYPTION_DEV_MODE=true` for enhanced encryption logging
- **Extension Tests**: Use `npm test` or the VS Code test runner

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

The extension uses a **unified provider configuration system** with lazy-loaded modules:
- Each provider has a dedicated module in `src/services/api/` (e.g., `gemini.ts`, `openai.ts`, `anthropic.ts`)
- **Lazy Loading**: Provider modules are dynamically imported only when needed, reducing initial bundle size by ~200-300KB
- Provider module cache prevents re-importing (`providerModuleCache` in `src/services/api/index.ts`)
- All providers implement a common interface for API calls
- Provider-specific configurations are stored in `src/config/types.ts` with strongly-typed interfaces
- Main API orchestration happens in `src/services/api/index.ts` via `generateCommitMessage()`

**Flow:**
1. User triggers commit generation
2. `getApiConfig()` retrieves provider configuration from VS Code settings
3. Provider module is lazy-loaded via `loadProviderModule()` if not cached
4. Provider-specific API call function is invoked (e.g., `callGeminiAPI()`)
5. Response is processed through `processCommitMessage()` for formatting
6. Result is injected into Git SCM panel

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
  - `SettingsWebview.ts` - Webview controller and lifecycle management
  - `SettingsTemplateGenerator.ts` - HTML/CSS generation with component system
  - `MessageHandler.ts` - Extension-webview bidirectional communication
  - `SettingsManager.ts` - Settings persistence and retrieval
  - `components/` - Modular provider-specific settings components
  - `styles/` - CSS modules for theming and layout
- **Onboarding Webview** (`src/webview/onboarding/`) - First-time user experience
  - `OnboardingWebview.ts` - Onboarding controller
  - `OnboardingTemplateGenerator.ts` - HTML/CSS for onboarding flow
  - `OnboardingMessageHandler.ts` - Handles onboarding step navigation
- **Diagnostics Webview** (`src/webview/diagnostics/`) - Token estimation and request details

**Communication Pattern:**
1. Extension creates webview and registers message handlers
2. Webview sends messages via `vscode.postMessage()`
3. Extension processes via `MessageHandler.handleMessage()`
4. Extension sends responses back to webview via `postMessageToWebview()`
5. Webview updates UI accordingly

**Important Webview Messages:**
- `saveSettings` - Persist configuration changes
- `loadOllamaModels` / `loadMistralModels` / `loadHuggingFaceModels` - Dynamic model discovery
- `activateWithLicenseKey` / `activateWithOrderId` - Pro subscription activation
- `testCustomApi` - Validate custom API endpoint configuration
- `migrateToEncryption` - Migrate API keys to encrypted storage

#### 4. Commit History Analysis (Pro)

Advanced feature that learns from repository commit history:
- **CommitHistoryLearningService** (`src/services/ai/learnFromCommitHistory.ts`)
- Analyzes past commits to understand project conventions
- Generates analysis prompt with historical context
- Uses larger timeouts (3-8 minutes) for API calls
- Configurable commit count and author info inclusion

#### 5. Changelog Generation (Pro)

Professional changelog generation from git history with intelligent version detection and policy awareness:
- **ChangelogService** (`src/services/changelog/ChangelogService.ts`) - Core service with 3-tier version detection and version-aware merging
- **Version Detection Strategy:**
  1. **Git Tags** (Primary): Detects semantic version tags (v1.2.3, 1.2.3, etc.)
  2. **Commit Messages** (Secondary): Parses version bumps from commit messages (e.g., "chore: bump version to 4.3.0")
  3. **package.json** (Enhanced): Reads package.json at each commit to detect version changes
  4. **Fallback**: Creates "Unreleased" section if no versions detected
- **Version Boundary Filtering (FIXED):**
  - **Precise Commit Filtering**: Uses `git log previous_tag..current_tag` to get commits ONLY for that specific version
  - **No Bleed-Over**: Prevents commits from bleeding across version boundaries when maxCommits is specified
  - **Proper Range Handling**: Each version gets commits strictly between its tag and the previous tag
- **Changelog Policy Awareness:**
  - **Structure Analysis**: Analyzes existing CHANGELOG.md to extract format rules
  - **Format Preservation**: Detects and matches version format (v1.2.3 vs 1.2.3), bullet style (-, *, +), date format, emoji usage
  - **Category Detection**: Identifies existing categories and custom categories unique to the project
  - **Exact Matching**: AI prompt dynamically adapts to match existing changelog's style, tone, and structure exactly
  - **No Format Drift**: Prevents introduction of new formatting that doesn't match established conventions
- **Version Conflict Resolution (NEW):**
  - **Duplicate Detection**: Automatically detects when regenerating a version that already exists in CHANGELOG.md
  - **Smart Merging**: Intelligently merges new and existing changelog content preserving all versions
  - **Overwrite Control**: `gitmind.pro.changelog.overwriteExisting` setting (default: false)
    - **Safe Mode (false)**: Existing version entries are preserved, only new versions added
    - **Overwrite Mode (true)**: Regenerated versions replace existing entries (useful for fixing/improving descriptions)
  - **User Feedback**: Clear notifications about conflict resolution strategy used
- **Industry-Standard Output:**
  - Follows Keep a Changelog specification by default
  - Categories: Added, Changed, Deprecated, Removed, Fixed, Security, Technical (or matches existing)
  - Professional tone, NO emojis ever (strict policy for professional documentation)
  - Factual and concise with technical details
- **Robust Token Management:**
  - **Automatic Estimation**: Calculates commit tokens, changelog tokens, policy tokens, and response reserve
  - **Token Formula**: `total = basePrompt(1500) + commits + changelog + policy + response(2500)`
  - **Safety Limit**: 100,000 tokens (conservative across all providers)
  - **Auto-Adjustment**: Proportionally reduces commits if over limit
  - **User Warnings**: Modal dialog with adjustment details and confirmation
  - **Debug Logging**: Detailed token breakdown when debug mode enabled
  - **Large Repo Support**: Handles 1000+ commits with intelligent reduction
- **User Guidance:**
  - Interactive tips modal before generation with best practices
  - Version detection strategies explained
  - Changelog policy awareness highlighted
  - Token management and optimization tips
  - Comprehensive documentation in `docs/CHANGELOG_GENERATION.md`
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
  - `gitmind.pro.changelog.maxCommits` (default: 100, range: 10-2500) - **Only applies when NO tags detected** (fallback scenarios)
  - `gitmind.pro.changelog.groupByVersion` (default: true)
  - `gitmind.pro.changelog.maxVersions` (default: 10, range: 1-25) - Limits number of version tags processed
  - `gitmind.pro.changelog.versionOrder` (default: newest-first)
  - `gitmind.pro.changelog.overwriteExisting` (default: false) - Control version conflict resolution
- Uses 8-minute timeout for comprehensive changelog generation
- **Important**: When version tags are detected, ALL commits between tags are retrieved (maxCommits is ignored to ensure complete version history)

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

#### 7. IDE-Specific AI Agent Integration (Pro)

Built-in AI agent support for compatible IDEs:
- **IDE Detection** (`src/utils/ideDetection.ts`) - Detects VS Code, Cursor, or unknown environments
- **Cursor Agent** (`src/services/api/cursor-agent.ts`) - Uses VS Code Language Model API in Cursor IDE
- **GitHub Copilot** (`src/services/api/copilot.ts`) - Works in VS Code with Copilot extension

**How IDE Agents Work:**
1. Extension detects the IDE environment using multiple signals (appName, uriScheme, appRoot, environment variables)
2. If running in compatible IDE, agent provider option appears in settings
3. Agent providers use VS Code Language Model API (`vscode.lm.selectChatModels()`) to access built-in models
4. No API key required - uses IDE's native authentication
5. Model selection is dynamic based on available models in the IDE

**Cursor Agent Implementation:**
- Uses `vscode.lm.selectChatModels()` to discover available models
- Supports auto-selection (first available model) or specific model selection
- Integrates with VS Code's cancellation tokens for request cancellation
- Streams response fragments for efficiency
- Pro feature with subscription validation

**Detection Logic:**
```typescript
// Checks multiple signals for each IDE type
- Cursor: appName/uriAuthority/appRoot contains "cursor", CURSOR_IDE env var
- VS Code: appName contains "visual studio code" or "vscode"
```

**Commands:**
- `gitmind.loadCursorAgentModels` - Fetch available Cursor models dynamically

#### 8. Telemetry System

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
- `gitmind.commitStyle.style` - Commit message format (11 styles: basic, conventional, conventional-no-scope, angular, ember, emojigit, gitmoji, semantic-release, commitizen, karma, linux-kernel, jquery)
- `gitmind.commit.captureAllChanges` - Capture all changes (staged + unstaged + untracked) without staging prompt (default: false)
- `gitmind.commit.verbose` - Generate verbose commit messages with detailed descriptions (default: true)
- `gitmind.pro.encryptionEnabled` - Enable encrypted API key storage
- `gitmind.pro.learnFromCommitHistory.enabled` - Enable commit history analysis
- `gitmind.pro.changelog.overwriteExisting` - Overwrite existing changelog versions when regenerating (default: false)

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
- **RequestManager** - Singleton pattern for request cancellation (`src/utils/requestManager.ts`)
  - Manages active AbortController instances
  - Ensures only one API request active at a time
  - Provides `abortCurrentRequest()` for user cancellation
  - Powers the cancel button in SCM panel during generation

## Important Implementation Details

### Commit Message Generation Flow

1. User clicks "Generate GitMind Commit Message" in SCM panel
2. Extension validates Git repository and checks for changes
3. `getDiff()` retrieves changes based on capture mode:
   - **Traditional mode** (default): Staged changes only (prompts if nothing staged)
   - **Capture All Changes mode** (`gitmind.commit.captureAllChanges: true`): Staged + unstaged + untracked files
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
4. Implement `callNewProviderAPI()` function following the pattern:
   ```typescript
   export async function callNewProviderAPI(
     apiKey: string,
     model: string,
     diff: string,
     customContext: string
   ): Promise<string>
   ```
5. Add lazy-loading case to `loadProviderModule()` switch statement in `src/services/api/index.ts`
6. Update `getApiConfig()` in `src/config/settings.ts` to handle new provider
7. Add provider defaults to `PROVIDER_DEFAULTS` in `src/config/settings.ts`
8. Add settings schema in `package.json` under `contributes.configuration.properties`
9. Create UI component in `src/webview/settings/components/NewProviderSettings.ts`
10. Update `SettingsTemplateGenerator.ts` to include new provider UI
11. Add validation logic in `src/services/api/validation.ts`
12. (Optional) Implement `fetchNewProviderModels()` function in provider module for dynamic model loading
13. (Optional) Register model loading command in `src/extension.ts` (e.g., `gitmind.loadNewProviderModels`)

### Adding a New Commit Style

1. Add style to `CommitStyle` type in `src/config/types.ts`
2. Define style configuration in `src/config/commitStyles.ts` with:
   - `id`: Unique identifier
   - `label`: Display name
   - `description`: Short description
   - `example`: Example commit message
   - `category`: 'basic' | 'standard' | 'framework' | 'emoji' | 'specialized'
   - `isPro`: Boolean (true for Pro-only styles)
3. Update `COMMIT_STYLES` constant with style details
4. Add prompt template in `src/services/api/prompts.ts` under `getCommitMessagePrompt()` switch statement
5. Add enum option to `gitmind.commitStyle.style` in `package.json`
6. Update `CommitStyleManager` (`src/services/commitStyleManager.ts`) to register the style
7. Update settings webview renderer in `src/webview/settings/components/renderers/CommitStyleRenderer.ts`
8. Test both free and Pro user experiences

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
- **`src/utils/ideDetection.ts`** - IDE environment detection (VS Code, Cursor, Windsurf)
- **`src/services/api/cursor-agent.ts`** - Cursor IDE agent integration via Language Model API
- **`src/services/api/copilot.ts`** - GitHub Copilot integration via Language Model API
- **`src/services/changelog/ChangelogService.ts`** - Changelog generation with version detection and conflict resolution
- **`src/services/changelog/generateChangelog.ts`** - Changelog command handlers
- **`package.json`** - Extension manifest, commands, settings schema, and dependencies

## Notes for Future Development

### Compatibility & Performance
- The extension maintains backward compatibility with VS Code 1.63.0+ and Node 16+
- Production builds use esbuild with tree-shaking, minification, and drop console statements
- The extension is virtualWorkspace compatible and supports untrustedWorkspaces
- The extension activates on `onStartupFinished` and `workspaceContains:.git` events
- Large diff processing uses adaptive chunking - test with repositories >10MB

### Feature Development
- Pro features are feature-flagged through subscription validation
- All webviews use VS Code's built-in theme variables for consistency
- Error messages should be actionable and provider-specific
- Telemetry is disabled by default and respects VS Code global setting
- Multi-repository support requires testing with nested Git repositories

### API & Timeouts
- API timeouts vary by operation:
  - Standard commit generation: 10 seconds
  - Commit history analysis: 3 minutes
  - Large history/changelog generation: 8 minutes
- All API calls support cancellation via AbortController
- Circuit breaker activates after 3 consecutive failures (1-minute cooldown)

### Recent Improvements (v4.6.0+)
- **Changelog Generation**: Fixed version boundary filtering to prevent commit bleed-over between versions
- **Changelog Conflict Resolution**: Added intelligent duplicate detection and overwrite control
- **Changelog maxCommits Behavior**: When version tags detected, ALL commits between tags are retrieved (maxCommits ignored) - ensures complete version history
- **Commit Styles**: Added Conventional Commits (No Scope) style for simpler workflows
- **Change Capture**: Added flexible mode to capture all changes (staged + unstaged + untracked) without staging prompt
- **Token Management**: Improved changelog token estimation with configurable commit limits (10-2500, only for non-tagged repos)
- **Emoji Policy**: Strict no-emoji policy for all changelog generation (professional documentation standards)

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **GitMind-Pro** (1445 symbols, 4617 relationships, 112 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/GitMind-Pro/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/GitMind-Pro/context` | Codebase overview, check index freshness |
| `gitnexus://repo/GitMind-Pro/clusters` | All functional areas |
| `gitnexus://repo/GitMind-Pro/processes` | All execution flows |
| `gitnexus://repo/GitMind-Pro/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
| Work in the Api area (212 symbols) | `.claude/skills/generated/api/SKILL.md` |
| Work in the Renderers area (72 symbols) | `.claude/skills/generated/renderers/SKILL.md` |
| Work in the Subscription area (71 symbols) | `.claude/skills/generated/subscription/SKILL.md` |
| Work in the Encryption area (45 symbols) | `.claude/skills/generated/encryption/SKILL.md` |
| Work in the Telemetry area (40 symbols) | `.claude/skills/generated/telemetry/SKILL.md` |
| Work in the Scripts area (38 symbols) | `.claude/skills/generated/scripts/SKILL.md` |
| Work in the Components area (37 symbols) | `.claude/skills/generated/components/SKILL.md` |
| Work in the Changelog area (34 symbols) | `.claude/skills/generated/changelog/SKILL.md` |
| Work in the Commands area (20 symbols) | `.claude/skills/generated/commands/SKILL.md` |
| Work in the Services area (19 symbols) | `.claude/skills/generated/services/SKILL.md` |
| Work in the Styles area (17 symbols) | `.claude/skills/generated/styles/SKILL.md` |
| Work in the Onboarding area (17 symbols) | `.claude/skills/generated/onboarding/SKILL.md` |
| Work in the Migration area (15 symbols) | `.claude/skills/generated/migration/SKILL.md` |
| Work in the Settings area (15 symbols) | `.claude/skills/generated/settings/SKILL.md` |
| Work in the Git area (14 symbols) | `.claude/skills/generated/git/SKILL.md` |
| Work in the Debug area (12 symbols) | `.claude/skills/generated/debug/SKILL.md` |
| Work in the Diagnostics area (11 symbols) | `.claude/skills/generated/diagnostics/SKILL.md` |
| Work in the Ai area (7 symbols) | `.claude/skills/generated/ai/SKILL.md` |
| Work in the Managers area (6 symbols) | `.claude/skills/generated/managers/SKILL.md` |
| Work in the Cluster_13 area (5 symbols) | `.claude/skills/generated/cluster-13/SKILL.md` |

<!-- gitnexus:end -->
