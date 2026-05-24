import { TextLabel } from "@vincentt-sdks/xr-sdk";

import type { SceneProps } from "@core/SceneProps";

export default function Second({ navigate }: SceneProps) {
  return (
    <group onClick={() => navigate("Welcome")}>
      <TextLabel
        text="Second scene — tap to go back"
        position={[0, 0.5, 0]}
        fontSize={180}
        bgColor="rgba(20,110,60,0.88)"
      />
    </group>
  );
}
