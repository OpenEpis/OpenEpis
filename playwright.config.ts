import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.test" });

const testDatabaseUrl = process.env.DATABASE_URL;

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
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
      env: {
        ...(testDatabaseUrl ? { DATABASE_URL: testDatabaseUrl } : {}),
      },
    },
    {
      command: "pnpm dev:web",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
