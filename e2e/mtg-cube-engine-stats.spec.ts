import { test, expect } from "@playwright/test";

/**
 * /mtg/cube — the Data Counter-offensive addendum (gl-0590). Real per-card
 * win rates computed from receipted Card-Forge rules-engine matches, surfaced
 * additively next to the existing 17lands-priors table. These checks cross-
 * the rendered disclosure against the table itself rather than a fixed
 * number, since the underlying match count grows as more seed sets land.
 */
test.describe("/mtg/cube — Data Counter-offensive engine stats", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mtg/cube");
  });

  test("shows the engine coverage disclosure with a real match count", async ({ page }) => {
    const disclosure = page.getByText(/cards now carry a real engine win rate/);
    await expect(disclosure).toBeVisible();
    const text = (await disclosure.locator("..").innerText()).trim();
    expect(text).toMatch(/from [\d,]+ receipted Card-Forge rules-engine matches/);
    expect(text).toMatch(/at least \d+ credited games/);
  });

  test("Basis column carries an Engine (N games) label for at least one row", async ({
    page,
  }) => {
    const table = page.locator("table").filter({ has: page.locator("thead th", { hasText: "Basis" }) });
    await expect(table.locator("tbody tr td", { hasText: /^Engine \(\d+ games\)$/ }).first()).toBeVisible();
  });

  test("a row with an engine win rate carries the 'engine' qualifier next to its win rate", async ({
    page,
  }) => {
    const table = page.locator("table").filter({ has: page.locator("thead th", { hasText: "Basis" }) });
    const engineRow = table.locator("tbody tr", { has: page.locator("td", { hasText: /^Engine \(\d+ games\)$/ }) }).first();
    await expect(engineRow.getByText("engine", { exact: true })).toBeVisible();
  });
});
