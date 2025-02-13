# Change Log

All notable changes to the "AI Commit Assistant" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
