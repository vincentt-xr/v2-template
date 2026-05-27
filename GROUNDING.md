# Vincentt XR SDK — Component Grounding Registry

Author scenes as React components in `src/app/scenes/<Name>.tsx`, default-exporting a function that takes `SceneProps` (`{ navigate, assets }`). Render the SDK components below plus R3F primitives. There is no lifecycle DSL — per-scene setup is `useEffect`, per-frame is `useFrame`, both written inside the component.

```tsx
import type { SceneProps } from "@core/SceneProps";
import { TextLabel } from "@vincentt-sdks/xr-sdk";

export default function Welcome({ navigate, assets }: SceneProps) {
  return (
    <group onClick={() => navigate("Second")}>
      <TextLabel text="Hello" position={[0, 0.5, 0]} fontSize={220} />
    </group>
  );
}
```

- `navigate(key)` — switch AR scenes. The key must be one declared in `scenes/index.ts` (type-checked).
- `assets` — loaded textures from `config/assets.ts`, e.g. `assets.preview`.

### `<TextLabel>` — Canvas-rendered text label/panel billboarded in 3D space.

Import from `@vincentt-sdks/xr-sdk`. Category: ui.

| prop           | type     | default              | notes                                                                                                                              |
| -------------- | -------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `text`         | `string` | **required**         | The text to render.                                                                                                                |
| `color`        | `string` | #ffffff              | Text color.                                                                                                                        |
| `fontSize`     | `number` | 48                   | Font size in CANVAS px at the default 512px canvas resolution, NOT world units. Chips/badges typically need 200-320 to look right. |
| `bgColor`      | `string` | rgba(20,40,110,0.88) | Panel background; use 'transparent' for text-only.                                                                                 |
| `borderColor`  | `string` | —                    | Border color; omit for no border.                                                                                                  |
| `borderRadius` | `number` | 24                   | Corner radius; 0 for square.                                                                                                       |
| `aspect`       | `number` | 2.5                  | Panel SHAPE (width ÷ height). >1 = wide/banner, <1 = tall, 1 = square. This is how you make a wide banner vs a square chip — NOT fontSize. e.g. a full-width top banner is aspect ~5–7. |
| `scale`        | `[x,y,z] \| number` | 1         | World size of the panel. The mesh is 1×1 world units; scale it up to span more of the view (e.g. `scale={[4,1,1]}` for a wide bar). Combine wide `aspect` + wide `scale.x` for a full-width banner. |
| `position`     | `[x,y,z]` | [0,0,0]             | World position. +Y up, -Y down, +X right, -X left.                                                                                 |
| `name`         | `string` | —                    | Stable identifier for the rendered mesh. Set a short descriptive name on every element you create (e.g. `name="welcomeLabel"`). It enables `getObjectByName` at runtime AND lets visual feedback match this element by name. |

**Gotchas:**

- Name the elements you create. → Always give each `<TextLabel>`/mesh a `name`. Unnamed elements are anonymous at runtime, which makes later edits and visual-feedback targeting guess by position instead of identity.
- fontSize is canvas px, not world units. → The canvas is 512px by default. Chips/badges need fontSize ~200-320, not ~16-48.
- fontSize does NOT change the panel's shape or width — it only changes text size inside the panel. → To make a wide/short banner, set `aspect` (shape) and `scale` (world size), not a bigger fontSize. A bigger fontSize on a square `aspect` just yields a bigger square.
- TextLabel ignores the `visible` prop. → To start hidden, wrap it in `<group visible={false}>` — otherwise it flashes for one frame.

```tsx
// Text-only label
<TextLabel text="Hello" fontSize={240} color="#fff" bgColor="transparent" />

// Full-width banner pinned near the top of the view
<TextLabel
  text="Welcome"
  position={[0, 1.4, 0]}
  scale={[4, 0.8, 1]}
  aspect={6}
  fontSize={180}
/>
```

### `<HandTracker>` — Registers the HAND_TRACKER model. Detects closed_fist and open_palm only.

Import from `@vincentt-sdks/xr-sdk`. Category: tracking.

**Gotchas:**

- HandTracker only registers closed_fist / open_palm. → Gestures like "victory"/peace sign require the gesture-tracker model — use GestureTracker, not HandTracker, for those.

```tsx
<HandTracker />
```

### `<GestureTracker>` — Registers the gesture-tracker model with the full named-gesture set (e.g. victory/peace sign).

Import from `@vincentt-sdks/xr-sdk`. Category: tracking.

```tsx
<GestureTracker />
```

### `<FaceTracker>` — Registers face tracking; exposes face landmarks via context APIs.

Import from `@vincentt-sdks/xr-sdk`. Category: tracking.

**Gotchas:**

- Face tracker API is accessed via context/hooks, not the THREE namespace. → Read landmarks through the tracker context/hooks, not by reaching into three.js globals.

```tsx
<FaceTracker />
```

### `<Panel>` — A 3D billboarded panel for grouping UI content.

Import from `@vincentt-sdks/xr-sdk`. Category: ui.

```tsx
<Panel>
  <TextLabel text="Title" fontSize={240} />
</Panel>
```

### `<mesh>` — R3F mesh primitive — geometry + material.

Import from `three (R3F intrinsic)`. Category: primitive.

| prop       | type                       | default | notes           |
| ---------- | -------------------------- | ------- | --------------- |
| `position` | `[number, number, number]` | —       | World position. |
| `rotation` | `[number, number, number]` | —       | Euler rotation. |
| `visible`  | `boolean`                  | true    | Visibility.     |

**Gotchas:**

- Materials accept `map`, not `alphaMap`, for image asset keys. → Only `map` is a valid asset-keyed texture slot; do not emit alphaMap for asset keys.

```tsx
<mesh position={[0, 0, -2]}>
  <planeGeometry args={[1, 1]} />
  <meshStandardMaterial color="hotpink" />
</mesh>
```

## Notes

- `VideoBackground`, the camera, and lighting are set up by the framework (`src/_core/Runtime.tsx`). Don't add your own camera background plane.
- Assets: add a file under `src/assets`, map it in `config/assets.ts`, read it in a scene via `props.assets.<key>`.
- XR trackers: list the models your scenes need in `config/xrModels.ts`.
