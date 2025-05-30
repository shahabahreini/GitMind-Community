# Changelog

## [2.2.0] - 2025-05-30

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

## [2.1.1] - 2025-05-28

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

## [2.1.0] - 2025-05-28

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

## [2.0.2] - 2025-05-27

### Removed

- **Input Box Cleanup**: Removed unused input box in source control called "AI Commit Assistant"

## [2.0.1] - 2025-05-27

### Fixed

- **Command Definition Issues**: Fixed missing command definition for `ai-commit-assistant.configureSettings` that was referenced in menus
- **Extension Validation**: Resolved extension validation errors related to undefined commands

### Enhanced

- Improved command registration and menu structure
- Enhanced extension stability and validation compliance

## [2.0.0] - 2025-05-24

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
- Enhanced Cohere API implementation to support v2 chat endpoint format
