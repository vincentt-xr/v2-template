import { describe, expect, it } from "vitest";

import { chooseMediaSource, isFramed, pickFramedDefault, switcherSources } from "./framed";

const TOP = { name: "top" };

describe("isFramed", () => {
  it("is false at the top level", () => {
    const w = { self: TOP, top: TOP };
    expect(isFramed(w)).toBe(false);
  });

  it("is true inside a frame", () => {
    expect(isFramed({ self: { name: "inner" }, top: TOP })).toBe(true);
  });

  it("is true inside ANY frame, not only a known embedder", () => {
    // No sender, no parameter, no message — the app reads a fact about itself,
    // so an unrecognised embedder is treated exactly like the console.
    expect(isFramed({ self: { name: "someone-elses-page" }, top: { name: "theirs" } })).toBe(true);
  });

  it("folds a throwing window to NOT framed", () => {
    // The safe direction: an unknown context behaves like today's shipped
    // top-level case rather than silently swapping the creator's camera.
    const hostile = {
      get self() {
        throw new Error("cross-origin");
      },
      top: TOP,
    };
    expect(isFramed(hostile as unknown as { self: unknown; top: unknown })).toBe(false);
  });
});

describe("chooseMediaSource", () => {
  it("framed with no configured source selects the framed preset, never the webcam", () => {
    expect(chooseMediaSource({}, true)).toEqual({ kind: "framedPreset" });
  });

  it("unframed with no configured source selects the webcam — the shipped default, unchanged", () => {
    // A REGRESSION PIN. Every published app runs this branch; if the framing
    // check ever leaks into it, creators lose their camera on their own machine.
    expect(chooseMediaSource({}, false)).toEqual({ kind: "webcam" });
  });

  it("a configured video source wins when framed — the creator's choice is not overridden", () => {
    const env = { VITE_INPUT_SOURCE: "video", VITE_INPUT_URL: "https://example.test/clip.mp4" };
    expect(chooseMediaSource(env, true)).toEqual({
      kind: "video",
      url: "https://example.test/clip.mp4",
    });
  });

  it("a configured photo source wins when framed", () => {
    const env = { VITE_INPUT_SOURCE: "photo", VITE_INPUT_URL: "https://example.test/still.jpg" };
    expect(chooseMediaSource(env, true)).toEqual({
      kind: "photo",
      url: "https://example.test/still.jpg",
    });
  });

  it("a configured source behaves identically framed and unframed", () => {
    const env = { VITE_INPUT_SOURCE: "video", VITE_INPUT_URL: "https://example.test/clip.mp4" };
    expect(chooseMediaSource(env, true)).toEqual(chooseMediaSource(env, false));
  });

  it("photo without a URL is not a configured source, so framing still decides", () => {
    expect(chooseMediaSource({ VITE_INPUT_SOURCE: "photo" }, true)).toEqual({
      kind: "framedPreset",
    });
    expect(chooseMediaSource({ VITE_INPUT_SOURCE: "photo" }, false)).toEqual({ kind: "webcam" });
  });

  it("an unrecognised source value falls through to the framing-aware default", () => {
    expect(chooseMediaSource({ VITE_INPUT_SOURCE: "webcam" }, true)).toEqual({
      kind: "framedPreset",
    });
    expect(chooseMediaSource({ VITE_INPUT_SOURCE: "webcam" }, false)).toEqual({ kind: "webcam" });
  });

  it("never yields a webcam choice when framed, for any env", () => {
    // The property that makes the frame's absent `allow` attribute cost nothing:
    // the framed startup path cannot reach getUserMedia BY CONSTRUCTION.
    const envs = [
      {},
      { VITE_INPUT_SOURCE: "webcam" },
      { VITE_INPUT_SOURCE: "photo" },
      { VITE_INPUT_SOURCE: "nonsense", VITE_INPUT_URL: "https://example.test/x" },
      { VITE_INPUT_URL: "https://example.test/x" },
      { VITE_INPUT_SOURCE: "video" },
      { VITE_INPUT_SOURCE: "photo", VITE_INPUT_URL: "https://example.test/x" },
    ];
    envs.forEach((env) => {
      expect(chooseMediaSource(env, true).kind).not.toBe("webcam");
    });
  });
});

describe("pickFramedDefault", () => {
  it("picks a VIDEO preset, so the creator sees the tracker respond rather than a frozen detection", () => {
    const presets = [
      { id: "sdk-image-1", kind: "image" },
      { id: "sdk-video-1", kind: "video" },
      { id: "sdk-video-2", kind: "video" },
    ];
    expect(pickFramedDefault(presets)).toEqual({ id: "sdk-video-1", kind: "video" });
  });

  it("picks by kind, not by index, so an upstream reorder still yields a video", () => {
    const presets = [
      { id: "webcam", kind: "webcam" },
      { id: "sdk-image-1", kind: "image" },
      { id: "sdk-video-1", kind: "video" },
    ];
    expect(pickFramedDefault(presets)?.kind).toBe("video");
  });

  it("is undefined when there is no video preset, rather than falling back to a webcam entry", () => {
    expect(pickFramedDefault([{ id: "webcam", kind: "webcam" }])).toBeUndefined();
  });
});

describe("switcherSources", () => {
  const presets = [
    { id: "webcam", kind: "webcam" },
    { id: "sdk-video-1", kind: "video" },
    { id: "sdk-image-1", kind: "image" },
  ];

  it("drops the webcam entries when framed", () => {
    expect(switcherSources(presets, true).map((p) => p.id)).toEqual([
      "sdk-video-1",
      "sdk-image-1",
    ]);
  });

  it("leaves the list untouched when unframed", () => {
    expect(switcherSources(presets, false)).toBe(presets);
  });

  it("drops every webcam entry, not just the first", () => {
    const many = [...presets, { id: "webcam-2", kind: "webcam" }];
    expect(switcherSources(many, true).some((p) => p.kind === "webcam")).toBe(false);
  });
});
