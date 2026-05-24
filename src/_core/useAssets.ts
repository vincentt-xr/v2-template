import { useEffect, useState } from "react";
import * as THREE from "three";

import type { AssetMap } from "./SceneProps";

const isVideo = (url: string) => /\.(mp4|webm)$/i.test(url);

/**
 * Loads the declared assets map (url per key) into three.js textures, exposed
 * as the `assets` value handed to scenes. Image urls load via TextureLoader;
 * video urls become VideoTextures.
 */
export const useAssets = (sources: Record<string, string>): AssetMap => {
  const [assets, setAssets] = useState<AssetMap>({});

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();

    const load = async () => {
      const entries = await Promise.all(
        Object.entries(sources).map(async ([key, url]) => {
          if (isVideo(url)) {
            const video = document.createElement("video");
            video.src = url;
            video.loop = true;
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;
            await video.play().catch(() => {});
            const texture = new THREE.VideoTexture(video);
            texture.needsUpdate = true;
            return [key, texture] as const;
          }
          return [key, await loader.loadAsync(url)] as const;
        }),
      );
      if (!cancelled) setAssets(Object.fromEntries(entries));
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [sources]);

  return assets;
};
