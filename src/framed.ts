/**
 * Framed-configuration detection.
 *
 * Pure and dependency-free ON PURPOSE. The SDK's preset module carries 12 CDN
 * URLs and the switcher pulls in an icon dependency, so neither may be reached
 * by a static import from application source — a production build has to be
 * able to drop both. Everything here is a decision; the modules that satisfy
 * the decision are loaded dynamically at the call site.
 */

/** The two window handles the framing check compares. Injected so it is testable. */
export type FramingView = { self: unknown; top: unknown };

/**
 * True when this document is running inside a frame.
 *
 * A fact the app reads ABOUT ITSELF — no sender, no parameter, no message, no
 * channel from the embedder. Deliberately true inside *any* frame, not just the
 * console's: the reason the webcam is withheld (no camera grant crosses the
 * boundary) holds for any embedder.
 *
 * Cross-origin does not break it. Comparing `window.top` as an opaque handle is
 * same-origin-policy-safe; only reaching THROUGH it (`top.location`) throws, and
 * nothing here dereferences it.
 *
 * A missing or throwing `window` folds to NOT framed, so an unknown context
 * behaves like today's shipped top-level case rather than silently swapping the
 * creator's camera for a canned clip on their own machine.
 */
export const isFramed = (view?: FramingView): boolean => {
  const w = view ?? (typeof window === "undefined" ? undefined : window);
  if (!w) return false;
  try {
    return w.self !== w.top;
  } catch {
    return false;
  }
};

export type MediaSourceEnv = {
  VITE_INPUT_SOURCE?: string;
  VITE_INPUT_URL?: string;
};

export type MediaSourceChoice =
  | { kind: "video"; url?: string }
  | { kind: "photo"; url: string }
  | { kind: "framedPreset" }
  | { kind: "webcam" };

/**
 * Which media source this app starts on.
 *
 * A creator who CONFIGURED a source keeps it, framed or not — overriding a
 * deliberate config pointed at client footage would hide work they did. Only
 * the webcam default branch is framing-aware, and in a frame it never selects
 * the webcam BY CONSTRUCTION rather than by care. That is what makes the
 * frame's absent `allow` attribute cost nothing: with no `getUserMedia` on the
 * startup path there is no permission to be denied, so the whole-scene camera
 * error is unreachable *at startup*.
 *
 * It is NOT unreachable once the media switcher is mounted — the switcher's own
 * Webcam entry would still fire one. That door is closed separately, by
 * `switcherSources` dropping the webcam entries from the list.
 */
export const chooseMediaSource = (env: MediaSourceEnv, framed: boolean): MediaSourceChoice => {
  if (env.VITE_INPUT_SOURCE === "video") return { kind: "video", url: env.VITE_INPUT_URL };
  if (env.VITE_INPUT_SOURCE === "photo" && env.VITE_INPUT_URL) {
    return { kind: "photo", url: env.VITE_INPUT_URL };
  }
  if (framed) return { kind: "framedPreset" };
  return { kind: "webcam" };
};

/**
 * The framed default is a MOVING clip rather than a still, so the creator sees
 * the tracker respond rather than a frozen detection. Picking by `kind` rather
 * than by index means a preset list reordered upstream still yields a video.
 */
export const pickFramedDefault = <T extends { kind: string }>(presets: T[]): T | undefined =>
  presets.find((p) => p.kind === "video");

/**
 * The source list handed to the switcher.
 *
 * In a frame the webcam entries are dropped. The switcher fires its Webcam
 * entry immediately with no confirmation, and in a frame there is no camera
 * permission by design — so one tap would replace the whole scene with "Allow
 * camera access in your browser, then refresh the page", advice that can never
 * work because the permission was withheld deliberately.
 *
 * Known and deliberate: the switcher's kind TABS are hardcoded and are not
 * derived from this list, so the Camera tab still renders and reads "No camera
 * source" when tapped. That dead tab is accepted rather than fixed — fixing it
 * means editing the SDK, and this feature budgets the SDK at zero change. The
 * destructive half is what mattered and it is closed: tapping Camera selects
 * nothing, so no `getUserMedia` and no unrecoverable scene.
 */
export const switcherSources = <T extends { kind: string }>(sources: T[], framed: boolean): T[] =>
  framed ? sources.filter((s) => s.kind !== "webcam") : sources;
