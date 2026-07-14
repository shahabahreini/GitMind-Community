#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertAbsent(relativePath, pattern, message) {
  const absolutePath = path.join(root, relativePath);
  if (fs.existsSync(absolutePath) && pattern.test(fs.readFileSync(absolutePath, 'utf8'))) {
    failures.push(`${relativePath}: ${message}`);
  }
}

const pkg = JSON.parse(read('package.json'));
for (const dependency of ['applicationinsights', 'dotenv']) {
  if (pkg.dependencies?.[dependency] || pkg.devDependencies?.[dependency]) {
    failures.push(`package.json: retired dependency ${dependency} is present`);
  }
}

if (pkg.telemetry) {
  failures.push('package.json: VS Code telemetry declaration is present');
}

for (const setting of Object.keys(pkg.contributes?.configuration?.properties || {})) {
  if (setting.startsWith('gitmind.telemetry.')) {
    failures.push(`package.json: retired setting ${setting} is registered`);
  }
}

if (pkg.contributes?.configuration?.properties?.['gitmind.debug']) {
  failures.push('package.json: retired production debug setting is registered');
}
if ((pkg.contributes?.commands || []).some(command => command.command === 'gitmind.toggleDebug')) {
  failures.push('package.json: retired production debug command is registered');
}

for (const relativePath of ['src/services/telemetry', 'azure-deployment']) {
  if (walk(path.join(root, relativePath)).length > 0) {
    failures.push(`${relativePath}: retired telemetry implementation/deployment assets remain`);
  }
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(child);
    return [child];
  });
}

for (const file of walk(path.join(root, 'src'))) {
  if (!/\.(?:ts|js)$/.test(file)) continue;
  const relativePath = path.relative(root, file);
  if (relativePath === 'src/services/migration/SettingsMigrationService.ts') continue;
  const source = fs.readFileSync(file, 'utf8');
  if (/services\/telemetry|telemetryService|applicationinsights/i.test(source)) {
    failures.push(`${relativePath}: telemetry runtime reference remains`);
  }
}

const supportDirectory = path.join(root, 'src/services/support');
for (const file of walk(supportDirectory)) {
  if (!/\.(?:ts|js)$/.test(file)) continue;
  const relativePath = path.relative(root, file);
  const source = fs.readFileSync(file, 'utf8');
  const forbiddenFields = /(?:^|[,\s{])(prompt|diff|sourceCode|commitMessage|fileName|repositoryName|repositoryPath|apiKey|credential|requestBody|responseBody|email|licenseKey|orderId|stack)\s*:/im;
  const networkCalls = /\b(fetch|axios|https?\.request|XMLHttpRequest)\s*\(/;
  if (forbiddenFields.test(source)) failures.push(`${relativePath}: support report contains a forbidden sensitive field`);
  if (networkCalls.test(source)) failures.push(`${relativePath}: support reporting must not upload data`);
}

assertAbsent('package-lock.json', /node_modules\/applicationinsights|"applicationinsights"\s*:/, 'Application Insights remains in the npm lockfile');
assertAbsent('pnpm-lock.yaml', /\bapplicationinsights\b/, 'Application Insights remains in the pnpm lockfile');
assertAbsent('yarn.lock', /\bapplicationinsights\b/, 'Application Insights remains in the Yarn lockfile');

const migration = read('src/services/migration/SettingsMigrationService.ts');
for (const retiredKey of [
  'telemetry.enabled',
  'telemetry.connectionString',
  'applicationinsights-key',
  'gitmind.telemetry.lastActiveDate'
]) {
  if (!migration.includes(retiredKey)) {
    failures.push(`SettingsMigrationService.ts: missing cleanup for ${retiredKey}`);
  }
}

if (failures.length > 0) {
  console.error(`Privacy validation failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('Privacy validation passed: telemetry is retired and support reporting remains local-only.');
