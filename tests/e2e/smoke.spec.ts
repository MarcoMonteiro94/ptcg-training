import { test, expect } from "@playwright/test";

test("app loads and redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/");
  // Should be redirected to login for unauthenticated users
  await expect(page).toHaveURL(/login/);
});

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "TCG Trainer" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});
