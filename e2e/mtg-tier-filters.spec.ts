import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/**
 * /mtg — the Commander & Brawl Tiers and Constructed Tiers sections' filter
 * bars (gl-0593, extending the cube filter bar pattern — gl-0571,
 * e2e/mtg-cube.spec.ts — to the format tier pages). Every locator is scoped
 * to the "#tiers"/"#constructed" all-formats section container: MtgMetaLens
 * mounts one explorer per format "world" simultaneously (toggled via
 * Tailwind's `hidden`, not unmounted), so an unscoped locator would match
 * several duplicate controls at once — same reason mtg.spec.ts's own
 * "commander tier tables" test scopes to `#tiers` first.
 */
test.describe("/mtg — Commander & Brawl / Constructed tier filter bars", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mtg");
  });

  function tiersSection(page: Page): Locator {
    return page.locator("#tiers");
  }

  function constructedSection(page: Page): Locator {
    return page.locator("#constructed");
  }

  test("Commander & Brawl Tiers renders search + color + tier facets", async ({ page }) => {
    const section = tiersSection(page);
    await expect(section.getByPlaceholder("Search commanders...")).toBeVisible();
    await expect(section.getByRole("button", { name: "All colors" })).toBeVisible();
    await expect(section.getByRole("button", { name: "All tiers" })).toBeVisible();
  });

  test("search narrows the Commander & Brawl Tiers section and keeps the searched commander", async ({
    page,
  }) => {
    const section = tiersSection(page);
    const table = section.locator("table").first();
    const firstNameCell = table.locator("tbody tr").first().locator("td").nth(2);
    const commanderName = (await firstNameCell.innerText()).trim();
    const word =
      commanderName.split(/[^a-zA-Z']+/).find((w) => w.length >= 4) ?? commanderName;

    const totalBefore = Number(
      (await section.getByText(/of [\d,]+ commanders shown/i).innerText()).match(
        /of ([\d,]+)/i
      )?.[1] ?? 0
    );
    expect(totalBefore).toBeGreaterThan(0);

    await section.getByPlaceholder("Search commanders...").fill(word);

    await expect(section.getByText(/commanders shown/i)).toContainText(
      new RegExp(`^\\d+ of ${totalBefore.toLocaleString("en-US")} commanders shown`, "i")
    );
    await expect(section.getByText(commanderName).first()).toBeVisible();
  });

  test("tier chip filters the Commander & Brawl Tiers section to only that tier", async ({
    page,
  }) => {
    const section = tiersSection(page);
    await section.getByRole("button", { name: "Tier S", exact: true }).click();

    await expect(page).toHaveURL(/[?&]commander-tiers_tier=S/);

    const table = section.locator("table").first();
    const rows = table.locator("tbody tr");
    const count = await rows.count();
    if (count > 0) {
      // Tier column is the plate right after "#" — every visible row's
      // plate must read "S" once the facet is active.
      const plateTexts = await rows.locator("td").nth(1).allInnerTexts();
      for (const t of plateTexts) {
        expect(t.trim()).toBe("S");
      }
    }
  });

  test("sorting: clicking the Commander header applies a client sort reflected in the URL, third click restores server order", async ({
    page,
  }) => {
    const section = tiersSection(page);
    const table = section.locator("table").first();
    const header = table.getByRole("button", { name: "Commander", exact: true });

    await header.click();
    await expect(page).toHaveURL(/[?&]commander-tiers_sort=commander&commander-tiers_dir=asc/);
    await expect(section.getByText(/client-sorted/i)).toBeVisible();

    await header.click();
    await expect(page).toHaveURL(/[?&]commander-tiers_sort=commander&commander-tiers_dir=desc/);

    await header.click();
    await expect(page).not.toHaveURL(/[?&]commander-tiers_sort=/);
    await expect(section.getByText(/server order/i)).toBeVisible();
  });

  test("Commander & Brawl Tiers filter state round-trips through a full page reload via the URL", async ({
    page,
  }) => {
    const section = tiersSection(page);
    await section.getByRole("button", { name: "Tier S", exact: true }).click();
    await expect(page).toHaveURL(/[?&]commander-tiers_tier=S/);

    await page.reload();

    await expect(
      tiersSection(page).getByRole("button", { name: "Tier S", exact: true })
    ).toHaveClass(/text-brass/);
  });

  test("Constructed Tiers renders search + tier facets", async ({ page }) => {
    const section = constructedSection(page);
    if ((await section.count()) === 0) {
      test.skip(true, "constructed_tiers module absent this run — honest absence, not a failure");
      return;
    }
    await expect(section.getByPlaceholder("Search archetypes/decks...")).toBeVisible();
    await expect(section.getByRole("button", { name: "All tiers" })).toBeVisible();
  });

  test("Constructed Tiers tier chip narrows to a single grade", async ({ page }) => {
    const section = constructedSection(page);
    if ((await section.count()) === 0) {
      test.skip(true, "constructed_tiers module absent this run — honest absence, not a failure");
      return;
    }
    const tierButtons = section.getByRole("button", { name: /^Tier [SABCD]$/ });
    if ((await tierButtons.count()) === 0) {
      test.skip(true, "no populated tier grade to filter to this run");
      return;
    }
    const label = (await tierButtons.first().innerText()).trim();
    await tierButtons.first().click();

    const grade = label.replace("Tier ", "");
    await expect(page).toHaveURL(new RegExp(`[?&]constructed-tiers_tier=${grade}`));
  });

  test("both filter bars wrap onto multiple lines rather than overflowing at mobile width", async ({
    page,
  }) => {
    // Scoped to the two new filter bars themselves (not a whole-page check —
    // /mtg already carries other pre-existing horizontally-scrollable strips,
    // e.g. MtgMetaLens's lens nav, that are out of scope here). The chip rows
    // use flex-wrap, so at 390px each bar's own bounding box must stay within
    // the viewport even though it holds more chips than fit on one line.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/mtg");
    const viewportWidth = 390;

    for (const section of [tiersSection(page), constructedSection(page)]) {
      if ((await section.count()) === 0) continue;
      const bar = section.locator(".print\\:hidden").first();
      const box = await bar.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth + 1);
    }
  });
});
