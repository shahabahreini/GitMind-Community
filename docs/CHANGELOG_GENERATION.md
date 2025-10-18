# GitMind Pro: Changelog Generation - Technical Documentation

## Overview
Professional AI-powered changelog generation with intelligent version detection, policy awareness, and robust token management.

## Token Management & Optimization

### Intelligent Token Calculation

The system performs comprehensive token estimation before API calls:

**Estimation Components:**
- **Commit History**: All commit messages and metadata
- **Existing Changelog**: First 5000 characters for style reference
- **Policy Instructions**: Dynamic formatting rules
- **Base Prompt**: Template text (~1500 tokens)
- **Response Reserve**: 2500 tokens for AI response

**Total Token Formula:**
```
totalTokens = basePrompt(1500) + commits + changelog + policy + response(2500)
```

**Safety Limits:**
- Maximum: 100,000 tokens (conservative across all AI providers)
- Typical changelog: 45,000-60,000 tokens for 100 commits
- Large repositories: Auto-adjusted to fit limits

### Automatic Adjustment System

When token limits are exceeded:

```typescript
1. Calculate tokens per commit (avgTokens = totalCommitTokens / commitCount)
2. Determine available space (available = 100k - overhead - response)
3. Calculate safe commit count (safe = available / avgTokens)
4. Reduce proportionally across versions
5. Warn user with specific details
6. Request confirmation
```

**Example Adjustment:**
```
Initial: 250 commits → 125,000 tokens ❌
Adjusted: 75 commits → 95,000 tokens ✅

User sees:
"Initial prompt size (125,000 tokens) exceeds recommended limit.
 Reducing to 75 commits to fit within token limits."
```

### Handling Large Repositories

**Strategies for 1000+ commit repositories:**

**1. Incremental Updates** (Recommended)
```bash
- First run: Generate full changelog
- Subsequent runs: Update mode (only new commits)
- Token usage: Minimal (10-50 commits typically)
```

**2. Version-Scoped Generation**
```bash
- Use git tags to create boundaries
- System automatically groups by version
- Each version processed separately
```

**3. Adjust Max Commits Setting**
```json
{
  "gitmind.pro.changelog.maxCommits": 50  // Reduce from default 100
}
```

**4. Strategic Commit Selection**
```bash
- System prioritizes recent commits
- Proportional reduction across versions
- Maintains version distribution
```

### Debug Logging

Enable detailed token information:

**settings.json:**
```json
{
  "gitmind.debug": true
}
```

**Debug Output Example:**
```
[GitMind Debug] Token estimation: {
  commitTokens: 45000,
  changelogTokens: 1200,
  policyTokens: 350,
  promptTokens: 47550,
  totalTokens: 50050,
  isWithinLimit: true,
  recommendedMaxCommits: null
}

[GitMind Debug] Final token estimation before API call: {
  totalTokens: 48250,
  isWithinLimit: true
}
```

## Changelog Policy Awareness

### Structure Detection

Analyzes existing CHANGELOG.md:

**Format Elements:**
- Version format (v1.2.3 vs 1.2.3)
- Bullet style (-, *, +)
- Date format (YYYY-MM-DD, presence/absence)
- Emoji usage (yes/no)
- Indentation (spaces/none)

**Content Structure:**
- Existing categories
- Custom categories
- Breaking Changes section
- Technical section
- Keep a Changelog header

### Dynamic Prompt Generation

AI prompt adapts based on detected policy:

**Without Existing Changelog:**
```
Standard Keep a Changelog format
Default categories
Professional tone, no emojis
```

**With Existing Changelog:**
```
Match version format: v1.2.3
Use bullet style: -
Follow categories: Added, Changed, Fixed, Custom Category
Emoji policy: None
CRITICAL: Match existing structure EXACTLY
```

## Version Detection (3-Tier Strategy)

### 1. Git Tags (Primary)

**Detection:**
```bash
git tag --sort=-version:refname --format="%(refname:short)|%(creatordate:short)"
```

**Supported Formats:**
- `v1.2.3`, `v1.2.3-beta`, `v1.2.3-rc1`
- `1.2.3`, `1.2.3-alpha`, `1.2.3-preview`

**Grouping:**
- Commits grouped between tags
- Sorted by semantic versioning
- Natural version boundaries

### 2. Commit Message Analysis (Secondary)

**Detected Patterns:**
```
✅ chore: bump version to 4.3.0
✅ build(release): update version to v1.2.3
✅ release: version 2.0.0
✅ chore(build): update version to 4.2.2
✅ version: 4.2.2
✅ update package.json to 3.1.0
```

**Regex Pattern:**
```typescript
/(?:bump|update|release|version|chore|build).*?(?:to\s+)?v?(\d+\.\d+\.\d+(?:[.-]\w+)?)/i
```

### 3. package.json Detection (Enhanced)

**Process:**
```typescript
1. For each commit hash
2. Read package.json at that commit: git show <hash>:package.json
3. Extract version field
4. Add to commit metadata
5. Use in version detection
```

**Works for:**
- JavaScript/TypeScript projects
- Node.js applications
- NPM packages
- Any project with package.json

### 4. Fallback Strategy

**When no versions detected:**
```markdown
## Unreleased

### Added
- All new features

### Fixed
- All bug fixes
```

## User Guidance System

### Interactive Tips Modal

**Shown before generation:**
```
GitMind Changelog Generator Tips

✅ Best Practices:
• Tag your releases with semantic versions
• Include version in commit messages
• Update package.json before committing
• Use conventional commit format
• Write clear, descriptive commit messages

🎯 Version Detection:
• Git tags are detected automatically
• Version bumps in commit messages are analyzed
• package.json changes are tracked
• Fallback to "Unreleased" if no versions found

📋 Changelog Policy:
• Existing CHANGELOG.md structure will be matched exactly
• Categories, bullet style, and format will be preserved
• AI will maintain your established conventions

[Continue] [Learn More] [Cancel]
```

**Actions:**
- **Continue**: Proceed with generation
- **Learn More**: Opens documentation
- **Cancel**: Exit without generating

## Configuration Settings

### Pro Feature Settings

```json
{
  "gitmind.pro.changelog.enabled": true,
  "gitmind.pro.changelog.maxCommits": 100,
  "gitmind.pro.changelog.groupByVersion": true
}
```

**Settings Details:**

**enabled** (boolean, default: true)
- Enable/disable changelog generation feature
- Pro subscription required

**maxCommits** (number, default: 100, range: 10-500)
- Maximum commits to analyze
- Auto-adjusted if exceeds token limits
- Higher values = more comprehensive, more tokens

**groupByVersion** (boolean, default: true)
- Group entries by detected versions
- false: Treat as single "Recent Changes" block
- Recommended: true for better organization

## Commands

### Generate Changelog (Interactive)

**Command:** `GitMind: Generate Changelog from Git History (Pro)`

**Options:**
1. **Generate New Changelog**
   - Creates CHANGELOG.md from scratch
   - Analyzes all git history
   - Comprehensive changelog

2. **Update Existing Changelog**
   - Adds new entries to existing file
   - Analyzes commits since last version
   - Prepends new sections

3. **Generate Changelog Preview**
   - Opens in editor for review
   - No file modification
   - Allows manual review before saving

### Update Changelog (Quick)

**Command:** `GitMind: Update Changelog (Pro)`

**Behavior:**
- Skips tips modal
- Directly generates update
- Prepends to existing CHANGELOG.md
- Best for regular updates

## API Integration

### Timeout Configuration

```typescript
const CHANGELOG_TIMEOUT = 480000; // 8 minutes
```

**Rationale:**
- Large commit histories take time to analyze
- AI processing for 100 commits: 2-5 minutes
- Network latency buffer
- Retry attempts

### Error Handling

**Token Limit Errors:**
```
If prompt > 100k tokens:
→ Auto-reduce commits
→ Show warning
→ Request confirmation
```

**API Errors:**
```
Try: Call AI with prompt
Catch: Log error details
Finally: Show user-friendly message
```

**Network Errors:**
```
Timeout after 8 minutes
Show: "Request timed out. Try reducing max commits setting."
```

## Best Practices

### For Maximum Quality

**1. Use Git Tags**
```bash
git tag -a v1.2.3 -m "Release 1.2.3"
git push --tags
```

**2. Conventional Commits**
```bash
feat: add user authentication
fix: resolve login redirect issue
chore: bump version to 1.2.3
```

**3. Regular Updates**
```bash
# After each release
Run: GitMind: Update Changelog
Result: Only new commits analyzed
```

**4. Descriptive Messages**
```bash
Good: "feat(auth): implement OAuth2 with Google provider"
Bad: "update file"
```

### For Large Repositories

**1. Reduce Max Commits**
```json
{ "gitmind.pro.changelog.maxCommits": 50 }
```

**2. Use Version Tags**
```bash
# Natural boundaries
v1.0.0 (100 commits)
v2.0.0 (150 commits)
→ Each analyzed separately
```

**3. Incremental Generation**
```bash
Initial: Generate full changelog
Updates: Only new commits (10-20 commits)
```

**4. Monitor Token Usage**
```json
{ "gitmind.debug": true }
```

## Troubleshooting

### Issue: Token limit exceeded

**Solution:**
1. Reduce `maxCommits` setting (50-75)
2. Use incremental updates instead of full generation
3. Ensure git tags for version boundaries
4. Review warning and proceed with auto-adjustment

### Issue: No versions detected

**Solution:**
1. Add git tags: `git tag v1.0.0`
2. Include version in commits: `chore: bump to 1.0.0`
3. Update package.json version
4. Accept "Unreleased" fallback

### Issue: Changelog format not matching

**Solution:**
1. Ensure CHANGELOG.md exists first
2. System auto-detects on update mode
3. Check existing format manually
4. Debug logging shows detected policy

### Issue: Generation timeout

**Solution:**
1. Reduce max commits (< 100)
2. Check network connection
3. Try different AI provider
4. Use preview mode to test

## Performance Characteristics

**Typical Performance:**
- 50 commits: 30-90 seconds
- 100 commits: 60-180 seconds
- 200+ commits: Auto-reduced or 3-5 minutes

**Token Usage:**
- Average commit: 150-200 tokens
- 100 commits: ~15,000-20,000 tokens (commit data)
- Total prompt: ~45,000-55,000 tokens
- Response: ~500-2,000 tokens

**Memory Usage:**
- Minimal (< 50MB)
- Git operations: Streaming
- Token estimation: In-memory
- AI API: Streaming response

## Security & Privacy

**Data Handling:**
- Commit data sent to selected AI provider only
- No data stored by GitMind
- API keys encrypted (Pro feature)
- Local git operations only

**What's Sent:**
- Commit hashes, messages, authors, dates
- Existing changelog excerpt (5000 chars)
- No file contents
- No repository names

**What's NOT Sent:**
- Source code
- File contents
- Credentials
- Repository URLs
