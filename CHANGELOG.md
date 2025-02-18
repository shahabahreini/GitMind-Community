# Change Log

All notable changes to the "AI Commit Assistant" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- Set Mistral AI as the default and recommended AI provider
- Updated README.md to highlight Mistral AI as the recommended provider
- Added status bar notification showing active model during generation
- Updated default configuration in settings.ts to prioritize Mistral
- Improved code organization and readability in API service modules

### Added

- Model information display in status bar during commit message generation
- Enhanced documentation emphasizing Mistral AI capabilities

### Technical

- Bumped version in package.json to 1.1.5
- Refactored API provider configuration for better maintainability
- Standardized model selection handling across providers

## [1.1.4] - 2024-02-13

### Added

- Interactive API key input prompt for missing configurations
- Direct links to provider API key pages
- Centralized method for API configuration validation and updates
- Debug logging for API key validation
- Loading indicators for API operations
- Helper functions for API configuration validation and updates

### Changed

- Enhanced error handling system for API configurations
- Improved API key configuration workflow and user experience
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

## [1.1.0] - 2024-02-12

### Added

- **Mistral AI Integration**
  - New provider option with configurable API key and model selection
  - Support for multiple model tiers: tiny, small, medium, and large-latest
  - Comprehensive rate limit handling with header extraction
  - Type-safe implementations with MistralResponse and MistralRateLimit interfaces

### Changed

- Enhanced documentation with Mistral API configuration details
- Improved rate limit management and quota handling
- Updated configuration types and settings UI

### Fixed

- Code cleanup in mistral.ts for better readability
- Removed redundant commit message templates
- Eliminated unnecessary whitespace

## [0.1.8] - 2024-02-10

### Changed

- Updated default Ollama model from "mistral" to "phi4" in aiCommitAssistant.ollamaModel settings
- Enhanced error message display system for better user experience
- Improved API error handling and user feedback mechanisms

### Added

- Selective modal display for Ollama connection issues with installation instructions
- More detailed API error diagnostics in Hugging Face integration
- JSON parsing capability for Hugging Face API error messages

### Fixed

- Improved error handling in huggingface.ts with better error message formatting
- Added fallback mechanisms for error handling when JSON parsing fails
- Enhanced error context preservation during error propagation

[1.1.1]: https://github.com/shahabahreini/AI-Commit-Assistant/releases/tag/v1.1.1
[1.1.0]: https://github.com/shahabahreini/AI-Commit-Assistant/releases/tag/v1.1.0
[0.1.8]: https://github.com/shahabahreini/AI-Commit-Assistant/releases/tag/v0.1.8-beta
