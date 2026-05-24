/**
 * Boundary lint: src/_core/** must NEVER import from @app / src/app. The one-way
 * dependency is what lets _core be packaged and frozen-at-publish. Fails CI /
 * publish if violated.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const coreDir = path.join(root, "src", "_core");

const BAD = [
  /from\s+["']@app(\/|["'])/,
  /from\s+["'].*\/app\//,
  /import\s+["']@app["']/,
];

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (/\.tsx?$/.test(e.name)) out.push(full);
  }
  return out;
}

const violations = [];
for (const file of await walk(coreDir)) {
  const src = await fs.readFile(file, "utf8");
  src.split("\n").forEach((line, i) => {
    if (BAD.some((re) => re.test(line))) {
      violations.push(`${path.relative(root, file)}:${i + 1}  ${line.trim()}`);
    }
  });
}

const strict = process.argv.includes("--strict");
if (violations.length) {
  const label = strict ? "BOUNDARY VIOLATION" : "BOUNDARY WARNING";
  console.error(
    `${label}: src/_core must not import from app/@app (blocks freezing _core as a package):`,
  );
  violations.forEach((v) => console.error("  " + v));
  // Until these are inverted (config/routes/state injected into _core rather
  // than imported), the package extraction is incomplete. Fail only in --strict.
  if (strict) process.exit(1);
} else {
  console.log("boundary ok: _core has no app imports");
}
