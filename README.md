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

## Releasing this template

`main` is active dev. New projects are NOT seeded from `main` — they seed from a
promoted version, so an in-progress `main` commit never reaches a creator's project
until it is deliberately released.

- **`main`** — where changes land (PRs). Not seeded directly.
- **`release`** — only ever fast-forwards to a `v2-template-vX.Y.Z`-tagged commit.
  The platform's gitea mirror uses this as its default branch, and gitea
  `/generate` copies the default branch — so `release` HEAD is what new projects
  get.

**To promote a release:**

```
git tag v2-template-vX.Y.Z        # on the commit to release (on main)
git checkout release
git merge --ff-only v2-template-vX.Y.Z
git push origin main release --tags
```

`release` must ALWAYS be a fast-forward of a tagged commit — never a merge commit,
never a non-tagged HEAD. After pushing, the platform side binds dependencies to the
same tag (set `V2_TEMPLATE_VERSION`, restart the worker, reinstall the shared
template node_modules); see the backend deploy runbook's "Promoting a template
release" for the full procedure.
