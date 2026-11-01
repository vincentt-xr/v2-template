// frame.config.ts — how the app fills the screen. The creator's setting.
//
//   "full"   the whole viewport, edge to edge: the canvas is the page. On a phone
//            that is the phone's own portrait ratio, under the notch and the home
//            bar; on a desktop it is the whole window, which suits the webcam.
//            The SDK cover-crops the camera to the canvas, so tracking, anchors
//            and masks stay aligned on every ratio. Default.
//   "phone"  a fixed 9:16 portrait frame: pillarboxed on wide screens, full width
//            on a phone. Use it when the composition must look the same on every
//            device, such as a kiosk or a framed gallery preview.
//
// Change the one value below. (`app.config.json` carries title and share image
// only; the CLI refuses other keys there.)
export type FrameMode = "full" | "phone";

export const frame: FrameMode = "full";
