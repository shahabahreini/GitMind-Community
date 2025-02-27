# Change Log

All notable changes to the "AI Commit Assistant" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
