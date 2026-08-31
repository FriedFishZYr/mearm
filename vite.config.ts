import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Vitest stubs CSS imports to an empty module by default, which also
    // silences `?raw`. tests/palette.test.ts reads styles.css to verify the
    // stylesheet and src/design/palette.ts declare the same shared values.
    css: true,
  },
});
