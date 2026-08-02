// Scene.tsx — the agent's surface.
// Add SDK components and R3F primitives here.
// See GROUNDING.md for the API reference and pattern catalog.
//
// react/no-unknown-property is disabled for this file in .eslintrc.json, not by
// a directive here: R3F props (position, rotation, args) are unknown to the rule
// and every one of them errors, but this file is EMPTY of primitives until an
// agent adds some — so an in-file directive sits unused, and the lint script
// runs --report-unused-disable-directives, which makes the unused directive
// itself the error. Disabling at the config keeps the suppression true in both
// states.
import { ScreenSpaceUI, ScreenTransform, TextLabel } from "@vincentt-xr/sdk";

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
