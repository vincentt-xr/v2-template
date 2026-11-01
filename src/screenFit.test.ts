import { describe, expect, it } from "vitest";

import { feedRectToScreen, screenSizeScale } from "./screenFit";

const rect = { minX: 0.25, minY: 0.25, maxX: 0.75, maxY: 0.75 };

describe("feedRectToScreen", () => {
  it("at 9:16 the size is the stretched extent, so nothing changes for the phone frame", () => {
    const viewport = { width: 360, height: 640 };
    const { position, size } = feedRectToScreen(rect, viewport);
    expect(position).toEqual({ x: 0, y: 0 });
    expect(size.width).toBeCloseTo(360);
    expect(size.height).toBeCloseTo(640);
  });

  it("on a wide viewport the width comes from viewport pixels through the uniform scale", () => {
    const viewport = { width: 1280, height: 720 };
    const scale = screenSizeScale(viewport); // 720 / 1280 = 0.5625, height-bound
    const { size } = feedRectToScreen(rect, viewport);
    expect(size.width).toBeCloseTo(640 / scale);
    expect(size.height).toBeCloseTo(360 / scale);
    // The stretched extent would have been 360 wide: the old narrow box.
    expect(size.width).toBeGreaterThan(360);
  });

  it("pads every side in design pixels", () => {
    const viewport = { width: 360, height: 640 };
    const { size } = feedRectToScreen(rect, viewport, 10);
    expect(size.width).toBeCloseTo(380);
    expect(size.height).toBeCloseTo(660);
  });

  it("survives a zero viewport", () => {
    const { size } = feedRectToScreen(rect, { width: 0, height: 0 });
    expect(size).toEqual({ width: 1, height: 1 });
  });
});
