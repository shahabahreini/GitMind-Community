import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

// The audit exception is valid only for the reviewed local mitigation. Verify
// every installed instance, including future transitive dependency paths.
const hashes = {
  "compile.js": "a682f1be54a19ff4f7dc479c7003b625ab508c2ea6ce012c8351616485003871",
  "depth.js": "032051115f94061e394a3802a1472c0769a4622ec90715c9dac90a4cfe638173",
  "expand.js": "a8921bf59b0a50090eee962d912c61bdac7e1400db174b706d26f1c27d07ed68",
  "parse.js": "1dd791d21bfecc9b5d67835ea47a99f524637d819f70f1c6564373b50581d4c3",
  "stringify.js": "4a126477e95797189dc042ee02b94a6ed6bab8d7dc63bd115b1fabbe897413f3",
};
const tree = JSON.parse(execFileSync("pnpm", ["list", "braces", "--depth", "Infinity", "--json"], { encoding: "utf8" }));
const instances = new Set();
function visit(node) {
  if (node.from === "braces") {
    assert.equal(node.version, "3.0.3", "Review the braces mitigation when its version changes");
    instances.add(realpathSync(node.path));
  }
  for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
    for (const child of Object.values(node[field] ?? {})) { visit(child); }
  }
}
for (const root of tree) { visit(root); }
assert.ok(instances.size, "Missing installed braces dependency; cannot validate the audit exception");

function nestedAst() {
  const root = { type: "root", nodes: [] };
  let parent = root;
  for (let i = 0; i < 15000; i++) {
    const child = { type: "paren", nodes: [], parent };
    parent.nodes.push(child);
    parent = child;
  }
  parent.nodes.push({ type: "text", value: "a", parent });
  return root;
}
const guarded = error => error instanceof SyntaxError && error.code === "BRACES_MAX_DEPTH";
for (const directory of instances) {
  for (const [name, hash] of Object.entries(hashes)) {
    assert.equal(createHash("sha256").update(readFileSync(join(directory, "lib", name))).digest("hex"), hash, `Missing or changed mitigation in ${name}`);
  }
  const require = createRequire(join(directory, "package.json"));
  const braces = require(directory);
  assert.deepEqual(braces.expand("src/{api,git}/*.{ts,js}"), ["src/api/*.ts", "src/api/*.js", "src/git/*.ts", "src/git/*.js"]);
  assert.deepEqual(braces.expand("{1..3}"), ["1", "2", "3"]);
  assert.equal(braces.compile("a/{b,c}/d"), "a/(b|c)/d");
  assert.equal(braces.stringify(braces.parse("a/{b,c}/d")), "a/{b,c}/d");
  assert.doesNotThrow(() => braces.compile("\\{".repeat(4000)));
  assert.doesNotThrow(() => braces.compile("{".repeat(64) + "a" + "}".repeat(64)));
  for (const pattern of ["{".repeat(4000) + "a" + "}".repeat(4000), "(".repeat(4000) + "a" + ")".repeat(4000), "{".repeat(4000) + "a"]) {
    for (const method of ["parse", "compile", "expand", "stringify"]) {
      assert.throws(() => braces[method](pattern), guarded, `${method} must reject excessive depth without a stack overflow`);
    }
  }
  for (const method of ["compile", "expand", "stringify"]) {
    assert.throws(() => braces[method](nestedAst()), guarded, `${method} must guard caller-supplied ASTs`);
  }
}
console.log(`Verified braces depth-limit mitigation and compatibility for ${instances.size} installed instance(s).`);
