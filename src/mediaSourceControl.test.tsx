// The framed switcher, rendered. Two properties:
//
//  1. THE SWITCHER AGREES — the rendered selection is the framed preset, not
//     Webcam. The switcher is controlled and holds no source state, so this is
//     the app's value showing through rather than the control claiming one.
//  2. THE WEBCAM SOURCES ARE FILTERED when framed.
//
// The dead Camera TAB is deliberately NOT asserted away: the switcher's kind
// tabs are hardcoded and are not derived from the sources list, so the tab
// remains and reads "No camera source". That is documented, not fixed — the SDK
// stays at zero change. What matters, and what is asserted here, is the
// REACHABLE behavior: no webcam is selectable and no tap reaches getUserMedia.

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultMediaSources, sdkVideoMediaSources } from "@vincentt-xr/sdk/debug-ui/media-source";

import { MediaSourceControl } from "./MediaSourceControl";

const FRAMED_PRESET = sdkVideoMediaSources[0];

const frameIt = () => {
  vi.spyOn(window, "top", "get").mockReturnValue({ name: "embedder" } as unknown as Window);
};

let getUserMedia: ReturnType<typeof vi.fn>;

beforeEach(() => {
  getUserMedia = vi.fn().mockRejectedValue(new Error("getUserMedia must not be called"));
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
});

afterEach(() => {
  // The switcher portals into document.body, so unmounting is explicit here —
  // otherwise each test's control accumulates and every query finds several.
  cleanup();
  vi.restoreAllMocks();
});

const openPanel = async () => {
  const fab = await screen.findByTitle("Open Media Menu");
  fab.click();
};

describe("MediaSourceControl · framed", () => {
  it("renders the framed preset as the selection, not Webcam", async () => {
    frameIt();
    render(<MediaSourceControl value={FRAMED_PRESET} onChange={vi.fn()} />);

    await openPanel();
    const select = await screen.findByRole("combobox");
    expect((select as HTMLSelectElement).value).toBe(FRAMED_PRESET.id);
    expect((select as HTMLSelectElement).value).not.toBe("webcam");
  });

  it("offers no webcam option, so none can be selected", async () => {
    frameIt();
    render(<MediaSourceControl value={FRAMED_PRESET} onChange={vi.fn()} />);

    await openPanel();
    await screen.findByRole("combobox");
    const optionValues = screen
      .getAllByRole("option")
      .map((o) => (o as HTMLOptionElement).value);
    expect(optionValues).not.toContain("webcam");
  });

  it("a configured source is shown as selected without re-admitting a webcam entry", async () => {
    frameIt();
    const configured = {
      id: "configured",
      kind: "video",
      label: "Configured input",
      url: "https://example.test/client-footage.mp4",
    };
    render(<MediaSourceControl value={configured} onChange={vi.fn()} />);

    await openPanel();
    const select = (await screen.findByRole("combobox")) as HTMLSelectElement;
    expect(select.value).toBe("configured");
    expect([...select.options].map((o) => o.value)).not.toContain("webcam");
  });

  it("a webcam value cannot re-admit a webcam entry when framed", async () => {
    // Structural, not incidental: the framed filter is re-applied after the
    // app's own value is prepended, so no path puts a webcam back in the list.
    frameIt();
    const webcam = { id: "webcam", kind: "webcam", label: "Webcam" };
    render(<MediaSourceControl value={webcam} onChange={vi.fn()} />);

    await openPanel();
    const options = screen.queryAllByRole("option").map((o) => (o as HTMLOptionElement).value);
    expect(options).not.toContain("webcam");
  });

  it("tapping the dead Camera tab selects nothing and never reaches getUserMedia", async () => {
    // QA-F13-G14's reachable behavior. The tab is present (hardcoded in the SDK)
    // and is expected to be present — asserting its ABSENCE would fail against a
    // correct build and push someone to edit the SDK.
    frameIt();
    const onChange = vi.fn();
    render(<MediaSourceControl value={FRAMED_PRESET} onChange={onChange} />);

    await openPanel();
    const cameraTab = await screen.findByTitle("Webcam");
    cameraTab.click();

    await screen.findByText("No camera source");
    expect(onChange).not.toHaveBeenCalled();
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});

describe("MediaSourceControl · unframed", () => {
  it("keeps the webcam entry, unchanged from today", async () => {
    render(<MediaSourceControl value={defaultMediaSources[0]} onChange={vi.fn()} />);

    await openPanel();
    await screen.findByRole("combobox");
    const optionValues = screen
      .getAllByRole("option")
      .map((o) => (o as HTMLOptionElement).value);
    expect(optionValues).toContain("webcam");
  });
});

describe("MediaSourceControl · production", () => {
  it("mounts nothing when disabled, so a published bundle never loads the switcher", async () => {
    frameIt();
    const { container } = render(
      <MediaSourceControl value={FRAMED_PRESET} onChange={vi.fn()} enabled={false} />,
    );

    await waitFor(() => expect(container).toBeTruthy());
    expect(document.querySelector('[title="Open Media Menu"]')).toBeNull();
  });
});
