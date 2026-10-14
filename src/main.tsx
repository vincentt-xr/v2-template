import { HarnessProvider } from "@vincentt-xr/harness";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

// HarnessProvider is what makes `vincentt logs | network | trace` and
// `vincentt feedback` return anything at all: it patches console.*, wraps
// fetch/XHR, samples performance, and mounts the "Send feedback" button. The
// CLI verbs connect to the relay either way, so without this they report "no
// events yet" forever and the reverse channel has nothing to send.
//
// It belongs here rather than in each app because every scaffolded app is a
// copy of this template, and a diagnostics limb that each author has to
// remember to wire is one that is usually not wired.
//
// Safe in production by construction: `enabled` defaults to import.meta.env.DEV
// inside the harness package, which reads it at runtime from the object
// esbuild.config.mjs defines (`DEV: false` in a production build), and the
// instrumentation and overlay are both DYNAMIC imports inside the effect — so a
// production build emits them as chunks nothing ever loads. They are emitted,
// not dropped: the guard is a runtime read in a prebuilt package, not a literal
// esbuild can fold. Do not pass `enabled` explicitly to force it on in a
// published bundle.
//
// In THIS repo's own source, `if (import.meta.env.DEV)` IS folded — the config
// defines each key as a literal (#112) — so a dev-only branch written here is
// dropped from the production bundle outright.
//
// The package is a runtime DEPENDENCY, not a devDependency, even though nothing
// it provides survives into a production run: this file is bundled application
// source, so an install without dev packages must still resolve the import.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <HarnessProvider>
    <App />
  </HarnessProvider>,
);
