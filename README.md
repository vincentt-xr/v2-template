# v2-template

The Vincentt starter app: a real React + R3F + Vincentt XR SDK (`@vincentt-xr/sdk`)
WebXR app. The dev server bundles with esbuild; the production build is the Vincentt CLI's
`vincentt build`.

## Shape

```
src/
  main.tsx            mount — never edited
  App.tsx             protected shell: XRProvider + FrameContainer +
                      XRScene + media-source binding, camera, lighting,
                      VideoBackground — never edited
  frame.config.ts     the frame: "phone" (9:16, default) or "full" (the viewport)
  Scene.tsx           the agent's surface: add SDK components and R3F
                      primitives here
```

See `AGENTS.md` and `GROUNDING.md` for the API reference and how to author scenes.

## Develop

```
pnpm install
vincentt login    # once per machine; `vincentt create` registers a folder from `vincentt init`
pnpm preview      # on-device preview over a secure tunnel: the address the developer gets
pnpm dev          # esbuild dev server on localhost:5173 for your own checks (output in .dev/)
pnpm typecheck
pnpm build        # `vincentt build`: production bundle to dist/ (needs the CLI installed)
vincentt publish  # upload dist/ and go live at <slug>.vincentt.app
```

The developer's path is the platform: sign in, preview, publish. `pnpm dev` is a local
check; its address is never the one a developer or a phone is given.

## Release

A template release reaches **staging first**, then prod on release day. Merging to `main` ships
nothing, and a tag push ships nothing to prod.

```
git tag 1.1.0 <sha>      # bare semver, no `v` prefix
git push origin 1.1.0    # the Release workflow verifies the tag, then writes the STAGING row
```

A tag push runs the Release workflow (`.github/workflows/release.yml`): it installs from the
frozen lockfile, builds, typechecks and runs the checks against **the tagged tree**, then writes
the release row to staging only. `latest` does not move. `vincentt create` against staging clones
the version the api's row names, so staging scaffolds already use the tag.

On release day the owner promotes it: dispatch the same workflow from the tag itself ("Use
workflow from: 1.1.0", input `ref` = `1.1.0`). It requires staging's row to name the tag and the
SDK and harness the tag locks to be npm `latest` (move those first), then force-updates `latest`
to the tag and writes the prod row. Nothing is rebuilt; prod `vincentt init` falls back to
`latest` only when the api cannot be read. A tag that fails any check never reaches either row.

The job runs in the `release` environment, which accepts bare-semver tags only; a dispatch from
`main` is refused. The prod token is used only on the promote path.

To correct a migration note without moving `latest`, fix the entry in `MIGRATION.md` on
`main`, then dispatch the Release row workflow (`.github/workflows/release-row.yml`) from the
newest tag with that tag as its input and `target` staging or prod. It re-sends only the
platform release row to that one target: no build, no tag move. A prod re-send is refused unless
`latest` is at that tag's commit and staging already names it. It exists only on tags cut after it was added.

**Never move `latest` by hand.** It is force-updated by the promote and nowhere else; moving
it manually decouples the pointer from the version it claims to be.

Creators can pin a specific version — `vincentt init --template 1.0.0` — which is the escape
hatch when a release turns out to be bad. That is why the version tags are immutable and only
`latest` moves.

### `MIGRATION.md` and the platform release row

Root `MIGRATION.md` carries one entry per released tag, newest first, authored in the same
PR as the change: `required: true|false`, a one-line summary, and optional notes bullets.
`required: false` means no consumer action is needed, never that the entry was skipped. The
Release workflow refuses any tag with no valid entry, then posts that entry as this release's row
(staging on the tag push; prod after the promote moves `latest`) to the platform (`POST
/platform/releases`, component `template`), via `scripts/release-row.mjs`. Both steps read
`MIGRATION.md` from `main`, not from the tagged tree: the note is reviewed via PR into `main`
and is append-only per version, so `main`'s copy is the reviewed source for any tag, including
one cut before this file existed. That row is what `vincentt outdated` reads back to tell a
creator's agent what changed and what to do about it.
