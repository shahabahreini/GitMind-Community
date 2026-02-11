# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Enhanced

- Added configurable API endpoint selection for Z.ai provider.
  - Users can now choose between "Regular" (general chat) and "Code Plan" (code-optimized) endpoints.
  - Default endpoint changed to "Code Plan" for better code generation performance.
  - Settings UI updated with endpoint dropdown for seamless configuration.

## v4.10.0 - 2026-02-11

### New Features

- Added new Z.ai model variants including GLM-5, GLM-4.6, GLM-4.5-X, and GLM-4.5-Flash.
  - Updated model descriptions and defaults to reflect expanded capabilities and use cases.
  - Modified type definitions and API responses to support the new model options.

- Added new command "gitmind.resetOnboardingState" to reset onboarding state.
  - Displays confirmation message after resetting state.
  - Requires restarting VS Code to see onboarding again.

### Enhanced

- Changed default Z.ai model from glm-4.5-flash to glm-4.5-air across configurations.
  - Removed deprecated model options and descriptions from the enum and UI.
  - Updated API endpoint to use the new coding-specific path for glm-4.5-air.

## v4.9.2 - 2026-02-11

### New Features

- Added device management instructions and UI for subscription management.
  - Included detailed guidance for deactivating licenses and handling lost devices.
  - Updated error messages and UI components to reflect new device management policies.

## v4.9.1 - 2026-02-11

### Enhanced

- Improved README visual presentation by adjusting image widths for better layout and readability.
  - Increased main AI provider image width for prominence.
  - Decreased advanced settings panel image width within tables.
  - Enhanced associated captions for improved clarity.

## v4.9.0 - 2026-02-10

### New Features

- Added native confirmation dialog for Pro deactivation in settings.
  - Replaced browser confirm dialog with VS Code native warning message.
  - Handles user cancellation by resetting button state and notifying webview.
- Added Z.ai provider support with API key validation and model support.
  - Included Custom API provider option for flexible API integration.
  - Updated MiniMax provider configuration with proper model defaults.

### Enhanced

- Implemented configuration caching with a 1-second TTL to improve extension responsiveness.
- Optimized changelog generation by pre-compiling regex patterns and batching 'package.json' checks.
- Refactored API providers by centralizing common logic and removing legacy functions.
- Updated default Anthropic model to 'claude-sonnet-4'.

### Technical

- Added cache invalidation for config mocks in tests to ensure consistent test results.
  - Introduced `invalidateConfigCache()` to clear the internal configuration cache.

## v4.8.5 - 2026-02-04

### Fixed

- Fixed onboarding "Don't Show Again" feature: replaced non-interactive button with proper checkbox input
- Added confirmation dialog when closing onboarding window without explicit action
- Set "Don't Show Again" as the default option in the confirmation dialog
- Improved onboarding UX with proper state persistence and theme-aware styling
- Replaced unreliable JavaScript `confirm()` with VS Code native modal dialog

## v4.8.4 - 2026-01-23

### Fixed

- **Changelog Generation (Pro)**: Fixed critical bug where setting `maxVersions = 1` would incorrectly retrieve all commits from repository start instead of only commits between the latest tag and the previous tag.
  - Root cause: Version boundary logic referenced limited tag subset instead of full sorted tag list
  - Impact: Changelog generation with `maxVersions = 1` would include thousands of commits instead of just the commits for that specific version
  - Solution: Modified `getCommitsByVersion()` to reference the full `sortedTags` array for previous version boundary calculation, ensuring proper commit range filtering regardless of `maxVersions` setting

### New Features

- **Z.ai (GLM) Provider Integration**: Added support for Z.ai (GLM) models.

### Implementation Details

- Changed `vscode` API variable declaration from `const` to `var` in `settingsManager.ts` to ensure compatibility with older JavaScript environments.

## v4.8.3 - 2026-01-23

### Enhanced

- **Grok API Integration**: Migrated API calls from the `/chat/completions` endpoint to the `/responses` endpoint to align with xAI recommendations.
  - Updated request body parameters to match the new API specification, including `input` and `max_output_tokens`
  - Introduced `store: false` to ensure requests are stateless and privacy-friendly
  - Implemented new parsing logic to correctly extract text from the updated response structure
- **Gemini Model Support**: Upgraded default models to the 2.5 series.
  - Updated default model to `gemini-2.5-flash` and removed Gemini 2.0 Flash and Flash-Lite options
  - Added model aliases to map legacy 2.0 selections to 2.5 versions for backward compatibility
  - Increased token limits to 65,536 and improved model capabilities

## v4.8.2 - 2026-01-14

### New Features

- **Z.ai (GLM) Provider Integration**: Added support for Z.ai (GLM) models.
  - Full support for GLM-4.7, 4.6, 4.5, and efficient Flash/Air variants.
  - Comprehensive UI integration with dedicated settings panel and offline model list.
  - Robust error handling with detailed guidance for authentication, rate limits, and account status.

## v4.8.1 - 2026-01-14

### Fixed

- MiniMax API setup check now treats insufficient balance as a warning (API key valid) instead of a connection failure.
- Ollama API setup check now validates connectivity independent of model availability, includes detected Ollama version in results, and improves troubleshooting guidance with the models library link.

## v4.8.0 - 2026-01-14

### New Features

- Added type-safe commit style selection and a debug toggle.

### Enhanced

- Added advanced model configuration controls for AI generation (Pro): temperature, top-p, top-k, and max tokens.
- Improved Gemini model handling with alias resolution and model-aware validation.
- Improved settings UX for advanced model parameters so values reflect enablement toggles and disabled values are preserved.
- Implemented comprehensive API request/response logging across providers with redaction of sensitive data.
- Hardened logging with sanitization and serialization limits (circular references, depth limits, and truncation).

### Fixed

- Enforced Anthropic parameter constraints to avoid invalid combinations and better align with API requirements.

## v4.7.4 - 2026-01-14

### Enhanced

- Updated project version for release and ensured version consistency across files.
- Removed deprecated `top_p` parameter from Anthropic requests to align with the current API specification.

## v4.7.3 - 2026-01-13

### Enhanced

- **Performance Optimization**: Reduced AI temperature settings for more deterministic and consistent commit message outputs.
- **Provider Architecture**: Refactored AI providers to use BaseAIProvider class for better code maintainability and consistency.

### Fixed

- **Hugging Face API**: Improved error messages with actionable guidance for better troubleshooting.
- **Git Performance**: Excluded ignored directories from git repository search to improve performance.

### Removed

- **Code Cleanup**: Removed deprecated Windsurf agent and outdated AI models.

## v4.7.2 - 2026-01-13

### New Features (Pro)

- Added **Target Commit Language** feature for multilingual commit messages.
  - Introduced support for **60 languages** across all major language families globally.
  - AI generates commit messages using professional developer terminology widely accepted in the selected language.
  - Maintains commit message format and structure in the target language for consistency.
  - Perfect for international development teams and localized projects.
  - **Searchable Language Dropdown**: Click the language selector to reveal a search input. Type to filter languages instantly (e.g., "span" for Spanish, "русс" for Russian).
  - Supported languages:
    - **European**: English, Spanish, French, German, Italian, Portuguese, Russian, Polish, Dutch, Swedish, Danish, Norwegian, Finnish, Czech, Romanian, Hungarian, Bulgarian, Croatian, Slovak, Lithuanian, Latvian, Estonian, Greek, Albanian, Armenian
    - **Asian**: Chinese, Japanese, Korean, Hindi, Bengali, Urdu, Marathi, Telugu, Tamil, Punjabi, Kannada, Gujarati, Bhojpuri, Vietnamese, Thai, Turkish, Persian, Javanese, Tagalog, Indonesian, Malay, Kazakh, Uzbek, Azerbaijani
    - **African**: Arabic, Amharic, Hausa, Yoruba, Igbo, Oromo, Somali
    - **Caucasus & Central Asia**: Georgian
  - Added new configuration setting `gitmind.commit.targetLanguage` with searchable dropdown in Pro Features Settings UI.
  - Updated prompt generation to include language-specific instructions for accurate translation.
  - Added type definitions and configuration management for target language selection.
  - Fixed persistence issue where language selection would reset on save (now properly saved to VS Code configuration).

### Fixed

- **Target Commit Language Persistence**: Fixed issue where the selected target language would revert to English after clicking Save. Now properly persists to workspace configuration across sessions.

## v4.7.0 - 2026-01-07

### New Features

- Added manual commit limit option for changelog generation.
  - Introduced a new setting to manually cap the number of commits considered for changelog generation.
  - Added an "Unreleased" section showing changes since the last tagged version.
  - Implemented logic to respect the manual commit limit when enabled.
  - Updated UI to include a toggle for enabling/disabling the manual commit limit.

- Added intelligent version conflict resolution during changelog regeneration.
  - Extracted all versions from the existing changelog with full content.
  - Detected duplicate versions and added an overwrite control setting (`gitmind.pro.changelog.overwriteExisting`).
  - Merged new and existing changelog content intelligently while preserving existing versions in safe mode (default).

- Added capture all changes option in settings.
  - Introduced a new configuration option to capture staged, unstaged, and untracked changes.
  - Updated diff generation logic to include all changes when the option is enabled.
  - Added a UI toggle in settings for enabling/disabling the feature.
  - Updated settings synchronization to include the new option while maintaining backward compatibility.

- Added Conventional Commits no-scope option.
  - Introduced a new commit style option for Conventional Commits without scopes.
  - Provided a simplified version of the Conventional Commits standard for projects that don't require scopes.
  - Updated configuration, prompts, and UI elements to support the new style.

### Enhanced

- Improved Gemini API error handling and validation.
  - Added detailed error handling for Gemini API requests, including specific messages for rate limits, authentication failures, and access restrictions.
  - Enhanced API key validation to return structured results with success status, error messages, and troubleshooting tips.
  - Improved user feedback by providing actionable guidance for common API issues.

### Technical

- Enforced consistent commit body line limits.
  - Added `clampCommitBodyDescription` function to truncate commit descriptions based on `maxBodyLines` configuration.
  - Updated `processCommitMessage` to use clamped bullet points for consistent body length.
  - Introduced `clampBulletPoints` function to limit the number of bullet points in commit bodies according to configuration.

## v4.6.0 - 2026-01-07

### New Features

- Added extension version and footer metadata to the settings UI.
  - Included a footer section displaying the extension version, author attribution, and a link for reporting issues/improvements.
  - Enhanced transparency by showing the current version in use.
  - Provided direct access to GitHub issues for user feedback.
  - Improved CSS styling for the footer with responsive layout and theming.

- Added a new configuration option to capture staged, unstaged, and untracked changes.
  - Updated diff generation logic to include all changes when the option is enabled.
  - Added a UI toggle in settings for enabling/disabling the feature.
  - Updated settings synchronization to include the new option.
  - Maintained backward compatibility with existing behavior when disabled.

- Added a new commit style option for Conventional Commits without scopes.
  - Provided a simplified version of the Conventional Commits standard for projects that don't require scopes.
  - Included updated configuration, prompts, and UI elements to support the new style.

- Improved Gemini API error handling and validation.
  - Added detailed error handling for Gemini API requests, including specific messages for rate limits, authentication failures, and access restrictions.
  - Enhanced API key validation to return structured results with success status, error messages, and troubleshooting tips.
  - Improved user feedback by providing actionable guidance for common API issues.

### Enhanced

- Enforced consistent commit body line limits.
  - Added `clampCommitBodyDescription` function to truncate commit descriptions based on `maxBodyLines` configuration.
  - Updated `processCommitMessage` to use clamped bullet points for consistent body length.
  - Introduced `clampBulletPoints` function to limit the number of bullet points in commit bodies according to configuration.

## v4.5.4 - 2025-12-21

### New Features

- Added MiniMax provider integration using the Anthropic-compatible Text API.
  - Exposes text-generation models only: `MiniMax-M2` and `MiniMax-M2-Stable`.
  - Added settings, validation, and model loading support across the extension and settings UI.
  - Updated the onboarding form to new UI/UX.

### Fixed

- Fixed onboarding "Don't show this again" action to reliably close the onboarding webview and show the confirmation message.

## v4.5.3 - 2025-11-20

### New Features

- Updated Copilot configuration to use "auto" as the default model for a more seamless user experience.
- Refactored the `callCopilotAPI` function to correctly map internal model names (e.g., "raptor-mini") to their corresponding API families for improved model compatibility.
- Implemented OpenAI model fetching and settings to display available OpenAI models within the extension's settings.
  - Integrated `fetchOpenAIModels` to query the OpenAI API for compatible chat models.
  - Updated `MODEL_CONFIGS` in `openai.ts` with current and upcoming OpenAI models, including GPT-5 and GPT-4o series, and reasoning models.
- Implemented unsaved changes indicator and save state management in the settings UI.
  - Introduced a visual indicator for unsaved changes, including a pulsing dot on the "Save Settings" button and a badge in the button group.
  - Implemented logic to track changes to settings inputs and update the UI state accordingly.
- Enabled dynamic model loading for AI providers (HuggingFace, OpenRouter, Together, Ollama) to fetch up-to-date model lists directly from providers.

### Enhanced

- Prevented Flash of Unstyled Content (FOUC) in the settings page by introducing critical CSS and inline scripts to hide content until styles are loaded.
- Updated commit tab button styles to improve contrast, visual hierarchy, and user feedback.
- Modernized UI elements with cleaner CSS across various components, enhancing visual hierarchy and user experience.

### Fixed

- Enhanced error handling for missing Copilot models in settings, prompting the user to select a model if none is configured.

## v4.5.2 - 2025-11-20

### New Features

- Integrated OpenAI model fetching and settings to display available OpenAI models within the extension's settings.
  - Implemented `fetchOpenAIModels` to query the OpenAI API for compatible chat models.
  - Updated `MODEL_CONFIGS` in `openai.ts` with current and upcoming OpenAI models.
- Implemented unsaved changes indicator and save state management in the settings UI.
  - Introduced a visual indicator for unsaved changes on the "Save Settings" button and badge.
  - Added logic to track changes and update UI state accordingly.
- Added dynamic model loading for DeepSeek, allowing retrieval of available models directly from the DeepSeek API.
  - Implemented `fetchDeepSeekModels` to dynamically retrieve models.
  - Integrated DeepSeek into the model loading mechanism and added a "Load Available Models" button.
- Enabled dynamic model loading for AI providers (HuggingFace, OpenRouter, Together, Ollama) to fetch up-to-date model lists directly from providers.
  - Refactored `ProviderConfig` to use `defaultOptions` and `loadCommand` for model dropdowns.
  - Integrated providers into `ScriptManager` for dynamic model loading.

### Enhanced

- Prevented Flash of Unstyled Content (FOUC) in the settings page by introducing critical CSS and inline scripts.
- Updated commit tab button styles to improve contrast, visual hierarchy, and user feedback.
- Modernized UI elements with cleaner CSS across various components, enhancing visual hierarchy and user experience.

### Technical

- Lazy loaded API provider modules, reducing initial bundle size by approximately 200-300KB and improving startup performance.
- Removed `node-fetch` dependency and `src/utils/networkRetry.ts` as part of API provider optimization.

### Other

- Documented v4.5.1 release notes in `CHANGELOG.md`.

## v4.5.1 - 2025-11-19

### New Features

- Enabled dynamic model loading for AI providers (HuggingFace, OpenRouter, Together, Ollama) to fetch up-to-date model lists directly from providers.
- Implemented dynamic model loading for DeepSeek, allowing retrieval of available models directly from the DeepSeek API.
  - Added a "Load Available Models" button to the DeepSeek settings UI.
- Added dynamic detection of available GitHub Copilot models within VS Code.
  - Expanded supported GitHub Copilot model families and enabled auto-selection through updated settings UI and configuration.
- Implemented connection validation for custom API endpoints, providing immediate feedback on configuration and supporting various authentication types.
  - Provided specific troubleshooting guidance for common HTTP errors and timeouts during custom API connection tests.

### Enhanced

- Reduced initial application bundle size by approximately 200-300KB by implementing lazy loading for API provider modules.
- Improved API key validation to display user-friendly error messages and reset UI state on failure.
- Redesigned model loading buttons for Hugging Face, OpenRouter, and Together AI into inline refresh icons for a cleaner UI.
- Streamlined the model loading mechanism for AI providers by dynamically constructing commands with provider-specific parameters.
- Updated Ollama settings UI with refined dropdown display logic and clearer element IDs.
- Refactored custom API connection test results to use structured HTML and new CSS styles for improved readability and visual organization.

### Technical

- Removed `node-fetch` dependency and `src/utils/networkRetry.ts` as part of API provider optimization.
- Excluded additional development environment and tooling files from VS Code indexing for improved IDE performance and reduced clutter.
- Adjusted `npm` log level from `warn` to `error` to suppress non-critical warnings during build processes.
- Configured `yarn` to ignore engine checks for improved VS Code extension compatibility.
- Updated build scripts and npm configuration to suppress verbose warnings during package creation.

### Other

- Enhanced README tables with consistent column alignment and improved readability.

## v4.5.0 - 2025-11-18

### New Features

- **Custom API Provider (Pro)**: Added support for custom API endpoints, enabling integration with private cloud AI models or other compatible LLM APIs
  - **Flexible Authentication**: Support for multiple authentication methods (Bearer token, API Key, Basic Auth, or no authentication)
  - **Configurable Request/Response**: Customizable JSON templates for request bodies and response parsing with placeholder support (`{{model}}`, `{{prompt}}`)
  - **Connection Testing**: Built-in connection test functionality to validate API configuration before use
  - **Secure Token Storage**: Authentication credentials stored securely using VS Code's secure storage
  - **Enhanced Settings UI**: User-friendly interface for managing custom API configuration with real-time validation
  - **Comprehensive Documentation**: Added detailed [Custom API Integration Guide](docs/custom-api-guide.md) with examples for OpenAI-compatible and custom LLM APIs

### Enhanced

- **Custom API Response Parsing**: Improved response parsing logic to handle various API response formats
- **Settings Validation**: Enhanced validation for custom provider authentication token field recognition
- **Test Result Display**: Improved visual feedback for custom API connection test results in settings UI

### Technical

- **Secure Token Handling**: Implemented secure authentication token handling with encryption support for Pro users
- **API Configuration**: Enhanced API provider configuration system to support custom endpoint definitions
- **Error Handling**: Improved error handling and user guidance for custom API setup and troubleshooting

## v4.4.0 - 2025-11-14

### New Features

- **Enhanced AI Model Support**: Added support for latest AI models across multiple providers
  - **OpenAI**: Added GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, o3, and o4-mini models
  - **Google Gemini**: Added Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash-Lite, Gemini 2.0 Flash, and Gemini 2.0 Flash-Lite models with enhanced token limits (up to 65,536 tokens)
  - **Grok**: Added Grok 3, Grok 3 Mini, and enhanced Grok 2 model variants including Vision, Turbo, and Fast versions

### Enhanced

- **Settings UI Improvements**: Enhanced webview message handling and state management for better reliability
- **Model Configuration**: Improved model selection interface with updated model descriptions and capabilities

### Technical

- **Type Safety**: Enhanced TypeScript interfaces for better type safety across the extension
- **Message Handler**: Improved MessageHandler implementation for more robust webview communication

## v4.3.2 - 2025-10-20

### Fixed

- **Commit History Analysis UI**: Fixed loading state issue where button remained in loading state after receiving results
  - **Consistent State Management**: Resolved inconsistency between `setButtonLoadingState` (uses textContent) and ProFeatureRenderer reset logic (uses innerHTML)
  - **Button State Reset**: Updated to use consistent `setButtonLoadingState` function for both setting and resetting button state
  - **UI Consistency**: Updated button HTML to match expected format with proper icon handling

### Enhanced

- **Test Coverage**: Improved test suite reliability and coverage
  - **Settings UI Tests**: Enhanced timeout protection for Settings webview state preservation tests
  - **Pro Features Tests**: Added timeout protection for subscription management tests
  - **Test Stability**: Implemented Promise.race pattern to prevent test hanging on async operations

### Technical

- **Test Infrastructure**: Enhanced test environment stability with multi-layer timeout protection
- **Error Handling**: Improved error handling in test scenarios with proper TypeScript type casting

## v4.3.1 - 2025-10-18

### New Features

- **Changelog Version Limit**: Added `pro.changelog.maxVersions` setting to limit the number of recent versions processed in changelog generation.
- **Git History Statistics Preview**: Introduced a GitHistoryAnalyzer service and "Preview Stats" feature to estimate token usage and data quality for AI-powered features.
- **Configurable Changelog Version Order**: Added a setting to control the version order in generated changelogs, allowing users to select 'newest-first' or 'oldest-first'.

### Enhanced

- **AI Changelog Generation**: Increased the maximum commit limit for history analysis and changelogs to 2500.
- **AI Changelog Generation**: Enhanced the AI prompt and added validation for accurate multi-version changelogs.

### Other

- Updated documentation for AI-powered changelog generation and Git stats preview features.
- Updated feature descriptions and added screenshots to the README.
- Updated provider list to include Grok, Perplexity, and Mistral.

## v4.3.0 - 2025-10-18

### New Features

- **AI-Powered Changelog Generation (Pro)**: Introduced AI-powered changelog generation from Git commit history.
  - **Policy-Aware Generation**: Implemented changelog structure analysis to preserve existing formatting, categories, and style.
  - **Intelligent Version Detection**: Added automatic version detection from git tags, commit messages, and `package.json`.
  - **User Configuration**: Included settings to configure the maximum number of commits for analysis and to group changes by version.
- **Git History Statistics Preview**: Added a "Preview Stats" feature for Git history analysis.
  - **Token Usage Estimation**: Enabled users to estimate token usage and assess data quality before running AI-powered features.
  - **Informed Analysis**: Provided insights into repository statistics to help guide the analysis process.

### Fixed

- **Diagnostics Modal Improvement**: Removed the cancel button from the diagnostics information modal.
  - **Simplified User Flow**: Streamlined the user experience by removing an unnecessary action.
  - **Reduced User Confusion**: Prevented potential confusion by focusing the modal on its primary informational purpose.

### Technical

- **Expanded Test Coverage**: Added comprehensive test suites for new features to improve stability and reduce regression risk.
  - **New Test Suites**: Created dedicated test files including `changelogService.test.ts`, `diffProcessor.test.ts`, and `tokenCounter.test.ts`.
  - **Increased Coverage**: Achieved over 70% overall test coverage, with 100% coverage on critical paths.
  - **Extensive Testing**: Added over 140 new unit tests covering version detection, policy analysis, and processing edge cases.

### Breaking Changes

- The AI-Powered Changelog Generation feature now requires a GitMind Pro subscription.

## v4.2.3 - 2025-10-17

### Fixed

- **Diagnostics UI Improvement**: Removed cancel button from diagnostics info modal
  - **Simplified User Flow**: Eliminated the 'Cancel' button from diagnostics information modal to streamline user experience
  - **Reduced Confusion**: Removed unnecessary action option since the only logical step is to proceed
  - **Cleaner Interface**: Enhanced modal clarity by focusing on the primary action (proceed/close)
  - **Prevented Unintended Actions**: Eliminated potential confusion or accidental cancellation during diagnostics review

### Technical

- Updated DiagnosticsWebview component to remove cancel button from modal UI
- Streamlined modal HTML template for better user experience
- Enhanced modal button layout for improved clarity

## v4.2.2 - 2025-08-31

### Enhanced

- **Commit History Analysis Optimization**: Streamlined commit analysis system for improved performance and reliability
  - **Prompt Optimization**: Reduced analysis prompt size by 75% while preserving key metrics and actionable guidance
  - **Focused Analysis**: Condensed from 200+ lines to ~70 lines with targeted sections for statistics, assessment, and recommendations
  - **Extended Timeouts**: Increased API timeouts for commit analysis (3 minutes standard, 8 minutes for large histories)
  - **Better Reliability**: Enhanced timeout handling for comprehensive reports without token limits
  - **Practical Insights**: Streamlined output emphasizing actionable improvements over comprehensive documentation

- **Large Diff Processing Overhaul (Pro)**: Robust, token-aware processing for massive diffs
  - **Adaptive Chunk Splitting**: Iteratively splits diffs using `DiffProcessor.splitDiffIntoChunks()` with shrinking budgets and safe fallbacks for outlier files
  - **Token-Aware Prompt Validation**: Uses `validatePromptLength()` with provider-specific limits (lowercase provider keys) to ensure safe prompts per model
  - **Concurrency Control**: Worker-pool processing with configurable max concurrency for faster throughput on many chunks
  - **Reliable Retries**: Exponential backoff with jitter for transient errors (rate limits, network, 5xx); skips non-retryable token/context errors
  - **Cancellation Support**: Honors VS Code cancellation tokens at every stage for immediate stop
  - **Deterministic Merging**: Preserves order and merges chunk results via `DiffProcessor.mergeChunkResults()` for the final concise commit message
  - **Progress Reporting**: Live progress updates with per-chunk completion counts and percentages in VS Code UI
  - **Diagnostics & Telemetry**: Detailed debug logging (chunk sizes, estimated tokens, validation results) and telemetry for errors and retries

### Technical

- **API Timeout Configuration**: Updated timeout values for commit history analysis operations
- **Prompt Engineering**: Optimized prompt structure for faster processing while maintaining analysis quality
- **Performance Improvements**: Reduced memory usage and processing time for commit analysis workflows

## v4.2.1 - 2025-01-30

### Enhanced

- **Settings UI Style Architecture Refactoring**: Complete overhaul of webview settings UI styling system
  - **External Style Files**: Moved all hardcoded inline styles to external `.css.ts` files in the styles folder
  - **Theme Compatibility**: Improved light/dark theme support for all UI dialogs and components
  - **Encryption Status Report**: Refactored dialog styles for full theme compatibility
  - **Detailed Status Modal**: Extracted modal styles to external files for consistency
  - **Toast Notifications**: Moved notification styles to external CSS for maintainability
  - **Dynamic Style Loading**: Implemented style injection functions for on-demand loading
  - **Code Maintainability**: Eliminated hardcoded styles throughout the webview settings system

### Technical

- **Style Management**: Created dedicated style files for encryption status, detailed status modals, and toast notifications
- **Build Optimization**: Enhanced CSS loading patterns with dynamic style injection
- **Type Safety**: Added proper imports for external style functions
- **Code Organization**: Improved separation of concerns between logic and presentation layers

## v4.2.0 - 2025-01-30

### New Features

- **Multi-Repository Support**: Complete overhaul of Git repository handling for multi-repository workspaces
  - **Repository-Specific Buttons**: Each repository in VS Code Source Control panel now has independent GitMind buttons
  - **Context-Aware Operations**: Commands automatically detect which repository button was clicked and operate on the correct repository
  - **Enhanced Repository Discovery**: Robust repository detection that searches both up the directory tree (parent folders) and down into subdirectories
  - **Repository-Specific Diagnostics**: Request diagnostics now display the specific repository name being processed
  - **Independent Git Context**: Each repository maintains its own Git context, diff analysis, and commit message handling

### Enhanced

- **Improved Git Repository Detection**: Enhanced `validateGitRepository` function with comprehensive search capabilities
  - **Multi-Workspace Support**: Tries all workspace folders when multiple are open
  - **VS Code Git API Integration**: Matches discovered repositories with VS Code's tracked repositories
  - **Subfolder Repository Support**: Works regardless of whether root folder or subfolder is opened
- **Enhanced Request Diagnostics**: Repository-specific information display
  - **Repository Name Display**: Shows clean repository name instead of full path
  - **Context Awareness**: Diagnostics automatically detect and display the correct repository being processed
  - **Multi-Repository Transparency**: Clear indication of which repository is being used for commit generation

- **Optimized Extension Build**: Reduced bundle size and improved performance
  - **Telemetry Service Refactoring**: Lazy-loaded applicationinsights to reduce bundle size while preserving functionality
  - **Build Optimization**: Enhanced esbuild configuration with tree shaking and minification
  - **Security Improvements**: Resolved false positive security warnings for SendGrid constants

### Technical

- **Repository Service**: Enhanced repository discovery with comprehensive search algorithms
- **Command Architecture**: Updated command handlers to accept and utilize repository context from VS Code SCM
- **API Integration**: Modified commit message generation to pass repository-specific context through the entire call chain
- **Type Safety**: Extended TypeScript interfaces for repository-specific operations
- **Bundle Optimization**: Reduced extension bundle size from 5.57 MB to ~1.1 MB

### Fixed

- **Multi-Repository Button Handling**: Fixed issue where all repository buttons used the first repository instead of the clicked one
- **Repository Context Loss**: Resolved context switching issues in multi-repository workspaces
- **Diagnostics Accuracy**: Fixed repository information display in request diagnostics

## v4.1.0 - 2025-01-XX

### New Features

- **Gitmoji Support (Pro Feature)**: Enhanced commit messages with emoji integration
  - **Toggle Control**: Enable/disable gitmoji for each commit style individually
  - **Custom Emoji Mappings**: Customize emoji mappings for different commit types (feat, fix, docs, etc.)
  - **Flexible Placement**: Choose emoji placement in summary line, body, or both
  - **Emoji Reference Guide**: Built-in webview with searchable emoji reference and descriptions
  - **Pro Restriction**: Feature restricted to Pro users with proper license validation
  - **Default Mappings**: Comprehensive default emoji mappings for common commit types:
    - ✨ feat (new features)
    - 🐛 fix (bug fixes)
    - 📚 docs (documentation)
    - 🎨 style (formatting)
    - ♻️ refactor (code restructuring)
    - ✅ test (adding tests)
    - 🔧 chore (maintenance)
    - ⚡ perf (performance improvements)
    - 👷 ci (CI/CD changes)
    - 📦 build (build system changes)

### Enhanced

- **Settings UI**: Added gitmoji toggle controls and placement options to commit style renderer
- **Custom Dialog**: New emoji customization dialog with quick pick interface
- **Pro Integration**: Seamless integration with existing Pro license validation system

### Technical

- **GitmojiService**: New singleton service managing emoji mappings and commit message processing
- **Type Safety**: Extended TypeScript interfaces for gitmoji configuration
- **Settings Schema**: Added new configuration options in package.json with Pro feature flags

## v4.0.4 - 2025-08-04

### Enhanced

- **Visual Documentation Improvements**: Added professional screenshot grid to README for VS Code marketplace presentation
  - **Feature Showcase Grid**: Implemented 3x3 responsive image grid displaying core extension capabilities
  - **Professional Layout**: Organized screenshots with descriptive captions highlighting key features:
    - AI-Powered Commit Generation workflow
    - 13 AI Provider Support interface
    - Advanced Settings Panel configuration
    - Professional Commit Styles selection
    - Native Git Integration workflow
    - Dynamic Model Selection interface
    - Comprehensive Diagnostics Dashboard
  - **Marketplace Optimization**: Enhanced visual appeal for VS Code marketplace listing to better showcase extension capabilities
  - **User Experience**: Improved documentation with immediate visual demonstration of features following installation instructions

### Technical

- Added HTML table-based grid layout with responsive design for optimal viewing across different screen sizes
- Implemented proper image sizing (300px individual, 600px dashboard) and center alignment for professional presentation
- Enhanced README structure with strategic screenshot placement to maximize user engagement and feature comprehension

## v4.0.3 - 2025-07-31

### Enhanced

- **Redesigned Subscription Interface**: Completely restructured subscription and Pro features management for improved user experience
  - **New "Get Pro" Tab**: Created dedicated subscription tab with comprehensive subscription management, Pro activation, and upgrade workflow
  - **Streamlined Pro Features Tab**: Removed subscription and activation sections from Pro Features, focusing purely on feature configuration
  - **Centralized Navigation**: All upgrade buttons now properly navigate users to the new subscription tab for consistent user journey
  - **Enhanced UI Components**: New SubscriptionRenderer component with modern card-based layout and improved visual hierarchy

- **Improved Settings Organization**: Better separation of concerns across settings tabs
  - **Model Settings**: Dedicated tab for AI provider and model configuration
  - **Free Features**: Core extension features available to all users
  - **Commit Styles**: Comprehensive commit message style selection and reference
  - **Pro Features**: Advanced feature configuration for Pro users only
  - **Get Pro**: Complete subscription management and activation workflow

- **Enhanced User Onboarding**: Clearer upgrade path with dedicated subscription interface
  - **Subscription Plans**: Detailed feature comparison and purchase options
  - **Email Management**: Streamlined subscription email configuration and validation
  - **License Activation**: Unified activation workflow for both license keys and order IDs
  - **Status Indicators**: Clear visual feedback for subscription and activation status

### Fixed

- **Improved Error Handling for License Activation**: Enhanced error message formatting for failed Pro activation attempts
  - **Better HTTP Error Parsing**: Now properly extracts meaningful error messages from HTTP responses instead of showing raw JSON
  - **Clearer Error Messages**: Specific guidance for common issues like "license key not found" with actionable troubleshooting steps
  - **Consistent Error Formatting**: Unified error message format across license key and order ID activation methods
  - **User-Friendly Display**: Error messages are now truncated appropriately and provide clear next steps for resolution

- **Windows Webview Compatibility**: Fixed "Error loading webview: Could not register service worker" issue on Windows systems
  - **Service Worker Prevention**: Added service worker registration interception to prevent Windows-specific InvalidStateError
  - **Enhanced CSP Configuration**: Updated Content Security Policy to properly support webview functionality across platforms
  - **Error Handling**: Added global error handlers to gracefully handle service worker-related errors without breaking the UI
  - **Context Retention**: Added retainContextWhenHidden option to improve webview stability on Windows

- **Fixed Duplicate Modal Issue**: Resolved "Buy GitMind Pro" button showing two modals sequentially
  - **Eliminated Duplicate Event Handlers**: Removed conflicting event handlers for subscription buttons in ScriptManager
  - **Streamlined Event Flow**: Unified subscription button handling through eventHandlers.ts for consistent behavior
  - **Email Validation**: Ensured subscription email is properly saved before initiating subscription process

### Technical

- Added comprehensive SubscriptionRenderer component with modern CSS styling
- Enhanced ScriptManager with centralized button navigation handlers
- Updated ProFeaturesSettings to include new subscription tab structure
- Improved event handling system for upgrade and subscription buttons
- Added subscription-specific CSS module with responsive design
- Enhanced error parsing in ProActivationService for HTTP responses with JSON payloads
- Fixed Windows webview compatibility with service worker error prevention and improved CSP configuration
- Added webview context retention and enhanced error handling for cross-platform stability
- Maintained backward compatibility while modernizing interface architecture

## v4.0.2 - 2025-07-23

### Fixed

- **Critical Buffer Overflow Issue**: Resolved "stdout maxBuffer length exceeded" error that occurred when processing large git diffs or commit histories
  - **Enhanced Git Command Execution**: Increased buffer limits from default 1MB to 10MB for git operations handling large repositories
  - **Improved Large Repository Support**: Extension now handles repositories with extensive commit histories and large file changes without buffer overflow errors
  - **Cross-Provider Compatibility**: Fixed buffer issues affecting all AI providers when processing large git outputs

### Technical

- Updated `child_process.exec()` calls in `CommitHistoryLearningService.ts`, `gitCommands.ts`, and `repository.ts` with appropriate `maxBuffer` settings
- Added 10MB buffer limit for git diff operations and commit history analysis
- Added 1MB buffer limit for git repository validation commands
- Enhanced error handling to prevent extension crashes on large git operations

## v4.0.1 - 2025-07-22

### Changed

- **Default Commit Style**: Updated the default commit style to "Conventional Commits" across the extension. This ensures a consistent and industry-standard commit message format for all users.
- **Settings and UI Updates**: Adjusted fallback values and default configurations in settings, scripts, and UI components to reflect the new default commit style.

## v4.0.0 - 2025-07-20

### Added

- **GitMind Pro Features and Subscription Management**: Introduces GitMind Pro, enabling secure API key storage via encryption. Pro features are now managed through a robust **Lemon Squeezy subscription system**, providing:
  - Email-based subscription activation and management within the settings UI.
  - Automatic handling of transitions between Pro and Free tiers, including disabling Pro features like encryption and migrating API keys to plain text storage.
  - Secure storage for detailed subscription status, ensuring consistent UI and feature availability.
  - Integration with Lemon Squeezy API for backend license deactivation.
  - New Pro feature settings to configure custom commit body and summary line limits.
- **Comprehensive Commit Message Styles**: Adds extensive support for multiple commit message styles (e.g., Conventional Commits, Gitmoji, Semantic Release, Karma, Linux, jQuery), allowing users to select their preferred convention. This includes a redesigned settings UI with a tabbed interface, detailed reference guides, and inline examples for each style, enhancing clarity and user experience. Pro users benefit from enhanced visual distinction for premium styles.
- **New AI Model Providers**: Adds full support for new **Together AI** and **OpenRouter** API providers, alongside enhanced integration for **Cohere** models, expanding your AI model choices.
- **Custom API Settings**: Adds dedicated settings for configuring and testing custom API endpoints, supporting various authentication methods.
- **Commit History Analysis**: Adds a new feature, configurable in settings, to provide deeper insights into your commit patterns.

### Changed

- **Redesigned Settings User Interface**: The settings panel and Pro Features section have been significantly enhanced with a modern, compact, and consistent design. This includes:
  - Refined layouts, spacing, and font sizes for improved readability.
  - Standardized toggle switches, input fields, and button styles.
  - Enhanced status banners with provider-specific styles, displaying user type, API provider, and selected model.
  - Improved visual feedback for various UI elements, including password/copy toggle buttons and status values.
  - Introduced custom tooltips for better context and guidance.
  - Updated toast notifications to be more minimalistic and theme-integrated.
  - All UI elements are now more responsive, adapting better to smaller screens.
- **Improved AI Model Selection Experience**: The settings UI for AI models has been significantly overhauled for better usability and flexibility:
  - Introduces dynamic model loading for **Ollama** and **Mistral**, allowing users to fetch available models directly from their servers.
  - Enhances **Hugging Face** model selection with a dynamic, searchable input field, improving model discovery and validation.
  - Implements measures to prevent duplicate model loading and caches API keys for improved performance and stability.
  - API key retrieval for model loading now allows selecting models for any provider with a valid API key, regardless of the currently active provider.
  - Adds Pro license validation for model loading buttons, indicating Pro-only features.
- **Secure API Key Management and Copy**: Introduces secure storage and management of API and license keys using VS Code's SecretStorage. This includes:
  - Automatic migration of existing keys to secure storage.
  - An "[ENCRYPTED]" placeholder in settings to indicate secure storage.
  - A new "show/hide" toggle for API key input fields, which intelligently prevents revealing encrypted keys.
  - Secure copy functionality for API keys, with visual feedback ("✓ Copied" hint) and tooltips, ensuring encrypted keys are not directly copied.
  - Enhanced security checks to prevent unauthorized copying of encrypted data, requiring a valid Pro license.
- **Pro Feature Settings UI Enhancements**: License key and order ID inputs are now masked and disabled when a valid Pro license is active. Activation buttons are automatically disabled for Pro users, preventing re-activation attempts.
- **Branding**: Completed the rebranding from "AI Commit Assistant" to **GitMind**, including updates to user-facing strings, commands, and a comprehensive cleanup of legacy settings.
- **Commit History Analysis Enhancements**: Enhances commit history analysis by adding timeout configurations for API requests, refining the analysis prompt for clearer instructions and improved insights, and correctly handling multi-line commit messages.
- **Large Diff Handling**: Implements efficient handling of large diffs through chunk processing, enhancing performance when generating messages for large code changes.
- **Telemetry**: Updates telemetry settings to be disabled by default, enhancing user privacy.
- **Gemini Model Configuration**: Reduces `maxOutputTokens` to 350 for various Gemini models to ensure consistent output length and improve resource utilization.
- **Subscription Refresh**: Enhances subscription refresh functionality, allowing silent background refreshes and sending detailed subscription status and error messages directly to the settings webview.
- **Downgrade Notifications**: Simplifies downgrade notification messages for improved clarity and conciseness.
- **Settings Persistence**: Persists the active settings tab using local storage, ensuring the last viewed tab is restored on subsequent visits.

### Fixed

- **API Key Encryption**: Fixes an issue where empty plain text API keys could be incorrectly migrated or display placeholders when encryption is active.
- **Pro Downgrade API Keys**: Restores API keys and ensures full UI refresh upon Pro downgrade, correctly displaying plain-text keys and re-enabling visibility/copy functionalities. Encryption is now automatically disabled upon deactivation of Pro features.
- **UI Stability**: Resolves issues where settings webview UI was disrupted during updates, especially when dropdowns were open, by preserving UI state during background operations.
- **Hugging Face Dropdown Usability**: Improves Hugging Face model dropdown usability by implementing debouncing for search, refining blur handling, and ensuring toast notifications are shown correctly.
- **UI Layout**: Resolves z-index conflicts, ensuring tooltips, status dialogs, and dropdown menus consistently render on top of other UI elements.
- **Toggle Visibility**: Increases opacity for disabled toggle states for improved visibility.

### Removed

- Removes the "Deactivate Pro" button and associated UI from the settings webview, streamlining Pro features management.

## v3.5.7 - 2025-06-30

### New Features

- Added estimatedTokens calculation to context in `generateCommitMessage`.
- Added provider-specific model suggestions in `APIErrorHandler`.
- Added command execution handling in `SettingsWebviewProvider`.
- Added dialog update and message handling functions in `apiManager.ts`.
- Added status message and details styling in `main.css.ts`.

### Improvements

- Improved debug logging for provider name retrieval in `getProviderName`.
- Improved error context handling in `APIErrorHandler`.
- Improved API check and rate limits result handling in `settingsManager.ts`.

### Bug Fixes

- Enhanced error handling and logging in `callMistralAPI`.

### Other

- Bumped version from 3.5.6 to 3.5.7.
- Added debug logging for potential authentication issues in `callMistralAPI`.
- Added debug logging for missing provider documentation URLs in `OnboardingManager`.

## v3.5.6 - 2025-06-20

### Added

- **Ollama Model Dropdown Feature**: Revolutionary searchable model selection interface for Ollama users
  - **Dynamic Model Loading**: Load available models directly from your running Ollama instance with one click
  - **Searchable Interface**: Real-time filtering and search through available models as you type
  - **Keyboard Navigation**: Full keyboard support with arrow keys, Enter to select, and Escape to close
  - **Manual Entry Support**: Maintains backward compatibility - users can still type model names manually
  - **Professional UI**: Loading indicators, error handling, and smooth animations integrated with VS Code themes

- **Enhanced Ollama Integration**: Comprehensive improvements to Ollama provider experience
  - **Automatic Model Detection**: Uses Ollama API `/api/tags` endpoint to fetch installed models
  - **Error Handling**: Clear error messages for connection issues, missing models, or API problems
  - **Debug Logging**: Comprehensive logging for troubleshooting Ollama connectivity issues

### Enhanced

- **User Experience**: Significant improvements to Ollama configuration workflow
  - **One-Click Model Selection**: No more guessing model names - see exactly what's installed
  - **Visual Feedback**: Loading states and success/error indicators for all operations
  - **Accessibility**: Full keyboard navigation and screen reader support

- **Developer Experience**: Enhanced debugging and troubleshooting capabilities
  - **Comprehensive Error Messages**: Detailed error reporting with actionable solutions
  - **Debug Mode Integration**: Full integration with extension debug logging system
  - **Test Coverage**: Added comprehensive test suite for the new dropdown functionality

### Technical

- **API Integration**: Added `getOllamaModels()` function with proper error handling and response parsing
- **UI Components**: New searchable dropdown component with filtering, selection, and keyboard navigation
- **Message Handling**: Enhanced webview-extension communication for model loading requests
- **Styling**: Complete CSS implementation with VS Code theme integration and responsive design
- **Testing**: Added test coverage for UI components and API integration functionality

### Implementation Details

- **Backend**: Enhanced `src/services/api/ollama.ts` with model fetching capabilities
- **Frontend**: New searchable dropdown in `src/webview/settings/components/OllamaSettings.ts`
- **Styling**: Dedicated CSS module `src/webview/settings/styles/ollamaStyles.css.ts`
- **Communication**: Message handling in `src/webview/settings/MessageHandler.ts`
- **Testing**: Comprehensive test coverage in `src/test/suites/settingsUI.test.ts`

## v3.5.4 - 2025-06-18

### Fixed

- **VS Code Engine Compatibility**: Resolved compatibility issues with older VS Code versions and alternative editors
  - **Reduced Engine Requirement**: Lowered VS Code engine requirement from `^1.100.0` to `^1.63.0` for broader compatibility
  - **Enhanced Editor Support**: Extension now works with Cursor and other VS Code-based editors that may not be on the latest version
  - **Improved Secrets API Handling**: Added graceful fallback for the Secrets API when not available in older VS Code versions
  - **Backward Compatibility**: Maintained all functionality while supporting VS Code versions from October 2021 onwards
  - **Type Definitions Update**: Updated `@types/vscode` from `^1.100.0` to `^1.63.0` to match engine requirements

- **Telemetry Service Robustness**: Enhanced telemetry service to handle missing APIs gracefully
  - **Safe API Access**: Added try-catch blocks around Secrets API usage to prevent crashes on older VS Code versions
  - **Fallback Mechanism**: Implemented proper fallback to default instrumentation key when Secrets API is unavailable
  - **Error Prevention**: Eliminated potential runtime errors when extension runs on VS Code versions prior to 1.53.0

### Enhanced

- **Broader User Base Support**: Extension now accessible to users with:
  - **Older VS Code Installations**: Support for VS Code versions from 1.63.0 onwards
  - **Alternative Editors**: Compatibility with Cursor and other VS Code-based editors
  - **Enterprise Environments**: Support for environments that may not update to the latest VS Code versions immediately
  - **Development Teams**: Better compatibility across teams with varying VS Code version preferences

- **Developer Experience**: Improved development workflow compatibility
  - **Build System**: Verified compilation works correctly with updated engine requirements
  - **Type Safety**: Maintained full type safety while supporting broader version range
  - **No Feature Loss**: All existing functionality preserved across supported VS Code versions

### Technical

- Updated VS Code engine requirement from `^1.100.0` to `^1.63.0` in package.json
- Updated TypeScript definitions to match new engine requirements
- Enhanced error handling in telemetry service for missing VS Code APIs
- Added defensive programming patterns for optional API usage
- Verified backward compatibility with comprehensive testing

## v3.5.3 - 2025-06-17

### Fixed

- **Critical Onboarding System Fixes**: Resolved major onboarding workflow issues affecting user experience
  - **Fixed "Don't Show Again" Button**: The skip onboarding button now properly closes the webview and marks onboarding as permanently disabled
  - **Fixed "Finish Setup" Button**: The complete onboarding button now correctly closes the webview and marks onboarding as completed
  - **Fixed Persistent Onboarding Display**: Onboarding no longer appears every time VS Code starts for users who have already configured API keys
  - **Enhanced API Key Detection**: Improved logic to check for existing API keys across ALL providers, not just the currently selected one
  - **Smart Skip Logic**: Users with any valid API configuration are automatically marked as completed and skip onboarding

- **Onboarding State Management**: Improved handling of onboarding state and user preferences
  - **Proper State Persistence**: Onboarding completion and skip states are now properly saved to VS Code global state
  - **Race Condition Fix**: Resolved timing issues between webview closure and command execution
  - **Better Provider Detection**: Enhanced support for providers that don't require API keys (Ollama, GitHub Copilot)
  - **Improved First-Time User Detection**: More accurate detection of truly new users vs. existing users with configurations

- **Webview Message Handling**: Enhanced communication between onboarding webview and extension
  - **Correct Command Execution Order**: Fixed the sequence of webview closure and command execution to prevent errors
  - **Enhanced Error Handling**: Better error handling and debugging output throughout the onboarding flow
  - **Improved Button Responsiveness**: All onboarding buttons now provide immediate feedback and proper state changes

### Enhanced

- **Onboarding Logic Improvements**: Comprehensive enhancements to onboarding decision-making
  - **Multi-Provider API Detection**: New `hasAnyValidApiConfiguration()` function checks all providers for existing setup
  - **Case-Insensitive Provider Mapping**: Enhanced provider setting path resolution for better compatibility
  - **Comprehensive Debug Output**: Added detailed logging throughout onboarding flow for better troubleshooting
  - **Automatic Completion**: Users with existing API keys are automatically marked as onboarded without showing the wizard

- **Developer Experience**: Improved debugging and testing capabilities
  - **Debug Commands**: Added commands for resetting onboarding state and re-enabling onboarding for testing
  - **Debug Script**: Included `debug-onboarding.js` for manual testing and validation of onboarding logic
  - **Comprehensive Documentation**: Added `ONBOARDING_FIXES.md` with detailed technical documentation of all fixes

### Technical

- **Code Quality Improvements**: Enhanced maintainability and reliability
  - **Enhanced OnboardingManager**: Improved core onboarding logic with better state management and API detection
  - **Improved Message Handlers**: Enhanced webview message handling with proper error handling and state management
  - **Better Configuration Management**: More robust handling of VS Code configuration and global state
  - **Enhanced Type Safety**: Improved type definitions and error handling throughout onboarding components

## v3.5.1 - 2025-06-16

### Added

- **Centralized Provider Configuration System**: Introduced standardized provider configuration with improved type safety
  - **PROVIDER_DEFAULTS Map**: Centralized configuration mapping for all AI providers with default settings and models
  - **Dynamic Configuration Building**: Enhanced `getConfiguration()` to dynamically build provider configurations from centralized defaults
  - **BaseProviderConfig & ApiKeyProviderConfig**: New type-safe interfaces for improved configuration handling
  - **getEffectiveModel() Utility**: New utility function for handling custom model configurations across providers

- **Enhanced API Validation System**: Comprehensive validator configuration for improved error handling
  - **ValidatorConfig Interface**: Standardized provider settings interface for consistent validation
  - **VALIDATOR_CONFIGS Record**: Centralized provider configurations with default models, response times, and rate limits
  - **Dynamic Validation Logic**: Provider-agnostic validation system based on centralized configurations
  - **Enhanced Error Handling**: Improved troubleshooting messages and error resolution suggestions

- **Ollama Installation Management**: Restructured platform-specific installation instructions
  - **Structured Platform Instructions**: Platform-specific installation steps organized in maintainable map structure
  - **formatInstructions Function**: Consistent formatting for installation and startup processes
  - **Enhanced Platform Support**: Detailed notes for each platform's installation and startup procedures

- **Advanced Error Handling System**: Comprehensive error pattern recognition and handling
  - **Structured Error Patterns**: Defined patterns for token limits, rate limits, authentication, quotas, network issues, and configuration errors
  - **Provider-Specific Error Resolution**: Tailored error suggestions based on provider characteristics
  - **Intelligent Retry Logic**: Enhanced retry logic for transient errors with fatal error identification
  - **Error Severity Determination**: Status code-based error severity classification

- **Enhanced Commit Message Processing**: Multi-stage response analysis and cleaning
  - **Response Analysis Metrics**: Detailed analysis including length, code blocks, bullet points, and line structure
  - **Multi-Stage Response Cleaning**: Advanced cleaning for code blocks, markdown, and formatting
  - **Conventional Commit Support**: Enhanced summary processing with commit type handling and truncation
  - **Improved Description Processing**: Better handling of bullet points and empty lines

- **Dynamic Provider Settings System**: Flexible provider configuration with model loading
  - **Provider-Specific Defaults**: Dynamic default models and API key requirements per provider
  - **Dynamic Form Initialization**: Responsive form initialization based on provider configurations
  - **Model Loading Handlers**: Specialized handlers for Mistral and Hugging Face model loading
  - **Enhanced Message Handling**: Improved model updates and settings synchronization

- **Comprehensive Test Suite**: Complete testing framework for quality assurance
  - **Full Test Coverage**: Test suites covering settings UI, AI providers, and git integration
  - **VS Code API Mocking**: Isolated testing environment with proper API mocking
  - **Test Documentation**: Detailed quality assurance documentation and validation scripts
  - **Development Testing Tools**: Scripts for test status monitoring and validation

- **Enhanced Onboarding Control**: Improved user control over onboarding experience
  - **Onboarding Settings Control**: New `aiCommitAssistant.showOnboarding` setting for user control
  - **Onboarding Reset Commands**: Commands for debugging and manual onboarding access
  - **Smart Onboarding Logic**: Prevents unnecessary onboarding when API configurations exist
  - **Permanent Onboarding Disable**: Option to permanently disable onboarding wizard

- **Improved Token Estimation**: More accurate token counting algorithm
  - **Length-Based Tokenization**: Word-length-based token counting for improved accuracy
  - **Special Character Handling**: Proper handling of punctuation and special characters
  - **Character-Based Fallback**: Fallback mechanism for edge cases and high special character density
  - **Multi-Language Support**: Better accuracy for code and non-Latin text

### Enhanced

- **Code Organization and Maintainability**: Significant refactoring for better code structure
  - **Simplified API Configuration**: Streamlined `getApiConfig()` with type-based configuration retrieval
  - **Reduced Code Duplication**: Eliminated redundant provider-specific logic across modules
  - **Improved Type Safety**: Enhanced type definitions throughout the codebase
  - **Modular Processing**: Extracted interfaces and modularized processing steps

- **Webview Component Architecture**: Restructured diagnostics and UI components
  - **DiagnosticInfo Interface**: Type-safe diagnostic information handling in DiagnosticsWebview
  - **Provider Configuration Mapping**: Replaced switch statements with configuration-based logic
  - **Centralized Provider Logic**: Consolidated provider-specific settings into shared configurations
  - **UI Manager Simplification**: Streamlined UI management with shared display configurations

- **Extension Activation System**: Streamlined extension lifecycle management
  - **Separated Command Registration**: Moved command registration to dedicated functions for better organization
  - **Helper Function Architecture**: Introduced helper functions for error handling, progress notifications, and API checks
  - **Improved Error Reporting**: Enhanced telemetry tracking for better event logging and error reporting
  - **Constants Organization**: Added timeout durations and supported provider constants

- **Settings and Configuration Management**: Improved settings handling and UI responsiveness
  - **Centralized Settings Functions**: Unified settings collection and update logic
  - **Enhanced Loading States**: Improved UI responsiveness with loading indicators and error handling
  - **Optimized Form Processing**: Enhanced form initialization and settings collection processes
  - **Better Tooltip UX**: Improved tooltip functionality with hover delays

### Fixed

- **Configuration Management**: Resolved configuration handling issues
  - **Backward Compatibility**: Maintained compatibility with legacy ProviderConfig type
  - **Type Safety Issues**: Fixed type-related issues in configuration handling
  - **Provider-Specific Logic**: Eliminated redundant provider interfaces in types.ts

- **Response Processing**: Improved response handling and formatting
  - **Response Cleaning**: Enhanced response cleaning functions with better error handling
  - **Commit Message Formatting**: Standardized commit message generation across AI models
  - **Logging Improvements**: Better debug logging for each processing stage

### Technical

- **Architecture Improvements**: Significant codebase restructuring for maintainability
  - **Provider Configuration Abstraction**: Centralized provider handling logic
  - **Dynamic Configuration System**: Provider-agnostic configuration management
  - **Enhanced Type System**: Improved type safety throughout the extension
  - **Modular Component Design**: Better separation of concerns and code organization

- **Testing Infrastructure**: Comprehensive testing framework implementation
  - **Isolated Testing Environment**: VS Code API mocking for reliable testing
  - **Quality Assurance Tools**: Scripts and documentation for test validation
  - **Development Workflow**: Enhanced development and testing procedures

- **Performance Optimizations**: Improved extension performance and responsiveness
  - **Efficient Configuration Loading**: Optimized configuration retrieval and caching
  - **Responsive UI Updates**: Enhanced webview performance and user experience
  - **Memory Management**: Better resource management and cleanup

### Breaking Changes

- **Configuration Interface Changes**: Updated provider configuration interfaces (internal changes, backward compatible)
- **Removed Legacy Types**: Cleaned up redundant provider-specific interfaces in types.ts (internal refactoring)
- **File Structure Changes**: Removed obsolete configuration files and documentation (no user impact)

## v3.4.3 - 2025-06-13

### Added

- **Revolutionary Interactive Onboarding System**: Complete replacement of modal-based onboarding with modern webview experience
  - **4-Step Interactive Flow**: Professional guided onboarding with Welcome → Provider Selection → Configuration → First Commit walkthrough
  - **Visual Provider Selection**: Beautiful provider cards with badges (Free, Premium, Local, Integrated) for all 13 AI providers
  - **Real-time API Status**: Interactive configuration setup with live API key validation and connection testing
  - **Modern UI/UX Design**: VS Code theme integration (light/dark/high-contrast) with responsive design and professional styling
  - **Smart Provider Guidance**: Detailed provider descriptions, pricing information, and setup links for informed decision-making
  - **Seamless Settings Integration**: Direct transition from onboarding to settings configuration with selected provider pre-configured

- **Enhanced Onboarding Architecture**: Complete webview-based system with comprehensive functionality
  - **OnboardingWebview**: Main controller with proper lifecycle management and telemetry integration
  - **OnboardingMessageHandler**: Command handling with comprehensive telemetry tracking for user actions
  - **OnboardingTemplateGenerator**: Rich HTML/CSS/JavaScript template with interactive elements and animations
  - **Responsive Styling**: Complete CSS system with VS Code theme variables and mobile-friendly design
  - **Command Integration**: Full command palette support with manual onboarding access via "AI Commit: Open Onboarding"

- **Microsoft Application Insights Integration**: Comprehensive telemetry and analytics system for extension improvement
  - **Anonymous Usage Analytics**: Track command usage, success rates, and performance metrics to improve extension reliability
  - **Provider Usage Statistics**: Monitor AI provider popularity and success rates (without exposing API keys or responses)
  - **Onboarding Analytics**: Track completion rates, step navigation, and provider selection preferences
  - **Error Tracking**: Automatic exception logging and error pattern detection for better debugging and fixes
  - **Performance Monitoring**: Track API response times, commit generation duration, and user workflow efficiency
  - **User Flow Analytics**: Understand how users navigate the extension to improve UX and feature discovery
  - **Privacy-First Design**: No code content, commit messages, API keys, or personal information is collected
  - **Respect User Preferences**: Automatically disabled when VS Code telemetry is turned off
  - **Secure Data Handling**: Uses Microsoft Azure Application Insights with enterprise-grade security

### Fixed

- **Critical Settings Bug Resolution**: Fixed settings webview refresh issue where status items disappeared after saving
  - **Settings Webview Refresh**: Added proper webview refresh after saveSettings commands with optimized timing
  - **Message Handler Enhancement**: Implemented confirmation messaging system between settings webview and extension
  - **Status Item Persistence**: Resolved "Prompt Customization" and "Anonymous Analytics" status items disappearing issue
  - **Real-time UI Updates**: Enhanced settings UI responsiveness with immediate visual feedback

- **TypeScript Compilation Issues**: Resolved all compilation errors in extension.ts and onboarding system
  - **Import Resolution**: Fixed module import issues for onboarding components
  - **Command Registration**: Corrected command registration and subscription management
  - **Type Safety**: Enhanced type definitions and error handling throughout the onboarding system
  - **Extension Integration**: Proper integration of new onboarding webview with existing extension architecture

### Enhanced

- **First-Time User Experience**: Transformed from basic modal dialogs to professional interactive experience
  - **Engagement Rate**: Modern interface designed to significantly improve onboarding completion rates
  - **Provider Discovery**: Visual presentation helps users discover and understand all 13 AI providers
  - **Reduced Support Burden**: Clear setup instructions and real-time validation reduce user confusion
  - **Professional Branding**: Consistent GitMind branding throughout the onboarding experience

- **Developer Experience**: Comprehensive testing and development workflow improvements
  - **Testing Framework**: Added multiple testing methods (automatic, manual, state reset) for thorough validation
  - **Development Mode**: Enhanced extension development workflow with proper testing capabilities
  - **Documentation**: Complete testing guide and implementation documentation for future maintenance

- **User Interface Improvements**: Modern design language throughout the extension
  - **Visual Consistency**: Onboarding design matches existing settings webview for cohesive experience
  - **Accessibility**: Proper keyboard navigation, screen reader support, and high-contrast theme compatibility
  - **Performance**: Optimized webview loading and rendering for smooth user experience

### Privacy

- **No Code Collection**: Your code, commit messages, and diff content remain completely private
- **No Personal Data**: Names, emails, and other personal identifiers are never collected
- **API Key Security**: API credentials are stored locally and never transmitted to telemetry services
- **Transparent Data Usage**: All collected data is used solely for improving GitMind extension
- **Onboarding Privacy**: Provider selection and setup preferences tracked anonymously for feature improvement

### Technical

- **Complete Onboarding Rewrite**: Replaced OnboardingManager modal system with modern OnboardingWebview architecture
- **Webview Infrastructure**: Built comprehensive webview system following VS Code best practices
- **State Management**: Proper onboarding completion tracking and user preference persistence
- **Telemetry Integration**: Added comprehensive TelemetryService with Microsoft Application Insights integration
- **Error Handling**: Enhanced error tracking and exception handling with detailed context
- **Performance Monitoring**: Added performance monitoring for API calls and user interactions
- **Command System**: Extended command registration with new onboarding-specific commands
- **Package Configuration**: Updated package.json with new onboarding commands and proper configuration
- **Build System**: Ensured all new components compile and package correctly for distribution

### Breaking Changes

- **Onboarding System**: Replaced modal-based OnboardingManager with webview-based OnboardingWebview (internal change, no user impact)
- **Command Registration**: Added new onboarding commands that extend existing command palette functionality

## v3.4.2 - 2025-06-11

### Fixed

- **Show Diagnostics Toggle**: Resolved issue where the "Show Diagnostics" setting toggle in Settings UI was not responding to user interaction
  - **Event Listener Registration**: Added missing event listeners for `showDiagnostics` toggle in settings script
  - **Message Handling**: Enhanced message processing to properly handle `showDiagnostics` setting updates
  - **Immediate Setting Updates**: Fixed toggle state updates to reflect changes immediately in the UI
  - **Proper Persistence**: Ensured `showDiagnostics` setting is correctly saved to VS Code's global configuration
  - **User Feedback**: Added confirmation messages when settings are successfully updated

- **Settings UI Responsiveness**: Improved overall responsiveness of toggle switches in Settings panel
  - **Toggle State Synchronization**: Fixed issue where toggle visual state wasn't updating immediately after changes
  - **Event Handler Consistency**: Standardized event handling across all toggle switches for reliable operation
  - **Settings Persistence**: Enhanced settings persistence mechanism to ensure all toggle changes are properly saved

### Enhanced

- **Settings UI Event Handling**: Improved event listener management for better user experience
- **Configuration Management**: Enhanced real-time configuration updates for immediate setting reflection
- **User Feedback**: Added visual confirmation when settings are updated successfully

### Technical

- Enhanced `settingsManager.ts` with proper event listeners for all toggle switches
- Improved message handling in settings components for immediate UI updates
- Standardized event handling patterns across all settings toggles
- Added proper error handling and user feedback for settings updates

## v3.4.1 - 2025-06-10

### Enhanced

- **Improved API Error Handling**: Enhanced error handling for Cohere and Grok providers with comprehensive status code coverage
  - **Cohere API Error Handling**: Updated error handling to match official Cohere API documentation
    - **400 Bad Request**: Clear messaging for invalid request body and missing required fields
    - **401 Unauthorized**: Specific invalid API key detection and troubleshooting
    - **402 Payment Required**: Billing limit detection with direct dashboard links for payment method updates
    - **404 Not Found**: Model or resource not found handling with specific guidance
    - **429 Rate Limiting**: Enhanced rate limit handling with Trial vs Production key differentiation and upgrade paths
    - **499 Request Cancelled**: Proper handling of cancelled requests with retry guidance
    - **500 Server Error**: Internal server error handling with support contact recommendations
    - **Enhanced Error Propagation**: Preserves detailed API error messages throughout the call stack

  - **Cohere API Key Validation**: Updated validation function to use structured warning system
    - **Insufficient Balance Warning**: Returns success with warning for billing limit (402) since API key is valid
    - **Rate Limit Warning**: Returns success with warning for rate limits since API key is valid
    - **Structured Response**: Now returns detailed object with success, error, warning, and troubleshooting properties
    - **Enhanced User Feedback**: Clear warnings in "Check API Setup" for billing and configuration issues

  - **Grok API Error Handling**: Maintained existing comprehensive error handling
    - **Credit Management**: Specific messaging for insufficient credits with purchase links
    - **Structured Response**: Detailed validation responses with warnings for operational issues
    - **Authentication Detection**: Robust API key validation with comprehensive status code handling

### Fixed

- **API Key Validation Consistency**: Ensured both Cohere and Grok use consistent warning patterns for insufficient balance/credits
- **Error Message Clarity**: Improved error message specificity and actionable guidance across both providers
- **Validation Response Structure**: Standardized validation response format between providers for better UI integration

### Technical

- Updated Cohere error handling to match official API documentation status codes and messages
- Enhanced error propagation system to maintain detailed error context throughout the application
- Improved validation function signatures for consistent provider integration
- Added comprehensive debug logging for better troubleshooting and error tracking

## v3.4.0 - 2025-06-09

### Added

- **Perplexity AI Provider Integration**: Full support for Perplexity's AI models with comprehensive feature set
  - **8 Perplexity Models**: Complete model lineup including Sonar Series (sonar-pro, sonar-reasoning, sonar), Llama 3.1 Sonar Online Series (llama-3.1-sonar-small-128k-online, llama-3.1-sonar-large-128k-online, llama-3.1-sonar-huge-128k-online), and Llama 3.1 Sonar Chat Series (llama-3.1-sonar-small-128k-chat, llama-3.1-sonar-large-128k-chat)
  - **Perplexity API Integration**: Native integration with Perplexity API endpoint (https://api.perplexity.ai/chat/completions) using Bearer token authentication
  - **Real-time Web Search**: Access to Perplexity's web-aware models with real-time data processing capabilities
  - **Advanced Reasoning**: Support for sonar-reasoning model with enhanced analytical capabilities
  - **Complete Settings UI**: Dedicated Perplexity settings panel with model selection, API key configuration, and comprehensive validation
  - **Full Extension Integration**: Seamless integration across all extension components including status banner, diagnostics, onboarding, and error handling
  - **Professional Documentation**: Complete API documentation links and setup guides for https://www.perplexity.ai/settings/api

### Enhanced

- **Provider Count**: Updated from 12 to 13 supported AI providers
- **Model Selection**: Added Perplexity models to comprehensive model directory (now 58+ supported models)
- **Onboarding Experience**: Updated onboarding flow to include Perplexity in provider selection guide
- **Extension Logging**: Enhanced debug logging to include Perplexity in supported providers list
- **Documentation**: Updated README.md with Perplexity model comparison, setup guides, and feature descriptions

### Technical

- Added complete PerplexityApiConfig interface and PerplexityModel type definitions
- Implemented comprehensive Perplexity API service with proper error handling and response parsing
- Enhanced ExtensionSettings with perplexity configuration support
- Updated package.json with Perplexity configuration schema and model definitions
- Added PerplexitySettings.ts component with full UI integration
- Integrated Perplexity across all utility modules (apiManager, onboardingManager, statusBanner)
- Updated provider icons and display mappings for complete UI integration

## v3.3.0 - 2025-06-09

### Added

- **Save Last Custom Prompt Feature**: Comprehensive prompt management system for enhanced workflow efficiency
  - **Automatic Prompt Saving**: When enabled, automatically saves custom prompts entered during commit generation for future reuse
  - **Smart Default Handling**: Saved prompts appear as default values in future commit generations with intelligent placeholder text
  - **Clipboard Integration**: Built-in option to copy saved prompts to clipboard before editing for external modification
  - **Conditional UI Toggle**: "Save Last Custom Prompt" setting appears dynamically only when prompt customization is enabled
  - **Prompt Management Commands**: Added dedicated commands for viewing and managing saved prompts:
    - `ai-commit-assistant.clearLastPrompt`: Clear saved prompt with confirmation dialog
    - `ai-commit-assistant.viewLastPrompt`: View saved prompt with copy/clear options
  - **Persistent Storage**: Prompts are saved to VS Code's global configuration, persisting across sessions and workspaces
  - **Enhanced User Experience**: Intuitive workflow with clear notifications and user-friendly confirmation dialogs

- **Complete Feature Integration**: Seamless integration across all extension components
  - **Settings Schema**: Complete configuration options in package.json with proper type definitions
  - **UI Components**: Dynamic toggle visibility with descriptive tooltips explaining functionality
  - **Core Logic**: Robust PromptManager implementation with save/load/clear/copy operations
  - **Extension Integration**: Full integration with commit generation workflow and command registration
  - **Error Handling**: Comprehensive error handling with user-friendly messages and debug logging

### Enhanced

- **Prompt Customization Workflow**: Improved user experience for custom prompt management
  - Enhanced input box experience with saved prompt indication and clipboard copy options
  - Improved settings UI with conditional visibility and better user guidance
  - Enhanced documentation and tooltips explaining the prompt saving functionality

### Technical

- Added comprehensive PromptManager.ts with complete prompt lifecycle management
- Enhanced ExtensionSettings interface with saveLastPrompt and lastPrompt properties
- Updated settings persistence layer to handle prompt storage and retrieval
- Implemented command registration for prompt management operations
- Added complete error handling and user feedback systems
- Maintained backward compatibility with existing prompt customization features

## v3.2.0 - 2025-06-09

### Added

- **Grok (X.ai) Provider Integration**: Full support for X.ai's Grok AI models with comprehensive feature set
  - **13 Grok Models**: Complete model lineup including Grok 3 Series (grok-3, grok-3-fast, grok-3-mini), Grok 2 Series (grok-2-vision-1212, grok-2-1212, grok-2), and Beta Models (grok-vision-beta, grok-beta)
  - **X.ai API Integration**: Native integration with X.ai API endpoint (https://api.x.ai/v1) using Bearer token authentication
  - **Real-time Capabilities**: Access to Grok's real-time data processing and fast inference capabilities
  - **Vision Model Support**: Integrated support for Grok's vision-enabled models for multimodal AI assistance
  - **Complete UI Integration**: Dedicated Grok settings panel with organized model groups and intuitive configuration interface

- **Enhanced Provider Ecosystem**: Expanded from 11 to 12 AI providers
  - Updated extension description and documentation to reflect 12 provider support
  - Added Grok to onboarding flow with X.ai console integration
  - Enhanced provider comparison table with Grok specifications and capabilities
  - Comprehensive API setup guide including X.ai authentication and model selection

- **Technical Infrastructure**: Complete Grok integration across all extension components
  - Full API implementation with error handling and rate limit management
  - Integrated Grok validation and configuration management
  - Enhanced settings persistence and UI management for Grok provider
  - Complete status banner and provider icon integration

### Enhanced

- **Provider Documentation**: Updated all documentation to include Grok models and capabilities
- **Model Directory**: Added 8 new Grok models to comprehensive model listing (58+ total models supported)
- **API Setup Links**: Added X.ai console integration and documentation references
- **Onboarding Experience**: Enhanced onboarding flow to include Grok provider information

### Fixed

- **DeepSeek API Integration Completeness**: Resolved missing integration pieces for DeepSeek provider
  - Added missing DeepSeek case to `showDiagnosticsInfo` function for proper diagnostics display
  - Added DeepSeek documentation URL to `validateAndUpdateConfig` function provider documentation mapping
  - Ensured consistent DeepSeek provider support across all API service functions
  - Fixed missing provider documentation links for seamless API key setup workflow

- **API Key Validation Improvements**: Enhanced "Check API Setup" functionality for DeepSeek and Grok providers
  - **DeepSeek Validation**: Fixed false "Invalid API key" errors by implementing robust error handling
    - Now correctly identifies valid API keys even when account has insufficient balance (402), rate limits (429), or request format issues (400/422)
    - Added structured error response parsing to distinguish authentication errors from operational issues
    - Reduced validation token usage from 10 to 1 token for cost optimization
    - Enhanced error differentiation between invalid API keys (401/403) and account-level issues
  - **Grok Validation**: Implemented comprehensive validation strategy based on official X.ai API documentation
    - Primary validation uses lightweight `/models` endpoint when available
    - Fallback to `/chat/completions` endpoint with minimal 1-token request if models endpoint unavailable
    - **X.ai Compliant Error Handling**: Follows official X.ai status code specifications
      - 401/403: Invalid API key or insufficient permissions (correctly identifies invalid keys)
      - 400: Bad request - distinguishes between API key errors and request format issues
      - 404/405/415/422: Request format/endpoint issues (API key valid, operational problems)
      - 429: Rate limit exceeded (API key valid, temporarily throttled)
      - 202: Deferred completion queued (API key valid, request processing)
    - Enhanced structured error response parsing with authentication-specific detection
    - Comprehensive debug logging for troubleshooting validation issues

- **Enhanced Grok API Error Handling**: Improved error messaging and user experience for Grok API interactions
  - **Structured Error Response Parsing**: Now properly handles X.ai's JSON error format with `code` and `error` fields
  - **Credit Management**: Specific error messages for insufficient credits with direct link to purchase credits
  - **Contextual Error Messages**: Clear, actionable error messages for different failure scenarios:
    - 403 Forbidden: Distinguishes between insufficient credits and permission issues
    - 401 Unauthorized: Clear invalid API key messaging
    - 429 Rate Limited: User-friendly rate limit guidance
    - 400/404: Specific bad request and model not found messages
  - **Fallback Error Handling**: Graceful degradation for unexpected error formats while preserving detailed information

- **Fixed Grok API Validation Error Display**: Resolved issue where Grok API validation errors were not properly displayed in the UI
  - **Corrected Validation Response Handling**: Fixed type mismatch where validation.ts was expecting boolean return but validateGrokAPIKey returns detailed error object
  - **Enhanced Error Message Display**: Now properly displays specific error messages (e.g., "insufficient credits", "access forbidden") instead of generic "Invalid API key" message
  - **Improved Troubleshooting Guidance**: Error popups now show contextual troubleshooting tips specific to the actual error encountered
  - **Complete Error Flow**: Ensured end-to-end error reporting from API validation to UI display for comprehensive user feedback

### Technical

- Added GrokApiConfig interface and GrokModel type definitions
- Implemented callGrokAPI() and validateGrokAPIKey() functions
- Enhanced API validation and rate limiting for Grok provider
- Updated all UI components to support Grok provider integration
- Maintained backward compatibility with existing provider configurations
- Completed DeepSeek provider integration ensuring full functionality across all service functions

## v3.1.2 - 2025-01-08

### Enhanced

- **Comprehensive Model Directory**: Expanded documentation with 50+ supported models across all 11 AI providers
  - Added detailed model specifications including context windows, capabilities, and use cases
  - Comprehensive model comparison table with performance characteristics and pricing tiers
  - Provider-specific model listings with technical details and recommended configurations
  - Enhanced model selection guidance with performance benchmarks and optimization tips

- **Enhanced Documentation Structure**: Complete documentation overhaul for better developer experience
  - Added API setup links and comprehensive configuration guides for each provider
  - Expanded provider setup instructions with step-by-step authentication flows
  - Enhanced feature descriptions with specific model references and capabilities
  - Improved technical architecture section with model-specific implementation details

- **Advanced Configuration Guidance**: Detailed setup and optimization recommendations
  - Added quick selection guide with updated model recommendations for different use cases
  - Enhanced repository analysis section highlighting model-specific capabilities
  - Improved prompt engineering documentation covering all 50+ supported models
  - Refined use case recommendations with model-specific performance suggestions

- **Enterprise and Open Source Support**: Comprehensive deployment and usage guidance
  - Enhanced enterprise deployment section with premium model references and scaling considerations
  - Added dedicated open source project section featuring free tier and local model options
  - Updated API key management and documentation links for all 11 providers
  - Improved overall extension description emphasizing 50+ models and advanced AI capabilities

### Technical

- Maintained backward compatibility with existing configurations
- Updated package.json version to reflect maintenance release
- Verified all model documentation accuracy across providers
- Enhanced repository structure for better navigation and developer experience
- No functional code changes - purely documentation and guidance improvements

## v3.1.1 - 2025-06-08

### Fixed

- **DeepSeek Settings Persistence**: Resolved critical issue where DeepSeek API key and model settings were not being saved
  - Fixed missing `deepseek.apiKey` and `deepseek.model` save operations in SettingsManager.ts
  - DeepSeek settings now properly persist across VS Code sessions
  - All DeepSeek configuration now correctly saves to VS Code's global configuration storage
  - Users can now reliably configure and use DeepSeek AI provider without re-entering settings

### Enhanced

- **Package Metadata Updates**: Improved extension discoverability and accuracy
  - Updated AI providers badge from "10" to "11" to accurately reflect current provider count
  - Added modern keywords for better marketplace discovery:
    - Settings management: `settings-management`, `configuration-persistence`, `api-key-management`
    - Reliability: `stable-configuration`, `reliable-settings`
    - Modern AI: `github-copilot`, `reasoning-models`, `o3-models`, `claude-4`, `gemini-2-5`, `modern-ai-models`
  - Enhanced keyword coverage for latest AI models and configuration features

### Technical

- Verified all 11 AI providers are properly integrated and functional
- Confirmed extension compilation and packaging work correctly with all updates
- Updated version numbering and metadata for marketplace publication
- Maintained backward compatibility while fixing critical settings persistence issue

## v3.1.0 - 2025-06-08

### Added

- **DeepSeek AI Provider Integration**: Advanced reasoning capabilities with competitive free tier
  - Complete DeepSeek API implementation with support for both chat and reasoning models
  - Added deepseek-chat model for general purpose code generation and conversation
  - Added deepseek-reasoner model for advanced reasoning and complex problem solving
  - Comprehensive UI integration with dedicated settings panel and model selection
  - Full configuration support in package.json with proper schema validation
  - Seamless integration with existing provider architecture and error handling
  - Professional SVG icon integration matching other provider branding
  - API key management with secure storage and validation flows
  - Rate limiting support and proper error messaging for missing configurations

- **Enhanced Provider Support**: Expanded AI provider ecosystem to 11 total providers
  - Updated provider comparison tables and documentation
  - Added DeepSeek to recommended configurations for various use cases
  - Enhanced free tier options with competitive DeepSeek pricing
  - Improved provider selection guidance with reasoning model recommendations

### Enhanced

- **Documentation Updates**: Comprehensive documentation refresh
  - Updated README.md with DeepSeek provider information and capabilities
  - Added DeepSeek to model specifications table with context windows and rate limits
  - Enhanced provider comparison with DeepSeek free tier and reasoning capabilities
  - Updated recommended configurations for different development scenarios

### Technical

- Extended provider count from 10 to 11 in all documentation and marketing materials
- Enhanced type definitions with DeepSeekApiConfig and DeepSeekModel types
- Implemented complete API integration matching existing provider patterns
- Added comprehensive validation and error handling for DeepSeek endpoints
- Updated settings management to include DeepSeek form fields and persistence

## v3.0.0 - 2025-05-31

### Added

- **GitHub Copilot Integration**: Seamless VS Code authentication and model access
  - Implemented GitHub Copilot integration via VS Code Language Model API
  - Support for 14 models across OpenAI, Anthropic, and Google providers (GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-4, GPT-3.5-turbo)
  - Zero-configuration setup using VS Code authentication, eliminating the need for API keys
  - Copilot-specific SVG icon for consistent branding with teal theme
  - Enhanced UI with Copilot model selection dropdown and status banner
  - Set default model for Copilot to "gpt-4o" with pre-configured API
  - Comprehensive error handling with proper error messages and fallbacks
  - Unit tests and validation systems to ensure integration stability

- **Show Diagnostics Setting**: New boolean setting to display model and token information
  - Added `showDiagnostics` configuration entry in package.json with default value false
  - Updated ExtensionSettings interface to include showDiagnostics property
  - Implemented setting update logic in MessageHandler and SettingsWebviewProvider
  - Added checkbox and description in settings UI template
  - Handle setting persistence and form binding in SettingsManager

### Enhanced

- **Modern Settings Interface**: Replaced checkboxes with toggle switches
  - Updated GeneralSettings component to use new toggle-setting component structure
  - Added new CSS styles for toggle switches with hover, focus, and disabled states
  - Improved visual appearance and usability of the settings panel

- **Compact Settings Layout**: Improved form design and responsiveness
  - Replaced standard form layout with compact design using flexbox
  - Enhanced tooltip functionality using custom CSS and JavaScript
  - Added hover delay to tooltips for better user experience
  - Modified CSS for compact layout, tooltips, and responsive adjustments
  - Updated JavaScript to initialize tooltips on DOMContentLoaded

- **Enhanced UI Experience**: Improved branding and visual consistency
  - Enhanced info banner styling with animations and gradient backgrounds
  - Improved compatibility with VS Code light/dark themes
  - Updated provider name mapping to include "GitHub Copilot" for display purposes
  - Enhanced user experience by integrating Copilot seamlessly into existing framework

- **Project Documentation**: Better organization and structure
  - Moved vsc-extension-quickstart.md from root directory to instructions directory
  - Renamed multiple documentation files to the instructions directory
  - Improved project structure and organization while maintaining content
  - Streamlined navigation and categorization of documentation files

### Technical

- Incremented supported AI provider count from 9+ to 10+ in package description
- Updated uiManager.ts to handle Copilot model information and API configuration
- Extended provider name mapping and model selection functionality
- Enhanced provider architecture to accommodate Copilot integration
- Updated documentation and README to reflect new provider and features
- Prepared for production release with version 3.0.0 targeting production readiness

## v2.2.0 - 2025-05-30

### Added

- **Anthropic Provider Support**: Industry-leading AI reasoning capabilities
  - Added [Anthropic](https://anthropic.com/) Claude models for generating commit messages
  - Support for Claude 3.5 Sonnet, Claude 3.5 Haiku, and Claude 3 series models
  - Anthropic API validation and settings UI with grouped model selection
  - Enhanced API implementation supporting Messages API with proper error handling
  - Providers Logo now will be loaded in the UI Setting for the current configuration

### Enhanced

- **Updated Provider Selection**: Enhanced UI with Anthropic as a premium option
- **Enhanced Diagnostics**: Updated to support Anthropic Claude models
- **Improved Documentation**: Added Anthropic setup instructions and model comparisons
- **Extended Onboarding**: Include Anthropic in provider selection workflow

### Technical

- Updated package.json to support 9+ AI providers including Anthropic
- Enhanced type definitions with AnthropicApiConfig interface
- Implemented comprehensive error handling for Anthropic API responses
- Added model-specific configurations for optimal Claude model performance

## v2.1.1 - 2025-05-28

### Enhanced

- **Build Configuration**: Improved package management and dependency updates
  - Replace Yarn with npm for package management consistency
  - Add package-lock=true to ensure package-lock.json is maintained
  - Disable npm fund and audit warnings for cleaner output
  - Update vscode engine compatibility to ^1.100.0
  - Add node engine requirement >=16.0.0 to package.json

- **Dependency Updates**: Comprehensive upgrade to latest versions
  - Upgrade @types/node to ^22.15.24
  - Upgrade @types/sanitize-html to ^2.16.0
  - Upgrade @types/vscode to ^1.100.0
  - Upgrade @typescript-eslint/eslint-plugin to ^8.33.0
  - Upgrade @typescript-eslint/parser to ^8.33.0
  - Upgrade @vscode/test-cli to ^0.0.11
  - Upgrade @vscode/test-electron to ^2.5.2
  - Upgrade @vscode/vsce to ^3.4.2
  - Upgrade esbuild to ^0.25.5
  - Upgrade eslint to ^9.27.0
  - Upgrade rimraf to ^6.0.1
  - Upgrade typescript to ~5.8.3
  - Upgrade @google/generative-ai to ^0.24.1
  - Upgrade dotenv to ^16.5.0
  - Upgrade sanitize-html to ^2.17.0

- **Development Tools**: Enhanced development workflow
  - Add yarn-upgrade-all for dependency management
  - Remove volta configuration from package.json
  - Add version script to echo updated version number
  - Improves build consistency and dependency management across environments

- **Documentation**: Improved changelog formatting
  - Added consistent blank lines between list items in multiple sections
  - Improved readability of added features and enhancements
  - Ensured uniform spacing for better visual organization

### Technical

- Updated npm configuration for cleaner package management
- Enhanced build consistency across different environments
- Modernized dependency versions for better security and performance

## v2.1.0 - 2025-05-28

### Added

- **Request Cancellation Support**: Added ability to cancel ongoing API requests
  - New cancel button appears in SCM panel during generation with dedicated close icon
  - Cancel option in status bar during generation process with visual indicators
  - Proper cleanup of resources when requests are cancelled
  - 60-second timeout for all API requests to prevent hanging
  - Professional close/cancel icons for light and dark themes

- **Enhanced Error Handling**: Comprehensive error management for all API providers
  - Smart token limit detection with actionable suggestions and technical details
  - Provider-specific error messages with troubleshooting steps
  - Graceful handling of rate limits, quota issues, and connectivity problems
  - User-friendly error formatting with solution recommendations
  - **Intelligent Error Classification**: Automatic detection of error types (auth, network, config, quota)
  - **Detailed Technical Information**: Shows diff size, token counts, and model limits
  - **Contextual Solutions**: Provides specific recommendations based on error type and context

### Enhanced

- Improved extension stability and performance
- Enhanced error handling for API interactions with abort support and detailed feedback
- Updated documentation for better clarity
- Refined command registration and validation
- Better user feedback during long-running operations with specific error guidance
- Enhanced visual feedback with meaningful icons and tooltips
- **Improved SCM Panel UI**: Grouped GitMind icons together to prevent visual separation by other extensions
- **Intelligent Content Management**: Automatic detection of oversized diffs with recommendations
- **Smart Error Prevention**: Eliminated generic "Failed to generate commit message" in favor of specific error details

### Technical

- Implemented AbortController pattern for all API providers
- Added RequestManager utility for centralized request management
- Enhanced type safety and validation with cancellation support
- Improved logging and debugging capabilities for cancelled requests
- Code optimization and maintenance updates
- Added professional SVG icons for cancel functionality
- Enhanced menu group organization for better visual consistency
- **New Error Handler Utility**: Centralized error processing with provider-specific handling
- **Token Limit Management**: Smart detection and user guidance for content size issues
- **Error Message Preservation**: Maintains detailed error information throughout the call stack

## v2.0.2 - 2025-05-27

### Removed

- **Input Box Cleanup**: Removed unused input box in source control called "AI Commit Assistant"

## v2.0.1 - 2025-05-27

### Fixed

- **Command Definition Issues**: Fixed missing command definition for `ai-commit-assistant.configureSettings` that was referenced in menus
- **Extension Validation**: Resolved extension validation errors related to undefined commands

### Enhanced

- Improved command registration and menu structure
- Enhanced extension stability and validation compliance

## v2.0.0 - 2025-05-24

### Added

- **Dynamic Model Selection**: Real-time browsing and filtering for Hugging Face and compatible providers
- **Token Management System**: Pre-generation estimation, rate limiting, and usage analytics
- **Native VS Code Integration**: Source Control panel integration and workflow support
- **Latest AI Models**: Updated Gemini and OpenAI model configurations with latest versions and descriptions

- **Enhanced Cohere Provider Support**: Comprehensive model selection with 6 new models
  - Added models: command-a-03-2025, command-r-08-2024, command-r-plus-08-2024, aya-expanse-8b, aya-expanse-32b, command-r7b-arabic
  - Organized models into intuitive categories (Latest, Specialized, Legacy)
  - Implemented model-specific generation configurations for optimal performance
  - Added support for multilingual models (Aya Expanse series) and specialized Arabic model

- **Improved Model Selection UI**: Grouped options and detailed descriptions across all providers

### Enhanced

- Enhanced commit message generation instructions for clarity and completeness
- Updated commit message guidelines to emphasize proper formatting and untruncated messages
- Improved multi-provider AI support with significant enhancements
- Refactored settings UI for better organization and clarity
- Upgraded core functionality with improved user experience across all providers
- Updated default Cohere model to command-a-03-2025 for better performance and latest capabilities
