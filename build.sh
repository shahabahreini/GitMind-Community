#!/usr/bin/env bash

# Build a distributable VSIX using the project's pinned pnpm toolchain.
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Enable Corepack or install the version declared in package.json." >&2
  exit 1
fi

echo "Installing dependencies from pnpm-lock.yaml..."
pnpm install --frozen-lockfile

echo "Auditing production and development dependencies..."
# No upstream braces release fixes GHSA-vfj7-8cjw-p6xm yet. Only permit
# this advisory after verifying our installed, lockfile-pinned depth patch.
# All other findings and registry failures still stop the build.
node scripts/verify-braces-patch.mjs
node scripts/audit-dependencies.mjs

echo "Building the extension and packaging the VSIX..."
pnpm run package:vsce

echo "Auditing the VSIX contents..."
pnpm run package:audit

echo "Build completed successfully."
