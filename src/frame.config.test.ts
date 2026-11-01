import { describe, expect, it } from "vitest";

import { FRAME_META, frame, resolveFrame } from "./frame.config";

const docWith = (content: string | null) => {
  const d = document.implementation.createHTMLDocument("t");
  if (content !== null) {
    const m = d.createElement("meta");
    m.setAttribute("name", FRAME_META);
    m.setAttribute("content", content);
    d.head.appendChild(m);
  }
  return d;
};

describe("resolveFrame", () => {
  it("falls back to the file value without a meta", () => {
    expect(resolveFrame(docWith(null))).toBe(frame);
    expect(resolveFrame(null)).toBe(frame);
  });

  it("takes the page meta from app.config.json", () => {
    expect(resolveFrame(docWith("phone"))).toBe("phone");
    expect(resolveFrame(docWith(" Full "))).toBe("full");
  });

  it("ignores a value it does not know", () => {
    expect(resolveFrame(docWith("wide"))).toBe(frame);
  });
});
