// frame.config.ts — how the app fills the screen. The creator's setting.
//
//   "phone"  a fixed 9:16 portrait frame: pillarboxed on wide screens, full width
//            on a phone, so every experience is framed the same everywhere.
//            Default.
//   "full"   the whole viewport, edge to edge: the canvas is the page. On a phone
//            that is the phone's own portrait ratio, under the notch and the home
//            bar; on a desktop it is the whole window, which suits the webcam.
//            The SDK cover-crops the camera to the canvas, so tracking, anchors
//            and masks stay aligned on every ratio.
//
// `"frame"` in `app.config.json` wins when set (the dev server and `vincentt
// build` write it into the page as `<meta name="vincentt:frame">`); the value
// below is the fallback for a project without one.
export type FrameMode = "phone" | "full";

export const frame: FrameMode = "phone";

export const FRAME_META = "vincentt:frame";

const isFrameMode = (v: unknown): v is FrameMode => v === "full" || v === "phone";

/** The frame to use: the page's meta from `app.config.json`, else `frame` (9:16). */
export const resolveFrame = (doc?: Document | null): FrameMode => {
  try {
    const d = doc ?? (typeof document === "undefined" ? null : document);
    const content = d
      ?.querySelector(`meta[name="${FRAME_META}"]`)
      ?.getAttribute("content")
      ?.trim()
      .toLowerCase();
    return isFrameMode(content) ? content : frame;
  } catch {
    return frame;
  }
};
