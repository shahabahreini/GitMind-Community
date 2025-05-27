# Changelog

## [2.0.2] - 2025-05-27

### removed

- Removed unused input box in source control called "AI Commit Assistant"

## [2.0.1] - 2025-05-27

### Fixed

- Fixed missing command definition for `ai-commit-assistant.configureSettings` that was referenced in menus
- Resolved extension validation errors related to undefined commands

### Changed

- Improved command registration and menu structure
- Enhanced extension stability and validation compliance

## [2.0.0] - 2025-05-26

### Added

- Dynamic model selection with real-time browsing and filtering for Hugging Face and compatible providers
- Token management with pre-generation estimation, rate limiting, and usage analytics
- Native VS Code Source Control panel integration and workflow support
- Latest Gemini and OpenAI model configurations with updated versions and descriptions
- Enhanced Cohere provider support with comprehensive model selection:
  - Added 6 new Cohere models: command-a-03-2025, command-r-08-2024, command-r-plus-08-2024, aya-expanse-8b, aya-expanse-32b, command-r7b-arabic
  - Organized Cohere models into intuitive categories (Latest, Specialized, Legacy)
  - Implemented model-specific generation configurations for optimal performance
  - Added support for multilingual models (Aya Expanse series) and specialized Arabic model
- Improved model selection UI with grouped options and detailed descriptions across all providers

### Changed

- Enhanced commit message generation instructions for clarity and completeness
- Updated commit message guidelines to emphasize proper formatting and untruncated messages
- Improved multi-provider AI support with significant enhancements
- Refactored settings UI for better organization and clarity
- Upgraded core functionality with improved user experience across all providers
- Updated default Cohere model to command-a-03-2025 for better performance and latest capabilities
- Enhanced Cohere API implementation to support v2 chat endpoint format
- Improved model validation system for all new Cohere models with proper error handling
- Improved Cohere model selection UI with grouped options and descriptions
- Enhanced model validation for all new Cohere models
- Updated documentation to reflect latest Cohere model capabilities

### Technical

- Major version upgrade to 2.0.0 reflecting significant architectural improvements
- Enhanced AI provider support infrastructure
- Improved model selection and management system
- Streamlined prompt processing with clearer instruction guidelines
- Updated API integrations for better compatibility and performance
- Added comprehensive model-specific configurations for Cohere models
- Updated package.json configuration schema to include all new Cohere models with descriptions
- Enhanced status banner and UI components to reflect latest model selections
- Improved type definitions and validation for new Cohere model categories

### Fixed

- Fixed Cohere API implementation to properly handle v2 chat endpoint responses
- Resolved model validation issues for new Cohere models
- Improved error handling and response parsing for enhanced reliability

## [1.8.0] - 2024-05-23

### Added

- Enhanced HuggingFace model selection with dynamic loading capabilities
  - New HuggingFaceModel interface for structured model data
  - Search functionality for available models
  - Client-side filtering and sorting for improved performance
  - Load all models command with real-time feedback
  - Improved model selection UI with search and loading states
- Enhanced rate limit tracking system
  - Added minute-based rate limits with timestamp tracking
  - Improved API response monitoring and tracking
  - Anomaly detection for Mistral rate limits
  - Detection of unexpected changes in remaining tokens and reset timers
- Added axios for robust API requests with comprehensive error handling

### Changed

- Updated default Gemini model to GEMINI_2_0_FLASH for better stability and performance
- Reduced default Hugging Face temperature to 0.3 for more focused and predictable responses
- Enhanced Gemini API validation to use GEMINI_2_0_FLASH model with improved logging
- Refactored Mistral rate limit retrieval to return comparison objects with anomaly detection
- Improved HuggingFace settings UI with enhanced search functionality and loading states
- Updated API key validation to display remaining requests based on current rate limits

### Technical

- Implemented client-side model filtering and sorting for efficiency
- Added comprehensive rate limit comparison and anomaly detection system
- Enhanced error handling for HuggingFace API requests
- Improved user feedback during model loading operations

## [1.7.5] - 2024-XX-XX

### Added

- Added support for Gemini 2.5 Flash Preview (04/17) model
- Added support for Gemini 2.5 Pro Preview (03/25) model
- Added support for Gemini 2.0 Flash and Flash-Lite models

### Changed

- Updated default Gemini model to "gemini-2.5-flash-preview-04-17"
- Improved model selection UI with descriptive labels
- Reorganized model options for better user experience

### Fixed

- Fixed compatibility issues with newer Gemini API versions
- Resolved token estimation accuracy for new Gemini models

## [1.7.4] - 2024-XX-XX

### Added

- Added support for Gemini 2.5 models
  - Gemini 2.5 Flash Preview (04/17)
  - Gemini 2.5 Pro Preview (03/25)
- Updated default Gemini model to Gemini 2.5 Flash Preview

### Changed

- Updated model configuration to support latest Gemini models
- Improved API validation for Gemini 2.5 models

## [1.6.0] - Unreleased

### Added

- Added support for [Together AI](https://www.together.ai/) provider
- Added Together AI models including Llama 3.3, Llama 3.1, Qwen2, and Mixtral
- Added Together AI API validation and settings UI
- Added support for customizing commit message prompts with additional context

### Changed

- Updated onboarding to include Together AI as a provider option
- Enhanced provider selection UI with Together AI option
- Updated diagnostics to support Together AI models
- Improved error handling for API responses across all providers

### Fixed

- Fixed Cohere API implementation to use the v2 chat endpoint
- Fixed response parsing for various API formats
- Improved error messages for better troubleshooting

## [1.7.0]

### Added

- Added support for [OpenRouter](https://openrouter.ai/) as a provider
- Added OpenRouter API validation and settings UI
- Access to multiple AI models through OpenRouter's unified API

## [1.6.0] - 2025-03-18

### Added

- Added support for [Together AI](https://www.together.ai/) as a provider
- Added Together AI models including Llama-3.3-70B-Instruct-Turbo and Mixtral-8x7B
- Added Together AI API validation and settings UI
- Enhanced API service to handle Together AI response format

### Changed

- Updated onboarding to include Together AI as a provider option
- Enhanced provider selection UI with Together AI option
- Updated diagnostics to support Together AI models
- Improved rate limit checks with Together AI headers support

## [1.5.2] - 2025-03-17

### Added

- Added prompt customization feature to enhance commit message generation
  - New setting `aiCommitAssistant.promptCustomization.enabled` to toggle the feature
  - Custom context input dialog when generating commit messages
  - Enhanced prompt handling across all AI providers
- Enhanced AI provider integrations with custom context support
  - Updated all API services to handle custom context in prompts
  - Improved prompt generation with context awareness
  - Better commit message formatting with user context

### Technical

- Added prompt customization configuration to settings schema
- Updated API services to support custom context in prompts
- Enhanced settings UI with prompt customization toggle
- Improved prompt generation system across all providers

## [1.5.0] - 2025-03-13

### Added

- Added support for [OpenAI](https://platform.openai.com/) as a provider
- Added OpenAI models: GPT-4o, GPT-4-turbo, and GPT-3.5-turbo
- Added OpenAI API validation and settings UI

### Changed

- Updated onboarding to include OpenAI as a provider option
- Enhanced provider selection UI with OpenAI option
- Updated diagnostics to support OpenAI models

## [1.4.0] - 2025-03-12

### Added

- Added support for [Cohere](https://cohere.com/) AI provider
- Added Cohere models: command, command-light, command-nightly, and command-r
- Added Cohere API validation and settings UI

### Changed

- Updated onboarding to include Cohere as a provider option
- Enhanced provider selection UI with Cohere option
- Updated diagnostics to support Cohere models

## [1.3.2] - 2025-03-10

### Changed

- Enhanced input handling for commit messages
- Improved summary processing in commit formatter
- Updated activation events for better performance

### Technical

- Updated package version to 1.3.2
- Configured npm to disable version control warnings and use Yarn
- Added volta configuration for node version management

## [1.3.1] - 2025-03-01

### Added

- Added support for loading and selecting Mistral models dynamically
  - New "Load Available Models" button in settings
  - Dynamic population of model selection dropdown
  - Improved error handling for model loading scenarios
- Introduced monthly rate limit tracking for Mistral API
  - Added monthly limit and remaining quota display
  - Enhanced rate limit reset time calculations
- Enhanced settings UI with configurable API options
  - New settings webview with comprehensive API configuration
  - Status banner showing current configuration state
  - Modular component architecture for better maintainability

### Enhanced

- Improved rate limit checks and notifications
  - Optimized token usage during rate limit checks
  - Added query cost information
  - Enhanced UI with human-readable rate limit information
  - Added warning notifications about token consumption
- Upgraded API validation system
  - Better timeout mechanisms
  - Improved error handling
  - Enhanced Hugging Face API key validation using models endpoint
  - More detailed feedback in settings webview

### Changed

- Migrated to singleton logger class for debug logging
  - Centralized configuration and data handling
  - More consistent debug output across the extension
- Refactored settings management for improved modularity
  - Separated component classes for settings generator
  - Extracted CSS styles into separate modules
  - Created dedicated script files for API and UI logic

### Technical

- Code optimization and architecture improvements
- Updated package version to 1.3.1

## [1.3.0] - 2025-02-27

### Added

- New settings webview with configurable options for API providers, API keys, and models
- Status banner in settings view displaying current configuration status
- Enhanced API and rate limit checks with detailed feedback in settings webview
- Improved API setup validation with timeouts and better error handling
- New Hugging Face API key validation using models endpoint

### Changed

- Refactored settings management for better modularity:
  - Modularized settings generator with separate component classes
  - Extracted CSS styles into separate modules
  - Created separate script files for managing API and UI logic
- Enhanced API setup and rate limit checks:
  - Added 15-second timeouts to prevent indefinite hanging
  - Improved error handling with specific messages
  - Added troubleshooting tips for API issues
- Updated Hugging Face API key validation to use models endpoint for better authentication

### Technical

- Implemented new settings webview architecture with modular components
- Added status banner component for configuration visibility
- Enhanced API validation with timeout mechanisms
- Improved error handling and user feedback systems
- Updated Hugging Face API validation endpoint to `/api/models?limit=1`

## [1.2.2] - 2025-02-27

### Added

- New commit message format enforcement function
- Enhanced error handling for Gemini API responses

### Changed

- Improved Gemini API response processing
- Enhanced commit message formatting with 72-character subject line limit
- Updated error handling for API response processing

### Technical

- Added `enforceCommitMessageFormat` function for consistent commit message formatting
- Improved error handling for response processing in Gemini API
- Enhanced debug logging for API responses
- Updated package version to 1.2.2

## [1.2.1] - 2025-02-27

### Added

- Unified prompt system across all AI providers
- Standardized commit message format with configurable options
- Enhanced token management with increased output token limits

### Changed

- Refactored API services to use a centralized prompt generator
- Increased Gemini model output token limit to 7000
- Improved commit message formatting consistency across providers
- Enhanced type validation for commit message prefixes

### Technical

- Added new `prompts.ts` module for centralized prompt management
- Implemented `PromptConfig` interface for flexible prompt configuration
- Added scope support in commit message format
- Enhanced commit message format validation

## [1.2.0] - 2025-02-25

### Added

- New API validation features:
  - Added "Check API Setup" command to validate API configurations
  - Added "Check Rate Limits" command to monitor API usage limits
- Enhanced Settings UI with API validation buttons
- New API validation service with provider-specific checks
- Rate limit monitoring for Mistral API

### Technical

- Added new commands to package.json:
  - ai-commit-assistant.checkApiSetup
  - ai-commit-assistant.checkRateLimits
- Implemented validation.ts service for API checks
- Enhanced SettingsWebview with API validation functionality
- Added rate limit tracking for Mistral API

## [1.1.9] - 2024-02-23

### Added

- Added Gemini model configuration option in settings.json
- Enhanced documentation with updated configuration examples
- Improved settings.json schema with Gemini model settings

### Changed

- Updated README.md with comprehensive configuration options
- Standardized model configuration across all providers
- Enhanced documentation clarity for configuration options

### Technical

- Added "aiCommitAssistant.gemini.model" to configuration schema
- Updated settings validation for Gemini model configuration
- Improved configuration consistency across providers

## [1.1.8] - 2024-02-20

### Fixed

- Minor bug fixes and improvements
- Enhanced stability of API interactions
- Resolved configuration loading issues

## [1.1.7] - 2024-02-18

### Added

- New configuration option "aiCommitAssistant.commit.verbose" for controlling commit message verbosity
- Enhanced commit message formatting based on verbosity setting
- Updated settings UI with verbose mode checkbox

### Technical

- Modified configuration schema in package.json to include verbose commit option
- Updated settings.ts to handle verbose configuration retrieval
- Enhanced types.ts with CommitConfig verbose property
- Improved repository.ts to support verbose commit message formatting
- Updated SettingsWebview.ts with verbose mode UI controls

## [1.1.6] - 2024-02-18

### Added

- New configuration option "aiCommitAssistant.showDiagnostics" for displaying model and token information
- Diagnostic information display before commit message generation
- Token estimation functionality for better resource management
- New utility functions:
  - showDiagnosticsInfo in api/index.ts for diagnostic display
  - estimateTokens in utils/tokenCounter.ts for token count estimation

### Technical

- Implemented token counting utility in utils/tokenCounter.ts
- Added configuration schema updates in package.json
- Enhanced API module with diagnostic display capabilities

## [1.1.5] - 2024-02-16

### Changed

- Added status bar notification showing active model during generation
- Updated default configuration in settings.ts to prioritize Mistral
- Improved code organization and readability in API service modules

### Added

- Model information display in status bar during commit message generation
- Enhanced documentation emphasizing Mistral AI capabilities

### Technical

- Bumped version in package.json to 1.1.5
- Refactored API provider configuration for better maintainability

### Added

- Interactive API key input prompt for missing configurations
- Direct links to provider API key pages
- Centralized method for API configuration validation and updates
- Debug logging for API key validation

- Enhanced error handling system for API configurations
- Updated error messages to be more user-friendly
- Implemented specific API config types for each service:
  - GeminiApiConfig
  - HuggingFaceApiConfig
  - OllamaApiConfig
  - MistralApiConfig
- Refactored API call functions for better readability
- Updated package.json version to 1.1.4

### Fixed

- Prevented duplicate error messages for API configuration issues
- Improved error propagation and handling for API-related errors
- Enhanced validation of API responses
- Better handling of missing API configurations with empty string returns
- Streamlined error handling for Ollama configuration issues

## [1.1.3] - 2024-02-13

### Changed

- Updated README demo link to use external URL instead of local GIF
- Removed obsolete local demo GIF from images directory
- Updated package.json version to 1.1.3

## [1.1.2] - 2024-02-13

### Changed

- Renamed extension from "AI Commit Assistant" to "GitMind: AI Commit Assistant" in README.md and package.json
- Standardized URL format in README.md
- Updated package.json version to 1.1.2

## [1.1.1] - 2024-02-12

### Added

- Updated visual assets with new designs:
  - New icon-dark.png
  - New icon-light.png
  - New logo.png

### Changed

- Enhanced documentation to highlight free tier availability of AI providers
- Updated package.json version to 1.1.1
