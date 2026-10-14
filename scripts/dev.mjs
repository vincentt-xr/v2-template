/**
 * Local dev server via esbuild context + serve. Watches src/, rebuilds, and
 * serves `.dev/`. (In the editor, the in-browser esbuild-wasm preview is used
 * instead; this is for standalone local development of the template.)
 *
 * `.dev/` IS NOT `dist/`. `pnpm build` wipes and rewrites `dist/`, and this
 * server used to serve that same folder — so a build run while dev was up made
 * the dev page silently load the production bundle (dev-only input and overlays
 * gone, which reads as a camera bug), and `vincentt publish` could upload a dev
 * bundle a stray `pnpm dev` had left in `dist/`. A separate, gitignored output
 * folder removes both: the dev page only ever serves dev output, `dist/` only
 * ever holds a production build, and the tree-shake suite that reads `dist/`
 * never meets a dev build (vincentt-xr/v2-template#114).
 *
 * Unlike the production build, dev output is unhashed so `.dev/index.html` can
 * reference stable filenames (`main.js`, `main.css`). Without this, the HTML
 * on disk only matches the bundle from the last build; subsequent dev rebuilds
 * emit fresh hashed files and the HTML keeps pointing at stale ones — the
 * browser loads pre-edit code with no obvious signal.
 *
 * THE ADDRESS. esbuild's server binds one address family: its default is IPv4
 * (`0.0.0.0`), and asking for `::` makes it refuse IPv4 requests outright. A
 * browser that resolves `localhost` to `::1` — the embedded preview browser
 * does — then gets connection refused at the address AGENTS.md names. So
 * esbuild listens privately on an ephemeral `127.0.0.1` port, and this script
 * fronts it with two loopback listeners, `127.0.0.1:5173` and `[::1]:5173`,
 * forwarding every request (the live-reload event stream included). `localhost`
 * works whichever family the client picks (vincentt-xr/v2-template#115).
 *
 * Loopback only by default. Set `HOST=0.0.0.0` (or a LAN address) to listen on
 * one explicit address instead, e.g. to open the dev page from a phone on the
 * same network. `pnpm preview` does not need that: the CLI tunnels to this
 * machine's loopback.
 */
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";
import { buildOptions } from "../esbuild.config.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const devDir = path.join(root, ".dev");

const opts = buildOptions({ mode: "development", root });

await fs.rm(devDir, { recursive: true, force: true });
await fs.mkdir(devDir, { recursive: true });
// Mirror /public into the served folder so root-relative refs (favicon,
// og:image, fonts) resolve. esbuild's `serve` only exposes its build output,
// not the source tree.
const publicDir = path.join(root, "public");
try {
  await fs.cp(publicDir, devDir, { recursive: true });
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}

let html = await fs.readFile(path.join(root, "index.html"), "utf8");
html = html.replace(
  /<link[^>]+href="\/src\/index\.css"[^>]*>/,
  `<link rel="stylesheet" href="/assets/main.css" />`,
);
html = html.replace(
  /<script[^>]+src="\/src\/main\.tsx"[^>]*><\/script>/,
  `<script type="module" src="/assets/main.js"></script>`,
);
await fs.writeFile(path.join(devDir, "index.html"), html);

const ctx = await esbuild.context({
  ...opts,
  outdir: path.join(devDir, "assets"),
  splitting: false,
  metafile: false,
  entryNames: "[name]",
  chunkNames: "chunks/[name]",
  assetNames: "[name]",
});
await ctx.watch();

// esbuild's own listener: IPv4 loopback, ephemeral port, never printed. Every
// public address below forwards to it.
const upstream = await ctx.serve({ servedir: devDir, host: "127.0.0.1", port: 0 });
const upstreamHost = upstream.hosts?.[0] ?? upstream.host ?? "127.0.0.1";
const upstreamPort = upstream.port;

const port = Number(process.env.PORT) || 5173;

/**
 * A request forwarder. Streams both directions, so esbuild's `/esbuild`
 * live-reload event stream stays open. The Host header is rewritten to the
 * upstream's own address: esbuild refuses a request whose Host it does not
 * recognise, and a browser sends the public one.
 */
function forwarder() {
  return http.createServer((req, res) => {
    const headers = { ...req.headers, host: `${upstreamHost}:${upstreamPort}` };
    const up = http.request(
      { host: upstreamHost, port: upstreamPort, method: req.method, path: req.url, headers },
      (upRes) => {
        res.writeHead(upRes.statusCode ?? 502, upRes.headers);
        upRes.pipe(res);
      },
    );
    up.on("error", (err) => {
      if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
      res.end(`dev server upstream error: ${err.message}`);
    });
    req.pipe(up);
  });
}

/** Resolves to the bound address, or to `undefined` when the family is unavailable. */
function listen(address) {
  return new Promise((resolve, reject) => {
    const server = forwarder();
    server.once("error", (err) => {
      // No IPv6 on this machine (or the family is disabled): not an error for
      // the address that is there. Anything else — the port in use, most
      // likely — is.
      if (err.code === "EADDRNOTAVAIL" || err.code === "EAFNOSUPPORT") resolve(undefined);
      else reject(err);
    });
    server.listen(port, address, () => resolve(address));
  });
}

const explicitHost = process.env.HOST;
const addresses = explicitHost ? [explicitHost] : ["127.0.0.1", "::1"];
const bound = (await Promise.all(addresses.map(listen))).filter(Boolean);
if (bound.length === 0) {
  console.error(`dev server: could not bind ${addresses.join(" or ")} on port ${port}`);
  process.exit(1);
}

const shown = explicitHost
  ? `http://${explicitHost.includes(":") ? `[${explicitHost}]` : explicitHost}:${port}`
  : `http://localhost:${port}`;
// esbuild prints its own `Local: http://127.0.0.1:<ephemeral>/` line above
// this one; that is the private upstream, not the address to open.
console.log(`dev server: ${shown}`);
if (!explicitHost) {
  const families = bound.map((a) => (a === "::1" ? "[::1]" : a)).join(" and ");
  console.log(`  listening on ${families}, port ${port}; output in .dev/`);
}
if (process.env.SDK_LINK) {
  const linked =
    process.env.SDK_LINK === "1" ? "../xr-sdk" : process.env.SDK_LINK;
  console.log(`SDK linked → ${linked} (run \`pnpm build:watch\` there)`);
}
