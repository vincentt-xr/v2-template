import { useCallback, useState } from "react";

import type { AssetMap, SceneComponent } from "./SceneProps";

interface SceneSwitchProps {
  scenes: Record<string, SceneComponent>;
  initialScene: string;
  assets: AssetMap;
}

/**
 * Holds the current AR scene key and renders the matching component, handing
 * it `navigate` (to switch scenes) and `assets`. The current scene is plain
 * React state — switching is a `setState`, not a registry mutation.
 */
export const SceneSwitch = ({
  scenes,
  initialScene,
  assets,
}: SceneSwitchProps) => {
  const [current, setCurrent] = useState(initialScene);
  const navigate = useCallback((key: string) => setCurrent(key), []);

  const Scene = scenes[current];
  if (!Scene) {
    // A missing scene at runtime means the key wired in scenes/index.ts is
    // wrong. The typed `scenes` map makes this a compile error at the call
    // site; this guard is the last-resort runtime signal.
    throw new Error(
      `Scene "${current}" is not in the scenes map. Available: ${Object.keys(scenes).join(", ")}`,
    );
  }

  return <Scene navigate={navigate} assets={assets} />;
};
