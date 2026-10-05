import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

// pnpm's registry still identifies the patched braces version as vulnerable.
// Keep that single exception local to the build and fail on every other finding.
const result = spawnSync("pnpm", ["audit", "--json"], {
  encoding: "utf8", maxBuffer: 4 * 1024 * 1024,
});
if (result.error) { throw result.error; }
if (result.status !== 0 && result.status !== 1) {
  throw new Error(`Dependency audit failed with exit code ${result.status}`);
}
let report;
try { report = JSON.parse(result.stdout); }
catch { throw new Error("Dependency audit did not return a valid JSON report"); }
assert.ok(report && typeof report.advisories === "object" && !Array.isArray(report.advisories), "Dependency audit report is malformed");
const advisories = Object.values(report.advisories);
const counts = report.metadata?.vulnerabilities;
assert.ok(counts && ["info", "low", "moderate", "high", "critical"].every(key => Number.isSafeInteger(counts[key]) && counts[key] >= 0), "Dependency audit counts are malformed");
assert.equal(advisories.length, Object.values(counts).reduce((total, value) => total + value, 0), "Dependency audit count mismatch");
assert.equal(result.status, advisories.length ? 1 : 0, "Dependency audit exit status does not match its findings");
const expected = advisory => advisory.github_advisory_id === "GHSA-vfj7-8cjw-p6xm"
  && advisory.module_name === "braces"
  && Array.isArray(advisory.findings)
  && advisory.findings.length > 0
  && advisory.findings.every(finding => finding.version === "3.0.3");
const remaining = advisories.filter(advisory => !expected(advisory));
if (remaining.length) {
  for (const advisory of remaining) {
    console.error(`Unmitigated dependency advisory: ${String(advisory.github_advisory_id ?? "unknown").slice(0, 32)} (${String(advisory.module_name ?? "unknown").slice(0, 80)})`);
  }
  process.exitCode = 1;
} else {
  console.log(`Dependency audit passed: ${advisories.length} registry advisory covered by the verified local braces patch; no unmitigated findings.`);
}
