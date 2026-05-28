/* eslint-disable react/no-unknown-property */
import { useEffect } from "react";
import {
  XRProvider,
  XRScene,
  VideoBackground,
  useXRContext,
  XRMediaSource,
  useXRReady,
} from "@vincentt-sdks/xr-sdk";
import { AspectRatioContainer } from "@vincentt-sdks/xr-app-utilities";
import { PerspectiveCamera } from "@react-three/drei";

import { Scene } from "./Scene";
import { PreviewAnchors } from "./PreviewAnchors";

import PreviewVideo from "./assets/common/preview.mp4";

/**
 * Picks the media source and starts the XR session. Runs once on mount.
 *
 * VITE_INPUT_SOURCE controls the source:
 *   - "webcam" (default): live getUserMedia
 *   - "video": loop VITE_INPUT_URL (or the bundled preview.mp4 if unset)
 *   - "photo": draw VITE_INPUT_URL to a canvas as a static 1-frame stream
 *
 * Photo/video sources are pre-mirrored to cancel the SDK's selfie flip.
 */
const MediaSourceBinder = () => {
  const { session } = useXRContext();

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;

    const init = async () => {
      const inputSource = import.meta.env.VITE_INPUT_SOURCE;
      const inputUrl = import.meta.env.VITE_INPUT_URL;

      if (inputSource === "video") {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.src = inputUrl || PreviewVideo;
        video.loop = true;
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        await video.play();
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2d canvas context unavailable");
        const draw = () => {
          if (cancelled) return;
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();
          rafId = requestAnimationFrame(draw);
        };
        draw();
        const stream = (
          canvas as HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream }
        ).captureStream();
        await session.setMediaSource({ source: XRMediaSource.STREAM, stream });
      } else if (inputSource === "photo" && inputUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`failed to load ${inputUrl}`));
          img.src = inputUrl;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2d canvas context unavailable");
        ctx.scale(-1, 1);
        ctx.drawImage(img, -canvas.width, 0);
        const stream = (
          canvas as HTMLCanvasElement & {
            captureStream: (frameRate?: number) => MediaStream;
          }
        ).captureStream(0);
        await session.setMediaSource({ source: XRMediaSource.STREAM, stream });
      } else {
        await session.setMediaSource({ source: XRMediaSource.WEBCAM });
      }

      if (cancelled) return;
      await session.start();
    };

    init();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
    // Runs once — session is stable for the app's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

const Loading = ({ shouldFadeOut }: { shouldFadeOut: boolean }) => (
  <div
    className={`w-full h-full bg-[var(--color-bg-app)] ${
      shouldFadeOut ? "animate-fadeOut [animation-delay:0.3s]" : ""
    }`}
  />
);

const Shell = () => {
  const ready = useXRReady();
  return (
    <AspectRatioContainer>
      <XRScene
        loadingComponent={<Loading shouldFadeOut={ready} />}
        loadingTransitionDuration={1000}
        style={{ width: "100%", height: "100%" }}
      >
        <MediaSourceBinder />
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
    </AspectRatioContainer>
  );
};

const App = () => (
  <XRProvider>
    <Shell />
  </XRProvider>
);

export default App;
