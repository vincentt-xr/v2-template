# v2-template

The Vincentt v2 starter app. Every v2 project is forked from this template into
its own repo and edited turn-by-turn by an AI agent. It is a real React + R3F +
[Vincentt XR SDK](../xr-sdk) WebXR app, bundled by esbuild (the same toolchain
powers the in-editor preview and the published build).

## Shape

```
src/
  main.tsx          mount — never edited
  App.tsx           composition root: XRProvider + Router + Runtime(config)
  _core/            framework glue (Runtime, SceneSwitch, useXRInit, useAssets)
                    — never imports app; agent never edits
  app/              the agent's surface:
    scenes/index.ts the scenes map + initialScene (the wiring)
    scenes/*.tsx    each scene = a React component taking SceneProps
    config/         assets + xrModels (plain typed data)
```

Configuration is explicit static data, not import-side-effect registration, so
the app builds correctly under any bundler (not just Vite dev). See `AGENTS.md`
and `GROUNDING.md` for how to author scenes.

## Develop

```
npm install
npm run dev          # esbuild dev server on :5173
npm run typecheck    # tsc --noEmit
npm run build        # production bundle to dist/
npm run check:boundary  # assert _core never imports @app
```
