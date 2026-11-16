import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { globalRegistry } from "zod/mini";

import { settings, SettingsSchema } from "./settings";

describe("settings", () => {
  it("parses the literal and rejects an empty or over-long title", () => {
    expect(settings.title).toBe("Welcome to the Vincentt XR");
    expect(SettingsSchema.safeParse({ ...settings, title: "" }).success).toBe(false);
    expect(SettingsSchema.safeParse({ ...settings, title: "x".repeat(81) }).success).toBe(false);
  });

  it("carries label, group and kind through z.meta", () => {
    expect(globalRegistry.get(SettingsSchema.shape.title)).toMatchObject({
      label: "Title",
      group: "Title",
    });
    expect(globalRegistry.get(SettingsSchema.shape.titleColor)).toMatchObject({ kind: "colour" });
  });

  it("imports zod/mini only, never classic zod (first-visit size)", () => {
    const source = readFileSync("src/settings.ts", "utf8");
    expect(source).toMatch(/from "zod\/mini"/);
    expect(source).not.toMatch(/from "zod"/);
  });
});
