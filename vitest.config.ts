import { defineConfig } from "vitest/config";

// The template builds with esbuild, not Vite, so this config exists only for the
// test run. `import.meta.env` is defined here the way esbuild.config.mjs defines
// it for a real build — as a populated object — so a test exercises the same
// property access the shipped code does. Individual tests override the env by
// passing it in rather than by mutating a global.
export default defineConfig({
  define: {
    "import.meta.env": JSON.stringify({
      MODE: "test",
      PROD: false,
      DEV: true,
      BASE_URL: "/",
    }),
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
