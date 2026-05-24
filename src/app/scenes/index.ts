import type { SceneComponent } from "@core/SceneProps";

import Second from "./Second";
import Welcome from "./Welcome";

/**
 * THE scene wiring. To add a scene: create `scenes/<Name>.tsx` (default-export
 * a component taking SceneProps), then add one line here. Set `initialScene`
 * to the key you want shown first.
 */
export const scenes = {
  Welcome,
  Second,
} satisfies Record<string, SceneComponent>;

export type SceneKey = keyof typeof scenes;

export const initialScene: SceneKey = "Welcome";
