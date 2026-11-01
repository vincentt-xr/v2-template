// screenFit.ts — a rectangle measured on the camera feed, as a screen transform.
//
// SDK screen space is a 720 × 1280 design canvas. A POSITION in design pixels
// stretches per axis so the canvas always covers the viewport; a SIZE scales
// uniformly, by min(viewportWidth / 720, viewportHeight / 1280), so UI keeps
// its proportions. The two agree only at 9:16. A box traced around a tracked
// face or hand must therefore place its centre with the stretch and derive its
// size from viewport pixels through the uniform scale, or it comes out narrow
// (or short) whenever the frame is not 9:16 — the `full` frame on a desktop.
import { normalizedToScreenPixels } from "@vincentt-xr/sdk";

const ROOT_W = 720;
const ROOT_H = 1280;

export type FeedRect = { minX: number; minY: number; maxX: number; maxY: number };
export type ViewportSize = { width: number; height: number };

/** Uniform design-pixel → viewport-pixel scale used for screen-space sizes. */
export const screenSizeScale = ({ width, height }: ViewportSize) =>
  Math.min(width / ROOT_W, height / ROOT_H);

/**
 * Centre and size, in design pixels, of a feed rectangle (0..1, top-left
 * origin) padded by `padding` design pixels on every side.
 */
export const feedRectToScreen = (
  rect: FeedRect,
  viewport: ViewportSize,
  padding = 0,
): { position: { x: number; y: number }; size: { width: number; height: number } } => {
  const centre = normalizedToScreenPixels({
    point: { x: (rect.minX + rect.maxX) / 2, y: (rect.minY + rect.maxY) / 2 },
    viewportSize: viewport,
  });
  const scale = screenSizeScale(viewport);
  const widthPx = Math.abs(rect.maxX - rect.minX) * viewport.width;
  const heightPx = Math.abs(rect.maxY - rect.minY) * viewport.height;
  const pad = Math.max(0, padding) * 2;
  return {
    position: { x: centre.x, y: centre.y },
    size: {
      width: Math.max(1, (scale > 0 ? widthPx / scale : 0) + pad),
      height: Math.max(1, (scale > 0 ? heightPx / scale : 0) + pad),
    },
  };
};
