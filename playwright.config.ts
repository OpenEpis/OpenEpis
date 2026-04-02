import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// Load .env.test so test-specific variables are available to both
// Playwright and any server processes it spawns.
const testEnv = config({ path: ".env.test" });

// Resolve OPENEPIS_DATA_DIR to absolute path (server cwd differs from repo root)
if (testEnv.parsed?.OPENEPIS_DATA_DIR) {
  testEnv.parsed.OPENEPIS_DATA_DIR = resolve(testEnv.parsed.OPENEPIS_DATA_DIR);
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "api",
      testDir: "./tests/e2e/api",
      use: {
        baseURL: "http://localhost:3001",
      },
    },
    {
      name: "web",
      testDir: "./tests/e2e/web",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3000",
      },
    },
    {
      name: "eval",
      testDir: "./tests/e2e/eval",
      use: {
        baseURL: "http://localhost:3001",
      },
    },
  ],
  webServer: [
    {
      command: "pnpm dev:server",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: false,
      timeout: 30000,
      env: {
        ...testEnv.parsed,
      },
    },
    {
      command: "pnpm dev:web",
      url: "http://localhost:3000",
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
