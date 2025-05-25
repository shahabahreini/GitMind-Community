import { CommitStyle } from "../../config/types";

export interface PromptConfig {
    style?: CommitStyle;
    maxLength?: number;
    includeScope?: boolean;
}

export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
    maxLength: 72,
    includeScope: true
};

export function generateCommitPrompt(
    diff: string,
    config: PromptConfig = DEFAULT_PROMPT_CONFIG,
    customContext: string = ""
): string {
    let prompt = `You are a Git commit message generator. Your task is to analyze the provided diff and create exactly ONE complete commit message. Do not truncate, summarize, or add ellipsis (...).

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE commit message, never truncate with "..."
- Write the FULL subject line and body
- Do not explain your reasoning or provide alternatives
- Output only the commit message itself`;

    // Add custom context if provided
    if (customContext.trim()) {
        prompt += `\n\nUser Context: ${customContext.trim()}`;
    }

    prompt += `

DIFF TO ANALYZE:
${diff}

REQUIRED FORMAT:
<type>${config.includeScope ? '(<scope>)' : ''}: <description>

- <detailed explanation>
- <additional context if needed>

COMMIT TYPES (choose ONE):
- feat: New feature or functionality
- fix: Bug fix or error correction
- docs: Documentation changes only
- style: Code formatting (no logic changes)
- refactor: Code restructuring (no functionality changes)
- test: Adding or modifying tests
- chore: Maintenance, dependencies, build tools
- perf: Performance improvements
- ci: CI/CD configuration changes

SUBJECT LINE RULES:
- Maximum ${config.maxLength} characters total
- Use imperative mood ("add", "fix", "update")
- Be specific about the change
- No period at the end
${config.includeScope ? '- Include scope in parentheses if applicable' : ''}

BODY RULES:
- Start each line with "- "
- Explain WHAT changed and WHY
- Include context that helps reviewers understand the change
- Reference issues/tickets if relevant

EXAMPLE OUTPUT:
feat${config.includeScope ? '(auth)' : ''}: add two-factor authentication for user login

- Implement TOTP-based 2FA using authenticator apps
- Add backup codes for account recovery scenarios
- Update login flow to prompt for verification code
- Enhances security for sensitive user accounts

Generate the complete commit message now (no truncation, no explanations):`;

    return prompt;
}