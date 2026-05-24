import preview from "@assets/common/preview.mp4";

/**
 * Assets to load at startup. Keys are how a scene reads the loaded texture:
 * `props.assets.preview`. Add image/video files under src/assets and map them
 * here. Loaded textures are handed to scenes via SceneProps.assets.
 */
export const assets: Record<string, string> = {
  preview,
};
