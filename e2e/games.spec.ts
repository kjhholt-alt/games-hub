import { test, expect } from "@playwright/test";

/**
 * The non-MTG tier-list suite (Deadlock, PoE1, StS2, HOI4) + the home page's
 * Deadlock preview. Live-site smoke coverage, same rationale as mtg.spec.ts:
 * these are static/ISR pages with no forms or mutations, so asserting
 * against production directly validates the real deploy.
 *
 * Deliberately checks STRUCTURE (heading, row/card counts, an honest
 * Provenance stamp) rather than today's exact numbers/dates — win rates,
 * curated-review dates, and item counts all drift over time as the
 * underlying datasets refresh.
 */

test.describe("/tier-lists — Deadlock Hero Tier List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tier-lists");
  });

  test("loads with the tier-list heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Deadlock Hero Tier List" })
    ).toBeVisible();
  });

  test("full ranking table renders at least 10 heroes", async ({ page }) => {
    const rowCount = await page.locator("table tbody tr").count();
    expect(rowCount).toBeGreaterThanOrEqual(10);
  });

  test("carries an honest live/cached Provenance stamp", async ({ page }) => {
    await expect(
      page.getByText(/^(live|cached snapshot)$/).first()
    ).toBeVisible();
  });
});

test.describe("/poe1 — PoE1 build tier list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/poe1");
  });

  test("loads with the league's build-tier-list heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: /Build Tier List$/ })
    ).toBeVisible();
  });

  test("full ranking table renders at least 3 entries", async ({ page }) => {
    const rowCount = await page.locator("table tbody tr").count();
    expect(rowCount).toBeGreaterThanOrEqual(3);
  });

  test("carries an honest hand-curated Provenance stamp", async ({ page }) => {
    await expect(page.getByText("hand-curated").first()).toBeVisible();
  });
});

test.describe("/sts2 — Slay the Spire 2 tier list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sts2");
  });

  test("loads with the tier-list heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Slay the Spire 2 Tier List",
      })
    ).toBeVisible();
  });

  test("full ranking table renders at least 10 cards", async ({ page }) => {
    const rowCount = await page.locator("table tbody tr").count();
    expect(rowCount).toBeGreaterThanOrEqual(10);
  });

  test("carries an honest aggregated Provenance stamp", async ({ page }) => {
    await expect(page.getByText("aggregated").first()).toBeVisible();
  });
});

test.describe("/hoi4 — HOI4 nation meta", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hoi4");
  });

  test("loads with the nation-meta heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Hearts of Iron IV — Nation Meta",
      })
    ).toBeVisible();
  });

  test("renders at least 5 nation strategy cards", async ({ page }) => {
    // Each Hoi4NationCard has its own h3 nation-name heading — count those
    // rather than a fixed table, since HOI4 renders cards, not rows.
    const cardHeadings = await page.getByRole("heading", { level: 3 }).count();
    expect(cardHeadings).toBeGreaterThanOrEqual(5);
  });

  test("carries an honest hand-curated Provenance stamp", async ({ page }) => {
    await expect(page.getByText("hand-curated").first()).toBeVisible();
  });
});

test.describe("Home page — Deadlock preview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the Deadlock tier list preview with rows", async ({ page }) => {
    // The whole preview card (badge, rows, Provenance stamp, "Full ranking"
    // CTA) is one <Link> to /tier-lists — locate it by its own CTA text.
    const preview = page.getByRole("link", { name: /Full ranking/i });
    await expect(preview.getByText("DEADLOCK TIER LIST")).toBeVisible();
    const rowCount = await preview.locator("ol li").count();
    expect(rowCount).toBeGreaterThanOrEqual(3);
  });

  test("Deadlock preview links to the full tier list", async ({ page }) => {
    // The hero CTA button also matches a loose "Deadlock Tier List" name, so
    // locate the preview card specifically by its own "Full ranking" CTA.
    const link = page.getByRole("link", { name: /Full ranking/i });
    await expect(link).toHaveAttribute("href", "/tier-lists");
  });
});
