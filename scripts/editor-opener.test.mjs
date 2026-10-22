// @vitest-environment node
// The Vincentt Editor opener: fixed inert text at the project root. The app uses only the
// file's location, never its content, and the file never reaches a published bundle.

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { checkEntry } from "./check-zone-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OPENER = "Open in Vincentt Editor.vincentt";
const OPENER_BYTES =
  "Double-click this file to open this project in Vincentt Editor.\n" +
  "Get Vincentt Editor at https://vincentt.studio/editor\n";

const dirs = [];
afterAll(() => {
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
});

describe("the editor opener", () => {
  it("sits at the root as a regular file holding the pinned bytes", () => {
    const p = path.join(ROOT, OPENER);
    expect(fs.lstatSync(p).isFile()).toBe(true);
    expect(fs.readFileSync(p, "utf8")).toBe(OPENER_BYTES);
  });

  it("is not git-ignored, so a clone and the scaffold carry it", () => {
    const r = spawnSync("git", ["-C", ROOT, "check-ignore", "-q", "--", OPENER]);
    expect(r.status).toBe(1);
  });

  // The f17 floor (here and in the CLI) admits only allowlisted root files and extensions,
  // and one refused entry refuses the whole manifest. The opener is listed exactly when the
  // floor admits it.
  it("is in the platform manifest exactly when the zone floor admits it", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, ".vincentt-template.json"), "utf8"));
    const admitted = checkEntry(OPENER, "platform").length === 0;
    expect(manifest.platform.includes(OPENER)).toBe(admitted);
    expect(manifest.creator.includes(OPENER)).toBe(false);
  });

  it("never enters dist", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "editor-opener-"));
    dirs.push(dir);
    const files = execFileSync(
      "git",
      ["-C", ROOT, "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      { encoding: "utf8" },
    )
      .split("\0")
      .filter(Boolean);
    expect(files).toContain(OPENER);
    for (const rel of files) {
      const from = path.join(ROOT, rel);
      if (!fs.existsSync(from)) continue;
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.copyFileSync(from, path.join(dir, rel));
    }
    fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"), "dir");

    const r = spawnSync("npm", ["run", "build"], { cwd: dir, encoding: "utf8" });
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);

    const dist = path.join(dir, "dist");
    const found = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else found.push(p);
      }
    };
    walk(dist);
    expect(found.length).toBeGreaterThan(0);
    for (const p of found) {
      expect(p.endsWith(".vincentt"), p).toBe(false);
      expect(fs.readFileSync(p).toString("latin1").includes("open this project in Vincentt Editor"), p).toBe(
        false,
      );
    }
  }, 180_000);
});
