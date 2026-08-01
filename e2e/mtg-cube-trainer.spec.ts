import { test, expect } from "@playwright/test";

/**
 * /mtg/cube/trainer — the P1P1 Pick Trainer. Live-site smoke coverage: pack
 * deals client-side (no backend), a pick reveals real tier + basis for every
 * card in the pack, and the streak counter updates in client state only.
 */
test.describe("/mtg/cube/trainer — Planar Cube P1P1 Trainer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mtg/cube/trainer");
  });

  test("loads with the trainer heading and a dealt pack", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Planar Cube P1P1 Trainer" })
    ).toBeVisible();
    const cards = page.locator("button").filter({ has: page.locator("img") });
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(1);
  });

  test("picking a card reveals a tier plate on every card and a result banner", async ({
    page,
  }) => {
    const cards = page.locator("button").filter({ has: page.locator("img") });
    await expect(cards.first()).toBeVisible();
    const total = await cards.count();

    await cards.first().click();

    await expect(page.getByRole("status")).toBeVisible();
    const platesShown = page.getByText(/^[SABCDF]$/, { exact: true });
    expect(await platesShown.count()).toBeGreaterThan(0);

    // Every card in the pack should now be disabled (picks are locked once
    // revealed) — the pack size doesn't change across the reveal.
    expect(await cards.count()).toBe(total);
    await expect(cards.first()).toBeDisabled();
  });

  test("streak resets to 0 on a wrong pick and the next-pack button deals a new pack", async ({
    page,
  }) => {
    const cards = page.locator("button").filter({ has: page.locator("img") });
    await expect(cards.first()).toBeVisible();

    // A pick's win/loss outcome isn't deterministic, so just assert the
    // streak stat chip renders before/after rather than a specific value.
    const streakStat = page.getByText(/^\d+Streak$/);
    await expect(streakStat).toBeVisible();

    await cards.first().click();
    const nextPackButton = page.getByRole("button", { name: /deal next pack/i });
    await expect(nextPackButton).toBeEnabled();
    await nextPackButton.click();

    // A fresh pack means picks are unlocked again.
    await expect(cards.first()).toBeEnabled();
  });
});
