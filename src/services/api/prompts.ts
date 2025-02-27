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

export function generateCommitPrompt(diff: string, config: PromptConfig = DEFAULT_PROMPT_CONFIG): string {
    return `As a Git commit message generator, analyze this specific diff and create ONE commit message that accurately describes these changes:

Git diff content:
${diff}

## Expected Format
<type>${config.includeScope ? '(<scope>)' : ''}: <concise description>

- <detailed change explanation>
- <additional context if needed>

## Commit Message Format

### Subject Line (First Line)
- Begin with ONE appropriate type prefix:
  - 'feat': New feature or functionality
  - 'fix': Bug fix
  - 'docs': Changes to documentation only (README, CHANGELOG, comments, API docs, etc.)
  - 'style': Formatting, whitespace, semicolons (no code logic changes)
  - 'refactor': Code restructuring without changing functionality
  - 'test': Adding or modifying tests
  - 'chore': Maintenance, dependencies, build system changes
  - 'perf': Performance improvements
  - 'ci': CI/CD configuration changes
${config.includeScope ? '- Add scope in parentheses after type if applicable (e.g., feat(auth):)' : ''}
- Follow with a concise, specific description (max ${config.maxLength} characters total)
- Use imperative present tense (e.g., "Add" not "Added" or "Adds")
- Be specific about what changed and where
- No period at the end

### Commit Body (Subsequent Lines)
- Separate from subject with one blank line
- Explain WHAT changed and WHY (not HOW)
- Use bullet points starting with hyphen and space ('- ')
- Include relevant issue/ticket references if applicable

### Examples of Good Commit Messages:
"""
feat${config.includeScope ? '(user)' : ''}: add password strength indicator to signup form

- Implement real-time password validation with color indicators
- Add minimum requirements tooltip for better UX
- Relates to issue #142
"""

"""
fix${config.includeScope ? '(data)' : ''}: resolve race condition in concurrent access

- Add mutex lock around shared resource access
- Prevent potential data corruption during high traffic
"""

Generate exactly ONE commit message following this format. No alternatives or explanations.`;
}