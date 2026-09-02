/* eslint-disable react/no-unknown-property */
import { useCallback, useEffect, useState } from "react";
import {
  XRProvider,
  XRScene,
  VideoBackground,
  XRMediaSource,
  AspectRatioContainer,
} from "@vincentt-xr/sdk";
import { useXRContext, useXRReady, useXRError } from "@vincentt-xr/sdk/low-level";
import { PerspectiveCamera } from "@react-three/drei";

import { Scene } from "./Scene";
import { PreviewAnchors } from "./PreviewAnchors";
import { chooseMediaSource, isFramed, pickFramedDefault } from "./framed";
import type { MediaSourceEnv } from "./framed";
import { streamFromImageUrl, streamFromVideoUrl } from "./mediaStream";
import { MediaSourceControl } from "./MediaSourceControl";
import type { MediaPreset } from "./MediaSourceControl";

// Fallback clip for the "video" source when no VITE_INPUT_URL is supplied.
// Referenced by URL (not bundled) so it stays out of the published bundle —
// publish runs the webcam default and never hits this path. Editor preview
// always passes a real VITE_INPUT_URL, so this is a dev/last-resort fallback.
const FALLBACK_VIDEO_URL =
  "https://cdn.vincentt.studio/assets/preview/v2/videos/Head_tilt_woman.mp4";

/**
 * Picks the media source and starts the XR session. Runs once on mount.
 *
 * VITE_INPUT_SOURCE controls the source:
 *   - "webcam" (default): live getUserMedia — UNLESS this app is framed, see below
 *   - "video": loop VITE_INPUT_URL (or FALLBACK_VIDEO_URL if unset)
 *   - "photo": draw VITE_INPUT_URL to a canvas as a static 1-frame stream
 *
 * Photo/video sources are pre-mirrored to cancel the SDK's selfie flip.
 *
 * FRAMED: the webcam default is replaced by an SDK video preset. A framed app
 * has no camera grant (the embedder delegates none, deliberately), so starting
 * on the webcam would open with a permission error whose advice cannot work.
 * A configured source is never overridden — see `chooseMediaSource`.
 */
export const MediaSourceBinder = ({
  onSourceSelected,
  env = import.meta.env,
}: {
  onSourceSelected?: (p: MediaPreset) => void;
  /** Injectable so the configured branches are drivable; defaults to the build's env. */
  env?: MediaSourceEnv;
}) => {
  const { session } = useXRContext();

  useEffect(() => {
    let cancelled = false;
    let stopVideo: (() => void) | undefined;

    const init = async () => {
      const choice = chooseMediaSource(
        { VITE_INPUT_SOURCE: env.VITE_INPUT_SOURCE, VITE_INPUT_URL: env.VITE_INPUT_URL },
        isFramed(),
      );

      // The switcher is controlled and holds no source state of its own, so the
      // app announces what it actually bound. Without this the control has no
      // value to render and stays hidden — and in the framed case it is what
      // makes the preset APPEAR SELECTED rather than the control claiming
      // "Webcam" while a preset plays.
      if (choice.kind === "video") {
        const url = choice.url || FALLBACK_VIDEO_URL;
        const handle = await streamFromVideoUrl(url);
        stopVideo = handle.stop;
        if (cancelled) return;
        await session.setMediaSource({ source: XRMediaSource.STREAM, stream: handle.stream });
        onSourceSelected?.({ id: "configured", kind: "video", label: "Configured input", url });
      } else if (choice.kind === "framedPreset") {
        // Dynamic import: the preset module carries 12 CDN URLs and must not
        // reach a production bundle through a static import from app source.
        const { sdkVideoMediaSources } = await import("@vincentt-xr/sdk/debug-ui/media-source");
        const preset = pickFramedDefault(sdkVideoMediaSources);
        if (!preset?.url) throw new Error("no video preset available for the framed default");
        const handle = await streamFromVideoUrl(preset.url);
        stopVideo = handle.stop;
        if (cancelled) return;
        await session.setMediaSource({ source: XRMediaSource.STREAM, stream: handle.stream });
        onSourceSelected?.(preset);
      } else if (choice.kind === "photo") {
        const stream = await streamFromImageUrl(choice.url);
        if (cancelled) return;
        await session.setMediaSource({ source: XRMediaSource.STREAM, stream });
        onSourceSelected?.({
          id: "configured",
          kind: "image",
          label: "Configured input",
          url: choice.url,
        });
      } else {
        await session.setMediaSource({ source: XRMediaSource.WEBCAM });
        onSourceSelected?.({ id: "webcam", kind: "webcam", label: "Webcam" });
      }

      if (cancelled) return;
      await session.start();
    };

    init();

    return () => {
      cancelled = true;
      stopVideo?.();
    };
    // Runs once — session is stable for the app's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

const Loading = ({ shouldFadeOut }: { shouldFadeOut: boolean }) => (
  <div
    className={`flex w-full h-full flex-col items-center justify-center gap-6 bg-[var(--color-bg-app)] text-[var(--color-fg-app)] ${
      shouldFadeOut ? "animate-fadeOut [animation-delay:0.3s]" : ""
    }`}
  >
    <svg
      viewBox="0 0 2040 2040"
      fill="currentColor"
      className="h-16 w-16 animate-breathe"
      aria-hidden="true"
    >
      <path d="M1736.06,394.62l-195.11,1201.52c-4.4,27.09-30.43,49.25-57.87,49.25h-416.79c17.53,0,31.13-15.24,29.14-32.66l-35.06-306.39,48.9-796.11c.76-13.07,12.02-25.27,24.98-27.2l601.81-88.41Z" />
      <path d="M1074.53,1645.38H456.54L304.16,427.57c-2.17-17.47,11.49-32.95,29.14-32.95H912.07c29.37,0,55.64,23.98,58.33,53.23l98.2,858.49,35.06,306.39c1.99,17.41-11.61,32.66-29.14,32.66Z" />
    </svg>
    <div className="flex flex-col items-center gap-1">
      <div className="text-base font-medium tracking-wide">Vincentt</div>
      <div className="text-sm text-[var(--color-fg-muted)]">Make it real.</div>
    </div>
  </div>
);

const CameraError = () => {
  const xrError = useXRError();
  return (
  <div className="flex w-full h-full flex-col items-center justify-center gap-4 bg-[var(--color-bg-app)] text-[var(--color-fg-app)] px-8 text-center">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-12 w-12 text-[var(--color-fg-muted)]"
      aria-hidden="true"
    >
      <path d="M2 2l20 20" />
      <path d="M15 7h2a2 2 0 0 1 2 2v2m-2 6H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
      <path d="M9.5 9.5a3 3 0 0 0 4.2 4.2" />
    </svg>
    <div className="flex flex-col items-center gap-1">
      <div className="text-base font-medium tracking-wide">
        Camera unavailable
      </div>
      <div className="text-sm text-[var(--color-fg-muted)] max-w-xs">
        {xrError?.message ||
          "Allow camera access in your browser, then refresh the page."}
      </div>
    </div>
  </div>
  );
};

const Shell = () => {
  const ready = useXRReady();
  const { session } = useXRContext();

  // The app owns the selected source; the switcher only renders it. That is what
  // makes the framed default APPEAR SELECTED instead of the control claiming
  // "Webcam" while a preset plays.
  const [selected, setSelected] = useState<MediaPreset | null>(null);

  const applySource = useCallback(
    (next: MediaPreset) => {
      setSelected(next);
      const apply = async () => {
        if (next.kind === "webcam") {
          await session.setMediaSource({ source: XRMediaSource.WEBCAM });
          return;
        }
        if (!next.url) return;
        const stream =
          next.kind === "image"
            ? await streamFromImageUrl(next.url)
            : (await streamFromVideoUrl(next.url)).stream;
        await session.setMediaSource({ source: XRMediaSource.STREAM, stream });
      };
      apply();
    },
    [session],
  );

  return (
    <AspectRatioContainer>
      <XRScene
        loadingComponent={<Loading shouldFadeOut={ready} />}
        errorComponent={<CameraError />}
        loadingTransitionDuration={1000}
        style={{ width: "100%", height: "100%" }}
      >
        <MediaSourceBinder onSourceSelected={setSelected} />
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
        <VideoBackground
          segmentationMask={undefined}
          customBackground="#6366f1"
          renderOrder={-999}
        />
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Scene />
        <PreviewAnchors />
      </XRScene>
      <MediaSourceControl value={selected} onChange={applySource} />
    </AspectRatioContainer>
  );
};

const App = () => (
  <XRProvider>
    <Shell />
  </XRProvider>
);

export default App;
