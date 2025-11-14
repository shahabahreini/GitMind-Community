#!/bin/bash
# Suppress npm warnings by setting environment variables
export NODE_NO_WARNINGS=1
export npm_config_loglevel=error

npm run clean && npm run check-types && npm run lint && node esbuild.js --production
npm audit
vsce package 2>&1 | grep -v "The engine \"vscode\" appears to be invalid" | grep -v "Unknown env config"