# Changelog

## [3.4.0] - 2025-01-27

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

## [3.3.0] - 2025-06-09

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

## [3.2.0] - 2025-06-09

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

## [3.1.2] - 2025-01-08

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

## [3.1.1] - 2025-06-08

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

## [3.1.0] - 2025-06-08

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

## [3.0.0] - 2025-05-31

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
