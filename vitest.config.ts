import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

export default defineConfig({
  resolve: {
    // Mirror tsconfig path aliases. More specific prefixes must come first.
    alias: [
      { find: "@modules", replacement: src("modules") },
      { find: "@server", replacement: src("server") },
      { find: "@lib", replacement: src("lib") },
      { find: "@ui", replacement: src("components/ui") },
      { find: "@components", replacement: src("components") },
      { find: "@config", replacement: src("config") },
      { find: /^@\/(.*)$/, replacement: src("$1") },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    globals: false,
  },
});
