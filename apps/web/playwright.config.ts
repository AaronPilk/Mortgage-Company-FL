import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke tests.
 *
 * These run against a real production build with every integration in its
 * default disabled or fixture mode. Nothing here calls a production provider,
 * sends a message, or consumes paid AI.
 */
/**
 * Some environments ship a preinstalled Chromium whose revision does not match
 * the one this Playwright version would download. PLAYWRIGHT_CHROMIUM_PATH
 * points at that binary; without it, Playwright resolves its own download as
 * usual.
 */
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const channelOverride =
  chromiumPath === undefined ? {} : { launchOptions: { executablePath: chromiumPath } };

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: process.env.CI === "true",
  retries: process.env.CI === "true" ? 1 : 0,
  ...(process.env.CI === "true" ? { workers: 2 } : {}),
  reporter: process.env.CI === "true" ? [["github"], ["list"]] : [["list"]],
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], ...channelOverride } },
    { name: "mobile", use: { ...devices["Pixel 7"], ...channelOverride } }
  ],
  webServer: {
    command: "PORT=3100 node .next/standalone/server.js || PORT=3100 npx next start --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: process.env.CI !== "true",
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
      GHL_MODE: "disabled",
      AI_MODE: "disabled",
      MLS_PROVIDER: "fixture",
      TURNSTILE_MODE: "fixture"
    }
  }
});
