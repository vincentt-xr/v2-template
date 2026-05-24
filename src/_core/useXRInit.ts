import { useXRContext, XRMediaSource } from "@vincentt-sdks/xr-sdk";
import { useEffect } from "react";

import PreviewVideo from "@assets/common/preview.mp4";

/**
 * The one irreducible effect the SDK does not do for us: pick the media
 * source, register the XR pipeline, and start the session. Runs once on mount.
 *
 * Media source: webcam by default; a looping preview video when
 * VITE_INPUT_SOURCE === "video" (the editor preview injects this so it can run
 * without camera permission).
 */
export const useXRInit = (xrModels: Array<{ model: string }>) => {
  const { session } = useXRContext();

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const inputSource = import.meta.env.VITE_INPUT_SOURCE;

      if (inputSource === "video") {
        const video = document.createElement("video");
        video.src = PreviewVideo;
        video.loop = true;
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        await video.play();
        const stream = (
          video as HTMLVideoElement & { captureStream: () => MediaStream }
        ).captureStream();
        await session.setMediaSource({ source: XRMediaSource.STREAM, stream });
      } else {
        await session.setMediaSource({ source: XRMediaSource.WEBCAM });
      }

      if (cancelled) return;
      await session.registerXRPipeline(xrModels as never);
      await session.start();
    };

    init();

    return () => {
      cancelled = true;
    };
    // Runs once: session and xrModels are stable for the app's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
