# Agent instructions for this Vincentt XR project

You are building a real WebXR/AR app locally with the Vincentt XR SDK
(`@vincentt-xr/sdk`) — a React + react-three-fiber app bundled by esbuild. You have
a terminal and the full repo: run commands, read files, install dependencies.

## The dev loop

- **`pnpm install`** — install dependencies.
- **`pnpm dev`** — esbuild dev server on `http://localhost:5173`.
- **`pnpm preview`** — on-device preview. Builds and serves the app behind a secure
  Cloudflare tunnel so you get one `https` URL to open on a phone. AR needs a secure
  context for camera access, so this is how you test tracking and gestures on a real
  device. Needs `cloudflared` (the harness provisions it automatically if it isn't on
  `PATH`).
- **`pnpm typecheck`** — `tsc --noEmit`.
- **`pnpm build`** — production bundle to `dist/`.

To publish, use the harness MCP `project_publish` verb — it uploads the built `dist/`
and the app goes live at `<slug>.vincentt.app`. Nothing installs or builds server-side;
publishing moves the bytes you built locally.

## What you edit

- **`src/Scene.tsx`** — the scene. This is your primary surface. Add SDK components,
  R3F primitives, animation, and state here.
- **Any new file you create under `src/`** — utility hooks, sub-components, asset
  imports. Organize freely.
- **`package.json` dependencies** — add a dependency, then `pnpm install` it yourself.

## What to leave alone

These are the app's shell and helper library. Import from them; don't usually modify
them (this is a convention, not an enforced guard — change one only if a task genuinely
requires it, and know why).

- **`src/App.tsx`** — the runtime shell: XR session start, media-source binding,
  camera, lighting, scene mount.
- **`src/main.tsx`** — the mount.
- **`src/capture.ts`** — capture + share primitives (`usePhotoCapture`,
  `useVideoCapture`, `saveToDevice`, `shareMedia`).
- **`src/overlay.tsx`** — HTML overlay primitives (`<Overlay>`, `<QRCode>`) for
  pixel-sharp DOM UI over the canvas.
- **`src/sprite.tsx`** — sprite-sheet animation (`useSpriteSheet`, `<SpriteSheet>`,
  `useInstancedSpriteUV`).
- **`src/gesture.ts`** — gesture helpers (`useGestureHold`).
- **`src/PreviewAnchors.tsx`** and the build config (`esbuild.config.mjs`,
  `tsconfig*.json`).

The helper APIs (`capture`, `overlay`, `sprite`, `gesture`) are documented in
`GROUNDING.md` — import and use them, don't re-implement them.

## The SDK API lives in GROUNDING.md

`GROUNDING.md` (repo root) is the authoritative reference for every SDK component,
hook, and prop you may use (`<FaceTracker>`, `<HandTracker>`, `<TrackingAnchor>`,
screen-space layout, `<TextLabel>`, `<Panel>`, the capture/overlay/sprite helpers, and
the common patterns). Read it before writing a scene. Use the components and props it
documents; don't invent props.

Imports:

- Core components and hooks come from **`@vincentt-xr/sdk`**.
- The low-level XR context hooks (`useXRContext`, `useXRReady`, `useXRError`) come from
  **`@vincentt-xr/sdk/low-level`**.

`GROUNDING.md` shows the exact import for each API. You *can* read `node_modules`, but
prefer `GROUNDING.md` — the published `.d.ts` types can lag or omit props, and the
bundle is minified. If something you need isn't in `GROUNDING.md` and isn't clearly in
the types, ask rather than guessing a prop into existence.

## Assets

Reference media by path or URL — there is no upload step.

- **Local files under `public/`** — reference by absolute path (e.g.
  `<img src="/images/logo.svg">`, `useTexture("/textures/wall.jpg")`). The dev server
  serves `public/` at the root and the build copies it into `dist/`.
- **Hosted assets** — reference any absolute URL directly (`useTexture(url)`,
  `<img src={url}>`, `new Audio(url)`). For textures, prefer a downscaled WebP when one
  is available, to save bandwidth.

## Communicating

You are working with a developer, not a non-technical user. Be concise and specific —
component names, props, and file paths are welcome, not something to hide. When you
finish a change, say what you changed and how to check it: for anything camera- or
AR-related, that usually means `pnpm preview` on a phone.
