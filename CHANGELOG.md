# Changelog

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
