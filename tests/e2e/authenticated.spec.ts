import { test, expect } from "@playwright/test";

// Skip all authenticated tests when test credentials are not configured
const hasAuth = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe("Dashboard (authenticated)", () => {
  test.skip(!hasAuth, "E2E_TEST_EMAIL/E2E_TEST_PASSWORD not set");

  test("home page renders meta dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: /meta dashboard/i })
    ).toBeVisible();
    await expect(page.getByText("Tier List")).toBeVisible();
    await expect(page.getByText("Meta Breakdown")).toBeVisible();
  });

  test("home page has proper SEO title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Meta Dashboard/);
  });

  test("header shows branding and sign out", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("TCG Trainer").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  });
});

test.describe("Deck Explorer (authenticated)", () => {
  test.skip(!hasAuth, "E2E_TEST_EMAIL/E2E_TEST_PASSWORD not set");

  test("decks page renders", async ({ page }) => {
    await page.goto("/decks");
    await expect(
      page.getByRole("heading", { name: /deck explorer/i })
    ).toBeVisible();
  });

  test("decks page has proper SEO title", async ({ page }) => {
    await page.goto("/decks");
    await expect(page).toHaveTitle(/Deck Explorer/);
  });
});

test.describe("Matchup Matrix (authenticated)", () => {
  test.skip(!hasAuth, "E2E_TEST_EMAIL/E2E_TEST_PASSWORD not set");

  test("matchups page renders", async ({ page }) => {
    await page.goto("/matchups");
    await expect(
      page.getByRole("heading", { name: /matchup matrix/i })
    ).toBeVisible();
  });

  test("matchups page has legend", async ({ page }) => {
    await page.goto("/matchups");
    await expect(page.getByText(">60%")).toBeVisible();
    await expect(page.getByText("<40%")).toBeVisible();
  });

  test("matchups page has proper SEO title", async ({ page }) => {
    await page.goto("/matchups");
    await expect(page).toHaveTitle(/Matchup Matrix/);
  });
});

test.describe("Journal (authenticated)", () => {
  test.skip(!hasAuth, "E2E_TEST_EMAIL/E2E_TEST_PASSWORD not set");

  test("journal page renders", async ({ page }) => {
    await page.goto("/journal");
    await expect(
      page.getByRole("heading", { name: /battle journal/i })
    ).toBeVisible();
    await expect(page.getByText("Recent Matches")).toBeVisible();
  });

  test("journal has log match button", async ({ page }) => {
    await page.goto("/journal");
    await expect(
      page.getByRole("link", { name: /log match|new/i })
    ).toBeVisible();
  });

  test("journal has stats link", async ({ page }) => {
    await page.goto("/journal");
    await expect(
      page.getByRole("link", { name: /stats/i })
    ).toBeVisible();
  });

  test("journal page has proper SEO title", async ({ page }) => {
    await page.goto("/journal");
    await expect(page).toHaveTitle(/Battle Journal/);
  });
});

test.describe("Training (authenticated)", () => {
  test.skip(!hasAuth, "E2E_TEST_EMAIL/E2E_TEST_PASSWORD not set");

  test("training redirects to setup when no plan exists", async ({ page }) => {
    await page.goto("/training");
    await expect(page).toHaveURL(/training/);
  });

  test("training setup page renders", async ({ page }) => {
    await page.goto("/training/setup");
    await expect(page).toHaveURL(/training\/setup/);
  });
});

test.describe("Coach (authenticated)", () => {
  test.skip(!hasAuth, "E2E_TEST_EMAIL/E2E_TEST_PASSWORD not set");

  test("coach page renders", async ({ page }) => {
    await page.goto("/coach");
    await expect(
      page.getByRole("heading", { name: /ai coach/i })
    ).toBeVisible();
  });

  test("coach page has proper SEO title", async ({ page }) => {
    await page.goto("/coach");
    await expect(page).toHaveTitle(/AI Coach/);
  });
});

test.describe("Navigation (authenticated)", () => {
  test.skip(!hasAuth, "E2E_TEST_EMAIL/E2E_TEST_PASSWORD not set");

  test("sidebar nav has all main links", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    const navLinks = ["Meta", "Matchups", "Decks", "Journal", "Training", "Coach"];
    for (const label of navLinks) {
      await expect(
        page.getByRole("link", { name: new RegExp(label, "i") }).first()
      ).toBeVisible();
    }
  });

  test("clicking deck nav link navigates to decks", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.getByRole("link", { name: /decks/i }).first().click();
    await expect(page).toHaveURL("/decks");
    await expect(
      page.getByRole("heading", { name: /deck explorer/i })
    ).toBeVisible();
  });

  test("clicking journal nav link navigates to journal", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.getByRole("link", { name: /journal/i }).first().click();
    await expect(page).toHaveURL("/journal");
    await expect(
      page.getByRole("heading", { name: /battle journal/i })
    ).toBeVisible();
  });

  test("logo links to home", async ({ page }) => {
    await page.goto("/decks");
    await page.getByRole("link", { name: /tcg trainer/i }).click();
    await expect(page).toHaveURL("/");
  });
});
