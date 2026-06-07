#!/usr/bin/env node

// Compatibility entry point. The Wiki is generated, so canonical validation
// starts with the handbook and also checks that the Wiki mirror is current.
await import("./validate-docs.mjs");
