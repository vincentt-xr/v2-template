// 4C · QA-F13-G11 and QA-F13-G14 — the framed-source branch and the switcher's
// REACHABLE behavior, from features/f13-preview-workspace/qa.md.
//
// Driven against the REAL SDK switcher and a fake stream. No camera, no phone, no
// tunnel.
//
// ── G14 IS WRITTEN SO A CORRECT BUILD CANNOT FAIL IT ──────────────────────────
//
// FORK-Q3, verified from shipped SDK source: the switcher's kind TABS are
// hardcoded `["webcam","image","video"]` at MediaSourceSwitcher.tsx:285 and are
// NOT derived from `sources`. So filtering the webcam entries out of `sources`
// leaves the Camera TAB rendering. Tapping it calls `selectKind('webcam')`, whose
// `groupedSources.webcam[0]` is `undefined`, so `onChange` is never called and the
// panel shows the SDK's own empty-state string "No camera source".
//
// A case written to the record's earlier wording — "no webcam entry" / "no webcam
// affordance" — would therefore FAIL AGAINST A CORRECT IMPLEMENTATION, and the
// likely reaction would be to "fix" it by editing the SDK, which this feature
// budgets at ZERO change. So this asserts the REACHABLE behavior instead: the tab
// is present, tapping it changes no media source, and the panel reads "No camera
// source" — NOT the template's CameraError.
//
// The destructive half is the one that matters and it is what is asserted: no tap
// can reach `getUserMedia`, so there is no unrecoverable scene.

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MediaSourceSwitcher,
  defaultMediaSources,
} from "@vincentt-xr/sdk/debug-ui/media-source";

import { chooseMediaSource, isFramed, pickFramedDefault, switcherSources } from "./framed";

let getUserMedia: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // A REJECTING spy, not a resolving one. A resolving stub would let a build that
  // called getUserMedia sail past — the assertion is that it is NEVER CALLED, and
  // the spy is what proves it rather than the absence of a visible error.
  getUserMedia = vi.fn().mockRejectedValue(new Error("getUserMedia must not be called"));
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
});

afterEach(() => {
  // The switcher renders through a PORTAL into document.body, so RTL's automatic
  // per-test unmount does not reclaim it and a second render leaves two live
  // switchers in the document. Every `getByTitle` then reports "found multiple
  // elements" — a test-authoring artifact, not a product defect, and exactly the
  // kind of noise that gets a real case waved through as flaky.
  cleanup();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// QA-F13-G11 · the framed branch never selects the webcam, and config wins
// ---------------------------------------------------------------------------

describe("QA-F13-G11 · the framed branch never selects the webcam", () => {
  // Four conditions: framed/unframed × configured/default. The 2×2 is the case —
  // a build that simply never selected the webcam would pass a framed-only test
  // and BREAK EVERY CREATOR'S LOCAL DEV LOOP.
  it("framed + default → a preset, never the webcam", () => {
    expect(chooseMediaSource({}, true)).toEqual({ kind: "framedPreset" });
  });

  it("framed + configured → the CREATOR'S source, unchanged", () => {
    // A creator who configured a source keeps it, framed or not. Overriding a
    // deliberate config pointed at client footage would hide work they did.
    expect(chooseMediaSource({ VITE_INPUT_SOURCE: "video", VITE_INPUT_URL: "u" }, true)).toEqual({
      kind: "video",
      url: "u",
    });
    expect(chooseMediaSource({ VITE_INPUT_SOURCE: "photo", VITE_INPUT_URL: "p" }, true)).toEqual({
      kind: "photo",
      url: "p",
    });
  });

  it("unframed + default → the WEBCAM, byte-identical to today (a REGRESSION PIN)", () => {
    // The shipped behavior on a creator's own machine. This is the clause that
    // makes the framed branch a narrowing rather than a replacement.
    expect(chooseMediaSource({}, false)).toEqual({ kind: "webcam" });
  });

  it("unframed + configured → unchanged", () => {
    expect(chooseMediaSource({ VITE_INPUT_SOURCE: "video" }, false)).toEqual({
      kind: "video",
      url: undefined,
    });
  });

  it("the framed default resolves to a VIDEO preset in the SDK's real list", () => {
    // A MOVING clip rather than a still, so the creator sees the tracker RESPOND
    // rather than a frozen detection. Read from the SDK's own list rather than
    // hand-written, so this cannot drift from the SDK.
    const picked = pickFramedDefault(defaultMediaSources as Array<{ kind: string }>);
    expect(picked, "the SDK's preset list must contain a video preset").toBeDefined();
    expect(picked!.kind).toBe("video");
  });

  it("the framing check reads a FACT ABOUT ITSELF, with no sender and no channel", () => {
    // No parameter, no message, no postMessage listener. Also true inside ANY
    // frame, which is correct: the reasoning (no camera grant crosses the
    // boundary) holds for any embedder.
    expect(isFramed({ self: {}, top: {} })).toBe(true);
    const same = {};
    expect(isFramed({ self: same, top: same })).toBe(false);
  });

  it("an unknown or throwing context folds to NOT framed", () => {
    // Fail toward today's shipped behavior. Folding the other way would silently
    // swap a creator's camera for a canned clip ON THEIR OWN MACHINE.
    const hostile = {
      get self() {
        return {};
      },
      get top(): unknown {
        throw new Error("cross-origin");
      },
    };
    expect(isFramed(hostile as never)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// QA-F13-G14 · the webcam entry is filtered, and the dead tab does not lie
// ---------------------------------------------------------------------------

describe("QA-F13-G14 · the framed switcher's reachable behavior", () => {
  const framedSources = () =>
    switcherSources(defaultMediaSources as Array<{ kind: string; id: string; label: string }>, true);

  it("POSITIVE CONTROL · the SDK's real list DOES contain webcam entries when unframed", () => {
    // R2. Without this, "no webcam entry when framed" would also pass against an
    // SDK whose preset list had no webcam entry at all, or an empty list.
    const unframed = switcherSources(
      defaultMediaSources as Array<{ kind: string }>,
      false,
    );
    expect(
      unframed.filter((s) => s.kind === "webcam").length,
      "the SDK must ship at least one webcam entry, or the filter has nothing to remove",
    ).toBeGreaterThan(0);
  });

  it("no webcam entry is SELECTABLE when framed", () => {
    const framed = framedSources();
    expect(framed.filter((s) => s.kind === "webcam")).toEqual([]);
    // And the list is not merely emptied — the other kinds survive, so the
    // creator can still swap inputs.
    expect(framed.length).toBeGreaterThan(0);
  });

  it("the Camera TAB still renders when framed — and that is the correct behavior", async () => {
    // FORK-Q3. The record's earlier wording ("the filter removes the webcam
    // entry") would have a case assert NO webcam affordance, which fails against
    // a correct implementation because the tabs are hardcoded in the SDK.
    const sources = framedSources();
    const onChange = vi.fn();
    render(
      <MediaSourceSwitcher
        value={sources[0] as never}
        onChange={onChange as never}
        sources={sources as never}
      />,
    );

    // Open the switcher (it starts collapsed as a FAB).
    fireEvent.click(screen.getByTitle("Open Media Menu"));
    const cameraTab = await screen.findByTitle("Webcam");
    expect(cameraTab, "the kind tabs are hardcoded in the SDK, so the tab remains").toBeTruthy();
  });

  it("tapping the Camera tab changes NO media source and reaches NO getUserMedia", async () => {
    const sources = framedSources();
    const onChange = vi.fn();
    render(
      <MediaSourceSwitcher
        value={sources[0] as never}
        onChange={onChange as never}
        sources={sources as never}
      />,
    );

    fireEvent.click(screen.getByTitle("Open Media Menu"));
    fireEvent.click(await screen.findByTitle("Webcam"));

    // THE DESTRUCTIVE HALF, CLOSED. `groupedSources.webcam[0]` is undefined, so
    // onChange is never called — nothing is selected and the running scene is
    // untouched.
    expect(
      onChange,
      "tapping the dead Camera tab must not change the media source",
    ).not.toHaveBeenCalled();

    // And no camera was ever requested. Unfiltered, ONE TAP would replace the
    // whole scene with "Allow camera access in your browser, then refresh the
    // page" — advice that can NEVER work, because the permission was withheld on
    // purpose.
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('the panel reads the SDK\'s "No camera source", NOT the template\'s CameraError', async () => {
    const sources = framedSources();
    render(
      <MediaSourceSwitcher
        value={sources[0] as never}
        onChange={vi.fn() as never}
        sources={sources as never}
      />,
    );

    fireEvent.click(screen.getByTitle("Open Media Menu"));
    fireEvent.click(await screen.findByTitle("Webcam"));

    // The SDK's own empty state — an honest "there is nothing here", not a
    // permission error the creator could act on and would fail at.
    await waitFor(() => {
      expect(screen.getByText("No camera source")).toBeTruthy();
    });
    // NEVER the camera-permission advice.
    expect(screen.queryByText(/allow camera access/i)).toBeNull();
    expect(screen.queryByText(/refresh the page/i)).toBeNull();
  });

  it("UNFRAMED, the webcam entry is untouched — a REGRESSION PIN on the dev loop", () => {
    // The filter must be a narrowing that applies ONLY in a frame. A build that
    // filtered unconditionally would break every creator's local webcam.
    const unframed = switcherSources(defaultMediaSources as Array<{ kind: string }>, false);
    expect(unframed).toEqual(defaultMediaSources);
  });
});
