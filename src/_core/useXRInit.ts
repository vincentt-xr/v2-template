import { useXRContext, XRMediaSource } from "@vincentt-sdks/xr-sdk";
import { useEffect } from "react";

import PreviewVideo from "@assets/common/preview.mp4";

/**
 * The one irreducible effect the SDK does not do for us: pick the media
 * source, register the XR pipeline, and start the session. Runs once on mount.
 *
 * Media source (VITE_INPUT_SOURCE, with VITE_INPUT_URL for photo/video):
 *   - "webcam" (default): live getUserMedia.
 *   - "video": loop VITE_INPUT_URL (or the bundled preview.mp4 if unset) and
 *     capture it as a stream.
 *   - "photo": draw VITE_INPUT_URL to a canvas and capture a still frame as a
 *     1-frame stream (the SDK consumes a MediaStream; a still image becomes a
 *     static stream). Face analysis is image-only, so a chosen video is shown
 *     by the editor as its first frame via this same path when desired.
 *
 * The editor preview injects these at build time so it can run without a
 * camera prompt; a published app leaves the webcam default.
 */
export const useXRInit = (xrModels: Array<{ model: string }>) => {
  const { session } = useXRContext();

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const inputSource = import.meta.env.VITE_INPUT_SOURCE;
      const inputUrl = import.meta.env.VITE_INPUT_URL;

      if (inputSource === "video") {
        const video = document.createElement("video");
        // Cross-origin CDN media: anonymous so captureStream isn't tainted.
        video.crossOrigin = "anonymous";
        video.src = inputUrl || PreviewVideo;
        video.loop = true;
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        await video.play();
        const stream = (
          video as HTMLVideoElement & { captureStream: () => MediaStream }
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
        ctx.drawImage(img, 0, 0);
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
