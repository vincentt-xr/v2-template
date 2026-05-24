import type * as THREE from "three";

/**
 * AssetMap: the loaded asset textures, keyed by the keys declared in
 * `config/assets.ts`. A scene reads e.g. `assets.logo`.
 */
export type AssetMap = Record<string, THREE.Texture | undefined>;

/**
 * The single typed surface a scene receives. Kept deliberately small:
 * - `navigate(key)` switches AR scenes
 * - `assets` the loaded textures from config/assets.ts
 *
 * Per-scene setup goes in `useEffect`, per-frame in R3F `useFrame`, written
 * inside the scene component. There is no onInit/onUpdate lifecycle.
 *
 * `navigate` is typed as `string` here in the generic _core; the app's
 * `scenes` map narrows it to the real `SceneKey` union at the composition
 * root (see App.tsx), so a bad key is a compile error there.
 */
export interface SceneProps {
  navigate: (key: string) => void;
  assets: AssetMap;
}

export type SceneComponent = React.ComponentType<SceneProps>;

/**
 * The app config injected into the runtime at the composition root.
 * `_core` reads only this shape — it never imports `@app` directly,
 * preserving the one-way `_core` → (never) `app` boundary.
 */
export interface AppConfig {
  scenes: Record<string, SceneComponent>;
  initialScene: string;
  assets: Record<string, string>;
  xrModels: Array<{ model: string }>;
}
