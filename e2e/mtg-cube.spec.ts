import { test, expect } from "@playwright/test";

/**
 * /mtg/cube — Planar Cube Tier List. The What-Changed-This-Week strip
 * (gl-0573) only renders when public/mtg-cube-week-diff.json exists AND its
 * current_week_label matches the live cube's week_label — a real fact about
 * this run, not always true (e.g. right after a module swap before the diff
 * script re-runs). Its presence is asserted conditionally rather than
 * required, mirroring the hub's own honest-absence convention; the
 * mobile-overflow and heading checks always hold regardless.
 */
test.describe("/mtg/cube — Planar Cube Tier List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mtg/cube");
  });

  test("loads with the Planar Cube Tier List heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Planar Cube Tier List" })
    ).toBeVisible();
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

  test("has no horizontal overflow at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });
});
