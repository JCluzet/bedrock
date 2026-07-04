/* eslint-disable import-x/no-default-export -- Vitest requires the config module to default-export defineConfig(...) */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    clearMocks: true,
    environment: "jsdom",
    pool: "threads",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/docs/**",
    ],
    include: [
      "app/**/*.{test,spec}.{ts,tsx,mjs}",
      "components/**/*.{test,spec}.{ts,tsx,mjs}",
      "features/**/*.{test,spec}.{ts,tsx,mjs}",
      "lib/**/*.{test,spec}.{ts,tsx,mjs}",
      // The custom ESLint plugin under tools/ ships production guardrails, so
      // its own tests run with the rest of the suite.
      "tools/eslint-plugin-bedrock/**/*.{test,spec}.{ts,tsx,mjs}",
    ],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["lib/**", "features/**"],
      exclude: [
        "**/*.{test,spec}.*",
        "**/*.d.ts",
        "lib/query/keys.ts",
      ],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40,
      },
    },
  },
});
