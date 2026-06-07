# Documentation Maintainer Guide

> Verified against GitMind `5.0.2` on June 7, 2026.

`docs/handbook/` is the only manually edited documentation source. `wiki/` is generated and must not be edited directly. The sanitized contract at `docs/reference/gitmind-user-surface.json` contains user-facing metadata only.

## Release Update

1. Export sanitized metadata from the latest released checkout or VSIX: `npm run docs:export-product-surface -- path/to/release.vsix`.
2. Update affected handbook pages and record source inconsistencies in [Coverage Audit](Coverage-Audit).
3. Regenerate the Wiki mirror: `npm run docs:sync-wiki`.
4. Run `npm run docs:validate` and `npm run docs:build`.
5. Commit the handbook, manifest, and generated Wiki together. Merging to `main` publishes Pages and Wiki.

Provider catalogs and account quotas are provider-controlled. Document GitMind defaults precisely, but describe changing catalogs as dynamic.
