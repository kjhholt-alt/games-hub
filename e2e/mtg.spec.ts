import { test, expect } from "@playwright/test";

/**
 * /mtg — the Meta Hub landing page. Live-site smoke coverage: this is a
 * static/ISR page with no forms or mutations, so asserting against
 * production directly validates the real deploy.
 */
test.describe("/mtg — MTG Meta Hub", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mtg");
  });

  test("loads with the hub heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "MTG Meta Hub" })
    ).toBeVisible();
  });

  test("carries the Wizards Fan Content Policy boilerplate", async ({ page }) => {
    await expect(page.getByText(/unofficial Fan Content/i)).toBeVisible();
  });

  test("readings strip shows Trending commander", async ({ page }) => {
    await expect(page.getByText(/trending commander/i)).toBeVisible();
  });

  test("commander tier tables render at least 10 body rows total", async ({ page }) => {
    const tiersSection = page.locator("#tiers");
    await expect(tiersSection).toBeVisible();
    // The module renders one <table> per bucket (trending/established/etc)
    // — sum body rows across all of them, never assert a fixed table count.
    const rowCount = await tiersSection.locator("table tbody tr").count();
    expect(rowCount).toBeGreaterThanOrEqual(10);
  });

  test("module index nav has a Methodology link that navigates", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Sections" });
    await expect(nav).toBeVisible();
    const methodologyLink = nav.getByRole("link", { name: /methodology/i });
    await expect(methodologyLink).toBeVisible();
    await methodologyLink.click();
    await expect(page).toHaveURL(/\/mtg\/methodology$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Methodology" })
    ).toBeVisible();
  });
});
