import { expect, test } from "@playwright/test";

test.describe("/mtg/league — MTG Proving Grounds", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mtg/league");
  });

  test("renders the evidence rail and real admission queue", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "Proving Grounds" })).toBeVisible();
    await expect(page.getByText("sample", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Brawl admission queue" })).toBeVisible();
    await expect(page.getByText("Engine admission remains 0/18")).toBeVisible();
    await expect(page.getByText("Legality verified")).toBeVisible();
    await expect(page.getByText("legality verified", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("rejected legality", { exact: true }).first()).toBeVisible();
  });

  test("selecting a standing updates the deck inspector", async ({ page }) => {
    await page.getByRole("button", { name: /Grixis Reanimator/ }).click();
    await expect(
      page.locator("aside").getByRole("heading", { name: "Grixis Reanimator" })
    ).toBeVisible();
  });

  test("has no horizontal overflow at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });
});
