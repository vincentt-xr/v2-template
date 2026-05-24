/**
 * Shared esbuild config for this project. Travels with the repo so the
 * server-side publish build and the in-browser esbuild-wasm preview use the
 * exact same options (preview == publish). Replaces the old Vite setup.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import stylePlugin from "esbuild-style-plugin";

const require = createRequire(import.meta.url);
const repoRoot = path.dirname(fileURLToPath(import.meta.url));

// Packages that MUST resolve to a single instance. The XR SDK is symlinked
// (file:../xr-sdk) and carries its own node_modules, so esbuild would otherwise
// resolve the SDK's React/three/fiber to a second copy — two React instances
// give "Cannot read properties of null (reading 'useMemo')", and two fiber
// instances break the <Canvas> R3F context ("Hooks can only be used within the
// Canvas"). Pin each to this repo's own copy.
const SINGLETONS = [
  "react",
  "react-dom",
  "scheduler",
  "three",
  "@react-three/fiber",
  "@react-three/drei",
  "react-reconciler",
  "its-fine",
];

// Resolve a package to its install DIRECTORY (the dir holding its package.json),
// not its main file — aliasing to a file breaks subpath imports like
// "react-dom/client". esbuild dedups by directory and resolves subpaths itself.
function pkgDir(localRequire, pkg) {
  const pkgJson = localRequire.resolve(`${pkg}/package.json`);
  return path.dirname(pkgJson);
}

export function aliasMap(root = repoRoot) {
  const src = path.join(root, "src");
  const localRequire = createRequire(path.join(root, "package.json"));
  const singletons = {};
  for (const pkg of SINGLETONS) {
    try {
      singletons[pkg] = pkgDir(localRequire, pkg);
    } catch {
      // Not installed (e.g. optional dep) — skip; esbuild resolves normally.
    }
  }
  return {
    "@core": path.join(src, "_core"),
    "@app": path.join(src, "app"),
    "@assets": path.join(src, "assets"),
    ...singletons,
  };
}

export function buildOptions({ mode = "production", root = repoRoot } = {}) {
  const prod = mode === "production";
  return {
    entryPoints: [path.join(root, "src", "main.tsx")],
    bundle: true,
    format: "esm",
    splitting: true,
    outdir: path.join(root, "dist", "assets"),
    entryNames: "[name]-[hash]",
    chunkNames: "chunks/[name]-[hash]",
    assetNames: "[name]-[hash]",
    publicPath: "/assets",
    minify: prod,
    sourcemap: !prod,
    target: ["es2020"],
    jsx: "automatic",
    loader: {
      ".png": "file",
      ".jpg": "file",
      ".jpeg": "file",
      ".svg": "file",
      ".gif": "file",
      ".webp": "file",
      ".mp4": "file",
      ".glb": "file",
      ".gltf": "file",
      ".hdr": "file",
      ".woff": "file",
      ".woff2": "file",
    },
    alias: aliasMap(root),
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        prod ? "production" : "development",
      ),
      // The template's _core config helpers read Vite's import.meta.env, which
      // esbuild doesn't provide — inject a populated object so the app mounts.
      "import.meta.env": JSON.stringify({
        MODE: prod ? "production" : "development",
        PROD: prod,
        DEV: !prod,
        BASE_URL: "/",
      }),
    },
    plugins: [
      stylePlugin({ postcss: { plugins: [require("@tailwindcss/postcss")] } }),
    ],
    metafile: true,
    logLevel: "info",
  };
}
