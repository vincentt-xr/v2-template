/* eslint-disable react/no-unknown-property */
import { AspectRatioContainer } from "@vincentt-sdks/xr-app-utilities";
import { useXRReady, VideoBackground, XRScene } from "@vincentt-sdks/xr-sdk";
import { PerspectiveCamera } from "@react-three/drei";

import { Loading } from "./Loading";
import { PreviewAnchors } from "./PreviewAnchors";
import { SceneSwitch } from "./SceneSwitch";
import type { AppConfig } from "./SceneProps";
import { useAssets } from "./useAssets";
import { useXRInit } from "./useXRInit";

/**
 * The XR runtime. Composes the SDK's XRScene (which owns the Canvas, render
 * target, and the loading-overlay gate via useXRReady) with the app's scenes
 * and the one media/pipeline init effect. Reads only the injected `config`;
 * never imports `@app`.
 */
export const Runtime = ({ config }: { config: AppConfig }) => {
  useXRInit(config.xrModels);
  const assets = useAssets(config.assets);
  const ready = useXRReady();

  return (
    <AspectRatioContainer>
      <XRScene
        loadingComponent={<Loading shouldFadeOut={ready} />}
        loadingTransitionDuration={1000}
        style={{ width: "100%", height: "100%" }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
        <VideoBackground
          segmentationMask={undefined}
          customBackground="#6366f1"
          renderOrder={-999}
        />
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <SceneSwitch
          scenes={config.scenes}
          initialScene={config.initialScene}
          assets={assets}
        />
        <PreviewAnchors />
      </XRScene>
    </AspectRatioContainer>
  );
};
