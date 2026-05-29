# Agent instructions for this Vincentt XR project

You are editing a real WebXR/AR app.

## What you edit

- **`src/Scene.tsx`** — the scene. This is your primary surface. Add SDK components, R3F primitives, animation, state machines here.
- **Any new file you create under `src/`** — utility hooks, sub-components, asset imports. Free to organize.
- **`package.json` dependencies** — add a dep by editing the `dependencies` field. The platform installs it automatically after your commit. Do NOT run `npm`/`pnpm install` (no terminal).

## What you don't edit

- **`src/App.tsx`** — the runtime shell (XR session start, media-source binding, camera, lighting, scene mount). The platform protects this; edits are rejected at commit time.
- **`src/main.tsx`** — the mount.
- **`src/PreviewAnchors.tsx`** — editor-preview integration.
- **`src/capture.ts`** — capture + share primitives (`usePhotoCapture`, `useVideoCapture`, `saveToDevice`, `shareMedia`). Import from it; don't modify it. See GROUNDING.md.
- **`src/overlay.tsx`** — HTML overlay primitives (`<Overlay>`, `<QRCode>`) for pixel-sharp DOM UI over the canvas. Import from it; don't modify it. See GROUNDING.md.
- **`src/sprite.tsx`** — sprite-sheet animation (`useSpriteSheet`, `<SpriteSheet>`, `useInstancedSpriteUV`). Import from it; don't modify it. See GROUNDING.md.
- **`src/gesture.ts`** — gesture helpers (`useGestureHold`). Import from it; don't modify it. See GROUNDING.md.
- **Build config** (`esbuild.config.mjs`, `tsconfig.json`, `tsconfig.node.json`) — also protected.

## Before writing any scene

Read `GROUNDING.md` (repo root). It's the API reference for SDK components, hooks, and the common patterns (gesture photo booth, face decoration, hand effects, etc.). Use the components and props it documents. Do not invent props.

## Conversation continuity

This conversation is persistent. The full thread is retained across sessions and is in your context. If the creator refers to something said earlier, use the prior turns — do NOT reply that you "have no memory of previous conversations."

## Specs (`specs/`)

This project may carry feature specs under `specs/<slug>/spec.md` — short markdown documents describing what a feature does from the creator's perspective. They are the durable record of "what we decided to build."

- **Before modifying a feature, consult `specs/INDEX.md`** (auto-generated; lists every spec with its slug, status, and title). If the feature you're about to change has a spec, read `specs/<slug>/spec.md` first and implement to it.
- When the creator applies a spec, you'll receive a turn that says `Implement specs/<slug>/spec.md`. Read that file and make the changes it describes; ask before doing anything it doesn't cover.
- You author specs only during a **spec turn** (the platform tells you when you're in one). In a normal build turn, `specs/` is out of scope — edits there are rejected at commit; do your work in `src/`.
