import { XRModel } from "@vincentt-sdks/xr-sdk";

/**
 * XR pipeline models this app needs (face/hand/gesture/body trackers, etc.).
 * Add the trackers your scenes use; an empty array is valid for scenes that
 * only show fixed geometry over the camera feed.
 */
export const xrModels: Array<{ model: string }> = [
  { model: XRModel.GESTURE_TRACKER },
];
