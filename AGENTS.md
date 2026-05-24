# Agent instructions for this Vincentt XR project

You are editing a real WebXR/AR app. **Only edit files under `src/app/**`.** Never touch `src/_core/**`, `src/App.tsx`, `main.tsx`, build config, or `package.json` — those are the framework.

## Conversation continuity

This conversation is **persistent**. The full thread (the creator's earlier messages and your earlier replies) is retained across sessions and reloads, and is available to you in context. When the creator refers to something said earlier, use the conversation above — do NOT reply that you "have no memory of previous conversations" or that "each session starts fresh". You do have the prior turns.

## Before writing any scene

Read `GROUNDING.md` (repo root). It is the authoritative list of available SDK components, their props, defaults, and gotchas. Use the components and prop values it documents. Do not invent props.

## How the app is wired

The app is **explicit static data** — there is no registration, no lifecycle DSL, no `context` object.

```
src/app/
  scenes/
    index.ts        the scenes map + `initialScene` — THE wiring
    Welcome.tsx     a scene = a React component taking SceneProps
    Second.tsx
  config/
    assets.ts       { key: importedUrl } — textures loaded at startup
    xrModels.ts     [{ model: XRModel.X }] — XR trackers the app needs
```

## How scenes work

A scene is a plain React component that default-exports a `SceneProps` taker:

```tsx
import type { SceneProps } from "@core/SceneProps";

export default function Welcome({ navigate, assets }: SceneProps) {
  return <TextLabel text="Hello" position={[0, 0.5, 0]} fontSize={220} />;
}
```

- **`navigate(key)`** switches to another scene. The key must be one in `scenes/index.ts` (it's type-checked).
- **`assets`** are the loaded textures from `config/assets.ts` (e.g. `assets.preview`).
- **Per-scene setup**: a `useEffect` inside the component. **Per-frame logic**: R3F `useFrame`. There is NO `onInit`/`onUpdate`/`onDestroy` and NO `context` argument.
- Render SDK components (`<TextLabel>`, `<GestureTracker>`, …) and R3F primitives (`<mesh>`, `<group>`). These are the APIs you already know.

Scenes render **over the live camera feed** (AR). The camera background is provided by the framework — do NOT add your own full-screen background plane; it will cover the camera.

## To add a scene

1. Create `src/app/scenes/<Name>.tsx` — default-export a component taking `SceneProps`.
2. Add it to the `scenes` map in `src/app/scenes/index.ts` (one line).
3. To show it first, set `initialScene` to its key.

A wrong key or bad prop is a **TypeScript/build error** the build will report — not a silently blank screen. Keep returned JSX plain (literal props, nested geometry/material, simple handlers) so the visual editor can round-trip it.

## Golden AR flow

Default to: Home (instruction + gesture to continue) → Main (the experience) → Result/Preview. Adapt to the user's request; this is a guide, not a rule.
