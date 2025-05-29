# Changelog

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
- Improved model validation system for all new Cohere models with proper error handling

### Technical

- **Major Architecture Upgrade**: Version 2.0.0 reflecting significant architectural improvements
- Enhanced AI provider support infrastructure
- Improved model selection and management system
- Streamlined prompt processing with clearer instruction guidelines
- Updated API integrations for better compatibility and performance
- Added comprehensive model-specific configurations for Cohere models
- Updated package.json configuration schema to include all new Cohere models with descriptions
- Enhanced status banner and UI components to reflect latest model selections

### Fixed

- **Cohere API Implementation**: Fixed to properly handle v2 chat endpoint responses
- **Model Validation**: Resolved validation issues for new Cohere models
- **Error Handling**: Improved error handling and response parsing for enhanced reliability

## [1.8.0] - 2025-05-23

### Added

- **Enhanced HuggingFace Model Selection**: Dynamic loading capabilities with improved UI
  - New HuggingFaceModel interface for structured model data
  - Search functionality for available models
  - Client-side filtering and sorting for improved performance
  - Load all models command with real-time feedback
  - Improved model selection UI with search and loading states

- **Enhanced Rate Limit Tracking**: Comprehensive monitoring system
  - Added minute-based rate limits with timestamp tracking
  - Improved API response monitoring and tracking
  - Anomaly detection for Mistral rate limits
  - Detection of unexpected changes in remaining tokens and reset timers

- **Robust API Requests**: Added axios for comprehensive error handling

### Enhanced

- **Updated Default Models**: Gemini model updated to GEMINI_2_0_FLASH for better stability and performance
- **Optimized Response Quality**: Reduced default Hugging Face temperature to 0.3 for more focused responses
- **Enhanced API Validation**: Gemini API validation using GEMINI_2_0_FLASH model with improved logging
- **Improved Rate Limit System**: Refactored Mistral rate limit retrieval with anomaly detection
- **Better User Experience**: Enhanced HuggingFace settings UI with search functionality and loading states

### Technical

- Implemented client-side model filtering and sorting for efficiency
- Added comprehensive rate limit comparison and anomaly detection system
- Enhanced error handling for HuggingFace API requests
- Improved user feedback during model loading operations

## [1.7.5] - 2025-04-27

### Added

- **Latest Gemini Models**: Support for cutting-edge Gemini models
  - Gemini 2.5 Flash Preview (04/17) model
  - Gemini 2.5 Pro Preview (03/25) model
  - Gemini 2.0 Flash and Flash-Lite models

### Enhanced

- **Updated Default Model**: Changed to "gemini-2.5-flash-preview-04-17"
- **Improved Model Selection**: Enhanced UI with descriptive labels
- **Better Organization**: Reorganized model options for improved user experience

### Fixed

- **API Compatibility**: Fixed compatibility issues with newer Gemini API versions
- **Token Estimation**: Resolved token estimation accuracy for new Gemini models

## [1.7.4] - 2025-04-21

### Added

- **Gemini 2.5 Model Support**: Latest generation Gemini models
  - Gemini 2.5 Flash Preview (04/17)
  - Gemini 2.5 Pro Preview (03/25)

### Enhanced

- **Updated Default Model**: Changed to Gemini 2.5 Flash Preview
- **Model Configuration**: Updated to support latest Gemini models
- **API Validation**: Improved validation for Gemini 2.5 models

## [1.7.3] - 2025-04-21

### Added

- **Gemini 2.5 Models**: Latest Gemini model support
  - Added Gemini 2.5 Flash Preview and Gemini 2.5 Pro Preview models
  - Updated default Gemini model used for API key validation

### Enhanced

- **Enhanced Gemini Integration**: Improved API integration and settings
  - Updated Gemini API call to use generative model and streamlined error handling
  - Improved Gemini settings in webview with API key link and model selection
  - Increased maxOutputTokens for Gemini models to 8000

### Technical

- Updated package version to 1.7.3

## [1.7.2] - 2025-04-08

### Added

- **Cohere Provider Support**: Advanced language understanding
  - Implemented Cohere API integration for commit message generation
  - Added support for multiple Cohere models (command, command-r, etc.)
  - Cohere API validation and error handling
  - Added prompt formatting and length constraints

### Enhanced

- **Improved Commit Message Processing**: Enhanced response handling
  - Enhanced processing to remove code blocks and clean markdown
  - Improved summary handling with type enforcement and truncation
  - Better bullet point handling and description extraction

### Technical

- Updated package version to 1.7.2

## [1.7.0] - 2025-03-17

### Added

- **OpenRouter Provider Support**: Access to multiple AI models through unified API
  - Added [OpenRouter](https://openrouter.ai/) as a provider
  - OpenRouter API validation and settings UI
  - Access to multiple AI models through OpenRouter's unified API
  - Default model set to 'google/gemma-3-27b-it:free'

### Enhanced

- **Settings UI Enhancement**: Added support for multiple providers
  - Implemented UI elements for OpenAI, Together, and OpenRouter API providers
  - Updated UI manager script to handle display of settings and model selection
  - Updated status banner to display correct provider name

### Technical

- Updated package version to 1.7.0

## [1.6.0] - 2025-03-17

### Added

- **Together AI Provider Support**: New AI provider with advanced models
  - Added [Together AI](https://www.together.ai/) as a provider
  - Models including Llama-3.3-70B-Instruct-Turbo and Mixtral-8x7B
  - Together AI API validation and settings UI
  - Enhanced API service to handle Together AI response format

- **Custom Prompt Support**: Enhanced commit message generation with user context
  - Support for customizing commit message prompts with additional context
  - Enhanced prompt handling across all AI providers

### Enhanced

- **Updated Onboarding**: Include Together AI as a provider option
- **Enhanced Provider UI**: Improved provider selection with Together AI option
- **Enhanced Diagnostics**: Updated to support Together AI models
- **Improved Rate Limits**: Enhanced rate limit checks with Together AI headers support

### Fixed

- **Response Processing**: Improved model handling and commit message formatting
  - Added removeThinkingSections function for DeepSeek responses
  - Enhanced bullet point handling in commit messages

### Technical

- Updated package version to 1.6.0

## [1.5.2] - 2025-03-17

### Added

- **Prompt Customization Feature**: Enhanced commit message generation
  - New setting `aiCommitAssistant.promptCustomization.enabled` to toggle the feature
  - Custom context input dialog when generating commit messages
  - Enhanced prompt handling across all AI providers

- **Enhanced AI Provider Integrations**: Custom context support
  - Updated all API services to handle custom context in prompts
  - Improved prompt generation with context awareness
  - Better commit message formatting with user context

### Enhanced

- **Installation Documentation**: Added comprehensive installation instructions
  - Detailed steps for installing from VS Code Marketplace
  - Command for quick installation via VS Code Quick Open

### Technical

- Added prompt customization configuration to settings schema
- Updated API services to support custom context in prompts
- Enhanced settings UI with prompt customization toggle
- Improved prompt generation system across all providers

## [1.5.1] - 2025-03-14

### Enhanced

- **Documentation Updates**: Comprehensive provider setup information
  - Added setup instructions for Gemini, Mistral, Hugging Face, and Ollama
  - Listed available models for each provider with descriptions
  - Updated CHANGELOG with accurate release dates

### Technical

- Updated package version to 1.5.1

## [1.5.0] - 2025-03-12

### Added

- **OpenAI Provider Support**: Industry-leading AI models
  - Added [OpenAI](https://platform.openai.com/) as a provider
  - Models: GPT-4o, GPT-4-turbo, and GPT-3.5-turbo
  - OpenAI API validation and settings UI

### Enhanced

- **Updated Onboarding**: Include OpenAI as a provider option
- **Enhanced Provider Selection**: Improved UI with OpenAI option
- **Enhanced Diagnostics**: Updated to support OpenAI models

## [1.4.0] - 2025-03-12

### Added

- **Cohere AI Provider Support**: Advanced language understanding
  - Added [Cohere](https://cohere.com/) AI provider
  - Models: command, command-light, command-nightly, and command-r
  - Cohere API validation and settings UI

### Enhanced

- **Updated Onboarding**: Include Cohere as a provider option
- **Enhanced Provider Selection**: Improved UI with Cohere option
- **Enhanced Diagnostics**: Updated to support Cohere models

## [1.3.2] - 2025-03-10

### Enhanced

- **Improved Input Handling**: Enhanced input handling for commit messages
- **Better Summary Processing**: Improved summary processing in commit formatter
- **Performance Optimization**: Updated activation events for better performance

### Technical

- Updated package version to 1.3.2
- Configured npm to disable version control warnings and use Yarn
- Added volta configuration for node version management

## [1.3.1] - 2025-03-01

### Added

- **Dynamic Mistral Model Loading**: Improved model selection experience
  - New "Load Available Models" button in settings
  - Dynamic population of model selection dropdown
  - Improved error handling for model loading scenarios

- **Monthly Rate Limit Tracking**: Enhanced API usage monitoring
  - Added monthly limit and remaining quota display
  - Enhanced rate limit reset time calculations

- **Enhanced Settings UI**: Comprehensive API configuration
  - New settings webview with comprehensive API configuration
  - Status banner showing current configuration state
  - Modular component architecture for better maintainability

### Enhanced

- **Improved Rate Limit Management**: Optimized token usage and monitoring
  - Optimized token usage during rate limit checks
  - Added query cost information
  - Enhanced UI with human-readable rate limit information
  - Added warning notifications about token consumption

- **Upgraded API Validation**: Better reliability and feedback
  - Better timeout mechanisms
  - Improved error handling
  - Enhanced Hugging Face API key validation using models endpoint
  - More detailed feedback in settings webview

### Technical

- **Singleton Logger System**: Migrated to centralized logging
  - Centralized configuration and data handling
  - More consistent debug output across the extension

- **Refactored Settings Management**: Improved modularity
  - Separated component classes for settings generator
  - Extracted CSS styles into separate modules
  - Created dedicated script files for API and UI logic

- Code optimization and architecture improvements
- Updated package version to 1.3.1

## [1.3.0] - 2025-02-27

### Added

- **New Settings Webview**: Comprehensive configuration interface
  - Configurable options for API providers, API keys, and models
  - Status banner displaying current configuration status
  - Enhanced API and rate limit checks with detailed feedback

- **Enhanced API Validation**: Improved setup validation
  - API setup validation with timeouts and better error handling
  - New Hugging Face API key validation using models endpoint

### Enhanced

- **Refactored Settings Management**: Better modularity and organization
  - Modularized settings generator with separate component classes
  - Extracted CSS styles into separate modules
  - Created separate script files for managing API and UI logic

- **Enhanced API Setup**: Improved reliability and user feedback
  - Added 15-second timeouts to prevent indefinite hanging
  - Improved error handling with specific messages
  - Added troubleshooting tips for API issues

- **Updated API Validation**: Better authentication checking
  - Updated Hugging Face API key validation to use models endpoint

### Technical

- Implemented new settings webview architecture with modular components
- Added status banner component for configuration visibility
- Enhanced API validation with timeout mechanisms
- Improved error handling and user feedback systems
- Updated Hugging Face API validation endpoint to `/api/models?limit=1`

## [1.2.2] - 2025-02-27

### Added

- **Commit Message Format Enforcement**: Consistent formatting across all providers
- **Enhanced Gemini Error Handling**: Improved API response processing

### Enhanced

- **Improved API Response Processing**: Better handling of Gemini API responses
- **Enhanced Commit Formatting**: 72-character subject line limit enforcement
- **Updated Error Handling**: Improved API response processing

### Technical

- Added `enforceCommitMessageFormat` function for consistent commit message formatting
- Improved error handling for response processing in Gemini API
- Enhanced debug logging for API responses
- Updated package version to 1.2.2

## [1.2.1] - 2025-02-27

### Added

- **Unified Prompt System**: Consistent prompts across all AI providers
- **Standardized Commit Format**: Configurable options for consistent formatting
- **Enhanced Token Management**: Increased output token limits for better results

### Enhanced

- **Refactored API Services**: Centralized prompt generator for consistency
- **Increased Token Limits**: Gemini model output token limit increased to 7000
- **Improved Formatting Consistency**: Better commit message formatting across providers
- **Enhanced Type Validation**: Improved validation for commit message prefixes

### Technical

- Added new `prompts.ts` module for centralized prompt management
- Implemented `PromptConfig` interface for flexible prompt configuration
- Added scope support in commit message format
- Enhanced commit message format validation

## [1.2.0] - 2025-02-25

### Added

- **API Validation Features**: Comprehensive API configuration validation
  - "Check API Setup" command to validate API configurations
  - "Check Rate Limits" command to monitor API usage limits

- **Enhanced Settings UI**: Improved user experience
  - API validation buttons integrated into settings
  - Real-time validation feedback

- **API Validation Service**: Provider-specific validation checks
- **Rate Limit Monitoring**: Comprehensive monitoring for Mistral API

### Technical

- Added new commands to package.json:
  - `ai-commit-assistant.checkApiSetup`
  - `ai-commit-assistant.checkRateLimits`
- Implemented validation.ts service for API checks
- Enhanced SettingsWebview with API validation functionality
- Added rate limit tracking for Mistral API

## [1.1.9] - 2025-02-23

### Added

- **Gemini Model Configuration**: Added model selection option in settings
- **Enhanced Documentation**: Updated configuration examples and guides
- **Improved Settings Schema**: Better validation for Gemini model settings

### Enhanced

- **Updated README**: Comprehensive configuration options documentation
- **Standardized Configuration**: Consistent model configuration across all providers
- **Enhanced Documentation**: Improved clarity for configuration options

### Technical

- Added "aiCommitAssistant.gemini.model" to configuration schema
- Updated settings validation for Gemini model configuration
- Improved configuration consistency across providers

## [1.1.8] - 2025-02-20

### Fixed

- **Bug Fixes**: Minor bug fixes and stability improvements
- **Enhanced Stability**: Improved stability of API interactions
- **Configuration Loading**: Resolved configuration loading issues

## [1.1.7] - 2025-02-18

### Added

- **Verbose Commit Messages**: New configuration option for controlling commit message detail level
  - New setting "aiCommitAssistant.commit.verbose" for verbosity control
  - Enhanced commit message formatting based on verbosity setting
  - Updated settings UI with verbose mode checkbox

- **Diagnostic Information Display**: Enhanced transparency and resource management
  - New configuration option "aiCommitAssistant.showDiagnostics" for displaying model and token information
  - Diagnostic information display before commit message generation
  - Token estimation functionality for better resource management

### Enhanced

- **Verbosity Control**: Toggle for detailed/concise commit messages
- **Token Management**: Implement token estimation and usage tracking
- **Status Bar Integration**: Add diagnostic information display in status bar
- **Settings UI Updates**: New configuration options interface

### Technical

- Modified configuration schema in package.json to include verbose commit option
- Updated settings.ts to handle verbose configuration retrieval
- Enhanced types.ts with CommitConfig verbose property
- Improved repository.ts to support verbose commit message formatting
- Updated SettingsWebview.ts with verbose mode UI controls
- Implemented token counting utility in utils/tokenCounter.ts
- Added configuration schema updates in package.json
- Enhanced API module with diagnostic display capabilities

## [1.1.6] - 2025-02-18

### Technical

- Updated package version to 1.1.6

## [1.1.5] - 2025-02-16

### Added

- **Status Bar Notifications**: Real-time model information during generation
- **Enhanced Documentation**: Improved emphasis on Mistral AI capabilities

### Enhanced

- **Model Information Display**: Status bar shows active model during commit message generation
- **Updated Default Configuration**: Prioritized Mistral in settings
- **Improved Code Organization**: Better readability in API service modules

### Technical

- Bumped version in package.json to 1.1.5
- Refactored API provider configuration for better maintainability

## [1.1.4] - 2025-02-13

### Added

- **Interactive API Configuration**: Streamlined setup process
  - Interactive API key input prompt for missing configurations
  - Direct links to provider API key pages
  - Centralized method for API configuration validation and updates
  - Debug logging for API key validation

- **User Onboarding**: Comprehensive setup guidance
  - Introduced onboarding process to guide new users through setup
  - Created OnboardingManager class with setup notifications
  - Updated README to include animated demo GIF

### Enhanced

- **Enhanced Error Handling**: Improved user experience
  - Updated error messages to be more user-friendly
  - Implemented specific API config types for each service:
    - GeminiApiConfig
    - HuggingFaceApiConfig
    - OllamaApiConfig
    - MistralApiConfig
  - Refactored API call functions for better readability

### Fixed

- **Error Message Handling**: Improved reliability
  - Prevented duplicate error messages for API configuration issues
  - Improved error propagation and handling for API-related errors
  - Enhanced validation of API responses
  - Better handling of missing API configurations with empty string returns
  - Streamlined error handling for Ollama configuration issues

### Technical

- Updated package.json version to 1.1.4

## [1.1.3] - 2025-02-13

### Enhanced

- **Extension Branding**: Improved name and presentation
  - Renamed extension from "AI Commit Assistant" to "GitMind: AI Commit Assistant"
  - Standardized URL format in README.md

- **Updated Documentation**: Improved external resource linking
  - Updated README demo link to use external URL instead of local GIF
  - Removed obsolete local demo GIF from images directory

### Technical

- Updated package.json version to 1.1.3

## [1.1.2] - 2025-02-13

### Technical

- Updated package.json version to 1.1.2

## [1.1.1] - 2025-02-12

### Added

- **Updated Visual Assets**: Professional new designs
  - New icon-dark.png
  - New icon-light.png
  - New logo.png

- **Mistral AI Integration**: Comprehensive AI provider support
  - Introduce Mistral AI as a new provider option with configurable API key and model selection
  - Support multiple model tiers: tiny, small, medium, and large-latest
  - Enhance rate limit handling with header extraction and type-safe implementations
  - Expand documentation with Mistral API configuration details

### Enhanced

- **Enhanced Documentation**: Highlighted free tier availability of AI providers
- **Rate Limit Management**: Comprehensive monitoring and quota handling
  - Added MistralResponse and MistralRateLimit interfaces for type safety
  - Implement rate limit extraction from API response headers
  - Add rate limit checks and error handling for quota management

### Technical

- Updated package version to 1.1.1
- Updated configuration types and settings UI
- Clean up code in mistral.ts for better readability

## [1.0.0] - 2025-02-11

### Added

- **Major Release**: First stable version of GitMind AI Commit Assistant

### Technical

- Updated package version to 1.0.0

## [0.1.12] - 2025-02-10

### Enhanced

- **Prompt Standardization**: Unified prompt format across all API services
  - Standardized prompt template for Gemini, HuggingFace, and Ollama API services
  - Simplified requirements section with clearer formatting and structure
  - Updated commit message generation instructions for enhanced clarity

- **Settings Management**: Major refactoring of settings system
  - Reorganized configuration structure in package.json into nested objects
  - Grouped settings by provider (general, gemini, huggingface, ollama)
  - Added ordering for better UI presentation
  - Enhanced descriptions with markdown support and examples

- **Settings Webview**: Comprehensive UI overhaul
  - Implemented new SettingsWebview class with dedicated interface
  - Added responsive UI with VSCode theming support
  - Implemented two-way settings synchronization
  - Added secure nonce generation for script execution

### Technical

- Updated package version to 0.1.12
- Improved type definitions in config/types.ts
- Enhanced API handling with better error handling and validation
- Updated extension commands structure

## [0.1.9] - 2025-02-10

### Enhanced

- **Settings Structure**: Enhanced configuration organization
  - Updated settings object to include nested properties for better organization
  - Enhanced user interface with placeholders in input fields
  - Implemented dynamic visibility for settings sections based on selected API provider

### Fixed

- **Package Configuration**: Removed duplicate command entries and improved structure

### Technical

- Updated package version to 0.1.9
- Added condition "when": "scmProvider == git" for settings command availability

## [0.1.8] - 2025-02-09

### Added

- **Ollama Integration**: Comprehensive local AI support
  - Added Ollama API integration as a new model provider
  - Implemented Ollama availability checking and installation instructions
  - Enhanced error handling for Ollama connection issues

- **Debug Mode**: Enhanced development capabilities
  - Implemented comprehensive debug mode with detailed logging through VSCode output channel
  - Added debug mode initialization to log extension configuration
  - Enhanced debugLog function to handle data serialization errors gracefully

### Enhanced

- **Model Support**: Expanded AI provider options
  - Changed default Ollama model from "mistral" to "phi4"
  - Updated package.json VSCode engine requirement to ^1.75.0
  - Added keywords for better marketplace visibility

- **SCM Integration**: Improved source control management
  - Added SCM provider with dedicated input box and status bar item
  - Implemented comprehensive git command utilities
  - Changed default API provider to Hugging Face

### Fixed

- **Error Handling**: Improved API error diagnostics
  - Enhanced error message display logic to show detailed API errors
  - Improved error handling in huggingface.ts for better user feedback
  - Added JSON parsing capabilities for API error responses

### Technical

- Updated package version to 0.1.8
- Added proper extension deactivation handler
- Refactored configuration handling and types

## [0.1.7] - 2025-02-08

### Enhanced

- **Ollama Support**: Improved local AI integration
  - Refactored checkOllamaAvailability function to include timeout
  - Updated install instructions for different platforms
  - Enhanced error handling in getOllamaInstallInstructions function

### Technical

- Updated package version to 0.1.7

## [0.1.6] - 2025-02-08

### Added

- **Loading Indicators**: Enhanced user feedback
  - Added SVG icons for generate and loading states in light/dark themes
  - Implemented status bar loading indicator during commit message generation
  - Added publisher field and improved error handling with proper cleanup

- **Commit Message Processing**: Improved output quality
  - Updated commit message generation logic with better formatting
  - Refined commit message format guidelines for better output quality
  - Improved handling of bullet points and descriptions

### Enhanced

- **UI Integration**: Streamlined extension interface
  - Replace custom webview with native SCM input integration
  - Updated menu configuration for SCM title and command palette entries
  - Optimized commit message processing with improved bullet point formatting

### Technical

- Added proper state management for commit generation process
- Implemented proper extension deactivation handler

## [0.1.10] - 2025-02-10

### Enhanced

- **HTML Structure**: Improved code organization
  - Updated HTML markup by grouping related elements into containers
  - Removed redundant tags for cleaner spacing management
  - Enhanced script section organization

### Technical

- Updated package version to 0.1.10

## Earlier Versions

- **Initial Development**: Versions 0.1.0 through 0.1.5 included basic extension setup, initial AI provider integrations, and foundational features.
