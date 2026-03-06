import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    console.log(
      "Skipping auth setup: E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set. " +
        "Authenticated tests will be skipped."
    );
    // Create empty storage state so dependent tests can be skipped gracefully
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    fs.writeFileSync(
      authFile,
      JSON.stringify({ cookies: [], origins: [] })
    );
    return;
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL("/", { timeout: 10000 });

  // Save auth state
  await page.context().storageState({ path: authFile });
});
