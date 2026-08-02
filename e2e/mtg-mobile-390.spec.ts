import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * MTG parity Day 3 (gl-0601) — a dedicated 390px mobile pass across every
 * /mtg route, run in addition to the narrower per-page 390px checks that
 * already exist (e2e/mtg-cube.spec.ts, e2e/mtg-league.spec.ts). Each route
 * is screenshotted before AND after its characteristic interactive
 * affordance, with a no-horizontal-page-overflow assertion on both sides —
 * a table scrolling inside its own `overflow-x-auto` box is fine (that's
 * the hub's existing, consistent pattern); the page itself growing wider
 * than the viewport is not. Screenshots land in test-results/ (gitignored)
 * as review artifacts, never committed.
 */

const VIEWPORT = { width: 390, height: 844 };

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
}

async function shot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/mobile-390/${name}.png`,
    fullPage: true,
  });
}

test.describe("MTG /mtg routes — 390px mobile pass", () => {
  test.use({ viewport: VIEWPORT });

  test("/mtg — meta lens switch causes no overflow or shift", async ({ page }) => {
    await page.goto("/mtg");
    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-home-before");

    const commanderLens = page.getByRole("button", { name: "Commander", exact: false }).first();
    if (await commanderLens.count()) {
      await commanderLens.click();
    }

    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-home-after");
  });

  test("/mtg/cube — filter bar search causes no overflow or shift", async ({ page }) => {
    await page.goto("/mtg/cube");
    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-cube-before");

    const search = page.getByPlaceholder("Search cards...");
    await search.fill("a");

    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-cube-after");
  });

  test("/mtg/cube/trainer — picking a card and revealing causes no overflow or shift", async ({
    page,
  }) => {
    await page.goto("/mtg/cube/trainer");
    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-cube-trainer-before");

    const firstCard = page.locator("button[aria-pressed]").first();
    if (await firstCard.count()) {
      await firstCard.click();
    }

    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-cube-trainer-after");
  });

  test("/mtg/check — pasting and checking a decklist causes no overflow or shift", async ({
    page,
  }) => {
    await page.goto("/mtg/check");
    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-check-before");

    await page
      .getByPlaceholder(/Deck/)
      .fill("Deck\n4 Monastery Swiftspear (MH3) 121\n4 Lightning Bolt (STA) 42\n17 Mountain");
    const checkButton = page.getByRole("button", { name: /Check deck|Loading/ });
    await expect(checkButton).toBeEnabled({ timeout: 15_000 });
    await checkButton.click();

    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-check-after");
  });

  test("/mtg/draft — switching to the cheat sheet tab causes no overflow or shift", async ({
    page,
  }) => {
    await page.goto("/mtg/draft");
    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-draft-before");

    const cheatSheetTab = page.getByRole("button", { name: "Cheat sheet" });
    if (await cheatSheetTab.count()) {
      await cheatSheetTab.click();
    }

    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-draft-after");
  });

  test("/mtg/league — selecting a standing causes no overflow or shift", async ({ page }) => {
    await page.goto("/mtg/league");
    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-league-before");

    const standingsSection = page.locator("section", {
      has: page.getByRole("heading", { name: "League standings" }),
    });
    const firstStanding = standingsSection.getByRole("button").first();
    if (await firstStanding.count()) {
      await firstStanding.click();
    }

    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-league-after");
  });

  test("/mtg/methodology — no overflow before or after scrolling to the closing audit table", async ({
    page,
  }) => {
    await page.goto("/mtg/methodology");
    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-methodology-before");

    await page.getByRole("heading", { name: "Us vs. untapped.gg" }).scrollIntoViewIfNeeded();

    await assertNoHorizontalOverflow(page);
    await shot(page, "mtg-methodology-after");
  });
});
