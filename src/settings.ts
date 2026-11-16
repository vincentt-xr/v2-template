// settings.ts: the values a creator changes without code (text, colours, counts, lists).
// Declared zod/mini list: the editor reads the schema (labels, limits) and the literal below by parsing.
// Scenes read leaves as `settings.<leaf>`; never hard-code a value a creator would want to change.
// GROUNDING.md, "Editable shape".
import * as z from "zod/mini";

export const SettingsSchema = z.object({
  title: z
    .string()
    .check(z.minLength(1), z.maxLength(80), z.meta({ label: "Title", group: "Title" })),
  titleColor: z.string().check(z.meta({ label: "Title colour", group: "Title", kind: "colour" })),
  titleOutlineColor: z
    .string()
    .check(z.meta({ label: "Title outline colour", group: "Title", kind: "colour" })),
  titleGlowColor: z
    .string()
    .check(z.meta({ label: "Title glow colour", group: "Title", kind: "colour" })),
  theme: z
    .object({
      accent: z.string().check(z.meta({ label: "Accent colour", kind: "colour" })),
    })
    .check(z.meta({ label: "Theme", kind: "theme" })),
});

export const settings = SettingsSchema.parse({
  title: "Welcome to the Vincentt XR",
  titleColor: "#f8fafc",
  titleOutlineColor: "#0f172a",
  titleGlowColor: "#38bdf8",
  theme: { accent: "#38bdf8" },
});

export type Settings = z.infer<typeof SettingsSchema>;
