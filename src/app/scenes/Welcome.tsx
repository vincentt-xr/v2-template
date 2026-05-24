import { TextLabel } from "@vincentt-sdks/xr-sdk";

import type { SceneProps } from "@core/SceneProps";

/**
 * Worked example scene. A scene is a plain React component taking SceneProps.
 * - Render SDK components (<TextLabel>, trackers) and R3F primitives (<mesh>).
 * - `navigate(key)` switches to another scene (keys come from scenes/index.ts).
 * - Per-frame logic: R3F `useFrame`. Per-scene setup: `useEffect`.
 */
export default function Welcome({ navigate }: SceneProps) {
  return (
    <group onClick={() => navigate("Second")}>
      <TextLabel
        text="Hello from Vincentt"
        position={[0, 0.5, 0]}
        fontSize={220}
      />
    </group>
  );
}
