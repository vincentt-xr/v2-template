/**
 * Live preview for on-device testing — a thin wrapper over `vincentt preview`.
 *
 * The CLI owns the whole orchestration: it resolves this folder's project
 * binding and the machine config, mints the session, then stands up the app dev
 * serve, the diagnostics relay, a front proxy unifying them on one origin, and
 * the edge tunnel client — so the phone gets ONE https URL that serves both the
 * app (secure context → live camera) and the diagnostics socket.
 *
 * This script deliberately does NOT call the CLI's startPreview() directly.
 * That entry point takes an already-resolved config and projectId, so calling it
 * from here meant re-implementing the CLI's binding and config resolution in the
 * template — where it silently drifted and broke every scaffolded project's
 * `npm run preview`. Spawning the command is what keeps the two paths identical.
 *
 * The CLI runs the app with `npm run dev`, which is this template's dev script.
 *
 * Usage: `npm run preview` (tunnel, any network). The tunnel terminates on
 * Vincentt's own edge, whose address is minted per session by the API, so this
 * needs a signed-in CLI (`vincentt login`). Nothing extra to install.
 */
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const args = ["preview"];
if (process.env.PORT) args.push("--port", process.env.PORT);

const child = spawn("vincentt", args, { cwd: root, stdio: "inherit" });

child.on("error", (err) => {
  const missing = err.code === "ENOENT";
  console.error(
    missing
      ? "\n  ✗ The vincentt command was not found.\n\n" +
          "    npm i -g @vincentt-xr/cli\n" +
          "    vincentt login\n"
      : `\n  ✗ ${err.message}\n`,
  );
  process.exit(1);
});

// Ctrl-C reaches the child directly (same process group), and it runs its own
// teardown — ending the preview session and taking the address offline. Exiting
// only once it has is what keeps a stop from being reported before it happened.
child.on("exit", (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0));
});
