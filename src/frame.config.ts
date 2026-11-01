// frame.config.ts — how the app fills the screen. The creator's setting.
//
//   "phone"  the 9:16 portrait frame: pillarboxed on wide screens, full width on
//            a phone. Every experience is framed the same everywhere. Default.
//   "full"   the whole viewport, edge to edge, under the notch and the home bar.
//            The SDK cover-crops the camera to the canvas, so tracking, anchors
//            and masks stay aligned; only the visible crop of the feed changes.
//
// Change the one value below. (`app.config.json` carries title and share image
// only; the CLI refuses other keys there.)
export type FrameMode = "phone" | "full";

export const frame: FrameMode = "phone";
