// settings.ts: the values a creator changes without code (text, colours, counts, lists).
// Declared zod list: the editor reads the schema (labels, limits) and the literal below by parsing.
// Scenes read leaves as `settings.<leaf>`; never hard-code a value a creator would want to change.
// GROUNDING.md, "Editable shape".
import { z } from "zod";

export const SettingsSchema = z.object({
  title: z.string().min(1).max(80).meta({ label: "Title", group: "Title" }),
  titleColor: z.string().meta({ label: "Title colour", group: "Title", kind: "colour" }),
  titleOutlineColor: z
    .string()
    .meta({ label: "Title outline colour", group: "Title", kind: "colour" }),
  titleGlowColor: z.string().meta({ label: "Title glow colour", group: "Title", kind: "colour" }),
});

export const settings = SettingsSchema.parse({
  title: "Welcome to the Vincentt XR",
  titleColor: "#f8fafc",
  titleOutlineColor: "#0f172a",
  titleGlowColor: "#38bdf8",
});

export type Settings = z.infer<typeof SettingsSchema>;
