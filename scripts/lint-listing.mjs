// Fails when store-facing listing content drifts: keyword limit, categories,
// icon shape, provider-count wording, unsupported README media, and stale or
// broken URLs. Pass --network to also require every README URL to return 2xx
// without a redirect, and --vsix <path> to check the packaged manifest's tag count.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const MAX_KEYWORDS = 30;
const ALLOWED_CATEGORIES = new Set([
  "AI", "Chat", "Programming Languages", "Snippets", "Linters", "Themes", "Debuggers",
  "Formatters", "Keymaps", "SCM Providers", "Other", "Extension Packs", "Language Packs",
  "Data Science", "Machine Learning", "Visualization", "Notebooks", "Education", "Testing",
]);
const MIN_ICON_PX = 128;
const STALE_REPO = "AI-Commit-Assistant";
const PRO_QUALIFIER = /\bPro\b/;

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const readme = readFileSync("README.md", "utf8");
const errors = [];

function pngSize(path) {
  const buf = readFileSync(path);
  if (buf.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`${path} is not a PNG`);
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// Keywords
const keywords = pkg.keywords ?? [];
if (keywords.length > MAX_KEYWORDS) {
  errors.push(`keywords: ${keywords.length} exceeds the Marketplace limit of ${MAX_KEYWORDS}`);
}
const lowered = keywords.map((k) => k.toLowerCase());
const dupes = lowered.filter((k, i) => lowered.indexOf(k) !== i);
if (dupes.length) errors.push(`keywords: duplicates ${[...new Set(dupes)].join(", ")}`);

// vsce adds derived tags (e.g. "keybindings") to the keywords, and the Marketplace limit
// applies to the combined list, so a packaged VSIX is checked with --vsix <path>.
const vsixIndex = process.argv.indexOf("--vsix");
if (vsixIndex !== -1) {
  const vsixPath = process.argv[vsixIndex + 1];
  const manifest = execFileSync("unzip", ["-p", vsixPath, "extension.vsixmanifest"], { encoding: "utf8" });
  const tags = (manifest.match(/<Tags>([^<]*)<\/Tags>/)?.[1] ?? "").split(",").filter(Boolean);
  if (tags.length > MAX_KEYWORDS) {
    errors.push(`${vsixPath}: ${tags.length} manifest tags (keywords plus vsce-derived tags) exceed ${MAX_KEYWORDS}`);
  }
}

// Categories
for (const c of pkg.categories ?? []) {
  if (!ALLOWED_CATEGORIES.has(c)) errors.push(`categories: "${c}" is not a Marketplace category`);
}

// Icon
try {
  const { width, height } = pngSize(pkg.icon);
  if (width !== height) errors.push(`icon: ${pkg.icon} is ${width}x${height}, must be square`);
  if (width < MIN_ICON_PX) errors.push(`icon: ${pkg.icon} is ${width}px, must be at least ${MIN_ICON_PX}px`);
} catch (err) {
  errors.push(`icon: ${err.message}`);
}

// Provider count: every "<n> providers" claim must match the built-in registry
// unless the sentence carries a Pro qualifier.
const builtIn = pkg.contributes.configuration.properties["gitmind.apiProvider"].enum
  .filter((id) => id !== "custom").length;
const walkthroughText = JSON.stringify(pkg.contributes.walkthroughs ?? []);
const surfaces = {
  "package.json description": pkg.description,
  "package.json walkthroughs": walkthroughText,
  "README.md": readme,
};
for (const [name, text] of Object.entries(surfaces)) {
  for (const sentence of text.split(/(?<=[.!?\n])\s+/)) {
    for (const m of sentence.matchAll(/\b(\d+)\s+(?:[\w-]+\s+){0,2}providers\b/gi)) {
      const n = Number(m[1]);
      if (n !== builtIn && !PRO_QUALIFIER.test(sentence)) {
        errors.push(`${name}: "${m[0]}" does not match ${builtIn} built-in providers`);
      }
    }
  }
}

// README media and URLs
if (/<video\b/i.test(readme)) errors.push("README.md: <video> is stripped by store renderers; use a GIF");
const urls = [...new Set([
  ...[...readme.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]),
  ...[...readme.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]),
])];
for (const url of urls) {
  if (url.includes(STALE_REPO)) errors.push(`README.md: stale repo URL ${url}`);
  if (!url.startsWith("https://")) errors.push(`README.md: non-HTTPS or relative URL ${url}`);
}
const images = [...readme.matchAll(/<img[^>]+src="([^"]+)"|!\[[^\]]*\]\(([^)\s]+)\)/g)]
  .map((m) => m[1] ?? m[2]);
for (const src of images) {
  if (/\.svg(\?|$)/i.test(src) && !/img\.shields\.io/.test(src)) {
    errors.push(`README.md: SVG image ${src} is not allowed outside trusted badges`);
  }
}

if (process.argv.includes("--network")) {
  const results = await Promise.all(urls.filter((u) => u.startsWith("https://")).map(async (url) => {
    try {
      const res = await fetch(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(20000) });
      if (res.status >= 200 && res.status < 300) return null;
      // Auth walls (e.g. /portal -> /portal/login) redirect within the same path; anything else is drift.
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        const target = new URL(location, url);
        const source = new URL(url);
        if (target.host === source.host && target.pathname.startsWith(source.pathname)) return null;
        return `README.md: ${url} redirects to ${target.href}`;
      }
      return `README.md: ${url} returned ${res.status}`;
    } catch (err) {
      return `README.md: ${url} failed (${err.message})`;
    }
  }));
  errors.push(...results.filter(Boolean));
}

if (errors.length) {
  console.error(`Listing lint failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Listing lint passed: ${keywords.length} keywords, ${builtIn} built-in providers, ${urls.length} README URLs${process.argv.includes("--network") ? " reachable" : ""}.`);
