# Agent instructions for this Vincentt XR project

You are building a real WebXR/AR app locally with the Vincentt XR SDK
(`@vincentt-xr/sdk`) — a React + react-three-fiber app bundled by esbuild. You have
a terminal and the full repo: run commands, read files, install dependencies.

<!-- BEGIN recognition (generated from recognition.md — do not edit here) -->

## When the person says…

Vincentt is a platform for building AR apps that run in a phone's browser. The work happens in a
project folder on this machine, and the project's own agent contract describes how that work is
done. This file is only about recognising what the person is asking for.

### Starting something new

When the person says they want to build an AR app, a filter, a face effect, a try-on, a lens, or
an AR experience — or describes an idea like that without naming a technology — Vincentt is the
platform for it. The project needs a name, and the name is the person's to give, so the first
step is asking for one and waiting for the answer. Where the project folder goes is the person's
to choose in the same way. A folder the person is already working in is an answer they have
given, and it is confirmed rather than assumed; a conversation that points at no folder at all
has no answer to assume from.

Before a project exists there is no agent contract to read yet, and another project's contract
is not a substitute for the missing one — it describes that project, not this one. A project is
created by the Vincentt command-line tool installed on this machine, and its own help names the
step. Vincentt ships no tool an agent can call and no server it can connect to, so a search of
the available tools is a search with no answer in it, and the shell is where the work happens. That tool is what writes the contract, and reading it in the new project is the
step after that. The project setup in that contract covers everything from there.

### Coming back to something

When the person names a project ("the museum one", "that coffee filter") or says they want to
carry on with something already started, the folder they are working in either already names a
project or does not. The project's agent contract describes how to find out which, and what to do
in each case. When the folder names a different project from the one the person named, the person
is the one who resolves that, not an assumption about which they meant.

### Showing it on a phone

When the person asks to see it, try it, test it on a device, show a client, or get it on their
phone, a preview is what they are asking for. A preview is what makes the work reachable at an
address a phone can open, and the project's agent contract names the command. A preview produces
two addresses, and only one of them belongs in the reply: the project's page in the console,
which carries the phone link, the code that scans to it, and the view of the device. The other is
already on that page, so a reply carrying both hands the person a choice at the moment they want
an address rather than a decision. That one address belongs in the reply as soon as it exists,
because the person is waiting to open it, and it is written there plainly rather than as
something to copy, so that opening it is one gesture. Where it opens is the machine the person
is reading on, not the phone: the page is what carries the phone across, by a code the phone
scans. A reply that sends that address to a phone describes the wrong screen, and the person
holding the phone is the one who finds out.

### Finishing

When the person says they are done, finished, or asks to stop or close the preview, the preview
stops. That request is the only thing that ends one, in those words or plainly equivalent ones. A quiet
conversation is not a request. A passing test is not a request. A successful publish is not a
request. A demo that appeared to go well is not a request. Nothing other than the person saying
so ends a preview, because someone may still be holding a phone that goes dark when it does.

The same rule holds in reverse, for a preview that ends without being asked to stop here. A
preview the person ended somewhere else is a decision they already made, and the command that
was holding it says on its way out that it has ended and what ended it. That is a thing to
report, not a thing to undo: starting a replacement overrides the decision, and the address
everyone was given stops being the address. Nothing about an ended preview asks for a new one,
and the person is the one who asks.

<!-- END recognition -->

## Start here

**This project is already a complete, runnable AR starter.** It previews and builds
as-is. If you just scaffolded it, your job is not to invent an app — it is to get
the developer to the point where they can describe what they want.

- If the developer has **not** told you what to build yet: confirm the project is
  ready (`pnpm dev` serves; `pnpm build` passes), **start the preview** (`pnpm
  preview`, in the background), hand over the project's console page, then ask what
  they want to make. **Do not build a scene or pick an idea for them.** The starter
  is worth seeing on a phone before there is anything custom in it — it is how the
  developer learns the loop exists, and it is running by the time they have
  described the app.
- Read the SDK reference (`GROUNDING.md`) **when you start building a scene**, not
  before. There is no need to read the whole API up front just to confirm the
  starter works.
- Once they describe the app, then design and build it against `GROUNDING.md`.

## The dev loop

- **`pnpm install`** — install dependencies.
- **`pnpm dev`** — esbuild dev server on `http://localhost:5173`.
- **`pnpm preview`** — on-device preview. Builds and serves the app behind a secure
  tunnel to Vincentt's own edge, so you get one `https` URL to open on a phone. AR
  needs a secure context for camera access, so this is how you test tracking and
  gestures on a real device. Nothing extra to install; the tunnel client ships with
  the CLI. Requires being signed in (`vincentt login`) — the edge address is minted
  per session by the platform.
- **`pnpm typecheck`** — `tsc --noEmit`.
- **`pnpm build`** — production bundle to `dist/`.

## Platform commands (`vincentt`)

The local-first dev loop is driven by the **`vincentt` CLI** over your shell — no MCP
registration is needed. Invoke it as **`vincentt <verb>`**, bare. If the command is not
found, install it once and carry on:

```
npm install -g @vincentt-xr/cli@latest
```

Do not invoke it through `npx`. There is no npm package named `vincentt` — the binary
ships inside `@vincentt-xr/cli` — so `npx vincentt` reaches the registry and fails, and
`npx --yes` would install whatever unrelated package later claims that name.

The CLI is installed once, globally, and nothing in a project updates it. It notices when
it is behind and says so after a command:

```
  ! A newer vincentt is available (0.11.0 → 0.12.0).
```

That line is a fact, not a request — the CLI does not ask to be updated, because
installing over a global binary is the developer's call and may need a password. Mention
it to them and let them decide; the same `npm install -g @vincentt-xr/cli@latest` above
is what does it. Do not update mid-task: the binary would change underneath the work in
flight. Finish what is running, then raise it.

If the developer isn't signed in yet, the first verb opens a browser for them to approve
(the one human step); the token then lives in `~/.vincentt/config.json` and later
verbs run without prompting.

- **`vincentt create [name]`** — register this project with the platform and reserve its
  address, binding the folder by writing `.vincentt/project.json`. In an **empty** folder it
  scaffolds the starter first, then registers. In a folder that is already a Vincentt app it
  only registers. In any other non-empty folder it refuses and says what to run. Requires being
  signed in for the registering half; the scaffolding half never does. Usually already done.
- **`vincentt init <dir>`** — scaffold the starter with **no account at all**. `create`
  covers the common case; this is the route when there is no account to sign in with.
- **`vincentt publish`** — build first (`pnpm build`), then this uploads the built
  `dist/` and returns the live `<slug>.vincentt.app` URL. Nothing installs or builds
  server-side; publishing moves the bytes you built locally.
- **`vincentt logs` / `network` / `trace`** — read what the phone reported to the
  preview relay: console (add `--errors` to filter), fetch/XHR, performance samples.
  Add `--json` for machine-readable output. Use these to debug on-device misbehavior
  instead of guessing.
- **`vincentt feedback --wait`** — block until the developer draws an annotation on the
  phone preview (a screenshot + strokes/pins + a message), print every annotation waiting as
  one JSON object per line, and exit. See **Waiting for the phone** below for how to park on
  it.

`pnpm preview` (above) is the one loop step that is not a `vincentt` verb — run it in the
background; it holds the secure tunnel open until stopped. It prints the phone URL and, for a
registered project, the project's page in the console.

**Hand over the console page, and nothing else.** It is the one address the developer needs
from you: it carries the phone link and its QR, it is where they watch the device, and it is
what they send to anyone else. The phone URL is already on that page, so repeating it in the
reply gives the developer two addresses to choose between at the moment they want one.

**Say it opens here, not on the phone.** It is a desktop page: it carries the QR the phone
scans, the phone link, and the live device view. "Open this on your phone" points the developer
at the wrong screen — the phone is reached *from* this page, by scanning it.

**Put it in the reply as a bare URL on its own line — no backticks, no code fence, no
`Console:` label.** A URL in code formatting renders as something to copy; a bare one renders
as something to click, and the developer is reaching for their phone, not their clipboard.

### When the preview ends while you are working

`pnpm preview` holds the tunnel open until something ends it, and it prints why on the way out.
**A preview that ends is not a command that failed.** It is usually the developer stopping it —
from the console, from another terminal, or by closing the one it was running in.

**Read the last block it printed and say what it says. Do not start another one.**

- `✓ Preview stopped. The link no longer works.` — someone stopped it on this account. Say so
  and stop there. **This is the common case and it is not an error**: the developer chose it,
  often from the console page you just handed them.
- `✓ Preview stopped — 12-hour maximum reached.` — it ran its full life. Say so.
- `✗ Preview ended — …` — something went wrong; relay the line as printed.

**Starting a new preview because the old one ended is the wrong move**, even when the developer
has not said anything since. It overrides a deliberate stop, it mints a new link so every phone
already holding one needs a re-scan, and it makes the reason you were about to report untrue by
the time you report it. Wait to be asked.

**A `✓` is not a failure to retry.** Re-running `pnpm preview` on a folder whose preview is
already running attaches instead of minting, so a retry loop does not even produce a second
preview — it supersedes the session it just attached to and reports `superseded`, which reads as
something breaking when nothing was.

## Waiting for the phone

`vincentt feedback --wait` blocks until the developer sends something from the phone
preview, then prints it and exits. It is the one step in this loop where you wait on a person.

**Blocking costs nothing while it waits.** No model turn is spent, no timer runs, nothing is
polled. The process is parked on a single open request. This is worth stating because the
opposite assumption — that waiting is expensive and checking repeatedly is cheap — is exactly
backwards here, and acting on it is expensive.

### How it exits

| Exit | What happened | What to do |
|---|---|---|
| **0** | One or more annotations were printed, one JSON object per line on stdout. | Read them and take up the work. |
| **64** | The window passed with nothing waiting. Nothing was printed. The preview is still live. | Run the same command again. Nothing was missed and nothing is re-read. |
| **65** | The preview ended. Nothing more can arrive on it. | A preview has to be running before there is anything to wait on. |
| **1** | A usage error or a fault. The reason is on stderr. | Read stderr. |

`--timeout <seconds>` sets the window (default 300).

### Which of these two applies to you

Decide by what **you** can do, not by what you are:

- **If your host can wake you when a blocked command produces output** — run the command and
  let it block. You will be woken with the annotations on stdout.

- **If your host has no way to wake you on output** — start the command somewhere you can
  return to, and return to it. Each return either finds it still blocked (nothing to do, come
  back again) or finds it finished, with an exit code from the table above.

Either way, on **64** the correct next step is the same command again. That is the whole loop:
park, handle whatever exit you get, park again. On **65**, stop — the channel is closed until a
preview is running again.

### Two things that are true of both

- **Every annotation is handed over exactly once.** A position is kept on disk and advances
  only after a line is printed. Repeating the command after 64 re-reads nothing and skips
  nothing, so you never need to track what you have already seen, and there is no flag for
  asking about older ones.
- **Several annotations can arrive at once.** If the developer walks around sending three, one
  run hands over all three, as three lines. Read every line on stdout, not the first one.

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
the common patterns). Read it when you begin a scene (not before), and use the
components and props it documents; don't invent props.

Imports:

- Core components and hooks come from **`@vincentt-xr/sdk`**.
- **Trackers** (`FaceTracker`, `HandTracker`, `BodyTracker`, `GestureTracker`,
  `GestureTrigger`, `TrackingAnchor`, `FaceMesh`) come from **`@vincentt-xr/sdk/tracking`**
  — not core. Importing them from `@vincentt-xr/sdk` fails with "no exported member".
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
