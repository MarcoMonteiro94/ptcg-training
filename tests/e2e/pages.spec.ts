import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("login page has auth form and branding", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "TCG Trainer" })).toBeVisible();
  });

  test("register page has signup form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up|create/i })).toBeVisible();
  });

  test("login has link to register", async ({ page }) => {
    await page.goto("/login");
    const registerLink = page.getByRole("link", { name: /sign up|register|create/i });
    await expect(registerLink).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/login/);
  });

  test("unauthenticated journal access redirects to login", async ({ page }) => {
    await page.goto("/journal");
    await expect(page).toHaveURL(/login/);
  });

  test("unauthenticated training access redirects to login", async ({ page }) => {
    await page.goto("/training");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("SEO metadata", () => {
  test("login page has proper title", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/TCG Trainer/);
  });
});
