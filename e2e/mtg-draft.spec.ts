import { test, expect } from "@playwright/test";
import { headerLabels, findColumnIndex, rowCellText, parseStat } from "./helpers";

/**
 * /mtg/draft — the Draft Ranker. Live-site smoke coverage for the
 * interactive half of the hub: set switcher, sorting, search, rarity facet,
 * and the cheat-sheet view toggle. Column labels/order are read at runtime
 * (never hardcoded indices) since the table may gain columns later.
 */
test.describe("/mtg/draft — MTG Draft Ranker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mtg/draft");
  });

  test("loads with the Draft Ranker heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "MTG Draft Ranker" })
    ).toBeVisible();
  });

  test("shows the 17lands attribution link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /17lands\.com/i })).toBeVisible();
  });

  test("set switcher: an unavailable set shows the honest empty panel, then the published set restores the table", async ({
    page,
  }) => {
    const noDataButton = page.getByRole("button", { name: /no data/i }).first();
    await expect(noDataButton).toBeVisible();

    // Sibling set buttons share a parent with the "no data" button — find
    // the first one WITHOUT the "no data" chip to use as "the published
    // set" without hardcoding any real set name/code.
    const switcher = noDataButton.locator("xpath=..");
    const setButtons = switcher.getByRole("button");
    const labels = await setButtons.allInnerTexts();
    const publishedIndex = labels.findIndex((l) => !/no data/i.test(l));
    expect(publishedIndex).toBeGreaterThanOrEqual(0);

    await noDataButton.click();
    await expect(page.getByText(/no graded draft data/i)).toBeVisible();

    await setButtons.nth(publishedIndex).click();
    await expect(page.getByText(/no graded draft data/i)).toHaveCount(0);
    const table = page.locator("table").first();
    await expect(table).toBeVisible();
    expect(await table.locator("tbody tr").count()).toBeGreaterThan(0);
  });

  test("sorting: clicking the GIH WR header changes the top row", async ({ page }) => {
    const table = page.locator("table").first();
    const labels = await headerLabels(table);
    const gihIdx = findColumnIndex(labels, /gih wr/i);
    expect(gihIdx).toBeGreaterThanOrEqual(0);

    const header = table.getByRole("button", { name: "GIH WR", exact: true });
    const firstRow = () => table.locator("tbody tr").first();

    await header.click();
    const afterFirstClick = parseStat(await rowCellText(firstRow(), gihIdx));

    await header.click();
    const afterSecondClick = parseStat(await rowCellText(firstRow(), gihIdx));

    // Two clicks on the same header toggle asc <-> desc, so the top row's
    // GIH WR should flip between the set's max and min rated value.
    expect(afterFirstClick).not.toBeNull();
    expect(afterSecondClick).not.toBeNull();
    expect(afterFirstClick).not.toBe(afterSecondClick);
  });

  test("search narrows the visible rows and keeps the searched card", async ({ page }) => {
    const table = page.locator("table").first();
    const labels = await headerLabels(table);
    const cardIdx = findColumnIndex(labels, /^card$/i);
    expect(cardIdx).toBeGreaterThanOrEqual(0);

    const rows = table.locator("tbody tr");
    const totalRows = await rows.count();
    const cardName = await rowCellText(rows.first(), cardIdx);

    // A distinctive substring of the card name — prefer a real word (>=4
    // letters) over the full (possibly punctuated) name.
    const word =
      cardName.split(/[^a-zA-Z']+/).find((w) => w.length >= 4) ?? cardName;

    await page.getByPlaceholder("Search cards...").fill(word);

    await expect(async () => {
      const visible = await rows.count();
      expect(visible).toBeGreaterThan(0);
      expect(visible).toBeLessThan(totalRows);
    }).toPass();

    await expect(
      table.locator("tbody tr", { hasText: cardName }).first()
    ).toBeVisible();
  });

  test("rarity facet: filtering to mythic shows only mythic rows", async ({ page }) => {
    const table = page.locator("table").first();
    const labels = await headerLabels(table);
    const rarityIdx = findColumnIndex(labels, /^rarity$/i);
    expect(rarityIdx).toBeGreaterThanOrEqual(0);

    await page.getByRole("button", { name: "mythic", exact: true }).click();

    const rows = table.locator("tbody tr");
    const sampleSize = Math.min(5, await rows.count());
    expect(sampleSize).toBeGreaterThan(0);

    for (let i = 0; i < sampleSize; i++) {
      const text = await rowCellText(rows.nth(i), rarityIdx);
      expect(text.toLowerCase()).toBe("mythic");
    }
  });

  test("view toggle: cheat sheet shows color-lane groupings and grade plates", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Cheat sheet", exact: true }).click();

    const laneNames = ["White", "Blue", "Black", "Red", "Green"];
    let visibleLanes = 0;
    for (const name of laneNames) {
      if (await page.getByText(name, { exact: true }).count()) visibleLanes++;
    }
    expect(visibleLanes).toBeGreaterThanOrEqual(3);

    // Grade plates render as a bare S/A/B/C/D/F letter — the ranker table
    // (which also has letter plates) is unmounted in this view, so this is
    // unambiguous.
    const gradePlates = page.getByText(/^[SABCDF]$/, { exact: true });
    expect(await gradePlates.count()).toBeGreaterThan(0);
  });
});
