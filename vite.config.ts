import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset URLs so the build works from any sub-path (e.g. GitHub Pages at /mearm/).
  base: "./",
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
