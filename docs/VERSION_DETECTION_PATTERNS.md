# Version Detection Patterns

## Overview

The GitMind changelog feature now supports comprehensive version detection across various development domains and versioning schemes. This document outlines all supported patterns.

## Supported Version Patterns

### 1. Semantic Versioning (SemVer)
**Use Case**: Standard software releases  
**Developers**: All domains

**Git Tag Patterns**:
- `v1.2.3`, `1.2.3` - Standard semantic version
- `v1.2.3-alpha.1` - Pre-release versions
- `v1.2.3-beta.2` - Beta releases
- `v1.2.3-rc.1` - Release candidates
- `1.0.0-rc.1+build.123` - With build metadata

**Commit Message Patterns**:
- `bump to 1.2.3`
- `release v1.2.3`
- `version 1.2.3`
- `chore: bump version to 1.2.3`

---

### 2. Two-Part Versions
**Use Case**: Major.minor versioning  
**Developers**: Frontend, backend, mobile

**Git Tag Patterns**:
- `v1.2`, `1.2`, `v2.0`

**Commit Message Patterns**:
- `bump to v1.2`
- `release 2.0`
- `version 1.2`

---

### 3. Single Version Numbers
**Use Case**: ML models, research projects  
**Developers**: Data science, ML engineers

**Git Tag Patterns**:
- `v1`, `v2`, `v3`
- `r1`, `r2`, `r3` (research/revision)

**Commit Message Patterns**:
- `model v1`
- `model-1.2`

---

### 4. Release Tags
**Use Case**: Formal release management  
**Developers**: DevOps, release managers

**Git Tag Patterns**:
- `release-1.2.3`
- `release/1.2.3`
- `rel-1.2.3`

**Commit Message Patterns**:
- `release 1.2.3`
- `publish version 1.2.3`

---

### 5. Date-Based Versions
**Use Case**: Deployment tracking, time-based releases  
**Developers**: DevOps, enterprise software

**Git Tag Patterns**:
- `2024.01.15` - Dot-separated
- `2024-01-15` - Dash-separated
- `20240115` - Compact format

**Commit Message Patterns**:
- `deploy 2024.01.15`
- `release 2024-01-15`

---

### 6. Year.Month Versions
**Use Case**: Calendar versioning  
**Developers**: Enterprise, SaaS platforms

**Git Tag Patterns**:
- `2024.01`, `24.01`
- `2024.12`, `24.12`

---

### 7. Build Numbers
**Use Case**: CI/CD pipelines  
**Developers**: DevOps, build engineers

**Git Tag Patterns**:
- `build-123`
- `build.456`
- `b123`

**Commit Message Patterns**:
- `build 123`
- `build-456`

---

### 8. Sprint/Iteration Tags
**Use Case**: Agile development  
**Developers**: Scrum teams, agile projects

**Git Tag Patterns**:
- `sprint-12`
- `iteration-5`
- `s12`, `i5`

**Commit Message Patterns**:
- `sprint 12`
- `iteration 5`

---

### 9. Environment-Specific Versions
**Use Case**: Multi-environment deployments  
**Developers**: DevOps, platform engineers

**Git Tag Patterns**:
- `prod-1.2.3`
- `staging-2.0.0`
- `dev-1.0.0`
- `production/1.2.3`

**Commit Message Patterns**:
- `prod 1.2.3`
- `staging 2.0.0`
- `deploy to production 1.2.3`

---

### 10. Database Versions
**Use Case**: Schema migrations, database releases  
**Developers**: Database administrators, backend developers

**Git Tag Patterns**:
- `db-1.2.3`
- `migration-001`
- `schema-v2`
- `database/1.2.3`

**Commit Message Patterns**:
- `migration 001`
- `schema v2`
- `db-1.2.3`

---

### 11. API Versions
**Use Case**: API versioning  
**Developers**: Backend, API developers

**Git Tag Patterns**:
- `api-v1`
- `api/v2`
- `apiv1.2`

**Commit Message Patterns**:
- `api v1`
- `api/v2`
- `api version 1.2`

---

### 12. Container/Docker Tags
**Use Case**: Container image versioning  
**Developers**: DevOps, containerization

**Git Tag Patterns**:
- `v1.2.3-alpine`
- `1.2.3-slim`
- `latest-1.2.3`
- `1.2.3-debian`
- `1.2.3-node`

---

### 13. Hotfix/Patch Releases
**Use Case**: Emergency fixes, patches  
**Developers**: All domains

**Git Tag Patterns**:
- `hotfix-1.2.3`
- `hf-1.2.3`
- `patch-1.2.3`
- `fix/1.2.3`

**Commit Message Patterns**:
- `hotfix 1.2.3`
- `patch-1.2.3`

---

### 14. Feature Releases
**Use Case**: Feature-based versioning  
**Developers**: Product teams

**Git Tag Patterns**:
- `feature-v1.2`
- `feat-1.0`
- `feature/1.2`

---

### 15. Release Channels
**Use Case**: Distribution channels  
**Developers**: All domains

**Git Tag Patterns**:
- `1.2.3-stable`
- `1.2.3-canary`
- `1.2.3-nightly`
- `1.2.3-edge`
- `1.2.3-beta`
- `1.2.3-alpha`

**Commit Message Patterns**:
- `1.2.3-stable`
- `release 1.2.3-canary`

---

### 16. Package Versions
**Use Case**: Package management  
**Developers**: Library authors, package maintainers

**Git Tag Patterns**:
- `pkg-1.2.3`
- `package-v1.0`
- `package/1.2.3`

**Commit Message Patterns**:
- `package.json: 1.2.3`
- `manifest: 1.2.3`
- `pom.xml: 1.2.3`
- `setup.py: 1.2.3`
- `cargo.toml: 1.2.3`
- `composer.json: 1.2.3`

---

## Pattern Priority

When detecting versions in commit messages, patterns are evaluated in order of specificity:

1. **Semantic versioning with keywords** (most specific)
2. **Package manifest updates**
3. **Date-based versions**
4. **Two-part versions**
5. **Build numbers**
6. **Sprint/iteration numbers**
7. **Environment-specific versions**
8. **Database migrations**
9. **API versions**
10. **Hotfix releases**
11. **Model versions**
12. **Release channels**
13. **Standalone version numbers** (least specific)

## Examples by Domain

### Software Development (Frontend/Backend)
```
v1.2.3
v1.2.3-beta.1
release-1.2.3
hotfix-1.2.3.1
```

### DevOps/Platform Engineering
```
2024.01.15
prod-1.2.3
build-456
1.2.3-alpine
```

### Data Science/ML
```
v1
model-v2
r3
experiment-1.2
```

### Database Administration
```
db-1.2.3
migration-001
schema-v2
```

### API Development
```
api-v1
api/v2
apiv1.2
```

### Agile/Scrum Teams
```
sprint-12
iteration-5
s12
```

## Best Practices

1. **Be Consistent**: Choose a versioning scheme and stick to it
2. **Use Git Tags**: Tag releases for automatic detection
3. **Include Version in Commits**: Mention version numbers in commit messages
4. **Update Manifests**: Keep package.json, pom.xml, etc. in sync
5. **Use Conventional Commits**: Prefix with `chore:`, `release:`, etc.

## Configuration

No configuration needed! The changelog feature automatically detects all these patterns. The system will:

1. First check for git tags
2. Then analyze commit messages
3. Finally check package.json/manifest files

## Troubleshooting

### Version Not Detected?

1. **Check your tag format**: Ensure it matches one of the patterns above
2. **Use git tags**: Tags are more reliable than commit messages
3. **Include keywords**: Use "release", "version", "bump" in commit messages
4. **Update package.json**: Version changes here are automatically detected

### Too Many Versions Detected?

The system groups commits by version automatically. If you see unexpected groupings:

1. Review your commit messages for version-like patterns
2. Use more specific version formats
3. Tag only actual releases

## Future Enhancements

Planned support for:
- Custom version patterns via configuration
- Version range detection
- Automatic version increment suggestions
- Integration with package managers
