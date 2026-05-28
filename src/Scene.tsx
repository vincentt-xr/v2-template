/* eslint-disable react/no-unknown-property */
// Scene.tsx — the agent's surface.
// Add SDK components and R3F primitives here.
// See GROUNDING.md for the API reference and pattern catalog.
import { ScreenSpaceUI, ScreenTransform, TextLabel } from "@vincentt-sdks/xr-sdk";

export const Scene = () => (
  <ScreenSpaceUI>
    <ScreenTransform anchors={{ left: -0.5, right: 0.5, top: 0.2, bottom: -0.2 }}>
      <TextLabel
        name="helloLabel"
        text="Hello from Vincentt"
        fontSize={220}
        color="#ffffff"
        bgColor="rgba(20,40,110,0.88)"
        borderRadius={24}
        aspect={3}
      />
    </ScreenTransform>
  </ScreenSpaceUI>
);
