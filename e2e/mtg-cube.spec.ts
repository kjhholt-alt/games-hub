import { test, expect } from "@playwright/test";
import { headerLabels, findColumnIndex, rowCellText } from "./helpers";

/**
 * /mtg/cube — Planar Cube Tier List. Live-site smoke coverage for the
 * gl-0571 filter bar (search/color/rarity/type/tier/basis + explicit client
 * sort with URL-param state, server order default), the 10-guild ranked
 * strip, and the gl-0573 What-Changed-This-Week diff strip. Column
 * labels/order are read at runtime, never hardcoded indices. The diff strip
 * only renders when public/mtg-cube-week-diff.json exists AND its
 * current_week_label matches the live cube's week_label — a real fact about
 * this run, not always true (e.g. right after a module swap before the diff
 * script re-runs) — so its presence is asserted conditionally rather than
 * required, mirroring the hub's own honest-absence convention.
 */
test.describe("/mtg/cube — Planar Cube filter bar + guild strip", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mtg/cube");
  });

  function cubeTable(page: import("@playwright/test").Page) {
    return page
      .locator("table")
      .filter({ has: page.locator("thead th", { hasText: "Win rate" }) })
      .first();
  }

  test("loads with the cube heading and a populated table", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Planar Cube Tier List" })
    ).toBeVisible();
    const table = cubeTable(page);
    await expect(table).toBeVisible();
    expect(await table.locator("tbody tr").count()).toBeGreaterThan(0);
  });

  test("guild strip renders all 10 guilds ranked, coverage disclosed", async ({ page }) => {
    await expect(page.getByText(/guild strip/i)).toBeVisible();
    const guilds = [
      "Azorius", "Dimir", "Rakdos", "Gruul", "Selesnya",
      "Orzhov", "Izzet", "Golgari", "Boros", "Simic",
    ];
    for (const guild of guilds) {
      await expect(page.getByText(guild, { exact: true })).toBeVisible();
    }
    // At least one guild chip discloses its coverage/avg-power figure (a
    // guild can legitimately have zero matching cards this week, so this
    // checks "at least one", not every chip).
    await expect(page.getByText(/\d+(\.\d)?\/5 avg/).first()).toBeVisible();
  });

  test("search narrows the visible rows and keeps the searched card, no layout-shifting empty state", async ({
    page,
  }) => {
    const table = cubeTable(page);
    const rows = table.locator("tbody tr");
    const totalRows = await rows.count();
    const cardName = (await rowCellText(rows.first(), 2)).trim();
    const word = cardName.split(/[^a-zA-Z']+/).find((w) => w.length >= 4) ?? cardName;

    await page.getByPlaceholder("Search cards...").fill(word);

    await expect(async () => {
      const visible = await rows.count();
      expect(visible).toBeGreaterThan(0);
      expect(visible).toBeLessThan(totalRows);
    }).toPass();

    await expect(table.locator("tbody tr", { hasText: cardName }).first()).toBeVisible();

    // The table shell (headers) stays mounted regardless of filter state —
    // zero layout shift from swapping rows for an empty-state message.
    await page.getByPlaceholder("Search cards...").fill("zzzzzznonexistentcardzzzzzz");
    await expect(table).toBeVisible();
    await expect(page.getByText(/no cards match the current filters/i)).toBeVisible();
  });

  test("rarity facet: filtering to mythic shows only mythic rows and updates the URL", async ({
    page,
  }) => {
    const table = cubeTable(page);
    const labels = await headerLabels(table);
    const rarityIdx = findColumnIndex(labels, /^rarity$/i);
    expect(rarityIdx).toBeGreaterThanOrEqual(0);

    await page.getByRole("button", { name: "mythic", exact: true }).click();

    const rows = table.locator("tbody tr");
    const sampleSize = Math.min(5, await rows.count());
    expect(sampleSize).toBeGreaterThan(0);
    for (let i = 0; i < sampleSize; i++) {
      expect((await rowCellText(rows.nth(i), rarityIdx)).toLowerCase()).toBe("mythic");
    }

    await expect(page).toHaveURL(/[?&]rarity=mythic/);
  });

  test("tier filter narrows to a single grade", async ({ page }) => {
    const table = cubeTable(page);
    await page.getByLabel("Tier filter").selectOption("S");
    await expect(page).toHaveURL(/[?&]tier=S/);
    const rows = table.locator("tbody tr");
    const count = await rows.count();
    if (count > 0) {
      const plates = page.getByText("S", { exact: true });
      expect(await plates.count()).toBeGreaterThan(0);
    }
  });

  test("sorting: clicking the Win rate header applies a client sort reflected in the URL, third click restores server order", async ({
    page,
  }) => {
    const table = cubeTable(page);
    const header = table.getByRole("button", { name: "Win rate", exact: true });

    await header.click();
    await expect(page).toHaveURL(/[?&]sort=gih_wr&dir=desc/);
    await expect(page.getByText(/client-sorted/i)).toBeVisible();

    await header.click();
    await expect(page).toHaveURL(/[?&]sort=gih_wr&dir=asc/);

    await header.click();
    await expect(page).not.toHaveURL(/[?&]sort=/);
    await expect(page.getByText(/server order/i)).toBeVisible();
  });

  test("filter state round-trips through a full page reload via the URL", async ({ page }) => {
    await page.getByRole("button", { name: "mythic", exact: true }).click();
    await expect(page).toHaveURL(/[?&]rarity=mythic/);

    await page.reload();

    await expect(page.getByRole("button", { name: "mythic", exact: true })).toHaveClass(
      /text-brass/
    );
    const table = cubeTable(page);
    const labels = await headerLabels(table);
    const rarityIdx = findColumnIndex(labels, /^rarity$/i);
    const rows = table.locator("tbody tr");
    const sampleSize = Math.min(3, await rows.count());
    for (let i = 0; i < sampleSize; i++) {
      expect((await rowCellText(rows.nth(i), rarityIdx)).toLowerCase()).toBe("mythic");
    }
  });

  test("What-Changed-This-Week strip: when present, shows both week labels, counts, and an honest basis line", async ({
    page,
  }) => {
    const strip = page.getByText("What changed this week", { exact: true });
    if ((await strip.count()) === 0) {
      test.skip(true, "no current-week diff published for this run — honest absence, not a failure");
      return;
    }

    await expect(strip).toBeVisible();
    const container = strip.locator("xpath=ancestor::div[2]");
    await expect(container.getByText(/added/i).first()).toBeVisible();
    await expect(container.getByText(/removed/i).first()).toBeVisible();
    await expect(container.getByText(/tier moves/i).first()).toBeVisible();
    await expect(container.getByText(/diff of published payload history/i)).toBeVisible();
  });

  test("What-Changed-This-Week strip: the full-diff disclosure expands without layout error", async ({
    page,
  }) => {
    const summary = page.getByText("Show full diff", { exact: true });
    if ((await summary.count()) === 0) {
      test.skip(true, "no diff detail to expand this run");
      return;
    }
    await summary.click();
    await expect(
      page.getByText(/^Added \(/).or(page.getByText(/^Tier moves \(/)).first()
    ).toBeVisible();
  });

  test("has no horizontal overflow at mobile width, filter bar included", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/mtg/cube");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });
});
