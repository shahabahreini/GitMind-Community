import { CommitStyle } from "../../config/types";
import * as vscode from 'vscode';
import { debugLog } from "../debug/logger";

export interface PromptConfig {
  style?: CommitStyle;
  maxLength?: number;
  includeScope?: boolean;
  maxBodyLines?: number;
}

export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  maxLength: 72,
  includeScope: true,
  maxBodyLines: 5
};

/**
 * Get prompt configuration with Pro settings applied if available
 */
export function getPromptConfig(): PromptConfig {
  const config = vscode.workspace.getConfiguration('gitmind');
  const proSettings = config.get('pro') as any || {};
  const commitBodyOptions = proSettings.commitBodyOptions;
  const commitLengthOptions = proSettings.commitLengthOptions;

  debugLog('[DEBUG] Reading workspace configuration...');
  debugLog('[DEBUG] Full workspace config:', config);
  debugLog('[DEBUG] Pro settings:', proSettings);
  debugLog('[DEBUG] commitBodyOptions:', commitBodyOptions);
  debugLog('[DEBUG] commitLengthOptions:', commitLengthOptions);

  // Check individual settings values
  debugLog('[DEBUG] commitBodyOptions.enabled:', config.get('pro.commitBodyOptions.enabled'));
  debugLog('[DEBUG] commitBodyOptions.maxLines:', config.get('pro.commitBodyOptions.maxLines'));
  debugLog('[DEBUG] commitLengthOptions.enabled:', config.get('pro.commitLengthOptions.enabled'));
  debugLog('[DEBUG] commitLengthOptions.maxLength:', config.get('pro.commitLengthOptions.maxLength'));

  // Start with default config
  const promptConfig: PromptConfig = { ...DEFAULT_PROMPT_CONFIG };

  // Get commit style
  const commitStyle = config.get<CommitStyle>('commitStyle.style', 'conventional');
  promptConfig.style = commitStyle;
  debugLog(`[DEBUG] Retrieved commit style: ${commitStyle}`);

  // Apply Pro feature settings if enabled
  const bodyOptionsEnabled = config.get<boolean>('pro.commitBodyOptions.enabled') ?? false;
  const bodyMaxLines = config.get<number>('pro.commitBodyOptions.maxLines') ?? 5;

  if (bodyOptionsEnabled && bodyMaxLines) {
    promptConfig.maxBodyLines = bodyMaxLines;
    debugLog(`[DEBUG] Applied maxBodyLines: ${bodyMaxLines}`);
  } else {
    debugLog(`[DEBUG] commitBodyOptions not applied - enabled: ${bodyOptionsEnabled}, maxLines: ${bodyMaxLines}`);
  }

  const lengthOptionsEnabled = config.get<boolean>('pro.commitLengthOptions.enabled') ?? false;
  const lengthMaxLength = config.get<number>('pro.commitLengthOptions.maxLength') ?? 72;

  if (lengthOptionsEnabled && lengthMaxLength) {
    promptConfig.maxLength = lengthMaxLength;
    debugLog(`[DEBUG] Applied maxLength: ${lengthMaxLength}`);
  } else {
    debugLog(`[DEBUG] commitLengthOptions not applied - enabled: ${lengthOptionsEnabled}, maxLength: ${lengthMaxLength}`);
  }

  debugLog('[DEBUG] Final promptConfig:', promptConfig);
  return promptConfig;
}

/**
 * Generate base instructions common to all styles
 */
function getBaseInstructions(_config: PromptConfig, customContext: string = ""): string {
  let prompt = `You are an expert Git commit message generator. Analyze the provided diff carefully and create exactly ONE complete, professional commit message following the specified format precisely.

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE commit message, never truncate with "..."
- Write the FULL subject line and body
- Do not explain your reasoning or provide alternatives
- Output only the final commit message
- Follow the exact format specified for this style`;

  if (customContext.trim()) {
    prompt += `\n\nAdditional Context: ${customContext.trim()}`;
  }

  return prompt;
}

/**
 * Generate body formatting rules
 */
function getBodyRules(config: PromptConfig): string {
  return `
BODY REQUIREMENTS:
- Each line MUST start with "- " (dash + space)
- Explain WHAT changed and WHY it was necessary
- Focus on business logic, user impact, or technical rationale
- Be concise but informative - avoid redundancy with the subject
- Reference issue numbers, tickets, or breaking changes if relevant${config.maxBodyLines ? `
- Generate EXACTLY ${config.maxBodyLines} bullet points or fewer. Do not exceed ${config.maxBodyLines} lines.` : `
- Keep to 3-5 bullet points for optimal readability`}

Body should answer: What was changed? Why was it changed? Any important details or impacts?`;
}

/**
 * Generate prompt for Basic style - Clean, simple descriptions
 */
function generateBasicStylePrompt(config: PromptConfig, customContext: string = ""): string {
  return `${getBaseInstructions(config, customContext)}

BASIC STYLE SPECIFICATION:
Format: <description>

This is a clean, straightforward approach focused on clarity and simplicity.

DESCRIPTION GUIDELINES:
- Write a clear, descriptive sentence that explains what was accomplished
- Start with an action verb in imperative mood (add, fix, update, remove, refactor, implement)
- Focus on the end result or benefit, not implementation details
- Use present tense as if describing what applying this commit will do
- Be specific enough that someone can understand the change without seeing the code

FORMATTING REQUIREMENTS:
- Maximum ${config.maxLength} characters total (adjust wording to fit if needed)
- Use imperative mood: "Add user authentication" not "Added" or "Adds"
- Capitalize the first word
- No period at the end
- Avoid technical jargon unless necessary for clarity

${getBodyRules(config)}

EXAMPLES:
Add two-factor authentication support
Fix navigation crash on iOS devices  
Update API documentation for v2.0
Remove deprecated payment gateway integration
Refactor user service for better performance

OUTPUT FORMAT:
<description>

- <explanation of what changed>
- <explanation of why it was needed>
- <any important context or impact>`;
}

/**
 * Generate prompt for Conventional Commits - Industry standard with semantic versioning support
 */
function generateConventionalStylePrompt(config: PromptConfig, customContext: string = ""): string {
  return `${getBaseInstructions(config, customContext)}

CONVENTIONAL COMMITS SPECIFICATION (v1.0.0):
Format: <type>(<scope>): <description>

This follows the official Conventional Commits specification for semantic versioning and automated tooling.

COMMIT TYPES (choose the most appropriate):

**User-Facing Changes:**
- **feat**: New functionality that users can interact with or benefit from
  - Examples: new API endpoints, UI components, features, capabilities
  - Triggers: minor version bump in semantic versioning
  - NOT for: internal refactoring, developer tools, build improvements

- **fix**: Resolves incorrect behavior that affects users or system functionality  
  - Examples: bug fixes, security patches, error corrections, edge case handling
  - Triggers: patch version bump in semantic versioning
  - NOT for: code cleanup, performance optimizations without fixing bugs

**Code Quality & Maintenance:**
- **refactor**: Restructuring existing code without changing its external behavior
  - Examples: extracting functions, renaming variables, improving architecture
  - Result: same input/output, better internal structure
  - NOT for: bug fixes, new features, or performance improvements

- **style**: Code formatting and cosmetic changes with zero functional impact
  - Examples: whitespace, semicolons, linting fixes, code formatting
  - Result: code looks different but behaves identically
  - NOT for: UI styling, component changes, or logic modifications

- **perf**: Optimizations that improve speed, memory usage, or resource efficiency
  - Examples: algorithm improvements, database query optimization, caching
  - Result: measurable performance improvement
  - NOT for: new features that happen to be fast

**Documentation & Testing:**
- **docs**: Changes to documentation, comments, or explanatory content
  - Examples: README updates, API docs, code comments, user guides
  - Scope: only affects documentation, no code behavior changes
  - NOT for: code changes that happen to improve readability

- **test**: Adding, modifying, or improving automated tests
  - Examples: unit tests, integration tests, test utilities, test data
  - Purpose: improving test coverage or test quality
  - NOT for: fixing bugs discovered by tests (use 'fix')

**Infrastructure & Tooling:**
- **build**: Changes affecting the build system, dependencies, or compilation process
  - Examples: webpack config, package.json dependencies, build scripts
  - Impact: how the code is compiled, bundled, or packaged
  - NOT for: runtime configuration or application logic

- **ci**: Modifications to continuous integration, deployment, or automation
  - Examples: GitHub Actions, Jenkins pipelines, deployment scripts
  - Impact: how code is tested, built, or deployed automatically
  - NOT for: application configuration or runtime behavior

- **chore**: Routine maintenance tasks that don't affect the application's functionality
  - Examples: updating .gitignore, license files, editor config
  - Scope: project maintenance, not source code logic
  - NOT for: any change that affects how the application runs

**Special Cases:**
- **revert**: Undoing a previous commit to restore earlier state
  - Format: "revert: add feature X" or reference the reverted commit
  - Use: when rolling back problematic changes
  - Include: explanation of why the revert was necessary

SCOPE SELECTION STRATEGY (Think like a Senior Developer):

**Architectural Perspective First:**
- Think in terms of system boundaries and responsibilities, not just file locations
- Consider the blast radius: what could break if this change has issues?
- Prioritize domain-driven design: business domains over technical layers

**Scope Hierarchy (Choose Most Specific):**
1. **Business Domain** (Preferred): auth, billing, inventory, notifications, analytics
2. **Technical Boundary**: api, ui, database, cache, queue, storage
3. **Feature Module**: login, dashboard, checkout, admin, reporting
4. **Service/Component**: user-service, payment-gateway, email-sender
5. **Infrastructure Layer**: build, deploy, monitoring, security, config

**Smart Scope Selection Rules:**
- **Single responsibility**: If change touches auth logic, use auth not services
- **User-facing impact**: Use feature names when users will notice (checkout, profile)
- **Cross-cutting concerns**: Use technical scope for infrastructure (logging, monitoring)
- **API changes**: Use api for public interfaces, specific service for internal
- **Database**: Use db for schema/migrations, domain name for business logic
- **Configuration**: Use config for env/settings, domain name for feature configs

**Multi-Component Changes:**
- If 80%+ of change is in one area → use that scope
- If evenly split between 2 domains → use the higher-level scope
- If cross-cutting (>3 areas) → omit scope or use architectural layer (core, shared)

**Project-Specific Scope Examples:**
- Frontend: components, hooks, utils, styles, routing
- Backend: controllers, services, models, middleware, validators  
- Full-stack: api, web, mobile, admin, shared
- Microservices: service names (user-svc, order-svc, payment-svc)
- Libraries: core, utils, types, exports, docs

DESCRIPTION REQUIREMENTS:
- Maximum ${config.maxLength} characters including type and scope
- Use imperative mood: "add login form" not "added" or "adds"
- Lowercase first letter after the colon
- No period at the end
- Be specific but concise

BREAKING CHANGES:
- Add "!" after type/scope for breaking changes: feat(api)!: redesign user endpoints
- Explain breaking changes in the body

${getBodyRules(config)}

EXAMPLES:
feat(auth): add OAuth2 social login integration
fix(api): resolve timeout issue in user profile requests
docs(readme): update installation instructions for Docker
refactor(components): extract reusable button component logic
perf(database): optimize user query with proper indexing

OUTPUT FORMAT:
<type>(<scope>): <description>

- <detailed explanation>
- <rationale or context>
- <impact or breaking changes if any>`;
}

/**
 * Generate prompt for Angular style - Enterprise-grade with strict conventions
 */
function generateAngularStylePrompt(config: PromptConfig, customContext: string = ""): string {
  return `${getBaseInstructions(config, customContext)}

ANGULAR COMMIT CONVENTION:
Format: <type>(<scope>): <description>

This follows Angular's strict commit message guidelines for enterprise-scale development.

ANGULAR COMMIT TYPES (choose ONE):
- **feat**: New feature for the user, not a new feature for build script
- **fix**: Bug fix for the user, not a fix to a build script
- **docs**: Changes to documentation (code comments, README, etc.)
- **style**: Changes that do not affect code meaning (white-space, formatting, missing semi-colons)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

ANGULAR SCOPE STRATEGY (Enterprise Architecture Focus):

**Angular-Specific Scope Hierarchy:**
1. **Angular Modules** (Preferred): core, shared, feature-auth, feature-dashboard
2. **Angular Services**: http, router, forms, animations, cdk, material
3. **Application Layers**: components, services, guards, interceptors, directives
4. **Business Domains**: user-management, product-catalog, order-processing
5. **Infrastructure**: build, testing, deployment, tooling

**Enterprise Scope Patterns:**
- **Lazy-loaded modules**: Use feature prefix (feature-admin, feature-reporting)
- **Shared libraries**: Use lib name (ui-lib, data-lib, utils-lib)
- **Monorepo structure**: Include app prefix (admin-app, customer-app)
- **Micro-frontends**: Use application boundary (shell, mf-catalog, mf-checkout)

**Angular Technical Scopes:**
- compiler: Angular compiler, build-time code generation
- core: Core Angular functionality, dependency injection, change detection
- common: Common directives, pipes, location services
- platform-*: Platform-specific code (browser, server, worker)
- router: Navigation, guards, resolvers, lazy loading
- forms: Template-driven and reactive forms, validation
- http: HTTP client, interceptors, error handling
- animations: Angular animations API and triggers
- testing: Testing utilities, TestBed configuration
- i18n: Internationalization and localization

**Scope Selection for Angular Projects:**
- **Component changes**: Use feature scope, not components
- **Service modifications**: Use domain scope unless it's framework-level
- **Module refactoring**: Use module name or architectural layer
- **Configuration updates**: Use config for app config, build for tooling

ANGULAR-SPECIFIC REQUIREMENTS:
- Subject line: Maximum ${config.maxLength} characters including type and scope
- Use present tense, imperative mood
- Lowercase description after colon
- No period at end of subject
- Reference issues using "Closes #123" or "Fixes #456" in body
- For breaking changes: add BREAKING CHANGE: footer

${getBodyRules(config)}

ANGULAR EXAMPLES:
feat(http): add retry mechanism for failed requests
fix(forms): resolve validation error message display issue
style(core): format code according to prettier configuration
test(router): add unit tests for navigation guard functionality
build(deps): update Angular to version 17.2.0

OUTPUT FORMAT:
<type>(<scope>): <description>

- <explanation of implementation>
- <business justification>
- <any breaking changes or migration notes>`;
}

/**
 * Generate prompt for Ember.js style - Tag-based semantic categorization
 */
function generateEmberStylePrompt(config: PromptConfig, customContext: string = ""): string {
  return `${getBaseInstructions(config, customContext)}

EMBER.JS COMMIT CONVENTION:
Format: [TAG] <description>

This uses Ember's tag-based system for semantic commit categorization.

🚨 CRITICAL FORMAT RULES:
- Start DIRECTLY with [TAG] - no prefixes like "feat:" or "fix:"
- Tags must be in ALL CAPS within square brackets
- One space after the closing bracket, then description
- Do NOT mix with conventional commit types

EMBER TAGS (choose the most appropriate):
- **[FEATURE]**: New functionality or user-facing capabilities
- **[BUGFIX]**: Bug fixes, error corrections, or issue resolutions  
- **[DOC]**: Documentation changes, comments, or README updates
- **[CLEANUP]**: Code cleanup, refactoring, removing dead code, organizing
- **[SECURITY]**: Security-related changes, vulnerability fixes
- **[PERFORMANCE]**: Performance optimizations, speed improvements
- **[TEST]**: Test additions, updates, or test infrastructure changes
- **[INTERNAL]**: Internal changes not affecting end users
- **[BREAKING]**: Breaking changes that affect public API
- **[BUILD]**: Build system, dependencies, or tooling changes

EMBER SCOPE THINKING (Component-Driven Architecture):

**Ember Architectural Scopes:**
- Think in terms of Ember's conventions: routes, components, services, models
- Consider the Ember Data layer vs. presentation layer
- Focus on Ember CLI addon boundaries for reusable code

**Ember-Specific Context in Description:**
Since Ember uses tags instead of scopes, encode scope-like thinking in the description:
- [FEATURE] Add user authentication service (service scope implied)
- [BUGFIX] Fix dashboard route loading issue (route scope implied)  
- [CLEANUP] Refactor user model relationships (model scope implied)
- [PERFORMANCE] Optimize component rendering lifecycle (component scope implied)

**Tag Selection Based on Architectural Impact:**
- **[FEATURE]**: New routes, components, services, or user-facing capabilities
- **[BUGFIX]**: Issues in specific components, routes, or services
- **[CLEANUP]**: Refactoring components, extracting services, organizing code
- **[PERFORMANCE]**: Optimizing rendering, data loading, or asset delivery
- **[INTERNAL]**: Build process, testing infrastructure, developer tooling

DESCRIPTION REQUIREMENTS:
- Maximum ${config.maxLength} characters total (including tag)
- Use imperative mood: "Add new feature" not "Added" or "Adds"
- Be descriptive but concise
- Focus on user impact when possible
- No period at the end

${getBodyRules(config)}

EMBER EXAMPLES:
[FEATURE] Add real-time collaboration support
[BUGFIX] Fix memory leak in component cleanup
[CLEANUP] Extract common validation logic into utilities  
[PERFORMANCE] Optimize route loading with lazy imports
[BREAKING] Remove deprecated API endpoints

🚫 WRONG FORMATS (DO NOT USE):
❌ feat: [FEATURE] Add new feature
❌ [CLEANUP] refactor: Improve code  
❌ fix(auth): [BUGFIX] Fix login

OUTPUT FORMAT:
[TAG] <description>

- <technical implementation details>
- <user or developer impact>
- <any migration notes or considerations>`;
}

/**
 * Generate prompt for EmojiGit style - Visual semantic commits with emojis
 */
function generateEmojiGitStylePrompt(config: PromptConfig, customContext: string = ""): string {
  return `${getBaseInstructions(config, customContext)}

EMOJIGIT CONVENTION:
Format: <emoji> <description>

This uses semantic emojis to visually categorize commits for quick scanning and understanding.

🚨 CRITICAL FORMAT RULES:
- Start DIRECTLY with emoji - no prefixes like "feat:" or "fix:"
- One space after emoji, then description
- Do NOT mix with conventional commit types or other formats

SEMANTIC EMOJI MAPPING (choose the most representative):

🆕 NEW FEATURES & CAPABILITIES:
✨ **New features** - New functionality, capabilities, or user-facing features
🎉 **Major releases** - Significant milestones, major version releases
🚀 **Deployments** - Production deployments, go-live features

🔧 BUG FIXES & CORRECTIONS:
🐛 **Bug fixes** - Fixing bugs, errors, crashes, or unexpected behavior
🩹 **Simple fixes** - Quick fixes, typos, minor corrections
🔥 **Hotfixes** - Critical production fixes, emergency patches

📖 DOCUMENTATION & INFO:
📚 **Documentation** - README updates, API docs, code comments
📝 **Content updates** - Blog posts, user guides, help text
💡 **Code comments** - Adding explanatory comments or docstrings

🎨 CODE QUALITY & STYLE:
💄 **UI improvements** - Visual changes, styling, layout improvements
🎨 **Code structure** - Improving code structure, format, or organization
♻️ **Refactoring** - Code refactoring without changing functionality
🧹 **Cleanup** - Removing dead code, unused files, or dependencies

⚡ PERFORMANCE & OPTIMIZATION:
⚡ **Performance** - Speed improvements, optimization, efficiency
🗜️ **Compression** - File size reduction, bundle optimization
📈 **Analytics** - Adding tracking, metrics, or monitoring

🔒 SECURITY & RELIABILITY:
🔒 **Security** - Security improvements, vulnerability fixes
🛡️ **Validation** - Input validation, data sanitization
🔐 **Authentication** - Auth-related changes, permissions

🧪 TESTING & QUALITY:
✅ **Tests** - Adding tests, test improvements
🧪 **Experiments** - A/B tests, feature flags, experimental features
🤖 **CI/CD** - Automation, build processes, deployment scripts

🔨 INFRASTRUCTURE & TOOLS:
🔨 **Development tools** - Developer experience improvements
📦 **Dependencies** - Adding, updating, or removing packages
⚙️ **Configuration** - Config files, environment settings
🐳 **DevOps** - Docker, infrastructure, deployment configuration

DESCRIPTION REQUIREMENTS:
- Maximum ${config.maxLength} characters total (including emoji)
- Use imperative mood: "Add user dashboard" not "Added" or "Adds"
- Be specific and descriptive
- Focus on the primary change or benefit
- No period at the end

EMOJI SELECTION TIPS:
- Choose based on primary intent, not implementation details
- When multiple emojis apply, pick the one representing user impact
- Prefer specific emojis over generic ones
- Consider what someone scanning commits would want to see

${getBodyRules(config)}

EMOJIGIT EXAMPLES:
✨ Add real-time chat functionality
🐛 Fix pagination error in user listings
📚 Update API documentation with new endpoints
♻️ Refactor authentication service for modularity
⚡ Optimize database queries for faster loading

🚫 WRONG FORMATS (DO NOT USE):
❌ feat: ✨ Add new feature
❌ ♻️ refactor: Improve code
❌ fix(auth): 🐛 Fix login bug

OUTPUT FORMAT:
<emoji> <description>

- <implementation approach or technical details>
- <user benefit or impact>
- <any important context or considerations>`;
}

/**
 * Generate prompt for Gitmoji style - Standardized emoji-based commits with official specification
 */
function generateGitmojiStylePrompt(config: PromptConfig, customContext: string = ""): string {
  return `${getBaseInstructions(config, customContext)}

GITMOJI CONVENTION (Official gitmoji.dev specification):
Format: <gitmoji> <description>

This follows the official Gitmoji specification with standardized emoji meanings from gitmoji.dev.

🚨 CRITICAL FORMAT RULES:
- Start DIRECTLY with gitmoji emoji - no prefixes like "feat:" or "fix:"
- One space after emoji, then description
- Use ONLY official Gitmoji emojis from the specification
- Do NOT mix with conventional commit types or other formats

OFFICIAL GITMOJI CATEGORIES (choose the most appropriate):

🎉 **Project Lifecycle:**
🎉 **Initial commit** - Begin a project, first commit
🔖 **Version tags** - Release / Version tags
🚀 **Deploying stuff** - Deploy to production
💚 **CI build** - Fix CI Build
👷 **CI system** - Add or update CI build system
📈 **Analytics** - Add or update analytics or track code

✨ **Features & Functionality:**
✨ **New feature** - Introduce new features
🔥 **Remove code** - Remove code or files
💄 **Add/update UI** - Add or update the UI and style files
🎨 **Improve structure** - Improve structure / format of the code
⚡️ **Performance** - Improve performance
💡 **New idea** - Add or update comments in source code

🐛 **Bug Fixes & Issues:**
🐛 **Bug fix** - Fix a bug
🚑️ **Critical hotfix** - Critical hotfix
🩹 **Simple fix** - Simple fix for a non-critical issue
🔒️ **Security** - Fix security issues
🛡️ **Validation** - Add or update validation
⬆️ **Dependencies** - Upgrade dependencies

📚 **Documentation & Content:**
📝 **Documentation** - Add or update documentation
💡 **Comments** - Add or update comments in source code
🔍️ **SEO** - Improve SEO
♿️ **Accessibility** - Improve accessibility
🌐 **Internationalization** - Add or update internationalization and localization

🧪 **Testing & Quality:**
✅ **Tests** - Add, update, or pass tests
🤡 **Mock** - Mock things
🧪 **Experiment** - Perform experiments
💀 **Dead code** - Remove dead code
🏗️ **Architecture** - Make architectural changes

🔧 **Configuration & Tools:**
🔧 **Configuration** - Add or update configuration files
⚙️ **Config files** - Add or update configuration files
📦 **Package** - Add or update compiled files or packages
🏷️ **Types** - Add or update types
🚨 **Linter** - Fix compiler / linter warnings
🍱 **Assets** - Add or update assets

GITMOJI SELECTION STRATEGY:
- Use official emojis from gitmoji.dev only
- Choose based on primary action, not implementation details
- When multiple emojis apply, prioritize user-facing impact
- Consider what developers scanning history need to know quickly
- Refer to official meanings, not personal interpretations

DESCRIPTION REQUIREMENTS:
- Maximum ${config.maxLength} characters total (including emoji)
- Use imperative mood: "Add user authentication" not "Added" or "Adds"
- Be specific and descriptive about the change
- Focus on what was accomplished, not how
- No period at the end

${getBodyRules(config)}

GITMOJI EXAMPLES:
🎉 Initial commit with project structure
✨ Add OAuth2 authentication system
🐛 Fix memory leak in image processing
📝 Update API documentation for v2.0
⚡️ Optimize database query performance
🔒️ Fix XSS vulnerability in user input

🚫 WRONG FORMATS (DO NOT USE):
❌ feat: ✨ Add new feature
❌ 🎨 refactor: Improve code structure
❌ fix(auth): 🐛 Fix login bug

OUTPUT FORMAT:
<gitmoji> <description>

- <technical implementation details>
- <business value or user impact>
- <any breaking changes or important notes>`;
}

/**
 * Generate prompt for Semantic Release style - Automated release-optimized commits
 */
function generateSemanticReleaseStylePrompt(config: PromptConfig, customContext: string = ""): string {
  return `${getBaseInstructions(config, customContext)}

SEMANTIC RELEASE CONVENTION:
Format: <type>: <description>

[optional body]

[optional footer(s)]

This style is optimized for automated semantic versioning and release generation.

SEMANTIC RELEASE TYPES (choose the most appropriate):

**Version Impact Types:**
- **feat**: New feature that adds functionality (MINOR version bump)
  - User-facing capabilities, new API endpoints, new components
  - Triggers automated minor version increment (1.1.0 → 1.2.0)

- **fix**: Bug fix that resolves issues (PATCH version bump)
  - Error corrections, crash fixes, unexpected behavior resolution
  - Triggers automated patch version increment (1.1.0 → 1.1.1)

- **perf**: Performance improvement that doesn't break anything (PATCH version bump)
  - Speed optimizations, memory improvements, efficiency gains
  - Considered a special type of fix for release purposes

**Non-Version Impact Types:**
- **docs**: Documentation changes only (no version bump)
- **style**: Code formatting, whitespace, lint fixes (no version bump)
- **refactor**: Code restructuring without behavior change (no version bump)
- **test**: Test additions or modifications (no version bump)
- **build**: Build system, tooling, or dependency changes (no version bump)
- **ci**: Continuous integration configuration changes (no version bump)
- **chore**: Maintenance tasks, tooling updates (no version bump)

**Breaking Changes (MAJOR version bump):**
- Add "!" after type: feat!: or fix!:
- Triggers automated major version increment (1.1.0 → 2.0.0)
- Must include "BREAKING CHANGE:" in footer explaining the breaking change

AUTOMATED RELEASE CONSIDERATIONS:
- Release notes are generated from commit messages
- Type determines version bump strategy
- Body content appears in detailed release notes
- Breaking changes create migration guides automatically
- Scope helps organize release notes by feature area

SCOPE STRATEGY (Release Notes Organization):
Think about how commits will be grouped in automated release notes:
- **api**: Public API changes that affect external consumers
- **ui**: User interface modifications that users will notice
- **core**: Core functionality that affects application behavior
- **config**: Configuration changes that may require user action
- **deps**: Dependency updates that might affect compatibility

DESCRIPTION REQUIREMENTS:
- Maximum ${config.maxLength} characters total (including type)
- Use imperative mood for consistency with git conventions
- Be descriptive enough for automated release note generation
- Focus on user impact rather than implementation details
- No period at the end

FOOTER REQUIREMENTS FOR AUTOMATION:
- "BREAKING CHANGE: <description>" for breaking changes
- "Closes #123" or "Fixes #456" for issue linking
- "Refs #789" for related issues
- Custom footers for metadata (Co-authored-by, etc.)

${getBodyRules(config)}

SEMANTIC RELEASE EXAMPLES:
feat: add user profile management dashboard
fix: resolve authentication timeout errors
feat!: redesign REST API with new response format
perf: optimize image loading with lazy loading strategy
docs: add deployment guide for Docker environments

BREAKING CHANGE EXAMPLE:
feat!: redesign user authentication API

- Replace session-based auth with JWT tokens
- Improve security with refresh token rotation
- Add support for multi-factor authentication

BREAKING CHANGE: Authentication endpoints now return JWT tokens instead of session cookies. Clients must update to handle Authorization header instead of cookie-based authentication.

OUTPUT FORMAT:
<type>: <description>

- <detailed explanation for release notes>
- <user impact or business value>
- <any migration notes or breaking changes>`;
}

/**
 * Generate prompt for Commitizen style - Interactive guided commits with validation
 */
function generateCommitizenStylePrompt(config: PromptConfig, customContext: string = ""): string {
  return `${getBaseInstructions(config, customContext)}

COMMITIZEN CONVENTION:
Format: <type>(<scope>): <description>

[optional body]

[optional footer]

This follows Commitizen's guided commit approach with strict validation and consistency enforcement.

COMMITIZEN TYPES (validated and enforced):

**Primary Impact Types:**
- **feat**: A new feature for users or a new capability
  - Must provide clear user value or new functionality
  - Examples: new API endpoints, UI components, business features

- **fix**: A bug fix that resolves incorrect behavior
  - Must address a specific problem or error
  - Examples: crashes, incorrect calculations, broken workflows

**Code Quality Types:**
- **docs**: Documentation only changes
  - README, API docs, code comments, user guides
  - No functional code changes allowed

- **style**: Formatting, missing semi colons, etc; no production code change
  - Whitespace, indentation, linting fixes only
  - Zero impact on code execution or behavior

- **refactor**: A code change that neither fixes a bug nor adds a feature
  - Internal restructuring without external behavior change
  - Examples: extracting methods, renaming variables, architectural improvements

- **perf**: A code change that improves performance
  - Measurable speed, memory, or efficiency improvements
  - Must not change external behavior or add features

- **test**: Adding missing tests or correcting existing tests
  - Test code changes only, no production code modifications
  - Examples: unit tests, integration tests, test utilities

**Infrastructure Types:**
- **build**: Changes that affect the build system or external dependencies
  - package.json, webpack config, build scripts
  - Examples: dependency updates, build tool configuration

- **ci**: Changes to CI configuration files and scripts
  - GitHub Actions, Jenkins, deployment pipelines
  - Examples: workflow updates, automation improvements

- **chore**: Other changes that don't modify src or test files
  - Maintenance tasks, tooling, configuration
  - Examples: .gitignore, editor config, routine updates

- **revert**: Reverts a previous commit
  - Must reference the reverted commit
  - Include explanation of why revert was necessary

COMMITIZEN SCOPE VALIDATION:
Scopes must be predefined and validated. Common enterprise scopes:
- **Component-based**: auth, dashboard, profile, admin, reports
- **Layer-based**: api, ui, database, cache, queue
- **Service-based**: user-service, payment-service, notification-service
- **Platform-based**: web, mobile, desktop, backend

COMMITIZEN VALIDATION RULES:
- Type must be from approved list (no custom types)
- Scope must be from predefined list (if scopes are enforced)
- Subject line must be ${config.maxLength} characters or less
- Must use imperative mood (validated by tooling)
- First letter must be lowercase after colon
- No period at end of subject line
- Body must be separated by blank line
- Breaking changes must be indicated properly

GUIDED PROMPTING APPROACH:
Commitizen tools typically prompt for:
1. Type selection from predefined list
2. Scope selection (if applicable)
3. Short description with character counting
4. Longer description for body (optional)
5. Breaking changes confirmation
6. Issues closed by this commit

${getBodyRules(config)}

COMMITIZEN EXAMPLES:
feat(auth): add OAuth2 integration with Google and GitHub
fix(api): resolve timeout issues in user profile endpoints
docs(readme): update installation instructions for new dependencies
refactor(utils): extract common validation logic to shared module
test(auth): add comprehensive unit tests for login flow

ENTERPRISE VALIDATION EXAMPLE:
feat(dashboard): add real-time analytics widgets

- Implement WebSocket connection for live data updates
- Add configurable refresh intervals for different data types
- Include error handling and reconnection logic for network issues

Closes #234, #267
Refs #156

OUTPUT FORMAT:
<type>(<scope>): <description>

- <implementation details for team context>
- <business justification or user value>
- <any validation notes or breaking changes>`;
}

/**
 * Generate prompt for Karma (Google) style - Google's strict enterprise commit convention
 */
function generateKarmaStylePrompt(config: PromptConfig, customContext: string = ""): string {
  return `${getBaseInstructions(config, customContext)}

KARMA (GOOGLE) COMMIT CONVENTION:
Format: <type>(<scope>): <description>

<body>

<footer>

This follows Google's Karma project conventions with strict scope requirements and enterprise-grade structure.

KARMA COMMIT TYPES (Google specification):

**User-Facing Types:**
- **feat**: New feature that adds user-visible functionality
  - Must provide clear end-user value
  - Examples: new UI components, API endpoints, user workflows

- **fix**: Bug fix that resolves user-impacting issues
  - Must address specific problems users experience
  - Examples: crash fixes, incorrect behavior, broken features

**Code Quality Types:**
- **docs**: Documentation improvements or additions
  - Technical documentation, API docs, code comments
  - Must improve developer or user understanding

- **style**: Code formatting changes with no functional impact
  - Linting fixes, whitespace, formatting consistency
  - Zero behavioral changes to application

- **refactor**: Code restructuring without behavior modification
  - Internal improvements maintaining same external interface
  - Examples: performance optimization, code organization

- **test**: Test-related changes and improvements
  - Adding tests, fixing test failures, test infrastructure
  - Examples: unit tests, integration tests, test utilities

**Infrastructure Types:**
- **chore**: Maintenance tasks and routine updates
  - Build scripts, dependency updates, tooling changes
  - Examples: package updates, configuration changes

GOOGLE SCOPE REQUIREMENTS (MANDATORY):
Unlike other conventions, Karma/Google requires scopes and enforces strict scope boundaries:

**Google-Style Scope Categories:**
- **Module scopes**: specific functional modules (auth, router, http, forms)
- **Package scopes**: npm package or library names (core, common, platform-browser)
- **Feature scopes**: user-facing feature areas (dashboard, profile, admin)
- **Technical scopes**: infrastructure components (build, testing, ci)

**Scope Validation Rules:**
- Scope is REQUIRED, not optional
- Must be from predefined approved list
- Should represent clear architectural boundary
- Must be lowercase, kebab-case for multi-word scopes
- Should align with codebase module structure

**Google Scope Selection Strategy:**
Think in terms of Google's monorepo architecture:
- Use package names for library changes (angular/core, angular/router)
- Use feature names for application changes (gmail, drive, docs)
- Use technical names for infrastructure (bazel, buildtools, ci)

KARMA DESCRIPTION REQUIREMENTS:
- Maximum ${config.maxLength} characters including type and scope
- Must use imperative mood (Google standard)
- First letter lowercase after colon
- Be specific about the change made
- Focus on what changed, not why (details go in body)
- No period at end

GOOGLE BODY REQUIREMENTS:
- Separated by blank line from subject
- Explain the motivation and implementation approach
- Include details about the change that aren't obvious
- Reference design docs, bug reports, or related issues
- Wrap at 72 characters per line

GOOGLE FOOTER REQUIREMENTS:
- Include breaking changes with "BREAKING CHANGE:" prefix
- Reference issues with "Fixes #123" or "Closes #456"
- Include review information "Reviewed-by:" if applicable
- Add "Co-authored-by:" for pair programming

${getBodyRules(config)}

KARMA/GOOGLE EXAMPLES:
feat(router): add lazy loading support for feature modules
fix(http): resolve memory leak in HTTP interceptor chain
docs(forms): update reactive forms guide with new examples
refactor(core): optimize change detection for better performance
test(common): add comprehensive tests for pipe functionality

GOOGLE ENTERPRISE EXAMPLE:
feat(auth): implement enterprise SSO integration

- Add SAML 2.0 support for enterprise authentication
- Integrate with Google Workspace identity provider
- Include automatic role mapping from LDAP groups
- Add audit logging for compliance requirements

BREAKING CHANGE: Authentication service constructor now requires SAMLConfig parameter. Update all authentication service instantiations to include SAML configuration.

Fixes #1234, #1567
Reviewed-by: engineering-lead@google.com
Co-authored-by: security-team@google.com

OUTPUT FORMAT:
<type>(<scope>): <description>

- <detailed technical implementation>
- <architectural considerations>
- <impact on other systems or components>`;
}

/**
 * Generate prompt for Linux Kernel style - Traditional kernel development convention
 */
function generateLinuxKernelStylePrompt(config: PromptConfig, customContext: string = ""): string {
  return `${getBaseInstructions(config, customContext)}

LINUX KERNEL COMMIT CONVENTION:
Format: <subsystem>: <description>

<body explaining what and why>

Signed-off-by: Author Name <email>

This follows the traditional Linux kernel development style with subsystem prefixes and detailed explanations.

KERNEL SUBSYSTEM STRATEGY:
Think in terms of kernel architecture and maintainer boundaries:

**Core Kernel Subsystems:**
- **mm**: Memory management (allocation, paging, virtual memory)
- **fs**: File systems (VFS, specific filesystems, I/O)
- **net**: Networking stack (protocols, drivers, packet handling)
- **sched**: Process scheduler and load balancing
- **locking**: Synchronization primitives and locking mechanisms
- **irq**: Interrupt handling and management
- **time**: Timekeeping and timer subsystems
- **power**: Power management and ACPI

**Driver Subsystems:**
- **block**: Block device drivers and infrastructure
- **char**: Character device drivers
- **gpu**: Graphics drivers and DRM subsystem
- **usb**: USB subsystem and drivers
- **pci**: PCI subsystem and device handling
- **input**: Input device drivers (keyboard, mouse, touchpad)
- **sound**: Audio drivers and ALSA subsystem

**Architecture Subsystems:**
- **x86**: x86-specific code and features
- **arm**: ARM architecture support
- **riscv**: RISC-V architecture implementation
- **powerpc**: PowerPC architecture code

**Development Subsystems:**
- **tools**: User-space tools and utilities
- **docs**: Documentation and guides
- **scripts**: Build scripts and automation
- **kbuild**: Build system and configuration

**Application-Specific Subsystem Mapping:**
For non-kernel projects, adapt subsystem thinking:
- **auth**: Authentication and authorization systems
- **api**: REST API endpoints and handlers
- **ui**: User interface components and layouts
- **db**: Database interactions and migrations
- **cache**: Caching layer and strategies
- **queue**: Message queues and background processing
- **config**: Configuration management
- **deploy**: Deployment and infrastructure

KERNEL DESCRIPTION REQUIREMENTS:
- Maximum ${config.maxLength} characters including subsystem prefix
- Use imperative mood (kernel standard)
- Be specific about what was changed
- Focus on the functional change, not implementation details
- No period at end of subject line
- Capitalize first word after colon

KERNEL BODY REQUIREMENTS (CRITICAL):
The body must explain both WHAT and WHY:
- **What changed**: Describe the modification in technical detail
- **Why it was needed**: Explain the problem being solved
- **How it works**: Implementation approach if complex
- **Testing performed**: What testing was done
- **Potential impacts**: Side effects or considerations

KERNEL FOOTER REQUIREMENTS:
- **Signed-off-by**: Developer Certificate of Origin (mandatory)
- **Reviewed-by**: Code reviewer acknowledgment
- **Tested-by**: Tester confirmation
- **Fixes**: Reference to bug report or regression
- **Cc**: Additional stakeholders or mailing lists

${getBodyRules(config)}

LINUX KERNEL EXAMPLES:
mm: fix memory leak in page allocation error path
net: add support for IPv6 extension header parsing
fs: improve error handling in file system mount operations
sched: optimize load balancing for NUMA systems
docs: update networking documentation for new features

KERNEL DEVELOPMENT EXAMPLE:
net: fix use-after-free in TCP socket cleanup

When a TCP socket is closed while data is still being transmitted,
the socket cleanup code was freeing memory that could still be
accessed by the network stack. This resulted in use-after-free
errors and potential system crashes under high load.

This patch adds proper reference counting to ensure the socket
memory remains valid until all network operations complete.
The fix has been tested under stress conditions with no observed
crashes or memory corruption.

Fixes: commit abc123def456 ("net: optimize TCP socket handling")
Reported-by: user@example.com
Tested-by: qa-team@company.com
Signed-off-by: Developer Name <developer@company.com>

OUTPUT FORMAT:
<subsystem>: <description>

- <detailed explanation of what was changed>
- <explanation of why the change was necessary>
- <any testing performed or important considerations>

Signed-off-by: Author Name <email@company.com>`;
}

/**
 * Generate prompt for jQuery style - JavaScript project convention with issue tracking
 */
function generateJQueryStylePrompt(config: PromptConfig, customContext: string = ""): string {
  return `${getBaseInstructions(config, customContext)}

JQUERY COMMIT CONVENTION:
Format: <Component>: <Description>. Fixes #<issue>

<Body>

This follows jQuery and many JavaScript projects' convention with component prefixes and issue tracking.

JAVASCRIPT COMPONENT STRATEGY:
Think in terms of JavaScript architecture and user-facing components:

**Frontend Components:**
- **Core**: Core library functionality, main API, fundamental features
- **UI**: User interface components, widgets, visual elements
- **Events**: Event handling, custom events, event delegation
- **Ajax**: HTTP requests, data fetching, API communication
- **Animations**: Visual effects, transitions, motion graphics
- **Utilities**: Helper functions, common utilities, shared logic
- **Selectors**: Element selection, DOM querying, filtering

**Framework Components:**
- **Router**: Navigation, URL handling, route management
- **State**: State management, data flow, application state
- **Forms**: Form handling, validation, input management
- **Data**: Data binding, models, data transformation
- **Templates**: Template rendering, view generation
- **Plugins**: Plugin system, extensibility, third-party integrations

**Build and Development:**
- **Build**: Build system, compilation, bundling
- **Tests**: Testing framework, test utilities, test coverage
- **Docs**: Documentation, examples, API references
- **Tools**: Development tools, CLI utilities, automation

**Application-Specific Components:**
Adapt for your project's architecture:
- **Auth**: Authentication, login, user management
- **Dashboard**: Dashboard components, analytics, metrics
- **Profile**: User profile, settings, preferences
- **Admin**: Administrative interface, management tools
- **API**: Backend API, endpoints, data services

JQUERY DESCRIPTION REQUIREMENTS:
- Maximum ${config.maxLength} characters including component and issue reference
- Use imperative mood (jQuery standard)
- Be descriptive about what was accomplished
- Focus on user-visible changes when possible
- Capitalize component name and first word of description
- Always end with ". Fixes #123" or ". Closes #123" format

ISSUE REFERENCE REQUIREMENTS:
- Must include issue number in format ". Fixes #123"
- Use "Fixes" for bug fixes and problem resolution
- Use "Closes" for feature completion and enhancements
- Use "Refs" for related issues that aren't fully resolved
- Multiple issues: ". Fixes #123, #456"

JQUERY BODY APPROACH:
- Explain the implementation approach taken
- Describe any API changes or breaking changes
- Include browser compatibility notes if relevant
- Mention performance implications
- Reference related issues or pull requests

${getBodyRules(config)}

JQUERY EXAMPLES:
Core: Add support for ES6 modules and tree shaking. Fixes #2841
UI: Improve accessibility in modal dialog components. Fixes #3102
Events: Fix memory leak in event delegation cleanup. Fixes #2967
Ajax: Add timeout support for fetch-based requests. Fixes #3045
Build: Update webpack configuration for better debugging. Fixes #2834

JQUERY PROJECT EXAMPLE:
Events: Add custom event namespace support for better event management. Fixes #2756

This enhancement allows developers to create namespaced custom events
that can be triggered and handled independently without conflicts.
The implementation maintains backward compatibility with existing
event handling code while providing more powerful event organization.

Added new methods:
- .triggerNamespace() for namespaced event triggering
- .offNamespace() for removing namespaced event handlers
- .onNamespace() for registering namespaced event listeners

All modern browsers are supported including IE11. Performance testing
shows negligible impact on event handling speed.

Closes #2756, #2834
Refs #2901

OUTPUT FORMAT:
<Component>: <Description>. Fixes #<issue>

- <implementation details and approach>
- <any API changes or breaking changes>
- <browser compatibility or performance notes>`;
}

/**
 * Generate commit prompt based on style
 */
export async function generateCommitPrompt(
  diff: string,
  config: PromptConfig = DEFAULT_PROMPT_CONFIG,
  customContext: string = ""
): Promise<string> {
  debugLog('[DEBUG] generateCommitPrompt called with config:', config);
  debugLog('[DEBUG] Style:', config.style);
  debugLog('[DEBUG] maxBodyLines value:', config.maxBodyLines);

  let prompt: string;

  // Generate style-specific prompt
  switch (config.style) {
    case 'conventional':
      prompt = generateConventionalStylePrompt(config, customContext);
      debugLog('[DEBUG] Generated conventional commits prompt');
      break;
    case 'angular':
      prompt = generateAngularStylePrompt(config, customContext);
      debugLog('[DEBUG] Generated Angular style prompt');
      break;
    case 'ember':
      prompt = generateEmberStylePrompt(config, customContext);
      debugLog('[DEBUG] Generated Ember.js style prompt');
      break;
    case 'emojigit':
      prompt = generateEmojiGitStylePrompt(config, customContext);
      debugLog('[DEBUG] Generated EmojiGit style prompt');
      break;
    case 'gitmoji':
      prompt = generateGitmojiStylePrompt(config, customContext);
      debugLog('[DEBUG] Generated Gitmoji style prompt');
      break;
    case 'semantic':
      prompt = generateSemanticReleaseStylePrompt(config, customContext);
      debugLog('[DEBUG] Generated Semantic Release style prompt');
      break;
    case 'commitizen':
      prompt = generateCommitizenStylePrompt(config, customContext);
      debugLog('[DEBUG] Generated Commitizen style prompt');
      break;
    case 'karma':
      prompt = generateKarmaStylePrompt(config, customContext);
      debugLog('[DEBUG] Generated Karma (Google) style prompt');
      break;
    case 'linux':
      prompt = generateLinuxKernelStylePrompt(config, customContext);
      debugLog('[DEBUG] Generated Linux Kernel style prompt');
      break;
    case 'jquery':
      prompt = generateJQueryStylePrompt(config, customContext);
      debugLog('[DEBUG] Generated jQuery style prompt');
      break;
    case 'basic':
    default:
      prompt = generateBasicStylePrompt(config, customContext);
      debugLog('[DEBUG] Generated basic style prompt');
      break;
  }

  // Add the diff at the very end
  prompt += `

DIFF TO ANALYZE:
---
${diff}
---

Generate the commit message now following the exact format specified above:`;

  debugLog('[DEBUG] Final prompt length:', prompt.length);
  return prompt;
}

/**
 * Generate prompt for analyzing commit history messages
 */
export function generateCommitHistoryAnalysisPrompt(
  commitHistory: string,
  _maxCommits?: number,
  includeAuthorInfo?: boolean
): string {
  const prompt = `# GitMind Pro: Commit Message Analysis Report

You are an expert Git workflow consultant. Analyze the provided commit message history and deliver actionable insights to transform this project's commit practices. Use your expertise to make informed decisions about what's best for this specific codebase. Deliver a comprehensive report on the current state and recommendations for improvement.

## Analysis Requirements

Please provide a complete analysis covering:

### 1. Format Detection & Classification
Identify and categorize all commit message patterns found in the history. Consider formats like:
- Conventional Commits, Angular, Semantic styles
- Multi-line formats with bodies and bullet points  
- Open-source patterns (Linux Kernel, Node.js, React, etc.)
- Enterprise formats (Jira integration, ticket references)
- Gitmoji, GitHub/GitLab styles, monorepo patterns
- Any custom or hybrid approaches

### 2. Statistical Analysis Table
Provide a detailed statistics table including:

| Metric | Value | Percentage |
|--------|-------|------------|
| Total Commits Analyzed | [number] | 100% |
| Single-line Messages | [number] | [%] |
| Multi-line Messages | [number] | [%] |
| Messages with Body | [number] | [%] |
| Messages with Footers | [number] | [%] |
| Average Subject Length | [number] chars | - |
| Longest Subject | [number] chars | - |
| Shortest Subject | [number] chars | - |
| Messages > 50 chars | [number] | [%] |
| Messages > 72 chars | [number] | [%] |
| Properly Capitalized | [number] | [%] |
| Using Imperative Mood | [number] | [%] |
| With Type Prefix | [number] | [%] |
| With Scope | [number] | [%] |
| With Issue References | [number] | [%] |

### 3. Format Distribution Analysis
Break down the formats found:

| Format Type | Count | Percentage | Examples |
|-------------|-------|------------|----------|
| [Format 1] | [number] | [%] | [example] |
| [Format 2] | [number] | [%] | [example] |
| [etc.] | [number] | [%] | [example] |

### 4. Type & Scope Analysis
If conventional formats are used:

| Type | Count | Percentage | Most Common Scopes |
|------|-------|------------|-------------------|
| feat | [number] | [%] | [scope1, scope2, scope3] |
| fix | [number] | [%] | [scope1, scope2, scope3] |
| docs | [number] | [%] | [scope1, scope2, scope3] |
| [etc.] | [number] | [%] | [scope1, scope2, scope3] |

### 5. Quality Assessment
Evaluate and categorize messages by quality:

| Quality Level | Count | Percentage | Characteristics |
|---------------|-------|------------|-----------------|
| Excellent | [number] | [%] | [description] |
| Good | [number] | [%] | [description] |
| Average | [number] | [%] | [description] |
| Poor | [number] | [%] | [description] |
| Very Poor | [number] | [%] | [description] |

### 6. Current Commit Style Analysis

**Predominant Style Identified:**
'''
Style Name: [e.g., "Informal Descriptive", "Partial Conventional", "Mixed Angular", etc.]

    Pattern: [describe the most common pattern]

    Characteristics:
    -[characteristic 1]
        - [characteristic 2]
        - [characteristic 3]

Typical Examples from History:
    -[actual example 1]
        - [actual example 2]
        - [actual example 3]

Strengths of Current Style:
    -[strength 1]
        - [strength 2]

Weaknesses of Current Style:
    -[weakness 1]
        - [weakness 2]
            '''

### 7. Improved Style Recommendation

**Recommended Enhanced Style:**

Style Name: [e.g., "Enhanced Conventional Commits", "Structured Descriptive", etc.]

Format Specification:
    [provide complete format with all components]

    Template:
    <type>(<scope>): <subject>

        [optional body]

        [optional footer]

Type Definitions:
    - feat: [definition for this project]
    - fix: [definition for this project]
    - docs: [definition for this project]
    - style: [definition for this project]
    - refactor: [definition for this project]
    - test: [definition for this project]
    - chore: [definition for this project]

Scope Guidelines:
    -[scope 1]: [when to use]
        - [scope 2]: [when to use]
            - [scope 3]: [when to use]

Subject Line Rules:
    -[rule 1]
        - [rule 2]
        - [rule 3]

Body Guidelines:
    -[guideline 1]
        - [guideline 2]

Footer Standards:
    -[standard 1]
        - [standard 2]

### 8. Style Comparison & Migration

        ** Current vs.Improved Style Comparison:**

| Aspect | Current Style | Improved Style | Benefit |
| --------| ---------------| ----------------| ---------|
| Format Consistency | [assessment] | [improvement] | [benefit] |
| Information Clarity | [assessment] | [improvement] | [benefit] |
| Tool Integration | [assessment] | [improvement] | [benefit] |
| Team Scalability | [assessment] | [improvement] | [benefit] |
| Maintenance Ease | [assessment] | [improvement] | [benefit] |

** Migration Examples:**

        Show how existing commits would be improved:

    '''
    BEFORE(Current Style):
    [actual commit from history]

    AFTER(Improved Style):
    [same commit rewritten in improved style]

Improvements Made:
    -[improvement 1]
        - [improvement 2]
            '''

### 9. Detailed Findings Report
        ** Strengths:**
            - List positive patterns and well - executed examples
                - Highlight consistent practices that work well

                    ** Weaknesses:**
                        - Identify common problems and anti - patterns
                            - Point out inconsistencies and missing information
                                - Show examples of problematic messages

                                    ** Inconsistencies:**
                                        - Document mixed formats and style variations
                                            - Note contributor - specific differences
                                                - Highlight evolution of practices over time

### 10. Implementation Plan
Provide a practical roadmap:
- ** Immediate actions ** (templates, tools, critical fixes)
- ** Short - term goals ** (team adoption, enforcement setup)
- ** Long - term strategy ** (monitoring, continuous improvement)
- ** Tool recommendations ** with specific configurations


## Expected Output Format

Please structure your response with clear headings and include all the statistical tables requested above.Make specific recommendations rather than general suggestions, and base everything on the actual commit history provided.
NOTE: The final report should be well-structured MARKDOWN format with table of contents.

${includeAuthorInfo ? `## Team Collaboration Insights
[Author contribution patterns and collaboration analysis]

` : ''}

**IMPORTANT:** Focus heavily on identifying the current predominant style and providing a clear, improved style that builds upon what the team is already doing while addressing the identified weaknesses.

---

**COMMIT HISTORY TO ANALYZE:**

${commitHistory}

---
`;

  return prompt;
}