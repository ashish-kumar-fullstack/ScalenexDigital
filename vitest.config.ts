import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve("src"),
      "server-only": path.resolve("tests/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 1800000,
    fileParallelism: false,
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
  },
});
