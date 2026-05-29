# Vincentt XR SDK — Grounding Reference

Edit `src/Scene.tsx`. Compose the SDK components and hooks below with R3F primitives. There is no lifecycle DSL — per-frame logic is R3F `useFrame`, per-mount setup is `useEffect`, both written inside the scene component. Trackers (`<FaceTracker>`, `<GestureTracker>`, `<HandTracker>`, `<BodyTracker>`) **self-register** when mounted — no explicit `registerXRPipeline` call.

---

## Screen-space layout (your primary tool)

Most Vincentt projects use screen-space UI: decorative frames, prompts, badges, controls — overlaid on the live camera feed. This is more common than world-space landmark attachment.

### `<ScreenSpaceUI>` — Container for screen-space content

Wraps all screen-anchored children. Must be the parent of any `<ScreenTransform>`.

```tsx
import { ScreenSpaceUI, ScreenTransform } from "@vincentt-sdks/xr-sdk";

<ScreenSpaceUI>
  <ScreenTransform anchors={{ left: -1, right: 1, top: 1, bottom: -1 }}>
    {/* full-screen content */}
  </ScreenTransform>
</ScreenSpaceUI>
```

### `<ScreenTransform anchors={{ left, right, top, bottom }}>` — Place an element within a normalized screen rect

Coordinates are normalized: -1 to +1, with +y up. The center of the screen is `(0, 0)`.

```tsx
// Full-screen frame
<ScreenTransform anchors={{ left: -1, right: 1, top: 1, bottom: -1 }}>
  <mesh name="frame"><planeGeometry args={[1, 1]} /><meshBasicMaterial map={frameTex} transparent /></mesh>
</ScreenTransform>

// Bottom-center prompt
<ScreenTransform anchors={{ left: -0.4, right: 0.4, top: -0.5, bottom: -0.9 }}>
  <TextLabel name="prompt" text="Show your hand" fontSize={220} />
</ScreenTransform>
```

### `useScreenRectAspect()` + `computeContainScale(rectAspect, contentAspect)` — Aspect-correct fitting

Use together when you need a texture or mesh to fit inside its anchor box without stretching.

```tsx
import { useScreenRectAspect, computeContainScale } from "@vincentt-sdks/xr-sdk";

const rectAspect = useScreenRectAspect();
const [sx, sy] = computeContainScale(rectAspect, 1200 / 800); // content w/h ratio

<mesh name="badge" scale={[sx * 0.5, sy * 0.5, 1]}>
  <planeGeometry args={[1, 1]} />
  <meshBasicMaterial map={tex} transparent />
</mesh>
```

---

## Trackers (self-registering)

Mount the tracker component; it registers the underlying ML model automatically. No `registerXRPipeline` call needed.

### `<FaceTracker>` — Face tracking (468 landmarks)

Detects faces and provides face transform to children via context. Supports `faceIndex` (default 0) and `scaleWithFace`.

```tsx
import { FaceTracker, TrackingAnchor } from "@vincentt-sdks/xr-sdk";

<FaceTracker>
  <TrackingAnchor target="face.forehead">
    <mesh name="crown" position={[0, 0.1, 0]}>
      <planeGeometry args={[0.3, 0.15]} />
      <meshBasicMaterial map={crownTex} transparent />
    </mesh>
  </TrackingAnchor>
</FaceTracker>
```

### `<FaceTracker.Mesh />` / `<FaceMesh>` — Deforming 468-point face mesh

For masks, makeup, and full-face decoration that deforms with skin.

```tsx
import { FaceTracker, FaceMesh } from "@vincentt-sdks/xr-sdk";

<FaceTracker>
  <FaceMesh appearance={{ map: maskTex }} />
</FaceTracker>
```

### `<HandTracker>` — Hand tracking (21 joints)

Registers the HAND_TRACKER model. Detects `closed_fist` and `open_palm` only. For named gestures (peace/victory, thumbs-up, etc.) use `<GestureTracker>` instead.

```tsx
import { HandTracker } from "@vincentt-sdks/xr-sdk";

<HandTracker />
```

### `<GestureTracker>` — Full named-gesture set

Registers the gesture-tracker model. Detects: `victory`, `pointing_up`, `open_hand`, `closed_fist`, `open_palm`, `thumbs_up`, `thumbs_down`, and more. Use this for peace-sign / thumbs-up interactions.

```tsx
import { GestureTracker } from "@vincentt-sdks/xr-sdk";

<GestureTracker />
```

### `<BodyTracker>` — Pose tracking (33 landmarks)

Head, shoulders, elbows, wrists, hips, knees, ankles.

```tsx
import { BodyTracker, TrackingAnchor } from "@vincentt-sdks/xr-sdk";

<BodyTracker>
  <TrackingAnchor target="body.leftShoulder">
    <mesh name="badge-left"><sphereGeometry args={[0.05]} /><meshBasicMaterial color="red" /></mesh>
  </TrackingAnchor>
</BodyTracker>
```

### `<Segmentation type="portrait">` — Background segmentation (declarative)

Registers the portrait segmentation pipeline. The resulting mask feeds into `<VideoBackground segmentationMask={...} />` for background replacement. Mount it alongside a ref or state that holds the mask texture.

---

## Reading tracker state

### `<TrackingAnchor target="...">` — Declarative landmark following

Wraps children; the child's world position is updated to the tracked landmark each frame. Use for all decoration that simply follows a face/hand/body point.

Valid targets:
- **Face:** `face.forehead`, `face.noseTip`, `face.chin`, `face.leftEyeOuter`, `face.rightEyeOuter`, `face.leftCheek`, `face.rightCheek`, `face.mouthCenter`
- **Hand:** `hand.wrist`, `hand.thumbTip`, `hand.indexTip`, `hand.middleTip`, `hand.ringTip`, `hand.pinkyTip`, `hand.indexBase`, `hand.middleBase`, `hand.ringBase`, `hand.pinkyBase`
- **Body:** `body.head`, `body.neck`, `body.leftShoulder`, `body.rightShoulder`, `body.leftElbow`, `body.rightElbow`, `body.leftWrist`, `body.rightWrist`, `body.leftHip`, `body.rightHip`, `body.leftKnee`, `body.rightKnee`, `body.leftAnkle`, `body.rightAnkle`

```tsx
<FaceTracker>
  <TrackingAnchor target="face.noseTip">
    <mesh name="noseDot" scale={[0.04, 0.04, 0.04]}>
      <sphereGeometry />
      <meshBasicMaterial color="red" />
    </mesh>
  </TrackingAnchor>
</FaceTracker>
```

### `useXRContext()` + `session.getModelNode(XRModel.GESTURE_TRACKER)` — Raw gesture reads

Use inside `useFrame` when you need the gesture name or landmark coordinates for a state machine or fine-grained control.

```tsx
import { useXRContext, XRModel } from "@vincentt-sdks/xr-sdk";
import { useFrame } from "@react-three/fiber";

const { session } = useXRContext();

useFrame(() => {
  const node = session.getModelNode(XRModel.GESTURE_TRACKER) as
    | { gesture?: string; coordinates?: { x: number; y: number }[] }
    | undefined;
  if (node?.gesture === "victory") {
    // handle peace sign
  }
});
```

### `<GestureTrigger gestures={["victory"]} onTrigger={(g) => ...}>` — Declarative one-shot gesture handler

Debounced; fires once per gesture recognition event. Simpler alternative to manual `useFrame` polling.

```tsx
import { GestureTracker, GestureTrigger } from "@vincentt-sdks/xr-sdk";

<GestureTracker />
<GestureTrigger
  gestures={["victory"]}
  onTrigger={() => console.log("peace sign!")}
/>
```

### `useGestureHold({ gesture, holdMs, armDelayMs, enabled, onTrigger })` — hold-to-trigger (from `src/gesture.ts`)

`<GestureTrigger>` is one-shot. `useGestureHold` fires after a gesture has been **held** for `holdMs`, debounced so a stray misclassified frame can't latch it. It re-arms when the gesture is released, so the next hold fires again. Needs a `<GestureTracker />` mounted.

```tsx
import { GestureTracker } from "@vincentt-sdks/xr-sdk";
import { useGestureHold } from "./gesture";

<GestureTracker />;

// hold the peace sign ~0.6s to take the photo
useGestureHold({ gesture: "victory", holdMs: 600, onTrigger: takePhoto });
```

- `holdMs: 0` fires on first detection (instant); larger values require a deliberate hold.
- **`armDelayMs` (default 500) is the scene-transition guard.** When a gesture advances to a new scene, the user's hand is often still in that gesture as the next scene mounts — without an arm delay the new scene would fire instantly off the lingering gesture. The default keeps "the next scene doesn't double-fire" working out of the box. Pass `armDelayMs: 0` only if you genuinely want instant-on-mount.
- `enabled: false` gates it without unmounting (e.g. only accept the gesture after a celebration finishes).

```tsx
// Scene A: instant peace-sign advances to Scene B
useGestureHold({ gesture: "victory", holdMs: 0, onTrigger: goToSceneB });

// Scene B: the default arm delay ignores the peace sign that's still up from leaving A
useGestureHold({ gesture: "victory", holdMs: 0, onTrigger: goToSceneC });
```

---

## Capture (photo + video)

Trigger-agnostic capture primitives live in `src/capture.ts`. Wire them to whatever the project uses — a gesture, a click, a timer — the hooks don't care. Both flows return `{ blob, dataUrl }` so previews, downloads, uploads, and shares are all one-line follow-ups.

### `usePhotoCapture()` — single-shot photo from the live R3F render

```tsx
import { usePhotoCapture, saveToDevice } from "../capture";
import { GestureTracker, GestureTrigger } from "@vincentt-sdks/xr-sdk";

const { capture, latest } = usePhotoCapture();

<GestureTracker />
<GestureTrigger
  gestures={["victory"]}
  onTrigger={async () => {
    const photo = await capture();
    saveToDevice(photo, "snap.png");
  }}
/>

// optional preview thumbnail (R3F mesh)
{latest && (
  <ScreenTransform anchors={{ left: 0.4, right: 0.9, top: 0.9, bottom: 0.6 }}>
    <mesh name="thumb">
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={useTexture(latest.dataUrl)} />
    </mesh>
  </ScreenTransform>
)}
```

### `useVideoCapture({ audio? })` — record the live canvas to a video blob

```tsx
import { useVideoCapture, saveToDevice } from "../capture";

const { start, stop, isRecording } = useVideoCapture({ audio: true });

<GestureTrigger gestures={["open_palm"]} onTrigger={() => start()} />
<GestureTrigger gestures={["closed_fist"]} onTrigger={async () => {
  const video = await stop();
  saveToDevice(video, "clip.webm");
}} />
```

`isRecording` is reactive — use it to drive a "● REC" indicator or pulse a UI element while filming. Audio is off by default so kiosk / silent contexts don't surface a mic prompt; pass `{ audio: true }` for mobile capture with sound.

### `saveToDevice(media, filename)` — browser download

Mobile: surfaces the share / save sheet. Desktop: writes to `~/Downloads`. Kiosk contexts usually want to upload `media.blob` to a server instead — skip this helper and `fetch(uploadUrl, { method: "POST", body: media.blob })`.

### `session.captureFrame(): string` — low-level alternative

Returns a raw `data:image/png;base64,...` string. Use this only when you need the synchronous string directly (e.g. setting a texture without going through state). For everything else, prefer `usePhotoCapture()` — it manages the latest preview, returns a `Blob` for uploads, and keeps the photo/video API shapes symmetric.

---

## Camera background

### `<VideoBackground customBackground="#6366f1" segmentationMask={maskTex} renderOrder={-999} />`

Already mounted in `src/App.tsx` — do NOT add a second one. Mentioned here because `customBackground` is also how you do background replacement: pair it with `<Segmentation type="portrait" />` and pass the segmentation mask texture as `segmentationMask`.

---

## Mesh primitives and textures

Use R3F intrinsic `<mesh>`, `<group>`, `<planeGeometry>`, `<meshBasicMaterial>`, etc. Load image textures with drei's `useTexture`. Place asset files under `public/assets/` — reference them as `/assets/<name>` from `useTexture`.

**Always name your meshes** (`name="myLabel"`). Names enable runtime lookup AND visual-feedback editing by the editor.

**Materials accept `map`, not `alphaMap`, for image asset slots.**

```tsx
import { useTexture } from "@react-three/drei";

const tex = useTexture("/assets/badge.webp");

<mesh name="badge" position={[0, 0.5, 0]}>
  <planeGeometry args={[1, 1]} />
  <meshBasicMaterial map={tex} transparent />
</mesh>
```

---

## Sprite-sheet animation (from `src/sprite.tsx`)

A sprite sheet is one image holding a grid of animation frames. Use it for countdowns, animated stickers, mascots, and particle bursts — anything frame-by-frame. Two tiers:

### `<SpriteSheet>` — a single animated sprite (the common case)

A textured plane that cycles through the sheet's cells. Extra mesh props pass through, so it composes in screen-space (inside `<ScreenTransform>`) or world-space (inside `<TrackingAnchor>`) unchanged. Frames read left-to-right, top row first.

```tsx
import { useTexture } from "@react-three/drei";
import { SpriteSheet } from "./sprite";

const sheet = useTexture("/assets/countdown.png"); // a 1x3 sheet: "3","2","1"

// screen-center countdown that plays once
<ScreenTransform anchors={{ left: -0.25, right: 0.25, top: 0.25, bottom: -0.25 }}>
  <SpriteSheet name="countdown" texture={sheet} columns={1} rows={3} fps={1} loop={false} onComplete={snap} />
</ScreenTransform>

// or pinned to the forehead as an animated sticker (4x4 sheet, looping)
<FaceTracker>
  <TrackingAnchor target="face.forehead">
    <SpriteSheet name="sticker" texture={stickerSheet} columns={4} rows={4} fps={12} scale={[0.3, 0.3, 1]} />
  </TrackingAnchor>
</FaceTracker>
```

Props: `texture`, `columns`, `rows`, `fps` (default 12), `loop` (default true), `playing` (default true — gate playback), `frameCount` (default `columns*rows`; set lower if the sheet has blank trailing cells), `onComplete` (fires when a non-looping animation ends). Plus any mesh prop (`name`, `scale`, `position`, `renderOrder`, `opacity`).

### `useSpriteSheet(opts)` — the hook, when you need the raw frame

Returns `{ map, frame, setFrame }`. Apply `map` to your own material; read `frame` for per-frame logic; call `setFrame(i)` to jump/restart. `<SpriteSheet>` is just this hook on a plane.

### `useInstancedSpriteUV({ texture, columns, rows, count })` — sprite particles (advanced)

For many sprites in one draw call (confetti, sparkles). It gives you only the reusable **mechanic** — per-instance UV cell + alpha through a pre-patched material — and you write the spawn/physics loop yourself (particle behavior is always bespoke).

```tsx
import { useInstancedSpriteUV } from "./sprite";

const sprite = useInstancedSpriteUV({ texture: confettiSheet, columns: 4, rows: 4, count: 1500 });

useEffect(() => {
  const g = meshRef.current.geometry;
  g.setAttribute("instanceUvOffset", sprite.uvOffset);
  g.setAttribute("instanceAlpha", sprite.alpha);
}, []);

useFrame((_s, delta) => {
  // your physics: move each instance's matrix, set its cell + alpha
  sprite.setCell(i, cellIndex);          // which sheet cell this instance shows
  sprite.alpha.setX(i, fade);            // per-instance fade
  sprite.alpha.needsUpdate = true;
});

<instancedMesh ref={meshRef} args={[undefined, sprite.material, 1500]}>
  <planeGeometry args={[0.1, 0.1]} />
</instancedMesh>
```

---

## `<TextLabel>` — Canvas-rendered text panel

Import from `@vincentt-sdks/xr-sdk`. Billboarded in 3D space.

| prop           | type                    | default              | notes |
| -------------- | ----------------------- | -------------------- | ----- |
| `text`         | `string`                | **required**         | The text to render. |
| `color`        | `string`                | `#ffffff`            | Text color. |
| `fontSize`     | `number`                | `48`                 | Canvas px at the default 512px canvas — NOT world units. Chips/badges typically need 200-320. |
| `bgColor`      | `string`                | `rgba(20,40,110,0.88)` | Panel background; use `"transparent"` for text-only. |
| `borderColor`  | `string`                | —                    | Border color; omit for no border. |
| `borderRadius` | `number`                | `24`                 | Corner radius; 0 for square. |
| `aspect`       | `number`                | `2.5`                | Panel shape (width ÷ height). >1 = wide/banner, <1 = tall. |
| `scale`        | `[x,y,z] \| number`    | `1`                  | World size. Combine with `aspect` to make wide banners. |
| `position`     | `[x,y,z]`              | `[0,0,0]`            | World position. +Y up, -Y down. |
| `name`         | `string`                | —                    | Set on every element you create. |

**Gotchas:**
- `fontSize` is canvas px, not world units. Chips/badges need 200-320, not 16-48.
- `fontSize` does not change panel shape — use `aspect` (shape) and `scale` (size).
- `TextLabel` ignores the `visible` prop — wrap in `<group visible={false}>` to start hidden.

```tsx
// Full-width banner near the top
<TextLabel
  name="topBanner"
  text="Welcome"
  position={[0, 1.4, 0]}
  scale={[4, 0.8, 1]}
  aspect={6}
  fontSize={180}
/>
```

---

## `<Panel>` — 3D billboarded panel for grouping UI content

```tsx
import { Panel, TextLabel } from "@vincentt-sdks/xr-sdk";

<Panel>
  <TextLabel name="title" text="Score: 10" fontSize={240} />
</Panel>
```

---

## Common patterns

Each pattern names which primitives compose it. Use as starting points; combine and adapt freely.

### gesture-photo-booth (the canonical photo flow)

- `<GestureTracker />` to enable gesture detection
- `<ScreenSpaceUI>` overlay with a "do the peace sign" prompt and decorative frame
- `<GestureTrigger gestures={["victory"]} onTrigger={...}>` fires the capture (or use `useFrame` + `session.getModelNode` for a hold-to-trigger with debounce)
- Optional: 3-2-1 countdown sprite before `captureFrame()`
- `session.captureFrame()` returns the PNG dataURL; hand to state or a download

### face-decoration (single-scene face effect)

- `<FaceTracker>` wrapping `<TrackingAnchor target="face.forehead">` (or other face landmark) with a 3D mesh/texture
- Optional `<FaceTracker.Mesh />` for full deforming face coverage
- No interaction required — the decoration simply follows the face

### hand-effect / body-effect

- `<HandTracker>` or `<BodyTracker>` + `<TrackingAnchor target="hand.indexTip">` / `<TrackingAnchor target="body.leftShoulder">`
- 3D objects follow the landmark each frame

### segmentation-background

- `<Segmentation type="portrait" />` (registers the segmentation pipeline; mounts alongside a state/ref for the mask)
- Pass the resulting mask texture to `<VideoBackground segmentationMask={mask} customBackground={replacementColor} />` in App.tsx — or add a second VideoBackground in Scene if you need a dynamic background

### gesture-controlled (no tracker visuals)

- `<GestureTracker>` + `<GestureTrigger>` drives effects (particles, scene transitions, animations) without any visible hand/face overlay

---

## Notes

- `VideoBackground`, camera, and lighting are already mounted in `src/App.tsx`. Do NOT add a second background plane — it covers the camera.
- Place asset files in `public/assets/`; reference as `/assets/<name>` from `useTexture`.
- Tracker components self-register — no `registerXRPipeline` call needed.
- Always name your meshes — `name="..."` enables runtime lookup and visual-feedback editing.
