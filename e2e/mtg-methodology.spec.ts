import { test, expect } from "@playwright/test";

/** /mtg/methodology — the honesty-rail write-up. Static page, safe to hit
 * on production directly. */
test.describe("/mtg/methodology", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mtg/methodology");
  });

  test("loads with the Methodology heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Methodology" })
    ).toBeVisible();
  });

  test("shows the honesty promise section", async ({ page }) => {
    await expect(page.getByText(/the honesty promise/i)).toBeVisible();
  });

  test("lists at least 3 attribution entries including Scryfall, 17lands, and Archidekt", async ({
    page,
  }) => {
    const names = ["Scryfall", "17lands", "Archidekt"];
    for (const name of names) {
      await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
    }
  });

  test("shows the closing audit table with all three groups", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { level: 2, name: "Us vs. untapped.gg" })
    ).toBeVisible();
    await expect(page.getByText("What we match")).toBeVisible();
    await expect(page.getByText("What we beat")).toBeVisible();
    await expect(page.getByText("What we don't do — and why")).toBeVisible();
    await expect(page.getByText("Day-one cube intelligence")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /untapped\.gg ↗/ }).first()
    ).toHaveAttribute("href", /untapped\.gg/);
  });
});
