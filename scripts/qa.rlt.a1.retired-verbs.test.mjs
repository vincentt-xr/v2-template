// @vitest-environment node
// QA-F14-A1 (retire-laptop-tunnel), template half · the template's agent grounding never tells an
// agent to run a retired verb. The retired set mirrors toolchain packages/cli/src/cli/retiredVerbs.ts
// (pinned by that repo's QA-F3-R4).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RETIRED = ["preview", "relay", "logs", "network", "trace", "dev"];
const asCommand = (v) => new RegExp(`(vincentt\\s+${v}\\b|\`vincentt ${v}\`)`, "i");
// The grouped list form "`vincentt logs` / `network` / `trace`".
const GROUPED = /vincentt (logs|network|trace)`?\s*\/\s*`?(logs|network|trace)/i;

describe("QA-F14-A1 · template grounding", () => {
  for (const file of ["AGENTS.md", ".github/recognition.section.md"]) {
    it(`${file} names no retired verb as a command`, () => {
      const text = fs.readFileSync(path.join(ROOT, file), "utf8");
      for (const v of RETIRED) expect(asCommand(v).test(text), `${file} names \`${v}\``).toBe(false);
      expect(GROUPED.test(text), `${file} still lists logs / network / trace`).toBe(false);
    });
    it(`${file} names test-link`, () => {
      expect(fs.readFileSync(path.join(ROOT, file), "utf8")).toContain("vincentt test-link");
    });
  }
});
