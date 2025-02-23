# Change Log

All notable changes to the "AI Commit Assistant" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
