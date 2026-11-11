// settings.ts: the values a creator changes without code (text, colours, counts, lists).
// Scenes read them from here; never hard-code a value a creator would want to change.
// Plain literals only: no computed values, no imports. GROUNDING.md, "Editable shape".

export const settings = {
  title: "Welcome to the Vincentt XR",
  titleColor: "#f8fafc",
  titleOutlineColor: "#0f172a",
  titleGlowColor: "#38bdf8",
};

export type Settings = typeof settings;
