# Documentation Maintainer Guide

> Verified against GitMind `5.0.6` on July 13, 2026.

`docs/handbook/` is the only manually edited documentation source. `wiki/` is generated and must not be edited directly. The sanitized contract at `docs/reference/gitmind-user-surface.json` contains user-facing metadata only.

## Release Update

1. Export sanitized metadata from the latest released checkout or VSIX: `npm run docs:export-product-surface -- path/to/release.vsix`.
2. Update affected handbook pages and record source inconsistencies in [Coverage Audit](Coverage-Audit).
3. Regenerate the Wiki mirror: `npm run docs:sync-wiki`.
4. Run `npm run docs:validate` and `npm run docs:build`.
5. Commit the handbook, manifest, and generated Wiki together. Merging to `main` publishes Pages and Wiki.

Provider catalogs and account quotas are provider-controlled. Document GitMind defaults precisely, but describe changing catalogs as dynamic.

## Repository And CI Ownership

- `GitMind-Pro` is the private source repository. Its workflows validate builds, tests, documentation, and VSIX contents, but must not publish Releases, Pages, or Wiki content.
- `shahabahreini/AI-Commit-Assistant` is the public publication repository. Only this repository may publish VSIX releases, Pages, and Wiki content.
- Publication workflows must include an explicit `github.repository == 'shahabahreini/AI-Commit-Assistant'` guard. Never enable duplicate publication from the private repository.

## Release Preflight

1. Use the committed `package-lock.json` and run `npm ci`; do not use `npm install` in CI.
2. Run `npm run package`, `npm run package:audit`, and `npm run package:vsce -- --out /tmp/gitmind-release.vsix`.
3. Inspect the package list. Development paths such as `.codex`, `scratch`, `.claude`, `src`, tests, and scripts must never ship.
4. Confirm the tag exactly matches `package.json` before pushing the same release commit and tag to the public repository.
5. Confirm publication jobs are skipped in GitMind-Pro and run only in the public repository.

Pin `@vscode/vsce` exactly and update its lockfile together. Before adding any CLI option, verify it exists in the pinned version. Do not add `--allow-package-secrets`, `--allow-package-all-secrets`, or similar scanner bypasses to make a release pass.

## Credential Safety And Incident Response

Never place privileged vendor API keys in extension source, configuration contributions, build arguments, or VSIX files. Client-side code may use only APIs designed for untrusted public clients.

If a credential is discovered:

1. Revoke and rotate it immediately at the provider.
2. Remove it from current source and release artifacts.
3. Audit the generated `dist/extension.js` and VSIX contents.
4. Publish a patched release.
5. Record the cause and add a preflight check that prevents recurrence.

Revocation is mandatory even when the repository is private because distributed VSIX files and Git history preserve old values.

## Workflow Failure Triage

- `unknown option`: compare the workflow command with the exact tool version in `package-lock.json`.
- Pages `Not Found`: the workflow is running in a repository without Pages enabled; verify publication ownership and repository guards.
- Wiki repository `not found`: the workflow is running where Wiki is disabled or uninitialized; verify publication ownership and token access.
## Product Roadmap Priorities

Keep the public [Product Roadmap](Product-Roadmap) focused on user outcomes and broad phases. Do not publish internal evidence scoring, competitor analysis, monetization assumptions, or target dates there.

Roadmap changes should preserve explicit user review before Git operations, make provider-bound context visible, and keep organization capabilities within the Pro track. Provider additions should use the centralized provider catalog, live account model discovery where supported, and the shared recovery and error-normalization layer.
