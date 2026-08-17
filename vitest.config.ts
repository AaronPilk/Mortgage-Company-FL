import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/web/tests/unit/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**", "apps/web/tests/e2e/**"],
    coverage: { reporter: ["text", "lcov"], reportsDirectory: "coverage" }
  },
  resolve: {
    alias: {
      "@tract/tokens": r("packages/tokens/src/index.ts"),
      "@tract/schemas": r("packages/schemas/src/index.ts"),
      "@tract/domain": r("packages/domain/src/index.ts"),
      "@tract/mortgage-math": r("packages/mortgage-math/src/index.ts"),
      "@tract/analytics": r("packages/analytics/src/index.ts"),
      "@tract/seo": r("packages/seo/src/index.ts"),
      "@tract/integrations": r("packages/integrations/src/index.ts"),
      "@tract/database": r("packages/database/src/index.ts"),
      "@tract/testing": r("packages/testing/src/index.ts"),
      "@tract/vision-model": r("packages/vision-model/src/index.ts"),
      // `server-only` is a build-time guard that makes importing a server
      // module from a client component a hard error. It has no runtime in a
      // plain Node test process, so it is stubbed rather than the modules
      // being weakened to accommodate the test runner.
      "server-only": r("packages/testing/src/server-only-stub.ts")
    }
  }
});
