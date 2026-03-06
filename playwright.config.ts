import { defineConfig, devices } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "tests/e2e/.auth/user.json");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    // Public pages — no auth needed
    {
      name: "public",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /smoke|pages/,
    },
    // Auth setup — runs before authenticated tests
    {
      name: "setup",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /auth\.setup/,
    },
    // Authenticated pages — depends on setup
    {
      name: "authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup"],
      testMatch: /authenticated/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
