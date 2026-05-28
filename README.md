# v2-template

The Vincentt v2 starter app. Every v2 project is forked from this template into
its own repo and edited turn-by-turn by an AI agent. It is a real React + R3F +
[Vincentt XR SDK](../xr-sdk) WebXR app, bundled by esbuild (the same toolchain
powers the in-editor preview and the published build).

## Shape

```
src/
  main.tsx            mount — never edited
  App.tsx             protected shell: XRProvider + AspectRatioContainer +
                      XRScene + media-source binding, camera, lighting,
                      VideoBackground, PreviewAnchors — never edited
  Scene.tsx           the agent's surface: add SDK components and R3F
                      primitives here
  PreviewAnchors.tsx  editor-preview integration — never edited
```

See `AGENTS.md` and `GROUNDING.md` for the API reference and how to author scenes.

## Develop

```
npm install
npm run dev          # esbuild dev server on :5173
npm run typecheck    # tsc --noEmit
npm run build        # production bundle to dist/
```
