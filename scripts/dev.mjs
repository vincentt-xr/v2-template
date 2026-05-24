/**
 * Local dev server via esbuild context + serve. Serves the app with live
 * rebuild. (In the editor, the in-browser esbuild-wasm preview is used instead;
 * this is for standalone local development of the template.)
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";
import { buildOptions } from "../esbuild.config.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const opts = buildOptions({ mode: "development", root });

const ctx = await esbuild.context({
  ...opts,
  splitting: false,
  metafile: false,
});
await ctx.watch();
const { host, port } = await ctx.serve({
  servedir: path.join(root, "dist"),
  port: 5173,
});
console.log(`dev server: http://${host}:${port}`);
