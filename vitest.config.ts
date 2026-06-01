import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.spec.ts", "lib/**/*.test.ts"],
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "lib/writer/*.ts",
        "lib/api/novel-route.ts",
        "app/api/novel/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 60,
      },
    },
  },
});
